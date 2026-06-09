# Phase 1: TP0 — Eval Rig & Baseline (BLOCKING) - Research

**Researched:** 2026-06-09
**Domain:** Eval instrumentation for a frozen R3F scene — capture harness, pixel-math metrics (sharp), determinism, anchor persistence. ZERO visual change.
**Confidence:** HIGH (everything grounded in the actual code + harness; no web research used — the approach is pre-decided by the SSOT)

> **This is a SPEC-COMPLETE phase.** The authoritative spec — `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP0 + §4 + §5 + §10 + §11 — pre-decides the approach, the 3 money shots, the frozen scene, the 15-element scorecard, and the 12+2 metric kit with BAKED thresholds (§4.5). This research does NOT re-derive the design. It grounds the plan in (a) the exact lab codebase and (b) the existing capture harness, and produces a Validation Architecture for the Nyquist gate. **Doc wins on any conflict; thresholds in §4.5 are final.**

---

## Summary

TP0 builds the *measuring instrument* for the whole Table-3D Perfection program and freezes a baseline of the current table — with **no pixel changed**. The work splits into TP0.0 (operator M1 precondition gate, on-device, BLOCKING), TP0a (the cheap must-have rig: verify the harness, add a `?stats` overlay, freeze the 3 presets + Perla scene, capture the baseline corpus, author the 15-element scorecard, persist anchors to `docs/table-3d/anchors/`), and TP0b (the sharp-based metric kit, each gated by a positive+negative control frame before admission).

Three findings reshape the plan versus what CONTEXT.md assumed. **(1) The POV camera in code is `fov: 40`, NOT 37** — `TableLab.tsx:618`. The SSOT wants it tightened 40→37 but explicitly defers the final pick to the operator gate, and it is the LAST reversible edit before the irreversible baseline freeze. **(2) `sharp@0.34.5` and `playwright@1.60.0` are ALREADY installed and importable from the repo ROOT** (`chiribito-server` package, not `frontend`). CONTEXT.md's "sharp is NOT installed anywhere" is wrong — verified by `require('sharp')` succeeding at root. This means TP0b's metric scripts and TP0a's harness both run from the repo root with **zero new package installs for sharp/playwright**. **(3) `frontend/node_modules` exists but is stale/empty** — none of three/r3f/drei/react/vitest resolve — so `npm install` in `frontend/` IS still required (to run the Vite dev server the harness points at).

The `.dev-stack/lab-shot.mjs` harness is intact in the main checkout and imports only `playwright` + node builtins. The minimal restore is literally **one file** (`lab-shot.mjs`) plus the 4 `REFERENCE-*.png` frames — or, simpler, run all captures from the main checkout where `.dev-stack/` already lives, then copy the resulting PNGs into the worktree's `docs/table-3d/anchors/`.

**Primary recommendation:** Run the dev server and ALL captures from the **repo ROOT** (`node .dev-stack/lab-shot.mjs` resolves playwright there) against `frontend`'s Vite server; write metric scripts as root-run `.mjs` files using the root's `sharp`; add the `?stats` overlay via a dependency-free `useThree`+`useFrame` reader (NOT drei `<Stats>`, which draws a visible widget and would change pixels). Sequence everything reversible BEFORE the operator blesses POV fov 37-vs-40, then perform the irreversible baseline freeze + commit.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (anchored to the SSOT — do NOT re-litigate)
- **3 canonical money shots (FROZEN at TP0, reused verbatim at every gate):** HERO `?cam=hero` (¾, **fov 32**) · POV `?cam=card` (player POV, **fov 37** — tightened from 40) · MACRO `?cam=macro` (**fov 26**). All driven by `?cam=` + `?spin=off`.
- **Fixed staged scene (FROZEN):** `LAB_COMMUNITY = [1E,12C,11B]` (As Espadas · Rey Copas · Caballo Bastos) · `LAB_HOLE = [10O,7O]` (la Perla de Oros, Sota+7) — all 5 cards FACE-UP · demoted accent pot at `group[2.7,0,1.5] scale 0.66`. **No face-down card is added to the Perla hand** (keeps the SSIM/MSE anchor valid; any deck-stub is a TP6 center-of-table prop, never a 6th card).
- **Anchor corpus persistence:** `.dev-stack/` is gitignored → baseline + protected-tag frames + metric control frames MUST be committed to a tracked location: `docs/table-3d/anchors/` (small PNGs).
- **15-element AAA scorecard (0–5 each):** felt · cards · chips · leather rail · wood coaming · brass · body/contour · lighting · shadows · depth · composition · cameras · tactility · social-read · premium-overall. Baseline scored at TP0; green = ≥4/5 every element at TP9.
- **Metric kit = 12 + 2 metrics with concrete baked thresholds (§4.5):** M1 legibility (rank-glyph bbox ≥ 22px on 1080p POV downscale + manual confirm) · M2 cards-vs-chips area ≥ 2.0× · M3 felt-hue ΔE<12 · M4 brass-not-gold (HSV H35–48°,S≤0.55,V≤0.80) · M5 highlight-clip · M6 contact-shadow ≥12% darker · M7 bloom-absence (code assert) · M8 vignette 8–20% · M9 determinism (byte-identical md5) · M10 draw-call (<150 hero; `?chips=full` <220) · M11 frame-time (<8ms HERO RTX4060 vsync-OFF) · M12 regional-MSE-vs-prev-phase · +A warm-corner floor · +B felt-specular-extent.
- **Tooling pre-decided:** `sharp`-based pixel math · **SSIM proxy = sharp MSE** (no SSIM lib; vendored JS SSIM optional TIER-2) · legibility = fixed pixel-height + manual operator confirm (NO automated OCR hard gate).
- **Meta-gate (red-team):** a metric is admitted to the gate-set ONLY after it produces the expected result on a known-good AND a known-bad control frame. Until validated → informational only.
- **SSIM-vs-reference is NOT an auto pass/fail** for visual phases (they're designed to differ). Used only regionally (M12) + operator A/B whole-frame (informational).

### Ordering constraint (critical for the plan)
- **The baseline freeze + capture is the LAST, irreversible step of TP0a** and must come AFTER the operator blesses the money shots (incl. POV fov 37 vs 40). Everything before the freeze is reversible setup. Do NOT capture/lock the baseline until the operator gate clears — the SSOT allows the ONE fov refinement only "before any baseline is captured."

### Claude's Discretion (bounded by SSOT §4/§5)
Implementation choices for the metric scripts, the scorecard file format, the harness restore mechanism, and the anchors-dir layout are at Claude's discretion. When the SSOT specifies a value, the SSOT wins.

### Deferred Ideas (OUT OF SCOPE)
- All material/visual change: felt (TP1), cards (TP2), chips+instancing (TP3), rail/contour (TP4), lighting/shadows (TP5), depth/postprocessing+AO (TP6), cameras-confirm (TP7), feel/social-read (TP8), AAA verdict + new reference promotion (TP9).
- Mobile perf as a deliverable (here it is only a GUARDRAIL — M10/M11 measured, not optimized).
- Room / environment / backdrop enhancement, occupants/seats, props — out of the whole program's table-OBJECT scope.
- The POV fov 37-vs-40 final pick + the 3-money-shot blessing + the M1 on-device confirm are **operator perceptual-gate items** surfaced at verification (human-needed), not planning decisions.
</user_constraints>

<phase_requirements>
## Phase Requirements (mapped from SSOT §TP0 acceptance)

| ID | Description (from SSOT §TP0) | Research Support |
|----|------------------------------|------------------|
| TP0.0 | Operator confirms M1 cards-as-protagonist read on-device BEFORE materiality work; fail → stop before TP1 | Operator gate; not automatable. Lab default view = `?cam=card` POV (`TableLab.tsx:615`) is the M1 shot. Plan provides the capture + the gate checklist; operator runs on-device. |
| TP0a-1 | Verify `lab-shot.mjs` for HERO/POV/MACRO (D3D11, spin=off, DPR2, no console errors) | Harness intact at main-checkout `.dev-stack/lab-shot.mjs`; flags + viewport confirmed (§Capture Harness). Console errors already captured + printed by the harness (`errors[]`, lines 26-30,55). |
| TP0a-2 | Freeze the 3 presets (HERO 32 / POV **37** / MACRO 26) + Perla hand + demoted pot, recorded verbatim | Code today: HERO 32 ✓, MACRO 26 ✓, **POV = 40 (needs the 40→37 edit)** `TableLab.tsx:618-623`. Scene already matches (§Lab Scene Reality). |
| TP0a-3 | Read draw-call + frame-time baseline via `renderer.info` + a `?stats` overlay (vsync OFF) | No `?stats` overlay exists (grep: 0 matches). Add dependency-free `useThree`+`useFrame` reader (§`?stats` Overlay). M10/M11 thresholds in §4.5. |
| TP0a-4 | Capture baseline corpus at HEAD **and** at the protected tag | Worktree HEAD `bab28af`; protected tag → `d17df37`; second worktree at tag is the safe mechanism (§Baseline Capture). |
| TP0a-5 | Author the 15-element scorecard with baseline scores | File-format proposal in §15-Element Scorecard. |
| TP0a-6 | Persist anchor corpus to `docs/table-3d/anchors/` (small PNGs) | Dir is NOT gitignored (verified) → commitable. Layout in §Anchor Corpus Layout. PNG-size caveat in §Risks. |
| TP0b-1 | Implement §4.5 metrics by tier (sharp pixel math) | sharp@0.34.5 importable at ROOT (verified). Per-metric sketches in §Metric Tooling. |
| TP0b-2 | Validate each metric against a positive + negative control frame before admitting to gate-set | Control-frame pattern in §Metric Tooling → "The meta-gate". |
| TP0b-3 | MSE-as-SSIM-proxy (M12); legibility = px-height + manual (M1, no OCR) | Pre-approved; sketches provided. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Scene definition (cameras, lights, scene, URL params) | R3F lab (`frontend/src/lab/`) | — | The instrument-under-test. TP0 reads/freezes it; the ONLY edits are POV 40→37 + the `?stats` overlay, both behind the operator gate. |
| Live WebGL render → PNG | Capture harness (`.dev-stack/lab-shot.mjs`, Node+Playwright, root) | — | The IDE preview tool times out on WebGL; Playwright on real D3D11 GPU is the only path. Runs against the Vite dev server. |
| Dev server (serves `/table-lab.html`) | Vite (`frontend/`) | — | `npm run dev` on 5173/5174; needs `frontend` deps installed. |
| Pixel-math metrics (M1–M12,+A,+B) | Node metric scripts (root-run `.mjs`, `sharp`) | — | sharp resolves at root. Pure functions over captured PNGs; no scene coupling. |
| Determinism / byte-identity (M9, M7-assert) | Node (md5 of PNG bytes; static code grep for Bloom) | — | M9 = `crypto.createHash('md5')` on two captures; M7 = assert no postprocessing import (none installed). |
| Anchor persistence | git (`docs/table-3d/anchors/`) | — | Tracked, not gitignored. Survives clean checkout (the whole point — `.dev-stack/` does not). |
| Scorecard authorship + freeze record | Markdown in `docs/table-3d/` | — | Human-authored rubric + operator baseline scores; lives next to the anchors. |
| M1 precondition + money-shot blessing | Operator (on-device, RTX 4060) | — | Perceptual gates; surfaced at verification, never a planning decision. |

---

## Standard Stack

> Per the constraints, the metric/tooling approach is PRE-DECIDED — this is not exploratory. The "stack" here is *what already exists in the repo* that TP0 reuses. No alternatives are researched.

### Core (all already present — verify, don't add)
| Library | Version | Purpose | Where it resolves |
|---------|---------|---------|-------------------|
| `playwright` | `^1.60.0` | Headless Chromium on real D3D11 GPU → PNG capture | ROOT `node_modules` [VERIFIED: `require('playwright')` succeeds at root] |
| `sharp` | `^0.34.5` | All pixel math (region sampling, luma/HSV/Lab, MSE) | ROOT `node_modules` [VERIFIED: `require('sharp')` → 0.34.5 at root] |
| `three` | `^0.169.0` | The scene under test (renderer.info source) | `frontend` (after `npm install`) [CITED: frontend/package.json] |
| `@react-three/fiber` | `^8.17.10` | `useThree`/`useFrame` for the `?stats` reader | `frontend` (after `npm install`) [CITED: frontend/package.json] |
| `@react-three/drei` | `^9.114.0` | Already used (Environment, ContactShadows, etc.); NOT used for `?stats` | `frontend` (after `npm install`) [CITED: frontend/package.json] |
| `vite` | `^7.3.1` | Dev server for `/table-lab.html` (NOT a prod build input for the lab) | `frontend` (after `npm install`) [VERIFIED: frontend/package.json — Vite 7, NOT 5 as docs casually say] |
| `vitest` | `^3.2.4` | Existing `cards.test.ts`; available for any pure-helper metric unit tests | `frontend` (after `npm install`) [CITED: frontend/package.json] |
| Node `crypto` | builtin | md5 byte-identity for M9 | builtin |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (vendored JS SSIM) | — | Optional TIER-2 only | SSOT explicitly says NOT needed for TP0; MSE is the approved SSIM proxy. Do NOT add at TP0. |

### Alternatives Considered (and rejected per SSOT)
| Instead of | Could Use | Why rejected |
|------------|-----------|--------------|
| sharp MSE as SSIM proxy | a real SSIM lib (`ssim.js`) | SSOT §4.5 pre-approves MSE proxy; "no SSIM lib needed." Adding one violates the zero-extra-dep discipline. |
| px-height + manual for M1 | automated OCR (tesseract) | SSOT explicitly downgrades legibility to px-height + manual; "NO automated OCR hard gate." |
| dependency-free `?stats` reader | drei `<Stats>` / `<PerfMonitor>` | Those draw a **visible** widget → changes pixels → breaks M9/zero-visual-change. Must read `gl.info` headlessly instead. |
| mount Bloom for any reason | — | Hard NO (anti-casino, §5.4). M7 asserts its absence. |

**Installation (the ONLY installs TP0 needs):**
```bash
# 1) frontend deps so the Vite dev server runs (node_modules exists but is stale/empty):
cd frontend && npm install
# 2) sharp + playwright are ALREADY at the repo root — NO install needed. Verify only:
#    (run from repo root) node -e "require('sharp'); require('playwright'); console.log('ok')"
```

**Version verification (performed this session):**
```
require('sharp') at root      → 0.34.5      [VERIFIED 2026-06-09]
require('playwright') at root → import OK   [VERIFIED 2026-06-09]
three / r3f / drei            → declared in frontend/package.json; NOT yet resolvable
                                (frontend/node_modules empty) → npm install required
