# Chiribito — frontend

Vite + TypeScript + PixiJS 7 + GSAP. Real-time client for the Colyseus game server. Renders the table, drives the auth/lobby/room screens, buffers actions through brief disconnects, and stores tokens carefully — but holds no game truth of its own.

For the full architecture see [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

## Quick start

```bash
# from the repo root
cd frontend
npm install
cp .env.example .env       # set VITE_API_URL and VITE_WS_URL
npm run dev                # :5173
```

`VITE_WS_URL` must be `ws://…` in dev and `wss://…` in production.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Vitest test suite |

## Trust boundaries

This client is **not** a trust boundary. Concretely:

- The deck is not in the room state we receive; we cannot peek at upcoming cards even if we try.
- Bets, raises, calls, folds and all-ins are sent as message intent only. The server decides what actually happened and broadcasts the truth.
- Tokens live in `SecureStorage` and are refreshed proactively by `auth/token-monitor`. If a refresh fails, we drop the session and ask the user to re-authenticate rather than guessing.

## Card assets

`public/cards/` currently weighs ~74 MB of WebP. This will be compressed to <3 MB in Sprint 1.5 (script in `scripts/optimize-cards.ts` once written). The high-resolution originals will move out of the repo.
