# TP2 — Cartas Materiality & Legibility · Operator Gate (plan 03-06)

**Date:** 2026-06-11
**Branch:** `spike/table-3d-hero` (LOCAL — no push/deploy/merge)
**Plan:** 03-06 (autonomous:false — perceptual gate, the GSD↔Chiribito human seam)

## Operator verdict: ✅ APPROVED — TP2 SHIPS (full 7-lever stack)

The operator approved at the gate ("Aprobado — cierra TP2") after:
- the **live dev-server A/B** was made available (full-TP2 vs `?card=base` at POV `card` fov40 + MACRO fov26),
- all **HARD metric gates** confirmed GREEN (`TP2_PREGATE.md`),
- **CEO visual verification** of the full-res gate captures (printed stock, razor-legible, no plastic / casino / gamey).

Recorded honestly: this is a **lightweight autonomous-mode GO** (operator approved after the A/B was provided
+ green gates + CEO read), not a long iterative on-device A/B like TP1's. **0 levers reverted, 0 iterations.**

## A/B basis

Full TP2 card stack (levers 1–7, default scene) vs `docs/table-3d/anchors/tp2-base/` (the post-encuadre
"before"), at the two card-telling money shots: POV `card` (fov 40) + MACRO (fov 26). Gate captures:
`.dev-stack/diag/table-3d/tp2/gate/{card,macro,hero}.png` (RTX 4060 D3D11, gitignored scratch).

## Per-lever disposition: ALL SHIP

| Lever | Value (restraint-first) | Disposition |
|-------|-------------------------|-------------|
| 1 anisotropy | `Math.min(getMaxAnisotropy(),16)` + mipmaps explicit | SHIP |
| 2 seam fix | already clean (no geometry change needed) | SHIP (n/a) |
| 3 micro-relief normal | normalScale 0.12 (shared Sobel helper, NoColorSpace, single instance) | SHIP |
| 4 clearcoat | 0.12 / clearcoatRoughness 0.55 (coated-not-plastic) | SHIP |
| 5 paper-edge | warm sheen-rim 0.35 / #f5deb5 / 0.6 (sheen-only, NO transmission) | SHIP |
| 6 dealt variance | ≤ 0.026 rad (≤ 1.5°) deterministic, M9 byte-identical | SHIP |
| 7 contact-shadow | shadow-radius 8→4 (card bites cloth; M6 20.7%) | SHIP |

No lever read plastic / casino-glow / gamey / legibility-loss. None reverted.

## HARD-gate confirmation (TP2_PREGATE.md — full-TP2 vs tp2-base, 3 frozen shots)

- **M1 legibility:** NOT regressed (≥ floor). ⚠ The automated M1 px-height is **advisory only** — the manual
  method was inconsistent (9px @03-01 vs 32px @03-02 on the same glyph; see `TP2_BASELINE.md §M1
  RECONCILIATION`). Legibility was confirmed by CEO visual verification (full-res crops: ranks "10"/"7" +
  Oros suits clearly legible) and the operator gate. ✅
- **M2** cards-vs-chips ≥ 2×: PASS ✅
- **M5** highlight-clip: PASS (felt 0% / frame 0%) ✅
- **M6** contact-shadow: PASS (20.7% ≥ 12%, recalibrated rects) ✅
- **M9** determinism: PASS (byte-identical) ✅
- **M12** zero-change on non-card regions: felt/MACRO MSE ≈ 0 ✅

## Honest gaps / notes (recorded, non-blocking)

1. **Per-lever `?card=` isolation NOT wired.** The plans/CONTEXT assumed each lever was independently
   toggleable via its own `?card=` value for at-gate isolation. The implementation is **BINARY**: `?card=base`
   = all levers off (pre-TP2); any other value (incl. default) = all levers on (full-TP2). The per-lever
   capture filenames (`card-coat.png`, `card-edge.png`…) are all the SAME full-TP2 render. The operator
   approved the cumulative stack; no single-lever isolation was needed (nothing read off). If a future
   regression needs single-lever bisection, wire per-lever flags then.
2. **M1 manual measurement unreliable** (9 vs 32px). M1 is `px-height + operator confirm` by SSOT design —
   the operator gate is authoritative; the automated px-gate is advisory. A consistent deterministic
   glyph-bbox method is a future TP-rig improvement.
3. **AAA(5) on cards awaits a CARD_W revisit.** The scorecard cards-AAA(5) bar is "rank glyph ≥ 22px on the
   1080p POV downscale." The adopted encuadre (CARD_W 2.05) makes the cards smaller; TP2 **sharpened**
   (anisotropy/mipmaps/seam) but cannot **enlarge**. So cards stays at the baseline **4** (materiality
   clearly improved — real stock / coat / sheen / relief / contact vs the prior decal), and **AAA(5) is gated
   on a future CARD_W / encuadre decision** (a SEPARATE operator call — encuadre is adopted, not reopened in
   TP2). CARD_W was NOT changed in TP2. CARD_W escalation NOT triggered (legibility judged acceptable).

## Scorecard

**cards: 4 → 4** (held; no regression). TP2 materiality improvements recorded toward AAA(5); AAA(5) (≥ 22px)
gated on a CARD_W revisit.

## Outcome

TP2 SHIPS as the new card materiality on the adopted post-encuadre scene (LOCAL only). **Phase 3 COMPLETE.**
Next: TP3 (Fichas materiality + perf / instancing) — Phase 4.
