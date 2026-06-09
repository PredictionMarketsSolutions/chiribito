---
phase: 01-tp0-eval-rig-baseline-blocking
plan: 03
subsystem: testing
tags: [sharp, metrics, eval-rig, control-frames, meta-gate, draw-call, playwright, table-3d]

# Dependency graph
requires:
  - phase: 01-01
    provides: tracked tools/table-3d/ + docs/table-3d/anchors/controls/ dirs; restored lab-shot.mjs harness
  - phase: 01-02
    provides: StatsProbe (?stats → window.__labStats); frozen 3 presets; SCORECARD skeleton
provides:
  - "tools/table-3d/metrics.mjs — sharp T1 pure-pixel metrics (M3/M4/M5/M6/M8/+A/+B) + M10 verdict, EXACT §4.5 baked thresholds"
  - "tools/table-3d/run-metrics.mjs — capture run + --meta-gate (admit iff PASS-good AND FAIL-bad)"
  - "tools/table-3d/stats-read.mjs — accurate headless M10 draw-call reader (wraps drawElements)"
  - "tools/table-3d/make-controls.mjs — positive+negative control-frame generator"
  - "docs/table-3d/METRICS_ADMISSION.md — per-metric admission ledger (6 ADMITTED, 2 informational)"
  - "docs/table-3d/anchors/controls/ — downscaled control-frame corpus (0.3 MB)"
affects: [plan-01-04, plan-01-06, TP1-felt, TP3-chips, TP5-lighting, TP6-depth, all-later-TP-gates]

# Tech tracking
tech-stack:
  added: []  # no new package — sharp@0.34.5 + playwright pre-existing at repo ROOT (D-05)
  patterns:
    - "Red-team META-GATE: a metric is ADMITTED only after PASS-on-known-good AND FAIL-on-known-bad; else informational (never forced to pass, never dropped)"
    - "Pure-verdict metric fns: each returns {pass,value,threshold,detail} over a PNG + region rect; baked thresholds as frozen named constants"
    - "Control frames committed DOWNSCALED (640w palette) for audit; numeric proof on full-res working copies in gitignored .dev-stack/"
    - "Headless draw-call read by wrapping GL drawElements/drawArrays (non-invasive; StatsProbe gl.info reads stale 1 under rAF throttle)"

key-files:
  created:
    - tools/table-3d/metrics.mjs
    - tools/table-3d/run-metrics.mjs
    - tools/table-3d/stats-read.mjs
    - tools/table-3d/make-controls.mjs
    - tools/table-3d/metrics.test.mjs
    - docs/table-3d/METRICS_ADMISSION.md
    - docs/table-3d/anchors/controls/_hero-good.png
    - docs/table-3d/anchors/controls/m3-felt-bad.png (+6 more *-bad.png)
  modified: []

key-decisions:
  - "M8 vignette + +A warm-corner recorded INFORMATIONAL — they pass FAIL-on-bad but cannot pass the good control on the TP0 baseline (the restrained 8-20% warm vignette is a TP6 deliverable); they become active gates once TP6 lands it"
  - "M10 draw-call read via a drawElements/drawArrays wrapper (stats-read.mjs) rather than StatsProbe's gl.info.render.calls, which reads a stale 1 under headless rAF throttling — avoids mutating the frozen plan-01-02 StatsProbe"
  - "Region rects calibrated against the REAL HERO baseline (felt @760,500 ΔE 8.5; brass @1240,820 aged-brass H40/S0.47/V0.73, deliberately NOT the painted court-card gold at S≈0.70)"
  - "FRAMING_CORNERS = top corners only — the current baseline fills the BOTTOM corners with lit felt, so M8/+A read the dark top surround for the framing falloff"
  - "Control corpus committed downscaled (640w, palette) — 0.3 MB total vs ~20 MB at full-res (Pitfall 5)"

patterns-established:
  - "META-GATE admission: tools/table-3d/run-metrics.mjs --meta-gate <dir> exits 0 iff every admitted metric passed good + failed bad"
  - "Single REGIONS config object holds all rects so plan 06 can finalize the PROVISIONAL POV rect post-operator-gate"

requirements-completed: [TP0b-1, TP0b-2]

# Metrics
duration: 38min
completed: 2026-06-09
---

# Phase 1 Plan 03: TIER-1 Sharp Pixel Metrics + Red-Team Meta-Gate Summary

**Sharp-based T1 metric kit (M3/M4/M5/M6/+B + M10) admitted via positive+negative control frames; M8/+A honestly recorded informational because the TP0 baseline pre-dates the TP6 vignette.**

## Performance

