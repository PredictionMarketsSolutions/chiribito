# Chiribito — Runtime Diagnostic Handoff (sessions 2026-05-18 + 2026-05-19)

> # RUNTIME DIAGNOSTIC OFFICIALLY CLOSED — 2026-05-19
>
> Phases A + B + C + **Phase D PRIMARY** all SHIPPED. Mobile `labelIntrusionPct` 13.73% → 0%; mobile overall verdict red → yellow. No regressions; tests baseline preserved.
>
> The remaining desktop `cardAreaPctOfFelt = 2.81%` RED is **reclassified out of this diagnostic** — it moves to *Compact Table / Gameplay Density* sprint territory and will be addressed there as conscious gameplay-composition tuning, not as a runtime-diagnostic fix.
>
> Other deferred items (#7 mobile-GPU on real Android, #1 real-prod retest, long-window texture-memory) are no longer this diagnostic's responsibility. They become an optional Phase-E-style backlog the user may or may not choose to revisit.
>
> **No resume of this diagnostic. Future Chiribito work opens in a fresh sprint frame.**
>
> Predecessor: `docs/HANDOFF_A2.0.md` (Slice A2.0 closure, still valid).
> Spec: `docs/superpowers/specs/2026-05-18-chiribito-runtime-diagnostic-design.md`.
> Plan: `docs/superpowers/plans/2026-05-18-chiribito-runtime-diagnostic.md`.
> **Master findings (Phase C close-out)**: `docs/superpowers/findings/2026-05-19-chiribito-runtime-diagnostic-findings.md` ← canonical diagnostic record.

---

## PHASE C CLOSE-OUT SUMMARY (2026-05-19)

**Status:** Phase A ✅ + Phase B ✅ (with #7 DEFERRED) + Phase C ✅ → Phase D pending.

**Sequencing decision:** **P1 (readability) + P5 (mobile ergonomics) bucket** as next sprint. **No P2 perf bucket triggered.**

**Verdicts at close-out:**

| Area | Verdict | Driver |
|------|---------|--------|
| #1 frame-pacing | RED (spec) → **INDETERMINATE (adjusted)** | harness ~50Hz cap inflates slow-frames %; corroborating signals all PASS — no real pressure. RETEST_REQUIRED real prod 60Hz |
| #2 pixi-render-loop | PASS | wastefulRedrawsIdle = 0 |
| #3 texture-memory | PASS | 4 textures total, heap delta 0 MB/min |
| #4 resize-thrashing | PASS | CLS ~0, jitter 0 px, 0 canvas recreates |
| #5 ws-cadence | PASS | idle 0.2 msg/s heartbeat-only |
| #6 dom-rerenders | PASS | idle 0/win, 0 orphan |
| **#7 mobile-gpu** | **DEFERRED** | no real Android USB this session; retest pre-P5 polish |
| #8 zindex-layering | PASS | DOM analysis: label BELOW canvas (source order); "text-dominant pixel" mobile explained by Pixi backgroundAlpha:0 (transparent canvas reveals DOM label, not z-stacking misconfig) |
| **#9 readability** | **RED** | desktop: cardAreaPctOfFelt 2.81% (cards too small vs felt); mobile: labelIntrusionPct 13.73% portrait (label intrudes on community-card row). PURELY GEOMETRIC. |

**Net interpretation (confirmed by triangulation B9 + B4):** mobile label intrusion is **geometric/static**, not z-order or resize-triggered. Phase D scope is bounded.

**Tests baseline (verified 2026-05-19 post-close):** 225/225 vitest + 475/475 jest game + 27/27 jest api. Zero regression.

**Next session opens with Phase D 6-point spec** — see findings doc "Next session's first action".

---

---

## CURRENT STATUS (final close-out 2026-05-19, post-Phase-D Primary)

| Field | Value |
|-------|-------|
| **HEAD (last code commit)** | `45b0618` (Phase D Primary CSS fix, SHIPPED + pushed) |
| **HEAD (last docs commit)** | `9f55ebc` (Phase C close-out docs) — superseded by the official-closure docs commit that ships this update |
| **Pre-Phase-D-primary commit** | `0304ea0` (Phase A `?perf=1` instrumentation) |
| **Diagnostic phase** | Phase A SHIPPED ✅ · Phase B CLOSED ✅ (8/9 areas captured; #7 mobile-GPU reclassified to optional backlog) · Phase C CLOSED ✅ (findings + sequencing) · **Phase D PRIMARY SHIPPED ✅** · **Diagnostic OFFICIALLY CLOSED** |
| **Working tree** | clean except `_screenshots/` (gitignored) |
| **Mobile `labelIntrusionPct`** | **0** (was 13.73% pre-fix). Mobile overall verdict: red → yellow. |
| **Desktop `labelIntrusionPct`** | 0 (unchanged) |
| **Desktop `cardAreaPctOfFelt`** | 2.81% — **reclassified out of diagnostic scope** as Compact Table / Gameplay Density territory |
| **vitest frontend** | 225/225 PASS (verified post-Phase-D Primary) |
| **jest game-server** | 475/475 PASS (verified post-Phase-D Primary) |
| **jest api-server** | 27/27 PASS (verified post-Phase-D Primary) |
| **Playwright E2E** | 40/40 PASS (last run pre-Phase-A; no regression expected — no game code changed in Phase D) |
| **Bootstrap smoke (programmatic)** | PASS 3/3 (Phase A) |
| **Perceptual smoke (visual diff)** | PASS — 0 px drift between default and ?perf=1 |
| **Dev-stack** | all 4 services responsive at close (postgres :5432, api :3000, game :2567, frontend :5173) |

---

## THE BOTTOM LINE (read first if short on time)

Phase A instrumentation works. Phase B partial captures + the operator's pre-triage user feedback together produce a STRONG signal that the immediate next sprint should target **legibility geometry on mobile + table composition** (P1 + P5), NOT performance (P2). Three independent lines of evidence:

1. **User perceptual feedback (2026-05-18, pre-diagnostic)**: cards too small, hand illegible, mobile layout disjointed; hypothesis "geometry / scale / spacing root issue, NOT assets, NOT backend."
2. **Visual baseline pair review (B1)**: at 1440×900 desktop, community + hole cards render ~50px wide inside a ~1000px-wide felt — cards are ~5% of felt width. At 393×851 mobile (Pixel 5 emulation), the "COMUNITARIAS" label visibly OVERLAPS the community cards, and chrome consumes >50% of vertical viewport, squeezing the felt.
3. **Instrumented #9 readability triage (B10)**: rank glyph absolute height PASSES the spec threshold (23px desktop / 64px mobile vs threshold ≥18/≥14), but inter-card separation YELLOWs on desktop community (6px vs threshold ≥8px), and hole-card overlap is 23.1% in both viewports (intentional per `HOLE_SPREAD=20 < CARD_W=52` in TableScene). **The instrumented verdict produced "RED" but driven by a measurement methodology bug in contrast sampling — NOT a real contrast issue.** See "Methodology issues" below.

**Net sequencing implication:** even WITHOUT the perf areas (#1, #2, #3, #5, #6, #7) being triaged, the readability + geometry + mobile-emulation evidence already justifies a P1 (legibility) + P5 (mobile ergonomics) sprint as the next polish work. The perf areas pending tomorrow either confirm this (all pass/yellow → P1+P5 unblocked) or escalate to P2 (if any red).

**This is the resume-point reasoning. Tomorrow's triage of B2-B9 either reinforces or perturbs this conclusion.**

---

## WHAT'S DONE TODAY

### Documents committed (origin/main)

1. `3f1fb9a` — `docs(diag): add runtime diagnostic + sequencing rules design spec` (282 lines)
2. `ad39c88` — `docs(diag): add runtime diagnostic implementation plan` (1521 lines)
3. `0304ea0` — `feat(diag): add ?perf=1 instrumentation for runtime diagnostic` (9 files, +249/-1 LoC)
4. most recent `docs(handoff): ...` commit — `docs(handoff): runtime diagnostic session-of-2026-05-18 handoff` (this doc — pinned by topic, not SHA, because the SHA changes if the doc is amended)

### Phase A — Instrumentation SHIPPED

- New file: `frontend/src/security/perf-mode.ts` — pure helper, presence-only contract, does NOT auto-enable in Vite DEV (Heisenberg discipline).
- New file: `frontend/src/security/perf-mode.test.ts` — 6-case truth table (vitest), mirrors `debug-mode.test.ts` shape.
- New file: `frontend/src/perf/perf-counters.ts` — ticker / rerender / state-change / WS-in / WS-out counters + 1 Hz `console.debug("[perf]", ...)` reporter.
- Modified: `frontend/src/security/index.ts` — 1-line re-export.
- Modified: `frontend/src/main.ts` — `isPerfEnabled` import + `body.perf-mode` bootstrap (parallel to A2.0 `body.debug-mode`) + Pixi ticker hook inside `initPixiLayer`.
- Modified: `frontend/src/game/game-ui.ts` — 4 × `if (isPerfEnabled()) perfRerenderInc("name")` at `renderSeats`, `renderPlayers`, `renderState`, `updateActionButtons`.
- Modified: `frontend/src/connection.ts` — `attachPerfWsCounters(room)` function (wildcard `onMessage("*")` for incoming + `room.send` monkey-patch for outgoing).
- Modified: `frontend/src/app/room-event-bindings.ts` — gated counter in `onStateChange`.
- Modified: `frontend/src/app/room-session-controller.ts` — `attachPerfWsCounters(joinedRoom)` mounted inside `mountJoinedRoom` (covers initial-join + reconnect both paths).

**Design deviations from plan** (intentional, documented in commit message):
- Dropped plan's per-call-site outgoing counter at `startClientHeartbeat` (would have double-counted heartbeats; monkey-patch covers all).
- Mounted `attachPerfWsCounters` inside `mountJoinedRoom` instead of after each `joinOrCreate` (centralizes join + reconnect).
- Skipped optional `.perf-only` panel UI per user constraint "no permanent dev-overlay". Console.debug logs are sufficient for the diagnostic.

### Phase B — Diagnostic captures STARTED

**B0 scaffolding (done)**: 10 files under `.dev-stack/diag/` (gitignored):
- `01-frame-pacing/verdict.md` through `09-readability/verdict.md` — pre-scaffolded templates with verbatim spec thresholds + priority-user-feedback section on areas #4, #7, #9.
- `matrix.json` — valid JSON, 9 area entries, per-area metric schema, `severeCoreGameplayUnreadable: null` only on #9, `priorityFeedbackAddressed: null` only on #4/#7/#9, per-env verdicts on multi-env areas.

**B1 mano-completa baseline pair (done)**: 2 PNG screenshots at `.dev-stack/diag/baseline/`:
- `mano-completa-desktop.png` (1440×913, 596KB) — Context A perspective, 3 seats, 2 community + 2 hole, "ES TU TURNO", phase "CALLE 3/6 · 2ª COMUNITARIA".
- `mano-completa-mobile.png` (1081×2340 actual = 393×851 @ DPR 2.75, 1003KB) — Context C perspective, mobile compact layout, same logical frame.

Script: `.dev-stack/b1-baseline-capture.ts` (throwaway under gitignored path; re-runnable).

**B10 (#9 readability) PARTIAL (data + measurements + verdict produced, methodology gaps identified)**:
- Captures: full screenshots desktop + mobile, isolated Pixi canvas regions, card-region crops, zoomed cards, deal-animation mid-frames (8 PNGs).
- `measurements.json` and `verdicts.json` with full metric battery applied.
- **Instrumented verdict: RED on both desktop and mobile, `severeCoreGameplayUnreadable: false`.**
- Verdict driven primarily by contrast measurement (1.39:1 / 1.38:1 — well below 3:1 red threshold).

---

## CRITICAL FINDINGS

### Finding 1 — Visual baseline review STRONGLY confirms user pre-diagnostic feedback

Visual inspection of `mano-completa-desktop.png` and `mano-completa-mobile.png`:

- **Cards too small (relative scale)**: cards render ~50–55 px wide on a felt of ~1000 px (desktop) or ~370 px (mobile). Cards are roughly 5% of felt width on desktop and 15% on mobile. Either way, they don't visually anchor the table.
- **Hand illegible**: hole cards on the felt (Pixi rendering) at ~50×75 px contain rank glyphs ~20 px tall — readable in isolation but visually small at any normal viewing distance because the chrome and players' panels around the felt dominate visual attention.
- **Mobile geometry disjointed**: on Pixel 5 viewport, the "COMUNITARIAS" label visibly OVERLAPS the community-card row to the right. Chrome (BOTE label, CALLE chip, TURNO chip, RELOJ chip, "JUGADORES EN LA MESA" list) consumes >50% of vertical viewport, squeezing the actual felt+cards into the upper portion. The "TUS CARTAS" zone label is present but the cards underneath weren't visible in Context C's perspective at capture time (possibly because Context C's Pixi hole-card render at mobile DPR has its own layout issues — needs investigation).

### Finding 2 — Instrumented #9 verdict produced RED but with three methodology issues

The B10 subagent ran a full Playwright capture + measurement against vite-preview (prod build local). The verdicts.json reports RED overall, driven by contrast. But three caveats matter for tomorrow:

**Issue A — Contrast sampling broken (FIX before re-running #9 with confidence).**
Measurements show `cardFaceColor {r:20, g:49, b:42}` IDENTICAL to `feltColor {r:20, g:49, b:42}`. That means the sampler pixel for "card face" hit the FELT, not the card-face background. Community cards in Chiribito are Pixi sprites loaded from `.webp` textures (high-quality canon assets — Fournier-style) that may have transparent edges or non-uniform backgrounds. The sampler's pixel choice was wrong. The reported contrast ratios (1.39:1 / 1.38:1) are artifacts of sampling felt-vs-felt, not real contrast. Real visual contrast of the cards is high (cream/white card stock on dark green felt).

**Fix path**: re-locate the sampler to a known card-stock pixel (e.g. center of a known-revealed card, sampling 5×5 patch and taking median). Or use DOM-based card popovers (`frontend/src/app/card-popover.ts`) which are DOM and can be measured via `getComputedStyle` reliably.

**Issue B — Spec #9 absolute thresholds don't capture the felt user pain.**
The spec's #9 rubric measures **absolute** rank glyph pixel height (≥18 px desktop = PASS). The measurement returned 23 px desktop = PASS. But the user's reported pain ("cartas demasiado pequeñas") is about **relative** scale — cards being small *relative to* the available canvas/felt area, not their absolute font size. Two cards at 23 px rank in a 1000-px-wide felt look "small in context" even though the rank is mechanically readable up close.

**Implication**: the spec rubric has a calibration gap. Either tomorrow's re-run of #9 adds a new metric (e.g. `cardAreaPctOfFelt` or `cardWidthVsViewportPct`), or we accept that the spec's rank-px threshold under-flags the actual problem and rely on the visual baseline review as the perceptual ground-truth signal.

This is exactly the spec's "Risks #2 — Threshold calibration upfront" warning manifesting in practice. Per spec process: document a recalibration in the master findings doc, do not silently adjust.

**Issue C — Thumb-occlusion methodology applied incorrectly to desktop.**
The subagent's measurement defined "thumb zone" as the bottom 1/3 of the viewport unconditionally — and reported `thumbOccludesPrimary: true` for DESKTOP (which is nonsensical; thumb-grip is a mobile-only concern). The verdict's thumbColor was marked PASS despite this. The mobile thumb measurement (`thumbOccludesPrimary: false` — holes not in mobile thumb zone) is plausible because the mobile capture from Context C's perspective at that moment didn't render hole cards in the lower zone.

**Fix path**: scope thumb-occlusion to mobile-only; on desktop, return n/a.

### Finding 3 — Pixi vs DOM card rendering boundary (architectural context for ALL future visual triage)

Confirmed during B1 + B10 subagent runs: **community cards + hole cards on the felt are rendered into the Pixi WebGL canvas** (TableScene.ts), NOT DOM. They cannot be measured via `getBoundingClientRect` on any `.card` selector. Pixel-level measurements from screenshots, or `canvas.getContext('webgl').readPixels`, are the only paths.

DOM-rendered card surfaces exist:
- The card-popover (`frontend/src/app/card-popover.ts`) — appears on tap/hover.
- The hand-row card display (if `renderCardRow` in `ui-cards.ts` is wired anywhere visible) — needs grep confirmation.

**Implication for any later visual fix slice (P1 legibility)**: scaling cards UP requires changing Pixi constants in `frontend/src/game/table/TableScene.ts` (`CARD_W=52, CARD_H=78, BOARD_SPREAD=58, HOLE_SPREAD=20`) AND likely the `visual-layout.ts` seat positioning logic. Both are in the existing HANDOFF_A2.0 "no-touch list" — would need explicit "go" before any modification.

### Finding 4 — Harness adaptation gap on #7 mobile GPU

No physical Android available today. The plan called for Android USB via `chrome://inspect` for area #7 (mobile GPU + thermal). The adapted harness uses Chrome Pixel 5 emulation + CPU 4× throttle. **This will produce a partial verdict at best** — Chrome emulation cannot reproduce real GPU thermal throttling, real touch latency, or mid-tier-Android frame-pacing realities.

Plan: when #7 is triaged tomorrow (via emulation), the verdict must be flagged `RETEST_REQUIRED on real Android pre-P5 polish`. The master findings doc + matrix.json need this flag explicit.

---

## SUBAGENTS RUN TODAY (5 dispatches)

| # | Dispatch | Duration | Tool uses | Outcome |
|---|----------|----------|-----------|---------|
| 1 | Phase A Task A1 (TDD `isPerfEnabled` + 6 tests) | 34s | 5 | DONE — files created, tests written + verified failing then passing |
| 2 | Programmatic bootstrap smoke (Playwright headless, body class + console gating) | 137s | 19 | PASS 3/3 — gating discipline verified, payload shape correct, DEV doesn't auto-enable |
| 3 | Perceptual visual smoke (pixel-diff default vs ?perf=1 capture) | 251s | 18 | PASS — 0 pixel diff (with animations frozen) of 1,296,000; correctly diagnosed pre-existing `.auth-hero__mascot` CSS keyframe as the source of the initial noise |
| 4 | Phase B0 scaffolding (10 verdict.md templates + matrix.json) | 360s | 20 | PASS — all 10 files valid, thresholds verbatim from spec, priority-feedback embedded only in #4/#7/#9, thoughtful resolutions for matrix.json shape ambiguities |
| 5 | Phase B1 baseline-pair capture (3-context multi-player guest auto-register + mid-mano screenshots) | 565s | 68 | PASS — both desktop + mobile baselines captured at mid-mano state (2 community + 2 hole + 3 seats + "ES TU TURNO"); discovered Pixi-canvas vs DOM card-rendering boundary |
| 6 | Phase B10 #9 readability (interrupted mid-run by user but produced full output) | INTERRUPTED | ~50+ | PARTIAL — capture + measurement + verdict-with-methodology-issues; data preserved at `.dev-stack/diag/09-readability/` (see "Critical Findings" above) |

**Total subagent tool uses today**: ~180. Two reviewer subagents (spec + code quality) were skipped intentionally per project memory `feedback_pms_geo_subagent_execution.md` ("skip reviewer subagent para tasks triviales") — Phase A tasks were borderline-trivial or fully verified by my direct testing.

---

## ARTIFACTS INVENTORY

### In repo (tracked)

```
docs/superpowers/specs/2026-05-18-chiribito-runtime-diagnostic-design.md      (commit 3f1fb9a)
docs/superpowers/plans/2026-05-18-chiribito-runtime-diagnostic.md             (commit ad39c88)
docs/HANDOFF_RUNTIME_DIAG.md                                                   (this commit)
frontend/src/security/perf-mode.ts                                             (commit 0304ea0)
frontend/src/security/perf-mode.test.ts                                        (commit 0304ea0)
frontend/src/perf/perf-counters.ts                                             (commit 0304ea0)
frontend/src/security/index.ts                                                 (modified in 0304ea0)
frontend/src/main.ts                                                           (modified in 0304ea0)
frontend/src/game/game-ui.ts                                                   (modified in 0304ea0)
frontend/src/connection.ts                                                     (modified in 0304ea0)
frontend/src/app/room-event-bindings.ts                                        (modified in 0304ea0)
frontend/src/app/room-session-controller.ts                                    (modified in 0304ea0)
```

### Local-only artifacts (gitignored, FRAGILE — lost if disk wiped)

```
.dev-stack/diag/baseline/mano-completa-desktop.png         (596 KB, 1440×913)
.dev-stack/diag/baseline/mano-completa-mobile.png          (1003 KB, 1081×2340 = Pixel 5 native)
.dev-stack/diag/baseline-default.png                       (perceptual smoke baseline, default mode)
.dev-stack/diag/baseline-default-2.png                     (control, byte-identical to baseline-default)
.dev-stack/diag/baseline-perf.png                          (perceptual smoke baseline, ?perf=1)
.dev-stack/diag/matrix.json                                (9-area schema, all verdicts null EXCEPT what B10 wrote)
.dev-stack/diag/01-frame-pacing/verdict.md                 (template scaffolded, no capture yet)
.dev-stack/diag/02-pixi-loop/verdict.md                    (template scaffolded, no capture yet)
.dev-stack/diag/03-texture/verdict.md                      (template scaffolded, no capture yet)
.dev-stack/diag/04-resize/verdict.md                       (template + priority-feedback, no capture yet)
.dev-stack/diag/05-ws/verdict.md                           (template scaffolded, no capture yet)
.dev-stack/diag/06-rerenders/verdict.md                    (template scaffolded, no capture yet)
.dev-stack/diag/07-mobile-gpu/verdict.md                   (template + priority-feedback, no capture yet — RETEST_REQUIRED flag pending)
.dev-stack/diag/08-zindex/verdict.md                       (template scaffolded, no capture yet)
.dev-stack/diag/09-readability/verdict.md                  (template; needs FILL with measurements after methodology fix)
.dev-stack/diag/09-readability/desktop-full.png            (580 KB)
.dev-stack/diag/09-readability/mobile-full.png             (1019 KB)
.dev-stack/diag/09-readability/desktop-pixi-canvas.png     (351 KB — isolated Pixi region)
.dev-stack/diag/09-readability/mobile-pixi-canvas.png      (718 KB — isolated Pixi region)
.dev-stack/diag/09-readability/desktop-card-region.png     (5 KB — close crop)
.dev-stack/diag/09-readability/mobile-card-region.png      (26 KB — close crop)
.dev-stack/diag/09-readability/desktop-card-zoomed.png     (344 KB)
.dev-stack/diag/09-readability/mobile-card-zoomed.png      (541 KB)
.dev-stack/diag/09-readability/desktop-center-crop.png     (150 KB)
.dev-stack/diag/09-readability/mobile-bottom-half.png      (225 KB)
.dev-stack/diag/09-readability/deal-animation-desktop-mid.png    (572 KB)
.dev-stack/diag/09-readability/deal-animation-mobile-mid.png     (961 KB)
.dev-stack/diag/09-readability/measurements.json           (3.7 KB — full metric battery)
.dev-stack/diag/09-readability/verdicts.json               (544 B — per-dim + overall verdicts)
.dev-stack/diag/09-readability/b10-run.log                 (2.2 KB — subagent run log)
.dev-stack/diag/09-readability/dev-stack.log               (109 KB — dev-stack output during capture)
.dev-stack/diag/09-readability/vite-preview.log            (77 B)
.dev-stack/b1-baseline-capture.ts                          (throwaway script, re-runnable)
.dev-stack/b10-readability-capture.ts                      (throwaway script, re-runnable)
.dev-stack/b10-diag-1.ts                                   (throwaway script, B10 helper)
.dev-stack/perf-bootstrap-smoke.ts                         (throwaway script, programmatic smoke)
.dev-stack/perf-visual-smoke.ts                            (throwaway script, perceptual smoke)
.dev-stack/perf-visual-bbox-probe.ts                       (throwaway script, mascot animation diagnostic)
.dev-stack/perf-visual-mascot-probe.ts                     (throwaway script, mascot animation diagnostic)
```

**FRAGILITY NOTE**: The .dev-stack/ artifacts are NOT in git. If the disk is wiped, every screenshot + measurement is lost. The scripts can be re-run to regenerate (they're deterministic against the current HEAD), but the captured measurements have time-of-capture variance. If preservation matters more than convention, a future cleanup pass could move the most important artifacts to a tracked `docs/superpowers/findings/raw/` subdir.

---

## DIAGNOSTIC LIFECYCLE — FINAL SUMMARY

### Completed within the diagnostic (all SHIPPED)

1. ✅ **Phase A instrumentation** — `?perf=1` mode, perf-counters, Heisenberg-disciplined. Commit `0304ea0`.
2. ✅ **Phase B captures** — 8 of 9 areas measured (B1 baseline pair, B10 v2 readability, B9 z-index, B4 resize, B-perf batch B2/B3/B5/B6, B11 matrix consolidation). #7 mobile-GPU was DEFERRED at the time (no real Android USB).
3. ✅ **Phase C findings + sequencing** — canonical doc at `docs/superpowers/findings/2026-05-19-chiribito-runtime-diagnostic-findings.md`. Bucket decision: P1 readability + P5 mobile ergonomics; no P2 perf trigger. Commit `9f55ebc`.
4. ✅ **Phase D PRIMARY** — single CSS rule added at `frontend/src/style.css:4327-4335` (pure additive, +9 LoC, 0 modified, 0 removed):
   ```css
   @media (max-width: 768px) and (orientation: portrait) {
     .table-zone--community .zone-title { display: none; }
   }
   ```
   Mobile `labelIntrusionPct` 13.73 → 0; mobile overall verdict red → yellow. Commit `45b0618`.

### Reclassified OUT of this diagnostic (no longer treated as bugs here)

- **Desktop `cardAreaPctOfFelt = 2.81%` (#9 desktop RED driver)** — moves to *Compact Table / Gameplay Density* sprint territory. Will be addressed as conscious gameplay-composition tuning, not as a runtime-diagnostic fix. The earlier Phase D Secondary framing (TableScene `CARD_W / CARD_H / BOARD_SPREAD` tuning behind explicit GO) is hereby retired — the new sprint will set its own scope, constraints, and no-touch list from scratch.
- **`criticalInfoOverlapPct = 1.64%` mobile YELLOW** (header overlapping canvas) — same: gameplay-composition territory, not a diagnostic regression.

### Optional backlog (NOT this diagnostic's responsibility; revisit only if a future sprint explicitly asks for it)

- **#7 mobile-GPU + thermal on real Android** — USB-gated, requires `chrome://inspect`.
- **#1 frame-pacing real-prod retest** — DevTools Performance trace at `play.chiribito.com` on real 60Hz hardware. Strong prior that prod is clean; remaining ambiguity is harness-vs-real, not user-impact.
- **Longer-window texture-memory** — 5-min × 3-5 manos slow-leak capture.
- **Phase E formal closure with retests** — only meaningful if the deferred items above are revisited. Otherwise the diagnostic stays closed at the Phase D Primary stamp above.

The `?perf=1` instrumentation **stays installed** behind its flag as a persistent regression harness. No removal planned.

---

## SESSION CLOSE DRIFT — RESOLVED

The Phase C drift (this handoff + the findings doc) was shipped as commit `9f55ebc`. The Phase D Primary code change was shipped as commit `45b0618`. The final closure docs update (this revision) ships next.

Working tree at official closure: clean except `_screenshots/` (gitignored).

Untracked artifacts (intentionally gitignored, preserved locally as the diagnostic record):
- `.dev-stack/diag/**` — measurements + verdict.md + matrix.json + PNGs (incl. post-Phase-D-primary 09-readability rerun)
- `.dev-stack/b*-*.ts` — capture scripts (b10-rerun-v2, b9-zindex-capture, b4-resize-capture, b-perf-batch)
- `.dev-stack/b10-phase-d-run.log` — Phase D Primary verification run log
- `_screenshots/` — Playwright run artifacts

---

## HARNESS ADAPTATION REMINDER

| Area | Original plan env | Today's adapted env | Signal quality |
|------|-------------------|---------------------|----------------|
| #1 frame pacing | Prod + Android | Vite preview + Playwright Pixel 5 emulation + CPU 4× throttle | Good |
| #2 Pixi loop | Local ?perf=1 | Same | Full |
| #3 texture memory | Prod build local | Same | Full |
| #4 resize | Prod + Android orientation flip | Prod + Playwright `setViewportSize` flip | Good |
| #5 WS cadence | Prod multi-player | Dev-stack + 2 guest tabs (auto-register flow `a910980`) | Good |
| #6 DOM rerenders | Local ?perf=1 | Same | Full |
| **#7 mobile GPU + thermal** | Android USB | Pixel 5 emulation + CPU throttle | **PARTIAL — RETEST_REQUIRED on real Android pre-P5** |
| #8 z-index | Prod build + Android | Prod build + Pixel 5 emulation | Good |
| #9 readability | Prod build + Android | Prod build (vite preview 5174) + Pixel 5 emulation | Full (geometry/font/contrast emulation-lossless) |

---

## RESUME PROTOCOL — RETIRED

This diagnostic is officially closed. There is no resume of the runtime-diag sprint.

When the user opens the next Chiribito session ("Hola Chiribito" / equivalent), do NOT re-enter the runtime-diag flow. Read `project_chiribito.md` and `project_chiribito_runtime_diag.md` for state-of-the-world, but treat any new work as a fresh sprint with its own scope, plan, and no-touch list.

Per the user's direction at close (2026-05-19), the next planned bucket is **Compact Table / Gameplay Density** — but do NOT auto-start it. Wait for the user to open it explicitly with its own framing and restrictions.

---

## NO-TOUCH CARRY-FORWARDS (inherited + new)

From `HANDOFF_A2.0.md` (still apply):
- `frontend/src/connection.ts` (except where Phase A touched — `attachPerfWsCounters` is new but the rest is locked)
- `frontend/src/reconnect-director.ts` — Move 2 protocol critical
- `frontend/src/auth/recover-or-lobby.ts` — Move 1.5 recovery
- `frontend/src/game/table/TableScene.ts` constructor / destroy / measureLayout — Pixi continuity
- `frontend/src/game/phase-indicator.ts` + `phases.ts` — Fase 3 funciona, no rediseñar
- `src/rooms/**` (game server) — engine off-limits
- `api-server/src/**` — auth/migrations off-limits
- `frontend/public/cards/*.webp`, `frontend/public/brand/*` — branding canon
- Castizo vocabulary lock

**New no-touch from this session:**
- `frontend/src/security/perf-mode.ts` core contract — pure function, NOT to be modified during measurement runs (would invalidate Heisenberg discipline)
- `frontend/src/perf/perf-counters.ts` schema — counter shape must stay stable to keep matrix.json comparable across re-runs
- The B1 baseline pair PNGs at `.dev-stack/diag/baseline/` — DO NOT regenerate without explicit reason; they are the side-by-side reference for post-polish comparison
- The 1-amend budget for `0304ea0` instrumentation commit is NOT YET USED — preserve it for legitimate deep-dive instrumentation needs in Phase D

---

## ROADMAP CONTEXT (where this fits)

```
✅ Move 1 (auth recovery) — A1-old
✅ Move 1.5 (post-login + reload recovery)
✅ Move 2 (mid-game WS reconnect)
✅ Slice A1 (chrome cleanup, A1-new)
✅ Slice A2.0 (sidebar dev-strings hide + castizo)
✅ Phase G + P (production deploy + guest auto-register, play.chiribito.com live)
✅ Runtime diag spec + plan + Phase A instrumentation
✅ Runtime diag Phase B captures (8/9; #7 reclassified to optional backlog)
✅ Runtime diag Phase C findings + sequencing (P1+P5 bucket)
✅ Runtime diag Phase D Primary (mobile portrait label intrusion 13.73% → 0%)
🔒 Runtime diagnostic OFFICIALLY CLOSED (2026-05-19)
⏳ Compact Table / Gameplay Density sprint — NEXT (user-locked direction; opens with its own fresh framing, not auto-started)
⏳ Optional backlog: #7 real-Android, #1 real-prod retest, long-window texture-memory, formal Phase E closure — only if a future sprint asks for it
⏳ Phase W (landing fork from polito101/WEB-CHIRIBITO Next.js)
⏳ Phase A apex cutover (chiribito.com)
```

---

## REFERENCES

### In-repo
- `docs/superpowers/specs/2026-05-18-chiribito-runtime-diagnostic-design.md` — spec (282 lines)
- `docs/superpowers/plans/2026-05-18-chiribito-runtime-diagnostic.md` — plan (1521 lines)
- `docs/superpowers/specs/2026-05-18-chiribito-visual-audit.md` — original static screenshot audit (Slices A–G roadmap baseline)
- `docs/superpowers/specs/2026-05-18-chiribito-slice-A2.0-sidebar-debug-design.md` — `isDebugEnabled` / `body.debug-mode` pattern that `?perf=1` mirrors
- `docs/HANDOFF_A2.0.md` — predecessor handoff, no-touch list, slice roadmap
- `docs/HANDOFF_A1.md` — earlier handoff
- `docs/RECONNECT_FINDINGS.md` — Move 1 / 1.5 / 2 reconnect saga

### Memory persistente (`~/.claude/projects/C--Users-Usuario/memory/`)
- `MEMORY.md` — index (will be updated this session)
- `project_chiribito.md` — Chiribito project resume point
- `project_chiribito_production_deploy.md` — deploy state (play.chiribito.com live)
- `project_chiribito_dev_stack.md` — `npm run dev:stack` how-to
- `feedback_chiribito_north_star.md` — 6 visual principles
- `feedback_chiribito_disciplined_format.md` — 6-point format
- `feedback_chiribito_browser_e2e_lesson.md` — tests-green-≠-UX-works
- `feedback_chiribito_e2e_multiplayer.md` — multi-player required
- `feedback_chiribito_pixi_continuity.md` — hide-don't-remove
- `feedback_chiribito_castizo_vocabulary.md` — vocabulary lock
- `feedback_chiribito_a1_root_causes.md` — root causes + "menos dashboard, más mesa" criterion
