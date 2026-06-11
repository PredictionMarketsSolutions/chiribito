---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
last_updated: "2026-06-11T16:40:00Z"
last_activity: 2026-06-11
progress:
  total_phases: 10
  completed_phases: 2
  total_plans: 16
  completed_plans: 12
  percent: 20
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-09)

**Core value:** The CARD is the absolute protagonist; premium via restraint & craft, NEVER money; the protected reference is never degraded.
**Current focus:** Phase 3 — TP2 — Cartas Materiality & Legibility (protagonist). Full-scene composition RECONCILED 2026-06-11 (operator ADOPTED the encuadre baseline; all 4 felt suit marks KEPT). Now opening TP2 card materiality on the adopted scene.

## Current Position

Phase: 3 (TP2 — Cartas Materiality & Legibility (protagonist)) — EXECUTING (plan 03-03 COMPLETE; 3/6 plans done)
Plan: 6 plans (03-01…03-06), 6 SEQUENTIAL waves (one perceptual variable per gate; legibility-first). plan-checker VERIFICATION PASSED (0 blockers, 2 doc-warnings closed). discuss✅ + plan✅ 2026-06-11. Operator gate = 03-06 (autonomous:false). COMPLETED: Wave 0 (03-01) — rollback tag + tp2-base captures + M1 floor 9px + M6 rects recalibrated 20.8% PASS. COMPLETED: Wave 1 (03-02) — Lever 1 max-anisotropy via useThree + mipmap explicit + Lever 2 seam already clean. COMPLETED: Wave 2 (03-03) — Lever 3 cardMicroReliefNormalMap (normalScale 0.12) + Lever 4 clearcoat whisper 0.12/0.55. NEXT = Wave 3 lever (03-04: paper-edge warm sheen-rim).
  (Phase 1 / TP0 ✅ COMPLETE — baseline frozen + signed off)
  (Phase 2 / TP1 ✅ COMPLETE — felt APPROVED 2026-06-10, shipped as the reference baseline)
  (Encuadre / full-scene composition ✅ RECONCILED 2026-06-11 — operator ADOPTED bigger-table + 5-board + smaller-cards + whole-hand as the new scene baseline; all 4 felt suit marks KEPT; diagnostic conjunto/social cams stay diagnostic → TP7; SeatHands stays opt-in → TP8; frozen money-shot pos/fov unchanged)
  (Plan 03-01 ✅ COMPLETE 2026-06-11 — Wave-0 foundation: tp2-before-cards tag@22017ee + tp2-base anchors + M1 floor=9px + M6 rects recalibrated; commits 048df10 + 3e2c505)
  (Plan 03-02 ✅ COMPLETE 2026-06-11 — Lever 1: maxAniso via useThree (Math.min(getMaxAnisotropy(),16)); ?card=base A/B; mipmaps explicit. Lever 2: seam already clean — no geometry edit. M1 floor held 32px >= 9px; commit 7d9b31d)
  (Plan 03-03 ✅ COMPLETE 2026-06-11 — Lever 3: cardMicroReliefNormalMap (NoColorSpace, single instance, normalScale 0.12, repeat 2×3); Lever 4: clearcoat 0.12/clearcoatRoughness 0.55 on stock + faceMat; M1=31px>=9px PASS; M5=0%/0% PASS; commits 327102e + a0d0f17)
Status: TP2 Wave-2 COMPLETE. Lever 3 (card-stock micro-relief normal, NoColorSpace, normalScale 0.12) + Lever 4 (clearcoat whisper 0.12/0.55, coated-not-plastic) both shipped. M1 = 31px (floor held); M5 = 0%/0% (no highlight clip, identical to tp2-base). No plastic/laminated STOP triggered. ?card=base restores full pre-TP2 A/B. Next: Wave 3 (03-04 — paper-edge warm sheen-rim: sheen 0.22→0.35, sheenColor warmer).
Last activity: 2026-06-11

