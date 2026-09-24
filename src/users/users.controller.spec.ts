import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { USER_LOOKUP_PORT } from './user-lookup.port';
import { USERS_ADMIN_PORT } from './users-admin.port';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;
  const usersAdminMock = {
    findAllForActor: jest.fn(),
    update: jest.fn(),
    toggleStatus: jest.fn(),
  };

  const req = {
    user: {
      sub: 'business-id',
      email: 'biz@test.com',
      name: 'Business',
      role: 'business' as const,
      isActive: true,
      mustChangePassword: false,
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: USERS_ADMIN_PORT, useValue: usersAdminMock },
        JwtAuthGuard,
        RolesGuard,
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

    controller = moduleRef.get(UsersController);
  });

  it('findAll delega en findAllForActor', async () => {
    usersAdminMock.findAllForActor.mockResolvedValue([]);
    await controller.findAll(req as never, undefined);
    expect(usersAdminMock.findAllForActor).toHaveBeenCalledWith(
      'business-id',
      undefined,
    );
  });

  it('toggleStatus delega en el port', async () => {
    const user = {
      id: 'u1',
      email: 'a@test.com',
      name: 'A',
      mobilePhone: null,
      passwordHash: 'hash',
      role: 'common' as const,
      isActive: false,
      mustChangePassword: false,
      companyId: 'company-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersAdminMock.toggleStatus.mockResolvedValue(user);
    const result = await controller.toggleStatus(req as never, 'u1');
    expect(usersAdminMock.toggleStatus).toHaveBeenCalledWith(
      'business-id',
      'u1',
    );
    expect(result.isActive).toBe(false);
  });
});
