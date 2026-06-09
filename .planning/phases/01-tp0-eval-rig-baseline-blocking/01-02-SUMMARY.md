---
phase: 01-tp0-eval-rig-baseline-blocking
plan: 02
subsystem: eval-rig
tags: [stats-probe, zero-visual-change, frozen-presets, scorecard, tp0]
dependency_graph:
  requires: [01-01]
  provides: [StatsProbe, window.__labStats, frozen-preset-record, 15-element-scorecard]
  affects: [docs/table-3d/TP0_BASELINE.md, docs/table-3d/SCORECARD_TABLE_3D.md]
tech_stack:
  added: []
  patterns:
    - "useThree+useFrame null-render probe (dependency-free gl.info reader, no drei <Stats>)"
    - "?stats URL-gating pattern (qp('stats') !== null → conditional mount)"
    - "md5 byte-identity zero-visual-change proof (node crypto)"
key_files:
  created:
    - frontend/src/lab/StatsProbe.tsx
    - frontend/src/lab/StatsProbe.test.ts
    - docs/table-3d/SCORECARD_TABLE_3D.md
  modified:
    - frontend/src/lab/TableLab.tsx
    - docs/table-3d/TP0_BASELINE.md
decisions:
  - "StatsProbe uses useRef-backed rolling window (16 frames) for median frame-time — avoids global mutable state"
  - "Test strategy: mock React useRef + r3f hooks and call StatsProbe() as a plain function — avoids needing a React renderer for a null-rendering probe"
  - "Zero-visual-change proven via md5 on ?cam=card captures (3b7480d7d1a9bab8c6f015637fe93b79 identical both ways)"
  - "Scorecard baseline column uses _TP0_ placeholders — operator fills them at plan 05/06 gate after on-device confirmation"
  - "POV fov recorded as 40 (code reality) with explicit note that 37 is the operator-gate candidate for plan 05"
metrics:
  duration: "~12 min"
  completed: "2026-06-09"
  tasks_completed: 2
  files_modified: 5
---

# Phase 1 Plan 02: ?stats StatsProbe + Frozen Presets + AAA Scorecard Summary

**One-liner:** Dependency-free null-rendering `?stats` draw-call+frame-time probe (StatsProbe.tsx, returns null, writes window.__labStats), zero-visual-change proven via md5, 3 camera presets frozen verbatim from code (HERO fov 32 / POV fov 40 / MACRO fov 26), and 15-element AAA scorecard authored.

---

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Add dependency-free ?stats StatsProbe (renders null) + gated mount | `c9ef9a8` | StatsProbe.tsx, StatsProbe.test.ts, TableLab.tsx |
| 2 | Prove zero-visual-change + freeze presets verbatim + author scorecard | `28f1984` | TP0_BASELINE.md, SCORECARD_TABLE_3D.md |

---

## Deliverables

### StatsProbe.tsx (TP0a-3)

- Reads `gl.info.render.calls` (M10) and a rolling 16-frame median frame-time (M11) via `useThree((s)=>s.gl)` + `useFrame`
- Writes `window.__labStats = { calls, medianFrameMs }` each frame — readable by the harness via `page.evaluate()`
- Returns `null` — renders ZERO pixels on-canvas (T-02-01 mitigated)
- No `drei <Stats>` / `<PerfMonitor>` (verified: grep over non-comment lines == 0)
- Mounted in `TableLab.tsx` only when `qp("stats") !== null` (line 754) — default scene untouched

### Tests (StatsProbe.test.ts)

8/8 tests pass (`npx vitest run src/lab/StatsProbe.test.ts`):
- Test 1: `StatsProbe()` returns `null` (null-render contract)
- Tests 2–3: `window.__labStats` has numeric `calls` + `medianFrameMs` after two frames
- Tests 4–8: `?stats` URL predicate (present/absent cases)

### Zero-visual-change proof (M9)

md5(`?cam=card` without `?stats`) == md5(`?cam=card` with `?stats`) == `3b7480d7d1a9bab8c6f015637fe93b79`

Determinism (M9) also confirmed: two consecutive `?cam=card` runs → same md5.

Scratch PNGs: `.dev-stack/diag/table-3d/tp0-smoke/card-nostats.png` + `card-stats.png` (gitignored).

