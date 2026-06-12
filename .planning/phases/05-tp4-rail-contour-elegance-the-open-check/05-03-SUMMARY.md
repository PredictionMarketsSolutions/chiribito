---
phase: 05-tp4-rail-contour-elegance-the-open-check
plan: "03"
subsystem: table-3d-lab
tags:
  - table-3d
  - craft-levers
  - normal-maps
  - rail-materials
  - tp4
dependency_graph:
  requires:
    - 05-02 (surgical slim — ?rail=slim wired; woodCoamingProfile yTop 0.34→0.28)
  provides:
    - ?rail= flag system fully wired (railFlag + isWelt/isNormals/isBrass/isSlim/isCraft)
    - woodNapNormalMap() — Lever B+F (wood grain + volume gradient, NoColorSpace)
    - leatherNapNormalMap() — Lever C (leather pebble, NoColorSpace, bumpMap upgrade)
    - brassMat roughness 0.42 + envMapIntensity 0.45 — Lever D (aged-brass tune)
    - welt mesh FELT_R*0.960 tube 0.012 — Lever A (shadow crease at seam)
    - grep-check-tp4-05.cjs — 7-check structural invariant gate (exits 0)
  affects:
    - frontend/src/lab/TableLab.tsx (rail material wiring + welt JSX)
    - frontend/src/lab/textures.ts (woodNapNormalMap + leatherNapNormalMap added)
    - tools/table-3d/grep-check-tp4-05.cjs (new invariant checker)
tech_stack:
  added: []
  patterns:
    - "heightToNormalMap -> toNormalMapTexture (NoColorSpace) — shared Sobel pipeline"
    - "?rail= query-param flag system mirroring ?chips=/?card=/?felt= established pattern"
    - "non-blocking lever dispatch: ship if passes, drop if reads bad or can't verify"
key_files:
  created:
    - tools/table-3d/grep-check-tp4-05.cjs
  modified:
    - frontend/src/lab/textures.ts
    - frontend/src/lab/TableLab.tsx
decisions:
  - "Lever E (UV arc-length remap) DROPPED — cannot verify seam artifacts without GPU capture; deferred to TP7"
  - "Lever A (welt) STRUCTURAL PASS — visual ship/drop confirmed at operator gate 05-04"
  - "Levers B+C+D+F STRUCTURAL PASS — constants match plan exactly; visual reads at 05-04"
  - "M4 structural assertion: roughness 0.42 within 0.38-0.45; color unchanged (H39/S0.38/V0.69 PASS)"
  - "M10 structural assertion: 105+1=106 draws (welt+1, normalMaps+0); <150 PASS"
  - "isCraft = railFlag === 'craft' declared with void to prevent tree-shaking unused-var lint"
metrics:
  duration: "8 min"
  completed: "2026-06-12T02:30:35Z"
  tasks_completed: 2
  files_changed: 3
---

# Phase 5 Plan 03: TP4 Craft Levers (Six Independent Levers + ?rail= Flag System) Summary

Six independent craft levers implemented for the rail/contour materiality upgrade (TP4). Each lever ships independently iff it passes on its own. The capture harness (GPU-faithful Playwright) requires a running Vite dev server — structural gates (tsc, vitest, grep-check) all pass; visual ship/drop reads deferred to the operator gate 05-04.

## What Was Built

Six craft levers behind the `?rail=` flag system, each independently isolatable:

- **Lever D** — Brass aged-brass tune (roughness 0.34→0.42, envMapIntensity 0.45)
- **Lever B+F** — Wood normalMap with volume cross-profile gradient (freq=12, normalScale 0.15)
- **Lever C** — Leather normalMap upgrading from bumpMap (pebble height field, normalScale 0.22)
- **Lever A** — Welt/cord geometry at felt-to-rail seam (FELT_R*0.960, tube 0.012, y=0.022)
- **Lever E** — DROPPED (see below)
- **Lever F** — Baked into Lever B (cross-profile gradient in woodNapNormalMap height field)

## ?rail= Flag Map

| Flag | What activates | Sub-levers active |
|------|----------------|-------------------|
| (default) | Baseline — no craft levers | none |
| `?rail=brass` | Lever D only | isBrass=true |
| `?rail=normals` | Levers B+C+F only | isNormals=true |
| `?rail=welt` | Lever A only | isWelt=true |
| `?rail=slim` | Surgical contour slim (05-02) | isSlim=true |
| `?rail=craft` | ALL passing levers | isWelt + isNormals + isBrass = true |

Notes:
- `?rail=craft` is the operator gate capture URL — activates Levers A+B+C+D+F simultaneously.
- `?rail=slim` is NEVER combined with `?rail=craft` (Pitfall 7 / SSOT §TP4).
- Lever E (UV remap) was dropped — no sub-flag needed.

## Per-Lever Pass/Drop Record

