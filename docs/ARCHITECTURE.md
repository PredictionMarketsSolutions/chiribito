# Architecture

Honest, current view of how Chiribito is wired. If the code disagrees with this document, the code wins and this document is stale — please update it.

---

## Three services, one repository

```
┌──────────────────────────┐
│  Frontend (Vite + Pixi)  │
│  :5173 in dev            │
└──────┬─────────────┬─────┘
       │ HTTPS       │ WSS
       ▼             ▼
┌──────────────┐ ┌──────────────────────┐
│ API server   │ │ Game server          │
│ Express      │ │ Colyseus 0.17        │
│ TypeORM      │ │ Server-authoritative │
│ :3000        │ │ :2567                │
└─┬──────┬─────┘ └────────┬─────────────┘
  │      │                │
  │      │   HTTP S2S     │
  │      └────────────────┘  (game → api: tournament-end stats,
  │                           token validation)
  ▼      ▼
PostgreSQL   Redis
(users,      (rate limits,
 tokens,     session store,
 stats)      ranking cache)
```

Three deployable units, three lockfiles, one branch. The repo is an npm workspace; `api-server` is a child workspace, `frontend` is intentionally **not** a workspace because PixiJS pulls dev deps we do not want in the server's dependency tree.

---

## Source of truth — who owns what

| Domain | Owner |
|---|---|
| Deck, cards, hand evaluation, betting state | **Game server** — exclusively. The deck is `private string[]` and never leaves the room process. |
| Players, accounts, passwords, refresh tokens, password reset | **API server** |
| Aggregate stats (games played / won, top winners) | **API server** — written from game server through an internal HTTP endpoint protected by `INTERNAL_API_SECRET` |
| Per-room session, seat assignment, connection liveness | **Game server**, in memory of each `Room` instance |
| Long-lived session store, rate-limit buckets, ranking cache | **Redis** |
| Frontend state | The client. **Nothing important.** Discardable. |

If the client claims it has 1.000.000 chips, the game server ignores it. If the client claims it knows the next card, the game server still ignores it (and the client can't actually know — the deck isn't even in its state).

---

## Game server (`src/`)

Built on Colyseus 0.17 over WebSocket. One main room class, one engine, eight managers.

```
src/
├── index.ts                  Entry point. Loads env, calls server.listen()
├── app.config.ts             defineServer: rooms + express routes + monitor + auth
├── config/
│   ├── env.ts                Centralised env reading with safe defaults
│   ├── auth.ts               @colyseus/auth wiring
│   └── logger.ts             Winston + optional Better Stack (Logtail)
├── rooms/
│   ├── ChiribitoRoom.ts      Colyseus Room (room id "mesa")
│   ├── close-codes.ts        Custom WS close codes
│   ├── schema/
│   │   └── MesaState.ts      Public state synced to clients (NO deck)
│   ├── game/
│   │   ├── GameEngine.ts     Orchestrator. Delegates to utils below.
│   │   ├── constants.ts      Reads from config/env
│   │   └── utils/
│   │       ├── CardEvaluator.ts        Pure poker hand evaluation
│   │       ├── GameBroadcaster.ts      Single point of client broadcast
│   │       ├── GameUtils.ts            Player helpers (active, in-hand…)
│   │       ├── RoundManager.ts         Round progression, dealing
│   │       ├── WinnerDeterminator.ts   Winners + sidepot calculation
│   │       └── PlayerActions.ts        Check/fold handlers
│   └── managers/
│       ├── AuthenticationService.ts    JWT verify + remote /api/auth/validate
│       ├── PlayerLifecycleManager.ts   Join/leave/bust
│       ├── SeatManager.ts              Seat assignment & reservations
│       ├── SessionManager.ts           Per-user session lifecycle
│       ├── ConnectionMonitor.ts        Heartbeat + liveness
│       ├── RateLimiterService.ts       Per-action cooldowns
│       └── AnalyticsService.ts         In-process event stats
├── security/
│   └── create-room-rate-limit.ts   The only security helper actually wired up.
├── services/
│   └── api-server-stats.ts     Server-to-server HTTP client → API
└── types/                       Shared TypeScript types
```

### Game flow at a glance

1. Client calls `client.joinOrCreate("mesa", { token })`.
2. Colyseus invokes `ChiribitoRoom.onAuth` → `AuthenticationService.authenticate`:
   - Verify JWT signature locally
   - Call `POST /api/auth/validate` on API server (with retry + exponential backoff)
   - Reject duplicate concurrent sessions unless `forceReplace: true`
3. Client lands in `onJoin`. `PlayerLifecycleManager` seats them via `SeatManager`.
4. When everyone is seated, `startGame` triggers `GameEngine.handleStartGame`.
5. `RoundManager.dealInitialHands()` deals 2 cards per player from the private deck.
6. Each player's hand is decorated `@view()` in `MesaState` — visible only to the owning client.
7. Betting round drives by `ChiribitoRoom.onMessage("bet" | "call" | "check" | "raise" | "fold" | "allIn")`. Each message goes through `isActionAllowed` (turn check + round-active check + rate limiter).
8. `proceedToNextPhase` reveals the next community card; on showdown `WinnerDeterminator` computes winners and side-pots.
9. Tournament end → `notifyTournamentEnd` → `reportTournamentStats` → `POST /api/internal/game-ended` (protected by `INTERNAL_API_SECRET`).

