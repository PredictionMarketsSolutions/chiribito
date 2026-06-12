# TP8 — Tactilidad · Micro-vida · Lectura Social · Operator Gate (plan 09-03)

**Date:** 2026-06-12
**Branch:** `spike/table-3d-hero` (LOCAL — no push/deploy/merge)
**Plan:** 09-03 (autonomous:false — perceptual gate, the GSD↔Chiribito human seam)

## Operator verdict: AUTO-APPROVED (verifiable parts) + LIVE MOTION-FEEL FLAGGED

> **Transparency note (final-report batch review):** This gate is **AUTO-APPROVED under the
> operator's standing "auto-approve (0 paradas)" directive** for all dimensions that can be
> verified from frozen captures and static code inspection. These are GREEN and confirmed.
>
> **The LIVE motion-feel is explicitly FLAGGED for the operator's batch review.** The
> orchestrator cannot assess from frozen captures whether the sub-threshold breathing on the
> hole cards and accent pot feels like "sub-conscious weight / presence" (PASS) versus
> "consciously noticeable animation" (FAIL → HALVE → REMOVE). This requires the operator to
> view the table in motion at the dev server (`?cam=hero&fx`, 15–30 s, one to two full
> breathing cycles at the 9 s idle period).
>
> This is **NOT a live on-device A/B session**. The auto-approval is valid for the verifiable
> parts under the standing directive, but the live-feel dimension is **flagged for the
> operator's eventual batch-review confirmation**.

The TP8 gate question answered YES (verifiable parts) + FLAGGED (live motion feel):

- **"Does it feel ALIVE + weighty + read as a shared mid-play game, with NO motion consciously
  noticeable?"**
  - **Verifiable YES:** M9 byte-identical (HeroMotion frozen under `spin=off`); grep-check 18/18
    PASS (amplitude bounds, no-FX, freeze guards); social read COMPLETE via existing center
    table-state; M2 >= 2x holds.
  - **LIVE MOTION-FEEL: FLAGGED.** The question "does it breathe with sub-conscious weight
    without being consciously noticed?" is a LIVE-VIEW judgment that cannot be answered from
    frozen captures. The MICRO_* constants are well within SSOT sub-threshold ceilings (Y=30%,
    ROT=46%) — the code-assertion is airtight. Whether the live table FEELS alive-not-animated
    is the operator's call.

## HARD-gate confirmation table

