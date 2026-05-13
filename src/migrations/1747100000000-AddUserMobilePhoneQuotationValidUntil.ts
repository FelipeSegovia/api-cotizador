import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserMobilePhoneQuotationValidUntil1747100000000 implements MigrationInterface {
  name = 'AddUserMobilePhoneQuotationValidUntil1747100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "mobilePhone" character varying(32)
    `);
    await queryRunner.query(`
      ALTER TABLE "quotations"
      ADD COLUMN "validUntil" date
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "quotations" DROP COLUMN "validUntil"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "mobilePhone"
    `);
  }
}
