# Phase 3: TP2 — Cartas Materiality & Legibility (protagonist) - Research

**Researched:** 2026-06-11
**Domain:** Three.js 0.169 / React Three Fiber 8.17 PBR materials — card stock render
**Confidence:** HIGH (all API claims verified against installed source in
`frontend/node_modules/three@0.169.0`; all code claims verified against the actual
`frontend/src/lab/` source)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Eval-Rig Reconciliation — post-encuadre (operator-decided: Re-baseline post-encuadre)**
- Capture a NEW dated TP2 baseline of the ADOPTED scene at the 3 frozen money shots
  (`card`/`hero`/`macro`); measure TP2 deltas (M1 / M2 / M6 / M5) against it.
- TP0 protected anchors stay IMMUTABLE — `docs/table-3d/anchors/head/` and
  `docs/table-3d/anchors/reference-tag/` are never touched.
- Suggested baseline location: `docs/table-3d/anchors/tp2-base/{card,hero,macro}.png`.

**Legibility Defense & Lever Sequencing (operator-decided: Legibility-first)**
- Step 0: re-measure M1 on the adopted scene FIRST.
- Lever order: anisotropy + mipmaps → seam fix → micro-relief → clearcoat → paper-edge →
  variance → contact-shadow.
- Each lever behind a `?` flag; A/B one variable at a time; M1 re-checked after every lever.
- STOP criterion: any lever that regresses M1 OR reads plastic/laminated → STOP + revert.

**Card-Stock Aesthetics (operator-decided: Restraint-first)**
- clearcoat 0.12 / clearcoatRoughness 0.55; raise to 0.18 only if coat reads absent.
- micro-relief: normalScale ~0.12, built via `normalMapHelper`.
- paper-edge: subtle warm sheen-rim (reuse material sheen; NO new texture; NO
  `MeshTransmissionMaterial` / transmission).
- dealt variance ≤ 1.5°, frozen deterministically (M9).

**Locked by SSOT §TP2 — implement as specified:**
- anisotropy 8 → `getMaxAnisotropy()` cap 16; mipmaps + LinearMipmapLinear.
- clearcoat 0.12–0.18 / clearcoatRoughness 0.5–0.6 — NOT glossy/laminated.
- paper-edge = CHEAP fake only; NO transmission material.
- seam fix: no cream rim / z-fight at MACRO; CARD_CORNER 0.17 unchanged; curveSegments ≥ 14.
- variance ≤ 1.5–2° frozen (M9); near-edge contact-shadow tightened (M6).
- HARD gates: M1 legibility MUST NOT regress; M2 cards-vs-chips ≥ 2× maintained.
- No face-down card added to the Perla hand (SSOT §TP2.3 resolved).

### Claude's Discretion
- Exact `?` flag names.
- Capture cadence details.
- TP2-baseline dir naming/tracking/downscale.
- `normalScale` fine-tuning within "faint".
- Sheen-rim implementation details.

### Deferred Ideas (OUT OF SCOPE)
- TP3 chips de-Vegas + instancing/perf (M10 draw-calls).
- TP4 rail/contour.
- TP5 lighting/PCSS/ContactShadows.
- TP6 screen-space/crevice AO + depth/DOF/vignette.
- TP7 formalize `conjunto`/`social` cameras.
- TP8 SeatHands multi-hand, micro-life.
- Reconsidering CARD_W (encuadre adopted; revisit ONLY if TP2 operator gate fails on
  legibility — separate operator call).
- Mobile responsive camera framing.
</user_constraints>

---

## Summary

TP2 pushes the protagonist hole cards from "good decal" to "real card STOCK" by applying
six targeted material levers in a strictly sequenced, legibility-first order on the
ADOPTED post-encuadre scene (FELT_R 6.5, CARD_W 2.05, 5-card board). The work is lab-only
(`frontend/src/lab/`), on `spike/table-3d-hero`, behind individual `?` flags, and validated
at the 3 frozen money-shot cameras (`card`/`hero`/`macro`) with the existing metric rig.

The card currently lives in two materials: `kit.stock` (a `MeshPhysicalMaterial` on the
extruded body, `cardBodyGeometry`) and a per-card `faceMat` (another `MeshPhysicalMaterial`
on the `cardFaceGeometry` decal). Both are instantiated inside `useCardKit` and `Card`
respectively in `TableLab.tsx`. All six TP2 levers either modify these two materials or
add a normal map to the face texture pipeline in `textures.ts` / `normalMapHelper.ts`.

The key research finding is that `three@0.169.0` has `generateMipmaps = true` and
`minFilter = LinearMipmapLinearFilter` as DEFAULT values on `THREE.Texture`, but the
current `useCardFaces()` in `TableLab.tsx` uses `THREE.TextureLoader` (via `useLoader`)
which preserves those defaults — so mipmaps are already active. The gap is that anisotropy
is currently set to `8` (hardcoded constant in `textures.ts: srgb()`) and the SSOT wants
it raised to `renderer.capabilities.getMaxAnisotropy()` capped at 16. Accessing
`renderer.capabilities` from inside `useCardFaces` requires `useThree()` from R3F.

**Primary recommendation:** Follow the CONTEXT.md lever order strictly; verify the
`useThree()` + `gl.capabilities.getMaxAnisotropy()` pattern matches the existing TP1
pattern in `Table` (which does NOT use `useThree` — the felt material is set up in
`useMemo` at component level where `gl` is not available). The safe R3F pattern is to
call `useThree(state => state.gl)` at the top of `Scene` and pass `gl` down to
`useCardKit`/`useCardFaces`, or read max-anisotropy once in a `useEffect` after mount.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Face anisotropy / mipmap crispness | Frontend (lab texture) | — | Texture property on `THREE.Texture` — set at texture creation time in `useCardFaces()` |
| MeshPhysicalMaterial clearcoat + sheen (stock body) | Frontend (lab material) | — | `MeshPhysicalMaterial` properties on `kit.stock` in `useCardKit()`, `TableLab.tsx` |
| Face micro-relief normal map | Frontend (lab textures.ts) | normalMapHelper.ts | New canvas-based height-field + Sobel helper → CanvasTexture; mirrors the TP1 felt-nap pattern |
| Paper-edge sheen-rim | Frontend (lab material) | — | `sheen` / `sheenColor` on `kit.stock` (body material); no geometry or new texture |
| Dealt micro-variance | Frontend (lab cards.ts layout) | — | Per-card ≤ 1.5° rotation offsets in `communityLayout()` / `holeLayout()`; seeded by card index |
| Seam fix (face-to-bevel) | Frontend (lab cards.ts geometry) | — | `bevelSegments`/`curveSegments` in `cardBodyGeometry()`; also material `side` on `faceMat` |
| Contact-shadow tighten | Frontend (lab TableLab.tsx ContactShadows) | — | `ContactShadows` props (`blur`, `far`, `opacity`) in `TableLab.tsx` |
| TP2 baseline capture | Dev tooling (.dev-stack/lab-shot.mjs) | — | Playwright harness — unchanged; only output directory changes |
| M1/M2/M5/M6/M9 metrics | Dev tooling (tools/table-3d/) | — | `run-metrics.mjs`, `m1-m2-m12.mjs`, `m9-determinism.mjs`, `stats-read.mjs` |

