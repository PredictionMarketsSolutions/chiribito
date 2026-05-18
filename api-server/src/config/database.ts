import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { ResetToken } from '../models/ResetToken';
import { AuditEvent } from '../models/AuditEvent';
import 'dotenv/config';

const sslEnabled = process.env.DB_SSL === 'true';

const dbConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  // Accept either DB_USERNAME or DB_USER (older default)
  username: process.env.DB_USERNAME || process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Accept either DB_DATABASE or DB_NAME (older default)
  database: process.env.DB_DATABASE || process.env.DB_NAME,
  // Avoid auto-creating tables when they already exist
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [User, RefreshToken, ResetToken, AuditEvent],
  migrations: [
    process.env.NODE_ENV === 'production'
      ? "dist/migrations/*.js"
      : "src/migrations/*.ts"
  ],
  subscribers: [],
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
};

export const AppDataSource = new DataSource(dbConfig);