```

## Package Legitimacy Audit

> All packages below are pre-existing in the repo's committed `package.json` files (not newly introduced by this research). No new external package is added at TP0. slopcheck was not run because nothing new is being installed; the registry-existence + import-success of the pre-existing, long-pinned deps is the relevant signal.

| Package | Registry | Status | Source Repo | Disposition |
|---------|----------|--------|-------------|-------------|
| `sharp` | npm | pre-installed, imports OK (0.34.5) | github.com/lovell/sharp | Approved (pre-existing root dep) |
| `playwright` | npm | pre-installed, imports OK | github.com/microsoft/playwright | Approved (pre-existing root dep) |
| `three` | npm | declared, pinned ^0.169 | github.com/mrdoob/three.js | Approved (pre-existing frontend dep) |
| `@react-three/fiber` | npm | declared, pinned ^8.17.10 | github.com/pmndrs/react-three-fiber | Approved (pre-existing frontend dep) |
| `@react-three/drei` | npm | declared, pinned ^9.114.0 | github.com/pmndrs/drei | Approved (pre-existing frontend dep) |

**Packages removed due to slopcheck [SLOP] verdict:** none (no new packages introduced).
**Packages flagged as suspicious [SUS]:** none.

*No new external package is required for TP0. If a future planner adds the optional vendored SSIM (TIER-2 only, NOT at TP0), prefer copying source into the repo over an npm dependency, per SSOT.*

---

## Architecture Patterns

### System Architecture Diagram (the eval rig data flow)

```
                              OPERATOR (on-device, RTX 4060)
                                        │
                  (TP0.0 M1 gate · POV 37-vs-40 blessing · scorecard scores)
                                        │ blesses ↓ (gate clears → freeze allowed)
                                        ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  frontend/  (Vite dev server :5173)   ── serves ──►  /table-lab.html      │
  │     src/lab/TableLab.tsx  (the FROZEN scene)                              │
  │        ?cam=hero|card|macro  ?spin=off  ?chips=full|off  ?stats(NEW)      │
  │        gl{ preserveDrawingBuffer:true } ← makes the canvas readable       │
  └───────────────────────────┬─────────────────────────────────────────────┘
                              │  HTTP (LAB_URL)
                              ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  REPO ROOT  ── node .dev-stack/lab-shot.mjs <out.png>                     │
  │     Playwright → Chromium  --headless=new --use-angle=d3d11 --enable-gpu  │
  │     viewport 1440×900 @ DPR2  →  2880×1800 PNG                            │
  │     auto-appends &spin=off · dispatches resize · waits for canvas>600px   │
  │     prints CANVAS / GPU / ERRORS · writes PNG                            │
  └───────────────────────────┬─────────────────────────────────────────────┘
                              │  PNG bytes
              ┌───────────────┼────────────────────────────────┐
              ▼               ▼                                ▼
   ┌──────────────────┐  ┌──────────────────────┐   ┌─────────────────────────┐
   │ METRIC SCRIPTS    │  │ M9 determinism        │   │ ANCHOR PERSISTENCE       │
   │ (root .mjs, sharp)│  │ md5(capture A)==       │   │ copy PNGs →              │
   │ region rects →    │  │ md5(capture B)         │   │ docs/table-3d/anchors/   │
   │ luma/HSV/Lab/MSE  │  │ (crypto, byte-level)   │   │ (TRACKED — survives      │
   │ → PASS/FAIL/info  │  │                        │   │  clean checkout)         │
   │ gated by +/- ctrl │  │ M7: grep no Bloom impt │   │ .dev-stack/ = gitignored │
   └──────────────────┘  └──────────────────────┘   └─────────────────────────┘
              │                                                  │
              └──────────────► VERDICT in this doc + scorecard ◄─┘
                              (rig frozen · baseline recorded · metrics admitted)
