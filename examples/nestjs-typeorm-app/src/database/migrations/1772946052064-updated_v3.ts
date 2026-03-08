import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedV31772946052064 implements MigrationInterface {
  name = 'UpdatedV31772946052064'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" ADD "description2" text NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "description2"`);
  }

}
