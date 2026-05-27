import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const repoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const userRow: User = {
    id: 'u1',
    email: 'a@test.com',
    name: 'User A',
    mobilePhone: null,
    passwordHash: 'hash',
    role: 'common',
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repoMock },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  describe('toggleStatus', () => {
    it('409 si el admin intenta deshabilitarse a sí mismo', async () => {
      repoMock.findOne.mockResolvedValue(userRow);

      await expect(service.toggleStatus('u1', 'u1')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('alterna isActive para otro usuario', async () => {
      repoMock.findOne
        .mockResolvedValueOnce(userRow)
        .mockResolvedValueOnce({ ...userRow, isActive: false });
      repoMock.update.mockResolvedValue(undefined);

      const result = await service.toggleStatus('admin-id', 'u1');
      expect(result.isActive).toBe(false);
      expect(repoMock.update).toHaveBeenCalledWith('u1', { isActive: false });
    });
  });

  describe('generateProvisionalPassword', () => {
    it('genera contraseña de al menos 8 caracteres', () => {
      const password = service.generateProvisionalPassword();
      expect(password.length).toBeGreaterThanOrEqual(8);
    });
  });
});