---

## Standard Stack

### Core (already installed — NO new packages)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `three` | 0.169.0 [VERIFIED: frontend/node_modules/three/package.json] | WebGL renderer, `MeshPhysicalMaterial`, `Texture` | The scene engine |
| `@react-three/fiber` | 8.17.10 [VERIFIED: frontend/package.json] | React bindings for three.js; `useThree`, `useLoader`, `useFrame`, `useMemo` | R3F is the existing scene architecture |
| `@react-three/drei` | 9.114.0 [VERIFIED: frontend/package.json] | `ContactShadows`, `Environment`, `OrbitControls`, `PerspectiveCamera` | Drei is already used in `TableLab.tsx` |
| `sharp` | installed at repo root [VERIFIED: tools/table-3d/metrics.mjs imports it] | Pixel-math metrics (M3/M4/M5/M6/M8/+A/+B) | The existing rig; no change needed |
| `playwright` | installed at repo root [VERIFIED: .dev-stack/lab-shot.mjs, stats-read.mjs] | Headless GPU capture (`lab-shot.mjs`), draw-call read (`stats-read.mjs`) | The existing rig; no change needed |

### Supporting (convenience)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `normalMapHelper.ts` | local (lab) | Sobel height→normal; `heightToNormalMap`, `toNormalMapTexture`, `makeHeightCanvas` | For the card-stock micro-relief normal — reuse exactly as TP1 used it for `feltNapNormalMap()` |
| `node:crypto` (Node builtin) | — | `createHash('md5')` for M9 byte-identity | Already used by `m9-determinism.mjs` |

### No new packages needed
TP2 is purely a material/texture authoring phase. Every capability (PBR, normal maps, Sobel,
Playwright captures, sharp metrics) is already installed. No `npm install` step.

---

## Package Legitimacy Audit

> TP2 installs NO new external packages. All capabilities come from the existing installed
> stack. This section is therefore N/A for TP2.

