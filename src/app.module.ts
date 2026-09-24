import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AllExceptionsFilter } from './common/logging/all-exceptions.filter';
import { buildLoggerParams } from './common/logging/logger-params';
import { databaseConfig } from './config/database.config';
import { ClientsModule } from './clients/clients.module';
import { CompanyModule } from './company/company.module';
import { FeedbackModule } from './feedback/feedback.module';
import { InvitationsModule } from './invitations/invitations.module';
import { QuotationsModule } from './quotations/quotations.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    LoggerModule.forRoot(buildLoggerParams()),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    UsersModule,
    CompanyModule,
    ClientsModule,
    QuotationsModule,
    FeedbackModule,
    InvitationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
