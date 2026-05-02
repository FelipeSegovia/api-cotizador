import { DataSource } from 'typeorm';
import { join } from 'node:path';
import * as dotenv from 'dotenv';
import { Quotation } from './entities/quotation.entity';
import { User } from './entities/user.entity';

dotenv.config();

/** TypeORM CLI (migrations): `pnpm run migration:run` */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Quotation, User],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});

export default AppDataSource;
