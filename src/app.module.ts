import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AllExceptionsFilter } from './common/logging/all-exceptions.filter';
import { buildLoggerParams } from './common/logging/logger-params';
import { databaseConfig } from './config/database.config';
import { CompanyModule } from './company/company.module';
import { QuotationsModule } from './quotations/quotations.module';

@Module({
  imports: [
    LoggerModule.forRoot(buildLoggerParams()),
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    CompanyModule,
    QuotationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
