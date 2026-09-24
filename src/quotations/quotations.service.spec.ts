import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CompanyService } from '../company/company.service';
import { CompanyTermsService } from '../company/company-terms.service';
import { Quotation } from '../entities/quotation.entity';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { QuotationPdfService } from './pdf/quotation-pdf.service';
import { QuotationsService } from './quotations.service';

describe('QuotationsService company tenancy', () => {
  let service: QuotationsService;
  const quotationsRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn(),
    update: jest.fn(),
  };
  const companyService = {
    findByUser: jest.fn(),
    findByUserOrFail: jest.fn(),
    toResponse: jest.fn(),
  };
  const companyTermsService = {
    resolveTermsForUser: jest.fn(),
  };
  const quotationPdfService = { generate: jest.fn() };
  const mailService = { sendQuotationMail: jest.fn() };
  const usersService = { findById: jest.fn() };
  const dataSource = { transaction: jest.fn() };

  const company = { id: 'company-1', name: 'Acme' };
  const quotation = {
    id: 'q1',
    userId: 'author-1',
    companyId: 'company-1',
    clientName: 'Cliente',
    clientRut: null,
    clientEmail: null,
    projectTitle: null,
    projectDeadline: null,
    projectNotes: null,
    status: 'draft' as const,
    validUntil: null,
    total: 0,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        QuotationsService,
        { provide: getRepositoryToken(Quotation), useValue: quotationsRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: CompanyService, useValue: companyService },
        { provide: CompanyTermsService, useValue: companyTermsService },
        { provide: QuotationPdfService, useValue: quotationPdfService },
        { provide: MailService, useValue: mailService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();
    service = moduleRef.get(QuotationsService);
  });

  it('findAllByUser sin empresa devuelve []', async () => {
    companyService.findByUser.mockResolvedValue(null);
    await expect(service.findAllByUser('u1')).resolves.toEqual([]);
    expect(quotationsRepo.find).not.toHaveBeenCalled();
  });

  it('findAllByUser lista por companyId (compartido)', async () => {
    companyService.findByUser.mockResolvedValue(company);
    quotationsRepo.find.mockResolvedValue([quotation]);
    const result = await service.findAllByUser('colleague-2');
    expect(quotationsRepo.find).toHaveBeenCalledWith({
      where: { companyId: 'company-1' },
      order: { createdAt: 'DESC' },
    });
    expect(result).toHaveLength(1);
  });

  it('create sin empresa → 422', async () => {
    companyService.findByUser.mockResolvedValue(null);
    await expect(
      service.create('u1', {
        clientName: 'X',
        items: [
          { description: 'a', quantity: 1, unitPrice: 10, subtotal: 10 },
        ],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('create asigna companyId de la empresa del usuario', async () => {
    companyService.findByUser.mockResolvedValue(company);
    quotationsRepo.save.mockImplementation(async (x) => ({
      ...x,
      id: 'q-new',
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await service.create('u1', {
      clientName: 'X',
      items: [
        { description: 'a', quantity: 1, unitPrice: 10, subtotal: 10 },
      ],
    });

    expect(quotationsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        companyId: 'company-1',
      }),
    );
  });

  it('findOne cross-company → 404', async () => {
    companyService.findByUser.mockResolvedValue(company);
    quotationsRepo.findOne.mockResolvedValue(null);
    await expect(service.findOneByUser('u1', 'q-other')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
