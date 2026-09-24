import type { User } from '../entities/user.entity';
import type { UpdateUserDto } from './dto/update-user.dto';

/** Operaciones de gestión de usuarios expuestas al controller. */
export interface UsersAdminPort {
  findAllForActor(
    actorUserId: string,
    companyIdFilter?: string,
  ): Promise<User[]>;
  update(
    actorUserId: string,
    id: string,
    dto: UpdateUserDto,
  ): Promise<User>;
  toggleStatus(actorUserId: string, targetUserId: string): Promise<User>;
}

export const USERS_ADMIN_PORT = Symbol('USERS_ADMIN_PORT');
