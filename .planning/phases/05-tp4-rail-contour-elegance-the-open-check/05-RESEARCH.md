# Phase 5: TP4 — Rail & Contour Elegance (the OPEN check) - Research

**Researched:** 2026-06-12
**Domain:** Three.js / React Three Fiber — LatheGeometry, MeshPhysicalMaterial, UV remapping, normalMap pipeline, canvas texture procedures
**Confidence:** HIGH (all findings derived from direct codebase inspection; no external packages required)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. VERDICT FIRST. Before any geometry edit, produce a structured side-by-side of the frozen money shots (current contour) vs the recorded slim-rail reference set and record one verdict: "edge elegance lost / acceptable / lost-in-specific-respect."
   - Recorded SLIM references: `elev/00-base-wide`, `04-wood-wide`, `final-wide`.
   - Recorded HEAVY references: `elev/05-leather-wide`, `REFERENCE-wide`, `12-backdrop-wide`.
   - Only if "lost" -> surgically slim `leatherProfile` / `woodCoamingProfile` / refine the outer profile toward edge thinness, without deleting the leather+wood material story or the mass; reversible.
2. Craft details — each ships independently iff it passes on its own (a failing one is dropped, not blocking):
   - Welt/cord at the felt-to-rail seam (hide the hard CG join).
   - normalMaps on wood + leather + brass via the shared helper (`heightToNormalMap` -> `toNormalMapTexture`, NoColorSpace, the felt/card/chip precedent — never `srgb()`).
   - Per-arc-length / tri-planar UV so grain stops stretching at the oval long-ends.
   - Brass -> aged-brass within the single locked M4 HSV target (roughness 0.38-0.45, lower env) — M4 brass PASS (no drift to gold; casino-drift vector).
   - Restrained edge-wear where arms rest.
   - The rail outer wall reads as a curved volume (top-highlight -> underside-shadow), not a flat black band.
3. Metrics / gates: edge-thickness ratio (rail band height / felt radius) measured before/after; M4 brass PASS; no perf regression (M10 holds vs current). Material reads judged at HERO + a rail/eye view.
4. Operator perceptual gate (last plan, `autonomous: false`) at HERO + a rail/eye view: "recovered edge elegance WITHOUT losing material/mass?" Stop-on-ambiguous -> DEFAULT STOP + KEEP current contour; ship only the passed craft upgrades.

### Claude's Discretion
- The exact A/B flag mechanism — mirror the established `?chips=` / `?card=` pattern with a `?rail=` (or similar) flag so current-vs-refined contour + each craft lever is apples-to-apples comparable; document the flag map in the SUMMARY.
- Plan/wave decomposition (verdict plan first; craft levers grouped or split; the surgical edge-slim only if verdict=lost; operator gate last). One perceptual variable per gate where it aids the read, per the TP2/TP3 precedent.
- The precise normalMap strengths / welt geometry / UV method — tuned at the capture step, kept restrained (anti-fussy-welt, anti-noisy-wood-normals-under-clearcoat risks).
- Whether the verdict comes out "lost" / "acceptable" / "lost-in-specific-respect" is an evidence-driven finding, not pre-decided — record it honestly; "acceptable/keep" is a valid outcome that still ships the independent craft upgrades.

### Deferred Ideas (OUT OF SCOPE)
- Adding furniture mass — forbidden in TP4.
- "Table floats" grounding -> TP5 (warm-key gradient + PCSS soft shadows + baked ContactShadows).
- Screen-space / crevice AO -> TP6.
- Brass also gets a final lighting pass in TP5.
</user_constraints>

---

## Summary

TP4 adjudicates the rail/contour elegance question and delivers a set of independent craft upgrades. The phase opens with a VERDICT PLAN — a structured comparison of the current frozen contour (post-TP3 HEAD) against the recorded reference anchor sets — before any geometry or material change is made. The verdict determines whether surgical slimming is warranted; if not, the phase ships only the craft details that pass independently.

The six craft levers (welt, wood normalMap, leather normalMap, brass normalMap + aged-brass tune, per-arc-length UV, volume outer wall) are each scoped to a surgical change in `frontend/src/lab/textures.ts` or `TableLab.tsx`. All use the existing `heightToNormalMap` / `toNormalMapTexture` pipeline already in `normalMapHelper.ts`. No new libraries are required.

The critical discovery on reference anchors: the `elev/` subdirectory named in the SSOT does NOT exist on disk. The `docs/table-3d/anchors/` directory contains only `head/`, `tp2-base/`, `tp3-base/`, `controls/`, and a root `.gitkeep`. The named slim/heavy sets (`00-base-wide`, `04-wood-wide`, `final-wide`, `05-leather-wide`, `REFERENCE-wide`, `12-backdrop-wide`) are absent. The verdict comparison must therefore use the available committed baseline sets (`docs/table-3d/anchors/head/` = post-TP3 HEAD, `docs/table-3d/anchors/tp3-base/` = post-TP2) alongside a fresh HERO + `?cam=rail` capture at the current HEAD. This is the honest basis; the plan must record this provenance explicitly.

**Primary recommendation:** Capture the TP4 pre-change baseline (HERO + rail/eye view at HEAD), compare against the committed anchor corpus to issue the verdict, then execute craft levers behind `?rail=` flag, each tested independently before the operator gate.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Verdict comparison (reference images) | docs corpus (`docs/table-3d/anchors/`) | gitignored scratch (`.dev-stack/diag/`) | Committed anchors are the permanent record; scratch holds full-res ephemeral captures |
| Rail geometry (leatherProfile, woodCoamingProfile, bodyProfile) | `frontend/src/lab/TableLab.tsx` (~L107–173) | — | All three profiles are defined and revolved in this single file |
| Welt geometry | `frontend/src/lab/TableLab.tsx` (new TorusGeometry near brass reveal) | — | Same geometry-in-JSX pattern as the existing brass torus (L595-598) |
| Wood / leather / brass textures | `frontend/src/lab/textures.ts` (woodTexture, leatherTexture, leatherBump) | — | All texture factories live here; new normalMap functions follow the chipFaceNormalMap pattern |
| NormalMap pipeline | `frontend/src/lab/normalMapHelper.ts` (heightToNormalMap, toNormalMapTexture) | `frontend/src/lab/textures.ts` (consumer) | Helper is already the shared Sobel pipeline; no new code needed in the helper itself |
| UV remapping for lathe/oval | `frontend/src/lab/textures.ts` (texture repeat), `TableLab.tsx` (material wiring) | — | The repeat + wrapS/wrapT approach used today; per-arc UV requires a post-process on the LatheGeometry buffer or a tri-planar shader |
| Brass material values | `frontend/src/lab/TableLab.tsx` (~L563-567, brassMat) | `tools/table-3d/metrics.mjs` (M4 threshold) | brassMat is MeshStandardMaterial with concrete values; M4 gate is in the metric kit |
| Metric gate execution | `tools/table-3d/run-metrics.mjs` | `tools/table-3d/metrics.mjs` | Same admittance flow as prior phases |
| Capture harness | `.dev-stack/lab-shot.mjs` | — | Playwright D3D11 GPU harness; existing cams include `?cam=rail` |

---

## Standard Stack

All existing — no new installs needed.

