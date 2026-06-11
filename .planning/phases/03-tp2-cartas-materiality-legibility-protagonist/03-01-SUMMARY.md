---
phase: 03-tp2-cartas-materiality-legibility-protagonist
plan: "01"
subsystem: ui
tags: [pixi, r3f, playwright, metrics, baseline, legibility, m1, m6, contact-shadow]

# Dependency graph
requires:
  - phase: 02-tp1-felt-tapete-materiality
    provides: felt MeshPhysicalMaterial adopted as reference baseline (TP1 APPROVED)
  - phase: 03-tp2-cartas-materiality-legibility-protagonist
    provides: encuadre ADOPTED (CARD_W 2.05, FELT_R 6.5, 5-board, HOLE_Z 2.3) — plan 03-01 precondition

provides:
  - rollback tag tp2-before-cards at HEAD 22017ee (LOCAL, never pushed/deleted)
  - 3 tp2-base anchor PNGs at 1280x800 (card/hero/macro frozen money shots of adopted scene)
  - M1 FLOOR = 9px on 1728x1080 POV downscale — the post-encuadre legibility floor (requiresOperatorConfirm=TRUE)
  - M6 region rects recalibrated for CARD_W 2.05 scene — new rects 20.8% PASS (old rects 7.55% FAIL)
  - TP2_BASELINE.md — complete measurement provenance, M5/+B baseline, capture constants

affects:
  - 03-02 through 03-05 (every lever plan measures M5/M6/M12 delta against tp2-base, NOT head/)
  - 03-06 (operator gate receives M1 floor = 9px, expects improvement from TP2 levers)
  - tools/table-3d/metrics.mjs (M6 rects updated — all downstream metric runs use new coords)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TP2 lever delta baseline: compare against tp2-base/, NOT head/ (apples-to-apples on adopted scene)"
    - "M6 recalibration: pixel luma scan (G-R threshold + vertical gradient) to locate real shadow rect"
    - "M1 floor: row-by-row dark-pixel scan on 1728x1080 downscale at x=618-658, y=505-540"

key-files:
  created:
    - docs/table-3d/anchors/tp2-base/card.png
    - docs/table-3d/anchors/tp2-base/hero.png
    - docs/table-3d/anchors/tp2-base/macro.png
    - docs/table-3d/TP2_BASELINE.md
  modified:
    - tools/table-3d/metrics.mjs

key-decisions:
  - "M1 FLOOR = 9px (1728x1080 downscale of POV frame, rank-glyph rows 513-521 of '10' numeral) — below 22px target but expected given CARD_W 2.4->2.05 shrink; TP2 levers must NOT regress below 9px; operator gate at 03-06"
  - "M6 RECALIBRATED: old rects {left:360,top:1230}/{left:360,top:1090} sample open felt on CARD_W 2.05 scene (7.55% FAIL); new rects {left:420,top:1120}/{left:420,top:1310} land on real contact-shadow zone (20.8% PASS)"
  - "tp2-before-cards rollback tag cut at 22017ee (not 045f748 as plan estimated) — verified 3 intervening commits are pure docs/.planning/ (no card render code); tag still represents the correct clean pre-card-edit state"
  - "tp2-base captures downscaled in-place to 1280x800 to match head/ corpus; full-res 2880x1800 for M6/M1 analysis kept in .dev-stack/diag/ (gitignored scratch)"
  - "Meta-gate shows M6 as informational (good-control frame never committed at TP0 — pre-existing limitation); M6 admission stands in METRICS_ADMISSION.md; new rects satisfy same criterion and pass at 20.8%"

patterns-established:
  - "Wave-0 foundation pattern: tag -> capture -> measure -> recalibrate, all BEFORE any visual edits"
  - "Pitfall 8 confirmed: region rects must be recalibrated whenever CARD_W or HOLE_Z changes — old coords drift off the shadow zone"

requirements-completed:
  - "SSOT §TP2 — re-baseline post-encuadre (apples-to-apples basis)"
  - "SSOT §TP2 — M1 legibility MUST NOT regress (establish the post-encuadre floor)"
  - "SSOT §TP2 — near-edge contact-shadow tightened (M6) — recalibrate the M6 region rects first"
  - "SSOT §5.3 — per-phase rollback tag before any edit"

