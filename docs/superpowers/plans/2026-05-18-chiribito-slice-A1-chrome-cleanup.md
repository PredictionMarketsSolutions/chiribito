# Chiribito Slice A1 — Chrome Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land four chrome-level micro-slices that visibly reduce the "dev/debug" feeling on the mesa: castizo localization, single pot indicator, contextual meta pills, contextual action panel — with no Move 2 regression and no mobile layout-shift flicker.

**Architecture:** Each micro-slice reuses an existing pattern: A1.1 swaps hardcoded strings (IDs intact for E2E); A1.2 hides Pixi `potText` (`.visible = false`, keeps Pixi update logic intact); A1.3 extends the `turn-reason` hide-when-empty pattern to three sibling badges with `min-height` reservation; A1.4 adds a parallel `setActionButtonsVisibility` companion to the existing `setActionButtonsEnabled`, projecting the same `canX` booleans onto a visibility axis. No new abstractions, no engine/server changes, no reconnect-director touch.

**Tech Stack:** TypeScript strict, Vite, Vitest with happy-dom for unit tests, Playwright via `tsx scripts/e2e-browser.ts` for end-to-end, PixiJS 7 for the table canvas. Visual diff via `scripts/visual-audit.ts` (Chromium, 3 viewports).

**Spec:** [docs/superpowers/specs/2026-05-18-chiribito-slice-A1-chrome-cleanup-design.md](../specs/2026-05-18-chiribito-slice-A1-chrome-cleanup-design.md)

---

## Conventions

- All paths from repo root: `C:\Users\Usuario\Documents\CHIRIBITO\chiri-infrastructure\chiri-app`.
- Frontend tests: `cd frontend && npx vitest run <path>` (or `npm test` for all). Vitest uses happy-dom (jsdom equivalent).
- Game-server tests: `npm test` from repo root (Jest with `--runInBand`).
- API-server tests: `cd api-server && npm test`.
- E2E (requires `npm run dev:stack` in another terminal): `npx tsx scripts/e2e-browser.ts`. Target 40/40 × 1 run per slice, 40/40 × 3 runs at A1 close.
- Visual audit (same dev-stack requirement): `npx tsx scripts/visual-audit.ts`. Output to `.dev-stack/visual-audit/` (gitignored). Each slice copies the baseline before and compares after.
- Commit format follows the chiribito history pattern: `feat(chrome): <subject>` / `test(chrome): <subject>` / `docs(chrome): <subject>`. No `Co-Authored-By` line.
- Branch: `main` (project pattern — Move 2 also landed on main).

---

## Pre-flight — Task 0: capture baseline screenshots

This task happens once before any code changes. Its output is the visual baseline every slice compares against.

**Files touched:** none (read-only).

- [ ] **Step 1: Boot dev-stack in a dedicated terminal**

```
npm run dev:stack
```

Wait for "READY" lines for `api`, `game`, and `Local:` for Vite. If port 5432 is busy from a stale postgres, find and kill it:

```
netstat -ano | grep 5432
taskkill /F /PID <pid>
```

- [ ] **Step 2: Run the visual audit script**

In a second terminal:

```
cd C:\Users\Usuario\Documents\CHIRIBITO\chiri-infrastructure\chiri-app
npx tsx scripts/visual-audit.ts
```

Expected: ~30 screenshots written to `.dev-stack/visual-audit/`, `measurements.json` updated. No flow crashes.

- [ ] **Step 3: Archive the baseline**

```
cp -r .dev-stack/visual-audit .dev-stack/visual-audit__A1_baseline
```

This is the reference each slice will diff against.

- [ ] **Step 4: Run the baseline test sweep**

```
cd frontend && npm test
cd .. && npm test
cd api-server && npm test
```

Expected:
- Vitest frontend: 199/199 PASS.
- Jest game server: 475/475 PASS.
- Jest api-server: 27/27 PASS.

If any test fails at baseline, halt — investigate before starting A1.

- [ ] **Step 5: Run the baseline E2E sweep (1 run)**

```
npx tsx scripts/e2e-browser.ts
```

Expected: 40/40 PASS.

---

## Task 1 — A1.1: Castizo localization sweep

**Goal:** Replace 13 English string residuals with castizo Chiribito Spanish. All IDs preserved.

**Files:**
- Modify: `frontend/index.html` (lines 304, 401, 403, 404, 405, 406, 409, 410, 411)
- Modify: `frontend/src/game/game-ui.ts` (lines 298, 313)
- Modify: `frontend/src/app/room-ui-reset.ts` (lines 81, 82, 92)
- Modify: `frontend/src/app/room-ui-reset.test.ts` (line 65)

### Step list

- [ ] **Step 1: Update the room-ui-reset test assertion FIRST (RED)**

Edit `frontend/src/app/room-ui-reset.test.ts` line 65. Current:

```ts
expect(deps.phaseStatusEl.textContent).toBe("waiting");
```

Change to:

```ts
expect(deps.phaseStatusEl.textContent).toBe("Esperando");
```

- [ ] **Step 2: Verify the test fails (RED)**

```
cd frontend && npx vitest run src/app/room-ui-reset.test.ts
```

Expected: 1 FAIL — `expected "waiting" to be "Esperando"`. This is the red driver for the localization sweep.

- [ ] **Step 3: Update `room-ui-reset.ts` strings**

Edit `frontend/src/app/room-ui-reset.ts`:

- Line 81: change `deps.roomStatusEl.textContent = message || "not joined";` → `deps.roomStatusEl.textContent = message || "sin mesa";`
- Line 82: change `deps.phaseStatusEl.textContent = "waiting";` → `deps.phaseStatusEl.textContent = "Esperando";`
- Line 92: change `deps.phaseChipEl.textContent = "waiting";` → `deps.phaseChipEl.textContent = "Esperando";`

- [ ] **Step 4: Update `game-ui.ts` callButton template strings**

Edit `frontend/src/game/game-ui.ts`:

- Line 298: change `refs.callButton.textContent = "Call";` → `refs.callButton.textContent = "Igualar";`
- Line 313: change `refs.callButton.textContent = canCall ? \`Call ($${callAmount})\` : "Call";` → `refs.callButton.textContent = canCall ? \`Igualar ($${callAmount})\` : "Igualar";`

- [ ] **Step 5: Update `index.html` button labels + placeholder + pot badge label**

Edit `frontend/index.html`:

