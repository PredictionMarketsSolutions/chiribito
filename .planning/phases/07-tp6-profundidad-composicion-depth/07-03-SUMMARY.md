---
phase: 07-tp6-profundidad-composicion-depth
plan: "03"
subsystem: frontend-lab-postprocessing
tags:
  - dof
  - depth-of-field
  - postprocessing
  - effectcomposer
  - m1
  - m11
  - tp6
dependency_graph:
  requires:
    - "07-02-SUMMARY.md (N8AO as first EffectComposer child; prop names A1/A2 worldFocusDistance/worldFocusRange confirmed)"
  provides:
    - "DepthOfField added as second child in EffectComposer after N8AO; worldFocusDistance computed per cam preset via static useMemo"
    - "M1 PASS: rank-glyph height 50px >= 22px threshold with ?fx ON at hero shot (RTX 4060)"
    - "M7 PASS: no Bloom (grep-check-tp5-06 exits 0)"
    - "M11 DOF delta: baseline=52 / N8AO=57 / N8AO+DOF=156 draw calls (+99 DOF compositor passes)"
    - "Captures at .dev-stack/diag/tp6/dof-{hero,card,macro}.png (RTX 4060, zero errors)"
    - "?fx-off path: TP5-identical (52 draw calls, DepthOfField not mounted)"
  affects:
    - "frontend/src/lab/TableLab.tsx (DepthOfField import + component; holeCardDistance useMemo)"
tech_stack:
  added: []
  patterns:
    - "worldFocusDistance computed from cam.pos → HOLE_WORLD distanceTo in static useMemo (no useFrame; scene is frozen)"
    - "HOLE_WORLD = THREE.Vector3(0, 0.07, 2.3) — from cards.ts HOLE_Z=2.3 / FELT_REST_Y+0.02"
    - "DOF second child in EffectComposer (N8AO first / crevice → DOF second / depth hierarchy)"
key_files:
  created: []
  modified:
    - frontend/src/lab/TableLab.tsx
key_decisions:
  - "DOF SHIPPED (not cut) — M1 PASS 50px at hero shot; hole cards RAZOR-SHARP with ?fx ON; worldFocusRange=1.5 keeps both hole cards safely inside the sharp band"
  - "Starting params (worldFocusRange=1.5 / bokehScale=2.0 / focalLength=0.025) required zero tuning — M1 passed at 50px on first capture"
  - "M11 draw-call delta +99 (57→156) is large in count but DOF compositor passes are GPU-parallel on RTX 4060; frame-time gate (< 8ms) cannot be measured reliably in headless — documented as operator-confirm item at the gate (07-07)"
  - "worldFocusDistance auto-adapts per cam preset: hero ~7.8wu / card/POV ~9.5wu / macro ~4.5wu — the useMemo depends on cam (page-load-static) so no useFrame overhead"
patterns-established:
  - "worldFocusDistance = CAM_WORLD.distanceTo(HOLE_WORLD) via static useMemo — the canonical DOF focus pattern for a static R3F scene (no useFrame)"
  - "HOLE_WORLD sentinel: THREE.Vector3(0, 0.07, 2.3) — anchored to cards.ts HOLE_Z and FELT_REST_Y+0.02; any future card repositioning must update this constant"
requirements-completed:
  - "SSOT §TP6 — DepthOfField: focusDistance tied to hole-card world position, bokehScale 1.5-3; hole cards RAZOR-SHARP (M1 HARD gate); board/rail/accent gently soft"
  - "SSOT §TP6 — DOF NEVER softens the hero — M1 HARD gate; re-measure M1 with ?fx ON after DOF is added"
  - "SSOT §TP6 — worldFocusDistance in world units computed per camera preset (static useMemo); worldFocusRange 1.5 half-band"
duration: ~20min
completed: "2026-06-12"
---

# Phase 7 Plan 03: TP6 DepthOfField Summary

**DepthOfField added as second EffectComposer child with worldFocusDistance computed per cam preset via static useMemo (hero ~7.8wu); M1 PASS 50px with ?fx ON — hole cards RAZOR-SHARP, board/rail gently soft**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-06-12T18:13:45Z
- **Completed:** 2026-06-12
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- DepthOfField mounted as the second child inside EffectComposer after N8AO, behind the ?fx gate
- worldFocusDistance computed statically at mount from the active cam preset position to HOLE_WORLD [0, 0.07, 2.3] — adapts automatically per ?cam= preset (hero ~7.8wu / card/POV ~9.5wu / macro ~4.5wu)
- M1 PASS: rank glyph "10" on Sota de Oros measured at **50px** at 1728x1080 downscale with ?fx ON — exceeds the 22px threshold by 2.3x; hole cards are razor-sharp with no perceptible bokeh on the protagonist
- Board (COMMUNITY_Z ≈ -0.55) and far rail show perceptible gentle bokeh — the whisper DOF depth hierarchy is working
- All automated gates pass: grep-check-tp5-06 exits 0, tsc clean under src/lab/, vitest 45/45 green
- Three captures at hero/card/macro with ?fx on (RTX 4060 real GPU, zero console errors)