**Packages removed due to slopcheck [SLOP] verdict:** none (no new packages)
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
LEVER PIPELINE (legibility-first, one variable per gate)
─────────────────────────────────────────────────────────

  Adopted scene (b2c9dd4)
         │
  ┌──────▼───────────────────────────────────────────────┐
  │  STEP 0 — Re-baseline                                │
  │  • 3 captures at card/hero/macro frozen cameras      │
  │  • Save → docs/table-3d/anchors/tp2-base/            │
  │  • Re-measure M1 (glyph px-height on 1080p POV)      │
  │    via m1DownscalePov() + operator visual confirm    │
  └──────┬───────────────────────────────────────────────┘
         │
  ┌──────▼───────────────────────────────────────────────┐
  │  LEVER 1 — Anisotropy + mipmap crispness             │
  │  • useCardFaces(): anisotropy 8 → gl.capabilities   │
  │    .getMaxAnisotropy() capped at 16                  │
  │  • minFilter = LinearMipmapLinearFilter (verify      │
  │    already default; no change if already set)        │
  │  • Slight negative mip bias ONLY if text still       │
  │    softens (THREE.Texture has no mipmapBias in 0.169 │
  │    — use renderer.setTextureMip... N/A; use          │
  │    anisotropy headroom instead; see Pitfall 1)       │
  │  • Flag: ?aniso=max (default: hardcoded 8)           │
  │  • Re-check M1 after capture                         │
  └──────┬───────────────────────────────────────────────┘
         │
  ┌──────▼───────────────────────────────────────────────┐
  │  LEVER 2 — Seam fix (face-to-bevel)                  │
  │  • cardBodyGeometry(): bevelSegments already 2;      │
  │    increase to 4–6 to smooth face-to-bevel seam      │
  │  • faceMat in Card: add alphaTest 0.01 to prevent    │
  │    z-fight bleed; or shift CARD_FACE_Z +0.002        │
  │  • curveSegments already = 14 (satisfies ≥14)        │
  │  • CARD_CORNER stays 0.17 (locked)                   │
  │  • Flag: ?seam=fix (default: current)                │
  └──────┬───────────────────────────────────────────────┘
         │
  ┌──────▼───────────────────────────────────────────────┐
  │  LEVER 3 — Micro-relief normal (card stock grain)    │
  │  • New fn cardStockNormalMap() in textures.ts        │
  │  • Height field: linen/emboss pattern (horizontal    │
  │    sine ridges at ~30 cycles, vs felt's concentric)  │
  │  • normalMapHelper.makeHeightCanvas() +              │
  │    heightToNormalMap() + toNormalMapTexture()        │
  │  • Wire to faceMat.normalMap + normalScale 0.12      │
  │  • Flag: ?cardnorm=on (default: off)                 │
  │  • Re-check M1 after capture                         │
  └──────┬───────────────────────────────────────────────┘
         │
  ┌──────▼───────────────────────────────────────────────┐
  │  LEVER 4 — Clearcoat whisper                         │
  │  • kit.stock: clearcoat 0.16→0.12,                  │
  │    clearcoatRoughness 0.5→0.55                       │
  │  • faceMat in Card: clearcoat 0.1→0.12,             │
  │    clearcoatRoughness 0.55 (already close)           │
  │  • Flag: ?cardcoat=v2 (default: current)             │
  └──────┬───────────────────────────────────────────────┘
         │
  ┌──────▼───────────────────────────────────────────────┐
  │  LEVER 5 — Paper-edge warm sheen-rim                 │
  │  • kit.stock: sheen 0.22→0.35,                      │
  │    sheenColor "#fff6e0"→"#f5deb5" (warm wheat)      │
  │  • No new texture; no MeshTransmissionMaterial       │
  │  • Effect: the beveled card rim catches a warm       │
  │    sheen glow under the key light → paper-edge read  │
  │  • Flag: ?cardedge=on (default: off)                 │
  └──────┬───────────────────────────────────────────────┘
         │
  ┌──────▼───────────────────────────────────────────────┐
  │  LEVER 6 — Dealt micro-variance (≤ 1.5°)             │
  │  • communityLayout() and holeLayout() in cards.ts   │
  │  • Add seeded per-card yaw + tilt ≤ 1.5° each       │
  │  • Seed = deterministic function of card index i     │
  │    (Math.sin(i * prime) * maxDeg) — frozen under     │
  │    any i-stable render → M9 satisfied                │
  │  • Flag: ?cardvar=on (default: off / current minimal │
  │    community yaw Math.sin(i*1.7)*0.025 stays as-is) │
  └──────┬───────────────────────────────────────────────┘
         │
  ┌──────▼───────────────────────────────────────────────┐
  │  LEVER 7 — Contact-shadow tighten / darken (M6)      │
  │  • ContactShadows in TableLab.tsx:                   │
  │    blur 2.8→2.0, far 4→3, opacity 0.55→0.65         │
  │  • Flag: ?cardcs=tight (default: current)            │
  │  • Re-check M6 after capture                         │
  └──────┬───────────────────────────────────────────────┘
         │
  ┌──────▼───────────────────────────────────────────────┐
  │  OPERATOR GATE                                       │
  │  A/B at POV (?cam=card) + MACRO (?cam=macro)        │
  │  "physical printed STOCK while razor-legible?"       │
  │  Stop-on-ambiguous. Rollback: non-blocking, flag.   │
  └──────────────────────────────────────────────────────┘
```

### Recommended Project Structure (no new files except the normal-map factory)

```
frontend/src/lab/
├── TableLab.tsx       MODIFY: useCardKit + Card + ContactShadows + flag reads
├── cards.ts           MODIFY: cardBodyGeometry bevelSegments; communityLayout/holeLayout variance
├── textures.ts        ADD: cardStockNormalMap() factory function (mirrors feltNapNormalMap)
└── normalMapHelper.ts UNCHANGED (already has all needed exports)

docs/table-3d/anchors/
├── head/              IMMUTABLE (TP0 baseline)
├── reference-tag/     IMMUTABLE (TP0 reference tag baseline)
├── controls/          IMMUTABLE (metric control corpus)
└── tp2-base/          NEW — dated TP2 scene baseline (3 PNGs: card.png, hero.png, macro.png)

.dev-stack/diag/table-3d/tp2/   (gitignored scratch)
├── step0-baseline/    local scratch captures for TP2 baseline decision
├── lever1-aniso/      per-lever diagnostic captures
├── ...
└── gate/              final A/B captures for operator presentation
```

### Pattern 1: Accessing max-anisotropy via useThree in R3F

The existing `useCardFaces` calls `useLoader(THREE.TextureLoader, urls)` and then sets
`t.anisotropy = 8` in `useMemo`. To set max-anisotropy the component needs access to
`gl.capabilities.getMaxAnisotropy()`. In R3F 8.x this is done with `useThree`:

```typescript
// Source: @react-three/fiber 8.x — useThree hook (verified in
// frontend/node_modules/@react-three/fiber/dist/react-three-fiber.cjs.dev.js line 414)
import { useThree } from "@react-three/fiber";

function Scene() {
  const gl = useThree((state) => state.gl);
  const maxAniso = useMemo(
    () => Math.min(gl.capabilities.getMaxAnisotropy(), 16),
    [gl]
  );
  // Pass maxAniso down to useCardFaces / useCardKit
  ...
}
```

`useThree` is already imported in the existing project (`@react-three/fiber` is a devDep).
`gl.capabilities.getMaxAnisotropy()` is defined in three 0.169.0 at
`WebGLCapabilities.js:7` and exposed via `renderer.capabilities.getMaxAnisotropy`.
[VERIFIED: frontend/node_modules/three/src/renderers/webgl/WebGLCapabilities.js line 7,122]

### Pattern 2: Texture anisotropy and mipmap defaults in three 0.169.0

```typescript
// Source: three/src/textures/Texture.js lines 22, 44, 46, 60
// (VERIFIED against installed source)
// THREE.Texture constructor defaults:
//   minFilter = LinearMipmapLinearFilter  ← already optimal for card faces
//   generateMipmaps = true               ← already generating mipmaps
//   anisotropy = Texture.DEFAULT_ANISOTROPY  (= 1 by default in three internals,
//                                             but overridden per-instance below)
//
// Current useCardFaces() in TableLab.tsx:
//   t.anisotropy = 8;   ← correct convention, set in useMemo
//   t.colorSpace = THREE.SRGBColorSpace;
//   t.needsUpdate = true;
//
// TP2 change: replace the hardcoded 8 with maxAniso from gl.capabilities:
//   t.anisotropy = Math.min(gl.capabilities.getMaxAnisotropy(), 16);

// THREE.Texture has NO mipmapBias property in 0.169.0.
// [VERIFIED: grep of frontend/node_modules/three/src/textures/Texture.js — no mipmapBias found]
// The SSOT "slight negative mip bias ONLY if text still softens" is therefore
// implemented via the anisotropy increase alone — higher anisotropy sharpens
// oblique-angle texture lookup without a separate bias. If ringing remains,
// a per-material roughness adjustment to slightly roughen the face is the lever,
// NOT a mip bias (which does not exist in this three version).
```

### Pattern 3: MeshPhysicalMaterial clearcoat + sheen in three 0.169.0

Both `clearcoat`/`clearcoatRoughness` and `sheen`/`sheenColor`/`sheenRoughness` exist
on `MeshPhysicalMaterial` in three 0.169.0. The TP1 felt material (already live in
`TableLab.tsx`) confirms the API at the installed version:

```typescript
// Source: TableLab.tsx lines 289-298 (useCardKit — CURRENT stock material)
// Confirmed working in this repo:
const stock = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#f1e7cf"),
  roughness: 0.62,
  metalness: 0,
  clearcoat: 0.16,           // ← exists and renders correctly
  clearcoatRoughness: 0.5,   // ← exists
  sheen: 0.22,               // ← exists (TP1 felt uses 0.70)
  sheenColor: new THREE.Color("#fff6e0"),
});
// [VERIFIED: live in TableLab.tsx + TP1 felt used same API with sheen 0.70]

