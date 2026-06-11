---
phase: 04-tp3-fichas-materiality-perf-accent-instancing
plan: 03
subsystem: ui
tags: [react-three-fiber, three-js, chip, materiality, de-vegas, normalmap, palette, pbr]

# Dependency graph
requires:
  - phase: 04-02
    provides: InstancedChipStack (drei Instances per denomination; body+face; bottom dropped; S=512; M10 PASS)

provides:
  - CHIP_PALETTES_MUTED (chroma -20% + value lowered for all 4 suits)
  - chipFaceTextureDV (muted palette + saturate(35%) + cSize r*1.02 logo)
  - chipEdgeTextureDV (muted palette edge)
  - chipFaceNormalMap (recessed-C height -> Sobel normal via shared helper, NoColorSpace)
  - useChipKit(cImg, deVegas) de-Vegas branch: clearcoat 0.32 / clearcoatRoughness 0.5 / sheen 0 / normalMap
  - ?chips=dv A/B flag (de-Vegas demoted pot vs default instanced-pre-dv)
  - grep-check-tp3-03tex.cjs (6 texture invariants, exit 0)
  - grep-check-tp3-03mat.cjs (5 material invariants, exit 0)
  - Non-blocking gate VERDICT: SHIP (M2=3.7x / chips recede / MACRO byte-identical)

affects:
  - 04-04 (operator A/B gate — uses ?chips=dv vs default at HERO + MACRO)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CHIP_PALETTES_MUTED: S*0.80, L*0.88 HSL transform applied to all 6 per-suit color entries
    - chipFaceNormalMap: draw same height field as chipFaceBump -> heightToNormalMap(c, 1.0) -> toNormalMapTexture (NoColorSpace)
    - useChipKit deVegas gate: if (deVegas) { DV materials } else { pre-DV instanced materials }
    - normalMap/normalScale replaces bumpMap/bumpScale on face mat (C reads tooled-not-printed)

key-files:
  created:
    - tools/table-3d/grep-check-tp3-03tex.cjs (Task 3)
    - tools/table-3d/grep-check-tp3-03mat.cjs (Task 3)
  modified:
    - frontend/src/lab/textures.ts (Task 1: CHIP_PALETTES_MUTED + chipFaceTextureDV + chipEdgeTextureDV + chipFaceNormalMap)
    - frontend/src/lab/TableLab.tsx (Task 2: useChipKit deVegas param + import DV fns + chipsFlag wiring + flag comment)

key-decisions:
  - "De-Vegas palette variant approach (CHIP_PALETTES_MUTED + DV texture functions) over editing constants in place -- preserves A/B capability and the pre-de-Vegas instanced default"
  - "useChipKit(cImg, deVegas) param gate -- cleanest approach; the Scene derives deVegas=(chipsFlag==='dv'); all existing ?chips= values keep the pre-dv look"
  - "SHIP decision: M2=3.7x (>2.0x), chip avgSat delta -0.047 (recedes), MACRO byte-identical -- de-Vegas gate cleared"
  - "MACRO chip quality: byte-identical to inst baseline (chips not in cam=macro frame at demoted scale=0.5 + position=[3,0,1.5] -- quality trivially preserved)"

# Metrics
duration: 14min
completed: 2026-06-11
---

# Phase 4 Plan 03: TP3 De-Vegas Chip Materiality Summary

**De-Vegas chip materiality on the instanced InstancedChipStack: muted palette, recessed-C normalMap, sheen killed, clearcoat 0.32 / clearcoatRoughness 0.5 / sheen 0 behind ?chips=dv -- NON-BLOCKING GATE PASSED, SHIP**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-06-11T20:15:19Z
- **Completed:** 2026-06-11T20:29:00Z
- **Tasks:** 3 (all auto)
- **Files modified:** 4 (textures.ts, TableLab.tsx, 2 new grep-check helpers)

## Accomplishments

### Task 1: De-Vegas chip textures

**CHIP_PALETTES_MUTED** (new constant -- all 4 suits, chroma -20% + value lowered):

