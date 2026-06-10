---
phase: 2
slug: tp1-felt-tapete-materiality-the-stage
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. TP1 is a **visual material** phase: the primary "tests" are the admitted pixel **metrics** (M3/M5/+B) over GPU-faithful captures + the operator A/B; pure logic (the Sobel height→normal helper) is unit-tested.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frameworks** | Vitest (frontend, pure-logic units) + the TP0 metric kit (`tools/table-3d/*.mjs` over GPU captures) |
| **Config file** | `frontend/vite.config.ts` (inline `test:` block, happy-dom, include `src/**/*.test.ts`); metric kit needs no config |
| **Quick run command** | `cd frontend && npx vitest run src/lab/normalMapHelper.test.ts` |
| **Metric/capture command** | (dev server up) `LAB_URL=".../?cam=hero\|card\|macro" node .dev-stack/lab-shot.mjs out.png` → `node tools/table-3d/run-metrics.mjs <dir>` (reads hero.png from the dir) |
| **Full suite command** | `cd frontend && npx vitest run` |
| **Estimated runtime** | unit ~1s · capture ~7s/shot · metrics ~2s |

---

## Sampling Rate

- **After every task commit:** run the quick unit command (if the task touched pure logic) AND, if the task changed the felt render, capture HERO+MACRO+POV + run M3/M5/+B.
- **After every plan wave:** full vitest suite + a full HERO/MACRO/POV capture + M3/M5/+B + A/B vs `anchors/head/` (must improve felt) and vs `anchors/reference-tag/` (must NEVER regress below).
- **Before the operator A/B gate:** all metric gates green; captures GPU-faithful (RTX 4060, not SwiftShader).
- **Max feedback latency:** < ~30 s (unit) / < ~60 s (capture+metrics).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-T1 | 02-01 | 1 | SSOT §5.3 rollback tag + A1 resolution | T-02-01, T-02-SCOPE | N/A (offline static lab) | tag check / code-read | `git rev-list -n 1 tp1-before-felt` | ✅ (git) | ⬜ pending |
| 02-01-T2 | 02-01 | 1 | SSOT §5.9 shared height→normal helper (FIRST USE) | T-02-03 | N/A | unit | `cd frontend && npx vitest run src/lab/normalMapHelper.test.ts` | ⬜ new (normalMapHelper.test.ts) | ⬜ pending |
| 02-02-T1 | 02-02 | 2 | D-04 inlay S→2048 + D-03 vignette removal; M3 anchors preserved | T-02-04, T-02-01 | N/A | unit (tsc) + grep gate | `cd frontend && npx tsc --noEmit` | ✅ (textures.ts) | ⬜ pending |
| 02-02-T2 | 02-02 | 2 | D-01 concentric nap normalMap (LINEAR, repeat 8) via shared helper | T-02-03 | N/A | unit (tsc) + grep gate | `cd frontend && npx tsc --noEmit` | ✅ (textures.ts) | ⬜ pending |
| 02-02-T3 | 02-02 | 2 | D-03 very-subtle light-responsive edge-darken (per A1) | T-02-01 | N/A | unit (tsc) + grep gate | `cd frontend && npx tsc --noEmit` | ✅ (textures.ts) | ⬜ pending |
| 02-03-T1 | 02-03 | 3 | SSOT §TP1 + D-02 felt → MeshPhysicalMaterial (sheen/nap/aniso/aoMap), roughness 0.90–0.94 | T-02-02, T-02-04, T-02-03 | N/A | unit (tsc) + grep gate | `cd frontend && npx tsc --noEmit` | ✅ (TableLab.tsx) | ⬜ pending |
| 02-03-T2 | 02-03 | 3 | SSOT §TP1 gates: M3 ΔE<12 · M5 clip · +B fuzz-not-satin ≤8% | T-02-02, T-02-04, T-02-EVAL | N/A | metric (GPU capture) | `node tools/table-3d/run-metrics.mjs .dev-stack/diag/table-3d/tp1` | ✅ (run-metrics.mjs) | ⬜ pending |
| 02-04-T1 | 02-04 | 4 | SSOT §TP1 perceptual gate (materiality-only A/B, POV+MACRO, D-05) | T-02-01, T-02-02, T-02-03, T-02-GATE | N/A | manual seam (operator A/B) | — (operator review; M3/M5/+B already green) | — (manual) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky. The Sobel helper → unit; each felt-texture/material change → tsc + grep gates; the render change → M3/M5/+B metric; the felt read → operator A/B.*

*Sampling continuity check: no run of 3 consecutive tasks lacks an automated verify (02-04-T1 is the only manual seam, and it is the terminal perceptual gate preceded by the automated M3/M5/+B metric in 02-03-T2).*

---

## Wave 0 Requirements

- [ ] `frontend/src/lab/normalMapHelper.test.ts` — unit stub for the shared height→normal (Sobel→RGB) helper: known height field → expected normal RGB (flat → #8080ff; a known slope → expected tilt; B≥128; strength=0 → up-normal). Pure math, deterministic. **(plan 02-01, Task 2)**
- [ ] A1 resolved (aoMap uv vs uv2 in three 0.169) → `docs/table-3d/TP1_A1_AOMAP_UV.md` before any aoMap wiring. **(plan 02-01, Task 1)**
- [ ] (metrics already exist from TP0: M3/M5/+B in `tools/table-3d/metrics.mjs` — no install needed.)

*The felt-render behaviors are validated by the metric kit + A/B, not unit tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Felt reads as real woven baize (concentric nap, contained sheen) without satin / casino-green | SSOT §TP1 perceptual gate | Subjective material read — no automated proxy (the +B metric is necessary-not-sufficient) | Operator A/B at POV (fov40) + MACRO (fov26), `?felt` variants; materiality ONLY (grounding/depth deferred to TP5/6); stop-on-ambiguous → iterate ≤2 then non-blocking rollback **(plan 02-04)** |
| Mark + suits stay "born-in" + crisper at MACRO | SSOT §TP1 + D-04 | Subjective "born-in vs decal" + sharpness read | Operator MACRO inspection vs `anchors/head/macro.png` and never below `anchors/reference-tag/macro.png` **(plan 02-04)** |

---

## Validation Sign-Off

- [x] Every task has an `<automated>` verify (metric or unit) OR a documented manual seam (the operator A/B, 02-04-T1)
- [x] Sampling continuity: no 3 consecutive tasks without an automated verify
- [x] Wave 0 covers the Sobel-helper unit test (02-01-T2)
- [x] No watch-mode flags
- [x] Feedback latency < 60 s
- [x] `nyquist_compliant: true` set by the planner once the per-task map is complete

**Approval:** per-task map complete (planner, 2026-06-10) — pending execution.
