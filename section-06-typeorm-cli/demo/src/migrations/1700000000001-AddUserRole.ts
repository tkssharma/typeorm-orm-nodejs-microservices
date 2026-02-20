import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRole1700000000001 implements MigrationInterface {
  name = "AddUserRole1700000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for roles
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('admin', 'editor', 'viewer')
    `);

    // Add role column to users table
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "role" "user_role_enum" NOT NULL DEFAULT 'viewer'
    `);

    console.log("✅ Added role column to users table");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove role column
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "role"
    `);

    // Drop enum type
    await queryRunner.query(`
      DROP TYPE "user_role_enum"
    `);

    console.log("✅ Removed role column from users table");
  }
}