### Core (all already present)
| Library | Version (package.json) | Purpose | Why Standard |
|---------|----------------------|---------|--------------|
| `three` | `^0.169` | LatheGeometry, MeshPhysicalMaterial, MeshStandardMaterial, TorusGeometry, BufferGeometry attribute mutation | The scene renderer; all rail/material work lives here |
| `@react-three/fiber` | `^8.17` | JSX primitives (`<mesh>`, `<latheGeometry>`, `<torusGeometry>`) | Already the R3F canvas layer |
| `@react-three/drei` | `^9.114` | `Environment`, `ContactShadows` (frozen); no new drei primitives needed for TP4 | Existing scene infrastructure |
| Canvas 2D API (browser built-in) | — | Height-field drawing for normalMap generation; all texture factories use it | Already used by all texture functions |
| `sharp` (Node) | present | Metric pixel math (M4 brass HSV, M10 draw-call) | The metric kit tool |
| Playwright | present | GPU-faithful capture harness `.dev-stack/lab-shot.mjs` | RTX 4060 D3D11 captures |

**No new packages. No `npm install` step. Package legitimacy audit: N/A.**

---

## Package Legitimacy Audit

No new packages are introduced in TP4. All required functionality exists in the installed dependencies.

---

## Reference Anchor Disk Audit

This is a critical finding. The SSOT references two named sets:

**SLIM set** (named in SSOT §TP4): `elev/00-base-wide`, `04-wood-wide`, `final-wide`
**HEAVY set** (named in SSOT §TP4): `elev/05-leather-wide`, `REFERENCE-wide`, `12-backdrop-wide`

**Disk reality (verified by Glob on `docs/table-3d/anchors/`):**

| Anchor Directory | Files Present | Status |
|-----------------|---------------|--------|
| `docs/table-3d/anchors/head/` | `hero.png`, `card.png`, `macro.png` | PRESENT — post-TP3 HEAD captures |
| `docs/table-3d/anchors/tp3-base/` | `hero.png`, `macro.png`, `pov.png` | PRESENT — post-TP2 scene (TP3 baseline) |
| `docs/table-3d/anchors/tp2-base/` | `hero.png`, `card.png`, `macro.png` | PRESENT — post-encuadre (TP2 baseline) |
| `docs/table-3d/anchors/controls/` | metric control frames (PNG + source fixtures) | PRESENT |
| `docs/table-3d/anchors/elev/` | — | **ABSENT** — the `elev/` subdirectory does not exist on disk |

**Conclusion:** None of the six named SLIM/HEAVY reference frames (`00-base-wide`, `04-wood-wide`, `final-wide`, `05-leather-wide`, `REFERENCE-wide`, `12-backdrop-wide`) exist in `docs/table-3d/anchors/`. The `elev/` directory itself is absent.