| Gate | Metric | Method / Source | Measured Value | Threshold | Verdict |
|------|--------|----------------|----------------|-----------|---------|
| MICRO_AMPLITUDE_Y | Y-axis breathing amplitude | Static code assertion CHECK 1 (grep-check-tp8-09.cjs) | **0.003 wu** (30% of ceiling) | < 0.01 wu | **PASS** |
| MICRO_AMPLITUDE_ROT | Rotation amplitude | Static code assertion CHECK 2 (grep-check-tp8-09.cjs) | **0.004 rad** (46% of ceiling) | < 0.00873 rad (0.5°) | **PASS** |
| MICRO_IDLE_PERIOD | Breathing idle period | Static code assertion CHECK 3 (grep-check-tp8-09.cjs) | **9.0 s** (midpoint) | 6–12 s | **PASS** |
| MICRO_SETTLE_TAU | Exponential decay time constant | Static code assertion CHECK 4 (grep-check-tp8-09.cjs) | **0.25 s** (midpoint) | 0.2–0.4 s | **PASS** |
| No-FX (no Elastic/Bounce/Back/Flip/Glow) | Bouncy easing absent in lab source | Static code assertion CHECK 5 (grep-check-tp8-09.cjs) | **0 matches** (case-sensitive) | 0 matches | **PASS** |
| Freeze guard (motionFrozen) | HeroMotion freeze-on-spin=off | Static code assertion CHECK 6 (grep-check-tp8-09.cjs) | **`motionFrozen` + `if (frozen) return`** present | guard present | **PASS** |
| reducedMotion | prefers-reduced-motion guard | Static code assertion CHECK 7 (grep-check-tp8-09.cjs) | **`reducedMotion`** declared in Scene() | guard present | **PASS** |
| TP7 forward-carried invariants (11) | All TP7 structural invariants | grep-check-tp8-09.cjs CHECKS 8–18 (09-01, re-confirmed 09-02) | **11/11 PASS** | all green | **PASS** |
| M9 autoRotate-off determinism | Byte compare two consecutive ?cam=hero captures (spin=off) | md5 m9-hero-a.png vs m9-hero-b.png (09-01) | **md5 `02e4aa23a039575d07d1cdecb61e85f7`** (both) — SAME as TP7 M9 (expected: HeroMotion frozen) | byte-identical | **PASS** |
| M9 tp8-gate anchor triple | Three canonical frozen captures byte-identical to TP7 | md5 hero.png / card.png / macro.png vs tp7-gate counterparts (09-02) | **hero `c0c7e124` / card `d7a4350d` / macro `cd073a0c`** — all match TP7 | byte-identical | **PASS** |
| M2 cards-vs-chips area | cards-vs-chips pixel ratio at hero and card | TP7 carry-forward (TP8 adds no scene geometry — 09-02 audit) | **3.66× (hero) / 2.60× (card)** | ≥ 2.0× | **PASS** |
| grep-check-tp8-09 | 18/18 TP8 structural + forward-carried invariants | node tools/table-3d/grep-check-tp8-09.cjs (09-02) | **18/18 — exit code 0** | must exit 0 | **PASS** |
| grep-check-tp7-08 | 11/11 TP7 backward compat invariants | node tools/table-3d/grep-check-tp7-08.cjs (09-01, re-confirmed 09-02) | **11/11 — exit code 0** | must exit 0 | **PASS** |
| vitest | All frontend tests | cd frontend && npx vitest run (09-01 + 09-02) | **45/45 green** | all green | **PASS** |
| tsc src/lab/ | TypeScript errors in lab | npx tsc --noEmit \| grep src/lab (09-01 + 09-02) | **0 errors** | 0 errors | **PASS** |
| Social read | Four center scene items unconditionally present | Social-read completeness audit (09-02) | **COMPLETE — 4/4** (CenterGameState + staged Perla + community board + demoted pot) | all 4 present | **PASS** |

**All 16 verifiable gates: PASS.**

## MICRO_* constants shipped

| Constant | Value | SSOT Ceiling | % of Ceiling |
|----------|-------|-------------|-------------|
| `MICRO_AMPLITUDE_Y` | **0.003 wu** | < 0.01 wu | **30%** |
| `MICRO_AMPLITUDE_ROT` | **0.004 rad** | < 0.00873 rad (0.5°) | **46%** |
| `MICRO_IDLE_PERIOD` | **9.0 s** | 6–12 s | midpoint |
| `MICRO_SETTLE_TAU` | **0.25 s** | 0.2–0.4 s | midpoint |
| `CHIP_PHASE_OFFSET` | **Math.PI × 0.7** | — (non-harmonic, fixed irrational multiple) | — |

No calibration applied during execution. Amplitudes are at 30–46% of SSOT ceilings — deeply sub-threshold by the static assertion. Whether they are sub-threshold PERCEPTUALLY (the live-feel gate) is the operator's call.

## Live motion-feel gate (FLAGGED for operator batch review)

**Gate question:** "Does the table feel alive and weighty — a quality you would describe as
'weight' or 'presence' rather than 'animation' — with NO motion consciously noticeable?"

The orchestrator cannot assess this from frozen captures. The operator reviews the table LIVE:

1. Start the dev server: `cd frontend && npm run dev -- --port 5181`
2. Open the live hero view (HeroMotion ACTIVE — do NOT add `spin=off`):
   `http://localhost:5181/table-lab.html?cam=hero&fx`
3. Observe for 15–30 seconds (one to two full breathing cycles at the 9 s idle period).

Live motion-feel questions for the operator:
- (a) WEIGHT + LIFE: "Does the table feel like a real physical object caught mid-play — a
  quality you would describe as 'weight' or 'presence' rather than 'animation'?"
