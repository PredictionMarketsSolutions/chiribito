---
phase: 01-tp0-eval-rig-baseline-blocking
plan: 04
subsystem: testing
tags: [eval-rig, sharp, crypto-md5, regional-mse, determinism, anti-casino, playwright, table-3d]

# Dependency graph
requires:
  - phase: 01-01
    provides: tracked tools/table-3d/ + docs/table-3d/anchors/controls/ dirs (.gitkeep), restored harness, rollback tag
  - phase: 01-02
    provides: StatsProbe (?stats renders null, zero-visual-change proven), frozen presets, POV fov 40 recorded
provides:
  - M9 determinism gate (crypto md5 byte-identity of two consecutive &spin=off captures)
  - M7 bloom-absence gate (code-assert grep of frontend/src/lab + sharp histogram halo check)
  - M12 regional-MSE anchor (the zero-visual-change / regression proof; baked churn floor 1.0)
  - M1 legibility seam (rank-glyph px-height >= 22px + requiresOperatorConfirm, no auto OCR)
  - M2 cards-vs-chips seam (area ratio >= 2.0x with SSOT-sanctioned manual-polygon fallback)
  - METRICS_ADMISSION_INTEGRITY.md ledger (M9/M7/M12 ADMITTED via control frames)
  - integrity control corpus under docs/table-3d/anchors/controls/ (M9/M7/M12 good+bad)
affects: [01-05, 01-06, TP1, TP2, TP3, TP6, regression-anchor, operator-gate]

# Tech tracking
tech-stack:
  added: []  # no new deps — sharp@0.34.5 + node crypto already at repo root (plan 01-03)
  patterns:
    - "Integrity metric = pure verdict fn { pass, value, threshold, detail } + capture/--meta-gate CLI"
    - "Red-team meta-gate: ADMITTED iff PASS-on-good AND FAIL-on-bad; else informational (never forced)"
    - "Committed control corpus downscaled (640w); numeric proof on full-res working copies in .dev-stack"
    - "FOV-invariant M12 scope at TP0; POV-dependent region deferred to plan 06 (post operator fov-lock)"

key-files:
  created:
    - tools/table-3d/m9-determinism.mjs
    - tools/table-3d/m7-bloom-assert.mjs
    - tools/table-3d/m1-m2-m12.mjs
    - tools/table-3d/integrity.test.mjs
    - tools/table-3d/make-integrity-controls.mjs
    - docs/table-3d/METRICS_ADMISSION_INTEGRITY.md
    - docs/table-3d/anchors/controls/m9-good-a.png
    - docs/table-3d/anchors/controls/m9-good-b.png
    - docs/table-3d/anchors/controls/m9-bad.png
    - docs/table-3d/anchors/controls/m7-halo-good.png
    - docs/table-3d/anchors/controls/m7-halo-bad.png
    - docs/table-3d/anchors/controls/m7-src-good/Clean.tsx
    - docs/table-3d/anchors/controls/m7-src-bad/Glow.tsx
    - docs/table-3d/anchors/controls/m12-good.png
    - docs/table-3d/anchors/controls/m12-bad-tinted.png
  modified: []  # plan 01-03 files (metrics.mjs etc.) READ/reused only — NOT modified

key-decisions:
  - "M12 churn floor = 1.0 MSE (8-bit, ~1 grey level RMS); a true no-change region is byte-identical MSE 0, the floor absorbs re-encode rounding only"
  - "M12 admitted on FOV-INVARIANT frames (HERO fov32 + MACRO fov26); POV-region M12 DEFERRED to plan 06 (POV fov 40-vs-37 locked by operator in plan 05)"
  - "M1/M2 recorded informational with operator/manual seam — never auto-admitted (SSOT: px-height+manual for M1, manual-polygon fallback for M2)"
  - "Committed M9 bad control altered POST-downscale so its md5 genuinely differs (a full-res byte-flip is lost on re-encode)"

patterns-established:
  - "Pattern 1: integrity metrics mirror plan 01-03's pure-fn + meta-gate shape for a single shared instrument idiom"
  - "Pattern 2: zero-visual-change is PROVEN (not asserted) — fresh capture vs HEAD baseline, regional MSE = 0 on fov-invariant regions"

requirements-completed: [TP0b-1, TP0b-3]

# Metrics
duration: 12min
completed: 2026-06-09
---

# Phase 1 Plan 04: TP0b Integrity Metrics Summary

