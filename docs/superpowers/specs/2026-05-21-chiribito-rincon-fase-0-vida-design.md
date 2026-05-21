# Chiribito — Rincón del Jugador · Fase 0 "El Rincón cobra vida" — Design Spec

- **Date:** 2026-05-21
- **Status:** Approved 2026-05-21 — proceeding to writing-plans (audio §0.6 = Option B, locked)
- **Repo HEAD at design time:** `0f89e85`
- **Scope:** Perceptual polish of the existing Rincón del Jugador dashboard. Bring it to life (tactility, ceremony, hierarchy) without rebuilding any of its validated primitives.
- **Surfaces touched:** `frontend/src/app/rincon/*` only (new `interactions.ts`, edits to `rincon.css`, `components.ts`, `rincon-scene.ts`). One flagged exception in §0.6 (audio cue).

---

## Objective

The Rincón is conceptually strong (Carnet Vivo + Lacre + honesty matrix) but **perceptually inert**: nothing on the content moves or responds. The game breathes (GSAP dealing, traveling chips, breathing community backs, per-frame contact shadows); the Rincón is a still life. Fase 0 closes that game-feel gap so the dashboard reads as a **living object of the Chiribito universe**, not a profile page — using only the Rincón's own surface, with zero risk to the locked table/felt/gameplay.

## Constraints (locked — do not violate without explicit "go")

- 🔒 **Untouched:** `frontend/src/style.css` (main), `TableScene`, mesa, felt, gameplay feel, current atmosphere. (Per `chiribito-rincon-del-jugador` + `chiribito-readability-sprint` locks.)
- 🔒 **Conserve, do not rebuild:** Carnet Vivo concept, Lacre primitive, `identidad.ts` pure generators, honesty matrix, castizo vocabulary, the ambient (glow/vignette/grain) strategy. These are validated.
- **Reuse existing tokens.** rincon.css already redeclares the exact game palette (`--r-felt-*`, `--r-gold-*`, `--r-ivory*`, `--r-wood-*`) and `--r-ease` = the game's `ease-out-expo` `cubic-bezier(.19,1,.22,1)`. Use them; do not introduce new colors.
- **Mobile-first real.** Touch ergonomics are first-class.
- **`prefers-reduced-motion: reduce` must fully disable all new motion** (the existing `rincon.css:19` media query is the pattern; new JS motion must also gate on `matchMedia`).
- **Dependency-light.** The Rincón is pure DOM/CSS today. Fase 0 stays vanilla TS + CSS — **no GSAP import into the Rincón bundle.**
- **Honesty preserved.** All animation is presentational; final displayed values remain the real `/me` + ranking data. No fabricated numbers.

## Non-goals (explicitly out of scope for Fase 0)

- No changes to mesa/TableScene/seats (that is Fase 2, gated).
- No progression/reward mechanics, no streak/memorable-hand storage (Fase 3, gated).
- No web (`web/`) changes, no cross-surface font/color unification (Fase 4, gated).
- No new backend endpoints or schema. `/me` + `/ranking/top-winners` unchanged.
- No device-orientation (gyroscope) tilt — permission-gated and finicky; deferred.
- No router/transition rework between lobby and Rincón (that is Fase 1).

## North-star gate (each item must pass)

> *¿Más TÁCTIL, PREMIUM, SOCIAL, CLARO, VIVO, CASTIZO?* Reward = rareza/carta/alma, nunca dinero. Premium artesanal imperfecto. Mobile-first.

Every item below is annotated with the principles it serves. None introduce casino/SaaS patterns, FX cheapness, or fake data.

---

## Architecture

```
frontend/src/app/rincon/
  interactions.ts   ← NEW. Pure-ish, testable: count-up stepping + formatting,
                       reduced-motion decision, pointer→tilt math, attach/detach helpers.
  rincon.css        ← EDIT. 3D perspective + tilt rest, idle breathe, lacre shine,
                       staggered reveal, ledger hierarchy, stat grid 2×2 + puesto, 44px back.
  components.ts     ← EDIT. Stat grid restructure, sections→ledger grouping,
                       lacre shine element, count-up target data-attrs.
  rincon-scene.ts   ← EDIT. Wire interactions after render; set --reveal-i per child;
                       optional playOpenCue hook.
```

**Why a new `interactions.ts`:** keeps `components.ts` focused on structure and isolates the only logic worth unit-testing (count-up math/formatting, reduced-motion gating, tilt clamping) into pure functions. Listeners attach to the carnet **element itself** (not window/document), so they are auto-cleaned when `renderRincon` resets `container.innerHTML`.

---

## The six items

### 0.1 — Carnet táctil (pointer tilt/parallax + idle breathe)
**Serves:** TÁCTIL, VIVO, PREMIUM.

