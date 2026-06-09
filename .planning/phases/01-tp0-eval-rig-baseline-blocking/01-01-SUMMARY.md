---
phase: "01-tp0-eval-rig-baseline-blocking"
plan: "01"
subsystem: "table-3d-eval-rig"
tags: ["tp0", "eval-rig", "harness", "playwright", "baseline", "scaffolding"]
dependency_graph:
  requires: []
  provides:
    - "frontend/node_modules installed — Vite dev server boots"
    - ".dev-stack/lab-shot.mjs restored — Playwright D3D11 capture harness operational"
    - "docs/table-3d/anchors/ — tracked anchor corpus dir (wave-3 plans 03/04 write here)"
    - "docs/table-3d/anchors/controls/ — tracked control-frame dir (wave-3 plans 03/04)"
    - "tools/table-3d/ — tracked metric-instrument dir (wave-3 plans 03/04)"
    - "tp0-before-rig — per-phase rollback tag at pre-edit HEAD"
    - "docs/table-3d/TP0_BASELINE.md — frozen-rig record skeleton"
  affects:
    - "All subsequent TP0 plans depend on the booting dev server + working harness"
    - "Wave-3 plans (03 | 04) depend on pre-existing tracked dirs from this plan"
tech_stack:
  added: []
  patterns:
    - "Playwright + D3D11 GPU headless capture (existing harness, restored)"
    - "sharp@0.34.5 at repo ROOT for pixel-math (no new install)"
    - "Tracked .gitkeep dirs for corpus + instrument persistence"
key_files:
  created:
    - docs/table-3d/anchors/.gitkeep
    - docs/table-3d/anchors/controls/.gitkeep
    - tools/table-3d/.gitkeep
    - docs/table-3d/TP0_BASELINE.md
  modified:
    - frontend/node_modules (installed — 226 packages)
  restored:
    - .dev-stack/lab-shot.mjs (gitignored — copied from main checkout)
decisions:
  - "Rollback tag cut at f807d6f BEFORE any edits (SSOT 5.3)"
  - "Harness restored by single-file copy from main checkout (not re-authored)"
  - "smoke PNGs written to gitignored .dev-stack/diag/ scratch only — no anchor committed"
  - "Tracked dirs created here (wave-1) so wave-3 plans only write, never race on creation"
metrics:
  duration: "4 min 20 sec"
  completed_date: "2026-06-09"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
---

# Phase 1 Plan 01: TP0 Eval Rig Foundation — Baseline & Blocking Summary

**One-liner:** Installed 226 frontend deps, restored Playwright D3D11 harness, smoke-captured 3 money shots (2880x1800, ERRORS []) on RTX 4060, created 3 tracked rig dirs (.gitkeep), cut tp0-before-rig rollback tag, re-asserted prod-build isolation, authored TP0_BASELINE.md skeleton.

---

## Tasks Completed

| # | Task | Commit | Result |
|---|------|--------|--------|
| 1 | Install frontend deps + restore harness + create tracked rig dirs | `05df493` | DONE |
| 2 | Smoke-verify harness (3 money shots) + rollback tag + prod isolation + TP0_BASELINE.md | `970678a` | DONE |

---

