# Card Reveal Materiality (L2a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a community-card reveal read as "someone turns the card over" — a real back→face flip — unified across the street and all-in reveal paths, desktop Pixi only.

**Architecture:** A new pure, dependency-free module `reveal-motion.ts` (constants + `flipState(progress)` curve, unit-tested) drives a GSAP turn inside a single shared `TableScene.flipReveal()`. The street path deals the card as its clean back with the EXACT shipped L1 weight, then flips on arrival; the all-in path performs the same flip in place. The flip is fully cancel-safe and never fires on resync/reconnect.

**Tech Stack:** TypeScript (Vite), PixiJS v7 sprites, GSAP tweens, Vitest. Frontend only.

**Spec:** `docs/superpowers/specs/2026-05-23-chiribito-card-reveal-materiality-l2a-design.md`

---

## Anti-drift checklist (operator-mandated — re-read before EVERY task and at the gate)

- [ ] **No casino.** No glow, halo, neon, gold burst, particle, shine sweep.
- [ ] **No flourish.** No extra flair beyond the turn itself.
- [ ] **No bounce.** Ease is `power2.inOut`; never `back`/`elastic`/`bounce`.
- [ ] **No overshoot.** Width lands at exactly `boardCardW`, never past.
- [ ] **No "ta-da".** No sound, no scale-pop, no emphasis pulse (highlight is L2b, not here).
- [ ] **No visual-intensity increase.** The reveal is quieter or equal to today, not louder.
- [ ] **Clarity > spectacle.** If the turn ever competes with reading the board, it's wrong.
- [ ] **Materiality > animation.** Goal is "a real card was turned", not "the UI played a clip".

If any task tempts a deviation from the above → STOP and surface it to the operator.

---

## File Structure

- **Create** `frontend/src/game/table/reveal-motion.ts` — pure flip constants + `flipState`. One responsibility: describe the turn curve. No pixi/gsap.
- **Create** `frontend/src/game/table/reveal-motion.test.ts` — Vitest specs for `flipState`.
- **Modify** `frontend/src/game/table/TableScene.ts` — import the module; add `boardFlipTweens` state + `flipReveal` / `cancelBoardFlip` / `cancelAllBoardFlips`; wire the street + all-in paths; add cancel-safety to `measureLayout`, `setBoardCards`, `revealAllInSequential`, `cancelAllInReveal`, `reset`, `playRoundEndCollectThen`.
- **Create** `.dev-stack/diag-reveal-materiality.ts` — Playwright baseline/after/video capture harness (gitignored, local-only — `.dev-stack/` is already ignored).

No other files. No `src/` (game server) or `api-server/` changes.

---

## Task 0: Pre-flight verification

**Files:** none (verification only).

- [ ] **Step 1: Confirm the isolated branch**

Run: `git -C . rev-parse --abbrev-ref HEAD`
Expected: `style/card-reveal-materiality`

- [ ] **Step 2: Confirm board sprites are center-anchored (operator adjustment D)**

Open `frontend/src/game/table/TableScene.ts` and confirm the board-sprite creation loop sets a centered anchor:

```ts
for (let i = 0; i < 5; i += 1) {
  const s = new Sprite(textureForUrl(getCardTextureUrl(undefined)));
  s.anchor.set(0.5);   // <-- MUST be 0.5; the width-shrink relies on a centered anchor
```

Expected: `s.anchor.set(0.5)` present. If it is NOT 0.5, STOP and surface to the operator — do not proceed.

- [ ] **Step 3: Confirm a green baseline**

Run: `cd frontend && npx vitest run`
Expected: PASS (current baseline — 278 specs from the L1 cut; record the exact number you see).

---

## Task 1: Pure module `reveal-motion.ts` + tests (TDD)

