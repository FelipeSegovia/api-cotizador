import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from './jwt-payload.type';
import type { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    const token = this.extractBearer(req.headers.authorization);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private extractBearer(authHeader?: string): string | undefined {
    if (!authHeader?.startsWith('Bearer ')) {
      return undefined;
    }
    const t = authHeader.slice(7).trim();
    return t.length > 0 ? t : undefined;
  }
}
