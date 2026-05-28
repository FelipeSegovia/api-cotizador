import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeedbacks1749000000000 implements MigrationInterface {
  name = 'CreateFeedbacks1749000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "feedbacks" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "userEmail" character varying(255) NOT NULL,
        "title" character varying(255) NOT NULL,
        "category" character varying(32) NOT NULL,
        "description" text NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedbacks_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_feedbacks_userId" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_feedbacks_userId" ON "feedbacks" ("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feedbacks_userId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feedbacks"`);
  }
}
