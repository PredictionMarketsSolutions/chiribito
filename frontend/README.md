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

`public/cards/` weighs **~2.9 MB** for the full 28-card Chiribito deck (Sprint 1.5). Every face card is re-encoded to a max width of 800 px at WebP quality 85 — plenty for retina-quality rendering at the on-screen card sizes the game uses, and a 95% reduction from the print-resolution originals the heredado repo shipped.

To re-run the optimisation (e.g. after adding new art):

```bash
npm run optimize:cards                 # writes in place
npm run optimize:cards -- --dry-run    # report only
npm run optimize:cards -- --width 1200 --quality 90   # custom
```

The script (`scripts/optimize-cards.ts`) skips `back.svg` and `back_logo.png` on purpose.
