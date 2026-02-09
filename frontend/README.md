# Pixi Test Client

This folder contains a basic Pixi.js frontend to test login and joining a Colyseus room.

## Prerequisites

- Node.js 18+ (for built-in `fetch`)
- API server running on port 3000
- Colyseus server running on port 2567

## Environment

Optional env vars (use a `.env` file or shell env vars when running Vite):

- `VITE_API_URL` (default: `http://localhost:3000`)
- `VITE_WS_URL` (default: `ws://localhost:2567`)

Example `.env` (frontend/.env):

```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:2567
```

## Run locally

In three terminals:

1) API server:

```
cd C:\project-chiribito-test-backend\Chiri-backend\api-server
npm run dev
```

2) Colyseus server:

```
cd C:\project-chiribito-test-backend\Chiri-backend
npm run dev
```

3) Frontend:

```
cd C:\project-chiribito-test-backend\Chiri-backend\frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Basic flow

1) Register or Login
2) Join Table
3) Use action buttons (start game, bet, raise, call, check, fold)

## Troubleshooting

- If you get `EADDRINUSE` on 3000 or 2567, check which process is using the port.
- If join fails, ensure the API and Colyseus servers are running.
