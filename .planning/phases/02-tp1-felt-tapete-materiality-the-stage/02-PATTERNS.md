# Phase 2: TP1 — Felt / Tapete Materiality (the stage) - Pattern Map

**Mapped:** 2026-06-10
**Files analyzed:** 5 (2 new, 3 modified)
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `frontend/src/lab/normalMapHelper.ts` (NEW) | utility | transform (height-field canvas) | `textures.ts` `chipFaceBump()` + `makeCanvas` / `gray()` | role-match (canvas-factory idiom; first height→normal) |
| `frontend/src/lab/normalMapHelper.test.ts` (NEW) | test | pure-function | `frontend/src/lab/cards.test.ts` | exact (vitest, pure math, describe/it/expect) |
| `frontend/src/lab/textures.ts` — `feltTexture()` (MODIFY) | utility | transform (canvas → CanvasTexture) | same file `chipFaceBump()` + `leatherBump()` | exact (S resize + vignette removal are local edits) |
| `frontend/src/lab/textures.ts` — new `feltNapNormalMap()` + `feltEdgeAoMap()` (MODIFY) | utility | transform | same file `leatherBump()` + `floorTexture()` | exact (gray() + radial-gradient + makeCanvas) |
| `frontend/src/lab/TableLab.tsx` — felt material swap (MODIFY) | component | request-response (useMemo → R3F material) | same file `leatherMat` block (lines 388–401) | exact (MeshPhysicalMaterial sheen already proven) |

---

## Pattern Assignments

---

### `frontend/src/lab/normalMapHelper.ts` (NEW — utility, transform)

**Analog:** `frontend/src/lab/textures.ts` — `makeCanvas` + `gray()` + `chipFaceBump()` canvas-factory idiom.

**Confirmed absent:** No height→normal, Sobel, or normalMap authoring code exists anywhere in
`frontend/src/lab/`. (Glob of `frontend/src/lab/*.ts` returns only `silhouettes.ts`,
`textures.ts`, `StatsProbe.test.ts`, `cards.test.ts`, `cards.ts`.)

**Imports pattern** — copy from `textures.ts` line 13:
```typescript
import * as THREE from "three";
```
THREE is needed only for the `toNormalMapTexture()` convenience wrapper. The core
`heightToNormalMap()` returns `HTMLCanvasElement` — caller wraps via `gray()`.

**`makeCanvas` helper** — copy verbatim from `textures.ts` lines 120–125:
```typescript
// textures.ts lines 120-125
function makeCanvas(w: number, h: number): { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d")! };
}
```
`makeCanvas` is not exported from `textures.ts` — re-declare it locally and export it so tests
can call it without importing `textures.ts`.

**`gray()` colorSpace pattern** — copy from `textures.ts` lines 152–158:
```typescript
// textures.ts lines 152-158 — LINEAR colorspace for data/normal maps (NEVER sRGB)
/** Grayscale data texture (bump / roughness) — LINEAR, never sRGB. */
function gray(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}
```
Export this as `toNormalMapTexture()` or re-export `gray` — normal maps decoded through sRGB
produce wrong normals (RESEARCH.md Pitfall 7).

**Core Sobel pixel-write idiom** — new algorithm; closest structural analog is the
`speckle()` pixel-loop in `textures.ts` lines 132–143:
```typescript
// textures.ts lines 132-143 — pixel-loop idiom (getImageData / putImageData)
function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number): void {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const v = (n - 0.5) * amount;
    d[i] = clamp(d[i] + v);
    d[i + 1] = clamp(d[i + 1] + v);
    d[i + 2] = clamp(d[i + 2] + v);
  }
  ctx.putImageData(img, 0, 0);
}
```
`heightToNormalMap()` uses `createImageData` (blank canvas) instead of `getImageData`
(read existing), then writes R/G/B normal components per pixel, then `putImageData`.
The x/y indexing pattern `(yi * W + xi) * 4` is the same.

