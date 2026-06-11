---
phase: 3
slug: tp2-cartas-materiality-legibility-protagonist
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-11
approved: 2026-06-11
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. TP2 is perceptual 3D
> material work: validation is **lab unit tests + the frozen TP0 metric rig + the operator A/B
> gate**, NOT a conventional unit-test pyramid. One perceptual variable per gate; STOP-on-ambiguous.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (frontend lab unit tests) + frozen TP0 metric rig (Playwright GPU capture + `metrics.mjs`) + operator perceptual A/B gate |
| **Config file** | `frontend/` (Vitest); metric rig scripts per `03-RESEARCH.md` (`metrics.mjs`, capture harness) |
| **Quick run command** | `cd frontend && npx vitest run src/lab/` (geometry + determinism invariants; baseline 27/27 green) |
| **Full suite command** | lab Vitest + metric capture at the 3 frozen money shots (`card`/`hero`/`macro`) → M1/M2/M5/M6/M9 |
| **Estimated runtime** | lab Vitest ~seconds; GPU metric capture ~minutes (sequential, `use_worktrees=false`) |

---

## Sampling Rate

- **After every task commit:** `cd frontend && npx vitest run src/lab/` — geometry/determinism invariants must stay green (`HOLE_PITCH < CARD_W`, `HOLE_Z > 2`, deterministic jitter).
- **After every LEVER** (legibility-first sequence): capture at `card`/`hero`/`macro` + **re-run M1** (legibility — the always-on gate) PLUS the lever's target metric (M5 for clearcoat highlight-clip, M6 for contact-shadow, M9 byte-determinism for dealt variance).
- **Before the operator gate:** M1 NOT regressed vs `tp2-base`; M2 cards-vs-chips ≥ 2×; all admitted metrics green at the locked shots.
- **Max feedback latency:** lab Vitest seconds; metric capture minutes.

---

## Per-Task Verification Map

> Each lever-task maps to **M1 (always-on)** + the lever-specific metric. Threat ref `—` / secure
> behavior `N/A` throughout (lab-only render, no untrusted input, not in prod build). `File Exists`
> = ❌ W0 means the metric/baseline tooling is produced/recalibrated in Wave 0 (plan 03-01).

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | §TP2 rollback tag + tp2-base + M1 floor | infra | `git tag --list tp2-before-cards` + node file-exists check | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | §TP2 M6 rect recalibration | metric | `node run-metrics.mjs --meta-gate` + content check | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | §TP2 L1 anisotropy max + M1 | unit | `vitest run src/lab/` + `tsc --noEmit` + grep gate (no hardcoded 16) | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | §TP2 L2 seam fix + M1 | unit | `vitest run src/lab/` + `tsc --noEmit` + grep gate (CARD_CORNER 0.17) | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | §TP2 L3 micro-relief + M1 | unit | `vitest run src/lab/` + `tsc --noEmit` + grep gate (NoColorSpace, single-instance) | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 3 | §TP2 L4 clearcoat + M1/M5 | unit | `vitest run src/lab/` + `tsc --noEmit` + grep gate (clearcoat 0.12 cap) | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 4 | §TP2 L5 paper-edge + M1 | unit | `vitest run src/lab/` + `tsc --noEmit` + grep gate (no transmission) | ❌ W0 | ⬜ pending |
| 03-04-02 | 04 | 4 | §TP2 L6 dealt variance + M9 | tdd | `vitest run src/lab/` (≤0.026 rad bound test) + grep gate (no Math.random) | ❌ W0 | ⬜ pending |
| 03-05-01 | 05 | 5 | §TP2 L7 contact-shadow + M6 | unit | `vitest run src/lab/` + `tsc --noEmit` + grep gate (1 shadow light; no SoftShadows/N8AO/EffectComposer) | ❌ W0 | ⬜ pending |
| 03-05-02 | 05 | 5 | §TP2 pre-gate ledger M1/M2/M5/M6/M9/M12 | metric | `node run-metrics.mjs` + `m1-m2-m12.mjs --zero-change` vs tp2-base | ❌ W0 | ⬜ pending |
| 03-06-01 | 06 | 6 | §TP2 operator A/B gate | manual | checkpoint:human-verify (POV+MACRO A/B; revert offending `?card=` lever) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] **tp2-base baseline capture** — `card.png`/`hero.png`/`macro.png` of the ADOPTED scene at the 3
      frozen shots → `docs/table-3d/anchors/tp2-base/` (the apples-to-apples delta basis;
      `docs/table-3d/anchors/{head,reference-tag}/` stay IMMUTABLE).
- [ ] **M1 re-measure** on the adopted scene — establish the post-encuadre legibility floor BEFORE
      any lever (smaller cards, CARD_W 2.05).
- [ ] **M6 region-rect recalibration check** — RESEARCH flagged `REGIONS.underCardHero` was calibrated
      on the TP0 scene (CARD_W 2.4, HOLE_Z ~3.35); with CARD_W 2.05 / HOLE_Z 2.3 it may no longer land
      under a hole card. Verify/recalibrate before M6 can be trusted.
- [ ] Lab Vitest framework present (it is — 27/27 baseline green).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| "Physical printed card STOCK while razor-legible?" | SSOT §TP2 perceptual gate | Perceptual identity judgment — no automated proxy for "stock vs plastic/laminated" | Operator A/B at POV(`card`) + MACRO: `?card=off` vs each lever on. STOP-on-ambiguous: any legibility loss OR more plastic/laminated → STOP + revert that lever (non-blocking, flag). |

---

## Validation Sign-Off

- [ ] All tasks have an automated verify (lab Vitest and/or metric capture) or a Wave 0 dependency
- [ ] Sampling continuity: M1 re-checked after EVERY lever (no lever ships without a legibility check)
- [ ] Wave 0 covers tp2-base capture + M1 floor + M6 rect recalibration
- [ ] No watch-mode flags (captures run under the frozen capture flag, M9 determinism holds)
- [x] `nyquist_compliant: true` set in frontmatter (per-task map populated 2026-06-11)

**Approval:** approved 2026-06-11 — plan-checker VERIFICATION PASSED (6/6 plans, 0 blockers); per-task map populated. `wave_0_complete` flips true after plan 03-01 executes.
