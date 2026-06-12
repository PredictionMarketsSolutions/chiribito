---
phase: 06-tp5-iluminacion-sombras-warm-light
plan: "04"
subsystem: frontend/src/lab
tags: [green-bounce, body-volume, rail-capture, hemisphere-tint, TP5, verification]
dependency_graph:
  requires: [06-02, 06-03]
  provides: [06-05, 06-06]
  affects: [docs/table-3d/anchors/tp5-gate/]
tech_stack:
  added: []
  patterns:
    - "Hemisphere ground #0d3d24 confirmed: G-channel delta +6.23 at body underside (subtle, not lime-wash; >2 perceptible, <30 lime-wash threshold)"
    - "Body volume read confirmed: bodyTop luma=109.1 vs bodyUnder luma=100.4 (delta=+8.8; top lighter = volume present)"
    - "No tint correction needed: hemisphere ground stays #0d3d24 (A3 assumption validated)"
key_files:
  modified: []
  created:
    - docs/table-3d/anchors/tp5-gate/rail-shaped.png
    - docs/table-3d/anchors/tp5-gate/rail-base.png
decisions:
  - "Hemisphere ground #0d3d24 confirmed as subtle (not lime-wash): bodyUnder G-delta=+6.23 (between 2=imperceptible and 30=lime-wash). No correction to #0a2f1a needed."
  - "Body volume read present: top-face luma 109.1 vs underside luma 100.4 (delta +8.8). The key+hemisphere+pointLight combination produces volume. Subtle but positive."
  - "Chip underside G-delta=+1.59 (borderline imperceptible) -- no green spotlight on chips. The effect is correctly restrained (hemisphere ground GI, not a directional green fill)."
  - "No code changes in this plan: hemisphere tint saturation within acceptable range; no new lights added."

requirements-completed:
  - "SSOT §TP5 — felt green-bounce verification: hemisphere ground tint #0d3d24 (from 06-02) produces a subtle warm-green GI on object undersides (chips, cards, body apron underside) — not a lime wash, not a green spotlight"
  - "SSOT §TP5 — apron/body volume read: the table body outer wall must read as a volume (top-face lighter, underside green-warm tinted) — resolves 'table floats' (SSOT §TP5 red-team #7). Lighting fix only; the PointLight at [0,-0.25,11] already rakes the body fascia."
  - "SSOT §TP5 — no new light added: the green-bounce is the hemisphere ground tint from 06-02 (zero new draw calls); the body volume is the shaped hemisphere + the existing pointLight (no new shadow-caster)"
  - "SSOT §TP5 — ?cam=rail captures: verify body top-face reads warmer/lighter than underside; confirm no green spotlight read on chip undersides; the green should be a subtle warm tint, not dominant"

duration: ~8 min
completed: "2026-06-12T14:36:17Z"
---

# Phase 6 Plan 04: TP5 Green-Bounce + Body Volume Verification Summary

**Hemisphere ground #0d3d24 confirmed as subtle warm-green GI (G-delta +6.23 at body underside, <30 lime-wash threshold); body outer wall reads as a volume (top luma 109.1 vs underside 100.4, delta +8.8); no tint correction; no new lights; M6/M7/M10 all PASS.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-12T14:28:00Z
- **Completed:** 2026-06-12T14:36:17Z
- **Tasks:** 1
- **Files modified:** 0 (capture-only plan; no code changes)
- **Files created:** 2 captures

## Accomplishments

- Captured `?cam=rail` at both shaped (default) and base (?light=base) paths — authoritative rail-angle frames for the TP5 operator gate (06-06).
- Green-bounce measured quantitatively: body underside G-channel delta = **+6.23** (shaped vs base). Perceptible (>2) but not lime-wash (<30). SSOT A3 assumption **validated** — no tint correction to #0a2f1a required.
- Body volume read measured: shaped bodyTop luma=109.1 vs bodyUnder luma=100.4 → **delta +8.8** (top-face lighter than underside, volume present). The combination of the warm key (hitting the top ledge) + hemisphere ground tint (lifting the underside to warm-green) produces the SSOT §TP5 "top-highlight → underside-shadow" volume read.
- Chip underside G-delta = **+1.59** (borderline imperceptible) — no green spotlight artifact. The effect on chips reads as ambient, not a directional green fill. Anti-pattern avoided.
- All gates confirmed: M6 PASS, M7 PASS, M10 not regressed, vitest 45/45, tsc src/lab/ clean.

## Detailed Perceptual Reads

### Green-Bounce Read

| Region | Shaped G | Base G | Delta | Verdict |
|--------|---------|--------|-------|---------|
| Body underside | 137.3 | 131.0 | **+6.23** | Subtle warm-green GI (not lime-wash) |
| Chip underside | 175.4 | 173.9 | **+1.59** | Borderline imperceptible — no green spotlight |

**Lime-wash threshold:** >30 G-delta would trigger correction to #0a2f1a. Measured at +6.23 — **no correction needed.**
**Imperceptibility threshold:** <2 G-delta would note the effect as absent. Measured at +6.23 — **effect present and perceptible.**

Verdict: **SUBTLE WARM-GREEN GI ON BODY UNDERSIDE — PASS. No green spotlight on chips — PASS.**

### Body Volume Read (SHAPED path)

