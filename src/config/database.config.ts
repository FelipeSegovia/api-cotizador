import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { Quotation } from '../entities/quotation.entity';
import { QuotationItem } from '../entities/quotation-item.entity';
import { User } from '../entities/user.entity';

dotenv.config();

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Quotation, QuotationItem, User],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
};
