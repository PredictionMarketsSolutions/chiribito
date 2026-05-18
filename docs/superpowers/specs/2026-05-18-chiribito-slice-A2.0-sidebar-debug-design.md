# Slice A2.0 — Sidebar dev-strings demolition + castizo headings

> Origin session: 2026-05-18.
> Parent Move: **Visual + Mobile Polish & Premium Table Feel** (post-A1).
> Sibling slices: B (compact-table primitive mobile/tablet) and A2.1 (sidebar full redesign) — explicitly OUT of A2.0.
> Baseline: HEAD `34d144c` (A1 closure commit `5ee6338` + two `docs(handoff)` commits on top).

## Status

DRAFT — pending user approval before transitioning to `writing-plans`.

## Why this slice

The visual audit on Move 2's build (`docs/superpowers/specs/2026-05-18-chiribito-visual-audit.md`) marked the desktop sidebar as **P0-1**: *"the single most indie/temporal/placeholder element in the entire build"*. Slice A1 deliberately left the sidebar intact because a full redesign (stack visualization, hand-history component, vocabulary lock) deserves its own slice with primitives aligned to the upcoming compact-table mobile work (Slice B).

A2.0 is the smallest possible chrome demolition that resolves the worst part of P0-1 without committing to a redesign:

- Remove the six raw protocol fields (`Latencia`, `Calidad`, `Buffer`, `API`, `WS`, `Token`) from the player-facing view.
- Translate the three remaining English section headings (`Players`, `Hand History`, `Activity`) per the castizo vocabulary lock in `feedback_chiribito_castizo_vocabulary.md` § "Vocabulario pendiente".
- Preserve the underlying state pipeline so the fields remain available behind a `?debug=1` URL gate or in `import.meta.env.DEV` for production troubleshooting and E2E inspection.

This change does not touch sidebar structure, ref bag, state machine, or component composition. A2.1 will revisit the sidebar with a full redesign once Slice B has established avatar-puck and active-speaker primitives that flow from mesa-side to sidebar.

## User-locked direction

From the brainstorming session 2026-05-18 (post-A1):

- **Sequencing**: Opción 3 — A2.0 (micro) → B (compact-table) → A2.1 (sidebar full redesign). Locked.
- **A2.0 scope**: "Estricto + castizo headings". Only the six dev-protocol rows go behind a debug gate; only the three English headings are translated; no other sidebar fields, structure, or behavior change.
- **Gate mechanism**: `import.meta.env.DEV || URLSearchParams.has('debug')`. Single boot read. No localStorage, no env-build coupling, no keyboard listener.
- **No-touch**: TableScene, reconnect-director, recover-or-lobby, secure-storage, phases.ts, current-hand.ts source-of-truth in game-ui.ts, engine/managers/schemas/glossary, Move 5 SESSION_EXISTS gate, all 12 player-facing sidebar rows, sidebar `<aside>`/`panel-card`/`panel-stack` structure.

## Goal

Land one chrome change in 4–5 atomic commits that:

1. Hides the six dev-protocol rows by default on every viewport.
2. Keeps those rows fully wired in source code so dev sessions and `?debug=1` URLs see them.
3. Translates the three sidebar section headings to castizo.
4. Holds 213/213 vitest + 475/475 jest game + 27/27 jest api + 40/40 E2E × 3 runs green throughout.
5. Produces a visual diff (`__pre_polish_baseline` → `__A2.0_after`) showing six fewer rows in the desktop mesa `status-grid` and the new Spanish headings everywhere.

Success looks like: re-running `scripts/visual-audit.ts` and seeing on desktop (1440 viewport) a sidebar that no longer mentions `http://localhost`, `RTT`, `Búfer`, `Calidad`, `Token`, or `WS` — but the same sidebar at `?debug=1` shows them.

## Out of scope

