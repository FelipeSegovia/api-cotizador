import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClientTagsAndContacts1757000000000 implements MigrationInterface {
  name = 'ClientTagsAndContacts1757000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clients"
      ADD COLUMN "emails" text[] NOT NULL DEFAULT '{}',
      ADD COLUMN "phones" text[] NOT NULL DEFAULT '{}',
      ADD COLUMN "tags" text[] NOT NULL DEFAULT '{}'
    `);

    await queryRunner.query(`
      UPDATE "clients"
      SET "emails" = ARRAY["email"]
      WHERE "email" IS NOT NULL AND TRIM("email") <> ''
    `);

    await queryRunner.query(`
      UPDATE "clients"
      SET "phones" = ARRAY["phone"]
      WHERE "phone" IS NOT NULL AND TRIM("phone") <> ''
    `);

    await queryRunner.query(`
      ALTER TABLE "clients"
      DROP COLUMN "email",
      DROP COLUMN "phone"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clients"
      ADD COLUMN "email" character varying(255),
      ADD COLUMN "phone" character varying(64)
    `);

    await queryRunner.query(`
      UPDATE "clients"
      SET "email" = "emails"[1]
      WHERE cardinality("emails") >= 1
    `);

    await queryRunner.query(`
      UPDATE "clients"
      SET "phone" = "phones"[1]
      WHERE cardinality("phones") >= 1
    `);

    await queryRunner.query(`
      ALTER TABLE "clients"
      DROP COLUMN "emails",
      DROP COLUMN "phones",
      DROP COLUMN "tags"
    `);
  }
}