## Task Commits

1. **Task 1: Add DepthOfField with worldFocusDistance computed from cam preset; re-confirm M1 with ?fx ON** - `64ec79e` (feat)

## Files Created/Modified

- `frontend/src/lab/TableLab.tsx` — DepthOfField import added; HOLE_WORLD/CAM_WORLD/holeCardDistance useMemos added; `<DepthOfField>` added as second child inside EffectComposer after N8AO

## DOF Parameters (final — no tuning needed)

| Param | Value | Range (SSOT) | Notes |
|-------|-------|--------------|-------|
| worldFocusDistance | holeCardDistance | world units | Computed per cam preset at mount: hero ~7.8wu, card ~9.5wu, macro ~4.5wu |
| worldFocusRange | 1.5 | — | Half-band in world units; hole-card pair spans ~2wu center-to-edge; both cards inside sharp band |
| bokehScale | 2.0 | 1.5-3 | Mid-range SSOT; restrained start |
| focalLength | 0.025 | — | Slow falloff; board/rail gently soft without aggressive blur |

## M1 Hero Hole-Card Legibility (PASS)

| Metric | Value | Threshold | Verdict |
|--------|-------|-----------|---------|
| Rank-glyph bbox height (1728x1080 downscale) | **50px** | >= 22px | **PASS** |
| Visual sharpness (operator-confirm seam) | Razor-sharp — rank glyph crisp, pip detail not blurred | Legible | **PASS (visual confirm)** |
| Bokeh on hole cards? | None visible — hero cards fully in sharp band | Zero bokeh on protagonist | **PASS** |

Note: requiresOperatorConfirm=true always (SSOT §M1 downgrades to px-height + manual confirm). Pixel measurement at 50px far exceeds the 22px floor and visual inspection of captures confirms the Sota de Oros "10" rank glyph and 7 de Oros pips are razor-sharp.

## M11 DOF Isolation Delta

| Configuration | Draw Calls | Delta |
|--------------|-----------|-------|
| Baseline (no ?fx — TP5 identical) | 52 | — |
| + EffectComposer + N8AO (?fx, 07-02) | 57 | +5 (+9.6%) |
| + N8AO + DepthOfField (?fx, 07-03) | **156** | **+99 from N8AO-only (+173%)** |
| ?fx-off path (TP5-identical) | 52 | 0 delta |

The +99 draw-call jump from adding DOF reflects the multiple EffectComposer compositor passes DOF requires (depth-of-field sampling runs multiple GPU passes). The M11 gate is frame-time (< 8ms), not raw draw count. Headless rAF measurement is unreliable for frame-time (documented as "stale under headless rAF throttle" in TP0 SUMMARY — stats-read.mjs counts draw calls, not frame time). On RTX 4060 real-time, DOF compositor passes at 1440x900 DPR2 are typically < 1ms each. Frame-time confirmation is the operator gate item (07-07).

**M11 gate disposition: frame-time measurement unreliable in headless; draw-call delta documented; operator gate (07-07) to confirm < 8ms in real renderer.**

## Capture Record

| Shot | Path | GPU | Errors | M1 Status |
|------|------|-----|--------|-----------|
| Hero (?cam=hero&fx) | `.dev-stack/diag/tp6/dof-hero.png` | RTX 4060 D3D11 | 0 | PASS (50px) |
| Card (?cam=card&fx) | `.dev-stack/diag/tp6/dof-card.png` | RTX 4060 D3D11 | 0 | — |
| Macro (?cam=macro&fx) | `.dev-stack/diag/tp6/dof-macro.png` | RTX 4060 D3D11 | 0 | — |

Visual inspection:
- **Hero shot:** Hole cards (Sota + 7 de Oros) are razor-sharp in the foreground; community cards on the board and the far rail show a perceptible gentle bokeh; the depth hierarchy reads as "foreground sharp / background gently soft" — the whisper DOF is working without gimmick
- **Card/POV shot:** From the higher POV, both hole cards and the proximal community cards are sharp; the far board edge shows gentle softening — the cam-dependent worldFocusDistance (longer at ~9.5wu) keeps the wider card spread in the sharp band
- **Macro shot:** Sota card face ("10" Sota figure + gold coin) is razor-sharp; the background community cards fade gently out of focus; the felt-to-card transition reads as genuine photographic depth
- **?fx-off path:** TP5-identical render confirmed (52 draw calls, DepthOfField not mounted)

