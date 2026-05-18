# Slice A1 — Chrome Cleanup (Visual + Mobile Polish Move)

> Origin session: 2026-05-18.
> Parent Move: **Visual + Mobile Polish & Premium Table Feel**.
> Sibling slice: A2 (sidebar / player rail) — explicitly OUT of A1.
> Baseline: HEAD `c369e73` after audit.

## Status

DRAFT — pending user approval before transitioning to `writing-plans`.

## Why this slice

The visual audit on Move 2's build (`docs/superpowers/specs/2026-05-18-chiribito-visual-audit.md`) identified four chrome-level P0 issues that make the mesa feel "dev/debug" instead of "social poker":

1. **P0-3** Duplicate pot indicator on the felt (`Pot 0` styled badge + `Pot: 0` Pixi text).
2. **P0-4** Action panel renders all seven buttons permanently, only toggling `.disabled` — creates a "grey cemetery" of unusable controls.
3. **P0-5** Meta-pill row shows `Turno -`, `Reloj -`, `Jugada -` placeholders next to the (correct) phase indicator. Reads as broken/empty data.
4. **P2-5** English copy residuals in the action panel (`Start Game`, `Check`, `Call`, `Fold`, `All-In`, `Bet`, `Raise`, `Amount`) and one stray `"waiting"` reset value.

These four issues share three properties:

- They sit in the chrome layer (badges, pills, action panel) — touching them does not require touching the sidebar, the seat-around-rim layout, the Pixi scene, or the reconnect director.
- The state machines they need already exist (`updateActionButtons` already computes per-button `canX`; phase indicator already renders Fase 3 dots).
- They can be addressed by extending existing patterns, not introducing new abstractions.

This is the smallest slice that yields a measurable perception jump — from "tooling/debug poker app" toward "multiplayer social poker experience".

## User-locked direction

User decisions from the brainstorming session (2026-05-18):

- **Vocabulary:** castizo Chiribito *controlado* — `Pasar`, `Igualar`, `Tirar`, `Apostar`, `Subir`, `Envidarse`, `Bote`. Poker serio con alma madrileña, no meme/slang.
- **Action panel:** hide non-applicable buttons (no `disabled` clutter). Avoid aggressive layout shifts — keep mobile stability.
- **Order:** A1.1 localization → A1.2 pot dedup → A1.3 contextual meta pills → A1.4 contextual action panel.
- **Out of A1:** sidebar architecture, player rail replacement, seats, avatars, active rings, responsive structural layout, reconnect architecture, Pixi continuity.

## Goal

Land four small chrome changes that visibly reduce the dev/debug feeling on every viewport, in this order, with no regression of Move 1.5/2 functionality and no layout-shift flicker on mobile.

Success looks like: re-running `scripts/visual-audit.ts` and seeing — on every viewport — a single Bote chip, a contextual action panel that only shows applicable actions, a meta-pill row that hides empty pills, and Spanish copy throughout the action panel.

## Out of scope

- Sidebar redesign / player rail replacement (Slice A2).
- Seat composition, avatars, presence rings (Slice B).
- Compact-table primitive for mobile/tablet (Slice B).
- Connection pill / banner visibility in waiting state (Slice C).
- Table depth / tactile press / felt textures (Slice E).
- Empty-state copy in lobby / ranking truncation (Slice F).
- Server, engine, managers, schemas, glossary.
- Move 5, Move 3, single-player auto-dispose, Render deploy.

## Risks & mitigations