- **Duration:** ~38 min
- **Started:** 2026-06-09T17:10:00Z (approx)
- **Completed:** 2026-06-09T17:48:00Z (approx)
- **Tasks:** 2
- **Files created:** 9 (4 instrument scripts + 1 test + 1 admission doc + 8 control PNGs in one corpus dir)

## Accomplishments
- Implemented the 7 sharp pure-pixel metrics (M3 felt-hue ΔE, M4 brass-not-gold, M5 highlight-clip, M6 contact-shadow, M8 vignette, +A warm-corner, +B felt-specular) + the M10 draw-call verdict, all with the EXACT §4.5 baked thresholds as frozen named constants, running from the repo ROOT on the pre-existing `sharp` (no new install).
- Built the red-team META-GATE runner: each metric is run against a positive (real baseline) AND a negative (lab-debug-flag or sharp-transform) control frame; **admitted ONLY if PASS-good AND FAIL-bad** — otherwise informational.
- **6 metrics ADMITTED** (M3, M4, M5, M6, +B, M10); **2 informational** (M8, +A) — honestly, because they cannot pass their good control on the current baseline (no restrained vignette yet).
- Captured the **honest M10 draw-call baseline** (HERO 237, POV 237, MACRO 195, chips=full 637) — all currently OVER the <150/<220 ceiling (the un-instanced pot is the worst case; TP3 fixes it). Recorded as the TP0 regression baseline.
- 6/6 unit tests green (`node --test`); control corpus committed downscaled at 0.3 MB.

## Task Commits

1. **Task 1: T1 pure-pixel metrics + M10 reader on sharp** — `c08f995` (feat)
2. **Task 2: meta-gate admits 6 metrics via +/- control frames; M8/+A informational** — `cf624df` (feat)

_(Task 2 also carried the metrics.mjs rect-calibration update — the rects had to be authored against the real captured frame, not idealized boxes.)_

## Files Created/Modified
- `tools/table-3d/metrics.mjs` — sharp region math; RGB→Lab/HSV helpers; the 7 metric fns + M10 verdict; baked §4.5 thresholds + REGIONS rect config + FRAMING_CORNERS.
- `tools/table-3d/run-metrics.mjs` — two modes: capture run (PASS/FAIL/info table) + `--meta-gate` (admission proof, exits 0 iff admitted metrics passed good + failed bad).
- `tools/table-3d/stats-read.mjs` — headless M10 reader; counts GPU draw calls by wrapping drawElements/drawArrays for one real frame (with anti-throttle Chromium flags).
- `tools/table-3d/make-controls.mjs` — generates the positive+negative control corpus (real baseline + lab `?felt=magenta` + sharp region transforms), full-res working copies + downscaled committed copies.
- `tools/table-3d/metrics.test.mjs` — 6 `node --test` cases: M3/M4/M5/M8 good+bad, region helper, M10 verdict (fails closed on non-numeric).
- `docs/table-3d/METRICS_ADMISSION.md` — the admission ledger: per-metric threshold, good/bad control + numeric result, ADMITTED|informational, the M10 live baseline, and the 3 instrument deviations.
- `docs/table-3d/anchors/controls/*.png` — 1 shared `_hero-good.png` + 7 `*-bad.png` (downscaled 640w palette, 0.3 MB total).

## Decisions Made
- **M8/+A informational, not forced to pass.** Per the meta-gate rule + the plan's `<deviation_rule>` ("never force a pass"), a metric that cannot pass a known-good frame is NOT admitted. M8 (corners 89% below center) and +A (corner luma 15.6 < floor 18) fail the good control because the baseline has a hard dark surround, not the restrained 8-20% warm vignette TP6 will add. They correctly FAIL their bad controls, so the verdict LOGIC is proven; they flip to active gates at TP6.
- **M10 via drawElements wrapper, not StatsProbe gl.info.** See deviation 1 below — the contract interface returns a stale `1` headless; the wrapper gives the true count (237 HERO) without touching the frozen StatsProbe.
- **Rects calibrated against the real frame** (deviation 2). Brass deliberately samples the table's aged-brass reveal, not the court-card gold (which would read as "gold" and is not the table material under test).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] M10 reader: StatsProbe `window.__labStats.calls` reads a stale `1` under headless Chromium**
- **Found during:** Task 1 (M10 reader)
- **Issue:** The plan-contract interface for M10 is `window.__labStats.calls` (StatsProbe, plan 01-02). Empirically it reads `1` in headless: StatsProbe reads `gl.info.render.calls` at the START of its `useFrame` (before R3F renders that frame), and headless rAF is throttled so the continuous loop barely ticks. The true HERO count is ~205-237 draws.
- **Fix:** Added `tools/table-3d/stats-read.mjs` which counts GPU draw calls DIRECTLY by wrapping `drawElements`/`drawArrays` for one real frame, with `--disable-renderer-backgrounding` + `--disable-background-timer-throttling` so the render loop runs. Non-invasive (no scene/render change), deterministic, matches the canonical `renderer.info.render.calls` definition. The FROZEN StatsProbe (plan 01-02) was NOT modified — its zero-visual-change / M9 contract is preserved (verified `git diff --quiet` clean).
- **Files modified:** tools/table-3d/stats-read.mjs (new); StatsProbe.tsx untouched.
- **Verification:** stats-read reports HERO 237 / POV 237 / MACRO 195 / chips=full 637 reproducibly; the StatsProbe interface was left intact for a future post-render fix if `window.__labStats` is wanted on-device.
- **Committed in:** `c08f995` (Task 1)

