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
- **Iter 1 (mechanical fixes):** pull hole pair back + ease lift (anti-clipping); re-space the demoted pot to a non-intersecting cluster. _(capturing to verify…)_
