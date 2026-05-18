# Slice A2.0 — Sidebar dev-strings demolition + castizo headings (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide six dev-protocol rows in the desktop mesa sidebar behind an `import.meta.env.DEV || ?debug` gate, and translate three English section headings to castizo, with zero regression in tests or E2E.

**Architecture:** A single `isDebugEnabled()` boolean computed once at boot toggles `body.debug-mode`. The 6 dev-protocol rows are marked `class="debug-only"` and hidden by default via CSS, revealed when `body.debug-mode` is present. Player-facing rows and state-update logic in `game-ui.ts` are not touched. Pattern parallels the visibility-projection approach validated in A1.4 but on a different axis (env boolean → body class → CSS instead of state-machine → enabled+visible).

**Tech Stack:** TypeScript, Vite, Vitest (happy-dom), vanilla DOM (no framework). Existing `frontend/src/security/*` barrel for re-export consistency.

**Reference spec:** `docs/superpowers/specs/2026-05-18-chiribito-slice-A2.0-sidebar-debug-design.md`.

---

## Task 0 — Pre-slice baselines (prep, NO commit)

**Files:**
- Read: `.dev-stack/visual-audit__pre_polish_baseline/` (created by this task)

This task captures the canonical "before A2.0" state. The visual audit baseline created here will be re-used as the `pre_polish_baseline` for Slices B and A2.1 too — it's the single canonical "after-A1, before-anything-new" snapshot for the entire Move polish.

- [ ] **Step 0.1: Confirm clean working tree at expected HEAD**

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app
git rev-parse --short HEAD
git status --short
```

Expected output:
```
c0365d2
?? _screenshots/
```

The HEAD includes the A2.0 spec commit (`c0365d2`) on top of the prior handoff commits (`34d144c`, `67b2c2a`, `5ee6338`). Only `_screenshots/` is untracked (gitignored).

If the HEAD differs or there are untracked files other than `_screenshots/`: stop and re-sync before proceeding.

- [ ] **Step 0.2: Run baseline test suites**

Three separate commands (each from its own cwd):

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app/frontend && npm test
```
Expected: `Tests  213 passed (213)`.

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app && npm test
```
Expected: `Tests:       475 passed, 475 total`.

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app/api-server && npm test
```
Expected: `Tests:       27 passed, 27 total`.

If any suite shows fewer or more, stop. The baseline must match exactly.

- [ ] **Step 0.3: Boot dev-stack and capture visual audit baseline**

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app
npm run dev:stack
```

Wait for all five ports to be listening (verify in a second shell):

```bash
netstat -ano | grep -E ":(5173|3000|2567|5432) " | head -5
```

Expected: each port has a `LISTENING` entry.

Then in another shell:

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app
npx tsx scripts/visual-audit.ts
```

Expected: 30 PNGs (10 checkpoints × 3 viewports) + `measurements.json` produced in `.dev-stack/visual-audit/`.

- [ ] **Step 0.4: Archive the audit as the canonical pre-polish baseline**

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app
mv .dev-stack/visual-audit .dev-stack/visual-audit__pre_polish_baseline
```

Verify the archive exists:

```bash
ls .dev-stack/visual-audit__pre_polish_baseline/ | wc -l
```

Expected: `31` (30 PNGs + `measurements.json`).

This baseline now lives at `.dev-stack/visual-audit__pre_polish_baseline/` and will be referenced by the post-A2.0 audit comparison (Task 3) and later by Slices B and A2.1.

---

## Task 1 — `isDebugEnabled` helper + main.ts bootstrap (commit #3)

**Files:**
- Create: `frontend/src/security/debug-mode.ts`
- Create: `frontend/src/security/debug-mode.test.ts`
- Modify: `frontend/src/security/index.ts` (re-export)
- Modify: `frontend/src/main.ts:105-113` (add to existing security import) + insert 3 lines after line 113

- [ ] **Step 1.1: Write the failing test file**

Create `frontend/src/security/debug-mode.test.ts` with this exact content:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { isDebugEnabled } from "./debug-mode";

describe("isDebugEnabled", () => {
  const originalLocation = window.location;

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("returns true when Vite DEV mode is active", () => {
    vi.stubEnv("DEV", true);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "" },
      writable: true,
      configurable: true,
    });
    expect(isDebugEnabled()).toBe(true);
  });

  it("returns false in production with no debug query param", () => {
    vi.stubEnv("DEV", false);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "" },
      writable: true,
      configurable: true,
    });
    expect(isDebugEnabled()).toBe(false);
  });

  it("returns true in production when URL has ?debug=1", () => {
    vi.stubEnv("DEV", false);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "?debug=1" },
      writable: true,
      configurable: true,
    });
    expect(isDebugEnabled()).toBe(true);
  });

  it("returns true even with ?debug=0 (presence-only contract)", () => {
    vi.stubEnv("DEV", false);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "?debug=0" },
      writable: true,
      configurable: true,
    });
    expect(isDebugEnabled()).toBe(true);
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails**

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app/frontend
npx vitest run src/security/debug-mode.test.ts
```

