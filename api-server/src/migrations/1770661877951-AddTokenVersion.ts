import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddTokenVersion1770661877951 implements MigrationInterface {
    name = 'AddTokenVersion1770661877951'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "users",
            new TableColumn({
                name: "token_version",
                type: "int",
                isNullable: false,
                default: "0"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("users", "token_version");
    }

}
