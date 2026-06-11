---
phase: 04-tp3-fichas-materiality-perf-accent-instancing
plan: 04
subsystem: ui
tags: [operator-gate, perceptual-ab, chip, materiality, instancing, de-vegas, scorecard]

# Dependency graph
requires:
  - phase: 04-02
    provides: InstancedChipStack (M10 PASS: HERO 105 / chips=full 133 / MACRO parity CONFIRMED)
  - phase: 04-03
    provides: de-Vegas materiality behind ?chips=dv (M2=3.7x / chips recede / MACRO byte-identical)

provides:
  - Operator-recorded verdict: TP3 APPROVED (instancing + de-Vegas; 0 reverts, 0 iterations)
  - docs/table-3d/TP3_OPERATOR_AB.md (gate record, per-workstream disposition, HARD-gate table, ?chips= flag map, MACRO caveat)
  - docs/table-3d/SCORECARD_TABLE_3D.md updated: chips 3→4 (post-TP3; AAA(5) deferred to TP5/TP6)
  - Phase 4 / TP3 COMPLETE

affects:
  - Phase 5 (TP4 — Rail & Contour Elegance): next phase; chips now resolved (instanced + de-Vegas)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Operator gate record pattern (TP3_OPERATOR_AB.md): mirrors TP1/TP2 gate records; includes per-workstream SPLIT disposition table, HARD-gate confirmation table, ?chips= flag map, and honest MACRO-framing caveat

key-files:
  created:
    - docs/table-3d/TP3_OPERATOR_AB.md
  modified:
    - docs/table-3d/SCORECARD_TABLE_3D.md (chips row 3→4 + TP3 status note in rubric)

key-decisions:
  - "TP3 APPROVED: instancing + de-Vegas both SHIP; 0 reverts; 0 iterations"
  - "SPLIT disposition confirmed: instancing must-ship-or-revert (shipped — M10 PASS + MACRO parity); de-Vegas non-blocking (shipped — M2/recede/MACRO gate passed)"
  - "chips scorecard: 3→4 (honest; AAA(5) deferred to TP5/TP6 — inter-chip crevice AO + lighting integration needed)"
  - "MACRO-framing caveat recorded honestly: default cam=macro omits demoted pot (scale 0.5 @ [3,0,1.5]); chip-materiality close-up read done via dv-chipclose.png (?chips=full&cam=macro)"

requirements-completed:
  - "SSOT §TP3 perceptual gate — operator A/B at HERO + MACRO: worn artisanal clay that RECEDES, C tooled-not-printed, no Vegas gloss?"
  - "SSOT §TP3 — Stop-on-ambiguous: chips still pull the eye / read plastic -> STOP; any instancing look change = regression"
  - "SSOT §TP3 — Rollback SPLIT: de-Vegas non-blocking (keep current/instanced chips); instancing must-ship-or-revert (net-positive perf or don't ship)"
  - "SSOT §TP3 — HARD gates restated at the gate: M10 PASS (< 150 HERO, < 220 chips=full); M2 cards-vs-chips >= 2x"

# Metrics
duration: 0min
completed: 2026-06-11
---

# Phase 4 Plan 04: TP3 Operator Gate Summary

**TP3 operator perceptual gate APPROVED — instancing + de-Vegas SHIP; chips 3→4; Phase 4 / TP3 COMPLETE**

## Performance

- **Duration:** ~0 min (continuation run — recording pre-given operator verdict)
- **Started:** 2026-06-11
- **Completed:** 2026-06-11
- **Tasks:** 1 (checkpoint:human-verify — verdict recorded)
- **Files modified:** 2

## Verdict

**APPROVED** — TP3 ships in full. The operator reviewed GPU-faithful A/B stills from
`.dev-stack/diag/table-3d/tp3/gate/` (RTX 4060 D3D11): de-Vegas instanced chips (?chips=dv) vs
post-TP2 tp3-base anchors at HERO (fov32) + chip-inclusive MACRO (?chips=full&cam=macro for
clay/tooled-C/gloss read).

SSOT question answered YES: the chips read as worn artisanal clay that RECEDES; the C/rim is tooled
(a recessed groove), not printed; the Vegas gloss is killed; the cards remain the protagonist.

**0 workstreams reverted. 0 iterations used.**

## Per-Workstream SPLIT Disposition