// TP2 target (CONTEXT.md restraint-first):
const stock = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#f1e7cf"),
  roughness: 0.62,
  metalness: 0,
  clearcoat: 0.12,           // lowered from 0.16 to restraint-first value
  clearcoatRoughness: 0.55,  // slightly higher = less plastic
  sheen: 0.35,               // raised from 0.22 for paper-edge warm-rim read
  sheenColor: new THREE.Color("#f5deb5"),  // warm wheat (more saturated warm)
  sheenRoughness: 0.6,       // match leather roughness for warmth (TP1 leather uses 0.6)
});
// Also add normalMap + normalScale to stock for body micro-relief:
//   normalMap: cardStockNormalMap(),
//   normalScale: new THREE.Vector2(0.12, 0.12),
```

### Pattern 4: Card-stock micro-relief normal map (reusing normalMapHelper)

The TP1 felt nap used `feltNapNormalMap()` in `textures.ts`:
- Created a concentric-rings height field at 512×512
- Called `heightToNormalMap(c, 1.0)` from `normalMapHelper.ts`
- Wrapped in `toNormalMapTexture()` (sets `colorSpace = THREE.NoColorSpace`)

TP2 uses the SAME pipeline for a linen/emboss card-stock pattern:

```typescript
// Source: textures.ts pattern — feltNapNormalMap() lines 510-541 (VERIFIED)
// New function to add to textures.ts:
export function cardStockNormalMap(): THREE.CanvasTexture {
  const S = 256; // smaller than felt (cards are small; 256 is sufficient)
  const { c, ctx } = makeCanvas(S, S);

  // Horizontal sine ridges — the linen/laid-paper direction.
  // ~20 ridges per tile, repeat 4 over the card body → fine grain at MACRO fov26.
  const imgData = ctx.createImageData(S, S);
  const d = imgData.data;
  const ridgeFreq = 20;
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const u = px / S;
      const v = py / S;
      // Linen: primarily horizontal ridges, faint cross-hatch for emboss
      const h = (Math.sin(v * Math.PI * ridgeFreq * 2) * 0.5 + 0.5) * 180
              + (Math.sin(u * Math.PI * ridgeFreq * 1.5) * 0.5 + 0.5) * 40
              + 35; // base offset avoids pure black
      const i = (py * S + px) * 4;
      d[i] = d[i+1] = d[i+2] = Math.min(255, h);
      d[i+3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Sobel → tangent-space normal; strength 0.5 for faint grain (normalScale does the rest)
  const normalCanvas = heightToNormalMap(c, 0.5);
  const t = toNormalMapTexture(normalCanvas); // NoColorSpace, anisotropy 8
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 4); // repeat 4 over the card face — fine grain without "tiling" read
  return t;
}
// normalScale applied in faceMat: new THREE.Vector2(0.12, 0.12)
```

### Pattern 5: Deterministic dealt variance (M9-safe)

The existing community layout already uses a micro-yaw:

```typescript
// Source: cards.ts line 67 (VERIFIED — communityLayout)
rotation: [-Math.PI / 2, 0, Math.sin(i * 1.7) * 0.025],
// This is already deterministic (Math.sin with constant seeds — no Math.random).
```

For TP2 the goal is ≤ 1.5° = 0.026 rad of additional micro-tilt/yaw per card:

```typescript
// Add to communityLayout and holeLayout in cards.ts:
const MAX_TILT_RAD = (1.5 * Math.PI) / 180; // 0.0262 rad ≤ 1.5°
// Per-card deterministic seed: Math.sin(i * prime) avoids aliasing
const microTilt = Math.sin(i * 7.3) * MAX_TILT_RAD * 0.5; // x-tilt (card lifts edge slightly)
const microYaw  = Math.sin(i * 3.1) * MAX_TILT_RAD;       // z-rotation (yaw, existing)
// Used in rotation: [-Math.PI/2 + microTilt, 0, existingYaw + microYaw]
// Both seeds are INTEGER constants → the rotation is the SAME every render → M9 satisfied.
// This pattern is already used by communityLayout (i * 1.7 for yaw),
// leatherTexture (i * 5.7 for crease y), etc. — consistent with repo convention.
```

### Pattern 6: `?` flag convention in TableLab.tsx

The existing flag pattern (VERIFIED in `TableLab.tsx`):
```typescript
// Source: TableLab.tsx lines 68-71 (qp helper) and usages at lines
// 365 ("felt"), 643 ("marks"), 749 ("cards"), 759 ("chips"), 788 ("seats")
function qp(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}
// Usage examples:
//   qp("cards") !== "off"   → boolean presence gate
//   qp("felt") === "magenta" → specific value gate
//   qp("stats") !== null    → null-check for presence

