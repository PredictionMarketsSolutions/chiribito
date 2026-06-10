---
phase: 01-tp0-eval-rig-baseline-blocking
plan: 06
subsystem: lab / baseline-freeze
tags: [baseline-freeze, protected-tag, region-rects, M12, scorecard, M10, M11, table-3d]

# Dependency graph
requires:
  - phase: 01-01
    provides: tracked anchors/ + tools/ dirs, harness, rollback tag
  - phase: 01-02
    provides: StatsProbe + frozen presets + scorecard skeleton
  - phase: 01-03
    provides: T1 colour metrics + REGIONS rects + controls
  - phase: 01-04
    provides: M9/M7/M12 integrity + the DEFERRED POV-region M12
  - phase: 01-05
    provides: operator gate cleared (M1 PASS, POV fov LOCKED 40), 2 pre-freeze fixes
provides:
  - docs/table-3d/anchors/head/{hero,card,macro}.png — frozen-rig HEAD corpus (downscaled 1280w)
  - docs/table-3d/anchors/reference-tag/{hero,card,macro}.png — protected-reference corpus (tag d17df37, never mutated)
  - tools/table-3d/region-rects.json — finalized fixed metric + M12 rects (POV promoted to FINAL)
  - M12 zero-change CLOSED (all identity regions incl. POV fov40 = MSE 0)
  - docs/table-3d/SCORECARD_TABLE_3D.md — 15-element baseline LOCKED (operator-signed-off)
  - docs/table-3d/TP0_BASELINE.md — perf baseline (M10/M11) + freeze finalization, LOCKED
affects: [TP1, TP2, TP3, TP4, TP5, TP6, TP7, TP8, TP9, regression-anchor]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Protected-tag capture via a throwaway detached git worktree (camera-only preset added in the worktree; scene untouched); worktree removed; tag SHA re-asserted == d17df37 (reference never degraded)"
    - "M12 determinism closure: fresh capture vs frozen baseline -> regional MSE 0 on every identity region (now including the POV-dependent region at the locked fov40)"
    - "Admitted metrics re-run on FULL-RES captures (2880x1800) with the finalized rects; committed anchors stay downscaled 1280w for repo size"

key-files:
  created:
    - tools/table-3d/region-rects.json
    - docs/table-3d/anchors/reference-tag/hero.png
    - docs/table-3d/anchors/reference-tag/card.png
    - docs/table-3d/anchors/reference-tag/macro.png
  modified:
    - docs/table-3d/anchors/head/hero.png   # re-captured from the corrected scene (plan 05 fixes)
    - docs/table-3d/anchors/head/card.png
    - docs/table-3d/anchors/head/macro.png
    - docs/table-3d/SCORECARD_TABLE_3D.md    # 15-element baseline filled + LOCKED
    - docs/table-3d/TP0_BASELINE.md          # draw/frame-time baseline + freeze finalization + LOCKED

key-decisions:
  - "Protected-tag corpus: captured the felt/rail/chip/lighting reference (the tag has no cards) at the 3 locked framings via a throwaway detached worktree. A camera-only `card` preset was added IN the worktree to match the POV framing; the scene/materials were untouched and the worktree discarded. Tag SHA re-asserted == d17df37 (NEVER mutated, SSOT 5.2)."
  - "Highest-fidelity As-de-Espadas fix (plan 05): restored the pristine canonical original (no re-encode loss) rather than re-rotating the already-degraded frontend copy."
  - "region-rects.json externalizes REGIONS + M12_REGIONS; the POV rect promoted PROVISIONAL -> FINAL now that POV fov is locked at 40."
  - "M12 POV-region (deferred by plan 04) CLOSED: fresh-vs-baseline MSE 0 on the POV felt identity region at fov40 (render byte-deterministic, M9-consistent). All other identity regions also MSE 0."
  - "Admitted metrics re-run over the corrected HEAD: M3/M4/M5/M6/+B PASS (no regression); M8/+A informational -> TP6 (restrained vignette + warm-corner are TP6 deliverables). M10 over ceiling -> TP3. M11 PASS."
  - "Scorecard baseline proposed by automated assessment (anchors + metrics), avg ~3.4; operator accepted ('Baseline locked') as the TP0 baseline."

requirements-completed: [TP0a-4, TP0a-5, TP0a-6]

# Metrics
completed: 2026-06-10
---

# Phase 1 Plan 06: TP0 Irreversible Baseline Freeze Summary

**The frozen rig + complete baseline are LOCKED (operator-signed-off): protected-tag reference corpus captured without ever mutating the tag, region rects finalized, the deferred POV-region M12 closed (MSE 0), the 15-element scorecard baselined, and the draw-call/frame-time baseline recorded — the protected reference for TP1->TP9.**

## Accomplishments