### Public vs private state

`MesaState` is what every client sees. Only fields with `@type` are serialized. The deck is intentionally `private string[]` with **no decorator** — invisible to clients. Each `Player.hand` is `@view()` — visible only to the player who owns it.

---

## API server (`api-server/`)

Express 4 + TypeORM 0.3 + PostgreSQL + Redis.

```
api-server/src/
├── index.ts                  App bootstrap, middleware chain, routes
├── config/
│   ├── database.ts           AppDataSource (TypeORM)
│   └── logger.ts             Winston
├── controllers/
│   ├── AuthController.ts     register, login, refresh, validate, password reset
│   ├── UserController.ts     /api/users/me
│   └── InternalStatsController.ts   /api/internal/game-ended (S2S)
├── middleware/
│   ├── auth.ts               authenticateJWT
│   ├── validators.ts         express-validator chains
│   └── validateRequest.ts    common 422 handler
├── models/                   TypeORM entities: User, RefreshToken, ResetToken
├── migrations/               TypeORM migrations (run on deploy)
├── services/
│   ├── EmailService.ts       Resend wrapper
│   └── RankingService.ts     Cached top-winners query
└── scripts/
    └── init-db.ts            One-shot CREATE DATABASE for fresh hosts
```

### Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register`        | rate-limited | Create user |
| POST | `/api/auth/login`           | rate-limited | Issue JWT + refresh |
| POST | `/api/auth/validate`        | bearer       | Used by game server in `onAuth` |
| POST | `/api/auth/refresh`         | rate-limited | Rotate JWT |
| POST | `/api/auth/forgot-password` | rate-limited | Email reset token (UUID, 30 min, single use) |
| POST | `/api/auth/reset-password`  | rate-limited | Consume reset token |
| GET  | `/api/users/me`             | JWT          | Current user profile |
| DELETE | `/api/users/me`           | JWT          | Delete user |
| GET  | `/api/ranking/top-winners`  | public       | Cached top winners (Redis) |
| POST | `/api/internal/game-ended`  | shared secret| S2S — game server reports tournament outcome |
| GET  | `/health`                   | public       | Liveness probe |

### Security baseline

- Helmet with a strict CSP, HSTS, frame-ancestors deny.
- `express-rate-limit` backed by Redis on every auth endpoint.
- Token version invalidation on every login (aggressive — will revisit in Sprint 1.3 for multi-device support).
- Refresh tokens stored as plain text today (will hash in Sprint 1.3).
- All user input goes through `express-validator`. No raw SQL anywhere; TypeORM QueryBuilder is parameterized.

---

## Frontend (`frontend/`)

Vite + TypeScript + PixiJS 7 + GSAP. Stateful only in the sense that it holds the current Colyseus room reference and token.

```
frontend/src/
├── main.ts                   Bootstrap: connect, handle lifecycle
├── app/                      Per-screen bindings (auth, lobby, room, round end)
├── auth/                     Token monitor, refresh, room disconnect
├── security/                 Secure local storage + JWT decode helpers
├── audio.ts, animations.ts   Effects layer
└── ...                       PIXI components (cards, seats, popovers)
```

Frontend security really only consists of: storing tokens carefully (`SecureStorage`), refreshing them before expiry, and not lying to the user about what the server returned. It is not a trust boundary.

---

## CI / CD

See [`CI.md`](CI.md). Summary:
- `build.yml` on every push/PR: env-file leak guard → `tsc --noEmit` → ESLint → build game → build API
- `test-coverage.yml`: backend Jest (matrix Node 18 + 20) + frontend Vitest + api-server Jest + Codecov upload + PR comment with coverage report
- Dependabot grouped npm + GitHub Actions updates, weekly

Deploys to Render are not yet automated from the new `PredictionMarketsSolutions/chiribito` fork — `render.yaml` will be reworked in Sprint 1.3.

---

## Logging

Winston with two transports:
- Console (always)
- Better Stack (Logtail) if `LOGTAIL_SOURCE_TOKEN` is set

In production on Render, log files on disk are pointless — Render captures stdout. The previous repo had three contradictory documents prescribing file rotation; they were deleted in Sprint 1.2.

---

## What this document deliberately doesn't cover

- The legacy `gameAuditLog` / `gameActionRateLimiter` / `anti-cheat` modules — gone (Sprint 1.1, never wired up to begin with).
- The CSRF middleware in the API server — gone (Sprint 1.1, never mounted).
- "Production-ready" marketing claims — gone (Sprint 1.2).
- The 74 MB of card assets — exists, scheduled for compression in Sprint 1.5.
- The real Chiribito rules (deck 5-6-7-Sota-Caballo-Rey-As, 6 betting rounds, reveal one card at a time) — not implemented yet. Phase 2.
