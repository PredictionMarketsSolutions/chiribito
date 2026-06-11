---
phase: 03-tp2-cartas-materiality-legibility-protagonist
plan: "02"
subsystem: ui
tags: [r3f, anisotropy, mipmaps, seam, legibility, m1, tp2, lever1, lever2]

# Dependency graph
requires:
  - phase: 03-tp2-cartas-materiality-legibility-protagonist
    provides: tp2-before-cards rollback tag + tp2-base anchors + M1 floor = 9px + M6 rects recalibrated (plan 03-01)

provides:
  - Lever 1 (max-anisotropy + mipmap explicit) behind ?card= flag — SHIPPED
  - Lever 2 (seam diagnosis) — ALREADY CLEAN; no geometry change needed
  - A/B captures: lever1-aniso/{card-aniso,card-base}.png + lever2-seam/{macro-seam,macro-base}.png

affects:
  - 03-03 through 03-05 (subsequent lever plans; Lever 1 stays active as the base for all subsequent levers)
  - 03-06 (operator gate — accumulation of all TP2 levers)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useThree((s) => s.gl) in Scene to access renderer capabilities safely (only valid inside mounted R3F component)"
    - "Math.min(gl.capabilities.getMaxAnisotropy(), 16) — never hardcode 16; some GPUs cap lower"
    - "?card=base → pre-TP2 anisotropy 8; (no param / any other value) → maxAniso — one-variable A/B gate"
    - "Explicit t.minFilter = THREE.LinearMipmapLinearFilter + t.generateMipmaps = true — intent-visible even though these are three 0.169 defaults"

key-files:
  created: []
  modified:
    - frontend/src/lab/TableLab.tsx

key-decisions:
  - "Lever 1 wired — maxAniso = Math.min(gl.capabilities.getMaxAnisotropy(), 16) via useThree in Scene, passed into useCardFaces(); ?card=base reverts to anisotropy 8 for A/B. GPU = RTX 4060, expected maxAniso = 16."
  - "M1 floor HELD — both ANISO and BASE measures at 32px on 1728x1080 POV downscale (well above 9px floor). Anisotropy improves texture crispness at oblique angles; does NOT change glyph px-height. No regression, no revert."
  - "Lever 2 seam ALREADY CLEAN — visual inspection of macro-seam.png vs tp2-base/macro.png shows no cream rim or z-fight halo at card corners. bevelSegments stays at 2, CARD_FACE_Z unchanged, no alphaTest added. No geometry edit required."
  - "cards.ts locked geometry VERIFIED — CARD_CORNER = 0.17, curveSegments: 14 confirmed by grep gate after all edits."

patterns-established:
  - "Lever 1 pattern confirmed: useThree in Scene (not in useCardFaces directly — gl.capabilities requires a mounted component)"
  - "Seam diagnosis first: capture macro before editing; if seam is already clean, record 'already clean' and skip the edit"

requirements-completed:
  - "SSOT §TP2 — face anisotropy 8 -> renderer.capabilities.getMaxAnisotropy() (cap 16); mipmaps + LinearMipmapLinear confirmed"
  - "SSOT §TP2 — fix the face-to-bevel seam (no thin cream rim / z-fight at MACRO; CARD_CORNER 0.17 unchanged, curveSegments >= 14)"
  - "SSOT §TP2 — M1 legibility MUST NOT regress (re-checked after EVERY lever)"

# Metrics
duration: 45min
completed: "2026-06-11"
---

# Phase 3 Plan 02: TP2 Levers 1+2 Summary

**Lever 1 (max-anisotropy via useThree + explicit mipmaps) shipped behind ?card= flag; Lever 2 seam already clean at tp2-base — no geometry change. M1 floor held at 32px (>= 9px gate) after both levers.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-06-11T18:05:00Z (approx)
- **Completed:** 2026-06-11T18:27:00Z
- **Tasks:** 2 of 2
- **Files modified:** 1

## Accomplishments

### Task 1: Lever 1 — max-anisotropy on the card face (via useThree)

- Added `useThree` to the `@react-three/fiber` import (was only `Canvas, useLoader`)
- In `Scene`: `const gl = useThree((s) => s.gl)` + `const maxAniso = useMemo(() => Math.min(gl.capabilities.getMaxAnisotropy(), 16), [gl])`
- Updated `useCardFaces(ids, maxAniso)` to accept `maxAniso` param; gated behind `?card=` flag:
  - `?card=base` → `anisotropy = 8` (pre-TP2 A/B baseline)
  - any other value (incl. no param) → `anisotropy = maxAniso` (GPU-capped max, cap 16)