Expected: FAIL with module-not-found error referencing `./debug-mode`. Vitest exits non-zero.

If the test runs and passes here, the file resolution is wrong — verify the test file path before continuing.

- [ ] **Step 1.3: Write the minimal implementation**

Create `frontend/src/security/debug-mode.ts` with this exact content:

```ts
/**
 * Returns true when the player-facing debug HUD rows should be visible.
 *
 * Sources (any one is sufficient):
 *  - Vite dev mode (`import.meta.env.DEV === true`)
 *  - URL has the `debug` search param (presence check — any value)
 *
 * Read once at boot. Does not react to URL changes mid-session.
 *
 * See docs/superpowers/specs/2026-05-18-chiribito-slice-A2.0-sidebar-debug-design.md.
 */
export function isDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined" || !window.location) return false;
  const params = new URLSearchParams(window.location.search);
  return params.has("debug");
}
```

- [ ] **Step 1.4: Run test to verify all four cases pass**

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app/frontend
npx vitest run src/security/debug-mode.test.ts
```

Expected:
```
 ✓ src/security/debug-mode.test.ts (4 tests)
 Test Files  1 passed (1)
      Tests  4 passed (4)
```

If a test fails, the most likely culprit is `vi.stubEnv` semantics in the installed vitest version. Fallback fix: replace `vi.stubEnv("DEV", true)` calls with `vi.stubGlobal("import.meta", { env: { DEV: true } })` in the affected tests. Re-run.

- [ ] **Step 1.5: Re-export `isDebugEnabled` from the security barrel**

Edit `frontend/src/security/index.ts`. Find the section that lists individual exports (after the imports block, near the bottom of the file there are several `export { ... } from "./..."` lines).

Add this line as the last `export` line, before any trailing comment or default export:

```ts
export { isDebugEnabled } from "./debug-mode";
```

If you're unsure exactly where to put it, append it at the end of the file on a new line. Either placement compiles.

- [ ] **Step 1.6: Wire the bootstrap in main.ts**

Edit `frontend/src/main.ts`. The existing import block at lines 105–113 reads:

```ts
import {
  validatePassword,
  validateUsername,
  stateGuard
} from "./security";
```

Replace with:

```ts
import {
  validatePassword,
  validateUsername,
  stateGuard,
  isDebugEnabled
} from "./security";
```

Then immediately after the closing `} from "./security";` (originally line 113, now line 114), insert these three lines (above the existing `// Install audio + motion feedback observers` comment that follows):

```ts

if (isDebugEnabled()) {
  document.body.classList.add("debug-mode");
}
```

The leading blank line keeps the file readable. The bootstrap runs as a top-level side effect — exactly once on module load, before `installFeedback()` and any other DOM mutation.

- [ ] **Step 1.7: Run full frontend test suite**

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app/frontend
npm test
```

Expected: `Tests  217 passed (217)`.

(213 previous + 4 new from `debug-mode.test.ts`.)

If a previously-passing test now fails: investigate before continuing. Typical suspect: a test that imports `main.ts` would trigger the bootstrap. Currently no frontend test imports `main.ts` (main is the application entry, not a module under test) — so this should not happen. If it does, revisit the bootstrap placement.

- [ ] **Step 1.8: Run sanity tests on the other two packages**

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app && npm test
```
Expected: `Tests:       475 passed, 475 total`.

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app/api-server && npm test
```
Expected: `Tests:       27 passed, 27 total`.

(These two packages don't import frontend code; this is a defensive sanity check.)

- [ ] **Step 1.9: Commit**

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app
git add frontend/src/security/debug-mode.ts frontend/src/security/debug-mode.test.ts frontend/src/security/index.ts frontend/src/main.ts
git status --short
```

