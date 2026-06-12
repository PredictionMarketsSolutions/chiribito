---
phase: 06-tp5-iluminacion-sombras-warm-light
plan: "06"
subsystem: docs/table-3d
tags: [operator-gate, tp5, warm-light, grounding, per-material-specular, brass-fix, auto-approved]
dependency_graph:
  requires: [06-05]
  provides: [phase-6-complete, tp5-complete]
  affects: [docs/table-3d/TP5_OPERATOR_GATE.md, docs/table-3d/SCORECARD_TABLE_3D.md]
tech_stack:
  added: []
  patterns:
    - "Operator gate AUTO-APPROVED under standing directive (green hard gates + orchestrator CEO visual read)"
    - "Transparent auto-approval: flagged in gate doc for operator's eventual batch confirmation"
key_files:
  created:
    - docs/table-3d/TP5_OPERATOR_GATE.md
  modified:
    - docs/table-3d/SCORECARD_TABLE_3D.md
    - .planning/phases/06-tp5-iluminacion-sombras-warm-light/06-06-SUMMARY.md
decisions:
  - "TP5 AUTO-APPROVED (standing directive): all hard gates green + orchestrator CEO visual read; flagged for batch operator confirmation"
  - "Scorecard: shadows 3→4 (PCSS grounding), depth 2→3 (body volume), lighting/tactility held at 4"
  - "M4 RECT-RECALIBRATION finding recorded: brassHero rect was sampling card stock since ENCUADRE; recalibrated to actual ring (1350,368,140,4); brass #b8915a→#b89b74 + envMapIntensity 0.30 = aged-brass PASS"
  - "Phase 6 / TP5 COMPLETE — milestone 6/10 (60%). Next = Phase 7 / TP6 (Profundidad & composición)"
metrics:
  duration: "~10 min (docs/tracking only)"
  completed: "2026-06-12"
  tasks_completed: 1
  files_changed: 3
---

# Phase 6 Plan 06: TP5 Operator Gate Summary

**One-liner:** TP5 operator gate AUTO-APPROVED under standing directive (green hard gates + orchestrator CEO visual read): grounding + shaped key + per-material specular + green-bounce + brass M4-fix all ship as default; shadows 3→4, depth 2→3, lighting/tactility held at 4; closes Phase 6 / TP5.

## Gate Verdict

**AUTO-APPROVED — TP5 SHIPS IN FULL.**

Transparency: This gate was auto-approved under the operator's standing "auto-approve (0 paradas)" directive for this milestone run. All TP5 HARD gates are green AND the orchestrator's CEO visual read of the 7 GPU-faithful gate stills was: warm gradient not a casino cone, honest grounding, body lit as a volume without floating, restrained per-material highlights, brass aged-not-gold, cards protagonist, no cold void. This is NOT a live on-device operator A/B session. Flagged in TP5_OPERATOR_GATE.md for the operator's eventual batch confirmation.

Gate question: **"Every material under ONE warm motivated light, honest grounding, restrained highlights, no casino harshness / cold void?"** — Answer: **YES.**

## Per-Element Disposition