# Metrics
duration: 150min
completed: "2026-06-11"
---

# Phase 3 Plan 01: TP2-Foundation Summary

**tp2-before-cards rollback tag + 3 frozen-money-shot tp2-base anchors captured; M1 floor = 9px on 1728x1080 POV downscale; M6 rects recalibrated from 7.55% FAIL (wrong-zone) to 20.8% PASS on adopted CARD_W 2.05 scene**

## Performance

- **Duration:** ~150 min
- **Started:** 2026-06-11T14:00:00Z (approx)
- **Completed:** 2026-06-11T16:04:40Z
- **Tasks:** 2 of 2
- **Files modified:** 5

## Accomplishments

- Cut rollback tag `tp2-before-cards` at pre-card-edit HEAD (`22017ee`) — LOCAL, never pushed
- Captured 3 × 1280x800 anchor PNGs (`card`, `hero`, `macro`) of adopted post-encuadre scene at frozen money-shot cameras; stored in `docs/table-3d/anchors/tp2-base/`
- Measured M1 legibility floor: rank-glyph "10" spans rows 513-521 on 1728x1080 POV downscale = **9px** (TP2 hard gate: no lever may regress below this; operator confirm at 03-06)
- Recalibrated M6 region rects — old coords now sample open felt on smaller-card scene (7.55% FAIL); new coords land on the real contact-shadow gradient (20.8% PASS, well above 12% gate)
- Authored `docs/table-3d/TP2_BASELINE.md` with M1 floor, M6 before/after, M5/+B/M3/M4/M8/+A baseline values, and full capture provenance

## Task Commits

1. **Task 1: rollback tag + tp2-base captures** — `048df10` (chore)
2. **Task 2: M1 floor + M6 recalibration + TP2_BASELINE.md** — `3e2c505` (feat)

**Plan metadata:** TBD (docs commit follows)

## Files Created/Modified

- `docs/table-3d/anchors/tp2-base/card.png` — TP2 baseline POV money shot (1280x800)
- `docs/table-3d/anchors/tp2-base/hero.png` — TP2 baseline HERO money shot (1280x800)
- `docs/table-3d/anchors/tp2-base/macro.png` — TP2 baseline MACRO money shot (1280x800)
- `docs/table-3d/TP2_BASELINE.md` — M1 floor + M6 verdict + capture provenance
- `tools/table-3d/metrics.mjs` — REGIONS.underCardHero and feltAdjacentHero coords updated (only; no thresholds/logic changed)

## Decisions Made

- **Tag at 22017ee not 045f748:** Plan estimated pre-edit HEAD as `045f748`. Actual HEAD was `22017ee` (3 intervening docs-only commits after the plan was written). Verified all 3 are pure `.planning/` doc changes with zero card render code — the tag still marks the correct clean state. No card edits precede it.
- **Downscale in-place to 1280x800:** tp2-base commits match the `head/` corpus width so visual comparisons are apples-to-apples. Full-res originals in `.dev-stack/diag/table-3d/tp2-base/` (gitignored).
- **M6 recalibration required (not just verification):** Pitfall 8 materialized — old rects drift off the shadow zone when CARD_W shrinks. Pixel luma scan at x=460 (vertical y=1050-1340) confirmed genuine contact-shadow gradient; new rects selected for maximum shadow contrast.
- **M1 FLOOR = 9px accepted:** Below the 22px target, but expected given ~15% card shrink. The TP2 levers (max-anisotropy, mipmap crispness) sharpen existing pixels, not enlarge them. If sharpening cannot reach "razor-legible" at operator gate, escalate to a separate encuadre decision (CARD_W reconsideration — that is a separate operator call; encuadre is adopted and not reopened unilaterally).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Rollback tag cut at 22017ee instead of 045f748**
- **Found during:** Task 1 (cut tp2-before-cards tag)
- **Issue:** Plan stated expected pre-edit HEAD was `045f748`; actual HEAD was `22017ee` (plan was written 3 commits earlier)
- **Fix:** Verified all 3 intervening commits (`22017ee`, `caa1cd7`, `e350973`) are pure `.planning/` docs (no card render code). Tag cut at actual HEAD — still the correct pre-card-edit state.
- **Files modified:** none (git tag only)
- **Verification:** `git log --oneline 045f748..22017ee` shows 3 docs commits; git tag confirmed present at 22017ee
- **Committed in:** `048df10` (chore — tag + capture)

