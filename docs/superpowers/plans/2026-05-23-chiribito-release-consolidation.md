# Chiribito — Release Consolidation (Rincón Fase 0 + validated stack) — Plan

> **STATUS: SHIPPED to production 2026-05-23.** origin/main (`f9a2e92`) + play.chiribito.com both LIVE and verified; perceptual gate passed; close-out complete. See `docs/HANDOFF_RELEASE_2026-05-23.md`.

> **Nature:** This is a **release runbook**, not a feature-TDD plan. Steps are git/deploy/verify
> operations with explicit gates, each marked **[AUTO]** (I can run it, local & reversible) or
> **[GO]** (needs your explicit green light — external/visible side-effects). Checkbox syntax for tracking.

**Goal:** Ship the entire stack of validated-but-invisible work (Rincón del Jugador slice 1 + Fase 0 "El Rincón cobra vida" + the `/me` stats expansion + the contact-shadows depth layer) to production, reducing branch divergence to zero, **without breaking identity and without starting any new perceptual/architectural work.**

**Approach:** The release branch `feat/rincon-fase-0-vida` is a clean linear superset of local `main`, which is itself a clean linear superset of `origin/main`. So consolidation is a **fast-forward chain** (no merge commits, no conflicts, no rebase). Backend ships via Render auto-deploy on `main` push; frontend ships via a manual Vercel `--prod`. Every deploy layer has a one-click rollback.

**Tech stack:** git (FF merge), Render (auto-deploy from `main`, `start:migrate`), Vercel (manual `--prod` from `frontend/`, team `chiribito293-7173`).

---

## 1. The exact release map (verified)

```
origin/main  e6db55e  ← LIVE in production (premium perceptual phase: felt/lighting/audio)
   │
   │  d554176  feat(table): card contact shadows        ← FREEZE-BOUNDARY (decision needed)
   │  …docs… (premium perceptual handoff, rincón spec/plan)
   │  2aee2ba  feat(api): expose player stats on /me     ← 1-line additive select
   │  …rincón slice 1 code… (5113c77 → 9600113, all frontend/src/app/rincon/*)
   │  54f68b6  Merge feat/rincon-del-jugador             ← already in local main
   │  …Fase 0 docs… (spec/approval/plan)
main fad5aee  (local; +21 vs origin, UNPUSHED)
   │  4e422f3 → f9a2e92   Fase 0 code (10 commits, frontend/src/app/rincon/* + audio.ts +1 + main.ts +23)
feat/rincon-fase-0-vida  f9a2e92  ← HEAD (= what ships)
```

**Blast radius (origin/main..f9a2e92): 28 files, +3957/−2.** Breakdown:
- **New, isolated** `frontend/src/app/rincon/*` (14 files: module + tests) — the entire Rincón.
- **Wiring** `frontend/index.html` (+13), `frontend/src/main.ts` (+23), `frontend/src/dom-refs.ts` (+3), `frontend/src/types.ts` (+3/−1), `frontend/src/audio.ts` (+1, the `carnetOpen` cue).
- **Backend** `api-server/src/controllers/UserController.ts` (1-line `select` expansion) + its test (+54).
- **Mesa** `frontend/src/game/table/TableScene.ts` (+84, contact shadows — see §5).
- **Docs** handoffs/specs/plans (harmless).

### Commit classification

| Class | Commits | Verdict |
|---|---|---|
| **Must-go (the value)** | Rincón slice 1, `2aee2ba` (/me), Fase 0 code (10) | Additive, isolated to `app/rincon/*` + 1-line backend. Validated. Tests green. **Safe.** |
| **Flag for sign-off** | `d554176` contact shadows | Touches a frozen FILE (`TableScene.ts`) but **+84/−0, fully additive & decoupled** (own container/ticker/texture, clean `destroy`). Changes mesa look in prod. **Needs your call (§5).** |
| **Harmless** | all `docs/` commits | No runtime effect. |
| **Dangerous** | *(none)* | No engine (`src/rooms/`) touch, no new migration, no dependency/lockfile change, glossary mirror in sync. |

---

## 2. Risk register (ranked, real)

