import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, type UserRole } from '../entities/user.entity';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UserResponseDto } from './dto/user-response.dto';
import { toUserResponse } from './user.mapper';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    return this.userRepo.findOne({ where: { email: normalized } });
  }

  findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async assignCompany(userId: string, companyId: string): Promise<void> {
    await this.userRepo.update(userId, { companyId });
  }

  async findAllForActor(
    actorUserId: string,
    companyIdFilter?: string,
  ): Promise<User[]> {
    const actor = await this.findByIdOrFail(actorUserId);

    if (actor.role === 'admin') {
      return this.userRepo.find({
        where: companyIdFilter ? { companyId: companyIdFilter } : {},
        order: { createdAt: 'DESC' },
      });
    }

    if (actor.role === 'business') {
      if (!actor.companyId) {
        throw new UnprocessableEntityException(
          'Debes configurar los datos de tu empresa antes de gestionar usuarios.',
        );
      }
      if (companyIdFilter && companyIdFilter !== actor.companyId) {
        throw new ForbiddenException(
          'No puedes listar usuarios de otra empresa',
        );
      }
      return this.userRepo.find({
        where: { companyId: actor.companyId },
        order: { createdAt: 'DESC' },
      });
    }

    throw new ForbiddenException(
      'No tienes permisos para realizar esta acción',
    );
  }

  toResponse(user: User): UserResponseDto {
    return toUserResponse(user);
  }

  async create(input: {
    email: string;
    name: string;
    passwordHash: string;
    mobilePhone?: string | null;
    role?: UserRole;
    isActive?: boolean;
    mustChangePassword?: boolean;
    companyId?: string | null;
  }): Promise<User> {
    const user = this.userRepo.create({
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      passwordHash: input.passwordHash,
      mobilePhone: input.mobilePhone?.trim() || null,
      role: input.role ?? 'common',
      isActive: input.isActive ?? true,
      mustChangePassword: input.mustChangePassword ?? false,
      companyId: input.companyId ?? null,
    });
    return this.userRepo.save(user);
  }

  async update(
    actorUserId: string,
    id: string,
    dto: UpdateUserDto,
  ): Promise<User> {
    const actor = await this.findByIdOrFail(actorUserId);
    await this.findManagedUserOrFail(actor, id);

    if (actor.role === 'business' && dto.role !== undefined) {
      throw new ForbiddenException('No puedes cambiar el rol de un usuario');
    }

    const updates: Partial<User> = {};

    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      if (trimmed.length === 0) {
        throw new BadRequestException('El nombre no puede estar vacío');
      }
      updates.name = trimmed;
    }
    if (dto.mobilePhone !== undefined) {
      const v = dto.mobilePhone;
      updates.mobilePhone = v.trim() === '' ? null : v.trim().slice(0, 32);
    }
    if (dto.role !== undefined && actor.role === 'admin') {
      updates.role = dto.role;
    }

    if (Object.keys(updates).length > 0) {
      await this.userRepo.update(id, updates);
    }

    return this.findByIdOrFail(id);
  }

  async toggleStatus(actorUserId: string, targetUserId: string): Promise<User> {
    const actor = await this.findByIdOrFail(actorUserId);
    const user = await this.findManagedUserOrFail(actor, targetUserId);

    if (user.isActive && targetUserId === actorUserId) {
      throw new ConflictException('No puedes deshabilitar tu propia cuenta');
    }

    if (
      actor.role === 'business' &&
      (user.role === 'business' || user.role === 'admin')
    ) {
      throw new ForbiddenException(
        'No puedes deshabilitar a otro administrador de empresa o de plataforma',
      );
    }

    await this.userRepo.update(targetUserId, { isActive: !user.isActive });
    return this.findByIdOrFail(targetUserId);
  }

  async setPassword(
    userId: string,
    passwordHash: string,
    mustChangePassword: boolean,
  ): Promise<User> {
    await this.userRepo.update(userId, { passwordHash, mustChangePassword });
    return this.findByIdOrFail(userId);
  }

  async updateProfile(
    userId: string,
    patch: { name?: string; mobilePhone?: string },
  ): Promise<void> {
    const updates: Partial<Pick<User, 'name' | 'mobilePhone'>> = {};

    if (patch.name !== undefined) {
      const trimmed = patch.name.trim();
      if (trimmed.length === 0) {
        throw new BadRequestException('El nombre no puede estar vacío');
      }
      updates.name = trimmed.slice(0, 255);
    }
    if (patch.mobilePhone !== undefined) {
      const v = patch.mobilePhone;
      updates.mobilePhone = v.trim() === '' ? null : v.trim().slice(0, 32);
    }
    if (Object.keys(updates).length === 0) {
      return;
    }
    await this.userRepo.update(userId, updates);
  }

  async updatePassword(
    userId: string,
    newPasswordHash: string,
    mustChangePassword: boolean,
  ): Promise<User> {
    return this.setPassword(userId, newPasswordHash, mustChangePassword);
  }

  private async findManagedUserOrFail(
    actor: User,
    targetUserId: string,
  ): Promise<User> {
    const user = await this.findById(targetUserId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (actor.role === 'admin') {
      return user;
    }

    if (actor.role === 'business') {
      if (!actor.companyId) {
        throw new UnprocessableEntityException(
          'Debes configurar los datos de tu empresa antes de gestionar usuarios.',
        );
      }
      if (user.companyId !== actor.companyId) {
        throw new NotFoundException('Usuario no encontrado');
      }
      return user;
    }

    throw new ForbiddenException(
      'No tienes permisos para realizar esta acción',
    );
  }
}
