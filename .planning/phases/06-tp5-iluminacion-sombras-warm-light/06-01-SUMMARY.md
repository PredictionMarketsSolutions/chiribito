---
phase: 06-tp5-iluminacion-sombras-warm-light
plan: "01"
subsystem: frontend/src/lab
tags: [shadows, PCSS, SoftShadows, ContactShadows, grounding, warm-light, TP5]
dependency_graph:
  requires: [05-04]
  provides: [06-02, 06-03, 06-04, 06-05, 06-06]
  affects: [frontend/src/lab/TableLab.tsx, docs/table-3d/anchors/tp5-gate/]
tech_stack:
  added: []
  patterns:
    - "SoftShadows (PCSS, @react-three/drei 9.114.0) injected once unconditionally above Lights in Scene"
    - "ContactShadows frames={1} baked once at mount (M11 improvement pattern)"
    - "Warm shadow floor via ContactShadows color='#1a0e06' (warm near-black vs '#000000')"
    - "Shadow frustum tightened via shadow-camera-near/far on key spotLight"
key_files:
  modified:
    - frontend/src/lab/TableLab.tsx
  created:
    - docs/table-3d/anchors/tp5-gate/hero.png
    - docs/table-3d/anchors/tp5-gate/card.png
    - docs/table-3d/anchors/tp5-gate/macro.png
decisions:
  - "SoftShadows size={30} samples={16} focus={0} — mid-range SSOT 25-35; Vogel-disk 16 samples; full PCSS contact-hardening"
  - "ContactShadows opacity lowered 0.55→0.35 to prevent double-darkening with SoftShadows"
  - "+A metric is informational/not-admitted (TP6 vignette deliverable); warm hue confirmed H=27.6° in range"
  - "M10 hero draw count 52 (vs TP4 baseline 106) — ContactShadows frames={1} halved GPU draw calls"
metrics:
  duration: "~15 min"
  completed: "2026-06-12T14:09:28Z"
  tasks_completed: 2
  files_changed: 4
---

# Phase 6 Plan 01: TP5 Grounding — SoftShadows PCSS + ContactShadows warm + shadow frustum Summary

