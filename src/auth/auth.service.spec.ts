import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
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
  let userRepo: { update: jest.Mock };

  const userRow = {
    id: 'u1',
    email: 'u@example.com',
    name: 'User',
    mobilePhone: '+56912345678',
    passwordHash: '$2b$...',
    role: 'common' as const,
    isActive: true,
    mustChangePassword: false,
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
    } as unknown as jest.Mocked<UsersService>;

    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-jwt') };
    userRepo = { update: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: getRepositoryToken(User), useValue: userRepo },
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
});
