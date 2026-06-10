---
phase: 2
slug: tp1-felt-tapete-materiality-the-stage
status: draft
nyquist_compliant: false
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
| **Config file** | `frontend/vitest.config.*` (existing); metric kit needs no config |
| **Quick run command** | `cd frontend && npx vitest run src/lab/normalMapHelper.test.ts` |
| **Metric/capture command** | (dev server up) `LAB_URL=".../?cam=hero\|card\|macro" node .dev-stack/lab-shot.mjs out.png` → `node tools/table-3d/run-metrics.mjs <dir>` |
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
| _planner fills_ | | | TP1 (SSOT §TP1) | T-02-* | N/A (offline static lab; no auth/network/secrets) | metric / unit | `run-metrics.mjs` / `vitest` | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky. The planner populates one row per task (the Sobel helper → unit; each felt-material/texture change → M3/M5/+B metric + A/B).*

---

## Wave 0 Requirements

- [ ] `frontend/src/lab/normalMapHelper.test.ts` — unit stub for the shared height→normal (Sobel→RGB) helper: known height field → expected normal RGB (flat → #8080ff; a known slope → expected tilt). Pure math, deterministic.
- [ ] (metrics already exist from TP0: M3/M5/+B in `tools/table-3d/metrics.mjs` — no install needed.)

*The felt-render behaviors are validated by the metric kit + A/B, not unit tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Felt reads as real woven baize (concentric nap, contained sheen) without satin / casino-green | SSOT §TP1 perceptual gate | Subjective material read — no automated proxy (the +B metric is necessary-not-sufficient) | Operator A/B at POV (fov40) + MACRO (fov26), `?felt` variants; materiality ONLY (grounding/depth deferred to TP5/6); stop-on-ambiguous → iterate ≤2 then non-blocking rollback |
| Mark + suits stay "born-in" + crisper at MACRO | SSOT §TP1 + D-04 | Subjective "born-in vs decal" + sharpness read | Operator MACRO inspection vs `anchors/head/macro.png` and never below `anchors/reference-tag/macro.png` |

---

## Validation Sign-Off

- [ ] Every task has an `<automated>` verify (metric or unit) OR a documented manual seam (the operator A/B)
- [ ] Sampling continuity: no 3 consecutive tasks without an automated verify
- [ ] Wave 0 covers the Sobel-helper unit test
- [ ] No watch-mode flags
- [ ] Feedback latency < 60 s
- [ ] `nyquist_compliant: true` set by the planner once the per-task map is complete

**Approval:** pending