| # | Risk | Severity | Mitigation | Reversibility |
|---|---|---|---|---|
| 1 | Mesa look changes (contact shadows visible in prod) | 🟡 perceptual | Validated in premium phase; additive; §5 sign-off | **Vercel: promote previous deploy (instant)** |
| 2 | `/me` 500 if prod DB lacks stat columns | 🟢 low | Migration `1772` already live + `start:migrate` runs on deploy → columns exist. Quick confirm gate. | Render: rollback API to prior deploy |
| 3 | Colyseus redeploy = brief disconnect for live players | 🟢 low | No `src/rooms/` change (no-op rebuild); free tier sleeps anyway; deploy at low activity; Move-2 reconnect handles drops | Render: rollback |
| 4 | Frontend built with wrong `VITE_API_URL/WS_URL` | 🟢 low | Live bundle already compiles to backend/realtime.chiribito.com (validated); re-confirm Vercel project envs pre-build | Vercel: promote previous |
| 5 | Free Postgres expires ~2026-06-12 (R1) | 🔴 calendar | NOT triggered by this release, but a dead DB kills the game. 1-click upgrade to `starter` ($7/mo), no code. Do soon. | n/a |
| — | CORS `chiribito.com` not whitelisted (R2) | n/a here | **Not a blocker** — web makes zero backend calls; Rincón ships on already-allowed play.chiribito.com. Defer to Fase 1. | n/a |
| — | Lockfile/CI desync (the Fase-7 trap) | n/a | **No package.json/lockfile change in the stack.** Does not apply. | n/a |

---

## 3. Hidden dependencies / coupling (verified)

- **`/me` ↔ Rincón `data.ts`:** reconciled — handler returns exactly the 8 fields the Rincón reads. **Degrades gracefully** (defaults + `—`/"sin clasificar aún") if any field is null. Backend change is additive on **already-existing** columns → even a frontend-first deploy is safe. The only hard failure mode is a `/me` **500** (Rincón throws on `!res.ok`), which requires the columns to be absent → covered by risk #2 gate.
- **`start:migrate` on API deploy:** runs `migration:run` every deploy. No new migration in the stack → **no-op** on this release.
- **Glossary mirror** (`src/rooms/game/glossary.ts` ↔ `frontend/src/game/phases.ts`): **in sync** (`PHASES` byte-identical, `TOTAL_BETTING_ROUNDS=6`). Not touched.
- **Vite build-time URL inlining:** frontend deploy bakes `VITE_*` at build → gate #4.
- **Dead code (not blocking, cleanup later, NOT this release):** `idle-timeout-modal` (orphaned: `index.html:308-315`, `style.css:2994-3026`, `dom-refs.ts:70-71`, `main.ts:1176-1180` — listener only ever *adds* `hidden`); `api-server/src/utils/validation.ts` test-only exports. Flagged for a future cleanup slice; do **not** fold into this release.

---

## 4. The freeze-boundary decision (contact shadows `d554176`)

This is the one judgment call. `d554176` adds a soft contact-shadow depth layer under each card on the felt. It touches `TableScene.ts` — inside your freeze ("mesa/felt, TableScene core") — **but**:
- It is **already-validated work** from the premium perceptual phase ("depth/grounding layer"), not new perceptual iteration.
- It is **+84/−0, fully additive and decoupled** (separate Pixi container rendered behind cards, a per-frame ticker that mirrors transforms, clean teardown). It changes **no** existing layout/geometry/sizing/felt.
- It **does** change how the mesa looks in production (cards gain a grounded shadow).

**Topology constraint:** `d554176` is the **oldest** commit in the stack (directly above `origin/main`); the entire Rincón sits on top of it. Excluding it cleanly = interactive rebase dropping the bottom commit (rewrites ~30 commits) — higher risk/effort than including it.

**Options:**
- **(A) Include + sign-off [recommended]** — ships the validated depth layer; matches the release goal ("dejar visible trabajo validado"); instantly reversible via Vercel rollback if it reads wrong on the felt.
- **(B) Exclude** — keeps the mesa byte-identical to current prod, but requires the rebase surgery and leaves your validated work invisible. Only if you want zero mesa change right now.

---

## 5. Deploy runbook (phased, reversible)

### Phase 0 — Pre-flight verification [AUTO]
- [ ] **0.1** Working tree clean on `feat/rincon-fase-0-vida` @ `f9a2e92` (already confirmed).
- [ ] **0.2** Full frontend Vitest green: `cd frontend; npm test` (expect ~274 pass). *(running)*
- [ ] **0.3** API tests green: `cd api-server; npm test`.
- [ ] **0.4** Type-check: `cd frontend; npx tsc --noEmit` → expect **only** the 12 pre-existing errors (card-popover/token-monitor/connection), **none** in `app/rincon` or `game/table`.
- [ ] **0.5** Tag the rollback anchor (local): `git -C <root> tag pre-rincon-release-2026-05-23 e6db55e`.