**Honest verdict basis for the plan:**
The verdict plan must use what IS available:
1. `docs/table-3d/anchors/head/{hero,macro}.png` — the current HEAD state (post-TP3, the contour being adjudicated)
2. `docs/table-3d/anchors/tp3-base/{hero,macro}.png` — the post-TP2 state (the scene that preceded TP3's chips; rail geometry unchanged since then)
3. A fresh capture at `?cam=rail` and `?cam=hero` at HEAD — the primary verdicting evidence
4. The operator's on-device memory of the slim-rail reference (the operator flagged the lost elegance; they hold the reference in their head)

The plan must record this provenance explicitly: "SSOT-named slim/heavy anchors not on disk; verdict issued against HEAD commits and operator recollection of the slim-rail baseline." This is a non-blocking gap — the verdicting is still possible via the available captures; it just requires noting the absence.

[ASSUMED]: Whether the named anchors were committed to a different branch (e.g., the old `table-3d-premium-reference-2026-06-04` tag checkout) and never ported to `docs/table-3d/anchors/`. The protected-reference tag `table-3d-premium-reference-2026-06-04` lives at SHA `d17df37a588dd12a9ae299caa70704cd2628d6f4` (pre-M1 cards, chip-centric) — a worktree checkout of this tag could recover those images, but this would require a separate worktree, which is feasible but adds a plan step.

---

## Architecture Patterns

### System Architecture Diagram

```
Operator verdict question
        |
        v
[05-01 VERDICT PLAN] ─── capture HEAD HERO + ?cam=rail ─────────────────────┐
        |                    compare vs head/ + tp3-base/ anchors              |
        v                    record: lost / acceptable / lost-in-specific      |
    verdict                                                                    |
   /        \                                                                  |
"lost"    "acceptable"                                                         |
   |           |                                                               |
   v           v                                                               |
[05-02] surgical slim  [skip slim]                                             |
  (leatherProfile /                                                            |
   woodCoamingProfile     ┌──────────────────────────────────────────────────┘
   tuning, reversible)    │
        |                 │
        └──────────────────┘
               |
               v
[05-03] CRAFT LEVERS (each independent behind ?rail= flag)
   ├── Lever A: welt/cord at felt-to-rail seam
   ├── Lever B: wood normalMap (woodNapNormalMap → woodMat.normalMap)
   ├── Lever C: leather normalMap (leatherNapNormalMap → leatherMat.normalMap; upgrade bumpMap)
   ├── Lever D: brass aged-brass tune (color + roughness toward M4 target; lower envMapIntensity)
   ├── Lever E: per-arc-length UV (geometry attribute post-process or texture repeat remap)
   └── Lever F: outer wall volume (normalMap directionality on woodMat outer face)
               |
      [each lever captured independently]
      [each lever: PASS → ship / FAIL → drop, non-blocking]
               |
               v
[05-04] OPERATOR GATE (autonomous: false)
   HERO + ?cam=rail — "recovered elegance WITHOUT losing material/mass?"
   Stop-on-ambiguous → DEFAULT STOP + KEEP current contour + ship only passed crafts
               |
               v
    SUMMARY + scorecard delta
```

### Recommended Project Structure (no new files, only additions within existing files)

```
frontend/src/lab/
├── textures.ts          # ADD: woodNapNormalMap(), leatherNapNormalMap(), brassNormalMap()
├── TableLab.tsx         # ADD: welt mesh, normalMap wiring, ?rail= flag, brass tune, UV remap
└── normalMapHelper.ts   # READ-ONLY — shared Sobel pipeline; no changes needed

tools/table-3d/
└── grep-check-tp4-05.cjs   # NEW: invariant checker for TP4 craft levers

docs/table-3d/
├── anchors/tp4-base/    # NEW directory: hero.png + rail.png committed at TP4 start
└── TP4_OPERATOR_GATE.md # NEW: verdict record + operator gate result
```

---

## Craft Lever Implementation Recipes

### Lever A: Welt/Cord at the Felt-to-Rail Seam

**What:** A thin torus revolved at the felt-leather junction (y ≈ 0, r = `FELT_R * 0.960`) that hides the hard CG seam between the green felt plane and the leather profile's inner foot. The existing brass reveal torus sits at `FELT_R * 0.957` (radius 0.02 tube); the welt sits just inside it, at the felt edge.

**Geometry anchor in code:**
```typescript
// existing brass reveal (TableLab.tsx ~L595):
<torusGeometry args={[FELT_R * 0.957, 0.02, 16, 180]} />

// PROPOSED welt (add just before the leather mesh):
<torusGeometry args={[FELT_R * 0.960, 0.012, 12, 180]} />
// tube radius 0.012 = ~half the brass tube; 12 radial segments = clean without heavy draw
```

**Material:** A simple MeshPhysicalMaterial in a dark cognac / near-black tone — the welt is a shadow detail, not a design element:
```typescript
const weltMat = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#2a1208"), // near-black cognac — reads as a tight crease, not a stripe
  roughness: 0.88,
  metalness: 0,
  clearcoat: 0.05,
  clearcoatRoughness: 0.9,
});
```

**Anti-fussy-welt rule:** The tube radius 0.012 is one-third of the leather inner foot width (~0.037). If it reads as a decorative stripe rather than a shadow crease at MACRO, reduce to 0.008 or drop the lever entirely (non-blocking).

**Draw-call impact:** +1 draw call (one additional mesh). M10 currently 105 HERO; 106 still passes < 150.

**REVERSIBILITY:** The welt is an additive mesh. Removing it requires deleting the JSX element — one commit, one revert.

---

### Lever B: Wood NormalMap

**What:** A procedural height field for the wood coaming surface — fine parallel grain ridges matching the `woodTexture()` grain direction (horizontal = wraps around the rail). Passed through the shared Sobel helper to produce a tangent-space normal map.

**Height field recipe (add to `textures.ts`):**
```typescript
export function woodNapNormalMap(): THREE.CanvasTexture {
  const S = 512;
  const { c, ctx } = makeCanvas(S, S);

  // Fine horizontal grain ridges — frequency tuned to match the ~240 stripes in woodTexture()
  // at a scale that tiles cleanly at repeat=(13,1) on the lathe surface.
  // freq=12 → ~12 ridge pairs per tile; restrained to avoid "corduroy" at MACRO.
  const imgData = ctx.createImageData(S, S);
  const d = imgData.data;
  const freq = 12; // keep LOW — anti-noisy-normals-under-clearcoat risk
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      // Primary: horizontal grain running around the rail (Y axis in texture space)
      const gy = (Math.sin((py / S) * Math.PI * freq * 2) * 0.5 + 0.5);
      // Very faint cross-grain (wood pores, not figure)
      const gx = (Math.sin((px / S) * Math.PI * freq * 0.25) * 0.5 + 0.5) * 0.12;
      const h = (gy * 0.88 + gx) * 255;
      const i = (py * S + px) * 4;
      d[i] = d[i + 1] = d[i + 2] = Math.min(255, h);
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const normalCanvas = heightToNormalMap(c, 1.0); // strength kept neutral; normalScale tunes depth
  const t = toNormalMapTexture(normalCanvas);      // NoColorSpace — CRITICAL
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(13, 1);  // match woodTexture().repeat
  return t;
}
```

**Wiring in TableLab.tsx (`woodMat` construction):**
```typescript
const woodMat = new THREE.MeshPhysicalMaterial({
  map: wood,
  color: new THREE.Color("#ffffff"),
  roughness: 0.38,
  metalness: 0,
  clearcoat: 0.72,
  clearcoatRoughness: 0.2,
  envMapIntensity: 0.65,
  normalMap: woodNapNormalMap(),       // ADD
  normalScale: new THREE.Vector2(0.15, 0.15), // ADD — restrained; clearcoat 0.72 can amplify
  side: THREE.DoubleSide,
});
```

**Anti-noisy-normals-under-clearcoat risk:** With `clearcoat: 0.72` the specular highlight on the wood coaming is already strong. A normalScale above 0.25 will create a busy shimmering read under the warm key. Start at 0.15; cap hard at 0.22. If MACRO still reads noisy, drop to 0.08. Non-blocking.

---

### Lever C: Leather NormalMap (upgrade from bumpMap)

**Current state in `TableLab.tsx` (~L547-560):**
```typescript
const leatherMat = new THREE.MeshPhysicalMaterial({
  map: leatherTexture(),
  bumpMap: leatherBump(),   // <-- existing: bumpMap
  bumpScale: 0.016,
  ...
});
```

**`leatherBump()` in `textures.ts`** already provides a pebbled height field (2048×512, 2600 pebble blobs, speckle, stitch seam groove). The upgrade is: pipe the same height field through `heightToNormalMap` instead of feeding it raw as a bumpMap.

**Add to `textures.ts`:**
```typescript
export function leatherNapNormalMap(): THREE.CanvasTexture {
  // Identical height-field drawing to leatherBump() — same canvas, same pebble blobs,
  // same seam, same speckle. Then convert via the shared Sobel helper.
  // Sharing the height field data: call the same drawing code, then pipe to normal converter.
  const W = 2048;
  const H = 512;
  const { c, ctx } = makeCanvas(W, H);
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    const x = (Math.sin(i * 12.9367) * 0.5 + 0.5) * W;
    const y = (Math.sin(i * 78.233) * 0.5 + 0.5) * H;
    const rr = 2 + (Math.sin(i * 3.31) * 0.5 + 0.5) * 6;
    ctx.fillStyle = Math.sin(i * 2.11) > 0 ? "rgba(176,176,176,0.08)" : "rgba(58,58,58,0.08)";
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  speckle(ctx, W, H, 16);
  drawStitchSeam(ctx, W, H * 0.3, "#cfcfcf", "#4a4a4a"); // seam stays — it is the waxed-thread

  const normalCanvas = heightToNormalMap(c, 1.0);
  const t = toNormalMapTexture(normalCanvas); // NoColorSpace — MANDATORY
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
```

**NOTE:** `drawStitchSeam` and `speckle` are private functions in `textures.ts`. The new function should live in the same file so it has access. No export of private helpers needed.

**Wiring in TableLab.tsx:**
```typescript
const leatherMat = new THREE.MeshPhysicalMaterial({
  map: leatherTexture(),
  normalMap: leatherNapNormalMap(),      // REPLACE bumpMap + bumpScale
  normalScale: new THREE.Vector2(0.22, 0.22), // comparable effect to bumpScale 0.016 on a 512H texture
  color: new THREE.Color("#ffffff"),
  roughness: 0.64,
  metalness: 0,
  sheen: 0.4,
  sheenColor: new THREE.Color("#b08a64"),
  sheenRoughness: 0.6,
  clearcoat: 0.08,
  clearcoatRoughness: 0.7,
  side: THREE.DoubleSide,
});
```

**Why upgrade bumpMap → normalMap:** The chip precedent (TP3) proved that bumpMap→normalMap via the shared Sobel helper reads as a "tooled-not-printed" material at MACRO. The leather pebble grain will also benefit. Additionally, with the `clearcoat: 0.08` on leather (lower than the chip's 0.32), noisy-normals risk is minimal. normalScale 0.22 is safe.

---

### Lever D: Brass Aged-Brass Tune (M4 PASS locked)

**Current brass material (TableLab.tsx ~L563-567):**
```typescript
const brassMat = new THREE.MeshStandardMaterial({
  color: new THREE.Color("#b8915a"),
  metalness: 1,
  roughness: 0.34,
});
```

**Current measured M4 values (from METRICS_ADMISSION.md, `brassHero` rect):**
- H ≈ 39.4°, S ≈ 0.38, V ≈ 0.69 → PASS (well within H 35-48°, S ≤ 0.55, V ≤ 0.80)

**M4 target (SSOT §4.5, locked):**
- H: 35–48° (hue stays warm amber, not court-card gold yellow)
- S: ≤ 0.55 (not oversaturated)
- V: ≤ 0.80 (not too bright/showroom)
- roughness: 0.38–0.45 (SSOT §TP4: "aged-brass within the single locked M4 HSV target, roughness 0.38-0.45")

**Delta to apply:**
```typescript
// CURRENT:  roughness: 0.34  (slightly too shiny for aged brass; SSOT target 0.38-0.45)
// PROPOSED: roughness: 0.42  (middle of the SSOT range; aged-not-showroom)

// CURRENT:  color: "#b8915a"  (H≈39°, S≈0.38, V≈0.69 — already in M4 range)
// The color itself is fine. The roughness is the single change needed.

// CURRENT:  MeshStandardMaterial (no env control)
// PROPOSED: keep MeshStandardMaterial but add envMapIntensity: 0.45 (was implicit 1.0)
// Lower env: prevents the brass from reading as too shiny under the Environment lightformers.
```

**Proposed brass material:**
```typescript
const brassMat = new THREE.MeshStandardMaterial({
  color: new THREE.Color("#b8915a"), // unchanged — already M4-compliant HSV
  metalness: 1,
  roughness: 0.42,                  // CHANGED: 0.34 → 0.42 (aged-brass, SSOT 0.38-0.45)
  envMapIntensity: 0.45,            // ADD: lower env so brass doesn't read as new/shiny
});
```

**M4 PASS assertion method:**
```bash
# Run the M4 metric on the post-change HERO capture
node tools/table-3d/run-metrics.mjs --frame .dev-stack/diag/table-3d/tp4/craft/hero-brass-tune.png --metrics M4
# Expected: H≈39.4° S≈0.38 V≈0.67 → PASS (roughness change slightly lowers V, keeps HSV in range)
```

**Casino-drift guard:** Raising roughness REDUCES specular highlight brightness (V slightly lower) — safer direction. The risk of gold-drift is in the OPPOSITE direction (lowering roughness / raising V). M4 PASS should remain solid.

**A/B flag:** `?rail=brass` shows the aged-brass tune; default keeps current brass for comparison.

**Brassmap Normalmap (optional sub-lever):** The SSOT mentions "hairline scratches in normal map" for the brass AAA(5) rubric. For TP4 this is explicitly optional — the roughness tune alone is the primary change. If time permits, a simple horizontal-scratch height field can be added:
```typescript
export function brassNormalMap(): THREE.CanvasTexture {
  const S = 256;
  const { c, ctx } = makeCanvas(S, S);
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, S, S);
  // very fine horizontal hairlines (the machined-then-aged-brass look)
  for (let i = 0; i < 180; i++) {
    const y = Math.floor((Math.sin(i * 7.3) * 0.5 + 0.5) * S);
    const a = 0.03 + (Math.sin(i * 2.1) * 0.5 + 0.5) * 0.05;
    ctx.strokeStyle = Math.sin(i * 1.4) > 0 ? `rgba(200,200,200,${a})` : `rgba(60,60,60,${a})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(S, y + Math.sin(i * 0.7) * 2);
    ctx.stroke();
  }
  speckle(ctx, S, S, 8);
  const normalCanvas = heightToNormalMap(c, 0.6); // LOWER strength — brass has heavy clearcoat analogue
  const t = toNormalMapTexture(normalCanvas);       // NoColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(12, 1); // matches the torus circumference roughly
  return t;
}
```

This is a bonus lever (Lever D-sub). If it reads over-textured at MACRO, drop it without affecting the roughness change.

---

### Lever E: Per-Arc-Length UV for the Lathe Rail Profiles

**The problem:** The LatheGeometry for both the leather and wood coaming profiles is revolved from a 2D cross-section and then scaled into an oval by the `<group scale={[OVAL_X, 1, 1]}>` parent (`OVAL_X = 1.22`). The lathe UV u-coordinate is proportional to the angle parameter (0..2π), which distributes UV tiles equally in angle — so the oval's X-stretched long ends have the same angular span as the Y ends, but a larger arc length. This means the wood grain texture tiles are WIDER at the long ends, producing the "grain stretch" the SSOT flags.

**Two approaches:**

**Approach A — Texture repeat / wrapS correction (simple, works for many cases):**
The rail's wood grain runs horizontal (around the circumference). The stretch is in U (circumferential). Increasing `wood.repeat.x` reduces the tile size but makes the grain denser everywhere, not just at the long ends. This does NOT fix the per-arc stretch — it just makes the pattern finer.

**Approach B — Buffer attribute post-process (surgical UV remap, recommended):**
After the LatheGeometry is constructed, iterate its `uv` attribute and remap each U value to equal arc-length parameterization. Since the final oval is an ellipse with `a = FELT_R * 1.17 * OVAL_X` and `b = FELT_R * 1.17`, the arc-length-to-angle mapping can be computed numerically:

```typescript
// Utility: remap LatheGeometry UVs to per-arc-length parameterization for the oval
// Call ONCE after new THREE.LatheGeometry(points, segments)
function remapLatheUVsToArcLength(
  geo: THREE.BufferGeometry,
  radiusAtSegment: (seg: number, totalSeg: number) => number, // outer radius at each angle
  ovalX: number, // the X stretch factor (OVAL_X = 1.22)
): void {
  const totalSeg = /* number of lathe segments */ 220;
  // Step 1: compute arc lengths at each segment boundary
  const arcLengths: number[] = [0];
  for (let i = 1; i <= totalSeg; i++) {
    const a0 = ((i - 1) / totalSeg) * Math.PI * 2;
    const a1 = (i / totalSeg) * Math.PI * 2;
    // approximate: one segment arc on the oval (dx,dz) after the OVAL_X stretch
    const r = radiusAtSegment(i, totalSeg);
    const dx = r * ovalX * (Math.cos(a1) - Math.cos(a0));
    const dz = r * (Math.sin(a1) - Math.sin(a0));
    arcLengths.push(arcLengths[i - 1] + Math.sqrt(dx * dx + dz * dz));
  }
  const totalArc = arcLengths[totalSeg];

  // Step 2: remap UV.x (the u-coordinate) in the geometry buffer
  const uvAttr = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uvAttr.count; i++) {
    const u = uvAttr.getX(i);
    // u ∈ [0,1] → find which segment this falls in, look up arc-length fraction
    const seg = Math.round(u * totalSeg);
    const newU = arcLengths[Math.min(seg, totalSeg)] / totalArc;
    uvAttr.setX(i, newU);
  }
  uvAttr.needsUpdate = true;
}
```

**Practical concern:** The LatheGeometry is constructed inside `useMemo` in the `Table` component. The UV remap can be applied immediately after construction before returning from `useMemo`.

**Simpler first-pass (acceptable for TP4, avoids custom buffer manipulation):** Use a tri-planar-style UV approach on the wood material via Three.js shader injection (onBeforeCompile). This is heavier to implement and harder to debug. The buffer-attribute post-process is simpler and more predictable.

**CONTEXT recommendation (Claude's discretion):** The planner should scope Lever E as a "best effort" pass:
- If the buffer UV remap is clean in implementation, include it.
- If it introduces hard-to-diagnose UV seam artifacts, scope it OUT for TP4 (flag for TP7 or a dedicated geometry pass).
- The grain stretch is most visible at the oval MACRO framing. If the verdict is "acceptable" on the current stretch read, Lever E can be dropped entirely (non-blocking).

---

### Lever F: Rail Outer Wall as Curved Volume (top-highlight / underside-shadow)

**The problem:** The wood coaming profile's outer face (`rOut = FELT_R * 1.17`, y from -0.12 to 0.34) is a revolved surface — it has correct normals pointing outward from the lathe axis. The issue is not geometry but MATERIAL: with `envMapIntensity: 0.65` and `clearcoat: 0.72`, the outer wall catches the Environment lightformers almost uniformly, making it read as a flat band rather than a curved volume.

**Fix — normalMap directional bias on the outer wall:** Add a height field to the wood normalMap (Lever B above) that includes a vertical gradient — brighter at the top of the band (y close to yTop = 0.34), darker at the bottom (y close to yBot = -0.12). This biases the normals toward the top-highlight / underside-shadow read WITHOUT changing the geometry.

In the height field for `woodNapNormalMap()`:
```typescript
// Add a vertical cross-profile gradient to the height field:
// At y=0 (top of wood band in UV space) → slight upward normal bias (top reads lighter)
// At y=1 (bottom of wood band) → slight downward bias (underside reads darker)
// This is a subtle addition to the grain ridges:
const crossProfile = Math.sin((py / S) * Math.PI) * 0.18; // peak at center of band
const h = (gy * 0.82 + gx + crossProfile) * 255;
```

The cross-profile gradient is the "volume read" lever — the curved section's top catches more light, the underside falls to shadow. Combined with the environment `envMapIntensity: 0.65` already present, this should be sufficient.

**Alternative (if normalMap alone isn't enough):** Slightly lower `envMapIntensity` on the wood from 0.65 to 0.45 — this reduces the "uniform bath" and lets the directional spotLight + rim do more of the shaping. This is a one-line change and a safe first attempt before baking normals.

---

### ?rail= Flag Design

Mirror the `?chips=` / `?card=` A/B pattern:

| Flag | Renders | Purpose |
|------|---------|---------|
| (default) | Current contour (no changes) | The baseline for the verdict + the gate comparison |
| `?rail=craft` | All passing craft levers active | The full TP4 craft stack for the operator gate |
| `?rail=welt` | Welt only | Isolate Lever A |
| `?rail=normals` | Wood + leather normalMaps only | Isolate Levers B + C |
| `?rail=brass` | Brass aged-brass tune only | Isolate Lever D; M4 gate capture |
| `?rail=slim` | Surgical edge-slim (only if verdict=lost) | Isolate the contour change from material changes |

The `?rail=` flag is read via the existing `qp()` helper:
```typescript
const railFlag = qp("rail");
```

Conditional logic in the `Table` component's `useMemo`:
```typescript
const isWelt   = railFlag === "welt"   || railFlag === "craft";
const isNormals = railFlag === "normals" || railFlag === "craft";
const isBrass  = railFlag === "brass"  || railFlag === "craft";
const isSlim   = railFlag === "slim"; // only if verdict=lost
```

Each lever active only when the matching flag is set. Default (`railFlag === null`) renders the unchanged baseline.

---

## Verdict-First Method — Structured Side-by-Side

### How to produce the verdict

**Step 1 — Capture at HEAD (zero changes):**
```bash
# Start the dev server: cd frontend && npm run dev
LAB_URL="http://localhost:5173/table-lab.html?cam=hero" node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp4/verdict/hero-current.png
LAB_URL="http://localhost:5173/table-lab.html?cam=rail" node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp4/verdict/rail-current.png
```

**Step 2 — Compare against committed corpus:**
- `docs/table-3d/anchors/head/hero.png` — the current state (same as Step 1 if HEAD is clean)
- `docs/table-3d/anchors/tp3-base/hero.png` — post-TP2 state (same rail geometry; chips differ)
- The operator's recollection of the slim-rail baseline (the SSOT-named `elev/` frames are absent from disk)

**Step 3 — Compute the edge-thickness ratio (before only; after requires slim):**
```
FELT_R = 6.5
leatherProfile rOut = FELT_R * 1.072 = 6.968  (outer leather edge)
woodCoamingProfile rOut = FELT_R * 1.17 = 7.605 (outer wood edge)
bodyProfile waist = FELT_R * 1.085 = 7.052

