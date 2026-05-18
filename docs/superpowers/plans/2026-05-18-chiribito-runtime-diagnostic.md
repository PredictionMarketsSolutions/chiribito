# Chiribito Runtime Diagnostic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Mixed execution shape:** Phase A is TDD instrumentation code (subagent-friendly). Phases B–E are operator-run procedural diagnostic work (requires Chrome DevTools + real Android via USB + human judgment) — not subagent-friendly. Engineer/operator must drive B–E themselves.

**Goal:** Produce a decision-grade runtime diagnostic of Chiribito mesa gameplay feel against `play.chiribito.com` (with one real Android device in the loop), tagging nine triage areas Pass/Yellow/Red with required evidence, and applying the spec's sequencing rules to determine which P1–P5 bucket gets the first polish-sprint spec.

**Architecture:** Two-stage diagnostic. Stage 1: land one `?perf=1`-gated instrumentation commit (TDD where applicable) that mirrors A2.0's `?debug=1` / `body.debug-mode` / `.debug-only` pattern. Stage 2: run a triage matrix end-to-end (9 areas × hybrid quant/qual criteria) using a 2-tab desktop + 1 Android USB harness, then deep-dive only on Yellow/Red areas with cross-area linking when root cause is transversal.

**Tech Stack:** TypeScript (frontend), Vitest (frontend tests), Jest (game-server + api-server), Pixi.js v7 (canvas), GSAP (animations), Colyseus SDK (WS), Playwright (E2E), Chrome DevTools Performance/Memory/Network/Layers panels, Android Chrome via `chrome://inspect`.

**Spec:** `docs/superpowers/specs/2026-05-18-chiribito-runtime-diagnostic-design.md` (HEAD `3f1fb9a`, pushed to origin/main).

---

## File Structure

Files created or modified during this plan.

### Code changes (single instrumentation commit, 1 amend allowed)

| File | Action | Purpose |
|------|--------|---------|
| `frontend/src/security/perf-mode.ts` | Create | Pure `isPerfEnabled()` helper — URL `?perf` flag presence check. Single boot read. SSR-safe. |
| `frontend/src/security/perf-mode.test.ts` | Create | Vitest truth-table covering presence-only contract + DEV-doesn't-auto-enable + SSR guard. |
| `frontend/src/security/index.ts` | Modify (1 line) | Re-export `isPerfEnabled` (mirrors `isDebugEnabled` re-export at line 179). |
| `frontend/src/main.ts` | Modify (~6 lines) | Add `isPerfEnabled` to security import (line 113); add `body.perf-mode` bootstrap parallel to `body.debug-mode` (lines 116–118); add Pixi ticker counter hook inside `initPixiLayer` (line 413). |
| `frontend/src/perf/perf-counters.ts` | Create | Increment functions for ticker / DOM-rerender / state-change / WS-in / WS-out + periodic `console.debug` reporter. All callers gate with `if (isPerfEnabled())`. |
| `frontend/src/game/game-ui.ts` | Modify (4 lines) | Add gated `perfRerenderInc("name")` at start of `renderSeats` (line 22), `renderPlayers` (line 119), `renderState` (line 157), `updateActionButtons` (line 309). |
| `frontend/src/connection.ts` | Modify (~6 lines) | Increment outgoing-WS counter at `room.send` (line 88); attach wildcard `room.onMessage("*", ...)` counter when room joined. |
| `frontend/src/app/room-event-bindings.ts` | Modify (~3 lines) | Gated state-change counter inside the existing `room.onStateChange` callback. |
| `frontend/src/perf/perf-panel.ts` | Create (optional) | Top-right `.perf-only` panel that polls counters every 1 s. OFF during measurement captures per Heisenberg mitigation. |
| `frontend/index.html` | Modify (1 line, only if panel built) | Insert `<div class="perf-only" id="perf-panel"></div>` near body root. |
| `frontend/src/style.css` | Modify (~3 lines at EOF, only if panel built) | Anchored `.perf-only` rules mirroring `.debug-only` at lines 4635–4637 — show only with `body.perf-mode`. |

### Doc artifacts (separate commits, N permitted)

| File | Action | Purpose |
|------|--------|---------|
| `docs/superpowers/findings/2026-05-18-chiribito-runtime-diagnostic.md` | Create | Master findings doc — real-world feedback verbatim at top, 9-area matrix with verdicts, sequencing decision with rule reference, recalibrations log, deep-dive cross-references. |
| `docs/superpowers/findings/2026-05-18-<area>.md` | Create (per Yellow/Red area) | Mini-report — root-cause hypothesis, artifacts, fix scope, leverage, P-bucket assignment, cross-area links. |
| `docs/HANDOFF_RUNTIME_DIAG.md` | Create | Final handoff doc parallel to `HANDOFF_A2.0.md`. Final HEAD, verdicts table, sequencing winner, trigger for next P-bucket brainstorm. |

### Gitignored artifacts (raw data, not in repo)

| Path | Purpose |
|------|---------|
| `.dev-stack/diag/baseline/mano-completa-desktop.png` | Required side-by-side baseline (desktop). |
| `.dev-stack/diag/baseline/mano-completa-android.png` | Required side-by-side baseline (Android). |
| `.dev-stack/diag/<area>/<env>-<timestamp>.{trace,json,png,mp4}` | Raw captures per area. |
| `.dev-stack/diag/matrix.json` | Machine-readable verdict matrix (for regression re-runs). |

---

# Phase A — Instrumentation Commit (TDD)

One code commit total. One `git commit --amend` allowed (A2.0 precedent) if deep-dives need extra instrumentation later.

## Task A1: `isPerfEnabled` helper (TDD)

**Files:**
- Create: `frontend/src/security/perf-mode.ts`
- Create: `frontend/src/security/perf-mode.test.ts`

**Why this differs from `isDebugEnabled`:** `isDebugEnabled` auto-enables under Vite DEV. `isPerfEnabled` does **not** — instrumentation is opt-in via URL `?perf` only, even in DEV, to avoid Heisenberg perturbation during regular dev work.

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/security/perf-mode.test.ts`:

```typescript
import { afterEach, describe, expect, it, vi } from "vitest";
import { isPerfEnabled } from "./perf-mode";

describe("isPerfEnabled", () => {
  const originalLocation = window.location;

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("returns true when URL has ?perf=1", () => {
    vi.stubEnv("DEV", false);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "?perf=1" },
      writable: true,
      configurable: true,
    });
    expect(isPerfEnabled()).toBe(true);
  });

  it("returns true even with ?perf=0 (presence-only contract)", () => {
    vi.stubEnv("DEV", false);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "?perf=0" },
      writable: true,
      configurable: true,
    });
    expect(isPerfEnabled()).toBe(true);
  });

  it("returns true with ?perf (no value)", () => {
    vi.stubEnv("DEV", false);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "?perf" },
      writable: true,
      configurable: true,
    });
    expect(isPerfEnabled()).toBe(true);
  });

  it("returns false in production with no perf query param", () => {
    vi.stubEnv("DEV", false);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "" },
      writable: true,
      configurable: true,
    });
    expect(isPerfEnabled()).toBe(false);
  });

  it("returns false in Vite DEV mode with no perf flag (DEV does NOT auto-enable)", () => {
    vi.stubEnv("DEV", true);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "" },
      writable: true,
      configurable: true,
    });
    expect(isPerfEnabled()).toBe(false);
  });

  it("returns false when window is undefined (SSR guard)", () => {
    vi.stubEnv("DEV", false);
    const stash = (globalThis as { window?: Window }).window;
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    try {
      expect(isPerfEnabled()).toBe(false);
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: stash,
        writable: true,
        configurable: true,
      });
    }
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run: `cd frontend && npx vitest run src/security/perf-mode.test.ts`
Expected: FAIL — `Cannot find module './perf-mode'` or similar.

