import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../models/User';
import 'dotenv/config';

const dbConfig: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  // Accept either DB_USERNAME or DB_USER (older default)
  username: process.env.DB_USERNAME || process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Accept either DB_DATABASE or DB_NAME (older default)
  database: process.env.DB_DATABASE || process.env.DB_NAME,
  // Avoid auto-creating tables when they already exist in MySQL
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [User],
  migrations: ["src/migrations/*.ts"],
  subscribers: [],
};

export const AppDataSource = new DataSource(dbConfig);