### Phase 1 — Local consolidation [AUTO] (no push, fully reversible)
- [ ] **1.1** FF-merge release branch into main:
  ```
  git -C <root> checkout main
  git -C <root> merge --ff-only feat/rincon-fase-0-vida
  ```
  Expected: `main` fast-forwards `fad5aee → f9a2e92`. No merge commit, no conflicts.
- [ ] **1.2** Sanity: `git -C <root> log --oneline -1 main` == `f9a2e92`; `git -C <root> status` clean.
- [ ] **STOP — checkpoint.** Report state, await **[GO]** for push.

### Phase 2 — User-side confirmations (dashboards) [GO / you]
- [ ] **2.1** Render `chiribito-api` + `chiribito-colyseus`: confirm they are git-connected to `main` with autoDeploy on (render.yaml declares it; confirm the actual wiring).
- [ ] **2.2** `JWT_SECRET` + `INTERNAL_API_SECRET` identical on api + colyseus (strong indirect evidence they are; confirm).
- [ ] **2.3** `ALLOWED_ORIGINS` on api + colyseus includes `https://play.chiribito.com` (the game origin).
- [ ] **2.4** (High-confidence yes) prod DB has the 4 stat columns. Optional explicit check via Render psql.
- [ ] **2.5** (Soon, not blocking) R1 — upgrade Postgres to `starter` before ~2026-06-12.

### Phase 3 — Backend release [GO]
- [ ] **3.1** `git -C <root> push origin main` → triggers chiribito-api + chiribito-colyseus auto-deploy. `start:migrate` runs (no new migration → no-op). API now serves expanded `/me`.
- [ ] **3.2** Verify: `backend.chiribito.com/health` 200, `/ready` 200; `realtime.chiribito.com/health` 200.
- [ ] **3.3** Verify `/me` (authed) returns the 4 stat fields, no 500.
- [ ] **Rollback if needed:** Render → previous deploy (one click). Do NOT force-push git.

### Phase 4 — Frontend release [GO]
- [x] **4.0 (pre-flight done 2026-05-23):** Vercel link verified — `frontend/.vercel` → project `chiribito-play`, orgId `team_YjBvPWbscOQ6n0xUrfDW33kW` (identical to `chiribito-web`'s org → confirmed **Chiribito team, NOT PMS**). Local prod build compiles clean (vite, 536 modules, 1.77s).
- [ ] **4.1** Confirm the Vercel `chiribito-play` project env has `VITE_API_URL=https://backend.chiribito.com` + `VITE_WS_URL=wss://realtime.chiribito.com` (the current live bundle proves they're set).
- [ ] **4.2** Deploy via **Vercel-side build**: from `frontend/`, run `vercel --prod` (uploads source; Vercel builds with the project env). **Do NOT use `--prebuilt` or the local `dist/`** — a local build bakes `localhost:3000` from the gitignored `frontend/.env.local`. The local `dist/` is throwaway.
- [ ] **Rollback if needed:** Vercel → promote previous deployment (instant).

### Phase 5 — Production smoke [GO, I drive verification]
- [ ] **5.1** Load play.chiribito.com; open a mesa; confirm contact shadows read as grounded (not floating/halo).
- [ ] **5.2** Open "Mi Rincón"; confirm real stats now populate (backend `/me` live); ledger/carnet/lacre render; reduced-motion still static.
- [ ] **5.3** 2-browser smoke: login + join + a few hands (reconnect intact).

### Phase 6 — Branch hygiene [AUTO, post-verify]
- [ ] **6.1** Delete merged branches: `feat/rincon-fase-0-vida` (local + origin), `feat/rincon-del-jugador` (local; already merged). Keep `phase-w/snapshot-integration` (historical, your prior decision) unless you say otherwise.
- [ ] **6.2** Confirm `origin/main == main == f9a2e92`; divergence = 0.
- [ ] **6.3** Update `docs/HANDOFF_FASE_0.md` close-out + a memory note that the stack is now LIVE.

---

## 6. Autonomy boundary

- **I run alone now (zero external risk):** Phase 0 (verify), Phase 1 (local FF-merge + tag). All local, reversible, no deploy.
- **Needs your explicit GO (external/visible):** Phase 3 push (backend deploy), Phase 4 Vercel deploy. Plus Phase 2 dashboard confirms are yours.
- **Not automatable safely:** the dashboard gates + the team-gated Vercel auth → keep deploy driven on explicit go, not scripted.

## 7. Out of scope (freeze respected)

No new mesa/felt/TableScene perceptual work, no gameplay-readability, no Cacharro, no El Caos, no engine changes, no web↔game cohesion (Fase 4), no Rincón Fase 1 yet. The only mesa-touching artifact is the **already-validated** `d554176` (§4), shipped as-is or held per your call.