```

Data flows: operator gate → (freeze allowed) → Vite serves the frozen scene → root-run Playwright captures deterministic PNGs → metric scripts + md5 + anchor-copy consume those bytes → the verdict (frozen rig + baseline + validated metrics) lands in this doc, the scorecard, and `docs/table-3d/anchors/`.

### Recommended file/dir structure (TP0 deliverables)
```
docs/table-3d/
├── anchors/                      # TRACKED (small PNGs). The regression anchor corpus.
│   ├── head/                     #   baseline at worktree HEAD (bab28af)
│   │   ├── hero.png  card.png  macro.png
│   ├── reference-tag/            #   baseline at protected tag (d17df37)
│   │   ├── hero.png  card.png  macro.png
│   └── controls/                 #   positive + negative control frames per metric (M3/M4/M5/...)
│       ├── m3-felt-good.png  m3-felt-bad.png  ...
├── SCORECARD_TABLE_3D.md         # the 15-element 0–5 rubric + baseline scores
└── TP0_BASELINE.md (or fold into ROADMAP)  # the frozen-rig record (presets verbatim, draw/frame-time numbers)

tools/table-3d/   (or .dev-stack/, see Risks)  # the metric scripts (root-run .mjs, sharp)
├── metrics.mjs                   # M1–M12,+A,+B implementations (region rects + math)
├── run-metrics.mjs               # runs the admitted set over a capture dir, prints a table
└── m9-determinism.mjs            # md5 byte-identity check

