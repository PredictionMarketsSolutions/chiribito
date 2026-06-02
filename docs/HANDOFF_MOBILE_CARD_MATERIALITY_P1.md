# Chiribito — Mobile Card Materiality (P1) Handoff

> **STATUS 2026-06-02: Fase 0 + 1 + 3 + 4 + settle-on-deal (RESTING half) SHIPPED-LOCAL on
> branch `feat/mobile-card-reconcile`. NOT pushed, NOT merged, NOT deployed.** Branch off
> `8266e93`. Commits: `99795ff` (Fase 1) → `d584ad8` (Fase 3) → `b242093` (Fase 4) →
> + the settle-on-deal resting tilt (this change). Fases 0/1/3/4 gate/runtime-validated; the
> resting tilt is unit-tested (319/319 vitest) + coherence-validated, **AWAITING the operator
> perceptual gate on device** (no runtime capture this pass — see §5). Milestone direction:
> "misma alma, distinto medium" + **"la mesa respira, nunca actúa."**

---

## Why this milestone
L1 (deal) + L2a (reveal flip) shipped the Premium Table physicality on **desktop only** — the
Pixi canvas is `display:none` at `≤768px`, so mobile renders cards via DOM and got **none** of the
materiality. P1 brings the reveal physicality to the mobile DOM path. Mobile-first + anti-casino:
translate the *feel*, not the desktop choreography; mobile is more sober than desktop.

## 1. Current REAL state
- Branch `feat/mobile-card-reconcile` (off `main` `8266e93`). `main` untouched.
- `8266e93` → `99795ff` (Fase 1 reconcile) → `d584ad8` (Fase 3 flip) → `b242093` (Fase 4 cleanup + guard).
- Working tree: clean. The `docs/POSTGRES_MIGRATION_CHECKLIST.md` (R1 ops track) now lives committed
  on the separate branch `chore/postgres-starter-r1` (`4ca7097`), not here; `.dev-stack/` stays gitignored.
- Tests: **312/312 vitest**, prod build clean. `tsc --noEmit`: 12 pre-existing errors, **0 in touched files**.
- Production (`play.chiribito.com`) is UNCHANGED — nothing shipped to it.

## 2. What is perceptually VALIDATED (do not re-litigate)
- **Fase 0 baseline** — operator reviewed mobile vs desktop reveal capture.
- **Fase 1 reconcile** — gate: zero visible change (resting state identical; only churn removed).
  The micro-flicker reduction was accepted as "cero cambio perceptual" (technical churn removal,
  in spirit of "la mesa respira, nunca actúa").
- **Fase 3 flip** — gate: the mobile reveal is a sober back→face turn (a card turned by a hand),
  not app-y/snappy/gamey/flashy. Confirmed at runtime as a clean **2D scaleX** turn
  `matrix(0.21,0,0,1,0,0)`, floor ~0.16, **no overshoot/bounce**, board stays 0°, transition off.

## 3. What is FROZEN (do not reopen without explicit "go")
- Desktop Pixi path (L1/L2a) — untouched.
- Engine / managers / geometry / glossary.
- `Cacharro` / `La Verbena` / `El Caos`.
- Card SIZE (locked-good).
- Identity invariants: felt oval verde, wood 16px + gold rim, max-width 980, seats 6%/94%,
  Fournier `.webp`, castizo vocab, **board 0°**.
- The validated perceptual philosophy + "una variable por gate" discipline.

## 4. What's left to do
- **Fase 4 — DONE 2026-05-27 (`b242093`).** Deleted the orphaned dead CSS (`.card.is-revealing` +
  `@keyframes card-flip-reveal`, plus the sibling `.card.is-dealing` + `@keyframes card-deal-in` —
  same dead Fase-5-GSAP pattern, grep-verified 0 usages); added a table-scoped
  `prefers-reduced-motion` guard on `#community-cards`/`#hand-cards` rows (`transition`/`animation`
  → none) since the JS driver already no-ops. Runtime-validated (Playwright + dev:stack): reduced
  motion suppresses the flip, the table-card transition computes to `0s`, faces still render, a
  reconnect reload leaves no stuck card; the normal flip still fires (scaleX→0.19) and survives a
  4x CPU throttle (scaleX→0.17). 312/312 vitest, prod build clean, tsc unchanged. Harness:
  `.dev-stack/cardmat-fase4-verify.ts` (gitignored).
- **settle-on-deal — RESTING half DONE 2026-06-02 (awaiting operator gate).** The mobile DOM hole
  cards now rest at their deterministic "placed by a hand" angle (`restingRotationFor` — the SAME
  source desktop Pixi uses at `TableScene.ts`), as a STATIC tilt: transforms only, ≤1.5°, pivot
  centre, board row untouched (stays 0°). Static by design — a card at rest is a STATE, not an
  animation, so it carries weight/presence without movement → cannot read app-y/casino and needs no
  reduced-motion guard. Applied synchronously right after `renderCardRow`, so the node is born
  tilted (no `.card` ease-spring transition fires → no overshoot, a clean rest not a settle).
  Deterministic → reconnect/resync re-applies the identical angle, never jitters. New pure module
  `frontend/src/ui-cards-rest.ts` (+ `ui-cards-rest.test.ts`, 7 cases); wired at the
  `frontend/src/game/game-ui.ts` hand-row render (1 import + 1 call). 319/319 vitest, tsc unchanged
  (12 pre-existing, 0 in touched files), prettier clean.
