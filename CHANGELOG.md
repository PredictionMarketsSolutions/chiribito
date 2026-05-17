# Changelog

All notable changes to this project will be documented here. Format roughly follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project is on pre-semver (`0.x`) until the real Chiribito rules ship in Phase 2.

## [Unreleased]

### Pending
- Hash refresh tokens before storing them in the database.
- Multi-device session support (loosen the `tokenVersion++` per login).
- Replace the heredado print art with a unified visual identity once the new art is ready.
- Card reveal animation on each `communityCardRevealed` event (engine already emits one card at a time; the visual cue is purely cosmetic and will land with the unified art).
- First real Render deploy under `chiribito-*` service names + custom domain `staging.chiribito.com`. Blueprint is ready (`render.yaml`) and documented (`DEPLOY.md`); needs maintainer to apply it in the Render dashboard and paste the secrets.

## [0.5.0-phase-5] — 2026-05-17

### Added
- **`DEPLOY.md`** — concrete step-by-step Render Blueprint deploy guide. Lists the exact env vars to paste per service, including all `*_URL` / `ALLOWED_ORIGINS` strings (Render's `property: host` returns bare hostname, so we cannot derive URLs with scheme automatically). Covers the optional `staging.chiribito.com` custom-domain hook and the later cutover of `chiribito.com` from the current Vercel landing to this stack.
- **`docker-compose.yml`** — local end-to-end smoke stack. One command (`docker compose up --build`) brings up Postgres + Redis + api + game server + frontend on `http://localhost:5173`, wired the same way the staging stack will be. Lets you exercise register → log in → create table → join → play before paying for any Render time.

### Changed
- **`render.yaml` reworked for clarity around the URL-with-scheme problem.** `VITE_API_URL`, `VITE_WS_URL`, `API_URL`, `ALLOWED_ORIGINS` and `FRONTEND_URL` are now `sync: false` instead of being auto-derived from `fromService.property: host` — the latter returned bare hostnames, which would have broken the frontend's `fetch()` and WebSocket. Each service block in the YAML documents the exact string the operator pastes in the dashboard.
- Every web service now pins `branch: main` explicitly so only `main` triggers a deploy.

### Documented but not automated
- Custom-domain provisioning (`staging.chiribito.com`, eventual `chiribito.com` cutover). Manual on the registrar + Render dashboard. Steps spelled out in `DEPLOY.md`.
- Vercel landing cutover. Out of this repo's scope; runbook in `DEPLOY.md`.

### Verified state (2026-05-17)
- `chiribito.com` / `www.chiribito.com` → Vercel landing, separate project, untouched.
- `chiri-frontend.onrender.com` → live, serves the old heredado static build.
- `chiri-api.onrender.com` / `chiri-colyseus.onrender.com` → 404 (heredado backend gone).
- This repo's `chiribito-*` stack → **not deployed yet**. First deploy is the maintainer's next manual action.

## [0.4.1-phase-4] — 2026-05-17

### Fixed — visual coherence pass

- **Latent rule bug in `frontend/src/game/current-hand.ts`**: the live hand-name shown next to your own cards was computed by a hand-copy of the original heredado `CardEvaluator` and never got migrated when Phase 2 fixed the engine. It still believed ranks went `7 < 8 < 9 < 10 < 11 < 12 < 1` (including the non-existent 8 and 9) and that the Perla was `Sota + Caballo` of the same suit. Now mirrors `src/rooms/game/glossary.ts` and `src/rooms/game/utils/CardEvaluator.ts`:
  - `RANK_ORDER` → `5 < 6 < 7 < Sota (10) < Caballo (11) < Rey (12) < As (1)`.
  - `isPerla` → `Sota + 7` of the same suit. Set-based check; card order in the hole doesn't matter.
  - File header documents the mirror discipline.
- **Castizo hand names with proper accents** in the server (`src/rooms/game/utils/CardEvaluator.getHandName`): `Poker → Póker`, `Trio → Trío`. These are the strings the server broadcasts as `winningHand` and the client shows verbatim in the winner banner ("Trío para Ana", "Póker para Pedro"). The mirror in `frontend/src/game/current-hand.ts` matches.

### Tests
- Net test count: 674 → 676 (+2 explicit guards in `current-hand.test.ts`):
  - `"does NOT call Sota + Caballo suited a Perla"` — pins the heredado mistake we just fixed so it can't regress.
  - `"returns Doble pareja when two distinct pairs are made"`.
- Test fixtures across the frontend updated so no assertion uses a card that does not exist in the canonical Chiribito deck (no rank 2/3/4/8/9):
  - `frontend/src/app/round-ended-history.test.ts`
  - `frontend/src/app/round-ended-outcome.test.ts`
  - `frontend/src/app/round-ended-winner-ui.test.ts`
  - `frontend/src/app/card-popover.test.ts`
  - `frontend/src/game/room-state.test.ts`
- Server tests updated to expect the accented hand names (`CardEvaluator.test.ts`, `WinnerDeterminator.test.ts`).

## [0.4.0-phase-3] — 2026-05-17

### Added — frontend now reflects the authentic Chiribito flow

- **Six-street progress indicator** in the table header. The phase chip went from a raw `"card3"` string to `"Calle 4/6 · 3ª comunitaria"` with a row of six dots, lit up to the current street. New: `frontend/src/game/phases.ts` (mirror of the server glossary), `frontend/src/game/phase-indicator.ts` (pure DOM renderer, idempotent, safe with nulls). 14 new unit tests.
- **Speaking-order context badge** next to the Turn badge — tells the player *why* the current speaker is the current speaker:
  - `Abre el preflop` — preflop opener, dealer+1
  - `Abre por última subida` — last raiser opens the new street (the Chiribito rule)
  - `Abre por orden` — fallback after dealer when nobody raised or the last raiser folded
  - `Sigue la ronda` — mid-street action
  New: `frontend/src/game/speaking-order.ts` (pure function) + 8 unit tests.
- **`Tu apuesta` / `Tus fichas`** in the sidebar status grid, so the player sees their own situation without scanning the players list.

### Changed
- Sidebar status grid relabelled in Spanish across the board (`Token / Mesa / Fase / Habla / Bote / Apuesta / Tu apuesta / Tus fichas / Comunitarias / Tu mano / Jugada / Ganadores`).
- `phaseStatus` in the sidebar now shows the readable label (`"3ª comunitaria (calle 4/6)"`) instead of the raw phase code.
- `dom-refs.ts` and `GameUiRefs` extended with `phaseProgress`, `turnReason`, `yourBetStatus`, `yourChipsStatus` (all optional/null-safe).
- `GameUiContext` gained `previousPhase` so the speaking-order helper can detect street transitions across renders.

### Tests
- Net test count: 651 → 674 (+23: 5 in `phases.test.ts`, 9 in `phase-indicator.test.ts`, 8 in `speaking-order.test.ts`, plus +1 happy-path coverage from the new render path). All green.

### Infra
- `.claude/launch.json` added with a frontend dev-server entry for the preview tool. The preview spawner currently fails on this Windows host (`cmd.exe ENOENT`, same known limitation as the PT project) — file is committed so other hosts can use it.

## [0.3.0-phase-2] — 2026-05-17

### Game rules — Chiribito authentic flow

- **Six betting rounds per hand**, not four. Phase progression is now `WAITING → PREFLOP → CARD_1 → CARD_2 → CARD_3 → CARD_4 → CARD_5 → showdown`. The legacy `flop / turn / river` strings were never real in runtime — `dealNextCommunityCard` already emitted `card${N}`. This phase formalises that and removes the misleading comments and tests that pretended otherwise.
- **Authentic speaking order on every post-preflop street**: the player who last raised in the previous betting round opens the new street. If they folded between streets, action falls back to the first active player after the dealer. Implemented in `GameEngine.pickFirstSpeakerForNewStreet()`. Was Hold'em-style (always dealer+1) before.
- **Must-use-both-hole-cards reaffirmed**: the existing `CardEvaluator.getCommunityCombos` returns 3-card slices (not 5-card combinations), so the evaluator was already correct. New explicit tests guard against regressions.

### Added
- `src/rooms/game/glossary.ts` exports `PHASES` (`WAITING`/`PREFLOP`/`CARD_1..CARD_5`), `GamePhase` type, `communityCardPhase(n)`, `TOTAL_COMMUNITY_CARDS`, `HOLE_CARDS_PER_PLAYER`, `TOTAL_BETTING_ROUNDS`. Single source of truth for the street vocabulary.
- New test suites:
  - `src/__tests__/game/Phase2Flow.test.ts` — phase mapping, one-card-per-street reveal, must-use-2-hole guarantees.
  - `src/__tests__/game/SpeakingOrder.test.ts` — five scenarios covering the new speaking order (last raiser opens, fallback after fold, no-raiser-yet fallback, raiser persistence across streets, full 5-street progression to showdown).

### Changed
- `MesaState.phase` initialises to `PHASES.WAITING` and the misleading `"waiting, preflop, flop, turn, river"` comment is replaced with the actual six-street progression.
- `RoundManager` consumes `communityCardPhase()` and `HOLE_CARDS_PER_PLAYER`; `resetDealerAndPhase` uses `PHASES.PREFLOP`.
- `GameEngine.proceedToNextPhase` uses `PHASES.PREFLOP` and `TOTAL_COMMUNITY_CARDS` constants; all `length >= 5` magic numbers are gone.
- Existing tests that set `state.phase = "flop"` / `"river"` updated to `"card3"` / `"card5"`. Integration test that pushed `"8E"` / `"9C"` (ranks that do not exist in the Chiribito deck) updated to canonical `5O / 7C / 10E / 11C / 12O`.

### Tests
- Net test count: 464 → 475 backend (+11), 27 api-server, 149 frontend → **651/651 green**.

## [0.2.1-sprint-1.5] — 2026-05-17

### Changed
- **Card assets re-encoded.** Every face card in `frontend/public/cards/` was re-encoded to max-width 800 px at WebP quality 85 with `effort: 6`. The folder shrank from 57.2 MB → 2.9 MB (−95%). Per-card average dropped from ~2 MB to ~95 KB, with no visible loss at the on-screen sizes the game uses.
- **Visual consistency restored.** The heredado set mixed cards at print resolution (1600×2500, 2-4 MB) with half-size leftovers (832×1280, 100 KB-1 MB). Everything is now at the same pipeline output.

### Added
- **`scripts/optimize-cards.ts`** — reproducible card-optimisation script (sharp). Supports `--dry-run`, `--width`, `--quality` and `--dir`. Reads files into buffers up-front and writes via temp+rename to dodge Windows file-handle races. Reachable via `npm run optimize:cards`.

### Notes
- `back_logo.png` (99 KB, 500×500) and `back.svg` (1 KB) are intentionally excluded by the script — small, static, used once per session.

## [0.2.0-sprint-1.4] — 2026-05-17

### Changed
- **The deck is now canonical Chiribito.** Ranks `5, 6, 7, Sota (10), Caballo (11), Rey (12), As (1)` × 4 suits (Oros / Copas / Espadas / Bastos). The heredado `8` and `9` ranks (which do not exist in the Spanish deck) are gone.
- **The Perla is defined correctly.** Sota (10) + 7 of the same suit — equivalent to J/10 suited in the French deck — instead of the inherited Sota + Caballo definition.
- **Renamed for identity.** `MyRoom` → `ChiribitoRoom`, `MyRoomState` → `MesaState`, room id `"my_room"` → `"mesa"`, package names `my-app` / `pixi-test-client` / `poker-auth-api` → `chiribito-server` / `chiribito-client` / `chiribito-api`. Pinned bug/homepage URLs to the new fork.

### Added
- **`src/rooms/game/glossary.ts`** — canonical source of truth for the deck. Exports suit codes, rank codes, rank order, Spanish names, French equivalents, the Perla definition, and helpers (`parseCard`, `cardName`, `buildDeck`). Anything downstream — engine, evaluator, frontend mappings — derives from this file.
- New WebP assets for ranks 5 and 6 across all four suits (8 files, ~1.5 MB total after sharp conversion at quality 90). Sourced from `Documents/CHIRIBITO/nuevas 5-6/` PNG originals.

### Removed
- Card assets `8 DE *.webp` and `9 DE *.webp` from `frontend/public/cards/` (no longer in the deck).
- The old `--csharp --output ../Assets/Example/` codegen target (pointed outside the repo). Now writes to `generated-schema/csharp/`, which is gitignored.

### Tests
- `CardEvaluator.isPerla` test suite rewritten to spec the real Chiribito Perla (Sota + 7 same suit), including the legacy-mistake guard ("Sota + Caballo suited is NOT the Perla").
- `ChiribitoRoom.onCreate.test.ts` and friends renamed.
- All 640 tests green (462 backend + 27 api + 149 frontend → 464 backend + 27 + 149).

## [0.1.0-sprint-1.3] — 2026-05-17 — commit `3a33fa7`

### Changed
- **Heartbeat-disconnect re-enabled.** Clients that miss the heartbeat past `HEARTBEAT_TIMEOUT_MS` (default 3 min) are now disconnected with code 4000 instead of being silently kept alive. Gated by `HEARTBEAT_DISCONNECT_ENABLED` (default true).
- **`render.yaml` rewritten** for the `PredictionMarketsSolutions/chiribito` fork. All three services renamed `chiri-*` → `chiribito-*`, region pinned to Frankfurt, Redis declared as a managed service, every env var the code reads is declared, cross-service refs use `fromService` / `fromDatabase`. Zero placeholders left.
- **`/health` and `/ready` probes** added to both web services. `/health` is liveness only (no dep checks). `/ready` pings PostgreSQL + Redis with latencies, returns 503 if any required dependency is unhealthy.

### Added
- **Token-version cache (Redis).** The game server checks a Redis-cached `tokenVersion` per user before falling back to the api-server `/api/auth/validate` HTTP call in Colyseus `onAuth`. Hit + match skips the HTTP round-trip entirely. The api-server publishes the current `tokenVersion` on register / login / refresh / reset / validate, and invalidates on user delete. Cache failures never throw — the system stays functional without Redis. Files: `src/config/redis.ts`, `src/rooms/managers/TokenVersionCache.ts`, `api-server/src/services/tokenVersionCache.ts`. Configurable via `AUTH_TOKEN_VERSION_CACHE_ENABLED` + `AUTH_TOKEN_VERSION_CACHE_TTL_MS`.
- **Persistent audit log.** New `audit_events` table (id, event_type, user_id, payload jsonb, ip_address, user_agent, created_at) with composite indexes. Migration `1773000000000-CreateAuditEvents`. Helper `auditWrite()` is best-effort — never throws. Events wired: register / register-duplicate / login-ok / login-failed / token-refreshed / password-reset-requested / password-reset-completed / user-deleted / tournament-reported.
- **CI security audit step** runs `npm audit --audit-level=moderate --omit=dev` on root, api-server and frontend after the build. Moderate or higher in runtime deps blocks the workflow; dev-only chains (the accepted `@colyseus/playground` low advisories from Sprint 1.0) are skipped.

### Architecture
- The game server now has a shared Redis client (`src/config/redis.ts`) lazily initialised and shared between session store, Colyseus monitor, and the new token cache.
- Game ↔ API coupling reduced: when Redis is available, the synchronous HTTP call per room join goes away unless the token's version has aged out of the 60-second cache window.

## [0.1.0-sprint-1.2] — 2026-05-17

### Changed
- **Documentation rewritten honestly.** Removed all "production-ready" and "Texas Hold'em" claims. README is now bilingual (English on top, Spanish below) and reflects the real status of every component.

### Removed
- Root-level marketing markdowns: `CODE_REVIEW_API_SERVER.md`, `CODE_REVIEW_FRONTEND.md`, `CODE_REVIEW_GAME_BACKEND.md`, `CODE_REVIEW_GENERAL.md`, `FRONTEND_SECURITY_SUMMARY.md`, `GAME_SERVER_INTEGRATION_GUIDE.md`, `GAME_SERVER_SECURITY_SUMMARY.md`, `IMPROVEMENTS_CHANGELOG.md`, `PROJECT_CONTEXT.md`, `PROJECT_STATUS.md`.
- Obsolete `docs/` files: `CODE_REVIEW.md`, `CODE_REVIEW_RESUMEN.md`, `COVERAGE_PLAN.md`, `MIGRATION_0.17.md`, `SEGUNDA_PARTIDA_DESCONEXION.md`, `LOGGING_GUIDE.md`, `DEV_VS_PROD_LOGS.md`, `PRODUCTION_LOGGING.md`, `RENDER_LOGS.md`.
- Subapp doc bloat: `api-server/JEST_TESTING.md`.
- Vendored Render CLI binary: entire `render_cli/` directory.

### Added
- `CONTRIBUTING.md` — short, current working agreement.
- `CHANGELOG.md` — this file.
- `docs/CI.md` — consolidates `BRANCH_PROTECTION.md` + `GITHUB_WORKFLOWS.md` into one honest page.
- `docs/ARCHITECTURE.md` rewritten from scratch.

## [0.1.0-sprint-1.1] — 2026-05-17 — commit `04bc486`

### Removed
- **~3,050 LOC of dead "security" source code** that nothing in production ever invoked: `src/security/anti-cheat.ts`, `game-validation.ts`, `game-auth.ts`, `game-security-index.ts`, `game-audit.ts`, `game-action-rate-limit.ts`.
- Dead API middleware: `api-server/src/middleware/csrf.ts`, `middleware/security.ts`.
- Dead API utilities: `utils/audit.ts`, `utils/cryptography.ts`, `utils/ip-security.ts`, `utils/request-analyzer.ts`, `utils/security-monitor.ts`, `utils/security-index.ts`.
- Unused alternative auth routes: `api-server/src/routes/auth.ts`.
- Example file: `api-server/src/examples/security-usage.example.ts`.
- Orphan imports in `src/rooms/MyRoom.ts` (`gameAuditLog`, `gameActionRateLimiter`).
- Binary in repo: `render.zip` (5 MB).

### Untracked (kept on disk, removed from git index)
- `node_modules/` (~4,121 files)
- `dist/`
- `coverage/`
- `generated-schema/`

### Changed
- `.gitignore` hardened: explicitly blocks `*.zip`, `generated-schema/`.
- Lint warnings down from 74 to 38 (dead code carried most of them).

### Kept on purpose
- `src/security/create-room-rate-limit.ts` — actually wired up in `MyRoom.onAuth`.

## [0.1.0-sprint-1.0] — 2026-05-17 — commit `576b047`

### Security
- Removed committed `.env.development` and `.env.production`. The former contained a real `JWT_SECRET` that **must be rotated on Render** by anyone with admin access.
- Added `.env.example` for root, api-server and frontend documenting every env var the code actually reads.
- Added a CI guard in `build.yml` that fails the workflow if a non-example `.env*` file is ever committed.
- Replaced `Math.random()` with `crypto.randomInt` in `MyRoomState.resetDeck` (Fisher–Yates).
- Moved the deck out of the Colyseus synced state. `deck` is now a `private string[]` with no `@type` decorator and is never serialized to clients.
- Gated `/colyseus` (Colyseus monitor) behind basic-auth in production via `MONITOR_USER` + `MONITOR_PASSWORD`. Returns 404 if credentials are not configured.
- Disabled `/playground` entirely in production.
- Removed the `"dev-secret-change-in-production"` JWT fallback. In production, missing `JWT_SECRET` throws on startup. In dev, an ephemeral secret is generated per process.

### Changed
- Dropped unused dev dependencies (`mocha`, `@types/mocha`, `vite` from root — vite is the frontend's concern).
- `npm test` now aliases to `jest` (the only test runner actually used).
- `tsx` upgraded 3 → 4 (clears esbuild advisory).
- Frontend: `vitest` 2 → 3, `happy-dom` 15 → 20 (clears the critical happy-dom advisory).
- Pinned `connect-redis` to `^8.1.0`; v9.0.0 is published without a build artefact and breaks `tsc`.

### Reduced
- npm vulnerabilities: 28 (1 critical + 8 high + 7 moderate + 12 low) → 6 low only. All remaining are dev-only chains of `@colyseus/playground`, which is no longer exposed in production.