- [ ] **Step 3: Implement `isPerfEnabled`**

Create `frontend/src/security/perf-mode.ts`:

```typescript
/**
 * Returns true when runtime-diagnostic instrumentation should be enabled.
 *
 * Source: URL has the `perf` search param (presence check — any value).
 *
 * Read once at boot. Does NOT auto-enable in Vite DEV mode (instrumentation
 * is opt-in via URL flag only) to avoid Heisenberg perturbation during
 * normal dev work.
 *
 * See docs/superpowers/specs/2026-05-18-chiribito-runtime-diagnostic-design.md.
 */
export function isPerfEnabled(): boolean {
  if (typeof window === "undefined" || !window.location) return false;
  const params = new URLSearchParams(window.location.search);
  return params.has("perf");
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `cd frontend && npx vitest run src/security/perf-mode.test.ts`
Expected: 6/6 PASS.

- [ ] **Step 5: Run full frontend test suite to confirm no regression**

Run: `cd frontend && npm test`
Expected: 223/223 PASS (217 prior + 6 new).

## Task A2: Re-export from security barrel

**Files:**
- Modify: `frontend/src/security/index.ts:179` (after the `isDebugEnabled` re-export)

- [ ] **Step 1: Add the re-export**

Append after the existing `isDebugEnabled` re-export at line 179:

```typescript
export { isPerfEnabled } from "./perf-mode";
```

The end of the file should now read:

```typescript
export { isDebugEnabled } from "./debug-mode";
export { isPerfEnabled } from "./perf-mode";
```

- [ ] **Step 2: Run frontend tests to confirm**

Run: `cd frontend && npm test`
Expected: 223/223 PASS.

## Task A3: Bootstrap `body.perf-mode` in `main.ts`

**Files:**
- Modify: `frontend/src/main.ts:113` (import line)
- Modify: `frontend/src/main.ts:116-118` (bootstrap block — add a parallel block)

- [ ] **Step 1: Add `isPerfEnabled` to the security import**

Locate the existing import (around line 113):

```typescript
  validatePassword,
  validateUsername,
  stateGuard,
  isDebugEnabled
} from "./security";
```

Change it to:

```typescript
  validatePassword,
  validateUsername,
  stateGuard,
  isDebugEnabled,
  isPerfEnabled
} from "./security";
```

- [ ] **Step 2: Add the `body.perf-mode` bootstrap block**

Right after the existing `body.debug-mode` block (lines 116–118), insert a parallel block:

```typescript
if (isDebugEnabled()) {
  document.body.classList.add("debug-mode");
}

if (isPerfEnabled()) {
  document.body.classList.add("perf-mode");
}
```

- [ ] **Step 3: Type-check the frontend**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Smoke verify in dev-stack**

Run: `npm run dev:stack` (from repo root).
In Chrome, open `http://localhost:5173/` — confirm `document.body.className` does NOT contain `perf-mode`.
Open `http://localhost:5173/?perf=1` — confirm `document.body.className` contains `perf-mode`.

## Task A4: Create the `perf-counters` module

**Files:**
- Create: `frontend/src/perf/perf-counters.ts`

This module holds all increment functions and a periodic logger. Callers gate at the call site with `if (isPerfEnabled())` — the counter functions themselves are unconditional once called, keeping their internals simple and testable.

- [ ] **Step 1: Create the counters module**

Create `frontend/src/perf/perf-counters.ts`:

```typescript
/**
 * Runtime-diagnostic counters for `?perf=1` instrumentation.
 *
 * Callers gate at call site: `if (isPerfEnabled()) perfRerenderInc("renderSeats")`.
 * Counters themselves are unconditional and side-effect-free except for the
 * periodic console.debug emission below.
 *
 * See docs/superpowers/specs/2026-05-18-chiribito-runtime-diagnostic-design.md.
 */

type Counter = number;

const counters: {
  ticker: Counter;
  rerender: Record<string, Counter>;
  stateChange: Counter;
  wsIn: Counter;
  wsOut: Counter;
  wsInBytes: Counter;
} = {
  ticker: 0,
  rerender: Object.create(null),
  stateChange: 0,
  wsIn: 0,
  wsOut: 0,
  wsInBytes: 0,
};

let reporterIntervalId: number | null = null;
let lastSnapshot: typeof counters | null = null;

export function perfTickerInc(): void {
  counters.ticker += 1;
}

export function perfRerenderInc(name: string): void {
  counters.rerender[name] = (counters.rerender[name] ?? 0) + 1;
}

export function perfStateChangeInc(): void {
  counters.stateChange += 1;
}

export function perfWsInInc(byteSize: number): void {
  counters.wsIn += 1;
  counters.wsInBytes += byteSize;
}

export function perfWsOutInc(): void {
  counters.wsOut += 1;
}

export function perfSnapshot(): typeof counters {
  return {
    ticker: counters.ticker,
    rerender: { ...counters.rerender },
    stateChange: counters.stateChange,
    wsIn: counters.wsIn,
    wsOut: counters.wsOut,
    wsInBytes: counters.wsInBytes,
  };
}

/**
 * Start a 1 Hz reporter that emits a `[perf]` console.debug line with
 * deltas since the previous tick. Idempotent (no-op if already running).
 * Call from main.ts only when isPerfEnabled() is true.
 */
export function startPerfReporter(): void {
  if (reporterIntervalId !== null) return;
  lastSnapshot = perfSnapshot();
  reporterIntervalId = window.setInterval(() => {
    const now = perfSnapshot();
    const prev = lastSnapshot ?? now;
    const rerenderDelta: Record<string, number> = {};
    for (const k of Object.keys(now.rerender)) {
      rerenderDelta[k] = now.rerender[k] - (prev.rerender[k] ?? 0);
    }
    // eslint-disable-next-line no-console
    console.debug("[perf]", {
      tickerHz: now.ticker - prev.ticker,
      rerender: rerenderDelta,
      stateChangeHz: now.stateChange - prev.stateChange,
      wsInHz: now.wsIn - prev.wsIn,
      wsOutHz: now.wsOut - prev.wsOut,
      wsInBytesHz: now.wsInBytes - prev.wsInBytes,
    });
    lastSnapshot = now;
  }, 1000);
}
```

- [ ] **Step 2: Type-check the frontend**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors.

## Task A5: Pixi ticker hook in `initPixiLayer`

**Files:**
- Modify: `frontend/src/main.ts:413` (`initPixiLayer` function body — after the `Application` is constructed)

- [ ] **Step 1: Locate `initPixiLayer` and the `new Application(...)` call**

Run: `Grep` for `new Application` in `frontend/src/main.ts`. Find the line inside `initPixiLayer` (~line 413+) where the Pixi `Application` instance is created. The variable holding it is typically `app` or similar.

- [ ] **Step 2: Add the ticker hook immediately after the Application is created**

After the `Application` construction line, add (replace `app` with the actual variable name from Step 1):

```typescript
import { isPerfEnabled } from "./security";
import { perfTickerInc, startPerfReporter } from "./perf/perf-counters";

// ... inside initPixiLayer, after `const app = new Application(...);` ...
if (isPerfEnabled()) {
  app.ticker.add(perfTickerInc);
  startPerfReporter();
}
```

The imports go at the top of `main.ts` with the other imports. The `isPerfEnabled` import is already added by Task A3; just ensure the `perfTickerInc` and `startPerfReporter` import is also added.

- [ ] **Step 3: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Smoke verify ticker logs**

Run: `npm run dev:stack`. Open `http://localhost:5173/?perf=1`. Sign in, enter mesa. Open DevTools console (filter `[perf]`). Expected: `tickerHz` field reports a number near 60 each second (Pixi default).
Open `http://localhost:5173/` (no flag). Expected: no `[perf]` lines in console.