// New TP2 flags follow the same pattern:
//   qp("aniso") === "max"   → max-anisotropy mode (default = hardcoded 8)
//   qp("seam") === "fix"    → bevelSegments upgrade
//   qp("cardnorm") === "on" → card-stock normal map
//   qp("cardcoat") === "v2" → clearcoat 0.12 tuning
//   qp("cardedge") === "on" → paper-edge warm sheen-rim
//   qp("cardvar") === "on"  → dealt variance
//   qp("cardcs") === "tight"→ tighter ContactShadows
```

### Pattern 7: TP2-baseline capture and the anchor directory structure

```
docs/table-3d/anchors/
├── head/            card.png + hero.png + macro.png  ← TP0 HEAD baseline — IMMUTABLE
├── reference-tag/   card.png + hero.png + macro.png  ← TP0 protected tag — IMMUTABLE
├── controls/        *-good.png + *-bad.png            ← metric control corpus — IMMUTABLE
└── tp2-base/        card.png + hero.png + macro.png  ← NEW — TP2 pre-work baseline
```

**Capture commands (exact, copy-paste, from ROADMAP §11):**
```bash
LAB_URL="http://localhost:5173/table-lab.html?cam=hero" node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp2-base/hero.png
LAB_URL="http://localhost:5173/table-lab.html?cam=card" node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp2-base/card.png
LAB_URL="http://localhost:5173/table-lab.html?cam=macro" node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp2-base/macro.png
```

**Downscale (SSOT policy: track downscaled PNGs to keep the anchor corpus small):**
```bash
# After capture, downscale each to ~640px wide for git commit (matches the TP0 controls policy)
# sharp-based one-liner, run from repo root:
node -e "
const sharp = require('sharp');
const dir = 'docs/table-3d/anchors/tp2-base';
for (const f of ['hero','card','macro']) {
  sharp(dir+'/'+f+'.png').resize({width:640}).toFile(dir+'/'+f+'-640w.png', ()=>{});
}
"
# Commit the -640w.png variants; keep full-res locally in .dev-stack/diag/ (gitignored)
```

**Tracking decision (Claude's discretion):** Commit the 640w downscaled PNGs under
`docs/table-3d/anchors/tp2-base/` as the tracked TP2 baseline. Keep full-resolution
versions in `.dev-stack/diag/table-3d/tp2-base/` (gitignored). This matches the TP0
controls corpus approach (controls/ has 640w PNGs; full-res in scratch).

### Anti-Patterns to Avoid

- **Upgrading to MeshTransmissionMaterial for paper-edge:** Explicitly forbidden by SSOT
  and CONTEXT.md. MeshTransmissionMaterial requires a transmission render pass, adds
  significant draw-call cost (M10), and the effect reads as glass/resin, not paper.

- **Setting `t.anisotropy = 16` as a hardcoded constant:** Use
  `Math.min(gl.capabilities.getMaxAnisotropy(), 16)` — some GPUs cap below 16 and passing
  an unsupported value is silently ignored by three.js (no error, no benefit).

- **Using `Math.random()` for micro-variance:** `Math.random()` is non-deterministic across
  renders, violating M9 byte-identity. Always use a deterministic seed function
  (`Math.sin(i * prime) * amplitude`).

- **Adding a normalMap to kit.stock without setting colorSpace = NoColorSpace on the
  canvas texture:** The `toNormalMapTexture()` helper in `normalMapHelper.ts` already
  sets `colorSpace = THREE.NoColorSpace` — use it. Directly wrapping a normal-map canvas
  with `srgb()` (the `textures.ts` sRGB helper) would decode the XYZ components as
  colors and produce completely wrong normals (the Pitfall 7 from TP1 RESEARCH.md).

- **Modifying `docs/table-3d/anchors/head/` or `reference-tag/`:** These two directories
  are permanently immutable. Only write to `tp2-base/` (new) or scratch (gitignored).

- **Touching the 3 frozen camera presets:** `card`, `hero`, `macro` pos/fov in
  `TableLab.tsx` lines 678/681/684 are frozen. Write no code that changes those values.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Height → tangent-space normal conversion | Custom Sobel kernel | `normalMapHelper.heightToNormalMap()` + `toNormalMapTexture()` | Already unit-tested (27/27); seam-free tiling with wrapping boundary conditions |
| Deterministic height field canvas | Ad-hoc drawing code | `normalMapHelper.makeHeightCanvas(size, drawFn)` | Encapsulates canvas creation + caller-supplied draw function cleanly |
| Pixel-math metrics (M3/M4/M5/M6) | Custom PNG parsers | `tools/table-3d/metrics.mjs` + `run-metrics.mjs` | Already admitted via red-team meta-gate; re-running needs zero code change |
| M9 determinism verification | File comparison | `tools/table-3d/m9-determinism.mjs --shot card --port 5173` | Already captures two frames and md5-compares |
| M1 legibility measurement | OCR / pixel search | `tools/table-3d/m1-m2-m12.mjs m1DownscalePov()` + operator visual confirm | SSOT explicitly downgraded M1 to px-height + manual; no automated OCR |
| Regional MSE zero-change proof | Custom image diff | `tools/table-3d/m1-m2-m12.mjs --zero-change <curDir> <baseDir>` | Admitted meta-gate; reliable on known-good + known-bad controls |
| Headless GPU capture | Custom Playwright script | `.dev-stack/lab-shot.mjs` with `LAB_URL=` env | Real D3D11 GPU, correct viewport, settled shadows/env |
| Draw-call count | Polling StatsProbe | `tools/table-3d/stats-read.mjs <baseUrl> <cam>` | Wraps GL drawElements/drawArrays directly; not affected by rAF throttle |

**Key insight:** The TP0 tooling exists precisely so TP2 does not re-author any
instrumentation. Every measurement is a single command invocation.

---

## Common Pitfalls

### Pitfall 1: three 0.169.0 has no `mipmapBias` / `lodBias` on Texture
**What goes wrong:** The SSOT mentions "slight negative mip bias ONLY if text still
softens." A planner might reach for `texture.mipmapBias` or a GLSL `bias` uniform.
Neither exists in three 0.169.0. [VERIFIED: grep of Texture.js — no mipmapBias property.]
**Why it happens:** Other renderers and WebGL2 GLSL `texture()` calls accept a bias
argument, but three.js does not expose it at the `Texture` level in this version.
**How to avoid:** If max-anisotropy does not fully resolve softness at oblique angles,
the next lever is a slight roughness decrease on `faceMat` (roughness 0.52 → 0.48),
which shifts the specular highlight size/sharpness without a LOD bias.
**Warning signs:** Looking for a `bias` or `lod` property on `THREE.Texture` — it won't
be there; do not add a custom property (three's texture system ignores unknown properties).

### Pitfall 2: Accessing gl.capabilities outside a mounted R3F component
**What goes wrong:** `gl.capabilities.getMaxAnisotropy()` requires the renderer to
be initialized. Calling it before the Canvas mounts (e.g., in a module-level constant
or a regular `useMemo` not gated on gl) throws or returns undefined.
**Why it happens:** `useThree()` is only valid inside an R3F component tree (inside
`<Canvas>`). `Scene` is the right place to read it.
**How to avoid:** Use `const gl = useThree((state) => state.gl)` inside `Scene`, then
compute `const maxAniso = useMemo(() => Math.min(gl.capabilities.getMaxAnisotropy(), 16), [gl])`
and pass it as a prop/argument to `useCardKit` / `useCardFaces`.

### Pitfall 3: Normal map color-space applied as sRGB
**What goes wrong:** Using `new THREE.CanvasTexture(canvas)` with `colorSpace =
THREE.SRGBColorSpace` on a normal map makes three.js apply gamma decoding to the RGB
values, treating (128,128,255) as a non-unit vector → random normals, surface appears
to scatter light arbitrarily.
**Why it happens:** `srgb()` in `textures.ts` (line 146) sets `SRGBColorSpace` — it's
the right helper for albedo/color maps but wrong for data textures.
**How to avoid:** ALWAYS create normal maps via `toNormalMapTexture()` from
`normalMapHelper.ts` (line 161-166), which sets `colorSpace = THREE.NoColorSpace`.
**Warning signs:** Card face looks plastic/metallic/irregular at MACRO even with very
small normalScale; the bevel rim catches completely wrong highlights.

### Pitfall 4: Dealt variance introducing z-fighting between coplanar cards
**What goes wrong:** The two hole cards use `HOLE_STACK = 0.1` to separate them along
the shared face-normal. A micro-tilt/yaw added on top of the existing pose might rotate
the top card back into coplanarity with the bottom card in extreme cases.
**Why it happens:** The HOLE_STACK is a world-space offset along `(0, cos(lift), sin(lift))`.
A tilt rotation rotates this vector. For ≤ 1.5° the maximum Z-displacement change is
`HOLE_STACK * (1 - cos(1.5°)) ≈ 0.0003` world units — far less than the 0.1 stack depth.
**How to avoid:** Keep micro-variance ≤ 1.5°; the existing HOLE_STACK provides ≫ enough
clearance. No extra z-offset is needed.
**Warning signs:** Flickering / "mixing" between hole cards at MACRO — revert `?cardvar`
and check the tilt/yaw bounds.

### Pitfall 5: Per-card face material creating too many GPU state-switches
**What goes wrong:** Each `Card` instantiates a `new THREE.MeshPhysicalMaterial` in a
`useMemo([faceTex])`. With 7 cards (5 community + 2 hole), that is 7 face materials.
Adding a normal map to each (shared `cardStockNormalMap()`) should use ONE shared
texture instance (same canvas → same WebGL texture object), not 7 separate canvas draws.
**Why it happens:** `cardStockNormalMap()` allocates a new CanvasTexture each call. If
called inside each `Card` component it creates 7 separate GPU texture objects.
**How to avoid:** Create `cardStockNormalMap()` once in `useCardKit()` (like
`feltNapNormalMap()` is created once in the `Table` component) and store it in
`CardKit`. Attach it to both `kit.stock` (body) and each `faceMat` by reference.

### Pitfall 6: The TP2 baseline invalidating the TP0 anchors
**What goes wrong:** Adding `tp2-base/` with 3 PNGs that look very different from
`head/` and `reference-tag/` might seem to "break" the anchor concept.
**Why it happens:** The scene composition has changed (bigger felt, smaller cards,
5-board, encuadre) — the TP0 anchors capture the OLD scene. The TP0 anchors are still
valid as the "reference never degraded" check for felt/rail/chips/lighting (SSOT §TP9
DoD). The TP2 baseline captures the CURRENT scene for apples-to-apples M1/M2/M5/M6
deltas WITHIN TP2.
**How to avoid:** Only add files to `tp2-base/`; never modify `head/` or `reference-tag/`.
The M12 zero-change proof for TP2 runs against `tp2-base/` (not `head/`).

### Pitfall 7: Over-clearcoat (plastic read)
**What goes wrong:** clearcoat ≥ 0.25 on a rough surface (roughness 0.52–0.62)
produces a visibly laminated look at MACRO under the warm key light.
**Why it happens:** The clearcoat layer is a separate smooth dielectric lobe on top of
the base. Even at low clearcoat values, if the base roughness is moderate the
clearcoat creates a shiny "plastic wrap" glare at near angles.
**How to avoid:** Stay at clearcoat 0.12 (operator-locked restraint-first value). Raise
to 0.18 ONLY if the coat reads completely absent. If plastic-read appears → revert.
`clearcoatRoughness 0.55` significantly reduces this risk (TP1 felt uses 0 clearcoat;
wood uses 0.72 at roughness 0.38 — fine; leather uses 0.08 at roughness 0.64 — subtle).

### Pitfall 8: M6 region rects need re-calibration for the new scene
**What goes wrong:** The existing `REGIONS.underCardHero` and `REGIONS.feltAdjacentHero`
in `tools/table-3d/metrics.mjs` (lines 99-105) were calibrated on the TP0 baseline
(`CARD_W 2.4`, older HOLE_Z/LIFT/PITCH). The adopted scene has smaller cards
(`CARD_W 2.05`) and a different hole-card position (`HOLE_Z 2.3`). The under-card
shadow region at the old coordinates may now be open felt.
**Why it happens:** The region rects are pixel coordinates on a 2880×1800 HERO frame
for a specific card layout. After CARD_W and HOLE_Z changed, the hole cards appear at
different pixel positions.
**How to avoid:** As part of the TP2 baseline step, visually inspect the tp2-base/hero.png
to verify that `underCardHero` (left:360, top:1230) still lands under a hole card.
If not, update the REGIONS constants in `metrics.mjs` AND re-run the meta-gate to
re-admit M6 on the new calibration.

---

## Code Examples

### Full TP2 useCardKit pattern (target state)
```typescript
// Source: based on TableLab.tsx lines 287-299 (VERIFIED current) + TP2 deltas
function useCardKit(
  cardNormalMap: THREE.CanvasTexture | null,
  maxAniso: number,
): CardKit {
  return useMemo(() => {
    const stock = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#f1e7cf"),
      roughness: 0.62,
      metalness: 0,
      clearcoat: 0.12,            // TP2: 0.16 → 0.12 (restraint-first)
      clearcoatRoughness: 0.55,   // TP2: 0.5 → 0.55
      sheen: 0.35,                // TP2: 0.22 → 0.35 (paper-edge lever 5)
      sheenColor: new THREE.Color("#f5deb5"),  // TP2: warmer
      sheenRoughness: 0.6,        // TP2: add (leather pattern)
      ...(cardNormalMap
        ? { normalMap: cardNormalMap, normalScale: new THREE.Vector2(0.12, 0.12) }
        : {}),                    // TP2 lever 3: card-stock micro-relief
    });
    return { body: cardBodyGeometry(), face: cardFaceGeometry(), stock };
  }, [cardNormalMap]);
}
```

### M1 re-measurement command (Step 0)
```bash
# 1. Capture the TP2 baseline POV frame (full-res, into scratch)
LAB_URL="http://localhost:5173/table-lab.html?cam=card" node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp2-base/card-full.png

