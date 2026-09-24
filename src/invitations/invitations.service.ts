import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { Company } from '../entities/company.entity';
import {
  Invitation,
  type InvitationRole,
} from '../entities/invitation.entity';
import { User } from '../entities/user.entity';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import type { AcceptInvitationDto } from './dto/accept-invitation.dto';
import type { CreateInvitationDto } from './dto/create-invitation.dto';
import type { InvitationResponseDto } from './dto/invitation-response.dto';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const INVITATION_EXPIRES_DAYS = 7;

const ROLE_LABELS: Record<InvitationRole, string> = {
  business: 'administrador de empresa',
  common: 'usuario',
};

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private readonly invitationsRepo: Repository<Invitation>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  async create(
    actorUserId: string,
    dto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    const actor = await this.usersService.findByIdOrFail(actorUserId);
    const { companyId, role } = await this.resolveInviteTarget(actor, dto);

    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const pending = await this.invitationsRepo.findOne({
      where: {
        email,
        acceptedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
    if (pending) {
      throw new ConflictException(
        'Ya existe una invitación pendiente para ese email',
      );
    }

    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }

    const plainToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(plainToken);
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

    const invitation = await this.invitationsRepo.save(
      this.invitationsRepo.create({
        email,
        name,
        role,
        companyId,
        invitedByUserId: actor.id,
        tokenHash,
        expiresAt,
        acceptedAt: null,
      }),
    );

    const domain =
      process.env.DOMAIN_URL?.trim().replace(/\/$/, '') ||
      'http://localhost:5173';
    const inviteUrl = `${domain}/invitar?token=${encodeURIComponent(plainToken)}`;

    await this.mailService.sendInvitationMail({
      to: email,
      name,
      companyName: company.name,
      roleLabel: ROLE_LABELS[role],
      inviteUrl,
      expiresDays: INVITATION_EXPIRES_DAYS,
    });

    return this.toResponse(invitation);
  }

  async findPending(
    actorUserId: string,
    companyIdFilter?: string,
  ): Promise<InvitationResponseDto[]> {
    const actor = await this.usersService.findByIdOrFail(actorUserId);
    const whereCompanyId = this.resolveListCompanyFilter(
      actor,
      companyIdFilter,
    );

    const invitations = await this.invitationsRepo.find({
      where: {
        ...(whereCompanyId ? { companyId: whereCompanyId } : {}),
        acceptedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });
    return invitations.map((i) => this.toResponse(i));
  }

  async revoke(actorUserId: string, id: string): Promise<void> {
    const actor = await this.usersService.findByIdOrFail(actorUserId);
    const invitation = await this.invitationsRepo.findOne({ where: { id } });
    if (!invitation || invitation.acceptedAt) {
      throw new NotFoundException('Invitación no encontrada');
    }
    if (invitation.expiresAt <= new Date()) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (actor.role === 'admin') {
      // ok
    } else if (actor.role === 'business') {
      if (!actor.companyId || invitation.companyId !== actor.companyId) {
        throw new NotFoundException('Invitación no encontrada');
      }
    } else {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta acción',
      );
    }

    await this.invitationsRepo.delete(id);
  }

  async accept(dto: AcceptInvitationDto): Promise<{ message: string }> {
    const tokenHash = this.hashToken(dto.token.trim());
    const invitation = await this.invitationsRepo.findOne({
      where: { tokenHash },
    });
    if (!invitation || invitation.acceptedAt) {
      throw new NotFoundException('Invitación no válida o ya utilizada');
    }
    if (invitation.expiresAt <= new Date()) {
      throw new BadRequestException('La invitación ha expirado');
    }

    const existing = await this.usersService.findByEmail(invitation.email);
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: invitation.email,
      name: invitation.name,
      passwordHash,
      mobilePhone: dto.mobilePhone,
      role: invitation.role,
      isActive: true,
      mustChangePassword: false,
      companyId: invitation.companyId,
    });

    if (invitation.role === 'business') {
      const company = await this.companyRepo.findOne({
        where: { id: invitation.companyId },
      });
      if (company && !company.userId) {
        await this.companyRepo.update(company.id, { userId: user.id });
      }
    }

    await this.invitationsRepo.update(invitation.id, {
      acceptedAt: new Date(),
    });

    return { message: 'Cuenta creada. Ya puedes iniciar sesión.' };
  }

  private async resolveInviteTarget(
    actor: User,
    dto: CreateInvitationDto,
  ): Promise<{ companyId: string; role: InvitationRole }> {
    if (actor.role === 'admin') {
      if (!dto.companyId) {
        throw new UnprocessableEntityException(
          'companyId es obligatorio para el admin de plataforma',
        );
      }
      if (!dto.role) {
        throw new UnprocessableEntityException(
          'role es obligatorio para el admin de plataforma',
        );
      }
      return { companyId: dto.companyId, role: dto.role };
    }

    if (actor.role === 'business') {
      if (!actor.companyId) {
        throw new UnprocessableEntityException(
          'Debes pertenecer a una empresa para invitar usuarios',
        );
      }
      if (dto.companyId && dto.companyId !== actor.companyId) {
        throw new ForbiddenException(
          'No puedes invitar usuarios a otra empresa',
        );
      }
      if (dto.role && dto.role !== 'common') {
        throw new ForbiddenException(
          'Solo puedes invitar usuarios con rol common',
        );
      }
      return { companyId: actor.companyId, role: 'common' };
    }

    throw new ForbiddenException(
      'No tienes permisos para realizar esta acción',
    );
  }

  private resolveListCompanyFilter(
    actor: User,
    companyIdFilter?: string,
  ): string | undefined {
    if (actor.role === 'admin') {
      return companyIdFilter;
    }
    if (actor.role === 'business') {
      if (!actor.companyId) {
        throw new UnprocessableEntityException(
          'Debes pertenecer a una empresa para listar invitaciones',
        );
      }
      if (companyIdFilter && companyIdFilter !== actor.companyId) {
        throw new ForbiddenException(
          'No puedes listar invitaciones de otra empresa',
        );
      }
      return actor.companyId;
    }
    throw new ForbiddenException(
      'No tienes permisos para realizar esta acción',
    );
  }

  private hashToken(plain: string): string {
    return createHash('sha256').update(plain).digest('hex');
  }

  private toResponse(invitation: Invitation): InvitationResponseDto {
    return {
      id: invitation.id,
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      companyId: invitation.companyId,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      createdAt: invitation.createdAt,
    };
  }
}