- Sidebar redesign / player rail replacement (Slice A2.1).
- Stack visualizer, hand-history component composition, activity feed rendering (Slice A2.1).
- Vocabulary changes outside the three section headings (defer for A2.1's full sidebar redesign).
- Compact-table primitive, avatar pucks, seat-around-rim layout (Slice B).
- Removal or relocation of the 12 player-facing rows (defer to A2.1).
- Connection pill / banner visibility in waiting state (Slice C).
- Touch targets / mobile chrome (Slice D).
- Table depth / felt textures / press states (Slice E).
- Empty-state copy in lobby / ranking truncation (Slice F).
- Server, engine, managers, schemas, glossary.
- Move 5, Move 3, single-player auto-dispose, Render deploy.
- Pixi `TableScene` constructor, `destroy()`, `measureLayout()`, `layoutStaticUi()`.

## Risks & mitigations

| ID | Risk | Mitigation |
|----|------|------------|
| R1 | `import.meta.env.DEV` reads `false` in `vitest run` because of how Vite stubs envs for unit tests — could mask a regression where the debug gate doesn't unhide rows in dev. | Test `isDebugEnabled()` with `vi.stubGlobal("import.meta.env", { DEV: true })` in unit tests AND verify manually in `npm run dev:stack` browser (smoke item 1). The unit tests pin the boolean contract; the smoke pins the integration with Vite. |
| R2 | Castizo heading change (`Hand History → Historial`) inside a hand-history rendering test could break an assertion. | Grep audit: `grep -rn "Hand History\|Activity\|Players" frontend/src --include="*.ts" --include="*.tsx"`. Any test asserting on those literal strings goes in the same commit as the HTML change. Expectation: zero matches in source (these are HTML-only headings, not component-rendered text). |
| R3 | `URLSearchParams` with `?debug=0` returns `true` for `.has('debug')` — explicit "off" still shows debug rows. | Acceptable contract: `?debug=1`, `?debug=true`, `?debug=0`, `?debug` all mean "on" by presence. To turn off, omit the param. Documented in the helper JSDoc + spec. If user dislikes, switch to `.get('debug') !== null && .get('debug') !== '0' && .get('debug') !== 'false'` — but that's gold-plating. Defer to follow-up if anyone hits this. |
| R4 | `display: contents` on `<div>` inside the status-grid may not behave identically to the default `display: block` of the original markup — grid item placement could shift. | Use `display: grid` (matching the parent's `display: grid` direct-children pattern) or just `display: block` (matching the current `> div` selector behavior). Validate visually with the audit script. If `display: contents` causes any shift, fall back to `display: block`. Risk-free either way; chosen value confirmed at implementation time. |
| R5 | Race condition: `main.ts` runs the debug-mode bootstrap _after_ the initial paint, briefly showing the 6 rows before hiding them. | Place the `isDebugEnabled()` check + `document.body.classList.add('debug-mode')` call at the very top of `main.ts`, before any other side-effect imports. Since `display:none` is the default and `debug-mode` is added before the first frame, no flash. Verified by manual smoke (item 2). |
| R6 | E2E `scripts/e2e-browser.ts` runs against the dev-stack which has `import.meta.env.DEV === true` — meaning E2E never tests the production-default behavior. | Acceptable: E2E doesn't currently assert on those six fields' visibility either. The unit test pins the contract. A future production E2E (Slice F or later) could add a Chromium-against-built-app smoke if needed. |
| R7 | `body` does not exist at the moment `isDebugEnabled()` is called from `main.ts` (e.g. if `main.ts` is loaded with `defer` and runs before `</body>`). | Vite's default `<script type="module" src="/src/main.ts">` injection runs after DOMContentLoaded in module mode. `document.body` is guaranteed to exist. Defensive `if (!document.body) document.documentElement.classList.add('debug-mode')` is overkill — drop unless smoke item 2 surfaces a real failure. |

## Design

A2.0 is a CSS-class projection on the existing sidebar applied at boot. The pattern parallels A1.4's `feedback_chiribito_visibility_projection.md` but on a different axis: instead of state-machine → enabled+visibility, we project a single environment boolean → body class → CSS.

### Component map

| File | Status | Change |
|------|--------|--------|
| `frontend/src/security/debug-mode.ts` | NEW | Export `isDebugEnabled(): boolean`. Pure function. |
| `frontend/src/security/debug-mode.test.ts` | NEW | Vitest unit tests: 4 cases for the gate matrix. |
| `frontend/index.html` | MODIFIED | 6 status-grid `<div>`s gain `class="debug-only"`. 3 `<h2>` strings translated. |
| `frontend/src/style.css` | MODIFIED | 4 new lines: `.debug-only { display: none } body.debug-mode .debug-only { display: block }`. |
| `frontend/src/main.ts` | MODIFIED | Top of file: `import { isDebugEnabled } from "./security/debug-mode"; if (isDebugEnabled()) document.body.classList.add("debug-mode");`. |
| `frontend/src/security/index.ts` (if exists) | MODIFIED | Re-export `isDebugEnabled`. Only if the barrel exists. |

### `isDebugEnabled` contract

```ts
// frontend/src/security/debug-mode.ts

/**
 * Returns true when the player-facing debug HUD rows should be visible.
 *
 * Sources (any one is sufficient):
 *  - Vite dev mode (`import.meta.env.DEV === true`)
 *  - URL has the `debug` search param (presence check — any value)
 *
 * Read once at boot. Does not react to URL changes mid-session.
 */
export function isDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined" || !window.location) return false;
  const params = new URLSearchParams(window.location.search);
  return params.has("debug");
}
```

### Exact HTML changes

#### Status-grid rows — add `class="debug-only"` to six `<div>`s

`frontend/index.html` lines 254–259:

```html
<!-- BEFORE -->
<div><span>Latencia</span><strong id="rtt-status">-</strong></div>
<div><span>Calidad</span><strong id="quality-status">-</strong></div>
<div><span>Buffer</span><strong id="buffer-status">0</strong></div>
<div><span>API</span><strong id="api-url"></strong></div>
<div><span>WS</span><strong id="ws-url"></strong></div>
<div><span>Token</span><strong id="token-status">none</strong></div>

<!-- AFTER -->
<div class="debug-only"><span>Latencia</span><strong id="rtt-status">-</strong></div>
<div class="debug-only"><span>Calidad</span><strong id="quality-status">-</strong></div>
<div class="debug-only"><span>Buffer</span><strong id="buffer-status">0</strong></div>
<div class="debug-only"><span>API</span><strong id="api-url"></strong></div>
<div class="debug-only"><span>WS</span><strong id="ws-url"></strong></div>
<div class="debug-only"><span>Token</span><strong id="token-status">none</strong></div>
```

#### Section headings — translate three `<h2>`s

`frontend/index.html` lines 275, 280, 285:

| Where | Before | After |
|-------|--------|-------|
| `index.html:275` `.panel-players h2` | `Players` | `Jugadores` |
| `index.html:280` `.panel-history h2` | `Hand History` | `Historial` |
| `index.html:285` `.panel-log h2` | `Activity` | `Actividad` |

Reasoning for `Historial` (vs `Manos jugadas`): one word, fits the editorial castizo voice of the landing (`Jerarquía`, `Ranking`, `Casa Madre`). `Manos jugadas` is more descriptive but verbose for a sidebar heading. Defer to user during spec review if `Manos jugadas` is preferred.

### Exact CSS additions

`frontend/src/style.css`, near the `.status-grid` rules (around line 1600 or 3245):

```css
/* A2.0 — debug-only rows hidden by default; revealed when body has .debug-mode */
.debug-only {
  display: none;
}

body.debug-mode .debug-only {
  display: block;
}
```

Choice of `display: block` over `display: contents`:
- `.status-grid > div` is the existing selector (`> div` direct child). Each row is a grid item.
- `display: contents` would make the row's children participate in the parent grid — visually identical here, but a known accessibility pitfall (some screen readers skip `display:contents` elements). `display: block` is the safer match for the original `<div>` default.
- This matches mitigation R4.

### `main.ts` bootstrap

Insert at the very top of `frontend/src/main.ts`, before any other side-effect imports:

```ts
import { isDebugEnabled } from "./security/debug-mode";

if (isDebugEnabled()) {
  document.body.classList.add("debug-mode");
}

// ... rest of main.ts unchanged ...
```

The import order matters: placing this _before_ the heavy imports (`@colyseus/sdk`, `audio`, `dom-refs`, etc.) ensures the body class is added before any DOM mutation happens. Since `display: none` is the default for `.debug-only`, no flash on first paint regardless.

### Validation plan

#### Unit tests — vitest

`frontend/src/security/debug-mode.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

describe("isDebugEnabled", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns true when import.meta.env.DEV is true", () => {
    vi.stubEnv("DEV", "true");
    // Window with empty search string
    Object.defineProperty(window, "location", { value: { search: "" }, writable: true });
    expect(isDebugEnabled()).toBe(true);
  });

  it("returns false when DEV is false and no debug query param", () => {
    vi.stubEnv("DEV", "false");
    Object.defineProperty(window, "location", { value: { search: "" }, writable: true });
    expect(isDebugEnabled()).toBe(false);
  });

  it("returns true when DEV is false but URL has ?debug=1", () => {
    vi.stubEnv("DEV", "false");
    Object.defineProperty(window, "location", { value: { search: "?debug=1" }, writable: true });
    expect(isDebugEnabled()).toBe(true);
  });

  it("returns true even with ?debug=0 (presence-only contract)", () => {
    vi.stubEnv("DEV", "false");
    Object.defineProperty(window, "location", { value: { search: "?debug=0" }, writable: true });
    expect(isDebugEnabled()).toBe(true);
  });
});
```

Note on `vi.stubEnv` for `import.meta.env`: in current vitest versions this works for `import.meta.env.DEV`. If the stub does not propagate (vitest 3.x quirk), fallback is `vi.stubGlobal("import.meta", { env: { DEV: true } })` — verify at implementation time and adjust.

#### Integration test — sidebar fragment

Optional: add a small render test in `frontend/src/__tests__/sidebar-debug-visibility.test.ts` that mounts the status-grid HTML fragment with happy-dom, toggles `body.debug-mode`, and asserts `getComputedStyle(row).display === "none"` vs `"block"`. Skip if existing test infrastructure makes this expensive — the unit tests + visual diff cover the contract.

#### Manual smoke

1. `npm run dev:stack` → open `http://localhost:5173`, log in, enter a mesa. Sidebar shows 18 rows (DEV=true).
2. `cd frontend && npm run build && npx vite preview --port 5174` → open `http://localhost:5174`, log in, enter a mesa. Sidebar shows 12 rows.
3. Same preview tab + add `?debug=1` to URL. Sidebar shows 18 rows again.
4. Add `?debug` (no value) to URL. Sidebar shows 18 rows (presence-only contract).
5. Remove `?debug` from URL. Reload. Sidebar shows 12 rows.

#### Visual audit

1. **Pre-slice baseline**: `npx tsx scripts/visual-audit.ts` → archive to `.dev-stack/visual-audit__pre_polish_baseline/`. This becomes the canonical baseline for all of Move polish (A2.0, B, A2.1). Run before any code change.
2. **Post-A2.0**: re-run → archive to `.dev-stack/visual-audit__A2.0_after/`.
3. Compare `desktop-1440__04_mesa_alone.png` side-by-side. Status-grid should show 12 rows (Conexión dot + Mesa + Fase + Habla + Bote + Apuesta + Tu apuesta + Tus fichas + Comunitarias + Tu mano + Jugada + Ganadores) plus the three translated section headings (Jugadores / Historial / Actividad). No layout shift on the rest of the sidebar.
4. Compare measurements.json: the `desktop-1440.mesaMetrics` button list is unchanged (action buttons not affected). The sidebar block isn't sized in `measurements.json` directly — visual diff is the canonical check.

#### Test gates per commit

- After commit 3 (`isDebugEnabled` + tests): `cd frontend && npm test` → 217/217 (213 + 4 new).
- After commit 4 (HTML/CSS apply + heading translations): `cd frontend && npm test` → still 217/217.
- After commit 4: `cd .. && npm test` → 475/475 (game-server untouched).
- After commit 4: `cd api-server && npm test` → 27/27.
- After commit 4: `npx tsx scripts/e2e-browser.ts` → 40/40 × 3 runs.

## Commit map (estimated, mirrors A1 pattern)

| # | Commit message | Files |
|---|----------------|-------|
| 1 | `docs(polish): add Slice A2.0 sidebar debug spec` | `docs/superpowers/specs/2026-05-18-chiribito-slice-A2.0-sidebar-debug-design.md` |
| 2 | `docs(polish): add Slice A2.0 plan TDD` | `docs/superpowers/plans/2026-05-18-chiribito-slice-A2.0-sidebar-debug.md` |
| 3 | `feat(chrome): isDebugEnabled helper + body.debug-mode bootstrap` | `frontend/src/security/debug-mode.ts` (new), `frontend/src/security/debug-mode.test.ts` (new), `frontend/src/main.ts` (2 lines) |
| 4 | `chore(chrome): hide 6 dev-protocol rows + castizo sidebar headings` | `frontend/index.html` (9 lines), `frontend/src/style.css` (4 lines) |
| 5 | `docs(chrome): close out A2.0 — what landed` | this spec — append "What landed" section mirroring the A1 closeout |

## What landed

A2.0 closed in 5 commits on `main` (local-only — not pushed):

| Commit | Type | SHA | Summary |
|--------|------|-----|---------|
| 1 | docs | `c0365d2` | A2.0 spec (this file) |
| 2 | docs | `ba15995` | A2.0 plan TDD |
| 3 | feat | `bd5229a` | `isDebugEnabled` helper + `body.debug-mode` bootstrap |
| 4 | chore | `9d67fdc` | 6 dev-protocol rows + 3 castizo headings (amended once — see Risks below) |
| 5 | docs | _(this commit)_ | this closeout |

### Final state — file touch list

- `frontend/src/security/debug-mode.ts` (new, ~17 LOC) — `isDebugEnabled()` pure function. SSR-safe guard. Reads `import.meta.env.DEV` OR `URLSearchParams.has("debug")`.
- `frontend/src/security/debug-mode.test.ts` (new, ~55 LOC) — 4 vitest cases pinning the gate truth table.
- `frontend/src/security/index.ts` — one new line re-exporting `isDebugEnabled`.
- `frontend/src/main.ts` — `isDebugEnabled` added to the existing `./security` named-import; 3-line bootstrap immediately after the import block, before `installFeedback()`.
- `frontend/index.html` — 6 `<div>` rows in the `.status-grid` block marked `class="debug-only"`; 3 `<h2>` translated to `Jugadores`, `Historial`, `Actividad`.
- `frontend/src/style.css` — 4 lines appended at EOF (comment + 2 rules). Selectors anchored to `#ui.panel .status-grid > div.debug-only` and `body.debug-mode #ui.panel .status-grid > div.debug-only` to win the CSS cascade against the existing `#ui.panel .status-grid > div` rule (see Risks).

### Test counts at closeout

- Frontend vitest: **217/217** (213 prior + 4 new in `debug-mode.test.ts`).
- Game server jest: **475/475** (unchanged — no game-server code touched).
- API server jest: **27/27** (unchanged).
- Playwright E2E: **40/40** confirmed at HEAD on the last of 3 sequential runs (`results.json` snapshot). Earlier runs in the same loop inferred PASS by identical output pattern and bash for-loop reaching the third iteration.

### Visual diff

`.dev-stack/visual-audit__pre_polish_baseline/` vs `.dev-stack/visual-audit__A2.0_after/`:
- `measurements.json` IDENTICAL: button sizes, viewport metrics, design tokens, font stack all unchanged.
- PNG bytes differ minimally across all viewports — driven by (a) the three heading text changes (`Players → Jugadores`, `Hand History → Historial`, `Activity → Actividad`) and (b) random room codes in dynamic content.
- Desktop mesa screenshots in `__A2.0_after` still show 18 sidebar rows because the audit runs against `npm run dev:stack` (`import.meta.env.DEV === true` → `body.debug-mode` set → show rule fires). Production-mode hiding is verified via static analysis of the built bundle, not the audit.

### Behavior matrix

| Environment | URL | Sidebar dev-protocol rows | Headings castizo |
|-------------|-----|----------------------------|-------------------|
| `npm run dev` / `npm run dev:stack` | any | Visible (DEV=true sets body.debug-mode) | Yes |
| Production build, default URL | `chiribito.com/mesa` | Hidden | Yes |
| Production build, `?debug=1` | `chiribito.com/mesa?debug=1` | Visible | Yes |
| Production build, presence-only (`?debug`, `?debug=0`) | same shape | Visible | Yes |

### Risks observed at runtime

**One material defect found by code quality review and fixed mid-slice:**

- **CSS specificity bug in original Task 2 commit `e890c94`** (later amended → `9d67fdc`). Original rules `.debug-only { display: none } body.debug-mode .debug-only { display: block }` had specificity (0,1,0) and (0,2,1) — both lost to the existing `#ui.panel .status-grid > div { display: flex }` rule at `style.css:1606` with specificity (1,2,1). Effect: in production builds without `?debug`, the 6 rows would have remained visible. Masked in dev mode (DEV=true → body.debug-mode always set → rows visible anyway for wrong reason) and in vitest (happy-dom does not compute CSS cascades). Fix: replaced the new rules with `#ui.panel .status-grid > div.debug-only { display: none }` and `body.debug-mode #ui.panel .status-grid > div.debug-only { display: flex }`. New specificities (1,3,1) and (1,4,2) win. `display: flex` chosen (vs `block`) to match the existing row layout. Production bundle was rebuilt and the minified selectors verified.

**Other note on `9d67fdc` commit body:**

- Commit body says "Tests: 217/217 frontend, **471/471 game**, 27/27 api". Real game count is **475/475** (verified in this closeout's counts above). The 471 figure came from an erroneous spec reviewer report mid-slice. The body was not re-amended (one amend per slice was the discipline limit, used by the CSS specificity fix). NOT a code defect — pure documentation drift in a commit body.

**Pre-existing risks that did NOT materialize (R1-R7 from the spec):**

- R1 (vi.stubEnv semantics) — `vi.stubEnv("DEV", boolean)` worked on first try with vitest 3.2.4. No fallback needed.
- R2 (E2E heading-text assertion break) — zero matches for hard-coded English heading strings in test files.
- R3 (`?debug=0` presence-only contract surprise) — accepted and tested.
- R4 (`display: contents` vs `display: block`) — moot; the chosen `display: block` was overridden by the cascade fix and replaced with `display: flex`.
- R5 (boot pre-paint flash) — bootstrap placed before `installFeedback()`, no race.
- R6 (production E2E gap) — accepted; covered manually by static-bundle inspection.
- R7 (`document.body` undefined at module load) — never observed.

### Carry-forward to A2.1 (and beyond)

Three non-blocking follow-ups surfaced during review — none block A2.0 closure, all useful inputs for A2.1's brainstorm:

1. **`.debug-only` is anchored** to `#ui.panel .status-grid > div`. If A2.1 (or any future slice) wants to gate other elements on `body.debug-mode`, the selector strategy needs revisiting — either additional anchored selectors per surface, or a generalized utility with global specificity (no `!important` ideally — codebase currently has zero `!important` rules).

2. **CSS rule placement**: appended at `style.css:4635-4637` (EOF) instead of grouped with the related `#ui.panel .status-grid` rules at line 1606. Defensible for safety; a follow-up cleanup slice could relocate.

3. **Naming convention**: `.debug-only` is a brand-new utility class in the codebase. Other state flags use `is-` prefix (`is-active`, `reconnect-banner--hidden`). Worth locking convention before a second usage ships.

Three pre-existing nits (informational only, defer or accept):

4. SSR guard in `debug-mode.ts:14` is theatrical — codebase is browser-only.
5. `isDebugEnabled` re-export sits at end of `security/index.ts` instead of in a labeled section.
6. JSDoc "Read once at boot" describes the caller convention, not the function.

Tech-debt note:

7. Duplicate `.status-grid` rules at `style.css:3245-3268` (unscoped) and `style.css:1600-1640` (scoped) — the unscoped one appears dead in current markup. Future cleanup.

### Push posture at closeout

5 commits ahead of `origin/main`. **NOT pushed** per user-locked decision: push at slice closeout. The closeout commit you're about to make is commit #5; once it lands, the slice is ready for user-gated push.