Progress: [███████░░░] 69%

## Performance Metrics

**Velocity:**

- Total plans completed: 1
- Average duration: 4 min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 1 (TP0) | 1/6 | 4 min | 4 min |

**Recent Trend:**

- Last 5 plans: Plan 01-01 (4 min)
- Trend: —

*Updated after each plan completion*
| Phase 01-tp0-eval-rig-baseline-blocking P02 | 12 min | - tasks | - files |
| Phase 1 P3 | 38 min | 2 tasks | 9 files |
| Phase 1 P04 | 12 min | 2 tasks | 15 files |
| Phase 02 P02 | 6 | 3 tasks | 1 files |
| Phase 02 P03 | 8 | 2 tasks | 1 files |
| Phase 02 P04 | 1 | 1 task (operator gate) | 2 files |
| Phase 3 P01 | 150 | 2 tasks | 5 files |
| Phase 3 P02 | 45 | 2 tasks | 1 files |

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table. Most relevant to current work:

- SSOT = `docs/ROADMAP_TABLE_3D_PERFECTION.md`; this `.planning/` is only an orchestration index (doc wins on conflict).
- TP0→TP9 mapped to GSD Phase 1→10 (Phase = TP + 1); each phase name carries "TPx".
- Each phase's operator perceptual gate is a HUMAN verification checkpoint — the GSD↔Chiribito integration seam (combine, don't replace).
- Cameras frozen at TP0; MSE-as-SSIM-proxy + px-height+manual legibility; ALL crevice AO owned by TP6.
- Plan 01-01: Rollback tag cut at pre-edit HEAD (f807d6f) before any edits — SSOT §5.3.
- Plan 01-01: Tracked rig dirs created in wave-1 so wave-3 plans 03/04 only WRITE (no race on creation).
- Plan 01-01: Harness restored by single-file copy from main checkout (not re-authored).
- Plan 01-01: Smoke PNGs in gitignored .dev-stack/diag/ scratch only — baseline freeze deferred to plan 06.
- [Phase ?]: Plan 01-02: StatsProbe returns null, zero-visual-change proven via md5 (3b7480d7d1a9bab8c6f015637fe93b79); POV fov 40 recorded verbatim; fov-37 deferred to plan-05 operator gate; SCORECARD_TABLE_3D.md baseline column uses _TP0_ placeholders
- [Phase ?]: Plan 01-03: 6 T1 metrics ADMITTED (M3/M4/M5/M6/+B/M10) via +/- control-frame meta-gate; M8/+A informational (cannot pass good control on TP0 baseline -- restrained 8-20% warm vignette is a TP6 deliverable)
- [Phase ?]: Plan 01-03: M10 read via drawElements/drawArrays wrapper (stats-read.mjs), not StatsProbe gl.info (stale 1 under headless rAF throttle); StatsProbe left frozen. Honest baseline HERO 237 / MACRO 195 / chips=full 637 -- all OVER ceiling (TP3 instances pot)
- [Phase ?]: Plan 01-03: metric rects calibrated vs REAL HERO capture (felt @760,500 ΔE 8.5; brass @1240,820 aged-brass not court-card gold); control corpus committed downscaled 640w (0.3 MB)
- [Phase 1]: Plan 01-04: M9/M7/M12 integrity metrics ADMITTED via red-team meta-gate (M9 md5 byte-identity, M7 grep frontend/src/lab=0 matches + halo, M12 regional MSE=0 vs HEAD)
- [Phase 1]: Plan 01-04: zero-visual-change PROVEN -- fresh capture byte-identical to HEAD baseline, M12 MSE=0 on FOV-INVARIANT regions (HERO fov32 + MACRO fov26); POV-region M12 DEFERRED to plan 06 (POV fov locked plan 05)
- [Phase 1]: Plan 01-04: M1 (px-height>=22px + requiresOperatorConfirm, no OCR) and M2 (cards-vs-chips>=2.0x, manual-polygon fallback) recorded informational with operator/manual seam -- not auto-admitted
- [Phase 1]: Plan 01-04: M12 churn floor=1.0 MSE; reused plan 01-03 sharp helpers (metrics.mjs) WITHOUT modifying them; integrity ledger separate (METRICS_ADMISSION_INTEGRITY.md)
- [Phase ?]: D-03 aoMap path (A1-uv1): feltEdgeAoMap gray() LINEAR, no uv2 needed, wire aoMap + aoMapIntensity 0.18 in 02-03
- [Phase ?]: Plan 02-03: felt MeshPhysicalMaterial with sheen 0.70/#2aad7a/0.65, anisotropy 0.25, roughness 0.93, normalScale 0.25 — M3/M5/+B all PASS on first capture, zero tuning iterations
- [Phase 2]: Plan 02-04 (OPERATOR GATE): TP1 felt **APPROVED / ship** — operator accepted the current felt as the reference baseline for TP2+, 0 iterations, no rollback. felt scorecard 3→4 (meets ≥4 target; AAA(5)→TP9). Recorded: docs/table-3d/TP1_OPERATOR_AB.md.
- [Phase 2→3 STEER]: Operator forward feedback at the TP1 gate (does NOT reopen TP1): cards stay the absolute protagonist · the hand must read complete (too cropped now) · the whole table must be visible (too partial/small now) · WANTS a full-scene composition validation (table + community + hands + global comp + camera↔table↔cards) BEFORE more local detail. Camera/composition concern (roadmap TP6/TP7/TP8) pulled EARLY; touches the TP0-frozen-camera invariant. Reconcile at the start of Phase 3.
- [Phase 3 OPEN — encuadre RESOLVED 2026-06-11]: Operator ADOPTED the full-scene composition exploration as the new scene baseline (Q1=Adopt): FELT_R 5.2→6.5, CARD_W 2.4→2.05, LAB_COMMUNITY 3→5-card board, HOLE_Z/LIFT/PITCH retuned (whole separated hand). Felt suit marks (Q2)=MANTENER all 4 (identity; front Espada under the hand stays). Cameras conjunto/social stay DIAGNOSTIC (formalization → TP7, frozen-camera invariant). SeatHands multi-hand stays opt-in `?seats=on` → TP8. Frozen money-shot pos/fov UNCHANGED (only scene content adopted). → NOW: TP2 card materiality. Record: docs/table-3d/ENCUADRE_CHECKPOINT_2026-06-10.md §DECISIONS.
- [Phase 3]: Plan 03-01: M1 FLOOR = 9px (1728x1080 POV downscale of POV/card frame; rank-glyph "10" spans rows 513-521; below 22px target — expected after CARD_W 2.4→2.05 shrink); TP2 hard gate = no lever may go below 9px; operator confirm at plan 03-06. requiresOperatorConfirm=TRUE always.
- [Phase 3]: Plan 03-01: M6 RECALIBRATED — old rects {left:360,top:1230}/{left:360,top:1090} now sample open felt on adopted CARD_W 2.05 scene (7.55% FAIL); new rects {left:420,top:1120}/{left:420,top:1310} land on real contact-shadow gradient (20.8% PASS ≥12% gate); metrics.mjs REGIONS updated. Meta-gate shows informational (pre-existing: good-control frame never committed at TP0); M6 admission stands in METRICS_ADMISSION.md.
- [Phase 3]: Plan 03-01: tp2-before-cards rollback tag cut at 22017ee (not 045f748 as plan estimated — 3 docs-only commits intervened; tag still pre-card-edit and correct). LOCAL only, never pushed/deleted.
- [Phase 3]: Plan 03-01: tp2-base anchors = 3 × 1280x800 PNGs (card/hero/macro) of adopted scene at frozen money shots; these are the apples-to-apples delta basis for lever plans 03-02 thru 03-05 (NOT head/ which is the old scene).
- [Phase 3]: Plan 03-02: Lever 1 — maxAniso = Math.min(gl.capabilities.getMaxAnisotropy(), 16) via useThree in Scene; passed to useCardFaces(); ?card=base=pre-TP2 aniso 8; otherwise maxAniso. Mipmaps explicit (minFilter + generateMipmaps). Commit 7d9b31d.
- [Phase 3]: Plan 03-02: Lever 2 — SEAM ALREADY CLEAN at tp2-base/macro (fov26). No cream rim, no z-fight halo. bevelSegments stays 2; CARD_FACE_Z = 0.071 sufficient; no geometry edit. CARD_CORNER 0.17 + curveSegments 14 locked.
- [Phase 3]: Plan 03-02: M1 re-measured post-levers = 32px (1728x1080 POV downscale, rows 508-539; >= 9px floor; no regression). Anisotropy sharpens oblique texture quality, not glyph px-height — visually inspect full-res captures at .dev-stack/diag/table-3d/tp2/lever1-aniso/ for crispness delta.
- [Phase 3]: Plan 03-03: Lever 3 — cardMicroReliefNormalMap() added to textures.ts (S=256, linen crosshatch freq=18, hx*0.6+hy*0.4 horizontal bias, heightToNormalMap Sobel, toNormalMapTexture NoColorSpace, repeat 2×3); created ONCE in useCardKit (not per-Card — Pitfall 5); normalScale Vector2(0.12,0.12) on stock body; faceMat intentionally unchanged. Commits 327102e (Lever 3) + a0d0f17 (Lever 4).
- [Phase 3]: Plan 03-03: Lever 4 — clearcoat 0.16→0.12 / clearcoatRoughness 0.5→0.55 on stock body; faceMat clearcoat 0.1→0.12 for consistency. Both levers gated behind same ?card= flag: ?card=base restores full pre-TP2 A/B (stock 0.16/0.5, face 0.1, no relief normal). Active values all within SSOT 0.12-0.18 range. Sheen/sheenColor unchanged (lever 5 scope).
- [Phase 3]: Plan 03-03: M1 = 31px post-levers 3+4 (floor 9px held; advisory PASS). M5 highlight-clip = feltClipPct 0% / frameClipPct 0% (identical to tp2-base baseline — no over-clearcoat flare; plastic/laminated STOP criterion not triggered).

