import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../models/User';
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
  entities: [User],
  migrations: ["src/migrations/*.ts"],
  subscribers: [],
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
};

export const AppDataSource = new DataSource(dbConfig);
