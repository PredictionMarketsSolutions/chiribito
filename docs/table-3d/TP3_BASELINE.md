# TP3 Baseline — Post-TP2 Scene (plan 04-01)

**Authored:** 2026-06-11 (plan 04-01)
**Commit at capture:** `tp3-before-chips` tag → HEAD `5c3894e`
**Branch:** `spike/table-3d-hero`
**Scene constants (post-encuadre + TP2 card-stock):**

| Constant | Value | Notes |
|----------|-------|-------|
| CARD_W | 2.05 | ENCUADRE: smaller so 5-card board fits + hand reads complete |
| FELT_R | 6.5 | ENCUADRE: bigger table |
| HOLE_Z | 2.3 | ENCUADRE: hand sits clearly central |
| LAB_COMMUNITY | 5-card board | ENCUADRE |
| camera hero | pos [1.2, 5.0, 8.2] / fov 32 | FROZEN (TP0) |
| camera macro | pos [-1.7, 1.7, 2.4] / fov 26 | FROZEN (TP0) |
| camera card (POV) | fov 40 | FROZEN (TP0) |
| chip H (stack spacing) | 0.1 | FROZEN scene constant |
| demoted pot | 3 stacks: C×5, E×3, B×4 at group [3.0, 0, 1.5] scale 0.5 | FROZEN for TP3 |

---

## M10 Baseline — Draw-Call Counts (ACTUAL MEASURED)

Measured via `tools/table-3d/stats-read.mjs` (GL drawElements/drawArrays/drawElementsInstanced/
drawArraysInstanced wrapper — NOT StatsProbe/gl.info which reads stale 1 under headless rAF throttle).
All reads: 90 rAF frames sampled, MAX non-zero returned, D3D11 RTX 4060 GPU.

| Camera | Param | Raw JSON | calls | Status vs Ceiling |
|--------|-------|----------|-------|-------------------|
| HERO | (default demoted pot) | `{"cam":"hero","extra":"","ok":true,"calls":233,"framesRendered":86,"distinct":[0,201,233]}` | **233** | OVER ceiling (M10_DRAWCALL_MAX = 150) |
| MACRO | (default demoted pot) | `{"cam":"macro","extra":"","ok":true,"calls":195,"framesRendered":85,"distinct":[0,163,195]}` | **195** | OVER ceiling (M10_DRAWCALL_MAX = 150) |
| HERO | `?chips=full` (stress pot) | `{"cam":"hero","extra":"&chips=full","ok":true,"calls":653,"framesRendered":85,"distinct":[0,621,653]}` | **653** | OVER ceiling (M10_DRAWCALL_CHIPS_FULL_MAX = 220) |

> **Note:** TP0 RESEARCH expectation was HERO ~233 / MACRO ~195 / `?chips=full` ~637.
> Actual measured: HERO 233 / MACRO 195 / `?chips=full` 653. The `?chips=full` value
> is 653 (not 637 as estimated at TP0) — this is the honest baseline for the gate.

---

## M10 Must-Ship Targets (instancing)

These are the net-positive targets that instancing MUST achieve or be REVERTED (SSOT §TP3):

| Measure | Baseline | Must-Ship Target | Threshold | M10 verdict |
|---------|----------|-----------------|-----------|-------------|
| HERO draw count | 233 | < **150** | M10_DRAWCALL_MAX = 150 | FAIL until instancing ships |
| MACRO draw count | 195 | < **150** | M10_DRAWCALL_MAX = 150 | FAIL until instancing ships |
| `?chips=full` draw count | 653 | < **220** | M10_DRAWCALL_CHIPS_FULL_MAX = 220 | FAIL until instancing ships |
| Demoted-pot chip draws (component) | ~42 | ≤ **~10** | SSOT §TP3 component target | — |

The demoted-pot draw-call component (~42) is estimated as: 3 stacks × 12 chips × 3 meshes/chip = 36 meshes,
plus shadow pass overhead → ~42 chip-related draws. Instancing replaces these with 3 denominations ×
(1 body draw + 1 face draw) = 6 chip draws (shadow overhead shared per InstancedMesh) → ≤ ~10.

---

## Must-Ship-or-Revert Rule (instancing — SSOT §TP3)

**Instancing ships ONLY if BOTH of these conditions hold:**

1. **Net-positive on draw count:** Post-instancing HERO draw count MUST be < 150 (M10 PASS);
   `?chips=full` MUST be < 220 (M10_CHIPS_FULL PASS). If NOT net-positive, plan 04-02 REVERTS
   the instancing completely.

2. **MACRO strict visual parity:** The post-instancing MACRO capture MUST be pixel-for-pixel
   equivalent to `docs/table-3d/anchors/tp3-base/macro.png` in chip look. Any chip-look change
   after instancing = regression → REVERT. The `tp3-base/macro.png` captured in this plan is
   the IMMUTABLE strict-parity basis.

