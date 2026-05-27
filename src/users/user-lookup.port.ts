import type { User } from '../entities/user.entity';

/** Puerto mínimo para consultar usuarios desde auth (evita dependencia circular). */
export interface UserLookupPort {
  findById(id: string): Promise<User | null>;
}

export const USER_LOOKUP_PORT = Symbol('USER_LOOKUP_PORT');
