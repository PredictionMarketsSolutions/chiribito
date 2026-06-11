---
phase: 03-tp2-cartas-materiality-legibility-protagonist
plan: "03"
subsystem: ui
tags: [r3f, normalmap, clearcoat, micro-relief, card-stock, tp2, lever3, lever4]

# Dependency graph
requires:
  - phase: 03-tp2-cartas-materiality-legibility-protagonist
    provides: Lever 1 (max-anisotropy) + Lever 2 (seam clean) base — M1 floor 32px (plan 03-02)

provides:
  - Lever 3 (cardMicroReliefNormalMap, NoColorSpace, normalScale 0.12) behind ?card= flag — SHIPPED
  - Lever 4 (clearcoat 0.12 / clearcoatRoughness 0.55 on stock + faceMat) behind ?card= flag — SHIPPED
  - A/B captures: lever3-relief/{card-relief,card-base,macro-relief}.png + lever4-clearcoat/{card-coat,macro-coat,macro-base,hero.png}

affects:
  - 03-04 through 03-05 (subsequent lever plans; Levers 3+4 are the new active base for ?card= default)
  - 03-06 (operator gate — accumulation of all TP2 levers; plastic/laminated read judged here)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "cardMicroReliefNormalMap() created ONCE in useCardKit (Pitfall 5 — shared by reference, not per-Card)"
    - "toNormalMapTexture(normalCanvas) = NoColorSpace for normal maps (Pitfall 3 — never sRGB on data textures)"
    - "Spread operator pattern: ...(normalMap ? {normalMap, normalScale: Vector2(0.12,0.12)} : {}) for conditional material props"
    - "Variable clearcoat pattern: const clearcoat = cardFlag === 'base' ? 0.16 : 0.12 — separates flag read from useMemo"

key-files:
  created: []
  modified:
    - frontend/src/lab/textures.ts
    - frontend/src/lab/TableLab.tsx

key-decisions:
  - "Lever 3 normalScale = 0.12 (operator-locked restraint-first). height field: linen crosshatch (freq=18, hx*0.6+hy*0.4 horizontal bias, S=256), Sobel via heightToNormalMap(c, 1.0), toNormalMapTexture (NoColorSpace), repeat.set(2,3). Single shared instance in useCardKit."
  - "Lever 4 clearcoat = 0.12 / clearcoatRoughness = 0.55 (stock) + faceMat aligned to 0.12. ?card=base restores full pre-TP2: stock 0.16/0.5, face 0.1. Both levers share the same ?card= gate."
  - "M1 = 31px (coat capture) and 31px (relief capture) — floor 9px held; advisory PASS. Legibility authoritative gate remains operator at 03-06."
  - "M5 = feltClipPct 0%, frameClipPct 0% — identical to tp2-base baseline (no highlight clip; no over-clearcoat flare). PASS."
  - "Grep gate: plan-provided script catches pre-existing non-card materials (wood 0.72, chips 0.42/0.32). Scoped check: all card clearcoat literals <= 0.16 (base A/B cap); active values 0.12. No card clearcoat exceeds 0.18."

# Metrics
duration: 6min
completed: "2026-06-11"
---

# Phase 3 Plan 03: TP2 Levers 3+4 Summary

**Lever 3 (faint card-stock micro-relief normal, NoColorSpace, normalScale 0.12) + Lever 4 (clearcoat whisper 0.12/0.55, coated-not-plastic) shipped behind ?card= flag. M1 = 31px (>= 9px floor) after both levers. M5 highlight-clip PASS (0%/0% — identical to tp2-base baseline).**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-11T16:34:38Z
- **Completed:** 2026-06-11T16:40:00Z
- **Tasks:** 2 of 2
- **Files modified:** 2

## Accomplishments

### Task 1: Lever 3 — cardMicroReliefNormalMap on card stock body