| ID | Risk | Mitigation |
|----|------|------------|
| R1 | Layout shift when action buttons appear/disappear (especially mobile, where the action panel is ~40 % of viewport). | `.game-actions { min-height: <one-row> }` reserves vertical space. Buttons toggle `display:none` inside the fixed-height container. Verified per viewport with the visual audit script. |
| R2 | Castizo button labels (`Envidarse` longer than `All-In`, `Igualar ($X)` longer than `Call ($X)`) overflow narrow buttons. | Buttons keep `flex: 0 0 auto` width + `flex-wrap: wrap` on the row. Verify in audit at 375 px viewport. If wrap occurs, accept it — it's better than overflow. |
| R3 | `room-ui-reset.test.ts:65` asserts the literal `"waiting"` value. Test updates are part of the slice. | Update the assertion to `"Esperando"` in the same commit. |
| R4 | Hiding the Pixi `potText` could break the Pixi scene if its update logic assumes the text is visible. | Set `potText.visible = false` only — do NOT remove the Text object, do NOT change `updatePot()`. All Pixi machinery (tweens, position, references) intact. Zero reconnect interaction. |
| R5 | Mid-reconnect, when the room re-syncs state, action buttons might flash visible→hidden as the new state arrives. | The button visibility is a pure function of `state` — re-rendering with the same logical state produces the same DOM. The only flashes are during real game-state transitions (which already cause card / phase changes — expected). Verified via the existing reconnect E2E (40/40 must stay green). |
| R6 | Hiding meta pills (`turn-chip`, `turn-timer`, `winning-hand-chip`) when empty changes their flex sibling positions, possibly causing reflows in adjacent badges. | Same `min-height` pattern on `.table-header-row--meta`. Also: each badge becomes `display:none` (not `visibility:hidden`) so the flex layout shrinks cleanly. Audited per viewport. |
| R7 | E2E `scripts/e2e-browser.ts` selectors use button IDs (`#bet`, `#call`, etc.) and would not break on localization. But if a future test relies on `:has-text("Call")`, A1.1 would break it. | Grep audit before commit: `grep -n "has-text(\"Call\\|has-text(\"Start Game\\|has-text(\"All-In" scripts/`. Confirm zero matches today, document the convention. |
| R8 | `setActionButtonsEnabled` is exported and re-used elsewhere. Changing its signature could break callers. | Approach: keep `setActionButtonsEnabled` signature exactly as-is. Add a SECOND function `setActionButtonsVisibility(refs, visible: ActionButtonsVisible)` or a new combined `setActionButtonsState(refs, state)` that internally calls both. No change to existing `updateActionButtons` callers outside `game-ui.ts`. |

## Design — per micro-slice

### A1.1 — Localization sweep

**One commit. ~10 string changes + 1 test update.**

#### Files modified

- `frontend/index.html` (lines 401–411): 7 button labels + 1 placeholder.
- `frontend/src/game/game-ui.ts` (lines 298, 313): `Call` / `Call ($X)` templates → `Igualar` / `Igualar ($X)`.
- `frontend/src/app/room-ui-reset.ts` (lines 82, 92): hardcoded `"waiting"` reset value → `"Esperando"`.
- `frontend/src/app/room-ui-reset.test.ts` (line 65): test assertion `"waiting"` → `"Esperando"`.

#### Exact string map

| Where | Before | After |
|-------|--------|-------|
| `index.html:401` `#start-game` | `Start Game` | `Empezar mano` |
| `index.html:403` `#check` | `Check` | `Pasar` |
| `index.html:404` `#call` | `Call` | `Igualar` |
| `index.html:405` `#fold` | `Fold` | `Tirar` |
| `index.html:406` `#all-in` | `All-In` | `Envidarse` |
| `index.html:409` `#bet-amount` placeholder | `Amount` | `Cantidad` |
| `index.html:410` `#bet` | `Bet` | `Apostar` |
| `index.html:411` `#raise` | `Raise` | `Subir` |
| `index.html:304` `badge-pot` label text | `Pot` | `Bote` |
| `game-ui.ts:298` callButton default | `"Call"` | `"Igualar"` |
| `game-ui.ts:313` callButton with amount | `` `Call ($${callAmount})` `` | `` `Igualar ($${callAmount})` `` |
| `room-ui-reset.ts:82` `phaseStatusEl` | `"waiting"` | `"Esperando"` |
| `room-ui-reset.ts:92` `phaseChipEl` | `"waiting"` | `"Esperando"` |
| `room-ui-reset.test.ts:65` assertion | `"waiting"` | `"Esperando"` |

#### Reasoning

E2E selectors use button IDs, not text content (verified: `grep -n "has-text" scripts/e2e-browser.ts` → 0 matches against action-button text). Localization changes never touch IDs. The 198 vitest unit tests stay green except the one `room-ui-reset.test.ts` assertion, which we update in the same commit.

The pot badge label change (`Pot` → `Bote`) was added per user decision in the brainstorming session — keeps consistency with the sidebar `Bote` row that will be redesigned in A2.

#### Validation

- `cd frontend && npm test` → 199/199 expected after the test-assertion update.
- Re-run `scripts/visual-audit.ts` desktop + mobile → screenshots show Spanish labels everywhere in the action panel.
- Manual smoke: a 2-minute play session in the dev-stack — verify no untranslated string appears in the action panel or phase reset.

#### Commit message

