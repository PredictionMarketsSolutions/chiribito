---
phase: 07-tp6-profundidad-composicion-depth
plan: "05"
subsystem: frontend-lab-scene-composition
tags:
  - center-game-state
  - deck-stub
  - dealer-button
  - composition
  - tp6
  - scene-graph
dependency_graph:
  requires:
    - "07-04-SUMMARY.md (EffectComposer stack complete: N8AO+DOF+BrightnessContrast+Vignette+Noise)"
  provides:
    - "CenterGameState component: 4-card face-down deck stub at [0.3, 0.0495, -1.3] + cream dealer button at [-0.7, 0.022, -1.6]"
    - "Empty felt zones eliminated — table reads as mid-hand game in progress"
    - "Unconditionally mounted (scene-graph object, not postprocessing); reads under ?fx-off and ?fx-on"
    - "Scope audit PASS: DECK_POS radius 1.33wu <= 2wu; BUTTON_POS radius 1.75wu <= 2wu"
    - "Zero new deps: deck stub reuses kit.body (cardBodyGeometry) + kit.stock (no new geometry/material deps)"
    - "cards>board>rail hierarchy reinforced (hole cards remain the clear protagonist)"
    - "grep-check-tp5-06 EXIT 0 (M7 PASS); tsc src/lab/ 0 errors; vitest 45/45 green"
    - "Captures at .dev-stack/diag/tp6/cgs-{hero,hero-fx,card-fx,macro-fx}.png (RTX 4060, zero errors)"
  affects:
    - "frontend/src/lab/TableLab.tsx (CenterGameState component + unconditional mount in Scene JSX)"
tech_stack:
  added: []
  patterns:
    - "CenterGameState: kit.body (cardBodyGeometry ExtrudeGeometry) + kit.stock (MeshPhysicalMaterial) reuse — zero new texture/geometry assets"
    - "Deck stub scatter: Math.sin(i*1.7)*0.008 x-jitter + Math.cos(i*2.3)*0.006 z-jitter + i*0.04 ry rotation per card"
    - "Dealer button: cylinderGeometry [0.28, 0.28, 0.04, 24] + MeshPhysicalMaterial cream #f0e8d0 roughness=0.80 metalness=0"
    - "FELT_REST_Y_CGS = 0.0495 (CARD_T/2 + 0.022) and CARD_T_CGS = 0.055 — exact values from cards.ts"
    - "Unconditional mount BEFORE EffectComposer ?fx guard — CenterGameState is scene content, not a compositor effect"
key_files:
  created: []
  modified:
    - frontend/src/lab/TableLab.tsx
key_decisions:
  - "FELT_REST_Y_CGS=0.0495 (=0.055/2+0.022 from cards.ts FELT_REST_Y exact formula); CARD_T_CGS=0.055"
  - "DECK_POS [0.3, 0.0495, -1.3]: radius=sqrt(0.09+1.69)=sqrt(1.78)=1.33wu — PASS (<=2wu center-only)"
  - "BUTTON_POS [-0.7, 0.022, -1.6]: radius=sqrt(0.49+2.56)=sqrt(3.05)=1.75wu — PASS (<=2wu center-only)"
  - "Placed as constants FELT_REST_Y_CGS / CARD_T_CGS at module scope (not re-imported from cards.ts) to keep component self-contained and avoid circular dep concerns"
  - "CenterGameState mounted unconditionally in Scene JSX, BEFORE the EffectComposer ?fx conditional"
  - "No new packages, no new texture files, no new geometry assets — zero dependency footprint"
metrics:
  duration: ~15min
  completed: "2026-06-12"
---

# Phase 7 Plan 05: TP6 CenterGameState (deck stub + dealer button) Summary

