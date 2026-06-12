---
phase: 08-tp7-camaras-lock-money-shots
plan: "01"
subsystem: frontend/lab
tags: [table-3d, camera, money-shots, metrics, tp7, grep-check]
dependency_graph:
  requires: [07-07-SUMMARY]
  provides: [tp7-gate-anchors, grep-check-tp7-08, m1-m2-m9-verdicts]
  affects: [docs/table-3d/anchors/tp7-gate/, tools/table-3d/]
tech_stack:
  added: []
  patterns: [grep-check-cjs-invariant-pattern, playwright-headless-capture, m9-md5-determinism]
key_files:
  created:
    - tools/table-3d/grep-check-tp7-08.cjs
    - docs/table-3d/anchors/tp7-gate/card.png
    - docs/table-3d/anchors/tp7-gate/hero.png
    - docs/table-3d/anchors/tp7-gate/macro.png
    - docs/table-3d/anchors/tp7-gate/m9-hero-a.png
    - docs/table-3d/anchors/tp7-gate/m9-hero-b.png
    - docs/table-3d/anchors/tp7-gate/card-m1-1080p.png
  modified: []
decisions:
  - "TP0 presets confirmed UNCHANGED: card fov:40 / hero fov:32 / macro fov:26 — LOCKED"
  - "grep-check CHECK 11 uses PerspectiveCamera-scoped makeDefault count (not all-makeDefault) to avoid false-positive from OrbitControls makeDefault"
  - "M2 measured via pixel-count segmentation (sanity check) confirming the TP3 3.7x reading holds on the finished TP6 table"
metrics:
  duration: "10 min"
  completed: "2026-06-12"
  tasks_completed: 2
  files_created: 7
---

# Phase 8 Plan 01: TP7 Confirmation Captures + grep-check Summary

**One-liner:** TP7 pre-gate: 3 TP0-frozen money shots recaptured on finished TP6 table with M1=80px, M2=3.66x, M9=PASS (md5 02e4aa23…); grep-check-tp7-08.cjs 11/11 green; all presets UNCHANGED.

---

## Pre-Gate Metric Table (Operator Gate Basis — plan 08-03)

| Metric | Shot | Value | Threshold | Verdict |
|--------|------|-------|-----------|---------|
| M1 rank-glyph bbox height | card.png (1080p downscale) | **80 px** | ≥ 22 px | **PASS** (3.6× margin) |
| M2 cards-vs-chips area | hero.png | **~3.66×** | ≥ 2.0× | **PASS** |
| M2 cards-vs-chips area | card.png | **~2.60×** | ≥ 2.0× | **PASS** |
| M9 autoRotate-off determinism | hero (two captures) | byte-identical | md5(A)=md5(B) | **PASS** |
| grep-check-tp7-08 | TableLab.tsx | 11/11 checks | all pass | **PASS** |
| grep-check-tp6-07 | TableLab.tsx | 8/8 checks | all pass | **PASS** (backward compat) |
| vitest src/lab/ | frontend | 45/45 | all green | **PASS** |
| tsc frontend/src/lab/ | frontend | 0 errors | 0 errors | **PASS** |

**M9 md5 hash:** `02e4aa23a039575d07d1cdecb61e85f7` (both captures byte-identical)

**M1 note:** Pixel-scan on 1728×1080 downscale of card.png. Detected rank-glyph dark-ink vertical extent in card-corner strip: y=405–484 = 80px. 3.6× margin over the 22px floor. `requiresOperatorConfirm=true` always (on-device confirm at gate 08-03).

**M2 note:** Pixel-count segmentation method (card = luma>200&sat<0.25 / chip = 80<luma<220&0.08<sat<0.55). Hero reading (3.66×) is consistent with the TP3 official reading of 3.7x (same chip layout: demoted pot scale=0.5 at [3.0,0,1.5], designed to hold M2≥2.0×). M2 is not required on macro (by design — it is a chip-detail shot).

---

## Preset Value Comparison — TP0 Lock vs TP7 Source Read

| Preset | Param | TP0 Locked Value | TP7 Source Read | Match? |
|--------|-------|-----------------|-----------------|--------|
| card (POV) | fov | 40° | **40** | ✓ UNCHANGED |
| card (POV) | pos | [0, 4.7, 10.6] | **[0, 4.7, 10.6]** | ✓ UNCHANGED |
| card (POV) | target | [0, 0.25, 1.2] | **[0, 0.25, 1.2]** | ✓ UNCHANGED |
| hero | fov | 32° | **32** | ✓ UNCHANGED |
| hero | pos | [1.2, 5.0, 8.2] | **[1.2, 5.0, 8.2]** | ✓ UNCHANGED |
| hero | target | [0, 0.5, 0] | **[0, 0.5, 0]** | ✓ UNCHANGED |
| macro | fov | 26° | **26** | ✓ UNCHANGED |
| macro | pos | [-1.7, 1.7, 2.4] | **[-1.7, 1.7, 2.4]** | ✓ UNCHANGED |
| macro | target | [-1.55, 0.05, 1.05] | **[-1.55, 0.05, 1.05]** | ✓ UNCHANGED |

**Result: TP0 presets confirmed UNCHANGED. No camera change was made or needed.**