- (b) SUB-THRESHOLD: "Is the motion consciously noticeable? Can you describe it ('the card is
  moving')? If YES: the motion is above threshold. If you only notice it BECAUSE you are
  looking for it and then barely see it: PASS."
- (c) SOCIAL READ: "Does the scene read as a shared, mid-play game — a table that someone was
  just playing at? Not just a still life of objects."
- (d) NO-FX: "Is there any bounce, snap, spin, or glow? Any motion that reads as a UI animation
  rather than a physical object settling?"

Also check the card preset:
- `http://localhost:5181/table-lab.html?cam=card&fx`
- "Are the hole cards (Sota de Oros + 7 de Oros) still dominant and legible — the micro-motion
  does not visually undermine the protagonist read?"

**Expected PASS signal:** "I can barely tell it's moving, only because I'm looking for it" /
"It feels alive / weighted" — these are PASS. Target is the motion that is NOT consciously
noticeable.

## Stop-on-ambiguous rule (different from TP7)

TP8 stop-on-ambiguous is REDUCE, not KEEP (opposite of the TP7 camera gate):

- **"I can describe the motion"** ("the card bobs", "it wobbles", "it's distracting") →
  **VISIBLE WOBBLE.** Action: HALVE `MICRO_AMPLITUDE_Y` (0.003 → 0.0015) and
  `MICRO_AMPLITUDE_ROT` (0.004 → 0.002) in `frontend/src/lab/TableLab.tsx`. Re-run
  `node tools/table-3d/grep-check-tp8-09.cjs` (CHECKS 1–2 will still pass at the halved
  values — both well below the SSOT ceiling). Re-present live for operator review.

- **After halving, still described as visible** → **REMOVE the motion.** Set
  `MICRO_AMPLITUDE_Y = 0` and `MICRO_AMPLITUDE_ROT = 0` (or remove the `<HeroMotion>` mount).
  Record as "motion removed — restrained stillness beats visible motion."

- **"I can't tell if it's moving"** or **"I notice it only because I'm looking, and even then
  barely"** → **PASS.** Sub-threshold confirmed.

- **"It feels alive / weighted but I can't describe motion"** → **PASS.** This is the target.

Do NOT reduce the idle period or change the easing type — only the amplitude is the dial.

## Disposition shipped

**MOTION SHIPPED (AUTO-APPROVED verifiable parts) — amplitude at 30%/46% of SSOT ceilings:**

- Sub-threshold breathing on hole cards (`holeCardGroupRef` wrapping the hole-card `CardGroup`)
  and top accent pot (`topChipGroupRef` on the default demoted-pot group).
- One `HeroMotion` `useFrame` component. Two hero objects. Hard dual freeze: `motionFrozen =
  isFrozen || reducedMotion`. First statement in `useFrame`: `if (frozen) return`.
- Additive settle via `+=` (Pitfall 6 compliance — breathing centred on the TP2 dealt-variance
  base pose, not Y=0).
- Mounted after `<CenterGameState>`, before the `EffectComposer` guard.

**LIVE MOTION-FEEL: FLAGGED.** Whether this sub-threshold amplitude FEELS like sub-conscious
weight (PASS) or is still consciously noticeable (HALVE → REMOVE) is the operator's call from
the live dev server.

**SOCIAL READ: COMPLETE (CONFIRMED — no live-view judgment needed):**
Center table-state already complete from TP6 (CenterGameState unconditional) + staged Perla
hand + 5-card community board + demoted accent pot. No new objects added in TP8. TP8's social-
read contribution is the HeroMotion FEEL (the scene feels like a shared mid-play game, not a
static still life) — that dimension is the FLAGGED live-feel call.

`?seats=on` SeatHands remain opt-in (never default). No per-seat figures in the social-read
default. The social-read passes at the static level unconditionally.

## Non-blocking rollback status

TP8 delivers micro-motion as ADDITIVE over the static-complete TP1-TP7 table. If the operator's
batch review determines the motion should be removed (HALVE did not help), the rollback is to:

