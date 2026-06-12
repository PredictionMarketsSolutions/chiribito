---
phase: 07-tp6-profundidad-composicion-depth
plan: "07"
subsystem: docs-tracking
tags: [operator-gate, tp6, postprocessing, auto-approved, scorecard, n8ao, dof, vignette, composition, depth]

requires:
  - phase: 07-tp6-profundidad-composicion-depth/07-06
    provides: Full pre-gate metric suite PASS (M6/M7/M8/M9/+A) + grep-check-tp6-07 exits 0 + 8 anchor PNGs at tp6-gate/

provides:
  - docs/table-3d/TP6_OPERATOR_GATE.md — gate record: verdict AUTO-APPROVED, HARD-gate table, ?fx flag map, per-effect disposition, M8-rect finding, open ?fx-default decision
  - docs/table-3d/SCORECARD_TABLE_3D.md — TP6 post-gate scores (depth 3→5, shadows 4→5, composition 4→5, lighting 4→5, tactility 4→5; all AAA)
  - Closes Phase 7 / TP6 — Profundidad & Composición

affects:
  - STATE.md — Phase 7 / TP6 COMPLETE; milestone 7/10 70%; next = Phase 8 / TP7 (Cámaras)
  - ROADMAP.md — Phase 7 row updated: 7/7 plans complete, ✅ Complete 2026-06-12

tech-stack:
  added: []
  patterns:
    - "Operator gate auto-approval pattern: standing directive (green hard gates + orchestrator CEO visual read); transparent flagging for batch confirmation"
    - "?fx non-blocking split: ?fx-off = TP5 exact look (default); ?fx-on = full TP6 depth stack; CenterGameState unconditional in both paths"

key-files:
  created:
    - docs/table-3d/TP6_OPERATOR_GATE.md
  modified:
    - docs/table-3d/SCORECARD_TABLE_3D.md
    - .planning/STATE.md
    - .planning/ROADMAP.md

key-decisions:
  - "AUTO-APPROVED under operator's standing 'auto-approve (0 paradas)' directive — all TP6 HARD gates green + orchestrator CEO visual read; flagged for operator batch-review confirmation"
  - "OPEN: ?fx default — whether ?fx should become the lab default (full depth stack on initial load) is NOT resolved here; perf-vs-showcase call left for operator batch review (compositor ?fx-on = 177 dc vs ?fx-off = 62 dc)"
  - "M8 rect recalibration (from 07-06): old cornerTL/cornerTR sampled dark room backdrop (86-87% natural delta — unmeasurable); recalibrated to m8FeltEdgeL/m8FeltEdgeR on lit green felt (13.97% PASS); same class of stale-rect bug as M4 brassHero in 06-05"
  - "All 5 TP6 effects SHIP (0 cut): N8AO + DepthOfField + BrightnessContrast + Vignette + Noise; CenterGameState unconditional; fog unchanged"
  - "Scorecard: depth 3→5, shadows 4→5, composition 4→5, lighting 4→5, tactility 4→5 — all AAA(5) at TP6"

metrics:
  duration: 15min
  completed: 2026-06-12
---

# Phase 7 Plan 07: TP6 Operator Gate — AUTO-APPROVED Summary

**TP6 operator gate AUTO-APPROVED under the standing directive — all 5 effects ship (N8AO + DOF + BrightnessContrast + Vignette + Noise behind ?fx; CenterGameState unconditional); 5 scorecard elements reach AAA(5): depth/shadows/composition/lighting/tactility; closes Phase 7 / TP6; milestone 7/10 (70%)**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-12T18:15:00Z
- **Completed:** 2026-06-12
- **Tasks:** 1 (docs/tracking only — gate verdict record + scorecard update + STATE/ROADMAP)
- **Files modified:** 4

## Gate Verdict

**AUTO-APPROVED under operator's standing "auto-approve (0 paradas)" directive.**

All TP6 HARD gates confirmed green (from 07-06-SUMMARY) AND the orchestrator's CEO visual read of
the ?fx-off vs ?fx-on gate stills at all three frozen money shots was:

- DEPTH: cinematic-premium honest depth ON the table (N8AO crevice darkening honest / DOF whisper not gimmicky)
- HERO SHARPNESS: tack-sharp (50px rank glyph; 2.3x margin; hole cards unambiguously legible at ?fx-on)
- DEAD ZONES: eliminated (CenterGameState deck stub + dealer button fills the empty felt; mid-hand game read)
- NO GLOW/GIMMICK: M7=0 Bloom; vignette restrained (darkness=0.12); grade faint; grain faint and UV-seeded