Rail band height = leatherProfile peak y ≈ 0.565 (from the profile points at p(0.49, 0.565))
Rail total radial width = woodCoamingProfile rOut - leatherProfile rIn
                        = 7.605 - (FELT_R * 0.962) = 7.605 - 6.253 = 1.352

Edge-thickness ratio = rail band height / felt radius = 0.565 / 6.5 ≈ 0.087
```

This ratio (0.087 = 8.7% of FELT_R) is the "before" value. If the verdict is "lost" and slimming is applied, the ratio after must be measured and recorded.

**Step 4 — Issue the verdict:**

| Verdict | Meaning | Action |
|---------|---------|--------|
| "acceptable" | The current contour reads as a refined poker-table edge despite the added mass | Skip Lever slim; proceed to craft levers only |
| "lost" | The edge clearly reads as thick/heavy vs the slim-rail read in operator memory | Apply surgical slim (Lever E-slim) before craft levers |
| "lost-in-specific-respect" | e.g., the coaming reads heavy but the leather roll is fine | Apply targeted slim only to the specific profile |

The verdict is recorded verbatim in the 05-01-SUMMARY.md as the phase record.

---

## Surgical Slim Recipe (Only If Verdict = "lost")

**Where to slim — the reversible approach:**

The SSOT prohibits auto-reverting to the slim rail or deleting the material story. A surgical slim means:
- Reducing `woodCoamingProfile()` `rOut` from `FELT_R * 1.17` toward `FELT_R * 1.14` (matching `bodyProfile` fascia top)
- Reducing `woodCoamingProfile()` `yTop` from `0.34` toward `0.26` (lower profile = slim band)
- OR reducing `leatherProfile()` `rOut` from `FELT_R * 1.072` toward `FELT_R * 1.058` (narrower leather roll)

**One tuning variable at a time (stop-on-ambiguous protocol):**

```typescript
// In woodCoamingProfile(), tunable constants:
const rOut = FELT_R * 1.17;  // current — slim to FELT_R * 1.14 if verdict=lost
const yTop = 0.34;           // current — slim to 0.28 if profile reads thick