**Files:**
- Create: `frontend/src/game/table/reveal-motion.ts`
- Test: `frontend/src/game/table/reveal-motion.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/game/table/reveal-motion.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { flipState, FLIP_MIN_WIDTH_FACTOR } from "./reveal-motion";

describe("flipState", () => {
  it("starts closed: full width, back showing", () => {
    const s = flipState(0);
    expect(s.widthFactor).toBeCloseTo(1, 6);
    expect(s.showFront).toBe(false);
  });

  it("swaps to the face at the midpoint, at the perceptual width floor", () => {
    const s = flipState(0.5);
    expect(s.widthFactor).toBeCloseTo(FLIP_MIN_WIDTH_FACTOR, 6);
    expect(s.showFront).toBe(true);
  });

  it("ends open: full width, face showing", () => {
    const s = flipState(1);
    expect(s.widthFactor).toBeCloseTo(1, 6);
    expect(s.showFront).toBe(true);
  });

  it("never narrows below the perceptual floor across the whole turn", () => {
    for (let i = 0; i <= 20; i += 1) {
      const { widthFactor } = flipState(i / 20);
      expect(widthFactor).toBeGreaterThanOrEqual(FLIP_MIN_WIDTH_FACTOR - 1e-9);
      expect(widthFactor).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it("shows the back before the midpoint and the face from the midpoint on", () => {
    expect(flipState(0.25).showFront).toBe(false);
    expect(flipState(0.49).showFront).toBe(false);
    expect(flipState(0.5).showFront).toBe(true);
    expect(flipState(0.75).showFront).toBe(true);
  });

  it("clamps out-of-range progress instead of extrapolating", () => {
    expect(flipState(-0.5)).toEqual(flipState(0));
    expect(flipState(1.5)).toEqual(flipState(1));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/game/table/reveal-motion.test.ts`
Expected: FAIL — `Failed to resolve import "./reveal-motion"` (module does not exist yet).

- [ ] **Step 3: Write the minimal implementation**

Create `frontend/src/game/table/reveal-motion.ts`:

```ts
/**
 * Reveal-motion constants + the pure flip-state helper for community-card
 * reveals. Pure and dependency-free (no pixi/gsap) so the back->face turn curve
 * can be unit tested without instantiating the Pixi TableScene. Mirrors the
 * deal-motion.ts pattern.
 */

// Total back->face turn. Short on purpose: the reveal should feel inevitable,
// almost invisible -- a physical fact, not an "animation". Tuning range 0.30-0.32s.
export const FLIP_DURATION = 0.3; // seconds

// Smooth turn: accelerate into the edge, decelerate flat. Never bounce/elastic.
export const FLIP_EASE = "power2.inOut";

// Perceptual edge-on floor: the card never collapses to exactly 0 width (a 1px
// edge can shimmer / z-fight). It reads edge-on (very thin) but stays visible.
// Tuning range 0.04-0.06.
export const FLIP_MIN_WIDTH_FACTOR = 0.05;

export interface FlipState {
  /** Rendered-width multiplier in [FLIP_MIN_WIDTH_FACTOR, 1]. */
  widthFactor: number;
  /** False on the first half (back shown), true from the midpoint on (face shown). */
  showFront: boolean;
}

/**
 * Pure description of the flip at normalized progress p in [0, 1] (clamped).
 *   [0, 0.5):  back shown, width shrinks 1 -> FLIP_MIN_WIDTH_FACTOR
 *   p >= 0.5:  face shown, width grows FLIP_MIN_WIDTH_FACTOR -> 1
 * Depends only on its input.
 */
export function flipState(progress: number): FlipState {
  const p = progress < 0 ? 0 : progress > 1 ? 1 : progress;
  const floor = FLIP_MIN_WIDTH_FACTOR;
  if (p < 0.5) {
    const k = p / 0.5; // 0 -> 1 across the first half
    return { widthFactor: 1 - (1 - floor) * k, showFront: false };
  }
  const k = (p - 0.5) / 0.5; // 0 -> 1 across the second half
  return { widthFactor: floor + (1 - floor) * k, showFront: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/game/table/reveal-motion.test.ts`
