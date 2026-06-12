# Phase 9: TP8 — Tactilidad, Micro-vida & Lectura Social (the FEEL) - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning
**Mode:** Autonomous discuss (SSOT-grounded from `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP8). Operator gate auto-approved for the VERIFIABLE parts (static code-assertion of the easing bounds, M9 freeze, prefers-reduced-motion, the social read) IF green + good; **the LIVE micro-motion FEEL is explicitly a live-view judgment the orchestrator CANNOT assess from frozen captures → it is FLAGGED for the operator's batch review** (per the operator's standing "auto-approve (0 paradas)" directive: ambiguous/unverifiable → flag, don't fake).

<domain>
## Phase Boundary

TP8 adds **restrained micro-life that sells weight WITHOUT ever being consciously noticed** (card settle, chip-land settle, a breathing stillness) and completes the SHARED mid-play **social read via table-STATE only** (the TP6 center game-state + a staged mid-hand + the demoted live-stakes pot), with the castizo + premium-artisanal feel integrated. The micro-motion is **gated behind `prefers-reduced-motion` AND frozen under the capture flag** for deterministic gates.

**HARD invariants (SSOT §TP8 + red-team):**
- **Sub-threshold micro-motion on HERO OBJECTS ONLY** (hole cards, top chip): amplitude **< ~0.01 world units / < ~0.5°**, settle **0.2–0.4 s**, idle period **6–12 s near-zero**. A few hero objects only (per-frame cost guard).
- **ALL micro-motion FREEZES** under BOTH (a) `matchMedia('(prefers-reduced-motion: reduce)')` AND (b) the harness `spin=off`/capture flag → **M9 determinism is a HARD gate** (frozen captures byte-identical).
- Because the harness can't see frozen motion, the amplitude bound is enforced by **a STATIC CODE ASSERTION** (a grep-check that the easing constants ≤ the documented thresholds) **+ the operator's live view** (red-team coherence). The code assertion is what the orchestrator verifies; the live feel is the operator's.
- **Restrained-only:** NO flip / spin / glow FX, NO bouncy easing (a no-FX assertion). **Restrained stillness beats visible motion** — any visible wobble = a gimmick → HALVE it; if still seen → REMOVE it.
- **Social read via CENTER table-STATE ONLY** (deck stub / dealer button / center discard — from TP6) — **NO modeled humans; `?seats` stays opt-in / NEVER default.** M2 ≥ 2× still holds (the accent didn't grow).
- Castizo/artisanal lives in the OBJECT (cordobán leather, aged brass, mahogany, the inlaid Spanish suits + the Chiribito medallion) under the warm light — **no room, no decor, no props/figures.**
- Touch ONLY `frontend/src/lab/` + `tools/table-3d/` (+ `frontend/package.json` ONLY if `maath` is genuinely needed — gsap already exists). **LOCAL only** — no push/deploy/merge.

**Non-blocking rollback:** keep the static-but-complete table (the micro-life is additive; remove any motion that's visible/gimmicky).

**Out of scope / deferred:** modeled humans / per-seat figures (forbidden; `?seats` opt-in only); the final AAA unification + scorecard sign-off → **TP9**; any new materials/lighting/cameras (those phases are done — TP8 adds motion + completes the social read on the existing object).
</domain>

<decisions>
## Implementation Decisions

### SSOT-locked
1. **Micro-motion** on hero objects (hole cards + top chip) ONLY: amplitude < 0.01wu / < 0.5°, settle 0.2–0.4s, idle 6–12s near-zero — via `useFrame` + (existing `gsap` OR `maath/easing` if cleaner; add `maath` only if genuinely needed). A "breathing stillness," not a loop.
2. **Freeze gates (HARD):** the motion is zero under `prefers-reduced-motion` AND under the capture/`spin=off` flag → M9 byte-identical captures. This is the determinism HARD gate.
3. **Static code assertion:** a grep-check that the easing amplitude/rotation/timing constants are ≤ the documented thresholds (since the frozen capture can't measure live motion). This is the orchestrator-verifiable bound.
4. **Social read:** complete the shared mid-play read via the CENTER table-state (the TP6 deck stub + button, the staged mid-hand = the existing Perla hole-pair + community board, the demoted pot). NO humans; `?seats` opt-in/never default. M2 ≥ 2× holds.
5. **Restrained-only:** no flip/spin/glow/bouncy — a no-FX code assertion. Stillness beats motion.
6. **Operator gate (last plan, autonomous:false) — a LIVE view:** does it feel alive + weighty + read as a shared mid-play game, with NO motion consciously noticeable? (The orchestrator auto-approves the code-assertion + M9 + social-read; the live motion-feel is FLAGGED for the operator's batch review.)

### HARD gates
- M9 determinism (frozen captures byte-identical) — the motion MUST freeze under capture; the static code-assertion grep-check (constants ≤ thresholds + no-FX) exits 0; M2 ≥ 2× holds; prefers-reduced-motion zeroes the motion; vitest + tsc clean.

### Claude's discretion
- The exact easing mechanism (gsap vs maath; the breathing curve), the precise constants (within the sub-threshold bounds — err on the side of LESS motion, "restrained stillness beats visible motion"), which hero objects breathe (hole cards + top chip), the social-read completion (is the center state from TP6 sufficient, or a tiny staged addition — center-only), and whether `maath` is added.
</decisions>

<code_context>
## Existing Code Insights (frontend/src/lab/)
- `gsap` already in use (card/chip animations). `useFrame` (R3F) available. `maath` may or may not be present (add only if needed).
- The hero objects: the hole cards (the Perla: Sota + 7 de Oros) + the chip stacks (top chip). The TP6 CenterGameState (deck stub + dealer button) is already in the scene (the social-read foundation).
- The TP3 dealt-variance (deterministic, frozen at construction) is the precedent for "frozen for capture, deterministic" motion — the micro-life must similarly freeze under the capture flag (the `qp("spin")==="off"` signal + prefers-reduced-motion).
- The `?seats` opt-in multi-hand (SeatHands) exists but stays opt-in/never-default.
- The metric kit (`tools/table-3d/`): M2 (cards-vs-chips), M9 (capture determinism — the HARD gate here) + the harness `.dev-stack/lab-shot.mjs` (must capture FROZEN motion → byte-identical). The grep-check pattern (grep-check-tp7-08.cjs) for the static code-assertion.
</code_context>

<specifics>
## Risks (SSOT §TP8)
- Visible wobble = gimmick → HALVE it; if still seen → REMOVE. Restrained stillness beats visible motion.
- Motion during capture = non-deterministic → MUST freeze (M9 HARD).
- Per-frame cost → a few hero objects ONLY.
- Table-state creeping to props/figures → center game-state ONLY; no humans; `?seats` opt-in.

**Success:** the object breathes with sub-conscious weight (frozen for capture, reduced-motion-respecting) and reads as a warm castizo shared mid-play game via table-state alone.
</specifics>

<deferred>
## Deferred Ideas
- Modeled humans / per-seat figures → forbidden (`?seats` opt-in only).
- Final AAA unification + scorecard sign-off + the new protected-reference lock → **TP9**.
- New materials / lighting / cameras → done in prior phases; TP8 only adds motion + completes the social read.
</deferred>
