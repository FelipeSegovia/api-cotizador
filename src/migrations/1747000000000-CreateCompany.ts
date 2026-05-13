import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompany1747000000000 implements MigrationInterface {
  name = 'CreateCompany1747000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "rut" character varying(32) NOT NULL,
        "address" character varying(500),
        "city" character varying(255),
        "contact" character varying(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_companies_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_companies_userId" UNIQUE ("userId"),
        CONSTRAINT "FK_companies_userId" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "companies"`);
  }
}