Expected `git status --short` output:
```
M frontend/src/main.ts
M frontend/src/security/index.ts
A frontend/src/security/debug-mode.ts
A frontend/src/security/debug-mode.test.ts
```

Then:

```bash
git commit -m "$(cat <<'EOF'
feat(chrome): isDebugEnabled helper + body.debug-mode bootstrap

Adds a single boot read of a debug-mode boolean. True when Vite is in
DEV mode (`import.meta.env.DEV`) OR when the URL contains the `debug`
search param (presence-only contract: ?debug, ?debug=1, ?debug=0 all
mean ON; omitting the param means OFF).

If enabled, sets `body.debug-mode` once at module load, before any
DOM mutation. Subsequent CSS (added in next commit) keys the
visibility of dev-protocol sidebar rows off this class.

No HTML/CSS changes in this commit -- helper, tests, bootstrap only.
Tests: 217/217 (213 + 4 new in debug-mode.test.ts). Game server
475/475. API server 27/27.

Spec: docs/superpowers/specs/2026-05-18-chiribito-slice-A2.0-sidebar-debug-design.md
EOF
)"
```

Expected: `1 file changed` lines for the modified files + `create mode 100644` lines for the two new files.

---

## Task 2 — HTML + CSS demolition (commit #4)

**Files:**
- Modify: `frontend/index.html:254-259` (6 class adds)
- Modify: `frontend/index.html:275, 280, 285` (3 heading translations)
- Modify: `frontend/src/style.css` (append `.debug-only` rules)

- [ ] **Step 2.1: Mark the six dev-protocol rows with `class="debug-only"`**

Edit `frontend/index.html`. Find the block starting at line ~250 (the `.status-grid` div) and modify lines 254 through 259 by adding `class="debug-only"` to each of the six `<div>` elements.

Before (lines 254–259):
```html
            <div><span>Latencia</span><strong id="rtt-status">-</strong></div>
            <div><span>Calidad</span><strong id="quality-status">-</strong></div>
            <div><span>Buffer</span><strong id="buffer-status">0</strong></div>
            <div><span>API</span><strong id="api-url"></strong></div>
            <div><span>WS</span><strong id="ws-url"></strong></div>
            <div><span>Token</span><strong id="token-status">none</strong></div>
```

After:
```html
            <div class="debug-only"><span>Latencia</span><strong id="rtt-status">-</strong></div>
            <div class="debug-only"><span>Calidad</span><strong id="quality-status">-</strong></div>
            <div class="debug-only"><span>Buffer</span><strong id="buffer-status">0</strong></div>
            <div class="debug-only"><span>API</span><strong id="api-url"></strong></div>
            <div class="debug-only"><span>WS</span><strong id="ws-url"></strong></div>
            <div class="debug-only"><span>Token</span><strong id="token-status">none</strong></div>
```

Do NOT add `class="debug-only"` to any of the other 12 status-grid rows (Conexión, Mesa, Fase, Habla, Bote, Apuesta, Tu apuesta, Tus fichas, Comunitarias, Tu mano, Jugada, Ganadores). Those stay visible by default.

- [ ] **Step 2.2: Translate three sidebar section headings**

In the same `frontend/index.html`, find lines 275, 280, 285 — the `<h2>` of three `panel-card` sections.

| Line | Before | After |
|------|--------|-------|
| `index.html:275` | `<h2>Players</h2>` | `<h2>Jugadores</h2>` |
| `index.html:280` | `<h2>Hand History</h2>` | `<h2>Historial</h2>` |
| `index.html:285` | `<h2>Activity</h2>` | `<h2>Actividad</h2>` |

Exactly three string replacements. No other content in those `<section>`s changes.

- [ ] **Step 2.3: Add the `.debug-only` CSS rules**

Edit `frontend/src/style.css`. Append these four lines at the very end of the file (or anywhere after the existing `.status-grid` rules — append-at-end is the safest, no risk of mis-placement):

```css

/* A2.0 — debug-only rows hidden by default; revealed when body has .debug-mode */
.debug-only { display: none; }
body.debug-mode .debug-only { display: block; }
```

The leading blank line keeps the file readable. The selector specificity is fine: `body.debug-mode .debug-only` (specificity 0,1,1,1) > `.debug-only` (specificity 0,0,1,0). When `body.debug-mode` is absent, the first rule applies; when present, the second wins.

