import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPlayerStatsToUsers1772000000000 implements MigrationInterface {
  name = "AddPlayerStatsToUsers1772000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasUsersTable = await queryRunner.hasTable("users");
    if (!hasUsersTable) {
      return;
    }

    const columns: TableColumn[] = [
      new TableColumn({
        name: "games_played",
        type: "int",
        isNullable: false,
        default: "0",
      }),
      new TableColumn({
        name: "games_won",
        type: "int",
        isNullable: false,
        default: "0",
      }),
      new TableColumn({
        name: "total_chips_won",
        type: "bigint",
        isNullable: false,
        default: "0",
      }),
      new TableColumn({
        name: "last_played_at",
        type: "timestamp",
        isNullable: true,
      }),
    ];

    for (const column of columns) {
      const exists = await queryRunner.hasColumn("users", column.name);
      if (!exists) {
        await queryRunner.addColumn("users", column);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasUsersTable = await queryRunner.hasTable("users");
    if (!hasUsersTable) {
      return;
    }

    const columnNames = ["games_played", "games_won", "total_chips_won", "last_played_at"];
    for (const name of columnNames) {
      const exists = await queryRunner.hasColumn("users", name);
      if (exists) {
        await queryRunner.dropColumn("users", name);
      }
    }
  }
}

