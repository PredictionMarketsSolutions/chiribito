---
phase: 4
slug: tp3-fichas-materiality-perf-accent-instancing
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-11
approved: 2026-06-11
---

# Phase 4 — Validation Strategy

> TP3 has TWO validation modes: an OBJECTIVE perf gate (M10, the instancing must-ship-or-revert) + a
> PERCEPTUAL gate (de-Vegas materiality + hierarchy, operator A/B). Validation = lab Vitest + the frozen
> TP0 metric rig (M10/M2/MACRO-chip) + the operator gate.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (lab unit tests) + frozen TP0 metric rig (M10 via `tools/table-3d/stats-read.mjs`; M2 via `m1-m2-m12.mjs`; MACRO chip-quality) + operator A/B gate |
| **Config file** | `frontend/` (Vitest); metric scripts per `04-RESEARCH.md` |
| **Quick run command** | `cd frontend && npx vitest run src/lab/` |
| **Full suite command** | lab Vitest + `node tools/table-3d/stats-read.mjs http://localhost:<port> hero` (M10) + M2 + MACRO chip capture |
| **Estimated runtime** | lab Vitest ~seconds; GPU capture + draw-count read ~minutes (sequential) |

---

## Sampling Rate

- **After every task commit:** `cd frontend && npx vitest run src/lab/` — geometry/determinism invariants stay green.
- **After INSTANCING (must-ship gate):** run M10 at HERO + `?chips=full` (`stats-read.mjs`) — demoted-pot ≤ ~10 draws, `?chips=full` < 220; **strict visual PARITY** (MACRO chip capture vs tp3-base — any look change = regression). If perf is NOT net-positive OR parity breaks → REVERT instancing (must-ship-or-revert).
- **After DE-VEGAS:** M2 cards-vs-chips ≥ 2× holds; chips recede (no longer 2nd-brightest/most-saturated after cards); MACRO chip quality ≥ baseline. If chips read plastic / pull the eye → STOP + revert (non-blocking).
- **Before the operator gate:** M10 PASS, M2 ≥ 2×, MACRO chip ≥ baseline.
- **Max feedback latency:** lab Vitest seconds; capture minutes.

---

## Per-Task Verification Map

> Instancing tasks map to **M10 (must-ship) + MACRO parity**; de-Vegas tasks map to **M2 + recede + MACRO-chip**.
> Threat ref `—` / secure `N/A` throughout (lab-only render, not in prod build).

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 04-01-01 | 01 | 1 | §TP3 rollback tag + tp3-base capture | infra | `git tag --list tp3-before-chips` + node PNG-exists | ⬜ pending |
| 04-01-02 | 01 | 1 | §TP3 M10 baseline confirm | metric | `node tools/table-3d/stats-read.mjs <url> hero` + TP3_BASELINE.md | ⬜ pending |
| 04-02-01 | 02 | 2 | §TP3 chipStack.ts extract + seed-parity (tdd) | tdd | `vitest run src/lab/chipStack.test.ts` (byte-equiv seeds) | ⬜ pending |
| 04-02-02 | 02 | 2 | §TP3 InstancedChipStack + 512² + M10 must-ship | unit/metric | `vitest run src/lab/` + `tsc --noEmit` + `stats-read.mjs` (M10 ≤10/<220) + MACRO parity | ⬜ pending |
| 04-02-03 | 02 | 2 | §TP3 instancing grep-check | unit | `node tools/table-3d/grep-check-tp3-02.cjs` (Instances; no bottom face) | ⬜ pending |
| 04-03-01 | 03 | 3 | §TP3 de-Vegas textures (chroma −20%, C normal, logo) | unit | `vitest run src/lab/` + grep-check-tp3-03tex.cjs | ⬜ pending |
| 04-03-02 | 03 | 3 | §TP3 matte clay material + M2/recede | unit/metric | `vitest run src/lab/` + `tsc --noEmit` + grep-check-tp3-03mat.cjs + `m2CardsVsChips` (≥2×) | ⬜ pending |
| 04-03-03 | 03 | 3 | §TP3 de-Vegas grep-checks | unit | `node grep-check-tp3-03tex.cjs` + `grep-check-tp3-03mat.cjs` | ⬜ pending |
| 04-04-01 | 04 | 4 | §TP3 operator A/B gate | manual | checkpoint:human-verify (HERO+MACRO; SPLIT disposition) | ⬜ pending |

---

## Wave 0 Requirements

- [ ] **tp3-base baseline capture** — current post-TP2 chips at HERO + MACRO → `docs/table-3d/anchors/tp3-base/` (the parity + de-Vegas "before"). `head/` + `reference-tag/` + `tp2-base/` stay IMMUTABLE.
- [ ] **M10 baseline confirm** — record current draw-calls at HERO + `?chips=full` (`stats-read.mjs`) as the must-ship target basis (TP0: HERO ~233, `?chips=full` 637).
- [ ] Lab Vitest framework present (baseline green).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| "Worn artisanal clay that RECEDES, C tooled-not-printed, no Vegas gloss" | SSOT §TP3 perceptual gate | Perceptual identity judgment — no automated proxy for "clay vs plastic" or "recedes" | Operator A/B at HERO + MACRO vs tp3-base. STOP-on-ambiguous: chips pull the eye OR read plastic → STOP + revert (de-Vegas non-blocking). |

---

## Validation Sign-Off

- [ ] Every task has an automated verify (lab Vitest and/or metric) or a Wave 0 dependency
- [ ] Instancing task gated on M10 (must-ship-or-revert) + strict MACRO parity
- [ ] De-Vegas tasks gated on M2 ≥ 2× + chips-recede + MACRO chip ≥ baseline
- [ ] Wave 0 covers tp3-base capture + M10 baseline
- [x] `nyquist_compliant: true` set in frontmatter (per-task map populated 2026-06-11)

**Approval:** approved 2026-06-11 — plan-checker VERIFICATION PASSED (4/4 plans, 0 blockers); per-task map populated. `wave_0_complete` flips true after plan 04-01 executes.
