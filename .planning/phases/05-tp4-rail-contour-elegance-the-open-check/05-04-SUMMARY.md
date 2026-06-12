---
phase: 05-tp4-rail-contour-elegance-the-open-check
plan: "04"
subsystem: docs/table-3d
tags: [tp4, operator-gate, rail-contour, default-flip, slim, craft-levers, scorecard]
dependency_graph:
  requires:
    - phase: "05-01"
      provides: "TP4_VERDICT.md (verdict=lost-in-specific-respect)"
    - phase: "05-02"
      provides: "?rail=slim wired (woodCoamingProfile yTop 0.34→0.28)"
    - phase: "05-03"
      provides: "?rail= flag system + Levers A/B/C/D/F structural PASS + grep-check-tp4-05.cjs"
  provides:
    - docs/table-3d/TP4_OPERATOR_GATE.md
    - docs/table-3d/SCORECARD_TABLE_3D.md (TP4 delta: wood 3->4, brass 3->4, tactility 3->4)
    - "Default render = TP4 approved look (slim+craft, no flag required)"
    - "?rail=base = pre-TP4 A/B baseline"
  affects:
    - frontend/src/lab/TableLab.tsx (default-flip: slim+craft ON by default)
    - tools/table-3d/grep-check-tp4-05.cjs (flag map docs updated)
tech_stack:
  added: []
  patterns:
    - "Default-flip pattern: invert isCraft accumulator; ?rail=base restores pre-TP4 baseline"
    - "woodCoamingProfile() internal default 0.34→0.28 (approved slim as the new baseline)"
key_files:
  created:
    - docs/table-3d/TP4_OPERATOR_GATE.md
  modified:
    - frontend/src/lab/TableLab.tsx
    - tools/table-3d/grep-check-tp4-05.cjs
    - docs/table-3d/SCORECARD_TABLE_3D.md
decisions:
  - "Operator gate APPROVED -- slim+craft shipped as the new DEFAULT render; no flag required"
  - "woodCoamingProfile() internal default updated 0.34→0.28 (slim is the TP4 baseline)"
  - "isCraft accumulator inverted: ON by default (!isBase && railFlag !== slim)"
  - "?rail=base added: restores full pre-TP4 look (yTop 0.34 + no craft)"
  - "Per-lever sub-flags preserved: ?rail=welt, ?rail=normals, ?rail=brass still work for isolation"
  - "Lever E (UV remap) confirmed DROPPED -> TP7 geometry pass"
  - "Scorecard: wood coaming 3->4, brass 3->4, tactility 3->4 (leather rail held at 4)"
  - "AAA(5) for all rail elements deferred: AO (TP6) + grain alignment (TP7)"
metrics:
  duration: "~35 min"
  completed_date: "2026-06-12"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 4
---

# Phase 5 Plan 04: TP4 Operator Gate + Default Flip Summary

**One-liner:** TP4 operator gate APPROVED (slim + 5 craft levers D/C/B/F/A); slim+craft shipped as the new default render; ?rail=base added for pre-TP4 A/B; scorecard wood coaming + brass + tactility all lift 3→4.

---

## Operator Verdict

**APPROVED — SLIM + CRAFT.** Both SSOT gate questions answered YES:

1. **(CONTOUR)** Surgical slim (woodCoamingProfile yTop 0.34→0.28, −18%) recovers edge elegance WITHOUT losing material/mass.
2. **(CRAFT)** 5 passing craft levers (D-brass, C-leather-normal, B-wood-normal, F-curved-volume, A-welt) read as restrained craft, not overworked.

0 reverts. 0 iterations.

---

## What Shipped vs What Was Dropped

| Lever | Plan | Disposition |
|-------|------|-------------|
| Slim (yTop 0.28) | 05-02 | SHIPPED as default (was ?rail=slim; now ON by default) |
| D — Brass aged-brass | 05-03 | SHIPPED as default |
| C — Leather normalMap | 05-03 | SHIPPED as default |
| B — Wood normalMap | 05-03 | SHIPPED as default |
| F — Volume outer wall | 05-03 | SHIPPED as default (baked into B) |
| A — Welt geometry | 05-03 | SHIPPED as default |
| E — UV arc-length remap | 05-03 | DROPPED → TP7 |

---

## Default Flip

The operator chose to ship the full TP4 look as the DEFAULT (no flag required):

- **Before 05-04:** Default = pre-TP4 look (yTop 0.34, no craft); approved look behind `?rail=slim` + `?rail=craft`
- **After 05-04:** Default = TP4 approved look (yTop 0.28 slim + all craft levers ON); `?rail=base` restores pre-TP4

The default render now matches exactly what the operator approved at `?cam=hero&rail=craft` + `?cam=rail&rail=slim` (slim and craft verified independently; Pitfall 7 — never combined in a single URL).

---

## HARD Gates Confirmation

