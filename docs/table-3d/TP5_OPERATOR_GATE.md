# TP5 — Iluminación & Sombras · Operator Gate (plan 06-06)

**Date:** 2026-06-12
**Branch:** `spike/table-3d-hero` (LOCAL — no push/deploy/merge)
**Plan:** 06-06 (autonomous:false — perceptual gate, the GSD↔Chiribito human seam)

## Operator verdict: AUTO-APPROVED — TP5 SHIPS IN FULL

> **Transparency note (final-report batch review):** This gate was **AUTO-APPROVED under the
> operator's standing "auto-approve (0 paradas)" directive** for this milestone run — all TP5
> HARD gates are green AND the orchestrator's CEO visual read of the 7 GPU-faithful gate stills
> (hero-final, card, macro, hero-shaped, hero-base, macro-shaped, rail-shaped) was: warm gradient
> not a casino cone, honest grounding, body lit as a volume without floating, restrained per-material
> highlights, brass aged-not-gold, cards protagonist, no cold void. This is NOT a live on-device
> operator A/B session. The auto-approval is valid under the standing directive but should be
> flagged in any batch review for the operator's eventual confirmation of the visual read.

The TP5 gate question answered YES:

- **"Every material under ONE warm motivated light, honest grounding, restrained highlights,
  no casino harshness / cold void?"**

  Answer: **YES.**

  The shaped warm key (angle 0.72, ratio 2.75x — well below the 3.5x ceiling) distributes light
  over the table as a gentle warm gradient toward the rail center, not a tight casino cone. The
  PCSS + ContactShadows grounding reads honest — chips and cards sit ON the felt with warm near-
  contact shadows, not hovering above cold void. Per-material highlights are restrained: the wood
  varnish catches a thin glint, chip edges catch light as matte-clay seals, brass reads aged-warm
  (M4 PASS H=35.4°/S=0.52/V=0.715). Green-bounce on object undersides is subtle (body underside
  G-delta +6.23 — perceptible but not a lime wash). Body outer wall reads as a volume (top luma
  109.1 vs underside 100.4, delta +8.8). The +A cornerLuma=15.1 is informational (structural dark
  backdrop; TP6 vignette scope — see deferred items below).

**Ship decision:** Full TP5 look ships as the default render. `?light=base` restores the prior
flat-warm key for A/B reference.

**0 workstreams reverted. 0 iterations.**

## A/B basis

| Shot | TP5 shaped default | "Before" (base path / prior flat-warm key) |
|------|-------------------|---------------------------------------------|
| HERO final (fov 32) | `docs/table-3d/anchors/tp5-gate/hero-final.png` | `docs/table-3d/anchors/tp5-gate/hero-base.png` |
| HERO shaped (fov 32) | `docs/table-3d/anchors/tp5-gate/hero-shaped.png` | `docs/table-3d/anchors/tp5-gate/hero-base.png` |
| CARD (fov 40) | `docs/table-3d/anchors/tp5-gate/card.png` | (base vs. shaped: grounding always-on in both) |
| MACRO (fov 26) | `docs/table-3d/anchors/tp5-gate/macro.png` | `docs/table-3d/anchors/tp5-gate/macro-shaped.png` |
| RAIL shaped | `docs/table-3d/anchors/tp5-gate/rail-shaped.png` | `docs/table-3d/anchors/tp5-gate/rail-base.png` |

All captures: 2880×1800 RTX 4060 GPU ANGLE D3D11. Grounding (SoftShadows PCSS + ContactShadows
frames=1 + warm shadow floor) is ALWAYS ON in both paths.

## Per-element SHIP disposition

| Element | Disposition | Key values |
|---------|-------------|------------|
| **GROUNDING** (always-on) | **SHIPS** — non-separable, unconditional | SoftShadows size=30/samples=16/focus=0; ContactShadows frames=1/opacity=0.35/color=#1a0e06/far=5/blur=2.0/scale=FELT_R*3.5; key shadow-normalBias=0.02/near=8/far=28 |
| **SHAPED KEY** (?light= separable) | **SHIPS as default** | angle=0.72/intensity=2.2/fill=0.8/rim=0.22; KEY_TO_FILL_RATIO_CEILING=3.5; shaped ratio 2.75x |
| **GREEN-BOUNCE** (hemisphere ground) | **SHIPS** | hemisphereLight ground #0d3d24 (shaped path); G-delta +6.23 at body underside (subtle — perceptible >2, not lime-wash <30) |
| **BODY VOLUME** | **SHIPS** | Top luma 109.1 vs underside 100.4; delta +8.8; table outer wall reads as a volume (resolves "table floats") |
| **PER-MATERIAL SPECULAR** | **SHIPS** | wood rough 0.42/clearcoat 0.68/clearcoatRoughness 0.25/envMapIntensity 0.50; body 0.52/0.44/0.35/0.4; card stock rough 0.60/clearcoatRoughness 0.50; card face rough 0.50; chip pre-dv 0.52/0.38/0.50/sheen 0.4 |
| **BRASS M4** | **SHIPS (fixed + PASS)** | #b89b74 (from #b8915a) + envMapIntensity 0.30 (from 0.45); H=35.4°/S=0.52/V=0.715 PASS; roughness 0.42 TP4-locked unchanged |

