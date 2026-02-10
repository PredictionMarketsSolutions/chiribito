# Chiri Backend - Local Run Guide

This repo contains:

- **Colyseus game server** (port 2567)
- **API server (Express + Postgres)** (port 3000)
- **Pixi.js test frontend** (port 5173)

## Prerequisites

- Node.js 18+ (for built-in `fetch`)
- Postgres running locally

Optional:
- pgAdmin or psql for creating the local database

## Environment files

### Root `.env` (Colyseus)

```
PORT=2567
JWT_SECRET=your_secret_here
```

### `api-server/.env` (API)

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=StrongPassw0rd!
DB_NAME=PokerBase
DB_SSL=false
JWT_SECRET=your_secret_here
NODE_ENV=development
```

### `frontend/.env` (Frontend)

```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:2567
```

### First-time local DB setup

Create the database (one time):

```
psql -U postgres
CREATE DATABASE "PokerBase";
\q
```

Run migrations:

```
cd C:\project-chiribito-test-backend\Chiri-backend\api-server
npm run migration:run -- -d src/config/database.ts
```

## Start locally

Open **three terminals**:

### 1) API server

```
cd C:\project-chiribito-test-backend\Chiri-backend\api-server
npm run dev
```

### 2) Colyseus server

```
cd C:\project-chiribito-test-backend\Chiri-backend
npm run dev
```

### 3) Frontend (Pixi test client)

```
cd C:\project-chiribito-test-backend\Chiri-backend\frontend
npm install
npm run dev
```

Open `http://localhost:5173` and use **Register/Login → Join Table**.

## Endpoints

- API: `http://localhost:3000`
- Colyseus: `ws://localhost:2567`
- Playground: `http://localhost:2567/playground`
- Monitor: `http://localhost:2567/colyseus`

## Render deployment (summary)

- API (web): build `npm install && npm run build`, start `npm run start:migrate`
- Colyseus (web): build `npm install && npm run build:game`, start `npm start`
- Frontend (static): build `npm install && npm run build`, publish `dist`

Frontend env vars on Render:

```
VITE_API_URL=https://<api-service>.onrender.com
VITE_WS_URL=wss://<colyseus-service>.onrender.com
```

## Common issues

- `EADDRINUSE`: another process is using the port. Stop it or change `PORT`.
- `ECONNREFUSED`: server not running or wrong port.
- Postgres access denied: verify `DB_USER/DB_PASSWORD` in `api-server/.env`.
