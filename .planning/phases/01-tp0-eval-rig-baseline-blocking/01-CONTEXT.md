# Phase 1: TP0 — Eval Rig & Baseline (BLOCKING) - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning
**Mode:** Smart-discuss (autonomous). Spec-complete phase — anchored to the SSOT, no grey-area re-litigation.

> **Authoritative spec:** `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP0 + §4 (eval rig) + §5 (cross-cutting guardrails) + §10 (6-point format) + §11 (resume protocol). The SSOT was built "multi-agent audit → architect → red-team, all fixes folded in **so a future session can execute it autonomously with no re-litigation**." Every TP0 decision is already baked there. This CONTEXT does not re-decide — it records the boundary, the baked decisions, the carried operator-gate items, and the real environment state for the planner. **Doc wins on any conflict.**

<domain>
## Phase Boundary

Lock the **frozen eval instrument** (§4) and a **complete baseline** of the CURRENT table state, so every later gate (TP1–TP9) is apples-to-apples and the protected reference is provably never degraded. **ZERO visual/material change in this phase** — TP0 builds instrumentation only; all material work is TP1+.

Three parts (SSOT §TP0):
- **TP0.0 — M1 precondition gate (operator, on-device, BLOCKING):** operator confirms the **M1 cards-as-protagonist** read on-device BEFORE any materiality work. If it fails → stop before TP1 (refine M1), never a surprise inside TP2.
- **TP0a — the cheap, must-have rig (zero visual change):** verify the capture harness for HERO/POV/MACRO; **freeze the 3 presets + the Perla staged hand + demoted pot** recorded verbatim; capture the baseline corpus at HEAD **and** at the protected tag; read draw-call + frame-time baseline (`renderer.info` + `?stats`, vsync OFF); author the 15-element scorecard with baseline scores; **persist the anchor corpus to a tracked location** (`docs/table-3d/anchors/`).
- **TP0b — metric tooling (a real build, tiered):** implement the §4.5 metrics by tier; **validate each against a positive + negative control frame** before admitting it to the gate-set (un-validated = informational only); thresholds pre-baked (§4.5); MSE-as-SSIM-proxy pre-approved; legibility downgraded to px-height + manual confirm (NO automated OCR hard gate).

**Out of scope (deny-list):** any felt/card/chip/rail/light/depth/material change (TP1+); mobile perf as a deliverable (guardrail only); room/environment/backdrop enhancement (FROZEN); per-seat/occupant objects; mounting Bloom; engine/gameplay/card-geometry changes (FROZEN). No push/deploy/merge.
</domain>

<decisions>
## Implementation Decisions

### Anchored to the SSOT (already baked — do NOT re-litigate)
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

### Claude's Discretion (bounded)
Implementation choices for the metric scripts, the scorecard file format, the harness restore mechanism, and the anchors-dir layout are at Claude's discretion — bounded by the SSOT §4/§5 and the §5 guardrails (perf, reference-never-degraded, reversibility, anti-casino, scope, no-push). When the SSOT specifies a value, the SSOT wins.
</decisions>

<code_context>
## Existing Code Insights

### Lab runtime (present in worktree after FF)
- `frontend/table-lab.html` — isolated entry (NOT in prod `vite build`; index.html only). Lab lives at the **`/table-lab.html` path** — the bare root serves the GAME.
- `frontend/src/lab/` — `main.tsx` (mount) · `TableLab.tsx` (scene: camera presets, lights, environment, premium Table, chips, warm floor+backdrop, opt-in Seats) · `textures.ts` (procedural chip/felt/wood/leather/floor/backdrop + Chiribito "C") · `cards.ts` (+`cards.test.ts`) · `silhouettes.ts` · `TableVariant.tsx`.
- `frontend/public/brand/` — REAL official assets (logo, favicon green-C, Spanish-suit aces).
- Stack: `three ^0.169` · `@react-three/fiber ^8.17` · `@react-three/drei ^9.114` · `gsap ^3.12.5`. **`postprocessing` + `@react-three/postprocessing` NOT installed** (TP6 adds them; not now). `maath` absent.

### Capture harness (the key environment fact)
- **`.dev-stack/lab-shot.mjs` is gitignored (root `.gitignore` line 25) and ABSENT from this worktree, but PRESENT in the main checkout** at `C:\Users\Usuario\Documents\CHIRIBITO\chiri-infrastructure\chiri-app\.dev-stack\lab-shot.mjs` (full `.dev-stack/` capture-script history there too). TP0a must **restore/reuse** it into the worktree (copy the needed scripts + the `diag/table-3d/elev/REFERENCE-*.png` reference frames) OR run captures from the main checkout. It is NOT lost.
- Harness reality: Playwright, real **D3D11 GPU** (`--headless=new --use-angle=d3d11 --enable-gpu`), `spin=off` auto, viewport 1440×900 @ DPR2 → 2880×1800 PNG. **The IDE/preview screenshot tool CANNOT capture a live WebGL canvas here (times out)** — must use the Playwright harness via Bash, then `Read` the PNG. Captures run on THIS machine's RTX 4060.
- Capture commands (§4.3 / §11): `LAB_URL="http://localhost:5173/table-lab.html?cam=<hero|card|macro>" node .dev-stack/lab-shot.mjs <out.png>` after `cd frontend && npm run dev` (Vite 5173; 5174 if busy).

### Setup gaps the plan must close
- **`npm install` needed in the worktree `frontend/`** (fresh checkout — node_modules absent here; the main checkout has them).
- **`sharp` is NOT installed anywhere yet** (main frontend node_modules lacks it). TP0b's pixel-math metrics need it → add/install `sharp`.
- **`docs/table-3d/anchors/` does not exist** — TP0a creates it and commits the corpus there.

### Protected references (exist ✓)
- Tags `table-3d-premium-reference-2026-06-04` (→ `d17df37`) and `table-3d-lab-checkpoint-2026-06-04` present. Reference frames at `.dev-stack/diag/table-3d/elev/REFERENCE-{hero,eye,wide,room}.png` (main checkout).
- Baseline must be captured at **HEAD** (`cae5c79`, this worktree) AND at the **protected tag** (checkout/worktree the tag, capture, restore).
</code_context>

<specifics>
## Specific Ideas

- **6-point pre-change format (§10)** should be filled for TP0 before edits: Objetivo / Restricciones / Non-goals / Riesgos / Plan (subphases) / Validación.
- **Per-phase rollback tag:** create `tp0-before-rig` (or equivalent) before starting (§5.3). TP0 rollback disposition = **BLOCKING** — a broken instrument halts the program; fix the rig first; never proceed on a broken instrument.
- **Gotchas (§11.6 + lab handoff):** PowerShell here-strings for commit messages → NO double quotes inside (use git-bash or `-F`); z-fighting between the felt plane (y=0) and any coplanar disc renders as a casino sunburst (separate in Y / `polygonOffset`); keep the lab OUT of the prod `vite build`.
- **Determinism (M9):** captures must be byte-identical under `spin=off` + reduced-motion — freeze autoRotate/micro-motion for every capture.
</specifics>

<deferred>
## Deferred Ideas

- All material/visual change: felt (TP1), cards (TP2), chips+instancing (TP3), rail/contour (TP4), lighting/shadows (TP5), depth/postprocessing+AO (TP6), cameras-confirm (TP7), feel/social-read (TP8), AAA verdict + new reference promotion (TP9).
- Mobile perf as a deliverable (here it is only a GUARDRAIL — M10/M11 measured, not optimized).
- Room / environment / backdrop enhancement, occupants/seats, props — out of the whole program's table-OBJECT scope.
- The POV fov 37-vs-40 final pick + the 3-money-shot blessing + the M1 on-device confirm are **operator perceptual-gate items** surfaced at verification (human-needed), not planning decisions.
</deferred>
