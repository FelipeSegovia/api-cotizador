import type { UserRole } from '../entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
}
