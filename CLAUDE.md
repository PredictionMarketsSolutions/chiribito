# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Repo layout

Three independent packages in a single repository:

| Package | Root | Purpose |
|---------|------|---------|
| Game server | `/` (root) | Colyseus WebSocket game server |
| API server | `api-server/` | Express REST API — auth, player stats |
| Frontend | `frontend/` | Vite/TypeScript vanilla client |

---

## Commands

### Game server (root)
```bash
npm run dev            # tsx watch — hot reload
npm run build          # tsc + api-server build
npm run build:game     # tsc only
npm test               # Jest (all game server tests, --runInBand)
npm run test:jest      # same
npm run test:jest:watch
```

### API server
```bash
npm run dev:api        # cd api-server && npm run dev
npm run build:api
cd api-server && npm test
```

### Frontend
```bash
cd frontend && npm run dev      # Vite dev server
cd frontend && npm run build
cd frontend && npm test         # Vitest (run once)
cd frontend && npm run test:watch
```

### Utilities (root)
```bash
npm run lint           # ESLint
npm run format         # Prettier (src/ + api-server/src/)
npm run format:check
```

### Run a single test file
```bash
# Game server (Jest)
npx jest src/__tests__/game/WinnerDeterminator.test.ts --runInBand

# Frontend (Vitest)
cd frontend && npx vitest run src/game/phases.test.ts
```

---

## Architecture

### Game server (`src/`)

**Entry:** `src/index.ts` → `src/app.config.ts` (Colyseus `defineServer`).

`app.config.ts` registers two rooms (`mesa` → `ChiribitoRoom`, `lobby` → `LobbyRoom`), mounts Express middleware (sessions via Redis or MemoryStore, Colyseus monitor at `/colyseus`, `@colyseus/auth` routes), and validates required env vars on `beforeListen`.

**`ChiribitoRoom`** (`src/rooms/ChiribitoRoom.ts`) is the core game room. It delegates all logic to:
- `GameEngine` — orchestrates game flow (start, betting, phase advance, showdown)
- Seven manager classes in `src/rooms/managers/`: `SessionManager`, `AuthenticationService`, `SeatManager`, `RateLimiterService`, `AnalyticsService`, `ConnectionMonitor`, `PlayerLifecycleManager`. Each is scoped to a single responsibility; `ChiribitoRoom.onCreate` wires them together.

**`GameEngine`** (`src/rooms/game/GameEngine.ts`) delegates to five utils in `src/rooms/game/utils/`:
- `CardEvaluator` — hand ranking
- `GameUtils` — player/pot helpers
- `PlayerActions` — bet, call, fold, allIn, raise, check
- `RoundManager` — deal, phase advance, speaking order
- `WinnerDeterminator` — showdown resolution, side-pots
- `GameBroadcaster` — typed `room.broadcast` wrappers

**Schema** (`src/rooms/schema/MesaState.ts`): `MesaState` and `Player` use `@colyseus/schema` decorators. `Player.hand` is decorated with `@view()` — only the owning client receives hole cards.

**Canonical game vocabulary** (`src/rooms/game/glossary.ts`): the Spanish deck (28 cards, 4 suits × 7 ranks), `PHASES` enum, `buildDeck()`, card encoding. This file is the single source of truth; the frontend has a manual mirror at `frontend/src/game/phases.ts` that must be kept in sync.

**Env config** (`src/config/env.ts`): all environment variables read here — never read `process.env` directly in other files. Set `DISABLE_ENV_VALIDATION=true` in test environments to skip startup checks.

### API server (`api-server/src/`)

Express + TypeORM + PostgreSQL. Provides:
- User registration/login, JWT access + refresh tokens, token versioning (`tokenVersion` column invalidates all older tokens)
- Password reset flow (email via `EmailService`)
- Player stats (wins, ranking) read by the frontend lobby
- Internal `/internal/game-ended` endpoint (protected by `INTERNAL_API_SECRET`) called by the game server to record tournament results

Migrations live in `api-server/src/migrations/`.

### Frontend (`frontend/src/`)

**No framework** — vanilla TypeScript compiled by Vite.

**`frontend/src/main.ts`** is the main entry. It owns all top-level mutable state (token, room, connection state, timer IDs) and wires everything together. It is intentionally large; individual features are extracted into the modules below and injected as callbacks.

**Layer breakdown:**
- `frontend/src/app/` — feature controllers (auth flows, lobby, room join/leave, room events, message handlers, UI reset, etc.). Each module exports pure functions that accept explicit deps — no globals.
- `frontend/src/game/` — state rendering (`game-ui.ts`, `visual-layout.ts`), turn timer, winner display, phases helper, `TableScene` (PixiJS table surface)
- `frontend/src/auth/` — token refresh, token monitor loop, auto-rejoin on login
- `frontend/src/security/` — `SecureStorage` (localStorage wrapper), `ApiClient` (fetch wrapper with CSRF headers), input validators
- `frontend/src/connection.ts` — WebSocket client singleton, heartbeat, RTT tracking
- `frontend/src/config.ts` — frontend env constants (`API_URL`, `WS_URL`, etc.)

**PixiJS** (`pixi.js` v7) is lazy-loaded in `initPixiLayer()` to avoid blocking initial render. `TableScene` in `frontend/src/game/table/TableScene.ts` manages all canvas drawing.

**GSAP** is used for card and chip animations.

---

## Game rules (Chiribito)

- **Deck:** 28 cards — suits O/C/E/B (Oros, Copas, Espadas, Bastos), ranks 5/6/7/10/11/12/1 (5, 6, 7, Sota, Caballo, Rey, As). Card IDs are `<rank><suit>`, e.g. `"10O"` = Sota de Oros.
- **6 betting streets** (not 4): preflop → card1 → card2 → card3 → card4 → card5. Community cards are revealed one at a time.
- **Max 6 players** per room.
- **Tournament mode:** when one player accumulates all chips, `notifyTournamentEnd` fires, the game server calls the API to record stats, and all clients receive a `gameResult` message.
- **The Perla:** Sota + 7 of the same suit is the strongest hole-card combination.

---

## Key environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `JWT_SECRET` | prod | Signs session cookies + Colyseus auth tokens |
| `DB_HOST`, `DB_USER`, `DB_NAME` | always | PostgreSQL for api-server |
| `ALLOWED_ORIGINS` | prod | CORS whitelist |
| `API_URL` | always | Game server → api-server base URL (default `http://localhost:3000`) |
| `REDIS_URL` | prod | Session store + token-version cache |
| `INTERNAL_API_SECRET` | prod | Server-to-server auth for tournament stats endpoint |
| `MONITOR_USER` / `MONITOR_PASSWORD` | prod | Basic-auth for `/colyseus` monitor |
| `DISABLE_ENV_VALIDATION` | tests | Set to `"true"` to skip startup env checks |

---

## TypeScript notes

- Game server (`tsconfig.json`): `strict: true`, `strictNullChecks: false` (intentional legacy setting).
- API server (`api-server/tsconfig.json`): `strict: true`, `strictNullChecks: true`, `emitDecoratorMetadata: true` (required by TypeORM).
- Frontend (`frontend/`): Vite handles TS — no separate `tsc` build step for type-checking; run `npx tsc --noEmit` inside `frontend/` to type-check.
