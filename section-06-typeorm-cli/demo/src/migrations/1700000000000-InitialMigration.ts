import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1700000000000 implements MigrationInterface {
  name = "InitialMigration1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "firstName" varchar(100) NOT NULL,
        "lastName" varchar(100) NOT NULL,
        "email" varchar(255) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create posts table
    await queryRunner.query(`
      CREATE TABLE "posts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" varchar(255) NOT NULL,
        "content" text,
        "published" boolean NOT NULL DEFAULT false,
        "authorId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_posts" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "posts"
      ADD CONSTRAINT "FK_posts_author"
      FOREIGN KEY ("authorId")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Create index on posts.authorId for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_posts_authorId" ON "posts" ("authorId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX "IDX_posts_authorId"`);

    // Drop foreign key
    await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_author"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
