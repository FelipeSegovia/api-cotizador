import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { Client } from '../entities/client.entity';
import { ClientActivity } from '../entities/client-activity.entity';
import { Company } from '../entities/company.entity';
import { CompanyTerms } from '../entities/company-terms.entity';
import { Feedback } from '../entities/feedback.entity';
import { Invitation } from '../entities/invitation.entity';
import { Quotation } from '../entities/quotation.entity';
import { QuotationItem } from '../entities/quotation-item.entity';
import { PasswordResetCode } from '../entities/password-reset-code.entity';
import { User } from '../entities/user.entity';
import { join } from 'node:path';

dotenv.config();

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    Quotation,
    QuotationItem,
    User,
    Company,
    CompanyTerms,
    Client,
    ClientActivity,
    Feedback,
    PasswordResetCode,
    Invitation,
  ],
  migrations: [join(__dirname, 'migrations', '*.{js,ts}')],
  migrationsRun: true,
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
};