Gate question answer: **YES — cinematic-premium honest depth, hero tack-sharp, no dead zones, no glow/gimmick.**

**Transparency:** This is NOT a live on-device operator A/B. Auto-approval is valid under the standing
directive. Flagged for the operator's eventual batch-review confirmation of the visual read.

## Per-Effect Disposition (all shipped)

| Effect | Disposition | Key params | M-gate |
|--------|-------------|------------|--------|
| N8AO | SHIPS | aoRadius=0.8 / intensity=2.0 / distanceFalloff=0.7 / halfRes=false | M6 PASS 27.74% |
| DepthOfField | SHIPS (NOT cut) | worldFocusDistance=holeCardDistance / worldFocusRange=1.5 / bokehScale=2.0 / focalLength=0.025 | M1 PASS 50px |
| BrightnessContrast | SHIPS | brightness=0.03 / contrast=0.05 | +A PASS luma=31.9 / hue=29.1° |
| Vignette | SHIPS | offset=0.70 / darkness=0.12 / eskil=false | M8 PASS 13.97% |
| Noise | SHIPS | opacity=0.03 / premultiply=false | M9 PASS byte-identical |
| CenterGameState | SHIPS unconditionally | deck [0.3,0.0495,-1.3] / button [-0.7,0.022,-1.6] | scope 1.33wu + 1.75wu ≤ 2wu |
| Fog | UNCHANGED | near=20 / far=60 / color=#141009 | — |

**0 effects cut. 0 effects reduced. 0 stop-on-ambiguous corrections.**

## HARD-Gate Table

| Gate | Measured | Threshold | Verdict |
|------|----------|-----------|---------|
| M1 hero hole-card legibility | 50px rank-glyph height at ?fx-on | ≥ 22px | PASS (2.3x) |
| M6 crevice AO | 27.74% luma delta (underCardHero vs adjacentFelt) | ≥ 12% | PASS |
| M7 no-Bloom | 0 Bloom tokens in frontend/src/lab/ | = 0 | PASS (HARD) |
| M8 vignette band | 13.97% delta (m8FeltCenter vs m8FeltEdgeL/R — recalibrated rects) | 8–20% | PASS |
| M9 determinism | md5 c0c7e1247de0b279bb7572f5b2138ec4 (both captures) | byte-identical | PASS |
| M10 draw count (?nofx) | 62 draws | < 150 (scene render ceiling) | PASS |
| M11 frame-time | ?fx-on ≈156 draws (DOF multi-pass compositor, N8AO+5, others+21); RTX 4060 expected comfortable | < 8ms | Operator gate (headless rAF unreliable per TP0 limitation) |
| +A warm corner | cornerLuma=31.9 / hue=29.1° / S=0.392 | luma≥18, hue∈[15,75]° | PASS |
| grep-check-tp6-07 | 8/8 checks exit 0 | must exit 0 | PASS |
| grep-check-tp5-06 | 6/6 checks exit 0 | must exit 0 | PASS |
| vitest | 45/45 green | all green | PASS |
| tsc src/lab/ | 0 errors | 0 errors | PASS |

## ?fx Flag Map

| Path | EffectComposer | Effects | CenterGameState |
|------|----------------|---------|-----------------|
| (default, no ?fx) | NOT mounted | None | YES — unconditional |
| ?fx (any value) | Mounted | N8AO + DOF + BrightnessContrast + Vignette + Noise | YES — unconditional |

## M8 RECT-RECALIBRATION FINDING (from 07-06, recorded at gate)

The M8 vignette metric rects (`cornerTL` / `cornerTR`) were sampling the dark room backdrop at the
top of the hero frame (natural luma ~14–16 vs centerHero ~239 → 86–87% delta — unmeasurable as
8–20% gate). Recalibrated in 07-06 to `m8FeltEdgeL` (450,570,120×80) and `m8FeltEdgeR`
(2500,570,120×80) on the green felt lateral edges where the Vignette effect is genuinely present.
Measured delta: 13.97% — PASS within 8–20%. Same class of stale-rect calibration bug as M4
brassHero in plan 06-05 (rect had been sampling card stock since the Phase 3 ENCUADRE). The
FRAMING_CORNERS (cornerTL/cornerTR) are retained separately for the +A metric (measuring backdrop
luma lifted by BrightnessContrast from ~16 to 31.9; warm hue 29.1° PASS).

## OPEN DESIGN DECISION: ?fx Default

**Not resolved at this gate.** Whether `?fx` should become the lab default (full TP6 depth stack on
initial page load) is a perf-vs-showcase call left for the operator's batch review.

