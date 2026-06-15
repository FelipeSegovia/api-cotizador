import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Company } from '../entities/company.entity';
import { CompanyTerms } from '../entities/company-terms.entity';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';
import { CompanyTermsController } from './company-terms.controller';
import { CompanyTermsService } from './company-terms.service';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, CompanyTerms]),
    UsersModule,
    StorageModule,
  ],
  controllers: [CompanyController, CompanyTermsController],
  providers: [CompanyService, CompanyTermsService, JwtAuthGuard],
  exports: [CompanyService, CompanyTermsService],
})
export class CompanyModule {}
