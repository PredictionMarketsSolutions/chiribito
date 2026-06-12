# Phase 9: TP8 — Tactilidad, Micro-vida & Lectura Social (the FEEL) - Research

**Researched:** 2026-06-12
**Domain:** React Three Fiber `useFrame` micro-animation + dual freeze gates + social-read completion
**Confidence:** HIGH (all findings verified from installed node_modules + codebase source)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. Micro-motion on HERO OBJECTS ONLY (hole cards + top chip): amplitude < 0.01wu / < 0.5°, settle 0.2–0.4s, idle 6–12s near-zero — via `useFrame` + existing `gsap` OR `maath/easing` if cleaner; add `maath` ONLY if genuinely needed.
2. Freeze gates (HARD): motion is zero under `prefers-reduced-motion` AND under capture/`spin=off` flag → M9 byte-identical captures.
3. Static code assertion: a grep-check that easing amplitude/rotation/timing constants are ≤ documented thresholds (since frozen captures cannot measure live motion).
4. Social read: complete via CENTER table-state only (TP6 deck stub + button + the staged mid-hand already present + the demoted pot). NO humans; `?seats` opt-in/never default. M2 ≥ 2× holds.
5. Restrained-only: no flip/spin/glow/bouncy easing — a no-FX code assertion. Stillness beats motion.
6. Operator gate (last plan, autonomous:false) is a LIVE view: does it feel alive + weighty + read as a shared mid-play game, with NO motion consciously noticeable? Orchestrator auto-approves code-assertion + M9 + social-read; live motion-feel FLAGGED for operator batch review.

### Claude's Discretion
- The exact easing mechanism (gsap vs maath; the breathing curve), the precise constants (within sub-threshold bounds — err on LESS motion), which hero objects breathe (hole cards + top chip), the social-read completion (center-only — is TP6 state sufficient or a tiny staged addition), and whether `maath` is added.

### Deferred Ideas (OUT OF SCOPE)
- Modeled humans / per-seat figures (forbidden; `?seats` opt-in only).
- Final AAA unification + scorecard sign-off + new protected-reference lock → TP9.
- New materials / lighting / cameras (done in prior phases).
</user_constraints>

---

## Summary

TP8 adds restrained sub-threshold micro-life to the two hero objects (the Perla hole cards, the top chip of the demoted pot) and confirms the social read is already complete from TP6. The motion must be imperceptible as motion — experienced only as weight and life — and must freeze deterministically under two independent gates: the `prefers-reduced-motion` media query and the harness `qp("spin") === "off"` capture flag. Because the frozen captures cannot measure live motion, the amplitude bounds are enforced by a static grep-check on named constants.

The existing stack (R3F `useFrame`, gsap 3.14.2, three 0.169) is fully sufficient. `maath` is absent from node_modules and is NOT needed — gsap's `gsap.utils.interpolate` and simple `Math.sin`/exponential-decay arithmetic cover the breathing-stillness and settle curves without a new dependency. The TP3 dealt-variance precedent (seeds frozen at construction via integer-constant Math.sin primes) is the exact model for making the micro-motion deterministic.

The social read (the shared mid-play scene) is already complete as-of TP6: the staged Perla hand (5-card board + hole pair), the demoted accent pot, and the CenterGameState (deck stub + dealer button) are unconditionally mounted. No new center objects are warranted — adding one risks table-state creep (CONTEXT §deferred). The gate question is whether the assembled scene reads as a warm shared mid-play game, not whether new props fill it.

**Primary recommendation:** implement micro-motion as a `useFrame` breathing loop in a new component `HeroMotion` (isolates the per-frame logic; does not touch geometry or materials), using a simple phase-based sine-on-idle + exponential-decay-settle curve driven entirely by pure arithmetic. Mount it unconditionally behind the dual freeze guard. Expose four named constants for the grep-check assertion. No `maath` install needed.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Micro-motion (breathing/settle) | Frontend — R3F Scene (`useFrame`) | — | Object-level animation; per-frame position/rotation mutation on hero refs |
| Dual freeze gate | Frontend — R3F Scene (`useFrame`) | — | Both freeze conditions (`isFrozen` + `reducedMotion`) read at mount, guard the useFrame body |
| Static code assertion | tools/table-3d/ (grep-check CJS) | — | Checks named constants in TableLab.tsx source at rest, no runtime |
| Social-read completeness | Frontend — R3F Scene (scene graph) | — | CenterGameState + hole cards + community + demoted pot already mounted unconditionally |
| M9 determinism | Frontend (`spin=off` guard) + harness | grep-check assertion | Harness appends `spin=off`; the freeze guard is the code seam |
| M2 (cards-vs-chips ratio) | Frontend — scene geometry (unchanged) | metrics.mjs pixel check | No new geometry added; M2 was 3.66× at TP7 → safely above 2× floor |

---

## Standard Stack

### Core (already installed, no new packages)
| Library | Installed Version | Purpose | Why Standard |
|---------|------------------|---------|--------------|
| `@react-three/fiber` | 8.17.10 | `useFrame` per-frame loop | The canonical R3F animation hook; already imported in TableLab.tsx |
| `gsap` | 3.14.2 (installed) | Easing utilities if needed | Already used for card/chip animations in the lab; no new dep |
| `three` | 0.169.0 | Object3D mutation (`position`, `rotation`) | Scene objects already typed Three.js |

[VERIFIED: node_modules] — versions confirmed from installed `package.json` files.

### Not Needed
| Package | Reason Not Added |
|---------|-----------------|
| `maath` | Absent from node_modules. Its `easing.damp` is a convenience wrapper around exponential decay, which is trivially reimplemented inline (`v += (target - v) * (1 - Math.exp(-lambda * delta))`). Adding a new package for one helper that takes 8 characters of math is not justified. The CONTEXT.md decision locks: add ONLY if genuinely needed. |