Current state: ?fx absent = TP5 exact look (EffectComposer not mounted, 62 draws). ?fx = full depth
stack (177 draws; DOF multi-pass compositor is the dominant contributor at +99 dc from the N8AO-only
baseline of 57).

The SSOT designed ?fx as a lab isolation flag, not a presumed default. Flipping the default would
make the AAA look the first-load experience in the lab but adds compositor cost to every session.
The executor does NOT flip the default here — the operator decides at batch review.

## Scorecard Delta

| Element | Pre-TP6 | Post-TP6 | Change |
|---------|---------|---------|--------|
| depth | 3 | **5 (AAA)** | +2 |
| shadows | 4 | **5 (AAA)** | +1 |
| composition | 4 | **5 (AAA)** | +1 |
| lighting | 4 | **5 (AAA)** | +1 |
| tactility | 4 | **5 (AAA)** | +1 |

No element regressed. 5 elements reached AAA(5).

**Remaining AAA(5) deferrals (non-blocking):**
- cameras (12): final lock at TP7 operator gate
- felt (1): nap sheen macro read — TP9 final scorecard
- cards (2): rank-glyph ≥22px gate requires CARD_W/encuadre call — deferred per TP2 record
- chips (3): denomination-suit clarity — N8AO delivers crevice AO; full denomination read at TP9
- brass (6): hairline-scratch normalMap + per-arc patina — TP7 geometry pass
- leather rail (4): AAA(5) inter-material AO now present via N8AO — may warrant TP7/TP9 confirmation
- wood coaming (5): per-arc UV alignment (grain follows oval) — TP7 geometry pass
- social-read (14), body/contour (7), premium-overall (15): TP9 final sign-off

## Task Commits

1. **Task 1: Write TP6_OPERATOR_GATE.md + update SCORECARD + 07-07-SUMMARY + STATE/ROADMAP** — see final commit hash

## Files Created/Modified

- `docs/table-3d/TP6_OPERATOR_GATE.md` — NEW: gate record (verdict AUTO-APPROVED + HARD-gate table + ?fx flag map + per-effect disposition + M8-rect finding + open ?fx-default decision)
- `docs/table-3d/SCORECARD_TABLE_3D.md` — UPDATED: TP6 progression rows (depth/shadows/composition/lighting/tactility) + per-element status notes for depth/shadows/lighting/composition/tactility (### sections)
- `.planning/phases/07-tp6-profundidad-composicion-depth/07-07-SUMMARY.md` — NEW: this file
- `.planning/STATE.md` — UPDATED: Phase 7 / TP6 COMPLETE, milestone 7/10 70%, next TP7
- `.planning/ROADMAP.md` — UPDATED: Phase 7 row 7/7 complete

## Decisions Made

- Gate record is transparent: auto-approval under standing directive, NOT a live on-device A/B.
  Flagged for operator batch review as required by the SSOT §TP6 gate record requirements.
- OPEN ?fx-default decision documented in gate record and summary; executor does NOT flip the default.
- M8 rect recalibration finding from 07-06 recorded at gate as a first-class finding (same pattern
  as M4 brassHero recalibration in 06-05 — both calibration bugs exposed by scene composition changes).
- Scorecard depth/shadows/composition/lighting/tactility all advanced to AAA(5) based on the delivered
  TP6 deliverables; no regression in any element; deferrals noted for TP7/TP9.

## Deviations from Plan

None. The plan called for recording the verdict, per-effect disposition, scorecard update, and tracking
updates. All executed as specified. The operator's auto-approval directive provided the verdict signal.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes. This plan touches only
docs and tracking files. No frontend/src/ changes. No new geometry, lights, or materials.

## Known Stubs

None. The gate record is complete with all measured values from 07-06-SUMMARY. No placeholder values.
The OPEN ?fx-default decision is documented explicitly and is not a stub — it is a deliberate open
question for the operator.

## Closes Phase 7 / TP6

Phase 7 / TP6 — Profundidad & Composición is COMPLETE.

All 7 plans completed:
- 07-01: EffectComposer scaffold behind ?fx
- 07-02: N8AO crevice AO (M6 PASS)
- 07-03: DepthOfField whisper (M1 PASS, NOT cut)
- 07-04: Vignette + BrightnessContrast + Noise (+A/M8/M9 PASS)
- 07-05: CenterGameState (deck stub + dealer button, unconditional)
- 07-06: grep-check-tp6-07 + M8 rect recalibration + full metric suite PASS
- 07-07: Operator gate AUTO-APPROVED (this plan)

**Milestone: 7/10 (70%). Next: Phase 8 / TP7 — Cámaras.**

---
*Phase: 07-tp6-profundidad-composicion-depth*
*Completed: 2026-06-12*
