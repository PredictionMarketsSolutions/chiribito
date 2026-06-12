# TP7 — Cámaras · Operator Gate (plan 08-03)

**Date:** 2026-06-12
**Branch:** `spike/table-3d-hero` (LOCAL — no push/deploy/merge)
**Plan:** 08-03 (autonomous:false — perceptual gate, the GSD↔Chiribito human seam)

## Operator verdict: AUTO-APPROVED — CAMERAS CONFIRMED LOCKED (0 changes)

> **Transparency note (final-report batch review):** This gate was **AUTO-APPROVED under the
> operator's standing "auto-approve (0 paradas)" directive** for this milestone run — all TP7
> HARD gates are green AND the orchestrator's CEO visual read of the three TP7 gate stills
> (card.png / hero.png / macro.png at `docs/table-3d/anchors/tp7-gate/`) was:
> protagonist hole cards (Perla: Sota de Oros + 7 de Oros) dominant in the lower third at HERO,
> board mid-frame, rail framing, chips off-center accent, center game-state filling the dead zone;
> HERO reads as the poker-table money shot; CARD POV is immersive close-up with depth beyond;
> MACRO reads as close material/chip shot with telephoto compression; all three presets tell
> different stories; no unintentional clipping at any preset; TP0-frozen values confirmed UNCHANGED
> in the finished TP1-TP6 table.
>
> This is **NOT a live on-device A/B session**. The auto-approval is valid under the
> standing directive but is **flagged for the operator's eventual batch-review confirmation**
> of the visual read.
>
> **Red-team #6 enforcement:** The TP0 presets were NOT re-baselined mid-program. The canonical
> evaluation confirmed the freeze holds. No new framing was invented. No stop-on-ambiguous was
> triggered — the reads were unambiguous (see section below).

The TP7 gate question answered YES:

- **"Is THIS the money shot of the finished table?"** — the canonical hero (fov32, protagonist
  hole cards dominant lower-third, board mid, rail framing, chips off-center, center game-state
  filling the dead zone) on the **finished TP1-TP6 table (real Fournier cards, instanced matte
  chips, slim rail, shaped warm light, SoftShadows, N8AO, whisper DOF, vignette, grain)**

  Answer: **YES — all three presets confirmed as money shots of the finished table.**

The TP0-frozen presets hold on the finished table. No geometry or material change in TP1-TP6
broke any of the three framings. The composition reads are:

- **HERO ¾ (fov 32 — the definitive money shot):** The Perla (Sota de Oros + 7 de Oros) dominates
  the lower third. Board mid-frame. Rail framing the scene. Chips off-center accent. CenterGameState
  (deck stub + dealer button) fills the left-center dead zone — the table communicates mid-hand game
  in progress. The ¾ angle reveals the table as a premium physical protagonist. Longer-lens
  (~72mm-equiv) — no wide-angle distortion; felt, rail, and cards in proportion. **CONFIRMED LOCKED.**

