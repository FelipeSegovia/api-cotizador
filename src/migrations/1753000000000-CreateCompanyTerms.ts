import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompanyTerms1753000000000 implements MigrationInterface {
  name = 'CreateCompanyTerms1753000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "company_terms" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "terms" jsonb NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_company_terms_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_company_terms_userId" UNIQUE ("userId"),
        CONSTRAINT "FK_company_terms_userId" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "company_terms"`);
  }
}
