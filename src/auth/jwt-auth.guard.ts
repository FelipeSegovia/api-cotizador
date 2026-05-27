import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import {
  USER_LOOKUP_PORT,
  type UserLookupPort,
} from '../users/user-lookup.port';
import type { JwtPayload } from './jwt-payload.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(USER_LOOKUP_PORT)
    private readonly userLookup: UserLookupPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    const token = this.extractBearer(req.headers.authorization);
    if (!token) {
      throw new UnauthorizedException();
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }

    const user = await this.userLookup.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    req.user = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
    };
    return true;
  }

  private extractBearer(authHeader?: string): string | undefined {
    if (!authHeader?.startsWith('Bearer ')) {
      return undefined;
    }
    const t = authHeader.slice(7).trim();
    return t.length > 0 ? t : undefined;
  }
}
