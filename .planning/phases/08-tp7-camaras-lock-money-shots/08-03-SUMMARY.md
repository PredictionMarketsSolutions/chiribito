---
phase: 08-tp7-camaras-lock-money-shots
plan: "03"
subsystem: docs/table-3d
tags: [table-3d, camera, operator-gate, tp7, cameras-locked, money-shots]
dependency_graph:
  requires: [08-01-SUMMARY, 08-02-SUMMARY]
  provides: [TP7_OPERATOR_GATE, cameras-locked-declaration, tp9-framing-anchor]
  affects: [docs/table-3d/TP7_OPERATOR_GATE.md, docs/table-3d/SCORECARD_TABLE_3D.md]
tech_stack:
  added: []
  patterns: [operator-gate-auto-approve-transparent, conservative-scoring-discipline]
key_files:
  created:
    - docs/table-3d/TP7_OPERATOR_GATE.md
    - .planning/phases/08-tp7-camaras-lock-money-shots/08-03-SUMMARY.md
  modified:
    - docs/table-3d/SCORECARD_TABLE_3D.md
    - .planning/STATE.md
    - .planning/ROADMAP.md
decisions:
  - "TP7 operator gate AUTO-APPROVED under standing directive — cameras confirmed LOCKED, 0 changes (red-team #6: no mid-program re-baseline)"
  - "Cameras scored conservatively: held at 4 (TP0 baseline was 4; TP7 confirms the freeze holds; AAA(5) deferred to TP9 final scorecard)"
  - "Eval framing is FINAL for TP9 — HERO fov:32 / POV-card fov:40 / MACRO fov:26 are the canonical money shots of the finished table"
  - "?fly flythrough disposition: SHIPPED (non-canonical opt-in, 9 lines, freeze guard, does NOT affect canonical presets)"
metrics:
  duration: "5 min"
  completed: "2026-06-12"
  tasks_completed: 1
  files_created: 2
---

# Phase 8 Plan 03: TP7 Operator Gate Summary

**One-liner:** TP7 operator gate AUTO-APPROVED — HERO fov:32 / POV-card fov:40 / MACRO fov:26 confirmed LOCKED (0 changes, 0 corrections) on the finished TP1-TP6 table; M1=80px / M2=3.66× / M9=PASS / grep-check-tp7-08 11/11; eval framing FINAL for TP9.

---

## Gate Verdict

**AUTO-APPROVED** under the operator's standing "auto-approve (0 paradas)" directive.

**Basis:**
1. All HARD gates green (M1/M2/M9/grep-check-tp7-08/grep-check-tp6-07/vitest/tsc — full table in TP7_OPERATOR_GATE.md).
2. Orchestrator CEO visual read: protagonist hole cards (Perla) dominant lower-third at HERO, board mid-frame, rail framing, chips off-center, CenterGameState filling dead zone; CARD POV immersive close-up with depth; MACRO telephoto material shot unobstructed by slim rail; all three presets tell different stories; no unintentional clipping.
3. TP0 preset values CONFIRMED UNCHANGED: all 9 frozen values (pos+target+fov for card/hero/macro) byte-identical to TP0 lock in TableLab.tsx.

**Transparency:** This is NOT a live on-device A/B session. Flagged for operator batch-review confirmation.

---

## Cameras-Locked Declaration

**HERO fov:32 / POV-card fov:40 / MACRO fov:26 — ALL THREE PRESETS CONFIRMED LOCKED.**

**0 presets corrected. 0 minimal corrections applied. 0 iterations.**

The cameras are confirmed-final on the finished TP1-TP6 table (real Fournier cards, instanced
matte chips, slim rail, N8AO crevice AO, whisper DOF, vignette, grain, shaped warm light,
SoftShadows, CenterGameState). No TP1-TP6 change broke any composition.

Red-team #6 confirmed: no mid-program re-baseline was performed. The TP0 freeze holds.

---

## HARD-Gate Summary (from 08-01-SUMMARY)

| Gate | Value | Threshold | Verdict |
|------|-------|-----------|---------|
| M1 rank-glyph bbox height | **80 px** | ≥ 22 px | PASS (3.6×) |
| M2 cards-vs-chips (hero) | **3.66×** | ≥ 2.0× | PASS |
| M2 cards-vs-chips (card) | **2.60×** | ≥ 2.0× | PASS |
| M9 byte-identical | **md5 02e4aa23a039575d07d1cdecb61e85f7** | byte-identical | PASS |
| grep-check-tp7-08 | **11/11** | exit 0 | PASS |
| grep-check-tp6-07 | **8/8** | exit 0 | PASS |
| vitest | **45/45** | all green | PASS |
| tsc src/lab/ | **0 errors** | 0 errors | PASS |