Line 304: change
```html
<div class="badge badge-pot">Pot <span id="pot-chip">0</span></div>
```
to:
```html
<div class="badge badge-pot">Bote <span id="pot-chip">0</span></div>
```

Line 401: change `<button id="start-game" class="game-btn accent">Start Game</button>` → `<button id="start-game" class="game-btn accent">Empezar mano</button>`

Line 403: change `<button id="check" class="game-btn">Check</button>` → `<button id="check" class="game-btn">Pasar</button>`

Line 404: change `<button id="call" class="game-btn">Call</button>` → `<button id="call" class="game-btn">Igualar</button>`

Line 405: change `<button id="fold" class="game-btn">Fold</button>` → `<button id="fold" class="game-btn">Tirar</button>`

Line 406: change `<button id="all-in" class="game-btn alert">All-In</button>` → `<button id="all-in" class="game-btn alert">Envidarse</button>`

Line 409: change `placeholder="Amount"` → `placeholder="Cantidad"` (full line: `<input id="bet-amount" type="number" min="1" value="20" class="bet-input" placeholder="Cantidad" />`)

Line 410: change `<button id="bet" class="game-btn">Bet</button>` → `<button id="bet" class="game-btn">Apostar</button>`

Line 411: change `<button id="raise" class="game-btn">Raise</button>` → `<button id="raise" class="game-btn">Subir</button>`

- [ ] **Step 6: Verify the targeted test now passes (GREEN)**

```
cd frontend && npx vitest run src/app/room-ui-reset.test.ts
```

Expected: ALL tests in file PASS (the one we updated + any others).

- [ ] **Step 7: Run the full vitest suite**

```
cd frontend && npm test
```

Expected: 199/199 PASS, 0 failures.

If any other test fails, it likely asserts an English string we missed — fix it in the same commit.

- [ ] **Step 8: Verify no E2E text-selector breakage**

Action E2E selectors use IDs (`#bet`, `#call`, etc.). To prove no text-selector exists for the strings we changed:

```
grep -nE "has-text\(\"(Call|Start Game|All-In|Check|Fold|Bet|Raise|Amount|Pot|waiting|not joined)\"\)" scripts/
```

Expected: zero matches.

- [ ] **Step 9: Re-run visual audit and compare**

```
npx tsx scripts/visual-audit.ts
```

Open these screenshot pairs in any image viewer and confirm Spanish labels:

- `desktop-1440__04_mesa_alone.png` (action panel)
- `desktop-1440__06_mesa_full.png` (action panel + pot badge)
- `mobile-375__04_mesa_alone.png` (action panel grid)
- `tablet-768__04_mesa_alone.png` (action panel)

Pot badge must read `Bote 0` (not `Pot 0`). Action buttons must read `Empezar mano`, `Pasar`, `Igualar`, `Tirar`, `Envidarse`, `Apostar`, `Subir`.

- [ ] **Step 10: Run 1 full E2E sweep to confirm no regression**

```
npx tsx scripts/e2e-browser.ts
```

Expected: 40/40 PASS. Reconnect flows and Move 1.5 paths unaffected (no logic changed, only strings).

- [ ] **Step 11: Commit A1.1**

```
git add frontend/index.html frontend/src/game/game-ui.ts frontend/src/app/room-ui-reset.ts frontend/src/app/room-ui-reset.test.ts
git commit -m "feat(chrome): castizo Chiribito copy in action panel + pot badge

Replaces English residuals with the user-locked castizo Chiribito
vocabulary: Pasar / Igualar / Tirar / Envidarse / Apostar / Subir for
the action buttons, Empezar mano for start, Cantidad for the bet input
placeholder, Bote for the table pot badge. Also fixes room-ui-reset's
hardcoded 'waiting' / 'not joined' to 'Esperando' / 'sin mesa'.

E2E selectors use button IDs (no text-selector grep matches), so no
test breakage. Updates room-ui-reset.test.ts:65 assertion. Vitest
199/199 + E2E 40/40 pass."
```

---

## Task 2 — A1.2: Pot deduplication

**Goal:** Hide the Pixi `potText` so only the DOM `#pot-chip` badge renders the pot. Add a subtle 200 ms scale tween to the DOM badge on pot value change as the visible tactility compensation.

**Files:**
- Modify: `frontend/src/game/table/TableScene.ts` (after line 111 — Pixi potText instantiation)
- Modify: `frontend/src/style.css` (`.badge-pot` section, ~line 1751 and 3423)
- Modify: `frontend/src/game/game-ui.ts` (line ~189, after `refs.potChip.textContent = ...`)
- Create: `frontend/src/game/table/table-scene.spec.ts` (1 focused test)

### Step list

- [ ] **Step 1: Write a focused test that pins `potText.visible = false` (RED)**

Create `frontend/src/game/table/table-scene.spec.ts`:

```ts
import { describe, it, expect, vi } from "vitest";

// Mock pixi.js — TableScene uses Application, Container, Text and Graphics.
// We only test the construction-time invariant, so a thin stub is enough.
vi.mock("pixi.js", () => {
  class Container {
    children: any[] = [];
    addChild(c: any) { this.children.push(c); return c; }
    removeChildren() { this.children = []; }
    scale = { set: vi.fn() };
    position = { set: vi.fn(), x: 0, y: 0 };
  }
  class Text extends Container {
    text: string;
    anchor = { set: vi.fn() };
    visible = true;
    constructor(text: string) { super(); this.text = text; }
  }
  class Graphics extends Container {
    clear() { return this; }
    beginFill() { return this; }
    drawRect() { return this; }
    drawCircle() { return this; }
    drawEllipse() { return this; }
    endFill() { return this; }
    lineStyle() { return this; }
  }
  class Sprite extends Container {
    texture: any;
    anchor = { set: vi.fn() };
    constructor() { super(); }
  }
  class Application {
    stage = new Container();
    view = document.createElement("canvas");
    renderer = { resize: vi.fn() };
    constructor(_opts: any) {}
  }
  const Texture = { from: vi.fn(() => ({})), WHITE: {} };
  return { Application, Container, Text, Graphics, Sprite, Texture };
});

// gsap is heavily used inside TableScene — stub all needed surface
vi.mock("gsap", () => {
  const fn: any = vi.fn(() => ({ kill: vi.fn() }));
  fn.killTweensOf = vi.fn();
  fn.to = vi.fn(() => ({ kill: vi.fn() }));
  fn.fromTo = vi.fn(() => ({ kill: vi.fn() }));
  fn.set = vi.fn();
  return { default: fn, gsap: fn };
});

import { TableScene } from "./TableScene";

describe("TableScene — A1.2 pot dedup invariant", () => {
  it("hides the Pixi potText so the DOM badge is the only visible pot", () => {
    const host = document.createElement("div");
    const scene = new TableScene(host, { width: 800, height: 600 } as any);
    // potText is a private field; access via cast — the assertion is the
    // exact contract A1.2 introduces.
    expect((scene as unknown as { potText: { visible: boolean } }).potText.visible).toBe(false);
  });
});
```

