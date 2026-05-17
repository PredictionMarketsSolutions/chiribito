/**
 * Local dev stack — no Docker required.
 *
 * Boots an embedded Postgres + spawns api-server, game server and frontend
 * with shared env vars. Redis is intentionally unset: both servers fall back
 * to in-memory stores in development (see api-server/src/index.ts:231 and
 * src/app.config.ts:162).
 *
 * Why: Docker Desktop has an orphan AF_UNIX reparse point in dockerInference
 * that requires a Windows reboot to clear. This script is a fallback path.
 *
 * Run: npm run dev:stack
 */

import { spawn, type ChildProcess } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import EmbeddedPostgres from 'embedded-postgres';

const ROOT = resolve(__dirname, '..');
const DATA_DIR = join(ROOT, '.dev-stack', 'pg-data');

const PG_PORT = 5432;
const PG_USER = 'chiribito';
const PG_PASSWORD = 'chiribito';
const PG_DB = 'chiribito';

const SHARED_ENV: NodeJS.ProcessEnv = {
  ...process.env,
  NODE_ENV: 'development',
  DB_HOST: 'localhost',
  DB_PORT: String(PG_PORT),
  DB_USER: PG_USER,
  DB_USERNAME: PG_USER,
  DB_PASSWORD: PG_PASSWORD,
  DB_NAME: PG_DB,
  DB_DATABASE: PG_DB,
  DB_SSL: 'false',
  REDIS_URL: '',
  REDIS_PREFIX: 'chiribito',
  JWT_SECRET: 'local-dev-only-not-for-production-9f3a7e2b1c8d4e5f',
  INTERNAL_API_SECRET: 'local-dev-internal-secret-2e8a4d7b9c1f3e5a',
  API_URL: 'http://localhost:3000',
  FRONTEND_URL: 'http://localhost:5173',
  ALLOWED_ORIGINS: 'http://localhost:5173',
  RESEND_API_KEY: '',
  RESEND_FROM_EMAIL: 'no-reply@chiribito.local',
  LOG_LEVEL: 'info',
};

const COLORS = {
  api: '\x1b[36m',
  game: '\x1b[33m',
  front: '\x1b[35m',
  pg: '\x1b[32m',
  stack: '\x1b[1;37m',
  reset: '\x1b[0m',
} as const;

type Tag = keyof typeof COLORS;

function log(tag: Tag, message: string): void {
  process.stdout.write(`${COLORS[tag]}[${tag}]${COLORS.reset} ${message}\n`);
}

function lineForward(prefix: string, stream: NodeJS.WritableStream): (chunk: Buffer) => void {
  let buffer = '';
  return (chunk: Buffer): void => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      stream.write(`${prefix} ${line}\n`);
    }
  };
}

let pg: EmbeddedPostgres | null = null;
const children: ChildProcess[] = [];
let shuttingDown = false;

async function shutdown(reason: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  log('stack', `Shutting down (${reason})...`);

  for (const child of children) {
    try {
      child.kill('SIGTERM');
    } catch {
      // best effort
    }
  }

  await new Promise(r => setTimeout(r, 3000));

  if (pg) {
    try {
      await pg.stop();
      log('pg', 'stopped');
    } catch (err) {
      log('stack', `PG stop error: ${(err as Error).message}`);
    }
  }

  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('uncaughtException', err => {
  console.error('uncaughtException:', err);
  void shutdown('uncaughtException');
});

function spawnService(
  name: Tag,
  command: string,
  args: string[],
  cwd: string,
  extraEnv: NodeJS.ProcessEnv = {},
): ChildProcess {
  const child = spawn(command, args, {
    cwd,
    env: { ...SHARED_ENV, ...extraEnv },
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const prefix = `${COLORS[name]}[${name}]${COLORS.reset}`;
  child.stdout?.on('data', lineForward(prefix, process.stdout));
  child.stderr?.on('data', lineForward(prefix, process.stderr));
  child.on('exit', code => {
    log('stack', `${name} exited with code ${code}`);
    if (!shuttingDown && code !== 0 && code !== null) {
      void shutdown(`${name} crashed`);
    }
  });

  children.push(child);
  return child;
}

function runOnce(
  name: Tag,
  command: string,
  args: string[],
  cwd: string,
  extraEnv: NodeJS.ProcessEnv = {},
): Promise<void> {
  return new Promise((resolveP, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...SHARED_ENV, ...extraEnv },
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const prefix = `${COLORS[name]}[${name}]${COLORS.reset}`;
    child.stdout?.on('data', lineForward(prefix, process.stdout));
    child.stderr?.on('data', lineForward(prefix, process.stderr));
    child.on('exit', code => {
      if (code === 0) resolveP();
      else reject(new Error(`${name} step exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function main(): Promise<void> {
  log('stack', 'Booting Chiribito dev stack (no Docker)');

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  const firstRun = !existsSync(join(DATA_DIR, 'PG_VERSION'));

  pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: PG_USER,
    password: PG_PASSWORD,
    port: PG_PORT,
    persistent: true,
  });

  if (firstRun) {
    log('pg', 'First-time setup: downloading and initializing cluster (this takes ~30-60s)...');
    await pg.initialise();
  }

  log('pg', `Starting on port ${PG_PORT}...`);
  await pg.start();

  try {
    await pg.createDatabase(PG_DB);
    log('pg', `Database '${PG_DB}' created`);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('already exists') || msg.includes('duplicate')) {
      log('pg', `Database '${PG_DB}' reused`);
    } else {
      throw err;
    }
  }

  log('stack', 'Running api-server migrations...');
  await runOnce(
    'api',
    'npm',
    ['run', 'migration:run', '--', '-d', 'src/config/database.ts'],
    join(ROOT, 'api-server'),
  );
  log('stack', 'Migrations complete');

  log('stack', 'Spawning services...');
  spawnService('api', 'npm', ['run', 'dev'], join(ROOT, 'api-server'), { PORT: '3000' });
  spawnService('game', 'npm', ['run', 'dev'], ROOT, { PORT: '2567' });
  spawnService('front', 'npm', ['run', 'dev'], join(ROOT, 'frontend'));

  setTimeout(() => {
    console.log('');
    console.log('  +------------------------------------------------+');
    console.log('  |  Chiribito dev stack -- running                |');
    console.log('  |                                                |');
    console.log('  |  Frontend: http://localhost:5173               |');
    console.log('  |  API:      http://localhost:3000 (/health)     |');
    console.log('  |  Game WS:  ws://localhost:2567                 |');
    console.log('  |  Monitor:  http://localhost:2567/colyseus      |');
    console.log('  |  Postgres: localhost:5432 (chiribito/chiribito)|');
    console.log('  |  Redis:    in-memory fallback (no real Redis)  |');
    console.log('  |                                                |');
    console.log('  |  Ctrl+C to stop everything cleanly             |');
    console.log('  +------------------------------------------------+');
    console.log('');
  }, 5000);
}

main().catch(err => {
  console.error('[stack] Fatal:', err);
  void shutdown('fatal');
});
