---
phase: 02-tp1-felt-tapete-materiality-the-stage
plan: 02
subsystem: lab / textures
tags: [tp1, felt, normal-map, ao-map, canvas-texture, three.js, sobel, d01, d03, d04]

# Dependency graph
requires:
  - phase: 02-01
    provides: shared heightToNormalMap/toNormalMapTexture Sobel helper + A1-uv1 decision (aoMap reads uv channel 0)
provides:
  - feltTexture() upgraded: S=2048 (D-04 sharper MACRO inlay), baked albedo vignette removed (D-03)
  - feltNapNormalMap() exported: concentric/oval nap via shared Sobel helper, LINEAR, RepeatWrapping repeat 8 (D-01)
  - feltEdgeAoMap() exported: very subtle radial AO edge-darken, LINEAR gray() path, A1-uv1 (D-03)
affects: [02-03, 02-04, TP3, TP4, TP5]

# Tech tracking
tech-stack:
  added: []  # no new packages — three 0.169 + normalMapHelper from 02-01 is everything
  patterns:
    - "feltNapNormalMap: height-field pixel loop (createImageData) + heightToNormalMap(c, 1.0) + toNormalMapTexture wrapper — LINEAR/NoColorSpace; RepeatWrapping set before repeat.set()"
    - "feltEdgeAoMap: radial gradient factory (makeCanvas + createRadialGradient) returned via gray(c) — LINEAR AO data, NOT sRGB"
    - "S resize in feltTexture: change const S only; all coordinates are r*fraction or S*fraction, so they scale automatically; M3 gradient uses fractional colorStop positions"

key-files:
  created: []
  modified:
    - frontend/src/lab/textures.ts

key-decisions:
  - "D-03 aoMap path chosen (NOT albedo-fallback): A1-uv1 confirmed aoMap reads uv channel 0 in three.js 0.169 — no uv2 attribute needed; wire aoMap + aoMapIntensity directly in 02-03"
  - "feltEdgeAoMap uses gray(c) (NoColorSpace / LINEAR) per AO data-map discipline; edge stop #c0c0c0 = ~25% AO within D-03 subtle band; aoMapIntensity 0.18 start (wired in 02-03)"
  - "feltNapNormalMap: ringFreq=5 + repeat=8 → ~40 ring-pairs across the felt diameter; sub-pixel at HERO fov32, fine weave at MACRO fov26 (avoids Pitfall-8 vinyl-record read)"
  - "M3 anchor gradient (#1f9163/#147a51/#0a4a33) preserved byte-identical after S 1024→2048: addColorStop uses fractional positions → proportions invariant at any S"

patterns-established:
  - "Albedo S resize: change const S only; audit that every downstream coordinate is r*fraction or S*fraction before editing"
  - "feltEdgeAoMap branch decision: aoMap path (A1-uv1), documented in SUMMARY for 02-03 wiring"

requirements-completed: []  # TP1 gated by SSOT §TP1 acceptance + metric thresholds — no REQUIREMENTS.md IDs

# Metrics
duration: 6min
completed: 2026-06-10
---

# Phase 2 Plan 02: TP1 Wave 2 Texture Authoring Summary