**0 workstreams reverted. 0 elements dropped.**

## HARD-gate confirmation table

| Gate | Metric | Value | Threshold | Verdict |
|------|--------|-------|-----------|---------|
| M4 brass tone | H / S / V | **H=35.4° / S=0.52 / V=0.715** | H∈[35,48]° / S≤0.55 / V≤0.80 | **PASS** |
| M4 brass rect | brassHero rect | (1350, 368, 140, 4) — actual ring | recalibrated from (1240,820,140,60) | **CALIBRATED** |
| M5 highlight-clip | feltClipPct / frameClipPct (hero) | **0% / 0%** | felt < 0.5% | **PASS** |
| M6 contact shadow | under-card vs adjacent felt (hero) | **20.19% darker** | ≥ 12% | **PASS** |
| M6 proxy (rail) | floor under body apron | **58.1% darker** | ≥ 12% | **PASS** |
| +A warm corner floor | cornerLuma / meanHue (hero-shaped) | **luma=15.1, H=27.9°** | luma≥18 (TP6) / hue∈[15,75]° | **INFO** (luma TP6 scope; warm hue PASS) |
| M7 no-Bloom | Bloom/EffectComposer tokens in frontend/src/lab/ | **0** | = 0 | **PASS** |
| M10 draw count | HERO draws | **52** | ≤ 106 (TP4 baseline) | **PASS (improved 106→52)** |
| grep-check-tp5-06.cjs | 6 structural invariants | **exit code 0 (6/6)** | must exit 0 | **PASS** |
| vitest (frontend/) | all tests | **398/398 green** | all green | **PASS** |
| tsc src/lab/ | type errors | **0 errors** | 0 errors | **PASS** |

### M4 RECT-RECALIBRATION FINDING (recorded faithfully per SSOT requirement)

The `brassHero` metric rect had been calibrated at TP0b as `{left:1240, top:820, width:140, height:60}`.
This rect was valid for the pre-ENCUADRE scene. **Plan 03-01 (ENCUADRE) changed the composition:**
`FELT_R 5.2→6.5`, `CARD_W 2.4→2.05`, `LAB_COMMUNITY 3→5` cards — which moved community cards to
cover the original rect. All M4 readings from TP5 Wave 0 (06-01) through 06-04 were measuring
**card stock** (H≈45°, S≈0.10, V≈0.866), NOT the brass ring. The "pre-existing M4 fail V=0.866"
logged in 06-01 through 06-04 SUMMARYs was a **calibration bug, not a real brass failure**.

**Fix (executed in 06-05):** Pixel-scanned the 2880×1800 hero capture for brass-colored pixels
(H 35–55°, S>0.4, V>0.5). Found the actual brass ring at y≈368–420 at the felt/leather oval
boundary. Recalibrated to `{left:1350, top:368, width:140, height:4}` — a 4-row band in the
center of the ring, clear of card faces and wood.

**Consequence for brass color:** After recalibration, the original `#b8915a` under TP5 shaped key
lighting measured S≈0.649 — above the 0.55 gate. The S increase is due to the TP5 shaped key
(intensity=2.2, angle=0.72) adding ~+0.14 to rendered S vs the base material chroma. Fix: brass
base color de-saturated from `#b8915a` (S=0.511) to `#b89b74` (S=0.370, aged-bronze direction,
NOT gold). Secondary: `envMapIntensity` lowered 0.45→0.30. Rendered result: H=35.4°/S=0.52/V=0.715
— all three thresholds PASS. The aged-brass perceptual read is confirmed (less orange, more neutral
warm-bronze). Roughness 0.42 (TP4-locked) unchanged.

This is the **SSOT brass→gold guard working correctly** — the recalibration exposed a real S-drift
caused by the brighter TP5 key, and the de-saturation fix restores the aged-brass read under the
new light regime.

## ?light= flag map (complete post-TP5 default)