### Frozen presets (TP0_BASELINE.md — TP0a-2)

Three presets recorded verbatim from `TableLab.tsx:616–631`:

| Shot | Preset key | Position | Target | FOV (code) | Line |
|------|------------|----------|--------|-----------|------|
| HERO | `hero` | `[1.2, 5.0, 8.2]` | `[0, 0.5, 0]` | **32** | 620 |
| POV  | `card` | `[0, 4.7, 10.6]` | `[0, 0.25, 1.2]` | **40** | 618 |
| MACRO | `macro` | `[-1.7, 1.7, 2.4]` | `[-1.55, 0.05, 1.05]` | **26** | 623 |

POV fov 40: the candidate refinement to 37 is explicitly flagged as an operator-gate decision deferred to plan 05, per the SSOT ordering constraint. NOT baked.

Staged scene frozen: `LAB_COMMUNITY=["1E","12C","11B"]`, `LAB_HOLE=["10O","7O"]` (TableLab.tsx:60–61), demoted pot `group[2.7,0,1.5] scale 0.66` (line 702), no-6th-card invariant.

### 15-element AAA scorecard (SCORECARD_TABLE_3D.md — TP0a-5)

Elements: felt · cards · chips · leather rail · wood coaming · brass · body/contour · lighting · shadows · depth · composition · cameras · tactility · social-read · premium-overall

Each row has: 0–5 rubric with anchor descriptions at 0/3/5, baseline `_TP0_` placeholder, target `≥ 4`, anchor-shot mapping. Operator fills baselines at plan 05/06.

---

## Verification Outcomes

| Check | Result |
|-------|--------|
| `npx vitest run src/lab/StatsProbe.test.ts` | PASS — 8/8 |
| `StatsProbe.tsx` returns `null` | CONFIRMED (line 61) |
| No `drei <Stats>/<PerfMonitor>` (non-comment) | CONFIRMED (grep == 0) |
| `qp("stats")` gated mount in TableLab.tsx | CONFIRMED (line 754) |
| md5(`card-nostats`) == md5(`card-stats`) | PASS — `3b7480d7d1a9bab8c6f015637fe93b79` |
| Determinism M9 (two runs identical) | PASS — same md5 |
| TP0_BASELINE.md: all 3 presets recorded with fov values | PASS |
| TP0_BASELINE.md: fov-37 flagged as operator-gate candidate | PASS |
| SCORECARD_TABLE_3D.md: 15 element rows (grep `^|` >= 15) | PASS — 30 rows |
| No geometry/light/material added to default scene (M7) | CONFIRMED |
| No deletions in either commit | CONFIRMED |

---

## Deviations from Plan

None — plan executed exactly as written. The only reality-vs-plan note is that the POV fov (40, not 37) was already known from 01-RESEARCH.md and handled correctly: recorded as 40 with the 37-candidate flag, per the ordering constraint.

---

## Threat Model Status

| Threat | Disposition | Evidence |
|--------|-------------|---------|
| T-02-01: StatsProbe renders into canvas | MITIGATED | Returns null + md5 proof |
| T-02-02: TableLab default scene altered | MITIGATED | qp("stats") gate; no geometry/light added; md5 unchanged |
| T-02-03: Metric reading contaminated frame | MITIGATED | Zero-pixel overlay confirmed via md5 |
| T-02-04: drei Stats widget in captured image | MITIGATED | Not imported; grep clean |

---

## Known Stubs

- `window.__labStats` is populated only when the dev server is running and `?stats` is in the URL. It is intentionally absent in the default captured scene (that is the invariant, not a stub).
- Scorecard baseline column: `_TP0_` placeholders are intentional — they await operator scoring at plan 05/06 perceptual gate.

---

## Self-Check: PASSED

Files created/modified — all found:
- `frontend/src/lab/StatsProbe.tsx` FOUND
- `frontend/src/lab/StatsProbe.test.ts` FOUND
- `frontend/src/lab/TableLab.tsx` FOUND
- `docs/table-3d/TP0_BASELINE.md` FOUND
- `docs/table-3d/SCORECARD_TABLE_3D.md` FOUND

Commits — all found:
- `c9ef9a8` FOUND (Task 1)
- `28f1984` FOUND (Task 2)
