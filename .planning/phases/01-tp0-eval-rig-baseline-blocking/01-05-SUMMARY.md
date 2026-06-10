---
phase: 01-tp0-eval-rig-baseline-blocking
plan: 05
subsystem: lab / operator-gate
tags: [operator-gate, M1, money-shots, fov-lock, M11, z-fighting, as-de-espadas, table-3d]

# Dependency graph
requires:
  - phase: 01-02
    provides: StatsProbe (?stats renders null), frozen presets, POV fov 40 in code
  - phase: 01-03
    provides: T1 colour metrics + control corpus
  - phase: 01-04
    provides: M9/M7/M12 integrity + M1/M2 operator seam
provides:
  - docs/table-3d/TP0_OPERATOR_GATE.md — the BLOCKING gate record (M1 PASS, money-shot blessing, POV fov LOCKED 40, M1-legibility + M11 readings)
  - POV fov LOCKED at 40 (cameras frozen for TP1-TP9; the 37 option discarded)
  - 2 pre-freeze fixes (hole-pair z-fight stagger; As de Espadas canonical restore)
affects: [01-06, TP1, TP2, TP3, TP5, TP6, all-view-modes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Operator perceptual gate run INLINE (orchestrator-driven) — the gate needs the live lab + back-and-forth; subagents cannot present to the operator"
    - "systematic-debugging (root cause before fix) for the operator-found z-fight; single-origin asset fix for the As de Espadas"

key-files:
  created:
    - docs/table-3d/TP0_OPERATOR_GATE.md
  modified:
    - frontend/src/lab/cards.ts            # HOLE_STACK along-normal stagger + holeLayout opts.stack
    - frontend/src/lab/cards.test.ts       # regression test: overlapping hole cards MUST be height-separated (dy > 0.05)
    - frontend/src/lab/TableLab.tsx        # ?hstack override (variant-exploration param)
    - "frontend/public/cards/1 DE ESPADA.webp"  # restored canonical orientation (was rotated 180)

key-decisions:
  - "M1 attempt 1 FAILED (operator): hole-pair z-fighting + As de Espadas upside-down. Both diagnosed to root cause, fixed at origin, evidenced GPU-faithful, then M1 re-judged PASS."
  - "Hole-pair z-fight ROOT = the two hole cards were coplanar (identical y + z, separated only by an in-plane fan) so the variant-B overlap interpenetrated. Fix: stack each card along its shared face-normal (HOLE_STACK 0.10) so the top card rests ON its partner. Pitch/fan/overlap unchanged; both rank indices legible."
  - "As de Espadas ROOT = the ASSET frontend/public/cards/1 DE ESPADA.webp shipped rotated 180 degrees. Full 28-card audit vs the same-source web/ deck: ONLY 1E inverted (other 27 byte-identical). Single-origin fix (restore pristine canonical) corrects 2D game (DOM + Pixi) AND 3D lab at once. NOT a render bug."
  - "POV fov LOCKED at 40 (operator chose keep-40; the 37 candidate is discarded). Cameras frozen for the rest of the program — zero edit (TableLab.tsx:630 already fov 40)."
  - "M1 legibility PASS-WITH-NOTE: razor-legible; rank-index ~17px @1080p is below the 22px heuristic (necessary-not-sufficient per 01-04) — recorded as a non-blocking future tweak. M11 PASS (~1.3ms median vs <8ms, ~6x margin). M10 over ceiling -> informational, TP3."

patterns-established:
  - "Operator-gate cycle on a FAIL: diagnose to root cause -> minimal single-origin fix -> GPU-faithful before/after evidence -> re-present the gate (never push past a failed perceptual gate)."

requirements-completed: [TP0.0, TP0a-2, TP0a-3]

# Metrics
completed: 2026-06-10
---

# Phase 1 Plan 05: TP0 Operator Perceptual Gate Summary

**The BLOCKING operator gate — run inline against the live lab. M1 failed on attempt 1 (two operator-found defects), both fixed at root/origin and evidenced, then M1 re-judged PASS; the 3 money shots blessed and the POV fov LOCKED at 40; M1-legibility + M11 read (automated, operator-delegated).**

## Accomplishments

- **Gate 1 — M1 cards-as-protagonist (TP0.0 precondition).** Attempt 1 = **FAIL** (operator): the hand cards "mixed"/flickered (z-fighting) and the As de Espadas sword was mis-oriented. Both root-caused, fixed, evidenced (GPU-faithful RTX 4060 before/after), then **attempt 2 = PASS** ("Las cartas son el protagonista. El flicker ha desaparecido. El As de Espadas está correctamente orientado.").
- **Fix A — hole-pair z-fighting (commit `57a4da6`).** The two hole cards were coplanar (same height + depth, only an in-plane fan) → the variant-B overlap interpenetrated. Fixed by stacking each card along its face-normal (`HOLE_STACK 0.10`) so the upper card rests on its partner; added a regression test. Lab-only.
- **Fix B — As de Espadas canonical restore (commit `70bb7de`).** The asset `frontend/public/cards/1 DE ESPADA.webp` shipped rotated 180°. A full 28-card audit confirmed it was the ONLY inverted card (an asset defect, not a render bug). Restored the pristine canonical from the same-source `web/` deck → single-origin fix for the 2D game (DOM + Pixi) and the 3D lab. Anchors re-captured (`56520a1`).
- **Gate 2 — money-shot blessing + POV fov lock.** Operator blessed HERO (fov32) / POV (fov40) / MACRO (fov26) as the canonical frozen-forever views and **locked POV fov at 40** (no edit; the 37 option discarded). Cameras are now frozen for TP1→TP9.
- **Gate 3 — M1-legibility + M11 + M10 (automated, operator-delegated).** M1 legibility **PASS WITH NOTE** (razor-legible; rank-index ~17px @1080p < 22px heuristic → non-blocking). M11 frame-time **PASS** (~1.3ms median @HERO on the real RTX 4060, vsync/cap OFF — ~6× margin under the <8ms ceiling). M10 draw-calls 217/217/181/637 → **informational, routed to TP3** (instancing).

## Task Commits

Operator-gate plan (autonomous:false) run inline. Code/asset commits (LOCAL only — no push):

1. **Fix A — hole-pair z-fight stagger** — `57a4da6` (fix)
2. **Fix B — As de Espadas canonical restore** — `70bb7de` (fix)
3. **HEAD anchors re-captured from the corrected scene** — `56520a1` (chore)

(The gate RECORD `TP0_OPERATOR_GATE.md` is committed with the plan-06 freeze package `21aba04`.)

## Decisions Made

- **Never push past a failed perceptual gate.** On M1 FAIL the program HALTED; the fix path was root-cause → single-origin → evidence → re-judge, not "proceed and hope."
- **Single-origin over local patch.** The As was fixed at the asset (one file → all consumers, all view modes), explicitly not patched in any one renderer.
- **POV fov 40 locked, no edit.** Operator kept 40; cameras frozen.

## Deviations from Plan

- **Plan 05 did NOT modify only `TableLab.tsx` fov** (its anticipated edit). Instead it absorbed two operator-found pre-freeze defects (z-fight + As de Espadas) — diagnosed and fixed at root/origin before the gate could pass. This is the gate working as designed (stop-on-ambiguous → fix → re-judge), not scope creep: a correct, legible baseline is a precondition of the freeze.
- Gate executed INLINE (orchestrator-driven) rather than via a `gsd-executor` subagent, because the perceptual gate requires the live lab + operator back-and-forth (use_worktrees=false; GPU/dev-server program).

## Issues Encountered

- The operator initially still saw the flicker after Fix A — traced to a stale R3F HMR tab; a hard reload + fresh GPU-faithful capture confirmed the fix. No second cause.

## Next Phase Readiness

- All 3 operator gates cleared → unlocks the irreversible baseline freeze (plan 01-06).
- Carried forward: M10→TP3, M1 rank-index legibility note (non-blocking), depth/AO/vignette→TP5/TP6.

## Self-Check: PASSED

`TP0_OPERATOR_GATE.md` exists with M1 PASS + money-shot blessing + POV fov 40 lock + M1-legibility/M11 readings. Commits `57a4da6`, `70bb7de`, `56520a1` exist in git history. Frontend suite 371/371; lab type-clean. Both fixes verified GPU-faithful on the RTX 4060.

---
*Phase: 01-tp0-eval-rig-baseline-blocking*
*Completed: 2026-06-10*