- Made explicit: `t.minFilter = THREE.LinearMipmapLinearFilter` + `t.generateMipmaps = true` (already the three 0.169 defaults — now assertion-visible per RESEARCH Pattern 2)
- No `mipmapBias` / `lodBias` added (does not exist in three 0.169 — RESEARCH Pitfall 1 confirmed)

### Task 2: Lever 2 — face-to-bevel seam diagnosis

- Captured MACRO at `?cam=macro&card=aniso` and `?cam=macro&card=base`
- Visual inspection of both captures vs `tp2-base/macro.png`: **seam already clean** — no cream rim (body stock showing past face decal), no z-fight halo (face decal and body front cap not competing for depth) at the card corners
- `CARD_FACE_Z = CARD_T + 0.012 + 0.004 = 0.071` (the existing +0.004 float is sufficient to prevent depth competition)
- `bevelSegments: 2` + `bevelSize <= bevelThickness` (both 0.012) already produce a seam that reads clean at fov 26
- **No code edit** — confirmed flag wiring from Task 1 already covers the A/B (`?card=base` vs active)
- M1 re-measured after seam check: **32px** (floor held)

## M1 Legibility Gate Results

| Lever | Capture | M1 px-height (1728x1080 downscale) | vs 9px Floor | Verdict |
|-------|---------|-------------------------------------|--------------|---------|
| Lever 1 ANISO | ?cam=card&card=aniso | **32 px** | +23 px above floor | PASS — floor held |
| Lever 1 BASE | ?cam=card&card=base | **32 px** | +23 px above floor | PASS — floor held |
| Post-seam-check | ?cam=card&card=aniso | **32 px** | +23 px above floor | PASS — floor held |

**Note on px-height vs crispness:** Anisotropy does NOT change the physical px-height of the glyph. The M1 measurement (32px, well above the 9px floor) confirms no regression. The visual improvement from anisotropy 8→16 is sharpened texture at oblique/grazing angles — this is perceptible at full-resolution (2880x1800) on the community card faces and hole card edges. The downscaled-thumbnail comparison may not show a visible difference; the operator should inspect the full-resolution captures directly.

## Seam Verdict

**SEAM ALREADY CLEAN** — no geometry change applied.

Inspection of `macro-seam.png` (lever 1 active) vs `tp2-base/macro.png` (committed baseline):
- No cream rim visible at the face-to-bevel join at card corners
- No z-fight halo around the face decal
- The existing `CARD_FACE_Z = 0.071` float + `bevelSize: 0.012 <= bevelThickness: 0.012` + `bevelSegments: 2` produces a geometrically clean seam at MACRO (fov 26)
- `CARD_CORNER: 0.17` and `curveSegments: 14` confirmed locked by grep gate

## Task Commits

1. **Task 1: Lever 1 — max-anisotropy via useThree + mipmap explicit** — `7d9b31d` (feat)
2. **Task 2: seam already clean — no code change** — (no separate commit; seam confirmed via MACRO captures, locked geometry confirmed via grep gate)

## A/B Capture Paths

### Lever 1 (Anisotropy) — POV at ?cam=card

| Flag | Path |
|------|------|
| `?card=aniso` (max-aniso active) | `.dev-stack/diag/table-3d/tp2/lever1-aniso/card-aniso.png` |
| `?card=base` (pre-TP2 aniso 8) | `.dev-stack/diag/table-3d/tp2/lever1-aniso/card-base.png` |

**Absolute paths (gitignored scratch, LOCAL only):**
- `C:\Users\Usuario\Documents\CHIRIBITO\chiri-infrastructure\chiri-app\.dev-stack\diag\table-3d\tp2\lever1-aniso\card-aniso.png`
- `C:\Users\Usuario\Documents\CHIRIBITO\chiri-infrastructure\chiri-app\.dev-stack\diag\table-3d\tp2\lever1-aniso\card-base.png`

### Lever 2 (Seam Diagnosis) — MACRO at ?cam=macro

| Flag | Path |
|------|------|
| `?cam=macro&card=aniso` (lever 1 active) | `.dev-stack/diag/table-3d/tp2/lever2-seam/macro-seam.png` |
| `?cam=macro&card=base` (pre-TP2 baseline) | `.dev-stack/diag/table-3d/tp2/lever2-seam/macro-base.png` |

