# M1 Refinement — pre-TP0-freeze (operator-gated)

**Opened:** 2026-06-09 · **Why:** the TP0.0 on-device operator gate did NOT approve the baseline freeze. M1 improved a lot and the direction is right, but the operator flagged real visual artifacts to fix BEFORE freezing TP0 and BEFORE advancing to TP1 (SSOT: "never proceed on a failed M1 read"). This is the TP0.0 precondition work — the baseline (plan 01-06) stays UNFROZEN until M1 passes a fresh review.

**Scope (EXCLUSIVELY these — no TP1 materiality, no redesign, no new geometry, identity preserved):**
1. Eliminate card clipping.
2. Eliminate chip intersections.
3. Improve spacing & composition.
4. Review ALL money shots.
5. Validate desktop AND mobile.
6. Cards dominate without visual artifacts.

**Operator decisions (2026-06-09):** composition of the hole pair → *operator will choose from 2-3 variants I generate*; execution → *hands-on iterative (capture→adjust→recapture) with evidence checkpoints*, GSD-tracked here.

---

## Diagnosis — root causes (found in code + diagnostic captures)

| # | Artifact | Root cause (code) | Fix lever |
|---|----------|-------------------|-----------|
| ① | Hole cards cut off (bottom edge) in POV/close | `cards.ts`: hole pair at `HOLE_Z=3.95` (hard against the player edge), lifted `HOLE_LIFT=0.46` (~26°), large (2.4×3.41) → near edge clips the frame bottom + crowds the rail | pull hole pair back (`HOLE_Z`), ease lift, re-verify framing across presets — keep cards dominant |
| ② | Chips intersect / read as a mess | `TableLab.tsx` demoted pot `group[2.7,0,1.5] scale .66`: stack centers ~0.5–0.6 apart in LOCAL space but chip radius `R=1` → stacks interpenetrate (C@-0.5 vs E@0.08 = 0.58 < 1) + per-chip jitter | re-space stacks ≥ ~2.1 apart (tidy non-intersecting cluster), keep pot demoted/compact |
| ③ | Hole pair overlaps heavily / pot crowds right card | `HOLE_PITCH=1.584` (heavy overlap); pot at x≈2.7 can graze the rightmost community card | tune hole pitch/fan (VARIANTS); nudge pot clear of the right card |
| ④ | Some elements not "settled" | per-chip jitter + the loose O chip; verify contact-shadow grounding | reduce jitter if needed; confirm M6 contact-shadow under each object |

**Constraints carried:** zero redesign · reuse Fournier faces (never redraw) · cards-as-protagonist (M1) + cards-vs-chips ≥2× (M2) must hold · anti-casino · no push/deploy · local commits only. The TP0 metric SCRIPTS stay valid (scene-agnostic); only the baseline frames + region rects get re-authored in plan 01-06 AFTER this refinement (they were never frozen).

---

## Iteration log

- **Iter 0 (baseline of the issue):** captured HERO/POV/MACRO + top/close/wide at the current scene → confirmed ① clipping (close/pov), ② chip intersection (top), ③ overlap. Diag frames in `.dev-stack/diag/table-3d/tp0-gate/`.
- **Iter 1 (mechanical fixes):** `HOLE_Z 3.95→3.35`, `HOLE_LIFT 0.46→0.42` (anti-clipping); demoted pot re-spaced to a tidy non-intersecting cluster (`group[2.9,0,1.45] scale .62`, stack centers ≥~2.1 apart, loose chip clear), nudged x 2.7→2.9 to clear the right community card. **Result:** ① clipping RESOLVED in the money shots (HERO/POV/MACRO); ② chip intersection RESOLVED (top-down shows 3 distinct stacks). Diag in `.dev-stack/diag/table-3d/m1-iter1/`.
- **Iter 2 (composition variants → operator pick):** made `holeLayout` accept `HoleOpts` (pitch/fan/z/lift; cards.ts stays pure, TableLab passes `?hpitch/?hfan/?hz/?hlift`, default = baked). Generated 3 POV+HERO variants (A íntimo 1.45/0.22 · B balanced 1.75/0.14 · C open 2.05/0.08) in `m1-variants/`. **Operator picked B (balanced).** Baked `HOLE_PITCH=CARD_W*0.73 (≈1.75)`, `HOLE_FAN=0.14`. Final desktop set in `m1-final/` — money shots clean, cards dominate, fichas distintas.
- **Iter 3 (mobile validation):** added env-driven viewport to the (gitignored) harness (`LAB_VP`/`LAB_DPR`; default desktop 1440×900 DPR2 unchanged). Captured portrait 390×844 + landscape 844×390 in `m1-mobile/`. **FINDING:** portrait clips the cards at the SIDES — the camera presets are framed for desktop landscape (aspect 1.6); at portrait (aspect 0.46) the narrow horizontal FOV overflows the wide card layout. **Geometry is sound; this is a responsive-camera matter.** Scope is an operator call (SSOT defers mobile-as-deliverable to a later program; the lab is the desktop reference). No errors at any viewport; R3F clamps dpr to [1,2] (real mobile behavior).
- **Status:** desktop money shots ready for the operator's pre-freeze re-review; mobile-responsive scope pending operator decision. Baseline still UNFROZEN.
