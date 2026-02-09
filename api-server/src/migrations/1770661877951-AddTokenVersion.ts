import { MigrationInterface, QueryRunner, Table, TableColumn } from "typeorm";

export class AddTokenVersion1770661877951 implements MigrationInterface {
    name = 'AddTokenVersion1770661877951'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasUsersTable = await queryRunner.hasTable("users");
        if (!hasUsersTable) {
            await queryRunner.createTable(
                new Table({
                    name: "users",
                    columns: [
                        {
                            name: "id",
                            type: "int",
                            isPrimary: true,
                            isGenerated: true,
                            generationStrategy: "increment"
                        },
                        {
                            name: "username",
                            type: "varchar",
                            length: "50",
                            isNullable: false,
                            isUnique: true
                        },
                        {
                            name: "email",
                            type: "varchar",
                            length: "100",
                            isNullable: false,
                            isUnique: true
                        },
                        {
                            name: "password_hash",
                            type: "varchar",
                            isNullable: false
                        },
                        {
                            name: "token_version",
                            type: "int",
                            isNullable: false,
                            default: "0"
                        },
                        {
                            name: "created_at",
                            type: "timestamp",
                            default: "now()"
                        },
                        {
                            name: "updated_at",
                            type: "timestamp",
                            default: "now()"
                        }
                    ]
                })
            );
            return;
        }

        const hasTokenVersion = await queryRunner.hasColumn("users", "token_version");
        if (!hasTokenVersion) {
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("users", "token_version");
    }

}
