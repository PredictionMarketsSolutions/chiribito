# Phase 3: TP2 — Cartas Materiality & Legibility (protagonist) - Pattern Map

**Mapped:** 2026-06-11
**Files analyzed:** 4 new/modified files + 1 new directory
**Analogs found:** 4 / 4 (all have exact or role-match analogs within the same codebase)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `frontend/src/lab/cards.ts` | geometry + material kit | request-response (useMemo factory) | `frontend/src/lab/TableLab.tsx` `useCardKit()` + `useChipKit()` | exact — same kit pattern |
| `frontend/src/lab/textures.ts` | procedural texture factory | transform (canvas→THREE.Texture) | `textures.ts` `feltNapNormalMap()` + `feltEdgeAoMap()` | exact — same file, extend existing functions |
| `frontend/src/lab/TableLab.tsx` | scene root / A/B rig | event-driven (R3F render loop + query params) | `TableLab.tsx` `?felt=` / `?cam=` / `?cards=` / `?chips=` flags | exact — same `qp()` A/B pattern |
| `docs/table-3d/anchors/tp2-base/` | static asset directory | file-I/O (Playwright → PNG) | `docs/table-3d/anchors/head/` + `docs/table-3d/anchors/reference-tag/` | exact — same corpus pattern |

---

## Pattern Assignments

---

### `frontend/src/lab/cards.ts` — material + geometry upgrades

**Analog:** `frontend/src/lab/TableLab.tsx` `useCardKit()` (lines 287–299) and `useChipKit()` (lines 174–213)

**Current `useCardKit()` stock material** (TableLab.tsx lines 288–299):
```typescript
const stock = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#f1e7cf"), // warm ivory card stock
  roughness: 0.62,
  metalness: 0,
  clearcoat: 0.16,        // a faint coated sheen on the stock
  clearcoatRoughness: 0.5,
  sheen: 0.22,
  sheenColor: new THREE.Color("#fff6e0"),
});
```

**TP2 upgrade pattern — mirror `MeshPhysicalMaterial` fields added in TP1 felt:**
The felt material (TableLab.tsx lines 371–386) is the direct template for how to extend a
`MeshPhysicalMaterial` with `normalMap` + `aoMap` + `anisotropy`:

```typescript
// felt TP1 pattern — copy field structure into the card stock upgrade
new THREE.MeshPhysicalMaterial({
  map: feltTexture(logoImg, aceImgs),
  normalMap: feltNapNormalMap(),
  normalScale: new THREE.Vector2(0.25, 0.25),
  aoMap: feltEdgeAoMap(),
  aoMapIntensity: 0.18,
  sheen: 0.70,
  sheenColor: new THREE.Color("#2aad7a"),
  sheenRoughness: 0.65,
  anisotropy: 0.25,
  anisotropyRotation: 0,
  roughness: 0.93,
  metalness: 0,
  envMapIntensity: 0.3,
  alphaTest: 0.5,
});
```

**TP2 card stock target fields** (derived from SSOT §TP2 + CONTEXT.md decisions):
```typescript
// The card body stock material (replaces the existing `stock` in useCardKit):
const stock = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#f1e7cf"),         // unchanged — warm ivory
  roughness: 0.62,                            // unchanged
  metalness: 0,
  clearcoat: 0.12,                            // SSOT range 0.12–0.18; start LOW end
  clearcoatRoughness: 0.55,                   // SSOT range 0.5–0.6
  sheen: 0.22,                                // paper-edge warm rim (no new texture)
  sheenColor: new THREE.Color("#fff6e0"),     // unchanged
  normalMap: cardMicroReliefNormalMap(),      // NEW — see textures.ts section below
  normalScale: new THREE.Vector2(0.12, 0.12), // CONTEXT: "faint", ~0.12
});
```