| Element | Disposition | Outcome |
|---------|-------------|---------|
| GROUNDING (SoftShadows PCSS + ContactShadows + shadow frustum) | SHIPS — always-on, unconditional | M6 PASS 20.19%; M10 improved 106→52 |
| SHAPED KEY (?light= default) | SHIPS as default | angle=0.72/ratio=2.75x (below 3.5x ceiling) |
| GREEN-BOUNCE (hemisphere ground #0d3d24) | SHIPS | G-delta +6.23 body underside (subtle, not lime-wash) |
| BODY VOLUME | SHIPS | top/underside delta +8.8; "table floats" resolved |
| PER-MATERIAL SPECULAR | SHIPS | anti-casino/anti-wet direction; all M5 PASS |
| BRASS M4-FIX | SHIPS | #b89b74 + envMapIntensity 0.30; M4 PASS H=35.4/S=0.52/V=0.715 |

**0 workstreams reverted. 0 elements dropped.**

## HARD-Gate Confirmation

| Gate | Value | Verdict |
|------|-------|---------|
| M4 brass H/S/V | H=35.4° / S=0.52 / V=0.715 | PASS |
| M5 highlight-clip (hero) | 0% / 0% | PASS |
| M6 contact shadow (hero) | 20.19% darker | PASS |
| +A warm corner floor | luma=15.1 / H=27.9° | INFO (luma TP6 scope; warm hue PASS) |
| M7 no-Bloom | 0 tokens | PASS |
| M10 HERO draws | 52 (improved from 106) | PASS |
| grep-check-tp5-06.cjs | exit 0 (6/6) | PASS |
| vitest | 398/398 green | PASS |
| tsc src/lab/ | 0 errors | PASS |

## M4 Rect-Recalibration Finding

The `brassHero` metric rect `(1240,820,140,60)` had been sampling **card stock** (not brass) since the Phase-3 ENCUADRE changed the scene composition. The actual brass ring sits at y≈368 at the felt/leather boundary. After recalibration to `(1350,368,140,4)`:

- The original brass color `#b8915a` read S≈0.649 under TP5 shaped key — above the 0.55 gate (the brighter key adds ~+0.14 to rendered S)
- Fix: base color de-saturated to `#b89b74` (S=0.370, aged-bronze direction) + envMapIntensity 0.45→0.30
- Rendered result: H=35.4°/S=0.52/V=0.715 — all three thresholds PASS
- Roughness 0.42 (TP4-locked) unchanged

This is the SSOT brass→gold guard working correctly. The de-saturation is in the correct aged-brass direction (less orange, more neutral warm-bronze).

## Scorecard Delta

| Element | Before TP5 | After TP5 | Basis |
|---------|-----------|-----------|-------|
| lighting | 4 | **4** (held) | Shaped warm gradient ships; AAA(5) gated on M8/vignette (TP6) |
| shadows | 3 | **4** | PCSS grounding ships; M6 PASS; AAA(5) gated on crevice AO (TP6) |
| depth | 2 | **3** | Body volume ships; "table floats" resolved; AAA(5) gated on full depth pass (TP6) |
| tactility | 4 | **4** (held) | Per-material specular under warm light; AAA(5) gated on crevice AO (TP6) |

No regressions. Baseline column untouched.

## ?light= Flag Map (final post-TP5)

| URL param | Path | Notes |
|-----------|------|-------|
| (default, no param) | shaped key | TP5 approved default; angle=0.72/ratio=2.75x/green-bounce #0d3d24 |
| `?light=base` | prior flat-warm key | A/B reference; angle=0.62/ratio=2.86x/hemisphere #1a0f08 |

SoftShadows + ContactShadows + warm shadow floor: ALWAYS ON in both paths.

## Deferred Items

| Item | Deferred to |
|------|-------------|
| +A cornerLuma ≥ 18 (vignette floor) | TP6 |
| AO in crevices (under rail, chip gaps) | TP6 |
| AAA(5) chips (inter-chip crevice depth + lighting integration) | TP6 |
| AAA(5) rail/leather/brass/tactility | TP6 / TP7 |

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1 (gate record + scorecard + summary + state) | (this commit) | TP5_OPERATOR_GATE.md, SCORECARD_TABLE_3D.md, 06-06-SUMMARY.md, STATE.md, ROADMAP.md |

## Deviations from Plan

None — plan executed as directed. The gate was auto-approved per the operator's standing directive (not a live A/B session). The auto-approval and its basis are transparently recorded in TP5_OPERATOR_GATE.md per the `<record_honestly>` requirement.

## Known Stubs

None. All TP5 changes are fully committed and wired.

## Threat Flags

None. No new network endpoints, auth paths, or schema changes. Documentation/tracking only plan.

## Phase 6 / TP5 — COMPLETE

All 6 plans complete:
- 06-01: PCSS grounding + ContactShadows frames=1 + shadow frustum
- 06-02: KEY_TO_FILL_RATIO_CEILING + ?light= flag + shaped key + green-bounce hemisphere
- 06-03: Per-material specular (wood/body/card/chip; brass TP4-locked)
- 06-04: Green-bounce + body volume verification
- 06-05: grep-check-tp5-06.cjs (6 checks) + M4 brass fix (rect recalibration + #b89b74)
- 06-06: Operator gate AUTO-APPROVED — docs/tracking

**Milestone: 6/10 phases complete (60%).**
**Next: Phase 7 / TP6 — Profundidad & Composición (depth ON the table: N8AO + whisper DOF + vignette/fog + filmic grade; ALL screen-space/crevice AO; composition kill-dead-zones).**

## Self-Check

| Item | Status |
|------|--------|
| `docs/table-3d/TP5_OPERATOR_GATE.md` | CREATED |
| `docs/table-3d/SCORECARD_TABLE_3D.md` | UPDATED (TP5 status notes + progression log entries) |
| `.planning/phases/06-tp5-iluminacion-sombras-warm-light/06-06-SUMMARY.md` | CREATED (this file) |
| Verdict phrase "Operator verdict" in TP5_OPERATOR_GATE.md | ABSENT (gate doc uses "Operator verdict:" in heading text — see structure) |
| Auto-approval transparency recorded | CONFIRMED |
| M4 rect-recalibration finding recorded | CONFIRMED |
| Scorecard Baseline column untouched | CONFIRMED |
| No regression in any scored element | CONFIRMED |
| No frontend/src/ changes | CONFIRMED |
