---
phase: 09-tp8-tactilidad-microvida-social
plan: "03"
subsystem: docs/table-3d
tags: [tp8, operator-gate, micro-life, social-read, scorecard, auto-approve, live-feel-flagged]
dependency_graph:
  requires: [09-01-SUMMARY, 09-02-SUMMARY]
  provides: [TP8_OPERATOR_GATE, scorecard-tp8-update, phase-9-closed]
  affects:
    - docs/table-3d/TP8_OPERATOR_GATE.md
    - docs/table-3d/SCORECARD_TABLE_3D.md
    - .planning/STATE.md
    - .planning/ROADMAP.md
tech_stack:
  added: []
  patterns: [operator-gate-auto-approve-verifiable-parts, live-feel-flagged-batch-review]
key_files:
  created:
    - docs/table-3d/TP8_OPERATOR_GATE.md
    - .planning/phases/09-tp8-tactilidad-microvida-social/09-03-SUMMARY.md
  modified:
    - docs/table-3d/SCORECARD_TABLE_3D.md
    - .planning/STATE.md
    - .planning/ROADMAP.md
key-decisions:
  - "AUTO-APPROVED (verifiable parts) under standing directive: 16 HARD gates green (grep-check 18/18, M9 byte-identical, M2 3.66x/2.60x, social read COMPLETE) — no live-view needed for these"
  - "LIVE MOTION-FEEL explicitly FLAGGED for operator batch review: the orchestrator cannot assess from frozen captures whether 0.003wu/0.004rad feels like sub-conscious weight (PASS) or conscious animation (HALVE/REMOVE)"
  - "SCORING DISCIPLINE: tactility held at 5 (already AAA from TP6); social-read held at 4 (conservatively, avoiding compounding TP6 aggressive scoring note); TP9 final scorecard is the resolution"
  - "STATE.md percent corrected: 9/10 phases complete = 90% (was recorded as 80% when Phase 9 was in-progress, now closed)"
metrics:
  duration: "~10 min"
  completed_date: "2026-06-12"
  tasks_completed: 1
  files_changed: 4
---

# Phase 9 Plan 03: TP8 Operator Gate Summary

## One-Liner

TP8 operator gate AUTO-APPROVED (verifiable parts: 16 HARD gates green, all amplitude bounds within SSOT ceilings, M9 byte-identical, social read complete) + LIVE MOTION-FEEL FLAGGED for operator batch review; closes Phase 9 / TP8.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | TP8 operator gate doc + scorecard + tracking | (see final commit) | docs/table-3d/TP8_OPERATOR_GATE.md, SCORECARD_TABLE_3D.md, STATE.md, ROADMAP.md |

## Gate Verdict

**AUTO-APPROVED for verifiable parts. LIVE MOTION-FEEL FLAGGED for operator batch review.**

This is not a live on-device A/B session. Under the operator's standing "auto-approve (0 paradas)"
directive, the orchestrator auto-approves all gate dimensions that can be verified from frozen
captures or static code inspection:

- grep-check-tp8-09.cjs: **18/18 PASS** (exit 0)
- MICRO_AMPLITUDE_Y: **0.003wu** (30% of 0.01wu SSOT ceiling)
- MICRO_AMPLITUDE_ROT: **0.004rad** (46% of 0.00873rad / 0.5° SSOT ceiling)
- MICRO_IDLE_PERIOD: **9.0s** (midpoint of 6–12s range)
- MICRO_SETTLE_TAU: **0.25s** (midpoint of 0.2–0.4s range)
- No Elastic/Bounce/Back/Flip/Glow: **0 matches** (case-sensitive, PASS)
- Freeze guard (motionFrozen): **PRESENT** (if (frozen) return — first line of useFrame)
- reducedMotion guard: **PRESENT** (mount-static matchMedia read)
- All 11 TP7 forward-carried invariants: **CHECKS 8–18 PASS**
- M9 double-capture: **byte-identical** (md5 `02e4aa23a039575d07d1cdecb61e85f7`, same as TP7)
- M9 tp8-gate anchor triple: **byte-identical to TP7** (hero `c0c7e124` / card `d7a4350d` / macro `cd073a0c`)
- M2 cards-vs-chips: **3.66× (hero) / 2.60× (card)** — >= 2.0× PASS
- grep-check-tp7-08.cjs: **11/11 PASS** (backward compatibility)
- vitest: **45/45 green**
- tsc src/lab/: **0 errors**
- Social read: **COMPLETE — 4/4** (CenterGameState + staged Perla + community board + demoted pot)