Expected: PASS (6 specs).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/game/table/reveal-motion.ts frontend/src/game/table/reveal-motion.test.ts
git commit -m "feat(table): pure reveal-motion module — flip curve with edge-on floor"
```

---

## Task 2: `flipReveal` infrastructure in TableScene (no wiring yet)

**Files:**
- Modify: `frontend/src/game/table/TableScene.ts`

This task adds the import, the per-board-card flip-tween tracking, and the shared `flipReveal` + cancel helpers. It does not change any reveal behaviour yet (nothing calls `flipReveal`), so the build stays green and behaviour is unchanged.

- [ ] **Step 1: Add the import**

Find the existing deal-motion import near the top of `TableScene.ts`:

```ts
import { DEAL_EASE, HOLE_DEAL_PRE_ROT, restingRotationFor } from "./deal-motion";
```

Add directly below it:

```ts
import { FLIP_DURATION, FLIP_EASE, flipState } from "./reveal-motion";
```

- [ ] **Step 2: Add the flip-tween tracking field**

Find the field where the all-in tween is declared:

```ts
private allInRevealTween: gsap.core.Tween | null = null;
```

Add directly below it:

```ts
// One in-flight reveal flip per board slot (0..4), or null. Tracked so every
// teardown path can cancel a flip mid-turn and restore a clean resting card.
private readonly boardFlipTweens: (gsap.core.Tween | null)[] = [null, null, null, null, null];
```

- [ ] **Step 3: Add the flip + cancel methods**

Add these three methods to the class, directly above `private setBoardCards(`:

```ts
  private cancelBoardFlip(i: number): void {
    const t = this.boardFlipTweens[i];
    if (t) {
      t.kill();
      this.boardFlipTweens[i] = null;
    }
  }

  private cancelAllBoardFlips(): void {
    for (let i = 0; i < 5; i += 1) this.cancelBoardFlip(i);
  }

  // The shared "reveal-con-alma" gesture: the board card at slot `i` turns from
  // its clean back to `faceId`'s face. Width animates (height held constant) so
  // the back->face texture swap never changes the rendered height. Cancel-safe.
  private flipReveal(i: number, faceId: string | undefined): void {
    const spr = this.boardSprites[i];
    const targetW = this.boardCardW;
    const targetH = this.boardCardH;
    const backTex = textureForUrl(getCardTextureUrl(undefined));
    const faceTex = textureForUrl(getCardTextureUrl(faceId));

    this.cancelBoardFlip(i);
    gsap.killTweensOf(spr); // stop any in-flight slide/position tween on this sprite
    spr.visible = true;
    spr.alpha = 1;
    spr.texture = backTex;
    spr.width = targetW;
    spr.height = targetH;

    const proxy = { p: 0 };
    this.boardFlipTweens[i] = gsap.to(proxy, {
      p: 1,
      duration: FLIP_DURATION,
      ease: FLIP_EASE,
      onUpdate: () => {
        const { widthFactor, showFront } = flipState(proxy.p);
        spr.texture = showFront ? faceTex : backTex; // swap first...
        spr.width = targetW * widthFactor;            // ...then size to current texture
        spr.height = targetH;
      },
      onComplete: () => {
        spr.texture = faceTex;
        spr.width = targetW;
        spr.height = targetH;
        this.boardFlipTweens[i] = null;
      },
    });
  }
```

- [ ] **Step 4: Verify the build/type-check is clean**

Run: `cd frontend && npx tsc --noEmit`
Expected: only the pre-existing errors (12 from the L1 baseline), **none in `game/table/`**. If a new error appears in `reveal-motion.ts` or `TableScene.ts`, fix it before committing.

- [ ] **Step 5: Run the full frontend suite (unchanged behaviour)**

Run: `cd frontend && npx vitest run`
Expected: PASS, count = Task 0 baseline + 6 (the new reveal-motion specs).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/game/table/TableScene.ts
git commit -m "feat(table): add cancel-safe flipReveal infrastructure (unwired)"
```

---

## Task 3: Wire the flip into the street reveal

**Files:**
- Modify: `frontend/src/game/table/TableScene.ts` (`setBoardCards`)

- [ ] **Step 1: Replace the `animateNew` deal branch to deal-as-back, then flip**

Find the new-card branch inside `setBoardCards` (it currently slides the card in already face-up):

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

Replace that `if (animateNew && !had) { ... }` block with:

```ts
      if (animateNew && !had) {
        // L2a: deal the card to its slot as its clean BACK using the EXACT shipped
        // L1 weight (unchanged ease/duration/delay), then turn it face-up on arrival.
        this.cancelBoardFlip(i);
        spr.visible = true;
        spr.alpha = 1;
        spr.texture = textureForUrl(getCardTextureUrl(undefined)); // travel as back
        spr.width = this.boardCardW;
        spr.height = this.boardCardH;
        spr.position.set(this.deckPos.x, this.deckPos.y);
        const faceId = id;
        gsap.to(spr, {
          x: pos.x,
          y: pos.y,
          duration: 0.5,
          ease: DEAL_EASE,
          delay: i * 0.06,
          onComplete: () => this.flipReveal(i, faceId),
        });
      } else {
```

Note: the loop already sets `spr.texture` to the face at the top of the iteration; this branch overrides it to the back for the travel, and `flipReveal` swaps to the face during the turn.

- [ ] **Step 2: Guard the non-animated branch so a benign tick never kills a live flip**

Immediately after the block above, the `else` branch currently force-sets the card face-up. Replace the existing `else { ... }` body:

```ts
      } else {
        gsap.killTweensOf(spr);
        spr.position.set(pos.x, pos.y);
        spr.visible = true;
        spr.alpha = 1;
      }
```

with:

```ts
      } else if (this.boardFlipTweens[i]) {
        // A reveal flip is mid-turn for this card — let it finish; do not snap it.
        spr.position.set(pos.x, pos.y);
      } else {
        gsap.killTweensOf(spr);
        spr.position.set(pos.x, pos.y);
        spr.visible = true;
        spr.alpha = 1;
      }
```

- [ ] **Step 3: Cancel a flip when a slot is cleared**

Find the empty-slot branch at the top of the `setBoardCards` loop:

```ts
      if (!has) {
        gsap.killTweensOf(spr);
        spr.visible = false;
        spr.alpha = 0;
        continue;
      }
```

Replace with (add the flip cancel):

```ts
      if (!has) {
        this.cancelBoardFlip(i);
        gsap.killTweensOf(spr);
        spr.visible = false;
        spr.alpha = 0;
        continue;
      }
```

- [ ] **Step 4: Verify build + suite**

Run: `cd frontend && npx tsc --noEmit`
Expected: only pre-existing errors, none in `game/table/`.

Run: `cd frontend && npx vitest run`
Expected: PASS, same count as Task 2 Step 5.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/game/table/TableScene.ts
git commit -m "feat(table): street reveal deals as back then flips face-up"
```

---

## Task 4: Wire the flip into the all-in reveal + finish cancel-safety

**Files:**
- Modify: `frontend/src/game/table/TableScene.ts` (`revealAllInSequential`, `cancelAllInReveal`, `reset`, `playRoundEndCollectThen`, `measureLayout`)

- [ ] **Step 1: Replace the all-in flat fade with the shared flip**

Find the per-step fade loop inside `revealAllInSequential`:

```ts
      const slice = cards.slice(0, index + 1);
      this.setBoardCards(slice, false);
      for (let j = 0; j < 5; j += 1) {
        const spr = this.boardSprites[j];
        if (j < slice.length && slice[j]) {
          spr.alpha = 0;
          spr.visible = true;
          gsap.to(spr, { alpha: 1, duration: 0.25 });
        }
      }
      index += 1;
```

Replace with (place earlier cards face-up instantly, flip only the newly revealed one):

```ts
      const slice = cards.slice(0, index + 1);
      this.setBoardCards(slice, false); // earlier cards instant face-up; new one set below
      this.flipReveal(index, cards[index]); // the same shared flip, in place (no slide)
      index += 1;
```

- [ ] **Step 2: Cancel flips when the all-in reveal is cancelled**

Find:

```ts
  cancelAllInReveal(): void {
    this.allInRevealTween?.kill();
    this.allInRevealTween = null;
  }
```

Replace with:

```ts
  cancelAllInReveal(): void {
    this.allInRevealTween?.kill();
    this.allInRevealTween = null;
    this.cancelAllBoardFlips();
  }
```

- [ ] **Step 3: Cancel flips on full reset**

Find the start of `reset()`:

```ts
  reset(): void {
    this.cancelAllInReveal();
    this.potNumberTween?.kill();
    this.potNumberTween = null;
    gsap.killTweensOf(this.collectAllCardSprites());
    this.isRoundEndAnimating = false;
```

`cancelAllInReveal()` now also cancels flips (Step 2), so `reset()` is already covered. Add an explicit belt-and-braces line directly after `gsap.killTweensOf(this.collectAllCardSprites());`:

```ts
    this.cancelAllBoardFlips();
```

- [ ] **Step 4: Cancel flips before the round-end collect**

Find the start of `playRoundEndCollectThen(onComplete: () => void)`, just after the `if (!this.active) { onComplete(); return; }` guard and before `this.isRoundEndAnimating = true;`. Add:

```ts
    this.cancelAllBoardFlips();
```

so a mid-turn card cannot fight the collect-to-center timeline.

- [ ] **Step 5: Protect a live flip's width from per-sync layout resets**

Find the board-sizing loop inside `measureLayout`:

```ts
    for (const s of this.boardSprites) {
      s.width = this.boardCardW;
      s.height = this.boardCardH;
    }
```

Replace with (skip width/height reset for a slot whose flip is mid-turn):

```ts
    for (let i = 0; i < this.boardSprites.length; i += 1) {
      if (this.boardFlipTweens[i]) continue; // a flip owns this sprite's size right now
      const s = this.boardSprites[i];
      s.width = this.boardCardW;
      s.height = this.boardCardH;
    }
```

- [ ] **Step 6: Verify build + suite**

Run: `cd frontend && npx tsc --noEmit`
Expected: only pre-existing errors, none in `game/table/`.

Run: `cd frontend && npx vitest run`
Expected: PASS, same count as Task 3 Step 4.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/game/table/TableScene.ts
git commit -m "feat(table): all-in reveal uses the shared flip + exhaustive cancel-safety"
```

---

## Task 5: Runtime baseline/after/video harness + suite confirmation

**Files:**
- Create: `.dev-stack/diag-reveal-materiality.ts` (gitignored)

- [ ] **Step 1: Start the dev stack**

Run (from repo root, in a background terminal): `npm run dev:stack`
Expected: postgres 5432 / api 3000 / game 2567 / frontend 5173 all up. Confirm `http://localhost:5173` loads.

- [ ] **Step 2: Write the capture harness**

Create `.dev-stack/diag-reveal-materiality.ts` — a Playwright script that, against `http://localhost:5173`, seats **two** players (recovery discipline: a single-player table self-disposes), plays to a community reveal, and records: (a) a baseline run on `git stash` of this branch's changes, (b) an "after" run with the changes, (c) an MP4 of a reveal. Capture desktop **1920×1080** at `deviceScaleFactor: 2`. Drive both a normal street reveal and an all-in reveal. Save artifacts under `.dev-stack/diag/reveal-materiality/{baseline,after}/` and the video alongside. Mirror the existing capture-script pattern in `.dev-stack/` (e.g. the L1 `diag-*`/`b2-perceptual-framing-capture.ts` scripts) for the seating + screenshot helpers.

- [ ] **Step 3: Capture baseline (changes stashed) then after (changes restored)**

```bash
git stash push -m l2a-capture frontend/src/game/table/TableScene.ts
npx tsx .dev-stack/diag-reveal-materiality.ts --label baseline
git stash pop
npx tsx .dev-stack/diag-reveal-materiality.ts --label after
```
Expected: `.dev-stack/diag/reveal-materiality/baseline/*` and `.../after/*` populated, plus a reveal MP4. (Note: `reveal-motion.ts` is new and untracked-by-stash here; stashing only `TableScene.ts` reverts the wiring so the baseline shows the old slide/fade.)

- [ ] **Step 4: Confirm the diff is frontend-only**

Run: `git diff --name-only main...HEAD`
Expected: only `frontend/src/game/table/reveal-motion.ts`, `frontend/src/game/table/reveal-motion.test.ts`, `frontend/src/game/table/TableScene.ts`, and the two doc files. **No `src/` (game server) or `api-server/` paths.**

- [ ] **Step 5: Full suite green**

Run: `cd frontend && npx vitest run`
Expected: PASS (baseline + 6).

- [ ] **Step 6: Commit (harness is gitignored, so this commits nothing new unless docs changed)**

No commit needed if only `.dev-stack/` artifacts changed (gitignored). If you adjusted any tracked file, commit it with a `chore(table):` message.

---

## Task 6: Perceptual gate (operator-run) — explicit protocol

**Files:** none (operator validation; do not merge/deploy without approval).

- [ ] **Step 1: Present the evidence**

Show the operator the baseline-vs-after captures + the reveal MP4 (desktop). State plainly what changed: street cards now arrive as a back and turn face-up; the all-in reveal turns instead of fading.

- [ ] **Step 2: Operator gates on device, against the spec's checklist**

The operator checks, on a real device:
- The 6 north-star principles (tactility / mesa viva / claridad / ritmo / social-first / premium AAA).
- The anti-drift checklist at the top of this plan (no casino / flourish / bounce / overshoot / "ta-da" / intensity increase; clarity > spectacle; materiality > animation).
- **Consecutive-reveals watch (operator adjustment C):** play several hands and watch whether repeated reveals start to feel **robotic / too mathematical / "digital machine"**.

- [ ] **Step 3: Verdict**

- **Approved** → proceed to handoff/merge discipline (separate task; merge + push + deploy each require explicit operator OK).
- **Ambiguous reaction, or any "digital machine" feeling** → **DEFAULT STOP.** Do not ship. Do not paper over with randomization. Capture the verbatim reaction, surface options (e.g., tune `FLIP_DURATION` within 0.30–0.32, or shelve L2a), and wait for direction.

---

## Self-Review (run before handing off)

**Spec coverage:** decisions 1–4 → Tasks 1–4; adjustments A (`FLIP_DURATION=0.3`) + B (`FLIP_MIN_WIDTH_FACTOR=0.05`) → Task 1; C (no randomization + gate watch) → Tasks 1 & 6; D (anchor) → Task 0. Lifecycle/cancel-safety (§6.4) → Tasks 2–4. Desktop-Pixi-only + frontend-only (§4–5) → Task 5 Step 4. Testing (§9) → Tasks 1, 5. Validation (§10) → Task 6.

**Placeholder scan:** every code step shows complete code; commands have expected output; the only intentionally descriptive step is Task 5 Step 2 (the local, gitignored capture harness), which reuses the documented `.dev-stack/` script pattern.

**Type consistency:** `flipState(progress: number): FlipState` (Task 1) is consumed in `flipReveal` (Task 2) as `{ widthFactor, showFront }`; `flipReveal(i: number, faceId: string \| undefined)` is called with `id` (street, Task 3) and `cards[index]` (all-in, Task 4), both `string \| undefined`-compatible; `boardFlipTweens` (Task 2) is read/written by `cancelBoardFlip` / `cancelAllBoardFlips` / `flipReveal` / `setBoardCards` / `measureLayout` consistently.