**M9 byte-identity determinism, M7 bloom-absence code-assert + halo, and M12 regional-MSE zero-visual-change anchor (all red-team meta-gate ADMITTED), plus the M1 px-height / M2 cards-vs-chips operator-confirm seam — proving TP0 changed zero scene pixels.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-09T15:42:18Z
- **Completed:** 2026-06-09T15:55Z (approx)
- **Tasks:** 2
- **Files modified:** 15 created (0 of plan 01-03's files touched)

## Accomplishments

- **M9 determinism** — `crypto.createHash('md5')` byte-identity of two consecutive `&spin=off` captures. Proven LIVE: two HERO captures → identical md5 `fa8bb180…`. The apples-to-apples anchor every later diff depends on.
- **M7 bloom-absence** — code-assert greps `frontend/src/lab` for `/Bloom|EffectComposer|postprocessing/` → **0 matches** on the real tree (grep exit 1); plus a sharp histogram halo check. Bloom is provably not mounted (anti-casino, SSOT §5.4); `postprocessing` is not even installed.
- **M12 regional-MSE** — the zero-visual-change / regression anchor. Proven: fresh capture vs HEAD baseline → regional **MSE 0** on all FOV-INVARIANT regions (HERO felt/brass fov32 + MACRO identity fov26). The fresh HERO frame was byte-identical to the baseline — the strongest possible zero-change evidence. POV-region M12 explicitly DEFERRED to plan 06.
- **M1 / M2 seam** — M1 reports rank-glyph px-height vs ≥22px and ALWAYS `requiresOperatorConfirm` (no auto OCR gate); M2 cards-vs-chips ≥2.0× with the manual-polygon fallback. Both recorded `informational` honestly.
- **Red-team meta-gate** — M9, M7, M12 all ADMITTED (PASS-on-good AND FAIL-on-bad); `node --test integrity.test.mjs` 6/6 pass; meta-gate runners exit 0.

## Task Commits

Each task was committed atomically (LOCAL only — no push):

1. **Task 1: M9/M7/M12 instruments + M1/M2 seam + tests** - `75d3390` (feat)
2. **Task 2: build control frames, run meta-gate, append admission ledger** - `7a02af0` (test)

_Task 1 is TDD-flavored: the instrument code + `integrity.test.mjs` (6 behaviors) landed together and passed on first run (GREEN); no separate RED commit since these are pure-math verdict fns proven by synthesized fixtures._

## Files Created/Modified

**Instruments (tracked `tools/table-3d/`):**
- `m9-determinism.mjs` - M9 byte-identity: pure `md5(p)` + `m9(a,b)`; capture-twice + `--meta-gate` CLI
- `m7-bloom-assert.mjs` - M7: `grepBloom`/`assertNoBloom` code-assert + `haloFraction`/`m7Histogram` sharp halo; `--meta-gate`
- `m1-m2-m12.mjs` - M12 `m12RegionalMSE`/`m12ZeroChangeProof` (sharp); M1 `m1Legibility` (+`m1DownscalePov`); M2 `m2CardsVsChips` (+`polygonArea`); `--meta-gate` + `--zero-change` CLI
- `integrity.test.mjs` - `node --test`: M9 / M7 (code + halo) / M12 behaviors + M1/M2 seam coverage
- `make-integrity-controls.mjs` - builds the integrity control corpus (full-res working + downscaled committed)

**Ledger + controls (tracked `docs/table-3d/`):**
- `METRICS_ADMISSION_INTEGRITY.md` - the integrity admission ledger (separate from plan 01-03's `METRICS_ADMISSION.md`)
- `anchors/controls/m9-good-a.png`, `m9-good-b.png`, `m9-bad.png` - M9 controls (good-a/b byte-identical; bad md5-differs)
- `anchors/controls/m7-halo-good.png`, `m7-halo-bad.png` - M7 histogram controls (normal vs bright halo)
- `anchors/controls/m7-src-good/Clean.tsx`, `m7-src-bad/Glow.tsx` - M7 code-assert source fixtures (clean vs EffectComposer)
- `anchors/controls/m12-good.png`, `m12-bad-tinted.png` - M12 controls (frame-vs-self vs felt-rect-tinted)

## Decisions Made

- **M12 churn floor = 1.0 MSE.** A true no-change region is byte-identical → MSE exactly 0 (proven); the small non-zero floor absorbs any future re-encode/downscale rounding. The bad control (tinted felt) is 34886 MSE — four orders of magnitude over the floor, so the floor never risks admitting a real change.
- **M12 scoped to FOV-INVARIANT regions at TP0.** HERO (fov 32) and MACRO (fov 26) are unchanged presets → stable rects now. The POV (`?cam=card`) fov is provisional (40 in code, 37 candidate) and locked by the operator in plan 05, so the POV-dependent M12 region is DEFERRED to plan 06 (rect finalized there) — asserting it now would gate against a frame about to change. Mirrors plan 01-03's deferral of its POV colour rects.
- **M1/M2 are operator/manual seams, not auto-gates.** SSOT downgrades M1 to px-height + manual confirm (no OCR) and M2 to a manual-polygon fallback. Both recorded `informational` with the seam; the on-device read is the plan-05 operator gate.
- **Reused, did not duplicate, plan 01-03's sharp helpers.** `m1-m2-m12.mjs` imports `regionBuffer`/`REGIONS`/`FRAME` from `metrics.mjs`; no shared helper re-implemented; none of 01-03's files modified.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] M7 GOOD source fixture tripped its own code-assert**
- **Found during:** Task 2 (first meta-gate run)
- **Issue:** The clean `Clean.tsx` control fixture contained the word "postprocessing" in a comment; the M7 code-assert greps raw text, so it (correctly) found 1 match → the M7 GOOD control FAILED, blocking admission.
- **Fix:** Reworded the clean fixture's comment to avoid every forbidden token (`Bloom|EffectComposer|postprocessing`). M7 good then returned 0 matches → ADMITTED. The assert itself was correct — the control content was self-defeating.
- **Files modified:** tools/table-3d/make-integrity-controls.mjs (the generated `m7-src-good/Clean.tsx`)
- **Verification:** `m7-bloom-assert.mjs --meta-gate` → code-assert good=0 match PASS / bad=4 match FAIL; exit 0.
- **Committed in:** `7a02af0` (Task 2 commit)

**2. [Rule 1 - Bug] Committed M9 bad control could not fail after downscale re-encode**
- **Found during:** Task 2 (plan's Task-2 verify against the committed corpus)
- **Issue:** The 1-byte flip was applied to the full-res `m9-bad.png`, but `commitCopy` re-encodes pixels via sharp on downscale — discarding the single altered trailing byte. The committed good-a/good-b/bad all re-encoded to identical bytes, so on the committed corpus the M9 bad control PASSED (couldn't fail) → not admitted there.
- **Fix:** For the committed corpus, commit good-a once, byte-COPY it to good-b (guaranteed md5-equal), then make `m9-bad.png` a 1-byte-altered COPY of the *committed* good-a (post-encode flip → md5 genuinely differs). M9 is pure byte-identity, so a post-encode byte flip is a faithful known-bad.
- **Files modified:** tools/table-3d/make-integrity-controls.mjs
- **Verification:** committed good-a==good-b (`cdca93ce…`), bad differs (`292bdb25…`); `m9-determinism.mjs --meta-gate docs/table-3d/anchors/controls` exits 0.
- **Committed in:** `7a02af0` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — instrument-correctness bugs caught by the meta-gate itself)
**Impact on plan:** Both fixes were necessary to make the control corpus honest (a control that can't fail is no control). No scope creep — both are inside Task 2's control-construction. The meta-gate doing its job (refusing to admit a metric whose bad control passed) is exactly the red-team design working.

## Issues Encountered

- **`localhost` vs `127.0.0.1` IPv6 resolution.** The initial port-poll connected to `127.0.0.1:5181` and timed out while Vite bound to `localhost` (`::1` first on Windows 11). Resolved by polling via an HTTP `fetch('http://localhost:5181/...')` instead of a raw IPv4 socket; the server was up the whole time.
- **Dev-server shutdown.** `taskkill` by window title missed the headless background Vite (no window); killed it cleanly via the PID on port 5181 (PowerShell `Get-NetTCPConnection` → `Stop-Process` with children). Port 5181 confirmed DOWN at plan end.

## User Setup Required

None - no external service configuration required. (Local, offline, static-WebGL instrumentation only — no network/auth/secrets, no deploy.)

## Next Phase Readiness

- **Eval INSTRUMENT (TP0b) is COMPLETE.** Plan 01-03 (6 T1 colour metrics) + plan 01-04 (M9/M7/M12 integrity + M1/M2 seam) together cover the §4.5 kit; M11 (frame-time, operator-assisted) is the only remaining metric, read on-device in plan 06.
- **Ready for plan 01-05** (operator perceptual gate: POV fov 37-vs-40 + 3 money-shot blessing + M1 on-device confirm) and **plan 01-06** (baseline freeze + POV-region rect finalization + POV-region M12 re-run + M10/M11 on-device).
- **Deferred to plan 06:** the POV-dependent M12 region assertion (POV fov not yet locked). Recorded in the ledger + the threat register (T-04 row).
- **No blockers introduced.** Zero scene pixels changed (M12 = 0 on fov-invariant regions); the frozen StatsProbe + scene were not touched; isolation holds.

## Self-Check: PASSED

All 16 claimed files exist on disk; both task commits (`75d3390`, `7a02af0`) exist in git history. `node --test tools/table-3d/integrity.test.mjs` → 6/6 pass; M9/M7/M12 meta-gates exit 0; M7 real-tree assert exits 0; M12 zero-change proof = MSE 0 on fov-invariant regions; none of plan 01-03's files modified.

---
*Phase: 01-tp0-eval-rig-baseline-blocking*
*Completed: 2026-06-09*