```
feat(chrome): castizo Chiribito copy in action panel + pot badge

Replaces English residuals with the user-locked castizo Chiribito
vocabulary: Pasar / Igualar / Tirar / Envidarse / Apostar / Subir for
the action buttons, Empezar mano for start, Cantidad for the bet input
placeholder, Bote for the table pot badge. Fixes the room-ui-reset
hardcoded "waiting" reset value to "Esperando" (the renderPhaseIndicator
overwrites it on next state update; the literal was only visible during
reset flashes).

E2E selectors use button IDs, not text — no test selector breakage
expected. Updates room-ui-reset.test.ts:65 assertion in the same commit.
```

---

### A1.2 — Pot deduplication

**One commit. One-line Pixi change + optional CSS pulse transition on the DOM badge.**

#### Files modified

- `frontend/src/game/table/TableScene.ts` (~line 111): set `this.potText.visible = false` immediately after instantiation. Keep the Text object, keep all `updatePot()` logic, keep position math.
- `frontend/src/style.css` (around `.badge-pot`): add a CSS transition + a brief scale tween for visual continuity (the user constraint says NO animaciones excesivas — this is one 200 ms ease, not a casino flash).

#### Reasoning

Two pot renderers visible simultaneously is a clear bug — the audit screenshots show both the styled `Pot 0` badge AND a plain `Pot: 0` text on the felt. The badge is the brand-correct visual, the Pixi text is a duplicate.

Why hide instead of remove the Pixi text:
- Pixi scene continuity is a user-locked constraint. Removing the Text object risks subtle side effects in the position math (`this.potText.position.set(...)` is called from layout flows) and in `gsap.killTweensOf([..., this.potText.scale])` references.
- Setting `visible = false` keeps every reference valid. The Pixi text still updates internally; it just does not render.
- Reverting is one line if needed.

The CSS pulse is the user-visible compensation for the lost Pixi scale-bump animation. Subtle: 200 ms `scale(1) → scale(1.06) → scale(1)` on the badge when its `data-pot` attribute changes. Done with `transition: transform 0.2s ease-out` + a JS toggle in `game-ui.ts:189` after `refs.potChip.textContent = String(potValue)`.

#### Validation

- Visual audit re-run: screenshots show only one pot indicator on the felt. Pixi text region is empty.
- Manual: start a hand, fold once, raise once → badge pulses subtly on each pot change. Not distracting.
- E2E: 40/40 must remain green. The badge selector (`#pot-chip`) is unchanged.

#### Commit message

```
feat(chrome): single pot indicator (hide Pixi potText duplicate)

Sets TableScene.potText.visible = false so only the DOM badge-pot chip
renders on the felt. Keeps every Pixi reference and update path intact
(scene continuity is a Move 2 user-locked invariant — no scene rebuild,
no reference removal). Adds a subtle 200ms CSS scale tween to the DOM
badge on pot change to compensate for the hidden Pixi scale-bump.

Resolves audit finding P0-3.
```

---

### A1.3 — Contextual meta pills

**One commit. Pattern extension + container min-height.**

#### Files modified

- `frontend/src/game/game-ui.ts`: in the render path (around lines 195–215, after `turn-chip` updates), add hide-when-empty logic mirroring the existing `turn-reason` pattern. Same for `turn-timer` and `winning-hand-chip` parent badges.
- `frontend/src/style.css` (around `.table-header-row--meta`): add `min-height: <current-row-height>` to prevent collapse when all three sibling badges hide.
- Optionally add a `.hidden-when-empty` helper class to avoid coupling logic to the parent `<span>` chain.

#### Reasoning

The `turn-reason` element already hides cleanly when empty (`game-ui.ts:206-214`). The same pattern can apply to the three sibling badges (`badge-turn`, `badge timer`, `badge-meta` for winning hand) when their value content is `-` or empty.

In `waiting` state (no game in progress):
- `phase-chip` shows `Esperando` (no dots — already correct).
- `turn-chip` shows `-` → hide the entire `.badge-turn` parent.
- `turn-timer` shows `-` → hide the entire `.badge.timer` parent.
- `winning-hand-chip` shows `-` → hide the entire `.badge` parent.

Result: the meta row contains only the phase-chip in waiting state. Mid-game, the others appear contextually.

The `min-height` reservation prevents the row from collapsing visually (avoids R6 layout shift between waiting → in-hand). Procedure:

1. Boot dev-stack, open `1440×900` browser, inspect `.table-header-row--meta` while all four pills are visible mid-hand → read computed height (e.g. `36px`).
2. Repeat at `375×812` mobile — the row may wrap to two lines; read the multi-line height.
3. Set `min-height` to the desktop value on `.table-header-row--meta`, plus a `@media (max-width: 600px)` override using the mobile value.

This is documented as a writing-plans sub-step, not left as a magic number in the spec.

