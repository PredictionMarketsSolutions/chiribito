# Chiribito — Card Reveal Materiality (L2a) Handoff

> **STATUS: SHIPPED LIVE 2026-05-23.** Gate-APPROVED on device, merged FF to `main`, pushed to
> `origin/main` (`bb0fca2`), deployed to production: `chiribito-play` deploy
> `dpl_Dz3dAaKa53k9uPMmhL5NfSb9mR9J`, aliased **play.chiribito.com** (HTTP 200). Branch
> `style/card-reveal-materiality` kept. Rollback: Vercel instant rollback + tag `pre-rincon-release-2026-05-23`.
> Second step of the **Premium Table / Physicality Pass** milestone, after L1 (Card Deal Materiality).
> Spec: `docs/superpowers/specs/2026-05-23-chiribito-card-reveal-materiality-l2a-design.md`.
> Plan: `docs/superpowers/plans/2026-05-23-chiribito-card-reveal-materiality-l2a.md`.

---

## What this delivers

A real **back→face flip** on community-card reveal: the card arrives as its clean unbranded back
(`back-clean.svg`) and **turns over** to reveal its face — replacing the old "slide in already
face-up" (street reveal) and "flat alpha fade" (all-in reveal). One unified gesture across both
paths. The intent is **more materiality, not more spectacle** — "someone turns a real card",
never a UI animation.

## Scope boundary (DESKTOP ONLY)

Pixi `TableScene` only. Mobile (`≤768px`) hides `#pixi-layer` and renders the board via DOM, so
L2a has **no effect on mobile** (verified: the mobile capture is unchanged vs baseline). Mobile
reveal materiality is a separate DOM pass, deferred.

## Decisions (locked via brainstorming 2026-05-23)

- **Unify** both reveal paths (street + all-in), centralized through `setBoardCards`/`flipReveal`.
- **True back→face flip:** rendered-width scales toward an edge-on floor, texture swaps at the
  midpoint, width grows back. A 2D turn, **not** a rotation — board stays at **0°**.
- **Flip only this cut;** the "highlights MUY sutiles" half is deferred to **L2b** (one perceptual
  variable per gate).
- **Composition:** street = slide-as-back using the **exact shipped L1 weight (unchanged)** → flip
  on arrival; all-in = the **same flip** in place.
- **Operator adjustments:** `FLIP_DURATION = 0.30s`; `FLIP_MIN_WIDTH_FACTOR = 0.05` (never edge-on
  zero — avoids shimmer); **no randomization** in L2a (deterministic, identical flip); anchor
  confirmed centered (board sprites `anchor.set(0.5)`).

## Files

- `frontend/src/game/table/reveal-motion.ts` (new) — pure `FLIP_DURATION` / `FLIP_EASE` /
  `FLIP_MIN_WIDTH_FACTOR` + `flipState(progress)`. No pixi/gsap; unit-tested.
- `frontend/src/game/table/reveal-motion.test.ts` (new) — 6 vitest specs.
- `frontend/src/game/table/TableScene.ts` (modified) — `flipReveal` + `boardFlipTweens` +
  `cancelBoardFlip`/`cancelAllBoardFlips`; street + all-in wiring; cancel-safety across
  `measureLayout`, `setBoardCards`, `revealAllInSequential`, `cancelAllInReveal`, `reset`,
  `playRoundEndCollectThen`.

## Commits (branch, oldest→newest)

- `ce22f55` docs: design spec
- `5dd6cc8` docs: implementation plan
- `487752a` feat: pure reveal-motion module
- `2c8df7c` feat: cancel-safe flipReveal infrastructure (unwired)
- `d44ed74` feat: street reveal deals as back then flips face-up
- `c12e73c` feat: all-in reveal uses the shared flip + exhaustive cancel-safety
- (+ this handoff doc commit)

## Verification (all green)

- Frontend **Vitest 284/284** (278 baseline + 6 new `reveal-motion`).
- `tsc --noEmit`: only the **12 pre-existing** errors, **none in `game/table/`**.
- Diff is **frontend-only** — no `src/` (game server) or `api-server/` files.
- **Runtime capture** (`dev:stack` + Playwright, 2 players, desktop 1920×1080 + Pixel 5): four
  **consecutive** reveals, **zero `pageerror` / `console.error`**; resting state clean (cards
  face-up, board 0°, no edge-on leak); **mobile unchanged**. Artifacts (gitignored):
  `.dev-stack/diag/reveal-materiality/{baseline,after}/` + `.dev-stack/diag-reveal-materiality.ts`.
- **Perceptual gate (operator, on device): APPROVED** — "feels physical and natural; adds
  materiality without spectacle; no casino drift, no 'gamey' energy; integrates well across
  consecutive hands." The consecutive-reveals "robotic / digital-machine" watch passed.

## Frozen (unchanged this cut)

Highlight (L2b) · mobile DOM reveal · engine/managers/geometry · card SIZE (locked-good) ·
`El Cacharro` (deep) · `El Caos`. Identity invariants intact (felt oval verde, wood 16px + gold
rim, `max-width` 980, seats 6%/94%, Fournier `.webp`, castizo vocab, board 0°). **L1 deal weight
intact.**

## Tuning knobs (`reveal-motion.ts`)

`FLIP_DURATION` (0.30; range 0.30–0.32) · `FLIP_EASE` (`power2.inOut`) ·
`FLIP_MIN_WIDTH_FACTOR` (0.05; range 0.04–0.06).

## Open items / next candidates

- **push/deploy L2a** — DONE 2026-05-23. Pushed (`origin/main` `bb0fca2`) + deployed via
  `vercel --prod` (frontend → `chiribito-play` / play.chiribito.com, deploy
  `dpl_Dz3dAaKa53k9uPMmhL5NfSb9mR9J`, HTTP 200).
- **L2b** — reveal highlight MUY sutil (the deferred half of card materiality).
- **Mobile reveal materiality** — the DOM card path (separate from Pixi).
- **R1:** Render free Postgres expires **~2026-06-12** — upgrade to `starter` ($7/mo) before then.

## Integration / rollback

Branch `style/card-reveal-materiality` merged FF to local `main`. push/deploy gated (no
auto-deploy). To ship later: `git push origin main` + manual `vercel --prod`. Rollback anchors:
tag `pre-rincon-release-2026-05-23`, Vercel instant rollback, and the L1 deploy is independent and
earlier. `main` can be reset to `c59c678` (pre-L2a) before any push if needed — production is
untouched until an explicit deploy.