- [ ] **Step 2: Verify the test fails (RED)**

```
cd frontend && npx vitest run src/game/table/table-scene.spec.ts
```

Expected: 1 FAIL — `expected true to be false`. Today `potText.visible` is `true` (Pixi default).

If the test fails for a DIFFERENT reason (constructor mock incomplete, missing dep), expand the pixi.js or gsap stub until the assertion is reached. Common gotcha: TableScene may use additional Pixi members (`Filter`, `BLEND_MODES`, etc.) — add `vi.fn()` stubs for whatever the import requires.

- [ ] **Step 3: Make the test pass — hide potText in TableScene**

Edit `frontend/src/game/table/TableScene.ts`. Find the line:

```ts
this.potText = new Text("Pot: 0", { fill: 0xfff8dc, fontSize: 20, fontWeight: "bold" });
```

(currently around line 109). Immediately after, before any other line:

```ts
this.potText = new Text("Pot: 0", { fill: 0xfff8dc, fontSize: 20, fontWeight: "bold" });
this.potText.visible = false; // A1.2 — DOM #pot-chip is the single visible pot
this.potText.anchor.set(0.5);
this.uiContainer.addChild(this.potText);
```

Keep all other lines that reference `this.potText` (position, updatePot, tweens, etc.) UNCHANGED — the Text object still exists, still updates internally, just does not render.

- [ ] **Step 4: Verify the test passes (GREEN)**

```
cd frontend && npx vitest run src/game/table/table-scene.spec.ts
```

Expected: 1/1 PASS.

- [ ] **Step 5: Add DOM badge scale tween on pot value change (game-ui.ts)**

The Pixi scale-bump is gone. Compensate with a CSS-only 200 ms scale tween on the DOM badge when its text changes. Edit `frontend/src/game/game-ui.ts` around line 189. Current:

```ts
refs.potChip.textContent = String(potValue);
```

Change to:

```ts
const prevPotText = refs.potChip.textContent ?? "";
const nextPotText = String(potValue);
refs.potChip.textContent = nextPotText;
if (prevPotText !== nextPotText) {
  // A1.2 — replace Pixi scale-bump with a subtle DOM transition.
  const badge = refs.potChip.parentElement;
  if (badge) {
    badge.classList.remove("badge-pot--pulse");
    // Force reflow so the next class-add restarts the animation.
    void badge.offsetWidth;
    badge.classList.add("badge-pot--pulse");
  }
}
```

- [ ] **Step 6: Add the CSS pulse class**

Edit `frontend/src/style.css`. Find the existing `.badge-pot` block (around line 1751 OR line 3423 — there may be two; add to both if they exist, OR pick the one inside `@media`/main scope according to the file structure).

Append after the existing `.badge-pot { ... }` block:

```css
/* A1.2 — pot value change tactility (replaces the Pixi scale-bump
   that is now hidden via potText.visible = false). 200ms, ease-out. */
.badge-pot {
  transition: transform 200ms ease-out;
}
.badge-pot--pulse {
  transform: scale(1.06);
}
```

Verify there's no conflicting `transform` already on `.badge-pot` (if so, merge the property into the existing rule instead of duplicating it).

- [ ] **Step 7: Run full vitest**

```
cd frontend && npm test
```

Expected: 200/200 PASS (199 baseline + 1 new test).

- [ ] **Step 8: Re-run visual audit and confirm single pot indicator**

```
npx tsx scripts/visual-audit.ts
```

Open `desktop-1440__04_mesa_alone.png`, `desktop-1440__06_mesa_full.png`, mobile + tablet equivalents. Verify the badge `Bote 0` is the ONLY visible pot. The previous Pixi text "Pot: 0" overlay is gone.

- [ ] **Step 9: Manual game-feel smoke**

In the dev-stack browser, register two users, start a hand, place a bet. Watch the badge: on each pot value change it should pulse subtly (200 ms scale 1 → 1.06 → 1). Not distracting, not casino-flashy.

If the pulse feels excessive at any viewport, lower the scale to 1.04 in the CSS. If imperceptible, raise to 1.08. Default 1.06 is the recommendation.

- [ ] **Step 10: Run 1 full E2E sweep**

```
npx tsx scripts/e2e-browser.ts
```

Expected: 40/40 PASS. The Pixi visibility change does not affect any E2E selector (E2E queries DOM, not Pixi).

- [ ] **Step 11: Commit A1.2**

```
git add frontend/src/game/table/TableScene.ts frontend/src/game/table/table-scene.spec.ts frontend/src/game/game-ui.ts frontend/src/style.css
git commit -m "feat(chrome): single pot indicator (hide Pixi potText duplicate)

Sets TableScene.potText.visible = false so only the DOM badge-pot chip
renders on the felt. Keeps every Pixi reference and update path intact
(scene continuity is a Move 2 user-locked invariant — no scene rebuild,
no reference removal). Adds a subtle 200ms CSS scale tween (1 -> 1.06)
to the DOM badge on pot value change to compensate for the hidden Pixi
scale-bump.

New focused test (table-scene.spec.ts) pins the visibility invariant
at construction time. Vitest 200/200 pass + E2E 40/40 pass.

Resolves audit finding P0-3."
```

---

## Task 3 — A1.3: Contextual meta pills (hide-when-empty)

**Goal:** Hide `badge-turn`, `badge.timer`, and the winning-hand badge when their value content is empty or `-`. Reserve `.table-header-row--meta` `min-height` so the row does not collapse between waiting and in-hand transitions.

**Files:**
- Modify: `frontend/src/game/game-ui.ts` (around lines 195–215, after meta-badge value writes)
- Modify: `frontend/src/style.css` (`.table-header-row--meta` rule; if absent, add it)
- Create: `frontend/src/game/meta-pills.test.ts` (new focused unit test)
- Optional create: `frontend/src/game/meta-pills.ts` (extracted hide-when-empty helper)

