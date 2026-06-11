# Phase 4: TP3 — Fichas Materiality + Perf (accent + instancing) - Pattern Map

**Mapped:** 2026-06-11
**Files analyzed:** 3 new/modified files in scope (TableLab.tsx, textures.ts, normalMapHelper.ts)
**Analogs found:** 3 / 3 (all in-file — TP3 is a modification-only phase; every analog is a sister
pattern in the same file or in the shared helper)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `frontend/src/lab/TableLab.tsx` — `useChipKit` + `ChipStack` rewrite | component / geometry-kit | request-response (R3F render tree) | `useCardKit` + `CardGroup` in the same file (lines 288–400) | exact — same kit/stack pattern, same R3F tree, same `?flag` A/B discipline |
| `frontend/src/lab/textures.ts` — `chipFaceTexture`, `chipFaceBump`, `chipEdgeTexture` rework | utility / texture factory | transform (canvas → THREE.Texture) | `feltNapNormalMap` + `cardMicroReliefNormalMap` in the same file (lines 510–586) | exact — same height→normal pipeline; `chipFaceBump` already follows the same gray/NoColorSpace convention |
| `frontend/src/lab/normalMapHelper.ts` — reused as-is for chip C-mark recessed groove | utility / shared helper | transform (height data → normal data) | `feltNapNormalMap` first-use pattern (textures.ts lines 510–541) | exact — the helper already exists; TP3 just calls it from `chipFaceBump`/a new chip normal function |

---

## Pattern Assignments

### `frontend/src/lab/TableLab.tsx` — `useChipKit` + `ChipStack` → drei `<Instances>`

**Analog:** `useCardKit` (lines 288–334) + `CardGroup` (lines 384–400) in the same file

**Imports pattern — add drei `Instances`/`Instance` to the existing drei import** (lines 17–23):
```typescript
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Lightformer,
  ContactShadows,
  Instances,   // ← add for TP3 instancing
  Instance,    // ← add for TP3 instancing
} from "@react-three/drei";
```

**`?chips` flag pattern — the existing three-way flag** (lines 819–839):
```typescript
{qp("chips") === "full" ? (
  <>
    <ChipStack kit={chipKit} denom="C" count={17} position={[-0.55, 0.06, 0.2]} />
    {/* ... */}
  </>
) : qp("chips") !== "off" ? (
  // demoted accent pot — three SHORT stacks
  <group position={[3.0, 0, 1.5]} scale={0.5}>
    <ChipStack kit={chipKit} denom="C" count={5} position={[-1.6, 0.06, -0.7]} />
    <ChipStack kit={chipKit} denom="E" count={3} position={[1.6, 0.06, -0.7]} />
    <ChipStack kit={chipKit} denom="B" count={4} position={[0.0, 0.06, 1.7]} />
  </group>
) : null}
```
Add a `?chips=devegas` or `?chips=instanced` branch here for the A/B gate. The existing
`?chips=full` branch (stress/diagnostic) and the demoted accent branch both stay.

**`ChipKit` interface — current shape to extend** (lines 169–173):
```typescript
interface ChipKit {
  body: THREE.LatheGeometry;
  face: THREE.PlaneGeometry;
  mats: Record<string, { body: THREE.Material; face: THREE.Material }>;
}
```
For the instanced variant, `body` and `face` are still shared geometries (one per denomination).
The instanced branch renders them via `<Instances geometry={kit.body} material={mat.body}>` +
`<Instance ...>` children — same geometry objects, different renderer path.

**`ChipStack` draw-call liability — the EXACT code to replace** (lines 248–275):
```typescript
function ChipStack({
  kit, denom, count, position,
}: {
  kit: ChipKit; denom: SuitCode; count: number;
  position: [number, number, number];
}) {
  const chips = [];
  for (let i = 0; i < count; i++) {
    // hand-stacked: tiny per-chip jitter so it is never a perfect machined cylinder
    const jx = Math.sin(i * 2.3) * 0.012;
    const jz = Math.cos(i * 1.7) * 0.012;
    chips.push(
      <Chip
        key={i}
        kit={kit}
        denom={denom}
        position={[position[0] + jx, position[1] + i * H, position[2] + jz]}
        rotationY={i * 0.55}
      />,
    );
  }
  return <group>{chips}</group>;
}
```
This is the primary conversion target. Each `<Chip>` expands to THREE meshes (body + top face +
bottom face = 3 draw calls × chip count). The instanced replacement:
- One `<Instances geometry={kit.body} material={mat.body}>` per denomination → N body chips = 1 draw call
- One `<Instances geometry={kit.face} material={mat.face}>` per denomination for TOP face only → 1 draw call
- Bottom face dropped entirely (never seen — SSOT §TP3)
- Per-chip jitter reproduced via `<Instance position={...} rotation={...}>` (same Math.sin seeds)