- [ ] **Step 2.4: Run full frontend test suite**

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app/frontend
npm test
```

Expected: `Tests  217 passed (217)`.

If a test fails, the most likely cause is a vitest test that hard-codes the English heading text (`Players`, `Hand History`, `Activity`) as an assertion. Search the test suite:

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app/frontend
grep -rn "Players\|Hand History\|Activity" src --include="*.test.ts"
```

If matches exist that assert on those literal strings (not just casual usage like comments), update the assertions to `"Jugadores"`, `"Historial"`, `"Actividad"` in the same commit as this HTML change.

- [ ] **Step 2.5: Run sanity tests on the other two packages**

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app && npm test
```
Expected: `Tests:       475 passed, 475 total`.

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app/api-server && npm test
```
Expected: `Tests:       27 passed, 27 total`.

- [ ] **Step 2.6: Commit**

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app
git add frontend/index.html frontend/src/style.css
git status --short
```

Expected `git status --short` output:
```
M frontend/index.html
M frontend/src/style.css
```

(If any test file was also updated due to Step 2.4 grep findings, include it in the `git add`.)

Then:

```bash
git commit -m "$(cat <<'EOF'
chore(chrome): hide 6 dev-protocol rows + castizo sidebar headings

Player-facing sidebar no longer displays raw protocol stats by default.
Six status-grid rows -- Latencia, Calidad, Buffer, API, WS, Token --
get class="debug-only", hidden via CSS unless body has the .debug-mode
class added by the isDebugEnabled() bootstrap from the previous commit.

Dev sessions (`npm run dev:stack`) keep showing all 18 rows because
`import.meta.env.DEV === true` flips the gate. Production sessions
show 12 rows by default; appending `?debug=1` to the URL re-enables
the full HUD.

Three section headings translated to castizo:
  Players       -> Jugadores
  Hand History  -> Historial
  Activity      -> Actividad

Audit resolution: P0-1 worst-offending strings ("looks like dev
tools") removed from the default player view. Full sidebar redesign
(stack visualizer, hand-history component) deferred to Slice A2.1.

Tests: 217/217 frontend, 475/475 game, 27/27 api. E2E unchanged
(no E2E selector touches these specific rows or headings).

Spec: docs/superpowers/specs/2026-05-18-chiribito-slice-A2.0-sidebar-debug-design.md
EOF
)"
```

---

## Task 3 — Validation gate (NO commit)

**Files:**
- Read: `.dev-stack/visual-audit__pre_polish_baseline/` (from Task 0)
- Write: `.dev-stack/visual-audit__A2.0_after/` (created by this task)

This is a validation gate, not a code change. Halt and surface any failure before moving to closeout.

- [ ] **Step 3.1: Manual smoke — dev mode shows 18 rows**

Ensure `npm run dev:stack` is running (it should still be running from Task 0; if not, restart and wait for ports 5173/3000/2567/5432).

Open `http://localhost:5173` in a browser. Sign in (or register a new test user), then create or join a mesa.

Inspect the sidebar `panel-status` block (left panel labelled "Estado"). Count the rows: should be **18** (Conexión dot + Latencia + Calidad + Buffer + API + WS + Token + Mesa + Fase + Habla + Bote + Apuesta + Tu apuesta + Tus fichas + Comunitarias + Tu mano + Jugada + Ganadores).

Also verify the three section headings below `Estado` read: **Jugadores**, **Historial**, **Actividad** (not the English versions).

- [ ] **Step 3.2: Manual smoke — production build hides 6 rows**

In a new shell:

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app/frontend
npm run build
npx vite preview --port 5174
```

Open `http://localhost:5174` in a browser. Sign in to the same backend (the dev-stack api on port 3000 is still running). Create or join a mesa.

Inspect the sidebar. Should be **12 rows** (Conexión dot + Mesa + Fase + Habla + Bote + Apuesta + Tu apuesta + Tus fichas + Comunitarias + Tu mano + Jugada + Ganadores). The six `Latencia/Calidad/Buffer/API/WS/Token` rows must NOT be visible.

Section headings still read **Jugadores / Historial / Actividad**.

- [ ] **Step 3.3: Manual smoke — `?debug=1` reveals 6 rows in production**

Append `?debug=1` to the URL of the preview window: `http://localhost:5174/?debug=1`. Reload.