[VERIFIED: node_modules — `ls frontend/node_modules/maath` → not found]

---

## Package Legitimacy Audit

No new packages are installed in this phase. The Standard Stack is entirely composed of already-installed dependencies. This section is N/A — no package legitimacy gate required.

**Packages removed due to slopcheck:** none (no new packages).
**Packages flagged as suspicious:** none.

---

## Architecture Patterns

### System Architecture Diagram

```
TableLab.tsx  Scene()
     │
     ├─ isFrozen  = qp("spin") === "off"        [mount-static, same as ?fly guard]
     ├─ reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches
     │                                            [mount-static read — NOT a listener]
     │
     ├─ <HoleCards ref={holeRef} ...>             [existing CardGroup — add ref]
     │       → useRef<THREE.Group>(null)
     │
     ├─ <TopChip ref={topChipRef} ...>            [add a thin wrapper group w/ ref]
     │       → useRef<THREE.Group>(null)
     │
     └─ <HeroMotion                               [NEW component — useFrame only]
             holeRef={holeRef}
             topChipRef={topChipRef}
             frozen={isFrozen || reducedMotion}
        />
              │
              └─ useFrame(({ clock }, delta) => {
                    if (frozen) return;           ← HARD dual freeze
                    const t = clock.getElapsedTime();
                    breathe(holeRef, t, delta);
                    breathe(topChipRef, t, delta, CHIP_PHASE_OFFSET);
                 })
```

The `HeroMotion` component contains ALL useFrame logic. It never creates geometry or materials. It is removed by setting `frozen=true` — no other code changes.

### Recommended Project Structure (additions only)

```
frontend/src/lab/
├── TableLab.tsx          # modified — add refs, HeroMotion mount, isFrozen/reducedMotion reads
└── (no new file needed — HeroMotion is a local component in TableLab.tsx)

tools/table-3d/
└── grep-check-tp8-09.cjs  # NEW — static code assertion for TP8 constants
```

---

## Micro-motion Mechanism

### Pattern 1: Breathing Stillness via Phase-Based Sine (pure arithmetic, gsap NOT required)

The "breathing stillness" is a very-low-frequency sine on the Y-position and a very-low-amplitude rotation.X, both shaped by a near-zero amplitude. The key is that the constants are NAMED so the grep-check can verify them.

**What:** A gentle Y-bob + rotation.X nudge on a long idle cycle, with a distinct phase offset per object so the hole cards and top chip never pulse synchronously (which would read as animation).

**When to use:** Always, unless `frozen=true`.

```typescript
// Source: codebase analysis (useFrame pattern from TP7 ?fly flythrough, extended for micro-motion)
// Named constants — grep-checkable by tools/table-3d/grep-check-tp8-09.cjs
const MICRO_AMPLITUDE_Y   = 0.003;  // world units — SSOT < 0.01wu; err LESS
const MICRO_AMPLITUDE_ROT = 0.004;  // radians   — SSOT < 0.5° = 0.00873 rad; err LESS
const MICRO_IDLE_PERIOD   = 9.0;    // seconds   — SSOT 6-12s idle; mid-range
const MICRO_SETTLE_TAU    = 0.25;   // seconds   — SSOT 0.2-0.4s; exponential time constant

// Chip has a distinct offset so it breathes out of phase with the cards
const CHIP_PHASE_OFFSET   = Math.PI * 0.7; // not a round fraction → no harmonic lock

function breathe(
  ref: React.RefObject<THREE.Group | null>,
  t: number,
  delta: number,
  phaseOffset = 0,
): void {
  const obj = ref.current;
  if (!obj) return;

  // Breathing target — very low frequency, near-zero amplitude
  const cycle = (2 * Math.PI * t) / MICRO_IDLE_PERIOD;
  const targetY   = MICRO_AMPLITUDE_Y   * Math.sin(cycle + phaseOffset);
  const targetRot = MICRO_AMPLITUDE_ROT * Math.sin(cycle + phaseOffset + 0.6); // phase lag for organic feel

  // Exponential settle — frames-rate-independent (the delta form of damp/lerp)
  const alpha = 1 - Math.exp(-delta / MICRO_SETTLE_TAU);
  obj.position.y  += (targetY   - obj.position.y)  * alpha;
  obj.rotation.x  += (targetRot - obj.rotation.x)  * alpha;
}
```

**Why this approach:**
- `Math.sin(t / PERIOD)` driven by R3F's `clock.getElapsedTime()` — fully deterministic: same `t` = same output. No random state between frames.
- Exponential decay settle (`1 - exp(-delta/tau)`) is frame-rate independent and is the same math `maath/easing.damp` wraps. No new dependency.
- Named constants = grep-checkable. The planner can write a `grep-check-tp8-09.cjs` that asserts each constant is within the SSOT threshold.
- Phase offset between hole cards and top chip: cards and chip do NOT pulse together. Using `Math.PI * 0.7` avoids integer multiples of `Math.PI/2` (which would create accidental harmonic locking).
- The Y delta is additive to the existing `position.y` which is set at construction. After the dual freeze gate is entered, `obj.position.y` and `obj.rotation.x` will remain at their last breathed value — effectively frozen at a near-zero offset from rest. This is acceptable because the settle constant (0.25s) snaps back to zero within one second if the freeze is applied before the tab is captured (the harness waits 2500ms after page load before screenshotting — the scene will be frozen long before the screenshot).

### Pattern 2: Deterministic Freeze (the dual gate — the CRITICAL pattern)

**What:** Both freeze conditions are read ONCE at component mount using the same mount-static pattern already established by TP7's `isFrozen = qp("spin") === "off"`.

**When to use:** Always, as the outer guard in HeroMotion.

