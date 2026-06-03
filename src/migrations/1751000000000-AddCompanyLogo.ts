import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyLogo1751000000000 implements MigrationInterface {
  name = 'AddCompanyLogo1751000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN "logoUrl" character varying(1000)
    `);
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN "logoKey" character varying(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies" DROP COLUMN "logoKey"
    `);
    await queryRunner.query(`
      ALTER TABLE "companies" DROP COLUMN "logoUrl"
    `);
  }
}