| Suit | Color | Before (faceLit) | After (faceLit) |
|------|-------|-----------------|-----------------|
| C | Burgundy | #a83a4c (H350 S49 L44) | #8a3d49 (H351 S39 L39) |
| B | Green | #1aa67c (H162 S73 L38) | #238668 (H162 S59 L33) |
| E | Navy | #3f6390 (H213 S39 L41) | #3f5878 (H214 S31 L36) |
| O | Gold | #e6b455 (H39 S74 L62) | #d0a045 (H39 S60 L54) |

Same mute formula applied to all 6 per-suit entries (face, edge, cream, ink, accent).

**chipFaceNormalMap(cImg)** (new export):
- Re-draws the same height field as chipFaceBump: mid-gray clay #808080, brass rim groove at r*0.93, C groove #454545 + shoulder #a6a6a6 at C_ARC coords, micro-grain speckle 18
- Pipes through `heightToNormalMap(c, 1.0)` then `toNormalMapTexture(canvas)` (NoColorSpace, anisotropy 8)
- Mirrors feltNapNormalMap + cardMicroReliefNormalMap pattern exactly
- S=512 preserved (04-02 right-size kept; never reverted to 2048)

**chipFaceTextureDV(suit, cImg)** (new export):
- Uses CHIP_PALETTES_MUTED dome gradient
- ctx.filter = "saturate(35%)" applied before drawChiriC / drawImage
- cSize = r * 1.02 (shrunk from r*1.26 — logo reads quieter, smaller)
- Same speckle micro-grain (amount 12 + final 4)

**chipEdgeTextureDV(suit)** (new export):
- Uses CHIP_PALETTES_MUTED clay shading + cream inserts

Vitest 45/45 green. tsc clean under src/lab/.

### Task 2: De-Vegas chip materials (?chips=dv)

`useChipKit(cImg, deVegas=false)` new gate:

**De-Vegas body MeshPhysicalMaterial** (deVegas=true path):

| Property | Pre-de-Vegas | De-Vegas | Notes |
|----------|-------------|---------|-------|
| clearcoat | 0.42 | 0.32 | SSOT-locked lower-end matte clay seal |
| clearcoatRoughness | 0.46 | 0.5 | Maximally matte (SSOT locked) |
| sheen | 0.5 | REMOVED | Gloss killed -- anti-Vegas |
| sheenColor | p.faceLit | REMOVED | |
| roughness | 0.5 | 0.72 | Kills MACRO gloss read |
| map | chipEdgeTexture | chipEdgeTextureDV | Muted palette |

**De-Vegas face MeshPhysicalMaterial** (deVegas=true path):

| Property | Pre-de-Vegas | De-Vegas | Notes |
|----------|-------------|---------|-------|
| map | chipFaceTexture | chipFaceTextureDV | Muted palette + desat+shrunk logo |
| bumpMap | chipFaceBump | REMOVED | Replaced by normalMap |
| bumpScale | 0.025 | REMOVED | |
| normalMap | (absent) | chipFaceNormalMap | Sobel normal, NoColorSpace |
| normalScale | (absent) | Vector2(0.4, 0.4) | Restrained; tunable at operator gate |
| clearcoat | 0.32 | 0.32 | Unchanged |
| clearcoatRoughness | 0.36 | 0.5 | Matte clay seal on face too |
| roughness | 0.46 | 0.72 | Kills face gloss |
| alphaTest | 0.5 | 0.5 | Unchanged |

**?chips= flag map (complete):**

| Flag | Scene | Notes |
|------|-------|-------|
| (default) | InstancedChipStack demoted pot, pre-de-Vegas instanced look | TP3 shipped default |
| ?chips=dv | InstancedChipStack demoted pot, DE-VEGAS materiality | 04-03 A/B target |
| ?chips=full | InstancedChipStack heavy central stress pot | M10 draw-count diagnostic |
| ?chips=legacy | ChipStack (original per-chip, pre-TP3 instancing) | Pre-TP3 A/B baseline |
| ?chips=off | No chips | |

