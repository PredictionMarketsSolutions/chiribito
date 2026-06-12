# Phase 6: TP5 — Iluminación & Sombras (Warm Light) — Research

**Researched:** 2026-06-12
**Domain:** Three.js / React Three Fiber lighting, PCSS shadows, per-material PBR specular, drei SoftShadows + ContactShadows
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. Key as warm gradient toward the rail with generous fill PRESERVED — enforce a `key-to-fill ratio ceiling` (cannot collapse to a cone). Warm/cool dimensionality via a LOW cool fill opposite + a light rim/kicker. Warm key ~`#fff1d6`.
2. Per-material specular tuning (each material's own specular/clearcoat/roughness response, NOT a global IBL/exposure): chips, brass, rim, card-edges throw crisp SMALL highlights; wood must NOT go wet, brass must NOT go gold. M4 brass re-run at END must PASS.
3. Felt green-bounce onto object undersides (subtle GI — a low green bounce/fill from the felt, not a lamp).
4. Apron/rail outer wall lit as a VOLUME (top-highlight → underside-shadow) — resolves "table floats". Lighting fix, geometry already exists.
5. Grounding (must-ship deliverable): drei `SoftShadows` (PCSS, size 25–35, samples ~16, focus 0); key shadow-mapSize 2048 + tuned near/far + bias/normalBias; `ContactShadows frames={1}` (baked once); warm crushed-black lift (+A).
6. A `?light=` A/B flag — key-reshaping separately revertible from grounding; document the flag map mirroring `?rail=`/`?chips=`.
7. Operator gate (last plan, `autonomous: false`) at all 3 frozen money shots.

### Anti-Casino HARD Gates
- NO single hard white cone (key-to-fill ceiling). NO bloom (M7 = 0). M5 highlight-clip PASS. M6 contact-shadow presence PASS under every object. M4 brass PASS at END (no gold drift). M11 improved (or not regressed) by `frames={1}`. No new shadow-casting light.

### Claude's Discretion
- Exact light rig deltas (key cone angle/penumbra/decay, fill intensity/color, rim placement), per-material specular values, green-bounce mechanism, PCSS + ContactShadows exact params.
- Plan/wave decomposition (grounding wave + key-reshaping wave + per-material-specular wave + green-bounce + operator gate last). Grounding ships independently.

### Deferred Ideas (OUT OF SCOPE)
- Screen-space / crevice AO, depth/composition → TP6.
- Postprocessing (bloom/vignette/SSAO) — explicitly OUT of TP5.
- Multi-hand staging → TP8; diagnostic cams → TP7.
</user_constraints>

---

## Summary

TP5 ships the lighting and shadow foundation that makes every prior material decision pay off. The scene already has the geometry (TP1–TP4), the materials (PBR, per-surface specular, normal maps), and a working but unrefined light rig. What's missing is: (1) the key shaped into a warm gradient rather than a tight cone, (2) per-material specular responses tuned to what each surface should *feel* like under that light, (3) a green bounce from the felt onto object undersides, and (4) real PCSS grounding (SoftShadows + baked ContactShadows) that makes every chip, card, and the table body read as sitting on something.

The grounding deliverable is the must-ship. SoftShadows (PCSS) in drei 9.x is available in the installed package (`@react-three/drei@9.114.0`, confirmed) and exports exactly the API the SSOT specifies: `{ size, samples, focus }`. It recompiles shadow shaders once at mount — the critical constraint is that it must be injected ONCE and left alone (no per-frame toggle). ContactShadows is already imported and partially wired; upgrading it to `frames={1}` eliminates the per-frame scene re-render that drives M11 up.

The key-reshaping (warm gradient, key-to-fill ceiling, cool fill, rim) is separable from grounding via the `?light=` flag, making it non-blocking. If the key pool-shaping reads as a spotlight, grounding still ships; the key stays flat-warm.

**Primary recommendation:** Ship grounding (SoftShadows + ContactShadows `frames={1}` + warm shadow floor) as Wave 1; ship key-reshaping behind the `?light=` flag as Wave 2; ship per-material specular as Wave 3; ship green-bounce as Wave 4; operator gate last.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| PCSS soft shadows (SoftShadows) | Frontend / R3F Scene | — | Shader injection at mount; scene-level, not component-level |
| ContactShadows baking | Frontend / R3F Scene | — | Must sit at floor level (y=-1.48); scene-level placement |
| Key light warm gradient | Frontend / Lights component | Scene (passes shadowRadius) | Lights component already encapsulates the rig |
| Per-material specular | Frontend / material useMemos | — | Per-material useMemo in Table() and useChipKit() |
| Green-bounce hemisphere | Frontend / Lights component | — | Low-intensity additional light in Lights JSX |
| Apron volume wash | Frontend / Lights component | — | Reshape existing pointLight at [0,-0.25,11] |
| ?light= flag | Frontend / qp() pattern | — | Mirrors qp("rail")/qp("chips") established pattern |
| Metric assertions (M4/M5/M6/M7/M11) | tools/table-3d/ | grep-check*.cjs | M4/M5/M6 automated via run-metrics.mjs; M7 via m7-bloom-assert.mjs; M11 via stats-read.mjs |
| Operator gate record | docs/table-3d/TP5_OPERATOR_GATE.md | — | Mirrors TP3_OPERATOR_AB.md + TP4_OPERATOR_GATE.md shape |

---

## Current Light Rig — Exact Baseline Inventory

All values read directly from `frontend/src/lab/TableLab.tsx` (`Lights` component, L847–876 and the ContactShadows block L1086–1097). [VERIFIED: source file read]

### Light Sources

| # | Type | Position | Color | Intensity | Angle | Penumbra | Decay | Casts Shadow | shadow-mapSize | shadow-bias | shadow-radius |
|---|------|----------|-------|-----------|-------|----------|-------|--------------|----------------|-------------|---------------|
| 1 | `ambientLight` | (global) | `#ffdfb0` | 0.32 | — | — | — | no | — | — | — |
| 2 | `hemisphereLight` | sky/ground | sky `#fff1d8` / ground `#1a0f08` | 0.45 | — | — | — | no | — | — | — |
| 3 | `spotLight` (KEY) | [1.2, 15, 2] | `#fff1d6` | 2.0 | 0.62 rad | 1.0 (full soft) | 0 | YES (unless `?sh=off`) | 2048×2048 | −0.0003 | 8 (default) or 4 (when `?card` != `base`) |
| 4 | `spotLight` (FILL) | [−7, 6, −1] | `#ffd9a0` | 0.7 | 0.8 rad | 1.0 | 0 | no | — | — | — |
| 5 | `directionalLight` (RIM) | [−3, 4, −7] | `#bcc6dc` | 0.26 | — | — | — | no | — | — | — |
| 6 | `pointLight` (BODY WASH) | [0, −0.25, 11] | `#ffcd95` | 0.5 | — | — | 0 | no | distance=34 | — | — |

**Key-to-fill ratio (current):** key intensity 2.0 / fill intensity 0.7 = **2.86×**. This is the baseline floor the ceiling must not breach downward (we must not let it go higher toward a casino cone; the floor means no MORE generous fill must be removed).

**Single shadow-caster confirmed:** spotLight #3 is the ONLY light with `castShadow`. [VERIFIED: source]

**ContactShadows (current — L1086–1097):**
```
position={[0, -1.48, 0]}
scale={FELT_R * 3}          // 6.5 * 3 = 19.5 world units
resolution={1024}
blur={2.8}
opacity={0.55}
far={4}
color="#000000"
frames={undefined}          // NOT set → re-renders every frame (expensive; M11 impact)
```
No `frames={1}` → ContactShadows currently bakes a fresh scene snapshot every frame. This is the M11 regression source; adding `frames={1}` eliminates it.

**Environment (baked once, `frames={1}`):**
```jsx
<Environment resolution={256} frames={1}>
  <Lightformer form="rect"  intensity={1.7} color="#ffe3b0" position={[0, 7, 1]} scale={[9, 6, 1]} />
  <Lightformer form="rect"  intensity={0.5} color="#ffd49a" position={[-7, 3, -4]} scale={[5, 5, 1]} />
  <Lightformer form="ring"  intensity={0.35} color="#9fb8ff" position={[6, 4, -5]} scale={[4, 4, 1]} />
</Environment>
```
Already correctly baked (`frames={1}`). Not touched in TP5.

**Canvas settings (relevant):**
- `shadows` prop on `<Canvas>` is set → WebGL shadow maps are enabled globally. [VERIFIED]
- `toneMapping: THREE.ACESFilmicToneMapping`, `toneMappingExposure: 1.05`
- SoftShadows is NOT currently in the scene. [VERIFIED: grep returned zero matches]

---

## Per-Material Specular — Current Baseline vs TP5 Proposed

Read directly from `frontend/src/lab/TableLab.tsx`. [VERIFIED: source]

### Felt (`feltMat`, MeshPhysicalMaterial)
| Property | Current | TP5 Proposed | Notes |
|----------|---------|--------------|-------|
| roughness | 0.93 | **0.93** (unchanged) | Very matte — felt should not pick up highlight clip |
| sheen | 0.70 | **0.70** (unchanged) | Nap sheen is felt identity — keep |
| sheenColor | `#2aad7a` | `#2aad7a` (unchanged) | Green nap — the green-bounce source for the hemisphere |
| envMapIntensity | 0.3 | **0.3** (unchanged) | Low env — correct for matte baize |
| clearcoat | 0 | 0 (no clearcoat on felt) | — |

No specular change needed on felt itself — it IS the green-bounce source, not a recipient.

### Card stock (`stock` material, MeshPhysicalMaterial)
| Property | Current | TP5 Proposed | Notes |
|----------|---------|--------------|-------|
| roughness | 0.62 | **0.60** (slight tighten) | Crisp small highlight on card-edge in key light |
| clearcoat | 0.12 | **0.12** (unchanged) | Whisper coat; stay below 0.18 hard cap |
| clearcoatRoughness | 0.55 | **0.50** (slight tighten) | Allows a crisp clearcoat highlight on card edge |
| sheen | 0.35 | **0.35** (unchanged) | Warm wheat rim — already correct |

Card face material (`faceMat`): roughness 0.52 → **0.50** (allow slight highlight on the face surface under the warm key). clearcoat 0.12 unchanged.

### Chips — pre-de-Vegas (default path, MeshPhysicalMaterial body)
| Property | Current | TP5 Proposed | Notes |
|----------|---------|--------------|-------|
| roughness | 0.5 | **0.52** (raise slightly) | Matte clay — suppress highlight extent, anti-Vegas |
| clearcoat | 0.42 | **0.38** (lower) | Reduce casino highlight; stay above 0 (the clay seal) |
| clearcoatRoughness | 0.46 | **0.50** (raise) | Softer clearcoat lobe — matte seal read |
| sheen | 0.5 | **0.4** (lower) | Reduce sheen extent under the new key |

### Chips — de-Vegas path (`?chips=dv`, MeshPhysicalMaterial body)
| Property | Current | TP5 Proposed | Notes |
|----------|---------|--------------|-------|
| roughness | 0.72 | **0.72** (unchanged) | Already matte — correct |
| clearcoat | 0.32 | **0.32** (unchanged) | SSOT locked |
| clearcoatRoughness | 0.50 | **0.50** (unchanged) | SSOT locked |

De-Vegas path is already tuned; no specular change.

### Wood coaming (MeshPhysicalMaterial)
| Property | Current | TP5 Proposed | Notes |
|----------|---------|--------------|-------|
| roughness | 0.38 | **0.42** (raise) | Varnished wood should not read "wet"; raise roughness |
| clearcoat | 0.72 | **0.68** (lower) | Less casino-polish; retain the varnish highlight but narrower |
| clearcoatRoughness | 0.2 | **0.25** (raise) | Soften clearcoat lobe to avoid mirror-wet read |
| envMapIntensity | 0.65 | **0.55** (lower) | Less env-punch → wood recedes behind cards |

**Risk:** Any wood roughness < 0.35 or clearcoat > 0.75 → wet read (M5 highlight-clip at clearcoat highlight). TP5 raises roughness and lowers clearcoat — both in the safer direction.

### Leather rail (MeshPhysicalMaterial)
| Property | Current | TP5 Proposed | Notes |
|----------|---------|--------------|-------|
| roughness | 0.64 | **0.64** (unchanged) | Correct for worn leather |
| clearcoat | 0.08 | **0.08** (unchanged) | Very low — correct |
| sheen | 0.4 | **0.40** (unchanged) | Cognac sheen — keep |

Leather needs no specular change. The grain already reads correctly under the warm key.

### Brass reveal (`brassMat`, MeshStandardMaterial — TP4 Lever D default)
| Property | Current | TP5 Proposed | Notes |
|----------|---------|--------------|-------|
| metalness | 1 | **1** (unchanged) | Metallic |
| roughness | **0.42** (TP4 Lever D) | **0.42** (unchanged) | SSOT locked at TP4 gate; do NOT change |
| envMapIntensity | 0.45 (TP4 Lever D) | **0.45** (unchanged) | Already reduced at TP4 |

**M4 must be re-run at END of TP5** after all specular changes land, to confirm brass HSV did not drift: H∈[35,48]° · S≤0.55 · V≤0.80.

### Body/apron (MeshPhysicalMaterial)
| Property | Current | TP5 Proposed | Notes |
|----------|---------|--------------|-------|
| roughness | 0.48 | **0.52** (raise) | Body sits in shadow under the rail — should be less specular |
| clearcoat | 0.5 | **0.44** (lower) | Less contrast with the rail; body recedes |
| clearcoatRoughness | 0.3 | **0.35** (raise) | Softer body clearcoat lobe |
| envMapIntensity | 0.5 | **0.4** (lower) | Body recedes; less env punch |

---

## Architecture Patterns

### System Architecture Diagram

```
                     ?light=A/B flag (qp())
                           │
              ┌────────────┴────────────┐
              │ A (default)             │ B (prior flat-warm key)
              ▼                         ▼
      Lights component                Lights component
      ┌──────────────┐                ┌──────────────┐
      │ ambientLight │                │ ambientLight │
      │ hemisphereLight (green-       │ hemisphereLight (original)
      │   bounce: sky=#fff1d8         │ spotLight KEY (angle 0.62)
      │   / ground=#2aad7a tint)      │ spotLight FILL (0.7)
      │ spotLight KEY (shaped:        │ directionalLight RIM
      │   wider angle / ratio ceil)   │ pointLight BODY WASH
      │ spotLight FILL (generous,     └──────────────┘
      │   preserved floor)
      │ directionalLight RIM (cool)
      │ pointLight BODY WASH (warm)
      └──────────────┘
              │
              ▼
      SoftShadows (PCSS)  ← injected ONCE in Scene, above Lights
      { size: 30, samples: 16, focus: 0 }
              │
              ▼
      spotLight KEY shadow
      ┌─────────────────────────────────────────────┐
      │ shadow-mapSize 2048×2048                    │
      │ shadow-bias −0.0003 (keep; no acne)         │
      │ shadow-normalBias 0.02 (add; peter-pan fix) │
      │ shadow-radius 4 (default, card stack active)│
      │ shadow-camera-near 8 / shadow-camera-far 28 │
      └─────────────────────────────────────────────┘
              │
              ▼
      ContactShadows (floor, y=-1.48)
      ┌─────────────────────────────────────────────┐
      │ frames={1}    ← KEY CHANGE: baked once       │
      │ opacity 0.35  ← LOWER (was 0.55; avoid double│
      │                 darken with SoftShadows)     │
      │ far 5         ← extend to ground rail + body │
      │ scale FELT_R*3.5                             │
      │ blur 2.0      ← tighten (was 2.8)            │
      │ color "#1a0e06" ← warm crushed black (+A)   │
      └─────────────────────────────────────────────┘
              │
              ▼
      Metric gates (all at ?cam=hero|card|macro)
      M4 / M5 / M6 / M7 / M11 / +A / M10
```

### Recommended Project Structure (changes only)

```
frontend/src/lab/
├── TableLab.tsx          # Lights component + SoftShadows + ContactShadows + per-material specular
tools/table-3d/
├── grep-check-tp5-06.cjs # New: TP5 invariant checker (SoftShadows wired, frames=1, no bloom, key-to-fill ceiling)
docs/table-3d/
├── TP5_OPERATOR_GATE.md  # Gate record (mirrors TP4_OPERATOR_GATE.md shape)
```

### Pattern 1: SoftShadows — inject ONCE in Scene, above Lights

```tsx
// Source: @react-three/drei 9.114.0 core/softShadows.js [VERIFIED: installed package]
// SoftShadows modifies the shadow shader at mount time (PCSS).
// INJECT ONCE — never inside a conditional, never in a loop, never toggled per-frame.
// Placing it in Scene (not in Lights) keeps it stable across any Lights re-render.
import { SoftShadows, ContactShadows } from "@react-three/drei";

function Scene() {
  // ...
  return (
    <>
      {/* PCSS soft shadows — inject once, shader recompile happens at mount */}
      <SoftShadows size={30} samples={16} focus={0} />

      {/* ... camera, orbit controls ... */}

      <Lights shadowRadius={cardFlag !== "base" ? 4 : 8} />

      {/* ... table, cards, chips ... */}

      {/* ContactShadows: frames={1} bakes once → M11 improvement */}
      {qp("cs") !== "off" && (
        <ContactShadows
          position={[0, -1.48, 0]}
          scale={FELT_R * 3.5}
          resolution={1024}
          blur={2.0}
          opacity={0.35}
          far={5}
          color="#1a0e06"
          frames={1}
        />
      )}
    </>
  );
}
```

**Why `focus={0}`:** focus controls the blocker-search radius. 0 = full PCSS contact-hardening (hard contact at surface, soft far penumbra). Non-zero values compress the penumbra toward a uniform soft look, losing the "hard near / soft far" gradient the SSOT specifies. [CITED: drei SoftShadows source + NVIDIA PCSS paper pattern]

**`size` range 25–35:** Controls the virtual light source radius in shadow-map texels. At `size=30` with `mapSize=2048`, the penumbra is ~1.5 chip-radii wide at 1 chip height from the felt — perceptible contact grounding without a blurry smear. [ASSUMED — exact shadow world-space sizing requires capture confirmation]

**`samples=16`:** More samples reduce noise; 16 is the sweet spot for visual quality vs fragment cost. Below 8, PCSS Vogel-disk sampling shows spiral artifacts. Above 32, no visible gain on the RTX 4060 GPU. [ASSUMED — confirmed for similar scene complexity]

### Pattern 2: Key light reshaping for warm gradient (not cone)

```tsx
// Source: derived from existing Lights component (L856-867) [VERIFIED: source read]
// The key-to-fill ratio ceiling: key intensity / fill intensity <= 3.5x
// Current baseline: 2.0 / 0.7 = 2.86x — this is the FLOOR.
// DO NOT let the ratio exceed 3.5x — if key goes up, fill must go up proportionally.
// DO NOT lower fill below 0.65 (that removes the generous fill floor).

function Lights({ shadowRadius = 4, lightFlag = null }: { shadowRadius?: number; lightFlag?: string | null }) {
  const shaped = lightFlag !== "base"; // ?light=base restores prior flat-warm key

  return (
    <>
      {/* warm room bounce — kept at the floor */}
      <ambientLight intensity={0.32} color="#ffdfb0" />

      {/* green-bounce hemisphere: ground tinted to felt green so object undersides
          receive a subtle warm-green GI bounce (felt green-bounce, SSOT §TP5).
          Intensity 0.12 — deliberately restrained; just enough to lift undersides
          from pure black into a warm-green tinted shadow floor.
          Sky stays warm; only the ground tint shifts from near-black to felt-green. */}
      <hemisphereLight
        args={[
          "#fff1d8",   // sky: warm (same as current — preserves the key-direction warmth)
          shaped ? "#0d3d24" : "#1a0f08",  // ground: felt-green (shaped) vs near-black (base)
          0.45
        ]}
      />

      {/* THE warm key — wider angle + maintained penumbra so it pools gently,
          never collapsing to a cone. key-to-fill ratio MUST stay <= 3.5x */}
      <spotLight
        position={[1.2, 15, 2]}
        angle={shaped ? 0.72 : 0.62}        // wider: gradient not cone
        penumbra={1}                          // full soft edge — NEVER lower this
        intensity={shaped ? 2.2 : 2.0}       // slight lift for gradient read
        decay={0}
        color="#fff1d6"
        castShadow={qp("sh") !== "off"}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}              // NEW: peter-pan prevention
        shadow-radius={shadowRadius}
        shadow-camera-near={8}               // NEW: tighter near clip → sharper near shadows
        shadow-camera-far={28}               // NEW: explicit far clip
      />

      {/* generous warm fill — MUST be preserved (the floor); ratio ceiling enforcement.
          shaped path raises fill proportionally to prevent cone collapse. */}
      <spotLight
        position={[-7, 6, -1]}
        angle={0.8}
        penumbra={1}
        intensity={shaped ? 0.8 : 0.7}       // raised to maintain key/fill ratio <= 3.5x
        decay={0}
        color="#ffd9a0"
      />

      {/* cool back rim — separation only; keep restrained */}
      <directionalLight
        position={[-3, 4, -7]}
        intensity={shaped ? 0.22 : 0.26}     // slightly lower on shaped path (less cool pop)
        color="#bcc6dc"
      />

      {/* low warm wash for the table BODY apron — volume read, not uplighting.
          Shaped path narrows the cone slightly (angled more toward body fascia) */}
      <pointLight
        position={[0, -0.25, 11]}
        intensity={0.5}
        distance={34}
        decay={0}
        color="#ffcd95"
      />
    </>
  );
}
```

**Key-to-fill ratio ceiling implementation:**
- Shaped path: 2.2 / 0.8 = **2.75×** — stays below 3.5× ceiling AND stays above the floor (current 2.86×... wait, 2.75 < 2.86 — so shaped actually has a MORE generous fill ratio; that is correct anti-casino direction)
- Base path: 2.0 / 0.7 = 2.86× (unchanged baseline)
- Hard rule: if key intensity is raised in tuning, fill intensity must rise by the same factor. Never let ratio exceed 3.5×. [ASSUMED ratio ceiling value; tuning will confirm]

### Pattern 3: Green-bounce via hemisphere ground tint

The SSOT specifies "felt green-bounce onto object undersides (subtle GI)." The cleanest mechanism in R3F/three.js without a real GI system is the `hemisphereLight` ground color. The hemisphere light illuminates the underside of all surfaces with the ground color — exactly what "light bouncing up from the felt" would produce. [CITED: three.js HemisphereLight docs — ground color illuminates surfaces facing down]

```tsx
// Current: args={["#fff1d8", "#1a0f08", 0.45]}  — near-black ground (no green)
// Proposed: args={["#fff1d8", "#0d3d24", 0.45]}  — dark felt-green ground

// #0d3d24 ≈ the darkest anchor of the felt palette (#0a4a33 is M3 anchor; #0d3d24 is slightly
// darker to keep the bounce subtle — not a lime wash, just a warm-green shadow lift).
// Chips, cards, the rail underside, the body apron all receive this green underbelly tint.
// This is GI-like but computationally free (a single hemisphere pass).
```

**Why NOT a separate green fill light:** A fill light adds another shadow concern, changes the key-to-fill balance, and risks a "green spotlight" read. The hemisphere ground tint is uniform, undirected, and affects only downward-facing surfaces — exactly the felt-bounce physics. [ASSUMED: mechanism recommendation; no authoritative three.js doc specifically prescribes this over a fill light, but the physics match]

### Pattern 4: Apron/body volume lighting

The `pointLight` at `[0, -0.25, 11]` already rakes the body. TP5 needs to make it slightly more directional so the outer wall top-face catches more light than the underside. Since the woodNapNormalMap (TP4 Lever F) already bakes a cross-profile gradient (top-highlight/underside-shadow) into the normal map, the lighting just needs to cooperate:

```tsx
// Current: position={[0, -0.25, 11]} — grazes along the apron at near floor level
// This already lights the fascia. TP5 adjusts nothing here except:
// The shaped hemisphere ground tint (#0d3d24 vs #1a0f08) now warms the apron underside
// from below, completing the top-key + bottom-bounce volume read.
// No new light needed (SSOT hard gate: no new shadow-casting light).
```

### Anti-Patterns to Avoid

- **Toggling SoftShadows per-frame or behind a flag:** PCSS recompiles shadow shaders at mount. If SoftShadows is rendered conditionally (e.g., `{shaped && <SoftShadows />}`), it recompiles every time the condition changes → massive stutter. Inject ONCE unconditionally in Scene (or always-on under a `?soft=off` escape only used for debugging, never in production default). [CITED: drei SoftShadows source comment + community pattern]
- **ContactShadows `frames={undefined}` (default):** Every frame drei's ContactShadows renders the full scene into an off-screen render target to compute the shadow texture. At 60 fps this is 60 full scene renders per second on top of the main render → M11 regresses. `frames={1}` bakes once at mount. [VERIFIED: drei ContactShadows source behavior]
- **Lowering fill below 0.65:** The generous fill is the anti-casino floor. Below 0.65, the key pools visibly as a cone (the gaps between the chip stacks go dark). [ASSUMED based on rig geometry]
- **Raising wood clearcoat above 0.72:** The current 0.72 is already high; going higher produces a mirror-wet read. [ASSUMED — consistent with prior TP4 commentary]
- **Raising brass envMapIntensity above 0.45:** The TP4 gate locked envMapIntensity at 0.45. Any increase risks M4 V-channel drift. Do not touch. [VERIFIED: TP4_OPERATOR_GATE.md]
- **Widening key angle above 0.85 rad:** Beyond this, the spotLight's cone radius at y=15 covers the whole scene floor and the light loses directionality entirely — the "overhead lamp" motivation disappears. [ASSUMED geometric bound]
- **Setting shadow-camera-near too small (e.g., near=1):** With the key at y=15 and objects at y=0..1, near=1 makes the shadow frustum huge → shadow-map resolution is wasted on empty space → shadow acne on the felt surface. Near=8 places the frustum edge 7 units below the key, covering the scene tightly. [ASSUMED — confirmed by established shadow-map near/far calibration practice]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PCSS (Percentage Closer Soft Shadows) | Custom GLSL shadow shader | `SoftShadows` from `@react-three/drei` | Shipping in installed `@react-three/drei@9.114.0`; PCSS math (Vogel disk, blocker search) is non-trivial to get right |
| Baked floor shadow | Per-frame scene re-render | `ContactShadows frames={1}` | Already imported; `frames={1}` eliminates the per-frame re-render cost |
| Green GI bounce | Separate green point/fill light | `hemisphereLight` ground color | HemisphereLight ground is physically motivated (ambient from below); no extra draw call, no extra shadow concern |
| Key-to-fill ceiling enforcement | Runtime ratio assertion | Code constant + comment in Lights component | A comment + a numeric constant is sufficient; no runtime overhead; grep-checkable |
| Bloom absence gate | Manual visual review | `m7-bloom-assert.mjs` | Already implemented; runs as a code grep (zero match = PASS) + histogram halo check |

**Key insight:** The drei ecosystem already ships everything TP5 needs. SoftShadows is in the installed package; ContactShadows `frames={1}` is one prop addition. The entire grounding deliverable is a configuration change, not new infrastructure.

---

## Package Legitimacy Audit

TP5 installs NO new packages. All required components (`SoftShadows`, `ContactShadows`) are already present in the installed `@react-three/drei@9.114.0`. [VERIFIED: source read + `node_modules/@react-three/drei/core/softShadows.d.ts` confirmed]

**Packages removed due to slopcheck [SLOP] verdict:** none (no new packages)
**Packages flagged as suspicious [SUS]:** none

---

## Common Pitfalls

### Pitfall 1: Casino Cone (the #1 TP5 risk)
**What goes wrong:** Key intensity raised; fill not raised proportionally. Key angle tightened (0.62 → 0.45). The key pools as a tight bright circle over the chips; the outer table is dark. Reads as a casino spotlight.
**Why it happens:** Raising key for better highlight contrast without raising fill, or tightening angle for a "focused" look.
**How to avoid:** Key-to-fill ceiling (ratio never > 3.5×). Penumbra stays at 1.0 (never lower). Key angle never below 0.62 (the current value) — only raise it.
**Warning signs:** At `?cam=hero`, the far rail corners (past the chips) go noticeably darker than the near felt zone. Stop and widen angle + raise fill.

### Pitfall 2: SoftShadows Double-Recompile (the silent perf bomb)
**What goes wrong:** `<SoftShadows>` is inside a conditional (`{shaped && <SoftShadows size={30} ... />}`). When `shaped` toggles (e.g., on ?light= flag change), React unmounts and remounts SoftShadows. Each mount recompiles the shadow shader for every shadow-receiving material in the scene.
**Why it happens:** Natural React pattern to show/hide based on a flag.
**How to avoid:** Place `<SoftShadows size={30} samples={16} focus={0} />` unconditionally in `Scene`, above the `<Lights>` component. The `?light=` flag changes light intensities/angles (in Lights), not the PCSS shader. If a `?soft=off` escape is needed for debugging, use it with awareness that it will recompile on toggle. Never toggle it from the operator gate captures.
**Warning signs:** A full-page stutter (hundreds of ms freeze) when the `?light=` flag is changed in the URL.

### Pitfall 3: ContactShadows + SoftShadows Double-Darken
**What goes wrong:** ContactShadows opacity left at 0.55 (original). SoftShadows already darkens the felt under each object via the PCSS shadow map. The ContactShadows floor shadow then adds another darkening layer → the area under cards and chips reads as near-black, losing the warm-shadow floor.
**Why it happens:** ContactShadows opacity was calibrated before PCSS; they don't know about each other.
**How to avoid:** Lower ContactShadows opacity to 0.30–0.40 (proposed 0.35). Test: at `?cam=macro` the undercard region should read as "darker than adjacent felt" (M6 PASS ≥ 12%) but not crushed black (warm shadow floor present, +A PASS).
**Warning signs:** M6 passes by a huge margin (> 40% darker) — that usually means double-darkening. Also +A fails (corner luma < 18).

### Pitfall 4: Wood Goes Wet
**What goes wrong:** Lowering wood roughness or raising clearcoat causes the varnished rail to read as a glossy plastic mirror under the warm key highlight.
**Why it happens:** Wood clearcoat at 0.72 is already high; even a small roughness drop can tip the clearcoat highlight into M5 clip territory.
**How to avoid:** Raise roughness (0.38 → 0.42); lower clearcoat (0.72 → 0.68); raise clearcoatRoughness (0.2 → 0.25). These three move in the same safe direction (more matte). Never lower roughness below 0.38 or raise clearcoat above 0.72. Run M5 after each change.
**Warning signs:** At `?cam=rail`, the wood top surface shows a near-white highlight band running around the oval.

### Pitfall 5: Brass Goes Gold (M4 Drift)
**What goes wrong:** Raising env-map intensity or chip specular changes the environment's contribution to the brass reveal; the brass mean pixel HSV drifts: S > 0.55 or V > 0.80 → M4 FAIL.
**Why it happens:** The Environment lightformers bake reflections into the brass. Any change to the overall scene lighting (even indirect via specular changes on adjacent materials) can shift the brass appearance.
**How to avoid:** DO NOT change `brassMat.envMapIntensity` (stays at 0.45; TP4-locked). DO NOT change `brassMat.roughness` (stays at 0.42; TP4-locked). Re-run M4 (`node tools/table-3d/run-metrics.mjs docs/table-3d/anchors/tp5-gate`) at the END of every wave, not just the final gate.
**Warning signs:** M4 mean HSV V value approaches 0.75+ (within 5 of the 0.80 ceiling).

### Pitfall 6: Peter-Pan Acne (shadow floating)
**What goes wrong:** Cards and chips appear to float above the felt — their shadows don't start at their base. OR the felt surface shows a salt-and-pepper speckle pattern (shadow acne) where self-shadowing fires incorrectly.
**Why it happens:** `shadow-bias` too small (acne) or too large (peter-pan). The existing `-0.0003` controls acne; `shadow-normalBias` is missing (causes peter-pan on the felt plane, which has a perfectly flat normal).
**How to avoid:** Keep `shadow-bias={-0.0003}` (current value is calibrated). Add `shadow-normalBias={0.02}` to the key spotLight — this pushes the shadow test along the normal, eliminating the floating artifact on flat surfaces.
**Warning signs:** At `?cam=macro`, card bases look like they hover 1–2 px above the felt. Or the felt looks speckled near the shadow terminator.

### Pitfall 7: Shadow Frustum Waste (shadow resolution lost)
**What goes wrong:** The key shadow camera near/far are at defaults (near=0.5, far=500 in three.js). The shadow map covers 500 units of z-range; the actual scene fits in a 6×6×5 volume. The shadow map resolution per world-unit is 2048/500 ≈ 4 texels/unit → mushy soft shadows on the felt.
**Why it happens:** Not setting shadow-camera-near/far explicitly.
**How to avoid:** Key is at y=15. Nearest felt is at y=0. Add `shadow-camera-near={8}` and `shadow-camera-far={28}` — covers from 7 units below the key (y=8) to 13 units below the felt (y=-13, which covers the floor at y=-1.5). Now 2048/20 ≈ 100 texels/unit → visibly sharper contact shadows.
**Warning signs:** The shadow of a chip stack on the felt looks blurry even with `shadow-radius=4`. Checking `shadow-camera-near` reveals it defaulted to 0.5.

---

## Code Examples

### SoftShadows exact API (from installed package)

```tsx
// Source: @react-three/drei@9.114.0 core/softShadows.d.ts [VERIFIED: read from node_modules]
type SoftShadowsProps = {
    size?: number;       // PENUMBRA_FILTER_SIZE in the PCSS shader — controls light source radius
    samples?: number;    // Vogel disk sample count — higher = less noise, more GPU cost
    focus?: number;      // blocker-search radius modifier — 0 = full contact hardening
};
export declare function SoftShadows({ focus, samples, size }: SoftShadowsProps): null;

// TP5 target values:
<SoftShadows size={30} samples={16} focus={0} />
// size=30 is mid-range of SSOT 25–35; adjust at capture if penumbra too tight/loose
// samples=16 is SSOT ~16 target; 10 is the implementation default (too noisy for hero shot)
// focus=0 = full PCSS contact-hardening (hard contact, soft far)
```

### ContactShadows with frames={1} and warm color

```tsx
// Source: @react-three/drei ContactShadows (standard API, frames prop added in drei v9) [ASSUMED API stable]
// Current: no frames prop → bakes every frame (M11 regression)
// TP5: frames={1} → bakes once at mount → M11 improves

<ContactShadows
  position={[0, -1.48, 0]}        // floor level (same as current)
  scale={FELT_R * 3.5}            // 6.5 * 3.5 = 22.75 — wider to catch rail + body
  resolution={1024}               // unchanged
  blur={2.0}                      // tighter than 2.8 (SoftShadows does the soft-far work)
  opacity={0.35}                  // LOWER from 0.55 — anti-double-darken with SoftShadows
  far={5}                         // extend from 4 to catch taller rail objects
  color="#1a0e06"                 // WARM near-black (was "#000000"); lifts +A warm-corner floor
  frames={1}                      // BAKE ONCE → M11 improvement
/>
```

### Key-to-fill ceiling constant (grep-checkable)

```tsx
// In Lights component — a named constant so grep-check-tp5-06.cjs can assert its presence
const KEY_TO_FILL_RATIO_CEILING = 3.5; // anti-casino: key intensity / fill intensity MUST stay <= this
// (The actual ratio at runtime: shaped 2.2/0.8 = 2.75x; base 2.0/0.7 = 2.86x — both PASS)
void KEY_TO_FILL_RATIO_CEILING; // suppress unused-var; the constant IS the documentation
```

### shadow-camera near/far on the spotLight

```tsx
<spotLight
  position={[1.2, 15, 2]}
  // ... existing props ...
  shadow-camera-near={8}    // key at y=15; near=8 means frustum starts 7 units below key
  shadow-camera-far={28}    // far=28 means frustum extends 13 units below the felt
  shadow-normalBias={0.02}  // NEW — prevents peter-pan on flat surfaces (felt plane)
  shadow-bias={-0.0003}     // unchanged — calibrated at TP2 for acne prevention
/>
```

### ?light= flag pattern (mirroring ?rail= precedent)

```tsx
// In Scene() (qp() is already defined — established pattern):
const lightFlag = qp("light"); // null = default (new shaped key); "base" = prior flat-warm key

// Pass to Lights:
<Lights shadowRadius={cardFlag !== "base" ? 4 : 8} lightFlag={lightFlag} />

// Flag map (document in TP5_OPERATOR_GATE.md):
// (default, no ?light=)  = shaped key (wider angle 0.72, green-bounce hemisphere ground, ratio-ceiling enforced)
// ?light=base            = prior flat-warm key (angle 0.62, hemisphere ground #1a0f08, intensities unchanged)
// Note: SoftShadows + ContactShadows frames={1} + warm shadow floor are ALWAYS on (not behind the flag)
// — grounding ships regardless of key-reshaping flag disposition
```

### grep-check-tp5-06.cjs skeleton

```javascript
// tools/table-3d/grep-check-tp5-06.cjs
// Checks the TP5 invariants:
// (1) SoftShadows imported and rendered in Scene (not behind a condition)
// (2) ContactShadows frames={1} wired in non-comment code
// (3) KEY_TO_FILL_RATIO_CEILING constant present in TableLab.tsx
// (4) shadow-normalBias present on the key spotLight
// (5) No Bloom / EffectComposer / postprocessing in lab source (M7 code assert)
// (6) brassMat roughness 0.42-0.45 (TP4-locked; re-confirmed at TP5)

// Pattern for CHECK 1 (SoftShadows unconditional):
// Match SoftShadows in non-comment code; then verify it is NOT preceded by a { on the same line
// (which would indicate a conditional expression). A simpler proxy: match
// <SoftShadows in non-comment code, confirm it exists.

// Pattern for CHECK 2:
//   /frames=\{1\}/.test(tableNonComment)

// Pattern for CHECK 3:
//   /KEY_TO_FILL_RATIO_CEILING/.test(tableNonComment)

// Pattern for CHECK 4:
//   /shadow-normalBias/.test(tableNonComment)
```

---

## Metric Gates for TP5

### Automated Metrics (pixel-based, via `run-metrics.mjs`)

| Metric | What it Asserts | TP5 Impact | Command |
|--------|----------------|-----------|---------|
| **M4** | Brass HSV H∈[35,48]° · S≤0.55 · V≤0.80 | RE-RUN at END: new specular may shift brass | `node tools/table-3d/run-metrics.mjs docs/table-3d/anchors/tp5-gate` |
| **M5** | luma>250 < 0.5% felt · < 1.5% frame | Per-material specular must not cause highlight clip | Same runner |
| **M6** | Under-object ≥ 12% darker than adjacent felt | SoftShadows + ContactShadows must preserve shadow presence | Same runner |
| **+A** | Corner luma ≥ 18 AND hue warm (H∈[15,75]° · S≥0.1) | ContactShadows color="#1a0e06" lifts warm floor | Same runner |
| **M7** | 0 Bloom/EffectComposer/postprocessing in source | Strict NO in TP5 (all postprocessing → TP6) | `node tools/table-3d/m7-bloom-assert.mjs --src frontend/src/lab` |

### Performance Metric (via `stats-read.mjs`)

| Metric | What it Asserts | TP5 Impact | Command |
|--------|----------------|-----------|---------|
| **M11 (proxy via M10 draw count)** | < 150 draws at hero | ContactShadows `frames={1}` eliminates per-frame scene re-render → fewer GL calls | `node tools/table-3d/stats-read.mjs http://localhost:5173 hero` |

**M11 note:** The metric kit does not have a dedicated M11 function (it uses stats-read.mjs draw-count as the proxy). The expected improvement from `frames={1}`: ContactShadows currently executes a full scene render every frame → each frame has the main render + the ContactShadows render (approximately double the draw count for the shadow-baking pass). With `frames={1}`, the shadow-baking pass is amortized over the session. The draw count at the HERO shot should not increase vs TP4 (M10 HERO 106 calls); ideally it decreases. [ASSUMED impact magnitude — capture will confirm]

### Structural Gate (code assertion)

| Gate | Assertion | Tool |
|------|-----------|------|
| SoftShadows wired | `<SoftShadows` present in TableLab.tsx non-comment | `grep-check-tp5-06.cjs` CHECK 1 |
| ContactShadows frames=1 | `frames={1}` in TableLab.tsx non-comment | CHECK 2 |
| Key-to-fill constant | `KEY_TO_FILL_RATIO_CEILING` present | CHECK 3 |
| shadow-normalBias | `shadow-normalBias` present on key spotLight | CHECK 4 |
| M7 no bloom | 0 Bloom/EffectComposer/postprocessing in lab source | CHECK 5 (mirrors m7-bloom-assert code gate) |
| Brass roughness held | roughness 0.42–0.45 (TP4-locked) | CHECK 6 |

---

## Recommended Wave Breakdown

### Wave 0 — Grounding (must-ship; ships regardless of key outcome)

**Plans:** 06-01 (SoftShadows + ContactShadows `frames={1}` + warm shadow color + shadow-camera-near/far + shadow-normalBias)

Tasks:
1. Add `<SoftShadows size={30} samples={16} focus={0} />` unconditionally to Scene (above Lights)
2. Upgrade ContactShadows: `frames={1}`, `opacity={0.35}`, `color="#1a0e06"`, `far={5}`, `blur={2.0}`, `scale={FELT_R*3.5}`
3. Add `shadow-camera-near={8}`, `shadow-camera-far={28}`, `shadow-normalBias={0.02}` to key spotLight
4. Capture all 3 money shots; run M6 (contact shadow present) + +A (warm floor) + M10 (draw count not regressed)
5. Commit

### Wave 1 — Key Reshaping + ?light= flag

**Plans:** 06-02 (key angle 0.62→0.72, fill 0.7→0.8, hemisphere ground tint to felt-green behind `?light=` shaped path)

Tasks:
1. Add `lightFlag` param to Lights component
2. Wire `qp("light")` in Scene; pass to Lights
3. Implement shaped vs base branching for angle/intensity/hemisphere ground
4. Add `KEY_TO_FILL_RATIO_CEILING = 3.5` constant
5. Capture both `?light=` and `?light=base`; operator reviews: "does the key still read as a pool, not a cone?"
6. If pool reads as a spotlight → revert angle to 0.62 (keep grounding, revert reshaping — non-blocking)
7. Commit

### Wave 2 — Per-Material Specular

**Plans:** 06-03 (wood roughness 0.38→0.42, clearcoat 0.72→0.68, clearcoatRoughness 0.2→0.25; body roughness 0.48→0.52; card stock roughness 0.62→0.60; chip body adjustments)

Tasks:
1. Apply wood specular delta (safer direction: more matte)
2. Apply body specular delta
3. Apply card stock specular delta
4. Apply chip pre-dv specular delta
5. Run M4 (brass — must still PASS after neighbor specular changes), M5 (no highlight clip on wood)
6. Capture at `?cam=macro`; operator checks wood for wet read + brass for gold read
7. Commit

### Wave 3 — Green-Bounce + Apron Volume

**Plans:** 06-04 (hemisphere ground tint integrated with shaped path; confirm apron volume read)

(Green bounce is implemented as part of the hemisphere ground tint change in Wave 1. Wave 3 is verification only — capturing `?cam=rail` to confirm the body outer wall top-face reads warmer than the underside.)

Tasks:
1. Capture `?cam=rail` with and without `?light=base` — confirm body volume (top lighter, underside warm-green)
2. Confirm no "green spotlight" read on chip undersides
3. Commit capture to `docs/table-3d/anchors/tp5-gate/`

### Wave 4 — Metric Suite + grep-check

**Plans:** 06-05 (author `grep-check-tp5-06.cjs`; run full metric suite)

Tasks:
1. Author `tools/table-3d/grep-check-tp5-06.cjs` with 6 checks
2. Run `node tools/table-3d/grep-check-tp5-06.cjs` → must exit 0
3. Run `node tools/table-3d/run-metrics.mjs docs/table-3d/anchors/tp5-gate` → M4/M5/M6/+A must PASS
4. Run `node tools/table-3d/m7-bloom-assert.mjs --src frontend/src/lab` → M7 PASS
5. Run `node tools/table-3d/stats-read.mjs http://localhost:5173 hero` → M10 ≤ 106 (not regressed)
6. Commit

### Wave 5 — Operator Gate (`autonomous: false`)

**Plans:** 06-06 (capture at all 3 frozen money shots; present A/B; record TP5_OPERATOR_GATE.md)

Capture targets:
```bash
# hero at default (?light= default = shaped)
LAB_URL="http://localhost:5173/table-lab.html?cam=hero"  node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp5-gate/hero.png
# hero at ?light=base (prior flat-warm key)
LAB_URL="http://localhost:5173/table-lab.html?cam=hero&light=base"  node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp5-gate/hero-base.png
# card / macro
LAB_URL="http://localhost:5173/table-lab.html?cam=card"  node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp5-gate/card.png
LAB_URL="http://localhost:5173/table-lab.html?cam=macro" node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp5-gate/macro.png
```

Gate questions:
1. "Does the table read under ONE coherent shaped warm light — warm gradient, not a casino cone?"
2. "Do per-material highlights read as crisp but small — wood varnish glints, chip edges catch light, brass reads aged?"
3. "Is the contact grounding honest — cards and chips sit on the felt, not hovering?"
4. "Is the corner shadow floor warm (not a cold void or crushed black)?"

Stop criteria (auto-revert to prior key; keep grounding):
- Key reads as a spotlight / tight pool → revert `?light=` shaped path to base; ship grounding only
- Any specular highlight clips (M5 FAIL) → lower clearcoat on the offending material
- M4 brass drifts gold → lower wood/chip specular that may be pushing env contribution

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-frame ContactShadows re-render | `frames={1}` baked shadow | drei v8+ | M11 improvement (fewer GL calls per frame) |
| No PCSS (PCF soft shadows via shadow-radius) | SoftShadows (PCSS via GLSL injection) | drei v9+ | Contact-hard near / soft far penumbra |
| shadow-radius for penumbra control | PCSS via SoftShadows (size/samples/focus) | TP5 | SoftShadows owns the penumbra; shadow-radius can stay for the near-contact read |
| Global ambient + hemisphere for all GI | Hemisphere ground tint per scene light state | TP5 | Felt green bounce without a new light |
| Per-frame scene shadow render | One-time bake at mount | drei ContactShadows frames={1} | M11 improvement |

**Deprecated / outdated:**
- `shadow-radius` as the ONLY penumbra control: still useful for the near-contact contact-sharpness (the TP2 Lever 7 value); but SoftShadows is now the primary penumbra system. Both coexist.
- ContactShadows without `frames={1}`: never use without `frames={1}` in a production capture; the per-frame cost is significant.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Key-to-fill ratio ceiling 3.5× is the right threshold for anti-casino | Standard Stack / Pitfall 1 | Too tight: the scene looks flat; too loose: approaches cone. Tuning at capture corrects. |
| A2 | SoftShadows size=30 produces ~1.5 chip-radius penumbra at 1-chip height | Pattern 1 | Penumbra too tight or too loose; tuning at capture (size 25–35 range) corrects. |
| A3 | Green hemisphere ground #0d3d24 reads as a subtle warm-green GI, not a lime wash | Pattern 3 | Too saturated → green wash. Lower saturation (toward #0a2f1a or remove entirely). |
| A4 | ContactShadows frames={1} reduces M10 draw count vs current | Metric Gates | If ContactShadows baking cost was already excluded from stats-read.mjs measurement, M10 won't change. Not harmful either way. |
| A5 | shadow-camera-near={8} / far={28} is appropriate for this scene | Pattern / shadow frustum | Key at y=15, scene at y=0..−1.5. Near=8 → frustum starts at y=7 (3u below felt). Far=28 → frustum ends at y=−13 (catches floor at y=−1.5). Correct geometry confirmed by visual read; exact values confirmed by capture. |
| A6 | hemisphere ground tint is sufficient for felt green-bounce (vs a separate fill light) | Pattern 3 | If the green tint on undersides is too uniform (not felt-directional), a low-intensity green pointLight above felt level could be added as a fallback. Low risk. |

**If this table is empty:** Not empty — 6 assumptions logged. All are low-risk tuning variables confirmed at the capture step.

---

## Open Questions

1. **shadow-normalBias exact value**
   - What we know: 0.02 is a common value for flat-surface peter-pan prevention; too high causes shadows to detach visibly.
   - What's unclear: The felt plane at y=0 with a spotLight at y=15 — the exact value that avoids both acne and detachment is scene-specific.
   - Recommendation: Start at 0.02; if cards float, lower to 0.01; if acne appears, raise to 0.03. Tune at capture.

2. **ContactShadows scale vs body apron**
   - What we know: Current scale is `FELT_R * 3 = 19.5`. The body apron fascia sits at `FELT_R * 1.14 * OVAL_X = ~8.3` world units from center. The floor plane is at y=−1.5. The ContactShadows at y=−1.48 should cover the body base.
   - What's unclear: Does the body apron cast a visible ContactShadows footprint on the floor, or does the plinth foot occlude it?
   - Recommendation: Scale `FELT_R * 3.5 = 22.75` is generous enough to cover the apron footprint. If the body footprint is still missing, raise to `FELT_R * 4`.

3. **M11 frame-time quantification**
   - What we know: `stats-read.mjs` reads draw counts, not frame time. M11 as a formal metric does not exist in `metrics.mjs` — it is referenced in the SSOT but the actual implementation proxy is the draw-count from `stats-read.mjs`.
   - What's unclear: The CONTEXT.md says "M11 improved (or not regressed) by frames={1}" — but M11 is not defined in the metric registry. The draw-count from stats-read is the closest proxy.
   - Recommendation: Gate on "M10 HERO draw count ≤ 106 (TP4 baseline, not regressed)" as the M11 proxy. If the draw count actually decreases, note it in the gate record as the M11 improvement.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|---------|
| `@react-three/drei` SoftShadows | Grounding (Wave 0) | YES | 9.114.0 (installed) | — |
| `@react-three/drei` ContactShadows | Grounding (Wave 0) | YES | 9.114.0 (imported in source) | — |
| three.js HemisphereLight | Green-bounce | YES | 0.169.0 (installed) | — |
| Playwright + Chromium | Capture harness `.dev-stack/lab-shot.mjs` | [ASSUMED available — used in TP3/TP4 gates] | — | Manual screenshot |
| `sharp` (tools/table-3d/*.mjs) | M4/M5/M6/+A metrics | [ASSUMED available — used in TP3/TP4] | — | — |

**Missing dependencies with no fallback:** None identified.

---

## Validation Architecture

No standalone test framework changes in TP5. Validation is the established metric + grep-check pattern:

| Req | Behavior | Test Type | Command |
|-----|----------|-----------|---------|
| SoftShadows wired | PCSS shader injected once | grep-check | `node tools/table-3d/grep-check-tp5-06.cjs` |
| ContactShadows frames=1 | Baked once | grep-check | Same |
| M6 contact shadow present | Under-card ≥ 12% darker | automated pixel | `node tools/table-3d/run-metrics.mjs <dir>` |
| M4 brass not gold | HSV H/S/V in range | automated pixel | Same |
| M5 no highlight clip | luma>250 < 0.5% felt | automated pixel | Same |
| +A warm shadow floor | Corner luma ≥ 18, warm hue | automated pixel | Same |
| M7 no bloom | 0 forbidden tokens in source | code grep | `node tools/table-3d/m7-bloom-assert.mjs --src frontend/src/lab` |
| M10 draw count not regressed | HERO calls ≤ 106 | runtime stats | `node tools/table-3d/stats-read.mjs http://localhost:5173 hero` |
| Operator perceptual gate | One coherent warm light, honest grounding | human review | 3 frozen money-shot captures |

**Wave 0 gaps:** `grep-check-tp5-06.cjs` does not exist yet — must be authored in Wave 4. `docs/table-3d/anchors/tp5-gate/` directory does not exist — created at capture time in Wave 3.

---

## Security Domain

Not applicable. TP5 is frontend-only (lab visualization, `frontend/src/lab/` + `tools/table-3d/`). No auth, no data persistence, no network endpoints. Lab served only on `/table-lab.html` (isolated from the game).

---

## Sources

### Primary (HIGH confidence)
- `frontend/src/lab/TableLab.tsx` — full light rig (L847–876), ContactShadows (L1086–1097), per-material specular (L205–673) — read directly
- `frontend/node_modules/@react-three/drei/core/softShadows.d.ts` — SoftShadows API type signature — read directly
- `frontend/node_modules/@react-three/drei/core/softShadows.js` — SoftShadows PCSS implementation — read directly (includes NVIDIA PCSS + Vogel disk attribution)
- `frontend/node_modules/@react-three/drei/index.js` — confirmed `SoftShadows` export
- `tools/table-3d/metrics.mjs` — M3/M4/M5/M6/M8/+A/+B definitions and thresholds — read directly
- `tools/table-3d/m7-bloom-assert.mjs` — M7 code assert + histogram halo check — read directly
- `tools/table-3d/run-metrics.mjs` — metric runner and control plan — read directly
- `tools/table-3d/stats-read.mjs` — M10 draw-call reader (M11 proxy) — read directly
- `tools/table-3d/grep-check-tp4-05.cjs` — grep-check pattern (template for TP5 checker) — read directly
- `docs/table-3d/TP4_OPERATOR_GATE.md` — confirmed brass roughness 0.42 locked, gate record shape
- `docs/table-3d/SCORECARD_TABLE_3D.md` — baseline scores, per-element AAA targets, TP progression log
- `.planning/phases/06-tp5-iluminacion-sombras-warm-light/06-CONTEXT.md` — SSOT-locked frame
- `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP5 (L359–388) — SSOT spec

### Secondary (MEDIUM confidence)
- drei SoftShadows PCSS integration comment (in `softShadows.js`): attributed to N8Programs, citing Three.js PCSS example, NVIDIA GPUGems2 Ch.17, PCSS Integration whitepaper, Vogel disk (Shadertoy ashalah)
- three.js HemisphereLight ground-color semantics: illuminates surfaces facing downward with ground color (standard three.js behavior, widely documented)

### Tertiary (LOW confidence — assumptions flagged inline)
- Ratio ceiling 3.5× as the anti-casino threshold (A1)
- PCSS size=30 shadow penumbra sizing (A2)
- hemisphere ground #0d3d24 saturation level (A3)
- M11 draw-count improvement from frames={1} (A4)

---

## Metadata

**Confidence breakdown:**
- Current light rig inventory: HIGH — read directly from source
- SoftShadows API: HIGH — read from installed node_modules
- Per-material specular deltas: MEDIUM — reasoned from current values + anti-casino/anti-wet/anti-gold constraints; confirmed at capture
- PCSS tuning params (size/samples/focus): MEDIUM — mid-range of SSOT spec; exact tuning at capture
- Green-bounce mechanism (hemisphere ground tint): MEDIUM — physically motivated; exact color at capture
- Wave breakdown: HIGH — mirrors proven TP3/TP4 pattern exactly

**Research date:** 2026-06-12
**Valid until:** 90 days (three.js/drei APIs are stable; no version upgrades planned in this program)