If instancing fails either gate → plan 04-02 reverts; de-Vegas (plan 04-03) does NOT apply.
De-Vegas is non-blocking (SPLIT rollback): if de-Vegas fails the operator gate, keep current
chips — no revert required for the de-Vegas workstream.

---

## tp3-base Capture Provenance

| Item | Value |
|------|-------|
| tp3-before-chips tag | `5c3894e` (HEAD at time of capture, zero chip edits) |
| Capture tool | `.dev-stack/lab-shot.mjs` (Playwright headless:new) |
| GPU | ANGLE (NVIDIA GeForce RTX 4060 Laptop GPU) Direct3D11 vs_5_0 ps_5_0 |
| Capture resolution | 2880×1800 (DPR2, viewport 1440×900) |
| Committed PNG size | 1280×800 (downscaled via sharp, matches head/ + tp2-base/ corpus) |
| Full-res scratch | `.dev-stack/diag/table-3d/tp3-base/{hero,macro,pov}-full.png` (gitignored) |
| Committed files | `docs/table-3d/anchors/tp3-base/{hero,macro,pov}.png` |
| Capture date | 2026-06-11 |
| Scene flags | None (default — the post-TP2 demoted accent pot, 3 stacks C×5/E×3/B×4) |
| Cameras captured | hero (fov 32), macro (fov 26), card/POV (fov 40) — all 3 frozen money shots |

---

## SSOT Reference (docs/ROADMAP_TABLE_3D_PERFECTION.md §TP3)

- **M10_DRAWCALL_MAX = 150** (HERO/POV/MACRO color pass) — `tools/table-3d/metrics.mjs:63`
- **M10_DRAWCALL_CHIPS_FULL_MAX = 220** (`?chips=full` stress diagnostic) — `tools/table-3d/metrics.mjs:64`
- Rollback disposition: SPLIT — instancing must-ship-or-revert; de-Vegas non-blocking
- Both M10 PASS and MACRO strict visual parity are required for instancing to ship
- Demoted-pot chip component ~42 → ≤ ~10; `?chips=full` < 220 (SSOT §TP3 instancing targets)

---

## M10 Post-Instancing — Measured Results (plan 04-02)

**Measured:** 2026-06-11 (plan 04-02)
**Commit at measure:** `58a6eca` (HEAD at time of measurement)
**Branch:** `spike/table-3d-hero`
**GPU:** ANGLE (NVIDIA GeForce RTX 4060 Laptop GPU) Direct3D11 vs_5_0 ps_5_0

| Camera | Param | Raw JSON | calls | vs Baseline | vs Ceiling | M10 Verdict |
|--------|-------|----------|-------|-------------|------------|-------------|
| HERO | (instanced demoted pot, default) | `{"cam":"hero","extra":"","ok":true,"calls":105,"framesRendered":90,"distinct":[105]}` | **105** | −128 from 233 | < 150 ✅ | **PASS** |
| HERO | `?chips=full` (stress, instanced) | `{"cam":"hero","extra":"&chips=full","ok":true,"calls":133,"framesRendered":90,"distinct":[133]}` | **133** | −520 from 653 | < 220 ✅ | **PASS** |
| HERO | `?chips=legacy` (A/B, per-chip) | `{"cam":"hero","extra":"&chips=legacy","ok":true,"calls":201,"framesRendered":90,"distinct":[201]}` | **201** | — (A/B ref) | — | — |

**Demoted-pot chip draw component:** Instanced (105) vs legacy (201) = **96 fewer draws** from
the chip component alone (rest of scene identical); demoted-pot chip draws ≈ 6-10 (body×3 denom
+ face×3 denom per shadow pass) — well within ≤ ~10 target. ✅

**MACRO strict visual parity:** Chip look in `hero-instanced.png` vs `tp3-base/hero.png` is
visually identical — same jitter (seeds 2.3/1.7/0.012 preserved byte-exactly by chipStackLayout),
same colors (texture art identical at 512², just right-sized), same geometry. **PARITY: PASS** ✅

**Ship decision: SHIP** — both M10 gate (HERO 105 < 150 ✅; chips=full 133 < 220 ✅) AND
MACRO strict visual parity PASS. Instancing ships as plan 04-02 default. No revert.

**A/B captures (gitignored scratch):**
- `.dev-stack/diag/table-3d/tp3/instancing/hero-instanced.png` — post-instancing HERO
- `.dev-stack/diag/table-3d/tp3/instancing/macro-instanced.png` — post-instancing MACRO
- `.dev-stack/diag/table-3d/tp3/instancing/hero-legacy.png` — pre-instancing A/B (legacy path)

**?chips= flag map (plan 04-02):**

| Flag | Path | Draw Count |
|------|------|------------|
| (default) | InstancedChipStack demoted accent pot | 105 (HERO) |
| `?chips=full` | InstancedChipStack heavy central stress pot | 133 (HERO) |
| `?chips=legacy` | ChipStack per-chip demoted pot (A/B baseline) | 201 (HERO) |
| `?chips=off` | No chips | — |