- **Deferred (still — its own future gate):** the MOTION half of settle-on-deal — an optional
  weighted *settle* (the card easing into its resting angle on deal, e.g. `power3.out` +
  `HOLE_DEAL_PRE_ROT`). Held back on purpose: it adds movement = a NEW perceptual variable. Open it
  only if the operator wants more life *after* gating the static rest. ONE variable per gate.
- **Ship P1:** push branch + open PR (or FF to main) + manual `vercel --prod` — all gated, after
  operator OK. Nothing is pushed/deployed yet.

## 5. Open risks
- **R1 — Render free Postgres expires ~2026-06-12 (~19 days).** Operator decision: Path A in-place
  upgrade to Starter, preserve data; execute this week. Steps in
  `docs/POSTGRES_MIGRATION_CHECKLIST.md` (untracked, separate). NOT executed.
- **Discovery (resolved, but note it):** a dormant pre-existing 3D flip (`.card.is-revealing` →
  `card-flip-reveal`, rotateY −110°, 700ms) was unmasked by Fase 1's node persistence and was
  overriding the sober flip. Disabled its trigger in `feedback.ts` (reveal SOUND kept). The
  Fase 0 "baseline" was characterized from code + a resting still, not a frame-watch — it may have
  intermittently shown that old 3D flip on mobile. The real before/after is the two webms below.
- Mobile flip verified via Playwright on Pixel 5 emulation, not yet on a physical low-end device.
- **Resting tilt (2026-06-02): coherence-validated only — NO runtime capture this pass.** dev:stack
  was down; mounting the full game (postgres+api+colyseus, 2-player deal) for a static ≤1.5° tilt was
  judged disproportionate AND no substitute for the on-device gate. Covered instead by: 7 unit tests,
  the deterministic reuse of `restingRotationFor`, and a by-construction no-overshoot argument (sync
  pre-paint application). **Operator gate (canonical):** `npm run dev:stack` → join a 2-player mesa
  on a mobile viewport (Pixel 5 / a real phone) → deal a hand → confirm the two hole cards rest very
  slightly, asymmetrically off-flat (weight/presence), stay fully legible, do NOT settle/bounce on
  appearance, and do NOT jitter across a reconnect. Optional objective capture available on request
  (a Playwright transform-sampler mirroring `.dev-stack/cardmat-mobile-flip-verify.ts`).

## 6. Recommended next milestone
**Fase 4 is done.** Remaining for P1: the **deferred settle-on-deal** (its own gated variable),
then **ship P1** (push + PR/FF + manual `vercel --prod`, gated). Either can lead — settle-on-deal
completes the mobile materiality story; shipping realizes Fase 0/1/3/4 for real (mobile) users now.

## 7. What NOT to touch
- Don't reopen validated gates (Fase 0/1/3) or the perceptual philosophy.
- Don't add motion beyond the single validated flip without a new gate (one variable per gate).
- Don't touch the desktop Pixi path, engine, geometry, card size, or identity invariants.
- Don't push/merge/deploy without explicit operator OK (manual, always).
- Keep the Postgres checklist a separate track.

## Files (this milestone)
- `frontend/src/game/table/reveal-motion.ts` (+test) — `flipState(minWidthFactor)` + pure `flipEaseInOut`.
- `frontend/src/ui-cards.ts` (+test) — keyed reconcile + `renderCardRow` `onReveal` (single back→face).
- `frontend/src/ui-cards-flip.ts` (+test) — DOM flip driver (rAF, transforms-only, reduced-motion,
  detach-safe). Knobs: `MOBILE_FLIP_MIN_WIDTH_FACTOR` 0.16, `MOBILE_FLIP_DURATION_MS` 300.
- `frontend/src/game/game-ui.ts`, `frontend/src/main.ts`,
  `frontend/src/app/room-session-controller.ts` — wire `onReveal` into the community render paths.
- `frontend/src/feedback.ts` — removed `.is-revealing` tagging (kept reveal sound).

## Artifacts (gitignored, preserved on disk)
- Baseline (old behavior): `.dev-stack/diag/reveal-materiality/p1-baseline/reveals-{mobile,desktop}.webm`
- After Fase 3 (sober flip): `.dev-stack/diag/reveal-materiality/p1-fase3-after/reveals-{mobile,desktop}.webm`
- Verification harness: `.dev-stack/cardmat-mobile-flip-verify.ts` (samples computed transform to
  prove the flip fires + apples-to-apples webms). Reuses `.dev-stack/diag-reveal-materiality.ts`.

## Resume protocol
1. `cd` to the repo, `git status`, confirm branch `feat/mobile-card-reconcile` at `d584ad8`.
2. `npm run dev:stack` (postgres/api/game/frontend on localhost) if not running.
3. Re-read this handoff. Do NOT re-open validated gates.
4. Start Fase 4 with the 6-point format; one perceptual variable per gate; DEFAULT STOP on ambiguity.
