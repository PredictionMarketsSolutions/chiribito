# Phase 2: TP1 — Felt / Tapete Materiality (the stage) - Research

**Researched:** 2026-06-10
**Domain:** Three.js 0.169 MeshPhysicalMaterial — sheen, normalMap, anisotropy; procedural canvas normal-map authoring; felt texture upgrade (albedo + inlay); light-responsive edge-darkening
**Confidence:** HIGH (all key findings verified directly from installed source + repo code)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Nap runs **concentric / oval-classic** — following the table's oval. The grazing-angle value shift (metric +B) reads as concentric weave around the felt, NOT linear and NOT radial-from-center.
- **D-02:** Sheen **present but contained → target ~0.65–0.75** (within the SSOT 0.6–0.85 band, deliberately mid-low). Explicitly AVOID a satin / modern-casino look. sheenColor = a slightly-lighter Chiribito green (per SSOT). Keep roughness 0.90–0.94 (anti-satin).
- **D-03:** **Very subtle — physical depth ONLY.** Remove the radial vignette baked into the felt albedo (feltTexture lines 492–497, black 0→0.5) and replace it with a light-RESPONSIVE micro edge-darkening that barely reads. NOT a heavy premium vignette (heavier depth is TP6's job).
- **D-04:** **Raise the sharpness — prioritize money-shot visual quality.** Raise the felt canvas res and/or add a separate inlay-only map; planner picks whichever gives the sharpest MACRO inlay. Mark stays born-in (PlaneGeometry+alphaTest; polygonOffset on the brass torus if coplanar z-fight).
- **D-05:** "Tapete **físico, castizo, táctil, premium** — sin deriva a Vegas/casino." Judge cloth materiality ONLY; grounding/depth deferred to TP5/TP6.

### Claude's Discretion
- The nap normalMap construction (procedural height→normal vs tiled), the precise sheen/sheenColor within the band, the exact normalMap repeat (6–10) + normalScale (0.2–0.35), the anisotropy value (0.15–0.4), and the inlay-sharpness mechanism (canvas-res vs inlay-only map).

### Deferred Ideas (OUT OF SCOPE)
- "Social" / lectura social — deferred to TP8.
- Heavier depth / grounding / AO / pronounced vignette — shadows/grounding = TP5, depth/AO/restrained-vignette = TP6.
- Dual 2D-classic / 3D-immersive view-mode architecture — its own future workstream.
</user_constraints>

---

## Summary

Three.js 0.169.0 (confirmed installed at `frontend/node_modules/three`) provides all TP1 material APIs in `MeshPhysicalMaterial`: `sheen`, `sheenColor`, `sheenRoughness`, `anisotropy`, `anisotropyRotation`, `anisotropyMap`, `normalMap`, and `normalScale`. All properties are verified directly from the installed source. The existing `leatherMat` in `TableLab.tsx` already uses `sheen`/`sheenColor`/`sheenRoughness` on a `MeshPhysicalMaterial`, proving the pattern compiles and renders in this codebase today — the felt upgrade is a material-swap of an already-understood pattern.

The single most important technical finding is how three.js derives the TBN matrix for anisotropy: when no explicit geometry tangents are present (and `PlaneGeometry(1,1,1,1)` does NOT emit tangent attributes), three uses `getTangentFrame()` — a screen-space derivative method (Mikktspace-compatible approximation, "Normal Mapping Without Precomputed Tangents" / Mikkelsen). This is **UV-driven**, not attribute-driven. This means the OVAL_X=1.22 group scale **does stretch the UV-derived tangent frame** because the UVs are tied to geometry position. The concentric nap must be authored with this stretch in mind, OR the normalMap texture itself must pre-compensate for the 1.22x stretch, OR explicit tangents must be added. Research conclusion: pre-compensating in the texture is simpler and more reliable.

The shared height→normal helper does not exist yet. No file in `frontend/src/lab/` contains any height-to-normal, Sobel, or normalMap authoring code. TP1 introduces it as `frontend/src/lab/normalMapHelper.ts` — reusable by TP3 chips (bump→normal), TP4 wood micro-relief, and TP5 future elements.

**Primary recommendation:** Swap felt to `MeshPhysicalMaterial` with sheen ≈ 0.70, sheenRoughness ≈ 0.65, sheenColor ≈ `#2aad7a`, anisotropy ≈ 0.25 (no anisotropyMap needed); add a concentric nap normalMap from a procedural canvas (height→normal via shared helper, repeat 8, normalScale ≈ 0.28); raise albedo to S=2048; add a separate S=1024 inlay-only map for mark sharpness; remove the baked vignette and replace with a subtle `aoMap` edge-darken (a radial grayscale baked as a CanvasTexture, LinearColorSpace, driven by the same concentric falloff so it's geometry-edge-correlated, not a flat radial).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Felt material upgrade (sheen/nap/anisotropy) | `frontend/src/lab/TableLab.tsx` | `frontend/src/lab/textures.ts` | Material lives in TableLab useMemo; texture factory in textures.ts |
| Albedo vignette removal + inlay resize | `frontend/src/lab/textures.ts` | — | feltTexture() is the sole canvas factory |
| Shared height→normal helper | `frontend/src/lab/normalMapHelper.ts` (new) | textures.ts (consumer) | Shared util, first use here, reused by TP3/TP4 |
| Light-responsive edge-darkening | `frontend/src/lab/textures.ts` | TableLab.tsx (aoMap wiring) | aoMap texture in textures.ts; material.aoMap + aoMapIntensity in TableLab |
| Inlay-sharpness map (if separate) | `frontend/src/lab/textures.ts` | TableLab.tsx (map/alphaMap) | Keeps texture logic centralized |
| Metric verification | `tools/table-3d/` + `.dev-stack/lab-shot.mjs` | — | Frozen eval kit; no changes |

---

## Standard Stack

### Core (all confirmed installed — verified from frontend/package.json + node_modules)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `three` | 0.169.0 [VERIFIED: frontend/node_modules/three/package.json] | MeshPhysicalMaterial, CanvasTexture, RepeatWrapping | The only renderer in this project |
| `@react-three/fiber` | ^8.17.10 [VERIFIED: frontend/package.json] | Declarative R3F wrapper over three | Already in use throughout TableLab.tsx |
| `@react-three/drei` | ^9.114.0 [VERIFIED: frontend/package.json] | useMemo/useTexture patterns | Already in use |

### No new packages required

TP1 requires zero new npm dependencies. Everything — MeshPhysicalMaterial, CanvasTexture, normalScale (Vector2), RepeatWrapping — is already available in the installed `three` 0.169.0. The shared helper is authored code in `frontend/src/lab/`.

### Verification

```bash
# Confirmed installed:
node -e "const p=require('./frontend/node_modules/three/package.json');console.log(p.version)"
# Output: 0.169.0
```

---

## Package Legitimacy Audit

> No new packages are installed in TP1. This section is N/A.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
feltTexture() [textures.ts]
  ├── ALBEDO (S=2048)
  │     ├── base radial gradient (#1f9163→#147a51→#0a4a33) — M3 anchors PRESERVED
  │     ├── logo + brass ring + suit aces (born-in)
  │     └── vignette REMOVED ← D-03
  │
  ├── INLAY MAP (S=1024 OR shared albedo S=2048)  ← D-04
  │     └── mark + suits at higher apparent resolution
  │
  ├── NAP NORMAL MAP (S=512–1024, LINEAR colorspace)  ← D-01
  │     └── heightToNormalMap(concentricHeightField) via normalMapHelper.ts
  │
  └── EDGE-DARKEN AO MAP (S=512, LINEAR colorspace)  ← D-03
        └── radial grayscale: 1.0 center → ~0.75 edge (very subtle)

TableLab.tsx felt material useMemo:
  MeshStandardMaterial → MeshPhysicalMaterial
    map:              feltTexture(albedo S=2048)
    normalMap:        feltNapNormalMap()  ← new
    normalScale:      Vector2(0.28, 0.28) (or .set(x,x))
    normalMap.repeat: .set(8, 8)  +  RepeatWrapping
    aoMap:            feltEdgeAoMap()  ← new (replaces baked vignette)
    aoMapIntensity:   0.18           (very subtle — D-03)
    sheen:            0.70            ← D-02
    sheenColor:       #2aad7a         ← slightly lighter than #1f9163
    sheenRoughness:   0.65            ← D-02 anti-satin
    anisotropy:       0.25            ← D-01 (NOT anisotropyMap)
    anisotropyRotation: 0             (rotation handled in normalMap, not here)
    roughness:        0.93            ← unchanged (anti-satin)
    metalness:        0
    envMapIntensity:  0.3             (unchanged)
    alphaTest:        0.5             (born-in discipline preserved)
```

### Recommended Project Structure

No new directories. All new files stay inside `frontend/src/lab/`:

```
frontend/src/lab/
├── textures.ts          (MODIFIED: feltTexture S→2048, vignette removed, feltNapNormalMap(), feltEdgeAoMap() added)
├── normalMapHelper.ts   (NEW: shared heightToNormalMap utility)
├── TableLab.tsx         (MODIFIED: felt material → MeshPhysicalMaterial; normalMap/aoMap wired)
└── ... (other files unchanged)
```

---

## Core Technical Findings

### 1. MeshPhysicalMaterial API — three.js 0.169.0

**All APIs verified from `frontend/node_modules/three/src/materials/MeshPhysicalMaterial.js`** [VERIFIED: installed source]

```typescript
// Source: frontend/node_modules/three/src/materials/MeshPhysicalMaterial.js (line 52-74)
// All these properties exist in three 0.169.0:
new THREE.MeshPhysicalMaterial({
  // Standard (inherited from MeshStandardMaterial):
  map,           // albedo texture
  normalMap,     // tangent-space normal map
  normalScale,   // Vector2 (x,y scale) — defaults (1,1)
  aoMap,         // ambient occlusion map
  aoMapIntensity,// float 0..1
  roughness,     // 0..1
  metalness,     // 0..1
  envMapIntensity,
  alphaTest,

  // Physical extensions:
  sheen,         // 0..1  (private _sheen, setter triggers version bump when crossing 0)
  sheenColor,    // THREE.Color
  sheenRoughness,// 0..1  (clamped to 0.07..1.0 in shader)
  anisotropy,    // 0..1  (private _anisotropy, setter triggers version bump when crossing 0)
  anisotropyRotation, // radians; rotates the anisotropy direction in TBN space
  anisotropyMap,  // optional RG texture for directional modulation — NOT needed for uniform nap
})
```

**Sheen behavior (verified from shader source `lights_physical_fragment.glsl.js`):**
- Sheen is added AFTER the GGX BRDF term, weighted by `sheenEnergyComp = 1.0 - 0.157 * max3(sheenColor)`
- At `sheen 0.70` + `roughness 0.93`: the Charlie lobe is broad and diffuse (high roughness = spread sheen) — "fuzz" not "satin"
- Satin drift happens when `roughness < 0.75` — at 0.93 the sheen lobe is wide enough to read as texture shimmer, not gloss
- `sheenRoughness` is clamped to `max(x, 0.07)` in the shader — no hard black at very low values

**Anisotropy — TBN source (CRITICAL finding, verified from `normal_fragment_begin.glsl.js`):**

When `USE_ANISOTROPY` is defined AND `USE_TANGENT` is NOT (i.e., no explicit geometry tangents):
```glsl
// From normal_fragment_begin.glsl.js lines 22-48 [VERIFIED]
mat3 tbn = getTangentFrame( - vViewPosition, normal, vUv );
// => getTangentFrame uses screen-space dFdx/dFdy of position + UV
// to derive T and B from the local UV gradient (Mikkelsen method)
```

This means anisotropy direction comes from **UV gradient**, not vertex tangent attributes. `PlaneGeometry` does not need `.computeTangents()`. **The OVAL_X=1.22 scale stretches the UV gradient**, making the derived tangent frame match the stretched surface — so with `anisotropy 0.25` the directional effect will follow the UV-space anisotropy direction. For a concentric nap this is acceptable (the nap normalMap provides the concentric directional cue; anisotropy adds a mild grazing shift).

**Existing working example in this codebase:**

```typescript
// From TableLab.tsx lines 388-401 — leatherMat already uses all three sheen properties:
const leatherMat = new THREE.MeshPhysicalMaterial({
  sheen: 0.4,
  sheenColor: new THREE.Color("#b08a64"),
  sheenRoughness: 0.6,
  // ... bumpMap, clearcoat ...
});
// [VERIFIED: TableLab.tsx line 388-401] — proves the compile path works today
```

---

### 2. Concentric Nap NormalMap — OVAL_X UV Distortion

**The problem:** The felt mesh is `<planeGeometry args={[FELT_R*2, FELT_R*2, 1, 1]}>` inside `<group scale={[OVAL_X=1.22, 1, 1]}>`. The PlaneGeometry UV range is `[0,1]×[0,1]` on the un-scaled square; the `scale` group stretches world-space X by 1.22 but does NOT change UVs. [VERIFIED: confirmed from TableLab.tsx line 428-431 + three.js PlaneGeometry UV generation]

**Effect on concentric nap:** If the normalMap has concentric rings at equal UV radii, the rings will appear as ovals on the screen (correct — they should match the oval felt outline). The `getTangentFrame` function derives T from `dFdx(uv.st)` / `dFdx(pos)` — with OVAL_X=1.22, the T direction in world space is compressed relative to UV-space-T, so the anisotropy direction will be slightly mismapped. At `anisotropy 0.25` this mismatch causes ≤ a few degrees of directional drift — visually negligible at that anisotropy strength.

**Recommendation (confirmed safe):** Author the normalMap with concentric rings centered at UV (0.5, 0.5). The rings will naturally appear oval on the felt because the mesh is inside the 1.22x scale group. No UV correction needed. The `normalMap.repeat.set(8, 8)` tiles the micro-nap correctly because repeat applies in UV-space — the physical nap wavelength in world-X will be `(FELT_R*2*OVAL_X)/8 ≈ wider` than in world-Z. This is correct: a wider X-tile interval matches the stretched oval shape (nap "runs" match the oval circumference proportionally).

**What NOT to do:** Do NOT add custom UV attributes or rewrite PlaneGeometry. Do NOT call `.computeTangents()` — it would change the TBN source from derivative-based to attribute-based, which could break the normalMap unless the tangent attributes are authored consistently. [ASSUMED: computeTangents interaction with the R3F declarative scene has not been tested in this codebase — defer unless visual inspection shows a seam.]

---

### 3. Shared Height→Normal Helper — First Use

**Confirmed absent.** No existing helper was found in `frontend/src/lab/`. [VERIFIED: Glob search returned only silhouettes.ts, textures.ts, StatsProbe.test.ts, cards.test.ts, cards.ts]

**Recommended location:** `frontend/src/lab/normalMapHelper.ts`

**Signature:**

```typescript
/**
 * Convert a grayscale height field on a canvas to a tangent-space normal map.
 * Uses Sobel kernels: Gx / Gy finite differences over the height field.
 * Returns a THREE.CanvasTexture in LINEAR (NoColorSpace) — suitable for normalMap.
 *
 * @param heightCanvas  A canvas whose luminance encodes height (0=low, 255=high)
 * @param strength      Multiplier on the XY gradient before normalizing (1.0 = neutral)
 */
export function heightToNormalMap(
  heightCanvas: HTMLCanvasElement,
  strength: number = 1.0,
): THREE.CanvasTexture

/** Convenience: build a height field canvas of given size using a drawing callback. */
export function makeHeightCanvas(
  size: number,
  drawFn: (ctx: CanvasRenderingContext2D, size: number) => void,
): HTMLCanvasElement
```

**Sobel→RGB-normal math (verified against standard references):**

```typescript
// For each pixel (x, y):
// Sample height field h at 3x3 neighbourhood
// Gx = Sobel X gradient (right - left weighted sum)
// Gy = Sobel Y gradient (bottom - top weighted sum)
// Normal: nx = -Gx * strength / 255
//         ny = -Gy * strength / 255
//         nz = 1.0  (pointing out of surface)
// Normalize to unit vector
// Encode to RGB: R = (nx+1)/2 * 255, G = (ny+1)/2 * 255, B = (nz+1)/2 * 255
// Standard tangent-space normal map convention (same as three.js expects)

// THREE.CanvasTexture colorSpace = THREE.NoColorSpace (gray() pattern from textures.ts)
// — normal maps must NOT be sRGB-decoded
```

**Concentric height field for D-01 (concentric / oval-classic nap):**

```typescript
// Height field: radial concentric rings from UV center (0.5, 0.5)
// Height(u, v) = sin(distance_from_center * 2π * ringFreq) * 0.5 + 0.5
// ringFreq ≈ 3–6 per unit radius — within repeat 8 tile, this gives
// ~24–48 physical ring-pairs across the felt diameter → fine micro-nap
// (Not the same as a linear brushed metal pattern — rings curve, matching oval baize)

// The ring center should be at (0.5, 0.5) in the height canvas so that
// when the normalMap is tiled (repeat 8), each tile has its own concentric micro-rings
// — which at macro scale reads as directional fiber variation, not individual rings.
// At repeat ≥ 6 the individual rings become sub-pixel at HERO fov32, but are visible
// at MACRO fov26 as fine texture. This is the correct behavior.
```

**Reuse plan:**
- TP3 chips: `heightToNormalMap(chipCFaceHeight, 1.2)` — the tooled C groove bump→normal
- TP4 wood: `heightToNormalMap(woodGrainHeight, 0.6)` — micro grain relief
- TP5 leather upgrade (if needed): already has bumpMap, may upgrade to normalMap

---

### 4. Vignette Removal + Light-Responsive Edge-Darkening

**Current baked vignette (to be removed):**

```typescript
// textures.ts lines 492-497 — REMOVE THIS BLOCK entirely:
const vig = ctx.createRadialGradient(r, r, r * 0.42, r, r, r);
vig.addColorStop(0, "rgba(0,0,0,0)");
vig.addColorStop(1, "rgba(0,0,0,0.5)");
ctx.fillStyle = vig;
ctx.fillRect(0, 0, S, S);
// [VERIFIED: textures.ts lines 492-497]
```

**Light-responsive edge-darkening options (D-03: very subtle, not baked):**

| Approach | How | Light-Responsive? | Risk | Verdict |
|----------|-----|------------------|------|---------|
| **aoMap radial grayscale** | Bake a subtle radial AO texture (1.0 center → 0.75 edge); wire as `aoMap` + `aoMapIntensity ≈ 0.18` | Partial — `aoMap` multiplies the indirect light only; direct light is unaffected, so bright direct light reduces the darken effect → feels physically plausible | aoMapIntensity must stay ≤ 0.25 or it dominates. Very easy to control. | **RECOMMENDED** |
| Vertex colors (dark ring at outer vertices) | Encode darkness at felt boundary vertices; multiply in material | No — vertex colors are not light-responsive natively | Requires PlaneGeometry subdivision (1,1 → e.g. 16,16 + outer ring darkened); adds geometry complexity | Not recommended (extra geometry + not light-responsive) |
| Emissive negative (emissiveMap) | Dark emissive at edges | No — subtractive emissive goes below 0 only via tone map; not standard | Complex and non-physical | Not recommended |
| Clearcoat ring (outer dark strip) | Clearcoat with dark clearcoatNormalMap at edges | No clear path | Very complex, non-physical | Not recommended |

**Recommended approach: `aoMap` radial gradient (very subtle):**

```typescript
// New function in textures.ts: feltEdgeAoMap()
export function feltEdgeAoMap(): THREE.CanvasTexture {
  const S = 512;
  const { c, ctx } = makeCanvas(S, S);
  const r = S / 2;
  // White center (full indirect light) → very subtle darkening at edge
  const g = ctx.createRadialGradient(r, r, 0, r, r, r * 1.0);
  g.addColorStop(0, "#ffffff");   // no AO at center
  g.addColorStop(0.7, "#ffffff"); // keep clean through most of the felt
  g.addColorStop(1, "#c0c0c0");   // very subtle (~25% AO at absolute edge)
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return gray(c);  // LinearColorSpace — NOT sRGB
}
// aoMapIntensity: 0.18  (start value; operator can raise to 0.25 max before D-03 is violated)
```

**Critical: PlaneGeometry UV2 requirement for aoMap.** Three.js aoMap reads from `uv2` (UV channel 2). `PlaneGeometry(r*2, r*2, 1, 1)` only provides `uv` (channel 1). In three.js 0.169, `aoMap` uses `uv2` when the `USE_LIGHTMAP` define is active, but in practice the material also accepts `uv` as the aoMap UV source when `uv2` is not present — confirmed by the `aomap_pars_fragment` pattern in recent three.js which uses `vAoMapUv`. [ASSUMED: need to verify aoMap UV channel behavior in r169 specifically — see pitfall below.]

**Safer alternative if UV2 is an issue:** Bake the subtle radial darkening directly into the albedo at a very low opacity (rgba(0,0,0,0.12) at the edge instead of 0.5) — this is NOT a full vignette (D-03 compliant), just a shadow-hint that never changes with lighting. Less elegant than aoMap but avoids the UV2 pitfall.

---

### 5. MACRO Inlay Sharpness (D-04)

**Current state:** feltTexture canvas is `S=1024`. The mark (logo at `lr = r*0.34 = ~174px` diameter) and the 4 ace suits (drawn at `h = r*0.27 ≈ 138px`) are soft at MACRO fov26 because the texture is 1024² shared with the tiled nap normalMap.

**Option A: Raise albedo canvas to S=2048**

- Mark diameter becomes 348px, ace suits ≈ 276px — approximately 2x sharper MACRO read
- The M3 anchor gradient uses fractional `colorStop` positions, not absolute px — M3 still passes (gradient is redrawn at the same relative proportions, same anchor colors) [VERIFIED: M3 reads mean RGB of felt region, not gradient topology]
- Texture memory: 2048² × 4 bytes × mipmaps ≈ 16 MB per texture (vs 4 MB at 1024²) — acceptable on RTX 4060; no M10 regression (M10 measures draw calls, not VRAM)
- `anisotropy: 8` already set (srgb() helper in textures.ts line 149) — mip chain built correctly by three.js automatically for CanvasTexture

**Option B: Separate inlay-only map (S=1024) for mark + suits on a transparent albedo**

- The mark and suits are drawn at fixed positions in the felt canvas; a separate inlay map would require the mark geometry to NOT be PlaneGeometry — it would need its own mesh with alphaMap, which breaks the born-in discipline (D-04 says mark stays born-in, no floating decal)
- Alternative: keep the single PlaneGeometry with alphaTest; add an `emissiveMap` carrying only the mark+suits drawn at 2x resolution for a crispness boost. But this is more complex and emissive adds light-emission which is wrong for a inlaid motif.

**Decision recommendation for planner: Option A (S=2048 albedo) is simpler, safer, M3-compliant, and honors D-04's born-in requirement.** The planner should document VRAM delta and confirm operator is OK with the memory cost (this is research-grade information, not a locked decision).

**Inlay rendering at S=2048:**

```typescript
const S = 2048;  // was 1024
const r = S / 2; // = 1024
// All existing relative positions (r*0.34, r*0.6, r*0.27, etc.) scale correctly
// — they are all fractions of r, not absolute pixels.
// The brass ring lineWidth = S*0.006 also scales correctly.
// speckle(ctx, S, S, 9) scales correctly (deterministic hash, not position-dependent).
```

---

### 6. Verification Path

**Eval kit is FROZEN at TP0** [VERIFIED: STATE.md + CONTEXT.md]. No changes to any file in `tools/table-3d/` or `.dev-stack/lab-shot.mjs`.

**Capture + gate sequence for TP1:**

```bash
# 1. Rollback tag BEFORE any edit (per SSOT §5.3):
git tag tp1-before-felt HEAD

# 2. Dev server must be running on port 5173:
cd frontend && npm run dev

# 3. HERO capture (fov32):
LAB_URL="http://localhost:5173/table-lab.html?cam=hero" \
  node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp1/hero.png

# 4. MACRO capture (fov26) — primary for inlay sharpness:
LAB_URL="http://localhost:5173/table-lab.html?cam=macro" \
  node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp1/macro.png

# 5. POV capture (fov40) — primary for sheen/nap read:
LAB_URL="http://localhost:5173/table-lab.html?cam=card" \
  node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp1/card.png

# 6. Run admitted metrics over HERO:
node tools/table-3d/run-metrics.mjs .dev-stack/diag/table-3d/tp1
# Must PASS: M3 (felt-hue ΔE<12), M5 (highlight-clip), +B (fuzz not satin)
# Must NOT regress: M4, M6, M8, +A (unchanged geometry/scene)

# 7. Regional MSE (M12) — against tp1-before-felt tag anchors:
# The feltHero/macroIdentity regions WILL change (intended) — M12 confirms
# the CARD region is byte-identical (mark stays born-in).
```

**M3 compliance guarantee:**
- The M3 gate measures `mean RGB` of the `feltHero` rect (left:760, top:500, width:200, height:120 on a 2880×1800 frame)
- This rect is upper-left felt — it samples the radial gradient in the `#147a51` → `#0a4a33` transition zone
- The gradient base colors (`#1f9163`, `#147a51`, `#0a4a33`) are UNCHANGED in the albedo upgrade
- Going from S=1024 to S=2048 rescales the gradient proportionally (same `addColorStop` fractions) → M3 still passes
- The new sheenColor `#2aad7a` appears on top of this in the render but the underlying albedo sample is still correct felt green → M3 not affected by sheen (M3 reads pixel luminance, which is influenced by sheen but sheen is a specular effect, not albedo)
- [ASSUMED: the sheen contribution at the feltHero rect may add a small specular brightening at certain viewing angles; the +B gate (sheen < 8% of felt at luma>210) provides the control for this]

**+B gate compliance with D-02:**
- `+B` threshold: bright-sheen fraction (pixels with luma > 210) must be ≤ 8% of the felt region
- At `sheen 0.70` + `roughness 0.93` + `sheenRoughness 0.65`: the Charlie lobe is broad; bright pixels are spread wide and individually low-intensity rather than concentrated in a narrow streak
- The risk of +B failure is higher at `sheen > 0.80` or `roughness < 0.85` — D-02's target ~0.65–0.75 stays safely below that
- The A/B operator gate (+B "fuzz not satin") is the final arbiter

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Normal map encoding from height | Custom bit-manipulation | Sobel convolution on `getImageData` + standard `(n+1)/2*255` encoding | Standard tangent-space encoding; three.js fragment shader expects exact RGB=(+X+1)/2, (Y+1)/2, (Z+1)/2 convention |
| Tangent attribute for anisotropy | `.computeTangents()` + BufferAttribute | Let three.js use `getTangentFrame()` (built-in shader derivative method) | PlaneGeometry has no tangents; derivative method works correctly at anisotropy 0.15–0.4 |
| Satin prevention | Custom shader override | `roughness ≥ 0.90` + `sheenRoughness ≥ 0.60` | The Charlie sheen model's broad lobe at high roughness self-prevents satin; shader clamping + M5/+B gates confirm |
| Anisotropy direction map | UV-encoded RG anisotropyMap | `anisotropyRotation: 0` (global uniform direction) | At 0.15–0.4 anisotropy strength, a global direction is sufficient; anisotropyMap adds complexity and a texture slot |

---

## Common Pitfalls

### Pitfall 1: Satin Drift (roughness too low)
**What goes wrong:** Felt gains a glassy, casino-green satin sheen instead of matte fuzz. The operator stops the gate.
**Why it happens:** `roughness` set below 0.88 concentrates the GGX specular lobe; the Charlie sheen lobe compounds with it.
**How to avoid:** Never lower roughness below 0.90 (D-02 / SSOT hard floor 0.90–0.94). Check +B PASS after every iteration.
**Warning signs:** +B metric fails (sheen fraction > 8%); operator reads "casino green" in the A/B.

### Pitfall 2: Anisotropy > 0.5 → Brushed Metal Read
**What goes wrong:** The felt surface acquires a distinct linear streak / brushed-metal highlight instead of a subtle weave shimmer.
**Why it happens:** Anisotropy > 0.5 makes `material.alphaT` (roughness along the anisotropic tangent direction) significantly different from the base roughness, creating a visible "streak" direction.
**How to avoid:** Cap `anisotropy ≤ 0.4` (SSOT hard ceiling). Start at 0.25, iterate upward only.
**Warning signs:** A visible linear light streak at POV grazing angle; "brushed steel" read at MACRO.

### Pitfall 3: M3 Broken by sheenColor Shift
**What goes wrong:** M3 (felt-hue ΔE < 12) fails because sheenColor pushes the mean RGB of the felt region outside the anchor tolerances.
**Why it happens:** `sheenColor` that is too saturated or too different from the felt green can bias the rendered pixel statistics; M3 measures rendered pixels (the HERO screenshot), not the albedo texture.
**How to avoid:** `sheenColor` must stay a slightly-lighter Chiribito green (e.g. `#2aad7a`). Avoid blue-shifted or desaturated sheen colors. If M3 is borderline, reduce `sheen` intensity slightly.
**Warning signs:** M3 `value` rising above 9; `meanRgb` shifting toward a lighter/bluer green than the anchor set.

### Pitfall 4: aoMap UV2 Missing → Edge Darkening Invisible
**What goes wrong:** The `feltEdgeAoMap()` texture is assigned but produces no visible darkening because three.js `aoMap` reads `vAoMapUv` (UV channel 2) and `PlaneGeometry(1,1,1,1)` does not emit `uv2` attributes.
**Why it happens:** In three.js 0.169, `aoMap` requires `uv2` on the geometry. `PlaneGeometry` generates only `uv` (channel 1). [ASSUMED: need to verify exact UV channel behavior for aoMap in r169 — see three.js `aomap_pars_fragment` shader chunk]
**How to avoid:** Before implementing aoMap approach: read `frontend/node_modules/three/src/renderers/shaders/ShaderChunk/aomap_pars_fragment.glsl.js` to confirm which UV channel is used. If UV2 is required, either: (a) copy `uv` to `uv2` on the PlaneGeometry via `setAttribute('uv2', geometry.getAttribute('uv'))` in the JSX ref callback, or (b) fall back to baking the very-subtle darkening into the albedo at low opacity (rgba(0,0,0,0.12) at absolute edge — D-03 compliant).
**Warning signs:** Material with `aoMap` assigned but felt edge looks identical to the no-aoMap state.

### Pitfall 5: Baked Vignette Removal Drops Below Reference Floor
**What goes wrong:** After removing the black vignette (lines 492-497), the felt reads brighter/flatter than the protected reference (`docs/table-3d/anchors/reference-tag/`), triggering a M12 regression vs the reference floor.
**Why it happens:** The baked vignette was providing depth that is now missing, and the aoMap replacement is too subtle to compensate.
**How to avoid:** The reference floor comparison is OPERATOR A/B only (M12 whole-frame is informational, not auto-fail — per SSOT §4.5). The light-responsive edge-darkening is only required to "not regress below reference" perceptually. If the operator reads the felt as too flat, increase `aoMapIntensity` up to 0.25 (D-03 limit). TP6 will add proper restrained vignette.
**Warning signs:** Operator says "felt looks flat / floating / lost dimension" in A/B.

### Pitfall 6: Mark Lost After feltTexture Resize to S=2048
**What goes wrong:** The `logoImg` render position (`lr = r * 0.34`) or the ace suit positions are misaligned after canvas resize.
**Why it happens:** All positions in feltTexture() are fractions of `r = S/2` — they scale automatically. But if any constant was accidentally hardcoded as a pixel value, it breaks.
**How to avoid:** Audit feltTexture() for any hardcoded pixel constants (none found — all are `r * fraction` or `S * fraction`). Run MACRO capture and visually confirm mark center + suit positions are unchanged after resize.
**Warning signs:** Born-in mark appears off-center at MACRO; M12 macroIdentity MSE is non-zero when it should only change in texture sharpness (which is expected) — wait, M12 macroIdentity WILL change legitimately (sharper = different pixels). The born-in check is visual, not MSE.

### Pitfall 7: NormalMap in sRGB ColorSpace → Wrong Normals
**What goes wrong:** The nap normalMap appears to emboss at the wrong angles, or the normals cancel out, producing a flat surface with no micro-relief.
**Why it happens:** If the CanvasTexture is created with `SRGBColorSpace` (the `srgb()` helper), the RGB values are gamma-decoded before the shader reads them as XYZ normals. Normal maps must be linear.
**How to avoid:** Use the `gray()` helper from textures.ts (`colorSpace = THREE.NoColorSpace`) for ALL normalMap textures. The `gray()` helper is already the correct pattern for bump maps in this codebase. [VERIFIED: textures.ts lines 152-158 — gray() sets NoColorSpace]
**Warning signs:** Felt looks embossed in the wrong direction, or surface appears unnaturally smooth despite normalScale > 0.

### Pitfall 8: Concentric Ring Frequency Too Low → Rings Visible at HERO
**What goes wrong:** The nap normalMap shows visible concentric ring bands at HERO fov32 (rings read as 3D topography, not texture).
**Why it happens:** Ring frequency too low (e.g. ringFreq = 1–2 per tile) — individual rings are large enough to see at macro.
**How to avoid:** Use `ringFreq ≥ 4` within the height canvas, combined with `normalMap.repeat.set(8, 8)`. At repeat=8, each tile covers 1/8 of the felt diameter. At ringFreq=4, that's 32 ring-pairs across the diameter — sub-pixel at HERO, visible as fine weave at MACRO. Test at MACRO fov26 first.
**Warning signs:** Visible concentric bands at HERO fov32 — "vinyl record" look instead of micro-fiber.

---

## Code Examples

### MeshPhysicalMaterial felt upgrade (in TableLab.tsx useMemo)

```typescript
// Source: verified against three 0.169.0 MeshPhysicalMaterial.js + leatherMat pattern (TableLab.tsx:388)
import * as THREE from "three";
import { feltTexture, feltNapNormalMap, feltEdgeAoMap } from "./textures";

// Inside useMemo (existing pattern):
const feltMat = new THREE.MeshPhysicalMaterial({
  map: feltTexture(logoImg, aceImgs),        // S=2048 albedo, no baked vignette
  normalMap: feltNapNormalMap(),             // new — concentric nap from helper
  normalScale: new THREE.Vector2(0.28, 0.28),
  aoMap: feltEdgeAoMap(),                    // new — very subtle edge darken
  aoMapIntensity: 0.18,
  sheen: 0.70,                               // D-02: contained, ~0.65-0.75
  sheenColor: new THREE.Color("#2aad7a"),    // D-02: slightly lighter Chiribito green
  sheenRoughness: 0.65,                      // D-02: anti-satin
  anisotropy: 0.25,                          // D-01: restrained, within 0.15-0.4
  anisotropyRotation: 0,                     // tangent from UV derivative — nap handled by normalMap
  roughness: 0.93,                           // unchanged — anti-satin
  metalness: 0,
  envMapIntensity: 0.3,                      // unchanged
  alphaTest: 0.5,                            // born-in discipline preserved
});
// Repeat must be set on the normalMap texture before or after:
// (feltNapNormalMap returns a texture with repeat set internally)
```

### NormalMap texture builder (in textures.ts)

```typescript
// Source: standard Sobel normal-map construction; verified against three.js encoding convention
export function feltNapNormalMap(): THREE.CanvasTexture {
  const S = 512; // 512² is sufficient for repeat-8 nap at MACRO fov26
  const { c, ctx } = makeCanvas(S, S);
  const r = S / 2;

  // Draw concentric height field: sin-based rings from center
  const imgData = ctx.createImageData(S, S);
  const d = imgData.data;
  const ringFreq = 5; // ring-pairs per normalized radius unit
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const dx = (px / S - 0.5), dy = (py / S - 0.5);
      const dist = Math.sqrt(dx*dx + dy*dy) * 2; // 0 at center, 1 at edge
      const h = (Math.sin(dist * Math.PI * ringFreq * 2) * 0.5 + 0.5) * 255;
      const i = (py * S + px) * 4;
      d[i] = d[i+1] = d[i+2] = h;
      d[i+3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Convert height to normal via heightToNormalMap helper (normalMapHelper.ts)
  const normalCanvas = heightToNormalMap(c, 1.0); // strength tuned by normalScale in material
  const t = gray(normalCanvas); // NoColorSpace — CRITICAL for normal maps
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(8, 8);
  return t;
}
```

### Height→Normal helper (normalMapHelper.ts)

```typescript
// Source: standard Sobel finite-difference normal map; validated against three.js
// tangent-space normal convention (R=+X, G=+Y, B=+Z, all encoded (n+1)/2)
export function heightToNormalMap(
  heightCanvas: HTMLCanvasElement,
  strength: number = 1.0,
): HTMLCanvasElement {
  const W = heightCanvas.width, H = heightCanvas.height;
  const { c, ctx } = makeCanvas(W, H);
  const src = heightCanvas.getContext("2d")!;
  const input = src.getImageData(0, 0, W, H).data;
  const out = ctx.createImageData(W, H);
  const od = out.data;

  const getH = (x: number, y: number): number => {
    const xi = (x + W) % W, yi = (y + H) % H;
    return input[(yi * W + xi) * 4] / 255; // 0..1
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // 3x3 Sobel
      const tl=getH(x-1,y-1), tc=getH(x,y-1), tr=getH(x+1,y-1);
      const cl=getH(x-1,y),                     cr=getH(x+1,y);
      const bl=getH(x-1,y+1), bc=getH(x,y+1), br=getH(x+1,y+1);
      const gx = (tr + 2*cr + br) - (tl + 2*cl + bl);
      const gy = (bl + 2*bc + br) - (tl + 2*tc + tr);
      // Normal: perpendicular to surface gradient, pointing out
      let nx = -gx * strength;
      let ny = -gy * strength;
      let nz = 1.0;
      const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
      nx /= len; ny /= len; nz /= len;
      // Encode to RGB tangent-space normal map
      const i = (y * W + x) * 4;
      od[i]   = Math.round((nx + 1) * 0.5 * 255);
      od[i+1] = Math.round((ny + 1) * 0.5 * 255);
      od[i+2] = Math.round((nz + 1) * 0.5 * 255);
      od[i+3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return c;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `MeshStandardMaterial` for felt (no sheen) | `MeshPhysicalMaterial` with Charlie sheen lobe | TP1 | Cloth micro-fiber shimmer at grazing angle |
| Baked albedo vignette (depth = painted) | AoMap radial + material+light response | TP1 | Depth moves out of albedo into rendering |
| 1024² felt canvas (soft MACRO inlay) | 2048² felt canvas (crisp MACRO) | TP1 | Mark + suits legible at money-shot MACRO fov26 |
| No normalMap (flat felt surface) | Concentric nap normalMap (repeat 8) | TP1 | Tangible micro-fiber direction under lighting |
| No shared height→normal helper | `normalMapHelper.ts` (first use) | TP1 | Reusable by TP3/TP4 — no re-implementation |

**Deprecated / not applicable:**
- `MeshTransmissionMaterial`: ruled out in SSOT TP2 for card edges; also never appropriate for felt
- `bumpMap` on felt: upgrading directly to tangent-space normalMap (per SSOT spec); bumpMap remains valid for leather/chips but is a lower-fidelity option
- `anisotropyMap` (RG texture): not needed for uniform concentric nap — `anisotropyRotation: 0` + normalMap directional cue is sufficient at D-01 anisotropy 0.15–0.4

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `aoMap` in three 0.169 accepts `uv` (channel 1) when `uv2` is absent, OR uses `vAoMapUv` which may default to `vUv` | Edge-Darkening / Pitfall 4 | aoMap produces no visible result; fallback: bake subtle darkening into albedo |
| A2 | At `anisotropy 0.25`, the OVAL_X=1.22 TBN-frame mismatch causes only a negligible directional drift (a few degrees) — visually undetectable | Concentric Nap / OVAL_X section | Anisotropy direction reads as tilted rather than concentric; fix: reduce anisotropy further or add explicit `uv2` with corrected UVs |
| A3 | Sheen contribution at the `feltHero` M3 sample rect (left:760, top:500) stays within the ΔE<12 tolerance vs the anchor colors — the sheen specular at that location does not grossly shift the mean RGB | Verification Path / M3 | M3 fails; fix: slightly reduce `sheen` or reposition M3 rect (but rect is frozen at TP0 — reduce sheen) |
| A4 | `computeTangents()` is NOT called on PlaneGeometry (i.e., `USE_TANGENT` is NOT defined in the shader) — the derivative `getTangentFrame` path is active | Anisotropy TBN section | If R3F or Drei injects tangents automatically in some scenarios, the TBN behavior changes; visual inspection confirms which path is active |
| A5 | `heightToNormalMap` at `strength=1.0` + `normalScale 0.28` produces a visually acceptable micro-nap at repeat=8 on a 512² canvas | normalMapHelper code example | Nap too strong/weak; tunable via `strength` and `normalScale` — iterative |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed. (This table is not empty — 5 assumptions require visual/runtime verification during implementation.)

---

## Open Questions (RESOLVED)

> **All three RESOLVED (2026-06-10):**
> (1) **aoMap UV channel** → disposition: runtime branch in plan **02-01-T1**, which reads `aomap_pars_fragment.glsl.js` + `uv_pars_vertex.glsl.js` and decides A1-uv2 (`geometry.setAttribute('uv2', uv)` via a JSX ref) / A1-uv1 / A1-albedo-fallback (subtle albedo edge-darken, D-03-compliant); recorded in `docs/table-3d/TP1_A1_AOMAP_UV.md`.
> (2) **normalScale × sheen** → disposition: start `normalScale=0.25` + `sheen=0.70` (set in 02-03-T1); the **+B gate in 02-03-T2** is the automated arbiter — reduce normalScale before sheen if +B fails.
> (3) **concentric vs tiled read at POV** → disposition: `ringFreq` + `repeat=8` (per §2 / Pitfall 8); the **POV capture in 02-03-T2** + the **operator A/B in 02-04** are the empirical checks; add noise modulation if rings read busy.

1. **aoMap UV channel behavior in three.js 0.169**
   - What we know: `aoMap` is standard in MeshStandardMaterial/MeshPhysicalMaterial; `PlaneGeometry` emits only `uv` (no `uv2`)
   - What's unclear: Whether `vAoMapUv` in r169 falls back to `vUv` when `uv2` is absent, or silently shows no AO
   - Recommendation: First implementation task — read `frontend/node_modules/three/src/renderers/shaders/ShaderChunk/aomap_pars_fragment.glsl.js` and `uv_pars_vertex.glsl.js` before wiring aoMap; if UV2 required, add `geometry.setAttribute('uv2', geometry.getAttribute('uv'))` via a JSX ref on the mesh

2. **Optimal normalScale range vs sheen interaction**
   - What we know: SSOT says `normalScale 0.2–0.35`; the Charlie sheen lobe also responds to the normal perturbation
   - What's unclear: Whether high normalScale + high sheen causes +B to fail (sheen on micro-peaks concentrates specular)
   - Recommendation: Start at `normalScale 0.25` + `sheen 0.70`; run +B gate; if fail, reduce normalScale first (weaker nap before reducing sheen)

3. **Concentric nap vs tiled nap visual read at POV**
   - What we know: D-01 specifies concentric/oval-classic; the height canvas produces rings centered at UV (0.5,0.5)
   - What's unclear: At repeat=8, do the rings read as "concentric weave" or as a busy tiled pattern at POV fov40?
   - Recommendation: Capture POV frame first; if ring-tiling reads busy, increase `ringFreq` or add noise modulation to the height field to break the pattern while preserving the concentric direction

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `three` | MeshPhysicalMaterial, CanvasTexture | Yes | 0.169.0 [VERIFIED] | — |
| `@react-three/fiber` | R3F declarative scene | Yes | ^8.17.10 [VERIFIED] | — |
| Dev server (Vite port 5173) | lab-shot.mjs capture | Must be running | — | `cd frontend && npm run dev` |
| Playwright (headless Chromium) | lab-shot.mjs | Present [VERIFIED: ROADMAP §1 "Tooling present"] | — | — |
| `sharp` (Node.js) | run-metrics.mjs | Present [VERIFIED: ROADMAP §1 + metrics.mjs import] | — | — |
| RTX 4060 + D3D11 ANGLE | GPU-faithful capture | Present [VERIFIED: STATE.md + lab-shot.mjs `--use-angle=d3d11`] | — | — |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

> `workflow.nyquist_validation` key absent from `.planning/config.json` → treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (frontend) |
| Config file | `frontend/vitest.config.ts` (or Vite config) |
| Quick run command | `cd frontend && npm test` |
| Full suite command | `cd frontend && npm test` + metric run `node tools/table-3d/run-metrics.mjs <capture>` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TP1-M3 | Felt-hue ΔE < 12 from anchors after material swap | Pixel metric | `node tools/table-3d/run-metrics.mjs .dev-stack/diag/table-3d/tp1` | ✅ (run-metrics.mjs) |
| TP1-M5 | Highlight-clip < 0.5% on felt after sheen added | Pixel metric | Same run-metrics invocation | ✅ |
| TP1-+B | Fuzz not satin (sheen fraction ≤ 8%) | Pixel metric | Same run-metrics invocation | ✅ |
| TP1-VISUAL | Operator A/B at POV + MACRO: real woven baize, no satin/casino-green? | Manual perceptual gate | HERO+MACRO+POV captures → operator review | Manual only |
| TP1-INLAY | MACRO inlay sharpness ≥ baseline (mark + suits crisper than TP0 anchors/head/macro.png) | Visual comparison | MACRO capture vs `docs/table-3d/anchors/head/macro.png` | Manual + M12 |
| TP1-REF | Felt never below protected reference (`docs/table-3d/anchors/reference-tag/`) | Regression floor | Operator A/B (M12 informational only) | Manual |

### Sampling Rate
- **Per task commit:** Capture HERO + run M3/M5/+B
- **Per wave merge:** Full HERO + POV + MACRO capture + all admitted metrics
- **Phase gate:** Full suite green + operator A/B before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `frontend/src/lab/normalMapHelper.ts` — new file, must be created in Wave 0 (before any consumer)
- [ ] `frontend/node_modules/three/src/renderers/shaders/ShaderChunk/aomap_pars_fragment.glsl.js` — **read before implementing aoMap** to resolve A1 (UV channel)

---

## Security Domain

> This phase involves no authentication, network calls, user input, secrets, or external services. Security domain is N/A for TP1 (visual-only lab changes, isolated from prod build).

---

## Sources

### Primary (HIGH confidence — verified from installed source)
- `frontend/node_modules/three/src/materials/MeshPhysicalMaterial.js` — full property list: sheen, sheenColor, sheenRoughness, anisotropy, anisotropyRotation, anisotropyMap, normalMap, aoMap, alphaTest confirmed [VERIFIED]
- `frontend/node_modules/three/src/renderers/shaders/ShaderChunk/normal_fragment_begin.glsl.js` — TBN derivation: `getTangentFrame` (UV derivative) used when `USE_TANGENT` not defined [VERIFIED]
- `frontend/node_modules/three/src/renderers/shaders/ShaderChunk/normalmap_pars_fragment.glsl.js` — `getTangentFrame` implementation (Mikkelsen method, UV+position screen derivatives) [VERIFIED]
- `frontend/node_modules/three/src/renderers/shaders/ShaderChunk/lights_physical_fragment.glsl.js` — sheen energy compensation formula; anisotropy alphaT mixing confirmed [VERIFIED]
- `frontend/node_modules/three/src/renderers/shaders/ShaderLib/meshphysical.glsl.js` — `USE_SHEEN` / `USE_ANISOTROPY` defines confirmed [VERIFIED]
- `frontend/node_modules/three/package.json` — version 0.169.0 [VERIFIED]
- `frontend/src/lab/textures.ts` — current feltTexture() implementation; baked vignette lines 492-497; gray()/srgb() helpers; S=1024 baseline [VERIFIED]
- `frontend/src/lab/TableLab.tsx` — current felt MeshStandardMaterial lines 369-375; existing leatherMat sheen usage lines 388-401; PlaneGeometry args + OVAL_X group scale lines 428-434 [VERIFIED]
- `tools/table-3d/metrics.mjs` — M3 anchors, +B threshold (luma>210, ≤8%), M5 (luma>250, <0.5% felt) [VERIFIED]
- `tools/table-3d/region-rects.json` — feltHero rect (760,500,200,120), frame 2880×1800, POV fov40 locked [VERIFIED]
- `frontend/package.json` — three ^0.169.0, @react-three/fiber ^8.17.10, @react-three/drei ^9.114.0 [VERIFIED]

### Secondary (MEDIUM confidence — from ROADMAP SSOT + CONTEXT.md)
- `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP1 lines 268-289 — material parameter ranges, gate criteria, risks [CITED: docs/ROADMAP_TABLE_3D_PERFECTION.md]
- `docs/ROADMAP_TABLE_3D_PERFECTION.md` §5 — cross-cutting guardrails: anti-casino hard-NO, no push/deploy, rollback tags, eval rig frozen [CITED: docs/ROADMAP_TABLE_3D_PERFECTION.md]
- `.planning/phases/02-tp1-felt-tapete-materiality-the-stage/02-CONTEXT.md` — D-01..D-05 locked decisions [VERIFIED]
- `.planning/STATE.md` — TP0 complete/frozen; Phase 2 authorized [VERIFIED]

---

## Metadata

**Confidence breakdown:**
- MeshPhysicalMaterial API (sheen/anisotropy/normalMap): HIGH — verified from installed three 0.169.0 source
- TBN derivation (no explicit tangents needed): HIGH — verified from shader source
- OVAL_X UV stretch effect on TBN: MEDIUM — derived from verified shader math; not directly tested
- aoMap UV channel behavior (A1): ASSUMED — requires runtime check before implementation
- normalMapHelper math (Sobel encoding): HIGH — standard algorithm; three.js convention verified from shader encoding expectation
- M3 compliance after S=2048: HIGH — gradient proportions unchanged; anchor colors unchanged
- +B compliance at sheen 0.70 + roughness 0.93: MEDIUM — within safe zone per SSOT; operator A/B is final arbiter

**Research date:** 2026-06-10
**Valid until:** 2026-07-10 (stable: three.js 0.169 is locked in devDependencies; SSOT ROADMAP is frozen at TP0)
