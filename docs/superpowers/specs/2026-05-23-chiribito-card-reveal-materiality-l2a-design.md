# Chiribito — Card Reveal Materiality (L2a) Design Spec

> **STATUS: design approved 2026-05-23. Not yet implemented.**
> Branch `style/card-reveal-materiality` (off `main` = L1-shipped). Second step of the
> **Premium Table / Physicality Pass** milestone, after L1 (Card Deal Materiality).
> Predecessor: `docs/superpowers/specs/2026-05-23-chiribito-card-deal-materiality-design.md`.

---

## 1. Objetivo (perceptual intent)

Make a community card's **reveal** read as *"someone turns the card over"* — a real
back→face flip — instead of the current behaviour where a card slides in already face-up
(street reveal) or fades up in place (all-in reveal).

The goal is **more materiality, not more spectacle**: the turn should feel inevitable and
almost invisible — a physical fact, not an "animation". Silence and weight preserved. Zero
casino drift. Operator-validated direction (2026-05-23): *"se siente 'alguien voltea la
carta'; aumenta materialidad sin aumentar espectáculo."*

This cut is **L2a = the flip only.** The "highlights MUY sutiles" half of card materiality is
deferred to a separate follow-up cut (**L2b**) so each perceptual variable gets its own gate.

## 2. Background — current reveal behaviour (verified in code)

Community (board) cards have two reveal paths, both routed through `setBoardCards`:

- **Street-by-street reveal (normal play):** `syncFromState` → `setBoardCards(community, true)`.
  A genuinely new board card (`animateNew && !had`) **slides from the deck to its slot, already
  face-up**, using the L1 deal weight (`DEAL_EASE = power3.out`, 0.5s, `delay i*0.06`). No flip,
  no fade. Board stays at 0° rotation for focal-row reading clarity.
  (`frontend/src/game/table/TableScene.ts` ~613–619.)
- **All-in sequential reveal (`revealAllInSequential`):** when all players are all-in, the
  remaining board cards reveal stepped, each with a **flat alpha fade** in place
  (`alpha 0→1`, `duration 0.25`). No slide, no turn. **This is the "flat all-in alpha fade"**
  the roadmap targets. (`TableScene.ts` ~679–686.)
- Resync / reconnect / round-end set the board face-up **instantly** (no animation):
  `syncCommunityFromServer` and the `animateNew=false` branch.

L1 already gave the **street slide** its deal weight; L1 is shipped + live and must not change.

## 3. Decisions (locked via brainstorming 2026-05-23)

1. **Scope — unify both paths.** One shared "reveal-con-alma" flip gesture for both the
   street reveal and the all-in reveal, centralized (both already pass through `setBoardCards`).
2. **Gesture — true back→face flip.** The card appears as its clean unbranded back
   (`back-clean.svg`, available) and turns over (width shrinks toward the edge, texture swaps at
   edge-on, width grows back) to reveal the face. A 2D "card turn", not a rotation.
3. **Sequence — flip only this cut (L2a).** Highlight deferred to L2b (one variable per gate).
4. **Composition — slide-as-back → then flip.** Street path: the card travels from the deck to
   its slot **as its back**, using the **exact L1 deal weight (unchanged)**, then on landing
   performs the flip. All-in path: the **same flip**, in place (replaces the fade). The flip is
   one pure, shared, identical gesture; the street path simply prepends the L1 slide.

### Operator adjustments (2026-05-23, baked into this spec)

- **A. Duration.** Start at `FLIP_DURATION = 0.30s` (tuning range 0.30–0.32). Lean
  inevitable/almost-invisible, never "an animation". (Down from the 0.36 first sketch.)
- **B. Midpoint clamp.** Width must **not** collapse to exactly 0 — that risks a texture
  shimmer / 1px z-fight at edge-on. Clamp to a perceptual floor
  `FLIP_MIN_WIDTH_FACTOR = 0.05` (range 0.04–0.06): the card reads edge-on (very thin) but never
  zero-width. The texture swap still happens at the midpoint (progress ≥ 0.5).
- **C. No randomization in L2a.** The flip is **deterministic and identical** every reveal. Do
  NOT introduce per-reveal variation/jitter in L2a. **Gate-critical watch:** observe whether
  *multiple consecutive* reveals start to feel **robotic / too mathematical / "digital
  machine"**. If that sensation appears → **DEFAULT STOP** (do not ship; do not paper over with
  randomization mid-cut). Any variation is an explicitly out-of-scope future consideration,
  only if the gate flags robotic repetition.
- **D. Anchor validation.** Confirm explicitly that board sprites use a **centered anchor (0.5)**
  before wiring the flip — a non-centered anchor would make the width-shrink collapse to one
  edge instead of reading as a centered turn. This is a pre-implementation gate (task 0).

## 4. Restricciones (🔒 invariants preserved)

- **Card SIZE locked-good.** The flip animates *rendered width* transiently but restores to the
  exact `boardCardW`. No rescaling of the resting card.
- **L1 deal weight intact.** The street slide (`DEAL_EASE`, duration, delay) is not touched —
  the card simply travels as a back instead of a face, then flips on arrival.
- **Board stays at 0° rotation** (focal-row reading clarity). The flip is a width-scale turn,
  NOT a rotation.
- **Pixi continuity** (`visible = false`, never remove), **Colyseus reconnect**, felt / wood
  border 16px + gold rim, `max-width 980`, seats 6%/94%, Fournier `.webp`, castizo vocabulary —
  all untouched.

## 5. Non-goals

- The MUY-sutil highlight (deferred to **L2b**).
- Mobile (≤768px hides `#pixi-layer` and renders the board via DOM — a separate DOM pass).
- Engine / managers / geometry / glossary; showdown opponent-hand reveal; sound; any
  glow / sparkle / bounce / overshoot; per-reveal randomization.

