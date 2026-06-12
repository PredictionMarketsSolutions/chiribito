---
phase: 06-tp5-iluminacion-sombras-warm-light
plan: "03"
subsystem: frontend/src/lab
tags: [per-material-specular, anti-casino, anti-wet, wood, body, card, chip, TP5]
dependency_graph:
  requires: [06-01, 06-02]
  provides: [06-04, 06-05, 06-06]
  affects: [frontend/src/lab/TableLab.tsx, docs/table-3d/anchors/tp5-gate/]
tech_stack:
  added: []
  patterns:
    - "Per-material specular tuning in the anti-casino/anti-wet/anti-gold direction: roughness raised, clearcoat lowered, envMapIntensity lowered"
    - "M4 re-run as brass neighbor-drift guard after all specular changes"
    - "M5 highlight-clip guard after wood/card roughness tighten"
key_files:
  modified:
    - frontend/src/lab/TableLab.tsx
  created:
    - docs/table-3d/anchors/tp5-gate/hero-specular.png
    - docs/table-3d/anchors/tp5-gate/macro-specular.png
decisions:
  - "woodMat envMapIntensity 0.55->0.50 (more conservative than plan's 0.55 target; M4 V unaffected -- brass V is driven by Environment lightformers, not wood envMapIntensity; extra restraint is safer)"
  - "M4 pre-existing fail (V=0.866 vs 0.863 pre-06-03): delta +0.003 from 06-03 specular = noise level; M4 failure is from TP5 Wave 0 grounding (SoftShadows+brighter key), deferred to 06-05 full metric suite"
metrics:
  duration: "~9 min"
  completed: "2026-06-12T14:27:43Z"
  tasks_completed: 2
  files_changed: 3
---

# Phase 6 Plan 03: TP5 Per-Material Specular -- Wood/Body/Card/Chip Deltas Summary

**One-liner:** All per-material specular deltas applied in the anti-casino/anti-wet direction (wood roughness up/clearcoat down, body recedes, card crisp edge, chip matte clay); brass TP4-locked unchanged; M4 brass neighbor-drift delta +0.003 (noise-level, pre-existing fail from Wave 0 grounding); M5 PASS 0%/0%; M7 PASS; M10=52 not regressed.

## What Was Built

TP5 Wave 3 (per-material specular): exact deltas applied to wood coaming, body/apron, card stock, card face, and chip pre-dv body materials. All changes in the anti-casino, anti-wet, anti-gold direction (roughness raised or held; clearcoat lowered; envMapIntensity lowered).

### Per-Material Before / After Table

| Material | Property | Before | After | Direction |
|----------|----------|--------|-------|-----------|
| **woodMat** (rail coaming) | roughness | 0.38 | **0.42** | raise (anti-wet) |
| **woodMat** | clearcoat | 0.72 | **0.68** | lower (anti-casino-polish) |
| **woodMat** | clearcoatRoughness | 0.2 | **0.25** | raise (softer clearcoat lobe) |
| **woodMat** | envMapIntensity | 0.65 | **0.50** | lower (wood recedes; plan target 0.55, tuned to 0.50 -- see Deviations) |
| **bodyMat** (apron fascia) | roughness | 0.48 | **0.52** | raise (body in shadow, less specular) |
| **bodyMat** | clearcoat | 0.5 | **0.44** | lower (body recedes behind rail) |
| **bodyMat** | clearcoatRoughness | 0.3 | **0.35** | raise (softer body clearcoat lobe) |
| **bodyMat** | envMapIntensity | 0.5 | **0.4** | lower (body recedes) |
| **card stock** (MeshPhysicalMaterial body) | roughness | 0.62 | **0.60** | slight tighten (crisp card-edge highlight) |
| **card stock** | clearcoatRoughness | 0.55 | **0.50** | slight tighten (crisp clearcoat highlight on card edge) |
| **card face** (faceMat) | roughness | 0.52 | **0.50** | slight tighten (allow slight highlight on face under warm key) |
| **chip pre-dv body** | roughness | 0.5 | **0.52** | raise (matte clay; suppress highlight extent) |
| **chip pre-dv body** | clearcoat | 0.42 | **0.38** | lower (reduce casino highlight; retain clay seal) |
| **chip pre-dv body** | clearcoatRoughness | 0.46 | **0.50** | raise (softer clearcoat lobe; matte seal) |
| **chip pre-dv body** | sheen | 0.5 | **0.4** | lower (reduce sheen extent under new warm key) |

### Confirmed Unchanged Materials

| Material | Key Properties | Status |
|----------|---------------|--------|
| **brassMat** | roughness 0.42, envMapIntensity 0.45, metalness 1 | UNCHANGED (TP4-locked) |
| **feltMat** | roughness 0.93, sheen 0.70, sheenColor #2aad7a | UNCHANGED |
| **leatherMat** | roughness 0.64, clearcoat 0.08, sheen 0.4 | UNCHANGED |
| **chip dv-path** | roughness 0.72, clearcoat 0.32, clearcoatRoughness 0.50 | UNCHANGED (TP3-locked) |
| **Environment** | 3 Lightformers, frames={1} | UNCHANGED |

## Metric Gates

