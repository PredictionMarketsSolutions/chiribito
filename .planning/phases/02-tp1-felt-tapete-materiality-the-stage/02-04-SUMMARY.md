---
phase: 02-tp1-felt-tapete-materiality-the-stage
plan: 04
subsystem: operator-gate / perceptual-seam
tags: [tp1, felt, operator-gate, human-verify, approved, ship, autonomous-false]
type: checkpoint:human-verify

# Dependency graph
requires:
  - phase: 02-03
    provides: felt MeshPhysicalMaterial + 3 GPU-faithful captures (tp1/) + M3/M5/+B PASS
provides:
  - docs/table-3d/TP1_OPERATOR_AB.md — recorded operator verdict (APPROVED/ship), A/B basis, disposition, felt scorecard delta, forward feedback
  - docs/table-3d/SCORECARD_TABLE_3D.md — felt post-TP1 score 3 -> 4 (progression log; locked baseline untouched)
  - Phase 2 (TP1) closed — felt materiality SHIPPED as the reference baseline for TP2+
affects: [03]  # Phase 3 (TP2 Cartas) inherits the operator composition feedback

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Operator perceptual gate: autonomous:false human-verify checkpoint, verdict recorded in a tracked doc (non-auto-approvable)"

key-files:
  created:
    - docs/table-3d/TP1_OPERATOR_AB.md
  modified:
    - docs/table-3d/SCORECARD_TABLE_3D.md

key-decisions:
  - "Operator verdict: APPROVED — TP1 ships, 0 iterations, no rollback. Current felt kept as the reference baseline for TP2+."
  - "felt scorecard 3 -> 4 (meets >=4 target); AAA(5) deferred to TP9 final all-green (operator accepted current as 'suficiente', declined further materiality iteration)."
  - "Operator issued forward feedback (cards-protagonist / hand-too-cropped / table-too-partial / full-scene validation before local detail) — recorded as TP2+ guidance, NOT a TP1 defect (TP1 not reopened)."
  - "Composition feedback touches the TP0-frozen-camera invariant + roadmap order (TP2 next) — carried into STATE.md Blockers/Concerns to reconcile at the start of Phase 3."

patterns-established: []

requirements-completed: []  # TP1 gated by SSOT §TP1 perceptual gate — no REQUIREMENTS.md IDs

# Metrics
duration: 1min
completed: 2026-06-10
---

# Phase 2 Plan 04: TP1 Operator Gate — Felt A/B Verdict Summary

**The operator performed the materiality-only A/B (POV fov40 + MACRO fov26) and APPROVED TP1: the felt
reads as physical woven baize (D-05), no satin/casino drift, mark born-in. TP1 ships with 0 iterations;
current felt is the reference baseline for TP2+. The operator also issued forward composition feedback
for the upcoming phases (recorded, TP1 not reopened).**

## Performance

- **Duration:** ~1 min (verdict recording; the perceptual judgement is the operator's)
- **Completed:** 2026-06-10
- **Tasks:** 1 (checkpoint:human-verify, gate=blocking-human)
- **Files modified:** 2 (TP1_OPERATOR_AB.md created; SCORECARD_TABLE_3D.md felt progression)

## Accomplishments

- **Task 1 — operator A/B (materiality-only):** Presented the fresh TP1 captures vs `anchors/head/` (the
  "before") and confirmed never below `anchors/reference-tag/` (the floor), at the two felt-telling shots.
  Operator verdict: **APPROVED / ship** — felt accepted as sufficient for D-05, kept as the reference
  baseline; **no further materiality iterations**. Verdict + disposition + scorecard delta recorded in
  `docs/table-3d/TP1_OPERATOR_AB.md`.

## Disposition

- **SHIP** — unambiguous yes. 0 of ≤2 iterations used. No rollback.

## Scorecard delta

- **felt: 3 → 4** (post-TP1, operator-approved). Meets the ≥4 target. Recorded in the SCORECARD
  progression log; the LOCKED TP0 baseline column was not overwritten. AAA(5) deferred to the TP9 final
  all-green verdict.

## Operator forward feedback (TP2+ — TP1 NOT reopened)

1. Cards remain the absolute protagonist.
2. Hand must read complete / much more complete (currently too cropped to judge composition).
3. The whole table must be visible (currently too partial / small).
4. Full-scene visual validation needed **before** optimizing more local detail: complete table,
   community cards, player hands, global composition, camera↔table↔cards relationship.

These are camera-framing / composition / scene-completeness concerns (roadmap-scoped to TP6/TP7/TP8) the
operator wants validated EARLY — before TP2 card micro-detail. Touches the TP0-frozen-camera invariant.
Carried into STATE.md Blockers/Concerns to reconcile at the start of Phase 3. Full record:
`docs/table-3d/TP1_OPERATOR_AB.md`.

## Deviations from Plan

None — the gate was executed as written. The operator added forward feedback beyond the minimal
ship/iterate/rollback signal; recorded as TP2+ guidance without reopening TP1 (operator instruction).

## Invariants

- No push / no merge / no deploy — all LOCAL. ✅
- Protected reference never degraded. ✅

## Self-Check: PASSED

- `docs/table-3d/TP1_OPERATOR_AB.md` exists with the operator verdict (APPROVED/ship), A/B basis,
  disposition, felt scorecard delta, and forward feedback.
- SCORECARD felt progression recorded (3 → 4); locked baseline untouched.
- Phase 2 marked complete in ROADMAP + STATE.
- No push/merge/deploy.

---
*Phase: 02-tp1-felt-tapete-materiality-the-stage*
*Completed: 2026-06-10*
