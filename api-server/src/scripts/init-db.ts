import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Client } from 'pg';

// Load .env from api-server or from repo root
const apiServerEnv = path.resolve(process.cwd(), '.env');
const rootEnv = path.resolve(process.cwd(), '..', '.env');

if (fs.existsSync(apiServerEnv)) {
  dotenv.config({ path: apiServerEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config();
}

async function main() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432');
  const sslEnabled = process.env.DB_SSL === 'true';

  // These credentials will be used to connect and create DB.
  const rootUser = process.env.DB_ROOT_USER || process.env.DB_USER || 'postgres';
  const rootPassword = process.env.DB_ROOT_PASSWORD || process.env.DB_PASSWORD || '';

  const dbName = process.env.DB_DATABASE || process.env.DB_NAME || 'PokerBase';
  const rootDatabase = process.env.DB_ROOT_DATABASE || 'postgres';

  try {
    const client = new Client({
      host,
      port,
      user: rootUser,
      password: rootPassword,
      database: rootDatabase,
      ssl: sslEnabled ? { rejectUnauthorized: false } : undefined
    });
    await client.connect();
    console.log(`Connected to Postgres as ${rootUser}@${host}:${port}`);

    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}";`);
      console.log(`Database ${dbName} created`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }

    await client.end();
    console.log('Database initialization complete.');
    process.exit(0);
  } catch (err: any) {
    console.error('Failed to initialize database', err.message || err);
    process.exit(1);
  }
}

main();
