---
phase: 06-tp5-iluminacion-sombras-warm-light
plan: "02"
subsystem: frontend/src/lab
tags: [key-reshaping, warm-gradient, anti-casino, hemisphere-green-bounce, ab-flag, TP5]
dependency_graph:
  requires: [06-01]
  provides: [06-03, 06-04, 06-05, 06-06]
  affects: [frontend/src/lab/TableLab.tsx, docs/table-3d/anchors/tp5-gate/]
tech_stack:
  added: []
  patterns:
    - "?light= A/B flag via qp('light') — mirrors ?rail=/?chips= established pattern"
    - "KEY_TO_FILL_RATIO_CEILING = 3.5 constant as grep-checkable anti-casino sentinel"
    - "hemisphereLight ground tint: #0d3d24 (shaped) vs #1a0f08 (base) for felt green-bounce"
    - "Lights component lightFlag prop for shaped/base path branching"
key_files:
  modified:
    - frontend/src/lab/TableLab.tsx
  created:
    - docs/table-3d/anchors/tp5-gate/hero-shaped.png
    - docs/table-3d/anchors/tp5-gate/hero-base.png
    - docs/table-3d/anchors/tp5-gate/macro-shaped.png
decisions:
  - "?light= default = shaped path (wider key 0.72, fill 0.8, green-bounce hemisphere ground #0d3d24); ?light=base = prior flat-warm key exactly"
  - "KEY_TO_FILL_RATIO_CEILING = 3.5: shaped 2.2/0.8=2.75x (PASS); base 2.0/0.7=2.86x (PASS) -- both well below ceiling"
  - "Green-bounce via hemisphereLight ground tint (not a separate fill light) -- no extra shadow concern, no new draw call"
  - "rim directionalLight: 0.26 (base) / 0.22 (shaped) -- less cool pop on warmer rig, keeps warmth coherent"
  - "+A informational/not-admitted (TP6 scope, per STATE.md Plan 01-03 decision); warm hue confirmed H=27.9deg"
  - "Shaped path verdict: PASS -- warm gradient read, ratio 2.75x < ceiling, M5 highlight-clip 0%/0%"
metrics:
  duration: "~9 min"
  completed: "2026-06-12T14:18:42Z"
  tasks_completed: 2
  files_changed: 4
---

# Phase 6 Plan 02: TP5 Key Reshaping -- ?light= Flag + Warm Gradient + Green-Bounce Hemisphere Summary