.dev-stack/lab-shot.mjs           # RESTORED into the worktree OR run from main checkout (gitignored)
```

> **Where the metric scripts live is a real decision (see §Risks).** If they go in `.dev-stack/` they are gitignored → not reproducible after a clean checkout (the exact trap the anchors avoid). Recommend a TRACKED `tools/table-3d/` (or similar) so the *instrument code* survives, even though the harness `lab-shot.mjs` itself stays in gitignored `.dev-stack/`. The planner should pick one and state it; this is within Claude's discretion per CONTEXT.

### Pattern 1: dependency-free `?stats` overlay (zero-visual-change for capture)
**What:** A flag-gated reader of `gl.info.render.calls` + a rolling frame-time sample, surfaced WITHOUT drawing anything that lands in the capture.
**When to use:** TP0a-3 (draw-call + frame-time baseline). Must not alter a pixel under capture.
**How (grounded in r3f, which exposes `gl` = the THREE.WebGLRenderer):**
```tsx
// Source: react-three-fiber useThree/useFrame (drei NOT used — its <Stats> draws a visible widget).
// gl.info.render.calls is THREE.WebGLRenderer.info — the canonical draw-call count.
// IMPORTANT: gl.info.autoReset defaults true → calls resets each frame; read it INSIDE useFrame.
function StatsProbe() {
  const gl = useThree((s) => s.gl);
  useFrame(() => {
    const calls = gl.info.render.calls;          // draw calls this frame (M10)
    // frame-time: sample performance.now() deltas across N frames → median (M11)
    // expose via a ref/console/DOM-data-attr that the harness reads with page.evaluate(),
    // NOT via a rendered overlay that would appear in the PNG.
    (window as any).__labStats = { calls /*, medianFrameMs */ };
  });
  return null; // renders NOTHING → zero pixels changed → M9 stays byte-identical
}
// mount only when qp("stats") !== null, so the default/captured scene is untouched.
```
The harness already runs `page.evaluate(...)` (lines 43-54) to read canvas + GPU; an identical `page.evaluate(() => window.__labStats)` reads the numbers with no on-screen overlay. This keeps M9 (determinism) and the zero-visual-change invariant intact while satisfying M10/M11.

> **vsync caveat (M11):** Playwright/Chromium headless typically does NOT vsync-lock, but to honor the SSOT's "vsync OFF, full fx, < 8 ms median at HERO on the RTX 4060," the authoritative M11 read is the operator running the live lab with `?stats` on-device (the harness runs headless and its frame-time is indicative, not the gate). Plan M11 as an operator-assisted read; M10 (draw calls) IS deterministic and fully automatable from the headless capture.

### Pattern 2: capture from ROOT against the frontend dev server
**What:** Two terminals — `cd frontend && npm run dev` (server), then root `LAB_URL=... node .dev-stack/lab-shot.mjs out.png` (capture). The harness resolves `playwright` from the ROOT `node_modules`, so it must be invoked with the root as cwd (or via an absolute path to a `lab-shot.mjs` that can see root `node_modules`).
**When to use:** every capture (TP0a baseline, TP0b control frames).

### Anti-Patterns to Avoid
- **Using the IDE/preview screenshot tool on the lab** — times out on live WebGL (documented, HANDOFF lesson #1). Always Playwright → PNG → `Read`.
- **Adding drei `<Stats>`/`<PerfMonitor>` for `?stats`** — draws a visible FPS widget → alters pixels → breaks M9. Read `gl.info` headlessly instead.
- **Capturing the baseline before the operator blesses POV 37-vs-40** — the freeze is irreversible; the SSOT allows the fov refinement ONLY before any baseline. (Ordering constraint.)
- **Committing PNGs to `.dev-stack/`** — it's gitignored (line 25); the anchor would not survive a clean checkout. Anchors go to `docs/table-3d/anchors/`.
- **Putting a coplanar disc at felt y=0** — z-fights into a casino sunburst (HANDOFF lesson #3). Not a TP0 concern unless the `?stats` work accidentally adds geometry (it must not).
- **Double-quotes inside a PowerShell here-string commit message** — breaks the `-m` arg (HANDOFF lesson #4). Use `git commit -F <file>` or git-bash.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebGL → PNG on the real GPU | a custom screenshot loop / canvas.toDataURL plumbing | the existing `.dev-stack/lab-shot.mjs` (Playwright, D3D11) | Already solves the headless-resize + GPU-flag + SwiftShader-artifact problems; battle-tested in this exact repo. |
| Pixel region sampling / luma / colorspace | a hand-rolled PNG decoder + per-pixel JS loops from scratch | `sharp` (`.extract()` for rects, `.raw()` for pixel buffers, `.stats()` for channel stats) | sharp is already installed at root, is fast (libvips), and handles PNG decode + region crop + raw access. |
| Byte-identity check (M9) | image-diffing pixel-by-pixel | Node `crypto.createHash('md5')` on the PNG bytes | The SSOT defines M9 as md5-equal of the raw PNG file. Byte compare is exact and trivial; pixel-diff is the wrong tool. |
| SSIM | install/maintain an SSIM library | sharp MSE proxy (mean squared error over a region) | SSOT pre-approves MSE-as-SSIM-proxy; avoids a dependency it explicitly says is unnecessary. |
| Legibility/OCR | tesseract / an OCR hard gate | rank-glyph bbox px-height + operator manual confirm | SSOT downgrades M1 to px-height+manual; OCR is brittle on stylized Fournier glyphs and explicitly excluded. |

**Key insight:** TP0's entire job is to *reuse* the repo's existing capture + image tooling and wrap it in deterministic, control-validated checks. Every "build it myself" temptation here has a pre-installed, pre-approved answer. The only genuinely new code is thin: the `?stats` reader, the metric region-math, the md5 check, and the scorecard.

## Runtime State Inventory

> TP0 is an instrumentation phase with NO rename/migration, but it DOES interact with on-disk + git state (harness location, tags, anchors). This inventory covers that surface so the plan closes every gap.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no DB/datastore touched. The lab is pure static client-side WebGL (HANDOFF: "no backend, no game data, no secrets, no network calls"). | None — verified by reading the lab + HANDOFF. |
| Live service config | None — TP0 starts no service except the local Vite dev server + ephemeral Playwright Chromium. No external service config. | None. |
| OS-registered state | None — no scheduled tasks, no installed binaries beyond Playwright's already-installed Chromium (root `node_modules/playwright`). | Verify Playwright's Chromium is installed (it imports OK; the harness has run before in main checkout). If a fresh `npx playwright install chromium` is ever needed it's a one-time root op — but the harness has produced REFERENCE-*.png so it works. |
| Secrets/env vars | Only `LAB_URL` (the harness's optional input, `lab-shot.mjs:11`). No secret. | None. |
| Build artifacts | `frontend/node_modules` EXISTS but is STALE/EMPTY (three/r3f/drei/react/vitest do NOT resolve) → the dev server won't start until reinstalled. `.dev-stack/` (incl. `lab-shot.mjs` + REFERENCE frames) ABSENT from the worktree (gitignored), PRESENT in main checkout. | `cd frontend && npm install`. Restore `lab-shot.mjs` (+ REFERENCE frames) into the worktree OR run captures from the main checkout. |

**The canonical question (after every file is in place):** the only runtime systems that matter are (a) the Vite dev server — needs `frontend` deps; (b) the Playwright Chromium — already installed at root; (c) the gitignored `.dev-stack/` harness — restore one file. Nothing is cached/stored/registered beyond these.

## Common Pitfalls

### Pitfall 1: Capturing the baseline before the operator gate (IRREVERSIBLE)
**What goes wrong:** You freeze + commit the baseline corpus, THEN the operator picks POV fov 40 (reverting the 37 tighten) — now the baseline is at the wrong framing and the whole program's apples-to-apples anchor is invalid.
**Why it happens:** Treating the capture as "just a script run" rather than the irreversible lock it is.
**How to avoid:** Sequence ALL reversible setup first (harness verify, `?stats`, scene confirm, the 40→37 edit as a candidate). Gate. Only after the operator blesses the 3 shots (incl. the final POV fov) do you run the freeze capture + commit. The SSOT: the fov refinement is allowed ONLY "before any baseline is captured."
**Warning signs:** Any task ordering that captures/commits anchors before a `checkpoint:human-verify` for the money-shot blessing.

### Pitfall 2: Non-deterministic captures fail M9
**What goes wrong:** Two captures aren't byte-identical → M9 fails → the determinism gate (a T1 must-pass) blocks.
**Why it happens:** `autoRotate` (`TableLab.tsx:662`, default ON unless `?spin=off`) or any micro-motion is live during capture; or environment/shadow bake hasn't settled.
**How to avoid:** The harness already auto-appends `&spin=off` (`lab-shot.mjs:13`), which sets `autoRotate={qp("spin") !== "off"}` → false. The harness also waits 2500ms post-resize for env+shadows to settle (line 41). For M9, capture twice via the SAME harness invocation path and md5-compare. There is no other live motion in the scene today (no `useFrame` animation exists in the lab — verified). Keep it that way at TP0.
**Warning signs:** md5 mismatch between consecutive runs; any `useFrame` added without a capture-flag freeze.

### Pitfall 3: `?stats` overlay leaks into the captured pixels
**What goes wrong:** A visible draw-call/FPS overlay appears in the PNG → M9 byte-identity breaks AND the "zero visual change" invariant is violated AND the anchor frames are contaminated.
**Why it happens:** Reaching for drei `<Stats>` or a DOM overlay rendered into the canvas region.
**How to avoid:** The `?stats` reader renders `null` and writes numbers to `window.__labStats`, read via `page.evaluate`. Never draw the numbers on-canvas. (Pattern 1.)
**Warning signs:** Any overlay element inside `<Canvas>`; any HTML positioned over the canvas that screenshot would include.

### Pitfall 4: sharp/playwright "not installed" assumption sends the plan to install duplicates
**What goes wrong:** The plan adds `sharp`/`playwright` to `frontend/`, creating a second copy, version drift, and wasted time — when both already work at root.
**Why it happens:** CONTEXT.md states "sharp is NOT installed anywhere yet" — this is INCORRECT (verified `require('sharp')` → 0.34.5 at root; playwright imports too).
**How to avoid:** Run metric scripts + the harness from the repo ROOT (cwd = root) so Node resolves root `node_modules`. Only `frontend` needs `npm install` (for the dev server). Do NOT add sharp/playwright to frontend.
**Warning signs:** A task that runs `npm install sharp` anywhere.

### Pitfall 5: Anchor PNGs bloat the git repo
**What goes wrong:** The REFERENCE frames are 2.4–4.9 MB EACH at 2880×1800 (measured). Committing the full corpus (HEAD ×3 + tag ×3 + control frames) of full-res PNGs adds tens of MB to a code repo permanently.
**Why it happens:** Capturing at DPR2 → 2880×1800 and committing raw.
**How to avoid:** The SSOT says "small PNGs." Downscale the committed anchors (e.g. to 1280-wide) and/or `pngquant`/`sharp` re-encode for the tracked corpus, while the metric math can still run on full-res working copies in `.dev-stack/`. Decide a max-size budget (Claude's discretion). M1 specifically operates on a "1080p downscale of POV" anyway, so a downscaled committed POV anchor is on-spec.
**Warning signs:** `docs/table-3d/anchors/` totaling >~10 MB; committing 2880×1800 frames verbatim.

## Code Examples

### M3 felt-hue ΔE (T1, fully automatable) — sharp region sample
```js
// Source: sharp .extract() + .stats() over the fixed felt sample rect.
// Threshold (SSOT §4.5): mean Lab ΔE < 12 from nearest of #1f9163 / #147a51 / #0a4a33.
// NB: those three are LITERALLY the felt base gradient stops in textures.ts:437-439 —
// so a correctly-lit felt MUST land in-palette; this metric guards regressions.
import sharp from "sharp";
const { data, info } = await sharp(pngPath)
  .extract({ left: FELT_RECT.x, top: FELT_RECT.y, width: FELT_RECT.w, height: FELT_RECT.h })
  .raw().toBuffer({ resolveWithObject: true });