# 2. Downscale to 1080p (M1 measurement reference height per SSOT §4.5)
node -e "
const sharp = require('sharp');
sharp('.dev-stack/diag/table-3d/tp2-base/card-full.png')
  .resize({height:1080})
  .toFile('.dev-stack/diag/table-3d/tp2-base/card-1080p.png', (e,i)=>console.log(e||i));
"
# 3. Open card-1080p.png; measure the hole-card rank glyph bbox height in px manually.
#    Goal: ≥ 22px (SSOT M1_PX_HEIGHT_MIN). At CARD_W 2.05 the pre-encuadre reading was ~17px.
#    TP2 expects anisotropy bump to sharpen the existing px — not increase it.
```

### Run admitted metrics against TP2 baseline
```bash
# Run the T1 sharp metric set over the TP2 baseline (after capture)
node tools/table-3d/run-metrics.mjs docs/table-3d/anchors/tp2-base
# Prints per-metric PASS/FAIL table for M3/M4/M5/M6/M8/+A/+B

# M10 draw calls (hero, default scene, no chips=full)
node tools/table-3d/stats-read.mjs http://localhost:5173 hero
# M10 draw calls (cards visible — should stay under 150)
node tools/table-3d/stats-read.mjs http://localhost:5173 card

# M9 determinism (after all levers applied — test the adopted scene)
node tools/table-3d/m9-determinism.mjs --shot card --port 5173 --out .dev-stack/diag/table-3d/tp2/m9

# M12 zero-change on non-changed regions vs TP2 baseline
# (checks that levers only changed what was intended)
node tools/table-3d/m1-m2-m12.mjs --zero-change .dev-stack/diag/table-3d/tp2/gate docs/table-3d/anchors/tp2-base
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `MeshStandardMaterial` for felt | `MeshPhysicalMaterial` with sheen/anisotropy/normalMap | TP1 (2026-06-10) | Confirmed pattern for TP2 — mirror it |
| Hardcoded anisotropy 8 everywhere | Max-anisotropy from `renderer.capabilities.getMaxAnisotropy()` | TP2 (this phase) | Crispness at oblique POV angles; legibility defense |
| Bevel with `bevelSegments: 2` | Increase to 4–6 for face-to-bevel seam smoothness | TP2 (this phase) | Removes thin cream rim / z-fight read at MACRO |
| No card normalMap | `cardStockNormalMap()` via `normalMapHelper.heightToNormalMap()` | TP2 (this phase) | Faint linen grain adds stock weight |
| Dealt variance via `Math.sin(i*1.7)*0.025` (community yaw only) | Per-card ≤ 1.5° multi-axis seeded variance | TP2 (this phase) | More dealt-life without exceeding M9 determinism |