- **Protected-tag reference corpus.** Captured `table-3d-premium-reference-2026-06-04` (`d17df37`, the pre-cards felt/rail/chip/lighting reference) at HERO/POV/MACRO via a throwaway `git worktree add --detach` (deps installed prefer-offline; a camera-only `card` preset added in the worktree to match framing). Worktree removed; **tag SHA re-asserted == d17df37 — never mutated** (reference-never-degraded). → `docs/table-3d/anchors/reference-tag/{hero,card,macro}.png` (downscaled 1280w).
- **HEAD corpus refreshed.** Re-captured the 3 money shots from the corrected scene (plan-05 fixes) at the locked framing → `docs/table-3d/anchors/head/*` (1280w). GPU-faithful (RTX 4060 ANGLE D3D11), zero console errors.
- **region-rects.json finalized.** Externalized the metric + M12 rects; the POV rect promoted PROVISIONAL → FINAL at the fov40 lock.
- **M12 zero-visual-change CLOSED.** Fresh capture vs frozen baseline → **MSE 0** on HERO felt + HERO brass + MACRO identity AND the **POV felt region at fov40** (the region deferred by plan 04). Render is byte-deterministic.
- **Admitted metrics re-run (no regression).** Over the corrected full-res HERO: M3 felt ΔE 8.55 PASS · M4 brass H39.4°/S0.38/V0.69 PASS · M5 clip 0% PASS · M6 contact-shadow 17.3% PASS · +B specular 0% PASS. M8 vignette (88.9%) + +A warm-corner → **informational, TP6**.
- **Scorecard baselined + LOCKED.** 15 elements scored 0–5 (avg ≈ 3.4; depth 2 weakest, cards/composition/cameras/lighting/rail/body/social-read 4). Operator accepted ("Baseline locked").
- **Perf baseline recorded.** M10 draw-calls HERO/POV/MACRO 217/217/181 · chips=full 637 (all over ceiling → **TP3** instancing, informational). M11 frame-time ~1.3ms median @HERO (vsync/cap OFF, RTX 4060) → **PASS** (~6× margin). Recorded in `TP0_BASELINE.md`.

## Task Commits

1. **Freeze package** (protected-tag corpus, region-rects.json, M12 closure, admitted-metric re-run, scorecard baseline, perf baseline, gate record) — `21aba04` (feat)

(HEAD-corpus refresh `56520a1` landed in plan 05's fix sequence.)

## Decisions Made

- **Tag immutability is mechanical, not trusted.** Capture via a detached throwaway worktree + post-capture SHA re-assertion (== d17df37); the tag is never checked out in the main tree.
- **POV-region M12 closed by determinism.** With the scene frozen + fov40 locked, a fresh capture is byte-identical to the baseline (MSE 0) → the POV identity region is a stable, reproducible anchor.
- **Honest informational metrics.** M8/+A (vignette/warm-corner) and M10 (draw-calls) are recorded informational and routed forward (TP6 / TP3) — never forced to pass at TP0.

## Deviations from Plan

- **01-06 Task 1's HEAD-corpus capture was partly pre-done out-of-band** (an earlier `9c70a5d`), then INVALIDATED by the plan-05 fixes and re-captured fresh here (`56520a1`) from the corrected scene. Net effect: the frozen anchors correctly reflect the fixes. No scope change.
- **The reference-tag `card` shot required a camera-only preset** added in the throwaway worktree (the pre-cards tag has no `card` POV). Scene/materials untouched; tag commit immutable. Documented in `TP0_BASELINE.md`.

## Issues Encountered

- None blocking. `npm install` in the tag worktree completed in ~10s (prefer-offline reused the main cache). The tag's Vite server (port 5174) was killed by PID and the worktree removed cleanly.

## Next Phase Readiness

- **TP0 / Phase 1 COMPLETE.** The frozen rig + baseline are the protected reference for TP1→TP9 — no mid-program re-baseline.
- **PAUSED before Phase 2 (TP1 — Felt materiality).** Operator has NOT authorized TP1; do not start it without an explicit GO.
- Carried forward: M10→TP3, M1 rank-index ~17px legibility note, depth/AO/vignette→TP5/TP6, the dual 2D/3D view-mode architecture directive (its own future workstream).

## Self-Check: PASSED

6 anchors present + downscaled ≤1600w (1280×800); worktree clean (no tp0-ref-tag); tag `table-3d-premium-reference-2026-06-04` SHA == d17df37 (never mutated); `region-rects.json` present; scorecard 0 `_TP0_` placeholders; M12 all identity regions MSE 0 (POV closed); admitted metrics M3/M4/M5/M6/+B PASS over the corrected HEAD; freeze package commit `21aba04` in git history. LOCAL only — no push/merge/deploy.

---
*Phase: 01-tp0-eval-rig-baseline-blocking*
*Completed: 2026-06-10*