**Face texture anisotropy upgrade** (TableLab.tsx lines 304–315 → `useCardFaces()`):
```typescript
// Current — already loads anisotropy 8:
t.anisotropy = 8; // keep rank + suit crisp at the grazing table angle (legibility gate)

// TP2 upgrade: cap to renderer max (inside Scene where renderer is accessible):
t.anisotropy = renderer.capabilities.getMaxAnisotropy(); // cap 16 per SSOT
t.minFilter = THREE.LinearMipmapLinearFilter; // confirm mipmaps
t.generateMipmaps = true;
```

**Card face material** (TableLab.tsx lines 319–330 → `Card` component):
```typescript
// Current face material:
const faceMat = useMemo(() =>
  new THREE.MeshPhysicalMaterial({
    map: faceTex,
    roughness: 0.52,
    metalness: 0,
    clearcoat: 0.1,
    clearcoatRoughness: 0.55,
    side: THREE.DoubleSide,
  }), [faceTex]);

// TP2 upgrade — add clearcoat whisper consistent with stock body:
const faceMat = useMemo(() =>
  new THREE.MeshPhysicalMaterial({
    map: faceTex,
    roughness: 0.52,
    metalness: 0,
    clearcoat: 0.12,              // SSOT low end — whisper, not plastic
    clearcoatRoughness: 0.55,
    side: THREE.DoubleSide,
  }), [faceTex]);
```

**Card geometry seam fix — `curveSegments`** (cards.ts lines 141–151):
```typescript
// Current — already at curveSegments 14 (SSOT minimum):
export function cardBodyGeometry(...): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(roundedRectShape(w, h, r), {
    depth: t,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,   // <-- consider raising to 3–4 for MACRO seam check
    steps: 1,
    curveSegments: 14,  // SSOT: curveSegments ≥ 14 — already met
  });
}
```
The seam fix (no cream rim / z-fight at MACRO) is achieved by ensuring `bevelSize ≤ bevelThickness`
and `bevelSegments ≥ 2`. Already in place; if the seam still shows at MACRO, raise `bevelSegments`
to 3–4 without touching `CARD_CORNER 0.17`.

**Dealt variance pattern** — follow the community-card yaw jitter (cards.ts lines 60–68):
```typescript
// existing community yaw per-card (small deterministic jitter):
rotation: [-Math.PI / 2, 0, Math.sin(i * 1.7) * 0.025],

// TP2 variance (≤1.5° = ≤0.026 rad; deterministic; FROZEN for M9):
// Apply the same Math.sin(i * seed) * amplitude pattern to all card poses.
// For holeLayout, inject a small resting micro-tilt/yaw at construction time
// (not useFrame) so it is always pixel-deterministic under spin=off.
rotation: [-Math.PI / 2 + lift, 0, dir * fan + Math.sin(i * 3.1) * 0.022],
// 0.022 rad ≈ 1.26° — inside the ≤1.5° bound
```

---

### `frontend/src/lab/textures.ts` — new `cardMicroReliefNormalMap()` function

**Analog:** `textures.ts` `feltNapNormalMap()` (lines 510–541) — exact same pattern:
height field drawn on canvas → `heightToNormalMap()` Sobel → `toNormalMapTexture()` → repeat/wrap.

**`feltNapNormalMap()` full pattern to mirror** (textures.ts lines 510–541):
```typescript
export function feltNapNormalMap(): THREE.CanvasTexture {
  const S = 512;
  const { c, ctx } = makeCanvas(S, S);

  // 1. Build height field on canvas (per-pixel imgData write)
  const imgData = ctx.createImageData(S, S);
  const d = imgData.data;
  const ringFreq = 5;
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const dx = px / S - 0.5;
      const dy = py / S - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy) * 2;
      const h = (Math.sin(dist * Math.PI * ringFreq * 2) * 0.5 + 0.5) * 255;
      const i = (py * S + px) * 4;
      d[i] = d[i + 1] = d[i + 2] = h;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // 2. Convert via shared Sobel helper
  const normalCanvas = heightToNormalMap(c, 1.0);

  // 3. Wrap in LINEAR (NoColorSpace) CanvasTexture
  const t = toNormalMapTexture(normalCanvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(8, 8);
  return t;
}
```