---

## ?fly Flythrough Disposition

**SHIPPED** (plan 08-02, commit 44c84d1).

- X-axis lateral arc, amplitude 0.20wu, frequency 0.22 rad/s, ~28s full cycle.
- Freeze guard (`isFrozen = qp("spin") === "off"`, mount-static) — M9 byte-identical on `?fly&spin=off`.
- 9 new TypeScript code lines (budget ≤ 40).
- Non-canonical, opt-in lab extra. Does NOT affect any canonical preset or metric run.
- Operator note: `?cam=hero` (without `?fly`) always renders the static canonical preset.

---

## Scorecard

**cameras (12): 4 → 4 (hold, conservative).**

TP7 confirms the TP0 freeze holds on the finished table. Conservatively held at 4:
- TP0 baseline was 4. TP7 confirms the preset lock, not adds a new camera feature.
- No regression (baseline immutable; post-TP7 result = baseline).
- AAA(5) deferred to TP9 final scorecard sign-off.
- SCORING DISCIPLINE NOTE: prior TP6 gate scored 5 elements to AAA(5) including lighting and
  tactility — TP6_OPERATOR_GATE.md flags this as potentially aggressive for operator batch
  review. TP7 does NOT compound this: cameras held at 4 conservatively.

---

## Stop-on-Ambiguous

Not triggered. All three presets returned unambiguous YES reads:
- HERO composition: YES (protagonist reads correct on the finished table)
- POV-card legibility: YES (M1=80px, depth beyond the cards)
- MACRO material read: YES (chip stack, AO crevice, brass rail — no cut-off from slim rail)

---

## Phase 8 / TP7 Closure

**Phase 8 / TP7 COMPLETE.**

This plan (08-03) closes the TP7 perceptual gate — the final GSD↔Chiribito human seam for Phase 8.

Phase 8 delivered three sequential plans:
- **08-01:** TP7 confirmation captures + grep-check (M1/M2/M9/grep-check-tp7-08 authored + captured; TP0 presets confirmed UNCHANGED). Commits 051914d + 9488ef2.
- **08-02:** Optional ?fly restrained flythrough (9 lines, freeze guard, M9-safe). Commit 44c84d1.
- **08-03:** TP7 operator gate AUTO-APPROVED — cameras LOCKED. (this plan)

**Milestone:** 8/10 (80%).

**Next:** Phase 9 / TP8 — Tactilidad, micro-vida & lectura social (the FEEL).
Do NOT auto-advance — operator chooses.

---

## Deviations from Plan

### Auto-fixed Issues

None. The operator gate auto-approved under the standing directive — cameras are unchanged (the
"deviation" is the auto-approval mechanism itself, which is explicitly transparent in the gate
document per the operator's "0 paradas" standing directive). Plan executed exactly as written.

---

## Known Stubs

None. No UI-rendering stubs. This plan writes documentation and tracking only — no placeholder
data, no TODO code.

---

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes. This plan touches
only: `docs/table-3d/TP7_OPERATOR_GATE.md` (new gate record), `docs/table-3d/SCORECARD_TABLE_3D.md`
(post-TP7 status note + changelog entry), `.planning/` tracking files. No production surface affected.

---

## Self-Check: PASSED

- [x] docs/table-3d/TP7_OPERATOR_GATE.md exists (phrase "Operator verdict" present)
- [x] docs/table-3d/SCORECARD_TABLE_3D.md updated (TP7 progression log entry + element 12 status note)
- [x] SCORECARD cameras baseline column UNCHANGED (still 4 — immutable)
- [x] SCORECARD cameras post-TP7 = 4 (held, no regression, no inflation)
- [x] .planning/STATE.md updated (Phase 8 / TP7 COMPLETE, milestone 8/10 80%, next TP8)
- [x] .planning/ROADMAP.md updated (Phase 8 complete)
- [x] 08-03-SUMMARY.md created
- [x] No frontend/src/ changes (DOCS/TRACKING ONLY invariant held)
