# Chiribito — Card Deal Materiality (L1) Handoff

> **STATUS: merge candidate. Perceptual gate APPROVED on device 2026-05-23.**
> Branch `style/card-deal-materiality`. `main` untouched, nothing pushed, no deploy.
> First step of the **Premium Table / Physicality Pass** milestone.

---

## What this delivers

Deal motion materiality — making a dealt card read as **"someone places the card"** (weight,
human settle, slight imperfection) instead of a sprite sliding to a stop. **L1 = deal only.**

- **Hole cards:** heavier deceleration ease (`power3.out`) + a **deterministic per-card resting
  micro-rotation** (±1.5°) the card settles into (turns into place, no overshoot). Each seat/card
  leans slightly differently; the contact shadow follows the rotation automatically.
- **Board cards:** the heavier ease (weight) only — they stay at **0°** to protect the focal
  row's reading clarity.
- **Lifecycle:** the resting angle is a pure function of `(seat, card)` — set on every shown path
  (deal + snap/reconnect), cleared to 0 on every hidden/reset path. No jitter, no leak, no
  reconnect jump.

## Scope boundary (important — DESKTOP ONLY)

Mobile (`≤768px`) **hides the Pixi canvas** (`#pixi-layer { display:none }` in `style.css`) and
renders cards via **DOM zones**. This L1 lives in the Pixi `TableScene`, so **it has no effect on
mobile** (verified: mobile clip shows the unchanged DOM behavior — confirms no regression).
**Mobile materiality is a separate effort on the DOM card path — an L2 / follow-up candidate.**

## Files

- `frontend/src/game/table/deal-motion.ts` (new) — pure constants + `restingRotationFor` (no
  pixi/gsap; unit-tested).
- `frontend/src/game/table/deal-motion.test.ts` (new) — 4 vitest specs.
- `frontend/src/game/table/TableScene.ts` (modified) — wire ease + rotation into hole deal,
  board ease, rotation lifecycle clears.

## Commits (branch, oldest→newest)

- `9243eb8` docs: design spec
- `729ab04` docs: implementation plan
- `dc1e550` feat: pure deal-motion module
- `a644201` style: hole-card deal weight + resting tilt
- `1cc4007` style: board ease + rotation lifecycle clears

## Verification (all green)

- Frontend Vitest **278/278** (274 baseline + 4 new `deal-motion`).
- `tsc --noEmit`: only the **12 pre-existing** errors, **none in `game/table/`**.
- Game-server / api-server suites: **not run — no `src/` or `api-server/` files changed**
  (frontend-only diff; structurally unaffected).
- Baseline-vs-after captures + a deal video, apples-to-apples (dev:stack + Playwright, desktop
  1920×1080 + Pixel 5). Artifacts (gitignored) under `.dev-stack/diag/depth/cardmat-*`.
- **Perceptual gate (operator, on device): APPROVED** — "more physical and human without losing
  sobriety." No casino/arcade drift.

## Frozen (unchanged this milestone)

gameplay redesign · deep readability · engine/managers · core table geometry · card SIZE
(locked-good) · El Cacharro (deep) · El Caos. Identity invariants intact (felt, wood+rim,
max-width 980, seats 6%/94%, Fournier `.webp`, castizo vocab).

## Open items / risks

- **R1 (calendar, real):** Render free Postgres expires **~2026-06-12** — upgrade to `starter`
  ($7/mo, one click) before then.
- **Tuning knobs** (if a future pass wants to adjust the feel): `DEAL_EASE`, `HOLE_REST_ROT_MAX`,
  `HOLE_DEAL_PRE_ROT` in `deal-motion.ts`.

## Next-step candidates (operator chooses)

- **L2 — reveal-con-alma** (replace the flat all-in alpha fade with a subtle flip) + **highlights
  MUY sutiles** (the deferred half of card materiality).
- **Mobile materiality** — bring the deal feel to the DOM card path (separate from Pixi).
- Other Physicality Pass surfaces (chips/stacks build, felt material depth — needs go, touches a
  locked invariant).

## Integration / rollback

Single isolated branch off `main`. Merge requires explicit operator OK (Chiribito governance);
deploy is a separate manual step (no auto-deploy). If rejected, discard the branch — `main` and
production are untouched. Release rollback anchor `pre-rincon-release-2026-05-23` still valid.
