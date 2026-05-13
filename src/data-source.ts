import { DataSource } from 'typeorm';
import { join } from 'node:path';
import { config } from 'dotenv';
import { Company } from './entities/company.entity';
import { Quotation } from './entities/quotation.entity';
import { QuotationItem } from './entities/quotation-item.entity';
import { User } from './entities/user.entity';

config({ path: join(__dirname, '..', '.env') });

/** TypeORM CLI (migrations): `pnpm run migration:run` */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Quotation, QuotationItem, User, Company],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});