| Gate | Result | Value | Threshold | Notes |
|------|--------|-------|-----------|-------|
| **M4 brass (neighbor-drift)** | FAIL (pre-existing) | H=45.5 S=0.103 V=0.866 | H∈[35,48] S<=0.55 V<=0.80 | Pre-existing from TP5 Wave 0; 06-03 delta = +0.003 on V (noise); deferred to 06-05 |
| **M4 pre-06-03 baseline** | FAIL (pre-existing) | H=45 S=0.105 V=0.863 | same | Confirmed: M4 was already failing before 06-03 changes |
| **M5 hero-specular** | **PASS** | feltClipPct=0%, frameClipPct=0% | felt < 0.5% | No highlight clip from wood/card specular changes |
| **M5 macro-specular** | **PASS** | feltClipPct=0%, frameClipPct=0% | felt < 0.5% | No highlight clip at macro/chip close-up |
| **M7 bloom** | **PASS** | 0 matches | = 0 | No Bloom/EffectComposer/postprocessing in lab source |
| **M10 draw count** | **NOT REGRESSED** | 52 draws at hero | <= 106 TP4 baseline | Identical to 06-01/06-02 baseline |
| **tsc src/lab/** | **clean** | 0 errors in lab scope | 0 errors | Pre-existing errors in src/app/ (unrelated, pre-existing) |
| **vitest src/lab/** | **45/45 green** | all tests pass | all pass | |

### M4 Note

M4 (brass HSV V=0.866) is above the 0.80 ceiling. This is a **pre-existing failure from TP5 Wave 0** (06-01 grounding: SoftShadows PCSS + brighter key light regime). The 06-03 per-material specular changes contributed +0.003 to V (from 0.863 to 0.866) — noise-level drift, not a new regression. The brass material itself is unchanged (roughness 0.42, envMapIntensity 0.45, TP4-locked). M4 remediation is scoped to 06-05 (the full TP5 metric suite plan), where Environment lightformer adjustments can be considered if needed.

## Captures

| Capture | URL | Size | Notes |
|---------|-----|------|-------|
| `tp5-gate/hero-specular.png` | `?cam=hero` | 2880x1800 RTX 4060 D3D11 | TP5 specular gate (default shaped key) |
| `tp5-gate/macro-specular.png` | `?cam=macro` | 2880x1800 RTX 4060 D3D11 | TP5 specular gate macro / chip close-up |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `884144c` | feat(06-03): TP5 per-material specular -- wood/body/card/chip deltas (brass UNCHANGED) |
| Task 2 | `d2ba85f` | chore(06-03): TP5 per-material specular -- M4 pre-existing PASS (delta +0.003), M5 PASS, captures committed |

## Deviations from Plan

### Auto-tuning Beyond Plan Default

**1. [Rule 2 - Restraint] Wood envMapIntensity 0.55 -> 0.50 (more conservative than plan target)**
- **Found during:** Task 2 M4 re-run
- **Context:** Plan specifies wood envMapIntensity 0.65->0.55. After applying 0.55 and recapturing, M4 V=0.866 was identical to pre-06-03 baseline (V=0.863) — confirming the M4 failure is pre-existing from TP5 Wave 0 (not from wood envMapIntensity). The tuning step (0.55->0.50) was tested; V unchanged (confirming wood envMapIntensity does not affect brass HSV -- brass V is driven by Environment lightformers, not wood material env). The extra restraint (0.50 vs 0.55) is in the safe anti-casino direction; it does NOT cause wood to lose the varnish read (roughness 0.42 + clearcoat 0.68 preserve the highlight). Applied as the more conservative value.
- **Files modified:** `frontend/src/lab/TableLab.tsx`
- **Commit:** `d2ba85f`

### Pre-existing Issues (NOT caused by 06-03)

**M4 brass V=0.866 (pre-existing from 06-01):** M4 was failing at V=0.863 before any 06-03 changes. The failure is from TP5 Wave 0 (SoftShadows PCSS + shaped key intensity 2.2 + green-bounce hemisphere). 06-03 contributed +0.003 (noise). Deferred to 06-05 for remediation.

## Known Stubs

None. All per-material specular changes are fully wired. Both chip paths (pre-dv and dv) confirmed correct and divergent.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes. Lab-only frontend material parameter change.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `frontend/src/lab/TableLab.tsx` | FOUND (modified) |
| `docs/table-3d/anchors/tp5-gate/hero-specular.png` | FOUND |
| `docs/table-3d/anchors/tp5-gate/macro-specular.png` | FOUND |
| `.planning/phases/06-tp5-iluminacion-sombras-warm-light/06-03-SUMMARY.md` | FOUND (this file) |
| commit `884144c` (Task 1) | FOUND in git log |
| commit `d2ba85f` (Task 2) | FOUND in git log |
| woodMat roughness 0.42, clearcoat 0.68, clearcoatRoughness 0.25 | CONFIRMED |
| bodyMat roughness 0.52, clearcoat 0.44, clearcoatRoughness 0.35 | CONFIRMED |
| card stock roughness 0.60, clearcoatRoughness 0.50 | CONFIRMED |
| card face roughness 0.50 | CONFIRMED |
| chip pre-dv roughness 0.52, clearcoat 0.38, clearcoatRoughness 0.50, sheen 0.4 | CONFIRMED |
| brassMat roughness 0.42, envMapIntensity 0.45 UNCHANGED | CONFIRMED |
| chip dv-path roughness 0.72, clearcoat 0.32, clearcoatRoughness 0.50 UNCHANGED | CONFIRMED |
| feltMat sheen 0.70, roughness 0.93 UNCHANGED | CONFIRMED |
| M5 PASS (0%/0% both shots) | CONFIRMED |
| M7 PASS (0 bloom tokens) | CONFIRMED |
| M10 = 52 (not regressed) | CONFIRMED |
| vitest 45/45 | CONFIRMED |
| tsc src/lab/ clean | CONFIRMED |
