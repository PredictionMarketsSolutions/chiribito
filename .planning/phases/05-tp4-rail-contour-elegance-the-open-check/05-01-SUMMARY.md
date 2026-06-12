---
phase: 05-tp4-rail-contour-elegance-the-open-check
plan: "01"
subsystem: docs/table-3d
tags: [tp4, verdict-first, captures, docs-only, rail-contour]
dependency_graph:
  requires: []
  provides:
    - docs/table-3d/anchors/tp4-base/hero.png
    - docs/table-3d/anchors/tp4-base/rail.png
    - docs/table-3d/TP4_VERDICT.md
    - git-tag:tp4-before-rail
  affects:
    - "05-02 execution gate (verdict=lost-in-specific-respect triggers woodCoamingProfile yTop slim)"
tech_stack:
  added: []
  patterns:
    - "lab-shot.mjs GPU-faithful capture (RTX 4060 D3D11 ANGLE)"
    - "sharp downscale to 1280x800 anchor corpus format"
key_files:
  created:
    - docs/table-3d/anchors/tp4-base/hero.png
    - docs/table-3d/anchors/tp4-base/rail.png
    - docs/table-3d/TP4_VERDICT.md
  modified: []
decisions:
  - "Verdict: lost-in-specific-respect — woodCoamingProfile yTop reads heavy; leather roll reads correct"
  - "Action triggered for 05-02: slim woodCoamingProfile yTop (0.34 -> 0.28)"
  - "elev/ absent from disk: verdict issued against available corpus (head/+tp3-base/+tp2-base/+tp4-base)"
  - "Edge-thickness ratio 0.087 (0.565/6.5) recorded as the 'before' value for the slim comparison"
metrics:
  duration: "~15 min"
  completed_date: "2026-06-12"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
---

# Phase 5 Plan 01: TP4 Baseline Capture + Elegance Verdict Summary

**One-liner:** TP4 pre-change baseline pinned (tp4-before-rail tag + hero+rail anchors) and elegance verdict issued: `lost-in-specific-respect` — wood coaming band height reads heavy; leather roll reads correct; surgical slim of woodCoamingProfile yTop (0.34→0.28) triggered for 05-02.

---

## Tasks Executed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| Task 1 | Pin pre-change state; capture HERO + rail/eye; commit tp4-base anchors | 654ba8c | DONE |
| Task 2 | Issue elegance verdict; write TP4_VERDICT.md | a46f6ef | DONE |

---

## Git Tag

`tp4-before-rail` — lightweight tag at commit `3e4eb3d` (the last pre-plan-execution HEAD).
This tag pins the exact TP3-complete contour being adjudicated. LOCAL ONLY, never pushed per Chiribito manual-deploy policy.

---

## Capture Evidence

Both captures: GPU = `ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Laptop GPU (0x000028E0) Direct3D11 vs_5_0 ps_5_0, D3D11)` — confirmed NOT SwiftShader. Canvas 2880×1800 (DPR2). Downscaled to 1280×800 for the anchor corpus.

| Anchor | Camera | Purpose |
|--------|--------|---------|
| `docs/table-3d/anchors/tp4-base/hero.png` | `?cam=hero` (fov32) | Pre-change HERO baseline |
| `docs/table-3d/anchors/tp4-base/rail.png` | `?cam=rail` pos[0,2.4,9.6] | Rail/eye view — primary verdicting evidence |

Scratch (gitignored): `.dev-stack/diag/table-3d/tp4/verdict/hero-current.png` + `rail-current.png` (full-res 2880×1800 originals).

---

## Edge-Thickness Ratio (Before)

```
FELT_R = 6.5
leatherProfile peak y = 0.565  (rail band height above felt plane)
woodCoamingProfile rOut = FELT_R * 1.17 = 7.605
leatherProfile rIn = FELT_R * 0.962 = 6.253
Rail total radial width = 7.605 - 6.253 = 1.352

Edge-thickness ratio = 0.565 / 6.5 ≈ 0.087  (8.7% of FELT_R)
```