### Step list

- [ ] **Step 1: Measure the current meta-row height for the min-height reservation**

In a browser at the dev-stack (mid-game state with all four pills visible), open DevTools and inspect `.table-header-row--meta`. Read `computed height`. Repeat at desktop 1440×900 and mobile 375×812.

Typical values (verify in practice): desktop `36px`, mobile `52px` (may wrap to two lines on mobile). Note both numbers — they go into the CSS in Step 5.

If you cannot reach mid-game state easily, use this expression in the browser console to force visibility for measurement:

```js
document.querySelectorAll("#turn-chip,#turn-timer,#winning-hand-chip").forEach(el => { el.textContent = "x"; });
document.querySelectorAll(".badge-turn,.timer,.badge:has(#winning-hand-chip)").forEach(el => el.classList.remove("hidden"));
```

Record the measured pixel values in the commit message of Step 11.

- [ ] **Step 2: Extract the hide-when-empty helper (RED test)**

Create `frontend/src/game/meta-pills.ts`:

```ts
/**
 * A1.3 — hide a badge element when its inner value is empty or a "-"
 * placeholder. Mirrors the existing turn-reason hide pattern but applied
 * to the badge container (parent), not the inner span.
 */
export function applyHideIfEmpty(
  badgeEl: HTMLElement | null,
  value: string | null | undefined
): void {
  if (!badgeEl) return;
  const text = (value ?? "").trim();
  const isEmpty = text === "" || text === "-";
  badgeEl.classList.toggle("hidden", isEmpty);
}
```

Create `frontend/src/game/meta-pills.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { applyHideIfEmpty } from "./meta-pills";

function makeBadge(): HTMLElement {
  const el = document.createElement("span");
  el.classList.add("badge");
  document.body.appendChild(el);
  return el;
}

describe("applyHideIfEmpty()", () => {
  it("adds .hidden when the value is empty string", () => {
    const el = makeBadge();
    applyHideIfEmpty(el, "");
    expect(el.classList.contains("hidden")).toBe(true);
  });

  it("adds .hidden when the value is a single '-' placeholder", () => {
    const el = makeBadge();
    applyHideIfEmpty(el, "-");
    expect(el.classList.contains("hidden")).toBe(true);
  });

  it("removes .hidden when the value is a real string", () => {
    const el = makeBadge();
    el.classList.add("hidden");
    applyHideIfEmpty(el, "Carlos");
    expect(el.classList.contains("hidden")).toBe(false);
  });

  it("treats null and undefined as empty", () => {
    const el = makeBadge();
    applyHideIfEmpty(el, null);
    expect(el.classList.contains("hidden")).toBe(true);
    applyHideIfEmpty(el, undefined);
    expect(el.classList.contains("hidden")).toBe(true);
  });

  it("no-ops when badgeEl is null (defensive)", () => {
    expect(() => applyHideIfEmpty(null, "anything")).not.toThrow();
  });
});
```

- [ ] **Step 3: Verify the new tests pass (helper is created in Step 2; tests immediately green because helper code lands in same step)**

```
cd frontend && npx vitest run src/game/meta-pills.test.ts
```

Expected: 5/5 PASS.

> Note: since both helper and test are created in Step 2, this is not strictly red-then-green. The helper is small and pure — the unit-test value is "pin the contract" so future refactors can't accidentally inverse the logic.

- [ ] **Step 4: Wire the helper into `game-ui.ts` for the three meta badges**

Edit `frontend/src/game/game-ui.ts`. Add the import near the other game imports:

```ts
import { applyHideIfEmpty } from "./meta-pills";
```

Locate the section (around line 195) where `turn-chip` / `turn-timer` / `winning-hand-chip` get their values. After each write, also hide the parent badge if the value is empty.

Concrete: find this block (around line 195-220):

```ts
refs.turnChip.textContent = turnPlayer?.name ?? (currentTurnId || "-");
```

Add right after:

```ts
applyHideIfEmpty(refs.turnChip.parentElement as HTMLElement | null, refs.turnChip.textContent);
```

Similarly for the timer chip. Find where `refs.turnTimerChip.textContent` is written (probably in `turn-timer.ts` or in main.ts startTurnTimer wiring). For Slice A1.3 we hide it via the meta-row driver in game-ui.ts. Add after the current rendering block (around line 215):

```ts
// A1.3 — hide empty meta badges
applyHideIfEmpty(refs.turnChip.parentElement as HTMLElement | null, refs.turnChip.textContent);
applyHideIfEmpty(refs.turnTimerChip.parentElement as HTMLElement | null, refs.turnTimerChip.textContent);
applyHideIfEmpty(refs.winningHandChip.parentElement as HTMLElement | null, refs.winningHandChip.textContent);
```

(Adjust the `refs.*` names to match the actual field names in `GameUiRefs` — verify by reading the type definition. The fields likely are `turnChip`, `turnTimerChip` (or similar), `winningHandChip`.)

- [ ] **Step 5: Add CSS `min-height` reservation for the meta row**

Edit `frontend/src/style.css`. Find the existing `.table-header-row--meta` rule (or add one near the `.table-header` block). Add:

```css
/* A1.3 — reserve vertical space so the row does not collapse when all
   three sibling meta badges hide. Measured values from Step 1: desktop
   ~36px, mobile ~52px (may wrap to two lines under 600px). */
.table-header-row--meta {
  min-height: 36px;
}
@media (max-width: 600px) {
  .table-header-row--meta {
    min-height: 52px;
  }
}
```

Replace the literal `36px` / `52px` with the measured values from Step 1 if they differ.

- [ ] **Step 6: Run full vitest**

```
cd frontend && npm test
```

Expected: 205/205 PASS (200 from A1.2 + 5 new from A1.3).

- [ ] **Step 7: Verify the existing room-ui-reset reset clears badges cleanly**

The reset flow sets `turnChipEl.textContent = "-"`, `turnTimerChipEl.textContent = "-"`, `winningHandChipEl.textContent = "-"`. Since these elements are still updated, but `applyHideIfEmpty` is only called from `game-ui.ts` render path (not from reset), the badges may stay VISIBLE after a reset with `-` content.

Resolution: in `frontend/src/app/room-ui-reset.ts`, after each of the three `*.textContent = "-";` lines (around lines 93, 94, 95), add the corresponding `applyHideIfEmpty` call. Add the import at top:

