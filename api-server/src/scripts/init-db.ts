import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

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
  const port = parseInt(process.env.DB_PORT || '3306');

  // These credentials will be used to connect and create DB/user.
  // Prefer explicit root creds if provided, else fall back to DB_USER.
  const rootUser = process.env.DB_ROOT_USER || process.env.DB_USER;
  const rootPassword = process.env.DB_ROOT_PASSWORD || process.env.DB_PASSWORD;

  const dbName = process.env.DB_DATABASE || process.env.DB_NAME || 'PokerBase';
  const dbUser = process.env.DB_USERNAME || process.env.DB_USER || 'root';
  const dbPass = process.env.DB_PASSWORD || '';

  if (!rootUser) {
    console.error('No DB root user provided (DB_ROOT_USER or DB_USER). Aborting.');
    process.exit(1);
  }

  try {
    const conn = await mysql.createConnection({ host, port, user: rootUser, password: rootPassword });
    console.log(`Connected to MySQL as ${rootUser}@${host}:${port}`);

    // Create database if not exists
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`Database ${dbName} ensured`);

    // Create user if not exists (MySQL 5.7+ supports IF NOT EXISTS)
    if (dbUser !== rootUser) {
      try {
        await conn.query(`CREATE USER IF NOT EXISTS '${dbUser}'@'%' IDENTIFIED BY ?;`, [dbPass]);
        console.log(`User ${dbUser} ensured`);
      } catch (e) {
        // Might fail on older MySQL versions, try fallback: GRANT ... IDENTIFIED BY
        console.warn('CREATE USER failed, attempting GRANT fallback');
        await conn.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'%' IDENTIFIED BY ?;`, [dbPass]);
        console.log(`GRANT privileges to ${dbUser}`);
      }

      // Grant privileges to user on the database
      await conn.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'%';`);
      await conn.query('FLUSH PRIVILEGES;');
      console.log(`Privileges granted to ${dbUser} on ${dbName}`);
    }

    await conn.end();
    console.log('Database initialization complete.');
    process.exit(0);
  } catch (err: any) {
    console.error('Failed to initialize database', err.message || err);
    process.exit(1);
  }
}

main();
