# Chiribito Runtime Diagnostic — Master Findings (Phase C close-out)

> Generated 2026-05-19. Triage scope: 9 areas per spec.
> Capture sessions: 2026-05-18 (Phase A instrumentation + B0/B1) + 2026-05-19 (Phase B remainder + C close-out).
> Predecessor docs: [docs/HANDOFF_A2.0.md](../../HANDOFF_A2.0.md), [docs/HANDOFF_RUNTIME_DIAG.md](../../HANDOFF_RUNTIME_DIAG.md).
> Spec: [docs/superpowers/specs/2026-05-18-chiribito-runtime-diagnostic-design.md](../specs/2026-05-18-chiribito-runtime-diagnostic-design.md).
> Plan: [docs/superpowers/plans/2026-05-18-chiribito-runtime-diagnostic.md](../plans/2026-05-18-chiribito-runtime-diagnostic.md).
> Source matrix: `.dev-stack/diag/matrix.json` (gitignored — runtime artifacts).

---

## TL;DR

- **Root cause: STATIC PORTRAIT-LAYOUT geometry/composition.** Not runtime, not stacking, not resize-triggered, not performance.
- **Sequencing decision: P1 (readability) + P5 (mobile ergonomics) bucket** as the next sprint.
- **No P2 perf bucket triggered.** 4 of 5 perf areas PASS clean. #1 frame-pacing spec-rubric RED is a harness-fidelity artifact (headless Chromium caps ~50 Hz, NOT real 60 Hz production); corroborating signals (0 long tasks, 0 heap growth, 0 idle rerenders, 0 idle WS spam, tickerHz stable under load) confirm no real CPU/GPU pressure.
- **#7 mobile-GPU DEFERRED** to a real-Android session (no USB available). Does not block P1+P5 — only its eventual close-out gate before Phase E.
- **Phase D fix scope ISOLATED** to ~1-2 CSS rules around `.zone-title--community` in portrait orientation, optional secondary work on TableScene card-scale constants for desktop. No engine, no managers, no schemas, no z-index, no resize logic, no Pixi internals.

---

## Priority user feedback (verbatim, pre-diagnostic 2026-05-18)

1. **Mesa cards too small** — geometry/layout/scale, not asset resolution.
2. **Player hand illegible** — breaks basic gameplay clarity.
3. **Mobile layout feels disjointed** — responsive spacing/layout is off; same perceptual issue as desktop, amplified.

**User-stated hypothesis (confirmed by this triage):** structural geometry — proportions, scaling, responsive geometry, ergonomics, table composition. NOT assets, NOT backend.

---

## Sequencing rule applied

Per spec line 222 severity escalation: if rank illegible at viewport without user-zoom on either env → severe → overrides "any #1-#7 RED → P2" baseline.

**This run:** `severeCoreGameplayUnreadable = false` (rank glyphs PASS at 23 px desktop / 64 px mobile; no viewport has cardArea+labelIntrusion both RED simultaneously).

Standard sequencing applies: examine #1-#7 RED for P2 trigger.
- **#1 RED is harness-fidelity artifact**, not real pressure → no P2 trigger.
- **#9 RED is geometric** (P1 trigger) + #4 PASS + #8 PASS confirms the geometric finding is isolated.

**Net P-bucket: P1 (readability) + P5 (mobile ergonomics).**

---

## Per-area verdicts consolidated

| # | Area | Verdict | Driver | Phase D relevance |
|---|------|---------|--------|-------------------|
| 1 | frame-pacing | **RED (spec) → INDETERMINATE (adjusted)** | headless ~50Hz cap inflates slow-frames % | RETEST_REQUIRED on real prod build with vsync 60Hz; no Phase D action |
| 2 | pixi-render-loop | PASS | `wastefulRedrawsIdle = 0` | none |
| 3 | texture-memory | PASS | 4 textures total (~1 MB GPU), heapDelta 0 MB/min | none |
| 4 | resize-thrashing | PASS | CLS 0.0005 desktop / 0.0000 mobile, jitter 0 px, 0 canvas recreates, 0 stale bounds, Pixi resize <50ms | none — confirms intrusion is STATIC, not resize-triggered |
| 5 | ws-cadence | PASS | idle 0.2 msg/s (heartbeat-only); Colyseus uses binary state-sync, not custom broadcasts | none |
| 6 | dom-rerenders | PASS | idle 0/win, active 1.29/win, 0 orphan rerenders | none |
| **7** | **mobile-gpu** | **DEFERRED** | no real Android USB; emulation would produce only PARTIAL verdict per spec harness-adaptation note | RETEST_REQUIRED pre-P5 polish (gating Phase E close-out) |
| 8 | zindex-layering | PASS | DOM analysis: `.zone-title--community` is BELOW canvas in stacking order (no z-index, no stacking-ctx, source order); pixel-class "text dominant" mobile is explained by Pixi `backgroundAlpha: 0` (transparent canvas reveals DOM label beneath where no card is drawn) | none — confirms intrusion is GEOMETRIC, not z-order |
| 9 | readability | **RED** (desktop + mobile) | desktop driven by `cardAreaPctOfFelt = 2.81%`; mobile driven by `labelIntrusionPct = 13.73%` portrait | **PRIMARY Phase D target** |

