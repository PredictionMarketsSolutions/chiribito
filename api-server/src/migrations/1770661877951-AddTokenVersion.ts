import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenVersion1770661877951 implements MigrationInterface {
    name = 'AddTokenVersion1770661877951'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`token_version\` int NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`token_version\``);
    }

}