```typescript
// Source: TP7 flythrough freeze pattern (TableLab.tsx line 1071-1078) — extended for TP8
// isFrozen: mount-static (qp() reads window.location.search once at module load)
const isFrozen = qp("spin") === "off";

// reducedMotion: mount-static read — NOT a listener (a listener would re-render;
// the lab is a static lab, not an accessibility-reactive app)
const reducedMotion = typeof window !== "undefined"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Combined flag passed to HeroMotion
const motionFrozen = isFrozen || reducedMotion;

// Inside HeroMotion:
useFrame(({ clock }, delta) => {
  if (frozen) return;  // ← HARD dual freeze; frozen = motionFrozen prop
  // ... breathe logic
});
```

**Why mount-static for `reducedMotion`:**
- The lab is a debug/preview page, not an accessible user-facing UI. The `prefers-reduced-motion` guard is a compliance gate, not a live accessibility reactor. Reading once at mount is sufficient and avoids a `useEffect`/`useState` overhead.
- It matches the `isFrozen = qp("spin") === "off"` pattern — consistent with the existing code convention.
- The frozen-at-construction design also matches TP3 dealt-variance (M9-safe by construction).

### Pattern 3: Deterministic Seeding for Phase Offsets

The `CHIP_PHASE_OFFSET` is a fixed irrational multiple of π — not computed from any runtime state. Like TP3's `Math.sin(i * prime)` seeds, this makes the breathing curve fully reproducible across renders.

For a multi-object setup (if more hero objects were added in future), the pattern would be:
```typescript
// i * GOLDEN_RATIO * Math.PI gives maximally-separated phase offsets
// that are non-harmonic at all small i values
const GOLDEN_RATIO = 1.6180339887;
```
For TP8's two objects (hole cards + top chip), the single `CHIP_PHASE_OFFSET = Math.PI * 0.7` is sufficient and simpler.

### Anti-Patterns to Avoid

- **`gsap.to()` inside `useFrame`:** Creating a new tween every frame is catastrophic. If gsap is used at all, it must be created once in a `useEffect` and targeted at a ref — not inside `useFrame`. For this micro-motion, pure arithmetic is simpler and eliminates the risk entirely. [ASSUMED: gsap `to()` inside render loops is a known R3F pitfall]
- **`useRef(Math.random())`:** Any non-deterministic seed breaks M9. Seeds must be fixed constants.
- **`addEventListener('change', ...)` for `prefers-reduced-motion`:** Causes re-renders and complexity. Mount-static read is sufficient.
- **Mutating `position` of the card `group` that holds the dealt-variance pose:** The TP3 dealt-variance bakes micro-tilt into the initial rotation at construction. The breathing motion must be additive on top of this base pose — do NOT overwrite `position` or `rotation`; instead use `+=`. This is handled automatically by the exponential settle targeting `targetY - obj.position.y` (the target is a delta from current, so the base dealt-variance is preserved).
- **Bouncy easing (any overshoot-capable curve):** `gsap.Elastic`, `gsap.Back`, Spring physics — all forbidden by SSOT. The exponential decay (`1 - exp(-delta/tau)`) is strictly underdamped → no bounce.
- **Breathing on community cards or rail objects:** Per-frame cost multiplies. Two hero objects only.

---

## Freeze Guard Deep-Dive (M9 HARD)

### How the existing `spin=off` freeze works (source: TableLab.tsx lines 1070-1078)

```typescript
const isFrozen = qp("spin") === "off";  // mount-static
const flyCamRef = useRef<THREE.PerspectiveCamera>(null);
useFrame(({ clock }) => {
  if (!isFly || isFrozen || !flyCamRef.current) return;  // ← early exit
  // ... flythrough motion
});
```

The harness (`lab-shot.mjs`) appends `spin=off` to the URL before navigating, so `qp("spin")` returns `"off"` at mount. The `useFrame` callback executes but immediately returns — no position mutation occurs. Combined with `autoRotate={false}` (grep-checked), the scene is pixel-frozen.

### TP8 dual freeze mirrors this exactly

```typescript
// Scene() component — alongside the existing isFrozen declaration:
const isFrozen = qp("spin") === "off";                           // existing — already in scope
const reducedMotion = typeof window !== "undefined"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches; // NEW
const motionFrozen = isFrozen || reducedMotion;                  // passed to <HeroMotion>
```

The `isFrozen` value is already in scope for the `?fly` guard. Reusing it (rather than re-calling `qp("spin")`) is correct — same semantics, same mount-static value.

**M9 guarantee:** When the harness runs `lab-shot.mjs`, the URL contains `spin=off`. `isFrozen = true`, `motionFrozen = true`. The `HeroMotion` `useFrame` returns immediately every frame. The three hero object refs are never mutated after mount. The scene is identical to a scene with no `HeroMotion` component mounted. Captures are byte-identical.

**The grep-check cannot see this directly** — it can only assert the constant names and values, and assert that `frozen` is checked before any `position` mutation. The check pattern: verify that the `useFrame` body contains an early-return conditioned on a variable whose name includes `frozen` or `reduced`.

---

## Static Code Assertion (grep-check-tp8-09.cjs)

Because the frozen captures cannot measure live micro-motion amplitude, the amplitude constraints are enforced by a static grep-check on named constants in `TableLab.tsx`. This is the same pattern as the TP7 camera-fov assertion (CHECK 10 in grep-check-tp7-08.cjs).

### Constants to expose (named, grep-checkable)

| Constant | Value | SSOT Threshold | Check Expression |
|----------|-------|----------------|-----------------|
| `MICRO_AMPLITUDE_Y` | 0.003 | < 0.01 | `MICRO_AMPLITUDE_Y` value ≤ 0.01 |
| `MICRO_AMPLITUDE_ROT` | 0.004 | < 0.00873 (0.5°) | `MICRO_AMPLITUDE_ROT` value ≤ 0.00873 |
| `MICRO_IDLE_PERIOD` | 9.0 | 6–12s | value in [6, 12] |
| `MICRO_SETTLE_TAU` | 0.25 | 0.2–0.4s | value in [0.2, 0.4] |

