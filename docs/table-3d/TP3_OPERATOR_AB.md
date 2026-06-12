# TP3 — Fichas Materiality + Perf · Operator Gate (plan 04-04)

**Date:** 2026-06-11
**Branch:** `spike/table-3d-hero` (LOCAL — no push/deploy/merge)
**Plan:** 04-04 (autonomous:false — perceptual gate, the GSD↔Chiribito human seam)

## Operator verdict: APPROVED — TP3 SHIPS (instancing + de-Vegas; 0 reverts, 0 iterations)

The operator approved after reviewing GPU-faithful A/B stills from `.dev-stack/diag/table-3d/tp3/gate/`
(RTX 4060 D3D11, gitignored scratch): the de-Vegas instanced chips (?chips=dv) vs the post-TP2
`tp3-base` anchors (`docs/table-3d/anchors/tp3-base/{hero,macro}.png`), plus a chip-inclusive
close-up (`?chips=full&cam=macro`) for the clay/tooled-C/gloss read.

SSOT question judged: **"worn artisanal clay that RECEDES, C tooled-not-printed, no Vegas gloss?"**
Answer: YES — the chips recede as a quiet muted-clay accent; the C/rim reads as a tooled RECESSED
groove (not a flat print); gloss is killed; the cards remain the unambiguous protagonist.

**0 workstreams reverted. 0 iterations used.**

## A/B basis

| Shot | De-Vegas instanced (TP3 verdict) | "Before" (tp3-base — post-TP2) |
|------|----------------------------------|-------------------------------|
| HERO (fov 32 — hierarchy / recede) | `.dev-stack/diag/table-3d/tp3/gate/dv-hero.png` | `docs/table-3d/anchors/tp3-base/hero.png` |
| MACRO (fov 26 — clay / tooled-C / gloss) | `.dev-stack/diag/table-3d/tp3/gate/dv-macro.png` | `docs/table-3d/anchors/tp3-base/macro.png` |
| Instancing-only HERO (A/B reference) | `.dev-stack/diag/table-3d/tp3/gate/inst-hero.png` | (same tp3-base) |
| Chip-close MACRO (?chips=full&cam=macro) | `.dev-stack/diag/table-3d/tp3/gate/dv-chipclose.png` | (stress pot / clay-read focus) |

The `?chips=dv` flag isolates the full TP3 look (instancing + de-Vegas). The default flag shows
instancing-only (pre-de-Vegas), enabling independent workstream assessment. `?chips=legacy` retains
the original per-chip path as a pre-TP3 A/B baseline.

## Per-workstream SPLIT disposition: BOTH SHIP

| Workstream | Plan | Disposition | Reason | Verdict |
|-----------|------|-------------|--------|---------|
| INSTANCING (04-02) | must-ship-or-revert | SHIPPED | Net-positive perf (M10 PASS: HERO 233→105, chips=full 653→133) AND strict MACRO parity (chip look byte-equivalent vs tp3-base; jitter seeds 2.3/1.7/0.012 preserved) | SHIP |
| DE-VEGAS (04-03) | non-blocking | SHIPPED | Non-blocking gate PASSED: M2=3.7x (>=2.0x), chip avgSat delta -0.047 (recedes), MACRO byte-identical; visual inspection confirms matte clay, tooled C, no Vegas sheen | SHIP |

Instancing ships only because BOTH must-ship conditions held (net-positive draws AND strict MACRO
parity). De-Vegas ships only because all non-blocking gate criteria were satisfied. Neither workstream
triggered stop-on-ambiguous.

## HARD-gate confirmation table

| Gate | Metric | Value | Threshold | Plan | Verdict |
|------|--------|-------|-----------|------|---------|
| M10 HERO draw count | HERO draw calls (instanced demoted pot) | **105** | < 150 | 04-02 | PASS |
| M10 chips=full draw count | Stress-pot draw calls (instanced) | **133** | < 220 | 04-02 | PASS |
| M2 cards-vs-chips | Screen footprint ratio (HERO frame) | **3.7×** | >= 2.0× | 04-03 | PASS |
| Chips recede | Histogram avgSat delta (HERO chip region) | **-0.047** | < 0 (recedes) | 04-03 | PASS |
| MACRO chip quality | MSE instanced vs de-Vegas | **0.0000** | >= 0 (no drop) | 04-03 | PASS |

All HARD gates GREEN. The M10 PASS was the must-ship-or-revert gate for instancing; M2 and recede
were the non-blocking gate for de-Vegas. Both cleared on first attempt.

## ?chips= flag map (complete post-TP3)