| Region | Luma | Notes |
|--------|------|-------|
| Body top-face | 109.1 | Warm key grazes the ledge top |
| Body underside | 100.4 | Hemisphere ground tint lifts from pure dark |
| Delta (top − under) | **+8.8** | Volume read present (top lighter = the table is NOT floating) |

The top-face receives more of the warm key (positioned at [1.2, 15, 2]), while the underside receives the hemisphere ground tint (#0d3d24) lift. The positive delta confirms the "top-highlight / underside-shadow" volume read the SSOT §TP5 red-team #7 specifies.

Verdict: **BODY VOLUME READ PRESENT — apron/rail outer wall reads as a volume, not a flat card. PASS.**

### No New Lights Confirmed

- No new light source added in this plan (capture-only; hemisphere tint from 06-02 is unchanged)
- pointLight at [0,-0.25,11] intensity=0.5 unchanged (confirmed from 06-02 SUMMARY)
- SSOT hard gate: no new shadow-casting light — **PASS**

## Metric Gates

| Gate | Result | Value | Threshold | Notes |
|------|--------|-------|-----------|-------|
| **M6 (hero.png reference)** | **PASS** | 21.03% | ≥ 12% darker | Under-card shadow grounding confirmed |
| **M6 proxy (rail floor shadow)** | **PASS** | 58.1% darker | ≥ 12% | Floor under body apron deeply grounded |
| **M7** | **PASS** | 0 Bloom/EffectComposer tokens | = 0 | No postprocessing in lab source |
| **M10 draw count** | **NOT REGRESSED** | 52 calls | ≤ 106 TP4 baseline | Identical to 06-01/02/03 baseline |
| **vitest src/lab/** | **45/45 green** | all pass | all pass | No regressions |
| **tsc src/lab/** | **clean** | 0 errors | 0 errors | Pre-existing errors in src/app/ (unrelated) |
| **M4 (pre-existing fail)** | **FAIL (pre-existing)** | V=0.866 | V≤0.80 | Pre-existing from 06-01 Wave 0; deferred to 06-05 |
| **M5 (hero.png)** | **PASS** | feltClipPct=0%, frameClipPct=0% | felt < 0.5% | No highlight clip |
| **Hemisphere ground** | **#0d3d24 unchanged** | G-delta=+6.23 | <30 lime-wash | No correction needed |
| **No new lights** | **PASS** | 0 new lights added | SSOT hard gate | Body volume via existing pointLight |

## Captures

| Capture | URL | Size | Notes |
|---------|-----|------|-------|
| `tp5-gate/rail-shaped.png` | `?cam=rail` (no ?light=) | 2880x1800 RTX 4060 D3D11 | Shaped default — green-bounce + body volume |
| `tp5-gate/rail-base.png` | `?cam=rail&light=base` | 2880x1800 RTX 4060 D3D11 | Base path — prior flat-warm key A/B |

## Task Commits

1. **Task 1: Capture ?cam=rail shaped vs base + run M6 at rail + record green-bounce verdict** - `6ee8ed5` (chore)

## Files Created

- `docs/table-3d/anchors/tp5-gate/rail-shaped.png` — Rail-angle capture with shaped key path (green-bounce active); authoritative frame for 06-06 operator gate
- `docs/table-3d/anchors/tp5-gate/rail-base.png` — Rail-angle capture with base key path (?light=base); A/B reference frame

## Decisions Made

- Hemisphere ground `#0d3d24` confirmed — no correction to `#0a2f1a` needed (G-delta +6.23 is well within the 2–30 acceptable range)
- Body volume read present but subtle (+8.8 luma delta top vs underside) — "subtle but present" per SSOT spec; acceptable
- Chip underside G-delta +1.59 recorded as borderline imperceptible — this is the correct read (hemisphere GI should be felt-directed, not chip-directed); no green spotlight artifact

## Deviations from Plan

None — plan executed exactly as written. No code changes (capture-only plan confirmed). Hemisphere tint saturation within acceptable range on first capture. No tint correction was triggered.

## Known Stubs

None. Both rail captures are fully committed. All pixel-based verdicts recorded quantitatively.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes. Lab-only capture plan.

## Next Phase Readiness

- Green-bounce and body-volume verdicts recorded with quantitative pixel data — ready for 06-05 (grep-check-tp5-06.cjs + full metric suite including M4 brass fix)
- Rail captures available for the 06-06 operator gate
- M4 brass fail (V=0.866) remains the only open gate item — assigned to 06-05

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `docs/table-3d/anchors/tp5-gate/rail-shaped.png` | FOUND |
| `docs/table-3d/anchors/tp5-gate/rail-base.png` | FOUND |
| `.planning/phases/06-tp5-iluminacion-sombras-warm-light/06-04-SUMMARY.md` | FOUND (this file) |
| commit `6ee8ed5` (Task 1) | FOUND in git log |
| Green-bounce G-delta recorded | +6.23 (body underside), +1.59 (chip underside) |
| Body volume delta recorded | +8.8 (top luma 109.1 vs underside 100.4) |
| M6 PASS (hero reference) | 21.03% |
| M7 PASS | 0 bloom tokens |
| M10 not regressed | 52 calls |
| vitest 45/45 | CONFIRMED |
| tsc src/lab/ clean | CONFIRMED |
| hemisphere ground #0d3d24 unchanged | CONFIRMED (no lime-wash correction needed) |
| No new lights added | CONFIRMED |
