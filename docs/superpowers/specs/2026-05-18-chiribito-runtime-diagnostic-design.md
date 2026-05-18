# Chiribito — Runtime Diagnostic Design (gameplay feel + perf triage)

> Spec written 2026-05-18 against HEAD `a910980`.
> Status: design approved by user; awaiting written-spec review before transition to writing-plans skill.
> Predecessor specs: `2026-05-18-chiribito-visual-audit.md` (static screenshot audit), `2026-05-18-chiribito-slice-A1-chrome-cleanup-design.md`, `2026-05-18-chiribito-slice-A2.0-sidebar-debug-design.md`.

---

## Goal

Produce a decision-grade runtime diagnostic of mesa gameplay feel against `play.chiribito.com` (with a real Android device in the loop), identifying with evidence which of nine gameplay-polish areas need work and which do not. The output unblocks the next polish sprint by determining the **data-driven sequencing** of phases under the P1–P5 framework.

This spec covers the diagnostic and the sequencing rules only. It does **not** cover the content of any individual P1–P5 phase, Phase W (landing fork), or any redesign work. Those get their own specs after the diagnostic data lands.

---

## Real-world user feedback (priority initial signal)

Captured 2026-05-18 immediately before this spec was written; live game at `play.chiribito.com` exercised by the user on PC + Android. Recorded here verbatim (translated) and required to be reproduced verbatim at the top of the master findings doc so the diagnostic does not silently overlook the loudest user-perceived pain.

1. **Mesa cards too small** — assets themselves are high quality; the issue appears to be geometry / layout / scale, not asset resolution.
2. **Player hand illegible** — high perceptual priority; currently breaks basic gameplay clarity.
3. **Mobile layout feels disjointed** — responsive spacing/layout is off; same perceptual issue as desktop, amplified.

User's root-cause hypothesis: structural geometry — proportions, scaling, responsive geometry, ergonomics, table composition. **Not** assets, **not** backend.

Triage areas the user expects to surface as problematic (does not pre-decide the matrix; triage still runs end-to-end):

- `#9 readability mano/mesa` — likely **Red**.
- `#7 mobile GPU` and `#4 resize thrashing` — likely **Red/Yellow** for mobile ergonomics.
- `#8 z-index / layering` — possibly implicated.

---

## Scope (in)

Nine areas to triage:

1. Frame pacing + CPU script time + long-tasks + jitter
2. Pixi render loop
3. Texture memory pressure
4. Resize thrashing
5. WebSocket cadence / spam (burst-aware: deal/showdown vs idle)
6. DOM rerenders innecesarios (vanilla TS — counted from `game-ui.ts` + `main.ts`, not React)
7. Mobile GPU bottlenecks + thermal/throttling over consecutive manos
8. Z-index / layering of cards
9. Readability of player hand + community cards (font/size + separation + overlap + contrast vs felt + during-animation legibility + thumb-occlusion on mobile)

Hybrid quantitative / qualitative criteria per area (each row declares its type). Triage first, deep-dive only on Yellow/Red areas.

---

## Scope (out — deferred to subsequent specs)

- Detailed content of P1, P2, P3, P4, P5 phases (each gets its own spec after diagnostic data lands).
- Visual redesigns, mockups, new layouts.
- Phase W (landing fork from `polito101/WEB-CHIRIBITO`) and Phase A (apex `chiribito.com` cutover).
- Reshuffle of the existing A–G slice roadmap (it remains valid as static-audit baseline).
- Engine / managers / schemas / `api-server` / Render deploy.
- Branding assets (cards, mascots, logo, palette, font stack).
- Player-facing UI changes (the diagnostic adds only `?perf=1`-gated instrumentation, invisible by default).

---

## Constraints

