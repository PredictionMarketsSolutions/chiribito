import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateResetTokensTable1704067300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "reset_tokens",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "user_id",
            type: "integer",
            isNullable: false,
          },
          {
            name: "token",
            type: "text",
            isNullable: false,
          },
          {
            name: "expires_at",
            type: "timestamp",
            isNullable: false,
          },
          {
            name: "used",
            type: "boolean",
            default: false,
          },
          {
            name: "used_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "ip_address",
            type: "varchar",
            length: "45",
            isNullable: true,
          },
          {
            name: "user_agent",
            type: "text",
            isNullable: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ["user_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            onDelete: "CASCADE",
          }),
        ],
      })
    );

    // Create indexes
    await queryRunner.createIndex(
      "reset_tokens",
      new TableIndex({
        columnNames: ["token"],
        isUnique: false,
      })
    );

    await queryRunner.createIndex(
      "reset_tokens",
      new TableIndex({
        columnNames: ["user_id", "used"],
        isUnique: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("reset_tokens");
  }
}
