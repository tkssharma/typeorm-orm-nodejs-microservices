import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPostViews1700000000002 implements MigrationInterface {
  name = "AddPostViews1700000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add views column to posts table
    await queryRunner.query(`
      ALTER TABLE "posts"
      ADD COLUMN "views" integer NOT NULL DEFAULT 0
    `);

    // Add publishedAt column
    await queryRunner.query(`
      ALTER TABLE "posts"
      ADD COLUMN "publishedAt" TIMESTAMP
    `);

    console.log("✅ Added views and publishedAt columns to posts table");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "publishedAt"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "views"`);

    console.log("✅ Removed views and publishedAt columns from posts table");
  }
}