**4-card face-down deck stub (kit.body+kit.stock, zero new deps) + cream dealer button (cylinderGeometry+MeshPhysicalMaterial) at table center; unconditionally mounted; scope audit PASS (1.33wu + 1.75wu <= 2wu); empty felt zones eliminated; hole cards remain protagonist; grep-check+tsc+vitest all green**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-12T17:00:00Z
- **Completed:** 2026-06-12
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- CenterGameState function component added inline in TableLab.tsx (before the `Seats/SeatHands` section, after all chip/card groups)
- 4-card face-down deck stub: 4 mesh elements each using `kit.body` geometry (the shared `cardBodyGeometry()` ExtrudeGeometry) and `kit.stock` material — zero new geometry or texture assets; card positions scattered deterministically (Math.sin/Math.cos seeds) so the stack reads hand-placed
- Dealer button: `cylinderGeometry` args `[0.28, 0.28, 0.04, 24]` with `MeshPhysicalMaterial` (color `#f0e8d0`, roughness 0.80, metalness 0) — reads as a matte cream game-state marker, not a casino chip
- `<CenterGameState kit={cardKit} />` mounted unconditionally in Scene JSX, BEFORE the `{qp("fx") !== null && ...}` EffectComposer block
- Both ?fx-off and ?fx-on captures confirm deck stub + dealer button are present in both paths
- Visual read: the large empty felt zone to the left/center of the demoted pot is now occupied; table communicates "mid-hand game in progress" at a glance
- cards>board>rail hierarchy reinforced: hole cards (Perla de Oros) remain the clear foreground protagonist; deck stub sits mid-felt as quiet game-state, not competing
- grep-check-tp5-06 exits 0 (M7 PASS: no Bloom; EffectComposer permitted; TP5 invariants held)
- tsc under src/lab/: 0 errors (pre-existing errors in src/app/ are pre-existing, not introduced by this plan)
- vitest src/lab/: 45/45 green

## Task Commits

1. **Task 1: Add CenterGameState (deck stub + dealer button) to TableLab.tsx** - `80a449b` (feat)

## Files Created/Modified

- `frontend/src/lab/TableLab.tsx` — CenterGameState function component + FELT_REST_Y_CGS/CARD_T_CGS constants + unconditional `<CenterGameState kit={cardKit} />` in Scene JSX

## Constants Used (from cards.ts)

| Constant | Source | Value | Usage |
|----------|--------|-------|-------|
| `FELT_REST_Y_CGS` | `CARD_T / 2 + 0.022` | `0.0495` | DECK_POS[1] — deck rests on felt surface |
| `CARD_T_CGS` | `CARD_T = 0.055` | `0.055` | y-stacking delta per card in deck stub |

## Scope Audit (Anti-scope-creep)

| Object | Position | XZ distance from [0,0,0] | Gate (<=2wu) |
|--------|----------|--------------------------|-------------|
| Deck stub | [0.3, 0.0495, -1.3] | sqrt(0.09 + 1.69) = sqrt(1.78) = **1.33wu** | **PASS** |
| Dealer button | [-0.7, 0.022, -1.6] | sqrt(0.49 + 2.56) = sqrt(3.05) = **1.75wu** | **PASS** |

No other positions in CenterGameState. No per-seat objects. No opponent hands. No chip piles at seat positions.

## Visual Description (hero shot)