```ts
import { applyHideIfEmpty } from "../game/meta-pills";
```

And in the body, after each:

```ts
deps.turnChipEl.textContent = "-";
applyHideIfEmpty(deps.turnChipEl.parentElement as HTMLElement | null, deps.turnChipEl.textContent);

deps.turnTimerChipEl.textContent = "-";
applyHideIfEmpty(deps.turnTimerChipEl.parentElement as HTMLElement | null, deps.turnTimerChipEl.textContent);

deps.winningHandChipEl.textContent = "-";
applyHideIfEmpty(deps.winningHandChipEl.parentElement as HTMLElement | null, deps.winningHandChipEl.textContent);
```

- [ ] **Step 8: Update room-ui-reset test to assert hide-when-empty applies**

Edit `frontend/src/app/room-ui-reset.test.ts`. Add new assertions inside the existing test (after the existing expects):

```ts
expect((deps.turnChipEl.parentElement as HTMLElement | null)?.classList.contains("hidden")).toBe(true);
expect((deps.turnTimerChipEl.parentElement as HTMLElement | null)?.classList.contains("hidden")).toBe(true);
expect((deps.winningHandChipEl.parentElement as HTMLElement | null)?.classList.contains("hidden")).toBe(true);
```

For these to work the test's `makeEl()` helper must produce elements with a real `parentElement`. If today's helper returns detached `<div>`s, wrap each chip element inside a parent badge in the test setup:

```ts
function makeBadgeWithChild(): HTMLElement {
  const parent = document.createElement("span");
  parent.classList.add("badge");
  const child = document.createElement("span");
  parent.appendChild(child);
  document.body.appendChild(parent);
  return child;
}
```

Then use `turnChipEl: makeBadgeWithChild()` (and same for the other two). Existing assertions on `textContent` keep working because they reference the child element.

- [ ] **Step 9: Run vitest, expect updated test passes**

```
cd frontend && npx vitest run src/app/room-ui-reset.test.ts
```

Expected: PASS with the new hide-when-empty assertions.

- [ ] **Step 10: Re-run visual audit and check the meta row**

```
npx tsx scripts/visual-audit.ts
```

Inspect:
- `desktop-1440__04_mesa_alone.png` — the meta row should show ONLY the phase chip (`Esperando` + 6 dots, all empty). No `Turno -`, no `Reloj -`, no `Jugada -`.
- `mobile-375__04_mesa_alone.png` — same: only phase chip visible.
- `tablet-768__04_mesa_alone.png` — same.

The row's vertical position should be unchanged from baseline (min-height reservation working).

- [ ] **Step 11: Run 1 full E2E sweep**

```
npx tsx scripts/e2e-browser.ts
```

Expected: 40/40 PASS.

- [ ] **Step 12: Commit A1.3**

```
git add frontend/src/game/meta-pills.ts frontend/src/game/meta-pills.test.ts frontend/src/game/game-ui.ts frontend/src/app/room-ui-reset.ts frontend/src/app/room-ui-reset.test.ts frontend/src/style.css
git commit -m "feat(chrome): hide meta pills when empty (turn / reloj / jugada)

Extracts the turn-reason hide-when-empty pattern into a small
applyHideIfEmpty helper (5 vitests pin the contract) and applies it
to badge-turn, badge.timer, and the winning-hand badge from both the
game-ui render path and the room-ui-reset flow. The meta row now shows
only the phase chip in waiting state; the contextual pills appear with
real values mid-game.

Reserves .table-header-row--meta min-height (36px desktop / 52px
mobile, measured at the audit baseline) to prevent layout collapse
between waiting and in-hand transitions. No state-machine changes —
visibility derived from values game-ui already writes.

Resolves audit finding P0-5."
```

---

## Task 4 — A1.4: Contextual action panel

**Goal:** Project the existing `canStart/canCheck/canCall/canFold/canAllIn/canBet/canRaise` flags onto a parallel visibility axis. Hide buttons that do not apply to the current state. Reserve `.game-actions` `min-height` so the panel keeps its slot through transitions.

**Files:**
- Modify: `frontend/src/game/game-ui.ts` (extend `updateActionButtons` + add `setActionButtonsVisibility`)
- Modify: `frontend/src/game/index.ts` (export `setActionButtonsVisibility`)
- Modify: `frontend/src/style.css` (`.game-actions` min-height + flex-wrap audit)
- Create: `frontend/src/game/action-panel-visibility.test.ts` (new focused unit test)

### Step list

- [ ] **Step 1: Measure `.game-actions` height at desktop and mobile for min-height**

Procedure mirrors A1.3 Step 1. Open dev-stack at desktop 1440 and mobile 375 viewports, inspect `.game-actions` while ALL 7 buttons are visible. Read the computed height. Typical: desktop ~50px (single row), mobile ~110px (wrap to 2 rows). Record the values for Step 7.

- [ ] **Step 2: Add ActionButtonsVisibility type + setActionButtonsVisibility helper (RED test)**

