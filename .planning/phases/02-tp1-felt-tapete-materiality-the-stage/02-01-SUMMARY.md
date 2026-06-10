---
phase: 02-tp1-felt-tapete-materiality-the-stage
plan: 01
subsystem: lab / foundation
tags: [tp1, rollback-tag, aoMap-uv, sobel, normal-map-helper, vitest]

# Dependency graph
requires:
  - phase: 01 (TP0)
    provides: frozen baseline + eval kit + the protected reference floor
provides:
  - rollback tag `tp1-before-felt` @ pre-edit HEAD ecb1822 (LOCAL, never pushed/deleted)
  - A1 RESOLVED → docs/table-3d/TP1_A1_AOMAP_UV.md (decision A1-uv1)
  - frontend/src/lab/normalMapHelper.ts — shared height→normal Sobel helper (FIRST USE)
affects: [02-02, 02-03, TP3, TP4, TP5]

# Tech tracking
tech-stack:
  added: []   # no new packages (three 0.169 already has everything)
  patterns:
    - "Shared height→normal helper: a PURE core (heightDataToNormalData, RGBA arrays, no canvas) + thin canvas glue — the pure core holds all logic and is unit-testable in happy-dom"
    - "Normal-map CanvasTexture forced to NoColorSpace (never sRGB) — Pitfall 7"

key-files:
  created:
    - frontend/src/lab/normalMapHelper.ts
    - frontend/src/lab/normalMapHelper.test.ts
    - docs/table-3d/TP1_A1_AOMAP_UV.md
  modified: []

key-decisions:
  - "Rollback tag `tp1-before-felt` cut at the pre-edit HEAD (ecb1822) BEFORE any edit (SSOT §5.3). LOCAL."
  - "A1 (aoMap UV channel in three 0.169) RESOLVED = **A1-uv1**: aoMap reads UV channel 0 (`uv`) — the `AOMAP_UV` define resolves to `uv`; NO `uv2` attribute / no geometry.setAttribute needed. 02-03 wires aoMap + aoMapIntensity directly. (The 'needs uv2' assumption was ≤r152.) Fallbacks documented: A1-uv2 / A1-albedo."
  - "Sobel helper split into a PURE array→array core + canvas glue so the logic is unit-testable (happy-dom has no 2D canvas context)."

patterns-established:
  - "Pure-core/canvas-glue split for any future texture-data helper (TP3/TP4/TP5 reuse normalMapHelper)."

requirements-completed: []   # SSOT §5.3 (rollback tag) + §5.9 (shared helper, first use)

# Metrics
completed: 2026-06-10
---

# Phase 2 Plan 01: TP1 Foundation Summary

**Per-phase rollback tag cut, the aoMap-UV unknown (A1) resolved from the three.js 0.169 source (A1-uv1 — no uv2 needed), and the shared height→normal Sobel helper introduced (FIRST USE) with a pure, unit-tested core.**

## Accomplishments

- **Task 1 — rollback tag + A1 (commit `bb47d50`):** cut `tp1-before-felt` at the pre-edit HEAD `ecb1822` (LOCAL, SSOT §5.3). Resolved A1 by reading `aomap_pars_fragment.glsl.js` + the program parameters in three 0.169: aoMap uses the `AOMAP_UV` define which resolves to channel 0 (`uv`) → **A1-uv1, no `uv2` attribute needed**. Recorded the decision + the two unused fallback branches in `docs/table-3d/TP1_A1_AOMAP_UV.md`.
- **Task 2 — shared Sobel helper (commit `d218e78`):** `frontend/src/lab/normalMapHelper.ts` (FIRST USE per SSOT §5.9) — a PURE core `heightDataToNormalData(rgbaHeight, W, H, strength)` (no canvas) plus thin canvas glue (`heightToNormalMap`, `makeHeightCanvas`, `toNormalMapTexture`). Tangent-space encoding, wrapping boundary (seam-free tiling), NoColorSpace normal texture. **9/9 Vitest green.** Reusable by TP3/TP4/TP5.

## Task Commits

1. **Task 1: rollback tag + A1 resolution** — `bb47d50` (docs)
2. **Task 2: Sobel helper + unit test** — `d218e78` (feat)

## Deviations from Plan

**[orchestrator recovery] The first executor pass truncated mid-Task-2 and left a canvas-based test failing 16/17.**
- **Found during:** Task 2 (the executor's return was cut off at "Now let me write the Vitest test file"; spot-check showed the helper + test present but uncommitted and the test failing 16/17).
- **Root cause:** happy-dom's `canvas.getContext("2d")` returns `null` — the helper + test were built on canvas (getImageData/fillRect), which cannot run in the happy-dom test environment ("expected null to be truthy" / "Cannot set properties of null (setting 'fillStyle')"). The TP0 analog `cards.test.ts` tests PURE functions for exactly this reason.
- **Fix (root, not symptom):** refactored `normalMapHelper.ts` to extract the PURE Sobel core `heightDataToNormalData` (RGBA arrays in/out, no canvas) — all the logic — and made `heightToNormalMap` thin canvas glue around it. Rewrote `normalMapHelper.test.ts` to unit-test the pure core directly with plain arrays (flat→up-normal, B≥128, R/G range, strength=0, ramp sign) + the `toNormalMapTexture` NoColorSpace invariant via a bare canvas element. The runtime canvas API (used by 02-02/02-03) is unchanged.
- **Verification:** `npx vitest run src/lab/normalMapHelper.test.ts` → 9/9 green; `tsc --noEmit` clean for the lab files.
- **Impact:** none on plan scope — same helper + same test intent, just the happy-dom-compatible design the VALIDATION ("pure math, deterministic") always implied.

## Next Phase Readiness

- 02-02 (textures) can import `normalMapHelper` for the concentric nap normalMap + the edge AO map, and wire aoMap per **A1-uv1** (no uv2 ref).
- No push/deploy/merge; lab-only; eval kit untouched.

## Self-Check: PASSED

`tp1-before-felt` tag exists @ ecb1822; `normalMapHelper.ts` + `.test.ts` + `TP1_A1_AOMAP_UV.md` on disk; commits `bb47d50` + `d218e78` in git history; vitest 9/9 green; lab tsc clean. LOCAL only.

---
*Phase: 02-tp1-felt-tapete-materiality-the-stage*
*Completed: 2026-06-10*
