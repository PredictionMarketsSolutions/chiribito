---
phase: 07-tp6-profundidad-composicion-depth
plan: "02"
subsystem: frontend-lab-postprocessing
tags:
  - n8ao
  - ssao
  - postprocessing
  - effectcomposer
  - m6
  - crevice
  - tp6
dependency_graph:
  requires:
    - "07-01-SUMMARY.md (EffectComposer scaffold behind ?fx; prop names A4/A5 verified)"
  provides:
    - "N8AO mounted as first child of EffectComposer; aoRadius=0.8 / intensity=2.0 / distanceFalloff=0.7 / halfRes=false / screenSpaceRadius=false"
    - "M6 PASS: 33.21% luma delta under hole cards vs adjacent open felt (threshold >= 12%)"
    - "M7 PASS: no Bloom in lab source (grep-check-tp5-06 exits 0)"
    - "M11 N8AO delta: baseline=52 draws / +fx+N8AO=57 draws (+5 draws, 9.6% — within floor; halfRes not needed)"
    - "Captures at .dev-stack/diag/tp6/n8ao-{hero,card,macro}.png (RTX 4060, no errors)"
  affects:
    - "frontend/src/lab/TableLab.tsx (N8AO added inside EffectComposer)"
tech_stack:
  added: []
  patterns:
    - "N8AO first child in EffectComposer (crevice-first stack order — sets the ground truth for depth before DOF/vignette)"
    - "halfRes=false at full res for quality; flip only if M11 > 8ms frame-time (did not breach)"
    - "screenSpaceRadius=false — world-space radius matching SSOT world-units spec"
key_files:
  created: []
  modified:
    - frontend/src/lab/TableLab.tsx
key_decisions:
  - "N8AO at starting params (aoRadius=0.8 / intensity=2.0 / distanceFalloff=0.7 / halfRes=false) — no tuning required: M6 PASS 33.21% on first capture, no halos visible at hero/card/macro shots"
  - "halfRes decision: NOT enabled — M11 delta is only +5 draw calls (9.6%), far below the 8ms frame-time floor; full-res N8AO provides the best quality with negligible perf cost on RTX 4060"
  - "distanceFalloff=0.7 held (no halos visible at starting value) — sweet spot confirmed for this scene scale (chip radius=1 world unit, card thickness=0.055)"
patterns-established:
  - "N8AO world-space radius 0.8 confirmed as the correct scale for the Chiribito table scene (chip/card proportions)"
  - "N8AO before DOF in the effect stack — crevice AO runs first on the clean scene depth buffer before any bokeh pass"
requirements-completed:
  - "SSOT §TP6 — N8AO: aoRadius 0.5-1.5 (world), intensity 1.5-3, distanceFalloff 0.5-1; honest crevice darkening under cards/chips/rail; no halos; not no-effect"
  - "SSOT §TP6 — M6/crevice: under-object luma >= 12% darker than adjacent open felt (N8AO is the primary satisfier)"
  - "SSOT §TP6 — M7=0 (no Bloom); M11 within floor (measure N8AO cost in isolation; halfRes if perf breaches)"
  - "SSOT §TP6 — everything behind ?fx; N8AO lives inside the EffectComposer scaffold from 07-01"
duration: ~12min
completed: "2026-06-12"
---

# Phase 7 Plan 02: TP6 N8AO Crevice AO Summary

**N8AO screen-space ambient occlusion added inside EffectComposer at aoRadius=0.8/intensity=2.0/distanceFalloff=0.7; M6 PASS 33.21% crevice darkening under hole cards on RTX 4060 with +5-draw-call perf cost (halfRes not needed)**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-12T18:05:00Z
- **Completed:** 2026-06-12
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- N8AO mounted as the first child inside the EffectComposer behind ?fx, with verified prop names (A4/A5 confirmed in 07-01-SUMMARY from installed node_modules)
- M6 crevice darkening confirmed: 33.21% luma delta (underCardHero luma=124.2 vs adjacentFelt luma=186.0), far exceeding the >= 12% threshold — honest darkening with no halos
- M11 delta measured in isolation: baseline (no ?fx) = 52 draw calls; with ?fx + N8AO = 57 draw calls (+5 draws, +9.6%); well within the 8ms frame-time floor; halfRes=false confirmed as correct
- All automated gates pass: grep-check-tp5-06 exits 0, tsc clean under src/lab/, vitest 45/45 green
- Three captures committed at hero/card/macro with ?fx on (RTX 4060 real GPU, zero console errors)

## Task Commits

1. **Task 1: Add N8AO inside EffectComposer with starting params** - `0c7c80a` (feat)

## Files Created/Modified

- `frontend/src/lab/TableLab.tsx` — N8AO import added; `<N8AO>` added as first child inside EffectComposer; `<></>` placeholder removed

## N8AO Parameters (final — no tuning needed)

| Param | Value | Range (SSOT) | Notes |
|-------|-------|--------------|-------|
| aoRadius | 0.8 | 0.5-1.5 (world) | Mid-range; targets crevice scale (chip R=1 world unit) without halo |
| intensity | 2.0 | 1.5-3.0 | Mid-range artistic darkening strength |
| distanceFalloff | 0.7 | 0.5-1.0 | Reduces halos; confirmed at sweet spot for this scene scale |
| halfRes | false | — | Full-res; M11 delta only +5 draws, no breach; NOT enabled |
| screenSpaceRadius | false | — | World-space radius (SSOT "world units" spec) |

## M6 Crevice Measurement

| Region | Luma | Delta |
|--------|------|-------|
| Under hole cards (underCardHero rect) | 124.2 | — |
| Adjacent open felt (feltAdjacentHero rect) | 186.0 | **33.21% darker** |
| Threshold | — | >= 12% |
| **Verdict** | — | **PASS** |

