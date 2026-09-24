import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CompanyService } from '../company/company.service';
import {
  ClientActivity,
  type ClientActivityType,
} from '../entities/client-activity.entity';
import {
  Client,
  DEFAULT_CLIENT_CONTACTS,
  type ClientContacts,
  type ClientStatus,
} from '../entities/client.entity';
import { UsersService } from '../users/users.service';
import { toClientResponse } from './client.mapper';
import type { CreateClientActivityDto } from './dto/create-client-activity.dto';
import type { CreateClientDto } from './dto/create-client.dto';
import type { ClientResponseDto } from './dto/client-response.dto';
import type { UpdateClientDto } from './dto/update-client.dto';

type ClientContactChannel = keyof ClientContacts;

const STATUS_LABELS: Record<ClientStatus, string> = {
  not_contacted: 'Sin contactar',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const CHANNEL_LABELS: Record<ClientContactChannel, string> = {
  email: 'correo',
  phone: 'teléfono',
  whatsapp: 'WhatsApp',
};

const CONTACT_CHANNELS: ClientContactChannel[] = [
  'email',
  'phone',
  'whatsapp',
];

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepo: Repository<Client>,
    @InjectRepository(ClientActivity)
    private readonly activitiesRepo: Repository<ClientActivity>,
    private readonly companyService: CompanyService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(userId: string): Promise<ClientResponseDto[]> {
    const company = await this.companyService.findByUser(userId);
    if (!company) {
      return [];
    }

    const clients = await this.clientsRepo.find({
      where: { companyId: company.id },
      order: { createdAt: 'DESC' },
      relations: ['activities'],
    });
    return clients.map(toClientResponse);
  }

  async create(
    userId: string,
    dto: CreateClientDto,
  ): Promise<ClientResponseDto> {
    const company = await this.requireCompany(userId);

    return this.dataSource.transaction(async (manager) => {
      const clientRepo = manager.getRepository(Client);
      const activityRepo = manager.getRepository(ClientActivity);

      const client = clientRepo.create({
        companyId: company.id,
        createdByUserId: userId,
        name: dto.name,
        website: dto.website ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        status: 'not_contacted',
        contacts: { ...DEFAULT_CLIENT_CONTACTS },
      });
      const saved = await clientRepo.save(client);

      await activityRepo.save(
        activityRepo.create({
          clientId: saved.id,
          type: 'created',
          message: 'Cliente potencial creado',
          createdByName: null,
          meta: null,
        }),
      );

      return this.loadResponse(saved.id, company.id, manager);
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    const company = await this.requireCompany(userId);
    const client = await this.findInCompanyOrFail(id, company.id);

    const updates: {
      name?: string;
      website?: string | null;
      email?: string | null;
      phone?: string | null;
      status?: ClientStatus;
      contacts?: ClientContacts;
    } = {};
    const newActivities: Array<{
      type: ClientActivityType;
      message: string;
      meta: Record<string, unknown> | null;
    }> = [];

    if (dto.name !== undefined) {
      updates.name = dto.name;
    }
    if (dto.website !== undefined) {
      updates.website = dto.website;
    }
    if (dto.email !== undefined) {
      updates.email = dto.email;
    }
    if (dto.phone !== undefined) {
      updates.phone = dto.phone;
    }

    if (dto.status !== undefined && dto.status !== client.status) {
      newActivities.push({
        type: 'status_changed',
        message: `Estado cambiado de ${STATUS_LABELS[client.status]} a ${STATUS_LABELS[dto.status]}`,
        meta: { from: client.status, to: dto.status },
      });
      updates.status = dto.status;
    }

    if (dto.contacts !== undefined) {
      const merged: ClientContacts = {
        email: client.contacts.email,
        phone: client.contacts.phone,
        whatsapp: client.contacts.whatsapp,
      };

      for (const channel of CONTACT_CHANNELS) {
        const next = dto.contacts[channel];
        if (next === undefined || next === merged[channel]) {
          continue;
        }
        merged[channel] = next;
        newActivities.push({
          type: 'channel_toggled',
          message: next
            ? `Canal ${CHANNEL_LABELS[channel]} marcado como contactado`
            : `Canal ${CHANNEL_LABELS[channel]} desmarcado`,
          meta: { channel, value: next },
        });
      }
      updates.contacts = merged;
    }

    return this.dataSource.transaction(async (manager) => {
      const clientRepo = manager.getRepository(Client);
      const activityRepo = manager.getRepository(ClientActivity);

      if (Object.keys(updates).length > 0) {
        await clientRepo.update({ id }, updates);
      }

      for (const activity of newActivities) {
        await activityRepo.save(
          activityRepo.create({
            clientId: id,
            type: activity.type,
            message: activity.message,
            createdByName: null,
            meta: activity.meta,
          }),
        );
      }

      return this.loadResponse(id, company.id, manager);
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const company = await this.requireCompany(userId);
    const client = await this.findInCompanyOrFail(id, company.id);
    await this.clientsRepo.delete({ id: client.id });
  }

  async addActivity(
    userId: string,
    id: string,
    dto: CreateClientActivityDto,
  ): Promise<ClientResponseDto> {
    const company = await this.requireCompany(userId);
    await this.findInCompanyOrFail(id, company.id);
    const user = await this.usersService.findByIdOrFail(userId);

    await this.activitiesRepo.save(
      this.activitiesRepo.create({
        clientId: id,
        type: 'note',
        message: dto.message,
        createdByName: user.name,
        meta: null,
      }),
    );

    return this.loadResponse(id, company.id);
  }

  private async requireCompany(userId: string) {
    const company = await this.companyService.findByUser(userId);
    if (!company) {
      throw new UnprocessableEntityException(
        'Debes configurar los datos de tu empresa antes de gestionar clientes.',
      );
    }
    return company;
  }

  private async findInCompanyOrFail(
    id: string,
    companyId: string,
  ): Promise<Client> {
    const client = await this.clientsRepo.findOne({
      where: { id, companyId },
      relations: ['activities'],
    });
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return client;
  }

  private async loadResponse(
    id: string,
    companyId: string,
    manager?: {
      getRepository: <T extends object>(entity: new () => T) => Repository<T>;
    },
  ): Promise<ClientResponseDto> {
    const repo = manager
      ? manager.getRepository(Client)
      : this.clientsRepo;
    const client = await repo.findOne({
      where: { id, companyId },
      relations: ['activities'],
    });
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return toClientResponse(client);
  }
}