**Sobel math** (from RESEARCH.md §3 — standard tangent-space convention verified against
three.js shader):
```typescript
// Per pixel: 3×3 Sobel → normalize → encode (n+1)/2*255
// R=+X, G=+Y, B=+Z  (three.js tangent-space — verified from lights_physical_fragment.glsl.js)
const getH = (x: number, y: number): number => {
  const xi = (x + W) % W, yi = (y + H) % H;  // wrapping boundary
  return input[(yi * W + xi) * 4] / 255;       // 0..1
};
// tl/tc/tr/cl/cr/bl/bc/br = 3×3 neighborhood
const gx = (tr + 2*cr + br) - (tl + 2*cl + bl);
const gy = (bl + 2*bc + br) - (tl + 2*tc + tr);
let nx = -gx * strength, ny = -gy * strength, nz = 1.0;
const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
// Encode: RGB = ((n+1)/2)*255
od[i]   = Math.round((nx/len + 1) * 0.5 * 255);  // R = +X
od[i+1] = Math.round((ny/len + 1) * 0.5 * 255);  // G = +Y
od[i+2] = Math.round((nz/len + 1) * 0.5 * 255);  // B = +Z
od[i+3] = 255;
```

**File structure:**
```
frontend/src/lab/normalMapHelper.ts
  (1) import * as THREE from "three"
  (2) export function makeCanvas(...)    — local copy (not exported from textures.ts)
  (3) export function heightToNormalMap(heightCanvas, strength) → HTMLCanvasElement
  (4) export function makeHeightCanvas(size, drawFn) → HTMLCanvasElement
  (5) export function toNormalMapTexture(canvas) → THREE.CanvasTexture  [gray() wrapper]
```

---

### `frontend/src/lab/normalMapHelper.test.ts` (NEW — test, pure-function)

**Analog:** `frontend/src/lab/cards.test.ts` — canonical vitest pure-function style for `frontend/src/lab/`.

**Imports pattern** — copy from `cards.test.ts` lines 1–8:
```typescript
// cards.test.ts lines 1-8
import { describe, it, expect } from "vitest";
import {
  labCardFaceUrl,
  rowPositionsX,
  communityLayout,
  holeLayout,
  CARD_W,
} from "./cards";
// For normalMapHelper.test.ts: import { heightToNormalMap, makeHeightCanvas, makeCanvas } from "./normalMapHelper"
```

**No `vi.mock()` needed** — `normalMapHelper.ts` is pure canvas math with no React or R3F deps
(unlike `StatsProbe.test.ts` which requires `vi.mock("react")` and `vi.mock("@react-three/fiber")`).
`document.createElement("canvas")` is available in the happy-dom vitest environment.

**`describe`/`it` invariant pattern** — copy from `cards.test.ts` lines 24–48:
```typescript
// cards.test.ts lines 24-48 — property-based invariant style (copy for normalMapHelper tests)
describe("rowPositionsX", () => {
  it("returns empty for n<=0", () => {
    expect(rowPositionsX(0, 1)).toEqual([]);
  });
  it("centres a single card at the origin", () => {
    expect(rowPositionsX(1, 3)).toEqual([0]);
  });
  it("is symmetric about 0 (sum ≈ 0)", () => {
    for (const n of [2, 3, 4, 5]) {
      const xs = rowPositionsX(n, 1.3);
      const sum = xs.reduce((a, b) => a + b, 0);
      expect(Math.abs(sum)).toBeLessThan(1e-9);
    }
  });
});
```

**Key invariants for `heightToNormalMap`:**
```typescript
// Output canvas same dimensions as input
// Flat field (uniform gray 128) → pure-up normal: R≈128, G≈128, B≈255 (±1 rounding)
// B channel always ≥ 128 (Z component always positive — pointing out of surface)
// R and G channels in [0,255] (unit-vector components encoded)
// strength=0 → pure-up normal (no gradient amplification)
```

---

### `frontend/src/lab/textures.ts` — `feltTexture()` modification (MODIFY)

**Analog:** The function itself. The S=1024→2048 resize and vignette removal are surgical edits.

**Canvas init — change `S`** — `textures.ts` lines 426–428:
```typescript
// textures.ts lines 426-428 — CURRENT (change S only)
  const S = 1024;   // ← TP1: change to 2048
  const { c, ctx } = makeCanvas(S, S);
  const r = S / 2;
```
All downstream drawing is `r * fraction` or `S * fraction` (confirmed — no hardcoded pixel
constants). Changing `S` to `2048` is safe. M3 gradient uses `addColorStop` fractions — same
relative positions at any S.

