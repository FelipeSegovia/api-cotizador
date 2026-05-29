import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFeedbackPriority1750000000000 implements MigrationInterface {
  name = 'AddFeedbackPriority1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "feedbacks"
      ADD COLUMN "priority" character varying(16) NOT NULL DEFAULT 'medium'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "feedbacks" DROP COLUMN "priority"
    `);
  }
}
