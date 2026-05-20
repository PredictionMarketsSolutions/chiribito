# Chiribito — Premium Perceptual Phase (Design Spec)

- **Date:** 2026-05-20
- **Status:** Approved (design), Felt-L1 ready to execute
- **Baseline HEAD:** `e0f928c` (audio/music handoff), readability/render commits below it (`40a0894` DPR, `08709bd` calm felt, `e5a64ea` clean card back, `0803d83` mipmaps) — all local, not pushed
- **Branch:** `main`

---

## 1. Framing

The gameplay/readability phase is **done**. We are no longer fixing UI — we are in a
**perceptual / material polish** phase. The dominant risk here is **overdesign**, not
missing features.

North star: the table should read as *"surprisingly premium"* — not *"wow, effects."*
We pursue sophistication **by restriction**.

Supreme rule: **cards and action are always the primary focus.** Atmosphere elevates the
experience without ever competing with gameplay.

---

## 2. Invariants — must hold on every pass

These are checked before any change is committed:

- Gameplay **clarity** preserved
- **Absolute focus** on cards / action
- **Performance** — no regressions (DPR, mipmaps, anisotropy gains stay intact)
- **Clean composition** — no visual noise
- The correct read after each pass is **more expensive / more sophisticated / more
  cinematic** — and *never* more noisy, heavier, or harder to read
- The table must **not** become too dark or "muted" to the point of reducing
  card↔felt contrast or comfort
- **Forbidden FX:** glow, bloom, neon, arcade highlights, slot-machine look, fog,
  distracting light FX

### Identity locks — NOT authorized to change in this phase
- Gold rim (`.table-surface::before`)
- Wood border (16px `--wood-mid`)
- Oval shape / `border-radius: 50% / 38%`
- The Chiribito green family — we **refine** it (deeper, less saturated), we do **not**
  replace the hue
- Card art (Fournier), card geometry/size (locked good)
- Castizo vocabulary

---

## 3. Architecture of the levers

Knowing where each lever lives keeps changes scoped and low-risk:

| Lever | Where | Notes |
|-------|-------|-------|
| Felt material + vignette | **CSS** — `.table-surface` gradient, `::before` (gold rim), `::after` (empty, reserved) | Cheap to iterate, 100% runtime-visible, zero perf cost |
| Cards / board / pot / dealer | **Pixi** — `frontend/src/game/table/TableScene.ts` sprites drawn on top | Card contact shadows / depth / AO live here |

**Critical scoping note:** the global `--felt-dark / --felt-main / --felt-light` vars are
shared with lobby, auth, and buttons. Felt changes must be **scoped to `.table-surface`**
via local custom properties so the rest of the app is untouched and attribution stays clean.

---

## 4. The ladder — ordered micro-passes

Each micro-pass moves **one perceptual variable**, then **stops for runtime validation**
before the next. Ordered by perceptual multiplier and increasing risk:

1. **Felt material** (CSS, lowest risk) ← start here
   - **1a / Felt-L1** — color only (deeper + desaturated green, more cinematic edge fall)
   - **1b / Felt-L2** — micro tonal variation + barely-there velvet texture (the empty
     `::after` layer) — *only if L1 reads clearly better*
2. **Lighting / vignette** (CSS) — very subtle vignette, edges slightly darker, ambient depth
3. **Depth / layering** (CSS + Pixi) — perceptual separation of cards / table / players /
   board / HUD via soft shadows and elevation, **not** outlines or glows
4. **Card integration** (Pixi, highest risk) — ultra-soft contact shadow + subtle ambient
   occlusion under cards/board; preserve crispness/readability/contrast

---

## 5. Runtime validation protocol (every pass)

1. `dev:stack` running for real
2. Capture **baseline** screenshots via Playwright — apples-to-apples, **desktop
   1920×1080** + **mobile Pixel 5 (390×844)**, real **multi-player** hand mid-action
3. Make the single scoped edit
4. Capture **after** screenshots — same viewport, same hand
5. Tests green — frontend Vitest (CSS-relevant); game/api Jest unaffected by pure CSS
6. **User performs the perceptual read** on both viewports
7. **DEFAULT STOP on ambiguous reaction** — do not escalate "one more level"
8. **One commit per validated stop.** No push / no deploy during this phase.

This protocol is the discipline that previously falsified the Perceptual Framing Pass
cleanly (moving multiple variables → ambiguous attribution → no destructive ship). One
variable per stop is non-negotiable.

---

## 6. Felt-L1 — first pass (detailed)

**Objetivo** — Move the felt green from "video-game bright" (`#0d5f4a`) to a refined,
deeper, less-saturated green with a more cinematic edge fall. Felt is the biggest
perceptual multiplier; this is the first and cleanest lever.

**Restricciones**
- Change is **scoped to `.table-surface`** via new local vars
  (`--felt-surface-main` / `--felt-surface-rim`). Global `--felt-*` stay **intact**.
- **Gradient geometry identical** (`ellipse 132% 112% at 50% 46%`, stops `0 / 52 / 100`).
  Only the colors change → one perceptual variable.

**Non-goals** — Do not touch: gold rim (`::before`), wood border, oval shape, box-shadow,
`::after` (reserved for L2), Pixi/cards, gradient geometry. No glow/bloom/neon.

**Riesgos**
- Green too dark → reduces card↔felt contrast / hurts clarity. *Mitigation:* conservative
  L1 + runtime read; cards remain the brightest elements regardless.
- Reads "muted" instead of "premium". *Mitigation:* desaturate without de-greening
  (preserve the Chiribito hue).

**Plan** (1 commit, fully reversible)
1. Verify `dev:stack`; capture **baseline** (desktop + mobile, real multi-player hand).
2. Edit `.table-surface`: add local vars, reference them in the gradient. Starting values
   (runtime-calibrated):
   - main: `#0d5f4a` → ~`#0e5642` (deeper, less saturated, same hue)
   - rim: `#0b4d3c` → ~`#08382b` (darker rim = cinematic edge fall)
3. Capture **after** apples-to-apples.

**Validación** — Tests green (no regression). User does the perceptual read before/after on
both viewports. Ambiguous → **DEFAULT STOP**, no L2. Clearly more premium → commit, then
decide on L2.

---

## 7. Out of scope (this phase)

- Card art, layout geometry, gameplay logic
- Infra / backend / deploy
- Push / deploy (this phase is local-only)
- Any change to the identity locks in §2