**M3 anchor gradient — DO NOT TOUCH** — `textures.ts` lines 435–440:
```typescript
// textures.ts lines 435-440 — M3 anchors: LOCKED colors + LOCKED fractions
  const base = ctx.createRadialGradient(r, r * 0.88, r * 0.05, r, r, r * 1.05);
  base.addColorStop(0, "#1f9163");
  base.addColorStop(0.55, "#147a51");
  base.addColorStop(1, "#0a4a33");
```

**Vignette block — REMOVE entirely** — `textures.ts` lines 492–497:
```typescript
// textures.ts lines 492-497 — DELETE THIS BLOCK (D-03)
  // vignette
  const vig = ctx.createRadialGradient(r, r, r * 0.42, r, r, r);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, S, S);
```

**Return — stays `srgb()`** — `textures.ts` line 500:
```typescript
  return srgb(c);  // albedo = sRGB color texture — do NOT change to gray()
```

---

### `frontend/src/lab/textures.ts` — new `feltNapNormalMap()` and `feltEdgeAoMap()` (MODIFY)

**Analog for `feltNapNormalMap()`:** `textures.ts` `chipFaceBump()` lines 309–358 — procedural
canvas + pixel manipulation + `gray()` return.

**`chipFaceBump()` factory structure** — `textures.ts` lines 309–318:
```typescript
// textures.ts lines 309-318 — bump canvas factory pattern (copy structure)
export function chipFaceBump(cImg?: HTMLImageElement | null): THREE.CanvasTexture {
  const S = 2048;
  const { c, ctx } = makeCanvas(S, S);
  const r = S / 2;

  ctx.fillStyle = "#808080";  // mid-height baseline
  ctx.beginPath();
  ctx.arc(r, r, r, 0, TAU);
  ctx.fill();
  speckle(ctx, S, S, 18);
  ...
  return gray(c);   // ← bump/normal maps ALWAYS use gray(), not srgb()
}
```
`feltNapNormalMap()` uses S=512 (sufficient for repeat=8), builds a height field via
`createImageData` pixel loop (concentric rings), calls `heightToNormalMap()` from
`normalMapHelper.ts`, then wraps in `gray()` + sets `RepeatWrapping` + `repeat.set(8,8)`.

**RepeatWrapping + repeat.set pattern** — `TableLab.tsx` lines 376–377:
```typescript
// TableLab.tsx lines 376-377 — RepeatWrapping idiom (copy for feltNapNormalMap return)
    const wood = woodTexture();
    wood.repeat.set(13, 1);
    // wrapS/wrapT must be set before repeat:
    // t.wrapS = t.wrapT = THREE.RepeatWrapping;
    // t.repeat.set(8, 8);
```

**Analog for `feltEdgeAoMap()`:** `textures.ts` `floorTexture()` lines 673–697 — radial gradient
canvas factory.

**`floorTexture()` radial gradient pattern** — `textures.ts` lines 675–683:
```typescript
// textures.ts lines 675-683 — radial gradient factory (analog for feltEdgeAoMap)
export function floorTexture(): THREE.CanvasTexture {
  const S = 1024;
  const { c, ctx } = makeCanvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, S * 0.03, S / 2, S / 2, S * 0.52);
  g.addColorStop(0, "#3c2716");
  g.addColorStop(0.32, "#241710");
  g.addColorStop(0.62, "#110b07");
  g.addColorStop(1, "#070504");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  ...
  return srgb(c);  // ← feltEdgeAoMap: return gray(c) instead (AO map is LINEAR data)
}
```
`feltEdgeAoMap()` uses S=512, white→light-gray gradient (1.0 center → ~0.75 edge), and
returns `gray(c)` not `srgb(c)`.

---

### `frontend/src/lab/TableLab.tsx` — felt material swap (MODIFY)

**Analog:** `leatherMat` — `TableLab.tsx` lines 388–401. The **proven compile path** for
`MeshPhysicalMaterial` + `sheen` / `sheenColor` / `sheenRoughness` in this codebase.