**`cardMicroReliefNormalMap()` target** (new function to add to textures.ts):
```typescript
// Card micro-relief: a linen/emboss crosshatch height field — faint paper texture.
// normalScale ~0.12 in the material (set per-material in useCardKit, not here).
export function cardMicroReliefNormalMap(): THREE.CanvasTexture {
  const S = 256; // smaller than felt (256² is enough for a non-tiled face-scale normal)
  const { c, ctx } = makeCanvas(S, S);

  // Draw a linen crosshatch height field (horizontal + vertical fine fibres)
  const imgData = ctx.createImageData(S, S);
  const d = imgData.data;
  const freq = 18; // fine grain — ~18 fibre pairs per tile
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const hx = (Math.sin((px / S) * Math.PI * freq * 2) * 0.5 + 0.5);
      const hy = (Math.sin((py / S) * Math.PI * freq * 2) * 0.5 + 0.5);
      const h = (hx * 0.6 + hy * 0.4) * 255; // slight horizontal bias (paper grain)
      const i = (py * S + px) * 4;
      d[i] = d[i + 1] = d[i + 2] = h;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const normalCanvas = heightToNormalMap(c, 1.0); // strength stays neutral; normalScale does the tuning
  const t = toNormalMapTexture(normalCanvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 3); // face-scale: ~2 tiles across card width, ~3 along card height
  return t;
}
```

**Colorspace discipline** (textures.ts lines 153–158, enforced by `gray()` and `toNormalMapTexture()`):
```typescript
// All normal maps: NoColorSpace (Pitfall 7 — never sRGB)
function gray(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace; // critical — linear data, not a color texture
  t.anisotropy = 8;
  return t;
}
// toNormalMapTexture() in normalMapHelper.ts enforces the same invariant.
```

---

### `frontend/src/lab/TableLab.tsx` — new `?card` A/B flag + anisotropy upgrade

**Analog:** existing `?` flag pattern — `qp("felt")`, `qp("cam")`, `qp("cards")`, `qp("chips")`, `qp("marks")`, `qp("seats")`, `qp("stats")`.

**The `qp()` helper** (TableLab.tsx lines 67–71):
```typescript
/** read a query param — debug toggles for isolating issues in the lab */
function qp(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}
```

**`?felt=` multi-mode switch pattern** (TableLab.tsx lines 366–386) — template for `?card=` flag:
```typescript
const feltKind = qp("felt");
const feltMat =
  feltKind === "magenta"
    ? new THREE.MeshBasicMaterial({ color: 0xff00ff })
    : feltKind === "basic"
      ? new THREE.MeshBasicMaterial({ map: feltTexture(logoImg, aceImgs), alphaTest: 0.5 })
      : new THREE.MeshPhysicalMaterial({ /* full TP1 material */ });
```

**TP2 `?card=` flag target** (add to `useCardKit()` in TableLab.tsx):
```typescript
// Each new lever behind its own sub-flag — one variable per A/B gate:
//   ?card=base      → pre-TP2 baseline (current stock material, anisotropy 8)
//   ?card=aniso     → lever 1: maxAnisotropy + LinearMipmapLinear
//   ?card=normal    → levers 1+2: + micro-relief normalMap
//   ?card=coat      → levers 1+2+3: + clearcoat whisper
//   ?card=edge      → levers 1+2+3+4: + sheen-rim paper-edge
//   ?card=var       → levers 1-4 + dealt variance
//   (no param)      → full TP2 stack (levers active once operator-approved one by one)
const cardKind = qp("card");
```

