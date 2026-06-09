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
- **Operator re-review (2026-06-09):** reviewed the regenerated evidence; no objections; delegated the remaining sub-decisions. **Verdict applied:** desktop M1 = PASS (all 6 items addressed on desktop); mobile-responsive = DEFERRED to a later pass (SSOT defers mobile-as-deliverable; the lab is the desktop reference); POV fov = KEPT at 40 (no un-blessed change; 37 remains a one-line option).
- **Iter 4 (operator follow-up — orbit + chips):** operator screenshot from the auto-rotated FAR side showed (a) cards upside down and (b) chips still intersecting. Root causes: (a) `OrbitControls` had `autoRotate` 360° with NO azimuth clamp → swung behind the board where player-oriented cards read upside down (physically unavoidable from the far side); (b) the iter-1 pot gap (~2.1 local × scale 0.62) left only ~0.06-world separation → stacks merged at grazing angles. **Fixes:** `autoRotate=false` + azimuth CLAMP to the readable front arc (±0.85 rad around the preset) → far side unreachable, default is a static hero front view; pot re-spaced to ~3.0 local @ scale 0.55 → clear ~0.5-world gaps, distinct stacks from every angle. Verified `m1-fix2/` (top + rail grazing + hero): chips distinct, cards readable + dominant.
- **Iter 5 (operator video — 5190, orbiting):** an 8s screen recording (frames in `op-video/`, extracted via ffmpeg-static) showed, on the operator's 5190 tab: chips still clustered/intersecting + the orbit reaching ugly low-grazing angles (table reads as a flat disc). Two findings: (a) my fresh harness captures of the SAME 5190 showed SEPARATED chips → the operator's BROWSER was serving CACHED/stale modules (HMR didn't fully apply) — needs a HARD refresh; (b) the iter-4 orbit clamp was too loose (`polar 0.45–1.45` allowed near-horizontal grazing; azimuth ±0.85 too wide). **Fixes:** orbit tightened to a flattering range only — `minPolarAngle 0.62`, `maxPolarAngle 1.12` (no grazing/top-down), azimuth ±0.5, distance 5–13; pot simplified to 3 clearly-separated short stacks @ scale 0.5 (no loose chip) → unambiguous gaps. Verified `m1-fix3/` (top + hero + rail = lowest reachable angle): chips distinct, table premium at every reachable angle.
- **Status:** ✅ desktop M1 refinement COMPLETE (clipping, chip-intersection, composition, orbit range all resolved). TP0 is ready for its baseline freeze (plan 01-06) — **awaiting the operator's explicit go** (persists the apples-to-apples baseline anchor; local + reversible, no push). Baseline still UNFROZEN. Optional: a gentle front-arc sway can restore "alive" motion within the readable arc (deferred unless the operator wants it now).

## Deferred to a later pass
- **Mobile-responsive camera:** portrait (and tight landscape) need aspect-aware camera framing (fov/distance by viewport aspect) so the wide card layout fits without side-clipping. Geometry is sound; this is camera-only. SSOT-deferred (mobile-as-deliverable → later program). Repro: `LAB_VP="390x844" LAB_DPR="3" LAB_URL=".../table-lab.html?cam=card" node .dev-stack/lab-shot.mjs out.png`.
