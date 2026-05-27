import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { UserLookupPort } from '../users/user-lookup.port';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwt: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;
  let userLookup: jest.Mocked<Pick<UserLookupPort, 'findById'>>;

  const activeUser = {
    id: '1',
    email: 'a@x.com',
    name: 'A',
    mobilePhone: null,
    passwordHash: 'hash',
    role: 'common' as const,
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function ctx(headers: Record<string, string>): ExecutionContext {
    const req: { headers: Record<string, string>; user?: unknown } = {
      headers,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as ExecutionContext;
  }

  beforeEach(() => {
    jwt = { verifyAsync: jest.fn() };
    userLookup = { findById: jest.fn() };
    guard = new JwtAuthGuard(
      jwt as unknown as JwtService,
      userLookup as unknown as UserLookupPort,
    );
  });

  it('permite acceso cuando el token Bearer es válido y el usuario está activo', async () => {
    jwt.verifyAsync.mockResolvedValue({
      sub: '1',
      email: 'a@x.com',
      name: 'A',
      role: 'common',
      isActive: true,
      mustChangePassword: false,
    });
    userLookup.findById.mockResolvedValue(activeUser);

    const context = ctx({ authorization: 'Bearer abc.def.ghi' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rechaza cuando el usuario está deshabilitado', async () => {
    jwt.verifyAsync.mockResolvedValue({
      sub: '1',
      email: 'a@x.com',
      name: 'A',
      role: 'common',
      isActive: true,
      mustChangePassword: false,
    });
    userLookup.findById.mockResolvedValue({
      ...activeUser,
      isActive: false,
    });

    await expect(
      guard.canActivate(ctx({ authorization: 'Bearer abc.def.ghi' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
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