**Renderer `capabilities` access pattern** — use the `useThree` hook (R3F standard):
```typescript
import { useThree } from "@react-three/fiber";
// inside Scene or a child component:
const { gl } = useThree();
const maxAniso = gl.capabilities.getMaxAnisotropy();
// then pass maxAniso into useCardFaces() via prop or context
```

**`?stats` pattern** (TableLab.tsx lines 829–830) — mount conditionally, zero pixels:
```typescript
{qp("stats") !== null && <StatsProbe />}
// mirror for any new diagnostic:
{qp("card") !== null && <SomeCardDiagnostic />}
```

---

### `docs/table-3d/anchors/tp2-base/` — new dated baseline directory

**Analog:** `docs/table-3d/anchors/head/` (3 files: card.png, hero.png, macro.png — committed PNGs).

**Corpus pattern** (ROADMAP §4.3 + head/ directory):
```
docs/table-3d/anchors/
  head/               ← TP0 HEAD baseline (IMMUTABLE)
    card.png          ← 1440×900 @DPR2 → downscaled 1440×900 committed PNG
    hero.png
    macro.png
  reference-tag/      ← protected-tag baseline (IMMUTABLE)
    card.png
    hero.png
    macro.png
  tp2-base/           ← NEW: dated post-encuadre baseline for TP2 deltas (MUTABLE within TP2)
    card.png          ← captured BEFORE any TP2 lever is applied
    hero.png
    macro.png
```

**Capture command** (ROADMAP §11, step 3 — copy-paste):
```bash
LAB_URL="http://localhost:5173/table-lab.html?cam=card&spin=off" node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp2-base/card.png
LAB_URL="http://localhost:5173/table-lab.html?cam=hero&spin=off" node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp2-base/hero.png
LAB_URL="http://localhost:5173/table-lab.html?cam=macro&spin=off" node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp2-base/macro.png
```

