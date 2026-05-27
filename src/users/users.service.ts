import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { User, type UserRole } from '../entities/user.entity';
import type { CreateUserDto } from './dto/create-user.dto';
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

  findAll(): Promise<User[]> {
    return this.userRepo.find({ order: { createdAt: 'DESC' } });
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
  }): Promise<User> {
    const user = this.userRepo.create({
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      passwordHash: input.passwordHash,
      mobilePhone: input.mobilePhone?.trim() || null,
      role: input.role ?? 'common',
      isActive: input.isActive ?? true,
      mustChangePassword: input.mustChangePassword ?? false,
    });
    return this.userRepo.save(user);
  }

  async createAdminUser(dto: CreateUserDto): Promise<User> {
    const normalized = dto.email.trim().toLowerCase();
    const existing = await this.findByEmail(normalized);
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.create({
      email: normalized,
      name: dto.name,
      passwordHash,
      mobilePhone: dto.mobilePhone,
      role: dto.role,
      isActive: true,
      mustChangePassword: true,
    });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findByIdOrFail(id);
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
    if (dto.role !== undefined) {
      updates.role = dto.role;
    }

    if (Object.keys(updates).length > 0) {
      await this.userRepo.update(id, updates);
    }

    return this.findByIdOrFail(id);
  }

  async toggleStatus(adminUserId: string, targetUserId: string): Promise<User> {
    const user = await this.findByIdOrFail(targetUserId);

    if (user.isActive && targetUserId === adminUserId) {
      throw new ConflictException('No puedes deshabilitar tu propia cuenta');
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

  generateProvisionalPassword(): string {
    const base = randomBytes(12).toString('base64url');
    return `Tmp${base.slice(0, 9)}!1`;
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

  async resendProvisionalPassword(
    id: string,
  ): Promise<{ user: User; plainPassword: string }> {
    await this.findByIdOrFail(id);
    const plainPassword = this.generateProvisionalPassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const user = await this.setPassword(id, passwordHash, true);
    return { user, plainPassword };
  }
}