## 6. Plan (architecture — mirrors the L1 pure-module pattern)

### 6.1 New pure module — `frontend/src/game/table/reveal-motion.ts`

Dependency-free (no pixi/gsap), unit-tested — like `deal-motion.ts`.

```ts
export const FLIP_DURATION = 0.30;          // s, total back→face turn (range 0.30–0.32)
export const FLIP_EASE = "power2.inOut";    // accelerate into the edge, decelerate flat
export const FLIP_MIN_WIDTH_FACTOR = 0.05;  // perceptual edge-on floor (range 0.04–0.06)

export interface FlipState { widthFactor: number; showFront: boolean; }

// Pure description of the flip at normalized progress p ∈ [0, 1] (clamped):
//   [0, 0.5):  back shown, widthFactor 1 → FLOOR
//   p ≥ 0.5 :  face shown, widthFactor FLOOR → 1
export function flipState(progress: number): FlipState;
```

`flipState` is a pure function: clamp `progress` to `[0,1]`; first half shows the back with
`widthFactor = 1 - (1 - FLOOR) * (p / 0.5)`; from the midpoint on, shows the front with
`widthFactor = FLOOR + (1 - FLOOR) * ((p - 0.5) / 0.5)`. At exactly `0.5`: `{ FLOOR, front }`.

### 6.2 `flipReveal(spr, faceUrl)` in `TableScene`

1. Capture `targetW = this.boardCardW`; assert centered anchor (task 0).
2. Set `spr.texture = back` (clean back), `spr.visible = true`, `spr.alpha = 1`.
3. Drive one GSAP tween of a normalized progress `0→1` over `FLIP_DURATION`, ease `FLIP_EASE`.
   On each update: `const { widthFactor, showFront } = flipState(p); spr.width = targetW *
   widthFactor; spr.texture = showFront ? face : back;` (`height` constant → the "turn"
   illusion). On complete: `spr.width = targetW; spr.texture = face;` (snap to a clean resting
   state).

### 6.3 Wiring (unified)

- **Street** (`setBoardCards`, `animateNew && !had` branch): set the **back** texture, slide
  deck→slot with the **unchanged L1 weight**, and on slide-complete call `flipReveal(spr, face)`.
- **All-in** (`revealAllInSequential`): replace the alpha-fade block with `flipReveal(spr, face)`
  in place (no slide). **Same flip.**

### 6.4 Lifecycle discipline (cancel-safety — REQUIREMENT)

The flip must be **fully cancel-safe**. Any teardown — `reset()`, `playRoundEndCollectThen`,
`cancelAllInReveal()`, card removal (`!has` branch), and any **non-animated** resync
(`setBoardCards(..., false)`, `syncCommunityFromServer`, reconnect) — must kill the in-flight
flip and restore the sprite to a clean state (full `boardCardW` width + correct face texture, or
hidden). **No card is ever left edge-on or half-flipped, and reconnect/resync never shows a
flip** (matching L1, which sets resting state instantly on resync). The flip fires **only** on a
genuinely new reveal (`animateNew && !had`). The plan picks the exact kill mechanism; this is the
contract.

## 7. Anti-casino subtlety ceiling

`FLIP_DURATION` ~0.30s (quick), `FLIP_EASE` smooth, **no** glow / sparkle / sound / bounce /
overshoot; the card ends flat and neutral like the others. The brief back-flash is the only
"reveal" signal. The highlight is L2b, not here.

## 8. Riesgos + mitigación

| Riesgo | Mitigación |
|---|---|
| Repetition (street reveal is the most-seen) feels robotic / "digital machine" | Very brief (0.30s), clean ease, no flourish; **gate-critical watch on consecutive reveals → DEFAULT STOP** if it appears. No mid-cut randomization. |
| Texture shimmer / z-fight at edge-on | Width floor `FLIP_MIN_WIDTH_FACTOR = 0.05` (never exactly 0). |
| Edge-on collapses to one side | Anchor-center pre-implementation gate (task 0). |
| Half-flip / edge-on leak on reconnect/reset | Cancel-safe lifecycle (§6.4); flip only on genuine new reveal. |
| L1 deal feel regressed | L1 slide untouched; we only deal a back then flip. |

## 9. Testing

- **Vitest** for `reveal-motion.ts` (~4–6 specs): `flipState(0) = {1, back}`; `flipState(0.5) =
  {FLOOR, front}`; `flipState(1) = {1, front}`; width never < FLOOR; width monotonic per half;
  `showFront` flips exactly once at 0.5; progress clamped.
- `TableScene` wiring is GSAP/Pixi → validated by runtime capture + perceptual gate (like L1),
  not unit tests.
- Confirm **no `src/` (game) or `api-server/` files changed** — frontend-only diff.

## 10. Validación (perceptual gate)

- `dev:stack` + Playwright **apples-to-apples** (desktop 1920×1080, ≥2 players for recovery
  discipline): baseline (current slide/fade) vs after (slide-as-back→flip) + a reveal video.
  Trigger **both** a street reveal and an all-in reveal.
- Operator gates **on device**: 6 north-star principles + explicit anti-casino check + the
  **consecutive-reveals robotic watch (§3.C)**. **Ambiguous reaction → DEFAULT STOP.**
- Frozen subsystems untouched; identity invariants intact.

## 11. Integration / rollback

Single isolated branch `style/card-reveal-materiality` off `main`. Merge requires explicit
operator OK (Chiribito governance, no auto-merge). Deploy is a separate manual step (no
auto-deploy). If the gate rejects it, discard the branch — `main` and production are untouched.
Release rollback anchor `pre-rincon-release-2026-05-23` still valid; L1 already live and
independent.
