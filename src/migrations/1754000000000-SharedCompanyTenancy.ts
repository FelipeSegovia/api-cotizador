import { MigrationInterface, QueryRunner } from 'typeorm';

export class SharedCompanyTenancy1754000000000 implements MigrationInterface {
  name = 'SharedCompanyTenancy1754000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "companyId" uuid
    `);

    await queryRunner.query(`
      UPDATE "users" u
      SET "companyId" = c.id
      FROM "companies" c
      WHERE c."userId" = u.id
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_companyId"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_companyId" ON "users" ("companyId")
    `);

    await queryRunner.query(`
      ALTER TABLE "company_terms"
      ADD COLUMN "companyId" uuid
    `);

    await queryRunner.query(`
      UPDATE "company_terms" ct
      SET "companyId" = c.id
      FROM "companies" c
      WHERE c."userId" = ct."userId"
    `);

    await queryRunner.query(`
      DELETE FROM "company_terms" WHERE "companyId" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "company_terms"
      ALTER COLUMN "companyId" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "company_terms"
      DROP CONSTRAINT "FK_company_terms_userId"
    `);

    await queryRunner.query(`
      ALTER TABLE "company_terms"
      DROP CONSTRAINT "UQ_company_terms_userId"
    `);

    await queryRunner.query(`
      ALTER TABLE "company_terms"
      DROP COLUMN "userId"
    `);

    await queryRunner.query(`
      ALTER TABLE "company_terms"
      ADD CONSTRAINT "UQ_company_terms_companyId" UNIQUE ("companyId")
    `);

    await queryRunner.query(`
      ALTER TABLE "company_terms"
      ADD CONSTRAINT "FK_company_terms_companyId"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "company_terms"
      DROP CONSTRAINT "FK_company_terms_companyId"
    `);

    await queryRunner.query(`
      ALTER TABLE "company_terms"
      DROP CONSTRAINT "UQ_company_terms_companyId"
    `);

    await queryRunner.query(`
      ALTER TABLE "company_terms"
      ADD COLUMN "userId" uuid
    `);

    await queryRunner.query(`
      UPDATE "company_terms" ct
      SET "userId" = c."userId"
      FROM "companies" c
      WHERE c.id = ct."companyId"
    `);

    await queryRunner.query(`
      DELETE FROM "company_terms" WHERE "userId" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "company_terms"
      ALTER COLUMN "userId" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "company_terms"
      DROP COLUMN "companyId"
    `);

    await queryRunner.query(`
      ALTER TABLE "company_terms"
      ADD CONSTRAINT "UQ_company_terms_userId" UNIQUE ("userId")
    `);

    await queryRunner.query(`
      ALTER TABLE "company_terms"
      ADD CONSTRAINT "FK_company_terms_userId"
        FOREIGN KEY ("userId") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_companyId"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP CONSTRAINT "FK_users_companyId"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "companyId"
    `);
  }
}
