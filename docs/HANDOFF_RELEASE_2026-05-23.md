# Chiribito — Release Consolidation Handoff (2026-05-23)

> **STATUS: SHIPPED to production and verified.** This handoff is the clean entry point
> for the next session. The previous "validated-but-invisible" stack is now LIVE.

---

## What shipped

A single consolidated release that made a deep stack of validated-but-undeployed work visible to users, reducing branch divergence to zero.

- **origin/main:** `e6db55e` -> **`f9a2e92`** (fast-forward, no rewrite). Local `main == origin/main`, divergence = 0.
- **Backend** (`chiribito-api` + `chiribito-colyseus`, Render auto-deploy from `main`):
  - `GET /api/users/me` now returns player stats (`gamesPlayed`, `gamesWon`, `totalChipsWon`, `lastPlayedAt`) — a 1-line additive `select` on columns that already existed in prod (migration `1772` was already live; no schema change, no migration ordering risk).
- **Frontend** (`play.chiribito.com`, Vercel project `chiribito-play`, team `chiribito293-7173`, deployed Vercel-side):
  - **El Rincón del Jugador** (slice 1 + Fase 0 "El Rincón cobra vida"): Carnet Vivo, Lacre, ledger, count-up, ceremony reveal, tilt/breathe, `carnetOpen` audio cue.
  - **Card contact shadows** on the felt (depth/grounding layer from the premium perceptual phase) — purely additive in `TableScene.ts`, validated.

## Verification (all green)

- Pre-flight: frontend Vitest 274/274, api-server Jest 30/30, `tsc --noEmit` = only the 12 pre-existing errors (none in `app/rincon` or `game/table`).
- Backend: `/health` 200, `/ready` 200 (DB 18ms, Redis 1ms); `/me` confirmed returning the 4 stat fields in prod (smoke user created + deleted).
- Frontend: `play.chiribito.com` 200, serving the new bundle (`index-CYS5BbBJ.js`); bundle bakes `backend.chiribito.com` + `realtime.chiribito.com` (no localhost / no onrender).
- Perceptual gate (user, on device): identity intact, no casino/neon/crypto drift, grounding/atmosphere/lobby-Rincon continuity correct, contact shadows read as depth/materiality.

## Rollback anchors

- Git tag `pre-rincon-release-2026-05-23` -> `e6db55e` (local + origin).
- Frontend: Vercel deployment `dpl_o5Jz9ZbgyaJUSxiMsmwiBqu7vuXr`; rollback = promote previous production deployment.
- Backend: Render -> previous deploy (one click) per service.

## Operational notes (carry forward)

- **Vercel identity:** ALWAYS confirm `vercel whoami` shows the Chiribito identity (`chiribito293-7173`), NEVER `predictionmarketssolutions-*` (PMS), before any Vercel action. The CLI was found on the PMS identity during this release and had to be switched.
- **Deploy = Vercel-side build.** Do NOT `vercel deploy --prebuilt` / upload a local `dist/` — a local build bakes `localhost:3000` from the gitignored `frontend/.env.local`. `vercel --prod` builds on Vercel with the project env.
- **Any push to `main` redeploys backend** (api + colyseus auto-deploy). Deploy during a zero-activity window (Colyseus rooms are in-memory; a restart drops live games). Both servers cold-start (~30-60s) when idle.

## Frozen (do NOT touch without explicit go)

gameplay redesign · gameplay readability (deep) · engine/managers · core table geometry · scaling · core interaction · El Cacharro (deep) · El Caos.

## Remaining risks

- **R1 (calendar, real):** Render free Postgres expires ~2026-06-12. Upgrade to `starter` ($7/mo, one click, no code) before then — a dead DB takes down the whole game.
- Bundle ~770KB (Pixi+GSAP): pre-existing perf note, not a regression; code-split is a future candidate (frozen for now).
- `chiribito.com` not in `ALLOWED_ORIGINS` (R2): deferred, harmless today (the web makes no backend calls); needed only for the future web SSO (Fase 1).

---

## NEXT MILESTONE — Premium Table / Physicality Pass (perceptual)

The next perceptual milestone. Goal: make the table feel even more **physical, tactile, premium, alive, material, with real presence** — so looking at it says "I want to touch this."

**In focus:** tapete (felt), fichas (chips), stacks, grounding, highlights, shadows, materials, volume, micro-motion, sense of a real object.

**Hard constraints (identity):** stay castizo / physical / social / arcade-rare / emotional / imperfect / with soul. **Avoid completely:** aggressive casino aesthetics, crypto/neon UI, over-clean digital look, excess VFX, any gambling feel.

**Frozen during this milestone:** gameplay redesign, deep gameplay readability, engine/managers, core table geometry, El Cacharro (deep), El Caos.

**How to approach:** the disciplined chain (brainstorming -> spec -> writing-plans -> execution with TDD/verification -> perceptual gate on device). Open it fresh in a new session. Feel judgment is the user's, on a real device.
