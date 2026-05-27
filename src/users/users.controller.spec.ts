import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { USER_CREDENTIALS_MAIL_PORT } from '../mail/user-credentials-mail.port';
import { USER_LOOKUP_PORT } from './user-lookup.port';
import { USERS_ADMIN_PORT } from './users-admin.port';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;
  const usersAdminMock = {
    findAll: jest.fn(),
    createAdminUser: jest.fn(),
    update: jest.fn(),
    toggleStatus: jest.fn(),
    resendProvisionalPassword: jest.fn(),
  };
  const credentialsMailMock = {
    sendUserCredentialsMail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: USERS_ADMIN_PORT, useValue: usersAdminMock },
        { provide: USER_CREDENTIALS_MAIL_PORT, useValue: credentialsMailMock },
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

  it('create persiste usuario y envía correo', async () => {
    const user = {
      id: 'u1',
      email: 'new@test.com',
      name: 'New',
      mobilePhone: null,
      passwordHash: 'hash',
      role: 'common' as const,
      isActive: true,
      mustChangePassword: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersAdminMock.createAdminUser.mockResolvedValue(user);
    credentialsMailMock.sendUserCredentialsMail.mockResolvedValue({
      messageId: 'mid',
    });

    await controller.create({
      name: 'New',
      email: 'new@test.com',
      role: 'common',
      password: 'TempPass123!',
    });

    expect(usersAdminMock.createAdminUser).toHaveBeenCalled();
    expect(credentialsMailMock.sendUserCredentialsMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'new@test.com',
        temporaryPassword: 'TempPass123!',
        isResend: false,
      }),
    );
  });

  it('resendPassword genera password y envía correo', async () => {
    const user = {
      id: 'u1',
      email: 'a@test.com',
      name: 'A',
      mobilePhone: null,
      passwordHash: 'hash',
      role: 'common' as const,
      isActive: true,
      mustChangePassword: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersAdminMock.resendProvisionalPassword.mockResolvedValue({
      user,
      plainPassword: 'Tmp123456!',
    });
    credentialsMailMock.sendUserCredentialsMail.mockResolvedValue({
      messageId: 'mid',
    });

    const result = await controller.resendPassword('u1');

    expect(result.message).toBe('Contraseña provisional reenviada por correo');
    expect(credentialsMailMock.sendUserCredentialsMail).toHaveBeenCalledWith(
      expect.objectContaining({
        temporaryPassword: 'Tmp123456!',
        isResend: true,
      }),
    );
  });
});
