import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetCodes1752000000000 implements MigrationInterface {
  name = 'CreatePasswordResetCodes1752000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "password_reset_codes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "codeHash" character varying(255) NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "used" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_reset_codes_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_password_reset_codes_userId" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_password_reset_codes_userId"
      ON "password_reset_codes" ("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_password_reset_codes_userId"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_codes"`);
  }
}