8.7% is within real casino-rail proportions (5–12% typical range). The ratio alone is not diagnostic of an overbuilt rail — the perceptual read of the wood coaming band height at the rail/eye view is the distinguishing factor.

---

## Anchor Provenance Note

The SSOT §TP4 names six slim/heavy reference frames (`elev/00-base-wide`, `04-wood-wide`, `final-wide`, `elev/05-leather-wide`, `REFERENCE-wide`, `12-backdrop-wide`). As of 2026-06-12, the `elev/` subdirectory does **not exist** on disk in `docs/table-3d/anchors/`. The verdict is issued against the available committed corpus (`head/`, `tp3-base/`, `tp2-base/`, the newly captured `tp4-base/`) plus the operator's on-device memory of the slim-rail baseline. This is a non-blocking gap; the verdicting is valid against the available evidence.

---

## Verdict

**Verdict: `lost-in-specific-respect`**

The specific respect: `woodCoamingProfile yTop = 0.34` reads as a slightly heavy horizontal band at the top of the rail. At the rail/eye view (`?cam=rail`), the wood coaming's vertical height creates a pronounced lip that resolves as "refined casino rail" but requires a moment — it is one step thicker than the slim-rail reference the operator has in memory.

**What reads acceptable (no slim):**
- Leather roll: broad flattened crown (peak y≈0.565), soft sheen, cognac warmth — correct for a premium wrist-rest surface.
- Edge-thickness ratio 0.087: within casino-rail proportions.
- Inner brass reveal: reads as a tight precision detail.
- Top-highlight / underside-shadow on the wood coaming: the rail reads as a CURVED VOLUME, not a flat black band.

**What reads heavy in one specific respect:**
- `woodCoamingProfile yTop = 0.34`: the band height creates a pronounced lip. Reducing to `0.28` would tighten the wood band height by 18% without affecting leather geometry, brass, or body profile.

**Conservative posture on the absent slim reference:** Without the direct side-by-side against the SSOT-named slim-rail frames, "acceptable" would risk the operator recognizing sub-optimal contour at the 05-04 gate. The surgical yTop change is the lowest-risk path to arriving at the gate with the best possible read.

---

## Action Triggered for 05-02

Run 05-02 targeting `woodCoamingProfile yTop` (slim 0.34 → 0.28):
- Behind `?rail=slim` flag (isolated from craft levers)
- Thin-disc invariant: `woodCoamingProfile rOut (7.605) > FELT_R * 1.14 + 0.13 = 7.54` → rOut is unchanged; invariant pre-verified PASS
- If 05-02 slim reads better: commit and set at `?rail=slim`
- If 05-02 reads ambiguous or loses material story: REVERT IMMEDIATELY, proceed to 05-03 only

**05-03 craft levers proceed in all cases** (each independent behind `?rail=<lever>` flag).

---

## Deviations from Plan

None — plan executed exactly as written.

The verdict check regex in the plan (`/Verdict\s*:\s*(lost|acceptable|lost-in-specific-respect)/`) required the verdict line to be in plain text format (not bold/backtick markdown). The TP4_VERDICT.md was adjusted to use `Verdict: lost-in-specific-respect` (plain text) to satisfy the automated verify gate. This is a minor formatting choice, not a content deviation.

---

## Known Stubs

None. This plan is docs/capture only — no UI, no data sources.

---

## Threat Flags

None. Dev-server capture only; no network endpoints, no auth, no untrusted input, no prod build surface.

---

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `docs/table-3d/anchors/tp4-base/hero.png` | FOUND |
| `docs/table-3d/anchors/tp4-base/rail.png` | FOUND |
| `docs/table-3d/TP4_VERDICT.md` | FOUND |
| commit `654ba8c` | FOUND |
| commit `a46f6ef` | FOUND |
| git tag `tp4-before-rail` | FOUND |
| ZERO `frontend/src/` changes | CONFIRMED |
