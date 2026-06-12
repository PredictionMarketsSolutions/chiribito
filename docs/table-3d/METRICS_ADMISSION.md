# TP0b — Metric Admission Ledger (red-team meta-gate)

**Authored:** 2026-06-09 (plan 01-03)
**Instrument:** `tools/table-3d/metrics.mjs` (sharp), run from the repo ROOT.
**Gate runner:** `node tools/table-3d/run-metrics.mjs --meta-gate <controlsDir>`
**Baseline frame:** HERO `?cam=hero` (fov 32), captured via `.dev-stack/lab-shot.mjs`
(2880×1800, RTX 4060 D3D11). The POV (`?cam=card`) fov is NOT yet operator-locked (40 in
code, 37 candidate) — any POV-dependent rect is PROVISIONAL and finalized in plan 01-06.

---

## The rule (SSOT §4.5 meta-gate · §8 DoD #13)

> A metric is admitted to the gate-set **ONLY** after it produces the expected result on a
> known-good **AND** a known-bad control frame. Until validated it is **informational**.

A metric is **ADMITTED** iff it `PASSES` its positive (known-good) control **AND** `FAILS`
its negative (known-bad) control. Otherwise it is recorded **informational** — never silently
dropped, never forced to pass.

**Control frames** are committed DOWNSCALED (640w, palette-quantized) under
`docs/table-3d/anchors/controls/` (the full corpus is ~0.3 MB — Pitfall 5). The single shared
positive control is `_hero-good.png`; each metric's negative control is its `*-bad.png`. The
NUMERIC proof runs on the full-res working copies in `.dev-stack/diag/table-3d/tp0-controls/full/`
(the metric region rects are 2880×1800 coordinates).

---

## Admission table