// In leatherProfile(), tunable constant:
const rOut = FELT_R * 1.072; // current — slim to FELT_R * 1.060 if roll too proud
```

**Minimum viable:** change ONE of the above, capture HERO + rail, check. Never slim both in the same iteration. Keep `?rail=slim` isolated from the craft levers.

**Thin-disc risk:** If `woodCoamingProfile rOut` approaches `bodyProfile fascia ≈ FELT_R * 1.14` AND `leatherProfile rOut` is also reduced, the rail loses its proportional overhang and can start reading as a thin disc. The invariant: `woodCoamingProfile rOut` must always be > `bodyProfile fascia` by at least 2% of FELT_R (≥ 0.13 world units).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Height-field to normal map | Custom Sobel + colorspace logic | `heightToNormalMap` + `toNormalMapTexture` in `normalMapHelper.ts` | Already battle-tested through TP1 (felt), TP2 (card), TP3 (chip C); NoColorSpace enforced by the helper |
| Per-metric gate runner | Ad-hoc pixel sampling | `tools/table-3d/run-metrics.mjs` + `metrics.mjs` | M4 HSV gate already implemented and admitted; just pass the capture path |
| Capture harness | Browser screenshot, WebGL readback | `.dev-stack/lab-shot.mjs` | GPU-faithful D3D11; DPR2; `spin=off` auto-applied; proven across TP1-TP3 |
| A/B flag state management | React context / Zustand | `qp()` query-param reader already in TableLab.tsx | The established pattern across `?chips=`, `?card=`, `?felt=`, `?cam=` |
| Grain stretch correction (complex) | Custom GLSL shader | LatheGeometry UV buffer attribute remap (plain JS, post-geometry) | No shader compilation; no onBeforeCompile complexity; same geometry object just with corrected UVs |

**Key insight:** TP4 is a craft-detail phase. Every hard technical problem it faces has already been solved in TP1-TP3; TP4 applies those solutions to new surfaces (rail materials instead of felt/card/chip).

---

## Common Pitfalls

### Pitfall 1: Normal Map Colorspace Error (the critical one)
**What goes wrong:** A normalMap created with `srgb()` instead of `toNormalMapTexture()` will be gamma-decoded by Three.js as if it were an sRGB color image. The RGB values that encode XYZ normal components will be gamma-expanded, producing wrong normals — typically resulting in a flat-normal read (no bump effect visible) or inverted normals (surface looks concave instead of convex).
**Why it happens:** The `textures.ts` file exports both `srgb()` (for color textures) and `gray()` (for linear grayscale) and `toNormalMapTexture()` (for normals). A copy-paste from a color texture factory will use `srgb()`.
**How to avoid:** Every texture factory that feeds a `normalMap` MUST call `toNormalMapTexture()`. Never call `srgb()` on a normalMap canvas. The `chipFaceNormalMap()` function is the canonical template — mirror its final 2 lines verbatim.
**Warning signs:** The MACRO rail surface looks unusually flat despite having a normalMap wired; or the rail shows dark streaks running the wrong direction.

### Pitfall 2: Noisy Wood Normals Under Clearcoat
**What goes wrong:** With `clearcoat: 0.72` on the wood coaming, the clearcoat specular layer is very active. A normalMap with freq > ~14 or strength > ~1.0 will produce a chattering highlight that reads as textured plastic, not varnished wood.
**Why it happens:** The clearcoat lobe in Three.js `MeshPhysicalMaterial` samples the normalMap for its specular direction too. High-frequency normals create high-frequency specular movement.
**How to avoid:** Keep `freq ≤ 12` in `woodNapNormalMap()` and `normalScale ≤ 0.20`. If the grain is barely visible at HERO, that is correct — wood grain under varnish reads as VALUE variation, not surface height.
**Warning signs:** At the MACRO shot the wood coaming reads like plastic with a busy highlight pattern.

### Pitfall 3: Fussy Welt — Over-Prominent Join Detail
**What goes wrong:** A welt tube radius > 0.015 or a welt color brighter than near-black will read as a deliberate design stripe rather than a shadow crease.
**Why it happens:** The felt-to-leather seam is a 3D join between two meshes at approximately the same y=0 plane. The welt should be invisible-until-noticed: a dark valley that makes the transition feel physical without calling attention to itself.
**How to avoid:** Tube radius ≤ 0.012; color near-black (#2a1208 or darker); roughness ≥ 0.85. The test: at the HERO shot, the welt should not be identifiable as a separate element — it should read as shadow.
**Warning signs:** The welt is visible as a color stripe at HERO (not just MACRO). If it's identifiable as "the welt" rather than "the seam shadow", reduce tube radius or darken further.

### Pitfall 4: Welt Z-Fighting with Brass Reveal
**What goes wrong:** The brass torus lives at `position={[0, 0.014, 0]}` and `FELT_R * 0.957`. A welt at `FELT_R * 0.960` (slightly larger radius) will be coplanar or near-coplanar with the brass torus at certain camera angles, producing z-fighting flicker.
**Why it happens:** Both the brass torus and the proposed welt are revolved rings at nearly the same y and radial position. With DPR 2 and a perspective projection, sub-pixel depth differences can flicker.
**How to avoid:** Place the welt at `position={[0, 0.022, 0]}` (slightly above the brass reveal y position) AND ensure its radius is strictly `FELT_R * 0.960` (different from `FELT_R * 0.957` for brass). If z-fighting still occurs, add `polygonOffset={true} polygonOffsetFactor={-1} polygonOffsetUnits={-1}` to the welt mesh (the same solution used for the felt plane vs brass coplanar fight in TP1).
**Warning signs:** The rail inner seam flickers between dark and bright in the dev server at certain orbit angles.

### Pitfall 5: Surgical Slim Deletes Material Story
**What goes wrong:** Reducing `leatherProfile rOut` too aggressively makes the leather roll narrow to the point where the `drawStitchSeam` in `leatherTexture()` becomes invisible (the seam is at UV y = 0.3, but if the leather profile is very thin, the texture compression makes it unreadable).
**Why it happens:** `leatherTexture()` is a 2048×512 texture; the U repeat wraps around the rail, but the V extent is clamped to the profile height. A slim profile compresses the V extent.
**How to avoid:** Never reduce `leatherProfile rOut` below `FELT_R * 1.058` (a 1.4% reduction from the current 1.072). This keeps the leather roll wide enough to read the saddle-stitch seam at MACRO.
**Warning signs:** At MACRO the leather looks like a smooth colored band with no pebble grain or stitch visible.

### Pitfall 6: Adding Geometry Mass
**What goes wrong:** Misreading the "table floats" perception as a TP4 problem and adding a new revolved profile or extending `bodyProfile` downward.
**Why it happens:** The "table floats" read (no grounding shadow below the body) is a LIGHTING problem, not geometry. The `bodyProfile()` already extends from y = -0.12 to y = -1.5 (the plinth foot). TP5 resolves this with PCSS shadows.
**How to avoid:** `bodyProfile()` is read-only in TP4. The welt is the ONLY new mesh. No new LatheGeometry profiles.
**Warning signs:** Any plan task that says "extend bodyProfile" or "add a skirt" in TP4.

### Pitfall 7: The `?rail=slim` Flag Running Simultaneously With Craft Levers
**What goes wrong:** Capturing the operator gate with both `?rail=slim` AND the craft levers active masks which change is responsible for what read. The operator cannot isolate whether the elegance recovery came from the slim or from the craft details.
**How to avoid:** The `?rail=slim` flag is NEVER combined with `?rail=craft` in the same capture. Gate captures are:
- `?cam=hero` (default, no rail flag) — current baseline
- `?rail=slim&cam=hero` — slim only (if verdict=lost)
- `?rail=craft&cam=hero` — craft levers only (no slim)
- `?rail=slim&cam=hero&?rail=craft` — FORBIDDEN in gate captures
**Warning signs:** A capture filename that contains both "slim" and "craft".

---

## Code Examples

### The chipFaceNormalMap pattern (canonical template for all TP4 normals)
```typescript
// Source: frontend/src/lab/textures.ts ~L571-618 (TP3, now the established pattern)
// Pattern: (1) draw height field in RED channel, (2) heightToNormalMap, (3) toNormalMapTexture
const normalCanvas = heightToNormalMap(c, 1.0); // strength neutral; normalScale on material tunes
const t = toNormalMapTexture(normalCanvas);      // sets NoColorSpace + anisotropy 8
t.wrapS = t.wrapT = THREE.RepeatWrapping;
t.repeat.set(W_repeat, H_repeat);
return t;
```

### The ?chips= flag pattern (template for ?rail= flag)
```typescript
// Source: frontend/src/lab/TableLab.tsx ~L807-808 (TP3)
const chipsFlag = qp("chips");
const chipKit = useChipKit(cImg, chipsFlag === "dv");