## Task A6: DOM rerender counters in `game-ui.ts`

**Files:**
- Modify: `frontend/src/game/game-ui.ts:22` (start of `renderSeats`)
- Modify: `frontend/src/game/game-ui.ts:119` (start of `renderPlayers`)
- Modify: `frontend/src/game/game-ui.ts:157` (start of `renderState`)
- Modify: `frontend/src/game/game-ui.ts:309` (start of `updateActionButtons`)

- [ ] **Step 1: Add imports at the top of `game-ui.ts`**

Add to the existing import block at the top of `frontend/src/game/game-ui.ts`:

```typescript
import { isPerfEnabled } from "../security";
import { perfRerenderInc } from "../perf/perf-counters";
```

- [ ] **Step 2: Add counter at the start of each render function**

Insert as the **first statement** inside each of the four functions:

```typescript
export function renderSeats(/* args */) {
  if (isPerfEnabled()) perfRerenderInc("renderSeats");
  // ... existing body ...
}
```

Repeat for `renderPlayers` (use `"renderPlayers"`), `renderState` (use `"renderState"`), and `updateActionButtons` (use `"updateActionButtons"`).

- [ ] **Step 3: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Smoke verify rerender logs**

Run: `npm run dev:stack`. Open `http://localhost:5173/?perf=1`. Sign in, enter mesa, sit, play a hand. In DevTools console filtered for `[perf]`, expected: `rerender` object now shows non-zero counts for each of the four function names as actions happen.

## Task A7: WebSocket in/out counters in `connection.ts`

**Files:**
- Modify: `frontend/src/connection.ts:88` (around `room.send("heartbeat", sendTime)`) and where rooms are joined (find with grep)

- [ ] **Step 1: Add imports at the top of `connection.ts`**

```typescript
import { isPerfEnabled } from "./security";
import { perfWsOutInc, perfWsInInc } from "./perf/perf-counters";
```

- [ ] **Step 2: Count outgoing sends at the heartbeat call site**

Modify line 88 area inside `startClientHeartbeat`:

```typescript
const sendTime = Date.now();
onSend?.(sendTime);
if (isPerfEnabled()) perfWsOutInc();
room.send("heartbeat", sendTime);
```

- [ ] **Step 3: Attach a wildcard message counter helper**

Add at the bottom of `connection.ts`:

```typescript
/**
 * Attach a generic `?perf=1` WS message counter to a joined room.
 * Wildcard listener + outgoing-send wrapper. Safe to attach multiple times
 * because both counters are additive across attaches; recommended: call
 * once per room.onJoin.
 */
export function attachPerfWsCounters(room: Room): void {
  if (!isPerfEnabled()) return;

  room.onMessage("*", (_type, message) => {
    let byteSize = 0;
    try {
      byteSize = JSON.stringify(message).length;
    } catch {
      byteSize = 0;
    }
    perfWsInInc(byteSize);
  });

  const originalSend = room.send.bind(room);
  // Colyseus Room.send is overloaded; we wrap by reassignment.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (room as any).send = function patchedSend(type: string | number, payload?: unknown) {
    perfWsOutInc();
    return originalSend(type as any, payload as any);
  };
}
```

- [ ] **Step 4: Call `attachPerfWsCounters` after room join**

Search the codebase for where rooms are joined (likely in `app/room-session-controller.ts` or `app/room-event-bindings.ts`). After `const room = await client.joinOrCreate(...)` (or equivalent), add:

```typescript
import { attachPerfWsCounters } from "../connection";

// ...immediately after room is acquired...
attachPerfWsCounters(room);
```

- [ ] **Step 5: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Smoke verify WS logs**

Run: `npm run dev:stack`. Open `http://localhost:5173/?perf=1`, enter mesa, play. In DevTools `[perf]` filter, expected: `wsInHz` and `wsOutHz` report non-zero numbers (heartbeat alone gives ~0.04/s; deal/showdown will spike).

## Task A8: State-change counter in `room-event-bindings.ts`

**Files:**
- Modify: `frontend/src/app/room-event-bindings.ts` (find with `grep onStateChange`)

- [ ] **Step 1: Locate the `onStateChange` handler**

Run: `Grep` for `onStateChange` inside `frontend/src/app/`. Expected hit: `room-event-bindings.ts`.

- [ ] **Step 2: Add gated counter at the start of the handler**

Add to imports at the top:

```typescript
import { isPerfEnabled } from "../security";
import { perfStateChangeInc } from "../perf/perf-counters";
```

Inside the `onStateChange` callback body, as the first statement:

```typescript
if (isPerfEnabled()) perfStateChangeInc();
```

- [ ] **Step 3: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Smoke verify state-change logs**

Same dev-stack run as Task A7. Expected: `stateChangeHz` reports non-zero on each action that mutates `MesaState` (bets, deals, fold).

## Task A9 (optional, time-budget permitting): Perf panel UI

If pressed for time, **skip this task** — console.debug logs are sufficient for the diagnostic. The panel is convenience for between-capture inspection only.

**Files:**
- Create: `frontend/src/perf/perf-panel.ts`
- Modify: `frontend/index.html` (insert `<div class="perf-only" id="perf-panel"></div>` inside body)
- Modify: `frontend/src/style.css` (3 lines at EOF)

- [ ] **Step 1: Add the panel container to `index.html`**

Inside `<body>` near the top, insert:

```html
<div class="perf-only" id="perf-panel"></div>
```

- [ ] **Step 2: Add CSS at the EOF of `frontend/src/style.css`**

Mirror the `.debug-only` pattern at lines 4635–4637, with a top-right anchored panel:

```css
/* Runtime diagnostic — perf-only panel hidden by default; revealed when body has .perf-mode */
.perf-only { display: none; }
body.perf-mode .perf-only {
  display: block;
  position: fixed;
  top: 8px;
  right: 8px;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.8);
  color: #f4c430;
  font-family: monospace;
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 4px;
  pointer-events: none;
  white-space: pre;
}
```

- [ ] **Step 3: Create the panel update loop**

Create `frontend/src/perf/perf-panel.ts`:

```typescript
import { perfSnapshot } from "./perf-counters";

let panelIntervalId: number | null = null;
let lastSnapshot: ReturnType<typeof perfSnapshot> | null = null;

/**
 * Start a 1 Hz DOM update loop for the `.perf-only` panel.
 * Idempotent. Call from main.ts only when isPerfEnabled() is true.
 *
 * NOTE: This panel is OFF during measurement captures per the Heisenberg
 * mitigation in the spec — turn it off via `?perf=1&panel=0` or by
 * removing the element manually before capture.
 */
export function startPerfPanel(): void {
  if (panelIntervalId !== null) return;
  const el = document.getElementById("perf-panel");
  if (!el) return;
  lastSnapshot = perfSnapshot();
  panelIntervalId = window.setInterval(() => {
    const now = perfSnapshot();
    const prev = lastSnapshot ?? now;
    const tickerHz = now.ticker - prev.ticker;
    const stateHz = now.stateChange - prev.stateChange;
    const wsInHz = now.wsIn - prev.wsIn;
    const wsOutHz = now.wsOut - prev.wsOut;
    const rerenderTotal = Object.values(now.rerender).reduce((a, b) => a + b, 0)
      - Object.values(prev.rerender).reduce((a, b) => a + b, 0);
    el.textContent = [
      `tick ${tickerHz}/s`,
      `rerend ${rerenderTotal}/s`,
      `state ${stateHz}/s`,
      `ws ↓${wsInHz} ↑${wsOutHz} /s`,
    ].join("\n");
    lastSnapshot = now;
  }, 1000);
}
```

- [ ] **Step 4: Wire panel into `main.ts` startup**

In `frontend/src/main.ts`, inside the `isPerfEnabled()` block added in Task A3, also start the panel:

```typescript
if (isPerfEnabled()) {
  document.body.classList.add("perf-mode");
  // Lazy import to keep panel out of the default bundle path.
  void import("./perf/perf-panel").then(({ startPerfPanel }) => startPerfPanel());
}
```

- [ ] **Step 5: Type-check + smoke**

Run: `cd frontend && npx tsc --noEmit` → 0 errors.
Run: `npm run dev:stack` → open `http://localhost:5173/?perf=1` → top-right panel visible with live counters. Open `http://localhost:5173/` → panel hidden (no `body.perf-mode`, `.perf-only` selector returns `display:none`).

## Task A10: Full baseline verification

- [ ] **Step 1: Frontend tests**

Run: `cd frontend && npm test`
Expected: 223/223 PASS (217 prior + 6 from `perf-mode.test.ts`).

- [ ] **Step 2: Game-server tests**

Run: `npm test` (from repo root)
Expected: 475/475 PASS (no changes to game server).

- [ ] **Step 3: API-server tests**

Run: `cd api-server && npm test`
Expected: 27/27 PASS (no changes to api-server).

- [ ] **Step 4: Playwright E2E (recommended)**

Run: `npm run dev:stack` (in one terminal), then `npx tsx scripts/e2e-browser.ts` (in another).
Expected: 40/40 PASS.

- [ ] **Step 5: Default-mode smoke (no flag)**

Open `http://localhost:5173/` in Chrome. DevTools console open. Expected: NO `[perf]` lines, NO `perf-mode` body class, no visible panel.

- [ ] **Step 6: Perf-mode smoke (`?perf=1`)**

Open `http://localhost:5173/?perf=1`. DevTools console open, filter `[perf]`. Expected: 1 line per second with all 6 counter fields, body has `perf-mode` class, optional panel visible top-right.

## Task A11: Single instrumentation commit

- [ ] **Step 1: Inspect staged + unstaged**

Run: `git status --short && git diff --stat`
Expected: only files listed in the "Code changes" table above; no other changes.

- [ ] **Step 2: Stage the instrumentation files**

```bash
git add frontend/src/security/perf-mode.ts \
        frontend/src/security/perf-mode.test.ts \
        frontend/src/security/index.ts \
        frontend/src/main.ts \
        frontend/src/perf/perf-counters.ts \
        frontend/src/game/game-ui.ts \
        frontend/src/connection.ts \
        frontend/src/app/room-event-bindings.ts
```

If Task A9 was completed, also stage:

```bash
git add frontend/src/perf/perf-panel.ts \
        frontend/index.html \
        frontend/src/style.css
```

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(diag): add ?perf=1 instrumentation for runtime diagnostic

Mirrors A2.0 ?debug=1 pattern: isPerfEnabled() pure helper (presence-only
contract; does NOT auto-enable in Vite DEV to avoid Heisenberg perturbation
during normal dev work), body.perf-mode bootstrap, anchored .perf-only
selector strategy.

Counters wired into the four hot points called out in the spec:
  - Pixi ticker (initPixiLayer in main.ts) -> tick rate
  - DOM rerenders (renderSeats / renderPlayers / renderState /
    updateActionButtons in game-ui.ts) -> per-function rerender count
  - WS in/out (room.send + room.onMessage("*") wildcard in connection.ts)
    -> message count + payload bytes
  - State changes (onStateChange in room-event-bindings.ts) -> mutation rate

Reporter at 1 Hz emits a single [perf] console.debug line with deltas.
Optional .perf-only panel (top-right, anchored, OFF during measurement
captures per Heisenberg mitigation).

Tests: 223/223 frontend (217 prior + 6 isPerfEnabled truth table), 475/475
game-server, 27/27 api-server. Playwright 40/40.

Default mode (no ?perf flag): zero visible output, zero console noise,
zero behavioral change.

Spec: docs/superpowers/specs/2026-05-18-chiribito-runtime-diagnostic-design.md
EOF
)"
```

- [ ] **Step 4: Verify commit landed**

Run: `git log --oneline -2 && git status --short`
Expected: HEAD is the new instrumentation commit; working tree clean.

---

# Phase B — Triage Execution (procedural, ~6–10h wall clock)

Operator-run. Not subagent-friendly. Requires Chrome on desktop + a real Android device connected via USB with USB debugging enabled.

## Task B0: Harness setup

- [ ] **Step 1: Verify Android USB connectivity**

Run: `adb devices`
Expected: Android device listed as `device` (not `unauthorized`). If unauthorized, accept the prompt on the device.

- [ ] **Step 2: Open `chrome://inspect/#devices` on desktop Chrome**

Confirm the Android device appears with its open tabs listed underneath. If not, enable USB debugging on the device and re-plug.

- [ ] **Step 3: Provision three test accounts**

Either: (a) create three new accounts on `play.chiribito.com` via the regular auth flow, or (b) reuse existing accounts (any three). Record credentials in a local note (do NOT commit).

- [ ] **Step 4: Make the diagnostic artifact directory**

```bash
mkdir -p .dev-stack/diag/baseline
```

Confirm `.dev-stack/` is already in `.gitignore` (per A2.0 precedent — `_screenshots/` and `.dev-stack/visual-audit*` are gitignored).

## Task B1: Mano-completa baseline pair (REQUIRED)

This pair is the future side-by-side reference. Capture **before** any triage measurement so it reflects the pre-diagnostic state.

- [ ] **Step 1: Spawn the 3-way harness**

