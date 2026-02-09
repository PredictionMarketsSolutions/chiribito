# Chiri Backend - Local Run Guide

This repo contains:

- **Colyseus game server** (port 2567)
- **API server (Express + MySQL)** (port 3000)
- **Pixi.js test frontend** (port 5173)

## Prerequisites

- Node.js 18+ (for built-in `fetch`)
- MySQL running locally

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
DB_PORT=3306
DB_USER=poker_user
DB_PASSWORD=StrongPassw0rd!
DB_NAME=PokerBase
JWT_SECRET=your_secret_here
NODE_ENV=development
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

## Common issues

- `EADDRINUSE`: another process is using the port. Stop it or change `PORT`.
- `ECONNREFUSED`: server not running or wrong port.
- MySQL access denied: verify `DB_USER/DB_PASSWORD` in `api-server/.env`.