**`Chip` component — current three-mesh structure showing bottom face to drop** (lines 216–246):
```typescript
function Chip({ kit, denom, position, rotationY = 0 }: { ... }) {
  const m = kit.mats[denom];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={kit.body} material={m.body} castShadow receiveShadow />
      <mesh
        geometry={kit.face}
        material={m.face}
        position={[0, H / 2 + 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
      />
      {/* THIS bottom face is dropped in the instanced version: */}
      <mesh
        geometry={kit.face}
        material={m.face}
        position={[0, -H / 2 - 0.002, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
}
```

**`useChipKit` — current material values to de-Vegas** (lines 175–214):
```typescript
function useChipKit(cImg: HTMLImageElement | null): ChipKit {
  return useMemo(() => {
    const body = new THREE.LatheGeometry(chipProfile(), 72);
    const face = new THREE.PlaneGeometry(R * 1.72, R * 1.72);
    const mats: ChipKit["mats"] = {};
    for (const suit of CHIP_SUITS) {
      const p = CHIP_PALETTES[suit];
      const edge = chipEdgeTexture(suit);
      edge.repeat.set(1, 1);
      const bodyMat = new THREE.MeshPhysicalMaterial({
        map: edge,
        color: new THREE.Color("#ffffff"),
        roughness: 0.5,
        metalness: 0,
        clearcoat: 0.42,          // ← de-Vegas target: 0.32 (low end of 0.32–0.42)
        clearcoatRoughness: 0.46, // ← de-Vegas target: 0.5 (max-matte)
        sheen: 0.5,               // ← de-Vegas: KILL sheen (0 — gloss killed)
        sheenColor: new THREE.Color(p.faceLit),
      });
      const faceMat = new THREE.MeshPhysicalMaterial({
        map: chipFaceTexture(suit, cImg),
        bumpMap: chipFaceBump(cImg),
        bumpScale: 0.025,         // ← upgrade to normalMap via helper (see textures.ts pattern)
        roughness: 0.46,
        metalness: 0,
        clearcoat: 0.32,          // ← already at low-end; keep or lower slightly
        clearcoatRoughness: 0.36, // ← de-Vegas target: 0.5
        alphaTest: 0.5,
      });
      mats[suit] = { body: bodyMat, face: faceMat };
    }
    return { body, face, mats };
  }, [cImg]);
}
```

**TP2 card kit pattern to mirror for de-Vegas chip material** (lines 288–334):
```typescript
// The exact MeshPhysicalMaterial pattern TP3 mirrors for the clay body:
const stock = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#f1e7cf"),
  roughness: 0.62,
  metalness: 0,
  clearcoat: 0.12,           // whisper clearcoat = "clearcoat as a seal"
  clearcoatRoughness: 0.55,  // matte clearcoat (anti-plastic)
  sheen: 0.35,               // for cards; for clay: kill sheen (set 0)
  sheenColor: ...,
  ...(normalMap ? { normalMap, normalScale: new THREE.Vector2(0.12, 0.12) } : {}),
});
// TP3 clay seal: clearcoat 0.32, clearcoatRoughness 0.5, sheen 0 (killed), + normalMap for C-mark
```

**`qp()` helper — the query-param flag pattern used by all A/B flags** (lines 68–72):
```typescript
function qp(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}
// Usage: qp("chips") === "full" | qp("card") === "base" | qp("chips") === "instanced"
```

**Deterministic jitter pattern to PRESERVE in the instanced version** (lines 259–270):
```typescript
for (let i = 0; i < count; i++) {
  // hand-stacked: tiny per-chip jitter so it is never a perfect machined cylinder
  const jx = Math.sin(i * 2.3) * 0.012;
  const jz = Math.cos(i * 1.7) * 0.012;
  // ... position: [position[0] + jx, position[1] + i * H, position[2] + jz]
  // ... rotationY: i * 0.55
}
// Keep these EXACT seed constants (2.3 / 1.7 / 0.55) in the <Instance> children —
// visual parity requirement; these produce the hand-stacked look.
```

**10-group cream-insert phase-alignment to break** — in `chipEdgeTexture` (textures.ts line 395):
```typescript
const groups = 10; // ← break this deterministic 10-group alignment
const gw = W / groups;
// SSOT §TP3: break the deterministic 10-group phase so the cream inserts
// don't all phase-align across the demoted pot's stacks.
// Method: per-denomination offset (e.g. phase = CHIP_SUITS.indexOf(suit) * (gw * 0.37))
// or odd-prime group counts per suit — within Claude's discretion per 04-CONTEXT.md.
```

