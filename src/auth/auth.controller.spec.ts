import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { InvitationsService } from '../invitations/invitations.service';
import { USER_LOOKUP_PORT } from '../users/user-lookup.port';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock = {
    login: jest.fn(),
    me: jest.fn(),
    patchMe: jest.fn(),
    changePassword: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    verifyResetCode: jest.fn(),
    resetPassword: jest.fn(),
  };
  const invitationsServiceMock = {
    accept: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: InvitationsService, useValue: invitationsServiceMock },
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
            signAsync: jest.fn(),
          },
        },
        {
          provide: USER_LOOKUP_PORT,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  it('login delega en AuthService', async () => {
    authServiceMock.login.mockResolvedValue({
      user: {
        id: '1',
        email: 'a@test',
        name: 'A',
        mobilePhone: '',
        role: 'common',
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token: 't',
      expiresIn: 900,
    });
    const dto = { email: 'a@test', password: 'p' };

    await expect(controller.login(dto)).resolves.toMatchObject({
      token: 't',
      expiresIn: 900,
    });
    expect(authServiceMock.login).toHaveBeenCalledWith(dto);
  });

  it('me delega en AuthService con sub del JWT', async () => {
    authServiceMock.me.mockResolvedValue({
      id: '1',
      email: 'a@test',
      name: 'A',
      mobilePhone: '',
      role: 'common',
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const req = {
      user: {
        sub: '1',
        email: 'a@test',
        name: 'A',
        role: 'common' as const,
        isActive: true,
        mustChangePassword: false,
      },
    };

    await expect(controller.me(req as never)).resolves.toMatchObject({
      id: '1',
      email: 'a@test',
    });
    expect(authServiceMock.me).toHaveBeenCalledWith('1');
  });

  it('logout devuelve el mensaje del contrato front', () => {
    authServiceMock.logout.mockReturnValue({
      message: 'Logout exitoso',
    });

    expect(controller.logout()).toEqual({
      message: 'Logout exitoso',
    });
    expect(authServiceMock.logout).toHaveBeenCalled();
  });

  it('forgotPassword delega en AuthService', async () => {
    authServiceMock.forgotPassword.mockResolvedValue({
      message:
        'Si el correo existe en nuestro sistema, recibirás un código de verificación en breve.',
    });
    const dto = { email: 'u@example.com' };

    await expect(controller.forgotPassword(dto)).resolves.toMatchObject({
      message:
        'Si el correo existe en nuestro sistema, recibirás un código de verificación en breve.',
    });
    expect(authServiceMock.forgotPassword).toHaveBeenCalledWith(dto);
  });

  it('verifyResetCode delega en AuthService', async () => {
    authServiceMock.verifyResetCode.mockResolvedValue({ valid: true });
    const dto = { email: 'u@example.com', code: '123456' };

    await expect(controller.verifyResetCode(dto)).resolves.toEqual({
      valid: true,
    });
    expect(authServiceMock.verifyResetCode).toHaveBeenCalledWith(dto);
  });

  it('resetPassword delega en AuthService', async () => {
    authServiceMock.resetPassword.mockResolvedValue({
      message: 'Contraseña actualizada correctamente',
    });
    const dto = {
      email: 'u@example.com',
      code: '123456',
      newPassword: 'NuevaClave123!',
    };

    await expect(controller.resetPassword(dto)).resolves.toMatchObject({
      message: 'Contraseña actualizada correctamente',
    });
    expect(authServiceMock.resetPassword).toHaveBeenCalledWith(dto);
  });

  it('acceptInvitation delega en InvitationsService', async () => {
    invitationsServiceMock.accept.mockResolvedValue({
      message: 'Cuenta creada. Ya puedes iniciar sesión.',
    });
    const dto = { token: 'tok', password: 'Secret123!' };
    await expect(controller.acceptInvitation(dto)).resolves.toMatchObject({
      message: expect.stringContaining('Cuenta creada'),
    });
    expect(invitationsServiceMock.accept).toHaveBeenCalledWith(dto);
  });
});