// TP4 mirror:
const railFlag = qp("rail");
const isWelt    = railFlag === "welt"    || railFlag === "craft";
const isNormals = railFlag === "normals" || railFlag === "craft";
const isBrass   = railFlag === "brass"   || railFlag === "craft";
const isSlim    = railFlag === "slim"; // verdict=lost only
```

### The existing brass reveal torus (spatial anchor for welt placement)
```typescript
// Source: frontend/src/lab/TableLab.tsx ~L594-598
{/* brass reveal where the felt meets the leather */}
<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
  <torusGeometry args={[FELT_R * 0.957, 0.02, 16, 180]} />
  <primitive object={brassMat} attach="material" />
</mesh>
// Welt goes AFTER this mesh, at radius FELT_R * 0.960, y slightly higher (0.022)
```

### The leatherProfile cross-section (READ-ONLY geometry reference)
```typescript
// Source: frontend/src/lab/TableLab.tsx ~L107-128
function leatherProfile(): THREE.Vector2[] {
  const rIn = FELT_R * 0.962; // ~6.253, meets the brass reveal at the felt edge
  const rOut = FELT_R * 1.072; // ~6.968, meets the wood coaming
  // peak y ≈ 0.565 at t=0.49 (the broad flattened crown)
  // ...
}
// Edge-thickness ratio (before) = 0.565 / 6.5 = 0.087
```

### The toNormalMapTexture call (mandatory colorspace)
```typescript
// Source: frontend/src/lab/normalMapHelper.ts ~L161-166
export function toNormalMapTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.NoColorSpace; // MANDATORY — never sRGB for normals
  t.anisotropy = 8;
  return t;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `bumpMap` for pebbled leather relief | `normalMap` via Sobel helper for the chip C groove | TP3 (04-03) | Better per-pixel lighting; the bump→normal precedent is established for leather |
