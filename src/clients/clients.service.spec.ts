import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CompanyService } from '../company/company.service';
import { ClientActivity } from '../entities/client-activity.entity';
import { Client } from '../entities/client.entity';
import { UsersService } from '../users/users.service';
import { ClientsService } from './clients.service';

describe('ClientsService', () => {
  let service: ClientsService;

  const qbMock = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const clientsRepoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => qbMock),
  };
  const activitiesRepoMock = {
    create: jest.fn((x) => x),
    save: jest.fn(),
  };
  const companyServiceMock = {
    findByUser: jest.fn(),
  };
  const usersServiceMock = {
    findByIdOrFail: jest.fn(),
  };

  const company = {
    id: 'c1',
    userId: 'u1',
    name: 'Empresa',
    rut: '1-9',
    address: null,
    city: null,
    contact: null,
    logoUrl: null,
    logoKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const baseClient: Client = {
    id: 'client-1',
    companyId: 'c1',
    createdByUserId: 'u1',
    name: 'Ana Torres',
    website: null,
    emails: [],
    phones: [],
    tags: [],
    status: 'not_contacted',
    contacts: { email: false, phone: false, whatsapp: false },
    activities: [],
    createdAt: new Date('2026-09-18T09:30:00.000Z'),
    updatedAt: new Date('2026-09-18T09:30:00.000Z'),
    company: company as never,
    createdByUser: null,
  };

  function mockTransaction() {
    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === Client) {
          return {
            create: jest.fn((x) => ({ ...x, id: 'client-1' })),
            save: jest.fn(async (x) => ({
              ...baseClient,
              ...x,
              id: 'client-1',
            })),
            update: jest.fn(),
            findOne: jest.fn(async () => ({
              ...baseClient,
              activities: [
                {
                  id: 'a1',
                  clientId: 'client-1',
                  type: 'created',
                  message: 'Cliente potencial creado',
                  createdByName: null,
                  meta: null,
                  createdAt: new Date('2026-09-18T09:30:00.000Z'),
                },
              ],
            })),
          };
        }
        return {
          create: jest.fn((x) => x),
          save: jest.fn(async (x) => ({
            id: 'a1',
            createdAt: new Date(),
            ...x,
          })),
        };
      }),
    };
    return {
      transaction: jest.fn(async (cb: (m: typeof manager) => unknown) =>
        cb(manager),
      ),
    };
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    qbMock.leftJoinAndSelect.mockReturnThis();
    qbMock.where.mockReturnThis();
    qbMock.andWhere.mockReturnThis();
    qbMock.orderBy.mockReturnThis();
    const dataSourceMock = mockTransaction();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: getRepositoryToken(Client), useValue: clientsRepoMock },
        {
          provide: getRepositoryToken(ClientActivity),
          useValue: activitiesRepoMock,
        },
        { provide: CompanyService, useValue: companyServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: DataSource, useValue: dataSourceMock },
      ],
    }).compile();
    service = moduleRef.get(ClientsService);
  });

  describe('findAll', () => {
    it('devuelve [] si el usuario no tiene empresa', async () => {
      companyServiceMock.findByUser.mockResolvedValue(null);
      await expect(service.findAll('u1')).resolves.toEqual([]);
    });

    it('lista clientes de la empresa', async () => {
      companyServiceMock.findByUser.mockResolvedValue(company);
      qbMock.getMany.mockResolvedValue([baseClient]);
      const result = await service.findAll('u1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Ana Torres');
      expect(result[0].emails).toEqual([]);
      expect(result[0].tags).toEqual([]);
      expect(qbMock.andWhere).not.toHaveBeenCalled();
    });

    it('filtra por tag con operador OR (&&)', async () => {
      companyServiceMock.findByUser.mockResolvedValue(company);
      qbMock.getMany.mockResolvedValue([
        { ...baseClient, tags: ['matriculas'] },
      ]);
      await service.findAll('u1', { tag: ['Matriculas', 'rondas-app'] });
      expect(qbMock.andWhere).toHaveBeenCalledWith(
        'client.tags && ARRAY[:...filterTags]::text[]',
        { filterTags: ['matriculas', 'rondas-app'] },
      );
    });
  });

  describe('create', () => {
    it('422 si no hay empresa', async () => {
      companyServiceMock.findByUser.mockResolvedValue(null);
      await expect(
        service.create('u1', { name: 'Ana' }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('crea con actividad created', async () => {
      companyServiceMock.findByUser.mockResolvedValue(company);
      const result = await service.create('u1', { name: 'Ana Torres' });
      expect(result.name).toBe('Ana Torres');
      expect(result.activities[0]?.type).toBe('created');
    });

    it('normaliza tags, emails y phones al crear', async () => {
      companyServiceMock.findByUser.mockResolvedValue(company);

      let createdPayload: Record<string, unknown> | undefined;
      const manager = {
        getRepository: jest.fn((entity: unknown) => {
          if (entity === Client) {
            return {
              create: jest.fn((x: Record<string, unknown>) => {
                createdPayload = x;
                return { ...x, id: 'client-1' };
              }),
              save: jest.fn(async (x) => ({
                ...baseClient,
                ...x,
                id: 'client-1',
              })),
              findOne: jest.fn(async () => ({
                ...baseClient,
                emails: ['Ana@Anatorres.com'],
                phones: ['+34 600 123 456'],
                tags: ['rondas-app', 'matriculas'],
                activities: [],
              })),
            };
          }
          return {
            create: jest.fn((x) => x),
            save: jest.fn(async (x) => x),
          };
        }),
      };
      (service as unknown as { dataSource: DataSource }).dataSource = {
        transaction: jest.fn(async (cb: (m: typeof manager) => unknown) =>
          cb(manager),
        ),
      } as unknown as DataSource;

      await service.create('u1', {
        name: 'Ana',
        emails: ['Ana@Anatorres.com', 'ana@anatorres.com'],
        phones: ['+34 600 123 456', '+34 600 123 456'],
        tags: ['Rondas App', 'matriculas', 'matriculas'],
      });

      expect(createdPayload).toEqual(
        expect.objectContaining({
          emails: ['Ana@Anatorres.com'],
          phones: ['+34 600 123 456'],
          tags: ['rondas-app', 'matriculas'],
        }),
      );
    });
  });

  describe('update', () => {
    it('404 si el cliente es de otra empresa', async () => {
      companyServiceMock.findByUser.mockResolvedValue(company);
      clientsRepoMock.findOne.mockResolvedValue(null);
      await expect(
        service.update('u1', 'client-1', { status: 'approved' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('genera status_changed y channel_toggled', async () => {
      companyServiceMock.findByUser.mockResolvedValue(company);
      clientsRepoMock.findOne.mockResolvedValue({ ...baseClient });

      const activityCreates: unknown[] = [];
      const manager = {
        getRepository: jest.fn((entity: unknown) => {
          if (entity === Client) {
            return {
              update: jest.fn(),
              findOne: jest.fn(async () => ({
                ...baseClient,
                status: 'approved',
                contacts: { email: true, phone: false, whatsapp: false },
                activities: [
                  {
                    id: 'a2',
                    clientId: 'client-1',
                    type: 'status_changed',
                    message:
                      'Estado cambiado de Sin contactar a Aprobado',
                    createdByName: null,
                    meta: { from: 'not_contacted', to: 'approved' },
                    createdAt: new Date('2026-09-18T10:00:00.000Z'),
                  },
                  {
                    id: 'a3',
                    clientId: 'client-1',
                    type: 'channel_toggled',
                    message: 'Canal correo marcado como contactado',
                    createdByName: null,
                    meta: { channel: 'email', value: true },
                    createdAt: new Date('2026-09-18T10:00:01.000Z'),
                  },
                ],
              })),
            };
          }
          return {
            create: jest.fn((x) => {
              activityCreates.push(x);
              return x;
            }),
            save: jest.fn(async (x) => x),
          };
        }),
      };

      (service as unknown as { dataSource: DataSource }).dataSource = {
        transaction: jest.fn(async (cb: (m: typeof manager) => unknown) =>
          cb(manager),
        ),
      } as unknown as DataSource;

      const result = await service.update('u1', 'client-1', {
        status: 'approved',
        contacts: { email: true },
      });

      expect(activityCreates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'status_changed' }),
          expect.objectContaining({
            type: 'channel_toggled',
            meta: { channel: 'email', value: true },
          }),
        ]),
      );
      expect(result.status).toBe('approved');
    });

    it('genera status_changed con labels de pending y no_answer', async () => {
      companyServiceMock.findByUser.mockResolvedValue(company);
      clientsRepoMock.findOne.mockResolvedValue({ ...baseClient });

      const activityCreates: unknown[] = [];
      let updatePayload: Record<string, unknown> | undefined;
      const manager = {
        getRepository: jest.fn((entity: unknown) => {
          if (entity === Client) {
            return {
              update: jest.fn((_where, data) => {
                updatePayload = data;
              }),
              findOne: jest.fn(async () => ({
                ...baseClient,
                status: 'pending',
                activities: [],
              })),
            };
          }
          return {
            create: jest.fn((x) => {
              activityCreates.push(x);
              return x;
            }),
            save: jest.fn(async (x) => x),
          };
        }),
      };

      (service as unknown as { dataSource: DataSource }).dataSource = {
        transaction: jest.fn(async (cb: (m: typeof manager) => unknown) =>
          cb(manager),
        ),
      } as unknown as DataSource;

      await service.update('u1', 'client-1', { status: 'pending' });

      expect(updatePayload).toEqual(
        expect.objectContaining({ status: 'pending' }),
      );
      expect(activityCreates).toEqual([
        expect.objectContaining({
          type: 'status_changed',
          message: 'Estado cambiado de Sin contactar a Pendiente',
          meta: { from: 'not_contacted', to: 'pending' },
        }),
      ]);
    });

    it('actualiza tags/emails/phones sin actividad', async () => {
      companyServiceMock.findByUser.mockResolvedValue(company);
      clientsRepoMock.findOne.mockResolvedValue({ ...baseClient });

      const activityCreates: unknown[] = [];
      let updatePayload: Record<string, unknown> | undefined;
      const manager = {
        getRepository: jest.fn((entity: unknown) => {
          if (entity === Client) {
            return {
              update: jest.fn((_where, data) => {
                updatePayload = data;
              }),
              findOne: jest.fn(async () => ({
                ...baseClient,
                emails: ['a@test.com'],
                phones: ['123'],
                tags: ['matriculas'],
                activities: [],
              })),
            };
          }
          return {
            create: jest.fn((x) => {
              activityCreates.push(x);
              return x;
            }),
            save: jest.fn(async (x) => x),
          };
        }),
      };

      (service as unknown as { dataSource: DataSource }).dataSource = {
        transaction: jest.fn(async (cb: (m: typeof manager) => unknown) =>
          cb(manager),
        ),
      } as unknown as DataSource;

      await service.update('u1', 'client-1', {
        emails: ['a@test.com'],
        phones: ['123'],
        tags: ['Matriculas'],
      });

      expect(updatePayload).toEqual({
        emails: ['a@test.com'],
        phones: ['123'],
        tags: ['matriculas'],
      });
      expect(activityCreates).toHaveLength(0);
    });

    it('no genera actividad si el canal no cambia', async () => {
      companyServiceMock.findByUser.mockResolvedValue(company);
      clientsRepoMock.findOne.mockResolvedValue({
        ...baseClient,
        contacts: { email: true, phone: false, whatsapp: false },
      });

      const activityCreates: unknown[] = [];
      const manager = {
        getRepository: jest.fn((entity: unknown) => {
          if (entity === Client) {
            return {
              update: jest.fn(),
              findOne: jest.fn(async () => ({
                ...baseClient,
                contacts: { email: true, phone: false, whatsapp: false },
                activities: [],
              })),
            };
          }
          return {
            create: jest.fn((x) => {
              activityCreates.push(x);
              return x;
            }),
            save: jest.fn(async (x) => x),
          };
        }),
      };

      (service as unknown as { dataSource: DataSource }).dataSource = {
        transaction: jest.fn(async (cb: (m: typeof manager) => unknown) =>
          cb(manager),
        ),
      } as unknown as DataSource;

      await service.update('u1', 'client-1', {
        contacts: { email: true },
      });
      expect(activityCreates).toHaveLength(0);
    });
  });

  describe('addActivity', () => {
    it('crea nota con createdByName', async () => {
      companyServiceMock.findByUser.mockResolvedValue(company);
      clientsRepoMock.findOne
        .mockResolvedValueOnce(baseClient)
        .mockResolvedValueOnce({
          ...baseClient,
          activities: [
            {
              id: 'n1',
              clientId: 'client-1',
              type: 'note',
              message: 'Llamó',
              createdByName: 'Felipe Segovia',
              meta: null,
              createdAt: new Date(),
            },
          ],
        });
      usersServiceMock.findByIdOrFail.mockResolvedValue({
        id: 'u1',
        name: 'Felipe Segovia',
      });

      const result = await service.addActivity('u1', 'client-1', {
        message: 'Llamó',
      });
      expect(activitiesRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'note',
          message: 'Llamó',
          createdByName: 'Felipe Segovia',
        }),
      );
      expect(result.activities[0]?.createdByName).toBe('Felipe Segovia');
    });
  });

  describe('remove', () => {
    it('elimina el cliente de la empresa', async () => {
      companyServiceMock.findByUser.mockResolvedValue(company);
      clientsRepoMock.findOne.mockResolvedValue(baseClient);
      clientsRepoMock.delete.mockResolvedValue(undefined);
      await service.remove('u1', 'client-1');
      expect(clientsRepoMock.delete).toHaveBeenCalledWith({ id: 'client-1' });
    });
  });
});