## Verification Results

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| `cd frontend && npm install` | completes, 226 packages | 226 packages installed | PASS |
| `three/@react-three/fiber/react` resolve in frontend | resolve OK | PASS | PASS |
| `sharp` + `playwright` at repo ROOT | resolve OK | `root tooling OK` | PASS |
| `.dev-stack/lab-shot.mjs` present | present (gitignored) | present | PASS |
| `docs/table-3d/anchors/.gitkeep` | present, NOT gitignored | exit 1 from check-ignore | PASS |
| `docs/table-3d/anchors/controls/.gitkeep` | present, NOT gitignored | exit 1 from check-ignore | PASS |
| `tools/table-3d/.gitkeep` | present, NOT gitignored | exit 1 from check-ignore | PASS |
| No sharp/playwright in `frontend/package.json` | 0 matches | 0 matches | PASS |
| HERO smoke: 2880x1800, ERRORS [] | 2880x1800, ERRORS [] | 2880x1800, D3D11, ERRORS [] | PASS |
| POV smoke: 2880x1800, ERRORS [] | 2880x1800, ERRORS [] | 2880x1800, D3D11, ERRORS [] | PASS |
| MACRO smoke: 2880x1800, ERRORS [] | 2880x1800, ERRORS [] | 2880x1800, D3D11, ERRORS [] | PASS |
| `tp0-before-rig` tag exists | tag present | tag present @ f807d6f | PASS |
| `vite.config.ts` — no table-lab/rollupOptions/input | grep-L lists file | ISOLATION OK | PASS |
| `docs/table-3d/TP0_BASELINE.md` | exists with HEAD SHA + isolation proof | exists | PASS |
| Smoke PNGs ONLY in gitignored .dev-stack/ | no anchor committed | no anchor committed | PASS |

---

## Smoke Capture Evidence

| Shot | GPU | Dimensions | File size | ERRORS |
|------|-----|-----------|-----------|--------|
| HERO (`?cam=hero`) | NVIDIA RTX 4060 Laptop D3D11 | 2880x1800 | 4371 KB | [] |
| POV (`?cam=card`) | NVIDIA RTX 4060 Laptop D3D11 | 2880x1800 | 4360 KB | [] |
| MACRO (`?cam=macro`) | NVIDIA RTX 4060 Laptop D3D11 | 2880x1800 | 2981 KB | [] |

All 3 shots: exit 0, `ERRORS []`, 2880x1800, real D3D11 GPU (no SwiftShader).

---

## Deviations from Plan

None — plan executed exactly as written.

- The `lab-shot.mjs` copied cleanly (one file, no fallback needed).
- `npm install` completed without errors (226 packages, ~9 seconds).
- All three tracked dirs created and verified NOT gitignored (exit 1).
- Rollback tag cut before any edits per SSOT §5.3.
- The npm audit warnings (5 moderate, 2 high, 1 critical) are pre-existing frontend dep
  vulnerabilities unrelated to this plan's work — not introduced here, not in scope to fix.

---

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| "Frozen presets (verbatim)" section | `docs/table-3d/TP0_BASELINE.md` | Filled by plan 02 (TP0a-2: StatsProbe + operator gate). POV fov 37-vs-40 pending operator blessing. |
| "Draw-call / frame-time baseline" section | `docs/table-3d/TP0_BASELINE.md` | Filled by plan 06 (post operator gate). `?stats` StatsProbe is plan 02's deliverable. |

These stubs are **intentional** — the SSOT mandates that the baseline freeze and preset lock
happen AFTER the operator perceptual gate (irreversibility ordering constraint). The TP0_BASELINE.md
skeleton is the correct deliverable for this wave-1 plan.

---

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced.
Only filesystem scaffolding (gitkeep dirs + doc) and npm install of pre-approved, pre-existing
`frontend/package.json` deps.

T-01-01 (lab isolation): Re-asserted — `vite.config.ts` has no `table-lab` input (ISOLATION OK).
T-01-02 (repo bloat): Smoke PNGs in gitignored scratch only — no PNG committed.
T-01-03 (protected tag): Only read the SHA (`d17df37`) — not mutated.
T-01-04 (parallel dir race): All 3 tracked dirs created in this wave-1 plan.
T-01-SC (npm slopcheck): 0 new packages introduced — only pre-existing `package.json` deps installed.

---

## Self-Check

Files created exist:
- `[ FOUND ]` docs/table-3d/anchors/.gitkeep
- `[ FOUND ]` docs/table-3d/anchors/controls/.gitkeep
- `[ FOUND ]` tools/table-3d/.gitkeep
- `[ FOUND ]` docs/table-3d/TP0_BASELINE.md

Commits exist:
- `[ FOUND ]` 05df493 — Task 1 (tracked dirs + harness restore + frontend deps)
- `[ FOUND ]` 970678a — Task 2 (TP0_BASELINE.md + smoke verification + isolation proof)

## Self-Check: PASSED
