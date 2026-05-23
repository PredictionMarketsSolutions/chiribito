# Chiribito — Card Deal Materiality (L1) — Design Spec

> **Date:** 2026-05-23
> **Milestone:** Premium Table / Physicality Pass (perceptual)
> **Lever:** Card materiality — **L1 = DEAL ONLY**
> **Branch:** `style/card-deal-materiality` (isolated, no merge/deploy without operator OK)
> **Status:** approved (design B), ready for implementation plan

---

## Perceptual goal

Make a dealt card feel like **"someone places the card"** — weight, friction, a human settle —
**NOT** a "videogame animation". The table stays sober, castizo, quiet, material.

Prioritize: **weight · friction · human settle · silence · materiality.**
Preserve: **reading clarity · castizo identity · sober table · elegant rhythm.**

Hard "no": no arcade overshoot, no bounce, nothing flashy, no casino glitz.

## Scope

| In L1 (this spec) | Deferred to L2 (gated on L1 feeling right) |
|---|---|
| Deal of hole cards: weighted ease + deterministic micro-rotation ("placed by hand") | Reveal-con-alma (replace the flat all-in alpha fade with a subtle flip) |
| Deal of board cards: weighted ease **only** (rotation stays 0°) | Highlights MUY sutiles (faint card sheen / materiality) |
|  | Optional shadow "press" on landing |
|  | Optional board micro-rotation whisper |

## Current state (ground truth — `frontend/src/game/table/TableScene.ts`)

- **Hole deal** (`syncFromState`, `isNew` branch, ~L555–560): card starts at `deckPos`,
  `alpha=1`/`visible=true` immediately, then `gsap.to(spr, { x, y, duration: 0.45,
  ease: "power2.out", delay: c * 0.08 })`. **Position only.** No rotation, no settle, no weight.
  Card lands perfectly axis-aligned (robotic).
- **Board deal** (`setBoardCards`, `animateNew && !had` branch, ~L595–600): same pattern,
  `duration: 0.5, ease: "power2.out", delay: i * 0.06`.
- **Snap path** (else branches): position set directly, `visible=true`, `alpha=1`, no rotation.
  Used for re-sync / reconnect / showdown back→face transition.
- **Contact shadows** (shipped + validated): `mirrorShadow` mirrors each card's
  `rotation`, `width`, `height`, position every ticker frame. **Adding rotation to a card makes
  its shadow tilt automatically — no shadow code changes needed.**
- Card sizes set via `applyCardSizes` (`.width/.height`, not `.scale`); `FRONT_HOLE_SCALE = 1.22`
  on the local seat.

## Approach (B — approved)

Weighted ease (peso) + a tiny **deterministic per-card resting rotation** on hole cards
(imperfection = "placed by a human hand" = the Chiribito "imperfection that creates life"
identity pillar). The settle reads from the deceleration tail of the heavier ease plus the card
coming to rest at its slight angle. Board cards get the weight (ease) but stay at 0° to protect
the focal row's reading clarity.

Rejected: A (ease only — weight without imperfection, "placed by hand" only half-lands);
C (full physical deal with positional overshoot + scale settle + shadow press — overshoot/scale
risk bounce/arcade and touch the validated shadow subsystem; the extras belong in L2).

## Changes — `frontend/src/game/table/TableScene.ts` ONLY

### 1. Tunable constants (new block near `SHADOW_*`)
- `DEAL_EASE` — one notch heavier than `power2.out` (start: `"power3.out"`). Single source for both
  hole and board deal eases so weight is consistent.
- `HOLE_REST_ROT_MAX` — max resting rotation magnitude for hole cards, in **radians**
  (start: ~`1.5 * Math.PI / 180` ≈ `0.0262`).
- `HOLE_DEAL_PRE_ROT` — extra rotation the card starts with during the deal so it visibly
  "turns into place" (start: a small multiple of the resting angle; keep tiny).
- Durations: keep current (`0.45` hole / `0.5` board) for L1; expose as constants if not already,
  so they are tunable at the gate.

### 2. Pure helper: `restingRotationFor(visualSlot, cardIndex): number`
- Deterministic small angle in **radians**, bounded by `HOLE_REST_ROT_MAX`.
- Same `(visualSlot, cardIndex)` → same angle, every call (stable across renders + reconnect).
- The two hole cards of a seat lean slightly differently (e.g., card 0 vs card 1 opposite sign or
  different offset) so a pair doesn't look mirror-perfect.
