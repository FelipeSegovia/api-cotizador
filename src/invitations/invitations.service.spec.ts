import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { Company } from '../entities/company.entity';
import { Invitation } from '../entities/invitation.entity';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { InvitationsService } from './invitations.service';

describe('InvitationsService', () => {
  let service: InvitationsService;

  const invitationsRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const companyRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const usersService = {
    findByIdOrFail: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
  };
  const mailService = {
    sendInvitationMail: jest.fn(),
  };

  const admin = {
    id: 'admin-1',
    role: 'admin' as const,
    companyId: null,
  };
  const business = {
    id: 'biz-1',
    role: 'business' as const,
    companyId: 'company-1',
  };
  const common = {
    id: 'common-1',
    role: 'common' as const,
    companyId: 'company-1',
  };
  const company = {
    id: 'company-1',
    name: 'Acme',
    userId: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        InvitationsService,
        {
          provide: getRepositoryToken(Invitation),
          useValue: invitationsRepo,
        },
        { provide: getRepositoryToken(Company), useValue: companyRepo },
        { provide: UsersService, useValue: usersService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();
    service = moduleRef.get(InvitationsService);
  });

  describe('create', () => {
    it('admin crea invitación business con companyId y role', async () => {
      usersService.findByIdOrFail.mockResolvedValue(admin);
      usersService.findByEmail.mockResolvedValue(null);
      invitationsRepo.findOne.mockResolvedValue(null);
      companyRepo.findOne.mockResolvedValue(company);
      invitationsRepo.save.mockImplementation(async (x) => ({
        id: 'inv-1',
        ...x,
        acceptedAt: null,
        createdAt: new Date(),
      }));
      mailService.sendInvitationMail.mockResolvedValue({ messageId: 'm1' });

      const result = await service.create('admin-1', {
        email: 'nuevo@test.com',
        name: 'Nuevo',
        companyId: 'company-1',
        role: 'business',
      });

      expect(result.role).toBe('business');
      expect(mailService.sendInvitationMail).toHaveBeenCalled();
      expect(invitationsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'nuevo@test.com',
          role: 'business',
          companyId: 'company-1',
        }),
      );
    });

    it('422 si admin omite companyId', async () => {
      usersService.findByIdOrFail.mockResolvedValue(admin);
      await expect(
        service.create('admin-1', {
          email: 'nuevo@test.com',
          name: 'Nuevo',
          role: 'common',
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('business fuerza role common de su empresa', async () => {
      usersService.findByIdOrFail.mockResolvedValue(business);
      usersService.findByEmail.mockResolvedValue(null);
      invitationsRepo.findOne.mockResolvedValue(null);
      companyRepo.findOne.mockResolvedValue(company);
      invitationsRepo.save.mockImplementation(async (x) => ({
        id: 'inv-2',
        ...x,
        acceptedAt: null,
        createdAt: new Date(),
      }));
      mailService.sendInvitationMail.mockResolvedValue({ messageId: 'm1' });

      const result = await service.create('biz-1', {
        email: 'op@test.com',
        name: 'Operador',
      });

      expect(result.role).toBe('common');
      expect(result.companyId).toBe('company-1');
    });

    it('403 si business intenta invitar con role business', async () => {
      usersService.findByIdOrFail.mockResolvedValue(business);
      await expect(
        service.create('biz-1', {
          email: 'op@test.com',
          name: 'Operador',
          role: 'business',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('403 si business intenta otra empresa', async () => {
      usersService.findByIdOrFail.mockResolvedValue(business);
      await expect(
        service.create('biz-1', {
          email: 'op@test.com',
          name: 'Operador',
          companyId: 'other-company',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('403 si common intenta invitar', async () => {
      usersService.findByIdOrFail.mockResolvedValue(common);
      await expect(
        service.create('common-1', {
          email: 'op@test.com',
          name: 'Operador',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('accept', () => {
    it('crea usuario y marca invitación aceptada', async () => {
      const plain = 'plain-token';
      const tokenHash = createHash('sha256').update(plain).digest('hex');
      invitationsRepo.findOne.mockResolvedValue({
        id: 'inv-1',
        email: 'nuevo@test.com',
        name: 'Nuevo',
        role: 'common',
        companyId: 'company-1',
        tokenHash,
        expiresAt: new Date(Date.now() + 60_000),
        acceptedAt: null,
      });
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: 'u-new',
        role: 'common',
        companyId: 'company-1',
      });

      const result = await service.accept({
        token: plain,
        password: 'Secret123!',
      });

      expect(result.message).toContain('Cuenta creada');
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'nuevo@test.com',
          role: 'common',
          companyId: 'company-1',
          mustChangePassword: false,
        }),
      );
      expect(invitationsRepo.update).toHaveBeenCalledWith(
        'inv-1',
        expect.objectContaining({ acceptedAt: expect.any(Date) }),
      );
    });

    it('404 si token inválido', async () => {
      invitationsRepo.findOne.mockResolvedValue(null);
      await expect(
        service.accept({ token: 'bad', password: 'Secret123!' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('400 si invitación expirada', async () => {
      const plain = 'expired-token';
      const tokenHash = createHash('sha256').update(plain).digest('hex');
      invitationsRepo.findOne.mockResolvedValue({
        id: 'inv-1',
        email: 'nuevo@test.com',
        name: 'Nuevo',
        role: 'common',
        companyId: 'company-1',
        tokenHash,
        expiresAt: new Date(Date.now() - 1000),
        acceptedAt: null,
      });
      await expect(
        service.accept({ token: plain, password: 'Secret123!' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('409 si email ya existe', async () => {
      const plain = 'dup-token';
      const tokenHash = createHash('sha256').update(plain).digest('hex');
      invitationsRepo.findOne.mockResolvedValue({
        id: 'inv-1',
        email: 'nuevo@test.com',
        name: 'Nuevo',
        role: 'common',
        companyId: 'company-1',
        tokenHash,
        expiresAt: new Date(Date.now() + 60_000),
        acceptedAt: null,
      });
      usersService.findByEmail.mockResolvedValue({ id: 'existing' });
      await expect(
        service.accept({ token: plain, password: 'Secret123!' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
