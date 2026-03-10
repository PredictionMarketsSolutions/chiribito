import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 50 })
  username!: string;

  @Column({ unique: true, length: 100 })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ name: 'token_version', default: 0 })
  tokenVersion!: number;

  @Column({ name: 'games_played', type: 'int', default: 0 })
  gamesPlayed!: number;

  @Column({ name: 'games_won', type: 'int', default: 0 })
  gamesWon!: number;

  @Column({ name: 'total_chips_won', type: 'bigint', default: 0 })
  totalChipsWon!: number;

  @Column({ name: 'last_played_at', type: 'timestamp', nullable: true })
  lastPlayedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  async setPassword(password: string): Promise<void> {
    this.passwordHash = await bcrypt.hash(password, 10);
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }
}
