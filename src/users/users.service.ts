import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    return this.userRepo.findOne({ where: { email: normalized } });
  }

  findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async create(input: {
    email: string;
    name: string;
    passwordHash: string;
    mobilePhone?: string | null;
  }): Promise<User> {
    const user = this.userRepo.create({
      email: input.email.trim().toLowerCase(),
      name: input.name,
      passwordHash: input.passwordHash,
      mobilePhone: input.mobilePhone?.trim() || null,
    });
    return this.userRepo.save(user);
  }

  async updateProfile(
    userId: string,
    patch: { mobilePhone?: string },
  ): Promise<void> {
    const updates: Partial<Pick<User, 'mobilePhone'>> = {};
    if ('mobilePhone' in patch && patch.mobilePhone !== undefined) {
      const v = patch.mobilePhone;
      updates.mobilePhone = v.trim() === '' ? null : v.trim().slice(0, 32);
    }
    if (Object.keys(updates).length === 0) {
      return;
    }
    await this.userRepo.update(userId, updates);
  }
}