**Deprecated/outdated patterns:**
- Baked radial vignette in albedo: removed in TP1 (`feltTexture` no longer has a dark
  radial gradient; `feltEdgeAoMap` replaces it). TP2 follows this pattern — card albedo
  should not bake in any directional lighting.
- `bumpMap` / `bumpScale` for micro-relief: the TP1 path used `normalMap` (not bumpMap)
  for felt. TP2 follows `normalMap` for the card stock as well — same GPU cost, better
  accuracy at glancing angles. The chips still use `bumpMap` (TP3 scope, not TP2).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `THREE.Texture` has no `mipmapBias` property in three 0.169.0 — confirmed by grep but grep found nothing, not a positive doc entry | Standard Stack / Pattern 2 | If bias DOES exist (unlikely — grep was definitive), we gain an extra sharpness lever; no downside to being wrong here |
| A2 | The M6 region rects `underCardHero` / `feltAdjacentHero` in `metrics.mjs` may be mis-calibrated after the encuadre composition change (CARD_W 2.05, HOLE_Z 2.3) | Pitfall 8 | If uncorrected, M6 reads open felt luma vs open felt luma → always PASS regardless of shadow; would hide a shadow regression. Must verify visually during Step 0. |
| A3 | Port 5173 is used for dev server (from ROADMAP §11 resume protocol) | Code Examples | If Vite picks 5174 (busy port fallback) the capture commands fail; run `cd frontend && npm run dev` and check the console for the actual port |

**If this table is empty:** Not the case — 3 low-risk assumptions documented above.

---

## Open Questions (RESOLVED)

1. **M6 region calibration after encuadre**
   - What we know: `REGIONS.underCardHero` was calibrated on the TP0 baseline (CARD_W 2.4,
     older HOLE_Z). The hole cards now sit at a different pixel position.
   - What's unclear: whether the existing rect (left:360, top:1230, width:220, height:90)
     still lands under a hole card in the adopted scene.
   - Recommendation: The Step 0 baseline capture reveals this. Inspect `tp2-base/hero.png`
     at those pixel coordinates; if open felt, recalibrate the rect and re-run the M6
     meta-gate before proceeding to levers. Budget one planner task for this check.
   - **RESOLVED:** plan 03-01 Task 2 (Wave 0 M6 region-rect verify/recalibrate + re-admit via meta-gate).

2. **bevelSegments increase and geometry test coverage**
   - What we know: `cards.test.ts` tests geometry invariants (HOLE_PITCH < CARD_W,
     HOLE_Z > 2, CARD_CORNER). It does NOT test `bevelSegments`.
   - What's unclear: whether increasing `bevelSegments` from 2 to 4–6 breaks any
     existing geometry assertion.
   - Recommendation: Increasing `bevelSegments` only adds more bevel loop geometry; it
     does not change the UV bounding box or the card dimensions. The existing 27/27 tests
     should remain green. Verify with `cd frontend && npm test` after the seam-fix edit.
   - **RESOLVED:** plan 03-02 Task 2 (seam fix verifies 27/27 lab Vitest stays green after bevelSegments bump).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Vite dev server (port 5173) | All captures | ✓ (assumed — project is active) | 7.3.1 (package.json) | Check for port 5174 if busy |
| Playwright / Chromium (headless) | `.dev-stack/lab-shot.mjs`, `stats-read.mjs`, `m9-determinism.mjs` | ✓ [VERIFIED: lab-shot.mjs uses `playwright` without install step] | Installed at repo root | None — required for GPU captures |
| `sharp` | `tools/table-3d/metrics.mjs`, `m1-m2-m12.mjs` | ✓ [VERIFIED: metrics.mjs imports it from repo root] | Installed at repo root | None — required for pixel metrics |
| RTX 4060 GPU (D3D11) | Accurate GPU captures (anti-SwiftShader artifacts) | ✓ (SSOT §1 confirms; TP0/TP1 captures confirmed) | — | Software rasteriser adds artifacts — do not use |
| Node.js | All `.mjs` tooling | ✓ (active project) | 18+ expected | None |

**Missing dependencies with no fallback:** None — all tooling confirmed present.

---

## Validation Architecture

> `workflow.nyquist_validation` is absent from `.planning/config.json` — treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 (frontend devDep) |
| Config file | `frontend/vitest.config.ts` (or vite.config.ts — standard Vitest setup) |
| Quick run command | `cd frontend && npm test` (runs `vitest run` — once, exits) |
| Full suite command | `cd frontend && npm test` (all 27 unit tests) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CARDS-GEOM | `HOLE_PITCH < CARD_W`, `HOLE_Z > 2`, `CARD_CORNER` invariants preserved after variance edits | unit | `cd frontend && npm test` | ✅ `cards.test.ts` |
| M9-DETER | Two consecutive captures are byte-identical after all levers enabled | integration | `node tools/table-3d/m9-determinism.mjs --shot card --port 5173` | ✅ `m9-determinism.mjs` |
| M1-LEGIB | Hole-card rank glyph ≥ 22px on 1080p POV downscale + operator visual confirm | T3 (px+manual) | `node tools/table-3d/m1-m2-m12.mjs` (then manual measure on output) | ✅ `m1-m2-m12.mjs` |
| M2-HIER | Cards screen-area ≥ 2× chips screen-area at HERO | T2 (manual polygon) | Manual polygon trace on hero.png + `m2CardsVsChips({cardsArea,chipsArea})` | ✅ `m1-m2-m12.mjs` |
| M5-CLIP | Highlight-clip < 0.5% felt · < 1.5% frame (no over-clearcoat flare) | T1 | `node tools/table-3d/run-metrics.mjs docs/table-3d/anchors/tp2-base` (M5 row) | ✅ `metrics.mjs` |
| M6-SHADOW | Under-card luma ≥ 12% darker than adjacent felt | T1 | `node tools/table-3d/run-metrics.mjs docs/table-3d/anchors/tp2-base` (M6 row) | ✅ `metrics.mjs` (rect may need recalibration — see Open Question 1) |
| NORMAL-UNIT | `heightDataToNormalData` Sobel kernel correctness (used by `cardStockNormalMap`) | unit | `cd frontend && npm test` | ✅ `normalMapHelper.test.ts` (already covers `heightDataToNormalData`) |
| M12-NOCHG | Non-card regions (felt, brass) unchanged vs tp2-base after levers | T1 | `node tools/table-3d/m1-m2-m12.mjs --zero-change <gate-dir> docs/table-3d/anchors/tp2-base` | ✅ `m1-m2-m12.mjs` |

