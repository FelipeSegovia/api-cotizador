import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock = {
    login: jest.fn(),
    me: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  it('login delega en AuthService', async () => {
    authServiceMock.login.mockResolvedValue({
      user: { id: '1', email: 'a@test', name: 'A' },
      token: 't',
      expiresIn: 900,
    });
    const dto = { email: 'a@test', password: 'p' };

    await expect(controller.login(dto)).resolves.toEqual({
      user: { id: '1', email: 'a@test', name: 'A' },
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
    });
    const req = {
      user: {
        sub: '1',
        email: 'a@test',
        name: 'A',
      },
    };

    await expect(controller.me(req as never)).resolves.toEqual({
      id: '1',
      email: 'a@test',
      name: 'A',
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
});