// average RGB over the rect → convert to Lab → ΔE76/ΔE2000 vs each palette anchor → min.
// (RGB→XYZ→Lab is ~20 lines; or sharp's .stats() gives per-channel means directly.)
```

### M9 determinism (T1) — byte identity
```js
// Source: SSOT §4.5 M9 = two consecutive captures byte-identical (md5 equal).
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex");
// capture twice to a.png / b.png via the harness, then:
const pass = md5("a.png") === md5("b.png");   // M9 PASS iff true
```

### M7 bloom-absence (T1) — code assert
```js
// Source: SSOT §4.5 M7 = "no Bloom effect mounted (code assert)" + no large bright halo.
// Code assert: postprocessing is NOT installed (frontend/package.json has no
// `postprocessing`/`@react-three/postprocessing`) AND TableLab.tsx imports none.
// Assert by grep: zero matches for /Bloom|EffectComposer|postprocessing/ in src/lab → PASS.
// (Histogram halo check is the secondary, sharp-based confirmation.)
```

### Capture invocation (the exact contract, from `lab-shot.mjs`)
```bash
# run from REPO ROOT (resolves playwright from root node_modules):
#   arg[2] = output path ; LAB_URL = scene URL ; &spin=off auto-appended.
LAB_URL="http://localhost:5173/table-lab.html?cam=hero"  node .dev-stack/lab-shot.mjs docs/table-3d/anchors/head/hero.png
LAB_URL="http://localhost:5173/table-lab.html?cam=card"  node .dev-stack/lab-shot.mjs docs/table-3d/anchors/head/card.png
LAB_URL="http://localhost:5173/table-lab.html?cam=macro" node .dev-stack/lab-shot.mjs docs/table-3d/anchors/head/macro.png
# (writes 2880×1800 PNGs; downscale before committing — see Pitfall 5.)
```

---

## Research Question Answers (code-grounded)

### Q1 — Lab scene reality (cite line ranges)
**Camera presets (`TableLab.tsx:614-633`):** the `cam` memo reads `?cam` (default `"card"`) and selects from a `presets` record:
- **`hero`** (line 620): `pos [1.2, 5.0, 8.2]`, `target [0, 0.5, 0]`, **`fov 32`** ✓ matches SSOT.
- **`card`** (line 618): `pos [0, 4.7, 10.6]`, `target [0, 0.25, 1.2]`, **`fov 40`** ✗ — SSOT wants **37** ("tightened 40→37"). **THE code is still 40.** This single value is the operator-gate refinement: change `40` → `37` on line 618 as the candidate, capture both, let the operator pick, then lock.
- **`macro`** (line 623): `pos [-1.7, 1.7, 2.4]`, `target [-1.55, 0.05, 1.05]`, **`fov 26`** ✓ matches SSOT.
- (Other presets exist — wide/close/top/room/rail/gather/eye, lines 619-630 — but only hero/card/macro are the frozen money shots.)

**Staged scene:** `LAB_COMMUNITY = ["1E","12C","11B"]` and `LAB_HOLE = ["10O","7O"]` are defined at `TableLab.tsx:60-61` — EXACTLY the frozen set. Layout: `communityLayout()` lays the 3 board cards flat (`cards.ts:60-68`, rotation `-π/2`, `COMMUNITY_Z = -0.55`), `holeLayout()` fans + lifts the 2 hole cards toward the POV camera (`cards.ts:78-90`, `HOLE_Z = 3.95`, `HOLE_LIFT = 0.46`). All 5 are FACE-UP. The demoted accent pot is the `else` branch at `TableLab.tsx:700-708`: `<group position={[2.7, 0, 1.5]} scale={0.66}>` with C×6, B×4, E×3 stacks + one O chip — EXACTLY `group[2.7,0,1.5] scale 0.66`.

**URL params wired:** `qp()` helper (`TableLab.tsx:65-68`) reads `window.location.search`.
- `?cam` → camera memo (line 615).
- `?spin` → `autoRotate={qp("spin") !== "off"}` (line 662) — default ON; `spin=off` freezes (harness auto-applies).
- `?chips` → `full` restores the heavy pot (lines 691-699), default = demoted accent (700-708), `off` clears (line 708 ternary → null).
- `?seats` → `qp("seats") === "on"` mounts experimental `<Seats>` (line 713) — OFF by default.
- Also: `?felt=magenta|basic` (363-374), `?env=off` (736), `?sh=off` (564), `?cs=off` (723), `?c=literal` (604), `?table=<silhouette>` (673).

### Q2 — `?stats` overlay
**Does one exist?** NO. Grep for `stats|renderer.info|drawcall|frame-time|Stats` across `frontend/src/lab` → **0 matches**. It must be added.
**Where renderer/Canvas/lights are configured:** the `<Canvas>` is at `TableLab.tsx:757-767` with `gl={{ antialias, preserveDrawingBuffer: true, toneMapping: ACESFilmic, toneMappingExposure: 1.05 }}` and `dpr={[1,2]}`, `shadows`. `<Lights>` is `TableLab.tsx:548-578` (ambient + hemisphere + the warm key spotLight with `castShadow`, two fills, a back rim, a low warm pointLight). The renderer (`gl`) is reachable in any child via `useThree((s)=>s.gl)`.
**Minimal zero-visual-change addition:** mount a `StatsProbe` (renders `null`) only when `qp("stats") !== null`; inside `useFrame`, read `gl.info.render.calls` (M10) and sample frame-times (M11), write to `window.__labStats`, and let the harness read it via `page.evaluate`. No on-canvas drawing → M9 + zero-visual-change preserved. (See Pattern 1 + the vsync caveat for M11.)

### Q3 — Capture harness internals (`.dev-stack/lab-shot.mjs`, read from main checkout)
- **Invocation contract:** `LAB_URL` env (default `http://localhost:5173/table-lab.html`, line 11) + `process.argv[2]` = output path (default `.dev-stack/diag/table-3d/hero.png`, line 14). `argv[3]` ("camJson") is mentioned in the header comment but NOT actually consumed in this version — only `LAB_URL` + out path are live.
- **`&spin=off` auto-append** (line 13) — guarantees frozen rotation.
- **Chromium flags** (lines 20-23): `headless:true` + `args: ["--headless=new","--ignore-gpu-blocklist","--enable-gpu","--use-angle=d3d11"]` → real D3D11 GPU (avoids SwiftShader's radial-ray artifacts).
- **Viewport/DPR** (line 24): `{ width:1440, height:900 }`, `deviceScaleFactor: 2` → **2880×1800** PNG.
- **Resize-dispatch trick** (line 36): `window.dispatchEvent(new Event("resize"))` after load, because R3F's headless ResizeObserver is unreliable; then waits for `canvas.width > 600` (lines 37-39) and 2500ms for env/shadows to settle (line 41).
- **Diagnostics printed:** `CANVAS {w,h,cw,ch}` (line 47), `GPU <unmasked renderer>` (line 54), `ERRORS [...]` (line 55) — console errors are captured via `page.on("console"/"pageerror")` (lines 26-30). This satisfies TP0a's "no console errors" verify directly.
- **Why `page.screenshot()` works on WebGL here:** the Canvas sets `preserveDrawingBuffer: true` (`TableLab.tsx:762`) — without it the buffer is cleared before the screenshot reads it.
- **Imports** (lines 7-9): `playwright` + `node:fs` + `node:path` ONLY. → resolves `playwright` from the cwd's `node_modules` (root has it).
- **Minimal restore set into the worktree:** literally **`.dev-stack/lab-shot.mjs`** (one file) — it needs nothing else but `playwright` (root) + a running dev server. Optionally also copy `.dev-stack/diag/table-3d/elev/REFERENCE-{hero,eye,wide,room}.png` (the protected-reference frames, 4 files) if you want the old reference set alongside. **Simpler alternative:** skip the restore and run all captures from the MAIN checkout (`C:\Users\Usuario\Documents\CHIRIBITO\chiri-infrastructure\chiri-app`) where `.dev-stack/` already lives, then copy the output PNGs into the worktree's `docs/table-3d/anchors/`. Either is fine; the restore-one-file path keeps everything inside the worktree.

### Q4 — Metric tooling (TP0b), per §4.5, sharp-based
> sharp@0.34.5 + node `crypto` cover everything. Region rects are fixed pixel boxes on the 2880×1800 (or 1080p-downscaled) frames — author them once against the frozen captures.

| # | Metric | Concrete sharp/code computation | Class |
|---|--------|----------------------------------|-------|
| **M1** | Legibility | Downscale POV to 1080p; measure the rank-glyph bounding-box **height in px** for each hole card (manual/assisted bbox on the frozen frame); PASS if ≥ 22 px **AND** operator confirms "legible." | px-check + **manual** (operator confirm) |
| **M2** | Cards-vs-chips area | Segment cards' vs chips' projected screen area. Pure-pixel is hard (color overlap) → SSOT allows **manual polygon fallback**: trace card-region + chip-region polygons on the frozen frame, compute area ratio; PASS if ≥ 2.0×. | region-segmentation (manual fallback) |
| **M3** | Felt-hue ΔE | sharp `.extract(feltRect).raw()` → mean RGB → Lab → min ΔE to {#1f9163,#147a51,#0a4a33}; PASS if < 12. (Anchors are the literal felt gradient stops, textures.ts:437-439.) | **pure-pixel (T1, automatable)** |
| **M4** | Brass-not-gold | sharp `.extract(brassRect).raw()` → RGB→HSV; PASS if H∈[35,48]° ∧ S≤0.55 ∧ V≤0.80 (no high-sat high-val gold). | **pure-pixel (T1)** |
| **M5** | Highlight-clip | raw luma over felt rect + whole frame; count luma>250; PASS if <0.5% of felt ∧ <1.5% whole frame. | **pure-pixel (T1)** |
| **M6** | Contact-shadow | compare mean luma of a rect directly under each hole card / chip stack vs an adjacent open-felt rect; PASS if ≥12% darker. | **pure-pixel (T1)** |
| **M7** | Bloom-absence | **code assert**: grep `src/lab` for `/Bloom|EffectComposer|postprocessing/` → 0 matches (none installed); + histogram check for a large connected bright halo. | code-assert + pixel |
| **M8** | Vignette hierarchy | mean corner luma vs center luma; PASS if corners 8–20% below center. | **pure-pixel (T1)** |
| **M9** | Determinism | `md5(captureA) === md5(captureB)` (node crypto). | **byte-identity (T1)** |
| **M10** | Draw-call ceiling | read `gl.info.render.calls` via `?stats` at HERO/POV/MACRO; PASS if <150 (and `?chips=full` <220 separately). | **automatable (via `?stats`)** |
| **M11** | Frame-time floor | median frame-time at HERO, vsync OFF, full fx; PASS if <8 ms. **Operator-assisted** (headless frame-time is indicative; the gate is the on-device RTX 4060 read). | semi-auto + **operator** |
| **M12** | Regional MSE | sharp raw buffers of the legibility region + felt-mark identity region, current-phase vs **previous-phase** tag; mean squared error below a churn threshold. Whole-frame-vs-reference = **operator A/B only, informational**. | **pure-pixel MSE (T2)**; whole-frame informational |
| **+A** | Warm-corner floor | corner luma ≥ a floor (not crushed black) AND corner hue warm (not neutral). | **pure-pixel (T1)** |
| **+B** | Felt-specular extent | bright-sheen pixel fraction below a small cap AND no continuous specular sweep across felt ("fuzz" not "satin"). | pure-pixel (T1/2) |

**Pure-pixel (T1, fully automatable):** M3, M4, M5, M6, M8, M9, M10(via stats), +A, +B. **Manual/operator:** M1 (px+confirm), M11 (on-device read). **Region-segmentation (manual fallback allowed):** M2, M12.

**The meta-gate (positive + negative CONTROL FRAME validation) — REQUIRED before a metric gates:**
For each metric, construct two control frames and assert the metric's verdict matches expectation:
- **Positive control (known-GOOD):** the current baseline frame (or a deliberately in-spec crop) → the metric must **PASS**.
- **Negative control (known-BAD):** a deliberately violating frame → the metric must **FAIL**. Construct cheaply with the lab's debug flags + sharp tints, e.g.:
  - M3 felt-hue: `?felt=magenta` (`TableLab.tsx:365`) renders pure magenta felt → M3 must FAIL. `?felt=basic` or the normal felt → must PASS.
  - M4 brass-not-gold: a sharp-tinted high-sat high-val gold crop of the brass rect → must FAIL; the real brass → PASS.
  - M5 highlight-clip: a sharp `.linear()` over-exposed crop → must FAIL; normal → PASS.
  - M7 bloom: a synthetic bright-halo frame → must FAIL the histogram check; normal → PASS.
  - M9 determinism: two identical files → PASS; a 1-byte-altered copy → FAIL.
A metric that does not produce the expected PASS-on-good + FAIL-on-bad is **informational only** (not admitted to the gate-set), per the red-team meta-gate. Record each metric's control results next to its threshold.

**`sharp` must be added?** NO — it's already at the repo root (verified 0.34.5). Run the metric scripts from root.

### Q5 — Baseline capture at HEAD + protected tag (safe Windows/git mechanism)
Three commits matter: **worktree HEAD = `bab28af`** (this branch `claude/cranky-volhard-dd8b01`), **main/spike HEAD = `cae5c79`** (`spike/table-3d-hero`), **protected tag = `d17df37`** (`table-3d-premium-reference-2026-06-04`). The CONTEXT/env note says "HEAD (cae5c79... actually current HEAD is the smart-discuss commit)" — the worktree's actual HEAD is `bab28af`; the planner should capture at the worktree HEAD that contains the frozen rig (after the POV edit + `?stats`, post-gate) and ALSO at the protected tag.

**Safe mechanism (no worktree disturbance):** the protected tag is NOT checked out anywhere (main occupies `spike/table-3d-hero`, this worktree occupies its branch). Use a **second, throwaway git worktree at the tag**, capture, then remove it:
```bash
# from repo root — add a detached worktree at the protected tag, capture, remove:
git worktree add --detach ../tp0-ref-tag table-3d-premium-reference-2026-06-04
cd ../tp0-ref-tag/frontend && npm install        # the tag's frontend deps
npm run dev &                                     # serve the tag's lab (use a free port, e.g. 5174)
# from repo root, capture against that server:
LAB_URL="http://localhost:5174/table-lab.html?cam=hero"  node .dev-stack/lab-shot.mjs docs/table-3d/anchors/reference-tag/hero.png
# ... card, macro ...
git worktree remove ../tp0-ref-tag --force        # clean up; nothing in the main worktree was touched
```
This is the cleanest Windows-safe path: a detached worktree never moves the main worktree's HEAD or branch, and `git worktree remove` leaves no residue. (A `git stash` + `git checkout <tag>` + restore dance in-place is riskier and disallowed by the never-disturb invariant.) **Caveat:** the protected tag `d17df37` is the chip-centric premium table — it likely has NO cards (M1 shipped later), so its `card`/POV capture is a felt/rail/chip reference, not a card reference. The SSOT (TP9 DoD #2) already accounts for this: cards are compared vs the M1 captures, felt/rail/chips/lighting vs the protected tag. Capture the tag's 3 shots as the felt/rail/chip/lighting anchor regardless.

**Persist all anchors** (HEAD ×3, tag ×3, control frames) to `docs/table-3d/anchors/` (downscaled — Pitfall 5), commit (via `-F` to dodge the PowerShell quote gotcha).

### Q6 — 15-element scorecard (concrete tracked file format)
Propose `docs/table-3d/SCORECARD_TABLE_3D.md` (Markdown so it diffs cleanly and lives with the anchors). Structure: one row per element, a baseline score column (filled by the operator at TP0), per-level anchor descriptions (0–5), and a target column (≥4 at TP9). Example skeleton:

```markdown
# Table 3D — AAA Scorecard (15 elements · 0–5)
Baseline scored at TP0 (HEAD bab28af). Target green = ≥4/5 every element at TP9.
Anchors: docs/table-3d/anchors/head/{hero,card,macro}.png

| # | Element | Baseline | Target | 0 (absent) | 3 (acceptable) | 5 (AAA) | Anchor shot |
|---|---------|:-------:|:------:|------------|----------------|---------|-------------|
| 1 | felt          | _TP0_ | ≥4 | flat lit disc | woven look, in-palette | nap sheen + relief, relights | macro |
| 2 | cards         | _TP0_ | ≥4 | decal | legible stock | razor-legible Fournier stock | card(POV) |
| 3 | chips         | _TP0_ | ≥4 | glossy/oversized C | matte, demoted | tooled clay, instanced | hero/macro |
| 4 | leather rail  | _TP0_ | ≥4 | flat band | padded roll | broken-in cordobán w/ welt | hero/rail |
| 5 | wood coaming  | _TP0_ | ≥4 | brown plastic | varnished mahogany | figured grain, per-arc UV | hero |
| 6 | brass         | _TP0_ | ≥4 | gold/gaudy | aged brass | brass-not-gold (M4) | macro |
| 7 | body/contour  | _TP0_ | ≥4 | floats | mass present | elegant edge + mass | hero/wide |
| 8 | lighting      | _TP0_ | ≥4 | flat/cone | one warm key | shaped warm gradient | all 3 |
| 9 | shadows       | _TP0_ | ≥4 | none/hard | contact present | PCSS + baked contact | hero |
| 10 | depth        | _TP0_ | ≥4 | none | some falloff | AO+DOF+vignette restrained | hero |
| 11 | composition  | _TP0_ | ≥4 | dead zones | balanced | cards>board>rail, no voids | hero |
| 12 | cameras      | _TP0_ | ≥4 | unframed | usable | locked money shots | all 3 |
| 13 | tactility    | _TP0_ | ≥4 | CG-flat | material-forward | "you could pick it up" | macro |
| 14 | social-read  | _TP0_ | ≥4 | still-life | staged hand | shared mid-play read | hero |
| 15 | premium-overall | _TP0_ | ≥4 | prototype | "it works" | AAA, castizo, discreet | all 3 |
```
(Per-level wording is illustrative — the planner/operator can refine; the structure + the 15 rows + 0–5 + baseline + anchor mapping is the deliverable.)

### Q7 — Risks / landmines for the PLAN
- **z-fight felt-plane sunburst (HANDOFF #3):** felt plane at y=0; any coplanar disc → radial casino rays. TP0 adds NO geometry, so it's only a risk if the `?stats` work strays — keep `StatsProbe` rendering `null`.
- **PowerShell here-string commit-quote gotcha (HANDOFF #4, §11.6):** NO double quotes inside `-m` here-strings → use `git commit -F <file>` or git-bash. Affects every TP0 commit (anchors, scorecard, scripts).
- **Lab-must-stay-out-of-prod-build:** `vite.config.ts` has NO `table-lab` input (verified — only `index.html`/game builds; the lab is dev-server-only React, while prod entries are vanilla). TP0 must not add a lab build input. Re-verify isolation at the end (no `table-lab` in `vite.config.ts`).
- **Determinism for M9 (§5.6):** freeze spin (`&spin=off`, auto) + ensure no `useFrame` motion. Capture twice, md5-compare. The `?stats` reader must not perturb the frame.
- **Irreversible-baseline-after-operator-gate (THE ordering constraint):** all reversible setup first; the freeze capture + commit is the LAST step, after the operator blesses POV fov 37-vs-40 and the 3 shots. (Pitfall 1.)
- **CONTEXT.md sharp claim is wrong:** "sharp NOT installed anywhere" is false (0.34.5 at root). Don't install duplicates. (Pitfall 4.)
- **Anchor PNG bloat:** 2.4–4.9 MB/frame at 2880×1800 → downscale committed anchors. (Pitfall 5.)
- **`frontend/node_modules` looks present but is empty:** the dir exists; the packages don't resolve. `npm install` is genuinely required.
- **Metric-script location:** if placed in `.dev-stack/` they're gitignored → not reproducible (the same trap anchors avoid). Recommend a tracked `tools/table-3d/`.
- **Protected tag has no cards:** its POV anchor is a felt/rail/chip reference, not a card one — capture it anyway; cards compare vs M1 (SSOT TP9 DoD #2).

---

## Validation Architecture

> **Required for the Nyquist gate.** Maps each TP0 must-have to HOW it's validated. The "test framework" here is unusual: the deliverable is *an eval instrument*, so validation = (a) the instrument's own self-checks (metric control frames, md5), (b) code asserts, (c) operator on-device confirms, and (d) capture-diffs. `workflow.nyquist_validation` was not found explicitly false → this section is included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework (pure helpers) | `vitest@3.2.4` (existing; runs `frontend/src/lab/cards.test.ts`) — usable for any pure metric-math helpers (e.g. RGB→Lab, ΔE, region-area). |
| Metric runner | root-run `.mjs` scripts using `sharp@0.34.5` + node `crypto` (NOT vitest — they consume PNGs). |
| Capture | `.dev-stack/lab-shot.mjs` (Playwright, D3D11) against the Vite dev server. |
| Quick run command | `cd frontend && npx vitest run src/lab/cards.test.ts` (pure-helper tests) |
| Full metric run | (root) `node tools/table-3d/run-metrics.mjs docs/table-3d/anchors/head` → prints the admitted-metric table |
| Determinism | (root) `node tools/table-3d/m9-determinism.mjs` (capture twice → md5 compare) |

### Phase Requirements → Validation Map
| Req | Behavior | Validation type | Command / mechanism | Exists? |
|-----|----------|-----------------|---------------------|---------|
| TP0.0 | M1 cards read as protagonist on-device | **operator manual** | operator opens `?cam=card` on RTX 4060, confirms legible+dominant | ❌ gate (human) |
| TP0a-1 | Harness works at HERO/POV/MACRO, no console errors | capture-run + assert | run `lab-shot.mjs` ×3; assert `ERRORS []` printed + non-empty PNG | ✅ harness exists |
| TP0a-2 | 3 presets frozen (HERO 32 / POV 37 / MACRO 26) recorded verbatim | code-diff + doc | confirm `TableLab.tsx` fovs; record verbatim in doc; **POV edit 40→37 post-gate** | ⚠️ POV=40 in code |
| TP0a-3 | Draw-call + frame-time baseline (M10/M11) | `?stats` read | M10: `gl.info.render.calls` via `?stats` (auto, <150). M11: operator on-device (<8ms) | ❌ Wave 0 (`?stats` new) |
| TP0a-4 | Baseline captured at HEAD + protected tag | capture-diff | 2nd detached worktree at tag; capture ×3 each; persist | ✅ mechanism (git worktree) |
| TP0a-5 | 15-element scorecard authored + baseline-scored | doc + operator | `SCORECARD_TABLE_3D.md` filled; operator assigns 0–5 baseline | ❌ Wave 0 (file new) |
| TP0a-6 | Anchor corpus persisted to `docs/table-3d/anchors/` (tracked) | git | commit downscaled PNGs; verify not gitignored (✓) | ❌ Wave 0 (dir new) |
| TP0b-1..3 | Each §4.5 metric implemented + control-validated | metric-script + meta-gate | per metric: PASS-on-good ∧ FAIL-on-bad control; else informational | ❌ Wave 0 (scripts new) |
| M7 | No Bloom mounted | **code-assert** | grep `src/lab` for Bloom/EffectComposer/postprocessing → 0 (none installed) | ✅ assertion |
| M9 | Two captures byte-identical | **md5 determinism** | `md5(a)==md5(b)` under `&spin=off` | ❌ Wave 0 (script new) |
| Isolation | Lab not in prod build | code-assert | no `table-lab` input in `vite.config.ts` (✓ today) — re-verify | ✅ holds |

### Sampling Rate
- **Per task commit:** the relevant single metric's control-frame check + (for any `?stats`/scene-adjacent edit) an M9 byte-identity re-capture to prove zero visual change.
- **Per wave merge:** full admitted-metric run over `docs/table-3d/anchors/head` + the M9 determinism check.
- **Phase gate (before `/gsd-verify-work`):** every admitted metric passes its positive+negative control; M9 byte-identical; isolation assert green; operator blessed the 3 money shots (incl. POV fov) and the M1 read; scorecard baseline filled; anchors committed.

### Wave 0 Gaps (must be built before/within TP0)
- [ ] `frontend` deps installed (`cd frontend && npm install`) — dev server won't start otherwise.
- [ ] `.dev-stack/lab-shot.mjs` restored into worktree (or captures run from main checkout).
- [ ] `?stats` reader (`StatsProbe`, dependency-free, renders null) added to `TableLab.tsx` — for M10/M11.
- [ ] `docs/table-3d/anchors/{head,reference-tag,controls}/` created + populated (downscaled PNGs).
- [ ] `tools/table-3d/metrics.mjs` + `run-metrics.mjs` + `m9-determinism.mjs` (root-run, sharp+crypto).
- [ ] `docs/table-3d/SCORECARD_TABLE_3D.md` authored; operator fills baseline scores.
- [ ] Per-metric control frames constructed (positive + negative) and verdicts recorded.
- [ ] The frozen-rig record (presets verbatim + draw/frame-time numbers) written into the doc.
- [ ] sharp/playwright at root verified importable (already confirmed this session — re-assert in CI of the plan).

*(Existing infra that needs NO build: `sharp`, `playwright`, `vitest`, the `?spin=off` determinism path, the harness's console-error capture, the `preserveDrawingBuffer` capture path, the `?felt=magenta` negative-control hook.)*

---

## Security Domain

> `security_enforcement` was not found set to `false`; included for completeness. TP0 is a local, offline, static-WebGL instrumentation phase with **no network, no auth, no user input, no secrets, no deploy** (HANDOFF: "no backend, no game data, no secrets, no network calls"). The standard ASVS web categories do not meaningfully apply.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | No auth surface (local lab). |
| V3 Session Management | no | No sessions. |
| V4 Access Control | no | No server/endpoints touched. |
| V5 Input Validation | minimal | Only `?` URL params + `LAB_URL` env, all local/operator-controlled; no untrusted input. |
| V6 Cryptography | n/a (utility) | `crypto.md5` is used for byte-identity (M9), NOT security — md5 is fine for a non-adversarial checksum. |
| V12/V14 Files/Config | minor | Anchor PNGs committed to git — ensure no secrets in frame metadata (PNGs are pure render output; none). |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Accidentally bundling the lab into the prod build (exposing a pre-release design) | Information Disclosure | Keep `vite.config.ts` lab-input-free; re-verify isolation. (Already enforced.) |
| Committing large/secret-bearing artifacts | — | Anchors are downscaled render PNGs only; no secrets; size-budgeted (Pitfall 5). |
| `npx playwright install` pulling browser binaries | Supply chain | Playwright already installed at root; no new fetch needed. |

**Bottom line:** no application-security work is in scope for TP0; the relevant "security" is repo hygiene (isolation + no-bloat + no-secret-in-commit), already covered by the SSOT guardrails and the pitfalls above.

---

## State of the Art

| Old Approach (CONTEXT/env assumption) | Actual current state (verified) | Impact |
|---------------------------------------|----------------------------------|--------|
| "sharp is NOT installed anywhere yet" | sharp@0.34.5 imports cleanly at repo ROOT | No sharp install needed; run metric scripts from root. |
| POV `?cam=card` fov is/was 37 | code is still **fov 40** (`TableLab.tsx:618`) | The 40→37 edit is the operator-gate refinement; do it as a candidate, let operator pick, then lock. |
| "node_modules absent in worktree frontend" | dir EXISTS but is empty (no deps resolve) | `npm install` still required; don't be fooled by the dir existing. |
| Vite 5 (per casual doc mentions) | Vite **7.3.1** (`frontend/package.json`) | Minor; no behavior change for capture, but use the real version in any tooling notes. |
| Harness needs a multi-file restore | `lab-shot.mjs` imports only playwright + node builtins → **one-file** restore | Restore is trivial, or run from main checkout. |

**Deprecated/outdated:**
- The IDE preview screenshot tool for WebGL — DEAD (times out). Playwright is the only path.
- Old/software headless (SwiftShader) — produces radial-ray artifacts; the harness explicitly forces `--use-angle=d3d11 --enable-gpu`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The operator will choose POV fov (37 vs 40) at the blessing gate; plan must not pre-lock it. | Q1 / ordering | Low — explicitly an operator gate; the plan sequences around it. |
| A2 | Playwright's Chromium remains installed at root (it imports + the harness produced REFERENCE frames). | RSI / Q3 | Low — if missing, one-time `npx playwright install chromium` at root. |
| A3 | Region rects for the sharp metrics can be authored once on the frozen captures and reused. | Q4 | Medium — if a preset changes post-gate (POV→37), re-author the POV-dependent rects against the final frame. Mitigated by doing rects AFTER the gate. |
| A4 | M11 (frame-time) headless reads are indicative, not authoritative; the gate is the on-device RTX 4060 read. | Q2 / Validation | Low — SSOT specifies "RTX 4060 vsync-OFF"; operator-assisted is the honest validation. |
| A5 | The protected tag `d17df37` scene has no cards (M1 shipped later) → its POV anchor is a felt/rail/chip reference. | Q5 | Low — SSOT TP9 DoD #2 already splits comparison bases (cards vs M1, felt/rail/chips vs tag). Capture anyway. |
| A6 | Downscaling committed anchors to ~1080p–1280px keeps M1 valid (M1 already specifies a 1080p POV downscale). | Pitfall 5 | Low — M1's own spec uses a 1080p downscale; pure-pixel metrics can run on full-res working copies in `.dev-stack/`. |
| A7 | Metric scripts should live in a TRACKED dir (e.g. `tools/table-3d/`), not gitignored `.dev-stack/`. | structure / Q7 | Low — Claude's discretion per CONTEXT; recommended for reproducibility. Planner states the final choice. |

**Note:** Items A1/A4 are operator perceptual-gate items (already flagged deferred). A3/A6/A7 are implementation choices within Claude's discretion. None contradicts a locked SSOT value.

## Open Questions

1. **Where do the metric scripts live — `tools/table-3d/` (tracked) or `.dev-stack/` (gitignored)?**
   - What we know: anchors MUST be tracked (`docs/table-3d/anchors/`); `.dev-stack/` is gitignored.
   - What's unclear: whether the *instrument code* should also be tracked. The SSOT only mandates persisting the anchor *corpus*, not the scripts.
   - Recommendation: track the scripts in `tools/table-3d/` so the instrument is reproducible after a clean checkout (same rationale as the anchors). Planner decides + records.

2. **Anchor PNG size budget?**
   - What we know: full-res frames are 2.4–4.9 MB each; SSOT says "small PNGs."
   - What's unclear: the exact max dimension/encoder for the committed corpus.
   - Recommendation: downscale to ~1280-wide + `sharp` PNG re-encode (or pngquant); target the whole tracked corpus < ~10 MB. Run pixel metrics on full-res working copies in `.dev-stack/`.

3. **Which HEAD does "baseline at HEAD" mean — worktree `bab28af` or spike `cae5c79`?**
   - What we know: worktree HEAD is `bab28af` (this branch); spike HEAD is `cae5c79`; the env note hedges ("cae5c79... actually the smart-discuss commit").
   - Recommendation: capture at the **worktree HEAD that contains the frozen rig** (after the POV edit + `?stats`, post-gate) — that is the apples-to-apples baseline TP1+ will diff against. Record the exact SHA in the freeze doc. (Also capture the protected tag as the felt/rail/chip reference.)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `sharp` | TP0b metrics | ✅ (at ROOT) | 0.34.5 | — (verified `require` ok) |
| `playwright` | capture harness | ✅ (at ROOT) | ^1.60.0 | — (verified `require` ok) |
| Playwright Chromium (D3D11) | capture | ✅ (produced REFERENCE frames; imports) | bundled | `npx playwright install chromium` at root (one-time) if ever missing |
| `frontend` deps (three/r3f/drei/react/vitest) | Vite dev server | ✗ (dir empty) | declared in package.json | **`cd frontend && npm install`** (required) |
| `.dev-stack/lab-shot.mjs` | capture | ✗ in worktree (gitignored) | present in MAIN checkout | restore 1 file OR capture from main checkout |
| `docs/table-3d/anchors/` | anchor persistence | ✗ (not created) | — | TP0a creates it (NOT gitignored — commitable) |
| RTX 4060 / real GPU | D3D11 capture + M11 | ✅ operator machine | — | — (this IS the operator's machine) |

**Missing dependencies with no fallback:** none — everything missing has a clear close-out step.
**Missing dependencies with fallback:**
- `frontend/node_modules` empty → `npm install` (blocking until done).
- `.dev-stack/lab-shot.mjs` absent → restore one file or run from main checkout.

---

## Sources

### Primary (HIGH confidence — direct code/harness reads, this session)
- `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP0, §4 (eval rig), §5 (guardrails), §10, §11 — the SSOT (read in full).
- `.planning/phases/01-tp0-eval-rig-baseline-blocking/01-CONTEXT.md` — phase decisions.
- `frontend/src/lab/TableLab.tsx` — scene, camera presets (lines 614-633: HERO 32, **card/POV 40**, MACRO 26), lights (548-578), Canvas/gl (757-767), URL params, demoted pot (700-708).
- `frontend/src/lab/cards.ts` — card layout math (community/hole), geometry.
- `frontend/src/lab/textures.ts` — felt base stops `#1f9163/#147a51/#0a4a33` (437-439, = M3 anchors), baked vignette (493-497), `?felt=magenta` hook.
- `.dev-stack/lab-shot.mjs` (MAIN checkout) — harness contract, flags, viewport/DPR, resize trick, console-error capture.
- `frontend/package.json` / root `package.json` — versions; **sharp@0.34.5 + playwright at root**.
- `frontend/vite.config.ts` — no `table-lab` build input (isolation holds).
- `docs/HANDOFF_TABLE_3D_LAB.md` — lab internals, protected reference, capture lessons (#1 IDE-can't-capture-WebGL, #3 z-fight, #4 PowerShell quotes), tag→commit map.

### Verified via tool (this session)
- `require('sharp')` at root → **0.34.5** [VERIFIED]; `require('playwright')` at root → OK [VERIFIED].
- `git rev-parse HEAD` worktree → **bab28af**; `git rev-list -1 <tag>` → **d17df37**; `git worktree list` (main at cae5c79) [VERIFIED].
- `git check-ignore docs/table-3d/anchors/...` → NOT ignored (commitable) [VERIFIED].
- grep `src/lab` for stats/renderer.info/Stats → **0 matches** (no `?stats` exists) [VERIFIED].
- `frontend/node_modules` lab deps resolve → **MISSING** (three/r3f/drei/react/vitest) → npm install needed [VERIFIED].
- `lab-shot.mjs` imports → playwright + node builtins only (one-file restore) [VERIFIED].
- REFERENCE frame sizes → 2.4–4.9 MB each at 2880×1800 [VERIFIED].

### Tertiary
- (none — no web research was used; per the constraint, the metric approach is pre-decided and grounded in code.)

## Metadata

**Confidence breakdown:**
- Lab scene reality / camera fovs: **HIGH** — read directly from `TableLab.tsx` (POV=40 confirmed at line 618).
- Capture harness internals: **HIGH** — read `lab-shot.mjs` line-by-line from the main checkout.
- Tooling availability (sharp/playwright at root): **HIGH** — `require()` succeeded this session.
- Metric computations: **HIGH** on the pure-pixel T1 set (math is standard + sharp covers it); **MEDIUM** on M2/M12 segmentation (manual fallback is the SSOT-sanctioned path) and M11 (operator-assisted).
- Baseline/tag git mechanism: **HIGH** — verified tag SHA, worktree list, and that the tag is uncheckedout.
- Scorecard format: **MEDIUM** — a sound proposal within Claude's discretion; wording is illustrative.

**Research date:** 2026-06-09
**Valid until:** ~2026-07-09 (stable; the lab + harness are frozen and the deps are pinned). Re-verify the worktree HEAD SHA and the POV fov value if any commit lands before planning.