### Sampling Rate
- **Per lever commit:** `cd frontend && npm test` (Vitest 27 unit tests, ~3 s)
- **Per wave (lever group):** Playwright capture + `run-metrics.mjs` over tp2-base
- **Phase gate:** Full suite green + M1 re-measured + M9 PASS + operator A/B at card + macro

### Wave 0 Gaps
- [ ] Recalibrate `REGIONS.underCardHero` / `REGIONS.feltAdjacentHero` if needed
  (verify during Step 0 baseline capture — covers REQ M6-SHADOW)
- [ ] Commit `docs/table-3d/anchors/tp2-base/{hero,card,macro}-640w.png` as the TP2
  apples-to-apples baseline before any material edits

---

## Security Domain

> `security_enforcement` is not set in `.planning/config.json`. Treated as enabled.
> This phase is a visual/material lab phase touching ONLY `frontend/src/lab/` (lab-only
> React tree, never in prod build, never deployed). No user data, auth, APIs, or
> network endpoints are modified.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | No — no user input consumed | — |
| V6 Cryptography | No | — |

**Security domain: N/A for this phase.** All code is `frontend/src/lab/` — the isolated
3D lab route, not in the prod Vite build (verified: no `table-lab` input in `vite.config.ts`
per SSOT §1 isolation contract). No secrets, no API calls, no auth flows involved.

---

## Sources

### Primary (HIGH confidence)
- `frontend/node_modules/three@0.169.0/src/textures/Texture.js` — verified: `minFilter = LinearMipmapLinearFilter` default, `generateMipmaps = true`, `anisotropy` property, no `mipmapBias` property
- `frontend/node_modules/three@0.169.0/src/renderers/webgl/WebGLCapabilities.js` — verified: `getMaxAnisotropy()` function at line 7, exported at line 122
- `frontend/node_modules/three@0.169.0/src/materials/MeshPhysicalMaterial.js` — verified: `anisotropy`, `clearcoat`, `clearcoatRoughness`, `sheen`, `sheenColor`, `sheenRoughness`, `normalMap`, `normalScale` all present
- `frontend/node_modules/@react-three/fiber@8.17.10/dist/react-three-fiber.cjs.dev.js` — verified: `useThree` exported at line 414; `state.gl` gives the WebGLRenderer
- `frontend/src/lab/TableLab.tsx` — verified: full scene code; `useCardKit` (lines 287-299), `useCardFaces` (lines 303-316), `Card` component (318-337), `qp()` flag pattern (68-71), `ContactShadows` props (800-809), `Table` useMemo with `feltNapNormalMap` + `feltEdgeAoMap` (lines 364-436)
- `frontend/src/lab/cards.ts` — verified: `CARD_W 2.05`, `CARD_CORNER 0.17`, `CARD_T 0.055`, `CARD_FACE_Z`, `cardBodyGeometry()` with `bevelSegments: 2 / curveSegments: 14`, `communityLayout()` / `holeLayout()` variance pattern
- `frontend/src/lab/textures.ts` — verified: `srgb()` / `gray()` helpers (colorSpace conventions), `feltNapNormalMap()` (the canonical pattern for TP2 normal map authoring), `speckle()`, `makeCanvas()`
- `frontend/src/lab/normalMapHelper.ts` — verified: `heightDataToNormalData()` (Sobel, torus BCs), `heightToNormalMap()`, `toNormalMapTexture()` (NoColorSpace), `makeHeightCanvas()`
- `frontend/package.json` — verified: `three ^0.169.0`, `@react-three/fiber ^8.17.10`, `@react-three/drei ^9.114.0`
- `tools/table-3d/metrics.mjs` — verified: `REGIONS.underCardHero` / `feltAdjacentHero` coords (calibrated on TP0 scene), `m6ContactShadow()`, `THRESHOLDS` constants, `SHARP_METRICS` registry
- `tools/table-3d/m1-m2-m12.mjs` — verified: `m1Legibility()`, `m1DownscalePov()`, `m2CardsVsChips()`, `m12ZeroChangeProof()`, `THRESHOLDS.M1_PX_HEIGHT_MIN = 22`
- `tools/table-3d/m9-determinism.mjs` — verified: `m9()` md5 byte-identity, `captureAndCheck()` pattern, CLI interface
- `.dev-stack/lab-shot.mjs` — verified: Playwright D3D11 headless, `LAB_URL` env var, `spin=off` auto-appended, 1440×900 @DPR2 → 2880×1800 PNG
- `docs/table-3d/METRICS_ADMISSION.md` — verified: M6 admitted with `underCardHero` luma 14.14% darker (TP0 baseline scene); region coords may need re-check for adopted scene
- `docs/table-3d/ENCUADRE_CHECKPOINT_2026-06-10.md` — verified: encuadre ADOPTED 2026-06-11; FELT_R 6.5, CARD_W 2.05, 5-card board, HOLE_Z 2.3, HOLE_PITCH 0.98×CARD_W
- `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP2 — the SSOT spec for all acceptance criteria
- `.planning/phases/03-tp2-cartas-materiality-legibility-protagonist/03-CONTEXT.md` — operator-locked decisions

### Secondary (MEDIUM confidence)
- `docs/table-3d/SCORECARD_TABLE_3D.md` — scorecard baseline; confirms TP1 felt score 3→4
- `.planning/STATE.md` — confirmed encuadre ADOPTED 2026-06-11, M10 over ceiling (TP3 scope), M1 ~17px note

### Tertiary (LOW confidence — informational, not relied on for API claims)
- SSOT §TP2 "slight negative mip bias" note — informed the investigation that revealed
  no `mipmapBias` exists in three 0.169.0 (LOW confidence claim resolved to confirmed
  absence by direct grep)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified from `frontend/package.json` and
  `frontend/node_modules/three/package.json`; no new packages needed
- Architecture patterns (API): HIGH — all API claims verified against installed
  three 0.169.0 source and existing working code in `TableLab.tsx`
- Metric rig: HIGH — all scripts verified by reading the actual tool files;
  region calibration concern flagged as [ASSUMED] (see Open Question 1)
- Pitfalls: HIGH — most derived from direct code reading (mipmapBias absence,
  color-space trap, M9 determinism constraint); Pitfall 8 (M6 recalibration)
  confirmed by checking the METRICS_ADMISSION baseline conditions

**Research date:** 2026-06-11
**Valid until:** 2026-07-11 (stable — three.js 0.169 is pinned; the lab code is
frozen except for TP2 edits; no API churn expected within 30 days)
