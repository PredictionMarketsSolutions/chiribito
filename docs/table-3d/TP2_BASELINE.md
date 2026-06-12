# TP2 Baseline — Post-Encuadre Scene (plan 03-01)

**Authored:** 2026-06-11 (plan 03-01)
**Commit at capture:** `tp2-before-cards` tag → HEAD `22017ee`
**Branch:** `spike/table-3d-hero`
**Scene constants (adopted encuadre):**

| Constant | Value | Notes |
|----------|-------|-------|
| CARD_W | 2.05 | ENCUADRE: smaller so 5-card board fits + hand reads complete |
| CARD_H | CARD_W × 1.42 ≈ 2.91 | baraja ratio |
| FELT_R | 6.5 | ENCUADRE: bigger table |
| HOLE_Z | 2.3 | ENCUADRE: hand sits clearly central |
| HOLE_PITCH | CARD_W × 0.98 ≈ 2.009 | ENCUADRE: near-separated pair |
| HOLE_LIFT | 0.2 | ENCUADRE: laid flatter |
| LAB_COMMUNITY | 5-card board | ENCUADRE |
| camera card (POV) | fov 40 | FROZEN |
| camera hero | fov 32 | FROZEN |
| camera macro | fov 26 | FROZEN |

---

## M1 — Hole-Card Rank-Glyph Legibility FLOOR

**Measurement convention:** px-height of the rank-glyph bounding box on the 1080p downscale of the
POV (`?cam=card`) frame. NO automated OCR gate — per SSOT §4.5, M1 is `px-height + operator confirm`.
This floor records the minimum: no TP2 lever may produce a lower px-height; all levers MUST NOT regress.

**Downscale reference:** `m1DownscalePov(card.png, 1080)` → 1728×1080 (from full-res 2880×1800).

| Field | Value |
|-------|-------|
| **M1 FLOOR — rank-glyph bbox height** | **9 px** (1728×1080 downscale) ⚠ **SUPERSEDED — see M1 RECONCILIATION at end** (manual artifact; full-res ≈32px; cards confirmed legible) |
| Target (M1_PX_HEIGHT_MIN) | 22 px |
| Gap to target | -13 px (below target; expected — CARD_W shrank) |
| requiresOperatorConfirm | TRUE (always; operator gate is plan 03-06) |
| pre-encuadre reading (CARD_W 2.4) | ~17 px (M1_REFINEMENT.md) |
| Context | CARD_W 2.4→2.05 reduced card physical size ~15%; HOLE_Z 2.3 positions cards closer to the viewer edge (bottom of POV frame). The rank glyph at 9px is below the threshold — TP2 levers (max-anisotropy, mipmap crispness) are expected to SHARPEN (not enlarge) the existing pixels. If TP2 cannot achieve "razor-legible" at the operator gate, escalate to a CARD_W / encuadre decision (separate operator call — encuadre is adopted, not reopened unilaterally). |

**Measurement evidence:** Pixel-by-pixel scan of the "10" rank glyph at x=618-658, y=505-540
in the 1728×1080 downscale. The "1"+"0" digit strokes span rows 513-521 = **9 rows = 9px**
(card border row 509 excluded; first numeral stroke at row 513, last at row 521).

**TP2 hard gate:** Any TP2 lever that produces rank-glyph px-height < 9px is STOPPED and REVERTED
(SSOT §TP2: "any lever that regresses M1 → STOP + revert that lever").
Operator confirm of actual legibility is plan 03-06 gate.

---

## M6 — Contact-Shadow Region Rects: RECALIBRATED

**Issue (Pitfall 8 / Assumption A2):** The TP0 region rects `underCardHero` and `feltAdjacentHero`
in `tools/table-3d/metrics.mjs` were calibrated on the TP0 scene (CARD_W 2.4, older HOLE_Z).
On the adopted scene (CARD_W 2.05, HOLE_Z 2.3) the hole cards moved position, and the old rects
sample open felt instead of the contact shadow → M6 reads 7.55% (below the 12% gate).

**Recalibration result:** RECALIBRATED (rects updated in `metrics.mjs`, plan 03-01 Task 2)

### Before (TP0, CARD_W 2.4)

| Rect | Coords | Luma on tp2-base/hero | Notes |
|------|--------|-----------------------|-------|
| underCardHero (old) | left:360, top:1230, 220×90 | 148.5 | Open felt — no longer under a card shadow |
| feltAdjacentHero (old) | left:360, top:1090, 220×90 | 160.6 | Open felt (card shifted position) |
| **M6 ratio (old rects)** | — | **7.55% FAIL** | Below 12% gate — would hide shadow regressions |

### After (TP2, CARD_W 2.05, HOLE_Z 2.3) — NEW CALIBRATION

| Rect | Coords | Luma on tp2-base/hero | Notes |
|------|--------|-----------------------|-------|
| underCardHero (new) | left:420, top:1120, 220×90 | 145.6 | Contact shadow on felt just below left hole card near-edge |
| feltAdjacentHero (new) | left:420, top:1310, 220×90 | 183.8 | Open felt below the shadow zone (no shadow, brighter) |
| **M6 ratio (new rects)** | — | **20.8% PASS** | Well above 12% gate; trustworthy |