| Workstream | Plan | Rollback class | Disposition | Confirmation |
|-----------|------|----------------|-------------|--------------|
| INSTANCING (04-02) | must-ship-or-revert | SHIPPED | M10 PASS (HERO 105 < 150; chips=full 133 < 220) + MACRO parity (byte-identical) | CONFIRMED |
| DE-VEGAS (04-03) | non-blocking | SHIPPED | M2=3.7× + recede (avgSat -0.047) + MACRO byte-identical | CONFIRMED |

## HARD-Gate Confirmation

| Gate | Value | Threshold | Verdict |
|------|-------|-----------|---------|
| M10 HERO draw count (instanced demoted pot) | **105** | < 150 | PASS |
| M10 chips=full draw count (instanced stress pot) | **133** | < 220 | PASS |
| M2 cards-vs-chips ratio (HERO frame) | **3.7×** | >= 2.0× | PASS |
| Chips recede: avgSat delta (HERO chip region) | **-0.047** | < 0 | PASS |
| MACRO chip quality: MSE inst vs dv | **0.0000** | >= 0 | PASS |

## Scorecard Delta

| Element | Baseline (TP0, locked) | Post-TP3 | Delta | Notes |
|---------|:---------------------:|:--------:|:-----:|-------|
| **chips** | 3 | **4** | +1 | Instancing + de-Vegas matte clay recede. AAA(5) deferred to TP5/TP6 (inter-chip crevice AO + lighting integration). |

## Task Commits

This plan is an operator-gate checkpoint (autonomous:false). No code commits in this plan — the
workstream commits were made in plans 04-02 and 04-03:

- 04-02 instancing: `52005a0` (feat: InstancedChipStack + chip textures 2048→512) + `58a6eca` (feat: drop Chip bottom face) + `b985eac` (chore: grep-check-tp3-02.cjs)
- 04-03 de-Vegas: `8c4f251` (feat: de-Vegas chip textures) + `8509eeb` (feat: de-Vegas chip materials) + `287e3c5` (chore: grep-check-tp3-03 helpers) + `38c0ee5` (de-Vegas follow-up)

**Plan metadata commit** (this plan): docs/table-3d/TP3_OPERATOR_AB.md + SCORECARD update + STATE + SUMMARY.

## Files Created/Modified

- `docs/table-3d/TP3_OPERATOR_AB.md` — Operator gate record: verdict, A/B basis, SPLIT disposition, HARD-gate table, ?chips= flag map, MACRO-framing caveat
- `docs/table-3d/SCORECARD_TABLE_3D.md` — chips row updated 3→4 + TP3 status note in rubric

## Decisions Made

- **Verdict recorded faithfully:** APPROVED (operator-supplied; not re-judged; not auto-approved). No second-guessing.
- **chips 3→4:** Honest score. AAA(5) explicitly deferred to TP5/TP6 — inter-chip crevice AO + full lighting integration are required to reach the bevel-edge + denomination-suit clarity bar. Not inflated.
- **MACRO-framing caveat recorded:** The default cam=macro does NOT include the demoted pot. The clay/gloss read was confirmed via `dv-chipclose.png` (?chips=full&cam=macro, stress pot central). Documented honestly — not treated as a validation gap (the read was performed, just not via the default macro param).
- **SPLIT disposition in the record:** Both workstreams' rollback classes are explicit in TP3_OPERATOR_AB.md so any future bisection knows exactly which stream to target.
- **Inter-chip AO + lighting depth NOT a TP3 gate:** confirmed deferred to TP5/TP6; recorded in the gate doc.

## Deviations from Plan

None — the operator verdict was provided as authoritative input. The plan required recording the verdict and updating artifacts; both were done as specified. No code changed.

## Known Stubs

None. No code artifacts in this plan; all chip work was completed and committed in 04-02/04-03.

## Threat Flags

None. TP3 is lab-only (frontend/src/lab/). No new network, auth, or data surface. Gate decision recorded non-repudiably in TP3_OPERATOR_AB.md (T-04-04-GATE mitigated).

## Phase 4 / TP3 — COMPLETE. Next: Phase 5 / TP4 — Rail & Contour Elegance.

---
*Phase: 04-tp3-fichas-materiality-perf-accent-instancing*
*Completed: 2026-06-11*