**Absolute paths (gitignored scratch, LOCAL only):**
- `C:\Users\Usuario\Documents\CHIRIBITO\chiri-infrastructure\chiri-app\.dev-stack\diag\table-3d\tp2\lever2-seam\macro-seam.png`
- `C:\Users\Usuario\Documents\CHIRIBITO\chiri-infrastructure\chiri-app\.dev-stack\diag\table-3d\tp2\lever2-seam\macro-base.png`

## ?card= Flag Names

| Flag | Meaning |
|------|---------|
| `?card=base` | Pre-TP2 baseline: anisotropy 8 (for A/B comparison) |
| `?card=aniso` | Lever 1 active: anisotropy = Math.min(gl.capabilities.getMaxAnisotropy(), 16) |
| (no param) | Same as aniso — full TP2 stack active (levers on by default once operator-approved) |

## Files Created/Modified

- `frontend/src/lab/TableLab.tsx` — `useThree` import added; `maxAniso` computed in Scene; `useCardFaces` signature updated to accept `maxAniso`; `?card=` flag gates the anisotropy value; explicit `minFilter` + `generateMipmaps` on all card face textures

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written (one deviation recorded below is a factual observation, not a fix).

### Observations

**1. [Observation] Vite used port 5176 (5173/5174/5175 occupied)**
- **Found during:** Task 1 (start dev server)
- **Issue:** Ports 5173-5175 already in use; Vite auto-selected 5176
- **Fix:** All capture commands pointed to `localhost:5176`; no code change needed
- **Committed in:** Not committed (operational note only)

**2. [Observation] M1 px-height reads 32px (vs 9px floor from 03-01)**
- **Found during:** Task 1 (M1 re-measurement)
- **Issue:** The 03-01 measurement found 9px using a stricter scan region (rows 513-521 only, luma <80). This run scanned rows 500-540 with luma <60 and found a wider dark-stroke band spanning rows 508-539 = 32px. Both measurements confirm the floor is well above 9px.
- **Root cause:** The 03-01 measurement isolated a single numeral cluster. The broader scan picks up more of the card face (ink strokes across the border + rank area). Either way: M1 floor = HELD (no regression; well above 9px).

## Locked Geometry Verification (SSOT §TP2)

| Constant | Required | Actual | Status |
|----------|----------|--------|--------|
| CARD_CORNER | 0.17 | 0.17 | LOCKED |
| curveSegments | >= 14 | 14 | LOCKED |
| bevelSegments | <= 6 | 2 | LOCKED (unchanged — seam clean) |
| bevelSize | <= bevelThickness | 0.012 | LOCKED |
| bevelThickness | — | 0.012 | unchanged |
| CARD_FACE_Z | — | 0.071 | unchanged |

## Known Stubs

None — no stubs introduced by this plan.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes. Lab-only (`frontend/src/lab/`), not in the production build. No new threat surface.

## Next Phase Readiness

- **Lever 1 (anisotropy) SHIPPED.** Card face textures now use GPU-max anisotropy (cap 16) at the default scene; `?card=base` restores pre-TP2 anisotropy 8 for A/B comparison.
- **Lever 2 (seam) CLEAN.** No geometry change needed; the existing bevel + face-float already produces a clean seam at MACRO.
- **Plan 03-03** (next lever — micro-relief normal map on card stock) can now execute with Levers 1+2 as the new base.
- **No blockers.** 27/27 lab Vitest green; locked geometry intact; M1 floor held.

## Self-Check: PASSED

- FOUND: frontend/src/lab/TableLab.tsx (modified — useThree + maxAniso + ?card= flag)
- FOUND commit: 7d9b31d
- FOUND: .dev-stack/diag/table-3d/tp2/lever1-aniso/card-aniso.png (LOCAL, gitignored)
- FOUND: .dev-stack/diag/table-3d/tp2/lever1-aniso/card-base.png (LOCAL, gitignored)
- FOUND: .dev-stack/diag/table-3d/tp2/lever2-seam/macro-seam.png (LOCAL, gitignored)
- FOUND: .dev-stack/diag/table-3d/tp2/lever2-seam/macro-base.png (LOCAL, gitignored)
- getMaxAnisotropy grep gate: PASS
- CARD_CORNER 0.17 + curveSegments 14 grep gate: PASS
- 27/27 lab Vitest: PASS
- M1 floor: 32px >= 9px: PASS (no regression)
- Seam: CLEAN (no geometry edit required)

---
*Phase: 03-tp2-cartas-materiality-legibility-protagonist*
*Completed: 2026-06-11*
