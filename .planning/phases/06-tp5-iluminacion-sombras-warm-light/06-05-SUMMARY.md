---
phase: 06-tp5-iluminacion-sombras-warm-light
plan: "05"
subsystem: table-3d-lab
tags: [tp5, lighting, brass-fix, grep-check, metrics, m4-calibration]
dependency_graph:
  requires: [06-04]
  provides: [grep-check-tp5-06, m4-brass-pass, brassHero-rect-recalibration]
  affects: [tools/table-3d/grep-check-tp5-06.cjs, tools/table-3d/metrics.mjs, frontend/src/lab/TableLab.tsx, docs/table-3d/anchors/tp5-gate/]
tech_stack:
  added: []
  patterns: [grep-check-structural-invariants, per-material-envMapIntensity-tuning, metric-rect-calibration]
key_files:
  created: [tools/table-3d/grep-check-tp5-06.cjs]
  modified: [tools/table-3d/metrics.mjs, frontend/src/lab/TableLab.tsx, docs/table-3d/anchors/tp5-gate/hero.png, docs/table-3d/anchors/tp5-gate/hero-final.png, docs/table-3d/anchors/tp5-gate/card.png, docs/table-3d/anchors/tp5-gate/macro.png]
decisions:
  - brassHero rect recalibrated from (1240,820,140,60) to (1350,368,140,4) — the original rect was measuring card stock since Phase 3 ENCUADRE; actual brass ring is at y=368 at the felt/leather boundary
  - Brass base color changed from #b8915a to #b89b74 (S reduction 0.511→0.370) to bring rendered S below 0.55 gate under TP5 shaped key lighting
  - envMapIntensity lowered from 0.45 to 0.30 as secondary lever (per-material, not global; roughness 0.42 TP4-locked unchanged)
metrics:
  duration: "~90 min (continuation session)"
  completed_date: "2026-06-12"
---

# Phase 6 Plan 05: TP5 Pre-Gate Structural Proof & Metric Suite Summary

One-liner: grep-check-tp5-06 (6 checks, exits 0) + M4 brass false-failure root-caused (brassHero rect sampling card stock since ENCUADRE) + brass color #b8915a→#b89b74 + rect recalibrated to actual ring (1350,368,140,4) → all M4/M5/M6/M7/M10 PASS.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author grep-check-tp5-06.cjs (6 structural invariant checks) | a119bc4 | tools/table-3d/grep-check-tp5-06.cjs |
| M4 Fix (deviation Rule 1) | Brass fix: #b8915a→#b89b74 + brassHero rect recalibration | a4e3adc | frontend/src/lab/TableLab.tsx, tools/table-3d/metrics.mjs, docs/table-3d/anchors/tp5-gate/hero.png, hero-final.png |
| 2 | Full metric suite verification + anchor captures | 4a6e537 | docs/table-3d/anchors/tp5-gate/card.png, macro.png |

## Metric Suite — Final Pre-Gate Readings

### M4 Brass HSV Gate (hard gate for TP5 operator)

| Moment | Rect (l,t,w,h) | H° | S | V | Result |
|--------|---------------|-----|------|------|--------|
| Before (06-01 through 06-04) | (1240,820,140,60) | 45.1 | 0.10 | 0.866 | FAIL — was reading card stock (cream court-card face), NOT brass |
| After — actual brass ring | (1350,368,140,4) | 35.4 | 0.52 | 0.715 | PASS — H∈[35,48]° · S≤0.55 · V≤0.80 |

Gate thresholds: H∈[35,48]°, S≤0.55, V≤0.80.

### M5 Highlight Clip

| Shot | feltClipPct | frameClipPct | Result |
|------|------------|--------------|--------|
| hero | 0% | 0% | PASS |

Gate: felt < 0.5% · frame < 1.5%.

### M6 Shadow Depth (hero)

| Shot | Value | Gate | Result |
|------|-------|------|--------|
| hero | 20.19% | ≥12% darker | PASS |

### M7 No Bloom (code assert)

| Check | Matches in frontend/src/lab/ | Result |
|-------|----------------------------|--------|
| m7-bloom-assert.mjs | 0 | PASS |
| grep-check CHECK 5 | 0 (Bloom/EffectComposer) | PASS |

### M10 Draw-Call Count

| Moment | HERO draws | Gate | Result |
|--------|-----------|------|--------|
| After TP5 Wave 0 (frames={1}) | 52 | ≤106 | PASS |

### +A Corner Warmth (informational)

| Metric | cornerLuma | meanHue | meanSat | Gate | Result |
|--------|-----------|---------|---------|------|--------|
| +A | 15.1 | 27.9° | 0.606 | luma≥18 AND hue∈[15,75]° | INFO (structural dark corners; luma TP6 scope) |

+A is informational — warm hue H=27.9° confirmed; luma floor is a TP6 vignette deliverable.

### grep-check-tp5-06 Structural Proof