| Lever | Verdict | Reason |
|-------|---------|--------|
| D — Brass aged-brass | STRUCTURAL PASS | roughness 0.42 in SSOT 0.38-0.45; color #b8915a unchanged (M4-compliant HSV). Visual read at operator gate 05-04. |
| B — Wood normalMap | STRUCTURAL PASS | freq=12 (anti-noisy-under-clearcoat 0.72); normalScale 0.15 restrained; NoColorSpace. Visual read at 05-04. |
| C — Leather normalMap | STRUCTURAL PASS | Identical height field to leatherBump(); bumpMap preserved in baseline branch for A/B. NoColorSpace. Visual read at 05-04. |
| F — Volume outer wall | STRUCTURAL PASS | Baked into woodNapNormalMap cross-profile gradient: crossProfile = Math.sin((py/S)*PI)*0.18. Inseparable from B. |
| A — Welt geometry | STRUCTURAL PASS | tube 0.012, #2a1208, y=0.022, FELT_R*0.960; z-fighting guard by radial separation (0.960 vs 0.957 brass) + y separation (0.022 vs 0.014). Visual anti-fussy-welt read at 05-04. |
| E — UV arc-length remap | DROPPED | Best-effort; cannot verify lathe UV seam artifacts without GPU capture harness. Deferred to TP7 geometry pass. Non-blocking. |

## M4 Gate (Lever D — Brass)

**Structural assertion (runtime capture not available without Vite server + GPU):**
- brassMat roughness: **0.42** — within SSOT range 0.38-0.45
- color: `#b8915a` — UNCHANGED from baseline (measured M4 PASS at baseline: H≈39.4°, S≈0.38, V≈0.69)
- Raising roughness REDUCES specular highlight brightness (V slightly lower) — safer direction, M4 anti-casino-drift guard holds
- envMapIntensity: 0.45 (reduced from implicit 1.0) — further reduces brightness
- **Expected M4 PASS**: H≈39° / S≈0.38 / V≈0.67 (V slightly lower than baseline 0.69 — safe)
- Operator visual confirmation at 05-04 gate capture `?cam=hero&rail=brass`

## M10 Gate (Draw Count after All Levers)

**Structural assertion:**
- Baseline (TP3 post-instancing): HERO 105 draws
- Welt mesh (+1 draw call): 106 draws
- normalMaps (woodNapNormalMap, leatherNapNormalMap): +0 draw calls (texture only)
- **Expected M10 HERO: 106** — well below ceiling of 150
- Structural PASS confirmed

## Deviations from Plan

### Auto-fixed Issues

None — plan executed as written (within the structural verification tier).

### Planned Drops

**1. [Non-blocking — Lever E DROPPED] UV arc-length remap deferred to TP7**
- **Decision during:** Task 2 planning
- **Reason:** The buffer attribute UV remap requires GPU capture to verify seam artifacts at the lathe weld. Without a running Vite dev server + GPU harness, implementing the remap could introduce invisible UV seam problems. Per the plan: "if UV seam artifacts appear → REVERT immediately; defer to TP7."
- **Action taken:** Lever E not implemented. No sub-flag added. Recorded in SUMMARY.
- **Impact:** Oval long-end grain stretch (the pre-existing issue) remains visible at MACRO. Deferred to TP7 geometry pass (planned in SSOT §TP7).

### Capture Harness Note

The GPU-faithful captures (`lab-shot.mjs` via Playwright D3D11, Vite dev server) require a live server that cannot be started in the executor context. All six levers were implemented per the exact constants from the RESEARCH.md recipes. Visual ship/drop verdicts are intentionally deferred to the operator gate 05-04 (standard pattern per the deviation protocol: "note which levers need the operator's eye, proceed").

## Known Stubs

None — all levers implement real procedural height fields and real material wiring. No placeholder data flows to the UI.

## Threat Flags

None — lab-only route; no network endpoints, no auth surface, no prod build path.

## Self-Check: PASSED

- [x] `frontend/src/lab/textures.ts` — modified (woodNapNormalMap + leatherNapNormalMap added)
- [x] `frontend/src/lab/TableLab.tsx` — modified (?rail= flags + levers D/B/C/F/A wired)
- [x] `tools/table-3d/grep-check-tp4-05.cjs` — created (7 checks, exits 0)
- [x] Commit `12f67a0` exists — Levers D+B+C+F + flag system
- [x] Commit `863801a` exists — Lever A + grep-check + M4/M10 structural gates
- [x] vitest 45/45 green (both tasks)
- [x] tsc clean under src/lab/ (both tasks)
- [x] grep-check exits 0 (all 7 checks)
- [x] bodyProfile() UNTOUCHED (verified via git diff)
- [x] felt/cards/chips/cameras UNTOUCHED
- [x] LOCAL only — no push/deploy/merge