### grep-check-tp8-09.cjs — planned checks

| # | What | How | Failure means |
|---|------|-----|---------------|
| CHECK 1 | `MICRO_AMPLITUDE_Y` declared and ≤ 0.01 | Regex extract numeric value | Y-translation bound breached |
| CHECK 2 | `MICRO_AMPLITUDE_ROT` declared and ≤ 0.00873 | Regex extract numeric value | Rotation bound breached (> 0.5°) |
| CHECK 3 | `MICRO_IDLE_PERIOD` in range [6, 12] | Regex extract numeric value | Idle period outside SSOT |
| CHECK 4 | `MICRO_SETTLE_TAU` in range [0.2, 0.4] | Regex extract numeric value | Settle duration outside SSOT |
| CHECK 5 | NO bouncy/flip/spin/glow easing in lab source | `/(Elastic|Bounce|Back|Flip|Spin|Glow)/` regex on non-comment code | No-FX assertion (forward-carried) |
| CHECK 6 | Freeze guard present — `motionFrozen` or equivalent guards useFrame | String presence check | Freeze gate missing → M9 can break |
| CHECK 7 | `reducedMotion` (or equivalent `prefers-reduced-motion` check) present | String presence check | Accessibility freeze missing |
| CHECKS 8–18 | Forward-carry all 11 checks from grep-check-tp7-08.cjs | Direct reuse | Backward compat |

**Total: 7 new checks + 11 forward-carried = 18 checks.**

The numeric extraction regex for the constant checks follows the TP7 brass roughness pattern:
```javascript
// Extract the numeric value from: const MICRO_AMPLITUDE_Y = 0.003;
const match = src.match(/MICRO_AMPLITUDE_Y\s*=\s*([0-9.]+)/);
const val = match ? parseFloat(match[1]) : NaN;
if (isNaN(val) || val > 0.01) fail("CHECK 1 FAILED ...");
```

This is robust to whitespace variation and tolerates tuning within the SSOT bounds without changing the check.

---

## Social Read Completion

### Current state (TP6 shipped, unconditional)

The center table-state is ALREADY mounted unconditionally in `Scene()`:

```typescript
// TableLab.tsx line 1276 — CenterGameState mounted unconditionally
<CenterGameState kit={cardKit} />
```

`CenterGameState` renders:
- Face-down deck stub (4 cards, hand-stacked scatter, reuses `kit.body` + `kit.stock` — zero new deps)
- Dealer button (matte cream cylinder, `cylinderGeometry 0.28r × 0.04h`)

The staged hand (community `[1E, 12C, 11B, 5C, 7E]` + hole `[10O, 7O]` = the Perla) is the fixed `LAB_HAND_IDS` scene — always present.

The demoted accent pot (three short `InstancedChipStack` columns at `group[2.7, 0, 1.5] scale 0.66`) is the default chip render — always present.

### Recommendation: NO new center objects

The TP6 center state (deck stub + dealer button) combined with the 5-card board, the Perla hole pair, and the demoted pot constitutes a complete mid-hand social read:
- **Active hand:** community board (5 revealed cards, including As de Espadas + Rey de Copas + Caballo de Bastos + 5 de Copas + 7 de Espadas) + the Perla hole pair → a full 5-card board with the protagonist holding the Perla. This reads "final betting street" — the richest shared-game moment.
- **Dealer position:** the dealer button at `[-0.7, 0.022, -1.6]` anchors the round structure.
- **Remaining deck:** the face-down stub at `[0.3, FELT_REST_Y, -1.3]` (4 cards) communicates that cards were dealt — the remaining deck.
- **Stakes:** the accent pot communicates chips-in-play without dominating.

