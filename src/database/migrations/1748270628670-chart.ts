import { MigrationInterface, QueryRunner } from "typeorm";

export class Chart1748300000000 implements MigrationInterface {
    name = 'Chart1748300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const projectIdExists = await queryRunner.hasColumn('chart', 'projectId');
        if (!projectIdExists) {
            await queryRunner.query(`ALTER TABLE "chart" ADD "projectId" character varying NOT NULL DEFAULT ''`);
        }

        const createdAtExists = await queryRunner.hasColumn('chart', 'createdAt');
        if (!createdAtExists) {
            await queryRunner.query(`ALTER TABLE "chart" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        }

        const updatedAtExists = await queryRunner.hasColumn('chart', 'updatedAt');
        if (!updatedAtExists) {
            await queryRunner.query(`ALTER TABLE "chart" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        }

        const dataExists = await queryRunner.hasColumn('chart', 'data');
        if (dataExists) {
            await queryRunner.query(`UPDATE "chart" SET "data" = '[]' WHERE "data" IS NULL`);
            await queryRunner.query(`ALTER TABLE "chart" ALTER COLUMN "data" SET NOT NULL`);
        } else {
            await queryRunner.query(`ALTER TABLE "chart" ADD "data" json NOT NULL DEFAULT '[]'`);
        }

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_chart_user_project" ON "chart" ("userId", "projectId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_chart_project" ON "chart" ("projectId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_chart_user" ON "chart" ("userId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

    }
}