---

### `frontend/src/lab/textures.ts` — `chipFaceTexture`, `chipFaceBump`, `chipEdgeTexture`

**Analog:** `feltNapNormalMap` + `cardMicroReliefNormalMap` in the same file (lines 510–586),
and `chipFaceBump` itself (lines 310–359) for the bump→normal upgrade.

**Texture size right-sizing pattern** (lines 250–253 for chipFaceTexture, line 511 for felt):
```typescript
// CURRENT (chip face + bump): S = 2048 — too large for a recessive accent
const S = 2048;
// TP3 target: S = 512 (mip-friendly; chips are small/recessive — SSOT §TP3)
// PRECEDENT: feltNapNormalMap uses S=512 ("512² sufficient for repeat-8 at MACRO fov26")
const S = 512; // right-sized for a demoted chip face at MACRO fov26
```

**`chipFaceTexture` chroma muting pattern** — current palette entries to mute (lines 31–35):
```typescript
export const CHIP_PALETTES: Record<SuitCode, ChipPalette> = {
  C: { faceLit: "#a83a4c", face: "#8a2738", edge: "#561622", ... },
  B: { faceLit: "#1aa67c", face: "#0c6b4f", edge: "#063f2e", ... },
  E: { faceLit: "#3f6390", face: "#2c4868", edge: "#172f48", ... },
  O: { faceLit: "#e6b455", face: "#b9892f", edge: "#7a591c", ... },
};
// TP3 de-Vegas: mute chroma ~20% + lower value on all palette entries.
// Pattern: desaturate in HSL — new S = oldS * 0.80, new L = oldL * 0.88 (approx).
// Example Copas faceLit "#a83a4c" → reduced-chroma variant (burgundy stays recognisable,
// just quieter). The full histogram must show chips no longer the second-brightest object.
```

**`chipFaceBump` → normalMap upgrade pattern** (lines 310–358, mirroring lines 534–540 for felt):
```typescript
// CURRENT: gray() → bumpMap on faceMat (bumpScale: 0.025)
return gray(c); // returns a bump (height) map

// TP3 UPGRADE: convert to a tangent-space normalMap via the shared helper:
// (mirrors feltNapNormalMap lines 534-540 exactly)
import { heightToNormalMap, toNormalMapTexture } from "./normalMapHelper";

// After drawing the height field on canvas c:
const normalCanvas = heightToNormalMap(c, 1.0); // strength neutral; normalScale tunes it
const t = toNormalMapTexture(normalCanvas);      // NoColorSpace — never sRGB
t.wrapS = t.wrapT = THREE.RepeatWrapping;
return t; // → used as normalMap instead of bumpMap in useChipKit
```

**`chipFaceBump` height field — the C-mark recessed groove** (lines 321–358):
```typescript
// CURRENT: draws the C as a dark stroke on a mid-gray field → bump reads it as recessed
ctx.fillStyle = "#808080"; // mid height for the clay field
// ...
ctx.strokeStyle = "#454545"; // darker = lower = recessed groove
ctx.lineWidth = RR * C_ARC.widthFrac;
ctx.arc(0, 0, RR * C_ARC.rFrac, C_ARC.start, C_ARC.end, false);
ctx.stroke();
// thin bright shoulder inside the groove → tooled bevel
ctx.strokeStyle = "#a6a6a6"; // brighter = higher shoulder
ctx.lineWidth = RR * C_ARC.widthFrac * 0.3;
// This height field is already correct for a recessed C.
// TP3 change: pipe it through heightToNormalMap instead of returning gray(c).
```

**`chipEdgeTexture` — the patterns to modify** (lines 367–414):
```typescript
export function chipEdgeTexture(suit: SuitCode): THREE.CanvasTexture {
  const p = CHIP_PALETTES[suit];
  const W = 2048;  // ← right-size to 512 (SSOT §TP3: right-size to mip-friendly)
  const H = 256;

  // cream inserts — the deterministic 10-group alignment to break:
  const groups = 10; // ← change to break phase-alignment across stacks
  const gw = W / groups;
  // ...
  for (let i = 0; i < groups; i++) {
    const cx = i * gw + gw * 0.5; // all stacks align here — break this
```

**`srgb` and `gray` texture helpers to reuse** (lines 146–159):
```typescript
function srgb(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; // colour textures
  t.anisotropy = 8;
  return t;
}

function gray(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace; // data textures (bump/AO/normal)
  t.anisotropy = 8;
  return t;
}
// toNormalMapTexture() from normalMapHelper.ts is the preferred path for normal maps:
// it sets NoColorSpace (same as gray()) but is semantically explicit.
```