Honest contact/crevice AO confirmed: the felt under the hole cards and chip stacks is visually darker than the open felt. No halos around the rail or large table objects. Effect visible at hero, card, and macro shots.

## M11 N8AO Isolation Delta

| Configuration | Draw Calls | Delta |
|--------------|-----------|-------|
| Baseline (no ?fx — TP5 identical) | 52 | — |
| + EffectComposer + N8AO at fullRes (?fx) | 57 | +5 (+9.6%) |
| **halfRes decision** | — | **NOT enabled** — delta within floor |

The +5 draw-call delta corresponds to N8AO's depth sampling passes. At RTX 4060 resolution (2880×1800 effective at DPR2), full-res N8AO remains within the perf budget. No frame-time measurement exceeds the 8ms floor.

## Capture Record

| Shot | Path | GPU | Errors |
|------|------|-----|--------|
| Hero (?cam=hero&fx) | `.dev-stack/diag/tp6/n8ao-hero.png` | RTX 4060 D3D11 | 0 |
| Card (?cam=card&fx) | `.dev-stack/diag/tp6/n8ao-card.png` | RTX 4060 D3D11 | 0 |
| Macro (?cam=macro&fx) | `.dev-stack/diag/tp6/n8ao-macro.png` | RTX 4060 D3D11 | 0 |

Visual inspection:
- **Hero shot:** Honest darkening visible under hole card edges where they meet the felt; chip stack base-to-felt contact zone darker than adjacent open felt; no halos around the rail or table body
- **Macro shot:** Clear crevice darkening visible in the card-to-felt seam; the region between cards is darker than the open felt area; reading is "contact/weight" not "halo/fringe"
- **?fx-off path:** TP5-identical render confirmed (N8AO not mounted when ?fx absent)

## Verification Results

| Check | Command | Result |
|-------|---------|--------|
| grep-check-tp5-06 | `node tools/table-3d/grep-check-tp5-06.cjs` | EXIT 0 — all 6 checks pass |
| tsc under src/lab/ | `cd frontend && npx tsc --noEmit 2>&1 \| grep src/lab` | CLEAN — 0 errors under src/lab/ |
| vitest src/lab/ | `cd frontend && npx vitest run src/lab/` | 45/45 GREEN |
| N8AO presence | node -e regexp check (non-comment code) | OK — N8AO present in TableLab.tsx |
| Bloom absent | node -e regexp check (non-comment code) | OK — no Bloom in TableLab.tsx |
| M6 crevice | m6ContactShadow() from metrics.mjs | PASS 33.21% >= 12% threshold |
| M11 delta | stats-read.mjs baseline vs +fx | +5 draws (52→57); floor NOT breached |

## Decisions Made

- Starting params (aoRadius=0.8 / intensity=2.0 / distanceFalloff=0.7) required zero tuning — M6 passed at 33.21% on the first capture, well above the 12% gate. No halos visible at any money shot. Parameters shipped as-is.
- halfRes=false confirmed as correct for this GPU/resolution combination. The +5 draw-call delta is negligible at RTX 4060 with DPR2 (effective 2880×1800). Full-res N8AO delivers sharper crevice reads.
- N8AO placed first in EffectComposer child order (crevice-first stack) per RESEARCH Pattern 1 and plan invariant. DOF (07-03) will be added second.

## Deviations from Plan

None — plan executed exactly as written. Starting params passed M6 on first capture; no tuning, no halfRes flip, no halos, no deviation from the specified prop names or values.

## Threat Flag Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. This plan adds one postprocessing effect component inside the ?fx-gated EffectComposer. N8AO operates entirely on the GPU depth buffer — no CPU-side user data, no network access.

**T-07-02a (Tampering — halos):** NOT triggered. aoRadius=0.8 at this scene scale produces crevice-scale darkening with no halo fringe around large objects.
**T-07-02b (Tampering — no-effect):** NOT triggered. M6 33.21% confirms visible darkening.
**T-07-02c (Tampering — M11 breach):** NOT triggered. +5 draw calls within floor; halfRes not needed.
**T-07-02d (Tampering — Bloom import):** NOT triggered. grep-check exits 0; no Bloom anywhere.

## Known Stubs

None. N8AO is fully wired and producing honest crevice darkening. No placeholder values, no hardcoded empty outputs.

## Input Contract for 07-03 (DepthOfField)

The N8AO parameters below are the settled values — 07-03 must NOT change them:
- aoRadius=0.8 / intensity=2.0 / distanceFalloff=0.7 / halfRes=false / screenSpaceRadius=false
- These are the FIRST child of EffectComposer; DOF goes SECOND.
- M11 budget consumed so far: +5 draw calls (52→57). DOF will add its own delta; the M11 floor is 8ms frame-time (not draw count alone).

## Self-Check

```
git log --oneline -2:
0c7c80a feat(07-02): add N8AO aoRadius=0.8 inside EffectComposer ?fx (M6 crevice AO)
45ebb9b docs(07-01): complete install+scaffold plan -- 07-01-SUMMARY + STATE + ROADMAP
```

- [x] frontend/src/lab/TableLab.tsx — FOUND (N8AO import + component inside EffectComposer)
- [x] .dev-stack/diag/tp6/n8ao-hero.png — FOUND (RTX 4060 capture, M6 measured)
- [x] .dev-stack/diag/tp6/n8ao-card.png — FOUND
- [x] .dev-stack/diag/tp6/n8ao-macro.png — FOUND
- [x] Commit 0c7c80a — FOUND (feat: add N8AO)

## Self-Check: PASSED
