# Card Deal Materiality (L1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a dealt card feel like "someone places the card" (weight + human settle + imperfection) without any arcade/bounce/flashy motion, touching only card deal animation.

**Architecture:** Extract a pure, dependency-free `deal-motion` module (constants + a deterministic resting-rotation helper) so the "placed by hand" angle is unit-testable without the Pixi scene. Wire it into `TableScene`'s hole-card deal (weighted ease + per-card resting micro-rotation) and board deal (weighted ease only, 0°). A deterministic angle + rotation-clearing on every hidden/reset path prevents jitter, leak, and reconnect jump. The existing contact-shadow ticker mirrors rotation automatically — no shadow code changes.

**Tech Stack:** TypeScript, Vite, Vitest (happy-dom), PixiJS 7, GSAP. Frontend package at `frontend/`.

**Spec:** `docs/superpowers/specs/2026-05-23-chiribito-card-deal-materiality-design.md`

**Branch:** `style/card-deal-materiality` (already created). No merge / push / deploy without explicit operator OK.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `frontend/src/game/table/deal-motion.ts` | Pure deal-motion constants + `restingRotationFor` (no pixi/gsap import) | Create |
| `frontend/src/game/table/deal-motion.test.ts` | Vitest unit tests for the pure helper | Create |
| `frontend/src/game/table/TableScene.ts` | Pixi table scene — wire deal-motion into hole + board deal, clear rotation on hide/reset | Modify |

**Testing note (grounded in infra):** Vitest runs under happy-dom (no WebGL); no existing test imports pixi.js or `TableScene`, and instantiating `TableScene` requires a real Pixi `Application`. So the **pure helper is fully unit-tested (Task 1)**; the `TableScene` wiring (Tasks 2–3) is verified by **zero-regression on the existing suite + the Playwright baseline-vs-after + the on-device feel gate**. The ease/weight/settle is motion and is not unit-testable here — project lesson: tests green ≠ UX works.

---

## Task 1: Pure deal-motion module (TDD)

**Files:**
- Create: `frontend/src/game/table/deal-motion.ts`
- Test: `frontend/src/game/table/deal-motion.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/game/table/deal-motion.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { restingRotationFor, HOLE_REST_ROT_MAX } from "./deal-motion";

describe("restingRotationFor", () => {
  it("is deterministic — same inputs return the same angle on every call", () => {
    expect(restingRotationFor(0, 0)).toBe(restingRotationFor(0, 0));
    expect(restingRotationFor(3, 1)).toBe(restingRotationFor(3, 1));
  });

  it("stays within the conservative magnitude bound (incl. wrap-around slots)", () => {
    for (let v = 0; v < 12; v += 1) {
      for (let c = 0; c < 2; c += 1) {
        expect(Math.abs(restingRotationFor(v, c))).toBeLessThanOrEqual(HOLE_REST_ROT_MAX + 1e-9);
      }
    }
  });

  it("leans the two cards of a pair differently (never mirror-perfect)", () => {
    for (let v = 0; v < 6; v += 1) {
      expect(restingRotationFor(v, 0)).not.toBe(restingRotationFor(v, 1));
    }
  });

  it("never returns NaN, even for out-of-range indices", () => {
    expect(Number.isNaN(restingRotationFor(99, 0))).toBe(false);
    expect(Number.isNaN(restingRotationFor(99, 1))).toBe(false);
    expect(Number.isNaN(restingRotationFor(0, 5))).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/game/table/deal-motion.test.ts`
