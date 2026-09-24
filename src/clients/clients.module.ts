import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CompanyModule } from '../company/company.module';
import { Client } from '../entities/client.entity';
import { ClientActivity } from '../entities/client-activity.entity';
import { UsersModule } from '../users/users.module';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, ClientActivity]),
    CompanyModule,
    UsersModule,
  ],
  controllers: [ClientsController],
  providers: [ClientsService, JwtAuthGuard, RolesGuard],
})
export class ClientsModule {}
