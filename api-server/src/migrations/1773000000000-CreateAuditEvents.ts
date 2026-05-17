import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAuditEvents1773000000000 implements MigrationInterface {
  name = 'CreateAuditEvents1773000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()'
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '64',
            isNullable: false
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: true
          },
          {
            name: 'payload',
            type: 'jsonb',
            default: "'{}'::jsonb",
            isNullable: false
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false
          }
        ]
      })
    );

    await queryRunner.createIndex(
      'audit_events',
      new TableIndex({
        name: 'idx_audit_events_event_type_created_at',
        columnNames: ['event_type', 'created_at']
      })
    );

    await queryRunner.createIndex(
      'audit_events',
      new TableIndex({
        name: 'idx_audit_events_user_id_created_at',
        columnNames: ['user_id', 'created_at']
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('audit_events', 'idx_audit_events_user_id_created_at');
    await queryRunner.dropIndex('audit_events', 'idx_audit_events_event_type_created_at');
    await queryRunner.dropTable('audit_events');
  }
}
