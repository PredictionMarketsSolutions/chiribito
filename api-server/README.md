# Chiribito — API server

Express 4 + TypeORM + PostgreSQL + Redis. Handles authentication, user management, password reset, top-winners ranking and server-to-server stats writes from the game server.

For the full architecture and endpoint list see [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

## Quick start

```bash
# from the repo root
cd api-server
npm install
cp .env.example .env       # fill in JWT_SECRET, DB_*, RESEND_API_KEY, INTERNAL_API_SECRET, REDIS_URL
npm run init-db            # creates the database if missing (uses DB_ROOT_USER/PASSWORD if set)
npm run migration:run
npm run dev                # :3000
```

In production, `npm start` runs `dist/index.js`; migrations are applied via `npm run start:migrate` before boot.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | ts-node-dev with watch reload |
| `npm run build` | `tsc` to `dist/` |
| `npm start` | Run compiled output |
| `npm test` | Jest suite (controllers + middleware + services) |
| `npm run migration:generate -- src/migrations/<Name>` | Generate a new TypeORM migration |
| `npm run migration:run` | Apply pending migrations |
| `npm run init-db` | One-shot `CREATE DATABASE` (only run on a fresh host) |

## What goes here vs the game server

Anything that touches PostgreSQL (`users`, `refresh_tokens`, `reset_tokens`) or the ranking cache belongs here. Anything about the deck, hands, betting state or live rooms belongs in the Colyseus server at the repo root. See [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md#source-of-truth--who-owns-what) for the ownership table.
