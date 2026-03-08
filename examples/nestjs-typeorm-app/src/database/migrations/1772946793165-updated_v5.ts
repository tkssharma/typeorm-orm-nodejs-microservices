import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedV51772946793165 implements MigrationInterface {
  name = 'UpdatedV51772946793165'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "reviews" ("id" SERIAL NOT NULL, "rating" integer NOT NULL, "title" character varying(255), "content" text, "isVerified" boolean NOT NULL DEFAULT false, "userId" integer NOT NULL, "postId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "description2"`);
    await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_11135032353b5ff06fdb8431263" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_11135032353b5ff06fdb8431263"`);
    await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f"`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "description2" text NOT NULL`);
    await queryRunner.query(`DROP TABLE "reviews"`);
  }

}