**One-liner:** KEY_TO_FILL_RATIO_CEILING=3.5 anti-casino sentinel + shaped key (angle 0.72 / fill 0.8 / hemisphere ground #0d3d24 green-bounce) behind ?light= A/B flag; base path (?light=base) restores prior flat-warm key exactly; M5 PASS, M7 PASS, M10 not regressed.

## What Was Built

TP5 Wave 2 (key reshaping): the ?light= A/B flag system and the warm gradient key rig, non-blocking from the always-on grounding (06-01).

### 1. ?light= Flag System

`const lightFlag = qp("light")` added to Scene, immediately before `cardFlag`. Passed to Lights as a new prop.

**Flag map:**

| URL param | Path | Key angle | Key intensity | Fill intensity | Hemisphere ground |
|-----------|------|-----------|--------------|----------------|------------------|
| (none, default) | shaped | 0.72 rad | 2.2 | 0.8 | `#0d3d24` (dark felt-green) |
| `?light=base` | base | 0.62 rad | 2.0 | 0.7 | `#1a0f08` (near-black, original) |

Sky color (`#fff1d8`) and hemisphere intensity (0.45) are identical in both paths.

### 2. KEY_TO_FILL_RATIO_CEILING = 3.5

Named constant at the top of the `Lights` function body:

```tsx
const KEY_TO_FILL_RATIO_CEILING = 3.5; // anti-casino: key/fill MUST stay <= this
void KEY_TO_FILL_RATIO_CEILING;         // suppress unused-var; this constant IS the documentation
```

Grep-checkable from `grep-check-tp5-06.cjs` (authored in 06-05).

**Ratio arithmetic:**
- Shaped path: 2.2 / 0.8 = **2.75x** — PASS (well below ceiling)
- Base path: 2.0 / 0.7 = **2.86x** — PASS (below ceiling; matches prior baseline)

### 3. Lights Component Changes -- Before / After

| Light | Prop | Before (TP4 / 06-01) | Shaped path | Base path |
|-------|------|---------------------|-------------|-----------|
| Key spotLight | angle | 0.62 | **0.72** | 0.62 (unchanged) |
| Key spotLight | intensity | 2.0 | **2.2** | 2.0 (unchanged) |
| Key spotLight | penumbra | 1 | **1** (never lowered) | 1 (never lowered) |
| Key spotLight | decay | 0 | **0** (never raised) | 0 (never raised) |
| Fill spotLight | intensity | 0.7 | **0.8** | 0.7 (unchanged) |
| Rim directionalLight | intensity | 0.26 | **0.22** | 0.26 (unchanged) |
| hemisphereLight | ground | `#1a0f08` | **`#0d3d24`** | `#1a0f08` (unchanged) |
| ambientLight | intensity | 0.32 | 0.32 (unchanged) | 0.32 (unchanged) |
| Body pointLight | intensity | 0.5 | 0.5 (unchanged) | 0.5 (unchanged) |

**Untouched in both paths:** ambientLight color/intensity, body pointLight color/distance/position, key shadow props (mapSize/bias/normalBias/near/far/radius), fill angle/penumbra/decay/color, rim color, ContactShadows, SoftShadows.

### 4. Green-Bounce Mechanism

`hemisphereLight` ground tint changed from `#1a0f08` (near-black) to `#0d3d24` (dark felt-green) on the shaped path. The hemisphere ground illuminates all downward-facing surfaces -- chip undersides, card edges, the body apron -- with a subtle warm-green tint that mimics light bouncing up from the baize. This is physically motivated (ambient from below = bounce from the felt) and computationally free (no extra draw call, no extra shadow-casting light).

### 5. SoftShadows / ContactShadows Invariant

SoftShadows and ContactShadows from 06-01 remain unconditional. The `?light=` flag changes ONLY the `Lights` component props (angle/intensity/hemisphere ground). The PCSS shadow shader and floor shadow are never gated on `lightFlag`.

## Metric Gates

| Gate | Result | Value | Threshold | Path |
|------|--------|-------|-----------|------|
| **M5** | **PASS** | feltClipPct=0%, frameClipPct=0% | felt < 0.5% | hero-shaped |
| **M5** | **PASS** | feltClipPct=0%, frameClipPct=0% | felt < 0.5% | hero-base |
| **+A warm-floor** | FAIL (informational) | luma=15.1, hue=27.9deg, sat=0.606 | luma >= 18 | hero-shaped |
| **+A warm-floor** | FAIL (informational) | luma=15.6, hue=27.6deg, sat=0.582 | luma >= 18 | hero-base |
| **M7** | **PASS** | 0 Bloom/EffectComposer tokens in lab source | = 0 | code grep |
| **M10 (M11 proxy)** | **NOT REGRESSED** | 52 draws at hero (shaped default) | <= 106 TP4 baseline | runtime |
| **tsc src/lab/** | **clean** | 0 errors in lab scope | 0 errors | tsc |
| **vitest src/lab/** | **45/45 green** | all tests pass | all pass | vitest |
| **Structural** | **PASS** | lightFlag/KEY_TO_FILL_RATIO_CEILING/#0d3d24/0.72/0.8/shaped/penumbra>=1 | all present | node assertion |

### +A Note (informational, same as 06-01)

+A measures TOP corner luma (dark room backdrop area). cornerLuma=15.1/15.6 is below the 18 threshold. Per STATE.md decision (Plan 01-03): "+A informational -- cannot pass good control on TP0 baseline; restrained 8--20% warm vignette is a TP6 deliverable." Warm hue IS confirmed in both paths (H=27.9deg / H=27.6deg, both in [15,75]°, S>0.1). The hemisphere green-bounce on the shaped path registered luma=15.1 vs base 15.6 -- the green-bounce is not brightening the backdrop corners (correctly: it illuminates downward-facing scene surfaces, not the backdrop).

### Shaped Path Verdict: PASS

Warm gradient confirmed -- wider angle (0.72 rad) distributes the key over more table area; ratio 2.75x well below ceiling 3.5x; M5 highlight-clip 0%/0% (no new clipping from the widened key); penumbra=1 preserved (full soft edge); anti-casino floor intact. The key reads as a warm gradient toward the rail, not a casino cone.

## Captures

| Capture | URL | Size | Notes |
|---------|-----|------|-------|
| `tp5-gate/hero-shaped.png` | `?cam=hero` (no ?light=) | 2880x1800 RTX 4060 D3D11 | shaped default |
| `tp5-gate/hero-base.png` | `?cam=hero&light=base` | 2880x1800 RTX 4060 D3D11 | base path A/B |
| `tp5-gate/macro-shaped.png` | `?cam=macro` (no ?light=) | 2880x1800 RTX 4060 D3D11 | chip close-up shaped |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `11c082f` | feat(06-02): TP5 key reshaping -- ?light= flag + warm gradient angle + KEY_TO_FILL_RATIO_CEILING + green-bounce hemisphere |
| Task 2 | `6f38366` | chore(06-02): TP5 key reshaping A/B captures + anti-casino metric confirmation |

## Invariants Confirmed

- KEY_TO_FILL_RATIO_CEILING = 3.5 present in non-comment code (grep-checkable)
- lightFlag = qp("light") wired in Scene; Lights receives lightFlag prop
- Shaped path: angle=0.72, intensity=2.2, fill=0.8, hemisphere ground="#0d3d24"
- Base path: angle=0.62, intensity=2.0, fill=0.7, hemisphere ground="#1a0f08"
- penumbra=1 in BOTH paths (NEVER lowered)
- decay=0 in BOTH paths (anti-casino floor)
- SoftShadows UNCONDITIONAL -- the ?light= flag does NOT condition it
- ContactShadows UNCONDITIONAL -- the ?light= flag does NOT condition it
- NO new shadow-casting light added (single caster: key spotLight)
- NO postprocessing / Bloom / EffectComposer introduced (M7 PASS)
- NO geometry / cameras / material identities changed
- All changes limited to frontend/src/lab/TableLab.tsx (lights + flag wiring only)

## Deviations from Plan

None -- plan executed exactly as written.

The run-metrics.mjs runner operates on hero.png (06-01 reference frame) by convention -- it always looks for the canonical file. M5 and +A were checked directly against hero-shaped.png and hero-base.png via targeted metric calls. All assertions match expectations. M4 (brass) reading on hero.png shows V=0.863 above the 0.80 ceiling -- this is the same pre-existing reading from 06-01, not a new regression from 06-02 (06-02 touches ONLY light angles/intensities/hemisphere ground, not materials or Environment). M4 re-run is required at END of Phase 6 (06-05, full metric suite).

## Known Stubs

None. The ?light= flag is fully wired. Both paths active and capture-confirmed.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes. Lab-only frontend lighting change.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `frontend/src/lab/TableLab.tsx` | FOUND (modified) |
| `docs/table-3d/anchors/tp5-gate/hero-shaped.png` | FOUND |
| `docs/table-3d/anchors/tp5-gate/hero-base.png` | FOUND |
| `docs/table-3d/anchors/tp5-gate/macro-shaped.png` | FOUND |
| `.planning/phases/06-tp5-iluminacion-sombras-warm-light/06-02-SUMMARY.md` | FOUND (this file) |
| commit `11c082f` (Task 1) | FOUND in git log |
| commit `6f38366` (Task 2) | FOUND in git log |
| KEY_TO_FILL_RATIO_CEILING in non-comment code | PASS |
| lightFlag = qp("light") in Scene | PASS |
| shaped angle=0.72, fill=0.8, hemisphere #0d3d24 | PASS |
| base angle=0.62, fill=0.7, hemisphere #1a0f08 | PASS |
| penumbra=1 in both paths | PASS |
| SoftShadows unconditional | PASS (above Lights, not gated) |