Create `frontend/src/game/action-panel-visibility.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeActionButtonsVisibility } from "./game-ui";

function makeState(overrides: Partial<any> = {}): any {
  return {
    currentTurn: "",
    currentBet: 0,
    roundStarted: false,
    users: new Map(),
    ...overrides,
  };
}

function makeMe(sessionId: string, currentBet = 0, chips = 1000, isFolded = false) {
  return { sessionId, currentBet, chips, isFolded };
}

describe("computeActionButtonsVisibility() — A1.4 visibility matrix", () => {
  it("pre-game (no round started): only start visible", () => {
    const state = makeState({ roundStarted: false });
    const v = computeActionButtonsVisibility(state, "me", { activeCount: 2, isAllIn: false });
    expect(v.start).toBe(true);
    expect(v.check).toBe(false);
    expect(v.call).toBe(false);
    expect(v.fold).toBe(false);
    expect(v.allIn).toBe(false);
    expect(v.bet).toBe(false);
    expect(v.raise).toBe(false);
  });

  it("pre-game with only 1 active player: nothing visible (cannot start)", () => {
    const state = makeState({ roundStarted: false });
    const v = computeActionButtonsVisibility(state, "me", { activeCount: 1, isAllIn: false });
    expect(v.start).toBe(false);
  });

  it("in-hand, not my turn: nothing visible", () => {
    const state = makeState({ roundStarted: true, currentTurn: "other" });
    const v = computeActionButtonsVisibility(state, "me", { activeCount: 2, isAllIn: false });
    expect(v.start).toBe(false);
    expect(v.check).toBe(false);
    expect(v.call).toBe(false);
    expect(v.fold).toBe(false);
    expect(v.allIn).toBe(false);
    expect(v.bet).toBe(false);
    expect(v.raise).toBe(false);
  });

  it("in-hand, my turn, open street (no bet): check / bet / fold / all-in visible", () => {
    const state = makeState({ roundStarted: true, currentTurn: "me", currentBet: 0 });
    const me = makeMe("me", 0, 1000, false);
    const v = computeActionButtonsVisibility(state, "me", { activeCount: 2, isAllIn: false, me });
    expect(v.check).toBe(true);
    expect(v.bet).toBe(true);
    expect(v.fold).toBe(true);
    expect(v.allIn).toBe(true);
    expect(v.call).toBe(false);
    expect(v.raise).toBe(false);
  });

  it("in-hand, my turn, live raise: call / raise / fold / all-in visible", () => {
    const state = makeState({ roundStarted: true, currentTurn: "me", currentBet: 50 });
    const me = makeMe("me", 0, 1000, false);
    const v = computeActionButtonsVisibility(state, "me", { activeCount: 2, isAllIn: false, me });
    expect(v.call).toBe(true);
    expect(v.raise).toBe(true);
    expect(v.fold).toBe(true);
    expect(v.allIn).toBe(true);
    expect(v.check).toBe(false);
    expect(v.bet).toBe(false);
  });

  it("everyone all-in (showdown lock): nothing visible", () => {
    const state = makeState({ roundStarted: true, currentTurn: "me", currentBet: 0 });
    const v = computeActionButtonsVisibility(state, "me", { activeCount: 2, isAllIn: true });
    expect(v.start).toBe(false);
    expect(v.check).toBe(false);
    expect(v.call).toBe(false);
    expect(v.fold).toBe(false);
    expect(v.allIn).toBe(false);
    expect(v.bet).toBe(false);
    expect(v.raise).toBe(false);
  });
});
```

- [ ] **Step 3: Verify the test fails (RED) — function does not exist yet**

```
cd frontend && npx vitest run src/game/action-panel-visibility.test.ts
```

Expected: FAIL with `computeActionButtonsVisibility is not a function` or import error.

- [ ] **Step 4: Add `computeActionButtonsVisibility` + `setActionButtonsVisibility` in game-ui.ts**

Edit `frontend/src/game/game-ui.ts`. Add near the top of the file (after existing types):

```ts
export interface ActionButtonsVisibility {
  start: boolean;
  check: boolean;
  call: boolean;
  fold: boolean;
  allIn: boolean;
  bet: boolean;
  raise: boolean;
}

interface ComputeCtx {
  activeCount: number;
  isAllIn: boolean;
  me?: { sessionId: string; currentBet?: number; chips?: number; isFolded?: boolean } | undefined;
}

/**
 * A1.4 — derive button visibility from the same state inputs the existing
 * updateActionButtons uses to derive enabled state. Same source of truth,
 * different projection. Pure function — easy to unit-test.
 */
export function computeActionButtonsVisibility(
  state: RoomState | null,
  currentSessionId: string | null,
  ctx: ComputeCtx
): ActionButtonsVisibility {
  const empty: ActionButtonsVisibility = {
    start: false, check: false, call: false, fold: false, allIn: false, bet: false, raise: false,
  };
  if (!state || !currentSessionId || ctx.isAllIn) return empty;

  if (!state.roundStarted) {
    return { ...empty, start: ctx.activeCount >= 2 };
  }
  const isMyTurn = state.currentTurn === currentSessionId;
  if (!isMyTurn) return empty;

  const me = ctx.me;
  if (!me || me.isFolded || (me.chips ?? 0) <= 0) return empty;

  const currentBet = Number(state.currentBet ?? 0);
  const myBet = Number(me.currentBet ?? 0);
  const openStreet = currentBet === myBet;
  const liveRaise = currentBet > myBet;

  return {
    start: false,
    check: openStreet,
    bet:   openStreet,
    fold:  true,
    allIn: true,
    call:  liveRaise,
    raise: liveRaise,
  };
}

export function setActionButtonsVisibility(refs: GameUiRefs, v: ActionButtonsVisibility): void {
  refs.startGameButton.classList.toggle("hidden", !v.start);
  refs.checkButton.classList.toggle("hidden", !v.check);
  refs.callButton.classList.toggle("hidden", !v.call);
  refs.foldButton.classList.toggle("hidden", !v.fold);
  refs.allInButton.classList.toggle("hidden", !v.allIn);
  refs.betButton.classList.toggle("hidden", !v.bet);
  refs.raiseButton.classList.toggle("hidden", !v.raise);
  // The bet-amount input is only meaningful when bet OR raise is visible.
  const betInputVisible = v.bet || v.raise;
  refs.betAmountInput.classList.toggle("hidden", !betInputVisible);
}
```

Imports needed for the types — verify the top of `game-ui.ts` already imports `RoomState`, `PlayerState`, and the `GameUiRefs` type. If not, add them.

- [ ] **Step 5: Wire visibility computation into `updateActionButtons`**

Edit `frontend/src/game/game-ui.ts`. Find the existing `updateActionButtons` function (around lines 290–331). At its END (just after the `setActionButtonsEnabled(...)` call), append:

```ts
// A1.4 — project visibility from the same state.
const meForVis = state && ctx.currentSessionId
  ? getUserEntries(state).filter(isPlayerState).find((p) => p.sessionId === ctx.currentSessionId)
  : undefined;
const visibility = computeActionButtonsVisibility(state, ctx.currentSessionId ?? null, {
  activeCount: state
    ? getUserEntries(state).filter(isPlayerState).filter((p: PlayerState) => Number(p.chips ?? 0) > 0).length
    : 0,
  isAllIn: isAllIn,
  me: meForVis ? {
    sessionId: meForVis.sessionId,
    currentBet: Number(meForVis.currentBet ?? 0),
    chips: Number(meForVis.chips ?? 0),
    isFolded: Boolean(meForVis.isFolded),
  } : undefined,
});
setActionButtonsVisibility(refs, visibility);
```

If `getUserEntries` / `isPlayerState` are not imported in this file, add them from the same module path the existing code uses.

- [ ] **Step 6: Re-run the focused test (GREEN)**