- Pure function of its inputs only — no `Math.random()` at call time, no state. (Derive from a
  fixed per-(slot,card) offset table or a deterministic hash of the indices.)

### 3. Hole deal path (`isNew` branch)
- Set start rotation to `restingRotationFor(v,c) ± HOLE_DEAL_PRE_ROT` before the tween.
- Tween adds `rotation: restingRotationFor(v,c)` and uses `DEAL_EASE`.
- Position behavior unchanged (from `deckPos` to `pos`, same stagger).

### 4. Hole snap path (else branch) + back/reveal reuse
- Set `spr.rotation = restingRotationFor(v,c)` directly (no tween) so re-sync / reconnect /
  showdown transitions land at the SAME resting angle — **no jump to 0°, no jitter.**

### 5. Board deal (`setBoardCards`)
- `animateNew && !had` branch: swap ease to `DEAL_EASE`. **No rotation** (board stays 0° in L1).
- Snap branch unchanged (board rotation is 0, nothing to preserve).

### 6. Rotation lifecycle — clear to 0
- `hideHoleSlot`: set `spr.rotation = 0` for both cards (alongside the existing visible/alpha reset).
- `reset()`: set `rotation = 0` on all collected sprites.
- "No card" branch in `syncFromState` (`!hasCard`): set `spr.rotation = 0`.
- This prevents a reused sprite from leaking a previous round's angle.

## Determinism + lifecycle (the one subtle part)

The resting angle is a **pure function of `(visualSlot, cardIndex)`** → stable across renders and
reconnects. It is **set on every shown path** (deal tween target + snap) and **cleared to 0 on
every hidden/reset path**. This avoids the three failure modes:
1. **Jitter** — never re-randomize per frame / per render.
2. **Leak** — a sprite reused for a new seat/card must not keep the old angle.
3. **Reconnect jump** — the snap path must reproduce the resting angle, not reset to 0.

## What is NOT touched (guardrails)

Card **size** (locked-good), table geometry, felt, deck origin, pot, contact-shadow texture /
alpha / sync logic, the reveal animation, highlights, `GameEngine` / managers / schema. No new
dependencies. No stack change. No `style.css` change. Castizo vocabulary untouched.

## Testing strategy

- **Vitest (unit):** pin `restingRotationFor` — determinism (same inputs → same output across
  calls), magnitude bound (`|angle| <= HOLE_REST_ROT_MAX`), the two cards of a pair differ.
- **Lifecycle asserts:** after `reset()` / `hideHoleSlot`, the affected sprites have `rotation === 0`.
  (Operate on the sprite objects directly; no raf needed.)
- The **ease / weight / settle is motion** — happy-dom has no real raf, so it is **not** unit-tested.
  Validated visually. Project lesson stands: **tests green ≠ UX works.**
- Run the existing frontend suite to confirm zero regression (baseline: 274/274 Vitest at release).

## Validation — runtime probe ladder (L1, default stop)

- Start conservative: hole `±1.5°`, board `0°`, ease `power3.out`, durations unchanged.
- **Baseline vs after** via Playwright at the primary viewport (1920×1080 + sidebar open) plus a
  mobile sanity pass (Pixel 5 / 390×844). Capture apples-to-apples (same hand state).
- **Honesty:** a still screenshot shows the **resting rotation** (before: aligned; after: hand-placed
  askew) but **cannot** show the ease/weight/settle — that is motion, judged **on device by the
  operator**. Stills prove the rotation; the live device gate proves the weight/settle.
- **Ambiguous reaction → DEFAULT STOP.** Do not escalate magnitude/ease "one more notch." Falsify
  or land conservatively.
- Apply the 6 north-star principles at the gate: tactility · mesa viva · claridad · ritmo ·
  social-first · premium AAA — plus "does it preserve identity and avoid casino/arcade drift?"

## Git / deploy

- All work on `style/card-deal-materiality`. **No merge to `main`, no push, no deploy without an
  explicit operator OK** for that specific action (Chiribito manual-confirmation policy, 2026-05-23).
- Atomic semantic commits (`style(table): ...`, `test(table): ...`, `docs(...): ...`).

## Rollback

Single isolated branch; if the gate rejects the feel, discard the branch (or reset the few commits).
`main` and production are untouched throughout. Production rollback anchors from the last release
remain valid (tag `pre-rincon-release-2026-05-23`).