| Separate `bumpMap` per surface | Shared `heightToNormalMap` + `toNormalMapTexture` pipeline | TP1 (felt nap) | One code path for all normalMap generation; colorspace handled centrally |
| MeshStandardMaterial for brass | Already `MeshStandardMaterial` with roughness 0.34 | Current | Roughness needs to move to 0.38-0.45 per SSOT; env needs lowering |
| LatheGeometry UVs at uniform-angle spacing | LatheGeometry UVs at uniform-angle spacing | Current | The oval X-stretch causes grain stretch at long ends — TP4 addresses this |

**Deprecated/outdated:**
- `bumpMap + bumpScale` on leather: still in use (will be replaced by normalMap in TP4 Lever C — the precedent from TP3 applies directly)
- `MeshStandardMaterial` for brass (consider upgrading to `MeshPhysicalMaterial` for clearcoat availability, but not required for the roughness tune alone — keep simple)

---

## Recommended Plan / Wave Breakdown

### Wave 0: TP4 Baseline Capture (atomic, pre-change)
**Purpose:** Establish the `tp4-base` anchor corpus (the "before" for the gate comparison) and compute the edge-thickness ratio.
**Tasks:**
1. Create a pre-change git tag: `git tag tp4-before-rail`
2. Capture HERO + `?cam=rail` at default (no `?rail=` flag)
3. Commit downscaled captures to `docs/table-3d/anchors/tp4-base/{hero,rail}.png`
4. Document the edge-thickness ratio: 0.087 (computed above)
5. Note the absent `elev/` anchor set explicitly in the summary

### Wave 1: Verdict Plan (05-01, autonomous)
**Purpose:** Issue the elegance verdict by comparing Wave 0 captures against the committed corpus and operator on-device view.
**Deliverable:** Written verdict: "lost / acceptable / lost-in-specific-respect" + rationale. This plan is READ-ONLY — no code changes.
**Gate:** This plan does not have a capture gate; it is a reasoning + documentation step.

### Wave 2: Surgical Slim (05-02, only if verdict = "lost")
**Purpose:** Apply one targeted profile dimension change behind `?rail=slim`.
**Tasks:**
1. Identify which profile dimension to change (coaming yTop vs leather rOut)
2. Apply ONE change at a time; capture HERO + rail
3. Check thin-disc invariant: `woodCoamingProfile rOut > FELT_R * 1.14 + 0.13`
4. Operator confirming "better without losing material read" — then commit; else REVERT immediately
**If verdict = "acceptable":** Skip Wave 2 entirely; proceed to Wave 3.

### Wave 3: Craft Levers (05-03, each independent)
**Purpose:** Implement craft levers behind `?rail=craft` (and individual sub-flags). Each lever tested independently before being folded into `?rail=craft`.
**Lever order (low-risk to higher-risk):**
1. Lever D — Brass roughness tune (simplest: one number change; run M4 metric immediately)
2. Lever C — Leather normalMap (bumpMap→normalMap upgrade; follow chipFaceNormalMap pattern exactly)
3. Lever B — Wood normalMap (new texture function; check anti-noisy at MACRO before wiring)
4. Lever A — Welt/cord geometry (new mesh; check z-fighting + tube radius)
5. Lever F — Outer wall volume (baked into wood normalMap height field; check at HERO only)
6. Lever E — UV remap (optional; scope based on MACRO grain stretch read at Lever B capture)

**Per-lever gate (autonomous):**
- Capture `?rail=<lever>&cam=hero` + `?rail=<lever>&cam=macro` (or rail)
- Visual check: does this lever read as craft? or fussy/noisy/gimmicky?
- PASS → fold into `?rail=craft` accumulator; FAIL → drop this lever, continue

**M4 gate (mandatory after Lever D):**
```bash
node tools/table-3d/run-metrics.mjs --frame .dev-stack/diag/table-3d/tp4/craft/hero-brass.png --metrics M4
```
Must PASS before Lever D is considered shipped.

**M10 gate (after all levers):**
```bash
node tools/table-3d/stats-read.mjs --cam hero
# Must remain < 150. Welt adds 1 draw; normalMaps add 0 draw calls.
```

### Wave 4: Operator Gate (05-04, autonomous: false — HUMAN SEAM)
**Purpose:** Operator reviews HERO + `?cam=rail` at `?rail=craft` (+ `?rail=slim` if applied).
**Gate question:** "Recovered edge elegance WITHOUT losing material/mass? Craft details read as restrained craft, not overworked?"
**Default outcome:** If ambiguous → STOP; keep current contour; ship only the passed craft upgrades.
**Captures for the gate:**
```bash
LAB_URL="http://localhost:5173/table-lab.html?cam=hero" node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp4/gate/hero-current.png
LAB_URL="http://localhost:5173/table-lab.html?cam=hero&rail=craft" node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp4/gate/hero-craft.png
LAB_URL="http://localhost:5173/table-lab.html?cam=rail&rail=craft" node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp4/gate/rail-craft.png
# If slim was applied:
LAB_URL="http://localhost:5173/table-lab.html?cam=hero&rail=slim" node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp4/gate/hero-slim.png
```

---

## grep-check Helper Pattern

Author `tools/table-3d/grep-check-tp4-05.cjs` following the TP3 helper pattern (`grep-check-tp3-03mat.cjs`). Invariants to check:

```javascript
// CHECK 1: wood normalMap wired — woodMat contains `normalMap:` assignment
// CHECK 2: leather bumpMap REMOVED — leatherMat no longer contains `bumpMap: leatherBump`
// CHECK 3: leather normalMap wired — leatherMat contains `normalMap:`
// CHECK 4: brass roughness in range — brassMat contains roughness between 0.38 and 0.45
//          (grep for `roughness: 0.42` or similar; range-check by extracting the numeric)
// CHECK 5: NoColorSpace on normal maps — woodNapNormalMap and leatherNapNormalMap in textures.ts
//          call `toNormalMapTexture` (not `srgb` or `gray`)
// CHECK 6: welt present (if Lever A shipped) — TableLab.tsx contains the welt torusGeometry
//          with radius close to FELT_R * 0.960
```

