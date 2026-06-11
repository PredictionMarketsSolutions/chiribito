---
phase: 03-tp2-cartas-materiality-legibility-protagonist
plan: 06
completed: "2026-06-11"
status: complete
gate: operator-approved
---

# 03-06 SUMMARY — TP2 Operator Gate

**Plan type:** checkpoint:human-verify (autonomous:false) — the GSD↔Chiribito perceptual seam.

## Verdict

✅ **Operator APPROVED — TP2 SHIPS** (full 7-lever stack, 0 reverted, 0 iterations).

Operator GO ("Aprobado — cierra TP2") after the live dev-server A/B was provided (full-TP2 vs `?card=base`
at POV fov40 + MACRO fov26), all HARD gates GREEN, and CEO visual verification (printed stock, razor-legible,
no plastic / casino / gamey). Recorded honestly as a lightweight autonomous-mode GO. Full record:
`docs/table-3d/TP2_OPERATOR_AB.md`.

## What shipped

The full TP2 card-stock stack on the adopted post-encuadre scene (LOCAL, `spike/table-3d-hero`):
L1 max-anisotropy + mipmaps · L2 seam (already clean) · L3 micro-relief normal (0.12) · L4 clearcoat
whisper (0.12/0.55) · L5 warm sheen-rim paper-edge · L6 deterministic dealt variance (≤1.5°) · L7
tightened contact-shadow. HARD gates: M2/M5/M6/M9/M12 green; M1 advisory (legibility confirmed visually +
at gate).

## Scorecard

cards **4 → 4** (held; materiality improved; AAA(5) ≥22px gated on a future CARD_W revisit).

## Carried forward (non-blocking)

- **AAA(5) cards** gated on a CARD_W / encuadre revisit (separate operator call; CARD_W NOT changed in TP2).
- **Per-lever `?card=` isolation** was NOT wired (binary base/full only) — wire if a future single-lever bisect is needed.
- **M1 manual px-method inconsistent** (9 vs 32px) — operator-confirm authoritative; a consistent glyph-bbox method is a future TP-rig improvement.

## Files

- `docs/table-3d/TP2_OPERATOR_AB.md` (verdict + per-lever disposition + HARD-gate confirmation + gaps)
- `docs/table-3d/SCORECARD_TABLE_3D.md` (cards TP2 status note)

## Phase 3 / TP2 — COMPLETE. Next: Phase 4 / TP3 (Fichas materiality + perf/instancing).
