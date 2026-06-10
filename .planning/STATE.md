---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-06-10T17:35:00.000Z"
last_activity: 2026-06-10
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
**Current focus:** Phase 3 — TP2 — Cartas Materiality & Legibility (protagonist) — OPENS with the operator-requested full-scene composition validation (see Blockers/Concerns)

## Current Position

Phase: 3 (TP2 — Cartas Materiality & Legibility (protagonist)) — NEXT (not yet started)
Plan: none yet (Phase 3 needs discuss → plan)
  (Phase 1 / TP0 ✅ COMPLETE — baseline frozen + signed off)
  (Phase 2 / TP1 ✅ COMPLETE — felt APPROVED 2026-06-10, shipped as the reference baseline)
Status: Phase 2 closed; Phase 3 must reconcile the operator full-scene composition feedback before card micro-detail
Last activity: 2026-06-10

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

### Pending Todos

None yet.

### Blockers/Concerns

- **[OPERATOR STEER — Phase 3 priority, 2026-06-10]** At the TP1 gate the operator approved the felt AND asked (without reopening TP1) for a **full-scene composition validation BEFORE more local card detail**: the hand reads too cropped to judge composition, the table reads too partial/small; the cards must stay the absolute protagonist; the operator wants to verify the complete set first — full table + community cards + player hands + global composition + the camera↔table↔cards relationship. This is a camera-framing / composition / scene-completeness concern (roadmap-scoped to TP6/TP7/TP8) pulled EARLY, and it touches the **TP0-frozen-camera invariant**. Note the current lab scene stages ONE hand (the Perla) + community board + demoted pot — all 6 player hands are NOT staged (seats opt-in, TP8 scope). Phase 3 (TP2 — Cartas) MUST open by reconciling this (a full-scene validation capture/checkpoint, possibly a diagnostic wide camera that does NOT alter the frozen 3 money shots) before any card-stock micro-detail levers. Full record: docs/table-3d/TP1_OPERATOR_AB.md §forward feedback.
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

Last session: 2026-06-10T17:35:00.000Z
Stopped at: Phase 2 / TP1 CLOSED — operator A/B gate (02-04) APPROVED the felt; verdict recorded in docs/table-3d/TP1_OPERATOR_AB.md, 02-04-SUMMARY.md written, SCORECARD felt 3→4 (progression log), STATE + ROADMAP updated. Felt MeshPhysicalMaterial (sheen 0.70/#2aad7a/0.65, anisotropy 0.25, roughness 0.93, normalScale 0.25, aoMap 0.18) shipped as the reference baseline. M3 10.68 / M5 0% / +B 0% all PASS.
NEXT: Phase 3 (TP2 — Cartas Materiality & Legibility). Per explicit operator instruction, resume GSD Autonomous immediately — BUT Phase 3 must OPEN by reconciling the operator's full-scene composition feedback (full table + community + hands + global comp + camera↔table↔cards visible; cards stay protagonist; hand currently too cropped, table too partial) BEFORE any card-stock micro-detail. This is a camera/composition concern touching the TP0-frozen-camera invariant; likely needs a diagnostic wide-view validation capture (not altering the frozen 3 money shots) presented to the operator first.
Policy unchanged: still LOCAL — no push / merge / deploy.
Carried forward (non-blocking): M10→TP3 (instancing) · M1 rank-index ~17px legibility tweak · depth/AO/vignette → TP5/TP6 · dual 2D-classic/3D-immersive view-mode architecture is its own future workstream (memory: chiribito-table-dual-view-modes).
Branch: `spike/table-3d-hero` (== `claude/cranky-volhard-dd8b01`), all LOCAL commits (no push). use_worktrees=false (GPU/dev-server → sequential).
Resume file: None