**Shadow validation:** Pixel analysis at x=460 (vertical scan y=1050-1340) confirmed a genuine
contact-shadow gradient on the felt: luma 221→154 (sharp drop at the card near-edge y=1120) →
slowly brightening to 201 (open felt at y=1340). Both rects sample strongly green-felt pixels
(G-R=95 for under, G-R=40 for adjacent).

**Re-admission note:** The standard `--meta-gate docs/table-3d/anchors/controls` runner shows M6 as
`informational` because the committed good-control frame `m6-shadow-good.png` was never committed
at TP0 (the full-res TP0 controls that admitted M6 were in `.dev-stack/` scratch, now gone).
The M6 ADMISSION record stands in `METRICS_ADMISSION.md` (plan 01-03 ledger: good=14.14% PASS,
bad=-0.05% FAIL → ADMITTED). The recalibration PRESERVES this admission: the new rects still
satisfy the same criterion (under-card region darker than adjacent felt, ≥12%), now correctly
landing on the actual shadow region for the adopted scene. Direct verification: M6=20.8% PASS
on `tp2-base/hero-full.png` (full-res 2880×1800) with the new rects.

---

## TP2 Baseline M5/+B Values (for lever delta reference)

Metrics run on `docs/table-3d/anchors/tp2-base/hero.png` (full-res captured 2026-06-11):

| Metric | Value | Verdict | Notes |
|--------|-------|---------|-------|
| M5 highlight-clip | feltClipPct=0%, frameClipPct=0% | PASS | No blown highlights — good baseline |
| M6 contact-shadow | 20.8% darker | PASS | Recalibrated rects; trustworthy gate |
| +B felt-specular | 0% sheen | PASS | No satin; clean felt reference |
| M3 felt-hue | ΔE=13.88 | FAIL (above TP0 calibration) | Encuadre scene change shifted the felt-rect average; informational for TP2 (TP2 does NOT change felt material) |
| M4 brass-not-gold | V=0.859 (>0.8) | FAIL | Brass brightness slightly over ceiling; informational for TP2 |
| M8 vignette | 89.95% (too dark corners) | FAIL | TP6 scope — expected |
| +A warm-corner | cornerLuma=15.6 | FAIL | TP6 scope — expected |

**Lever plans baseline:** TP2 lever plans (03-02…03-05) each produce one variable at a time.
They measure M5/M6 delta against `tp2-base/` (NOT against `head/` which is the TP0 scene).
The "before" values above are the tp2-base baseline; a lever PASSES if it does NOT regress
these values AND achieves its target improvement.

---

## Capture Provenance

| Item | Value |
|------|-------|
| tp2-before-cards tag | `22017ee` (HEAD at time of capture, no card edits) |
| Capture tool | `.dev-stack/lab-shot.mjs` (Playwright headless:new) |
| GPU | ANGLE (NVIDIA GeForce RTX 4060 Laptop GPU) Direct3D11 |
| Capture resolution | 2880×1800 (DPR2, viewport 1440×900) |
| Committed PNG size | 1280×800 (downscaled to match head/ corpus) |
| Committed files | `docs/table-3d/anchors/tp2-base/{card,hero,macro}.png` |
| Full-res scratch | `.dev-stack/diag/table-3d/tp2-base/hero-full.png` (gitignored) |
| Capture date | 2026-06-11 |
| Scene | Default (no flags) — the adopted post-encuadre baseline |

---

## SSOT Reference (docs/ROADMAP_TABLE_3D_PERFECTION.md §TP2)

The TP2 per-lever hard gates (SSOT wins on any conflict with this doc):
- **M1 ≥ 9px** (this floor) AND operator confirm — any lever below 9px → STOP, REVERT
- **M6 ≥ 12% darker** (recalibrated rects) — any lever that removes contact shadow → STOP, REVERT
- Operator gate: plan 03-06 (A/B at POV + MACRO — "physical printed stock while razor-legible?")

---

## ⚠ M1 RECONCILIATION (2026-06-11, post-03-02)

The "9 px" M1 floor recorded above was a **manual-measurement artifact**, NOT a real legibility deficit:

- Plan 03-01 measured **9 px** (manual stroke-scan of the "10" on a 1728×1080 downscale).
- Plan 03-02 measured **32 px** for the SAME POV rank glyph (full-res 2880×1800 basis).
- **CEO visual verification** (full-res crops `.dev-stack/diag/table-3d/tp2/lever1-aniso/crop2x-card-{base,aniso}.png`,
  2× zoom of the hand region): the hole-card ranks ("10", "7") + Oros suit symbols are **clearly legible**.
  The cards read well on the adopted post-encuadre scene. **The legibility alarm was FALSE.**

**Conclusion:** the manual M1 px-height method is method-dependent and inconsistent (9 vs 32 px on the same
frame). M1 is `px-height + operator confirm` by SSOT design — the **operator gate (03-06) is the
authoritative legibility check**; the automated "≥ floor" per-lever gate is ADVISORY (treat the floor as
loose, won't false-fail). A consistent deterministic glyph-bbox measurement is a worthwhile eval-rig
improvement (future TP-rig touch-up; out of TP2 lever scope).

**Practical effect:** legibility is NOT the blocker it appeared. The lever sequence proceeds; the real
legibility verdict is the operator A/B at 03-06.