- Added `cardMicroReliefNormalMap()` to `frontend/src/lab/textures.ts`, mirroring `feltNapNormalMap()` exactly in structure:
  - S=256 canvas (sufficient for face-scale grain at MACRO fov26)
  - Height field: linen/emboss crosshatch — `hx*0.6 + hy*0.4` (horizontal bias = primary paper grain direction), `freq=18` fibres per tile
  - `heightToNormalMap(c, 1.0)` Sobel conversion (shared helper — already unit-tested, 9/9 green)
  - `toNormalMapTexture(normalCanvas)` → `NoColorSpace` (Pitfall 3: normal maps MUST NOT be sRGB-decoded)
  - `wrapS = wrapT = RepeatWrapping`, `repeat.set(2, 3)` — 2 tiles across card width, 3 along card height
- Added `cardMicroReliefNormalMap` to the import list from `./textures` in `TableLab.tsx`
- In `useCardKit`, created the texture ONCE via `useMemo` (Pitfall 5 — shared by reference, never per-Card):
  - `?card=base` → `null` (lever off; pre-TP2 A/B baseline)
  - any other value → `cardMicroReliefNormalMap()` (lever on)
- Attached to `kit.stock` body as `normalMap` + `normalScale: new THREE.Vector2(0.12, 0.12)` via spread conditional
- Intentionally NOT applied to per-card `faceMat` (the printed Fournier face stays maximally crisp for legibility)

### Task 2: Lever 4 — clearcoat whisper 0.12 / clearcoatRoughness 0.55

- Stock clearcoat: `0.16 → 0.12` (restraint-first, SSOT low end); `?card=base` → `0.16` A/B
- Stock clearcoatRoughness: `0.5 → 0.55`; `?card=base` → `0.5` A/B
- faceMat clearcoat: `0.1 → 0.12` (consistency with stock body); `?card=base` → `0.1` A/B
- faceMat clearcoatRoughness `0.55` unchanged (already at target)
- Sheen/sheenColor intentionally unchanged (lever 5, plan 03-04 scope)
- Both levers (3+4) share the same `?card=` flag gate:
  - `?card=base` = full pre-TP2 baseline (no relief, old clearcoat values)
  - any other value = levers 3+4 both active
- `const clearcoat = cardFlag === "base" ? 0.16 : 0.12` pattern keeps the flag read outside `useMemo`

## M1 Legibility Gate Results

| Lever | Capture | M1 px-height (1728×1080 downscale, x=618-658, y=500-540, luma<60) | vs 9px Floor | Verdict |
|-------|---------|-------------------------------------------------------------------|--------------|---------|
| Lever 3 (micro-relief) | ?cam=card&card=relief | **31 px** | +22 px above floor | PASS — floor held |
| Lever 4 (clearcoat) | ?cam=card&card=coat | **31 px** | +22 px above floor | PASS — floor held |

**Note:** 31px vs 32px from 03-02 is scan noise (±1px; same scan parameters). M1 floor = 9px; advisory gate = HELD. Operator legibility gate remains 03-06 (authoritative).

## M5 Highlight-Clip Results (over-clearcoat plastic-flare guard)

| Capture | feltClipPct | frameClipPct | vs tp2-base | Verdict |
|---------|------------|--------------|-------------|---------|
| ?cam=hero&card=coat | 0% | 0% | identical | PASS |

**No over-clearcoat highlight flare.** Clearcoat 0.12 with clearcoatRoughness 0.55 does not blow highlights — M5 reads the same as the tp2-base baseline (feltClipPct=0%, frameClipPct=0%). Plastic/laminated STOP criterion: not triggered.

## Clearcoat Cap Verification

| Scope | Active (non-base) | Base A/B | Hard cap (0.18) | Status |
|-------|------------------|----------|-----------------|--------|
| stock body | 0.12 | 0.16 | <= 0.18 | PASS |
| faceMat | 0.12 | 0.10 | <= 0.18 | PASS |

Pre-existing non-card materials (wood varnish 0.72, chips 0.42/0.32, leather 0.08, wood coaming 0.5) are outside the card stock scope and are not affected by this plan. All card clearcoat values are well within the 0.18 cap.