**Naming decision** (Claude's Discretion per CONTEXT.md):
- Directory: `docs/table-3d/anchors/tp2-base/` — parallel to `head/` and `reference-tag/`
- Files: `card.png`, `hero.png`, `macro.png` — identical naming convention
- Tracking: COMMITTED (same as head/ and reference-tag/; not gitignored-scratch — the ROADMAP
  states the anchor corpus "would NOT survive a clean checkout" if gitignored)
- Downscale: YES — capture at DPR2 (2880×1800), commit the 1440×900 downscaled version
  (consistent with the existing head/ PNGs which are ~1440px wide)
- Purpose: TP2 delta measurement for M1/M2/M5/M6 against this baseline, NOT against head/

---

## Shared Patterns

### `qp()` A/B flag convention
**Source:** `frontend/src/lab/TableLab.tsx` lines 67–71 + 741–789
**Apply to:** every new per-lever toggle in TableLab.tsx (the `?card=` flag)

```typescript
// Pattern: qp(name) → string | null
// Convention: null = feature ON (default scene); "off" = disabled; value = mode
// New flags follow this:
//   qp("card") === "base"  → pre-TP2 material (regression check)
//   qp("card") === null    → full TP2 stack (after each lever ships)
//   qp("card") === "aniso" → lever 1 only (A/B one variable)
```

### Texture colorspace discipline
**Source:** `frontend/src/lab/textures.ts` lines 146–159 (`srgb()` / `gray()` helpers)
**Apply to:** `cardMicroReliefNormalMap()` in textures.ts

```typescript
// Color textures (albedo, face maps): srgb() → THREE.SRGBColorSpace
// Data textures (normals, bump, AO, roughness): gray() → THREE.NoColorSpace
// The toNormalMapTexture() helper in normalMapHelper.ts enforces NoColorSpace
// + anisotropy 8 for all normal maps.
```

### `useMemo` kit pattern
**Source:** `frontend/src/lab/TableLab.tsx` lines 174–213 (`useChipKit`) + 287–299 (`useCardKit`)
**Apply to:** any material/geometry factory that must not re-create on every render

```typescript
// Pattern: useMemo(() => { const mat = new THREE.MeshPhysicalMaterial({...}); return mat; }, [deps])
// All material construction for cards stays inside useCardKit() useMemo.
// New normalMap textures created once inside useMemo, not per-frame.
```

### Sobel height→normal reuse
**Source:** `frontend/src/lab/normalMapHelper.ts` lines 59–111 (`heightDataToNormalData`) + 118–132 (`heightToNormalMap`)
**Apply to:** `cardMicroReliefNormalMap()` in textures.ts

```typescript
import { heightToNormalMap, toNormalMapTexture } from "./normalMapHelper";
// Same two-call chain used in feltNapNormalMap():
const normalCanvas = heightToNormalMap(heightCanvas, 1.0);
const t = toNormalMapTexture(normalCanvas);
```

### Test invariant pattern
**Source:** `frontend/src/lab/cards.test.ts` + `frontend/src/lab/normalMapHelper.test.ts`
**Apply to:** any new exported pure function added to cards.ts

The existing `cards.test.ts` (27 assertions, all Vitest) tests geometry invariants via pure
functions only (no THREE, no canvas). If dealt-variance helpers are extracted as pure functions,
add tests following this pattern:
```typescript
// Test: assert ≤ 1.5° (0.026 rad) bound
import { describe, it, expect } from "vitest";
describe("dealt variance", () => {
  it("rotation jitter stays within ≤1.5° (0.026 rad) bound — M9 determinism", () => {
    // Pure math test — no THREE needed
    for (let i = 0; i < 7; i++) {
      const jitter = Math.sin(i * 3.1) * 0.022;
      expect(Math.abs(jitter)).toBeLessThanOrEqual(0.026);
    }
  });
});
```

---

## No Analog Found

None. All TP2 files have direct analogs in the codebase.

---

## Integration Summary (ordered by lever sequence from CONTEXT.md)

| Step | File | Operation | Key Anchor |
|------|------|-----------|------------|
| Step 0 | `docs/table-3d/anchors/tp2-base/` | Capture new dated baseline (3 PNGs) | Before ANY lever — M1 re-measured here |
| Lever 1 | `TableLab.tsx` `useCardFaces()` | Upgrade anisotropy to `getMaxAnisotropy()` + `LinearMipmapLinearFilter` | `useThree().gl.capabilities` |
| Lever 2 | `cards.ts` `cardBodyGeometry()` | Verify bevelSegments seam at MACRO; raise to 3–4 if needed | `CARD_CORNER 0.17` unchanged |
| Lever 3 | `textures.ts` | Add `cardMicroReliefNormalMap()` (new export) | Mirrors `feltNapNormalMap()` exactly |
| Lever 3 | `TableLab.tsx` `useCardKit()` | Wire `normalMap: cardMicroReliefNormalMap()` + `normalScale: 0.12` | Inside stock `useMemo` |
| Lever 4 | `TableLab.tsx` `useCardKit()` | Set `clearcoat: 0.12`, `clearcoatRoughness: 0.55` | SSOT low end |
| Lever 5 | `TableLab.tsx` `useCardKit()` | Paper-edge via sheen warmth (sheen already present; tune `sheenColor`) | No new texture |
| Lever 6 | `cards.ts` `holeLayout()` / `communityLayout()` | Add `Math.sin(i * seed) * ≤0.022` deterministic yaw variance | Pure math, unit-testable |
| Lever 7 | `TableLab.tsx` `Scene` / `ContactShadows` | Tighten near-edge contact shadow parameters | `ContactShadows` already in scene |

---

## Metadata

**Analog search scope:** `frontend/src/lab/` (all files read), `docs/table-3d/anchors/` (directory tree)
**Files scanned:** 6 source files + 2 test files + 1 directory listing
**Pattern extraction date:** 2026-06-11