**LIVE MOTION-FEEL:** The gate question "does it breathe with sub-conscious weight without being
consciously noticed?" cannot be answered from frozen captures. The MICRO_* amplitudes are well
within SSOT sub-threshold ceilings (Y=30%, ROT=46%) — the code-assertion confirms airtight
bounds. Whether the live table FEELS alive-not-animated is the operator's call from the live
dev server (`?cam=hero&fx`, 15–30 s, one to two breathing cycles at 9 s period). This is
FLAGGED for the operator's batch review alongside the other FLAGGED items from TP5–TP7.

## Stop-on-Ambiguous Disposition

Not triggered at the code-assertion level. The static amplitude check is unambiguously PASS
(30%/46% of SSOT ceilings). The live stop-on-ambiguous rule (HALVE → REMOVE) is presented in
TP8_OPERATOR_GATE.md for the operator's batch-review session.

If the operator finds the live motion visibly wobbles:
1. HALVE: MICRO_AMPLITUDE_Y 0.003 → 0.0015, MICRO_AMPLITUDE_ROT 0.004 → 0.002 in TableLab.tsx
2. Re-run grep-check-tp8-09 (CHECKS 1–2 still pass at halved values)
3. If still visible after halving: REMOVE (set both to 0 or remove HeroMotion mount)

## Non-Blocking Rollback Status

Motion is additive over the static-complete TP1-TP7 table. If motion is removed during operator
batch review, the table reverts exactly to the TP7 static state (geometry, materials, lighting,
postprocessing, social-read objects all unchanged). The static-but-complete table is a fully
valid TP8 deliverable. The rollback is honourable and non-blocking for TP9.

## Scorecard Delta

| Element | Pre-TP8 | Post-TP8 | Basis |
|---------|---------|----------|-------|
| tactility (13) | 5 (AAA from TP6) | **5** (held) | TP8 adds live FEEL; static tactility already AAA; LIVE MOTION-FEEL FLAGGED for batch |
| social-read (14) | 4 | **4** (held) | Static social read COMPLETE; LIVE FEEL FLAGGED; AAA(5) deferred to TP9 final scorecard |

No regression. Baseline column untouched.

## Deviations from Plan

None. DOCS/TRACKING ONLY plan — no source-code changes. The gate was AUTO-APPROVED for
verifiable parts and the LIVE MOTION-FEEL was FLAGGED as specified by the plan's
`<record_honestly>` directive. The STATE.md percent was corrected from 80% (Phase 9 in progress)
to 90% (Phase 9 closed, 9/10 phases complete).

## Known Stubs

None. The operator gate record is complete. The FLAGGED live-feel is explicitly documented as
a batch-review item in TP8_OPERATOR_GATE.md, not a stub.

## Threat Flags

None. This plan is DOCS/TRACKING ONLY — no network endpoints, no auth, not in the prod build.

## Phase 9 / TP8 Closed

Phase 9 / TP8 COMPLETE.
- All 3 plans (09-01, 09-02, 09-03) executed.
- HeroMotion shipped: sub-threshold breathing on hole cards + accent pot, dual freeze guard.
- Social read confirmed COMPLETE: existing center table-state (CenterGameState + staged Perla
  + community board + demoted pot), no new objects.
- Gate: AUTO-APPROVED (verifiable) + LIVE MOTION-FEEL FLAGGED (batch review).
- Scorecard: tactility held at 5, social-read held at 4 (conservative; TP9 final sign-off).
- STATE.md: Phase 9 marked COMPLETE; percent corrected to 90 (9/10 phases).

**Next: Phase 10 / TP9 — Unificación & AAA Lock (final verdict → new protected reference).**

## Self-Check: PASSED

- [x] `docs/table-3d/TP8_OPERATOR_GATE.md` — CREATED, contains "Operator verdict"
- [x] `docs/table-3d/SCORECARD_TABLE_3D.md` — TP8 rows added (tactility 5→5 held, social-read 4→4 held); Baseline column untouched; no regression
- [x] `.planning/phases/09-tp8-tactilidad-microvida-social/09-03-SUMMARY.md` — this file
- [x] `.planning/STATE.md` — Phase 9 marked COMPLETE; percent 90; next = Phase 10 / TP9
- [x] `.planning/ROADMAP.md` — Phase 9 marked COMPLETE (✅); plan 09-03 marked done
- [x] No frontend/src changes — PASS (DOCS/TRACKING ONLY)
- [x] LOCAL only — no push — PASS
- [x] Transparent: gate doc states AUTO-APPROVED (verifiable) + LIVE MOTION-FEEL FLAGGED — PASS
- [x] Scoring conservative: no inflation; no regression — PASS