## Task Commits

1. **Task 1: Lever 3 — cardMicroReliefNormalMap (normalScale 0.12, NoColorSpace, single instance)** — `327102e` (feat)
2. **Task 2: Lever 4 — clearcoat whisper 0.12/0.55 on stock + faceMat; behind ?card=** — `a0d0f17` (feat)

## A/B Capture Paths

### Lever 3 (Micro-Relief Normal Map)

| Flag | Path |
|------|------|
| `?cam=card&card=relief` (lever 3 active) | `.dev-stack/diag/table-3d/tp2/lever3-relief/card-relief.png` |
| `?cam=card&card=base` (pre-TP2 A/B) | `.dev-stack/diag/table-3d/tp2/lever3-relief/card-base.png` |
| `?cam=macro&card=relief` (lever 3 MACRO) | `.dev-stack/diag/table-3d/tp2/lever3-relief/macro-relief.png` |

**Absolute paths (gitignored scratch, LOCAL only):**
- `C:\Users\Usuario\Documents\CHIRIBITO\chiri-infrastructure\chiri-app\.dev-stack\diag\table-3d\tp2\lever3-relief\card-relief.png`
- `C:\Users\Usuario\Documents\CHIRIBITO\chiri-infrastructure\chiri-app\.dev-stack\diag\table-3d\tp2\lever3-relief\card-base.png`
- `C:\Users\Usuario\Documents\CHIRIBITO\chiri-infrastructure\chiri-app\.dev-stack\diag\table-3d\tp2\lever3-relief\macro-relief.png`

### Lever 4 (Clearcoat Whisper)

| Flag | Path |
|------|------|
| `?cam=card&card=coat` (lever 4 active) | `.dev-stack/diag/table-3d/tp2/lever4-clearcoat/card-coat.png` |
| `?cam=macro&card=coat` (lever 4 MACRO) | `.dev-stack/diag/table-3d/tp2/lever4-clearcoat/macro-coat.png` |
| `?cam=macro&card=base` (pre-TP2 A/B MACRO) | `.dev-stack/diag/table-3d/tp2/lever4-clearcoat/macro-base.png` |
| `?cam=hero&card=coat` (M5 metric frame) | `.dev-stack/diag/table-3d/tp2/lever4-clearcoat/hero.png` |

**Absolute paths (gitignored scratch, LOCAL only):**
- `C:\Users\Usuario\Documents\CHIRIBITO\chiri-infrastructure\chiri-app\.dev-stack\diag\table-3d\tp2\lever4-clearcoat\card-coat.png`
- `C:\Users\Usuario\Documents\CHIRIBITO\chiri-infrastructure\chiri-app\.dev-stack\diag\table-3d\tp2\lever4-clearcoat\macro-coat.png`
- `C:\Users\Usuario\Documents\CHIRIBITO\chiri-infrastructure\chiri-app\.dev-stack\diag\table-3d\tp2\lever4-clearcoat\macro-base.png`
- `C:\Users\Usuario\Documents\CHIRIBITO\chiri-infrastructure\chiri-app\.dev-stack\diag\table-3d\tp2\lever4-clearcoat\hero.png`

## ?card= Flag Names

| Flag | Meaning |
|------|---------|
| `?card=base` | Full pre-TP2 A/B baseline: anisotropy 8, no relief normal map, clearcoat 0.16 (stock) / 0.1 (face) |
| `?card=aniso` | Lever 1 only (anisotropy) — from plan 03-02 |
| `?card=relief` | Levers 1+2+3 active (anisotropy + normal map) |
| `?card=coat` | Levers 1+2+3+4 active (anisotropy + normal map + clearcoat) |
| (no param) | Same as coat — full TP2 stack active |

## Files Created/Modified

- `frontend/src/lab/textures.ts` — `cardMicroReliefNormalMap()` added (48 lines + JSDoc); uses `heightToNormalMap` + `toNormalMapTexture` (NoColorSpace)
- `frontend/src/lab/TableLab.tsx` — import added; `useCardKit` updated: normalMap (created once, ?card= gated) + clearcoat lever (0.12/0.55, ?card= gated); `Card` faceMat clearcoat aligned (0.12, ?card= gated)

