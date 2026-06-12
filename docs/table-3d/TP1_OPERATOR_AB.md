# TP1 — Felt / Tapete Materiality · Operator A/B Verdict

**Phase:** 02 — TP1 (Felt / Tapete Materiality, the stage)
**Plan:** 02-04 (OPERATOR GATE — `autonomous: false`)
**Date:** 2026-06-10
**Gate type:** Materiality-only perceptual A/B (the GSD ↔ Chiribito human seam, SSOT §TP1 perceptual gate / §5.7 stop-on-ambiguous)

---

## Operator verdict: ✅ **APPROVED — TP1 SHIPS**

The operator performed the materiality-only A/B and accepted the current felt as sufficient for the
D-05 north star ("El tapete actual me gusta y la dirección visual es correcta. Acepto el resultado
actual como suficiente para el objetivo D-05."). The current felt materiality is to be **kept as the
reference baseline for the following phases**. **No further TP1 materiality iterations requested.**

- **Disposition:** SHIP (no iteration, no rollback).
- **Iterations used:** 0 of the allowed ≤2.
- **Scope judged:** cloth materiality ONLY (D-05). Grounding / depth / AO / vignette weight were
  explicitly NOT judged at this gate (deferred to TP5 / TP6 by design).

---

## A/B basis (what was compared)

| Shot | Fresh TP1 capture | "Before" (TP0 HEAD) | Protected floor |
|------|-------------------|---------------------|-----------------|
| POV (fov40) — sheen / nap | `.dev-stack/diag/table-3d/tp1/card.png` | `docs/table-3d/anchors/head/card.png` | `docs/table-3d/anchors/reference-tag/card.png` |
| MACRO (fov26) — inlay / weave | `.dev-stack/diag/table-3d/tp1/macro.png` | `docs/table-3d/anchors/head/macro.png` | `docs/table-3d/anchors/reference-tag/macro.png` |

Automated gates were already green before the gate (plan 02-03, fresh RTX 4060 / ANGLE D3D11 captures):

| Metric | Verdict | Value | Threshold |
|--------|---------|-------|-----------|
| M3 — felt-hue ΔE | PASS | 10.68 | < 12 |
| M5 — highlight-clip on felt | PASS | 0% | < 0.5% |
| +B — fuzz-not-satin | PASS | 0% | ≤ 8% |

The metrics are necessary-not-sufficient ("not satin / hue in palette"); this operator gate is the sole
judge of "reads as real woven baize." The operator confirmed it reads as physical woven cloth with no
satin / casino-green drift and the mark stays born-in.

## What shipped (final, in-band, locked)

Felt default branch → `MeshPhysicalMaterial` (`frontend/src/lab/TableLab.tsx`):

| Property | Value | SSOT band |
|----------|-------|-----------|
| sheen | 0.70 | 0.60–0.85 |
| sheenColor | #2aad7a (lighter Chiribito green) | — |
| sheenRoughness | 0.65 | 0.55–0.80 |
| anisotropy | 0.25 | 0.15–0.40 |
| roughness | 0.93 | 0.90–0.94 (anti-satin) |
| normalScale | 0.25 | 0.20–0.35 |
| aoMapIntensity | 0.18 | subtle band |

Supporting textures (plan 02-02): `feltTexture` S=2048 (D-04, sharper MACRO inlay), baked albedo
vignette removed (D-03), `feltNapNormalMap` concentric/oval nap (D-01), `feltEdgeAoMap` very-subtle
light-responsive edge-darken (D-03). Rollback tag `tp1-before-felt` retained.

---

## Scorecard delta

| Element | TP0 baseline (locked) | Post-TP1 | Note |
|---------|:---------------------:|:--------:|------|
| **felt** | 3 | **4** | Operator-approved 2026-06-10. Meets the ≥4 target. Nap sheen + micro-relief + relight present; AAA (5) deferred to the TP9 final all-green verdict (operator accepted current as "suficiente", not AAA-perfect — no further iteration). |

The TP0 baseline column stays LOCKED (never overwritten); the post-TP1 score is recorded in the
SCORECARD progression log.

---

## Operator forward feedback (for TP2+ — DO NOT reopen TP1)

The operator approved TP1 **and** issued forward guidance for the upcoming phases. This is **not** a TP1
defect (the cloth is accepted); it reshapes how the protagonist/composition work is approached next.

1. **Cards remain the absolute protagonist.** (Reinforces the program's core value.)
2. **The hand must read complete / much more complete.** The current hand read is too cropped to evaluate
   the real composition — the operator wants to see the hole-card hand in full (or far more of it).
3. **The whole table must be visible.** The current perception of the table is too partial and too small.
4. **A full-scene visual validation is needed before optimizing more local detail**, covering:
   complete table · community cards · player hands · global composition · the camera ↔ table ↔ cards
   relationship. *"Antes de optimizar más detalle local, quiero comprobar cómo funciona el conjunto
   completo de la mesa."*

> Verbatim (operator, Spanish): «Quiero que las cartas sigan siendo el protagonista absoluto. Quiero ver
> las cartas de la mano completas o mucho más completas… Quiero poder ver la mesa completa… Necesito una
> validación visual de la escena completa: mesa completa, cartas comunitarias, manos de jugadores,
> composición global, relación entre cámara, mesa y cartas. Antes de optimizar más detalle local, quiero
> comprobar cómo funciona el conjunto completo de la mesa.»

**Implication for sequencing:** points 2–4 are camera-framing / composition / scene-completeness concerns
(roadmap-scoped to TP6/TP7/TP8) that the operator wants validated **early** — before TP2's local
card-stock micro-detail. This touches the TP0-frozen-camera invariant and must be reconciled at the start
of Phase 3 (carried into the Phase 3 discuss as primary context; see STATE.md Blockers/Concerns).

---

## Invariants honored

- **No push / no merge / no deploy** — all work LOCAL (Chiribito manual-deploy policy). ✅
- Protected reference never degraded; felt never read below `anchors/reference-tag/`. ✅
- Materiality-only scope respected; depth/grounding deferred to TP5/TP6. ✅

*Recorded by the GSD autonomous loop at the TP1 operator gate, 2026-06-10.*