Usage:
```bash
node tools/table-3d/grep-check-tp4-05.cjs
# Exits 0 on all checks passing; exits 1 on any failure
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | No unit tests for visual changes; metric tools are the automated gate |
| Quick capture check | `LAB_URL="http://localhost:5173/table-lab.html?cam=hero" node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/tp4/<name>.png` |
| M4 gate run | `node tools/table-3d/run-metrics.mjs --frame <path> --metrics M4` |
| M10 gate run | `node tools/table-3d/stats-read.mjs --cam hero` |
| Invariant checker | `node tools/table-3d/grep-check-tp4-05.cjs` |

### Phase Requirements → Test Map

| Req | Behavior | Test Type | Automated Command | Notes |
|-----|----------|-----------|-------------------|-------|
| Verdict issued | Edge-thickness ratio computed; verdict recorded | Manual reasoning + capture review | Capture: `?cam=hero + ?cam=rail` | No auto-pass; reasoning step |
| M4 brass PASS | H 35-48°, S ≤ 0.55, V ≤ 0.80 after brass tune | Automated pixel metric | `node tools/table-3d/run-metrics.mjs --metrics M4` | Already admitted at TP0b |
| M10 no regression | Draw calls < 150 HERO | Automated draw-count | `node tools/table-3d/stats-read.mjs --cam hero` | +1 from welt if it ships |
| M9 determinism | Byte-identical captures | Automated md5 | `node tools/table-3d/m9-determinism.mjs --shot hero` | Must hold after all changes |
| normalMap colorspace | NoColorSpace on all rail normals | Code invariant | `node tools/table-3d/grep-check-tp4-05.cjs` (CHECK 5) | Pattern from TP1-3 |
| No furniture mass added | bodyProfile unchanged | Code invariant | grep: `bodyProfile` in TableLab.tsx unchanged | Manual diff check |

### Wave 0 Gaps

- [ ] `docs/table-3d/anchors/tp4-base/hero.png` — capture at Wave 0 start
- [ ] `docs/table-3d/anchors/tp4-base/rail.png` — capture at Wave 0 start
- [ ] `tools/table-3d/grep-check-tp4-05.cjs` — author in Wave 3 before craft levers ship

---

## Security Domain

Not applicable. TP4 is a pure visual/geometry lab change with no auth, network, or user-facing input involved. The lab route (`/table-lab.html`) is dev-server-only and not in the prod build (verified at TP0, re-verified as a TP9 checklist item). No security considerations for this phase.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `node .dev-stack/lab-shot.mjs` (Playwright) | All captures | Verified present (TP0-TP3) | Playwright in devDeps | None — lab must be running |
| Vite dev server on 5173 | All captures | Requires `cd frontend && npm run dev` | Vite in devDeps | None — must be started manually |
| `tools/table-3d/run-metrics.mjs` (sharp) | M4 gate | Verified present (admitted at TP0b) | sharp in devDeps | None — required for M4 |
| `tools/table-3d/stats-read.mjs` | M10 gate | Verified present (used in TP3) | Playwright headless | None — required for M10 |
| RTX 4060 D3D11 GPU | All captures | Verified at TP0 | ANGLE D3D11 | None — GPU-faithful required |

**Missing dependencies with no fallback:** None. All required tools are present.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `elev/` anchor directory and the six named slim/heavy reference frames are not on any local branch (not just absent from the working tree) | Reference Anchor Disk Audit | If they exist on a different git branch or worktree, the verdict comparison improves — not a safety risk, just a missed data point |
| A2 | The `?cam=rail` camera preset (`pos [0, 2.4, 9.6] target [0, 0.15, 4.9] fov 32`) is an adequate rail/eye view for the operator gate | Architecture Patterns (gate captures) | If the operator finds a different angle more revealing, the gate simply uses a different cam preset — low risk |
| A3 | Raising brass roughness from 0.34 to 0.42 will keep HSV V within the M4 ceiling (≤ 0.80) | Lever D recipe | If roughness 0.42 somehow FAILS M4 (V too high), try 0.45; the M4 metric is the arbiter — run it immediately after the change |
| A4 | The `drawStitchSeam` and `speckle` functions are accessible from the leatherNapNormalMap function (they are in the same file) | Lever C recipe | They are private (unexported) functions in textures.ts; since leatherNapNormalMap will be in the same file, access is guaranteed |

---

## Open Questions

1. **Do the named slim/heavy SSOT anchors exist anywhere in the git history?**
   - What we know: `elev/` is absent from the working tree and `docs/table-3d/anchors/`. The protected-reference tag `table-3d-premium-reference-2026-06-04` predates the anchors directory and may have been captured before the `elev/` naming was established.
   - What's unclear: Whether the anchors were lost, never created, or exist in a stash/branch.
   - Recommendation: Do NOT block the phase on this. Use the available `head/` and `tp3-base/` corpus + the `?cam=rail` fresh capture as the honest basis. Record the absence explicitly in 05-01-SUMMARY.md.

2. **Is `MeshStandardMaterial` for brass adequate, or should it be upgraded to `MeshPhysicalMaterial`?**
   - What we know: The brass reveal torus currently uses `MeshStandardMaterial` (no clearcoat, no env control via `envMapIntensity` separate from material). The roughness tune (0.34→0.42) and adding `envMapIntensity: 0.45` are compatible with `MeshStandardMaterial`.
   - What's unclear: Whether a `MeshPhysicalMaterial` with light clearcoat would better serve the "hairline scratches" bonus sub-lever.
   - Recommendation: Keep `MeshStandardMaterial` for the roughness tune (Lever D core). Upgrade to `MeshPhysicalMaterial` only if the brassNormalMap bonus sub-lever is pursued, since that benefits from clearcoat control.

---

## Sources

### Primary (HIGH confidence — direct code inspection)

- `frontend/src/lab/TableLab.tsx` — all profile functions (leatherProfile, woodCoamingProfile, bodyProfile), material wiring (brassMat, woodMat, leatherMat), flag pattern (qp()), camera presets, Table JSX geometry
- `frontend/src/lab/normalMapHelper.ts` — heightToNormalMap, toNormalMapTexture, the canonical pattern
- `frontend/src/lab/textures.ts` — woodTexture, leatherTexture, leatherBump, chipFaceNormalMap, feltNapNormalMap, cardMicroReliefNormalMap, color constants
- `tools/table-3d/metrics.mjs` — M4 thresholds (H 35-48°, S ≤ 0.55, V ≤ 0.80), REGIONS.brassHero coordinates
- `tools/table-3d/grep-check-tp3-03mat.cjs` — canonical grep-check pattern
- `docs/table-3d/METRICS_ADMISSION.md` — M4 measured baseline (H39.4/S0.38/V0.69 on brassHero rect)
- `docs/table-3d/anchors/` directory listing — confirmed absence of `elev/` subdirectory
- `docs/table-3d/TP3_OPERATOR_AB.md` — TP3 gate pattern (the established operator gate model)
- `docs/table-3d/SCORECARD_TABLE_3D.md` — scoring rubrics for leather rail (4), wood coaming (3), brass (3)
- `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP4 — SSOT spec verbatim

### Secondary (MEDIUM confidence — SSOT cross-reference)

- SSOT §4.5 M4 threshold: `roughness 0.38-0.45` for aged-brass — confirmed in both ROADMAP §TP4 and §4.5 table; baked into `metrics.mjs` THRESHOLDS object
- SSOT §TP4 rollback disposition: non-blocking — confirmed in ROADMAP §5.3 table row "TP4 contour"
- `?cam=rail` camera preset presence — confirmed in `TableLab.tsx` cam presets object (~L851): `rail: { pos: [0, 2.4, 9.6], target: [0, 0.15, 4.9], fov: 32 }`

---

## Metadata

**Confidence breakdown:**
- Reference anchor disk state: HIGH — direct Glob inspection, confirmed absence of `elev/`
- Craft lever implementation recipes: HIGH — derived from verified code patterns in the codebase (chipFaceNormalMap, qp(), brassMat values)
- Edge-thickness ratio computation: HIGH — direct arithmetic from verified profile constants in TableLab.tsx
- UV remap approach: MEDIUM — the buffer attribute approach is correct Three.js API but the exact behavior on a revolved+OVAL_X-scaled geometry may require iterative tuning
- Surgical slim candidates: HIGH — exact line references in leatherProfile / woodCoamingProfile, with risk bounds documented

**Research date:** 2026-06-12
**Valid until:** 2026-07-12 (Three.js 0.169 / R3F 8.17 are stable; no expected API changes in this period)