**2. [Rule 1 - Bug] Vite used port 5175 (5173 + 5174 occupied)**
- **Found during:** Task 1 (start Vite dev server)
- **Issue:** Ports 5173 and 5174 already in use; Vite auto-selected 5175
- **Fix:** All capture commands pointed to `localhost:5175`; no code change needed
- **Committed in:** `048df10` (no file change)

**3. [Rule 1 - Bug] Full-res captures overwritten by in-place downscale**
- **Found during:** Task 2 (M6 calibration analysis requires 2880x1800 image)
- **Issue:** The captures were downscaled in-place (sharp overwrites input = same file), so the `.dev-stack/diag/` copies are also 1280x800. The REGIONS rects (calibrated for 2880x1800) fail out-of-bounds on 1280x800.
- **Fix:** Made new direct full-res captures (`hero-full.png`, `card-full.png`) into `.dev-stack/diag/table-3d/tp2-base/` for metric analysis. Committed PNGs stay 1280x800 (correct).
- **Committed in:** `3e2c505` (feat — full-res used for analysis only, gitignored)

**4. [Rule 3 - Blocking] JavaScript syntax error in inline node script**
- **Found during:** Task 2 (pixel scan script)
- **Issue:** Used `top=1050` (assignment) instead of `top:1050` (object literal property) in a `node -e` invocation
- **Fix:** Corrected syntax immediately in next invocation
- **Committed in:** `3e2c505` (no file artifact)

---

**Total deviations:** 4 auto-fixed (3 Rule 1 bugs, 1 Rule 3 blocking)
**Impact on plan:** All auto-fixes required for correct execution. No scope creep. No card render code touched.

## Issues Encountered

- **Meta-gate M6 informational (pre-existing):** `--meta-gate docs/table-3d/anchors/controls` runner shows M6 as `informational` because the committed good-control frame `m6-shadow-good.png` was never committed at TP0 (the full-res controls that admitted M6 at TP0 were `.dev-stack/` scratch, now gone). This is a pre-existing limitation, not a new regression. M6 admission stands in `METRICS_ADMISSION.md` (good=14.14% PASS, bad=-0.05% FAIL). The new rects are directly verified at 20.8% PASS on the full-res tp2-base hero frame. Documented in `TP2_BASELINE.md` §M6.
- **sharp `Cannot use same file for input and output`:** sharp refuses to pipe to the same file path it reads. Fixed by specifying a distinct output path.
- **`captureRun` requires `hero.png` filename:** `run-metrics.mjs` looks for `hero.png` exactly; scratch dir had `hero-full.png`. Fixed by `cp` copy.
- **`extract_area: bad extract area`:** REGIONS rects (calibrated for 2880x1800) fail out-of-bounds on 1280x800 committed PNGs. All M6 analysis runs on full-res images only.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Wave-0 foundation COMPLETE.** All 4 preconditions satisfied:
  1. Rollback tag `tp2-before-cards` at `22017ee` — LOCAL safety net in place
  2. `docs/table-3d/anchors/tp2-base/{card,hero,macro}.png` — apples-to-apples delta basis for every TP2 lever
  3. M1 FLOOR = 9px — hard gate for TP2 levers established (no lever may go below 9px)
  4. M6 rects recalibrated — 20.8% PASS; trustworthy shadow gate for lever plans
- **Plans 03-02…03-05** (lever plans) can now run. Each measures M5/M6/M12 delta against `tp2-base/`, NOT `head/`.
- **Known watch:** M1 floor of 9px is below the 22px target. TP2 sharpening levers are expected to improve perceived legibility (crispness, not scale). Operator confirm is the 03-06 gate.
- **No blockers.** M3/M4/M8/+A FAILs in the baseline are expected TP6 scope items (not TP2 scope) — documented in TP2_BASELINE.md.

---
*Phase: 03-tp2-cartas-materiality-legibility-protagonist*
*Completed: 2026-06-11*