- **POV-card (fov 40 — player's eye view + M1 primary):** Hole cards large in foreground, fully
  legible at M1=80px (3.6× over the 22px floor). Board extends beyond the hole cards — depth and
  game state. Immersive, close, grounded in the game action. **CONFIRMED LOCKED.**

- **MACRO (fov 26 — close material + chip detail, telephoto):** Close material shot — chip stack,
  card edge, felt crevice AO (N8AO crevice darkening clearly readable), brass rail detail. Long lens
  (fov:26, ~88mm-equiv) flattens the scene correctly. Framing includes the right content; chips and
  card edge are not cut off by the TP4 slim rail geometry change (rail yTop 0.28 — no obstruction).
  **CONFIRMED LOCKED.**

**Ship decision:** All three presets CONFIRMED LOCKED. Preset values UNCHANGED from TP0 freeze.
Framing is FINAL for TP9.

**0 presets corrected. 0 minimal corrections applied. 0 iterations.**

## Gate question

**Gate question:** "Is THIS the money shot of the finished table?"

**Scope:** The three TP0-frozen canonical presets (HERO / POV-card / MACRO) evaluated on the
fully upgraded TP1-TP6 table — specifically confirming that no TP1-TP6 geometry or material
change broke the composition read of any preset.

**Verdict:** YES — all three presets confirmed as money shots of the finished table.

## HARD-gate confirmation table

| Gate | Metric | Method / Source | Measured Value | Threshold | Verdict |
|------|--------|----------------|----------------|-----------|---------|
| M1 hole-card legibility | rank-glyph bbox height at POV ?cam=card&fx | m1-m2-m12.mjs on card-m1-1080p.png (08-01) | **80 px** | ≥ 22 px | **PASS** (3.6× margin; requiresOperatorConfirm=true) |
| M2 cards-vs-chips area | cards-vs-chips pixel ratio at hero and card | pixel-count segmentation (08-01) | **3.66× (hero) / 2.60× (card)** | ≥ 2.0× | **PASS** |
| M9 autoRotate-off determinism | byte compare two consecutive ?cam=hero captures | md5 m9-hero-a.png vs m9-hero-b.png (08-01) | **md5 02e4aa23a039575d07d1cdecb61e85f7 (both)** | byte-identical | **PASS** |
| grep-check-tp7-08 | 11/11 TP7 structural invariants | node tools/table-3d/grep-check-tp7-08.cjs (08-01, re-confirmed 08-02) | **11/11 — exit code 0** | must exit 0 | **PASS** |
| grep-check-tp6-07 | 8/8 TP6 backward compat invariants | node tools/table-3d/grep-check-tp6-07.cjs (08-01, re-confirmed 08-02) | **8/8 — exit code 0** | must exit 0 | **PASS** |
| vitest | all frontend tests | cd frontend && npx vitest run (08-01 + 08-02) | **45/45 green** | all green | **PASS** |
| tsc src/lab/ | TypeScript errors in lab | npx tsc --noEmit \| grep src/lab (08-01 + 08-02) | **0 errors** | 0 errors | **PASS** |

## TP0 preset-lock verification (UNCHANGED)

| Preset | Param | TP0 Locked Value | TP7 Source Read (08-01) | Match? |
|--------|-------|-----------------|------------------------|--------|
| HERO | fov | 32° | **32** | UNCHANGED |
| HERO | pos | [1.2, 5.0, 8.2] | **[1.2, 5.0, 8.2]** | UNCHANGED |
| HERO | target | [0, 0.5, 0] | **[0, 0.5, 0]** | UNCHANGED |
| POV-card | fov | 40° | **40** | UNCHANGED |
| POV-card | pos | [0, 4.7, 10.6] | **[0, 4.7, 10.6]** | UNCHANGED |
| POV-card | target | [0, 0.25, 1.2] | **[0, 0.25, 1.2]** | UNCHANGED |
| MACRO | fov | 26° | **26** | UNCHANGED |
| MACRO | pos | [-1.7, 1.7, 2.4] | **[-1.7, 1.7, 2.4]** | UNCHANGED |
| MACRO | target | [-1.55, 0.05, 1.05] | **[-1.55, 0.05, 1.05]** | UNCHANGED |

**Result: ALL 9 preset values CONFIRMED UNCHANGED. Cameras LOCKED.**

**Declaration: HERO fov:32 / POV-card fov:40 / MACRO fov:26 — ALL THREE PRESETS CONFIRMED LOCKED
on the finished TP1-TP6 table. 0 changes. 0 corrections.**

## Anchor captures (TP7 gate basis)

| File | URL | GPU | Resolution |
|------|-----|-----|------------|
| `docs/table-3d/anchors/tp7-gate/card.png` | ?cam=card&fx (spin=off) | RTX 4060 Laptop D3D11 | 2880×1800 |
| `docs/table-3d/anchors/tp7-gate/hero.png` | ?cam=hero&fx (spin=off) | RTX 4060 Laptop D3D11 | 2880×1800 |
| `docs/table-3d/anchors/tp7-gate/macro.png` | ?cam=macro&fx (spin=off) | RTX 4060 Laptop D3D11 | 2880×1800 |
| `docs/table-3d/anchors/tp7-gate/m9-hero-a.png` | ?cam=hero (spin=off auto) | RTX 4060 Laptop D3D11 | 2880×1800 |
| `docs/table-3d/anchors/tp7-gate/m9-hero-b.png` | ?cam=hero (spin=off auto) | RTX 4060 Laptop D3D11 | 2880×1800 |

Committed at plans 08-01 (captures + grep-check + metrics) + 08-02 (flythrough).

## Flythrough disposition: SHIPPED (non-canonical, opt-in)

The optional `?fly` cinematic flythrough shipped in plan 08-02:

- **Implementation:** `isFly = qp("fly") !== null`; `isFrozen = qp("spin") === "off"` (mount-static);
  `flyCamRef` on existing `PerspectiveCamera` (no second makeDefault); `useFrame` early-returns
  when `!isFly || isFrozen` — M9-safe.
- **Parameters:** X-axis lateral arc only, amplitude 0.20wu (≤ 0.25wu limit), frequency 0.22 rad/s
  (≤ 0.30 rad/s limit), ~28s full cycle.
- **Scope:** 9 new code lines (budget ≤ 40).
- **Canonical presets:** UNCHANGED. The `?fly` path mutates `flyCamRef.current.position.x` only
  when `isFly && !isFrozen`. Capture URLs always carry `spin=off` (harness-appended) — `isFrozen`
  is true at mount, useFrame is a no-op. The three frozen money shots are byte-identical with or
  without `?fly` in the URL when `spin=off` is present.
- **M9 on `?fly&spin=off`:** PASS by construction (freeze guard analysis confirmed in 08-02).
- **grep-check-tp7-08:** 11/11 PASS post-flythrough (CHECK 9: autoRotate={false} unchanged;
  CHECK 11: no second PerspectiveCamera with makeDefault — flyCamRef is a ref on the existing
  camera, not a second `<PerspectiveCamera makeDefault>`).
- **Non-blocking rollback:** The flythrough is an opt-in lab extra. If the operator finds the
  motion reads as "too animated" at batch review, the `isFly` guard means `?cam=hero` (without
  `?fly`) always renders the static canonical preset. No source change needed to deactivate.
- **Does not affect the gate verdict.** The three presets are LOCKED regardless of flythrough status.

## Stop-on-ambiguous handling

Not triggered. The gate verdict is unambiguous (auto-approval under standing directive):

- **HERO COMPOSITION:** YES — Perla dominant lower-third, board mid, rail framing, chips
  off-center accent, CenterGameState fills dead zone. Cards>board>rail hierarchy. Table communicates
  mid-hand game. The TP0 framing holds on the finished TP1-TP6 table.
- **HERO FLATTERY:** YES — ¾ angle reveals the table as a premium physical object. Longer-lens
  (~72mm-equiv). No wide-angle distortion. Felt, rail, cards in proportion.
- **POV-CARD LEGIBILITY:** YES — M1=80px (3.6×). Hole cards large in foreground, fully legible.
  Board beyond. Player's eye view.
- **MACRO MATERIAL READ:** YES — chip stack, card edge, felt crevice AO (N8AO crevice darkening
  readable), brass rail detail. Telephoto compression (~88mm-equiv) flattens correctly. No cut-off
  from TP4 slim rail (yTop 0.28 — verified MACRO composition is unaffected).
- **TP0 PRESETS ON FINISHED TABLE:** YES — no geometry or material change in TP1-TP6 broke any
  framing. All three presets read as intended on the upgraded scene.
- 0 presets revised, 0 minimal corrections applied, 0 iterations.

## Minimal correction gate

Not triggered. No preset exhibited a clear framing failure (chips cut off, cards behind rail,
protagonist disappearing). The slim rail change (TP4 yTop 0.34→0.28) did NOT break the MACRO
framing — chip stacks and card edge remain within frame. The stop-on-ambiguous default (KEEP TP0)
was not needed because all reads were unambiguous YES.

## Non-blocking rollback disposition

The TP0 presets are the established correct defaults — the rollback path and the shipped path are
identical (no change was made). The canonical money-shots framing is the default render at all
times.

If the operator's batch review finds any preset reads differently on their specific hardware:
- Apply a minimal correction per the TP7 correction gate (fov ±2°, pos ±0.5wu maximum).
- Re-run M1 (if POV/hero corrected) and M9 (always).
- Update grep-check CHECK 10 fov values with a recorded justification comment.
- Re-record in this gate document under a "Post-batch correction" section.

Since this gate auto-approves the unchanged presets, the rollback is the status quo.

## TP9 framing note

**This gate record is the framing anchor for TP9 (final scorecard sign-off).**

The three canonical presets — HERO ¾ fov:32 / POV-card fov:40 / MACRO fov:26 — are now
**confirmed LOCKED** on the finished TP1-TP6 table. TP9 evaluates the final AAA score for
all 15 elements using these exact money shots as the evaluation basis. No re-baseline.
No new framing at TP9.

**Eval framing is FINAL.**

## Scorecard delta

**cameras (12): 4 → 4 (hold)** — Conservatively held at 4. The three presets were already scored
at 4 at TP0 baseline (canonical money shots frozen and working). TP7 CONFIRMS them LOCKED on the
finished TP1-TP6 table: M9 byte-identical (autoRotate={false} confirmed), M1/M2 PASS, all nine
preset values UNCHANGED, composition reads verified on the finished scene. The cameras are
confirmed-final; no new feature was added to the camera system itself (the `?fly` flythrough is
a non-canonical opt-in extra, not part of the rubric). A hold-at-4 is the honest conservative
score — the rubric AAA(5) description ("three locked money shots; each tells a different story;
zero unintentional clipping") is technically met, but final AAA sign-off for cameras is
**deferred to TP9 final scorecard** where the full 15-element evaluation is performed against
the completed table.

See SCORECARD_TABLE_3D.md for the updated per-element status note.

## What shipped in TP7

### CONFIRMATION CAPTURES + METRICS (08-01)

Three GPU-faithful anchor captures on the finished TP1-TP6 table with ?fx and spin=off:
- `docs/table-3d/anchors/tp7-gate/card.png` — POV preset (?cam=card&fx)
- `docs/table-3d/anchors/tp7-gate/hero.png` — HERO preset (?cam=hero&fx)
- `docs/table-3d/anchors/tp7-gate/macro.png` — MACRO preset (?cam=macro&fx)

M9 double-capture: m9-hero-a.png + m9-hero-b.png (byte-identical, md5 02e4aa23…).
M1=80px at card-m1-1080p.png — PASS (3.6×). M2=3.66×(hero)/2.60×(card) — PASS.
TP0 preset values: ALL NINE CONFIRMED UNCHANGED.
`tools/table-3d/grep-check-tp7-08.cjs` authored (11 checks, exits 0).
`tools/table-3d/grep-check-tp6-07.cjs`: still exits 0 (8/8 backward compat).

### OPTIONAL ?fly FLYTHROUGH (08-02)

SHIPPED: `isFly`/`isFrozen`/`flyCamRef`/`useFrame` block added to TableLab.tsx.
9 new TypeScript code lines (budget ≤ 40). Amplitude 0.20wu. Frequency 0.22 rad/s. X-axis only.
Freeze guard: isFrozen=true when spin=off → useFrame no-op → M9 byte-identical.
Non-canonical, opt-in, does NOT affect any canonical preset or metric run.
grep-check-tp7-08 11/11 PASS. vitest 45/45. tsc src/lab/ 0 errors.
Commit 44c84d1.

## Outcome

**TP7 COMPLETE.** Cameras CONFIRMED LOCKED on the finished table. 0 changes to source code
camera presets. 0 corrections. 0 iterations. HERO fov:32 / POV-card fov:40 / MACRO fov:26
are the definitive money shots of the finished Chiribito table — confirmed at both the pre-gate
metric level (M1/M2/M9/grep-check) and the perceptual composition level (protagonist reads correct
on the upgraded scene). The `?fly` flythrough is a non-canonical opt-in extra that ships without
affecting any canonical preset.

**Eval framing is FINAL for TP9.**

**Next:** Phase 9 / TP8 — Tactilidad, micro-vida & lectura social (the FEEL).

*Recorded by the GSD autonomous loop at the TP7 operator gate, 2026-06-12.*
*Gate auto-approved under the operator's standing "auto-approve (0 paradas)" directive — green HARD
gates + orchestrator CEO visual read. Flagged for operator batch confirmation.*
