---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-06-10T14:23:47.034Z"
last_activity: 2026-06-10 -- Phase 2 execution started
progress:
  total_phases: 10
  completed_phases: 1
  total_plans: 10
  completed_plans: 6
  percent: 10
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-09)

**Core value:** The CARD is the absolute protagonist; premium via restraint & craft, NEVER money; the protected reference is never degraded.
**Current focus:** Phase 2 — TP1 — Felt / Tapete Materiality (the stage)

## Current Position

Phase: 2 (TP1 — Felt / Tapete Materiality (the stage)) — EXECUTING
Plan: 1 of 4
  (Phase 1 / TP0 ✅ COMPLETE — baseline frozen + signed off)
Status: Executing Phase 2
Last activity: 2026-06-10 -- Phase 2 execution started

Progress: milestone 1/10 phases complete · Phase 2 planning not yet started

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

### Pending Todos

None yet.

### Blockers/Concerns

- **[RESOLVED 2026-06-10 — TP0 FROZEN]** The M1 gate (re-run 2026-06-10) PASSED after two operator-found pre-freeze fixes (hole-pair z-fighting → height stagger; As de Espadas asset rotated 180° → restored canonical, single-origin for 2D+3D). Baseline freeze (plan 01-06) ran and the operator signed off ("Baseline locked"). POV fov LOCKED at 40 (37 discarded). M12 zero-change CLOSED. Scorecard baselined (avg ≈ 3.4).
- **[CARRIED FORWARD — non-blocking]** M10 draw-calls over ceiling → TP3 (instancing); M1 rank-index ~17px legibility note → future tweak; depth/AO/vignette → TP5/TP6; the dual 2D-classic / 3D-immersive view-mode architecture → its own future workstream (memory: chiribito-table-dual-view-modes).
- **[INVARIANT]** NO push / deploy / merge without explicit operator confirmation (Chiribito manual-deploy policy, Vercel team `chiribito293-7173`). Atomic LOCAL commits only.
- **[OPERATIONAL — session rooting]** The GSD autonomous loop + its skills are repo-root-relative (verified: workflows use relative `.planning/` paths). To run the loop reliably the session MUST be rooted at `Documents\CHIRIBITO\chiri-infrastructure\chiri-app`, not the home folder. Bootstrap was done with absolute paths + SDK validation; execution needs repo rooting.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Mobile | Responsive camera framing — portrait/tight-landscape side-clip the wide card layout; needs aspect-aware fov/distance. Geometry sound, camera-only. | Deferred | 2026-06-09 (M1 refinement; SSOT defers mobile-as-deliverable) |

## Session Continuity

Last session: 2026-06-10T13:04:08.891Z
Stopped at: Phase 2 (TP1) context gathered — ready to plan
Two pre-freeze fixes (operator-found at the M1 gate, all LOCAL): hole-pair z-fighting → along-normal height stagger (HOLE_STACK 0.10, commit 57a4da6); As de Espadas asset was rotated 180° → restored pristine canonical, single-origin fix for 2D (DOM+Pixi) + 3D (commit 70bb7de); anchors re-captured (56520a1); freeze package (21aba04).
Phase 2 (TP1 — Felt materiality): **operator AUTHORIZED 2026-06-10**; discuss-phase done → `02-CONTEXT.md` (D-01 nap concentric/oval · D-02 sheen ~0.65–0.75 anti-satin · D-03 edge-darkening very subtle · D-04 MACRO inlay sharper · D-05 no-Vegas). Next: plan Phase 2 (`/gsd-plan-phase 2`). Still LOCAL — no push/merge/deploy. Do NOT execute TP1 code changes until the PLAN is reviewed by the operator.
Carried forward (non-blocking): M10→TP3 (instancing) · M1 rank-index ~17px legibility tweak · depth/AO/vignette → TP5/TP6 · dual 2D-classic/3D-immersive view-mode architecture is its own future workstream (memory: chiribito-table-dual-view-modes).
Branch: `spike/table-3d-hero` (== `claude/cranky-volhard-dd8b01`), all LOCAL commits (no push). use_worktrees=false (GPU/dev-server → sequential).
Resume file: .planning/phases/02-tp1-felt-tapete-materiality-the-stage/02-CONTEXT.md