- **Resting state:** the existing static `.carnet-holder.tilt { transform: rotate(-1.4deg) }` (rincon.css:39) becomes the *rest* of an interactive object.
- **Pointer tilt (fine-pointer devices):** on `pointermove` over the carnet, map cursor offset → 3D tilt `rotateX/rotateY` clamped to **±7°**, with the hero layer (lacre + name) parallax-shifting a few px for depth. `perspective: 900px` on the holder, `transform-style: preserve-3d`. On `pointerleave`, ease back to rest using `--r-ease`.
- **Idle breathe (all devices):** a very subtle keyframe (~5s, amplitude `scale(1) → scale(1.008)` or `translateY 0 → -2px`), echoing the game's `community-back-breathe` (4s). Pauses while the pointer is actively tilting.
- **Touch:** no hover; a gentle press-tilt on `pointerdown`/`pointerup`. The breathe + reveal carry the life on mobile.
- **Reduced motion:** no tilt binding, no breathe; rest state only.

**Acceptance:** carnet visibly responds to mouse on desktop and feels "held"; idle breathe is perceptible but never distracting; mobile shows breathe + press feedback; reduced-motion = fully static at the −1.4° rest.
**Tests:** `interactions.ts` tilt math (offset → clamped degrees, center = 0) + reduced-motion gate (returns no-op). Tactile feel = manual browser verification (can't unit-test feel — see Validation).

### 0.2 — Lacre con luz (moving specular highlight)
**Serves:** PREMIUM, TÁCTIL ("artesanal imperfecto").

- Add a `.lacre__shine` child (absolutely-positioned radial highlight, `mix-blend-mode: screen`, low opacity ~0.35) on top of the wax. The wax already has static inset highlights (rincon.css:53); this adds a **movable** specular spot.
- Position driven by CSS vars `--shine-x/--shine-y` updated from the same pointer input as 0.1; **idle = slow CSS keyframe drift** so the seal looks like it catches lamp-light even at rest.
- Must not disturb the deterministic imperfection (`getImperfection` rotation/border-radius set inline on `.lacre`). The shine is a child layer; the lacre's own `transform` is never overwritten.
- Reduced motion: highlight present but static (no drift, no pointer follow).

**Acceptance:** the wax seal reads as a physical object catching warm light; identity determinism unchanged.
**Tests:** structural (shine element present + correct tone class). Visual = manual.

### 0.3 — Revelado-ceremonia (staggered entry)
**Serves:** RITMO, PREMIUM, VIVO.

- Replace the single block `rincon-in 460ms` opacity fade (rincon.css:15) with a **cascade**: top bar → carnet rises/settles (small overshoot) → lacre "stamps" (scale-in 1.12 → settle) → sections cascade with `animation-delay: calc(var(--reveal-i) * 70ms)` and a small `translateY`.
- **Flat-DOM safe:** `renderRincon` sets `style.setProperty("--reveal-i", n)` on each top-level child (do **not** use `:nth-of-type` — the DOM is flat and it counts tags, per the rincón build lessons).
- **Lacre stamp without clobbering inline transform:** animate the stamp on a **wrapper** around the lacre (or the `.carnet-hero`), never on `.lacre` itself (whose `transform` is the inline imperfection rotation).
- Reduced motion: existing media query collapses to instant appearance.

**Acceptance:** opening the Rincón feels like a small ritual (object revealed, seal stamped, page unfolds), not a flat fade; reduced-motion shows everything instantly.
**Tests:** `rincon-scene.test.ts` asserts `--reveal-i` is set incrementally on children. Timing/feel = manual.

### 0.4 — Stats que se inscriben (count-up)
**Serves:** VIVO, PREMIUM, CLARO.

- The five values (Manos, Ganadas, Victorias %, Fichas, Puesto) count up from 0 on reveal, in Cinzel.
- **Format-preserving:** count the integer; render the *final formatting* live each frame — `formatChips(current)` for Fichas (`1.2K`), `current + "%"` for Victorias, `"#" + current` for Puesto. Non-numeric placeholders (`—`, "sin clasificar aún") **do not animate**.
- Duration ~700ms, ease-out, starts when the stat section becomes visible (tie to reveal).
- Honesty: final values are the unchanged real data; count-up is purely presentational.
- Reduced motion: show final value immediately.

**Acceptance:** numbers feel inscribed into "la hoja del socio"; final values exactly match `/me` data and existing formatting; placeholders never animate.
**Tests:** `interactions.ts` count-up stepping + per-frame formatting (asserts final frame === `formatChips`/`%`/`#` output; `—` short-circuits) + reduced-motion (instant final). High-value pure-function tests.

### 0.5 — Jerarquía + composición ("de-SaaS")
**Serves:** CLARO, PREMIUM, CASTIZO; fixes mobile ergonomics.

- **The core de-SaaS move:** the four stacked `.rincon-sec` panels (flat dark cards w/ 1px gold border, rincon.css:63) currently read as a dashboard. Regroup them as a single **"ledger"/page surface** with internal hairline divisions, so the Rincón reads as **Carnet (object) + La hoja del socio (the member's page)** — one ledger, not four cards. Lean on the carnet-face material language (felt + gold hairline) instead of bordered boxes.
- **Secondary hierarchy:** carnet = hero (unchanged); identity/historia get presence; raw stats read as inscribed marks. The four sections no longer have identical visual weight.
- **Stat grid balance:** 5 tiles in 3 cols wrap 3+2 (ugly). Restructure to **2×2 core stats** (Manos/Ganadas/Victorias/Fichas) **+ Puesto as a distinct emphasized element** ("en la casa #N" / "sin clasificar aún"). Gives balance *and* makes rank special.
- **Touch target:** back button `34px → 44px` (rincon.css:33). Game enforces ≥48px (`style.css:2543`); 44px is the iOS thumb minimum and fits the top bar.
- **Desktop framing:** modest column widen (`max-width 760 → ~840px`) + let ambient glows/vignette fill the void, keeping the intimate "object" feel rather than spreading thin across 1920px.

**Acceptance:** after the carnet, the eye reads a coherent ledger with clear primary/secondary, not four equal cards; stat grid is visually balanced on mobile; back button is comfortably tappable; desktop no longer feels like a thin floating column.
**Tests:** `components.test.ts` updated for new structure (2×2 + puesto element, ledger grouping). Composition = manual at 390×844 (mobile) and 1920×1080 (desktop).

### 0.6 — Micro-audio (sello/carnet cue) — **confirmed: one additive touch outside the Rincón (`audio.ts`)**
**Serves:** TÁCTIL, PREMIUM, "sella el mundo".

- **Decoupling:** add optional `playOpenCue?: () => void` to `OpenRinconDeps`; the Rincón calls it on open, default **no-op** (tests/SSR unaffected). The Rincón stays decoupled from the audio module.
- **The cue — DECISION LOCKED 2026-05-21 (Option B):** add a single subtle "stamp/sello" procedural profile to `frontend/src/audio.ts` (one new `SoundEffect` + `simpleProfiles` entry; warm, low-level, on-theme) and wire it through `playOpenCue`. **This is the only Fase 0 edit outside `frontend/src/app/rincon/*`** — additive to the shared (non-mesa, non-`style.css`) `audio.ts`: one new profile, no existing sound altered. Option A (reuse an existing effect, zero shared edit) was considered and declined as too "UI click."
- **Music bed:** the "Mi Rincón" handler (`main.ts:1067`) does **not** call `music.setState`, so lobby music persists into the Rincón. Confirm and **leave as-is** (do not restart music).
- Audio is gesture-gated and respects `audio.setEnabled`; keep the cue one-shot and low-level.

**Acceptance:** opening the Rincón has a single, subtle, on-theme "seal" sound; lobby music continues uninterrupted; cue is absent when audio is disabled.
**Tests:** `rincon-scene.test.ts` asserts `playOpenCue` is invoked once on successful open and not on error path. Sound quality = manual audition by user (assistant cannot hear — per `chiribito-audio-direction` lesson, user auditions/tunes).

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Pointer-tilt jank on low-end mobile | Tilt is fine-pointer only; mobile gets breathe + press, not per-move 3D. |
| New motion fights `prefers-reduced-motion` | Every JS motion path gates on `matchMedia('(prefers-reduced-motion: reduce)')`; CSS gated by existing media query. |
| Lacre stamp animation overwrites inline imperfection transform | Animate a wrapper, never `.lacre` itself. |
| Count-up shows wrong final value / breaks `K`/`%`/`#`/`—` formatting | Format-preserving per-frame rendering + unit tests asserting final frame equals existing formatter output. |
| Ledger regroup drifts toward a redesign | Conserve carnet/lacre/identidad untouched; ledger is a CSS/structure regroup of existing sections only. |
| 0.6 scope-creep into shared audio | Hook defaults to no-op; Option B is a single additive profile, explicitly gated at review. |
| "Tests verdes ≠ UX funciona" | Mandatory manual browser verification (mobile + desktop) before claiming done. |

## Validation strategy

- **TDD for pure logic:** `interactions.ts` (count-up stepping/formatting, reduced-motion gate, tilt clamp) written test-first. Structural assertions in `components.test.ts` / `rincon-scene.test.ts`.
- **Keep suites green:** existing Rincón Vitest baseline (~257) + jest suites must stay green; `tsc --noEmit` in `frontend/` adds zero new errors.
- **Manual browser verification (non-negotiable):** `cd frontend && npm run dev`; verify at **390×844 (mobile-first)** and **1920×1080 (desktop)** the rich, empty, loading, and error states. Capture before/after screenshots. Tactility, ceremony timing, hierarchy, and audio judged perceptually (audio auditioned by user).
- **North-star re-gate** before merge: confirm every change reads more táctil/premium/social/claro/vivo/castizo and introduces zero SaaS/casino drift.

## Deferred to later phases (for traceability)

- **Fase 1:** continuous lobby↔Rincón transition; reframe top bar from app-header to world affordance.
- **Fase 2 (gated):** wire Lacre + mote into real `TableScene` seats — close the identity→mesa loop.
- **Fase 3 (gated):** rango-as-ceremony, earned motes, "manos memorables" capture (ghost slots → enshrined cards), evolving Lacre rewards (rareza/carta/alma).
- **Fase 4 (gated):** cross-surface unification — bring game DNA (Cinzel/Manrope/Cormorant, `#f4c430`, `#0d5f4a`) to `web/`, or build the web dashboard reusing `identidad.ts`/`types.ts` (~50% portable).
