import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Company } from '../entities/company.entity';
import { Invitation } from '../entities/invitation.entity';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation, Company]),
    UsersModule,
    MailModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService, JwtAuthGuard, RolesGuard],
  exports: [InvitationsService],
})
export class InvitationsModule {}