At ?cam=hero (the canonical frozen money shot), the CenterGameState reads:
- **Deck stub**: a clean off-white card stack is visible left of center at the felt, clearly reading as the remaining deck. The 4-card scatter gives it a hand-placed quality rather than a machined cylinder. The card stock (`kit.stock`) warm ivory color (#f1e7cf) reads softly against the green felt.
- **Dealer button**: a small cream disc visible upper-left of the deck stub, distinctly smaller than the cards. Matte finish (roughness 0.80) prevents any casino glint. Reads as a quiet game-state marker.
- **Hierarchy preserved**: hole cards (Sota de Oros + 7 de Oros) dominate the foreground; community board is visible mid-felt; deck stub + button at back-center; chip accent at right — cards remain the absolute protagonist.

## Unconditional Mount Confirmation

| Path | CenterGameState present | Evidence |
|------|------------------------|---------|
| ?fx-off (default) | YES | cgs-hero.png — deck stub + button clearly visible |
| ?fx-on | YES | cgs-hero-fx.png — deck stub + button visible through full postprocessing stack |

## Capture Record

| Shot | Path | GPU | Errors |
|------|------|-----|--------|
| Hero (?cam=hero, no fx) | `.dev-stack/diag/tp6/cgs-hero.png` | RTX 4060 D3D11 | 0 |
| Hero (?cam=hero&fx) | `.dev-stack/diag/tp6/cgs-hero-fx.png` | RTX 4060 D3D11 | 0 |
| Card (?cam=card&fx) | `.dev-stack/diag/tp6/cgs-card-fx.png` | RTX 4060 D3D11 | 0 |
| Macro (?cam=macro&fx) | `.dev-stack/diag/tp6/cgs-macro-fx.png` | RTX 4060 D3D11 | 0 |

## Verification Results

| Check | Command | Result |
|-------|---------|--------|
| CenterGameState present + no Bloom | node -e regexp | OK — CenterGameState in non-comment code; no Bloom |
| grep-check-tp5-06 | `node tools/table-3d/grep-check-tp5-06.cjs` | EXIT 0 — 6/6 checks pass |
| tsc under src/lab/ | `cd frontend && npx tsc --noEmit 2>&1 \| grep src/lab` | CLEAN — 0 errors in src/lab/ |
| vitest src/lab/ | `cd frontend && npx vitest run src/lab/` | 45/45 GREEN |
| Scope audit | XZ distance calculation | DECK 1.33wu + BUTTON 1.75wu — both <= 2wu PASS |

## Deviations from Plan

### Auto-fixed Issues

None. Plan executed exactly as written.

The component code pattern from RESEARCH Pattern 6 matched exactly. FELT_REST_Y (= 0.0495) and CARD_T (= 0.055) were read directly from cards.ts. The constants were declared at module scope as `FELT_REST_Y_CGS` and `CARD_T_CGS` (with `_CGS` suffix to avoid name collision with the local `FELT_R`, `R`, `H` constants already at module scope in TableLab.tsx — the original `FELT_REST_Y` is module-scoped to cards.ts and not re-exported from TableLab.tsx).

## ?fx-off Path Confirmation

`qp("fx") === null` (default URL): EffectComposer and all its children (N8AO/DOF/BrightnessContrast/Vignette/Noise) NOT mounted. CenterGameState IS mounted (unconditional — placed before the `{qp("fx") !== null && ...}` guard). The deck stub + dealer button are always present regardless of the ?fx flag.

## M10 Draw Count Note

CenterGameState adds 5 draw calls: 4 deck-stub meshes + 1 dealer button mesh. Baseline with prior plans was 57 draws (TP6 Wave 1: N8AO alone). The M10 HERO ceiling is 150 draws. 5 additional draws are well within the ceiling and consistent with the "small delta" requirement.

## Known Stubs

None. The deck stub and dealer button are fully wired to their geometry + materials. No placeholder values. The component reads correctly under all camera presets.

## Input Contract for 07-06 (Full Metric Suite) and 07-07 (Operator Gate)

The scene is now complete with all TP6 additions:
- N8AO crevice AO (07-02)
- DepthOfField whisper (07-03)
- BrightnessContrast + Vignette + Noise filmic grade (07-04)
- CenterGameState deck stub + dealer button (07-05, this plan)

07-06 may run the full M-series metric suite. 07-07 (operator gate) will judge the complete TP6 composition including the center game-state.

The CenterGameState center-game-state section for 07-07:
- Deck stub position: [0.3, 0.0495, -1.3]
- Dealer button position: [-0.7, 0.022, -1.6]
- Both within 2wu center-only radius
- Hero capture at cgs-hero.png (no fx) and cgs-hero-fx.png (full stack)

## Threat Flag Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. CenterGameState operates entirely in the GPU scene graph — 3D geometry on the CPU/GPU, no network access, no user data.

**T-07-05a (scope creep):** NOT triggered. Only 2 object types (deck stub + button). All positions within 2wu.
**T-07-05b (inside ?fx guard):** NOT triggered. CenterGameState placed unconditionally BEFORE EffectComposer.
**T-07-05c (new geometry/material deps):** NOT triggered. Deck stub uses kit.body+kit.stock. Button uses standard cylinderGeometry + MeshPhysicalMaterial (no new packages).
**T-07-05d (wrong FELT_REST_Y/CARD_T):** NOT triggered. Values 0.0495 / 0.055 read directly from cards.ts formula. Deck cards sit on felt at y=0.0495 (base of stack).

## Self-Check

```
git log --oneline -2:
80a449b feat(07-05): add CenterGameState (deck stub + dealer button) at table center
0c90be9 docs(07-04): complete Vignette+BrightnessContrast+Noise plan -- 07-04-SUMMARY + STATE + ROADMAP tracking
```

- [x] frontend/src/lab/TableLab.tsx — FOUND (CenterGameState component + mount in JSX)
- [x] .dev-stack/diag/tp6/cgs-hero.png — FOUND (RTX 4060 capture, no fx)
- [x] .dev-stack/diag/tp6/cgs-hero-fx.png — FOUND (RTX 4060 capture, with fx)
- [x] .dev-stack/diag/tp6/cgs-card-fx.png — FOUND
- [x] .dev-stack/diag/tp6/cgs-macro-fx.png — FOUND
- [x] Commit 80a449b — FOUND (feat: add CenterGameState)

## Self-Check: PASSED