#### Validation

- Visual audit re-run: in `04_mesa_alone` only the phase chip appears in the meta row (no more `Turno -` / `Reloj -` / `Jugada -` placeholders). In `06_mesa_full` (if mid-game) all four pills show with real values.
- Manual: start a hand → pills appear with values. Hand ends → pills hide. No height jump in the table-header.
- Vitest: existing phase-indicator tests stay green (Fase 3 untouched). No `game-ui.test.ts` exists today (verified) — writing-plans will create one if it decides the hide-when-empty logic warrants a focused unit test, or fold the assertion into an existing test file (e.g., `phase-indicator.test.ts`).

#### Commit message

```
feat(chrome): hide meta pills when empty (turn / reloj / jugada)

Extends the turn-reason hide-when-empty pattern to badge-turn,
badge.timer and the winning-hand badge. In the waiting state the meta
row now shows only the phase chip (Fase 3 dots + label). Mid-game the
contextual pills appear with real values.

Reserves .table-header-row--meta min-height to prevent layout collapse
between waiting and in-hand transitions. No state-machine changes;
visibility derived from existing values that game-ui already writes.

Resolves audit finding P0-5.
```

---

### A1.4 — Contextual action panel

**One commit. Biggest of the four, but still contained.**

#### Files modified

- `frontend/src/game/game-ui.ts`:
  - Extend `ActionButtonsEnabled` → either rename to `ActionButtonsState` with added `visible*` flags, OR keep enabled flags + add a parallel `ActionButtonsVisible` interface. The parallel interface is safer for callers.
  - Compute `visible*` from the same inputs `updateActionButtons` already uses (`state.currentTurn`, `state.currentBet`, `state.roundStarted`, `me.chips`, `currentSessionId`, `activeCount`). No new game-state derivations.
  - Add `setActionButtonsVisibility(refs, visibility)` companion to `setActionButtonsEnabled`. Toggle `hidden` class (or `display:none` via inline style).
  - Inside `updateActionButtons`, call both `setActionButtonsEnabled(...)` and `setActionButtonsVisibility(...)`.
- `frontend/src/style.css` (around `.game-actions`):
  - Add `min-height: <reserved>` so the row keeps its slot when fewer buttons are visible. The exact value is measured at audit time (procedure same as A1.3: read computed height at 1440×900 and 375×812, set base + media-query override).
  - Confirm `.action-group` and `.bet-group` are `flex` containers with `gap` and `flex-wrap: wrap` to handle longer castizo button labels (R2). If they are not, add the missing `flex-wrap: wrap` in the same commit — narrow scope to the action panel, do not touch unrelated layouts.

#### Visibility matrix (the actual rules)

| State | Visible buttons |
|-------|-----------------|
| `!state` OR `!ctx.currentSessionId` (uninitialised) | nothing (panel empty, min-height reserved) |
| `state` valid, `!state.roundStarted` (pre-game / between hands) | `start-game` only (everything else hidden) |
| `state.roundStarted`, **not my turn** | nothing (panel empty, min-height reserved) |
| `state.roundStarted`, my turn, `currentBet === myBet` (open street) | `check`, `bet`, `fold`, `all-in` |
| `state.roundStarted`, my turn, `currentBet > myBet` (live raise) | `call`, `raise`, `fold`, `all-in` |
| `isAllIn` (everyone all-in, showdown locked) | nothing (panel empty) |

The "nothing visible" rows are fine because the player has no decision to make — the table itself becomes the focus (cards, pot, other players). The `min-height` keeps the chrome quiet during the wait.

#### Reasoning

The state machine for "can I press this button" already exists and is correct (`updateActionButtons` lines 290–331). We're not changing game rules — we're projecting the same booleans onto a `visible` axis in addition to the existing `disabled` axis.

The decision tree is intentionally aligned with `canX` flags from the existing code:

```ts
// Pseudo:
visibility = {
  visibleStart: canStart,
  visibleCheck: canCheck,
  visibleCall:  canCall,
  visibleFold:  canFold,
  visibleAllIn: canAllIn,
  visibleBet:   canBet,
  visibleRaise: canRaise,
};
```

That's the cleanest possible mapping: a button is visible iff it can currently be pressed. No phantom-visibility, no extra heuristics, no flicker windows.

There's one nuance: between hands (between rounds), `canStart` may briefly toggle off → on if state arrives in two beats. The DOM will show the start button → hide → show. Mitigation: `setActionButtonsVisibility` is called in the same tick as `setActionButtonsEnabled` from a single `updateActionButtons` invocation per state update — so two-state-update transitions are NOT possible within one render.