**feltTexture() raised to S=2048 with baked albedo vignette removed; feltNapNormalMap() (concentric rings, Sobel, LINEAR, repeat 8) and feltEdgeAoMap() (radial AO, LINEAR, #c0c0c0 edge) added — all texture factories ready for 02-03 material wiring.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-10T~14:40Z
- **Completed:** 2026-06-10T~14:46Z
- **Tasks:** 3
- **Files modified:** 1 (frontend/src/lab/textures.ts)

## Accomplishments

- **Task 1:** Raised `feltTexture()` canvas from S=1024 to S=2048 (D-04); deleted the baked radial vignette block (lines 492–497, rgba(0,0,0,0.5)) per D-03. M3 anchor gradient (#1f9163/#147a51/#0a4a33, fractional stops) preserved byte-identical. Born-in mark, brass ring, and 4 suits unchanged.
- **Task 2:** Added `feltNapNormalMap()` — a 512² height field of concentric rings (ringFreq=5) from UV center, converted via `heightToNormalMap` + `toNormalMapTexture` (NoColorSpace/LINEAR). RepeatWrapping set before `repeat.set(8, 8)` (SSOT 6-10 band). No computeTangents.
- **Task 3:** Added `feltEdgeAoMap()` — a 512² radial gradient (white center → #c0c0c0 at edge, stop 0.7 held white), returned via `gray(c)` (NoColorSpace/LINEAR). A1-uv1 path (aoMap reads uv channel 0 by default — no uv2 geometry attribute needed).

## Task Commits

1. **Task 1: feltTexture() S 1024->2048 + delete baked vignette** — `e642f68` (feat)
2. **Task 2: feltNapNormalMap() concentric nap via Sobel helper** — `9835316` (feat)
3. **Task 3: feltEdgeAoMap() subtle AO edge-darken** — `84e395f` (feat)

## Files Created/Modified

- `frontend/src/lab/textures.ts` — feltTexture() S=2048 + vignette removed; import from normalMapHelper; feltNapNormalMap() + feltEdgeAoMap() added

## Decisions Made

**feltEdgeAoMap branch: aoMap path (NOT albedo-fallback).**
Per A1-uv1 decision from 02-01 (docs/table-3d/TP1_A1_AOMAP_UV.md): `CanvasTexture.channel` defaults to 0 → `AOMAP_UV` resolves to `uv` → `PlaneGeometry`'s existing `uv` attribute is sufficient. No geometry.setAttribute('uv2', ...) needed. 02-03 can wire `aoMap: feltEdgeAoMap()` + `aoMapIntensity: 0.18` directly.

**ringFreq=5 for the concentric height field.**
Per RESEARCH.md §2 / Pitfall 8: at repeat=8, ringFreq=5 gives ~40 ring-pairs across the felt diameter. Sub-pixel at HERO fov32 (no vinyl-record read), visible as fine weave at MACRO fov26.

## Deviations from Plan

**[Rule 2 - Minor] `computeTangents` appeared in JSDoc comment.**
- **Found during:** Task 2 verification (acceptance criterion: grep count = 0).
- **Issue:** The word "computeTangents" was written in the comment as a warning not to use it ("Do NOT call computeTangents"), which caused the grep count to be 1.
- **Fix:** Rewrote the comment to say "No explicit tangent attributes needed: three.js uses getTangentFrame()" — same information, no grep hit.
- **Files modified:** frontend/src/lab/textures.ts (same commit `9835316`)
- **Impact:** Trivial wording change; behavior unchanged.

---

**Total deviations:** 1 minor (comment wording only)
**Impact on plan:** No scope change; all three tasks delivered exactly as specified.

## Known Stubs

None — all three functions produce fully computed canvas textures (height field pixel loop, radial gradient data). No placeholder or empty-value returns.

## Threat Flags

None — all changes are offline lab-only texture factories; no new network endpoints, auth paths, or trust boundaries introduced.

## Issues Encountered

None. The pre-existing TypeScript errors in `src/app/card-popover.ts`, `src/auth/token-monitor.ts`, and `src/connection.ts` are game-tree debt unrelated to this plan (confirmed pre-existing by checking that grep of `src/lab/` returns zero errors).

## Next Phase Readiness

- `02-03` can immediately wire `feltNapNormalMap()`, `feltEdgeAoMap()`, and the upgraded `feltTexture()` into the felt `MeshPhysicalMaterial` swap (sheen + normalMap + aoMap).
- aoMap: use A1-uv1 path — `aoMap: feltEdgeAoMap(), aoMapIntensity: 0.18` with no geometry changes.
- normalMap: `normalMap: feltNapNormalMap(), normalScale: new THREE.Vector2(0.28, 0.28)`.
- No push/deploy/merge (manual-deploy invariant, LOCAL only).

## Self-Check: PASSED

All three commits verified in git log (`e642f68`, `9835316`, `84e395f`). `frontend/src/lab/textures.ts` exports `feltTexture`, `feltNapNormalMap`, `feltEdgeAoMap`. M3 anchors intact (grep ≥1 each). Vignette block gone (grep = 0). `computeTangents` absent (grep = 0). `repeat.set(8, 8)` present. No new lab TypeScript errors. No push.

---
*Phase: 02-tp1-felt-tapete-materiality-the-stage*
*Completed: 2026-06-10*