**`speckle` micro-grain helper — reuse for clay micro-grain** (lines 133–144):
```typescript
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
// Used in chipFaceTexture (amount 12), chipFaceBump (amount 18), chipEdgeTexture (amount 10).
// TP3 micro-grain: add a speckle pass to a fresh chip micro-grain bump map with amount ~14-18.
```

**Logo face desaturation target** — current `chipFaceTexture` draws the logo at full size/saturation
(lines 283–295). TP3 target: draw it smaller + desaturate via `ctx.filter = "saturate(30%)"` before
`drawChiriC` / `drawImage`, or reduce the `cSize` factor (currently `r * 1.26`).

---

### `frontend/src/lab/normalMapHelper.ts` — reused as-is

**Analog:** `feltNapNormalMap` call site in textures.ts (lines 534–540)

This file is unchanged for TP3. The two entry points for chip work are:

**`heightToNormalMap` — canvas-to-canvas conversion** (lines 118–132):
```typescript
export function heightToNormalMap(
  heightCanvas: HTMLCanvasElement,
  strength = 1.0,
): HTMLCanvasElement {
  const W = heightCanvas.width;
  const H = heightCanvas.height;
  const input = heightCanvas.getContext("2d")!.getImageData(0, 0, W, H).data;
  const { c, ctx } = makeCanvas(W, H);
  const out = ctx.createImageData(W, H);
  out.data.set(heightDataToNormalData(input, W, H, strength));
  ctx.putImageData(out, 0, 0);
  return c;
}
// Call: const normalCanvas = heightToNormalMap(chipFaceBumpCanvas, 1.0);
```

**`toNormalMapTexture` — canvas → THREE.CanvasTexture (NoColorSpace)** (lines 161–166):
```typescript
export function toNormalMapTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.NoColorSpace; // MUST NOT be sRGB for normal maps
  t.anisotropy = 8;
  return t;
}
// Then in useChipKit: faceMat.normalMap = t; faceMat.normalScale = new THREE.Vector2(0.15, 0.15);
// (bumpMap + bumpScale removed — normalMap supersedes it)
```

**`makeHeightCanvas` convenience helper** (lines 144–152):
```typescript
export function makeHeightCanvas(
  size: number,
  drawFn: (ctx: CanvasRenderingContext2D, size: number) => void,
): HTMLCanvasElement {
  const { c, ctx } = makeCanvas(size, size);
  drawFn(ctx, size);
  return c;
}
// Useful for the chip micro-grain height canvas (replaces raw makeCanvas + draw inline).
```

---

## Shared Patterns

### MeshPhysicalMaterial clearcoat-as-matte-seal
**Source:** `useCardKit` (TableLab.tsx lines 315–332) and existing `useChipKit` bodyMat (lines 189–198)
**Apply to:** de-Vegas chip `bodyMat` and `faceMat` in `useChipKit`
```typescript
// Pattern: clearcoat ≤ 0.42 + clearcoatRoughness ≥ 0.46 = matte seal, not glass.
// TP3 target per SSOT: clearcoat 0.32 (max-matte end) + clearcoatRoughness 0.5.
// sheen: 0 on the clay body (gloss killed — not sheen:0.5 as current bodyMat).
new THREE.MeshPhysicalMaterial({
  roughness: 0.5,
  metalness: 0,
  clearcoat: 0.32,           // matte clay seal (low end)
  clearcoatRoughness: 0.5,   // maximally matte seal
  sheen: 0,                  // killed (anti-Vegas)
  // normalMap: chipFaceNormal,        (from helper)
  // normalScale: new THREE.Vector2(0.15, 0.15),
})
```

### bump → normalMap upgrade (Sobel helper)
**Source:** `feltNapNormalMap` in textures.ts (lines 510–541); `cardMicroReliefNormalMap` (lines 556–586)
**Apply to:** `chipFaceBump` → becomes a normalMap producer; new chip micro-grain normal map
```typescript
// Precedent call pattern (verbatim from cardMicroReliefNormalMap lines 578-584):
const normalCanvas = heightToNormalMap(c, 1.0); // strength neutral
const t = toNormalMapTexture(normalCanvas);
t.wrapS = t.wrapT = THREE.RepeatWrapping;
t.repeat.set(1, 1); // chip face: no tiling (disc covers the whole face)
return t;
```