- Zero player-facing UI change by default. Instrumentation is gated behind a `?perf=1` URL flag (parallel to A2.0's `?debug=1` pattern; reuses the `isDebugEnabled` shape).
- Test baselines preserved throughout: vitest 217/217 · jest game-server 475/475 · jest api-server 27/27 · Playwright E2E 40/40.
- North-star visual principles intact (tactility / mesa viva / clarity / rhythm / social-first / premium AAA — `feedback_chiribito_north_star.md`).
- Castizo vocabulary lock untouched (`feedback_chiribito_castizo_vocabulary.md`).
- Disciplined 6-point format (`feedback_chiribito_disciplined_format.md`) applies to any mid-diagnostic change.
- "Tests green ≠ UX works" (`feedback_chiribito_browser_e2e_lesson.md`): every qualitative finding requires an artifact (video clip, screenshot, or DevTools trace export).
- Multi-player mandatory (≥2 players) for any signal that depends on load (`feedback_chiribito_e2e_multiplayer.md`).
- **One code commit maximum** (the `?perf=1` instrumentation). One amend allowed (A2.0 precedent). Doc commits (findings docs) are separate and may be multiple.
- Mobile-first geometry remains a first-class concern: no desktop-only verdict is acceptable for areas in scope on mobile.

---

## Methodology overview

Hybrid environment + triage-first + deep-dive only on red.

Three execution phases:

1. **Pre-triage** — land the single `?perf=1` instrumentation commit. Verify test baselines green post-commit.
2. **Triage** — run the 9-area matrix end-to-end. Tag each area Pass / Yellow / Red with required evidence. Runs to completion even if early Red found.
3. **Deep-dive** — focused 1–2h session per Yellow/Red area, producing a mini-report with root-cause hypothesis, suggested fix scope, leverage estimate, and suggested P-bucket. Cross-area linking applied when root causes are transversal (e.g. rerenders → frame pacing → GPU).

---

## Environment matrix

Each signal lives in a specific environment. Mixing environments dilutes evidence — pick the right one per signal.

| Env | URL / target | Used for |
|-----|--------------|----------|
| Production live | `play.chiribito.com` | Frame pacing + CPU script time (real network), texture memory pressure, WebSocket cadence (multi-player real conditions) |
| Production build local | `npm run build && vite preview --port 5174` | Z-index / layering, readability — same minified bundle as prod, no real-network noise |
| Local dev with `?perf=1` | `npm run dev:stack` + URL `?perf=1` | Pixi render loop, DOM rerenders — require instrumentation and source-map visibility |
| Android USB | chrome://inspect → prod or vite preview | Mobile GPU bottlenecks, mobile resize/touch responsiveness, thermal/throttling observation |

---

## Harness — multi-player setup

1. **Tab A** — Chrome desktop normal window, account #1, seated in a new mesa.
2. **Tab B** — Chrome desktop incognito window (separate cookie context), account #2, joins the same mesa by code.
3. **Android** — chrome://inspect targeting the same URL/room, account #3 (optional 4–6 players if triage on WS or render surfaces red and stress-test is needed).
4. Tab A starts the mano; capture begins on the environment being audited.
5. Play one full mano (deal → 6 streets → showdown → next-mano start).
6. Artifacts written to `.dev-stack/diag/<area>/<env>-<timestamp>.{trace,json,png,mp4}` (gitignored).

The game-server audit log (`AnalyticsService`) must show ≥2 concurrent sessions during the capture window — this confirms multi-player actually happened.

---

## `?perf=1` instrumentation budget — one code commit

Pattern mirrors A2.0 (`isDebugEnabled` → `body.debug-mode` → `.debug-only` anchored selector).

**Bootstrap (single boot read):**

- New `isPerfEnabled()` pure function in `frontend/src/security/perf-mode.ts`. Reads `URLSearchParams.has('perf')` once at boot. SSR-safe guard (theatrical but matches A2.0 convention).
- `main.ts` sets `document.body.classList.add('perf-mode')` on boot if enabled.
- Vitest truth-table covering `?perf=1`, `?perf=0`, `?perf`, no flag, SSR (matches A2.0 `debug-mode.test.ts` shape).

**Instrumentation, all gated behind `if (isPerfEnabled())`:**

- Pixi ticker callback counter + wasteful-redraw detection (compare frame N+1's dirty regions vs frame N).
- `game-ui.ts` DOM rerender counter per component (which `updateX` function ran, how many times).
- `main.ts` state-mutation counter (how many state-changing functions ran per second).
- `connection.ts` WebSocket message counter + payload size logger + last-N message ring buffer.

**Output:**

- Logs to `console.debug` with prefix `[perf]`. Zero default-visible output.
- Optional minimal panel top-right showing live counters, anchored selector `.perf-only` (parallel to A2.0's `.debug-only`; not a generic utility class).
- During measurement captures the panel is OFF (Heisenberg mitigation — see Risks).

**Hot-swap discipline:**

- If a deep-dive needs additional instrumentation, **amend** the original commit (one amend allowed, A2.0 precedent).
- Beyond one amend, escalate to user with rationale.

---

## Triage matrix — 9 areas × criteria

Type column: **Q** = quantitative (DevTools/measurements give a number), **A** = qualitative + artifact required, **Q+A** = both.

| # | Area | Type | Source / metric | Pass | Yellow | Red | Env |
|---|------|------|-----------------|------|--------|-----|-----|
| 1 | Frame pacing + CPU script time + long tasks + jitter | Q | DevTools Performance trace over deal→showdown (≥60s). Captures: % frames >16.7ms, % frames >33.3ms, long tasks (>50ms blocking script), frame-time variance (jitter stddev). | <2% frames >16.7ms; 0 frames >33.3ms; 0 long tasks/min; jitter stddev <3ms | 2–10% >16.7ms; <1% >33.3ms; ≤2 long tasks/min; jitter 3–8ms | >10% >16.7ms OR ≥1% >33.3ms OR >2 long tasks/min OR jitter >8ms | Prod + Android |
| 2 | Pixi render loop | A | Ticker callback counter + wasteful-redraw narrative (was a redraw issued when no visible state changed?). | 0 wasteful redraws during 10s idle | Occasional wasteful redraws during state transitions | Continuous wasteful redraws during idle OR during animation | Local `?perf=1` |
| 3 | Texture memory pressure | Q | DevTools Memory heap snapshot + GPU Layers panel. 5-minute session including several manos. | <50MB GPU textures; JS heap stable across 5 min | 50–100MB GPU OR heap grows ≤20MB/min | >100MB GPU OR heap grows unbounded (leak signature) | Prod build local |
| 4 | Resize thrashing | Q | DevTools Performance trace during a resize sequence (desktop window drag + Android orientation flip). | CLS-like layout shift <0.05; Pixi canvas does NOT recreate on resize | CLS 0.05–0.15 | CLS >0.15 OR Pixi canvas recreates on every resize | Prod + Android |
| 5 | WebSocket cadence / spam (burst-aware) | Q | DevTools Network → WS frames panel. 60s mesa play multi-player. Measure idle rate AND deal/showdown burst rate separately. | Idle <2 msg/s sostenido; burst during deal/showdown legitimately high with no duplicates; <500B avg payload | Idle 2–10 msg/s sostenido OR occasional duplicates OR avg payload 500B–2KB | Idle >10 msg/s sostenido OR systematic duplicate broadcasts OR avg payload >2KB | Prod multi-player |
| 6 | DOM rerenders innecesarios | A | game-ui.ts + main.ts rerender counter. Compare counter delta vs state-mutation delta. | 1 rerender per mutation; 0 orphan rerenders (rerender without state change) | 2–3 rerenders per mutation | >3 rerenders per mutation OR orphan rerenders observed | Local `?perf=1` |
| 7 | Mobile GPU bottlenecks + thermal | Q+A | Android DevTools Performance trace + tactile observation (does device get warm? does FPS drop after manos N=3, 5, 10?). Record device model + Android version + tier (low/mid/high). **Mid-tier Android especially scrutinised.** | Android median frame <16.7ms; GPU thread <30%; no thermal warming after 10 manos | Median 16.7–25ms OR GPU 30–60% OR perceptible warming after 5+ manos | Median >25ms OR GPU >60% OR visible thermal throttling OR FPS degradation over consecutive manos | Android USB |
| 8 | Z-index / layering of cards | A | DevTools Layers panel + visual inspection during card deal + overlap during animation. | Stack order matches spec; 0 flicker during deal/showdown | Occasional mis-layer during animation that does not impact action | Cards hidden behind UI OR modal underneath cards OR persistent layering bug | Prod + Android |
| 9 | Readability — hand + community cards (geometry, not assets) | Q+A | Extended `scripts/visual-audit.ts` with readability assertions + Android visual check. Measures: rank font size at viewport; inter-card separation; overlap area between cards; contrast ratio of card vs felt; legibility during deal/move animation; thumb occlusion in real mobile grip. | Rank ≥18px desktop / ≥14px mobile effective; separation ≥8px between cards; 0 overlap unless intentional; contrast ≥4.5:1 vs felt; rank readable during animation; primary hand not under thumb-grip zones | Rank 16–18px desktop / 12–14px mobile; separation 4–8px; minor overlap; contrast 3–4.5:1; readable when animation stops; thumb occludes secondary information only | Rank <16px desktop / <12px mobile (effective at viewport, post-zoom-fit); separation <4px; significant overlap; contrast <3:1; illegible during animation; thumb covers primary information | Prod build + Android |

**Note on quantitative thresholds**: these are best-effort upfront calibrations. If the first measurement is wildly off the threshold's premise (e.g. ALL frame pacing measures land at 50% slow frames), document the recalibration in the master findings doc — never silently adjust.

---

## Deep-dive protocol

Triggered when triage tags an area Yellow or Red.

1. Spawn a focused session on that specific area (1–2h maximum per area).
2. Add instrumentation if needed — **always to the same `?perf=1` commit via amend**, never a second commit.
3. Produce a mini-report at `docs/superpowers/findings/2026-05-XX-<area>.md` containing:
   - Root-cause hypothesis with evidence.
   - Trace / artifact links (absolute paths).
   - Suggested fix scope: which files, order of magnitude (LoC), risk level.
   - Leverage estimate: high / medium / low.
   - Suggested P-bucket (P1/P2/P3/P4/P5) with justification.
   - Risk-of-touching audit: is the area locked? near the Move 2 reconnect path? engine? Cross-reference `docs/HANDOFF_A2.0.md` "No-touch list".
4. **Cross-area linking**: if Red in area X identifies the root cause of Yellow/Red in area Y, both mini-reports must reference each other. Sequencing then treats the root cause as primary so we do not chase symptoms.
5. **Do NOT propose fix code** — that is polish-sprint territory. The diagnostic stops at "fix scope" level.

---

## Output artifacts

| Artifact | Path | Tracked? | When |
|----------|------|----------|------|
| Master findings doc | `docs/superpowers/findings/2026-05-XX-chiribito-runtime-diagnostic.md` | git | Created post-triage, updated post-deep-dives. Must include the real-world user feedback section verbatim at top. |
| Mini-report per Yellow/Red area | `docs/superpowers/findings/2026-05-XX-<area>.md` | git | Per area after deep-dive |
| Machine-readable matrix | `.dev-stack/diag/matrix.json` | gitignored | Post-triage (for regression re-runs) |
| Raw artifacts (traces, screenshots, video) | `.dev-stack/diag/<area>/<env>-<timestamp>.{trace,json,png,mp4}` | gitignored | During capture |
| **Mano-completa baseline pair** (desktop + mobile, side-by-side enabling post-polish comparison) | `.dev-stack/diag/baseline/mano-completa-desktop.png` + `.dev-stack/diag/baseline/mano-completa-android.png` | gitignored | Captured once during triage; required artifact |
| Instrumentation code | main (per Chiribito convention) | git, **1 code commit** (1 amend allowed) | Pre-triage |
| Doc commits | — | git, **N permitted** (1 per mini-report + 1 master + amends) | Post-triage, ongoing |

---

## Sequencing rules

Maps triage outcomes → which P-bucket gets the first polish-sprint spec.

**Area-to-bucket mapping:**

- **Perf bucket** (P2 territory): #1 frame pacing, #2 Pixi loop, #3 texture, #4 resize thrash, #5 WS spam, #6 rerenders, #7 mobile GPU.
- **Legibility bucket** (P1 territory): #9 readability.
- **Mobile ergonomics bucket** (P5 territory): mobile-specific aspects of #4 and #7; plus any mobile-only verdict on #1 or #8.
- **Layering bucket**: #8 z-index — integrates into P3 (tactile slots/wells) or P4 (animation layering), not its own bucket.
- Tactile and animation softness signals (P3/P4) emerge during deep-dives on #1, #2, #6 — not their own triage areas.

**Deterministic rules:**

| Triage outcome | Sequencing implication |
|----------------|------------------------|
| Any of #1–#7 → **Red** | **P2 (performance) first.** P1+P5 follow post-P2. |
| All #1–#7 Pass/Yellow + #9 → **Red** | **P1 (legibility) first.** P5 follows. |
| All #1–#7 Pass/Yellow + #9 Pass/Yellow + #4 or #7 → **Red** (mobile-specific) | **P5 (mobile ergonomics) first.** P1 follows. |
| All 9 → Pass/Yellow | **P1 + P5 in parallel** (independent sub-slices). P3+P4 follow gated on P1/P5 landings. |
| Multiple Red across disjoint categories | **No auto-rule** — open new brainstorm with findings on the table before choosing. |
| #8 → Red | Layering fix integrates into P3 (tactile slots/wells) or P4 (animation layering), not its own bucket. |

**Severity escalation (added per user Block 3 adjustment):**

If #9 readability resolves as **Red severe — "core gameplay unreadable"** (definition: rank-of-cards illegible at viewport on either desktop OR mobile without user-initiated zoom, confirmed by user spot-check), it **escalates above moderate Yellow performance degradation**, because basic-clarity-of-play has extreme perceptual priority. This escalation is the only rule that can override the "any Red in #1–#7 → P2 first" baseline; trigger requires explicit "core gameplay unreadable" verdict, not generic Red.

If both "core gameplay unreadable" AND any #1–#7 Red coexist → no auto-rule, brainstorm new with findings in hand.

**Phase W gating (out-of-scope reminder):**

Phase W (landing fork from `polito101/WEB-CHIRIBITO`) and Phase A (apex `chiribito.com` cutover) remain gated on: polish sprint shipped + smokes 9/9 + Playwright E2E 40/40 + game feel subjectively stable for ≥1 week of real use. Not designed in this spec.

---

## Done criteria — diagnostic closed when

1. Triage matrix 9/9 filled with verdict + key metric / artifact (Pass also requires minimum evidence, not assumption).
2. Deep-dive mini-report written for each Yellow/Red area.
3. Sequencing decision documented in master findings doc with explicit reference to which rule applied.
4. Cross-area linking applied where root cause is transversal.
5. Test baselines green post-instrumentation: vitest 217/217 · jest game 475/475 · jest api 27/27 · Playwright 40/40.
6. User signoff on findings + sequencing decision.
7. No additional code commits beyond the 1 `?perf=1` commit (1 amend allowed per A2.0 precedent).
8. Mano-completa desktop + Android baseline captures present in `.dev-stack/diag/baseline/`.
9. Brainstorm trigger enabled to open the sequencing winner's P-bucket spec in a new session.

**Triage-runs-to-completion rule:** even if area #N tags Red catastrophically early, finish the remaining 9 areas before starting any deep-dive. Sequencing needs the full picture; a more critical Red could surface in area #N+k.

---

## Validation — what makes this diagnostic defensible

- Every Yellow/Red verdict has ≥1 artifact (trace export, screenshot, video clip).
- Every quantitative threshold has a measured value (not "yes red, no number").
- Every qualitative verdict has a narrative describing what was observed.
- Multi-player log: game-server audit (`AnalyticsService`) confirms ≥2 concurrent sessions during the capture window.
- Android findings record device model + Android version + tier (low/mid/high).
- Cross-area linking: if Red in X identifies root cause of Y/R in Y, mini-reports reference each other; sequencing treats root cause as primary.
- Any mid-diagnostic threshold recalibration is documented in master findings doc — no silent changes.
- "Tests green ≠ UX works": instrumentation correctness verified via dedicated test (`isPerfEnabled` truth table, mirrors A2.0 `debug-mode.test.ts`).
- **Mano-completa side-by-side baseline** (added per user Block 3 adjustment): one "complete-mano-visible" artifact on desktop AND one on Android, both stored under `.dev-stack/diag/baseline/`. Enables direct side-by-side comparison after the polish sprint ships.

---

## Risks / known limitations

1. **Single-commit budget squeeze** — deep-dives may need additional instrumentation. Mitigation: 1 amend allowed (A2.0 precedent); beyond that, re-evaluate with user.
2. **Threshold calibration upfront** — quantitative thresholds (heap +20MB/min, GPU 30%, jitter 3ms, etc.) are best-effort. If first measurement is wildly off, recalibrate and document; never silently adjust.
3. **Single Android device** — findings may not generalize across Android tiers. Record device tier in every Android finding. iOS not covered in this pass.
4. **Heisenberg under `?perf=1`** — the instrumentation itself can perturb the system. Mitigation: `console.debug`-only logging, no DOM mutation during capture, optional panel OFF during measurement runs.
5. **Pre-existing risks inherited** (not resolved here): single-player auto-dispose (`GameEngine.checkGameEnd`), idle-timeout-modal DOM orphan post Move 2, banner pre-game waiting (Slice C territory). Out of scope; cited in master findings if encountered.
6. **A–G slice land mines** — the existing roadmap locked B → A2.1 sequencing. If the diagnostic recommends another order, that is input for the brainstorm of the first P-bucket spec, not an automatic A–G override.
7. **False comfort from desktop-only metrics** (added per user Block 3 adjustment) — desktop green verdicts MUST NOT mask broken mobile geometry. Every area in scope on mobile (#1, #4, #7, #8, #9) records desktop AND Android verdicts separately; a Red on Android with Pass on desktop is **still a Red overall** for sequencing purposes.

---

## References

- `docs/HANDOFF_A2.0.md` — current state of play, No-touch list, slice roadmap.
- `docs/superpowers/specs/2026-05-18-chiribito-visual-audit.md` — original static screenshot audit (baseline of P0/P1/P2/P3 findings + Slices A–G roadmap).
- `docs/superpowers/specs/2026-05-18-chiribito-slice-A2.0-sidebar-debug-design.md` — `isDebugEnabled` / `body.debug-mode` / `.debug-only` pattern that `?perf=1` mirrors.
- Memory: `feedback_chiribito_north_star.md`, `feedback_chiribito_e2e_multiplayer.md`, `feedback_chiribito_browser_e2e_lesson.md`, `feedback_chiribito_disciplined_format.md`, `feedback_chiribito_pixi_continuity.md`, `feedback_chiribito_castizo_vocabulary.md`, `feedback_chiribito_a1_root_causes.md`.
- Project memory: `project_chiribito.md`, `project_chiribito_production_deploy.md`, `project_chiribito_dev_stack.md`.