Tab A (Chrome normal): account #1 → `play.chiribito.com` → create new mesa.
Tab B (Chrome incognito): account #2 → `play.chiribito.com` → join Tab A's mesa by code.
Android (chrome://inspect): account #3 → join same mesa by code.
All three sentados.

- [ ] **Step 2: Play one full mano**

From Tab A, press `Empezar mano`. Play through deal → 5 community streets → showdown → next-mano start.

- [ ] **Step 3: Capture desktop screenshot (Tab A) at a mid-mano moment**

Choose a frame where: 2+ community cards are face-up, your hole cards are visible, action panel shows active actions, pot has chips. Use Chrome DevTools "Capture full size screenshot" (Cmd/Ctrl+Shift+P → "Capture full size screenshot"). Save as `.dev-stack/diag/baseline/mano-completa-desktop.png`.

- [ ] **Step 4: Capture Android screenshot at the same logical moment**

In chrome://inspect, click "Inspect" on the Android tab, then in the inspector use the screencast (camera icon) + capture. Or take an Android-native screenshot (Power+VolDown). Save as `.dev-stack/diag/baseline/mano-completa-android.png`.

- [ ] **Step 5: Verify both files exist and open visually**

```bash
ls -la .dev-stack/diag/baseline/
```

Open both in an image viewer. Confirm both show a recognizable mid-mano mesa state.

## Tasks B2–B10: One per triage area (9 tasks)

Each area task follows the same five-step shape. Refer to the spec triage matrix for exact thresholds + tools per area. Save each artifact to `.dev-stack/diag/<area>/<env>-<timestamp>.{ext}`.

### Task B2: Area #1 — Frame pacing + CPU script time + long tasks + jitter

Env: `play.chiribito.com` (desktop) + Android via `chrome://inspect`.

- [ ] **Step 1: Setup capture (desktop)**

Open `play.chiribito.com` in Tab A. Sign in. Enter a multi-player mesa with Tab B + Android present (per the harness in B0). Open DevTools → Performance tab.

- [ ] **Step 2: Run capture (deal → showdown, ≥60s)**

In Tab A, press the Record button in Performance tab. Press `Empezar mano`. Play through one full mano. Stop recording.

- [ ] **Step 3: Export and analyze**

In Performance tab, right-click the recording → "Save profile". Save as `.dev-stack/diag/01-frame-pacing/prod-desktop-<timestamp>.trace`.
Analyze: count % frames >16.7ms, % frames >33.3ms, long tasks per minute, jitter stddev. Use the DevTools Bottom-Up / Summary view + the Timeline frame chart.

- [ ] **Step 4: Repeat on Android**

Same as Steps 1–3, but on the Android device via chrome://inspect. Save trace as `.dev-stack/diag/01-frame-pacing/prod-android-<timestamp>.trace`.

- [ ] **Step 5: Apply thresholds, record verdict**

Apply spec row #1 thresholds. Determine Pass / Yellow / Red **separately for desktop and Android**, then take the worse of the two as the overall verdict (per Risks #7 "false comfort from desktop-only metrics"). Append a one-paragraph narrative + measured numbers to a working notes file at `.dev-stack/diag/01-frame-pacing/verdict.md`.

### Task B3: Area #2 — Pixi render loop

Env: Local `npm run dev:stack` + `?perf=1`.

- [ ] **Step 1: Setup capture**

`npm run dev:stack` running. Open `http://localhost:5173/?perf=1`. Sign in. Sit at mesa with another player (Tab B incognito).

- [ ] **Step 2: Run 10s idle observation**

Both seated, no action in progress (waiting state). Open DevTools console filtered `[perf]`. Observe `tickerHz` for 10 seconds. Note count, screenshot console.

- [ ] **Step 3: Run wasteful-redraw check**

Note: with the `?perf=1` instrumentation, Pixi `tickerHz` is expected ~60. Without DOM state change (no animations active, no rerenders happening), is the canvas still being redrawn? Open DevTools Layers panel; observe the Pixi canvas layer. If it shows constant repaints during idle, that is a wasteful redraw signal.

- [ ] **Step 4: Save evidence**

Screenshot of DevTools console during idle. Screenshot of Layers panel showing canvas paint rect. Save to `.dev-stack/diag/02-pixi-loop/`.

- [ ] **Step 5: Apply rubric, record verdict**

Per spec row #2:
- Pass: 0 wasteful redraws during 10s idle.
- Yellow: occasional wasteful redraws during state transitions.
- Red: continuous wasteful redraws during idle or animation.

Append narrative + verdict to `.dev-stack/diag/02-pixi-loop/verdict.md`.

### Task B4: Area #3 — Texture memory pressure

Env: `npm run build && npx vite preview --port 5174` (prod build local).

- [ ] **Step 1: Setup capture**

Run `cd frontend && npm run build && npx vite preview --port 5174`. Open `http://localhost:5174` in Chrome with Tab B incognito present. Sit at mesa.

- [ ] **Step 2: Capture initial heap snapshot**

DevTools → Memory tab → Heap snapshot → Take snapshot. Save.

- [ ] **Step 3: Open Layers panel for GPU memory**

DevTools → More tools → Layers. Note GPU memory used by the Pixi canvas layer (shown in the right pane).

- [ ] **Step 4: Run 5-minute session including several manos**

Play 3–5 manos consecutively. Track GPU memory and heap size over time.

- [ ] **Step 5: Capture final heap snapshot + compare**

Take another heap snapshot. Use "Comparison" view in Memory tab to see delta. Look for unbounded retainers of Pixi `Texture` / `BaseTexture` / `Sprite` instances.

- [ ] **Step 6: Apply thresholds, record verdict**

Per spec row #3:
- Pass: <50MB GPU, heap stable 5 min.
- Yellow: 50–100MB GPU OR heap grows ≤20MB/min.
- Red: >100MB GPU OR heap grows unbounded.

Save snapshots + verdict to `.dev-stack/diag/03-texture/`.

### Task B5: Area #4 — Resize thrashing

Env: `play.chiribito.com` desktop (window drag) + Android (orientation flip).

- [ ] **Step 1: Setup capture (desktop)**

`play.chiribito.com` open in Tab A, seated at mesa. DevTools Performance tab open.

- [ ] **Step 2: Record a resize sequence**

Start Performance recording. Drag the window corner to resize the viewport slowly over ~5 seconds (e.g. 1440px → 800px → 1200px). Stop recording.

- [ ] **Step 3: Inspect for layout-shift events and canvas recreates**

In the Performance recording, filter for "Layout Shift" entries. Compute a CLS-like sum. Search the recording for "Composite Layers" or canvas-recreation signatures (look for `WebGLRenderer` constructors or similar in the bottom-up).

- [ ] **Step 4: Repeat on Android (orientation flip)**

Rotate the Android device portrait ↔ landscape three times while at the mesa. Capture a Performance trace via remote DevTools the same way.

- [ ] **Step 5: Apply thresholds, record verdict**

Per spec row #4:
- Pass: CLS <0.05, no canvas recreate on resize.
- Yellow: CLS 0.05–0.15.
- Red: CLS >0.15 OR canvas recreates on every resize.

Save traces + verdict to `.dev-stack/diag/04-resize/`.

### Task B6: Area #5 — WebSocket cadence / spam (burst-aware)

Env: `play.chiribito.com` multi-player (Tab A + Tab B + Android).

- [ ] **Step 1: Setup capture**

All three sentados. DevTools Network tab open in Tab A, filter "WS". Click the room's WS connection to expose Frames sub-panel.

- [ ] **Step 2: Capture 60s of mesa play**

Clear Frames panel. Press `Empezar mano`. Play one mano (deal → showdown). Stop after 60 seconds.

- [ ] **Step 3: Separate idle vs burst rates**

Split the 60-second window into:
- **Idle windows** (waiting state, between manos, between actions) — count messages, average.
- **Burst windows** (deal, showdown, community-card reveals) — count messages within each 1-second window during these moments.

Note duplicate frames (same payload sent multiple times within <100 ms). Compute average payload size.

- [ ] **Step 4: Export evidence**

Right-click in Frames panel → "Save all as HAR with content". Save to `.dev-stack/diag/05-ws/prod-multiplayer-<timestamp>.har`. Also screenshot the frames list.

- [ ] **Step 5: Apply thresholds, record verdict**

Per spec row #5:
- Pass: idle <2 msg/s; burst legitimately high with no dups; <500B avg.
- Yellow: idle 2–10 msg/s sostenido OR occasional dups OR avg 500B–2KB.
- Red: idle >10 msg/s sostenido OR systematic duplicates OR avg >2KB.

Save verdict + analysis to `.dev-stack/diag/05-ws/verdict.md`.

### Task B7: Area #6 — DOM rerenders innecesarios

Env: Local `npm run dev:stack` + `?perf=1`.

- [ ] **Step 1: Setup capture**

`npm run dev:stack`. Open `http://localhost:5173/?perf=1` in Tab A + Tab B incognito (account #2). Both sit at the mesa.

- [ ] **Step 2: Capture rerender vs state-change ratios**

Open DevTools console filtered `[perf]`. Play a hand. Each second, the `[perf]` line emits `rerender: { renderSeats: N, ... }` and `stateChangeHz: M`.

Sum the rerender counts across the 4 instrumented functions. Compute the ratio `sum(rerender) / stateChangeHz` for each second.

- [ ] **Step 3: Detect orphan rerenders**

An orphan rerender = a second window where `rerender` is non-zero but `stateChangeHz` is zero. Note any such windows.

- [ ] **Step 4: Export evidence**

Copy 30+ seconds of `[perf]` console lines to `.dev-stack/diag/06-rerenders/perf-log-<timestamp>.json` (or .txt).

- [ ] **Step 5: Apply rubric, record verdict**

Per spec row #6:
- Pass: 1 rerender per mutation, 0 orphans.
- Yellow: 2–3 rerenders per mutation.
- Red: >3 rerenders per mutation OR orphan rerenders observed.

Save verdict to `.dev-stack/diag/06-rerenders/verdict.md`.

### Task B8: Area #7 — Mobile GPU bottlenecks + thermal

Env: Android USB (chrome://inspect → `play.chiribito.com`).

- [ ] **Step 1: Record device metadata**

Note: device model, Android version, manufacturer tier (low / mid / high — defensible via Geekbench score or release year).

- [ ] **Step 2: Capture Performance trace on Android**

In chrome://inspect, open DevTools for the Android tab. Performance tab → Record. Play one full mano. Stop. Save as `.dev-stack/diag/07-mobile-gpu/android-<model>-<timestamp>.trace`.

- [ ] **Step 3: Measure GPU thread + frame time**

In the trace, find the GPU process / thread. Compute median frame time and GPU thread utilization %.

- [ ] **Step 4: Thermal / throttling test (consecutive manos)**

Play 5 consecutive manos without pausing. After each mano, note:
- Subjective device temperature (cool / warm / hot — palm test).
- FPS drift (does the device feel slower at mano 5 than mano 1?).
- Any visible thermal-throttle UI (some Androids show a thermometer icon).

- [ ] **Step 5: Apply thresholds, record verdict (mid-tier especially)**

Per spec row #7:
- Pass: median <16.7ms, GPU <30%, no warming after 10 manos.
- Yellow: median 16.7–25ms OR GPU 30–60% OR warming after 5+ manos.
- Red: median >25ms OR GPU >60% OR visible thermal throttle OR FPS degrades across manos.

Save trace + thermal notes + verdict to `.dev-stack/diag/07-mobile-gpu/`.

### Task B9: Area #8 — Z-index / layering of cards

Env: `npm run build && npx vite preview --port 5174` (prod build) + Android via `chrome://inspect`.

- [ ] **Step 1: Setup capture (desktop)**

Open the prod-build local on Tab A. Tab B incognito present, both seated, mano in progress.

- [ ] **Step 2: Inspect Layers panel during card deal**

DevTools → More tools → Layers. Begin recording on Performance. Press `Empezar mano`. Watch the Layers panel during the deal animation. Note: are cards stacking correctly? Do any cards momentarily flicker behind another DOM element (UI panel, modal, sidebar)? Take screenshots of the Layers panel mid-deal.

- [ ] **Step 3: Test with overlapping modals/panels**

Trigger any modal/overlay (e.g. the action panel during turn). Verify cards remain visible above the felt but below intentional overlays. Screenshot anomalies.

- [ ] **Step 4: Repeat on Android**

Same observation via chrome://inspect remote DevTools. Mobile cards often have different stacking due to viewport differences — record separately.

- [ ] **Step 5: Apply rubric, record verdict**

Per spec row #8:
- Pass: stack order correct, 0 flicker.
- Yellow: mis-layer during animation, no impact on action.
- Red: cards hidden OR modal underneath OR persistent layering bug.

Save screenshots + verdict to `.dev-stack/diag/08-zindex/`.

### Task B10: Area #9 — Readability (hand + community + geometry)

Env: `npm run build && npx vite preview --port 5174` + Android.

- [ ] **Step 1: Setup capture (desktop)**

Prod-build local at 1440×900 + mobile-equivalent viewport in DevTools responsive mode (375×812, DPR 2). Seated at mesa with cards dealt.

- [ ] **Step 2: Measure rank glyph size**

For each card visible (5 community + 2 hole), measure the rank-glyph rendered pixel height using DevTools "Inspect element" + computed style → bounding box. Note effective viewport size (CSS px × device-pixel-ratio).

- [ ] **Step 3: Measure inter-card separation + overlap**

For each adjacent pair in the hand: measure the horizontal gap between them in pixels. For the community row: measure both gap and any intentional overlap (Chiribito community is 5 cards revealed one-at-a-time, no intentional overlap during normal flow).

- [ ] **Step 4: Measure contrast ratio (rank vs felt + rank vs card background)**

Use Chrome DevTools Accessibility panel → contrast ratio tool. Hover over each rank glyph; record ratio against the felt background showing through gaps (if any) AND against the card-face background.

- [ ] **Step 5: During-animation legibility**

Record a video of the deal animation (DevTools Performance recording set to "screenshots" mode, or OBS / phone video). Spot-check: at any single frame mid-animation, is the rank readable? Or does motion blur / scale / spin make it momentarily unreadable?

- [ ] **Step 6: Thumb-occlusion test (Android real grip)**

Hold the Android in a one-handed portrait grip as a player would. Note which on-screen regions are occluded by the thumb. Cross-reference against where your hole cards land: are they under the thumb?

- [ ] **Step 7: Apply thresholds, record verdict**

Per spec row #9 (note that user feedback already flagged this as likely Red; verify with measurements):
- Pass: rank ≥18px desk / ≥14px mobile, sep ≥8px, no overlap unsolicited, contrast ≥4.5:1, readable during animation, primary hand not under thumb.
- Yellow: rank 16–18 / 12–14, sep 4–8px, minor overlap, contrast 3–4.5:1, readable when animation stops.
- Red: rank <16 / <12, sep <4px, significant overlap, contrast <3:1, illegible during animation, thumb covers primary info.

Save measurements + screenshots + video + verdict to `.dev-stack/diag/09-readability/`.

## Task B11: Consolidate matrix.json

After all 9 area tasks complete:

- [ ] **Step 1: Write the matrix**

Create `.dev-stack/diag/matrix.json` (gitignored) with this shape:

```json
{
  "schemaVersion": 1,
  "spec": "docs/superpowers/specs/2026-05-18-chiribito-runtime-diagnostic-design.md",
  "head": "<git rev-parse HEAD>",
  "capturedAt": "<ISO 8601>",
  "androidDevice": { "model": "...", "androidVersion": "...", "tier": "low|mid|high" },
  "areas": [
    {
      "id": 1, "name": "frame-pacing",
      "verdict": "pass|yellow|red",
      "desktopVerdict": "pass|yellow|red",
      "androidVerdict": "pass|yellow|red",
      "metrics": { "slowFramesPct": 0, "severeFramesPct": 0, "longTasksPerMin": 0, "jitterStddevMs": 0 },
      "artifactPaths": [".dev-stack/diag/01-frame-pacing/prod-desktop-XXX.trace"]
    },
    { "id": 2, "name": "pixi-render-loop", "verdict": "...", "metrics": {...}, "artifactPaths": [...] },
    { "id": 3, "name": "texture-memory", "verdict": "...", "metrics": {...}, "artifactPaths": [...] },
    { "id": 4, "name": "resize-thrashing", "verdict": "...", "metrics": {...}, "artifactPaths": [...] },
    { "id": 5, "name": "ws-cadence", "verdict": "...", "metrics": {...}, "artifactPaths": [...] },
    { "id": 6, "name": "dom-rerenders", "verdict": "...", "metrics": {...}, "artifactPaths": [...] },
    { "id": 7, "name": "mobile-gpu", "verdict": "...", "metrics": {...}, "artifactPaths": [...] },
    { "id": 8, "name": "zindex-layering", "verdict": "...", "metrics": {...}, "artifactPaths": [...] },
    { "id": 9, "name": "readability", "verdict": "...", "metrics": {...}, "artifactPaths": [...] }
  ],
  "recalibrations": []
}
```

Fill every field with measured values from B2–B10. Record any threshold recalibrations applied during measurement in the `recalibrations` array.

- [ ] **Step 2: Confirm 9/9 filled**

Verify there are exactly 9 entries in `areas` and that every `verdict` field is one of `pass | yellow | red` (no nulls).

---

# Phase C — Master Findings Doc

## Task C1: Write master findings doc

**Files:**
- Create: `docs/superpowers/findings/2026-05-18-chiribito-runtime-diagnostic.md`

- [ ] **Step 1: Create the findings folder if not present**

```bash
mkdir -p docs/superpowers/findings
```

- [ ] **Step 2: Write the master doc**

Use this skeleton (fill bracketed sections with content from Phase B):

```markdown
# Chiribito Runtime Diagnostic — Master Findings

> Captured against HEAD `<sha>` between `<date-start>` and `<date-end>`.
> Spec: `docs/superpowers/specs/2026-05-18-chiribito-runtime-diagnostic-design.md`.
> Plan: `docs/superpowers/plans/2026-05-18-chiribito-runtime-diagnostic.md`.

---

## Real-world user feedback (priority initial signal — verbatim)

Captured 2026-05-18 by the user on `play.chiribito.com` PC + Android, immediately before this diagnostic ran:

1. **Mesa cards too small** — assets are high quality; the issue appears to be geometry / layout / scale, not asset resolution.
2. **Player hand illegible** — high perceptual priority; currently breaks basic gameplay clarity.
3. **Mobile layout feels disjointed** — responsive spacing/layout is off; same perceptual issue as desktop, amplified.

Root-cause hypothesis (user): structural geometry — proportions, scaling, responsive geometry, ergonomics, table composition. **Not** assets, **not** backend.

User-expected likely red areas: `#9 readability`, `#7 mobile GPU` / `#4 resize thrashing` (mobile ergonomics), `#8 z-index/layering`.

---

## Android device used

- Model: <...>
- Android version: <...>
- Tier (low / mid / high): <...>

---

## Triage matrix verdicts

| # | Area | Desktop | Android | Overall | Key metric | Artifact |
|---|------|---------|---------|---------|------------|----------|
| 1 | Frame pacing + CPU + long tasks + jitter | <P/Y/R> | <P/Y/R> | <worse> | slowFramesPct=X, jitter=Y ms | `.dev-stack/diag/01-frame-pacing/...` |
| 2 | Pixi render loop | n/a | n/a | <verdict> | wasteful redraws: <observation> | `.dev-stack/diag/02-pixi-loop/...` |
| 3 | Texture memory | n/a | n/a | <verdict> | GPU=XMB, heap delta=Y MB/min | `.dev-stack/diag/03-texture/...` |
| 4 | Resize thrashing | <P/Y/R> | <P/Y/R> | <worse> | CLS=X, canvas-recreate=Y | `.dev-stack/diag/04-resize/...` |
| 5 | WS cadence (burst-aware) | n/a | n/a | <verdict> | idle X/s, burst Y/s, dup Z | `.dev-stack/diag/05-ws/...` |
| 6 | DOM rerenders | n/a | n/a | <verdict> | rerender/mutation ratio | `.dev-stack/diag/06-rerenders/...` |
| 7 | Mobile GPU + thermal | n/a | <P/Y/R> | <verdict> | median X ms, GPU Y%, thermal <obs> | `.dev-stack/diag/07-mobile-gpu/...` |
| 8 | Z-index / layering | <P/Y/R> | <P/Y/R> | <worse> | <observation> | `.dev-stack/diag/08-zindex/...` |
| 9 | Readability | <P/Y/R> | <P/Y/R> | <worse> | rank <px>, sep <px>, contrast X:1, animation, thumb | `.dev-stack/diag/09-readability/...` |

For mobile-relevant areas (#1, #4, #7, #8, #9): the **overall** verdict is the **worse** of desktop and Android (per spec Risk #7 "false comfort from desktop-only metrics").

---

## Recalibrations applied

<List any threshold recalibrations applied mid-diagnostic, with reason. If none: "None — original thresholds held.">

---

## Cross-area linking

<For each transversal root cause identified (e.g. rerenders → frame pacing, texture pressure → GPU thermal): note primary area + dependent areas. Sequencing treats the root cause as primary so we don't chase symptoms.>

---

## Sequencing decision

<State which spec rule applied (verbatim from spec's rule table), and what bucket gets the first polish-sprint spec.>

Example:
> Rule fired: "All #1–#7 Pass/Yellow + #9 → Red → P1 (legibility) first. P5 follows."
> Severity escalation: <applied / not applied>.
> Next P-bucket spec: **P1 — Legibility**.

---

## Deep-dive mini-reports (links updated post Phase D)

- `<area>` Red/Yellow — see [`./2026-05-18-<area>.md`](./2026-05-18-<area>.md)
- ...

---

## Done-criteria checklist

- [ ] Triage matrix 9/9 filled with verdict + key metric + artifact path
- [ ] Deep-dive mini-report written for each Yellow/Red area
- [ ] Sequencing decision documented with explicit rule reference
- [ ] Cross-area linking applied where root cause transversal
- [ ] Test baselines green post-instrumentation: vitest 223 · jest game 475 · jest api 27 · Playwright 40
- [ ] User signoff on findings + sequencing decision
- [ ] Single `?perf=1` code commit + ≤1 amend (no additional code commits)
- [ ] Mano-completa desktop + Android baseline pair present in `.dev-stack/diag/baseline/`
- [ ] Brainstorm trigger for first P-bucket spec opened in new session

---

## References

- Spec: `docs/superpowers/specs/2026-05-18-chiribito-runtime-diagnostic-design.md`
- Plan: `docs/superpowers/plans/2026-05-18-chiribito-runtime-diagnostic.md`
- Visual audit baseline: `docs/superpowers/specs/2026-05-18-chiribito-visual-audit.md`
- HANDOFF current: `docs/HANDOFF_A2.0.md`
```

- [ ] **Step 3: Apply the correct sequencing rule**

Walk the spec's rule table top-to-bottom against the actual verdicts in your matrix. The FIRST matching rule fires. Apply severity escalation ONLY if #9 is Red severe ("core gameplay unreadable" — rank illegible at viewport without zoom, confirmed by user spot check). State the rule fired verbatim in the doc.

## Task C2: Commit master findings doc

- [ ] **Step 1: Stage**

```bash
git add docs/superpowers/findings/2026-05-18-chiribito-runtime-diagnostic.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "$(cat <<'EOF'
docs(diag): master runtime-diagnostic findings + sequencing decision

Matrix 9/9 with desktop + Android verdicts (mobile-aware: overall is the
worse of desktop and Android per spec Risk #7). Real-world user feedback
captured 2026-05-18 (cards too small, hand illegible, mobile disjointed)
embedded verbatim at top.

Sequencing rule fired: <rule>. Next P-bucket spec: <Pn — name>.

Severity escalation: <applied | not applied>.
Cross-area linking: <list root-cause -> dependents pairs, or none>.
Recalibrations: <count or none>.

Deep-dive mini-reports follow as per-area doc commits.
EOF
)"
```

- [ ] **Step 3: Push**

```bash
git push origin main
```

---

# Phase D — Deep-Dives (per Yellow/Red area)

Repeat the Task D template once per Yellow/Red area identified in Phase B. Each run produces one mini-report.

## Task D-template: Deep-dive mini-report for area `<name>`

**Files:**
- Create: `docs/superpowers/findings/2026-05-18-<area-slug>.md`

- [ ] **Step 1: Focused session (1–2h max)**

Re-open the captured artifacts for the area. Re-run the harness if needed. Look for the simplest hypothesis that fits all the evidence — Occam.

- [ ] **Step 2: Add instrumentation if needed (amend the single `?perf=1` commit)**

If the existing counters don't surface the root cause, add a targeted counter or `console.debug` log. **Always amend** the single instrumentation commit:

```bash
git add <file>
git commit --amend --no-edit
```

If you've already used the 1-amend budget, STOP and escalate to the user with rationale.

- [ ] **Step 3: Write the mini-report**

Skeleton:

```markdown
# Deep-Dive — <area name>

> Triage verdict: <Yellow | Red> · Severity: <moderate | severe | "core gameplay unreadable">
> Captured against HEAD `<sha>`.

## Evidence
- <bullet trace / screenshot / video paths from `.dev-stack/diag/<area>/`>

## Root-cause hypothesis
<1–3 paragraphs. The simplest hypothesis that explains all evidence.>

## Suggested fix scope
- Files: <exact paths>
- Order of magnitude: <S / M / L LoC>
- Risk: <low / medium / high>
- Locked / no-touch concerns: <reference HANDOFF_A2.0.md "No-touch list" if applicable; explicitly state if the proposed scope skirts a locked area>

## Leverage estimate
<high / medium / low — with one-line rationale>

## Suggested P-bucket
<P1 / P2 / P3 / P4 / P5>
<one-paragraph justification>

## Cross-area linking
<If root cause is transversal: list the primary area and dependent areas. Add a back-link from this report's section to the linked report. Update the linked report's "Cross-area linking" section reciprocally.>

## Out of scope (NOT proposed here)
- Actual fix code (that is the next polish-sprint spec's job)
- Any change to engine / managers / api-server
- Branding asset changes
- Any redesign work
```

- [ ] **Step 4: Cross-area linking pass**

If this deep-dive's root cause is also the root cause of another area's Yellow/Red, edit the OTHER mini-report (if it exists) or note it in master findings for the area not yet deep-dived. Mark this report as the "primary" and the others as "dependent".

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/findings/2026-05-18-<area-slug>.md
git commit -m "docs(diag): deep-dive mini-report — <area> (<verdict>)"
```

## Task D-final: Update master findings doc with deep-dive links

- [ ] **Step 1: Edit master findings doc**

Open `docs/superpowers/findings/2026-05-18-chiribito-runtime-diagnostic.md`. Fill in the "Deep-dive mini-reports" section with links to each mini-report created in the D-template runs. Update "Cross-area linking" with the consolidated map. Reconfirm "Sequencing decision" — does the final picture change the rule that fires? If so, update.

- [ ] **Step 2: Commit + push**

```bash
git add docs/superpowers/findings/2026-05-18-chiribito-runtime-diagnostic.md
git commit -m "docs(diag): cross-link deep-dives + final sequencing review"
git push origin main
```

---

# Phase E — Closure

## Task E1: Final test baselines (post-amend regression check)

Required because Phase D may have amended the instrumentation commit.

- [ ] **Step 1: Frontend tests**

Run: `cd frontend && npm test`
Expected: 223/223 PASS.

- [ ] **Step 2: Game-server tests**

Run: `npm test`
Expected: 475/475 PASS.

- [ ] **Step 3: API-server tests**

Run: `cd api-server && npm test`
Expected: 27/27 PASS.

- [ ] **Step 4: Playwright E2E**

Run dev-stack + `npx tsx scripts/e2e-browser.ts`.
Expected: 40/40 PASS.

If any baseline drops, STOP — diagnose before proceeding.

## Task E2: Decide on `?perf=1` long-term retention

- [ ] **Step 1: Decide keep or remove**

Options:
- **Keep** (recommended, parallel to A2.0's `body.debug-mode`): leaves `?perf=1` as a permanent diagnostic harness for future re-runs. Cost: ~150 LoC of gated instrumentation, zero default-mode overhead.
- **Remove**: revert the instrumentation commit + amend after diagnostic is done. Adds a `revert(diag)` commit. Saves LoC but loses the harness.

- [ ] **Step 2: Record decision in master findings doc**

Append a "Long-term `?perf=1` retention" section to `2026-05-18-chiribito-runtime-diagnostic.md` stating "kept" or "removed" with rationale.

- [ ] **Step 3 (only if removing): Revert the instrumentation commit**

```bash
git revert <perf-instrumentation-sha>
# Edit revert commit message: "revert(diag): remove ?perf=1 instrumentation post-diagnostic"
git push origin main
```

Re-run all four test baselines after revert.

## Task E3: Update / create HANDOFF doc

**Files:**
- Create: `docs/HANDOFF_RUNTIME_DIAG.md`

- [ ] **Step 1: Write a handoff doc parallel to `HANDOFF_A2.0.md`**

Sections:
- Title: "Chiribito — Runtime Diagnostic CLOSED handoff"
- HEAD final SHA
- Test baselines confirmation
- Verdicts table (terse, links to master findings)
- Sequencing decision + next P-bucket spec name
- `?perf=1` retention decision
- "How to resume" subsection for next session: load master findings doc → open brainstorm for first P-bucket spec
- No-touch carry-forwards (anything new that became locked during the diagnostic)

- [ ] **Step 2: Commit + push**

```bash
git add docs/HANDOFF_RUNTIME_DIAG.md
git commit -m "docs(handoff): close out runtime diagnostic — next is <Pn-name>"
git push origin main
```

## Task E4: Trigger first P-bucket brainstorm

- [ ] **Step 1: Update memory pointer (manual, in conversation)**

In the next session with the user, surface the sequencing-winner P-bucket and propose opening a fresh `superpowers:brainstorming` for that bucket's spec. Do not auto-start; wait for user "go".

- [ ] **Step 2: Stop here**

Diagnostic is closed. The polish sprint's P-bucket specs are out of scope of this plan.

---

# Self-review (run after the plan is written)

**Spec coverage check:** every section of the spec is covered by a task:

- Goal → Phase A–E entire flow.
- Real-world user feedback (priority initial signal) → embedded verbatim in Task C1 doc template.
- Scope (in) — 9 areas → Tasks B2–B10 one each.
- Scope (out) → enforced by Phase D mini-report template's "Out of scope" section.
- Constraints — zero player-facing UI default → Task A9 panel is OPTIONAL + behind `.perf-only`; Task A10 step 5 verifies zero default-mode noise.
- Constraints — test baselines preserved → Tasks A10, E1 enforce.
- Constraints — one code commit + 1 amend → Task A11 single commit; Task D-template Step 2 amend rule.
- Methodology — pre-triage → triage → deep-dive → Phases A, B, D respectively.
- Environment matrix → embedded in B2–B10 "Env" headers.
- Harness multi-player → Task B0.
- `?perf=1` instrumentation budget → Tasks A1–A8 + A9 optional + A11 single commit.
- Triage matrix 9 areas × criteria → Tasks B2–B10 + thresholds applied per area.
- Deep-dive protocol → Task D-template all 5 steps.
- Output artifacts → file structure table + Task B11 matrix.json + Task C1 master findings + Task D-template mini-report.
- Mano-completa baseline pair → Task B1 (required).
- Sequencing rules → Task C1 Step 3 + Task D-final re-check.
- Severity escalation rule → Task C1 Step 3 explicit gate.
- Phase W gating note → out-of-scope reminder in spec; not actionable in this plan (correct).
- Done criteria (9 items) → checklist in Task C1 doc template.
- Triage-runs-to-completion → Task B is sequential B2 through B10 before Phase D starts (enforced by document order).
- Validation rigor → every B task Step 4–5 enforces artifact + measurement; Task C1 records device tier + recalibrations.
- Risks → mitigations in tasks: false desktop-only comfort (B2–B10 desktop+Android separately + Task C1 "worse-of" rule); Heisenberg (panel off during capture noted in A9); threshold recalibration (Task C1 step 3 + recalibrations field in matrix.json + master doc).

**Placeholder scan:** none. All `<placeholder>` markers in the doc templates (Task C1, Task D-template) are fill-in slots for the operator running Phase B–D, not unfinished plan content. The plan itself names every file, function, line number where known, and exact code.

**Type / name consistency:** `isPerfEnabled` used consistently throughout. `perfTickerInc`, `perfRerenderInc`, `perfStateChangeInc`, `perfWsInInc`, `perfWsOutInc`, `perfSnapshot`, `startPerfReporter`, `startPerfPanel`, `attachPerfWsCounters` — all consistent across Tasks A4–A9 and the optional panel.