Sign in again (the query param is preserved on the URL). Enter a mesa. Sidebar now shows **18 rows** again.

Try `?debug` (no value) and `?debug=0` — both should also show 18 rows (presence-only contract per spec R3).

Remove the query param (`http://localhost:5174/` clean), reload, sign in: **12 rows** again.

- [ ] **Step 3.4: Capture the post-A2.0 visual audit**

Stop the preview server (Ctrl+C in its shell). Keep `npm run dev:stack` running.

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app
npx tsx scripts/visual-audit.ts
```

Expected: a fresh `.dev-stack/visual-audit/` directory with 30 PNGs + `measurements.json`.

Archive it:

```bash
mv .dev-stack/visual-audit .dev-stack/visual-audit__A2.0_after
```

- [ ] **Step 3.5: Compare baselines visually**

Open these two files side by side in an image viewer or browser:

- `.dev-stack/visual-audit__pre_polish_baseline/desktop-1440__04_mesa_alone.png`
- `.dev-stack/visual-audit__A2.0_after/desktop-1440__04_mesa_alone.png`

The `__A2.0_after` version should show:
- Sidebar `Estado` block with 12 rows instead of 18 (the six dev-protocol rows are gone).
- Section headings read `Jugadores`, `Historial`, `Actividad`.
- Everything else identical: oval, seats, action panel, badges, pot chip.

Note: the visual audit runs against `npm run dev:stack` (DEV=true), so the audit itself shows all 18 rows. To get a production-mode screenshot, use the manual smoke from Step 3.2 (preview server) and take a screenshot manually if needed for the closeout doc.

If anything besides the targeted six rows + three headings differs, stop and investigate before continuing.

- [ ] **Step 3.6: Run E2E browser suite 3 times**

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app
for i in 1 2 3; do
  echo "=== E2E run $i ==="
  npx tsx scripts/e2e-browser.ts || break
done
```

Expected: each run prints `40/40 steps PASS` and exits 0. All three runs must pass.

If any run fails: stop. Most likely cause is a flake; re-run the failed run individually:
```bash
npx tsx scripts/e2e-browser.ts
```
If consistently failing, investigate before continuing.

---

## Task 4 — Closeout (commit #5)

**Files:**
- Modify: `docs/superpowers/specs/2026-05-18-chiribito-slice-A2.0-sidebar-debug-design.md` (append "What landed")

- [ ] **Step 4.1: Append "What landed" section to the spec**

Edit `docs/superpowers/specs/2026-05-18-chiribito-slice-A2.0-sidebar-debug-design.md`.

Find the section near the end of the file titled `## What landed`. It currently reads:

```markdown
## What landed

_To be filled in at slice closeout (commit 5)._
```

Replace the placeholder with the actual closeout content. Use this template (fill in `<commit-shas>` with the actual short SHAs from `git log --oneline -5`):

```markdown
## What landed

A2.0 closed in 5 commits on `main`:

| Commit | Type | Summary |
|--------|------|---------|
| `<commit-1-sha>` | docs | A2.0 spec (this file) |
| `<commit-2-sha>` | docs | A2.0 plan TDD |
| `<commit-3-sha>` | feat | `isDebugEnabled` helper + `body.debug-mode` bootstrap |
| `<commit-4-sha>` | chore | 6 dev-protocol rows + 3 castizo headings |
| `<commit-5-sha>` | docs | this closeout |

### Final state

- `frontend/src/security/debug-mode.ts` — pure function, 12 LOC.
- `frontend/src/security/debug-mode.test.ts` — 4 vitests pinning the gate contract.
- `frontend/src/security/index.ts` — re-export added.
- `frontend/src/main.ts` — import extended (1 line) + 3-line bootstrap after the security import block.
- `frontend/index.html` — 6 `<div>` rows marked `class="debug-only"`; 3 `<h2>` translated.
- `frontend/src/style.css` — 4 lines appended (`.debug-only` rule + `body.debug-mode` override).

### Test counts at closeout

- Frontend vitest: **217/217** (213 prior + 4 new).
- Game server jest: **475/475** (unchanged).
- API server jest: **27/27** (unchanged).
- Playwright E2E: **40/40 × 3 runs** (unchanged).

### Visual diff

`.dev-stack/visual-audit__pre_polish_baseline/` vs `.dev-stack/visual-audit__A2.0_after/`:
- Desktop 1440 mesa screenshots: sidebar `Estado` block shows 12 rows instead of 18.
- Section headings everywhere read `Jugadores`, `Historial`, `Actividad`.
- No layout shift on any other element (badges, action panel, seats, pot chip, phase indicator, table-header-row meta pills).

### Behavior summary

| Environment | URL | Debug rows visible? |
|-------------|-----|--------------------|
| `npm run dev` / `npm run dev:stack` | any | Yes (`import.meta.env.DEV` is true) |
| Production build, default URL | `chiribito.com/mesa` | No |
| Production build, debug URL | `chiribito.com/mesa?debug=1` | Yes |
| Production build, presence-only param | `chiribito.com/mesa?debug` / `?debug=0` | Yes |

Headings castizo on all environments unconditionally.

### Risks observed at runtime

(Fill in any actual issues encountered during implementation. If none: "None — design matched implementation exactly. R1-R7 from the spec did not materialize.")

### Carry-forward to A2.1

- The dev-stats are not deleted, only hidden. A2.1 may keep them, relocate them under a settings drawer, or surface them via a debug overlay — design decision deferred to A2.1's spec.
- Section headings now match castizo. A2.1 redesign should not re-introduce English chrome.
- `isDebugEnabled` is reusable for any future "show this only in dev/debug" affordance.
```

