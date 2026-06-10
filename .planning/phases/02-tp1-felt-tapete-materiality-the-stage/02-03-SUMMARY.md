---
phase: 02-tp1-felt-tapete-materiality-the-stage
plan: 03
subsystem: lab / material-swap
tags: [tp1, felt, MeshPhysicalMaterial, sheen, nap, anisotropy, aoMap, m3-pass, m5-pass, b-pass, metric-gates]

# Dependency graph
requires:
  - phase: 02-02
    provides: feltTexture(S=2048, vignette removed), feltNapNormalMap(), feltEdgeAoMap() factories
  - phase: 02-01
    provides: A1-uv1 decision (aoMap reads uv channel 0 — no uv2 attribute needed)
provides:
  - frontend/src/lab/TableLab.tsx felt default branch = MeshPhysicalMaterial (sheen/nap/aniso/aoMap)
  - .dev-stack/diag/table-3d/tp1/hero.png — GPU-faithful HERO capture (RTX 4060, ANGLE D3D11)
  - .dev-stack/diag/table-3d/tp1/macro.png — GPU-faithful MACRO capture
  - .dev-stack/diag/table-3d/tp1/card.png — GPU-faithful POV/card capture (fov40)
  - M3/M5/+B metric gates: ALL PASS over the fresh HERO (zero tuning iterations needed)
affects: [02-04]

# Tech tracking
tech-stack:
  added: []  # no new packages — three 0.169 already carries MeshPhysicalMaterial + sheen
  patterns:
    - "MeshPhysicalMaterial sheen+nap felt: three-branch debug-preserving swap in useMemo (leatherMat analog)"
    - "A1-uv1 aoMap wiring: aoMap + aoMapIntensity direct — no geometry change, no uv2 setAttribute"
    - "normalScale: Vector2(0.25, 0.25) start — +B PASS in first pass, no tuning needed"

key-files:
  created: []
  modified:
    - frontend/src/lab/TableLab.tsx

key-decisions:
  - "normalScale: Vector2(0.25, 0.25) — chosen over the 0.28 in 02-02's SUMMARY hint because the plan SSOT specifies 0.25 as start and +B PASS was immediate (0% sheen vs 8% threshold); no iteration"
  - "No uv2 / no geometry.setAttribute — confirmed A1-uv1: aoMap reads uv channel 0 by default in three.js 0.169; PlaneGeometry existing uv attribute sufficient"
  - "No computeTangents — three.js derives TBN from UV gradient automatically for anisotropy"
  - "Debug branches ?felt=magenta and ?felt=basic preserved verbatim (born-in discipline)"
  - "Captures in gitignored .dev-stack/diag/table-3d/tp1/ scratch — no promotion to anchors (TP9 promotes the final reference)"
  - "Eval kit untouched — git status shows tools/table-3d/ and .dev-stack/lab-shot.mjs clean"

patterns-established:
  - "felt-MeshPhysicalMaterial swap pattern: import two new factories, replace single branch, no JSX change needed (A1-uv1)"

requirements-completed: []  # TP1 gated by SSOT §TP1 acceptance + metric thresholds — no REQUIREMENTS.md IDs

# Metrics
duration: 8min
completed: 2026-06-10
---

# Phase 2 Plan 03: TP1 Wave 3 — Felt MeshPhysicalMaterial Swap Summary

**MeshPhysicalMaterial with Charlie sheen lobe (0.70), concentric nap normalMap, restrained anisotropy (0.25), and subtle AO edge-darken applied to the felt default branch; M3/M5/+B all PASS on a fresh RTX 4060 GPU-faithful HERO capture — zero tuning iterations.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-10T~16:45Z
- **Completed:** 2026-06-10T~16:53Z
- **Tasks:** 2
- **Files modified:** 1 (frontend/src/lab/TableLab.tsx)

## Accomplishments

- **Task 1 — felt material swap (commit `216952f`):** Replaced the default (third) branch of the felt `useMemo` from `MeshStandardMaterial` to `MeshPhysicalMaterial` in `frontend/src/lab/TableLab.tsx`. Added `feltNapNormalMap` and `feltEdgeAoMap` to the existing textures import. Material values: `sheen: 0.70`, `sheenColor: #2aad7a`, `sheenRoughness: 0.65`, `anisotropy: 0.25`, `anisotropyRotation: 0`, `roughness: 0.93`, `normalScale: Vector2(0.25, 0.25)`, `aoMap + aoMapIntensity: 0.18` (A1-uv1 direct — no uv2). Debug branches `?felt=magenta` and `?felt=basic` preserved verbatim. `npx tsc --noEmit` clean for `src/lab/` (pre-existing game-tree errors in `card-popover.ts`, `token-monitor.ts`, `connection.ts` are confirmed pre-existing debt, unrelated to this plan).

- **Task 2 — captures + M3/M5/+B gates:** Captured three GPU-faithful frames into the gitignored scratch dir `.dev-stack/diag/table-3d/tp1/`:
  - `hero.png` — `?cam=hero`, RTX 4060, ANGLE D3D11, ERRORS [], 2880×1800
  - `macro.png` — `?cam=macro`, RTX 4060, ANGLE D3D11, ERRORS [], 2880×1800
  - `card.png` — `?cam=card` (fov40), RTX 4060, ANGLE D3D11, ERRORS [], 2880×1800

  Metric gate run (`node tools/table-3d/run-metrics.mjs .dev-stack/diag/table-3d/tp1`):

  | Metric | Verdict | Value | Threshold |
  |--------|---------|-------|-----------|
  | M3 (felt-hue ΔE) | **PASS** | 10.68 | < 12 |
  | M5 (highlight-clip) | **PASS** | feltClipPct=0 | < 0.5% |
  | +B (fuzz-not-satin) | **PASS** | 0% | ≤ 8% |
  | M4 (brass-not-gold) | PASS | (informational) | — |
  | M6 (contact-shadow) | PASS | (informational) | — |
  | M8 (vignette) | FAIL | 88.87 | (informational — TP6) |
  | +A (warm-corner) | FAIL | (informational — TP6) | — |

  No tuning iterations needed. M8/+A are pre-established informational metrics (TP6 deliverables), not TP1 gates.