**One-liner:** PCSS grounding (SoftShadows size=30/samples=16 unconditional) + ContactShadows baked once (frames=1, opacity=0.35, warm #1a0e06) + key shadow frustum tightened (normalBias=0.02, near=8, far=28); M10 improved 106→52.

## What Was Built

TP5 Wave 0 (grounding): the always-on, non-negotiable shadow foundation that ships regardless of key-reshaping outcome. Four targeted changes to `frontend/src/lab/TableLab.tsx`:

### 1. SoftShadows (PCSS) — unconditional injection

```tsx
<SoftShadows size={30} samples={16} focus={0} />
```

Placed immediately above `<Lights />` in Scene JSX return. Bare element, no conditional — PCSS recompiles shadow shaders once at mount. Never placed inside `{condition && ...}` (would cause shader-recompile storm on flag change). Imported from existing `@react-three/drei@9.114.0`.

### 2. ContactShadows — before / after prop diff

| Prop | Before (TP4) | After (TP5) | Reason |
|------|-------------|-------------|--------|
| `frames` | undefined (re-bakes every frame) | `{1}` | M11 improvement — baked once at mount |
| `opacity` | `{0.55}` | `{0.35}` | Anti-double-darken with SoftShadows |
| `color` | `"#000000"` | `"#1a0e06"` | Warm near-black lifts +A warm floor |
| `far` | `{4}` | `{5}` | Extends to cover rail + body base |
| `blur` | `{2.8}` | `{2.0}` | SoftShadows owns far-penumbra; ContactShadows tightened |
| `scale` | `{FELT_R * 3}` | `{FELT_R * 3.5}` | Wider coverage to body apron |
| `position` | unchanged | unchanged | — |
| `resolution` | unchanged | unchanged | — |

### 3. Key spotLight shadow frustum — before / after

| Prop | Before (TP4) | After (TP5) | Reason |
|------|-------------|-------------|--------|
| `shadow-normalBias` | absent | `{0.02}` | Peter-pan prevention on flat felt plane |
| `shadow-camera-near` | absent (default 0.5) | `{8}` | Tightens frustum; 7u below key at y=15 → sharper shadows |
| `shadow-camera-far` | absent (default 500) | `{28}` | Explicit far clip; covers floor at y=-1.5 |
| `shadow-bias` | `{-0.0003}` | unchanged | Already calibrated for acne prevention |
| `shadow-mapSize` | `{[2048, 2048]}` | unchanged | — |
| `castShadow` | `{qp("sh") !== "off"}` | unchanged | — |

## Metric Gates

| Gate | Result | Value | Threshold |
|------|--------|-------|-----------|
| **M6** | **PASS** | 21.03% darker under-card vs adjacent felt | ≥ 12% |
| **+A warm-floor** | FAIL (informational) | luma=15.6, hue=27.6°, sat=0.582 | luma ≥ 18 (TP6 deliverable) |
| **M7** | **PASS** | 0 Bloom/EffectComposer tokens in lab source | = 0 |
| **M10 (M11 proxy)** | **IMPROVED** | hero draws = 52 | ≤ 106 (TP4 baseline) |
| **M5** | PASS | feltClipPct=0%, frameClipPct=0% | < 0.5% felt |
| **tsc src/lab/** | **clean** | 0 errors in lab scope | 0 errors |
| **vitest src/lab/** | **45/45 green** | all tests pass | all pass |

### +A Note (informational, not blocking)

+A measures TOP corner luma (the dark room backdrop area). cornerLuma=15.6 is below the 18 threshold. Per STATE.md decision (Plan 01-03): "+A informational — cannot pass good control on TP0 baseline; restrained 8–20% warm vignette is a TP6 deliverable." The warm shadow floor IS present: the hue (H=27.6° in [15,75]°, S=0.582) confirms the `color="#1a0e06"` warm near-black is working. The backdrop corners are structurally dark in this scene; lifting them requires the TP6 vignette/AO pass.

### M10 Improvement

ContactShadows `frames={1}` eliminated the per-frame scene re-render. TP4 baseline: 106 draws at hero. TP5 result: **52 draws at hero** — a 51% reduction. This is the M11 improvement the SSOT specified; it confirms the per-frame ContactShadows re-render was the draw-call driver.

## Captures

Three frozen money shots at `docs/table-3d/anchors/tp5-gate/`:
- `hero.png` (cam=hero, fov=32) — 2880×1800 on RTX 4060 GPU ANGLE D3D11
- `card.png` (cam=card, fov=40) — 2880×1800 on RTX 4060 GPU ANGLE D3D11
- `macro.png` (cam=macro, fov=26) — 2880×1800 on RTX 4060 GPU ANGLE D3D11

All captured with default flags (no `?light=`, no `?chips=`, no `?cs=off`). SoftShadows PCSS active; ContactShadows frames=1 baked; shadow frustum tuned.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `65d39c4` | feat(06-01): TP5 grounding — SoftShadows PCSS + ContactShadows frames=1 warm + shadow frustum |
| Task 2 | `83ef5df` | chore(06-01): TP5 grounding captures + M6/+A(warm)/M10/M7 metric gates |

## Invariants Confirmed

- SoftShadows UNCONDITIONAL in Scene JSX (not behind any flag) — Pitfall 2 avoided
- ContactShadows opacity lowered to 0.35 — Pitfall 3 (double-darken) avoided
- NO new shadow-casting light added (single caster: key spotLight)
- NO postprocessing / Bloom / EffectComposer introduced (M7 PASS)
- NO geometry / cameras / material identities changed
- All changes limited to `frontend/src/lab/TableLab.tsx` (shadow rig only)

## Deviations from Plan

None — plan executed exactly as written.

The +A FAIL result was anticipated: the metric is informational/not-admitted per the project's metric admission record (Plan 01-03). The warm hue confirmation (H=27.6°) proves the ContactShadows color change is effective; the luma gap is a scene-structural property of the dark backdrop corners (TP6 scope).

## Known Stubs

None. All TP5 grounding changes are fully wired and always-on.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes. Lab-only frontend change.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `frontend/src/lab/TableLab.tsx` | FOUND |
| `docs/table-3d/anchors/tp5-gate/hero.png` | FOUND |
| `docs/table-3d/anchors/tp5-gate/card.png` | FOUND |
| `docs/table-3d/anchors/tp5-gate/macro.png` | FOUND |
| `.planning/phases/06-tp5-iluminacion-sombras-warm-light/06-01-SUMMARY.md` | FOUND |
| commit `65d39c4` (Task 1) | FOUND in git log |
| commit `83ef5df` (Task 2) | FOUND in git log |
