import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedV21772946052034 implements MigrationInterface {
    name = 'UpdatedV21772946052034'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ADD "description" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "description"`);
    }

}
