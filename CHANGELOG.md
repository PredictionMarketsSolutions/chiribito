# Changelog

All notable changes to this project will be documented here. Format roughly follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project is on pre-semver (`0.x`) until the real Chiribito rules ship in Phase 2.

## [Unreleased]

### Pending (Sprint 1.3 → 1.5)
- Re-enable heartbeat disconnect (currently no-op via comment in `MyRoom.onCreate`).
- Cache `tokenVersion` in Redis to remove the API round-trip on every `onAuth`.
- Persist critical audit events to a DB table instead of stdout-only.
- Real `render.yaml` for the new fork with all required env vars and no placeholders.
- Rename `MyRoom` → `ChiribitoRoom`, `my_room` → `mesa`, package names, in-game glossary.
- Compress 74 MB of card assets to <3 MB and move originals out of the repo.

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
