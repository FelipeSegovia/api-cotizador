import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoleStatusFlags1748000000000 implements MigrationInterface {
  name = 'AddUserRoleStatusFlags1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "role" character varying(16) NOT NULL DEFAULT 'common'
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "isActive" boolean NOT NULL DEFAULT true
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "mustChangePassword" boolean NOT NULL DEFAULT false
    `);

    const seedEmail = process.env.SEED_EMAIL?.trim().toLowerCase();
    if (seedEmail) {
      await queryRunner.query(
        `UPDATE "users" SET "role" = 'admin' WHERE "email" = $1`,
        [seedEmail],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "mustChangePassword"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "isActive"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "role"
    `);
  }
}