| Flag | Scene | HERO Draw Count | Notes |
|------|-------|-----------------|-------|
| (default) | InstancedChipStack demoted pot, instanced look (pre-de-Vegas) | **105** | TP3 shipped instanced default |
| `?chips=dv` | InstancedChipStack demoted pot, DE-VEGAS materiality | **105** | 04-03 de-Vegas target; operator-approved |
| `?chips=full` | InstancedChipStack heavy central stress pot (instanced) | **133** | M10 draw-count diagnostic |
| `?chips=legacy` | ChipStack original per-chip (pre-TP3 instancing) | **201** | Pre-TP3 A/B baseline; kept for bisection |
| `?chips=off` | No chips | — | — |

Note: After operator approval, `?chips=dv` is the de-facto TP3 delivered look. The default renders
the instanced pre-de-Vegas path for A/B traceability; both are correct instanced paths.

## Honest MACRO-framing caveat (recorded, non-blocking)

The default `cam=macro` (fov 26, pos [-1.7, 1.7, 2.4], target [-1.55, 0.05, 1.05]) is a card
close-up and does **NOT** include the demoted pot (scale 0.5 @ group [3, 0, 1.5]). This is why
`dv-macro.png` was byte-identical to the instanced baseline (MSE 0): the pot was outside the macro
frame, so the MACRO parity result trivially holds for chip materiality.

The **chip-materiality close-up** read — confirming matte clay, tooled C, and killed gloss — was
therefore done via the dedicated capture `dv-chipclose.png` (?chips=full&cam=macro, stress pot
central). This capture was the operative MACRO evidence for the de-Vegas verdict at this gate.

**Not a TP3 gate** (deferred): inter-chip crevice AO, chip-stack shadow depth, and screen-space
lighting integration are TP5/TP6 scope. Their absence must not trip this gate.

## Scorecard delta

**chips: 3 → 4** (post-TP3).

| Element | TP0 baseline (locked) | Post-TP3 | Basis |
|---------|-----------------------|----------|-------|
| **chips** | 3 | **4** | Operator-approved 2026-06-11. Instancing (draw-call perf fix, MACRO parity) + de-Vegas (muted palette chroma -20%/value lowered, recessed-C normalMap, sheen killed, clearcoat 0.32/clearcoatRoughness 0.5). Chips now read as matte worn clay that recedes — a quiet accent; no Vegas gloss; no plastic read; C/rim tooled-not-printed. Meets >=4 target. |

**Why not AAA(5):** The AAA(5) rubric for chips requires "tooled clay edges; instanced; denomination
suits readable; brass-not-gold (M4 PASS); demoted pot reads as identity, not clutter." Inter-chip
crevice depth and the full lighting integration (which sharpen the bevel-edge read and the
denomination-suit clarity) are TP5/TP6 scope. AAA(5) is plausible at TP6 after lighting/AO work;
it is NOT a TP3 gate. Held at **4** honestly.

## What shipped (TP3 consolidated)

### Instancing (04-02 — must-ship-or-revert, SHIPPED)

`InstancedChipStack` via drei `<Instances>` per denomination:
- Body `InstancedMesh` + top-face `InstancedMesh` per denomination (3 meshes total vs 3 meshes/chip)
- Bottom face dropped from `Chip` component and `InstancedChipStack` (never visible — SSOT §TP3 rule)
- Chip textures right-sized 2048→512 (chipFaceTexture, chipFaceBump, chipEdgeTexture); mip-friendly
- Deterministic 10-group cream-insert phase-alignment broken (0.37 seed)
- Hand-stacked jitter seeds preserved byte-exactly (seeds 2.3/1.7/0.012 via chipStackLayout)
- `?chips=legacy` flag keeps the original ChipStack for A/B traceability

### De-Vegas (04-03 — non-blocking, SHIPPED)

`useChipKit(cImg, deVegas=true)` path behind `?chips=dv`:
- **Body:** clearcoat 0.42→0.32 / clearcoatRoughness 0.46→0.5 / sheen REMOVED / roughness 0.5→0.72
- **Face:** bumpMap→normalMap (Sobel via shared `heightToNormalMap` helper, NoColorSpace, normalScale 0.4) / clearcoatRoughness 0.36→0.5 / roughness 0.46→0.72
- **Palette:** CHIP_PALETTES_MUTED — S×0.80 (chroma -20%) + L×0.88 (value lowered) on all 4 suits
- **Logo:** ctx.filter saturate(35%) + cSize r×1.26→r×1.02 (desat + shrunk)
- **Textures:** chipFaceTextureDV + chipEdgeTextureDV (muted palette); chipFaceNormalMap (Sobel C/rim groove)

## Outcome

**TP3 SHIPS IN FULL.** Both workstreams committed LOCAL on `spike/table-3d-hero`. No push / no deploy
/ no merge. The chips read as worn artisanal clay that recedes; the C/rim is tooled-not-printed; the
Vegas gloss is killed; the cards remain the protagonist. Phase 4 / TP3 is COMPLETE.

**Next:** Phase 5 / TP4 — Rail & Contour Elegance.

*Recorded by the GSD autonomous loop at the TP3 operator gate, 2026-06-11.*