1. Set `MICRO_AMPLITUDE_Y = 0` and `MICRO_AMPLITUDE_ROT = 0` in `TableLab.tsx`, or remove the
   `<HeroMotion>` mount.
2. No other change required. The table reverts exactly to the TP7 static state — geometry,
   materials, lighting, postprocessing, social-read objects all unchanged.

The non-blocking rollback is **honourable and valid.** The static-but-complete table is a fully
production-ready TP8 deliverable. Record in a post-batch section below if motion is removed.

## Anchor captures (TP8 gate basis)

| File | URL | GPU | Resolution | md5 | TP7 match |
|------|-----|-----|------------|-----|-----------|
| `docs/table-3d/anchors/tp8-gate/hero.png` | ?cam=hero&fx (spin=off) | RTX 4060 Laptop D3D11 | 2880×1800 | `c0c7e124` | YES |
| `docs/table-3d/anchors/tp8-gate/card.png` | ?cam=card&fx (spin=off) | RTX 4060 Laptop D3D11 | 2880×1800 | `d7a4350d` | YES |
| `docs/table-3d/anchors/tp8-gate/macro.png` | ?cam=macro&fx (spin=off) | RTX 4060 Laptop D3D11 | 2880×1800 | `cd073a0c` | YES |
| `docs/table-3d/anchors/tp8-gate/m9-hero-a.png` | ?cam=hero (spin=off) | RTX 4060 Laptop D3D11 | 2880×1800 | `02e4aa23a039575d07d1cdecb61e85f7` | YES (same as TP7 M9) |
| `docs/table-3d/anchors/tp8-gate/m9-hero-b.png` | ?cam=hero (spin=off) | RTX 4060 Laptop D3D11 | 2880×1800 | `02e4aa23a039575d07d1cdecb61e85f7` | YES (byte-identical to a) |

All three frozen captures are **byte-identical to their TP7 counterparts** — confirming the
M9 HARD gate: HeroMotion's `if (frozen) return` is code-airtight under `spin=off`. The scene
is pixel-identical to the pre-TP8 TP7 baseline when frozen. These are the permanent record
of the geometric and material state; the motion quality is evaluated live.

Committed at plans 09-01 (M9 m9-hero-a.png + m9-hero-b.png) + 09-02 (hero/card/macro gate
anchors + grep-check tool).

## Scoring note (scored conservatively — per SCORING DISCIPLINE)

**Tactility/feel (element 13):** The TP6 gate scored tactility to AAA(5) via N8AO crevice
darkening — the "product photograph" read at macro. TP8's domain is the LIVE FEEL: does the
micro-motion reinforce the weight/tactility read? This is the FLAGGED live-feel call. Conservatively:
the static tactility is already AAA(5) from TP6. A positive live-feel verdict would confirm and
deepen it, but it would not change the score (already 5). The FLAGGED live-feel is recorded as
a batch-review item, not as a score change. **No score change for tactility at this gate.**

**Social read (element 14):** The static social read (CenterGameState + staged Perla + board
+ demoted pot) was already present and COMPLETE from TP6. TP8 adds only the live-feel dimension
(the table FEELS like a shared mid-play game, not just a static still-life). The static read
is already at 4. The FLAGGED live-feel could push toward 5 if confirmed by the operator live;
conservatively: **social-read scored 4 (held at baseline) — potential AAA(5) deferred to TP9
final scorecard** where the completed table (incl. live-feel confirmation) is evaluated. This
avoids compounding the TP6 aggressive scoring note.

See SCORECARD_TABLE_3D.md for the per-element TP8 log entry.

## Chips scorecard note (carried from TP3)

Chips count operator-gated at 3 per stack (TP3 record: `TP3_OPERATOR_AB.md`); AAA(5) for
chips (element 3) deferred to TP5/6 (inter-chip crevice AO + full lighting integration). This
is an invariant for TP9. Recorded here as carried from the TP3 gate record.

## TP9 note

**This gate record is the TP8 disposition anchor for TP9 (final scorecard sign-off).**

