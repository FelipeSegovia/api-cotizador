import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { Repository } from 'typeorm';
import { PasswordResetCode } from '../entities/password-reset-code.entity';
import { User } from '../entities/user.entity';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { toUserResponse } from '../users/user.mapper';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { LoginDto } from './dto/login.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { jwtExpiresInSeconds } from './jwt-expires';
import type { JwtPayload } from './jwt-payload.type';

const RESET_CODE_EXPIRY_MINUTES = 15;
const MAX_RESET_ATTEMPTS = 5;
const FORGOT_PASSWORD_MESSAGE =
  'Si el correo existe en nuestro sistema, recibirás un código de verificación en breve.';
const INVALID_RESET_CODE_MESSAGE = 'Código inválido o expirado';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PasswordResetCode)
    private readonly resetCodeRepo: Repository<PasswordResetCode>,
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

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);

    if (user?.isActive) {
      await this.invalidatePreviousResetCodes(user.id);

      const code = this.generateResetCode();
      const codeHash = await bcrypt.hash(code, 10);
      const expiresAt = new Date(
        Date.now() + RESET_CODE_EXPIRY_MINUTES * 60 * 1000,
      );

      await this.resetCodeRepo.save(
        this.resetCodeRepo.create({
          userId: user.id,
          codeHash,
          expiresAt,
          attempts: 0,
          used: false,
        }),
      );

      await this.mailService.sendPasswordResetCodeMail({
        to: user.email,
        name: user.name,
        code,
        expiresMinutes: RESET_CODE_EXPIRY_MINUTES,
      });
    }

    return { message: FORGOT_PASSWORD_MESSAGE };
  }

  async verifyResetCode(
    dto: VerifyResetCodeDto,
  ): Promise<{ valid: true }> {
    await this.validateResetCode(dto.email, dto.code, false);
    return { valid: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { resetCode } = await this.validateResetCode(
      dto.email,
      dto.code,
      true,
    );

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.setPassword(resetCode.userId, passwordHash, false);
    await this.resetCodeRepo.update(resetCode.id, { used: true });

    return { message: 'Contraseña actualizada correctamente' };
  }

  logout() {
    return { message: 'Logout exitoso' };
  }

  private generateResetCode(): string {
    return randomInt(100000, 1000000).toString();
  }

  private async invalidatePreviousResetCodes(userId: string): Promise<void> {
    await this.resetCodeRepo.update(
      { userId, used: false },
      { used: true },
    );
  }

  private async findLatestActiveResetCode(
    userId: string,
  ): Promise<PasswordResetCode | null> {
    return this.resetCodeRepo.findOne({
      where: { userId, used: false },
      order: { createdAt: 'DESC' },
    });
  }

  private async validateResetCode(
    email: string,
    code: string,
    incrementAttemptsOnFailure: boolean,
  ): Promise<{ user: User; resetCode: PasswordResetCode }> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) {
      throw new BadRequestException(INVALID_RESET_CODE_MESSAGE);
    }

    const resetCode = await this.findLatestActiveResetCode(user.id);
    if (!resetCode) {
      throw new BadRequestException(INVALID_RESET_CODE_MESSAGE);
    }

    if (resetCode.used) {
      throw new BadRequestException(INVALID_RESET_CODE_MESSAGE);
    }

    if (resetCode.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(INVALID_RESET_CODE_MESSAGE);
    }

    if (resetCode.attempts >= MAX_RESET_ATTEMPTS) {
      throw new BadRequestException(INVALID_RESET_CODE_MESSAGE);
    }

    const match = await bcrypt.compare(code, resetCode.codeHash);
    if (!match) {
      if (incrementAttemptsOnFailure) {
        await this.resetCodeRepo.update(resetCode.id, {
          attempts: resetCode.attempts + 1,
        });
      }
      throw new BadRequestException(INVALID_RESET_CODE_MESSAGE);
    }

    return { user, resetCode };
  }
}