**Existing felt material block (to replace)** — `TableLab.tsx` lines 364–375:
```typescript
// TableLab.tsx lines 364-375 — CURRENT: MeshStandardMaterial, no sheen/normalMap
    const feltMat =
      feltKind === "magenta"
        ? new THREE.MeshBasicMaterial({ color: 0xff00ff })
        : feltKind === "basic"
          ? new THREE.MeshBasicMaterial({ map: feltTexture(logoImg, aceImgs), alphaTest: 0.5 })
          : new THREE.MeshStandardMaterial({
              map: feltTexture(logoImg, aceImgs),
              roughness: 0.93,
              metalness: 0,
              envMapIntensity: 0.3,
              alphaTest: 0.5,
            });
```

**`leatherMat` — proven MeshPhysicalMaterial + sheen pattern** — `TableLab.tsx` lines 388–401:
```typescript
// TableLab.tsx lines 388-401 — ANALOG: copy structure, substitute felt values
    const leatherMat = new THREE.MeshPhysicalMaterial({
      map: leatherTexture(),
      bumpMap: leatherBump(),        // ← felt: normalMap instead (higher fidelity)
      bumpScale: 0.016,              // ← felt: normalScale Vector2 instead
      color: new THREE.Color("#ffffff"),
      roughness: 0.64,               // ← felt: 0.93 (anti-satin)
      metalness: 0,
      sheen: 0.4,                    // ← felt: 0.70 (D-02)
      sheenColor: new THREE.Color("#b08a64"),  // ← felt: "#2aad7a" (D-02)
      sheenRoughness: 0.6,           // ← felt: 0.65 (D-02 anti-satin)
      clearcoat: 0.08,               // ← felt: omit (no clearcoat on cloth)
      clearcoatRoughness: 0.7,       // ← felt: omit
      side: THREE.DoubleSide,        // ← felt: omit (PlaneGeometry is single-sided)
    });
```

**TP1 felt material target:**
```typescript
// TP1 replacement (inside same useMemo, same debug-branch structure preserved)
    const feltMat =
      feltKind === "magenta"
        ? new THREE.MeshBasicMaterial({ color: 0xff00ff })
        : feltKind === "basic"
          ? new THREE.MeshBasicMaterial({ map: feltTexture(logoImg, aceImgs), alphaTest: 0.5 })
          : new THREE.MeshPhysicalMaterial({       // ← was MeshStandardMaterial
              map: feltTexture(logoImg, aceImgs),  // S=2048, vignette removed
              normalMap: feltNapNormalMap(),        // new — from textures.ts
              normalScale: new THREE.Vector2(0.28, 0.28),
              aoMap: feltEdgeAoMap(),               // new — from textures.ts (see A1 pitfall)
              aoMapIntensity: 0.18,
              sheen: 0.70,                          // D-02
              sheenColor: new THREE.Color("#2aad7a"),  // D-02: lighter Chiribito green
              sheenRoughness: 0.65,                 // D-02: anti-satin
              anisotropy: 0.25,                     // D-01: restrained
              anisotropyRotation: 0,
              roughness: 0.93,                      // unchanged
              metalness: 0,
              envMapIntensity: 0.3,                 // unchanged
              alphaTest: 0.5,                       // born-in discipline preserved
            });
```

**Import additions** — add `feltNapNormalMap`, `feltEdgeAoMap` to the existing `textures.ts`
import at the top of `TableLab.tsx` (existing import already pulls `feltTexture`, `leatherTexture`,
`leatherBump`, `woodTexture`, etc.).

**Felt mesh JSX — DO NOT CHANGE** — `TableLab.tsx` lines 428–433:
```typescript
// TableLab.tsx lines 428-433 — PlaneGeometry mesh (unchanged)
    <group scale={[OVAL_X, 1, 1]}>
      {/* recessed baize */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[FELT_R * 2, FELT_R * 2, 1, 1]} />
        <primitive object={felt} attach="material" />
      </mesh>
```
`PlaneGeometry(1,1)` has no explicit tangents — three.js uses `getTangentFrame()` (UV-derivative)
for anisotropy. Do NOT call `.computeTangents()` (RESEARCH.md §2).

**aoMap UV2 pitfall (Assumption A1):** Before wiring `aoMap`, read
`frontend/node_modules/three/src/renderers/shaders/ShaderChunk/aomap_pars_fragment.glsl.js`
to confirm UV channel. If `uv2` is required and absent, add via JSX ref:
```typescript
// New pattern — no codebase analog exists yet
<planeGeometry
  args={[FELT_R * 2, FELT_R * 2, 1, 1]}
  ref={(geo) => {
    if (geo) geo.setAttribute("uv2", geo.getAttribute("uv"));
  }}
/>
```

