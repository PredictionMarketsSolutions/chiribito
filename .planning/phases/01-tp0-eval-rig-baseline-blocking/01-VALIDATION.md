---
phase: 1
slug: tp0-eval-rig-baseline-blocking
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-09
---

# Phase 1 — Validation Strategy (TP0 Eval Rig & Baseline)

> Per-phase validation contract. **TP0 is the eval instrument itself** — so its validation is unusual: each METRIC must validate against a positive + negative control frame (the red-team meta-gate) before it is allowed to gate; determinism is proven by md5 byte-identity; bloom-absence by a code assert; the protagonist + money-shot reads by an OPERATOR manual gate. See `01-RESEARCH.md` → "## Validation Architecture" for the full mapping.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frontend unit framework** | vitest (already configured in `frontend/`) — for any TS helpers (e.g. metric math, StatsProbe) |
| **Metric self-validation** | each `*.mjs` metric script run against a known-good AND known-bad control frame (sharp, from repo ROOT) |
| **Capture harness** | `.dev-stack/lab-shot.mjs` (Playwright, `--use-angle=d3d11 --enable-gpu`) on the local RTX 4060 |
| **Determinism check** | `md5` of two consecutive captures under `&spin=off` + reduced-motion (M9) |
| **Config file** | `frontend/vite.config.ts` (lab entry, NOT in prod build); metric scripts have no config |
| **Quick run command** | `node <metric>.mjs <good.png> <bad.png>` (per-metric control validation) |
| **Full suite command** | `cd frontend && npm test` (vitest) + the metric control-validation batch |
| **Estimated runtime** | metric batch ~seconds; a 3-shot capture set ~10–30 s on the GPU |

---

## Sampling Rate

- **After every task commit:** run the relevant metric's control-frame validation (good+bad) and/or `npm test` for TS helpers.
- **After the TP0b wave:** run the FULL metric control-validation batch — every admitted metric must pass good AND fail bad; un-validated metrics are tagged informational.
- **Before the operator gate:** the 3 money shots must capture cleanly (no console errors) and M9 determinism must pass (byte-identical md5).
- **Max feedback latency:** seconds (pixel math) to ~30 s (a GPU capture set).

---

## Per-Task Verification Map

> Filled per-plan by the planner (Threat Ref column = TP0's minimal local-tool threat model). Representative rows:

| Task ID | Plan | Wave | Truth | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------|-----------------|-----------|-------------------|--------|
| 01-0x-xx | TP0a | 1 | harness restored + runs | N/A (local dev tool) | capture | `LAB_URL=...card node .dev-stack/lab-shot.mjs out.png` exits 0, PNG 2880×1800 | ⬜ pending |
| 01-0x-xx | TP0a | 1 | zero visual change | reference never degraded | capture-diff | M12 regional MSE on must-not-change regions ≈ 0 vs HEAD | ⬜ pending |
| 01-0x-xx | TP0b | 2 | metric admitted | metric can't false-pass | meta-gate | `node <metric>.mjs good.png` PASS AND `... bad.png` FAIL | ⬜ pending |
| 01-0x-xx | TP0a | 2 | determinism | capture reproducible | md5 | two captures byte-identical (M9) | ⬜ pending |
| 01-0x-xx | TP0b | 2 | no bloom | anti-casino invariant | code-assert | grep proves no Bloom effect mounted (M7) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `cd frontend && npm install` — frontend node_modules is empty; Vite dev server won't start without it (BLOCKING precondition for any capture).
- [ ] Restore `.dev-stack/lab-shot.mjs` into the worktree (single file) OR run captures from the main checkout where `.dev-stack/` lives.
- [ ] Confirm `sharp` + `playwright` resolve from repo ROOT (per RESEARCH — already importable; no install needed).

*sharp/playwright already present at root; the only real install is the frontend one above.*

---

## Manual-Only Verifications (the operator perceptual gates — BLOCKING)

| Behavior | Why Manual | Test Instructions |
|----------|------------|-------------------|
| **TP0.0 — M1 cards-as-protagonist read** | subjective on-device perceptual judgement; the program's BLOCKING precondition | Operator views the lab on-device; confirms the cards read as the unmistakable protagonist BEFORE any TP1+ materiality work. Fail → stop, refine M1. |
| **Money-shot blessing (incl. POV fov 37 vs 40)** | canonical-view choice locks the baseline; the ONE allowed refinement | Operator reviews HERO(32)/POV(card, **40 in code — bless or tighten to 37**)/MACRO(26); blesses the 3 as canonical. The fov pick is the LAST reversible edit BEFORE the irreversible baseline freeze. |
| **M1 legibility confirm** | px-height ≥22px is necessary but not sufficient; manual "is it legible?" required | Operator confirms hole-card rank glyphs are razor-legible at POV @1080p. |
| **M11 frame-time** | needs the real RTX 4060 + vsync-OFF read | Operator-assisted `?stats` read at HERO; median frame-time < 8 ms. |

---

## Validation Sign-Off

- [ ] Every admitted metric passed its positive control AND failed its negative control (meta-gate)
- [ ] M9 determinism: two consecutive captures byte-identical (md5)
- [ ] M7 bloom-absence code assert green
- [ ] Zero-visual-change proven (M12 regional MSE ≈ 0 on must-not-change regions vs HEAD)
- [ ] Operator perceptual gates passed (TP0.0 + money-shot blessing) — BLOCKING before TP1
- [ ] `nyquist_compliant: true` set after sign-off

**Approval:** pending