## Task Commits

1. **Task 1: felt MeshPhysicalMaterial swap** — `216952f` (feat)
2. **Task 2: captures + gates** — no commit (gitignored scratch artifacts only; eval kit untouched)

## Files Created/Modified

- `frontend/src/lab/TableLab.tsx` — felt default branch: MeshStandardMaterial → MeshPhysicalMaterial; import additions (feltNapNormalMap, feltEdgeAoMap)

## Final Material Values (in-band, locked)

| Property | Value | SSOT Band |
|----------|-------|-----------|
| sheen | 0.70 | 0.60–0.85 |
| sheenColor | #2aad7a | lighter Chiribito green |
| sheenRoughness | 0.65 | 0.55–0.80 |
| anisotropy | 0.25 | 0.15–0.40 |
| anisotropyRotation | 0 | — |
| roughness | 0.93 | 0.90–0.94 (anti-satin) |
| normalScale | 0.25 | 0.20–0.35 |
| aoMapIntensity | 0.18 | subtle band |
| metalness | 0 | — |
| envMapIntensity | 0.3 | unchanged |
| alphaTest | 0.5 | born-in discipline |

**Tuning iterations:** 0 (first-pass PASS on all three gates)

## Metric Gate Summary (M3/M5/+B)

- **M3 felt-hue ΔE:** 10.68 — PASS (threshold < 12). Sheen color #2aad7a kept close to the M3 anchor green range; no albedo gradient touched (per Pitfall 3 / D-03).
- **M5 highlight-clip on felt:** 0% clipped — PASS (threshold < 0.5%). roughness 0.93 + sheenRoughness 0.65 sufficiently diffuse; no specular blow-out.
- **+B fuzz-not-satin:** 0% luma>210 pixels on felt — PASS (threshold ≤ 8%). The felt reads as woven baize, not satin. Roughness 0.93 + contained sheen 0.70 within D-02 band is sufficient anti-casino protection.

## Capture Details

| File | Preset | Renderer | Errors | Dimensions |
|------|--------|----------|--------|------------|
| .dev-stack/diag/table-3d/tp1/hero.png | hero (fov32) | RTX 4060 / ANGLE D3D11 | [] | 2880×1800 |
| .dev-stack/diag/table-3d/tp1/macro.png | macro (fov26) | RTX 4060 / ANGLE D3D11 | [] | 2880×1800 |
| .dev-stack/diag/table-3d/tp1/card.png | card (fov40 POV) | RTX 4060 / ANGLE D3D11 | [] | 2880×1800 |

Captures stored in gitignored scratch dir. Not promoted to `docs/table-3d/anchors/` (TP9 promotes the final reference).

## Deviations from Plan

None — plan executed exactly as written. normalScale 0.25 (plan SSOT start value) required no tuning; +B PASS on first capture.

The 02-02 SUMMARY's "Next Phase Readiness" note suggesting normalScale 0.28 was advisory, not prescriptive. The plan's canonical start value of 0.25 produced a first-pass PASS so no adjustment was needed.

## Known Stubs

None — MeshPhysicalMaterial is fully wired with real factory-produced textures (feltTexture S=2048, feltNapNormalMap concentric rings, feltEdgeAoMap radial AO). No placeholder, mock, or empty values.

## Threat Flags

None — this is an offline lab-only material swap. No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Next Phase Readiness

- `02-04` (OPERATOR GATE — autonomous:false): materiality-only A/B at POV+MACRO.
  - `hero.png`, `macro.png`, `card.png` in `.dev-stack/diag/table-3d/tp1/` ready for operator A/B vs `docs/table-3d/anchors/head/` (the "before").
  - The felt never regresses below `docs/table-3d/anchors/reference-tag/` (M3 PASS preserves the green identity; +B PASS = fuzz not satin; roughness 0.93 = anti-casino hard floor).
  - Operator will judge: "tapete físico, castizo, táctil, premium — sin deriva a Vegas/casino" (D-05).
- No push/deploy/merge (manual-deploy invariant, LOCAL only).

## Self-Check: PASSED

- `frontend/src/lab/TableLab.tsx` contains `MeshPhysicalMaterial` at the felt branch (grep confirms).
- Import includes `feltNapNormalMap` and `feltEdgeAoMap`.
- sheen/sheenColor/sheenRoughness/anisotropy/normalMap/aoMap all present with in-band values (grep-confirmed above).
- Debug branches `feltKind === "magenta"` (count=1) and `feltKind === "basic"` (count=1) preserved.
- `computeTangents` not present (count=0).
- Commit `216952f` in git history (verified).
- 3 captures in `.dev-stack/diag/table-3d/tp1/` (hero.png ~4.9MB, macro.png ~3.5MB, card.png ~4.9MB).
- M3/M5/+B all PASS (metric run output above).
- Eval kit files (`tools/table-3d/`, `.dev-stack/lab-shot.mjs`) clean (`git status` empty).
- No new lab TypeScript errors.
- No push/merge/deploy.

---
*Phase: 02-tp1-felt-tapete-materiality-the-stage*
*Completed: 2026-06-10*