## Deviations from Plan

### Observations

**1. [Observation] Plan grep gate too broad for clearcoat cap check**
- **Found during:** Task 2 verification
- **Issue:** The plan's verify script `s.matchAll(/clearcoat:\s*([0-9.]+)/g)` over the entire file matches pre-existing non-card materials (wood varnish 0.72, chips 0.42/0.32) which have always exceeded 0.18. These are NOT card stock materials and were never touched by this plan.
- **Resolution:** Manual scoped check confirms all card clearcoat literals <= 0.16 (base A/B cap), active = 0.12. The intended constraint (card stock clearcoat <= 0.18) is fully satisfied. The grep gate pattern is a documentation issue, not a real failure.
- **Filed for:** eval-rig improvement (out of TP2 lever scope — deferred to future TP-rig touch-up)

## Locked Geometry Verification (SSOT §TP2)

| Constant | Required | Actual | Status |
|----------|----------|--------|--------|
| CARD_CORNER | 0.17 | 0.17 | LOCKED (untouched) |
| curveSegments | >= 14 | 14 | LOCKED (untouched) |
| CARD_FACE_Z | — | 0.071 | LOCKED (untouched) |

Frozen cameras (card/hero/macro), felt material, anisotropy lever, geometry — all untouched.

## Known Stubs

None — levers 3 and 4 are fully wired (normalMap + clearcoat change both render).

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes. Lab-only (`frontend/src/lab/`), not in the production build. No new threat surface vs plan 03-02.

## Next Phase Readiness

- **Lever 3 (micro-relief normal map) SHIPPED.** `cardMicroReliefNormalMap()` (NoColorSpace, single instance, normalScale 0.12) active by default; `?card=base` disables all TP2 levers for A/B.
- **Lever 4 (clearcoat whisper) SHIPPED.** Stock clearcoat 0.12 / clearcoatRoughness 0.55 (was 0.16/0.5); faceMat aligned. Within SSOT 0.12-0.18 range.
- **Plan 03-04** (next lever — paper-edge warm sheen-rim: sheen 0.22→0.35, sheenColor warmer) can now execute with Levers 1-4 as the active base.
- **No blockers.** 27/27 lab Vitest green; locked geometry intact; M1 floor held 31px; M5 PASS.

## Self-Check: PASSED

- FOUND: `frontend/src/lab/textures.ts` (modified — `cardMicroReliefNormalMap()` exported)
- FOUND: `frontend/src/lab/TableLab.tsx` (modified — import + useCardKit normalMap + clearcoat + faceMat)
- FOUND commit: 327102e (Task 1: Lever 3)
- FOUND commit: a0d0f17 (Task 2: Lever 4)
- FOUND: `.dev-stack/diag/table-3d/tp2/lever3-relief/card-relief.png` (LOCAL, gitignored)
- FOUND: `.dev-stack/diag/table-3d/tp2/lever3-relief/macro-relief.png` (LOCAL, gitignored)
- FOUND: `.dev-stack/diag/table-3d/tp2/lever4-clearcoat/card-coat.png` (LOCAL, gitignored)
- FOUND: `.dev-stack/diag/table-3d/tp2/lever4-clearcoat/macro-coat.png` (LOCAL, gitignored)
- cardMicroReliefNormalMap exported + NoColorSpace path + wired: grep gate PASS
- Card clearcoat cap <= 0.18: PASS (active: 0.12; base A/B: 0.16 stock / 0.1 face)
- 27/27 lab Vitest: PASS
- M1 floor: 31px >= 9px: PASS (no regression)
- M5 highlight-clip: feltClipPct=0%, frameClipPct=0%: PASS (identical to tp2-base baseline)
- No plastic/laminated STOP triggered

---
*Phase: 03-tp2-cartas-materiality-legibility-protagonist*
*Completed: 2026-06-11*
