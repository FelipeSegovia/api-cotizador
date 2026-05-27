import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UsersService } from '../users/users.service';
import { toUserResponse } from '../users/user.mapper';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { LoginDto } from './dto/login.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import { jwtExpiresInSeconds } from './jwt-expires';
import type { JwtPayload } from './jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async login(dto: LoginDto): Promise<{
    user: UserResponseDto;
    token: string;
    expiresIn: number;
  }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (!user.isActive) {
      throw new ForbiddenException(
        'Tu cuenta está deshabilitada. Contacta al administrador.',
      );
    }
    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
    };
    const token = await this.jwtService.signAsync(payload);
    return {
      user: toUserResponse(user),
      token,
      expiresIn: jwtExpiresInSeconds(),
    };
  }

  async me(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }
    return toUserResponse(user);
  }

  async patchMe(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    if (dto.name !== undefined || dto.mobilePhone !== undefined) {
      await this.usersService.updateProfile(userId, {
        name: dto.name,
        mobilePhone: dto.mobilePhone,
      });
    }
    return this.me(userId);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    if (!user.mustChangePassword) {
      if (!dto.currentPassword?.trim()) {
        throw new BadRequestException(
          'currentPassword es obligatoria para cambiar la contraseña',
        );
      }
      const match = await bcrypt.compare(
        dto.currentPassword,
        user.passwordHash,
      );
      if (!match) {
        throw new UnauthorizedException('Contraseña actual incorrecta');
      }
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.update(userId, {
      passwordHash,
      mustChangePassword: false,
    });
    return this.me(userId);
  }

  logout() {
    return { message: 'Logout exitoso' };
  }
}