**2. [Rule 1 - Bug] Region rects sampled the wrong pixels (placeholder boxes off the felt / on the cards)**
- **Found during:** Task 2 (running metrics on the real good frame)
- **Issue:** The initial placeholder rects made M3/M4/M8/+A FALSE-FAIL the known-good frame: the felt rect sampled the dark backdrop (ΔE 18), the brass rect sampled cream court cards (V 0.83).
- **Fix:** Grid-scanned the captured HERO baseline to calibrate: felt @(760,500,200×120) → ΔE 8.5 (clean woven green); brass @(1240,820,140×60) → the table's aged-brass reveal (H40/S0.47/V0.73), deliberately NOT the painted court-card gold (S≈0.70). Added `FRAMING_CORNERS` (top corners only) because the baseline fills the bottom corners with lit felt. All rects kept in one `REGIONS` object for plan 06 to finalize.
- **Files modified:** tools/table-3d/metrics.mjs (REGIONS + M8/+A corner set).
- **Verification:** M3/M4/M5/M6/+B PASS on the good frame; meta-gate exits 0.
- **Committed in:** `cf624df` (Task 2)

**3. [Rule 3 - Blocking] The running dev server was the MAIN checkout (no StatsProbe), not the worktree**
- **Found during:** Task 1 (reading draw calls)
- **Issue:** Port 5173 was serving the main checkout (StatsProbe absent → `?stats` path returned index.html), so `window.__labStats` could never populate.
- **Fix:** Started the worktree's own Vite dev server on 5180 (`cd frontend && npm run dev -- --port 5180`); confirmed it serves `StatsProbe.tsx` as `text/javascript`. All captures + M10 reads use 5180.
- **Files modified:** none (operational).
- **Verification:** `curl -I http://localhost:5180/src/lab/StatsProbe.tsx` → `Content-Type: text/javascript`; captures succeed with `ERRORS []`.
- **Committed in:** n/a (no file change)

---

**Total deviations:** 3 (2 Rule-1 bugs, 1 Rule-3 blocking). Plus 1 honest admission downgrade (M8/+A informational) which is the meta-gate working as designed, not a deviation.
**Impact on plan:** All fixes were required for a CORRECT instrument. No scope creep — the StatsProbe (plan 01-02) and all plan-01-04 files were left untouched. The M8/+A informational verdict is the truthful state of the baseline, exactly what the SSOT's "never proceed on a broken instrument / never force a pass" demands.

## Issues Encountered
- Headless Chromium rAF throttling + `autoReset` ordering made the StatsProbe draw-call value unusable headless — resolved with the drawElements-wrapper reader (deviation 1). The true draw-call baseline (HERO 237) is well over the <150 ceiling, which is the honest TP0 regression baseline (TP3 instances the pot to bring it under).

## User Setup Required
None - no external service configuration required. (Local static-WebGL instrumentation; no network/auth/secrets.)

## Next Phase Readiness
- The T1 metric instrument is reproducible from a clean checkout (all code in tracked `tools/table-3d/`, runs from ROOT on pre-existing sharp).
- **Ready for plan 01-04** (M1/M2/M12 + M7 bloom-assert + M9 determinism + the integrity test) — its files were deliberately not touched.
- **For plan 01-06 (post-operator-gate):** finalize the PROVISIONAL POV rect once the operator picks fov 37-vs-40; record the live M10/M11 numbers in TP0_BASELINE.md; re-capture M8/+A good controls if/when TP6's vignette is in scope.
- **Open (carried):** M10 draw-call baseline is OVER ceiling (expected; TP3). M8/+A remain informational until TP6. The on-device M11 frame-time + the M1 cards-as-protagonist gate are still operator items.

## Self-Check: PASSED

- All created files verified on disk (5 scripts + admission doc + control PNGs + SUMMARY).
- Both task commits verified in git log: `c08f995` (Task 1), `cf624df` (Task 2).

---
*Phase: 01-tp0-eval-rig-baseline-blocking*
*Completed: 2026-06-09*
