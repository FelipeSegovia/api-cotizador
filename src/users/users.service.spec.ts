import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
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

  const platformAdmin: User = {
    id: 'platform-admin',
    email: 'platform@test.com',
    name: 'Platform Admin',
    mobilePhone: null,
    passwordHash: 'hash',
    role: 'admin',
    isActive: true,
    mustChangePassword: false,
    companyId: null,
    company: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const businessRow: User = {
    id: 'business-id',
    email: 'biz@test.com',
    name: 'Business',
    mobilePhone: null,
    passwordHash: 'hash',
    role: 'business',
    isActive: true,
    mustChangePassword: false,
    companyId: 'company-1',
    company: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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
    companyId: 'company-1',
    company: null,
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
    it('409 si el business intenta deshabilitarse a sí mismo', async () => {
      repoMock.findOne
        .mockResolvedValueOnce(businessRow)
        .mockResolvedValueOnce(businessRow);

      await expect(
        service.toggleStatus('business-id', 'business-id'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('alterna isActive para common de la misma empresa', async () => {
      repoMock.findOne
        .mockResolvedValueOnce(businessRow)
        .mockResolvedValueOnce(userRow)
        .mockResolvedValueOnce({ ...userRow, isActive: false });
      repoMock.update.mockResolvedValue(undefined);

      const result = await service.toggleStatus('business-id', 'u1');
      expect(result.isActive).toBe(false);
      expect(repoMock.update).toHaveBeenCalledWith('u1', { isActive: false });
    });

    it('404 si el target es de otra empresa', async () => {
      repoMock.findOne
        .mockResolvedValueOnce(businessRow)
        .mockResolvedValueOnce({ ...userRow, companyId: 'other' });

      await expect(
        service.toggleStatus('business-id', 'u1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('403 si business intenta deshabilitar a otro business', async () => {
      const otherBusiness = {
        ...businessRow,
        id: 'business-2',
        email: 'other@test.com',
      };
      repoMock.findOne
        .mockResolvedValueOnce(businessRow)
        .mockResolvedValueOnce(otherBusiness);

      await expect(
        service.toggleStatus('business-id', 'business-2'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('findAllForActor', () => {
    it('admin lista todos (sin filtro)', async () => {
      repoMock.findOne.mockResolvedValue(platformAdmin);
      repoMock.find.mockResolvedValue([userRow]);
      const result = await service.findAllForActor('platform-admin');
      expect(repoMock.find).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });

    it('business lista solo usuarios de su empresa', async () => {
      repoMock.findOne.mockResolvedValue(businessRow);
      repoMock.find.mockResolvedValue([userRow]);
      const result = await service.findAllForActor('business-id');
      expect(repoMock.find).toHaveBeenCalledWith({
        where: { companyId: 'company-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });

    it('422 si business no tiene empresa', async () => {
      repoMock.findOne.mockResolvedValue({
        ...businessRow,
        companyId: null,
      });
      await expect(
        service.findAllForActor('business-id'),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  describe('update', () => {
    it('403 si business intenta cambiar role', async () => {
      repoMock.findOne
        .mockResolvedValueOnce(businessRow)
        .mockResolvedValueOnce(userRow);

      await expect(
        service.update('business-id', 'u1', { role: 'business' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