### Pending Todos

None yet.

### Blockers/Concerns

- **[RESOLVED 2026-06-11 — ENCUADRE ADOPTED]** (Was: OPERATOR STEER — Phase 3 priority.) Resolution: operator ADOPTED the full-scene composition baseline (bigger-table + 5-board + smaller-cards + whole-hand) and chose to KEEP all 4 felt suit marks; conjunto/social cams stay diagnostic → TP7; SeatHands → TP8; frozen money-shot pos/fov untouched. TP2 is unblocked and opens on the adopted scene. Original steer, for the record: at the TP1 gate the operator approved the felt AND asked (without reopening TP1) for a **full-scene composition validation BEFORE more local card detail**: the hand reads too cropped to judge composition, the table reads too partial/small; the cards must stay the absolute protagonist; the operator wants to verify the complete set first — full table + community cards + player hands + global composition + the camera↔table↔cards relationship. This is a camera-framing / composition / scene-completeness concern (roadmap-scoped to TP6/TP7/TP8) pulled EARLY, and it touches the **TP0-frozen-camera invariant**. Note the current lab scene stages ONE hand (the Perla) + community board + demoted pot — all 6 player hands are NOT staged (seats opt-in, TP8 scope). Phase 3 (TP2 — Cartas) MUST open by reconciling this (a full-scene validation capture/checkpoint, possibly a diagnostic wide camera that does NOT alter the frozen 3 money shots) before any card-stock micro-detail levers. Full record: docs/table-3d/TP1_OPERATOR_AB.md §forward feedback.
- **[WATCH — Phase 3 TP2, hard gate not blocker]** CARD_W 2.4→2.05 shrank the cards ~15%; with the pre-existing ~17px rank-index legibility note, TP2 MUST re-measure M1 hole-card legibility on the adopted scene as its FIRST step and MUST NOT regress it (SSOT §TP2: legibility loss → STOP/revert that lever). TP2's max-anisotropy + mipmap crispness is the lever expected to defend legibility. ALSO open for Phase 3 discuss: how to reconcile the TP0 anchor corpus with the new composition (frozen TP0 anchors were captured on the OLD scene) — the apples-to-apples basis for TP2 metric deltas needs a decision (re-baseline post-encuadre vs. compare-to-current).
- **[RESOLVED 2026-06-10 — TP0 FROZEN]** The M1 gate (re-run 2026-06-10) PASSED after two operator-found pre-freeze fixes (hole-pair z-fighting → height stagger; As de Espadas asset rotated 180° → restored canonical, single-origin for 2D+3D). Baseline freeze (plan 01-06) ran and the operator signed off ("Baseline locked"). POV fov LOCKED at 40 (37 discarded). M12 zero-change CLOSED. Scorecard baselined (avg ≈ 3.4).
- **[RESOLVED 2026-06-10 — TP1 SHIPPED]** Phase 2 / TP1 felt materiality APPROVED by the operator at the 02-04 gate; felt MeshPhysicalMaterial (sheen/nap/aniso/aoMap) shipped as the reference baseline. 0 iterations, no rollback. M3/M5/+B green. felt 3→4.
- **[CARRIED FORWARD — non-blocking]** M10 draw-calls over ceiling → TP3 (instancing); M1 rank-index ~17px legibility note → future tweak; depth/AO/vignette → TP5/TP6; the dual 2D-classic / 3D-immersive view-mode architecture → its own future workstream (memory: chiribito-table-dual-view-modes).
- **[INVARIANT]** NO push / deploy / merge without explicit operator confirmation (Chiribito manual-deploy policy, Vercel team `chiribito293-7173`). Atomic LOCAL commits only.
- **[OPERATIONAL — session rooting]** The GSD autonomous loop + its skills are repo-root-relative (verified: workflows use relative `.planning/` paths). To run the loop reliably the session MUST be rooted at `Documents\CHIRIBITO\chiri-infrastructure\chiri-app`, not the home folder. Bootstrap was done with absolute paths + SDK validation; execution needs repo rooting.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Mobile | Responsive camera framing — portrait/tight-landscape side-clip the wide card layout; needs aspect-aware fov/distance. Geometry sound, camera-only. | Deferred | 2026-06-09 (M1 refinement; SSOT defers mobile-as-deliverable) |

## Session Continuity

Last session: 2026-06-11T16:40:00Z
Stopped at: Plan 03-03 COMPLETE — TP2 Levers 3+4. Lever 3 (cardMicroReliefNormalMap, normalScale 0.12) at commit 327102e; Lever 4 (clearcoat 0.12/0.55) at commit a0d0f17. M1=31px; M5=0%/0%. SUMMARY at .planning/phases/03-tp2-cartas-materiality-legibility-protagonist/03-03-SUMMARY.md. A/B captures at .dev-stack/diag/table-3d/tp2/lever3-relief/ and lever4-clearcoat/ (LOCAL, gitignored scratch).
Next: Plan 03-04 — Wave 3 lever (paper-edge warm sheen-rim: sheen 0.22→0.35, sheenColor warmer to wheat).
Carried forward (non-blocking): M10→TP3 (instancing) · depth/AO/vignette → TP5/TP6 · dual 2D-classic/3D-immersive view-mode → own workstream (memory: chiribito-table-dual-view-modes).
Branch: `spike/table-3d-hero`. CI note: spike push does NOT run CI (verified locally: 27/27 green). use_worktrees=false (GPU/dev-server → sequential). NO push/deploy/merge without explicit operator confirmation.
Resume file: None
