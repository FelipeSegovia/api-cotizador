import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { USER_LOOKUP_PORT } from '../users/user-lookup.port';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

describe('ClientsController', () => {
  let controller: ClientsController;
  const clientsServiceMock = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addActivity: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        { provide: ClientsService, useValue: clientsServiceMock },
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn(), signAsync: jest.fn() },
        },
        {
          provide: USER_LOOKUP_PORT,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();
    controller = moduleRef.get(ClientsController);
  });

  const req = {
    user: {
      sub: 'u1',
      email: 'a@test.com',
      name: 'A',
      role: 'common' as const,
      isActive: true,
      mustChangePassword: false,
    },
  };

  it('findAll delega en el servicio con query', async () => {
    clientsServiceMock.findAll.mockResolvedValue([]);
    const query = { tag: ['matriculas'] };
    await expect(
      controller.findAll(req as never, query),
    ).resolves.toEqual([]);
    expect(clientsServiceMock.findAll).toHaveBeenCalledWith('u1', query);
  });

  it('create delega en el servicio', async () => {
    const dto = {
      name: 'Ana',
      emails: ['ana@test.com'],
      phones: ['123'],
      tags: ['matriculas'],
    };
    clientsServiceMock.create.mockResolvedValue({ id: '1', name: 'Ana' });
    await controller.create(req as never, dto);
    expect(clientsServiceMock.create).toHaveBeenCalledWith('u1', dto);
  });

  it('remove delega y retorna void (204)', async () => {
    clientsServiceMock.remove.mockResolvedValue(undefined);
    await expect(
      controller.remove(req as never, '11111111-1111-1111-1111-111111111111'),
    ).resolves.toBeUndefined();
    expect(clientsServiceMock.remove).toHaveBeenCalledWith(
      'u1',
      '11111111-1111-1111-1111-111111111111',
    );
  });
});