| Metric | §4.5 threshold (baked) | Good control | Good result | Bad control | Bad result | Verdict |
|--------|------------------------|--------------|-------------|-------------|------------|---------|
| **M3** felt-hue | mean Lab ΔE < 12 from {#1f9163,#147a51,#0a4a33} | HERO felt rect | ΔE **8.55** → PASS | `?felt=magenta` (real lab hook) | ΔE **130.69** → FAIL | **ADMITTED** |
| **M4** brass-not-gold | HSV H∈[35,48]° · S ≤ 0.55 · V ≤ 0.80 | HERO brass rect | H39.4/S0.38/V0.69 → PASS | sharp gold tint (255,205,25) over brass rect | H47/S0.90/V1.0 → FAIL | **ADMITTED** |
| **M5** highlight-clip | luma>250 < 0.5% felt · < 1.5% frame | HERO felt rect | 0%/0% → PASS | pure-white wash over felt rect | felt **100%** → FAIL | **ADMITTED** |
| **M6** contact-shadow | under-object ≥ 12% darker than adjacent felt | HERO under-card vs adjacent | **14.14%** darker → PASS | under-card lifted to adjacent-felt brightness | **-0.05%** → FAIL | **ADMITTED** |
| **+B** felt-specular | bright-sheen (luma>210) ≤ 8% of felt | HERO felt rect | **0%** sheen → PASS | satin bright-sheen wash over felt | **79.2%** → FAIL | **ADMITTED** |
| **M10** draw-call | < 150 hero/POV/macro · < 220 chips=full | synthetic 120 calls | 120 < 150 → PASS | real measured HERO (237) | 237 ≥ 150 → FAIL | **ADMITTED** |
| **M8** vignette | mean corner luma 8–20% below center | HERO top corners vs center | **88.87%** below → **FAIL** | flattened corners | 0.08% → FAIL | **informational** |
| **+A** warm-corner | corner luma ≥ floor AND corner hue warm | HERO top corners | luma **15.6** < floor 18 → **FAIL** | neutralized/crushed corners | luma 6.1, hue 240° → FAIL | **informational** |

**ADMITTED (6):** M3 · M4 · M5 · M6 · +B · M10
**informational (2):** M8 · +A

The meta-gate runner exits **0**: every ADMITTED metric provably passed its good control and
failed its bad control.

---

## Why M8 and +A are informational (honest downgrade, NOT a defect)

Both metrics PASS their FAIL-on-bad side (they correctly fail a flattened / neutralized-corner
frame). They are informational because they **cannot PASS the good control on the TP0 baseline**:

- The current table has a **hard dark room surround** — the TOP frame corners are near-black
  backdrop (luma ≈ 15), so the corner-vs-center falloff is ~89% (far past the 20% "void" bound),
  and the corner luma (15.6) sits just below the +A floor (18).
- The restrained **8–20% warm vignette** these metrics gate for is a **TP6 deliverable**
  (SSOT §4.5 +A note "reconciles TP5.3 lift vs TP6 vignette"; §TP6 "table-edge vignette/fog…
  M8 band 8–20%"). The baseline pre-dates it by design.
- Therefore M8/+A are recorded informational at TP0 and **become active gates once TP6 lands the
  vignette** — at which point their good control is re-captured and they are re-admitted.

This is the meta-gate working as intended: a metric that cannot yet pass a known-good frame is
NOT allowed to masquerade as a passing gate.

> **Corner-set note:** on the current baseline the table fills the BOTTOM corners with lit felt,
> so M8/+A sample the TOP corners (`FRAMING_CORNERS = [cornerTL, cornerTR]`) for the framing read.
> Plan 06 may revisit the corner set once TP6 adds a true four-corner vignette.

---

## Live M10 draw-call baseline (read via `tools/table-3d/stats-read.mjs`)

Read from the worktree dev server (5180) by wrapping the WebGL `drawElements`/`drawArrays`
for one real frame (see the M10 reader rationale below). These are the **honest** baseline
numbers — the current un-instanced pot is the worst draw-call case (SSOT §3; TP3 instances it):

| Shot | Draw calls (steady / peak) | Ceiling | Verdict |
|------|----------------------------|---------|---------|
| HERO `?cam=hero` | 205 / **237** | < 150 | **OVER** (informational at TP0; on-device gate read in plan 06) |
| POV `?cam=card` | 205 / **237** | < 150 | **OVER** |
| MACRO `?cam=macro` | 163 / **195** | < 150 | **OVER** |
| HERO `?chips=full` | 605 / **637** | < 220 | **OVER** (stress diagnostic) |

> The M10 **metric** (verdict logic) is ADMITTED (passes a low synthetic count, fails the real
> 237). The baseline scene currently EXCEEDS the ceiling — recorded here as the TP0 regression
> baseline. The formal M10 gate is read on-device alongside M11 in plan 06; TP3 (chip instancing)
> is where the count is brought under the ceiling.

---

## Instrument deviations (recorded for SUMMARY)

1. **M10 reader — StatsProbe `gl.info.render.calls` reads a stale `1` under headless Chromium.**
   The plan-contract interface is `window.__labStats.calls` (StatsProbe, plan 01-02). Empirically
   that value is `1` in headless: StatsProbe reads `gl.info.render.calls` at the START of its
   `useFrame` (before R3F renders that frame) and headless rAF throttling means the continuous
   loop barely ticks. Rather than mutate the FROZEN StatsProbe (and risk its zero-visual-change /
   M9 contract), `tools/table-3d/stats-read.mjs` counts GPU draw calls DIRECTLY by wrapping
   `drawElements`/`drawArrays` for one real frame (with `--disable-renderer-backgrounding` +
   `--disable-background-timer-throttling` so the render loop runs). This is non-invasive,
   deterministic, and matches the canonical `renderer.info.render.calls` definition. A future
   plan may fix StatsProbe to read post-render (positive-priority `useFrame`) if `window.__labStats`
   is wanted as the on-device interface; the gate value is unaffected.

2. **Region rects re-authored against the REAL baseline.** The initial placeholder rects sampled
   the dark backdrop (M3 ΔE 18, felt rect off the cloth) and the cream court cards (M4 V 0.83).
   Calibrated against the captured HERO frame: felt @(760,500,200×120) → ΔE 8.5; brass
   @(1240,820,140×60) → the table's aged-brass reveal (H40/S0.47/V0.73), deliberately NOT the
   painted court-card gold (S≈0.70). All rects live in one `REGIONS` object that plan 06 finalizes
   (esp. the PROVISIONAL POV rect, pending the operator's fov 37-vs-40 pick).

3. **Control corpus downscaled hard (640w, palette-quantized).** Full-res frames are 2.4–4.9 MB
   each; committing 7 good + 7 bad would bloat the repo ~20 MB. The committed corpus (one shared
   `_hero-good.png` + 7 `*-bad.png`) is ~0.3 MB; the numeric meta-gate runs on the full-res working
   copies in gitignored `.dev-stack/`.
