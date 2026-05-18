import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameQuotationPendingToSent1747200000000 implements MigrationInterface {
  name = 'RenameQuotationPendingToSent1747200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "quotations" SET "status" = 'sent' WHERE "status" = 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "quotations" SET "status" = 'pending' WHERE "status" = 'sent'
    `);
  }
}
