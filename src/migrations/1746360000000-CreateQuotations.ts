import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQuotations1746360000000 implements MigrationInterface {
  name = 'CreateQuotations1746360000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "quotations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "clientName" character varying(255) NOT NULL,
        "clientRut" character varying(32),
        "clientEmail" character varying(255),
        "projectTitle" character varying(255),
        "projectDeadline" character varying(32),
        "projectNotes" text,
        "status" character varying(32) NOT NULL DEFAULT 'draft',
        "total" numeric(14,2) NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quotations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_quotations_userId" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_quotations_userId" ON "quotations" ("userId")
    `);

    await queryRunner.query(`
      CREATE TABLE "quotation_items" (
        "quotationId" uuid NOT NULL,
        "id" character varying(64) NOT NULL,
        "position" integer NOT NULL,
        "description" text NOT NULL,
        "quantity" integer NOT NULL,
        "unitPrice" numeric(14,2) NOT NULL,
        "subtotal" numeric(14,2) NOT NULL,
        CONSTRAINT "PK_quotation_items" PRIMARY KEY ("quotationId", "id"),
        CONSTRAINT "FK_quotation_items_quotationId" FOREIGN KEY ("quotationId")
          REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_quotation_items_quotationId"
        ON "quotation_items" ("quotationId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_quotation_items_quotationId"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "quotation_items"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_quotations_userId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quotations"`);
  }
}