**No center discard is needed.** The SSOT §TP8 says "deck stub / button / center discard — from TP6" as three examples; the CONTEXT.md decision 4 says the existing TP6 state IS the social read ("the staged mid-hand = the existing Perla hole-pair + community board, the demoted pot"). The center discard would add an object with no defined game-state meaning in Chiribito (which has 6 betting streets, not a river/discard mechanic in the Texas Hold'em sense). Adding it risks table-state creep (CONTEXT §deferred: "No new materials / lighting / cameras — TP8 only adds motion + completes the social read on the existing object").

**M2 impact:** No new center object is added → M2 is unchanged at 3.66× (hero) / 2.60× (card). Well above the 2× floor.

**Verdict: CENTER STATE IS COMPLETE. No new scene objects in TP8.**

The TP8 social-read contribution is the MOTION — the breathing life on the existing staged objects that transforms "a still-life photograph of a game table" into "a table caught mid-play." The micro-motion on the hole cards (the protagonist) is what sells the shared game read. The static objects are already sufficient; the motion is the final ingredient.

---

## Common Pitfalls

### Pitfall 1: Visible Wobble = Gimmick
**What goes wrong:** The breathing amplitude, while sub-threshold by the constant values, becomes perceptually visible — the operator notices motion during the gate view.
**Why it happens:** The constants are at the upper range of the SSOT, or the motion affects an object that is large in screen space (the hole cards at POV are very large).
**How to avoid:** Start with MICRO_AMPLITUDE_Y = 0.003 and MICRO_AMPLITUDE_ROT = 0.004 (the values in this research). These are 30% and 46% of their respective SSOT ceilings. The SSOT rule is explicit: "err on the side of LESS motion."
**Warning signs:** If the operator can describe the motion ("the card is moving"), HALVE the constants. If still seen after halving, REMOVE the motion (non-blocking rollback).

### Pitfall 2: Motion During Capture Breaks M9
**What goes wrong:** The `useFrame` runs during the harness capture window because the freeze guard is not active.
**Why it happens:** The freeze guard reads `qp("spin")` but the harness appended `spin=off` AFTER the React render, so `qp()` reads a stale URL.
**How to avoid:** `qp()` in the lab reads `window.location.search` at the time the function is called — which in R3F React is at component mount, during the initial render. The harness navigates to the URL WITH `spin=off` already appended (see `lab-shot.mjs` line 13: `url += ... "spin=off"`). So `qp("spin")` is `"off"` from the very first render. No stale-URL issue.
**Warning signs:** If M9 fails, check that `motionFrozen` is computed OUTSIDE `useFrame` (mount-static), not inside the frame callback where the ref is null on first call.

### Pitfall 3: Per-Frame Cost from Multiple useFrame Registrations
**What goes wrong:** Adding a `useFrame` to each Card or Chip component individually creates N frame callbacks — one per mounted hero object instance.
**Why it happens:** The natural instinct is to add breathing inside the `<Card>` component.
**How to avoid:** The `HeroMotion` component approach centralizes ALL per-frame logic into ONE `useFrame`. It receives refs to the two hero group objects (hole-card group + top-chip group) and mutates them from a single callback. Two objects, one `useFrame`.
**Warning signs:** `renderer.info.render.calls` increases (M10 regression), or frame-time rises (M11 regression).

### Pitfall 4: Table-State Creep to Center Objects
**What goes wrong:** The social-read analysis leads to adding a center discard, or an additional chip pile, or any per-seat object.
**Why it happens:** The "social read" framing suggests adding more objects. The CONTEXT.md deny-list is clear but easy to drift from.
**How to avoid:** The social read is COMPLETE from TP6. The TP8 contribution is the MOTION on existing objects, not new objects. Any new center addition must pass the anti-scope-creep audit: "is this within 2wu of [0,0,0]? Is it center-of-table only? Is it zero per-seat?" The CenterGameState already passes; adding new objects requires justification.
**Warning signs:** Any new JSX that is NOT `<HeroMotion>` or a `ref` addition.

### Pitfall 5: Bouncy Easing (No-FX Assertion)
**What goes wrong:** A gsap ease name like `"elastic.out"`, `"back.out"`, or `"bounce.out"` is used for the settle curve, creating visible overshoot.
**Why it happens:** gsap's "satisfying" eases are tempting; the exponential decay formula is less obvious.
**How to avoid:** Use ONLY the exponential decay form: `v += (target - v) * (1 - Math.exp(-delta / tau))`. This is a first-order low-pass filter — critically damped, zero overshoot. The grep-check-tp8-09 CHECK 5 asserts that none of the forbidden easing names (`Elastic`, `Bounce`, `Back`, etc.) appear in non-comment lab source.
**Warning signs:** CHECK 5 fails in the grep-check; or visually, the object overshoots its rest position after a motion cycle.

### Pitfall 6: Mutating the Base Dealt-Variance Pose
**What goes wrong:** The HeroMotion sets `obj.rotation.x = targetRot` (overwrite) instead of `obj.rotation.x += delta` (additive). This overwrites the TP2 dealt-variance micro-tilt baked into the CardPose rotation at construction.
**Why it happens:** `obj.rotation.x = ...` is simpler to write than the settle form.
**How to avoid:** The exponential settle formulation naturally avoids this: `obj.rotation.x += (targetRot - obj.rotation.x) * alpha`. When `targetRot` is 0 (frozen state), this decays the object back to its base pose — but the base pose for rotation is the dealt-variance value already set. For Y position, the breathing target `targetY` is a delta from Y=0, not from the card's actual world Y. This means the breathing target must be computed relative to the card's REST Y (not Y=0): `const restY = baseRef.current?.userData.restY ?? 0` — store `restY` at mount.

**Recommended fix:** Initialize `userData.restY = obj.position.y` at the start of `HeroMotion`'s mount (in a `useEffect(() => { ... }, [])`) and use `obj.position.y += (targetY + userData.restY - obj.position.y) * alpha`. This makes the breathing additive over the base position regardless of what the base Y is.

---

## Code Examples

### Complete HeroMotion component

```typescript
// Source: codebase analysis — synthesis of TP7 freeze pattern + TP2/TP3 deterministic-constant pattern
// Placement in TableLab.tsx: as a local function component, above Scene()

// ─── TP8: sub-threshold micro-motion constants ─────────────────────────────────
// All four constants are grep-checked by tools/table-3d/grep-check-tp8-09.cjs.
// SSOT thresholds: amplitude < 0.01wu / < 0.5° (0.00873 rad), idle 6-12s, settle 0.2-0.4s.
// Err LESS: these values are 30-46% of their respective ceilings.
const MICRO_AMPLITUDE_Y   = 0.003;  // world units — SSOT < 0.01wu
const MICRO_AMPLITUDE_ROT = 0.004;  // radians    — SSOT < 0.00873 rad (0.5°)
const MICRO_IDLE_PERIOD   = 9.0;    // seconds    — SSOT 6–12s idle period
const MICRO_SETTLE_TAU    = 0.25;   // seconds    — SSOT 0.2–0.4s settle

// Out-of-phase offset so hole-cards and top-chip do NOT breathe synchronously.
// Avoids integer-multiple of π/2 to prevent harmonic locking.
const CHIP_PHASE_OFFSET = Math.PI * 0.7;

interface HeroMotionProps {
  holeRef:     React.RefObject<THREE.Group | null>;
  topChipRef:  React.RefObject<THREE.Group | null>;
  frozen:      boolean; // isFrozen || reducedMotion — M9 HARD gate
}

function HeroMotion({ holeRef, topChipRef, frozen }: HeroMotionProps) {
  // Store rest Y for each ref so breathing is additive over the base pose (Pitfall 6).
  const restY = useRef<{ hole: number; chip: number }>({ hole: 0, chip: 0 });

  useEffect(() => {
    // Capture rest Y ONCE at mount — before any breathing starts.
    if (holeRef.current)    restY.current.hole = holeRef.current.position.y;
    if (topChipRef.current) restY.current.chip = topChipRef.current.position.y;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(({ clock }, delta) => {
    if (frozen) return;  // HARD dual freeze — M9 determinism gate

    const t = clock.getElapsedTime();

    // Hole cards breathe (phase 0)
    applyMicroBreath(holeRef.current, t, delta, 0, restY.current.hole);
    // Top chip breathes out-of-phase
    applyMicroBreath(topChipRef.current, t, delta, CHIP_PHASE_OFFSET, restY.current.chip);
  });

  return null; // no geometry — pure side-effect component
}

function applyMicroBreath(
  obj:   THREE.Group | null,
  t:     number,
  delta: number,
  phase: number,
  restYVal: number,
): void {
  if (!obj) return;
  const cycle = (2 * Math.PI * t) / MICRO_IDLE_PERIOD;
  const targetY   = restYVal + MICRO_AMPLITUDE_Y   * Math.sin(cycle + phase);
  const targetRot = MICRO_AMPLITUDE_ROT * Math.sin(cycle + phase + 0.6);  // phase-lagged
  // Exponential settle: frames-rate-independent; zero overshoot (no bouncy easing).
  const alpha = 1 - Math.exp(-delta / MICRO_SETTLE_TAU);
  obj.position.y += (targetY   - obj.position.y) * alpha;
  obj.rotation.x += (targetRot - obj.rotation.x) * alpha;
}
```

### Adding refs to existing scene objects

The hole-card group and the top-chip group are currently rendered without external refs. The additions are minimal:

```typescript
// 1. Declare refs in Scene() (alongside existing isFrozen, flyCamRef declarations)
const holeCardGroupRef  = useRef<THREE.Group>(null);
const topChipGroupRef   = useRef<THREE.Group>(null);

// 2. Attach ref to the hole-card CardGroup wrapper:
// Current: <CardGroup kit={cardKit} faces={cardFaces} poses={hole} />
// Change:  Wrap in a <group ref={holeCardGroupRef}>
<group ref={holeCardGroupRef}>
  <CardGroup kit={cardKit} faces={cardFaces} poses={hole} />
</group>

// 3. Attach ref to the top chip of the demoted pot.
// The demoted pot is a <group position={[3.0, 0, 1.5]} scale={0.5}> containing 3 InstancedChipStack.
// The "top chip" is the highest chip in the stack. Rather than computing which Instance is "top,"
// attach the ref to the ENTIRE demoted pot group — the breathing amplitude is so small
// (0.003wu) that breathing the whole group reads identically to breathing one chip.
// The group already exists at line 1196; just add the ref prop:
<group ref={topChipGroupRef} position={[3.0, 0, 1.5]} scale={0.5}>
  ...
</group>

// 4. Mount HeroMotion in Scene(), AFTER all scene content (before the EffectComposer):
const motionFrozen = isFrozen || reducedMotion;  // add reducedMotion to existing isFrozen scope
<HeroMotion
  holeRef={holeCardGroupRef}
  topChipRef={topChipGroupRef}
  frozen={motionFrozen}
/>
```

### isFrozen + reducedMotion in Scene() (mount-static)

```typescript
// Source: TP7 flythrough pattern (TableLab.tsx line 1070-1071) extended
// Alongside the existing isFly / isFrozen declarations in Scene():
const isFly     = qp("fly") !== null;
const isFrozen  = qp("spin") === "off";                                        // existing
const reducedMotion = typeof window !== "undefined"                            // NEW TP8
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const motionFrozen = isFrozen || reducedMotion;                               // NEW TP8
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frame-rate-independent smooth approach | Custom lerp accumulation with `requestAnimationFrame` | `useFrame` + exponential decay `1 - exp(-delta/tau)` | R3F's `useFrame` already fires on the rAF loop and provides `delta`; the exponential form is mathematically correct for frame-rate independence |
| Bounce-free settling | Spring physics / custom damping system | Exponential decay — zero overshoot by construction | Spring physics can bounce; exponential decay is first-order LPF, always critically damped |
| Multiple object animation | Per-component `useFrame` registrations | Single `HeroMotion` component with refs to all hero objects | R3F docs: each `useFrame` registration is a callback in the rAF loop; fewer = cheaper |
| Freeze detection | Runtime polling | Mount-static boolean flag | Page-load is the only moment state is set; re-reading per-frame is wasteful and creates race conditions |

**Key insight:** The exponential decay settle (`v += (target - v) * (1 - Math.exp(-delta / tau))`) is mathematically identical to `maath/easing.damp(v, target, lambda, delta)` (where lambda = 1/tau). The latter is a convenience function. Installing `maath` to call a one-liner that is trivially inlined is not justified.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `requestAnimationFrame` + manual state | R3F `useFrame` | R3F 1.0 (~2020) | Idiomatic R3F: hooks into the render loop, receives clock + delta |
| `window.matchMedia` listener + useState | Mount-static `.matches` read | N/A (the lab is not a full accessibility-reactive app) | Simpler, no re-render cost, consistent with the lab's `qp()` pattern |
| gsap `to()` for all animations | `useFrame` + exponential decay for continuous micro-motion | R3F convention (2022+) | gsap `to()` creates tweens with a defined endpoint; a breathing loop has no endpoint |
| `maath/easing.damp` | Inline `1 - Math.exp(-delta/tau)` | N/A for this project | Identical math; inline version needs no install |

**Deprecated/outdated (for this phase):**
- `autoRotate` on OrbitControls for any motion effect — banned (grep-check-tp7-08 CHECK 9); captures become non-deterministic.
- Any postprocessing-based motion blur or temporal AA that could accumulate non-determinism — already banned via M9 and no new postprocessing in TP8.

---

## Waves + Gate Breakdown

### Recommended 3-plan structure

**Plan 09-01: Micro-motion implementation + dual freeze guard**
- Add the four named constants (`MICRO_AMPLITUDE_Y`, `MICRO_AMPLITUDE_ROT`, `MICRO_IDLE_PERIOD`, `MICRO_SETTLE_TAU`) to TableLab.tsx.
- Add `reducedMotion` + `motionFrozen` declarations in `Scene()`.
- Add `holeCardGroupRef` + `topChipGroupRef` refs; wrap hole CardGroup in a `<group ref={...}>`.
- Attach ref to existing demoted pot group.
- Implement `HeroMotion` component + `applyMicroBreath` helper.
- Mount `<HeroMotion>` in Scene() after all content, before EffectComposer.
- Capture M9 double-shot: two consecutive captures with `spin=off` → byte-identical → M9 PASS.
- Run `vitest` + `tsc --noEmit` — must be green.
- Run `grep-check-tp7-08` (11/11 forward-carry — no TP8 check yet).
- No operator gate at this plan — code-verifiable.

**Plan 09-02: grep-check-tp8-09 static code assertion**
- Author `tools/table-3d/grep-check-tp8-09.cjs` with 7 new checks + 11 forward-carried.
- Run it — must exit 0.
- Confirm M2 ≥ 2× (unchanged from TP7 = 3.66×/2.60× — no new objects).
- Confirm social-read completeness audit: document that CenterGameState + staged hand + demoted pot = complete; no new objects needed.
- Capture the three canonical money shots (`?cam=hero&fx&spin=off`, `?cam=card&fx&spin=off`, `?cam=macro&fx&spin=off`) for the gate record.
- No operator gate at this plan — orchestrator-verifiable (grep-check exits 0, M9 byte-identical, M2 documented).

**Plan 09-03: TP8 Operator Gate (autonomous:false — the LIVE motion-feel gate)**
- Author `docs/table-3d/TP8_OPERATOR_GATE.md` with the gate record.
- Document the orchestrator's visual read (frozen captures: social read confirmed, no dead zones).
- FLAG the live motion-feel for the operator's batch review — the orchestrator CANNOT assess "does it feel alive and weighty" from frozen captures.
- Update SCORECARD_TABLE_3D.md (tactility element + social-read element).
- Update `.planning/STATE.md` + `.planning/ROADMAP.md`.

### Gate gates for each plan

| Plan | Auto-verifiable gates | Operator-required |
|------|-----------------------|-------------------|
| 09-01 | M9 byte-identical (md5 check), vitest green, tsc 0 errors, grep-check-tp7-08 11/11 | NONE |
| 09-02 | grep-check-tp8-09 exit 0, M2 documented ≥ 2×, social-read audit documented | NONE |
| 09-03 | Gate doc written, scorecard updated, STATE.md updated | LIVE MOTION FEEL — operator batch review |

---

## Validation Architecture

> `workflow.nyquist_validation` not explicitly false — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 (frontend) + Jest (game server root, not in scope for TP8) |
| Config file | `frontend/vitest.config.ts` (inferred from `package.json` scripts) |
| Quick run command | `cd frontend && npx vitest run` |
| Full suite command | `cd frontend && npx vitest run` (all tests run in one pass; 45 tests at TP7) |

### Phase Requirements → Test Map

| Req | Behavior | Test Type | Automated Command | Notes |
|-----|----------|-----------|-------------------|-------|
| M9 freeze | Two consecutive captures byte-identical | Integration (harness) | `node tools/table-3d/m9-check.mjs` (or md5 comparison in 09-01) | Harness-driven, not vitest |
| Amplitude bounds | Constants ≤ SSOT thresholds | Static assertion | `node tools/table-3d/grep-check-tp8-09.cjs` | grep-check, not vitest |
| No bouncy easing | No Elastic/Bounce/Back in lab source | Static assertion | Same grep-check, CHECK 5 | |
| prefers-reduced-motion freeze | `reducedMotion` flag zeroes motion | Manual (no JSDOM matchMedia) | Manual inspection + grep-check CHECK 7 | JSDOM doesn't implement matchMedia reliably |
| M2 cards-vs-chips ≥ 2× | No new objects degrade M2 | Pixel metric | `node tools/table-3d/m1-m2-m12.mjs` on hero capture | Existing metric tooling |
| TypeScript clean | No new type errors | Compile | `cd frontend && npx tsc --noEmit 2>&1 | grep src/lab` | |
| Social read complete | CenterGameState mounted unconditionally | Code assertion (grep) | grep-check CHECK: `CenterGameState` present non-comment | Forward-carried from TP6 |

### Wave 0 Gaps
- [ ] `grep-check-tp8-09.cjs` — does not exist yet; authored in plan 09-02.
- No new vitest test files needed — the micro-motion logic is pure side-effect (ref mutation); unit-testing it requires a JSDOM R3F setup that is not worth the complexity for a 4-constant system. The grep-check + M9 harness gate are the verification instruments.

*(Existing 45 vitest tests cover cards.ts / chipStack.ts geometry math — no TP8 changes touch those files.)*

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Vite dev server (port 5173) | Harness + lab preview | Must be running | 7.3.1 (installed) | Start with `cd frontend && npm run dev` |
| Playwright / `lab-shot.mjs` | M9 double-capture | Available (`.dev-stack/lab-shot.mjs` present) | Playwright installed | — |
| Node.js | grep-check CJS scripts | Available (used in all prior TP checks) | Available | — |
| `@react-three/fiber` useFrame | Micro-motion | Installed 8.17.10 | 8.17.10 | — |
| `gsap` | Only if used in breathe helper | Installed 3.14.2 | 3.14.2 | Pure arithmetic (no gsap needed) |
| `maath` | NOT needed | NOT installed | — | Inline exponential decay (no fallback needed) |

**Missing dependencies with no fallback:** None.

---

## Security Domain

TP8 adds no network endpoints, no auth, no user inputs, no data persistence. The lab is a local dev preview. Security domain: N/A.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `matchMedia("(prefers-reduced-motion: reduce)").matches` is available at mount in the browser context (not SSR) | Freeze Guard | Very low risk — the lab is a browser-only page (`typeof window !== "undefined"` guard already in pattern); no SSR |
| A2 | The hole-card `<CardGroup>` wrapper `<group ref>` does not cause a new React tree key or unmount cycle | Code Examples | Low risk — adding a `ref` prop to an existing `<group>` is a ref attachment, not a key change |
| A3 | `applyMicroBreath` on the entire demoted-pot group (not just the top chip individually) is perceptually equivalent to breathing only the top chip | Social Read + Code | Low risk — the pot group is at `position=[3.0, 0, 1.5] scale=0.5`; a 0.003wu Y delta on this group translates to 0.0015wu in world space (halved by scale) — below visual threshold regardless |
| A4 | The `isFrozen` variable is already in scope in `Scene()` at the point where `reducedMotion` and `motionFrozen` are added | Code Examples | Verified: `isFrozen` is declared at TableLab.tsx line 1071 in `Scene()`; confirmed from source read |

**If A4 is wrong:** Declare `isFrozen` again (it's idempotent — same value from the same `qp("spin")` call).

---

## Open Questions

1. **Should the community board cards also breathe?**
   - What we know: SSOT and CONTEXT restrict micro-motion to "hero objects only (hole cards, top chip)." The community cards are not "hero objects" by that definition.
   - What's unclear: Adding a very faint breath to the whole board group would strengthen the "mid-play" read without much cost.
   - Recommendation: Do NOT. The SSOT is explicit. Per-frame cost grows with object count. If the operator finds the static community cards break the "alive" feel, this is a TP9 correction item, not a TP8 expansion.

2. **Should `HeroMotion` be a separate file or inline in TableLab.tsx?**
   - What we know: All prior TP lab additions (CenterGameState, Seats, SeatHands, StatsProbe) are local components within TableLab.tsx. The file is 1423 lines.
   - What's unclear: At what point does a new file improve maintainability?
   - Recommendation: Keep inline in TableLab.tsx. The HeroMotion component + applyMicroBreath helper adds ~40 lines. The pattern is established in the file. A new file requires a new import and a new entry in grep-check scope.

3. **Is MICRO_IDLE_PERIOD = 9.0s the right perceptual speed?**
   - What we know: SSOT says 6–12s. 9s is the midpoint. At 9s, the card completes one full bob cycle in 9 seconds — very slow.
   - What's unclear: Whether 9s reads as "barely perceptible" or "too slow to feel alive."
   - Recommendation: Start at 9s. If the operator's batch review finds the scene reads "static despite the motion code," lower to 7s (still within SSOT). If they notice the motion, HALVE the amplitude first (to 0.0015wu) before changing the period.

---

## Sources

### Primary (HIGH confidence)
- `frontend/src/lab/TableLab.tsx` — full source read; existing patterns for isFrozen, useFrame, qp(), ref attachment
- `frontend/src/lab/cards.ts` — dealt-variance constants and deterministic seed pattern (TP2/TP3 precedent)
- `frontend/src/lab/chipStack.ts` — CHIP_ROT_SEED deterministic constant pattern
- `frontend/package.json` — confirmed gsap 3.14.2 installed, maath absent
- `frontend/node_modules/@react-three/fiber/package.json` — confirmed R3F 8.17.10
- `frontend/node_modules/gsap/package.json` — confirmed gsap 3.14.2
- `tools/table-3d/grep-check-tp7-08.cjs` — full source read; CHECK patterns for constant-value assertions
- `tools/table-3d/grep-check-tp5-06.cjs` — CHECK 5 Bloom-ban pattern (no-FX assertion model)
- `.dev-stack/lab-shot.mjs` — confirmed `spin=off` is appended by harness before navigation
- `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP8 — SSOT thresholds and acceptance criteria
- `.planning/phases/09-tp8-tactilidad-microvida-social/09-CONTEXT.md` — locked decisions and hard invariants
- `docs/table-3d/TP7_OPERATOR_GATE.md` — confirmed M2=3.66×/2.60×, M9 PASS pattern, gate shape

### Secondary (MEDIUM confidence)
- `.planning/phases/08-tp7-camaras-lock-money-shots/08-03-SUMMARY.md` — TP7 gate record; M9 md5 method
- `.planning/phases/04-tp3-fichas-materiality-perf-accent-instancing/` — TP3 deterministic seed precedent

### Tertiary (LOW confidence / ASSUMED)
- A1: `matchMedia` availability in browser context — standard Web API, not verified against a specific polyfill list; the `typeof window !== "undefined"` guard covers SSR absence.

---

## Metadata

**Confidence breakdown:**
- Micro-motion mechanism: HIGH — R3F useFrame pattern fully verified from installed source; exponential decay math is standard; constants are within-SSOT by inspection
- Dual freeze gate: HIGH — exact pattern lifted from TP7 flythrough (TableLab.tsx lines 1070-1078); mechanism verified
- Static code assertion: HIGH — exact pattern from grep-check-tp7-08.cjs CHECK 10 (numeric value extraction regex); checker file architecture fully understood
- Social-read completion: HIGH — CenterGameState source read; unconditional mount verified at line 1276; no new objects needed
- No-maath decision: HIGH — confirmed absent from node_modules; inline math verified equivalent

**Research date:** 2026-06-12
**Valid until:** 2026-07-12 (stable ecosystem — R3F/gsap/three are unlikely to change in 30 days for a lab that is isolated from prod)