Expected: FAIL — `Failed to resolve import "./deal-motion"` (module does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/game/table/deal-motion.ts`:

```ts
/**
 * Deal-motion constants + the deterministic resting-rotation helper for hole
 * cards. Pure and dependency-free (no pixi/gsap) so the "placed by hand" angle
 * can be unit tested without instantiating the Pixi TableScene.
 */

// One notch heavier than the previous power2.out: the card decelerates with
// more authority so it reads as having weight, not gliding to a frictionless
// stop. Shared by hole + board deal so the sense of weight is consistent.
export const DEAL_EASE = "power3.out";

// Hole-card resting rotation max: a card placed by a human hand never lands at
// exactly 0deg. Tiny, conservative. Radians.
export const HOLE_REST_ROT_MAX = (1.5 * Math.PI) / 180; // ~0.0262 rad = 1.5deg

// Extra rotation the card carries in flight, shed as it settles into its
// resting angle — a hand turning the card down onto the felt. Set to 0 to make
// the card slide in already at its resting angle (pure positional weight).
export const HOLE_DEAL_PRE_ROT = (1.0 * Math.PI) / 180; // ~0.0175 rad = 1.0deg

// Fixed per-(slot, card) lean factors in [-1, 1], multiplied by
// HOLE_REST_ROT_MAX. Deterministic (no Math.random at call time): the same
// seat/card always rests at the same slight angle, so re-renders and reconnects
// never jitter or jump. The two cards of a pair lean differently so a hand
// never looks mirror-perfect.
const LEAN_FACTORS: readonly (readonly [number, number])[] = [
  [-0.9, 0.5],
  [0.7, -1.0],
  [-0.5, 0.85],
  [1.0, -0.6],
  [-0.75, 0.95],
  [0.6, -0.8],
];

/**
 * Deterministic resting rotation (radians) for a hole card at
 * (visualSlot, cardIndex). Bounded by HOLE_REST_ROT_MAX. Pure: depends only on
 * its inputs.
 */
export function restingRotationFor(visualSlot: number, cardIndex: number): number {
  const seat = LEAN_FACTORS[((visualSlot % LEAN_FACTORS.length) + LEAN_FACTORS.length) % LEAN_FACTORS.length];
  const factor = seat[cardIndex % 2] ?? 0;
  return factor * HOLE_REST_ROT_MAX;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/game/table/deal-motion.test.ts`
Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/game/table/deal-motion.ts frontend/src/game/table/deal-motion.test.ts
git commit -m "feat(table): pure deal-motion module — weighted ease + deterministic resting rotation"
```

---

## Task 2: Wire weighted ease + resting rotation into the hole-card deal

**Files:**
- Modify: `frontend/src/game/table/TableScene.ts` (import; `syncFromState` hole loop)

- [ ] **Step 1: Add the import**

After the existing import on line 23 (`import { isInWinnerPhase } from "../winner-display";`), add:

```ts
import { DEAL_EASE, HOLE_DEAL_PRE_ROT, restingRotationFor } from "./deal-motion";
```

- [ ] **Step 2: Update the hole-card loop in `syncFromState`**

Replace this exact block (the `for (let c = 0; c < 2; c += 1)` body inside `syncFromState`):

```ts
        if (!hasCard) {
          spr.visible = false;
          spr.alpha = 0;
          gsap.killTweensOf(spr);
          this.prevHoles[v][c] = undefined;
        } else {
          const pos = this.holePosFor(v, c);
          const isNew = prevSlot === undefined && hasCard && Boolean(state.roundStarted);
          if (isNew) {
            spr.visible = true;
            spr.alpha = 1;
            spr.position.set(this.deckPos.x, this.deckPos.y);
            gsap.to(spr, { x: pos.x, y: pos.y, duration: 0.45, ease: "power2.out", delay: c * 0.08 });
          } else {
            gsap.killTweensOf(spr);
            spr.position.set(pos.x, pos.y);
            spr.visible = true;
            spr.alpha = 1;
          }
          this.prevHoles[v][c] = nextId ?? "BACK";
        }
```

with:

```ts
        if (!hasCard) {
          spr.visible = false;
          spr.alpha = 0;
          spr.rotation = 0;
          gsap.killTweensOf(spr);
          this.prevHoles[v][c] = undefined;
        } else {
          const pos = this.holePosFor(v, c);
          const restRot = restingRotationFor(v, c);
          const isNew = prevSlot === undefined && hasCard && Boolean(state.roundStarted);
          if (isNew) {
            spr.visible = true;
            spr.alpha = 1;
            spr.position.set(this.deckPos.x, this.deckPos.y);
            // Carry a touch more rotation in flight, shed into the resting angle
            // as it settles — a hand turning the card down onto the felt. The
            // pre-rotation extends the resting lean so the card unwinds toward,
            // never past, its final angle (no overshoot).
            spr.rotation = restRot + Math.sign(restRot || 1) * HOLE_DEAL_PRE_ROT;
            gsap.to(spr, {
              x: pos.x,
              y: pos.y,
              rotation: restRot,
              duration: 0.45,
              ease: DEAL_EASE,
              delay: c * 0.08,
            });
          } else {
            gsap.killTweensOf(spr);
            spr.position.set(pos.x, pos.y);
            spr.rotation = restRot;
            spr.visible = true;
            spr.alpha = 1;
          }
          this.prevHoles[v][c] = nextId ?? "BACK";
        }
```

(The snap `else` branch sets `spr.rotation = restRot` so re-sync / reconnect / showdown back→face transitions land at the SAME resting angle — no jump to 0°, no jitter. The `!hasCard` branch clears to 0 so a reused sprite never leaks a previous angle.)

- [ ] **Step 3: Type-check the frontend**

Run: `cd frontend && npx tsc --noEmit`
Expected: only the **12 pre-existing errors** (none in `game/table/`). No new errors referencing `deal-motion`, `restRot`, `DEAL_EASE`, or `rotation`.

- [ ] **Step 4: Run the full frontend suite (no regression)**

Run: `cd frontend && npx vitest run`
Expected: PASS — all prior tests green + the 4 new `deal-motion` tests. (Baseline at release was 274; expect 278.)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/game/table/TableScene.ts
git commit -m "style(table): deal hole cards with weight + a placed-by-hand resting tilt"
```

---

## Task 3: Board weighted ease + rotation lifecycle clears

**Files:**
- Modify: `frontend/src/game/table/TableScene.ts` (`setBoardCards`, `hideHoleSlot`, `reset`)

- [ ] **Step 1: Give the board deal the weighted ease (no rotation — board stays 0°)**

In `setBoardCards`, replace:

```ts
      if (animateNew && !had) {
        spr.visible = true;
        spr.alpha = 1;
        spr.position.set(this.deckPos.x, this.deckPos.y);
        gsap.to(spr, { x: pos.x, y: pos.y, duration: 0.5, ease: "power2.out", delay: i * 0.06 });
      } else {
```

with:

```ts
      if (animateNew && !had) {
        spr.visible = true;
        spr.alpha = 1;
        spr.position.set(this.deckPos.x, this.deckPos.y);
        // Weight only on the board — the focal row stays at 0deg for reading
        // clarity (board micro-rotation is deferred to L2).
        gsap.to(spr, { x: pos.x, y: pos.y, duration: 0.5, ease: DEAL_EASE, delay: i * 0.06 });
      } else {
```

- [ ] **Step 2: Clear rotation in `hideHoleSlot`**

Replace:

```ts
  private hideHoleSlot(visualSlot: number): void {
    for (let c = 0; c < 2; c += 1) {
      const spr = this.holeSprites[visualSlot][c];
      gsap.killTweensOf(spr);
      spr.visible = false;
      spr.alpha = 0;
    }
  }
```

with:

```ts
  private hideHoleSlot(visualSlot: number): void {
    for (let c = 0; c < 2; c += 1) {
      const spr = this.holeSprites[visualSlot][c];
      gsap.killTweensOf(spr);
      spr.visible = false;
      spr.alpha = 0;
      spr.rotation = 0;
    }
  }
```

- [ ] **Step 3: Clear rotation in `reset`**

In `reset()`, replace:

```ts
    this.collectAllCardSprites().forEach((s) => {
      s.visible = false;
      s.alpha = 0;
    });
```

with:

```ts
    this.collectAllCardSprites().forEach((s) => {
      s.visible = false;
      s.alpha = 0;
      s.rotation = 0;
    });
```

- [ ] **Step 4: Type-check + full suite**

Run: `cd frontend && npx tsc --noEmit`
Expected: only the 12 pre-existing errors.
Run: `cd frontend && npx vitest run`
Expected: PASS — same green count as Task 2 (278).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/game/table/TableScene.ts
git commit -m "style(table): weight on board deal + clear card rotation on hide/reset"
```

---

## Task 4: Verification gate (automated)

**Files:** none (verification only)

- [ ] **Step 1: Confirm the frontend type-check is clean**

Run: `cd frontend && npx tsc --noEmit`
Expected: only the 12 pre-existing errors, none in `game/table/`.

- [ ] **Step 2: Confirm the full frontend suite is green**

Run: `cd frontend && npx vitest run`
Expected: all green, including the 4 new `deal-motion` tests.

- [ ] **Step 3: Confirm git state**

Run: `git -C .. log --oneline -4` (or `git log --oneline -4` from repo root)
Expected: 3 new commits on `style/card-deal-materiality` (spec already committed at `9243eb8`).
Expected: `git status` clean; `main` untouched; nothing pushed.

---

## Validation & Perceptual Gate (interactive — run after the code tasks)

This is the runtime probe ladder, L1, **default stop on ambiguous**. Not a code task.

1. **Baseline vs after (apples-to-apples).** Start `npm run dev:stack` (postgres 5432 / api 3000 / game 2567 / frontend 5173). Drive a ≥2-player hand to a dealt state via Playwright. Capture the same hand state on `main` (baseline) and on `style/card-deal-materiality` (after) at the **primary viewport 1920×1080 + sidebar open**, plus a **mobile sanity** pass (Pixel 5 / 390×844). Capture scripts live under `.dev-stack/` (gitignored).
2. **What stills prove vs not.** A still shows the **resting rotation** (before: aligned; after: hand-placed askew) and the shadow tilting with it. The stills **cannot** show the ease/weight/settle (that is motion).
3. **Device feel gate (operator).** The weight / friction / settle is judged live on a real device by the operator. Apply the 6 north-star principles + "does it preserve identity and avoid casino/arcade drift?".
4. **Outcome.** Feel good → propose commit is already done; await operator OK for any merge/push/deploy. Feel ambiguous → **DEFAULT STOP**: do not escalate magnitude/ease "one more notch"; tune down (e.g., `HOLE_DEAL_PRE_ROT = 0`, smaller `HOLE_REST_ROT_MAX`, ease back toward `power2.out`) or falsify and discard the branch. `main`/production untouched throughout.

---

## Self-Review

**Spec coverage:**
- Weighted ease (hole + board) → Task 2 Step 2 (`DEAL_EASE` on hole), Task 3 Step 1 (board). ✓
- Deterministic per-card resting micro-rotation on hole cards → Task 1 (`restingRotationFor`) + Task 2 Step 2 (deal tween + snap). ✓
- Board stays 0° → Task 3 Step 1 (ease only, no rotation). ✓
- Determinism + lifecycle (set on shown paths, clear on hidden/reset) → Task 2 (snap sets, no-card clears) + Task 3 (hideHoleSlot + reset clear). ✓
- Tunable constants block → Task 1 (`DEAL_EASE`, `HOLE_REST_ROT_MAX`, `HOLE_DEAL_PRE_ROT`). ✓
- Not touched: card size / geometry / felt / pot / shadow logic / reveal / highlights / engine → no task touches these. ✓
- Testing: pure helper unit-tested (Task 1); wiring via suite-green + Playwright + device (Task 4 + Validation). ✓
- Validation: probe ladder, baseline-vs-after, device gate, default stop → Validation section. ✓
- Git: branch isolation, no merge/push/deploy without OK → header + Task 4 + Validation. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every command shows expected output. ✓

**Type consistency:** `restingRotationFor(visualSlot, cardIndex)` signature matches across Task 1 (def) and Task 2 (use). `DEAL_EASE`, `HOLE_DEAL_PRE_ROT`, `HOLE_REST_ROT_MAX` names consistent. `restRot` local consistent within Task 2. ✓