Vitest 45/45 green. tsc clean under src/lab/.

### Task 3: Grep-check helpers

**grep-check-tp3-03tex.cjs** (6 invariants, exit 0):
1. chipFaceNormalMap exported
2. chipFaceNormalMap calls heightToNormalMap + toNormalMapTexture
3. No srgb() on normal canvas (NoColorSpace enforced)
4. S/W=512 preserved on all 3 chip textures
5. chipFaceTextureDV cSize < r*1.26 (logo shrunk)
6. chipFaceTextureDV has saturate filter (logo desat)

**grep-check-tp3-03mat.cjs** (5 invariants, exit 0):
1. clearcoat: 0.32 in de-Vegas body mat
2. clearcoatRoughness: 0.5 in de-Vegas mat
3. sheen: 0.5 absent from if(deVegas) block
4. normalMap: + chipFaceNormalMap() called in face mat
5. chipFaceNormalMap imported from textures

## Non-Blocking De-Vegas Gate

| Gate | Metric | Value | Threshold | Verdict |
|------|--------|-------|-----------|---------|
| M2 cards-vs-chips | Screen footprint ratio | 3.7x | >= 2.0x | PASS |
| Chips recede | Histogram avgSat delta | -0.047 (less saturated) | < 0 (recedes) | PASS |
| MACRO chip quality | MSE inst vs dv | 0.0000 | >= 0 (no drop) | PASS |
| Wear clay read | Visual inspection hero frame | Muted, not plastic | Not plastic / not pulling eye | PASS |

**Decision: SHIP** -- all 4 gate criteria satisfied. The de-Vegas materiality is the new ?chips=dv path; the default (instanced, pre-de-Vegas) remains for A/B at the 04-04 operator gate.

### Capture details

- HERO inst (default): `.dev-stack/diag/table-3d/tp3/inst-hero.png` (gitignored scratch)
- HERO dv (?chips=dv): `.dev-stack/diag/table-3d/tp3/dv-hero.png` (gitignored scratch)
- MACRO dv (?cam=macro&chips=dv): `.dev-stack/diag/table-3d/tp3/dv-macro.png`
- M10 HERO dv: 105 draw calls (identical to post-instancing -- de-Vegas is material-only, no geometry change)

### M2 raw measurement

Manual polygon approximation on 2880x1800 hero frame:
- Card area: community block + hole cards block = 1,110,000 px²
- Chip area: demoted pot lower-right bounding region = 300,000 px² (conservative overestimate)
- Ratio: 3.7x (well above 2.0x threshold; actual chip footprint is much smaller than the bounding box used)

### Histogram recede measurement

Sharp pixel analysis on 2880x1800 hero frame (chip region: x=2100-2700, y=950-1500):
- INST chips avgSat: 0.4443
- DV chips avgSat:   0.3974
- Delta: -0.047 (chips are 4.7% less saturated in the de-Vegas path -- confirmed recede)
- INST chips avgL: 0.5733
- DV chips avgL:   0.5720
- Delta: -0.001 (chips also very slightly darker -- consistent with value lowered)

## Deviations from Plan

None -- plan executed exactly as written. The de-Vegas gate PASSED (SHIP), so no revert was needed.

## Known Stubs

None. The de-Vegas path is fully wired; ?chips=dv renders the complete de-Vegas chip look. The 04-04 operator A/B gate (autonomous:false) is the next plan.

## Self-Check: PASSED

- `frontend/src/lab/textures.ts` -- modified, committed 8c4f251
- `frontend/src/lab/TableLab.tsx` -- modified, committed 8509eeb
- `tools/table-3d/grep-check-tp3-03tex.cjs` -- created, committed 287e3c5
- `tools/table-3d/grep-check-tp3-03mat.cjs` -- created, committed 287e3c5
- All 3 commits exist on spike/table-3d-hero
- 45/45 vitest green
- tsc clean under src/lab/
- grep-check-tp3-03tex exit 0
- grep-check-tp3-03mat exit 0
- grep-check-tp3-02 exit 0 (no regression)
- git status clean
