import type { User } from '../entities/user.entity';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

/** Operaciones admin expuestas al controller (evita dependencia circular con auth). */
export interface UsersAdminPort {
  findAll(): Promise<User[]>;
  createAdminUser(dto: CreateUserDto): Promise<User>;
  update(id: string, dto: UpdateUserDto): Promise<User>;
  toggleStatus(adminUserId: string, targetUserId: string): Promise<User>;
  resendProvisionalPassword(
    id: string,
  ): Promise<{ user: User; plainPassword: string }>;
}

export const USERS_ADMIN_PORT = Symbol('USERS_ADMIN_PORT');
