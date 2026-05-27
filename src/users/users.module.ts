import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { User } from '../entities/user.entity';
import { USER_CREDENTIALS_MAIL_PORT } from '../mail/user-credentials-mail.port';
import { MailModule } from '../mail/mail.module';
import { MailService } from '../mail/mail.service';
import { USERS_ADMIN_PORT } from './users-admin.port';
import { USER_LOOKUP_PORT } from './user-lookup.port';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), MailModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    JwtAuthGuard,
    RolesGuard,
    { provide: USER_LOOKUP_PORT, useExisting: UsersService },
    { provide: USERS_ADMIN_PORT, useExisting: UsersService },
    { provide: USER_CREDENTIALS_MAIL_PORT, useExisting: MailService },
  ],
  exports: [UsersService, USER_LOOKUP_PORT, USERS_ADMIN_PORT],
})
export class UsersModule {}