```
cd frontend && npx vitest run src/game/action-panel-visibility.test.ts
```

Expected: 6/6 PASS.

- [ ] **Step 7: Add CSS min-height + ensure flex-wrap**

Edit `frontend/src/style.css`. Locate the `.game-actions` rule (or add one). Add:

```css
/* A1.4 — reserve the action-panel slot so transitions (waiting -> turn -> wait)
   do not cause vertical jumps. Values measured at the audit baseline. */
.game-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 50px;
}
@media (max-width: 600px) {
  .game-actions {
    min-height: 110px;
  }
}
.game-actions .action-group,
.game-actions .bet-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.game-actions .hidden,
.game-actions .action-group .hidden,
.game-actions .bet-group .hidden {
  display: none;
}
```

Substitute the literal `50px` / `110px` with the measured values from Step 1. If the existing `.game-actions` rule already sets `display: flex` and `gap`, merge instead of duplicating — keep the rule readable.

- [ ] **Step 8: Run full vitest**

```
cd frontend && npm test
```

Expected: 211/211 PASS (205 from A1.3 + 6 new from A1.4).

- [ ] **Step 9: Run 1 full E2E sweep**

```
npx tsx scripts/e2e-browser.ts
```

Expected: 40/40 PASS.

If any E2E step that interacts with an action button now fails (because the button is `hidden` when previously it was `disabled`), the fix is one of:
- (a) The test was relying on an incorrect pre-condition — fix the precondition.
- (b) The visibility rule is wrong for the test's state — re-read the matrix and adjust.

Do NOT make the buttons visible-when-disabled just to keep a flaky test green.

- [ ] **Step 10: Re-run visual audit**

```
npx tsx scripts/visual-audit.ts
```