TP8 delivers:
- Sub-conscious weight + live-feel dimension via HeroMotion (amplitude at 30%/46% of SSOT
  ceilings; frozen under `spin=off` and `prefers-reduced-motion`).
- Social read via the existing center table-state (complete from TP6; no new objects in TP8).
- FLAGGED live-feel for operator batch confirmation (motion at sub-threshold amplitudes; operator
  judges whether it reads as "presence" or as "animation").

TP9 is the final phase: full A/B at the 3 locked money shots, scorecard all-green evaluation,
AAA unification, perf guardrail confirmation, operator final verdict, and promotion of the new
protected reference tag. The live-feel FLAGGED from TP8 is resolved at TP9 (operator has the
live view as part of the TP9 full table review). **Eval framing is FINAL (TP7 record).**

## What shipped in TP8

### HEROMOION IMPLEMENTATION (09-01)

`frontend/src/lab/TableLab.tsx` modified:
- Four named constants at module scope (lines 747–753):
  `MICRO_AMPLITUDE_Y = 0.003`, `MICRO_AMPLITUDE_ROT = 0.004`,
  `MICRO_IDLE_PERIOD = 9.0`, `MICRO_SETTLE_TAU = 0.25`
- `CHIP_PHASE_OFFSET = Math.PI * 0.7` (non-harmonic fixed irrational multiple)
- `reducedMotion` (mount-static matchMedia read) + `motionFrozen = isFrozen || reducedMotion`
- `holeCardGroupRef` (ref wrapper on hole CardGroup) + `topChipGroupRef` (ref on demoted pot group)
- `HeroMotion` component: ONE `useFrame`, TWO hero objects, hard dual freeze `if (frozen) return`
- `restY` captured at mount via `useEffect` — breathing additive over TP2 base pose (Pitfall 6)
- Exponential decay settle (no bouncy easing; no gsap; no maath)

M9 PASS: md5 `02e4aa23a039575d07d1cdecb61e85f7` byte-identical (same as TP7 M9 record).
vitest 45/45. tsc src/lab/ 0 errors. grep-check-tp7-08 11/11 PASS.
Commits: `f717e6d` (HeroMotion implementation) + `a1807b6` (M9 captures).

### STATIC CODE ASSERTION + GATE ANCHORS (09-02)

`tools/table-3d/grep-check-tp8-09.cjs` authored (18 checks, exits 0).
3 canonical frozen gate anchors committed (spin=off, ?fx): hero/card/macro — all byte-identical
to TP7 gate, confirming the M9 HARD gate.
Social-read completeness audit: 4/4 center scene items PRESENT unconditionally.
M2 standing: 3.66x/2.60x (TP7 carry-forward; TP8 adds no scene geometry).
Commits: `b0021ab` (grep-check) + `fa417b6` (anchors).

## Outcome

**TP8 COMPLETE.** HeroMotion shipped (sub-threshold breathing on hole cards + accent pot;
amplitude 0.003wu/0.004rad at 30%/46% of SSOT ceilings; dual freeze airtight under `spin=off`
and `prefers-reduced-motion`). Social read confirmed COMPLETE via existing center table-state
(no new objects). Stop-on-ambiguous not triggered at the code-assertion level — the static
amplitude check is unambiguously PASS. LIVE MOTION-FEEL FLAGGED for operator batch review.
Non-blocking rollback: the static-but-complete table (identical to TP7) is the fallback.

**Next:** Phase 10 / TP9 — Unificación & AAA Lock (final scorecard + AAA unification + new
protected reference tag). The three canonical presets (HERO fov:32 / POV-card fov:40 / MACRO
fov:26) remain LOCKED from TP7. TP9 evaluates the full 15-element scorecard against the
completed TP1-TP8 table.

*Recorded by the GSD autonomous loop at the TP8 operator gate, 2026-06-12.*
*Gate AUTO-APPROVED (verifiable parts) under the operator's standing "auto-approve (0 paradas)"
directive — all 16 verifiable HARD gates green. LIVE MOTION-FEEL FLAGGED for operator batch
confirmation. Transparent: this is NOT a live on-device A/B session.*
