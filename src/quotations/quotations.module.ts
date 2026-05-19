import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CompanyModule } from '../company/company.module';
import { Quotation } from '../entities/quotation.entity';
import { QuotationItem } from '../entities/quotation-item.entity';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { QuotationPdfService } from './pdf/quotation-pdf.service';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quotation, QuotationItem]),
    CompanyModule,
    MailModule,
    UsersModule,
  ],
  controllers: [QuotationsController],
  providers: [QuotationsService, QuotationPdfService, JwtAuthGuard],
})
export class QuotationsModule {}