---

## Shared Patterns

### Canvas texture factory (makeCanvas + srgb/gray)
**Source:** `frontend/src/lab/textures.ts` lines 120–158
**Apply to:** All new canvas-producing functions in `textures.ts` and `normalMapHelper.ts`

Rule: albedo textures → `srgb()` (SRGBColorSpace). Data maps (bump, AO, normalMap) → `gray()`
(NoColorSpace). Never swap. `anisotropy: 8` is set in both helpers.

### MeshPhysicalMaterial sheen compile path
**Source:** `frontend/src/lab/TableLab.tsx` lines 388–401 (`leatherMat`)
**Apply to:** TP1 felt material swap in the same `useMemo`

Proven in-project: `sheen` / `sheenColor` / `sheenRoughness` on `MeshPhysicalMaterial` compiles
and renders on the RTX 4060 + ANGLE D3D11 capture path. No additional setup needed.

### Vitest pure-function test structure
**Source:** `frontend/src/lab/cards.test.ts` lines 1–98
**Apply to:** `frontend/src/lab/normalMapHelper.test.ts`

No `vi.mock()` needed for pure canvas math. `document.createElement("canvas")` available via
happy-dom environment.

### Metric A/B gate (FROZEN eval kit)
**Source:** `tools/table-3d/run-metrics.mjs` + `.dev-stack/lab-shot.mjs`
**Apply to:** TP1 iteration captures — M3 (ΔE<12), M5 (clip<0.5%), +B (sheen≤8%)

No changes to eval kit. Capture with `LAB_URL=...?cam=hero node .dev-stack/lab-shot.mjs`,
then `node tools/table-3d/run-metrics.mjs <png>`.

---

## No Analog Found

| File / Symbol | Role | Data Flow | Reason |
|---------------|------|-----------|--------|
| `heightToNormalMap` Sobel core | utility (in normalMapHelper.ts) | transform | No height→normal or Sobel code in `frontend/src/lab/`. Algorithm from RESEARCH.md §3 (standard math; three.js encoding verified from shader). |
| `aoMap` + `uv2` JSX ref fallback | component fragment | request-response | No `aoMap` usage on any mesh in `TableLab.tsx`. UV2 injection via JSX ref is new. Resolve Assumption A1 first. |

---

## Metadata

**Analog search scope:** `frontend/src/lab/` (5 `.ts` files + `TableLab.tsx`),
`tools/table-3d/metrics.mjs`, `tools/table-3d/run-metrics.mjs`, `.dev-stack/lab-shot.mjs`
**Files scanned:** 9
**Pattern extraction date:** 2026-06-10

**Key line-number index for planner:**

| Symbol | File | Lines |
|--------|------|-------|
| `makeCanvas` | textures.ts | 120–125 |
| `clamp` | textures.ts | 127–129 |
| `speckle` (pixel-loop idiom) | textures.ts | 132–143 |
| `srgb()` | textures.ts | 145–150 |
| `gray()` | textures.ts | 152–158 |
| `feltTexture()` — full function | textures.ts | 422–501 |
| `feltTexture()` — M3 gradient (LOCKED) | textures.ts | 435–440 |
| `feltTexture()` — vignette (REMOVE) | textures.ts | 492–497 |
| `chipFaceBump()` — bump canvas factory | textures.ts | 309–358 |
| `leatherBump()` — bump + gray() return | textures.ts | 648–666 |
| `floorTexture()` — radial gradient factory | textures.ts | 673–697 |
| Felt material (`MeshStandardMaterial`) | TableLab.tsx | 364–375 |
| `leatherMat` (`MeshPhysicalMaterial` + sheen) | TableLab.tsx | 388–401 |
| `FELT_R`, `OVAL_X` constants | TableLab.tsx | 56–57 |
| Felt mesh JSX + `OVAL_X` group | TableLab.tsx | 428–433 |
| `THRESHOLDS` (M3/M5/+B baked values) | tools/table-3d/metrics.mjs | 28–65 |
| `REGIONS.feltHero` rect | tools/table-3d/metrics.mjs | 78–82 |
| GPU capture harness (Playwright launch) | .dev-stack/lab-shot.mjs | 20–24 |
