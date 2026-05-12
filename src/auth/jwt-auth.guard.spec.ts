import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwt: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;

  function ctx(headers: Record<string, string>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    } as ExecutionContext;
  }

  beforeEach(() => {
    jwt = { verifyAsync: jest.fn() };
    guard = new JwtAuthGuard(jwt as unknown as JwtService);
  });

  it('permite acceso cuando el token Bearer es válido', async () => {
    jwt.verifyAsync.mockResolvedValue({
      sub: '1',
      email: 'a@x.com',
      name: 'A',
    });

    await expect(
      guard.canActivate(ctx({ authorization: 'Bearer abc.def.ghi' })),
    ).resolves.toBe(true);
  });

  it('rechaza cuando falta Authorization', async () => {
    await expect(guard.canActivate(ctx({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza cuando verify falla', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('bad token'));
    await expect(
      guard.canActivate(ctx({ authorization: 'Bearer x' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