---

## Cross-area linking (final, post-Phase-C)

```
                        #9 readability RED (geometric)
                                  │
                ┌─────────────────┼─────────────────┐
                ▼                 ▼                 ▼
        cardAreaPctOfFelt   labelIntrusionPct   contrastValidity
        desktop 2.81%       mobile 13.73%       (sampler n/a desktop)
        (cards small        (label intrudes     (sampler limitation,
         vs felt)            on community row)   not a real issue)
                │                 │
                │                 ▼
                │           #8 zindex PASS  ←─ confirms NOT z-order
                │                 │
                │                 ▼
                │           #4 resize PASS  ←─ confirms NOT transient
                │                 │
                └─────────────────┴────────┐
                                            ▼
                                    Phase D scope
                                    (static portrait CSS)
```

Perf cluster (orthogonal, no root cause for #9):
```
#2 pixi loop PASS   ──┐
#3 texture PASS     ──┤
#5 ws PASS          ──┼── no upstream perf pressure could explain real #1 RED
#6 rerenders PASS   ──┘
                       └─ #1 frame-pacing INDETERMINATE (harness artifact)
```

---

## Confirmed vs non-confirmed hypotheses

### Confirmed
1. **User's pre-diagnostic hypothesis** ("geometry/scale/spacing root, not assets/backend") — **CONFIRMED** by B10 v2 + B9 + B4 triangulation.
2. **Mobile label intrusion is real** — confirmed quantified at `labelIntrusionPct = 13.73%` in portrait, 0% in landscape.
3. **Intrusion is purely geometric** — not z-order (B9), not resize-triggered (B4).
4. **Cards too small (relative scale)** — confirmed by `cardAreaPctOfFelt = 2.81%` desktop (RED) / 9.46% mobile portrait (YELLOW).
5. **Render pipeline is event-driven, not wasteful** — confirmed by B2/B6 (0 orphan rerenders idle).
6. **No memory pressure** — confirmed by B6 texture-memory (heap delta 0 MB/min, 4 textures total).
7. **No resize/reflow instability** — confirmed by B4 (CLS ~0, 0 canvas recreates, 0 jitter).

### Non-confirmed (deferred / harness-limited)
1. **Real-prod frame-pacing** — harness cannot honestly measure spec's 16.7ms threshold (headless ~50Hz). Corroborating evidence suggests no real pressure; needs prod retest to definitively close.
2. **Real Android mobile-GPU + thermal** — DEFERRED (#7 deferred per session direction). Pixel 5 emulation insufficient.
3. **Slow-leak signature** — 60s capture window catches rate-of-growth but not multi-mano leaks. Recommend 5-min × 3-5 manos capture as part of Phase D pre-merge validation.

---

## Exact next-step recommendation (Phase D)

**Target:** eliminate `labelIntrusionPct > 0` in portrait while keeping landscape + desktop at 0%, and (optionally) reduce desktop `cardAreaPctOfFelt < 3%` RED to ≥3% YELLOW or ≥5% PASS.

**Proposed scope (decision-pending, NO implementation this session):**

### Primary fix (mobile portrait label intrusion)
- **Where:** `frontend/src/style.css` or equivalent CSS module for `.zone-title--community` (and possibly `.table-zone--community` container)
- **What:** add a portrait-mobile media query that either:
  - (a) hides the `.zone-title--community` text on narrow viewports (least disruptive — felt is unambiguous when active)
  - (b) repositions it OUTSIDE the canvas footprint (above or below the `.table-surface` block)
  - (c) shrinks canvas height to leave room for the label
- **Estimated effort:** ~1-2 CSS rules, ~15 min including b10-rerun-v2 regression verification
- **Verification:** re-run `.dev-stack/b10-rerun-v2.ts` and confirm `labelIntrusionPctMobile == 0%`

### Secondary fix (desktop card scale)
- **Where:** `frontend/src/game/table/TableScene.ts` constants (`CARD_W`, `CARD_H`, `BOARD_SPREAD`) OR `visual-layout.ts` seat positioning
- **What:** tune card-size constants up by ~30-50% on desktop to reach `cardAreaPctOfFelt ≥ 3%` (YELLOW) or ≥ 5% (PASS)
- **Estimated effort:** small but requires playtest — Pixi-side change touches the no-touch list
- **Verification:** re-run b10-rerun-v2; pre-polish baseline `.dev-stack/diag/baseline/mano-completa-desktop.png` is the side-by-side reference
- **Status:** **DEFERRED — requires explicit user "go"** per HANDOFF_A2.0 no-touch list discipline

### Optional tertiary (defer)
- Real-Android #7 mobile-GPU + thermal close-out (next time Android USB is available)
- Real-prod #1 frame-pacing capture (when convenient — does not block Phase D)

---

## No-touch areas (carry-forwards, EXPLICIT)

Inherited from HANDOFF_A1, HANDOFF_A2.0, HANDOFF_RUNTIME_DIAG — all still active:

- `frontend/src/connection.ts` (Phase A `attachPerfWsCounters` is new but rest is locked — Move 2 reconnect protocol critical)
- `frontend/src/reconnect-director.ts` — Move 2 protocol
- `frontend/src/auth/recover-or-lobby.ts` — Move 1.5 recovery
- `frontend/src/game/table/TableScene.ts` constructor / destroy / measureLayout — Pixi continuity rule (hide-don't-remove)
- `frontend/src/game/table/TableScene.ts` constants `CARD_W=52`, `CARD_H=78`, `BOARD_SPREAD=58`, `HOLE_SPREAD=20` — **secondary Phase D may touch with explicit "go"**
- `frontend/src/game/phase-indicator.ts` + `phases.ts` — Fase 3 funciona, no rediseñar
- `src/rooms/**` (game server) — engine off-limits
- `api-server/src/**` — auth/migrations off-limits
- `frontend/public/cards/*.webp`, `frontend/public/brand/*` — branding canon
- Castizo vocabulary lock (see `feedback_chiribito_castizo_vocabulary.md`)
- `frontend/src/security/perf-mode.ts` core contract — Heisenberg discipline preserved
- `frontend/src/perf/perf-counters.ts` schema — counter shape stable for matrix.json comparability
- `.dev-stack/diag/baseline/*.png` — B1 reference pair, do NOT regenerate without explicit reason

---

## Phase E closure prep (NOT actioned this session)

- Tests baseline locked: **225 vitest + 475 jest game + 27 jest api** (verified 2026-05-19 post-batch)
- `?perf=1` retention decision: KEEP the helper + counters behind the flag as a persistent regression harness. NOT a permanent dev-overlay (per user direction during Phase A).
- This findings doc is the **Phase C close-out artifact**. Phase D execution + verification + Phase E final test baseline are NEXT-session.

---

## Risks / regression assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Phase D portrait CSS fix introduces desktop regression | low | tests are CSS-only, b10-rerun-v2 reruns desktop too, baseline PNG `__pre_polish_baseline` available for diff |
| Phase D secondary (TableScene constants) breaks Pixi continuity | medium-if-attempted | requires explicit "go" + b10-rerun-v2 + visual baseline diff; can revert |
| Real-prod retest of #1 frame-pacing surprises with genuine RED | low | corroborating signals across 4 other perf areas all PASS clean — strong prior for retest also passing |
| Real-Android #7 turns out RED unexpectedly | unknown | doesn't block P1+P5; would add P2 in parallel if so |
| Slow leak invisible at 60s window | low | heap delta 0 across captured window; recommend 5-min retest pre-merge |
| Multi-tab / Move 5 regression from a portrait-CSS-only fix | very low | no DOM structure change, only CSS scoping |

---

## Artifacts inventory (this diagnostic)

### Tracked in repo
- [docs/superpowers/specs/2026-05-18-chiribito-runtime-diagnostic-design.md](../specs/2026-05-18-chiribito-runtime-diagnostic-design.md) — spec (282 LoC)
- [docs/superpowers/plans/2026-05-18-chiribito-runtime-diagnostic.md](../plans/2026-05-18-chiribito-runtime-diagnostic.md) — plan (1521 LoC)
- docs/superpowers/findings/2026-05-19-chiribito-runtime-diagnostic-findings.md — THIS DOC
- [docs/HANDOFF_RUNTIME_DIAG.md](../../HANDOFF_RUNTIME_DIAG.md) — handoff (close-out updated this session)
- frontend Phase A files (commit `0304ea0`): `frontend/src/security/perf-mode.ts`, `frontend/src/security/perf-mode.test.ts`, `frontend/src/perf/perf-counters.ts`, modified `frontend/src/security/index.ts` + `frontend/src/main.ts` + `frontend/src/game/game-ui.ts` + `frontend/src/connection.ts` + `frontend/src/app/room-event-bindings.ts` + `frontend/src/app/room-session-controller.ts`

### Local-only (gitignored — `.dev-stack/`)

Capture scripts (re-runnable, deterministic against current HEAD):
- `.dev-stack/b10-readability-capture.ts` (v1 — superseded)
- `.dev-stack/b10-rerun-v2.ts` (v2 — current methodology)
- `.dev-stack/b9-zindex-capture.ts`
- `.dev-stack/b4-resize-capture.ts`
- `.dev-stack/b-perf-batch.ts`
- `.dev-stack/b1-baseline-capture.ts`, `b10-diag-1.ts`, `perf-bootstrap-smoke.ts`, `perf-visual-smoke.ts`, `perf-visual-bbox-probe.ts`, `perf-visual-mascot-probe.ts`

Diagnostic outputs (`.dev-stack/diag/`):
- `matrix.json` — schema v1, 9 areas, recalibrations[0] for #9 v2 methodology, Phase-C close-out block
- `baseline/mano-completa-{desktop,mobile}.png` — B1 baseline pair (PRESERVE)
- `01-frame-pacing/` measurements.json + verdict.md
- `02-pixi-loop/` measurements.json + verdict.md
- `03-texture/` measurements.json + verdict.md
- `04-resize/` measurements.json + verdicts.json + verdict.md + b4-run.log
- `05-ws/` measurements.json + verdict.md
- `06-rerenders/` measurements.json + verdict.md
- `08-zindex/` measurements.json + verdicts.json + verdict.md + 12 deal-frame PNGs + 2 static + 2 popover PNGs
- `09-readability/` measurements.json + verdicts.json + verdict.md + 11 PNG artifacts
- `b-perf-batch-run.log` — output-discipline log (perf batch)

### What's missing (deferred)
- `.dev-stack/diag/07-mobile-gpu/` measurements + verdict — DEFERRED to real-Android session
- Real-prod `01-frame-pacing/` retest — RETEST_REQUIRED, low urgency

---

## What was decided this session

- ✅ B10 methodology recalibration (v2 supersedes v1) — verdict honest, contrast n/a when invalid, new metrics `cardAreaPctOfFelt` + `labelIntrusionPct` + `criticalInfoOverlap` (severity-weighted) + canonical-camera freeze
- ✅ Mobile label intrusion is **PURELY GEOMETRIC, NOT z-order** (B9 dual triangulation)
- ✅ Geometry is **STABLE within orientation, not resize-triggered** (B4 zero jitter, 0 canvas recreates)
- ✅ **No runtime perf pressure** that would alter P-bucket sequencing (B-perf batch: 4/5 clean, #1 harness-fidelity artifact)
- ✅ **P1+P5 confirmed as Phase D primary bucket**
- ✅ Phase D scope locked to static portrait-CSS (primary) + optional desktop card-scale (secondary, requires "go")
- ✅ #7 mobile-GPU DEFERRED with retest-flag (does not gate Phase D, gates only Phase E close-out)

## What was NOT decided

- ❌ Whether to attempt the secondary Phase D fix (TableScene card-scale constants) — requires explicit "go" + playtest commitment
- ❌ Whether to run a longer-window texture-memory retest (5-min × 3-5 manos) — recommended but not scheduled
- ❌ When to schedule the real-Android #7 close-out — depends on user device availability
- ❌ Whether to commit the `_screenshots/` directory contents or leave them gitignored — status quo: gitignored

## Next session's first action

**Open Phase D with a 6-point disciplined spec** (per `feedback_chiribito_disciplined_format.md`):
1. **Objetivo**: eliminate `labelIntrusionPct > 0` in mobile portrait, regression-test desktop + landscape at 0%
2. **Restricciones**: CSS-only, no engine, no Pixi internals (unless secondary fix authorized)
3. **Non-goals**: any of the no-touch areas listed above; no animation changes; no responsive redesign
4. **Riesgos**: desktop CSS regression (mitigated by baseline diff); mobile landscape regression (mitigated by b10-rerun-v2 multi-orientation coverage)
5. **Plan**: design a portrait-only CSS scope, propose specific rule, b10-rerun-v2 verify
6. **Validación**: `labelIntrusionPctMobile == 0%` post-fix; `labelIntrusionPctDesktop == 0%` unchanged; tests 225/475/27 unchanged

Then execute → verify → commit → push.