| Gate | Value | Threshold | Status |
|------|-------|-----------|--------|
| M4 brass roughness | 0.42 | 0.38–0.45 | PASS |
| M4 brass HSV | H≈39°/S≈0.38/V≈0.67 | H 35–48°/S≤0.55/V≤0.80 | PASS |
| M10 HERO draws | 106 (105+1 welt) | < 150 | PASS |
| grep-check-tp4-05.cjs | exits 0 (7/7) | exit 0 | PASS |
| vitest | 398/398 green | all green | PASS |
| tsc src/lab/ | 0 errors | 0 errors | PASS |
| bodyProfile() | READ-ONLY (not touched) | inviolate | PASS |
| felt/cards/chips/cameras | UNTOUCHED | inviolate | PASS |

---

## Scorecard Delta

| Element | TP0 Baseline | Post-TP4 | Basis |
|---------|:------------:|:--------:|-------|
| **wood coaming** | **3** | **4** | Slim + woodNapNormalMap volume gradient; top-highlight/underside-shadow read confirmed |
| **leather rail** | **4** | **4** | Held; craft upgrade (leatherNapNormalMap + welt) confirmed at 4; AAA(5) awaits AO (TP6) |
| **brass** | **3** | **4** | Lever D: roughness 0.42, envMapIntensity 0.45; M4 PASS; reads aged-not-shiny |
| **tactility** | **3** | **4** | 5 craft levers together: welt crease + leather grain + wood grain + aged brass all readable without a label |

No score regression from TP3 column. Baseline column unchanged (TP0 lock immutable).

**AAA(5) deferrals:** all rail/brass/tactility AAA(5) gated on TP6 AO (crevice darkening) + TP7 geometry/texture pass (per-arc UV, hairline-scratch normalMap).

---

## Gate Record

Full record: `docs/table-3d/TP4_OPERATOR_GATE.md`

A/B basis: `.dev-stack/diag/table-3d/tp4/gate/` captures vs `docs/table-3d/anchors/tp4-base/{hero,rail}.png`

Anchor provenance: The SSOT-named `elev/` reference frames do not exist on disk. Verdict issued against available corpus + operator on-device memory. Recorded honestly as a non-blocking gap.

---

## Task Commits

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| Default flip | Ship TP4 slim+craft as default; add ?rail=base | da3bcbc | DONE |
| grep-check update | Update flag map docs + CHECK 7 description | 1a1a624 | DONE |
| Gate doc + scorecard | TP4_OPERATOR_GATE.md + SCORECARD_TABLE_3D.md delta | c627b47 | DONE |

---

## Deviations from Plan

None — plan executed exactly as written. The operator gave an unambiguous APPROVED verdict
("APPROVED — SLIM + CRAFT"); no stop-on-ambiguous was triggered; no lever reverts were needed.

The default-flip is a faithful execution of the operator's ship instruction: "make the slim+craft
look the default render". Pitfall 7 (never combine ?rail=slim with ?rail=craft in one URL) is
preserved — the per-lever isolation paths still work correctly.

---

## Known Stubs

None. The default render now shows the operator-approved look without any flag. No data sources,
no UI stubs, no placeholders.

---

## Threat Flags

None. Lab-only route (`/table-lab.html`, dev-server-only per SSOT §5.8). No network endpoints,
no auth surface, no prod build involvement.

---

## Phase 5 / TP4 Status

**COMPLETE.** Phase 5 / TP4 — Rail & Contour Elegance — closes with operator gate APPROVED.

- 05-01: Baseline capture + elegance verdict (lost-in-specific-respect) ✅
- 05-02: Surgical slim (woodCoamingProfile yTop 0.34→0.28) ✅
- 05-03: Craft levers (Levers A/B/C/D/F structural PASS; Lever E dropped) ✅
- 05-04: Operator gate APPROVED — slim+craft shipped as default ✅

Milestone: **5/10 phases (50%)** — TP0 through TP4 COMPLETE.

**Next:** Phase 6 / TP5 — Iluminación & Sombras (unified warm light, per-material specular, PCSS grounding).

---

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `docs/table-3d/TP4_OPERATOR_GATE.md` | FOUND |
| `docs/table-3d/SCORECARD_TABLE_3D.md` (TP4 entries) | CONFIRMED |
| `frontend/src/lab/TableLab.tsx` default-flip | CONFIRMED |
| `tools/table-3d/grep-check-tp4-05.cjs` updated | CONFIRMED |
| grep-check exits 0 | PASS |
| vitest 398/398 green | PASS |
| tsc src/lab/ clean | PASS |
| bodyProfile() untouched | CONFIRMED |
| felt/cards/chips/cameras untouched | CONFIRMED |
| Baseline column in SCORECARD untouched | CONFIRMED |
| Commits da3bcbc + 1a1a624 + c627b47 | FOUND |
| LOCAL only — nothing pushed/deployed/merged | CONFIRMED |