| URL param | Path | Key angle | Key intensity | Fill intensity | Rim intensity | Hemisphere ground | Notes |
|-----------|------|-----------|--------------|----------------|---------------|------------------|-------|
| (default, no ?light=) | **shaped** | 0.72 | 2.2 | 0.8 | 0.22 | `#0d3d24` (dark felt-green) | **TP5 approved look** · ratio 2.75x (below 3.5x ceiling) |
| `?light=base` | **base** | 0.62 | 2.0 | 0.7 | 0.26 | `#1a0f08` (near-black, original) | Prior flat-warm key · A/B reference · ratio 2.86x |

**ALWAYS ON regardless of ?light= flag:**
- SoftShadows PCSS (size=30, samples=16, focus=0) — unconditional in Scene JSX
- ContactShadows frames={1}, opacity=0.35, color="#1a0e06" (warm near-black), far=5, blur=2.0, scale=FELT_R*3.5
- Key spotLight shadow-normalBias=0.02, shadow-camera-near=8, shadow-camera-far=28

**NEVER combine ?light= with arbitrary postprocessing flags** — M7 is a HARD gate.

## Non-blocking rollback disposition

Grounding (SoftShadows PCSS + ContactShadows frames=1 + warm shadow floor + shadow frustum) is
**UNCONDITIONAL** — it does not depend on the ?light= flag and ships regardless of any key verdict.
The grounding and key-reshaping workstreams are independent:

- `?light=base` fully restores the prior flat-warm key while keeping ALL grounding active.
- Grounding ships as a single always-on change; key is the separable revertible workstream.

Since TP5 ships in full, this split is moot — but the structural independence is confirmed and
documented here for reference.

## Stop-on-ambiguous handling

Not triggered. The gate verdict is unambiguous:
- GROUNDING QUESTION: YES — contact shadows warm/honest, no peter-pan, no cold void.
- KEY QUESTION: YES — warm gradient, not a casino cone; ratio 2.75x well below ceiling.
- SPECULAR QUESTION: YES — highlights restrained; wood varnish reads as varnish, chips as matte clay.
- BRASS QUESTION: YES — M4 PASS; aged-not-gold after de-saturation fix.
- No element reads overworked. No element reads casino-glossy.
- 0 reverts, 0 iterations.

## What shipped (TP5 consolidated)

### GROUNDING (06-01 — always-on)

SoftShadows PCSS (size=30/samples=16/focus=0) injected unconditionally above Lights in Scene.
ContactShadows: frames={1} (baked once at mount — M10 improved 106→52), opacity=0.35 (anti-double-
darken), color="#1a0e06" (warm near-black → +A warm floor), far=5, blur=2.0, scale=FELT_R*3.5.
Key spotLight: shadow-normalBias=0.02 (peter-pan prevention), shadow-camera-near=8, shadow-camera-far=28
(frustum tightened). M6 PASS 21.03%; M10 IMPROVED 52 (<106); M7 PASS.

### KEY RESHAPING (06-02 — behind ?light= flag; separately revertible)

Shaped path (default): key angle=0.72 (from 0.62), intensity=2.2, fill=0.8 (from 0.7), rim=0.22.
Hemisphere ground="#0d3d24" (dark felt-green, green-bounce GI on undersides).
KEY_TO_FILL_RATIO_CEILING = 3.5 constant (anti-casino sentinel; grep-checkable). Shaped ratio 2.75x.
Base path (?light=base): exact prior flat-warm key restored (angle=0.62, intensity=2.0, fill=0.7,
hemisphere ground="#1a0f08"). Base ratio 2.86x.
M5 PASS (0%/0% both paths); M7 PASS; M10=52.

### PER-MATERIAL SPECULAR (06-03 — anti-casino/anti-wet direction; brass UNCHANGED at TP4-lock)