#### Mobile validation specifics

The mobile audit baseline shows the action panel taking ~40 % of the viewport with all 7 buttons grey. After A1.4:

- Pre-game (audit `04_mesa_alone`): only `Empezar mano` visible. Panel shrinks to a single button + reserved min-height. Big perceptual win.
- Mid-game, not my turn: panel shows only the min-height reserved space (visually quiet). Cards + table become the focus.
- Mid-game, my turn: 4 buttons visible. Same height as the min-height reserved (so no jump from non-turn → my-turn).

The min-height value should match the visible-buttons row at the largest necessary state (4 buttons in a row at mobile width = need flex-wrap). We measure this in the audit re-run.

#### Validation

- Visual audit re-run on all three viewports: expect dramatically fewer visible buttons in `04_mesa_alone`, identical screenshot in `05_mesa_2players`/`06_mesa_full` if neither user is on turn yet.
- Manual play: start a hand, verify each transition (waiting → preflop → my turn → not my turn → showdown) shows the right buttons with no jump.
- E2E: 40/40 must remain green. Step 4 (create mesa) currently does not click action buttons — verified safe. If a future step needs `#bet`, that selector still exists; only its `display` may be `none`. Playwright's `page.click('#bet')` on a hidden element fails — would need an explicit `force: true` or a precondition wait, but no current step uses these.

#### Commit message

```
feat(chrome): contextual action panel — hide buttons that do not apply

Extends updateActionButtons to project the existing canStart/canCheck/
canCall/canFold/canAllIn/canBet/canRaise flags onto a parallel visibility
axis. Adds setActionButtonsVisibility(refs, visibility) companion to the
existing setActionButtonsEnabled. Both are invoked in the same render
tick, so transitions are atomic.

Visibility = applicability:
  pre-game     -> only 'Empezar mano'
  not my turn  -> none (chrome quiet, table is the focus)
  open street  -> Pasar / Apostar / Tirar / Envidarse
  live raise   -> Igualar / Subir / Tirar / Envidarse
  all-in lock  -> none

.game-actions reserves min-height so the panel keeps its slot through
transitions, avoiding layout shift especially on mobile where the panel
takes ~40% of the viewport in the audit baseline.

Resolves audit finding P0-4.
```

---

## Acceptance criteria (whole A1)

| Gate | Target |
|------|--------|
| Vitest unit suite | 199/199 (1 assertion updated in A1.1) |
| Jest game server | 475/475 (untouched) |
| Jest api-server | 27/27 (untouched) |
| Playwright E2E | 40/40 × 3 runs |
| Visual audit re-run | screenshots show: single Bote chip, Spanish action labels, hidden meta pills in waiting, hidden non-applicable action buttons |
| Manual smoke | full mid-game cycle across 2 browsers, no layout-shift flicker on mobile |
| TS errors (`tsc --noEmit`) | ≤ 12 (no new errors) |
| Console warnings | no new warnings during a full reconnect cycle (Move 2 invariant) |

## Implementation priorities (recap from user)

1. **Production-grade reasoning** on every change — no improvisation.
2. **Commits pequeños** — one micro-slice per commit (A1.1 → A1.2 → A1.3 → A1.4).
3. **Screenshots comparativos** — capture before/after with `scripts/visual-audit.ts` per slice.
4. **Visual validation desktop + mobile** — both viewports green per slice.
5. **E2E intactos** — 40/40 × 3 runs at the close of A1.
6. **No tocar todavía** sidebar architecture, player rail, seats, avatars, active rings, responsive structural layout, reconnect architecture, Pixi continuity.

## Why this design is correct

- Reuses every existing pattern (`updateActionButtons`, `phase-indicator.ts`, `turn-reason`'s hide-when-empty, `setActionButtonsEnabled`'s shape). Zero new abstractions.
- The four micro-slices are independent: A1.2 doesn't depend on A1.1, A1.3 doesn't depend on A1.2, A1.4 doesn't depend on A1.3. Any could be reverted without cascading damage.
- Engine, server, schema, reconnect: all untouched. The full Move 2 invariant stack holds.
- Pixi continuity: the only Pixi line touched is `potText.visible = false`. No removals, no shape changes.
- Test surface: the only test update is the `room-ui-reset.test.ts:65` literal assertion. The 199 vitest + 502 jest + 40 E2E stay green.
- Honest scope: A1 names what it does (chrome cleanup) and explicitly defers A2 (sidebar / player rail), B (compact table), C (banner visibility), E (depth + tactility), F (lobby polish). No scope creep.
