import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt');
const bcryptCompare = bcrypt.compare as jest.MockedFunction<
  typeof bcrypt.compare
>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-jwt') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    bcryptCompare.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.JWT_EXPIRES_IN;
  });

  describe('login', () => {
    const userRow = {
      id: 'u1',
      email: 'u@example.com',
      name: 'User',
      passwordHash: '$2b$...',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('retorna usuario, token y expiresIn ante credenciales válidas', async () => {
      process.env.JWT_EXPIRES_IN = '900s';
      usersService.findByEmail.mockResolvedValue(userRow);
      bcryptCompare.mockResolvedValue(true as never);

      const result = await service.login({
        email: ' u@Example.com ',
        password: 'secret',
      });

      expect(result.user.id).toBe('u1');
      expect(result.token).toBe('signed-jwt');
      expect(result.expiresIn).toBe(900);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'u@example.com',
        name: 'User',
      });
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
    const userRow = {
      id: 'u1',
      email: 'u@example.com',
      name: 'User',
      passwordHash: 'h',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('retorna datos públicos del usuario', async () => {
      usersService.findById.mockResolvedValue(userRow);
      await expect(service.me('u1')).resolves.toEqual({
        id: 'u1',
        email: 'u@example.com',
        name: 'User',
      });
    });

    it('Unauthorized si no hay usuario', async () => {
      usersService.findById.mockResolvedValue(null);
      await expect(service.me('missing')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('mensaje esperado por el contrato front', () => {
      expect(service.logout()).toEqual({ message: 'Logout exitoso' });
    });
  });
});
