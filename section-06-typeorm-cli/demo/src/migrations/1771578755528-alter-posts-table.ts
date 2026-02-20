import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterPostsTable1771578755528 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "posts"
      ADD COLUMN "tags" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "posts"
      DROP COLUMN "tags"
    `);
  }

}