---

## Anchor Captures

| File | URL | GPU | Resolution |
|------|-----|-----|------------|
| docs/table-3d/anchors/tp7-gate/card.png | ?cam=card&fx | RTX 4060 Laptop D3D11 | 2880×1800 |
| docs/table-3d/anchors/tp7-gate/hero.png | ?cam=hero&fx | RTX 4060 Laptop D3D11 | 2880×1800 |
| docs/table-3d/anchors/tp7-gate/macro.png | ?cam=macro&fx | RTX 4060 Laptop D3D11 | 2880×1800 |
| docs/table-3d/anchors/tp7-gate/m9-hero-a.png | ?cam=hero (spin=off auto) | RTX 4060 Laptop D3D11 | 2880×1800 |
| docs/table-3d/anchors/tp7-gate/m9-hero-b.png | ?cam=hero (spin=off auto) | RTX 4060 Laptop D3D11 | 2880×1800 |

Capture conditions: marks ON (default — final scene composition), ?fx ON (intended AAA look), spin=off (auto-appended by harness). No console errors.

---

## grep-check-tp7-08.cjs — 11 Checks

| Check | Description | Source | Result |
|-------|-------------|--------|--------|
| 1 | EffectComposer present (TP6) | TableLab.tsx | PASS |
| 2 | N8AO present (M6 satisfier, TP6) | TableLab.tsx | PASS |
| 3 | DepthOfField present (M1 PASS 50px, TP6) | TableLab.tsx | PASS |
| 4 | Vignette present (M8, TP6) | TableLab.tsx | PASS |
| 5 | No Bloom anywhere in frontend/src/lab/ (M7 HARD GATE, TP5) | lab/*.tsx/*.ts | PASS |
| 6 | brassMat roughness 0.42-0.45 (TP4-locked Lever D) | TableLab.tsx | PASS |
| 7 | SoftShadows unconditional in Scene (TP5 PCSS) | TableLab.tsx | PASS |
| 8 | ContactShadows frames={1} (TP5 baked-once) | TableLab.tsx | PASS |
| 9 | autoRotate={false} hardcoded (M9 HARD GATE, TP7) | TableLab.tsx | PASS |
| 10 | fov: 32 / fov: 40 / fov: 26 all present (TP0-frozen presets, TP7) | TableLab.tsx | PASS |
| 11 | No second PerspectiveCamera with makeDefault (flythrough guard, TP7) | TableLab.tsx | PASS |

**Exit code: 0** (all 11 checks pass)

---

## Decisions Made

1. **TP0 presets LOCKED** — all nine frozen values (pos+target+fov for card/hero/macro) are byte-identical to the TP0 lock in TableLab.tsx lines 1048–1053. No camera change needed or made.

2. **CHECK 11 scoped to PerspectiveCamera-only makeDefault** — the plan spec listed `(nc.match(/makeDefault/g) || []).length <= 1` but TableLab.tsx has TWO `makeDefault` tokens (one on `<PerspectiveCamera>`, one on `<OrbitControls makeDefault>`). OrbitControls makeDefault is intentional and required. Adjusted CHECK 11 to count `<PerspectiveCamera ... makeDefault ...>` occurrences specifically (regex `/<PerspectiveCamera[^>]*makeDefault[^>]*>/g`). Current count = 1 → PASS. This matches the described intent ("A second makeDefault PerspectiveCamera would override the preset camera") exactly.

3. **M2 method** — used pixel-count segmentation as a sanity check. Result (3.66×/2.60×) is consistent with the TP3 official manual-polygon reading of 3.7×. M2 method is documented as "manual-polygon fallback" in SSOT; the pixel approach is a confirming proxy. M2 PASS.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Adjustment] CHECK 11 regex scoped to PerspectiveCamera**
- **Found during:** Task 2, when writing the grep-check
- **Issue:** Plan spec `(nc.match(/makeDefault/g) || []).length <= 1` would fail immediately because OrbitControls carries `makeDefault` too (expected, required). The described intent is "no second PerspectiveCamera with makeDefault."
- **Fix:** Regex counts `<PerspectiveCamera ... makeDefault ...>` occurrences only. Current count = 1 → PASS.
- **Files modified:** tools/table-3d/grep-check-tp7-08.cjs
- **Commit:** 9488ef2

---

## Known Stubs

None. No UI-rendering stubs. This plan captures GPU-faithful renders of the real finished table and authors a static checker. No placeholder data, no TODO code.

---

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes. This plan touches only: `tools/table-3d/` (a local CJS checker) and `docs/table-3d/anchors/tp7-gate/` (PNG captures). No production surface affected.

---

## Self-Check: PASSED

- [x] tools/table-3d/grep-check-tp7-08.cjs exists
- [x] docs/table-3d/anchors/tp7-gate/card.png exists
- [x] docs/table-3d/anchors/tp7-gate/hero.png exists
- [x] docs/table-3d/anchors/tp7-gate/macro.png exists
- [x] docs/table-3d/anchors/tp7-gate/m9-hero-a.png exists
- [x] docs/table-3d/anchors/tp7-gate/m9-hero-b.png exists
- [x] Task 1 commit: 051914d
- [x] Task 2 commit: 9488ef2
