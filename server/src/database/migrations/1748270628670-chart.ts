import { MigrationInterface, QueryRunner } from "typeorm";

export class Chart1748270628670 implements MigrationInterface {
    name = 'Chart1748270628670'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chart" ADD "projectId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chart" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "chart" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "chart" DROP COLUMN "data"`);
        await queryRunner.query(`ALTER TABLE "chart" ADD "data" json NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_648ba3d998ff4f0cd3499df78e" ON "chart" ("userId", "projectId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c02d0e21c088ec4d1523833af8" ON "chart" ("projectId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2a53339469120d3d4dea121f65" ON "chart" ("userId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_2a53339469120d3d4dea121f65"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c02d0e21c088ec4d1523833af8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_648ba3d998ff4f0cd3499df78e"`);
        await queryRunner.query(`ALTER TABLE "chart" DROP COLUMN "data"`);
        await queryRunner.query(`ALTER TABLE "chart" ADD "data" double precision array NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chart" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "chart" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "chart" DROP COLUMN "projectId"`);
    }

}
