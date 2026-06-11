---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-06-11T10:00:00.000Z"
last_activity: 2026-06-11
progress:
  total_phases: 10
  completed_phases: 2
  total_plans: 10
  completed_plans: 10
  percent: 20
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-09)

**Core value:** The CARD is the absolute protagonist; premium via restraint & craft, NEVER money; the protected reference is never degraded.
**Current focus:** Phase 3 — TP2 — Cartas Materiality & Legibility (protagonist). Full-scene composition RECONCILED 2026-06-11 (operator ADOPTED the encuadre baseline; all 4 felt suit marks KEPT). Now opening TP2 card materiality on the adopted scene.

## Current Position

Phase: 3 (TP2 — Cartas Materiality & Legibility (protagonist)) — OPENING (encuadre reconciled; needs discuss → plan)
Plan: none yet (Phase 3 needs discuss → plan)
  (Phase 1 / TP0 ✅ COMPLETE — baseline frozen + signed off)
  (Phase 2 / TP1 ✅ COMPLETE — felt APPROVED 2026-06-10, shipped as the reference baseline)
  (Encuadre / full-scene composition ✅ RECONCILED 2026-06-11 — operator ADOPTED bigger-table + 5-board + smaller-cards + whole-hand as the new scene baseline; all 4 felt suit marks KEPT; diagnostic conjunto/social cams stay diagnostic → TP7; SeatHands stays opt-in → TP8; frozen money-shot pos/fov unchanged)
Status: Encuadre adopted (b2c9dd4 promoted WIP→baseline); Phase 3 TP2 card materiality now OPEN on the adopted scene. WATCH: CARD_W 2.4→2.05 shrank cards ~15% — M1 hole-card legibility must be re-measured FIRST and MUST NOT regress (TP2 hard gate).
Last activity: 2026-06-11

Progress: [██░░░░░░░░] 20% (2 of 10 phases)

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

Last session: 2026-06-11 (encuadre ADOPTED → Phase 3 / TP2 opened). Prior: 2026-06-10 (end-of-day encuadre checkpoint).
Stopped at: ENCUADRE / COMPOSITION EXPLORATION checkpoint (WIP, UNDECIDED). Phase 2 / TP1 was APPROVED + closed (0a47b59). The operator then asked for "encuadre primero" — a full-scene composition validation BEFORE TP2. Explored (all on spike, lab-only, diagnostic, behind flags where possible): diagnostic cameras conjunto/social (NOT money shots); opt-in multi-hand staging SeatHands (?seats=on, TP8 scope); ?marks=off felt-suit-mark gate; + GLOBAL levers FELT_R 5.2→6.5 (bigger table), CARD_W 2.4→2.05 (smaller cards), LAB_COMMUNITY→5-card board, HOLE_Z/LIFT/PITCH retuned (hand reads WHOLE + separated). 27/27 lab unit tests still green. Full record + exact values + captures index: docs/table-3d/ENCUADRE_CHECKPOINT_2026-06-10.md. GPU captures in .dev-stack/diag/table-3d/{tp1-fullscene,tp1-social}/ (scratch, local-only).
DECISIONS RESOLVED 2026-06-11: (1) composition direction = ADOPTED (bigger-table + 5-board + smaller-cards + whole-hand is the new scene baseline); (2) felt suit marks = MANTENER all 4 (identity; front Espada under the hand stays); (3) conjunto/social cameras = stay DIAGNOSTIC, not formalized (→ TP7, frozen-camera invariant); (4) SeatHands multi-hand = stay opt-in `?seats=on` → TP8; (5) → NOW opening TP2 (Cartas). The frozen money-shot CAMERA pos/fov + the TP1 felt MATERIAL are unchanged; TP1 not reopened. b2c9dd4 promoted WIP→adopted baseline.
Policy: operator AUTHORIZED a checkpoint push 2026-06-10 → spike pushed to origin/spike (carries TP1 + Phase 2 close + this WIP, previously all local). Still NO push to main, NO merge, NO deploy. Absolute isolation from feat/web-timeline-2026 maintained (only frontend/src/lab/ touched, guard-de-rama before every change).
Carried forward (non-blocking): M10→TP3 (instancing) · M1 rank-index ~17px legibility tweak · depth/AO/vignette → TP5/TP6 · dual 2D-classic/3D-immersive view-mode architecture is its own future workstream (memory: chiribito-table-dual-view-modes).
Branch: `spike/table-3d-hero`. CI note: build.yml + test-coverage.yml trigger ONLY on push/PR to main|develop — a spike push does NOT run CI (verified locally instead: frontend lab vitest 27/27 green; game/api unaffected by the lab-only edits). use_worktrees=false (GPU/dev-server → sequential).
Resume file: docs/table-3d/ENCUADRE_CHECKPOINT_2026-06-10.md