```
OK — grep-check-tp5-06: all 6 TP5 lighting invariants hold
  (1) SoftShadows unconditional in Scene (PCSS injected once; no per-flag toggle)
  (2) ContactShadows frames={1} (baked once; M10 improved 106→52 draws)
  (3) KEY_TO_FILL_RATIO_CEILING = 3.5 (anti-casino sentinel; shaped 2.75x / base 2.86x)
  (4) shadow-normalBias present on key spotLight (peter-pan prevention on flat felt plane)
  (5) No Bloom/EffectComposer in frontend/src/lab/ (M7 PASS — all postprocessing deferred to TP6)
  (6) brassMat roughness 0.42-0.45 (TP4-locked; brass aging pass held through TP5 specular changes)
```

Exit code: 0.

### vitest / tsc

| Suite | Result |
|-------|--------|
| vitest (frontend/) | 398/398 green (61 files) |
| tsc src/lab/ | 0 errors |

(Pre-existing errors in src/app/ and src/auth/ are out-of-scope — not touched in this plan.)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] brassHero metric rect sampling card stock since Phase 3 ENCUADRE**

- **Found during:** M4 fix iteration (Task 1 / pre-Task 2)
- **Issue:** The original `brassHero` rect calibrated at TP0b as `{left:1240, top:820, width:140, height:60}` was valid for the pre-ENCUADRE scene. Plan 03-01 (ENCUADRE) changed the scene composition: `FELT_R 5.2→6.5`, `CARD_W 2.4→2.05`, `LAB_COMMUNITY 3→5` cards — this moved the community cards to cover the original rect, which fell exactly on a court-card face (cream white stock). All TP5 M4 readings from 06-01 through 06-04 were measuring card stock (H≈45°, S≈0.10, V≈0.866), not the brass ring. The "pre-existing fail V=0.866" logged in previous SUMMARYs was a calibration bug, not a real brass failure.
- **Fix:** Pixel-scanned the 2880×1800 hero capture by scanning rows for brass-colored pixels (H 35-55°, S>0.4, V>0.5). Found the actual brass ring at y≈368-420 at the felt/leather oval boundary. Recalibrated to `{left:1350, top:368, width:140, height:4}` — a 4-row band in the center of the ring, clear of card faces and wood. Also validated that the new rect correctly FAILS the old color (#b8915a with TP5 lighting: S≈0.649 > 0.55 → gold-drift detection works).
- **Files modified:** `tools/table-3d/metrics.mjs` (brassHero rect)
- **Commit:** a4e3adc (combined with brass color fix)

**2. [Rule 1 - Bug] Actual brass S>0.55 under TP5 shaped key lighting**

- **Found during:** M4 fix — after recalibrating the rect, measured actual brass ring: H=35.1°, S=0.649, V=0.716 — S FAIL (>0.55 gate).
- **Issue:** The TP5 shaped key light (intensity=2.2, angle=0.72) adds ~+0.14 to rendered S compared to the base material color. The original brass color `#b8915a` (H=35.1°, S=0.511 in linear) pushed rendered S to 0.649 — above the 0.55 gate.
- **Fix:** Lowered brass base color S by reducing the hex from `#b8915a` to `#b89b74` (from saturated warm-amber to aged-bronze). Hex comparison: `#b8915a`→H35, S0.511, V0.722; `#b89b74`→H34.4, S0.370, V0.722. The darker chroma (less orange, more neutral) is the correct perceptual direction for aged brass (NOT gold). Also lowered `envMapIntensity` from 0.45 to 0.30 as a secondary lever. Rendered result: H=35.4°, S=0.52, V=0.715 — all three thresholds PASS.
- **Files modified:** `frontend/src/lab/TableLab.tsx` (brassMat color + envMapIntensity)
- **Commit:** a4e3adc

**Primary lever note:** The plan suggested `envMapIntensity` as the primary lever. Changing `envMapIntensity` 0.45→0.30 alone had zero effect on M4 because the metric was sampling card stock (calibration bug above). After recalibrating, the actual brass ring showed S fail — fixed by base color reduction. Both levers (color + envMapIntensity) are combined in the shipped fix.

## Known Stubs

None. All metric gates are live; grep-check reads actual source; captures are from actual renderer.

## Threat Flags

None. No new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- [x] tools/table-3d/grep-check-tp5-06.cjs — exists, exits 0
- [x] tools/table-3d/metrics.mjs — brassHero rect updated, confirmed in commit a4e3adc
- [x] frontend/src/lab/TableLab.tsx — brass #b89b74 + envMapIntensity 0.30, confirmed in commit a4e3adc
- [x] docs/table-3d/anchors/tp5-gate/hero.png + hero-final.png — fresh M4 PASS captures
- [x] docs/table-3d/anchors/tp5-gate/card.png + macro.png — fresh captures, committed 4a6e537
- [x] Commits exist: a119bc4 (grep-check), a4e3adc (brass fix), 4a6e537 (metric verification)
- [x] vitest 398/398 green; tsc src/lab/ clean
- [x] M4/M5/M6/M7/M10 all PASS