After completing all bullets in "Final state" and "Behavior summary", replace the parenthetical guidance in "Risks observed at runtime" with the actual observations.

- [ ] **Step 4.2: Commit the closeout**

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app
git add docs/superpowers/specs/2026-05-18-chiribito-slice-A2.0-sidebar-debug-design.md
git commit -m "$(cat <<'EOF'
docs(chrome): close out Slice A2.0 — what landed

Replaces the "What landed" placeholder in the A2.0 spec with the
final state of the slice: commit map, file touch list, test counts,
visual diff between __pre_polish_baseline and __A2.0_after, behavior
matrix across environments, and carry-forward notes for A2.1.

A2.0 = 5 atomic commits on main. Tests 217/217 frontend, 475/475
game, 27/27 api, 40/40 E2E x 3 runs. Move 1.5 / Move 2 / A1 paths
all intact.

Next slice candidate: B (compact-table primitive mobile/tablet) per
the Move polish sequencing locked in the brainstorming session.
A2.0 -> B -> A2.1.
EOF
)"
```

- [ ] **Step 4.3: Final sanity check**

```bash
cd /c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app
git log --oneline -7
git status --short
```

Expected `git log --oneline -7`:
```
<sha-5> docs(chrome): close out Slice A2.0 — what landed
<sha-4> chore(chrome): hide 6 dev-protocol rows + castizo sidebar headings
<sha-3> feat(chrome): isDebugEnabled helper + body.debug-mode bootstrap
<sha-2> docs(polish): add Slice A2.0 plan TDD
<sha-1> docs(polish): add Slice A2.0 sidebar debug spec
34d144c docs(handoff): clarify HEAD vs A1 closure commit in handoff
67b2c2a docs(handoff): add A1 production-grade handoff for next session
```

Expected `git status --short`:
```
?? _screenshots/
```

(Plus `.dev-stack/` if not already shown, both gitignored.)

If the log doesn't show 5 commits between HEAD and `34d144c`, or there are untracked files beyond the gitignored ones, investigate.

---

## Acceptance criteria (slice complete when all true)

- `git log --oneline -5` shows exactly 5 commits since `34d144c`.
- Working tree clean except gitignored paths.
- Frontend vitest: 217/217.
- Game server jest: 475/475.
- API server jest: 27/27.
- Playwright E2E: 40/40 × 3 runs.
- Visual diff matches expectations (12 rows + castizo headings).
- Manual smoke 4 cases pass (dev shows 18; preview shows 12; preview + `?debug=1` shows 18; preview + clean URL shows 12).
- `__pre_polish_baseline/` and `__A2.0_after/` archived in `.dev-stack/`.

If any criterion fails: stop, do NOT push, surface the failure to the user.

---

## Post-slice user actions (NOT part of this plan)

When the slice is locally complete:

1. User reviews the local commits with `git log --oneline -7`.
2. User decides whether to push (`git push`).
3. User decides next slice (B or otherwise) and opens a new brainstorming session.

This plan does not push, does not deploy, does not modify any memory file. Those are user-gated steps.
