import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompanyRolesSharedData1756000000000 implements MigrationInterface {
  name = 'CompanyRolesSharedData1756000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Remapear admins de empresa → business
    await queryRunner.query(`
      UPDATE "users"
      SET "role" = 'business'
      WHERE "role" = 'admin' AND "companyId" IS NOT NULL
    `);

    // 2. companies.userId nullable + quitar UNIQUE
    await queryRunner.query(`
      ALTER TABLE "companies"
      DROP CONSTRAINT IF EXISTS "UQ_companies_userId"
    `);
    await queryRunner.query(`
      ALTER TABLE "companies"
      ALTER COLUMN "userId" DROP NOT NULL
    `);

    // 3. Tabla invitations
    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "role" character varying(16) NOT NULL,
        "companyId" uuid NOT NULL,
        "invitedByUserId" uuid NOT NULL,
        "tokenHash" character varying(255) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "acceptedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invitations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_invitations_tokenHash" UNIQUE ("tokenHash"),
        CONSTRAINT "FK_invitations_companyId"
          FOREIGN KEY ("companyId") REFERENCES "companies"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_invitations_invitedByUserId"
          FOREIGN KEY ("invitedByUserId") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_invitations_email" ON "invitations" ("email")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_invitations_companyId" ON "invitations" ("companyId")
    `);

    // 4. quotations.companyId + backfill
    await queryRunner.query(`
      ALTER TABLE "quotations"
      ADD COLUMN "companyId" uuid
    `);
    await queryRunner.query(`
      UPDATE "quotations" q
      SET "companyId" = u."companyId"
      FROM "users" u
      WHERE u.id = q."userId"
    `);
    await queryRunner.query(`
      DELETE FROM "quotations" WHERE "companyId" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "quotations"
      ALTER COLUMN "companyId" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "quotations"
      ADD CONSTRAINT "FK_quotations_companyId"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_quotations_companyId" ON "quotations" ("companyId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_quotations_companyId"
    `);
    await queryRunner.query(`
      ALTER TABLE "quotations"
      DROP CONSTRAINT IF EXISTS "FK_quotations_companyId"
    `);
    await queryRunner.query(`
      ALTER TABLE "quotations"
      DROP COLUMN IF EXISTS "companyId"
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "invitations"`);

    await queryRunner.query(`
      UPDATE "users"
      SET "role" = 'admin'
      WHERE "role" = 'business'
    `);

    // Restaurar NOT NULL solo si no hay NULLs (empresas creadas por admin)
    await queryRunner.query(`
      DELETE FROM "companies" WHERE "userId" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "companies"
      ALTER COLUMN "userId" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD CONSTRAINT "UQ_companies_userId" UNIQUE ("userId")
    `);
  }
}
