---
phase: 04-tp3-fichas-materiality-perf-accent-instancing
plan: 01
completed: "2026-06-11"
status: complete
---

# 04-01 SUMMARY — TP3 Wave-0 Foundation

Wave-0 foundation for TP3 (chips materiality + perf). Outputs verified correct on disk and closed out.

## What was done

1. **Rollback tag `tp3-before-chips`** cut at the clean pre-edit HEAD `5c3894e` on `spike/table-3d-hero`
   (LOCAL, unpushed — SSOT §5.3). Verified: tag rev == HEAD; no `frontend/src/lab/` code touched.
2. **tp3-base baseline** captured at the 3 frozen money shots (RTX 4060 D3D11, 2880×1800 → 1280×800
   downscaled) → `docs/table-3d/anchors/tp3-base/{hero,macro,pov}.png` — the strict-parity + de-Vegas
   "before". The TP0/TP2 protected anchors (`head/`, `reference-tag/`, `tp2-base/`) are byte-unchanged.
3. **M10 draw-call baseline** measured via `tools/table-3d/stats-read.mjs` (the GL draw-wrapper, not
   stale `gl.info`) and recorded in `docs/table-3d/TP3_BASELINE.md`.

## M10 baseline (ACTUAL measured)

| Camera | Param | calls | vs ceiling |
|--------|-------|-------|------------|
| HERO | default demoted pot | **233** | OVER (M10_DRAWCALL_MAX 150) |
| MACRO | default demoted pot | **195** | OVER (150) |
| HERO | `?chips=full` | **653** | OVER (M10_DRAWCALL_CHIPS_FULL_MAX 220) |

Honest note: `?chips=full` measured **653** (not the ~637 TP0 estimate) — that is the real gate basis.

## Must-ship-or-revert targets (instancing, plan 04-02)

Instancing ships ONLY if BOTH hold, else REVERT: (1) net-positive draws — HERO < 150, `?chips=full` < 220,
demoted-pot chip component ~42 → ≤ ~10; AND (2) MACRO strict visual parity vs `tp3-base/macro.png` (any
chip-look change = regression). Full record: `docs/table-3d/TP3_BASELINE.md`.

## Verification

- `git rev-parse tp3-before-chips` == HEAD `5c3894e` (pre-edit, LOCAL).
- `docs/table-3d/anchors/tp3-base/{hero,macro,pov}.png` exist; `head/` + `reference-tag/` + `tp2-base/` byte-unchanged.
- `docs/table-3d/TP3_BASELINE.md` records M10 (HERO/MACRO/`?chips=full`) + must-ship targets + revert rule.
- No chip render code touched; LOCAL only (no push/deploy/merge).

## Next: plan 04-02 — instancing (drei `<Instances>` per denomination; must-ship-or-revert).