### Texture size discipline (512² for recessive elements)
**Source:** `feltNapNormalMap` (textures.ts line 511) + `cardMicroReliefNormalMap` (line 557)
**Apply to:** all three chip texture functions (`chipFaceTexture`, `chipFaceBump`, `chipEdgeTexture`)
```typescript
// feltNapNormalMap: "512² sufficient for repeat-8 at MACRO fov26"
const S = 512;
// cardMicroReliefNormalMap: "256² — sufficient for a face-scale card grain at MACRO fov26"
const S = 256;
// chip face/bump: 2048 → 512 (mip-friendly; chips are small/recessive — SSOT §TP3)
// chip edge: 2048×256 → 512×64 (same 8:1 ratio, right-sized)
```

### Deterministic `useMemo` kit pattern
**Source:** `useCardKit` (TableLab.tsx lines 315–333) + `useChipKit` (lines 175–214)
**Apply to:** instanced `ChipStack` and any new `ChipInstancedStack` component
```typescript
// Pattern: heavy geometry + materials created ONCE in useMemo([deps]).
// Instanced geometry (body LatheGeometry + face PlaneGeometry) stays the same object —
// drei <Instances> accepts geometry= and material= props directly (no per-instance re-create).
return useMemo(() => {
  const body = new THREE.LatheGeometry(chipProfile(), 72);
  const face = new THREE.PlaneGeometry(R * 1.72, R * 1.72);
  // ...materials...
  return { body, face, mats };
}, [cImg]);
```

### `?flag` A/B discipline
**Source:** `qp()` + `?card=base` / `?chips=full` branching pattern (TableLab.tsx lines 68–72,
298–313, 819–839)
**Apply to:** new `?chips=devegas` (or `?chips=instanced`) A/B flag for TP3
```typescript
// Add a new qp("chips") === "devegas" branch alongside the existing "full"/"off" branches.
// Pattern: ONE new branch, no mutation of the default demoted-pot branch.
// The ?chips=full stress branch stays: it is the M10 ≥220 stress diagnostic.
// The new instanced path BECOMES the default (non-"full", non-"off") once it ships.
```

---

## No Analog Found

None. All TP3 files are modifications of existing files, and every pattern (kit/material/texture/
normalMap/flag) has a direct in-codebase precedent.

---

## Integration Points (concrete)

| Action | File | Line | What to do |
|--------|------|------|------------|
| Add `Instances`, `Instance` to drei import | TableLab.tsx | 17–23 | Extend existing import block |
| Convert `ChipStack` per-chip loop → `<Instances>` per denomination | TableLab.tsx | 248–275 | Replace `<Chip>` push with `<Instances geometry={kit.body}>` + `<Instance>` children; keep jitter seeds |
| Drop bottom-face mesh in `Chip` | TableLab.tsx | 238–244 | Delete the third `<mesh>` (the `rotation={[Math.PI/2,0,0]}` one) |
| De-Vegas `bodyMat`: clearcoat 0.32 / clearcoatRoughness 0.5 / sheen 0 | TableLab.tsx | 189–197 | Adjust three numeric params; optionally wire behind `?chips=devegas` flag first |
| De-Vegas `faceMat`: clearcoatRoughness 0.36 → 0.5 / bumpMap → normalMap | TableLab.tsx | 199–209 | Swap bumpMap/bumpScale for normalMap/normalScale (helper call in textures.ts) |
| Right-size chip textures 2048 → 512 | textures.ts | 253, 311, 369 | Change `S = 2048` → `S = 512` (face/bump); `W = 2048` → `W = 512` in edge |
| Mute chroma ~20% + lower value in CHIP_PALETTES | textures.ts | 31–35 | Edit HSL of all `faceLit`/`face`/`edge` entries |
| Upgrade `chipFaceBump` from `gray(c)` → `toNormalMapTexture(heightToNormalMap(c))` | textures.ts | 357–358 | Replace last two lines of function body |
| Desat + shrink logo in `chipFaceTexture` | textures.ts | 283–295 | Add `ctx.filter = "saturate(30%)"` before `drawChiriC`; reduce `cSize` from `r * 1.26` |
| Break 10-group cream-insert phase-alignment in `chipEdgeTexture` | textures.ts | 395 | Change `const groups = 10` or add a per-denomination phase offset to `cx` |
| `normalMapHelper.ts` | normalMapHelper.ts | — | No changes; call `heightToNormalMap` + `toNormalMapTexture` from textures.ts |

---

## Metadata

**Analog search scope:** `frontend/src/lab/` (TableLab.tsx, textures.ts, normalMapHelper.ts, cards.ts)
**Files scanned:** 4 source + 3 test files in `frontend/src/lab/`
**Pattern extraction date:** 2026-06-11