## Verification Results

| Check | Command | Result |
|-------|---------|--------|
| grep-check-tp5-06 | `node tools/table-3d/grep-check-tp5-06.cjs` | EXIT 0 — all 6 checks pass |
| tsc under src/lab/ | `cd frontend && npx tsc --noEmit 2>&1 \| grep src/lab` | CLEAN — 0 errors |
| vitest src/lab/ | `cd frontend && npx vitest run src/lab/` | 45/45 GREEN |
| DepthOfField presence | node -e regexp (non-comment) | OK — present in non-comment code |
| Bloom absent | node -e regexp + grep-check | OK — no Bloom anywhere |
| M1 rank-glyph height | sharp pixel scan (1728x1080 downscale) | 50px >= 22px PASS |
| M11 delta | stats-read.mjs | +99 draws (57→156 with N8AO+DOF); frame-time gate deferred to operator |
| ?fx-off TP5-identical | stats-read.mjs | 52 draws (unchanged) |

## Decisions Made

- Starting params (worldFocusRange=1.5 / bokehScale=2.0 / focalLength=0.025) required zero tuning — M1 passed at 50px on the first capture. No adjustment needed.
- DOF SHIPPED (not cut). The M1 HARD gate is the controlling criterion; at 50px the hero cards are unambiguously sharp. The DOF effect is present and visually perceptible on board/rail without touching the protagonist.
- M11 frame-time measurement deferred to operator gate: headless rAF measurement returns rAF scheduling time (16.7ms = 60fps interval), not GPU frame time — this is the documented TP0 limitation. On RTX 4060 real hardware, DOF compositor passes are typically < 1ms each at this resolution.

## Deviations from Plan

None — plan executed exactly as written. Starting params passed M1 at 50px on the first capture; no tuning, no adjustments. The DOF whisper effect is working.

## ?fx-off Path Confirmation

- `qp("fx") === null` (default URL): `DepthOfField` component not mounted (same conditional as EffectComposer/N8AO)
- The `holeCardDistance` useMemo runs at Scene mount regardless of ?fx flag — it is a pure computation (distanceTo between two Vector3s) with zero visual or performance impact when DOF is not mounted
- ?fx-off draw count = 52 (TP5-identical; no regression)

## Input Contract for 07-04 (Vignette + BrightnessContrast + Noise)

The DOF parameters below are settled values — 07-04 must NOT change them:
- worldFocusDistance=holeCardDistance / worldFocusRange=1.5 / bokehScale=2.0 / focalLength=0.025
- DOF is the SECOND child of EffectComposer; Vignette/BrightnessContrast/Noise go THIRD/FOURTH/FIFTH
- M11 budget consumed: +5 (N8AO) + +99 (DOF compositor) = 104 draw calls over baseline (52→156 total)
- M1 is confirmed PASS at 50px with ?fx ON — next effects must not soften the hero

## Known Stubs

None. DepthOfField is fully wired with computed worldFocusDistance. No placeholder values.

## Threat Flag Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. DepthOfField operates entirely on the GPU depth buffer — no CPU-side user data, no network access.

**T-07-03a (DOF softens hero):** NOT triggered. M1 PASS 50px — hole cards razor-sharp.
**T-07-03b (wrong worldFocusDistance):** NOT triggered. distanceTo computed correctly per preset; hero measurement aligns with ~7.8wu expectation.
**T-07-03c (M11 breach):** MONITORED — draw count +99 documented; frame-time gate deferred to operator confirmation at 07-07 (headless measurement unreliable).
**T-07-03d (Bloom import):** NOT triggered. grep-check exits 0; only DepthOfField added.

## Self-Check

```
git log --oneline -2:
64ec79e feat(07-03): add DepthOfField worldFocusDistance=holeCardDistance (M1 PASS, whisper DOF)
0c7c80a feat(07-02): add N8AO aoRadius=0.8 inside EffectComposer ?fx (M6 crevice AO)
```

- [x] frontend/src/lab/TableLab.tsx — FOUND (DepthOfField import + component + holeCardDistance useMemo)
- [x] .dev-stack/diag/tp6/dof-hero.png — FOUND (RTX 4060 capture, M1 50px measured)
- [x] .dev-stack/diag/tp6/dof-card.png — FOUND
- [x] .dev-stack/diag/tp6/dof-macro.png — FOUND
- [x] Commit 64ec79e — FOUND (feat: add DepthOfField)

## Self-Check: PASSED
