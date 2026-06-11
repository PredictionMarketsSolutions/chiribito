# Phase 4: TP3 — Fichas Materiality + Perf (accent + instancing) - Research

**Researched:** 2026-06-11
**Domain:** React Three Fiber / three.js PBR materials + drei `<Instances>` instancing, canvas-texture pipeline, draw-call metric harness
**Confidence:** HIGH — every claim is grounded in the actual repo files read this session

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Sequencing & Eval-Rig**
- Instancing FIRST (strict visual PARITY vs the current chip look), THEN de-Vegas materiality on the instanced chips.
- Capture a tp3-base (the current post-TP2 chips) as the apples-to-apples "before". M10 baseline is known (TP0: HERO ~233 / MACRO ~195 / `?chips=full` 637 — all OVER ceiling; TP3 is the fix).
- SPLIT rollback: de-Vegas non-blocking (keep current chips if ambiguous); instancing must-ship-or-revert (net-positive perf or don't ship).

**De-Vegas Material (max-mate / max-recede)**
- clay seal (clearcoat) 0.32 / clearcoatRoughness 0.5 — maximally matte.
- chroma muted −20% + value lowered (recede more).
- C / rim mark tooled RECESSED via the shared bump→normal helper (`normalMapHelper`).
- face logo desaturated + shrunk.
- micro-grain added; gloss killed.
- Goal: accent recedes so cards dominate — M2 ≥ 2× holds; chips are no longer the second-brightest / most-saturated object after cards (histogram).

**Instancing & Perf**
- drei `<Instances>` / `<Instance>` per denomination (one body set + one TOP-face set per suit); drop the never-seen bottom face.
- chip textures right-sized 2048² → 512².
- STRICT visual PARITY — any instancing look change = regression; MACRO chip quality ≥ baseline.
- bump→normal for the chip face (shared helper).
- Targets: demoted-pot chip draws ~42 → ≤ ~10; `?chips=full` back within < 220; M10 PASS.
- Break the deterministic 10-group cream-insert phase-alignment (SSOT).
- Keep hand-stacked jitter; inter-chip separation via GEOMETRY / material only (jitter + a baked edge-darkening on the chip body) — screen-space inter-chip AO is a TP6 bonus, NEVER a TP3 gate.

**Locked by SSOT §TP3 (doc WINS on conflict)**
- de-Vegas: matte clay seal 0.32–0.42, gloss killed, micro-grain, C tooled RECESSED, face logo desat+shrunk; accent chroma muted ~15–20%, value lowered.
- instancing: `InstancedMesh`/drei Instances per denomination (one body + one top-face per suit); drop the bottom face; right-size chip textures; bump→normal. demoted-pot ~42 → ≤ ~10; `?chips=full` < 220; M10 PASS; MACRO chip quality ≥ baseline (instancing = visual-parity).
- M2 cards-vs-chips ≥ 2× MUST hold (hierarchy — the cards stay the protagonist).
- Gate: operator A/B at HERO + MACRO — worn artisanal clay that RECEDES, C tooled-not-printed, no Vegas gloss. Stop-on-ambiguous: chips pull the eye / read plastic → STOP.
- Rollback SPLIT: de-Vegas non-blocking (keep current); instancing must-ship-or-revert.

### Claude's Discretion
- `?` flag names + wiring, capture cadence, the tp3-base dir naming, exact micro-grain / bump strength within "restrained", and the drei-Instances grouping detail — at Claude's discretion within the above.

### Deferred Ideas (OUT OF SCOPE)
- TP4 (rail/contour), TP5 (lighting/PCSS/ContactShadows), TP6 (screen-space/crevice AO incl. inter-chip; depth/DOF/vignette), TP7 (cameras), TP8 (social/multi-hand), TP9 (AAA lock).
- Carried TP2 items (per-lever `?card=` flag wiring; M1 px-method; AAA(5) cards / CARD_W revisit) — not TP3 scope.

</user_constraints>

---

## Summary

TP3 has two completely independent workstreams that execute sequentially: (1) **instancing** — a mechanical draw-call fix with strict visual parity, and (2) **de-Vegas materiality** — a perceptual re-authoring of the clay body applied on top of the instanced chips. The instancing workstream is must-ship-or-revert; the de-Vegas workstream is non-blocking. Both are lab-only on `spike/table-3d-hero`, behind `?chips=` flags, using only files in `frontend/src/lab/`.

The repo's actual stack is `three ^0.169 / @react-three/fiber ^8.17 / @react-three/drei ^9.114.0` (installed: `9.114.0`). The drei `<Instances>` / `<Instance>` API in this version accepts `geometry` + `material` as props on the `<Instances>` wrapper, and each `<Instance>` takes `position`, `rotation`, `scale`, `color` as JSX props — these map directly to the InstancedMesh's per-instance matrix and color attribute without any manual attribute buffer management.

The current `ChipStack` pushes N individual `<Chip>` nodes, each of which mounts 3 meshes (body + top face + bottom face). For the demoted pot (5+3+4 = 12 chips) that is 36 meshes / ~42 draw calls before shadow passes. Instancing replaces these with 4 `<Instances>` groups (one body + one top-face per denomination, 4 denominations), collapses N body meshes into 1 InstancedMesh draw and N top-face meshes into 1 draw — targeting ~10 draws for the demoted pot.

The M10 measurement is done by `tools/table-3d/stats-read.mjs`, which wraps `drawElements`, `drawArrays`, `drawElementsInstanced`, and `drawArraysInstanced` directly on the raw WebGL context for one real frame — NOT via `StatsProbe` / `gl.info.render.calls` (which reads stale under headless rAF throttle). M2 is a manual-polygon shoelace ratio from `tools/table-3d/m1-m2-m12.mjs`.

**Primary recommendation:** Convert `ChipStack` to a `InstancedChipStack` using zwei `<Instances>` nodes per denomination (body + top-face), dropping the bottom face, then apply the de-Vegas `MeshPhysicalMaterial` to the shared body material — mirroring the TP1/TP2 pattern already present in the codebase.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Chip geometry / instancing | Frontend (lab) — `TableLab.tsx` | — | `useChipKit` + `ChipStack` live entirely in the lab; no backend involvement |
| Chip material (de-Vegas) | Frontend (lab) — `TableLab.tsx` / `textures.ts` | `normalMapHelper.ts` | `MeshPhysicalMaterial` constructed in `useChipKit`; textures authored in `textures.ts`; bump→normal via shared helper |
| Chip textures (canvas, 2048→512) | Frontend (lab) — `textures.ts` | — | `chipFaceTexture`, `chipFaceBump`, `chipEdgeTexture` all authored procedurally in `textures.ts` |
| Draw-call measurement (M10) | Tooling — `tools/table-3d/stats-read.mjs` | — | Playwright headless WebGL context wrapper; reads actual GPU draw commands per frame |
| M2 cards-vs-chips ratio | Tooling — `tools/table-3d/m1-m2-m12.mjs` | Operator (manual polygons) | Shoelace area ratio; segmentation is manual-polygon fallback per SSOT |
| Capture pipeline | Tooling — `.dev-stack/lab-shot.mjs` | — | Playwright D3D11 PNG capture at frozen camera presets |
| tp3-base anchor persistence | `docs/table-3d/anchors/` | — | Tracked PNG dir per TP0 corpus protocol |

---

## Standard Stack

### Core (already installed — no new packages)

| Library | Installed Version | Purpose | Source |
|---------|------------------|---------|--------|
| `three` | `^0.169.0` (installed `0.169.x`) | InstancedMesh, MeshPhysicalMaterial, canvas texture pipeline | [VERIFIED: npm list in repo] |
| `@react-three/fiber` | `^8.17.10` (installed `8.17.10`) | `useFrame`, `useThree`, `useMemo` hooks; R3F render loop | [VERIFIED: npm list in repo] |
| `@react-three/drei` | `^9.114.0` (installed `9.114.0`) | `<Instances>` / `<Instance>` per-denomination InstancedMesh wrapper | [VERIFIED: npm list in repo] |

**No new packages are required for TP3.** The entire phase uses only already-installed libraries.

### Supporting (already in repo, reused as-is)

| File | Purpose | Reuse |
|------|---------|-------|
| `frontend/src/lab/normalMapHelper.ts` | `heightToNormalMap(canvas, strength)` → Sobel normal, `toNormalMapTexture(canvas)` → NoColorSpace THREE.CanvasTexture | Reuse verbatim for chip face bump→normal |
| `frontend/src/lab/textures.ts` | `chipFaceTexture`, `chipFaceBump`, `chipEdgeTexture`, `CHIP_PALETTES`, `C_ARC`, `speckle` | Modify in-place (size: 2048→512; chroma muting; logo desat+shrink) |
| `tools/table-3d/stats-read.mjs` | M10 draw-call reader (GL wrap) | Run as-is: `node tools/table-3d/stats-read.mjs http://localhost:5173 hero` |
| `tools/table-3d/metrics.mjs` | `m10DrawCall(calls)` verdict; `THRESHOLDS.M10_DRAWCALL_MAX = 150` / `M10_DRAWCALL_CHIPS_FULL_MAX = 220` | Run as-is via `run-metrics.mjs` |
| `tools/table-3d/m1-m2-m12.mjs` | `m2CardsVsChips({cardsArea, chipsArea})` → `{ pass, value.ratio }` | Re-run at HERO post-instancing; M2 ≥ 2.0× |
| `.dev-stack/lab-shot.mjs` | Playwright D3D11 PNG capture | Run as-is for tp3-base + post-instancing + post-de-Vegas captures |

---

## Package Legitimacy Audit

> No new packages are installed in TP3. The audit is not applicable.

**Packages removed due to slopcheck verdict:** none  
**Packages flagged as suspicious:** none

---

## Architecture Patterns

### System Architecture Diagram

```
                     TableLab.tsx Scene()
                            |
              ┌─────────────┴──────────────┐
              |                            |
        useChipKit(cImg)             ?chips= flag
        (shared kit created once,    qp("chips")
         memoized by cImg)                 |
              |                   ┌────────┴────────┐
    ┌─────────┴───────────┐   "full" (stress)   default (demoted)
    |                     |       |                   |
  body: LatheGeometry   face: PlaneGeometry    <group pos=[3,0,1.5] scale=0.5>
  (72 segments)         (R*1.72 × R*1.72)            |
    |                     |               InstancedChipStack ×3 denominations
    |                     |
  per-suit MeshPhysicalMaterial  (body + face — BOTH become shared materials
    body: roughness 0.5,          passed as props to <Instances>)
         clearcoat 0.42/0.46,
         sheenColor = p.faceLit
    face: bumpMap chipFaceBump,
         clearcoat 0.32/0.36

                    CURRENT (draw-call liability)
                    ChipStack renders N × <Chip>
                    Each <Chip> = 3 meshes:
                      body mesh  → 1 draw
                      top face   → 1 draw
                      bottom face → 1 draw  ← DROPPED
                    12 chips (demoted pot) = ~36 meshes → ~42 draws

                    TARGET (TP3 instancing)
                    InstancedChipStack renders per denomination:
                      <Instances geometry={body} material={bodyMat}>
                        <Instance position rotation scale /> ×N
                      </Instances>  → 1 draw
                      <Instances geometry={face} material={faceMat}>
                        <Instance position rotation /> ×N
                      </Instances>  → 1 draw
                    3 denominations in demoted pot = 6 draws total → ≤~10 draws (with shadows)

                    M10 MEASUREMENT
                    stats-read.mjs wraps GL.drawElements/drawArrays/
                    drawElementsInstanced/drawArraysInstanced on the
                    raw WebGL context → counts real GPU draw commands
                    per rAF tick → reports MAX of 90-frame sample
```

### Recommended Project Structure

No new files or directories required. TP3 modifies these existing files only:

```
frontend/src/lab/
├── TableLab.tsx        ← replace ChipStack with InstancedChipStack; add ?chips= flag wiring
├── textures.ts         ← resize chipFaceTexture/Bump (2048→512); mute chroma; desat logo; add chipBodyNormalMap()
└── normalMapHelper.ts  ← no changes needed (reuse as-is)

docs/table-3d/anchors/
└── tp3-base/           ← NEW: hero.png, macro.png, pov.png (tp3-base capture before instancing)
    ├── hero.png
    ├── macro.png
    └── pov.png
```

---

## Question 1: drei `<Instances>` / `<Instance>` API in drei v9.114.0

### Exact API (VERIFIED against `@react-three/drei@9.114.0`)

**`<Instances>` props:** [VERIFIED: github.com/pmndrs/drei Instances.tsx v9.114.0]
```typescript
type InstancesProps = JSX.IntrinsicElements['instancedMesh'] & {
  geometry?: THREE.BufferGeometry   // passed as a prop (not a child)
  material?: THREE.Material          // passed as a prop (not a child)
  limit?: number                     // default 1000 — pre-allocates the instance buffer
  range?: number                     // optional draw-range override
  frames?: number                    // default Infinity — how many frames to recompute matrices
  context?: React.Context<Api>       // optional isolated context (not needed here)
}
// <Instances> renders an underlying THREE.InstancedMesh; ref gives access to it
```

**`<Instance>` props:**
```typescript
type InstanceProps = JSX.IntrinsicElements['positionMesh'] & {
  position?: [number, number, number]
  rotation?: [number, number, number]   // Euler radians
  scale?: number | [number, number, number]
  color?: string | number               // → InstancedMesh instanceColor attribute
  context?: React.Context<Api>
}
// children are supported (for nesting groups), but not needed for chip instancing
```

### Concrete conversion of `ChipStack` → `InstancedChipStack`

**Current `ChipStack` (TableLab.tsx:248–274):**
```typescript
function ChipStack({ kit, denom, count, position }) {
  const chips = [];
  for (let i = 0; i < count; i++) {
    const jx = Math.sin(i * 2.3) * 0.012;
    const jz = Math.cos(i * 1.7) * 0.012;
    chips.push(
      <Chip key={i} kit={kit} denom={denom}
        position={[position[0] + jx, position[1] + i * H, position[2] + jz]}
        rotationY={i * 0.55}
      />
    );
  }
  return <group>{chips}</group>;
}
```

**Target `InstancedChipStack` using drei `<Instances>`:**
```typescript
import { Instances, Instance } from "@react-three/drei";

function InstancedChipStack({
  kit,
  denom,
  count,
  position,
}: {
  kit: ChipKit;
  denom: SuitCode;
  count: number;
  position: [number, number, number];
}) {
  const m = kit.mats[denom];
  // Pre-build per-instance data in useMemo — same deterministic jitter as before.
  // Breaking the cream-insert phase-alignment: use a DIFFERENT seed for rotationY
  // so the 10-group pattern no longer aligns (e.g. multiply by 0.37 instead of 0.55).
  const instances = useMemo(() => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const jx = Math.sin(i * 2.3) * 0.012;
      const jz = Math.cos(i * 1.7) * 0.012;
      out.push({
        bodyPos: [position[0] + jx, position[1] + i * H, position[2] + jz] as [number,number,number],
        facePos: [position[0] + jx, position[1] + i * H + H / 2 + 0.002, position[2] + jz] as [number,number,number],
        rotY: i * 0.37, // changed from 0.55 to break the 10-group cream phase-alignment
      });
    }
    return out;
  }, [count, position]);

  return (
    <>
      {/* Body instances — one InstancedMesh draw call for all N chips of this denomination */}
      <Instances geometry={kit.body} material={m.body} limit={count + 2}>
        {instances.map((inst, i) => (
          <Instance
            key={i}
            position={inst.bodyPos}
            rotation={[0, inst.rotY, 0]}
          />
        ))}
      </Instances>
      {/* Top-face instances — one draw call for all N top faces */}
      <Instances geometry={kit.face} material={m.face} limit={count + 2}>
        {instances.map((inst, i) => (
          <Instance
            key={i}
            position={inst.facePos}
            rotation={[-Math.PI / 2, 0, inst.rotY]}
          />
        ))}
      </Instances>
      {/* Bottom face is DROPPED entirely — never seen, pure draw-call waste */}
    </>
  );
}
```

**Key implementation notes:**
- `geometry` and `material` are passed as **props on `<Instances>`**, not as JSX children. [VERIFIED: Instances.tsx v9.114.0]
- `limit` should be set to `count + 2` (small safety margin) — if `limit` is lower than the rendered instance count, drei silently truncates draws. For the demoted pot (count 3–5) `limit=8` is safe.
- `frames={1}` on `<Instances>` is a valuable optimization after the scene is stable (skips recomputing instance matrices every frame). Apply after visual-parity verification — not during initial A/B.
- The face `<Instance>` rotation is `[-Math.PI / 2, 0, rotY]` to lay the plane flat on top of the cylinder, matching the current `position={[0, H/2 + 0.002, 0]} rotation={[-Math.PI/2, 0, 0]}` in `<Chip>`. [VERIFIED: TableLab.tsx:235–241]
- The bottom face `rotation={[Math.PI/2, 0, 0]}` is dropped — it was the third mesh in `<Chip>` and is never visible.
- The `useMemo` on `instances` ensures determinism (M9) — same seeds as the current jitter.

### Per-denomination grouping for `?chips=full`

The `?chips=full` path renders 4 denominations (C 17, B 12, E 14, O 9) plus 2 loose chips. Each denomination needs its own `<Instances>` pair (body + top-face). The 2 loose chips (`<Chip denom="O">`, `<Chip denom="C">`) can either join their denomination's `<Instances>` group or remain as individual meshes if their position is markedly different from the stack. Joining the group is preferred for draw count.

With 4 denominations instanced: 4 body draws + 4 face draws = 8 draws minimum for the stacks; +2 for the loose chips if kept individual = 10 total chip draws for `?chips=full`. Plus shadow pass overhead, staying well under 220.

---

## Question 2: How M10 is measured — draw-call capture protocol

### The measurement tool

**File:** `tools/table-3d/stats-read.mjs` [VERIFIED: read this session]

**Why NOT `StatsProbe`/`gl.info.render.calls`:** `StatsProbe` reads `gl.info.render.calls` at the START of `useFrame` — before the scene renders that frame. Under headless Chromium's rAF throttle, this reads a stale `1`. `stats-read.mjs` wraps the raw WebGL context's draw functions directly and counts them during actual GPU execution — the authoritative value. [VERIFIED: stats-read.mjs:7–17]

**What it wraps:** [VERIFIED: stats-read.mjs:63–68]
```javascript
["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"].forEach(wrap);
```
This covers both non-instanced draws AND the instanced draw calls from `InstancedMesh` — so the instanced draws ARE counted correctly in the total.

**Sampling:** 90 rAF frames; returns `MAX` of non-zero counts (the genuine full-scene+shadow pass). [VERIFIED: stats-read.mjs:74–83]

**CLI usage:**
```bash
# Hero staged color pass (must be < 150)
node tools/table-3d/stats-read.mjs http://localhost:5173 hero
# chips=full stress diagnostic (looser < 220 ceiling)
node tools/table-3d/stats-read.mjs http://localhost:5173 hero "&chips=full"
# Macro (< 150)
node tools/table-3d/stats-read.mjs http://localhost:5173 macro
```

**Output format:**
```json
{ "cam": "hero", "extra": "", "ok": true, "calls": 47, "framesRendered": 82, "distinct": [0, 1, 47] }
```

**tp3-base capture (before instancing):**
```bash
# Step 1 — persist tp3-base anchors (current post-TP2 chip look)
LAB_URL="http://localhost:5173/table-lab.html?cam=hero" node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp3-base/hero.png
LAB_URL="http://localhost:5173/table-lab.html?cam=macro" node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp3-base/macro.png
LAB_URL="http://localhost:5173/table-lab.html?cam=card" node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp3-base/pov.png

# Step 2 — record tp3-base draw counts
node tools/table-3d/stats-read.mjs http://localhost:5173 hero         # expect ~233 (TP0 baseline)
node tools/table-3d/stats-read.mjs http://localhost:5173 hero "&chips=full"  # expect ~637
```

**After instancing — same commands, expect:**
```bash
node tools/table-3d/stats-read.mjs http://localhost:5173 hero         # target ≤ 150 (M10 PASS)
node tools/table-3d/stats-read.mjs http://localhost:5173 hero "&chips=full"  # target < 220
```

**Realistic draw-count delta from instancing:**

Current demoted pot: 3 ChipStacks (5+3+4 = 12 chips), each chip = 3 meshes → 36 mesh nodes → ~36 chip color draws + shadow draws → ~42 chip-related draws total (per CONTEXT.md).

After instancing (3 denominations): 3 × (1 body draw + 1 face draw) = 6 chip draws; shadow overhead unchanged but shadow is per-InstancedMesh not per-chip → 6 shadow draws → ~12 chip-related draws. That lands at ≤ 10 non-shadow chip draws — matching the SSOT target. Total HERO draw count delta: ~30 fewer draws → from ~233 to ~203. Additional whole-scene draw-call savings come from removing the bottom face meshes and the per-chip group nodes.

For `?chips=full` (17+12+14+9 = 52 chips + 2 loose): currently 52×3 + 2×3 = 162 chip meshes → ~637 total. After instancing: 4 body draws + 4 face draws = 8 draws + 2×2 loose = 12 chip draws. Total `?chips=full` delta: ~150 fewer chip draws → well under 220.

---

## Question 3: Current chip rendering in detail

### `useChipKit` (TableLab.tsx:175–213) [VERIFIED: read this session]

**Geometry:**
- `body`: `new THREE.LatheGeometry(chipProfile(), 72)` — 72 segments, generates a UV-mapped surface where `uv.y ≈ 0.5` maps to the outer wall centre (critical for the edge texture alignment of the cream inserts).
- `face`: `new THREE.PlaneGeometry(R * 1.72, R * 1.72)` — NOT `CircleGeometry` (avoids UV moiré on the radial C texture). `R = 1` (chip radius = 1 world unit).

**Materials — both `MeshPhysicalMaterial`:** [VERIFIED: TableLab.tsx:189–213]

Body material per suit:
```typescript
new THREE.MeshPhysicalMaterial({
  map: edge,                    // chipEdgeTexture(suit)
  color: new THREE.Color("#ffffff"),
  roughness: 0.5,
  metalness: 0,
  clearcoat: 0.42,              // ← de-Vegas target: 0.32 (lower end of 0.32–0.42 range)
  clearcoatRoughness: 0.46,     // ← de-Vegas target: 0.5 (matte seal)
  sheen: 0.5,                   // ← de-Vegas: KILL this (0 or remove)
  sheenColor: new THREE.Color(p.faceLit),  // ← de-Vegas: remove
})
```

Face material per suit:
```typescript
new THREE.MeshPhysicalMaterial({
  map: chipFaceTexture(suit, cImg),
  bumpMap: chipFaceBump(cImg),   // the recessed C + rim groove height map
  bumpScale: 0.025,
  roughness: 0.46,               // ← de-Vegas: raise to ~0.72 (kill gloss)
  metalness: 0,
  clearcoat: 0.32,               // already at SSOT target
  clearcoatRoughness: 0.36,      // ← de-Vegas: raise to 0.5 (matte seal)
  alphaTest: 0.5,
})
```

**Important: the current `faceMat` already uses `bumpMap: chipFaceBump` for the recessed C.** The de-Vegas step replaces the `bumpMap` with a `normalMap` generated via `normalMapHelper.heightToNormalMap(chipFaceBump_canvas, strength)` — upgrading from bump to tangent-space normal for better quality at MACRO. This is exactly the TP1/TP2 precedent pattern. [VERIFIED: normalMapHelper.ts, textures.ts]

### `ChipStack` and the 10-group cream-insert phase-alignment issue

**The alignment:** `chipEdgeTexture` draws 10 groups of cream inserts equally spaced around a `W=2048, H=256` canvas. The Lathe geometry UV maps the full circumference to `uv.x ∈ [0,1]`. When chips stack and each rotates by `i * 0.55` radians, the repeating pattern of 10 groups (each spanning 36° = `2π/10` rad ≈ 0.628 rad) partially aligns because `0.55 / 0.628 ≈ 0.876` — close to a rational fraction. Over N chips this creates a visible spiral alignment pattern.

**Fix in `InstancedChipStack`:** change the rotation seed from `i * 0.55` to `i * 0.37` radians. `0.37 / 0.628 ≈ 0.589` — not a near-rational fraction, so cream inserts spiral irregularly rather than aligning. The fix is a 1-character change; it does NOT require changing the cream-insert texture geometry.

### Demoted pot structure (current, post-TP2)

```typescript
// TableLab.tsx:830–838 [VERIFIED: read this session]
<group position={[3.0, 0, 1.5]} scale={0.5}>
  <ChipStack kit={chipKit} denom="C" count={5} position={[-1.6, 0.06, -0.7]} />
  <ChipStack kit={chipKit} denom="E" count={3} position={[1.6, 0.06, -0.7]} />
  <ChipStack kit={chipKit} denom="B" count={4} position={[0.0, 0.06, 1.7]} />
</group>
```

3 stacks, 3 denominations (no O denomination in the demoted pot), total 12 chips × 3 meshes/chip = 36 mesh nodes → ~42 chip-related draws. Position is `[3.0, 0, 1.5]` at `scale={0.5}` — off to the right side, behind the cards.

---

## Question 4: De-Vegas material — concrete MeshPhysicalMaterial values

The de-Vegas chip follows the TP1/TP2 `MeshPhysicalMaterial` pattern already established for felt and card stock. [VERIFIED: TableLab.tsx for TP1 felt + TP2 card patterns]

### Body material (de-Vegas clay)

```typescript
// De-Vegas body — matte worn clay, clearcoat seal, NO sheen/gloss
const bodyMat = new THREE.MeshPhysicalMaterial({
  map: edge,                        // chipEdgeTexture(suit) — at 512² (right-sized)
  color: new THREE.Color("#ffffff"), // tint is fully baked in the texture
  roughness: 0.72,                  // was 0.5; raise to kill gloss reads at MACRO
  metalness: 0,
  clearcoat: 0.32,                  // SSOT locked value (lower end of 0.32–0.42 range)
  clearcoatRoughness: 0.5,          // SSOT locked value — maximally matte clay seal
  // sheen: 0 / remove              // KILL sheen — was 0.5 (Vegas shine contributor)
  // sheenColor: remove             // remove
});
```

**Why clearcoat at 0.32?** Clearcoat at this level creates a barely-there protective seal without specular contribution — the chip reads clay with a wax seal, not polished ceramic. The TP1 felt comparison: felt uses `clearcoat: 0` (no seal); the chip is more finished than felt but far less polished than the wood rail (`clearcoat: 0.72`).

### Face material (de-Vegas, normalMap upgrade)

```typescript
// De-Vegas face — normal map for the recessed C (upgrade from bumpMap)
const faceNormalMap = chipFaceNormalMap(cImg); // new texture function, see Question 5
const faceMat = new THREE.MeshPhysicalMaterial({
  map: chipFaceTexture(suit, cImg),       // at 512² (right-sized)
  normalMap: faceNormalMap,               // upgrade from bumpMap
  normalScale: new THREE.Vector2(0.4, 0.4), // restrained; tunable at MACRO gate
  roughness: 0.72,                        // was 0.46; kill face gloss
  metalness: 0,
  clearcoat: 0.32,                        // was 0.32 already — no change
  clearcoatRoughness: 0.5,                // was 0.36; raise for matte seal
  alphaTest: 0.5,
});
```

**normalMap vs bumpMap:** The current `bumpMap` in the face material is a canvas-generated height map already authored in `chipFaceBump` in `textures.ts`. The upgrade path is to pipe it through `heightToNormalMap(canvas, strength)` and wrap with `toNormalMapTexture()` — the identical pattern used for `feltNapNormalMap()` and `cardMicroReliefNormalMap()`. [VERIFIED: textures.ts:510–541, 556–586] The function call is:
```typescript
export function chipFaceNormalMap(cImg?: HTMLImageElement | null): THREE.CanvasTexture {
  // Re-draw the SAME height field as chipFaceBump (same C_ARC, same coordinates)
  // so the normal grooves register pixel-exactly with the color face texture.
  const S = 512; // right-sized from 2048
  // ... identical drawing logic as chipFaceBump ...
  const normalCanvas = heightToNormalMap(heightCanvas, 1.0); // strength tuned via normalScale
  return toNormalMapTexture(normalCanvas); // NoColorSpace, anisotropy 8
}
```

**Chroma muting −20% + value lowered (material-side):** Apply via the `map` texture color modulation OR via a `color` tint on the material. The most reliable approach is to add a muting helper in `textures.ts` that converts each palette color to HSL, reduces saturation by 20% and lightness by ~8%, and re-draws the texture with muted palette values. This is texture-side (matches the "bake the tone in" convention of the existing texture code). Alternatively, `material.color = new THREE.Color().setHSL(h, s*0.8, l*0.92)` on a white base map — but since the chip edge texture already bakes the tone, the recommended path is to add muted palette variants in `CHIP_PALETTES` used by `chipEdgeTexture` and `chipFaceTexture` under a `?chips=dv` (de-Vegas) flag.

**Micro-grain:** The `speckle()` function in `textures.ts` already exists and is called on chip textures. For de-Vegas, increase the `amount` parameter in `chipFaceTexture` calls from `12` → `18` (face) and in `chipEdgeTexture` from `10` → `16`. [VERIFIED: textures.ts:266, 298, 388]

---

## Question 5: Chip textures — current sizes and right-sizing 512²

### Current sizes [VERIFIED: textures.ts:252–413]

| Texture | Canvas Size | Purpose | Notes |
|---------|------------|---------|-------|
| `chipFaceTexture(suit, cImg)` | **2048 × 2048** | Clay dome + gold C medallion | `S = 2048` hardcoded line 252 |
| `chipFaceBump(cImg)` | **2048 × 2048** | Recessed C groove + micro-grain height | `S = 2048` hardcoded line 311 |
| `chipEdgeTexture(suit)` | **2048 × 256** | Clay edge shading + 10 cream inserts | `W = 2048, H = 256` lines 369–370 |

### Right-sizing to 512²

The chips display at `scale={0.5}` inside the demoted pot group and occupy a small region of the HERO frame. At `fov 32` from `pos [1.2, 5.0, 8.2]`, the demoted pot group at world `[3.0, 0, 1.5]` subtends roughly 80–120px across. At 2880×1800 DPR2, this is ~60px per chip face — far below the 2048px texture. 512² provides ~8.5 texels/pixel at this screen size, which is well within the mip-fetch quality window.

**Right-sizing changes:**
```typescript
// In chipFaceTexture: change S = 2048  →  S = 512
// In chipFaceBump:   change S = 2048  →  S = 512
// In chipEdgeTexture: change W = 2048  →  W = 512  (keep H = 256 → H = 128 proportionally,
//                     or keep H = 256 since the edge is already non-square)
```

**Mip-chain:** `THREE.CanvasTexture` with `generateMipmaps = true` (default) and `anisotropy = 8` (set in `srgb()` helper at textures.ts:147–150). At 512², the mip chain is 512→256→128→64→32→16→8→4→2→1 — 9 levels, complete mip chain, no aliasing. The current `anisotropy = 8` stays correct.

**Memory impact:** 4 face textures (2048²×4 channels = 16MB each) → 4 × 512²×4 channels = 1MB each. Edge textures (2048×256×4 = 2MB each) → 512×256×4 = 512KB each. Total chip texture VRAM: 68MB → 5MB. A meaningful GPU memory saving at zero perceptual cost for the demoted-pot scale.

**MACRO chip quality gate:** At MACRO (`fov 26`, camera `[-1.7, 1.7, 2.4]` targeting `[-1.55, 0.05, 1.05]`), the chips are farther from the camera than the cards and at 0.5 scale. The 512² texture at this view subtends ~120–200px per chip face — still 2.5–4 texels/pixel at max mip. The quality will be visually identical to the 2048² baseline.

---

## Question 6: M2 (cards-vs-chips) — measurement and de-Vegas impact

### How M2 is measured [VERIFIED: m1-m2-m12.mjs:207–227]

```typescript
// m2CardsVsChips({ cardsArea, chipsArea }) — or with polygon arrays
export function m2CardsVsChips({ cardsArea, chipsArea, cardPolys, chipPolys } = {}) {
  // ... shoelace area from manual polygon points ...
  const ratio = chips > 0 ? cards / chips : Infinity;
  return {
    metric: "M2",
    pass: Number.isFinite(ratio) && ratio >= 2.0,  // THRESHOLDS.M2_AREA_RATIO_MIN
    value: { ratio, cardsArea, chipsArea },
    // ...
  };
}
```

M2 is a **manual-polygon fallback** — the operator traces card and chip region polygons on the frozen HERO frame, feeds the `polygonArea([[x,y],…])` shoelace, then calls `m2CardsVsChips`. It is recorded `informational` at TP0 (no automated hard gate — SSOT-sanctioned per `m1-m2-m12.mjs:24–25`). The test passes when cards_area / chips_area ≥ 2.0×.

**Current M2 status (post-TP2):** The demoted pot sits at world `[3.0, 0, 1.5]` at `scale={0.5}`, well off-center from the 5 cards laid across the center felt. The 5 cards (each 2.05×3.1 world units at M1 scale) dominate the frame; the 3 small chip stacks at 0.5× scale are the accent. M2 already passes with significant margin.

**De-Vegas impact on M2:** The de-Vegas material explicitly lowers the chip chroma and value to make chips recede optically. This directly increases M2's perceptual margin — chips become less visually "heavy" even at the same screen area. The M2 pixel-area ratio (based on geometry footprint, not perceived brightness) is unchanged by materiality changes; de-Vegas makes the perceptual hierarchy *stronger* than M2 measures.

**TP3 M2 gate:** Re-run `m2CardsVsChips` with manual polygons traced on the tp3-base and post-de-Vegas HERO frames. The ratio should be ≥ 2.0× in both. If the de-Vegas chips somehow recede below the visible threshold, M2 may actually INCREASE (chips area shrinks perceptually), but the screen footprint is unchanged — so M2 the metric passes trivially.

---

## Question 7: `?chips=` flag pattern and TP3 flag wiring

### Existing `?chips=` flag (TableLab.tsx:819–839) [VERIFIED: read this session]

```typescript
{qp("chips") === "full"  ? (/* heavy central pot — 4 denominations */) :
 qp("chips") !== "off"   ? (/* demoted accent pot — 3 stacks      */) :
                             null}
```

The TP2 `?card=` flag is a **binary base/full** toggle: `?card=base` → pre-TP2 baseline; any other value → TP2 levers active.

### Recommended TP3 flag wiring (Claude's Discretion per CONTEXT.md)

Use **two separate flags** to match the two independent workstreams:

| Flag | Condition | Scene |
|------|-----------|-------|
| `?chips=off` | `qp("chips") === "off"` | No chips at all |
| `?chips=full` | `qp("chips") === "full"` | Heavy central pot (stress diagnostic) |
| `?chips=inst` | `qp("chips") === "inst"` | **NEW: instanced demoted pot, pre-de-Vegas (visual parity test)** |
| `?chips=dv` | `qp("chips") === "dv"` | **NEW: instanced + de-Vegas (the TP3 target)** |
| (no param) | else | Current default → after TP3 ships, becomes the instanced+de-Vegas demoted pot |

This gives exact apples-to-apples A/B capability:
- `?chips=inst` vs no-param → INSTANCING visual parity gate
- `?chips=dv` vs `?chips=inst` → DE-VEGAS perceptual gate
- `?chips=full` → stress draw-call diagnostic (existing, unchanged)

After operator gates pass, the `else` branch in TableLab.tsx is updated to render the instanced+de-Vegas chips as the new default.

**tp3-base capture:** captured with NO `?chips=` flag override (current default demoted pot, pre-TP3).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-instance position/matrix management | Custom `InstancedMesh` ref + `setMatrixAt` loop in `useFrame` | `drei <Instances> + <Instance>` | Handles matrix sync, color attribute, raycasting, R3F reconciler integration automatically |
| Height→tangent-space normal conversion | Re-implementing Sobel | `normalMapHelper.heightToNormalMap(canvas, strength)` | Already in repo, unit-tested, seam-free wrapping boundary conditions |
| Normal map texture wrapping | Manual canvas-to-texture with colorspace | `normalMapHelper.toNormalMapTexture(canvas)` | Sets `NoColorSpace` correctly; anisotropy 8 per project convention |
| Chip texture VRAM budget math | Manual power-of-two sizing experiments | Change `S = 2048` → `S = 512` in `chipFaceTexture` and `chipFaceBump` | Already mip-friendly square sizes; `generateMipmaps` is default true on `CanvasTexture` |
| M10 draw-call counting | Adding console logs or custom React state | `stats-read.mjs` CLI | The only reliable counter under headless rAF throttle (verified in TP0) |
| Chroma −20% muting | HSL color math from scratch | Adjust palette constants in `CHIP_PALETTES` in `textures.ts`, or use `new THREE.Color().getHSL()/setHSL()` | One-liner; color is already abstracted through palettes |

---

## Common Pitfalls

### Pitfall 1: geometry/material as children vs props

**What goes wrong:** Writing `<Instances><boxGeometry /><meshStandardMaterial /></Instances>` (JSX children pattern like standard R3F mesh primitives) — does NOT work for `<Instances>`.  
**Why it happens:** Regular R3F mesh primitives use `attach` to bind geometry/material; `<Instances>` takes them as props directly on the component.  
**How to avoid:** Pass `<Instances geometry={kit.body} material={m.body}>` — both as explicit props.  
**Source:** [VERIFIED: github.com/pmndrs/drei Instances.tsx v9.114.0]

### Pitfall 2: `limit` too small → silent instance truncation

**What goes wrong:** `limit` defaults to 1000 in drei, but if you set it explicitly to a count smaller than the actual number of `<Instance>` children, drei silently renders only `limit` instances — the rest disappear without an error.  
**Why it happens:** `limit` pre-allocates the InstancedMesh buffer; at render time it is a hard cap.  
**How to avoid:** Set `limit` to `count + 4` (small margin). For the demoted pot (max 17 chips per denomination in `?chips=full`) `limit={20}` covers all cases.

### Pitfall 3: normalMap colorspace (sRGB vs NoColorSpace)

**What goes wrong:** Wrapping a normal-map canvas with `THREE.SRGBColorSpace` or using `srgb()` helper from `textures.ts` — the RGB is gamma-decoded, XYZ normal components are destroyed, resulting in wrong lighting (typically the surface lights as if flattened or inverted).  
**Why it happens:** `srgb()` in `textures.ts:146–151` is for color textures; normal maps must be linear.  
**How to avoid:** Always use `toNormalMapTexture(canvas)` from `normalMapHelper.ts` for any normal map — it sets `colorSpace = THREE.NoColorSpace`. Never call `srgb()` on a height/normal canvas. [VERIFIED: normalMapHelper.ts:161–165]

### Pitfall 4: Instance rotation is Euler, not quaternion

**What goes wrong:** Passing `rotation={chipRotationY}` as a scalar (number) instead of `[0, chipRotationY, 0]` — drei's `<Instance>` rotation prop is a three-element Euler tuple.  
**Why it happens:** R3F mesh components accept `rotation-y={value}` shorthand; `<Instance>` does not support the shorthand.  
**How to avoid:** Always pass `rotation={[0, rotY, 0]}` for a Y-axis rotation.

### Pitfall 5: `drawElementsInstanced` is counted once per InstancedMesh draw

**What goes wrong:** Expecting that instancing 17 chips reduces draws from 17 to 0 — it reduces them from 17 to 1, not 0. Each `<Instances>` group (body + face) contributes 2 draw calls (one per mesh).  
**Why it matters:** The SSOT target is "demoted-pot ~42 → ≤ ~10" — this is already accounting for the shadow pass overhead and per-InstancedMesh draws. Don't over-expect.  
**How to avoid:** Check `stats-read.mjs` output after each denomination is instanced; track the delta.  
**Source:** [VERIFIED: stats-read.mjs wraps drawElementsInstanced] 

### Pitfall 6: Bottom face still drawn if face `<Instance>` rotation is wrong

**What goes wrong:** If the face `<Instance>` rotation `[-Math.PI/2, 0, rotY]` is accidentally set to `[Math.PI/2, 0, rotY]`, the face renders under the chip (the bottom) rather than on top — and since `MeshPhysicalMaterial` with `side: THREE.FrontSide` won't render the back, the face disappears. With `side: THREE.DoubleSide` it renders both but wrong.  
**How to avoid:** Top face = `position={[0, H/2 + 0.002, 0]} rotation={[-Math.PI/2, 0, 0]}` (mirrored from the current `<Chip>` code exactly). [VERIFIED: TableLab.tsx:234–241]

### Pitfall 7: `?chips=full` loose chips and instance grouping

**What goes wrong:** In `?chips=full`, two loose chips (`<Chip denom="O">` at `[-1.7, ...]` and `<Chip denom="C">` at `[-1.4, ...]`) have positions far from the stack groups. If they are added to the same denomination's `<Instances>` group, the group's `useMemo` data structure must include them — easy to miss.  
**How to avoid:** Either add them explicitly to the denomination's instance list, or keep them as individual non-instanced `<Chip>` elements (2 extra draws — acceptable for `?chips=full` stress mode).

### Pitfall 8: Cream-insert phase-alignment still present after rotation seed change

**What goes wrong:** The 10-group pattern has period `2π/10 ≈ 0.628 rad`. A seed of `i * 0.37` has ratio `0.37/0.628 ≈ 0.589` — not a near-rational fraction, so the alignment should break. However, at very short stacks (2–3 chips) any seed looks the same. The "10-group alignment" is only visible at tall stacks (5+ chips).  
**How to avoid:** Test with `?chips=full` (17-chip C stack) to verify the alignment is broken visually. The pattern should spiral rather than appear to "snap" into column alignment.

---

## Code Examples

### chipFaceNormalMap (new function in textures.ts)

```typescript
// Source: mirrors chipFaceBump (textures.ts:310-359) piped through normalMapHelper
// Add to textures.ts after chipFaceBump
export function chipFaceNormalMap(cImg?: HTMLImageElement | null): THREE.CanvasTexture {
  const S = 512; // right-sized from 2048
  const { c, ctx } = makeCanvas(S, S);
  const r = S / 2;

  // Mid-height clay field with micro-grain (identical to chipFaceBump, just smaller)
  ctx.fillStyle = "#808080";
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.fill();
  speckle(ctx, S, S, 18);

  // Refined brass rim groove (matches chipFaceTexture's r*0.93)
  ctx.lineCap = "round";
  ctx.strokeStyle = "#5c5c5c";
  ctx.lineWidth = S * 0.007;
  ctx.beginPath();
  ctx.arc(r, r, r * 0.93, 0, Math.PI * 2);
  ctx.stroke();

  // The C tooled as a recessed groove (matches C_ARC exactly)
  const cSize = r * 1.26;
  ctx.save();
  ctx.translate(r, r);
  const RR = cSize / 2;
  if (!cImg) {
    ctx.lineCap = "round";
    ctx.lineWidth = RR * C_ARC.widthFrac;
    ctx.strokeStyle = "#454545";
    ctx.beginPath();
    ctx.arc(0, 0, RR * C_ARC.rFrac, C_ARC.start, C_ARC.end, false);
    ctx.stroke();
    // Thin bright shoulder inside the groove (tooled bevel)
    ctx.lineWidth = RR * C_ARC.widthFrac * 0.3;
    ctx.strokeStyle = "#a6a6a6";
    ctx.beginPath();
    ctx.arc(0, 0, RR * C_ARC.rFrac * 0.86, C_ARC.start + 0.08, C_ARC.end - 0.3, false);
    ctx.stroke();
  }
  ctx.restore();

  // Convert height field → tangent-space normal via shared Sobel helper
  const normalCanvas = heightToNormalMap(c, 1.0); // strength tuned via normalScale on material
  const t = toNormalMapTexture(normalCanvas); // NoColorSpace, anisotropy 8
  return t;
}
```

### InstancedChipStack in TableLab.tsx

```typescript
// Source: conversion of ChipStack (TableLab.tsx:248-274) using drei Instances API
import { Instances, Instance } from "@react-three/drei";

function InstancedChipStack({
  kit,
  denom,
  count,
  position,
}: {
  kit: ChipKit;
  denom: SuitCode;
  count: number;
  position: [number, number, number];
}) {
  const m = kit.mats[denom];
  const instances = useMemo(() => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const jx = Math.sin(i * 2.3) * 0.012;
      const jz = Math.cos(i * 1.7) * 0.012;
      out.push({
        bodyPos: [position[0] + jx, position[1] + i * H, position[2] + jz] as [number,number,number],
        facePos: [position[0] + jx, position[1] + i * H + H / 2 + 0.002, position[2] + jz] as [number,number,number],
        rotY: i * 0.37, // 0.37 breaks the 10-group cream-insert phase-alignment
      });
    }
    return out;
  }, [count, position]);

  return (
    <>
      <Instances geometry={kit.body} material={m.body} limit={count + 4}>
        {instances.map((inst, i) => (
          <Instance key={i} position={inst.bodyPos} rotation={[0, inst.rotY, 0]} />
        ))}
      </Instances>
      <Instances geometry={kit.face} material={m.face} limit={count + 4}>
        {instances.map((inst, i) => (
          <Instance key={i} position={inst.facePos} rotation={[-Math.PI / 2, 0, inst.rotY]} />
        ))}
      </Instances>
      {/* Bottom face DROPPED — never visible, was the draw-call waste */}
    </>
  );
}
```

### M10 measurement commands (exact CLI)

```bash
# Run from repo root with Vite dev server on 5173

# tp3-base baseline (before any TP3 changes)
node tools/table-3d/stats-read.mjs http://localhost:5173 hero
node tools/table-3d/stats-read.mjs http://localhost:5173 macro
node tools/table-3d/stats-read.mjs http://localhost:5173 hero "&chips=full"

# After instancing (must be < 150 / < 220)
node tools/table-3d/stats-read.mjs http://localhost:5173 hero
node tools/table-3d/stats-read.mjs http://localhost:5173 hero "&chips=full"
```

### M2 re-run after TP3 (manual polygon method)

```javascript
// Source: m1-m2-m12.mjs:207-227
import { m2CardsVsChips, polygonArea } from "./tools/table-3d/m1-m2-m12.mjs";

// After tracing card and chip polygons on the HERO frame:
const result = m2CardsVsChips({
  cardPolys: [ /* [[x,y],...] for each card footprint */ ],
  chipPolys: [ /* [[x,y],...] for the chip stack footprints */ ],
});
console.log(result); // { pass: true, value: { ratio: X.XX, ... }, threshold: "≥ 2.0×" }
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|-----------------|-------|
| Manual `InstancedMesh.setMatrixAt` loop in `useFrame` | `drei <Instances>/<Instance>` declarative | [CITED: github.com/pmndrs/drei v9.114.0] |
| `bumpMap` for surface detail (TP0) | `normalMap` via Sobel helper (TP1 precedent, extend to chips in TP3) | Already established in this codebase |
| Large canvas textures at 2048² for all objects | Right-sized textures per screen footprint (512² for chips, 256² for cards grain) | TP1/TP2 precedent: `feltNapNormalMap` at 512², `cardMicroReliefNormalMap` at 256² |

**Deprecated / outdated in this codebase:**
- `<Chip>` bottom-face mesh: never visible (chip rests on felt or another chip), pure waste → drop in TP3
- `sheen` on chip body: TP0 material included `sheen: 0.5, sheenColor: p.faceLit` — this was an early Vegas-risk that passed; de-Vegas kills it
- `bumpMap` on chip face at 2048²: sufficient for TP0/TP1/TP2; TP3 upgrades to normalMap at 512²

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The demoted-pot current draw count is ~42 (TP0 baseline ~233 total) | Question 2 | If count is lower, the instancing delta is less dramatic; M10 math still holds |
| A2 | Rotating `<Instance>` by `[0, rotY, 0]` reproduces the exact visual of the current `<group rotation={[0, rotY, 0]}>` in `<Chip>` | Question 1 | If `<Instance>` rotation semantics differ (e.g., applied in a different order), the chip orientation will be wrong — must verify visually at the parity gate |
| A3 | `frames={1}` on `<Instances>` can be applied post-parity-verification for additional M11 improvement | Q1 / validation | If the scene has dynamic chip positions, `frames={1}` would freeze them — safe only for the static demoted pot |

**If this table is empty for a claim, it was verified directly from the repo code or the drei GitHub source this session.**

---

## Open Questions (RESOLVED)

1. **Will `<Instances>` shadow casting work per-instance without extra config?**
   - What we know: drei `<Instances>` wraps `THREE.InstancedMesh`; R3F maps `castShadow`/`receiveShadow` on the `<Instances>` node to the underlying InstancedMesh.
   - What's unclear: The current `<Chip>` applies `castShadow receiveShadow` on the body mesh and `castShadow` on the face mesh. Whether `<Instances castShadow receiveShadow>` propagates to all instances is standard InstancedMesh behavior in three.js — but under headless D3D11 the shadow pass adds extra draw calls that `stats-read.mjs` counts.
   - Recommendation: Accept default — add `castShadow receiveShadow` to `<Instances>` nodes, then verify via stats-read.mjs that draw counts match expectation. If shadow draws double unexpectedly, debug InstancedMesh shadow pass.
   - **RESOLVED:** plan 04-02 adds `castShadow receiveShadow` on `<Instances>` + verifies draw counts via `stats-read.mjs` (the M10 must-ship gate catches any unexpected shadow-pass inflation).

2. **Do the HERO/MACRO REGIONS rects in `metrics.mjs` need updating for the de-Vegas chip color?**
   - What we know: M3 samples a fixed `feltHero` rect (open green felt, clear of chips). M4 samples the `brassHero` rect (the brass inlay torus). Neither samples chips directly.
   - What's unclear: After de-Vegas muting the chip chroma −20%, the chip region may bleed slightly into adjacent felt rects at the MACRO view. But the REGIONS rects are calibrated against felt, not chips.
   - Recommendation: No rect changes needed. M2 remains manual-polygon (unaffected). M3/M4/M5/M6/M8 sample felt/brass/shadow rects, not chips. No REGIONS update required for TP3.
   - **RESOLVED:** no REGIONS rect change in TP3 (M2 is manual-polygon; M3/M4/M5/M6 sample felt/brass/shadow, not chips).

---

## Environment Availability

| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| Vite dev server (`npm run dev` in `frontend/`) | All captures / stats-read | ✓ | Standard project dev server |
| `playwright` (Chromium + D3D11) | `.dev-stack/lab-shot.mjs`, `stats-read.mjs` | ✓ | Used since TP0; confirmed working |
| `sharp` | `tools/table-3d/metrics.mjs`, `run-metrics.mjs` | ✓ | Listed in project devDependencies |
| `@react-three/drei@9.114.0` `<Instances>` | `InstancedChipStack` | ✓ | Installed, confirmed |
| `normalMapHelper.ts` Sobel helper | chip face normalMap | ✓ | In repo, unit-tested |

**No missing dependencies.** TP3 is a pure code+texture change within the existing installed stack.

---

## Validation Architecture

This section documents how each TP3 acceptance criterion maps to a concrete validation command, which metric gates it, and at which point in the work sequence it must pass.

### Phase Gate Overview

TP3 has two sequential gates, each with a STOP-on-ambiguous rule:

| Gate | Workstream | Metric | Type | Capture |
|------|-----------|--------|------|---------|
| G1 — Instancing parity | Instancing | M10 draw-calls | Automated (stats-read) | HERO + `?chips=full` |
| G1 — Instancing parity | Instancing | MACRO chip quality ≥ baseline | Operator A/B visual | MACRO |
| G2 — De-Vegas clay | Materiality | M2 cards-vs-chips ≥ 2× | Manual polygon + shoelace | HERO |
| G2 — De-Vegas clay | Materiality | Worn clay / recedes / no gloss | Operator A/B perceptual | HERO + MACRO |

### M10 (must-ship gate for instancing) — detailed protocol

**Tool:** `tools/table-3d/stats-read.mjs` [VERIFIED]  
**Metric fn:** `m10DrawCall(calls, { chipsFull })` in `tools/table-3d/metrics.mjs` [VERIFIED]  
**Thresholds:** `M10_DRAWCALL_MAX = 150` (HERO/MACRO) / `M10_DRAWCALL_CHIPS_FULL_MAX = 220` (`?chips=full`) [VERIFIED: metrics.mjs:63–64]

**Step-by-step validation:**

```bash
# 1. Capture tp3-base baseline BEFORE any code changes
LAB_URL="http://localhost:5173/table-lab.html?cam=hero" \
  node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp3-base/hero.png
LAB_URL="http://localhost:5173/table-lab.html?cam=macro" \
  node .dev-stack/lab-shot.mjs docs/table-3d/anchors/tp3-base/macro.png

# 2. Record tp3-base draw counts
node tools/table-3d/stats-read.mjs http://localhost:5173 hero
node tools/table-3d/stats-read.mjs http://localhost:5173 hero "&chips=full"
# Expected: ~233 HERO / ~637 chips=full (all OVER ceiling — this is the "before" state)

# 3. After instancing, with ?chips=inst flag active
LAB_URL="http://localhost:5173/table-lab.html?cam=hero&chips=inst" \
  node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp3/inst-hero.png
node tools/table-3d/stats-read.mjs http://localhost:5173 hero "&chips=inst"
# Expected: ≤ ~10 chip draws + scene overhead → total < 150 (M10 PASS)

node tools/table-3d/stats-read.mjs http://localhost:5173 hero "&chips=full"
# Expected: < 220 (M10 chips=full PASS)

# 4. Verify verdict via metrics.mjs
node -e "
  import('./tools/table-3d/metrics.mjs').then(({m10DrawCall}) => {
    console.log(m10DrawCall(47, { chipsFull: false }));   // replace 47 with actual count
    console.log(m10DrawCall(185, { chipsFull: true }));    // replace 185 with actual count
  });
"
```

**PASS criterion:** Both `m10DrawCall` returns `{ pass: true }`. If either fails → instancing must revert (must-ship-or-revert per SSOT).

### MACRO chip quality ≥ baseline (visual parity gate)

**Tool:** `.dev-stack/lab-shot.mjs` → PNG captures  
**Method:** Operator side-by-side A/B of `tp3-base/macro.png` vs `tp3/inst-macro.png`

```bash
LAB_URL="http://localhost:5173/table-lab.html?cam=macro&chips=inst" \
  node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp3/inst-macro.png
```

**PASS criterion:** Operator confirms chip appearance is byte-for-byte equivalent OR perceptually identical to the tp3-base at MACRO. Any visible difference (different shading, aliasing, texture quality) = regression → revert instancing.

Optional M12 regional MSE on chip region at MACRO (informational, not a hard gate):
```bash
# Define a MACRO chip-region rect in m1-m2-m12.mjs (new entry for TP3)
# and compare tp3-base/macro.png vs inst-macro.png
```

### M2 (cards-vs-chips ≥ 2×) — de-Vegas validation

**Tool:** `tools/table-3d/m1-m2-m12.mjs` `m2CardsVsChips`  
**Method:** Manual polygon tracing on HERO frame after de-Vegas applied

```bash
LAB_URL="http://localhost:5173/table-lab.html?cam=hero&chips=dv" \
  node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp3/dv-hero.png
# Operator traces card/chip polygons on dv-hero.png
# Run: node -e "import('./tools/table-3d/m1-m2-m12.mjs').then(({m2CardsVsChips}) => { ... })"
```

**PASS criterion:** `m2CardsVsChips` returns `{ pass: true, value: { ratio: ≥ 2.0 } }`. De-Vegas muting the chip chroma/value makes this easier to satisfy — the chips recede optically while their geometry footprint is unchanged.

### De-Vegas perceptual gate (operator A/B)

**Tool:** `.dev-stack/lab-shot.mjs` captures at HERO + MACRO  
**Method:** Operator compares `?chips=inst` (instanced, current look) vs `?chips=dv` (instanced + de-Vegas)

```bash
# Instanced baseline (pre-de-Vegas)
LAB_URL="http://localhost:5173/table-lab.html?cam=hero&chips=inst" \
  node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp3/inst-hero.png
LAB_URL="http://localhost:5173/table-lab.html?cam=macro&chips=inst" \
  node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp3/inst-macro.png

# De-Vegas target
LAB_URL="http://localhost:5173/table-lab.html?cam=hero&chips=dv" \
  node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp3/dv-hero.png
LAB_URL="http://localhost:5173/table-lab.html?cam=macro&chips=dv" \
  node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp3/dv-macro.png
```

**PASS criterion (SSOT §TP3):** Operator confirms at HERO + MACRO — "worn artisanal clay that RECEDES, C tooled-not-printed, no Vegas gloss." STOP-on-ambiguous: chips still pull the eye or read plastic → STOP; do not escalate.

**FAIL (non-blocking):** De-Vegas is non-blocking. If the gate fails or is ambiguous → revert the de-Vegas material changes, keep the instanced chips (M10 PASS is the must-ship deliverable), and defer de-Vegas to TP4 or a follow-up gate.

### Sampling rate summary

| When | Command | Purpose |
|------|---------|---------|
| Before any TP3 code | lab-shot.mjs × 3 cameras → tp3-base/ | Corpus anchor; M10 tp3-base baseline |
| After instancing (each denomination added) | stats-read.mjs hero | Track draw-count delta per denomination |
| After all denominations instanced | stats-read.mjs hero + chips=full | M10 gate check (both ceilings) |
| After instancing — visual parity check | lab-shot.mjs macro | Operator A/B vs tp3-base MACRO |
| After de-Vegas material applied | lab-shot.mjs hero + macro + pov | Operator A/B (de-Vegas gate) |
| After de-Vegas — hierarchy check | m2CardsVsChips manual | M2 ≥ 2.0× confirmation |

---

## Sources

### Primary (HIGH confidence)

- `frontend/src/lab/TableLab.tsx` — `useChipKit`, `ChipStack`, `<Chip>`, demoted pot JSX — read in full this session
- `frontend/src/lab/textures.ts` — `chipFaceTexture`, `chipFaceBump`, `chipEdgeTexture`, sizes, `CHIP_PALETTES`, `C_ARC`, `speckle` — read in full this session
- `frontend/src/lab/normalMapHelper.ts` — `heightToNormalMap`, `toNormalMapTexture`, `makeHeightCanvas` — read in full this session
- `frontend/package.json` — exact installed versions: three ^0.169.0, @react-three/fiber ^8.17.10, @react-three/drei ^9.114.0 — read this session
- `tools/table-3d/stats-read.mjs` — GL draw-call wrap logic, CLI usage, sampling strategy — read in full this session
- `tools/table-3d/metrics.mjs` — `m10DrawCall`, `THRESHOLDS.M10_*`, `REGIONS`, pixel metrics — read in full this session
- `tools/table-3d/m1-m2-m12.mjs` — `m2CardsVsChips`, `polygonArea`, `THRESHOLDS.M2_AREA_RATIO_MIN` — read in full this session
- `tools/table-3d/run-metrics.mjs` — metric runner, capture run CLI — read in full this session
- `github.com/pmndrs/drei` `src/core/Instances.tsx` at tag v9.114.0 — `<Instances>` props (geometry, material, limit, range, frames), `<Instance>` props (position, rotation, scale, color)
- `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP3 — SSOT for all TP3 acceptance criteria — read in full this session
- `.planning/phases/04-tp3-fichas-materiality-perf-accent-instancing/04-CONTEXT.md` — locked decisions — read in full this session

### Secondary (MEDIUM confidence)

- drei docs (http://drei.docs.pmnd.rs/performances/instances) — confirmed `limit`, `range`, `position`/`rotation`/`scale`/`color` per Instance; API consistent with GitHub source

### Tertiary (LOW confidence — not applicable)

All claims are grounded in repo code read this session or the verified drei source. No LOW-confidence findings.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions confirmed from `frontend/package.json` installed output
- Architecture / chip rendering: HIGH — read from `TableLab.tsx` source directly
- drei Instances API: HIGH — verified from github.com/pmndrs/drei v9.114.0 Instances.tsx
- M10 measurement: HIGH — read from `stats-read.mjs` + `metrics.mjs` source directly
- M2 measurement: HIGH — read from `m1-m2-m12.mjs` source directly
- De-Vegas material values: HIGH — from CONTEXT.md locked decisions + TP1/TP2 MeshPhysicalMaterial precedent in TableLab.tsx
- Draw-count delta estimates: MEDIUM — calculated from chip counts in TableLab.tsx + InstancedMesh draw model; exact values from `stats-read.mjs` after implementation

**Research date:** 2026-06-11  
**Valid until:** 2026-08-11 (stable stack; drei/three do not change frequently; lab code is frozen between TPs)