| Material | Key final values |
|----------|-----------------|
| woodMat | roughness 0.42, clearcoat 0.68, clearcoatRoughness 0.25, envMapIntensity 0.50 |
| bodyMat | roughness 0.52, clearcoat 0.44, clearcoatRoughness 0.35, envMapIntensity 0.4 |
| card stock | roughness 0.60, clearcoatRoughness 0.50 |
| card face | roughness 0.50 |
| chip pre-dv | roughness 0.52, clearcoat 0.38, clearcoatRoughness 0.50, sheen 0.4 |
| brassMat | roughness 0.42, envMapIntensity **0.30** (color #b89b74 — M4-fixed in 06-05) |

feltMat / leatherMat / chip dv-path / Environment: UNCHANGED.

### GREEN-BOUNCE + BODY VOLUME (06-04 — verification, no code changes)

Hemisphere ground #0d3d24 confirmed: body underside G-delta=+6.23 (perceptible, not lime-wash).
Body volume delta: top luma=109.1 vs underside=100.4, delta=+8.8 (top lighter = table NOT floating).
Chip underside G-delta=+1.59 (borderline imperceptible — no green spotlight artifact).

### GREP-CHECK + M4 BRASS FIX (06-05)

grep-check-tp5-06.cjs authored (6 structural invariants; exits 0). brassHero rect recalibrated
(1240,820,140,60)→(1350,368,140,4). Brass color #b8915a→#b89b74 + envMapIntensity 0.45→0.30.
M4 PASS H=35.4/S=0.52/V=0.715. Full metric suite confirmed: M4/M5/M6/M7/M10 PASS; vitest 398/398
green; tsc src/lab/ 0 errors.

## Deferred items (non-blocking, not TP5 scope)

| Item | Deferred to | Reason |
|------|-------------|--------|
| +A cornerLuma ≥ 18 (vignette floor) | TP6 | Structural dark backdrop corners; luma lift requires vignette/AO pass |
| AO in crevices (under rail, chip gaps, material joins) | TP6 | Screen-space AO scope |
| AAA(5) chips (crevice depth + lighting integration) | TP6 | TP5 ships the lighting; AO needed for bevel-edge/denomination read |
| AAA(5) rail/leather/brass/tactility (AO, hairline scratch, patina) | TP6 / TP7 | AO in TP6; hairline scratch normalMap in TP7 |
| Per-lever ?card= isolation for ?light= interaction | not scoped | Not needed; all paths tested via their metric suites |

## Scorecard delta

**lighting: 4 → 4** (held; TP4 baseline was already 4 — shaped warm gradient now confirmed with PCSS
grounding + anti-casino ceiling + per-material specular integration; the "shaped warm gradient" rubric
anchor is now fully satisfied; AAA(5) awaits TP6 AO/depth pass per rubric: "M8 PASS (corners 8–20%)"
requires vignette)

**shadows: 3 → 4** (PCSS grounding ships — SoftShadows PCSS quality penumbra + baked ContactShadows
warm floor + shadow frustum tightened; contact-hard near/soft far reads confirmed at hero; M6 PASS 20.19%;
AAA(5) deferred: TP6 AO/crevice shadows needed for the "graded from hard to soft in every crevice" AAA bar)

**depth: 2 → 3** (body volume read ships — table outer wall reads as a volume, not a flat card; "table
floats" resolved; the green-bounce lifts undersides; still no AO/DOF/vignette — depth score lifts from 2
to 3 but AAA(5) awaits TP6 full depth pass)

**tactility: 4 → 4** (held; per-material specular integration under ONE coherent warm light adds the
final layer needed for the tactile read under light — wood varnish catches a restrained glint, chip edges
read as sealed clay, brass reads aged; score held at 4 honestly — AAA(5) gated on TP6 AO)

See SCORECARD_TABLE_3D.md for the full per-element status notes and TP progression log entry.

**Why not AAA(5) for lighting or shadows:**
- Lighting AAA(5): requires M8 PASS (corners 8–20% vignette) — +A cornerLuma=15.1 is below the TP6
  vignette floor. The warm gradient IS shaped, but the rubric includes "M8 PASS" which requires the
  TP6 vignette/AO pass.
- Shadows AAA(5): requires "graded from near-hard to soft far in every crevice" — inter-material AO
  (under the rail, in chip gaps) is screen-space AO (TP6 scope).
- Both deferred explicitly to TP6.

## Outcome

**TP5 SHIPS IN FULL.** All four implementation workstreams committed LOCAL on `spike/table-3d-hero`:
grounding (SoftShadows PCSS + ContactShadows warm + shadow frustum), shaped key (?light= default),
per-material specular (anti-casino direction), green-bounce + body volume, brass M4-fix (rect
recalibration + #b89b74 de-saturation). Shipped as the default render (no flag required; ?light=base
restores the prior key). No push / no deploy / no merge. Phase 6 / TP5 is COMPLETE.

**Next:** Phase 7 / TP6 — Profundidad & Composición (depth ON the table: N8AO + whisper DOF + vignette/
fog + filmic grade; ALL screen-space/crevice AO; composition kill-dead-zones).

*Recorded by the GSD autonomous loop at the TP5 operator gate, 2026-06-12.*
*Gate approved under the operator's standing "auto-approve (0 paradas)" directive — green hard gates +
orchestrator CEO visual read. Flagged for operator batch confirmation.*
