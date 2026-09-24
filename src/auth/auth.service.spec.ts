import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PasswordResetCode } from '../entities/password-reset-code.entity';
import { User } from '../entities/user.entity';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt');
const bcryptCompare = bcrypt.compare as jest.MockedFunction<
  typeof bcrypt.compare
>;
const bcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;
  let mailService: jest.Mocked<Pick<MailService, 'sendPasswordResetCodeMail'>>;
  let userRepo: { update: jest.Mock };
  let resetCodeRepo: {
    save: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    findOne: jest.Mock;
  };

  const userRow = {
    id: 'u1',
    email: 'u@example.com',
    name: 'User',
    mobilePhone: '+56912345678',
    passwordHash: '$2b$...',
    role: 'common' as const,
    isActive: true,
    mustChangePassword: false,
    companyId: null as string | null,
    company: null,
    createdAt: new Date('2026-01-15T10:00:00.000Z'),
    updatedAt: new Date('2026-05-01T12:00:00.000Z'),
  };

  const userResponse = {
    id: 'u1',
    email: 'u@example.com',
    name: 'User',
    mobilePhone: '+56912345678',
    role: 'common' as const,
    isActive: true,
    mustChangePassword: false,
    createdAt: userRow.createdAt,
    updatedAt: userRow.updatedAt,
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      toResponse: jest.fn((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        mobilePhone: user.mobilePhone ?? '',
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      updateProfile: jest.fn(),
      updatePassword: jest.fn(),
      setPassword: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-jwt') };
    mailService = {
      sendPasswordResetCodeMail: jest.fn().mockResolvedValue({ messageId: 'm1' }),
    };
    userRepo = { update: jest.fn().mockResolvedValue(undefined) };
    resetCodeRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((input) => input),
      update: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: MailService, useValue: mailService },
        { provide: getRepositoryToken(User), useValue: userRepo },
        {
          provide: getRepositoryToken(PasswordResetCode),
          useValue: resetCodeRepo,
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    bcryptCompare.mockReset();
    bcryptHash.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.JWT_EXPIRES_IN;
  });

  describe('login', () => {
    it('retorna usuario, token y expiresIn ante credenciales válidas', async () => {
      process.env.JWT_EXPIRES_IN = '900s';
      usersService.findByEmail.mockResolvedValue(userRow);
      bcryptCompare.mockResolvedValue(true as never);

      const result = await service.login({
        email: ' u@Example.com ',
        password: 'secret',
      });

      expect(result.user).toEqual(userResponse);
      expect(result.token).toBe('signed-jwt');
      expect(result.expiresIn).toBe(900);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'u@example.com',
        name: 'User',
        role: 'common',
        isActive: true,
        mustChangePassword: false,
      });
    });

    it('Forbidden si el usuario está deshabilitado', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...userRow,
        isActive: false,
      });

      await expect(
        service.login({ email: 'u@example.com', password: 'secret' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('Unauthorized si el usuario no existe', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'x@example.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('Unauthorized si la contraseña no coincide', async () => {
      usersService.findByEmail.mockResolvedValue(userRow);
      bcryptCompare.mockResolvedValue(false as never);

      await expect(
        service.login({ email: 'u@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('me', () => {
    it('retorna datos públicos del usuario', async () => {
      usersService.findById.mockResolvedValue(userRow);
      await expect(service.me('u1')).resolves.toEqual(userResponse);
    });

    it('Unauthorized si no hay usuario', async () => {
      usersService.findById.mockResolvedValue(null);
      await expect(service.me('missing')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('Unauthorized si el usuario está deshabilitado', async () => {
      usersService.findById.mockResolvedValue({
        ...userRow,
        isActive: false,
      });
      await expect(service.me('u1')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('changePassword', () => {
    it('permite cambio sin currentPassword cuando mustChangePassword es true', async () => {
      usersService.findById
        .mockResolvedValueOnce({
          ...userRow,
          mustChangePassword: true,
        })
        .mockResolvedValueOnce({
          ...userRow,
          mustChangePassword: false,
        });
      bcryptHash.mockResolvedValue('$2b$new' as never);

      await expect(
        service.changePassword('u1', { newPassword: 'NuevaClave123!' }),
      ).resolves.toEqual({
        ...userResponse,
        mustChangePassword: false,
      });
      expect(userRepo.update).toHaveBeenCalledWith('u1', {
        passwordHash: '$2b$new',
        mustChangePassword: false,
      });
    });
  });

  describe('logout', () => {
    it('mensaje esperado por el contrato front', () => {
      expect(service.logout()).toEqual({ message: 'Logout exitoso' });
    });
  });

  describe('forgotPassword', () => {
    it('responde mensaje genérico aunque el email no exista', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'missing@example.com' }),
      ).resolves.toEqual({
        message:
          'Si el correo existe en nuestro sistema, recibirás un código de verificación en breve.',
      });
      expect(mailService.sendPasswordResetCodeMail).not.toHaveBeenCalled();
    });

    it('genera código y envía correo si el usuario existe y está activo', async () => {
      usersService.findByEmail.mockResolvedValue(userRow);
      bcryptHash.mockResolvedValue('$2b$code' as never);

      await service.forgotPassword({ email: 'u@example.com' });

      expect(resetCodeRepo.update).toHaveBeenCalledWith(
        { userId: 'u1', used: false },
        { used: true },
      );
      expect(resetCodeRepo.save).toHaveBeenCalled();
      expect(mailService.sendPasswordResetCodeMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'u@example.com',
          name: 'User',
          expiresMinutes: 15,
        }),
      );
    });

    it('no envía correo si el usuario está deshabilitado', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...userRow,
        isActive: false,
      });

      await service.forgotPassword({ email: 'u@example.com' });

      expect(mailService.sendPasswordResetCodeMail).not.toHaveBeenCalled();
    });
  });

  describe('verifyResetCode', () => {
    const resetCode = {
      id: 'rc1',
      userId: 'u1',
      codeHash: '$2b$code',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      used: false,
      createdAt: new Date(),
    };

    it('retorna valid:true cuando el código es correcto', async () => {
      usersService.findByEmail.mockResolvedValue(userRow);
      resetCodeRepo.findOne.mockResolvedValue(resetCode);
      bcryptCompare.mockResolvedValue(true as never);

      await expect(
        service.verifyResetCode({ email: 'u@example.com', code: '123456' }),
      ).resolves.toEqual({ valid: true });
    });

    it('rechaza código inválido sin incrementar attempts', async () => {
      usersService.findByEmail.mockResolvedValue(userRow);
      resetCodeRepo.findOne.mockResolvedValue(resetCode);
      bcryptCompare.mockResolvedValue(false as never);

      await expect(
        service.verifyResetCode({ email: 'u@example.com', code: '000000' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(resetCodeRepo.update).not.toHaveBeenCalled();
    });

    it('rechaza código expirado', async () => {
      usersService.findByEmail.mockResolvedValue(userRow);
      resetCodeRepo.findOne.mockResolvedValue({
        ...resetCode,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.verifyResetCode({ email: 'u@example.com', code: '123456' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza cuando se excedieron los intentos', async () => {
      usersService.findByEmail.mockResolvedValue(userRow);
      resetCodeRepo.findOne.mockResolvedValue({
        ...resetCode,
        attempts: 5,
      });

      await expect(
        service.verifyResetCode({ email: 'u@example.com', code: '123456' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    const resetCode = {
      id: 'rc1',
      userId: 'u1',
      codeHash: '$2b$code',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      used: false,
      createdAt: new Date(),
    };

    it('actualiza contraseña y marca el código como usado', async () => {
      usersService.findByEmail.mockResolvedValue(userRow);
      resetCodeRepo.findOne.mockResolvedValue(resetCode);
      bcryptCompare.mockResolvedValue(true as never);
      bcryptHash.mockResolvedValue('$2b$new' as never);
      usersService.setPassword.mockResolvedValue({
        ...userRow,
        mustChangePassword: false,
      });

      await expect(
        service.resetPassword({
          email: 'u@example.com',
          code: '123456',
          newPassword: 'NuevaClave123!',
        }),
      ).resolves.toEqual({
        message: 'Contraseña actualizada correctamente',
      });

      expect(usersService.setPassword).toHaveBeenCalledWith(
        'u1',
        '$2b$new',
        false,
      );
      expect(resetCodeRepo.update).toHaveBeenCalledWith('rc1', { used: true });
    });

    it('incrementa attempts cuando el código es incorrecto', async () => {
      usersService.findByEmail.mockResolvedValue(userRow);
      resetCodeRepo.findOne.mockResolvedValue(resetCode);
      bcryptCompare.mockResolvedValue(false as never);

      await expect(
        service.resetPassword({
          email: 'u@example.com',
          code: '000000',
          newPassword: 'NuevaClave123!',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(resetCodeRepo.update).toHaveBeenCalledWith('rc1', { attempts: 1 });
      expect(usersService.setPassword).not.toHaveBeenCalled();
    });

    it('rechaza código ya usado', async () => {
      usersService.findByEmail.mockResolvedValue(userRow);
      resetCodeRepo.findOne.mockResolvedValue({
        ...resetCode,
        used: true,
      });

      await expect(
        service.resetPassword({
          email: 'u@example.com',
          code: '123456',
          newPassword: 'NuevaClave123!',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
