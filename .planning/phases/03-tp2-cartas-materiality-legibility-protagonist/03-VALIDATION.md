---
phase: 3
slug: tp2-cartas-materiality-legibility-protagonist
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-11
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

> Populated during planning — `gsd-planner` assigns plan/task IDs. Each lever-task maps to: **M1
> (always)** + the lever-specific metric. Template row:

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-0X-0Y | 0X | W | SSOT §TP2 | — | N/A (lab-only, not in prod build) | metric+unit | `vitest run src/lab/` + capture→M1/Mn | ❌ W0 | ⬜ pending |

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
- [ ] `nyquist_compliant: true` set in frontmatter (after planner populates the per-task map)

**Approval:** pending
