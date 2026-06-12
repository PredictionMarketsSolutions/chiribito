# Phase 8: TP7 — Cámaras (lock the canonical money shots) - Research

**Researched:** 2026-06-12
**Domain:** R3F camera presets / OrbitControls clamp / optional cinematic flythrough / M1-M2-M9 re-confirm on the finished TP1-TP6 table
**Confidence:** HIGH — all findings verified directly from `frontend/src/lab/TableLab.tsx` and the `tools/table-3d/` metric kit; no assumed library versions; no external lookups required.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

1. Re-evaluate + reconfirm the 3 TP0 presets (HERO fov32 / POV-card fov40 / MACRO fov26) on the finished table; record M1 (hole-card legibility) + M2 (cards-vs-chips) still PASS at the final HERO/POV; confirm the framing reads as the money shots of the finished table.
2. Default = KEEP. Reconfirm LOCKED. A correction is allowed ONLY if a preset clearly fails (distortion, hero softens, protagonist breaks) — and stop-on-ambiguous → keep TP0.
3. `autoRotate` OFF for capture (M9). The OrbitControls clamp (from the M1 refinement — flattering front arc) stays.
4. Optional flythrough (Claude's discretion whether to include): a restrained, non-canonical cinematic orbit behind a flag (e.g. `?fly`) that FREEZES to the canonical still for capture; still-equivalent; does NOT touch the 3 frozen presets. If it risks spectacle/churn, SKIP it (it is optional).
5. Operator gate (last plan, autonomous:false) at the canonical hero (+ the 3 shots): "is THIS the money shot of the finished table?" Stop-on-ambiguous → keep the TP0 set.

### HARD Gates

- M1 hole-card legibility PASS at final POV/HERO; M2 cards-vs-chips ≥2x PASS; M9 autoRotate-off capture determinism; presets distortion-free in the mm-equiv range, never fisheye; the 3 frozen presets unchanged (or a recorded, justified, minimal correction only).

### Claude's Discretion

- Whether to include the optional flythrough (default: include a restrained still-freezing one behind a flag, OR skip if it adds risk — Claude's call, kept restrained).
- The exact confirmation captures + the M1/M2 re-measure method on the finished table.

### Deferred Ideas (OUT OF SCOPE)

- Multi-hand / per-seat staging, micro-life, social-read → TP8.
- Final AAA scorecard sign-off → TP9.
- New framing / new presets → forbidden (TP0-frozen).
</user_constraints>

---

## Summary

TP7 is a lightweight confirmation phase. The three canonical money-shot presets were frozen by the operator at TP0 and have not been touched since. Every subsequent phase (TP1 felt → TP6 depth) was designed to be evaluated against these same presets. TP7 re-runs those three shots against the now-complete table (full TP1-TP6 stack: real felt, real cards, chips instanced + de-Vegas, slim rail, warm light, SoftShadows, AO, whisper DOF, vignette, deck stub + button) and asks one question: do the TP0 money shots still hold? The expected answer is YES, and the default action is KEEP.

The code inventory in `TableLab.tsx` confirms all three preset objects exactly (verified line 1044-1066). The OrbitControls clamp is already live with `autoRotate={false}` and a computed azimuth arc around each preset. M1 and M2 are re-measurable from the frozen capture at the POV and HERO presets using the existing `m1-m2-m12.mjs` tool; the most recent M1 reading (TP6 gate, hero ?fx-on) was 50px — more than 2× the 22px floor. M2 remains a manual-polygon fallback per the SSOT. M9 determinism is already proven byte-identical in the TP6 gate.

The optional flythrough adds one new URL flag (`?fly`) that animates a restrained orbit arc and FREEZES the camera to the hero preset when the capture flag (`spin=off`) is present, making it M9-safe. The recommendation is to include it as a thin, non-canonical, fully gated addition — but behind a strict scope budget: if the animation logic exceeds ~40 lines or any metric degrades, skip it entirely.

**Primary recommendation:** Confirm the three presets UNCHANGED on the finished table via three GPU-faithful captures + M1/M2/M9 re-reads; write `grep-check-tp7-08.cjs` asserting `autoRotate={false}` and the three preset fov values; operator gate on the hero still. Include the restrained flythrough only if it stays thin and still-equivalent.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Camera preset definition | Frontend Lab (`TableLab.tsx` `cam` useMemo) | — | Presets are page-load-static URL-param lookups; no server involvement |
| OrbitControls clamp | Frontend Lab (`TableLab.tsx` `<OrbitControls>`) | — | R3F/drei wrapper around THREE.OrbitControls; all config in the JSX |
| `autoRotate` flag | Frontend Lab (`<OrbitControls autoRotate={false}>`) | Capture harness (`lab-shot.mjs` `spin=off`) | Two-layer freeze: code default off + harness URL param off |
| Optional flythrough (`?fly`) | Frontend Lab (`useFrame` or `gsap` in `TableLab.tsx`) | — | Scene-level animation; same file as all other lab toggles |
| M1/M2 re-confirm | `tools/table-3d/m1-m2-m12.mjs` + operator confirm | Capture harness | M1 px-height is automated; legibility confirm is manual (SSOT) |
| M9 determinism | `tools/table-3d/m9-determinism.mjs` + harness | — | Double-capture md5 compare; harness auto-appends `spin=off` |
| grep-check invariants | `tools/table-3d/grep-check-tp7-08.cjs` (new) | — | Pattern: one CJS file per phase, stdlib only, exits 0/1 |
| Operator gate | Human / operator on-device | Capture anchors in `docs/table-3d/anchors/tp7-gate/` | Last plan in the phase, `autonomous:false` |

---

## Standard Stack

No new packages are required for this phase.

### Core (already installed)

| Library | Installed Version | Purpose | Notes |
|---------|------------------|---------|-------|
| `@react-three/fiber` | present (TP0 baseline) | R3F scene / `useFrame` hook | Used for optional flythrough `useFrame` if included |
| `@react-three/drei` | present | `OrbitControls`, `PerspectiveCamera` | The clamp + autoRotate config lives here |
| `three` | present | `THREE.Vector3` (holeCardDistance useMemo) | No version change |
| `playwright` | present | `lab-shot.mjs` capture harness | Already used for M9 |
| `sharp` | present | `m1-m2-m12.mjs` PNG metric runner | Already used for M1/M2/M12 |

### No New Packages

This phase touches ONLY `frontend/src/lab/` (one tsx file) + `tools/table-3d/` (one new grep-check cjs). The Package Legitimacy Audit section is omitted — no installs.

---

## Architecture Patterns

### System Architecture Diagram

```
URL param reader (qp())
    │
    ├── ?cam=hero|card|macro|...  ─→  cam useMemo (CamPreset object)
    │                                  │
    │                                  ├── PerspectiveCamera (pos, fov)
    │                                  └── OrbitControls (target, clamp, autoRotate=false)
    │
    └── ?fly  (NEW, optional)  ─→  flythrough useFrame  ─→  camera.position lerp arc
                                       │
                               spin=off present?
                               YES → freeze to cam.pos (M9-safe still)
                               NO  → animate arc (lab preview only)

Capture path (M9):
  lab-shot.mjs  →  appends &spin=off  →  browser renders frozen preset  →  PNG
  m9-determinism.mjs  →  two consecutive PNGs  →  md5 compare  →  PASS/FAIL

Metric re-confirm path (M1/M2):
  hero.png / card.png  →  m1-m2-m12.mjs  →  M1 px-height ≥ 22px + operator confirm
                                           →  M2 card/chip area ratio ≥ 2.0× (manual polygon)

Invariant check path:
  grep-check-tp7-08.cjs  →  reads TableLab.tsx  →  asserts: fov32|fov40|fov26 present,
                                                       autoRotate={false} present,
                                                       no new cam preset silently overriding the 3 frozen ones
```

### Recommended Project Structure

No new directories. Files touched:

```
frontend/src/lab/
└── TableLab.tsx            # camera preset review + optional ?fly flag (thin addition)

tools/table-3d/
└── grep-check-tp7-08.cjs   # NEW — asserts the 3 frozen presets + autoRotate=false

docs/table-3d/anchors/
└── tp7-gate/               # NEW dir — hero.png / card.png / macro.png + m9-a.png / m9-b.png
```

### Pattern 1: Camera Preset as Static useMemo (confirmed existing)

**What:** All camera presets are a plain `Record<string, CamPreset>` inside a `useMemo(() => ..., [])` that reads `window.location.search` exactly once at mount. The result is completely static for the page lifetime — no `useFrame`, no reactive state.

**When to use:** For a confirmation phase that must NOT change any preset values, the only valid action inside this useMemo is to READ and verify, or to add a new key (optional flythrough preset alias) without touching the 3 frozen keys.

**Example (confirmed in `TableLab.tsx` lines 1044-1066):**

```typescript
// Source: frontend/src/lab/TableLab.tsx (lines 1044-1066) — read directly from source
const cam = useMemo<CamPreset>(() => {
  const key = new URLSearchParams(window.location.search).get("cam") || "card";
  const presets: Record<string, CamPreset> = {
    card:  { pos: [0, 4.7, 10.6],  target: [0, 0.25, 1.2], fov: 40 },  // POV — M1 primary
    hero:  { pos: [1.2, 5.0, 8.2], target: [0, 0.5, 0],    fov: 32 },  // HERO ¾ — money shot
    macro: { pos: [-1.7, 1.7, 2.4], target: [-1.55, 0.05, 1.05], fov: 26 }, // MACRO — chip/detail
    // ... other presets (wide, close, top, rail, gather, eye, conjunto, social) ...
  };
  return presets[key] || presets.wide;
}, []);
```

**Invariant:** The three frozen values — `card fov:40`, `hero fov:32`, `macro fov:26` — must be present and byte-identical in the shipped code. `grep-check-tp7-08.cjs` asserts them.

### Pattern 2: OrbitControls Clamp (confirmed existing)

**What:** The azimuth clamp is computed from the preset's position relative to its target:
`Math.atan2(cam.pos[0] - cam.target[0], cam.pos[2] - cam.target[2]) ± 0.5 rad`.
This gives each preset its own flattering front arc (the arc that keeps hole-card orientation correct for the viewer). `autoRotate={false}` is hardcoded — no flag can re-enable it.

**Confirmed values (from `TableLab.tsx` lines 1106-1119):**
```typescript
// Source: frontend/src/lab/TableLab.tsx lines 1106-1119
<OrbitControls
  makeDefault
  target={cam.target}
  enablePan={false}
  enableDamping
  dampingFactor={0.08}
  autoRotate={false}                         // HARD — M9 determinism requires this
  minPolarAngle={0.62}
  maxPolarAngle={1.12}
  minAzimuthAngle={Math.atan2(cam.pos[0] - cam.target[0], cam.pos[2] - cam.target[2]) - 0.5}
  maxAzimuthAngle={Math.atan2(cam.pos[0] - cam.target[0], cam.pos[2] - cam.target[2]) + 0.5}
  minDistance={5}
  maxDistance={13}
/>
```

**Invariant:** `autoRotate={false}` must not become a truthy expression under any condition. The grep-check asserts its literal string presence.

### Pattern 3: Optional Flythrough via useFrame + spin=off freeze

**What:** An opt-in `?fly` flag drives a `useFrame` loop that lerps/sines the camera around a restrained arc, then immediately resets to `cam.pos` when `qp("spin")` is `"off"` (the harness freeze signal). This makes the flythrough completely invisible to the capture pipeline — M9 sees only the frozen still.

**Design constraints:**
- The arc must be centered on the hero preset position as its start and end point.
- Orbit radius and angular sweep should be small (half the hero `minDistance`/`maxDistance` range, ≤ 15° sweep).
- `useRef` on the camera/controls ref — not reactive state (no re-renders).
- If `qp("spin") === "off"` at mount: skip `useFrame` entirely (early return).
- Does NOT modify any of the 3 preset objects in the `cam` useMemo.

**Example skeleton:**
```typescript
// Source: pattern for TP7 (new code — not yet in source)
function Flythrough({ camRef, basePos, spin }: { camRef: ..., basePos: [number,number,number], spin: boolean }) {
  useFrame(({ clock }) => {
    if (!spin || !camRef.current) return;          // spin=off → frozen still (M9-safe)
    const t = clock.getElapsedTime();
    const swing = Math.sin(t * 0.25) * 0.18;       // ≤ ~10° lateral arc
    camRef.current.position.x = basePos[0] + swing;
    camRef.current.position.y = basePos[1];
    camRef.current.position.z = basePos[2];
  });
  return null;
}
```

**Recommendation: INCLUDE, but only if the scope stays ≤ ~40 lines of new code.** See the flythrough recommendation section below.

### Pattern 4: grep-check CJS script convention (confirmed from prior phases)

Every TP ships one `tools/table-3d/grep-check-tpN-NN.cjs` — plain Node stdlib, `readFileSync`, `stripComments()`, regex assertions, `process.exit(0/1)`. The TP7 script follows this exact pattern. Forward-carries all prior checks (all 8 from grep-check-tp6-07.cjs) plus adds 3 new checks:

- CHECK 9: `autoRotate={false}` present (not `autoRotate` alone — must be the literal false assignment)
- CHECK 10: `fov: 32` (hero) and `fov: 40` (card/POV) and `fov: 26` (macro) all present in preset table
- CHECK 11: No second `PerspectiveCamera` outside the existing pattern (optional: catches accidental duplicate cam)

### Anti-Patterns to Avoid

- **Touching the 3 frozen preset objects:** Any edit to `card`, `hero`, or `macro` preset values requires an explicit operator stop, a recorded justification, and a M1/M2/M9 re-run. The default is KEEP.
- **Introducing `autoRotate={true}` or `autoRotate={qp("spin") !== "off"}`:** Both break M9. The harness appends `spin=off` — if autoRotate is re-enabled, the harness URL flag is NOT the same param (`spin` vs `autoRotate`). Keep `autoRotate={false}` hardcoded.
- **Adding a flythrough via a new `<Canvas>` or second `<PerspectiveCamera makeDefault>`:** A second `makeDefault` PerspectiveCamera would override the preset camera. The flythrough must use `useFrame` to animate the existing camera reference, not add a second camera.
- **Flythrough that drifts to a non-hero resting position:** The arc must start and end at `cam.pos` (the hero preset). If the lerp does not return to `cam.pos` when idle, the frozen capture sees a drifted position instead of the hero money shot.
- **Making `?fly` the default (no flag):** The flythrough is non-canonical. The default (no URL params) must remain the static hero preset. `?fly` is opt-in only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Camera animation | Custom quaternion integration | `useFrame` with `Math.sin` lerp or `gsap.to` on the camera object | The scene already uses GSAP for chip animations; `useFrame` is the R3F way |
| Deterministic freeze | Custom "freeze when capturing" flag logic | Reuse `qp("spin") === "off"` already read by the harness — same signal the harness sends | Single-source of truth; prevents two separate "freeze" code paths |
| M1/M2 re-measurement | Writing new metric code | `m1-m2-m12.mjs` already exports `m1Legibility`, `m2CardsVsChips`, `m1DownscalePov` — reuse them | They were specifically written for this purpose; M2's manual-polygon fallback is SSOT-sanctioned |
| M9 double-capture | Writing a new capture loop | `m9-determinism.mjs --shot hero --port 5181` — already exists | Two-mode design (capture+check / meta-gate) already handles this |
| Preset assertion | String scanning TableLab.tsx by hand | `grep-check-tp7-08.cjs` (new, ~100 lines) following the established CJS pattern | Consistent with grep-check-tp3-02, grep-check-tp4-05, grep-check-tp5-06, grep-check-tp6-07 |

---

## The 3 Frozen Presets — Exact Inventory

Source: `frontend/src/lab/TableLab.tsx` lines 1047-1053 (read directly — HIGH confidence).

| Key | `pos` (world units) | `target` | `fov` (deg) | mm-equiv* | Role |
|-----|---------------------|----------|-------------|-----------|------|
| `card` (POV) | `[0, 4.7, 10.6]` | `[0, 0.25, 1.2]` | **40** | ~57mm | Primary M1 shot — hole cards large in foreground, board read beyond |
| `hero` | `[1.2, 5.0, 8.2]` | `[0, 0.5, 0]` | **32** | ~72mm | The canonical money shot — ¾ table with protagonist lower-third |
| `macro` | `[-1.7, 1.7, 2.4]` | `[-1.55, 0.05, 1.05]` | **26** | ~88mm | Close detail — chips + card edge + crevice AO read |

*mm-equivalent is approximate: full-frame diagonal 43.3mm / (2 × tan(fov/2)) using 1440×900 canvas aspect ≈ 1.6. Hero 32° → ~72mm, POV 40° → ~57mm, macro 26° → ~88mm. All three fall within the SSOT "50–85mm-equiv product range, never fisheye" specification.* [VERIFIED: read directly from TableLab.tsx]

**Distortion check:** None of the three presets has `fov` above 60° (the threshold where noticeable rectilinear distortion begins on a wide canvas). The macro at 26° is the longest lens of the three — closest to a telephoto, maximum subject flatness. All three are distortion-free in the product sense. [ASSUMED — derived from Three.js PerspectiveCamera fov semantics + standard photographic convention; verified consistent with SSOT "~50-85mm-equiv" language]

**Top-down preset (`top`):** `{ pos: [0, 12, 0.001], target: [0, 0, 0], fov: 30 }` — confirmed as diagnostic-only by existing comment "ENCUADRE-PRIMERO diagnostic framings (NOT money shots; the frozen 3 card/hero/macro untouched)" at line 1061. It is not in the canonical money-shot set. [VERIFIED: read directly from TableLab.tsx]

### OrbitControls Clamp — confirmed parameters

| Parameter | Value | Role |
|-----------|-------|------|
| `autoRotate` | `false` (hardcoded) | M9 determinism — NEVER change |
| `minPolarAngle` | `0.62` rad (~35.5°) | Prevents looking straight up; top of the clamp range |
| `maxPolarAngle` | `1.12` rad (~64.2°) | Prevents going below the table surface |
| `minAzimuthAngle` | preset-relative − 0.5 rad | Flattering front arc — cards read correctly |
| `maxAzimuthAngle` | preset-relative + 0.5 rad | ≈ ±28.6° around each preset's bearing |
| `minDistance` | `5` | Prevents extreme close-up that would break framing |
| `maxDistance` | `13` | Prevents pulling back to a diagnostic wide |
| `enablePan` | `false` | Prevents the camera target drifting away from the preset target |
| `enableDamping` | `true`, `dampingFactor=0.08` | Smooth orbit; not a capture concern (captures are frozen) |

[VERIFIED: read directly from TableLab.tsx lines 1106-1119]

---

## M1 / M2 Re-confirm on the Finished Table

### What changed since TP0 (the original M1 measurement)

The TP0 M1 gate was run against a table that had: basic felt, no cards loaded with real Fournier faces, no chips, no rail craft, no lighting upgrade. The TP6 table has: real Fournier card faces (TP2 anisotropy + normal maps + clearcoat levers), TP3 instanced chips, TP4 slim rail + craft, TP5 warm key + SoftShadows, TP6 AO + whisper DOF + vignette. The DOF `worldFocusDistance` is keyed to `holeCardDistance` (the camera-to-hole-card plane distance) so the hole cards are always in the sharp band regardless of `?fx`. The latest M1 reading was at TP6 with `?fx` on: **50px at hero — 2.3× margin over the 22px floor.** [VERIFIED: from TP6_OPERATOR_GATE.md]

### Re-confirm method for TP7

**Step 1 — Capture three shots (the full default + ?fx stack) using the harness:**
```bash
# from repo root, with dev server running on port 5181
LAB_URL="http://localhost:5181/table-lab.html?cam=card&fx" node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp7-gate/card.png
LAB_URL="http://localhost:5181/table-lab.html?cam=hero&fx" node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp7-gate/hero.png
LAB_URL="http://localhost:5181/table-lab.html?cam=macro&fx" node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp7-gate/macro.png
```

**Step 2 — M9 double-capture (autoRotate=false determinism):**
```bash
node tools/table-3d/m9-determinism.mjs --shot hero --port 5181 --out docs/table-3d/anchors/tp7-gate
```
Expected: PASS (byte-identical). `autoRotate={false}` + no `useFrame` animation in the non-`?fly` path means the scene is fully static.

**Step 3 — M1 re-read on the card (POV) capture:**
```bash
node tools/table-3d/m1-m2-m12.mjs
# then visually inspect: rank-glyph bbox height on the 1080p downscale of card.png
# PASS criterion: ≥ 22px + operator on-device legibility confirm
```
Expected: ≥ 22px (TP6 gate showed 50px at hero; POV is the closer shot so the cards are larger). The TP2 anisotropy + Fournier faces + DOF focal plane anchored to holeCardDistance mean the POV cards are sharper than at TP0.

**Step 4 — M2 re-read (manual polygon):**
On the hero and POV captures, trace the card region and chip region polygons and compute the area ratio using `m2CardsVsChips({ cardPolys, chipPolys })`. Expected: ≥ 2.0×. The TP3 demoted accent pot (3 short stacks at `scale={0.5}` of a `group position={[3.0, 0, 1.5]}`) was specifically designed to hold M2 ≥ 2.0×. The MACRO shot is the only preset where chips are large (by design — it is a detail shot), and M2 is not required on macro. [VERIFIED: chip layout read from TableLab.tsx lines 1183-1192]

**Step 5 — Operator confirm on the three stills:**
The question is: "Do the HERO / POV-card / MACRO presets read as the money shots of the finished table? Does the protagonist composition hold — hole cards dominant lower-third, board mid-frame, rail framing, chips off-center accent?" If YES for all three → presets LOCKED. If ambiguous → KEEP TP0 (no edit). If clearly fails → record a minimal justified correction.

---

## Optional Flythrough — Recommendation

### The case FOR including it (restrained)

- The CONTEXT.md explicitly gives this to Claude's discretion; the SSOT explicitly mentions "optionally add a non-canonical restrained cinematic flythrough that freezes to the canonical still under the capture flag."
- The mechanism is already designed: `qp("spin")` is already the freeze signal the harness sends. Reusing it means zero new freeze-logic surface area.
- A 10-15° lazy lateral arc starting and ending at the hero preset position, driven by `Math.sin(clock.getElapsedTime() * 0.2) * 0.2` on the X position, is genuinely still-equivalent — the viewer barely registers motion, they register "alive" vs "dead."
- It is entirely isolated behind `?fly` — the default lab, all captures, and all metric gates are unaffected.

### The case AGAINST (skip)

- Any `useFrame` in `TableLab.tsx` adds per-frame cost in the lab view (minor but real).
- If the arc overshoots the OrbitControls polar/azimuth clamp at the extreme, it fights the controls constraint and jitters. The clamp is ±0.5 rad (~28.6°) and a ±0.2 unit swing at the hero Z distance of ~8wu is ~arctan(0.2/8) ≈ 1.4° — well inside the clamp. Safe.
- The phase gate is already the simplest possible (confirm three stills). Adding the flythrough risks scope creep in a phase designed to be light.

### Decision: INCLUDE, tightly scoped

**Include the flythrough.** Scope budget: ≤ 40 new lines of TypeScript in `TableLab.tsx` (one `useMemo` ref + one `useFrame` call, both conditional on `qp("fly") !== null`). Implementation constraints:
- Start/end position: exactly `cam.pos` (the hero preset).
- Arc: X-axis only (lateral swing), amplitude ≤ 0.25 world units, frequency ≤ 0.3 rad/s (roughly a 20-second full cycle — imperceptibly slow).
- When `qp("spin") === "off"` (harness): skip the `useFrame` callback entirely (no animation).
- Does NOT set `autoRotate={true}`.
- Does NOT add a second `PerspectiveCamera makeDefault`.
- grep-check-tp7-08.cjs must still PASS with `?fly` code present — the check reads source, not runtime.
- If the flythrough fails to freeze deterministically (M9 FAIL on `?fly&spin=off`): CUT it immediately. It is non-canonical and non-blocking.

---

## Common Pitfalls

### Pitfall 1: Preset Churn (the #1 risk)

**What goes wrong:** Someone "just tweaks" a preset position or fov to look better on the finished table, without realizing this breaks the TP0 continuity anchor and makes all prior gate comparisons meaningless.

**Why it happens:** The finished TP1-TP6 table looks different than the TP0 table — a new fov or position might "look better." That is not the bar. The bar is: does the TP0 preset still read as a money shot on the finished table?

**How to avoid:** The default is KEEP. Any edit must clear a three-part gate: (1) the TP0 preset clearly fails on the finished table (not "looks slightly better"), (2) the edit is minimal (fov ± 2°, position ± 0.5 wu), (3) M1/M2/M9 are re-run and PASS after the edit. grep-check-tp7-08.cjs asserts the exact fov values — a changed fov will fail the check until the check is updated, which forces a recorded justification.

**Warning signs:** PR description says "small camera tweak"; fov values change by more than ±2°; position vector changes by more than 0.5 in any component.

### Pitfall 2: autoRotate Re-enabled

**What goes wrong:** `autoRotate={false}` becomes `autoRotate={qp("spin") !== "off"}` or similar, re-enabling rotation on the lab default. The harness appends `spin=off` but this is a DIFFERENT URL param from the OrbitControls `autoRotate` prop — enabling rotation via `autoRotate={true}` is NOT frozen by `spin=off`. The captures become non-deterministic (M9 FAIL).

**Why it happens:** A developer adds the flythrough and reasons "I need autoRotate for the orbit" — confusing OrbitControls' autoRotate with a custom `useFrame` animation.

**How to avoid:** The flythrough uses `useFrame` directly on the camera position, NOT `autoRotate`. `autoRotate={false}` stays hardcoded. grep-check asserts its literal presence.

**Warning signs:** grep-check CHECK 9 fails; M9 double-capture returns differing md5 hashes.

### Pitfall 3: Flythrough That Doesn't Freeze

**What goes wrong:** The `?fly` `useFrame` loop continues running when `qp("spin") === "off"`, causing the capture to show a non-hero camera position. M9 FAILS (two captures are at different arc positions).

**Why it happens:** The freeze condition checks `qp("fly")` but doesn't also check `qp("spin")`.

**How to avoid:** The `useFrame` callback must early-return immediately when `qp("spin") === "off"`. Since `qp()` is a mount-time read (the URL is static), read it into a `const isFrozen = qp("spin") === "off"` at component level and reference that constant in the `useFrame` callback.

**Warning signs:** M9 FAIL on `?fly&spin=off`; two captures have different camera positions.

### Pitfall 4: Re-measuring M1 Without DOF Active

**What goes wrong:** M1 is re-measured on a `?cam=card` capture WITHOUT `?fx`, getting a falsely low px reading because the pre-TP6 scene has sharper apparent cards (no DOF) but the "real" final render includes DOF. Then DOF is added back and M1 isn't re-confirmed.

**Why it happens:** Quick measurement shortcut.

**How to avoid:** Always re-measure M1 on the `?cam=card&fx` capture (the full TP6 stack). The 50px TP6 reading was already with `?fx` — this is the canonical measurement. [VERIFIED: from TP6_OPERATOR_GATE.md]

### Pitfall 5: Flythrough Scope Creep Into Spectacle

**What goes wrong:** The arc grows — "just a slightly bigger swing," "let's add Y-axis tilt," "add an easing bounce" — until the motion is clearly noticeable and reads as an effect rather than a living scene.

**How to avoid:** Hard budget: X-axis only, amplitude ≤ 0.25 wu, frequency ≤ 0.3 rad/s. If the operator sees the camera moving (rather than the table breathing), it has failed the still-equivalent test. Immediately reduce amplitude by half or skip.

---

## Code Examples

### Full preset table (verified — THREE frozen money shots among the extended set)

```typescript
// Source: frontend/src/lab/TableLab.tsx lines 1046-1066
const presets: Record<string, CamPreset> = {
  // FROZEN MONEY SHOTS (TP0 — DO NOT CHANGE WITHOUT EXPLICIT GATE)
  card:  { pos: [0, 4.7, 10.6],    target: [0, 0.25, 1.2],      fov: 40 }, // POV — M1 primary
  hero:  { pos: [1.2, 5.0, 8.2],   target: [0, 0.5, 0],         fov: 32 }, // HERO ¾
  macro: { pos: [-1.7, 1.7, 2.4],  target: [-1.55, 0.05, 1.05], fov: 26 }, // MACRO detail
  // diagnostic / layout (NOT money shots)
  wide:    { pos: [0, 7.0, 11.5],  target: [0, 0.1, 0],   fov: 34 },
  close:   { pos: [1.6, 3.0, 5.4], target: [0.1, 0.6, 0.2], fov: 36 },
  top:     { pos: [0, 12, 0.001],  target: [0, 0, 0],   fov: 30 }, // layout diagnostic only
  rail:    { pos: [0, 2.4, 9.6],   target: [0, 0.15, 4.9], fov: 32 },
  gather:  { pos: [0, 6.8, 20.5],  target: [0, 0.2, 0],   fov: 40 },
  eye:     { pos: [4.5, 2.7, 12.5], target: [-0.5, 0.5, -1], fov: 44 },
  conjunto:{ pos: [1.0, 8.0, 16.5], target: [0, 0.05, 1.9], fov: 37 },
  social:  { pos: [0, 9.0, 17.6],  target: [0, 0, 1.6],  fov: 39 },
};
```

### grep-check-tp7-08.cjs structure (new file)

```javascript
// Source: pattern to follow (new code for this phase)
// CHECK 9: autoRotate={false} hardcoded (M9 invariant)
if (!/autoRotate=\{false\}/.test(tableNonComment)) {
  fail("CHECK 9 FAILED — autoRotate={false} not present. M9 determinism requires autoRotate=false hardcoded.");
}
// CHECK 10: all three frozen fovs present (32, 40, 26)
if (!/fov:\s*32/.test(tableNonComment) || !/fov:\s*40/.test(tableNonComment) || !/fov:\s*26/.test(tableNonComment)) {
  fail("CHECK 10 FAILED — one or more frozen preset fovs (32/40/26) missing from TableLab.tsx.");
}
// CHECK 11: forward-carry all 8 checks from grep-check-tp6-07.cjs
// (EffectComposer, N8AO, DepthOfField, Vignette, no Bloom, brass roughness, SoftShadows, ContactShadows)
```

### M9 re-confirm on hero (existing tool, no change)

```bash
# Source: tools/table-3d/m9-determinism.mjs (existing)
node tools/table-3d/m9-determinism.mjs --shot hero --port 5181 --out docs/table-3d/anchors/tp7-gate
# Expected output: M9: PASS (byte-identical → deterministic)
# Two PNGs: m9-hero-a.png and m9-hero-b.png with identical md5
```

---

## Recommended Wave Breakdown (2-3 Plans)

### Wave 1 — Confirmation Captures + Metrics (08-01)

**Scope:** Run the three GPU-faithful captures (card/hero/macro) against the full TP6 stack on the finished table. Re-confirm M1/M2/M9. Write `grep-check-tp7-08.cjs`. Commit anchors.

**Tasks:**
1. Start dev server. Capture `card.png`, `hero.png`, `macro.png` to `docs/table-3d/anchors/tp7-gate/` using the harness (with `?fx` for the canonical stack).
2. Run M9 double-capture on hero.
3. Run M1 re-read on `card.png` (1080p downscale, px-height measurement).
4. Run M2 manual-polygon measurement on `hero.png` and `card.png`.
5. Write `tools/table-3d/grep-check-tp7-08.cjs`: forward-carry all 8 from tp6-07 + add CHECK 9 (autoRotate=false) + CHECK 10 (fov 32/40/26 present). Run it — expect PASS.
6. Commit the three anchor PNGs + the grep-check script.

**Gate:** M1 ≥ 22px, M2 ≥ 2.0×, M9 PASS, grep-check 11/11 green. All EXPECTED to PASS without any code changes.

### Wave 2 — Optional Flythrough (08-02, Claude's discretion)

**Scope:** If Wave 1 completed without issues, add the `?fly` flythrough behind a flag. Strictly scoped: ≤ 40 new lines, X-axis arc only, freeze on `spin=off`.

**Tasks:**
1. Add `const isFly = qp("fly") !== null; const isFrozen = qp("spin") === "off";` at top of `Scene`.
2. Add a `useMemo` ref to the camera: `const camRef = useRef(null)`.
3. Add `useFrame(({ clock }) => { if (!isFly || isFrozen || !camRef.current) return; ... })`.
4. Pass `ref={camRef}` to `<PerspectiveCamera>`.
5. Verify M9 PASS on `?fly&spin=off` (freeze works).
6. Run `grep-check-tp7-08.cjs` — still must PASS.
7. Commit.

**Gate:** M9 PASS on `?fly&spin=off`. grep-check still 11/11. No new npm installs.

**Skip condition:** If any metric degrades, if the scope exceeds the budget, or if M9 fails on the frozen path — cut entirely. Non-blocking.

### Wave 3 — Operator Gate (08-03, autonomous:false)

**Scope:** Present the three canonical stills to the operator. Single question: "Is THIS the money shot of the finished table?"

**Artifacts:**
- `docs/table-3d/anchors/tp7-gate/hero.png` — the HERO ¾ TP0 preset on the finished TP6 table
- `docs/table-3d/anchors/tp7-gate/card.png` — the POV/card preset on the finished TP6 table
- `docs/table-3d/anchors/tp7-gate/macro.png` — the MACRO preset on the finished TP6 table
- M1/M2/M9 verdict table
- grep-check-tp7-08.cjs: PASS

**Gate question:** "HERO / POV-card / MACRO — do the TP0 money shots hold as the money shots of the finished table?"

**Stop-on-ambiguous:** Any ambiguous answer → keep TP0 presets. Only a clear YES locks them. Write `TP7_OPERATOR_GATE.md`.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-----------------|--------------|--------|
| autoRotate ON (pre-TP0 prototype) | autoRotate={false} hardcoded | TP0 baseline freeze | M9 determinism; cards never read upside-down from the back arc |
| fov 37 (POV candidate) | fov 40 (operator-locked) | TP0 operator gate 2026-06-10 | Final locked value; 37 is discarded |
| Top-down as a hero candidate | Top-down is layout diagnostic only | TP0 | Compositionally dead as a hero — table reads as a map, not a game |
| M1 measured at TP0 table (no cards/textures) | M1 re-measured on finished TP1-TP6 table (Fournier faces, DOF, anisotropy) | TP7 (this phase) | Richer table = larger apparent cards; expect ≥ 22px still holds |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | mm-equiv computation (fov 32 → ~72mm, fov 40 → ~57mm, fov 26 → ~88mm) | Frozen Presets table | SSOT says "~50-85mm-equiv" — macro at 26° (~88mm-equiv) is just outside the upper end; if the SSOT means the upper bound strictly, macro might warrant a note, but it is already frozen by the operator so no change is expected |
| A2 | Optional flythrough X-axis swing of 0.2 world units at hero Z=8.2 stays within ±0.5 rad azimuth clamp | Flythrough recommendation | If the geometry is scaled differently than assumed, the swing could hit the clamp and cause a jitter. Fix: reduce amplitude further to 0.1 wu. |

**If this table is empty for the implementation-critical claims:** All camera preset values and OrbitControls parameters were read directly from `TableLab.tsx` source — zero assumed values for the invariant-critical facts.

---

## Open Questions

1. **Should `?fx` become the default for the operator gate stills?**
   - What we know: Current default is `?fx` absent (TP5 exact look). The TP6 gate explicitly left this decision open for operator batch review.
   - What's unclear: The operator hasn't confirmed a preference at the TP7 gate.
   - Recommendation: Capture the three gate stills WITH `?fx` (the intended AAA look) since TP7's question is about the finished table's money shots. Note this in the gate doc so the operator can see both if desired. The `?fx` path is now the more representative final render.

2. **Do the felt-suit marks (`?marks=off`) affect the framing assessment?**
   - What we know: Marks are ON by default (the 4 suit emblems in the felt). The TP0 gate was captured with marks off (`?marks=off` was the ENCUADRE diagnostic flag).
   - What's unclear: Whether the TP7 gate captures should use the default (marks on) or marks-off for framing consistency with TP0.
   - Recommendation: Capture with marks ON (default) since TP7 evaluates the finished table — marks are part of the final scene composition.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | grep-check CJS, metric tools | Confirmed present (all prior phases ran) | Current (v18+) | — |
| Playwright + headless Chromium | `lab-shot.mjs` capture harness | Confirmed present (TP6 gate ran captures) | Installed | — |
| `sharp` (npm) | `m1-m2-m12.mjs`, `run-metrics.mjs` | Confirmed present (TP6 gate ran M1/M2/M12) | Installed | — |
| Vite dev server on port 5181 | Harness target URL | Operator starts manually before wave 1 | 5181 default | Port configurable via `--port` |
| RTX 4060 Laptop GPU (D3D11 ANGLE) | GPU-faithful captures (harness `--use-angle=d3d11`) | Confirmed present (all gates used it) | Present | Software rasterizer is explicitly rejected by the harness |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

> `workflow.nyquist_validation` not explicitly `false` in config — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (frontend) — `cd frontend && npx vitest run` |
| Secondary | Jest (game server) — `npm test` |
| Metric tools | Node ESM scripts — `node tools/table-3d/m9-determinism.mjs ...` |
| grep-check | Node CJS — `node tools/table-3d/grep-check-tp7-08.cjs` |

### Phase Requirements → Test Map

| Req | Behavior | Test Type | Command |
|-----|----------|-----------|---------|
| M9 autoRotate-off determinism | Two consecutive hero captures are byte-identical | Automated | `node tools/table-3d/m9-determinism.mjs --shot hero --port 5181` |
| M1 hole-card legibility | rank-glyph ≥ 22px at POV (1080p downscale) | Semi-auto + operator | `node tools/table-3d/m1-m2-m12.mjs` (measure output) + operator on-device confirm |
| M2 cards-vs-chips | card area ≥ 2.0× chip area at hero/POV | Manual polygon + tool | `m2CardsVsChips({ cardPolys, chipPolys })` with manually traced polygons |
| Preset invariants | fov 32/40/26 + autoRotate=false present in source | Static grep | `node tools/table-3d/grep-check-tp7-08.cjs` |
| Flythrough freeze (if included) | `?fly&spin=off` captures are byte-identical | Automated | `node tools/table-3d/m9-determinism.mjs --shot hero --port 5181` with `?fly` in URL |
| Vitest regression | No frontend regressions | Automated | `cd frontend && npx vitest run` |

### Wave 0 Gaps

- `tools/table-3d/grep-check-tp7-08.cjs` — does not yet exist; Wave 1 plan 08-01 creates it.
- `docs/table-3d/anchors/tp7-gate/` — directory does not yet exist; Wave 1 plan 08-01 creates it.

No new test framework needed. No new npm installs. Both gaps are created in Wave 1.

---

## Security Domain

This phase is entirely local lab visualization code (`frontend/src/lab/`) and metric tooling (`tools/table-3d/`). No auth, no API endpoints, no data persistence, no user input beyond URL parameters already present in the lab. ASVS categories V2/V3/V4/V6 do not apply. V5 (input validation): `qp()` reads `window.location.search` which is already a trusted, attacker-controlled surface in the lab context — the lab is a local development tool, not a production surface. No change to the security posture.

---

## Sources

### Primary (HIGH confidence — verified directly from source files)

- `frontend/src/lab/TableLab.tsx` (lines 1044-1066, 1106-1119) — preset values, OrbitControls config, `autoRotate={false}`, DOF focal distance logic
- `tools/table-3d/m1-m2-m12.mjs` — M1/M2 metric implementation, THRESHOLDS (22px, 2.0×), M1 method (px-height + operator confirm, no OCR hard gate)
- `tools/table-3d/m9-determinism.mjs` — M9 double-capture md5 method, harness invocation pattern
- `tools/table-3d/grep-check-tp6-07.cjs` — grep-check CJS pattern, 8-check structure, stripComments convention
- `docs/table-3d/TP6_OPERATOR_GATE.md` — most recent M1 reading (50px at hero with ?fx), M9 confirmed byte-identical (md5 c0c7e1247de0b279bb7572f5b2138ec4), TP6 gate shape
- `docs/table-3d/TP0_OPERATOR_GATE.md` — operator locked fov 40 (discarded 37), 3 money shots frozen 2026-06-10
- `.dev-stack/lab-shot.mjs` — harness behavior: appends `spin=off`, captures at 2880×1800 with D3D11 ANGLE, 2500ms settle
- `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP7 (lines 417-430) — SSOT acceptance criteria

### Tertiary (LOW confidence)

- mm-equivalent estimates (fov→focal-length table) — derived from standard photographic convention; no dedicated source. Tagged [ASSUMED] in the Assumptions Log.

---

## Metadata

**Confidence breakdown:**
- Preset values (pos/target/fov): HIGH — read directly from source
- OrbitControls clamp params: HIGH — read directly from source
- M1/M2/M9 re-confirm method: HIGH — tools read directly from source; TP6 gate readings verified from TP6_OPERATOR_GATE.md
- Flythrough recommendation and implementation pattern: MEDIUM — the mechanism is straightforward R3F `useFrame` but the exact code is new; the scoping advice is based on close reading of the existing code patterns
- mm-equivalent estimates: LOW — derived from convention, not verified against Three.js documentation

**Research date:** 2026-06-12
**Valid until:** Stable for the duration of the TP7 run — none of the confirmed values change unless the operator explicitly edits `TableLab.tsx`. Reconfirm if any commit touches the `cam` useMemo block before the phase executes.