Inspect `04_mesa_alone` (waiting): only `Empezar mano` button visible (and only if 2+ active players — in audit's single-player state, panel is empty with min-height reserved). Verify in all three viewports.

Inspect `05_mesa_2players` and `06_mesa_full`: with 2 players seated pre-game, `Empezar mano` visible. Bet input + other buttons hidden.

- [ ] **Step 11: Manual play smoke**

In dev-stack with 2 users seated:
1. Player 1 clicks `Empezar mano`. Hand starts.
2. Player 1 should see: 4 buttons visible (`Pasar`, `Apostar`, `Tirar`, `Envidarse`) when it's their turn AND no bet yet.
3. Player 1 clicks `Apostar` with amount 30. Action panel transitions to no-visible-buttons.
4. Player 2's turn. Player 2 sees: 4 buttons visible (`Igualar`, `Subir`, `Tirar`, `Envidarse`).
5. Player 2 clicks `Igualar`. Street advances.
6. Watch for any vertical jump in the action panel area — there must be none (min-height reservation).

- [ ] **Step 12: Commit A1.4**

```
git add frontend/src/game/game-ui.ts frontend/src/game/action-panel-visibility.test.ts frontend/src/style.css
git commit -m "feat(chrome): contextual action panel — hide buttons that do not apply

Extends updateActionButtons to project the existing canStart/canCheck/
canCall/canFold/canAllIn/canBet/canRaise flags onto a parallel visibility
axis. Adds computeActionButtonsVisibility (pure function, 6 vitests
covering the matrix) and setActionButtonsVisibility(refs, visibility)
companion to the existing setActionButtonsEnabled. Both run in the same
render tick so transitions are atomic.

Visibility = applicability:
  pre-game       -> only 'Empezar mano' (when activeCount >= 2)
  not my turn    -> none (chrome quiet, table is the focus)
  open street    -> Pasar / Apostar / Tirar / Envidarse
  live raise     -> Igualar / Subir / Tirar / Envidarse
  all-in lock    -> none

.game-actions reserves min-height (50px desktop / 110px mobile,
measured at the audit baseline) so the panel keeps its slot through
transitions. flex-wrap ensures longer castizo labels (Envidarse) do
not overflow on narrow viewports.

Vitest 211/211 + E2E 40/40 pass.

Resolves audit finding P0-4."
```

---

## Task 5 — A1 close: final validation + memory + push

**Goal:** Run the full suite (vitest + jest + E2E × 3) cleanly, update memory + close-out doc, push to origin.

**Files:**
- Modify: `C:\Users\Usuario\.claude\projects\C--Users-Usuario\memory\project_chiribito.md`
- Modify: `C:\Users\Usuario\.claude\projects\C--Users-Usuario\memory\MEMORY.md`
- Optional create: brief A1 closeout note in `docs/superpowers/specs/2026-05-18-chiribito-slice-A1-chrome-cleanup-design.md` (append a "What landed" section)

### Step list

- [ ] **Step 1: Run the full test sweep**

```
cd frontend && npm test
cd .. && npm test
cd api-server && npm test
```

Expected:
- Frontend vitest: 211/211 PASS.
- Game server jest: 475/475 PASS.
- API server jest: 27/27 PASS.

- [ ] **Step 2: Run the full E2E sweep × 3 runs**

The dev-stack must be running.

```
npx tsx scripts/e2e-browser.ts
npx tsx scripts/e2e-browser.ts
npx tsx scripts/e2e-browser.ts
```

Expected: 40/40 PASS in each of the 3 runs.

If any run flakes, capture the failing step's screenshot from `.dev-stack/e2e-shots/` and either (a) make the test more deterministic, or (b) re-run to confirm flakiness is not from my changes.

- [ ] **Step 3: Final visual audit + side-by-side diff vs baseline**

```
cp -r .dev-stack/visual-audit .dev-stack/visual-audit__A1_after
npx tsx scripts/visual-audit.ts
```

Open the following pairs in an image viewer and confirm the four targeted findings are resolved:

| Baseline → After | Expectation |
|---|---|
| `desktop-1440__04_mesa_alone.png` | Pot badge says `Bote 0`; action panel shows only `Empezar mano` (or empty min-height in 1-player state); meta row shows only phase chip; no Pixi `Pot: 0` text overlay. |
| `desktop-1440__06_mesa_full.png` | Same as above, with potential transition states. |
| `mobile-375__04_mesa_alone.png` | Same outcomes adapted to mobile layout. No layout shift between transitions. |
| `tablet-768__04_mesa_alone.png` | Same outcomes adapted to tablet. |

The baseline copies are in `.dev-stack/visual-audit__A1_baseline/` (from Task 0).

- [ ] **Step 4: Append "What landed" section to the spec doc**

Edit `docs/superpowers/specs/2026-05-18-chiribito-slice-A1-chrome-cleanup-design.md`. At the very end of the file, append:

```markdown
---

## What landed (closeout 2026-05-18)

| Micro-slice | Commit | Tests added |
|---|---|---|
| A1.1 localization | `<sha>` | 1 assertion updated |
| A1.2 pot dedup | `<sha>` | 1 test (table-scene.spec.ts) |
| A1.3 contextual meta pills | `<sha>` | 5 tests (meta-pills.test.ts) + 3 assertions in room-ui-reset |
| A1.4 contextual action panel | `<sha>` | 6 tests (action-panel-visibility.test.ts) |

Final suite: **211/211 vitest + 475/475 jest game + 27/27 jest api + 40/40 E2E × 3 runs**. Visual audit re-run confirms the four P0/P2 findings resolved.

Sidebar / player rail remain UNTOUCHED — Slice A2 is the next foco when the user authorizes it.
```

Fill in `<sha>` from the actual short commit hashes (`git log --oneline -6`).

- [ ] **Step 5: Update memory `project_chiribito.md`**

Open `C:\Users\Usuario\.claude\projects\C--Users-Usuario\memory\project_chiribito.md`. Find the "Próximo paso candidato — DECISIÓN POST-MOVE-2" block. Replace the "Foco siguiente locked: Visual + Mobile Polish..." section with a fresh status entry:

```markdown
### Next paso post Slice A1 (2026-05-18 closeout)

**Slice A1 (Chrome Cleanup) CLOSED** at HEAD `<sha>`. Four micro-slices landed:
- A1.1 castizo Chiribito copy (Pasar/Igualar/Tirar/Envidarse/Apostar/Subir/Bote, Empezar mano)
- A1.2 single pot indicator (Pixi potText hidden, DOM badge with 200ms pulse)
- A1.3 contextual meta pills (turn/timer/winning-hand hide when empty, phase indicator Fase 3 untouched)
- A1.4 contextual action panel (buttons hide when not applicable, min-height reservation)

Final suite: 211/211 vitest + 475/475 jest game + 27/27 jest api + 40/40 E2E × 3 runs. Move 2 reconnect + Move 1.5 paths untouched.

**Next foco candidato** (user decides):
1. **Slice A2** — sidebar architecture / player rail (the dev-stats sidebar becomes a player-facing panel).
2. **Slice B** — compact-table primitive for mobile/tablet (seats around the oval at any viewport).
3. Other: Slice C banner visibility / D touch targets / E table depth / F empty states.

User wants real-experience testing of Slice A1 first before opening the next slice.
```

Replace `<sha>` with the final commit.

- [ ] **Step 6: Update memory `MEMORY.md` Chiribito index entry**

Open `C:\Users\Usuario\.claude\projects\C--Users-Usuario\memory\MEMORY.md`. Find the Chiribito Project line:

```
- [Chiribito — Project](project_chiribito.md) — Tercer ecosistema. ... HEAD `<old-sha>` ...
```

Update to:

```
- [Chiribito — Project](project_chiribito.md) — Tercer ecosistema. Repo `PredictionMarketsSolutions/chiribito`. HEAD `<new-sha>` (2026-05-18). **Slice A1 CLOSED** (chrome cleanup: castizo copy + pot dedup + contextual meta pills + contextual action panel). E2E 40/40 × 3 + 211/211 vitest + 502/502 jest. Move 2 reconnect intact. Next: Slice A2 (sidebar/player rail), Slice B (compact-table mobile), or other polish slice — user decides.
```

- [ ] **Step 7: Push to origin/main**

```
git push origin main
```

Expected output: `<old-sha>..<new-sha>  main -> main`.

If push is rejected because someone else pushed in the meantime, halt and ask the user — do not force-push.

- [ ] **Step 8: Final report message to user**

Write a closeout summary in chat covering:
- HEAD sha + push status.
- Slice-by-slice commits with finalised hashes.
- Final test numbers (211 vitest / 475 jest game / 27 jest api / 40 × 3 E2E).
- Screenshots that confirm visual improvements.
- Confirmed: Move 1.5 + Move 2 paths untouched.
- Next-step options (A2 / B / others) — user-locked decision.

---

## Self-Review

**Spec coverage:**

| Spec section | Plan task | Status |
|---|---|---|
| A1.1 localization sweep (13 strings + 1 test) | Task 1, steps 1–11 | ✅ |
| A1.2 pot dedup (Pixi `.visible = false` + DOM pulse) | Task 2, steps 1–11 | ✅ |
| A1.3 meta pills hide-when-empty + min-height | Task 3, steps 1–12 | ✅ |
| A1.4 action panel visibility + min-height + flex-wrap | Task 4, steps 1–12 | ✅ |
| Acceptance gates (vitest / jest / E2E × 3 / visual audit) | Task 0 baseline + Task 5 closeout | ✅ |
| Screenshots comparativos per slice | Per-slice `npx tsx scripts/visual-audit.ts` + Task 0 baseline archive | ✅ |
| Mobile / tablet / desktop validation | Visual audit runs all three viewports automatically | ✅ |
| Castizo vocabulary lock | Embedded in Task 1 Step 5's exact string map | ✅ |
| Memory + handoff close | Task 5 steps 4–7 | ✅ |

**Placeholder scan:** No `TBD` / `TODO` / `implement later` / `add error handling`. The min-height "measured values" in Task 3 Step 1 and Task 4 Step 1 are instructions to measure at audit time, with default values (`36px` / `52px` / `50px` / `110px`) provided as starting points — the engineer either confirms or substitutes.

**Type consistency:**
- `ActionButtonsVisibility` defined once in Task 4 Step 4. Used in Task 4 Step 4 (helper) and the wiring snippet.
- `applyHideIfEmpty(badgeEl, value)` defined in Task 3 Step 2, used in Task 3 Steps 4 + 7 with the exact same signature.
- `computeActionButtonsVisibility(state, currentSessionId, ctx)` ctx shape: `{ activeCount, isAllIn, me? }` — same shape across the test cases and the wiring snippet.
- `GameUiRefs` referenced consistently from `game-ui.ts`.

**Scope check:** Four micro-slices, four commits, one closeout commit (optional, may be folded into A1.4). Total ~3–4 hours of focused work + verification. Single plan, no decomposition needed.
