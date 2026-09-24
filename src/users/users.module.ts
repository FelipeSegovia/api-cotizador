import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { User } from '../entities/user.entity';
import { USERS_ADMIN_PORT } from './users-admin.port';
import { USER_LOOKUP_PORT } from './user-lookup.port';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    UsersService,
    JwtAuthGuard,
    RolesGuard,
    { provide: USER_LOOKUP_PORT, useExisting: UsersService },
    { provide: USERS_ADMIN_PORT, useExisting: UsersService },
  ],
  exports: [UsersService, USER_LOOKUP_PORT, USERS_ADMIN_PORT],
})
export class UsersModule {}
