import { MigrationInterface, QueryRunner, Table } from "typeorm";

/**
 * Creates the users table. Must run before CreateRefreshTokensTable and CreateResetTokensTable
 * (they reference users.id). For a fresh DB, this runs first; AddTokenVersion and
 * AddPlayerStatsToUsers add the remaining columns.
 */
export class CreateUsersTable1704067100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasUsersTable = await queryRunner.hasTable("users");
    if (hasUsersTable) return;

    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "username",
            type: "varchar",
            length: "50",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "email",
            type: "varchar",
            length: "100",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "password_hash",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
            isNullable: false,
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
            isNullable: false,
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("users", true);
  }
}
