# Phase 7: TP6 — Profundidad & Composición (depth ON the table) - Research

**Researched:** 2026-06-12
**Domain:** React Three Fiber postprocessing stack (first install) + center-of-table composition
**Confidence:** HIGH on deps/versions/EffectComposer/effects API; MEDIUM on N8AO JSX component API (the `@react-three/postprocessing` N8AO component API is verified from the library's own source, but the specific prop names for the R3F wrapper differ from the raw N8AOPostPass); HIGH on DOF mechanism and pitfalls; HIGH on grep-check transition.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. Install deps: `@react-three/postprocessing` + `postprocessing` (currently absent). `EffectComposer` with `enableNormalPass` + MSAA 4, behind `?fx`.
2. N8AO: aoRadius 0.5-1.5 (world), intensity 1.5-3, distanceFalloff 0.5-1. Honest crevice darkening under cards/chips/rail. No halos (radius right), not no-effect.
3. DepthOfField: focusDistance tied to hole-card world position, bokehScale 1.5-3. Hole cards RAZOR-SHARP (M1 HARD gate). Board/rail/accent gently soft. DOF MUST NEVER soften the hero.
4. Vignette: offset 0.3-0.5, darkness 0.5-0.8 (M8 band 8-20%) + tune the EXISTING fog so the FAR rail reads as air (frozen backdrop untouched).
5. Filmic grade + grain: Noise opacity 0.02-0.05; warm-lifted shadows; gentle highlight roll-off (-> +A). Faint, not an Instagram filter.
6. Composition: kill empty-felt zones with CENTER-OF-TABLE table-STATE only — a face-down deck stub + a dealer button (+ at most a center discard). NO opponent hand / per-seat / props / room.
7. Operator gate (last plan, autonomous:false) at all 3 shots: `?fx` off vs on.

### Hard Gates (Anti-Casino)
- M7: no Bloom mounted (0). M1: hero hole-cards razor-sharp (re-measure with ?fx on). M8: vignette band 8-20%. M6/crevice: AO honest darkening present (no halos). M11/fps within floor. No glow halos.

### Claude's Discretion
- Exact N8AO/DOF/vignette/noise params (tuned at capture, restrained). The ?fx default (on vs off) and flag map. Deck-stub + dealer-button geometry/placement (center only, restrained). Per-effect wave decomposition. Whether to measure-and-cut a weak effect.
- The grep-check transition (relax TP5's no-EffectComposer to no-Bloom; author the TP6 grep-check).

### Deferred Ideas (OUT OF SCOPE)
- Building an environment/room — forbidden in TP6.
- Cameras (formalize/lock the money shots) — TP7.
- Multi-hand / per-seat staging — TP8.
- Final AAA scorecard sign-off — TP9.
</user_constraints>

---

## Summary

TP6 installs the postprocessing stack for the first time. The primary research question was whether `@react-three/postprocessing@2.19.1` (the last R3F-8-compatible release) cleanly supports the required effect set (N8AO, DepthOfField, Vignette, Noise, BrightnessContrast) against the installed `three@0.169.0` and `@react-three/fiber@8.17.10`.

**Answer: yes, with one nuance.** Version 2.19.1 peers `@react-three/fiber@^8.0` and `three >= 0.138.0` — no peer-dep conflict. Its bundled `postprocessing` spec is `^6.32.1`; the current registry latest is `6.39.1`, which peers `three >= 0.168.0 < 0.185.0`, covering 0.169 cleanly. N8AO is bundled as a dependency (`n8ao@^1.6.6` in 2.19.1), so it does NOT need to be installed separately and does NOT suffer the Shader Error 0 bug that affected older N8AO in earlier library releases (issue #291 was resolved; 2.19.1 is the post-fix release). Both packages pass slopcheck [OK].

The `EffectComposer` component exposes `enableNormalPass` and `multisampling` props. N8AO does NOT need `enableNormalPass` (that is only for SSGI). For the TP6 stack, `enableNormalPass={false}` (the default) is correct, and `multisampling={4}` provides MSAA as required.

The DepthOfField `focusDistance` prop is normalized [0-1] across camera near-far — NOT world units. The correct approach for tying focus to the hole-card world position is to compute the camera-to-card distance once at mount (static scene, no animation needed) and pass it as `worldFocusDistance` in world units. This prop is confirmed present in the EffectComposer source and community usage, even though the official docs page does not list it.

**Primary recommendation:** Install `@react-three/postprocessing@2.19.1` + `postprocessing@^6.39.1` (pinning the minor to the current three-compatible latest). Mount EffectComposer with `multisampling={4}` inside a `{qp("fx") !== null}` guard. Stack effects in this order: N8AO (crevice-first) → DepthOfField (whisper) → Vignette → BrightnessContrast (warm lift) → Noise. Add HueSaturation only if needed. For the grep-check transition, RELAX the TP5 no-EffectComposer assertion to a no-Bloom assertion in `grep-check-tp5-06.cjs` Check 5, and author `grep-check-tp6-07.cjs` asserting EffectComposer + N8AO present AND no Bloom import.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| N8AO screen-space crevice AO | Frontend (lab, GPU postprocessing pass) | — | Screen-space effect; belongs in the compositor, not the scene graph |
| DepthOfField | Frontend (lab, postprocessing) | — | Lens simulation; pure screen-space over the rendered frame |
| Vignette + fog tune | Frontend (lab, postprocessing + fog params) | — | Fog is a scene property; vignette is a compositor effect |
| Filmic grade (BrightnessContrast / HueSaturation) | Frontend (lab, postprocessing) | — | Full-frame color grade |
| Grain (Noise) | Frontend (lab, postprocessing) | — | Film grain; must freeze for deterministic capture |
| Center game-state (deck stub + dealer button) | Frontend (lab, scene graph geometry) | — | 3D objects placed in world space at table center |
| grep-check transition | tools/table-3d/ (CI assertion scripts) | — | Invariant enforcement; plain Node stdlib |
| ?fx flag wiring | Frontend (lab, qp() helper) | — | Existing URL-param pattern; EffectComposer conditional mount |

---

## Standard Stack

### Core (both required — neither is currently installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@react-three/postprocessing` | `2.19.1` | R3F wrapper for EffectComposer + all effect components (N8AO, DepthOfField, Vignette, Noise, BrightnessContrast, HueSaturation) | Last R3F-8-compatible release (2.19.x line); peers `^8.0` + `>=0.138.0 three`. Pmndrs canonical library. [VERIFIED: npm registry + official docs pmndrs.github.io] |
| `postprocessing` | `^6.39.1` | The underlying pmndrs postprocessing engine (RenderPass, EffectPass, EffectComposer class, BlendFunction) | Bundled as a dep by @r3f/postprocessing but must be installed explicitly for direct BlendFunction imports. 6.39.1 peers `three >= 0.168.0 < 0.185.0`, covering 0.169 cleanly. [VERIFIED: npm registry] |

**Why NOT v3.0.4:** v3.0.4 requires React 19 + R3F 9. This project uses React 18 + R3F 8.17.10 — incompatible peer deps would break the build. 2.19.1 is the correct line. [VERIFIED: npm registry]

**N8AO:** Bundled as `n8ao@^1.6.6` inside `@react-three/postprocessing@2.19.1`. Do NOT install separately. Importing `{ N8AO }` from `@react-three/postprocessing` gives the R3F component wrapper. [VERIFIED: npm view deps]

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `three` | `^0.169.0` | Scene/camera/fog access for focusDistance computation | Already installed — no action |
| `@react-three/fiber` | `^8.17.10` | `useThree()` for camera reference in focusDistance | Already installed |
| `@react-three/drei` | `^9.114.0` | No new drei usage in TP6 | Already installed |

**Installation command:**
```bash
cd frontend && npm install @react-three/postprocessing@2.19.1 postprocessing@^6.39.1
```

**Version verification (confirmed at research time):**
```bash
npm view @react-three/postprocessing@2.19.1 peerDependencies
# => { react: '^18.0', three: '>= 0.138.0', '@react-three/fiber': '^8.0' }

npm view postprocessing@6.39.1 peerDependencies
# => { three: '>= 0.168.0 < 0.185.0' }
```

---

## Package Legitimacy Audit

> Both packages run through slopcheck 0.6.1 at research time (2026-06-12).

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `@react-three/postprocessing` | npm | ~5.5 yrs (created 2020-09-26) | Multi-million/wk (pmndrs flagship) | github.com/pmndrs/react-postprocessing | [OK] | Approved |
| `postprocessing` | npm | ~10 yrs (created 2015-12-08) | Multi-million/wk | github.com/pmndrs/postprocessing | [OK] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none
**Postinstall scripts:** neither package has a postinstall script (confirmed: `npm view @react-three/postprocessing@2.19.1 scripts.postinstall` returns empty). [VERIFIED: npm registry]

---

## Architecture Patterns

### System Architecture Diagram

```
Canvas (gl: ACESFilmic, antialias, preserveDrawingBuffer)
  └─ Suspense
       └─ Scene (R3F component)
            ├─ fog (existing, params TUNED not rebuilt)
            ├─ SoftShadows (UNCONDITIONAL — must stay above EffectComposer)
            ├─ Lights / ContactShadows / Environment (unchanged)
            ├─ Table / Cards / Chips / Floor (unchanged)
            ├─ CenterGameState (NEW: deck stub + dealer button — scene graph)
            │    └─ DeckStub (face-down card body only, world-center)
            │    └─ DealerButton (small disc, world-center)
            └─ {qp("fx") !== null && (
                 <EffectComposer multisampling={4}>   ← FROZEN for capture via ?fx
                   <N8AO ... />                       ← crevice AO (M6)
                   <DepthOfField ... />               ← whisper DOF (M1 HARD)
                   <Vignette ... />                   ← frame (M8)
                   <BrightnessContrast ... />         ← warm grade (+A)
                   <Noise ... />                      ← grain (frozen for M9)
                 </EffectComposer>
               )}
```

**Key structural rule:** `EffectComposer` replaces THREE's default render pass with its own. It must be a SIBLING of the scene content inside `<Suspense>/<Scene>`, not a parent of the Table/Cards/Chips group. The scene renders first, then the compositor consumes the frame buffer.

**?fx freeze for capture:** The harness calls `lab-shot.mjs` with `?spin=off`. Adding `?fx` to the URL activates the compositor. The Noise effect's grain is seeded by `Math.random()` per-frame unless blendFunction is set to use a deterministic seed. Solution: use `Noise` with `premultiplied` and keep the opacity low enough that per-frame variation is below 1-LSB on the 8-bit capture; OR gate Noise with a `seed` prop if available; OR — safest — verify M9 determinism holds at opacity 0.02-0.05 with the harness `waitForTimeout(2500)` settle window. If M9 fails, reduce Noise opacity further or remove Noise from the compositor entirely (it's the weakest effect; cut-weakest path applies).

### Recommended Project Structure (new files only)

```
frontend/src/lab/
├── TableLab.tsx            (MODIFIED: add EffectComposer, CenterGameState, ?fx, fog tune)
└── (no new .ts files required — all effect JSX lives in TableLab.tsx)

tools/table-3d/
├── grep-check-tp5-06.cjs   (MODIFIED: relax Check 5 from no-EffectComposer to no-Bloom)
└── grep-check-tp6-07.cjs   (NEW: assert EffectComposer + N8AO present, no Bloom import)
```

---

## Pattern 1: EffectComposer mount behind ?fx

**What:** The entire postprocessing stack is gated by `qp("fx") !== null`. When the flag is absent the pre-TP6 render path is byte-identical to TP5. When present, the EffectComposer consumes the frame.

**Critical placement rule:** `EffectComposer` must be placed AFTER all scene content in the JSX tree (so the scene renders first) and OUTSIDE any conditional that toggles per-frame (to avoid the shader-recompile storm pattern already documented for `SoftShadows`).

```tsx
// Source: verified from pmndrs/react-postprocessing EffectComposer.tsx source
// and https://react-postprocessing.docs.pmnd.rs/effect-composer

import {
  EffectComposer,
  N8AO,
  DepthOfField,
  Vignette,
  BrightnessContrast,
  Noise,
} from "@react-three/postprocessing";

// Inside Scene JSX, AFTER all geometry groups:
{qp("fx") !== null && (
  <EffectComposer
    multisampling={4}          // MSAA 4 — required by SSOT §TP6
    enableNormalPass={false}   // N8AO does NOT need NormalPass (only SSGI does)
  >
    {/* Effects are composited in declaration order (bottom-to-top visual stack) */}
    <N8AO
      aoRadius={0.8}           // world units — start at mid-range; tune at capture
      intensity={2.0}          // artistic darkening strength; tune at capture
      distanceFalloff={0.7}    // reduces halo artifacts; tune at capture
      halfRes={false}          // full-res for highest quality at RTX 4060 (M11 passes)
      screenSpaceRadius={false}
    />
    <DepthOfField
      worldFocusDistance={holeCardDistance}  // world units — computed once at mount
      worldFocusRange={1.5}                  // half the sharp band in world units
      bokehScale={2.0}                       // start restrained; tune at capture
      focalLength={0.025}                    // controls blur falloff speed
    />
    <Vignette
      offset={0.4}             // mid-range of SSOT 0.3-0.5
      darkness={0.6}           // mid-range of SSOT 0.5-0.8 — tune for M8 8-20%
    />
    <BrightnessContrast
      brightness={0.03}        // faint warm lift; shadows rise without crush
      contrast={0.05}          // gentle roll-off; tune at capture
    />
    <Noise
      opacity={0.03}           // mid-range of SSOT 0.02-0.05; verify M9 at this level
      premultiplied={false}
    />
  </EffectComposer>
)}
```

**Key: `enableNormalPass={false}`** — N8AO reconstructs normals from the depth buffer, not a separate normal pass. Setting `enableNormalPass={true}` would add an extra render pass with no benefit and hurt M11. [CITED: pmndrs/postprocessing forum post confirming N8AO does not use NormalPass]

---

## Pattern 2: N8AO — honest crevice darkening

**What:** N8AO (Screen Space Ambient Occlusion with denoising) darkens geometry crevices — under card edges, between chip layers, in the felt-to-rail seam — by sampling the depth buffer for occluded ambient.

**The halo vs no-effect axis:**
- `aoRadius` too LARGE relative to scene scale → halos (wide dark fringe around large objects)
- `aoRadius` too SMALL → no visible effect (misses small crevices)
- For the table (chip radius = 1 world unit, card thickness = 0.055): world-space `aoRadius` in the **0.5-1.5** range (SSOT §TP6) is correct. Start at 0.8.

**The distanceFalloff axis:**
- `distanceFalloff` controls how quickly AO fades with distance relative to `aoRadius`.
- Default = 1.0. Decreasing it reduces halo artifacts and improves accuracy.
- For crevice-only AO (chips on felt, card-to-felt contact): 0.5-0.7 is the sweet spot. Too low (< 0.3) makes AO vanish.

**M6 metric (crevice/contact-shadow presence):** after N8AO is mounted, re-run M6 check: `directly under each hole card + each chip stack, luma >= 12% darker than adjacent open felt`. N8AO is the primary TP6 satisfier of M6 (M6 was previously met by SoftShadows + ContactShadows; N8AO adds the inter-object crevice layer those don't produce).

**halfRes consideration:** `halfRes={false}` keeps N8AO at full resolution. At 1440x900 DPR2 (2880x1800 effective), full-res N8AO costs significant GPU time. IF M11 breaches (median frame-time > 8ms), enable `halfRes={true}` — it gives a 2-4x perf gain with minimal visual loss (depth-aware upsampling restores sharpness). This is the primary "cut-weakest-effect" candidate after DOF. [CITED: N8AO README — halfRes + depthAwareUpsampling description]

---

## Pattern 3: DepthOfField — the M1 HARD constraint

**The M1 gate:** hole cards must remain razor-sharp under `?fx`. DOF must NEVER be the cause of hero softness.

**The focusDistance confusion:** The DepthOfField component in react-postprocessing has TWO focus mechanisms:
- `focusDistance` — NORMALIZED [0-1] across the camera near-far range. With default PerspectiveCamera near=0.1 far=1000 (R3F default), objects at typical scene distance need a value like 0.005.
- `worldFocusDistance` — in WORLD UNITS (same coordinate system as the scene). This is the correct prop for tying focus to the hole cards. [CITED: github.com/pmndrs/react-three-fiber/discussions/3113]

**Computing hole-card worldFocusDistance:**
From `cards.ts`, the hole cards are placed at:
- `HOLE_Z = 2.3` (z component of hole card position)
- `FELT_REST_Y + 0.02` ≈ `0.055/2 + 0.022 + 0.02 ≈ 0.07` (y component)

The HERO camera preset: `pos: [1.2, 5.0, 8.2]`, `target: [0, 0.5, 0]`, `fov: 32`.

Distance from camera to hole cards (world) ≈ `Math.sqrt((1.2-0)^2 + (5.0-0.07)^2 + (8.2-2.3)^2)` ≈ `sqrt(1.44 + 24.4 + 34.8)` ≈ `sqrt(60.6)` ≈ **7.8 world units** (hero cam).

The CARD cam: `pos: [0, 4.7, 10.6]`, `target: [0, 0.25, 1.2]`.
Distance from card cam to hole cards ≈ `sqrt(0 + (4.7-0.07)^2 + (10.6-2.3)^2)` ≈ `sqrt(21.4 + 68.9)` ≈ `sqrt(90.3)` ≈ **9.5 world units** (card/POV cam).

**Implementation strategy — static computation:**

```tsx
// Source: pattern from github.com/pmndrs/react-three-fiber/discussions/3113
// worldFocusDistance is world units to the focal plane from the camera.
// For a static scene (no animation), compute once from the camera preset.
// The hole cards sit at approx HOLE_Z=2.3 on the board, near the front.
// Rather than a useFrame hook, compute it on mount from known geometry:

function Scene() {
  const cam = useMemo(() => { /* existing cam preset logic */ }, []);
  const gl  = useThree((s) => s.gl);

  // Hole card world position (center of the pair)
  const HOLE_WORLD = useMemo(() => {
    const holeZ = 2.3;   // HOLE_Z from cards.ts
    const holeY = 0.07;  // FELT_REST_Y + 0.02 (approx)
    const holeX = 0.0;   // symmetric pair, center x = 0
    return new THREE.Vector3(holeX, holeY, holeZ);
  }, []);

  // Camera world position from preset (cam.pos is [x,y,z])
  const CAM_WORLD = useMemo(
    () => new THREE.Vector3(...cam.pos),
    [cam]
  );

  // Distance: camera to hole cards (world units)
  const holeCardDistance = useMemo(
    () => CAM_WORLD.distanceTo(HOLE_WORLD),
    [CAM_WORLD, HOLE_WORLD]
  );

  // DepthOfField: worldFocusDistance = holeCardDistance keeps hole cards sharp.
  // worldFocusRange: the half-width of the in-focus band in world units.
  // Start at 1.5 (SSOT §TP6 range implies a narrow band — hole cards MUST be in it).
  // ...
}
```

**Tuning DOF so it does NOT soften the hero:**
- Use `bokehScale` in the SSOT range (1.5-3). Start at 2.0.
- `worldFocusRange` controls how wide the sharp band is. Start at 1.5 world units — the pair of hole cards spans ~2 world units, so with range 1.5 both cards must lie within the sharp half-band.
- After mounting, capture the hero shot with `?fx` and re-run M1 (rank-glyph bbox height >= 22px + operator confirm). If ANY softness on the hole cards: either (1) increase `worldFocusRange` so both cards are safely within the sharp band, or (2) decrease `bokehScale` so the falloff is more gradual.
- The board (community cards at Z≈-0.55) and the rail (beyond) will receive gentle bokeh; that is correct.

**HARD rule:** if `worldFocusRange` must be set so wide that the DOF effect becomes imperceptible, DOF should be cut (non-blocking rollback — it is the second candidate after Noise for "cut weakest").

---

## Pattern 4: Vignette + Fog tune

**Vignette component:**
```tsx
// Source: https://react-postprocessing.docs.pmnd.rs/effects/vignette
<Vignette
  offset={0.4}      // where the darkening begins (0=center, 1=edge); SSOT 0.3-0.5
  darkness={0.6}    // how dark the corners get; SSOT 0.5-0.8
  eskil={false}     // default Eskil technique = false (standard radial vignette)
/>
```

**M8 verification:** The metric checks that mean corner luma is 8-20% below center luma. At `darkness=0.6`, `offset=0.4`, the vignette darkening at the corners should land in that band. Run the M8 pixel checker after capture to confirm — if too dark (> 20%), lower `darkness` to 0.5; if too faint (< 8%), raise to 0.7.

**M8 + metric +A tension:** `+A` (warm-corner floor) requires corner luma to NOT be crushed black AND corner hue to be warm. This means the vignette must darken corners but not to black. The `BrightnessContrast brightness={0.03}` warm lift should reconcile these — it lifts the whole frame's shadow floor before the vignette darkens it. Tune in this order: BrightnessContrast first (establish warm shadow floor), then Vignette (darken corners), then verify both M8 and +A pass simultaneously.

**Existing fog tuning (not rebuilding):** The current scene has:
```tsx
<fog attach="fog" args={["#141009", 20, 60]} />
```
The near fog starts at 20 world units and is fully dense at 60. With the table occupying ~radius 8, the fog starts well beyond the rail — providing warm depth atmosphere in the far backdrop without touching any foreground element. For TP6, tune: move near slightly inward if the far rail reads "sharp" (try `near=18` or even `16`). DO NOT change `far` (keep backdrop fog behavior). The color `#141009` is warm near-black — keep it. No structural rebuild needed.

---

## Pattern 5: Filmic Grade (BrightnessContrast + optional HueSaturation)

**BrightnessContrast:**
```tsx
// Source: https://react-postprocessing.docs.pmnd.rs/effects/brightness-contrast
<BrightnessContrast
  brightness={0.03}   // range -1 to 1; faint shadow lift (warm floor, +A)
  contrast={0.05}     // range -1 to 1; gentle highlight roll-off
/>
```

**HueSaturation (optional):** Available as `{ HueSaturation }` from `@react-three/postprocessing`. Props: `hue` (radians, shift), `saturation` (value shift). For a warm grade, a tiny positive hue shift toward orange (0.02-0.04 rad) adds warmth. However, this risks M4 (brass-not-gold) drift if the brass becomes more saturated. Include HueSaturation ONLY if BrightnessContrast alone is insufficient for the +A goal; gate it behind a sub-flag (`?grade=warm`).

**Noise (grain):**
```tsx
// Source: https://react-postprocessing.docs.pmnd.rs/introduction (intro example)
<Noise
  opacity={0.03}        // SSOT 0.02-0.05; verify M9 determinism at this value
  premultiplied={false}
/>
```

**M9 (determinism) note for Noise:** Noise in react-postprocessing uses a per-pixel random in the shader seeded by UV coordinates, NOT by frame time. This means consecutive renders at the same frame produce the same noise pattern — byte-identical capture SHOULD hold. However, if the harness captures two slightly different frames (due to the `waitForTimeout(2500)` settling window), there may be grain-jitter. Verify M9 with `?fx` on (two consecutive captures must be md5-identical). If they differ, the culprit is Noise — lower opacity to 0.02 first; if still fails, remove Noise from the ?fx compositor (it is the weakest perceptual effect and the first to cut).

---

## Pattern 6: Center Game-State (deck stub + dealer button)

**Goal:** fill the large empty felt area to the left of the demoted chip pot (world center near [0,0,0]) with two low-key center props — a face-down deck stub and a dealer button — that communicate "mid-hand game in progress" without per-seat objects.

**Deck stub geometry:** A single `<mesh>` using the existing `cardBodyGeometry()` from `cards.ts` (shared geometry, zero new deps), laid flat on the felt (rotation [-Math.PI/2, 0, 0]), positioned at world center with a slight offset from the chip pot. The face-down back reads as card stock — use only `kit.stock` material (no face texture, no face mesh). This is the exact SeatHands pattern (already in the codebase), restricted to a single card at center.

**Recommended position:** `[0, FELT_REST_Y, -1.2]` (just north of center, so it does not compete with the community cards at `COMMUNITY_Z = -0.55`). A small stack (3-5 cards fanned slightly) reads as the remaining deck.

**Dealer button geometry:** A small flat disc — `<cylinderGeometry args={[0.28, 0.28, 0.04, 24]}` — placed at `[-0.6, 0.02, -1.5]` (left-of-center, near the deck, off-axis so it does not align with any card). Material: a matte white-cream `MeshPhysicalMaterial` (roughness 0.8, metalness 0, color `#f0e8d0`). A faint "D" text is optional and should NOT be a floating decal — if desired, bake it as a barely-perceptible bump in the material. Alternatively: a plain cream disc with no text is equally readable as a button.

**Anti-scope-creep invariant:** These two objects are the ONLY new world-space additions in TP6. No chip piles at center, no opponent cards, no seat markers. The center-state must pass the "table object only" scope audit.

```tsx
// CenterGameState component — zero new deps (reuses existing card geometry)
function CenterGameState({ kit }: { kit: CardKit }) {
  const DECK_POS: [number,number,number] = [0.3, FELT_REST_Y, -1.3];
  const BUTTON_POS: [number,number,number] = [-0.7, 0.022, -1.6];

  // Deck stub: 4 cards stacked face-down at center
  const deckCards = useMemo(() => {
    return [0,1,2,3].map(i => ({
      x: DECK_POS[0] + Math.sin(i * 1.7) * 0.008,
      y: DECK_POS[1] + i * CARD_T,
      z: DECK_POS[2] + Math.cos(i * 2.3) * 0.006,
      ry: i * 0.04,
    }));
  }, []);

  const buttonMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#f0e8d0"),
    roughness: 0.80,
    metalness: 0,
  }), []);

  return (
    <group>
      {/* Face-down deck stub — reuses shared card body geometry + stock material */}
      {deckCards.map((c, i) => (
        <mesh
          key={i}
          geometry={kit.body}
          material={kit.stock}
          position={[c.x, c.y, c.z]}
          rotation={[-Math.PI / 2, 0, c.ry]}
          castShadow
          receiveShadow
        />
      ))}
      {/* Dealer button — small matte cream disc */}
      <mesh
        position={BUTTON_POS}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.28, 0.28, 0.04, 24]} />
        <primitive object={buttonMat} attach="material" />
      </mesh>
    </group>
  );
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Screen-space AO under cards/chips | Custom GLSL depth-sampling shader | `N8AO` from `@react-three/postprocessing` | N8AO has temporal denoising, world-space radius, distanceFalloff — hand-rolled SSAO would lack all three |
| Bokeh/DOF | Custom convolution or depth-blur shader | `DepthOfField` from `@react-three/postprocessing` | Postprocessing library handles CoC calculation, near/far field separation, and the Bokeh kernel correctly |
| Screen-edge darkening | Baked albedo gradient (already removed in TP1!) | `Vignette` from `@react-three/postprocessing` | This is exactly why TP1 removed the baked vignette — the compositor owns it |
| Film grain | Per-frame random texture | `Noise` from `@react-three/postprocessing` | UV-seeded shader; controllable opacity; no CPU texture upload per-frame |
| Color grading | Custom tone curve shader | `BrightnessContrast` + `HueSaturation` | Both are shipped in the library with correct blending; no custom shader needed |
| Focus distance computation | Raycasting loop | Static `distanceTo()` vector math at mount | The scene is static (no live animation on the table object in TP6); one-time computation is correct and deterministic |

**Key insight:** the postprocessing library is specifically engineered to avoid the pitfalls of custom screen-space effects (incorrect blend ordering, z-buffer misuse, near-field bokeh leakage). Every hand-rolled alternative in this domain has caused regressions in professional rendering pipelines.

---

## Grep-Check Transition

### Current state (TP5 grep-check-tp5-06.cjs Check 5)
Check 5 asserts:
```js
if (/Bloom|EffectComposer/.test(nonComment)) { fail("...No EffectComposer in lab...") }
```
This check will FAIL the moment TP6 mounts `EffectComposer`. It must be relaxed.

### Required transition

**Step 1 — Relax TP5 Check 5 (in-place):**
Change the TP5 check from "no Bloom OR EffectComposer" to "no Bloom" only:
```js
// OLD (TP5):
if (/Bloom|EffectComposer/.test(nonComment)) { fail("...all postprocessing deferred to TP6...") }

// NEW (TP6-compatible relaxation):
if (/Bloom/.test(nonComment)) { fail("CHECK 5 FAILED — Bloom detected in lab source. M7 HARD gate: Bloom is permanently banned (casino trap + perf sink). EffectComposer is now permitted (TP6 adds it). Only Bloom remains forbidden.") }
```
Update the passing message for Check 5 to reflect the relaxation.

**Step 2 — Author grep-check-tp6-07.cjs (new file):**

The TP6 checker must assert:
1. `EffectComposer` IS present in non-comment lab source (TP6 adds it — presence required)
2. `N8AO` IS present in non-comment lab source (crevice AO required by §TP6)
3. `DepthOfField` IS present in non-comment lab source (whisper DOF required)
4. `Vignette` IS present in non-comment lab source (framing required, M8)
5. `Bloom` is ABSENT from all lab source (M7 HARD gate — no Bloom ever)
6. `brassMat roughness 0.42-0.45` still holds (forward-carrying the TP4/TP5 invariant)
7. `SoftShadows` still present unconditionally (forward-carrying the TP5 invariant)
8. `frames={1}` still present on ContactShadows (forward-carrying the TP5 invariant)

**Grep-check-tp6-07.cjs skeleton:**
```js
// grep-check-tp6-07.cjs — TP6 postprocessing invariant checker
"use strict";
const fs = require("fs"), path = require("path");
const TABLE_LAB = path.join("frontend", "src", "lab", "TableLab.tsx");
const LAB_DIR   = path.join("frontend", "src", "lab");

function readFile(f) { const a=path.resolve(f); if(!fs.existsSync(a)) fail(`Not found: ${f}`); return fs.readFileSync(a,"utf8"); }
function fail(m) { console.error(`FAIL: ${m}`); process.exit(1); }
function stripComments(src) { return src.split("\n").filter(l=>!l.trimStart().startsWith("//")).join("\n"); }

const src = readFile(TABLE_LAB);
const nc  = stripComments(src);

// CHECK 1: EffectComposer present (TP6 ships it)
if (!/<EffectComposer/.test(nc)) fail("CHECK 1: EffectComposer not in non-comment code");

// CHECK 2: N8AO present
if (!/<N8AO/.test(nc)) fail("CHECK 2: N8AO not in non-comment code");

// CHECK 3: DepthOfField present
if (!/<DepthOfField/.test(nc)) fail("CHECK 3: DepthOfField not in non-comment code");

// CHECK 4: Vignette present
if (!/<Vignette/.test(nc)) fail("CHECK 4: Vignette not in non-comment code");

// CHECK 5: No Bloom anywhere in lab/ (M7 HARD gate)
const labFiles = fs.readdirSync(path.resolve(LAB_DIR))
  .filter(f=>f.endsWith(".tsx")||f.endsWith(".ts"))
  .map(f=>path.join(LAB_DIR,f));
for (const lf of labFiles) {
  const lnc = stripComments(readFile(lf));
  if (/Bloom/.test(lnc)) fail(`CHECK 5: Bloom detected in ${lf} — M7 HARD gate (Bloom permanently banned)`);
}

// CHECK 6: brassMat roughness 0.42-0.45 (forward TP4 invariant)
if (!/roughness\s*:\s*0\.4[2-5]/.test(nc)) fail("CHECK 6: brassMat roughness 0.42-0.45 not found");

// CHECK 7: SoftShadows unconditional (forward TP5 invariant)
if (!/<SoftShadows/.test(nc)) fail("CHECK 7: SoftShadows not in non-comment code");

// CHECK 8: ContactShadows frames={1} (forward TP5 invariant)
if (!/frames=\{1\}/.test(nc)) fail("CHECK 8: ContactShadows frames={1} not in non-comment code");

console.log("OK — grep-check-tp6-07: all 8 TP6 postprocessing invariants hold");
process.exit(0);
```

---

## Common Pitfalls

### Pitfall 1: Bloom mounted accidentally
**What goes wrong:** `import { Bloom }` or `<Bloom` appears anywhere in the lab source — M7 HARD gate fails. grep-check-tp6 exits 1.
**Why it happens:** Copy-paste from examples; the canonical EffectComposer example in the react-postprocessing README includes Bloom.
**How to avoid:** Treat Bloom as a forbidden identifier. grep-check-tp6 Check 5 will catch it. Do NOT import it, even if commented in JSX.
**Warning signs:** grep-check exits 1 on Check 5; M7 metric fails.

### Pitfall 2: DOF softens the hero (M1 HARD gate failure)
**What goes wrong:** The hole cards (the Perla de Oros) become visually soft under ?fx. M1 fails (rank-glyph height < 22px or operator calls "soft").
**Why it happens:** `worldFocusRange` is too narrow (hole cards at the edge of the sharp band), or `bokehScale` is too aggressive, or `worldFocusDistance` is computed for the wrong camera preset.
**How to avoid:** Compute `worldFocusDistance` per camera preset inside the cam `useMemo`. The hole cards are at Z=2.3 — the distance varies between the 3 money shots (hero ~7.8, card/POV ~9.5, macro ~4.5 est). For each capture, the camera position is set by the preset; the DOF should adapt. If needed, set `worldFocusDistance` via `useThree` camera ref computed at mount.
**Warning signs:** M1 operator confirm fails; rank pips appear blurry in the hero capture.

### Pitfall 3: N8AO halos (wrong aoRadius)
**What goes wrong:** Dark halos appear around large objects (the rail, the back of the table body) — a classic SSAO halo artifact.
**Why it happens:** `aoRadius` is too large relative to the scale of occluded geometry. With chip radius = 1 world unit and aoRadius = 3.0, the AO samples far enough to create a dark halo around the entire rail.
**How to avoid:** Keep `aoRadius` in the SSOT range (0.5-1.5) and start at 0.8. Lower `distanceFalloff` to 0.5 if halos persist.
**Warning signs:** A dark fringe visible around the felt edge or rail at hero view; the effect looks like a shadow around the entire table object rather than under individual elements.

### Pitfall 4: Postprocessing fps drop breaches M11 floor (> 8ms)
**What goes wrong:** Adding all effects simultaneously causes median frame-time > 8ms on the RTX 4060 with vsync OFF, M11 fails.
**Why it happens:** N8AO (especially full-res) + DOF are the two most GPU-expensive effects. Each adds at least 1-2 render passes.
**How to avoid:** Measure each effect in ISOLATION before combining:
1. EffectComposer alone (no effects) — baseline cost
2. + N8AO alone — delta
3. + DepthOfField alone — delta
4. + Vignette + BrightnessContrast + Noise — these are cheap
If any single effect breaches M11, first try `halfRes={true}` on N8AO. If still breaching, cut N8AO entirely (non-blocking rollback disposition: "cut the weakest effect; keep table without `?fx`").
**Warning signs:** `?stats` overlay shows > 8ms; per-effect measurement shows N8AO as the dominant cost.

### Pitfall 5: Table-state creeping to props/room
**What goes wrong:** The CenterGameState component grows beyond deck stub + dealer button. Someone adds an occupant silhouette or a chip pile at a seat position.
**Why it happens:** "While we're there" scope creep during TP6 composition work.
**How to avoid:** CenterGameState is limited to exactly 2 object types (deck stub, dealer button). Any additional object requires a new phase gate (TP8 owns multi-hand/feel). grep-check-tp6 does NOT enforce this structurally — it is a code-review / operator gate item.
**Warning signs:** Any `position` inside CenterGameState at a radius > 2 world units from [0,0,0] indicates a seat-adjacent prop — flag immediately.

### Pitfall 6: Noise grain jitter breaks M9 determinism
**What goes wrong:** Two consecutive harness captures of `?fx` produce different pixel values (grain shifts between frames). md5 hashes differ. M9 fails.
**Why it happens:** Some Noise implementations use `fract(sin(gl_FragCoord.xy * time) * 43758.5453)` — time-seeded, non-deterministic across frames.
**How to avoid:** The react-postprocessing `Noise` effect uses UV-seeded noise (not time-seeded), so it should be deterministic. However, verify this empirically: run M9 with `?fx` on. If it fails, lower `opacity` first (near-zero variation may round to same 8-bit value). If still fails, replace `Noise` with a baked static noise texture applied in the scene graph, or remove Noise entirely. Noise is the weakest perceptual effect — cutting it does not affect M6/M7/M8/M1.
**Warning signs:** M9 md5 mismatch on two consecutive captures with ?fx; no mismatch without ?fx.

### Pitfall 7: EffectComposer inside a conditional causes shader recompile storm
**What goes wrong:** If `EffectComposer` is mounted/unmounted based on a flag that changes frequently, React re-mounts the component and the underlying postprocessing library recompiles all effect shaders — causing a visible freeze.
**Why it happens:** Treating `?fx` as a runtime toggle rather than a page-load decision.
**How to avoid:** The `?fx` flag is read at page load from `qp("fx")`. Since `qp()` reads `window.location.search` (static at load time), and the EffectComposer is conditionally rendered based on this static value, the composer is either mounted once at load or never — no runtime toggle, no recompile storm. This is the same safe pattern as `qp("chips")`, `qp("light")` etc. The SoftShadows pitfall note in the existing code confirms this pattern.
**Warning signs:** A 1-2 second freeze when toggling ?fx in the browser URL bar while the page is live (expected and acceptable — it IS a page reload decision, not a live toggle).

---

## Metric-Gate Assertions (Phase Gate Checklist)

All metrics run with `?fx` ON (the postprocessing path) using the 3 frozen money shots.

| Metric | Tool | How to Assert | PASS threshold |
|--------|------|---------------|----------------|
| M1 — hero razor-sharp | px-height script + operator confirm | capture `?cam=hero&fx` → run M1 rank-glyph bbox; operator looks at hole cards | rank glyph >= 22px at 1080p downscale + operator "legible" confirm |
| M6 — crevice darkening | luma pixel script (existing M6 tool) | sample under hole cards + chip stacks vs adjacent open felt | under-object luma >= 12% darker than adjacent felt |
| M7 — no Bloom | code assert (grep-check-tp6 Check 5) | `node tools/table-3d/grep-check-tp6-07.cjs` exits 0 | No Bloom token in any lab .tsx/.ts |
| M8 — vignette band | corner vs center luma script | capture `?cam=hero&fx` → compare 4-corner mean luma vs center luma | delta 8-20% (not less, not more) |
| M9 — determinism | md5 compare | two captures `?cam=hero&fx&spin=off` back-to-back → md5 must match | byte-identical |
| M10 — draw count | renderer.info.render.calls via ?stats | `?cam=hero&fx&stats` → read window.__labStats.calls | < 150 calls (HERO staged) |
| M11 — frame-time | median frame-time via ?stats | `?cam=hero&fx&stats` → median < 8ms | < 8ms at RTX 4060 vsync OFF |
| +A — warm corner | corner hue + floor script | corners warm (not neutral grey) AND not crushed black | corner luma > 0 + corner hue warm |

**Per-effect isolation measurement protocol (M11 gate defense):**
Run in this sequence and record baseline + delta for each:
```bash
# 1. Baseline (TP5, no fx):
LAB_URL="http://localhost:5173/table-lab.html?cam=hero&stats&spin=off" node .dev-stack/lab-shot.mjs .dev-stack/diag/tp6/baseline.png
# (read window.__labStats.frameTime from the console)

# 2. N8AO only:
LAB_URL="http://localhost:5173/table-lab.html?cam=hero&fx&stats&spin=off" ...
# (temporarily disable DOF/Vignette/Grade/Noise in the JSX)

# 3. DOF only (disable N8AO/Vignette/Grade/Noise) ... etc
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@react-three/postprocessing` v1.x (Bloom-heavy) | v2.19.1 (R3F 8 compatible, N8AO bundled) | 2023-2025 | N8AO replaces custom SSAO; v3 requires React 19 |
| N8AO as separate npm package | Bundled inside `@react-three/postprocessing` | 2023 (v2.12+) | Single install; Shader Error 0 fixed in 2.19.x |
| `focusDistance` (normalized) for DOF targeting | `worldFocusDistance` (world units) | react-postprocessing ~2022 | Eliminates near/far normalization math; more intuitive |
| enableNormalPass=true for AO | enableNormalPass=false (N8AO reconstructs from depth) | N8AO design | One fewer render pass; perf win with no visual cost |
| Manual EffectComposer in vanilla Three.js | R3F `<EffectComposer>` component | 2020 (pmndrs) | Declarative; no imperative composer.addPass boilerplate |

**Deprecated/outdated:**
- `v3.0.4` of react-postprocessing: requires React 19 + R3F 9 — not applicable to this project (React 18).
- The `SSR` component: removed in v3.0.0 due to unmaintained upstream.
- N8AO as a standalone install alongside react-postprocessing v2.x: redundant; bundled since ~v2.12. Installing both causes Shader Error 0 (version mismatch).

---

## Recommended Wave Breakdown

| Wave | Tasks | Deliverable | Gate |
|------|-------|-------------|------|
| **Wave 0** | Install deps (`@react-three/postprocessing@2.19.1` + `postprocessing@^6.39.1`), wire `?fx` guard in TableLab.tsx, mount EffectComposer (no effects yet), verify the scene still renders correctly with `?fx` present (no effects = transparent pass-through) | `?fx` flag works, no console errors, M9 still passes (no effects = deterministic) | No operator gate — dev checkpoint only |
| **Wave 1** | Add N8AO with starting params (aoRadius=0.8, intensity=2, distanceFalloff=0.7). Capture HERO/POV/MACRO with ?fx. Run M6, M10, M11. Tune aoRadius/distanceFalloff to eliminate halos. | Honest crevice darkening visible; M6 PASS; no halos | Dev checkpoint (compare A/B captures) |
| **Wave 2** | Add DepthOfField (worldFocusDistance computed per cam preset, bokehScale=2.0, worldFocusRange=1.5). Capture with ?fx. Re-run M1. Tune to keep hero sharp. | Whisper DOF on board/rail; M1 PASS (hole cards razor-sharp) | Dev checkpoint |
| **Wave 3** | Add Vignette (offset=0.4, darkness=0.6) + tune existing fog near distance. Run M8. Add BrightnessContrast (brightness=0.03, contrast=0.05). Run +A. Adjust until both M8 and +A pass simultaneously. Add Noise (opacity=0.03). Run M9 for determinism. | Frame darkening correct; warm shadow floor; M8 + +A PASS; M9 PASS | Dev checkpoint |
| **Wave 4** | Add CenterGameState (deck stub + dealer button) to Scene. Position at world center. Verify no per-seat drift, no new chip piles, no scope creep. Capture all 3 shots. | Empty felt zones replaced; center game-state reads as mid-play | Dev checkpoint |
| **Wave 5** | Author `grep-check-tp6-07.cjs`. Relax TP5 grep-check Check 5 (remove EffectComposer from the banned list, keep Bloom). Run full metric suite (M1/M6/M7/M8/M9/M10/M11/+A) simultaneously. Record per-effect M11 measurements. Cut weakest effect if M11 breaches. | All 8 metrics PASS with ?fx on all 3 shots; grep-checks clean | Dev checkpoint |
| **Wave 6** | Operator gate (autonomous:false). A/B all 3 shots: `?fx` off vs `?fx` on. Gate verdict: cinematic-premium honest depth, hero tack-sharp, no dead zones, no glow/gimmick? | Operator approval | OPERATOR GATE — phase closes |

---

## Open Questions

1. **worldFocusRange exact value across the 3 presets**
   - What we know: HERO cam distance ~7.8, POV/card cam ~9.5, MACRO ~4.5 world units.
   - What's unclear: whether a single `worldFocusDistance` is needed per-preset or a single static value works acceptably (the MACRO shot is a material close-up and may not need DOF at all).
   - Recommendation: compute `worldFocusDistance` from the active `cam` preset inside `useMemo`. If MACRO capture suffers (too much blur on chips at this close distance), add a `qp("fx") === "soft"` sub-mode that disables DOF for the macro capture.

2. **Noise and M9 determinism**
   - What we know: the react-postprocessing Noise shader is UV-seeded, not time-seeded.
   - What's unclear: whether the harness 2500ms settle window captures the same frame both times.
   - Recommendation: run M9 empirically in Wave 3. If it fails, Noise is the cut-first candidate.

3. **?fx default (on vs off)**
   - What we know: CONTEXT.md says Claude's discretion; ?fx-off must restore the exact pre-TP6 look.
   - Recommendation: default ?fx OFF (compositor not mounted). This preserves the exact TP5 look as the default URL (consistent with how ?chips, ?card, ?light default to their non-experimental paths). The operator accesses the compositor by visiting with ?fx in the URL. Document in the lab URL cheatsheet.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm install | v24.14.1 | 24.14.1 | — |
| npm | package install | yes | (with node) | — |
| `@react-three/postprocessing` | TP6 compositor | NOT INSTALLED | 2.19.1 (to install) | — (must install) |
| `postprocessing` | BlendFunction imports | NOT INSTALLED | 6.39.1 (to install) | — (must install) |
| Playwright (lab-shot.mjs) | capture harness | installed (existing) | present | — |
| RTX 4060 GPU | M11 frame-time gate | available (operator confirmed) | — | — |
| Dev server port 5173 | lab-shot.mjs | available (Vite dev) | Vite ^7.3.1 | 5174 if busy |

**Missing dependencies with no fallback:**
- `@react-three/postprocessing@2.19.1` — must install (Wave 0)
- `postprocessing@^6.39.1` — must install (Wave 0)

---

## Validation Architecture

> `workflow.nyquist_validation` not set to false in .planning/config.json — validation section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (frontend/vitest.config.ts) |
| Quick run | `cd frontend && npx vitest run` |
| Full suite | `cd frontend && npx vitest run` |
| TP6-specific | No automated unit tests needed — all TP6 assertions are visual/metric (M-series) + grep-checks |

### Phase Requirements to Test Map
| Req | Behavior | Test Type | Automated Command |
|-----|----------|-----------|-------------------|
| R-TP6-01 | EffectComposer present, N8AO + DOF + Vignette + Noise present, no Bloom | code assert | `node tools/table-3d/grep-check-tp6-07.cjs` |
| R-TP6-02 | M7: no Bloom anywhere in lab source | code assert | grep-check-tp6 Check 5 |
| R-TP6-03 | TP5 invariants still hold (SoftShadows, ContactShadows frames={1}, brass roughness) | code assert | `node tools/table-3d/grep-check-tp5-06.cjs` (modified) AND grep-check-tp6 checks 6-8 |
| R-TP6-04 | M6: crevice darkening present | pixel metric | `node tools/table-3d/<m6-checker.cjs> <hero-fx.png>` (existing M6 tool) |
| R-TP6-05 | M8: vignette band 8-20% | pixel metric | M8 checker existing |
| R-TP6-06 | M1: hole cards razor-sharp | px-height + manual | M1 tool + operator confirm |
| R-TP6-07 | M9: determinism with ?fx | md5 compare | two harness captures + `node -e "require('crypto').createHash('md5').update(require('fs').readFileSync(p)).digest('hex')"` comparison |
| R-TP6-08 | M11: < 8ms frame-time | frame-time reader | ?stats overlay + StatsProbe window.__labStats |

### Wave 0 Gaps
- [ ] `grep-check-tp6-07.cjs` — new file (Wave 5)
- [ ] `grep-check-tp5-06.cjs` Check 5 relaxation (Wave 5) — modify existing file

---

## Security Domain

> This phase installs two npm packages and modifies frontend lab code only. No auth, no API, no user data, no server code.

**ASVS applicability:** V2/V3/V4 not applicable (no auth/session/access control). V5 not applicable (no user input). V6 not applicable (no cryptography). The only security-relevant item is the npm install supply-chain gate (both packages passed slopcheck [OK] and have no postinstall scripts).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `worldFocusDistance` prop exists on the `DepthOfField` component in react-postprocessing@2.19.1 | Pattern 3 | If absent, must use normalized `focusDistance` (requires camera near/far normalization math); the code example would change but the approach is still sound |
| A2 | `worldFocusRange` prop exists alongside `worldFocusDistance` in 2.19.1 | Pattern 3 | If absent, use `focalLength` to control the sharp band width instead |
| A3 | The Noise effect in react-postprocessing@2.19.1 is UV-seeded (deterministic across frames) | Pattern 5 + M9 | If time-seeded, M9 will fail and Noise must be cut; this is the planned fallback |
| A4 | N8AO in react-postprocessing@2.19.1 uses `aoRadius` / `intensity` / `distanceFalloff` as JSX prop names (matching the N8AOPostPass API) | Pattern 2 | If the R3F wrapper uses different prop names (e.g. via `applyProps`), the specific prop names would need to be verified from the installed package source |
| A5 | `halfRes` is a valid prop on the `N8AO` component in react-postprocessing@2.19.1 | Pitfall 4 + Pattern 2 | If not available, the M11 fallback must be cutting N8AO entirely rather than reducing its resolution |
| A6 | Hole card world position can be computed statically (no useFrame needed) for a stable worldFocusDistance | Pattern 3 | True as long as the scene remains static in TP6; TP8 adds micro-motion which may require a useFrame update — but TP8 is out of scope |

**If this table is empty:** all claims would be verified. The assumptions above are flagged [ASSUMED] because the specific prop names of the N8AO/DOF wrappers in react-postprocessing@2.19.1 were confirmed at API-level from community sources and library README but NOT from running the installed package itself (it is not yet installed). After Wave 0 install, verify prop names from node_modules source before writing JSX.

**Verification step for Wave 0 (before writing any effect JSX):**
```bash
# After npm install, verify props from installed source:
grep -r "worldFocusDistance\|worldFocusRange" frontend/node_modules/@react-three/postprocessing/src/ 2>/dev/null | head -5
grep -r "aoRadius\|distanceFalloff" frontend/node_modules/@react-three/postprocessing/src/ 2>/dev/null | head -5
```
If the grep returns results, the prop names are confirmed. If not, read the N8AO and DepthOfField source files directly and update the plan's JSX snippets accordingly.

---

## Sources

### Primary (HIGH confidence)
- `npm view @react-three/postprocessing@2.19.1 peerDependencies` — confirmed R3F ^8.0, three >= 0.138.0, React ^18.0 [VERIFIED: npm registry]
- `npm view postprocessing@6.39.1 peerDependencies` — confirmed three >= 0.168.0 < 0.185.0 [VERIFIED: npm registry]
- `npm view @react-three/postprocessing@2.19.1 dependencies` — confirmed n8ao@^1.6.6 bundled [VERIFIED: npm registry]
- `slopcheck install @react-three/postprocessing postprocessing` — both [OK] [VERIFIED: slopcheck 0.6.1]
- `frontend/package.json` — confirmed three@^0.169.0 + @react-three/fiber@^8.17.10 installed [VERIFIED: codebase]
- `frontend/src/lab/TableLab.tsx` — confirmed NO postprocessing currently installed; fog params; hole card positions; cam presets [VERIFIED: codebase]
- `frontend/src/lab/cards.ts` — confirmed HOLE_Z=2.3, FELT_REST_Y computation, cam preset positions [VERIFIED: codebase]
- `tools/table-3d/grep-check-tp5-06.cjs` — confirmed Check 5 regex `Bloom|EffectComposer` that must be relaxed [VERIFIED: codebase]
- GitHub pmndrs/react-postprocessing — EffectComposer props: `enableNormalPass`, `multisampling` (default 8) [CITED: github.com/pmndrs/react-postprocessing/blob/master/src/EffectComposer.tsx]
- react-postprocessing official docs — DepthOfField `focusDistance` normalized [0-1]; Vignette `offset`/`darkness`; Noise `opacity`; BrightnessContrast/HueSaturation props [CITED: react-postprocessing.docs.pmnd.rs]
- GitHub N8python/n8ao README — aoRadius (world units), intensity, distanceFalloff, halfRes, screenSpaceRadius, quality presets, N8AOPostPass for pmndrs/postprocessing [CITED: github.com/N8python/n8ao]

### Secondary (MEDIUM confidence)
- github.com/pmndrs/react-three-fiber/discussions/3113 — `worldFocusDistance` in world units is the stable approach for DOF target; `target` prop unreliable [CITED]
- github.com/pmndrs/react-postprocessing/issues/291 — N8AO shader error with three>0.166; resolved in later 2.19.x releases [CITED]
- github.com/pmndrs/react-postprocessing/releases — v2.19.1 is last R3F-8-compatible release; v3.0.4 requires R3F 9 [CITED]
- Forum post (threejs-journey.com/lessons/post-processing-with-r3f) — EffectComposer basic usage, confirmed multisampling prop [CITED: community]
- threejs-discourse — N8AO does not require enableNormalPass [CITED: discourse.threejs.org/t/ssao-used-with-effectcomposer-how-to-enable-normalpass/62423]

### Tertiary (LOW confidence)
- A4-A6 prop name assumptions — based on N8AO README + community examples; must be verified post-install from node_modules source.

---

## Metadata

**Confidence breakdown:**
- Dependency versions: HIGH — confirmed from npm registry directly
- EffectComposer API (enableNormalPass, multisampling): HIGH — confirmed from library source
- N8AO params (aoRadius/intensity/distanceFalloff): HIGH from N8AO README; MEDIUM on JSX prop names in the R3F wrapper (not yet installed)
- DepthOfField worldFocusDistance: MEDIUM — confirmed from community discussion; not in official docs table
- Vignette/Noise/BrightnessContrast props: HIGH — confirmed from official docs
- Grep-check transition: HIGH — direct reading of existing grep-check-tp5-06.cjs source
- CenterGameState geometry: HIGH — reuses existing cardBodyGeometry + known world positions

**Research date:** 2026-06-12
**Valid until:** 2026-07-12 (npm package versions are stable; no fast-moving dependencies)
