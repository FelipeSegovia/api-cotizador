import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClients1755000000000 implements MigrationInterface {
  name = 'CreateClients1755000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "companyId" uuid NOT NULL,
        "createdByUserId" uuid,
        "name" character varying(255) NOT NULL,
        "website" character varying(500),
        "email" character varying(255),
        "phone" character varying(64),
        "status" character varying(32) NOT NULL DEFAULT 'not_contacted',
        "contacts" jsonb NOT NULL DEFAULT '{"email":false,"phone":false,"whatsapp":false}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clients_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_clients_companyId" FOREIGN KEY ("companyId")
          REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_clients_createdByUserId" FOREIGN KEY ("createdByUserId")
          REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_clients_companyId" ON "clients" ("companyId")
    `);

    await queryRunner.query(`
      CREATE TABLE "client_activities" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "clientId" uuid NOT NULL,
        "type" character varying(32) NOT NULL,
        "message" text NOT NULL,
        "createdByName" character varying(255),
        "meta" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_client_activities_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_client_activities_clientId" FOREIGN KEY ("clientId")
          REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_client_activities_clientId"
        ON "client_activities" ("clientId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_client_activities_clientId"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "client_activities"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clients_companyId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clients"`);
  }
}
