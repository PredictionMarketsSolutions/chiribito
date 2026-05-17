import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * Persistent audit log for security-relevant events.
 *
 * Write paths: authWrite() helper. Never thrown from — best-effort.
 * Read paths: ops queries, future admin UI.
 *
 * `payload` is opaque JSON. Avoid storing sensitive fields (tokens,
 * password hashes, full headers). IP / UA columns are first-class so
 * indexes work without touching JSON.
 */
@Entity('audit_events')
@Index(['eventType', 'createdAt'])
@Index(['userId', 'createdAt'])
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event_type', type: 'varchar', length: 64 })
  eventType!: string;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId?: number | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  payload!: Record<string, unknown>;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress?: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
