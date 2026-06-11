# Phase 3: TP2 — Cartas Materiality & Legibility (protagonist) - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — operator accepted all 3 grey areas as recommended

<domain>
## Phase Boundary

Push the protagonist (the hole cards) from "good decal" to **real card STOCK** — faint face
micro-relief + a whisper of coat, max-anisotropy crispness, a cheap paper-edge read, a tighter
near-edge contact bite, and restrained deterministic dealt variance — **without ever softening
hole-card legibility.** Work is on the **adopted post-encuadre scene** (FELT_R 6.5, CARD_W 2.05,
5-card board, whole separated hand) on `spike/table-3d-hero`, lab-only (`frontend/src/lab/`),
behind `?` flags. Ends at the operator A/B gate (POV/`card` + MACRO).

OUT of scope: chips/perf (TP3), rail/contour (TP4), lighting/shadows (TP5), screen-space/crevice AO
+ depth/vignette (TP6), camera formalization (TP7), micro-life/multi-hand (TP8). The 3 frozen
money-shot camera pos/fov are UNCHANGED.

</domain>

<decisions>
## Implementation Decisions

### Eval-Rig Reconciliation — post-encuadre  *(operator-decided: Re-baseline post-encuadre)*
- The TP0 anchors were captured on the OLD scene; TP2 needs an apples-to-apples "before".
- **Capture a NEW dated TP2 baseline** of the ADOPTED scene at the 3 frozen money shots
  (`card`/`hero`/`macro`); measure the TP2 deltas (M1 / M2 / M6 / M5) against it.
- **TP0 protected anchors stay IMMUTABLE** — `docs/table-3d/anchors/head/` and
  `docs/table-3d/anchors/reference-tag/` are never touched ("reference never degraded" holds).
  The eval rig stays frozen as a **method**; we only ADD a dated snapshot of the adopted scene.
- Suggested location for the new baseline: `docs/table-3d/anchors/tp2-base/{card,hero,macro}.png`
  (planner confirms naming + whether it is tracked or gitignored-scratch + downscaled).

### Legibility Defense & Lever Sequencing  *(operator-decided: Legibility-first)*
- **Step 0 — re-measure M1** hole-card legibility on the adopted scene FIRST (establish the
  post-encuadre floor) before touching any lever.
- **Order (legibility-positive levers lead):**
  1. anisotropy `8 → renderer.capabilities.getMaxAnisotropy()` (cap 16) + confirm mipmaps /
     `LinearMipmapLinearFilter` (slight negative mip bias ONLY if text still softens) — sharpens.
  2. face-to-bevel **seam fix** (no thin cream rim / z-fight at MACRO; `CARD_CORNER 0.17`
     unchanged; curveSegments ≥ 14) — correctness, neutral/positive.
  3. faint **micro-relief normal** (linen/emboss hint).
  4. **clearcoat** whisper.
  5. **paper-edge** cheap fake.
  6. **dealt variance** (deterministic).
  7. near-edge **contact-shadow** tighten/darken (M6).
- **Capture discipline:** each lever behind a `?` flag; A/B **one variable at a time** (TP1
  pattern); **M1 re-checked after EVERY lever.**
- **STOP criterion:** any lever that regresses M1 **OR** reads plastic/laminated → STOP + revert
  that lever (non-blocking, flag).
- **Honesty note (carry into the gate):** smaller cards (CARD_W 2.05) lower the index px-height
  (was already ~17px on the larger cards) — crispness AFILA (sharpens edges) but does NOT enlarge.
  If crispness can't hold "razor-legible" at the operator gate, **escalate back to the
  CARD_W / encuadre decision** (a separate operator call — the encuadre is adopted, not reopened
  unilaterally).

### Card-Stock Aesthetics — within SSOT ranges  *(operator-decided: Restraint-first)*
- **clearcoat 0.12** (low end) / **clearcoatRoughness 0.55**; raise toward 0.18 ONLY if the coat
  reads absent.
- **micro-relief:** very faint, `normalScale ~0.12`, built via the shared `normalMapHelper`
  (reuse of the TP1 felt-nap Sobel helper).
- **paper-edge:** subtle **warm sheen-rim** (reuse the material sheen; NO new texture; explicitly
  **NO** `MeshTransmissionMaterial` / transmission).
- **dealt variance ≤ 1.5°** (conservative end), **frozen deterministically** (M9).

### Locked by SSOT §TP2 — implement as specified (NOT re-litigated)
- anisotropy 8 → `getMaxAnisotropy()` cap 16; mipmaps + LinearMipmapLinear.
- clearcoat 0.12–0.18 / clearcoatRoughness 0.5–0.6 — NOT glossy/laminated.
- paper-edge = CHEAP fake only; NO transmission material.
- seam fix: no cream rim / z-fight at MACRO; CARD_CORNER 0.17 unchanged; curveSegments ≥ 14.
- variance ≤ 1.5–2° frozen (M9); near-edge contact-shadow tightened (M6).
- **HARD gates:** M1 legibility MUST NOT regress; M2 cards-vs-chips ≥ 2× maintained.
- **DECIDED in SSOT:** no face-down card is added to the Perla hand (red-team #6 / TP2.3 resolved).
- Operator gate: A/B at POV(`card`) + MACRO — "physical printed STOCK while razor-legible?"
  Stop-on-ambiguous. Rollback: non-blocking, flag.

### Claude's Discretion
- Exact `?` flag names, capture cadence details, the TP2-baseline dir naming/tracking/downscale,
  `normalScale` fine-tuning within "faint", and the sheen-rim implementation details — all at
  Claude's discretion within the bounds above.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/lab/normalMapHelper.ts` — shared **height→normal Sobel helper** (authored for the
  TP1 felt nap); reuse for the card micro-relief normal. Unit-tested (`normalMapHelper.test.ts`).
- `frontend/src/lab/cards.ts` — card geometry + material; `CARD_W 2.05`, `CARD_CORNER 0.17`,
  `HOLE_*` layout, anisotropy/clearcoat live here. Unit-tested (`cards.test.ts`; lab Vitest 27/27
  asserts geometry invariants like `HOLE_PITCH < CARD_W`, `HOLE_Z > 2` — keep green).
- `frontend/src/lab/textures.ts` — card face textures + felt textures; already consumes the Sobel
  helper (feltNapNormalMap / feltEdgeAoMap pattern).
- `frontend/src/lab/TableLab.tsx` — scene root: the 3 frozen money-shot cameras (`card`/`hero`/
  `macro`), `LAB_COMMUNITY` 5-card board, felt `MeshPhysicalMaterial` (TP1), diagnostic
  `conjunto`/`social` cams (`?cam=`), `SeatHands` (`?seats=on`), felt marks (`?marks=off`).
- `frontend/src/lab/StatsProbe.tsx` — `?stats` draw-call/frame-time probe (M10).
- `docs/table-3d/anchors/{head,reference-tag}/{card,hero,macro}.png` — IMMUTABLE TP0 baselines;
  `docs/table-3d/anchors/controls/` = metric positive/negative control frames (M3–M12).

### Established Patterns
- Lab is an isolated React tree at `/table-lab.html`; NOT in the prod build; only
  `frontend/src/lab/` is touched, only on `spike/table-3d-hero` (guard-de-rama before edits).
- Materiality via `MeshPhysicalMaterial` (TP1 felt set the pattern: sheen / anisotropy /
  normalMap / aoMap, depth in material+light not baked albedo).
- A/B discipline: ONE perceptual variable per gate, behind a `?` flag, Playwright apples-to-apples
  capture at the frozen shots, STOP-on-ambiguous.
- Frozen TP0 eval rig: 12-metric kit + 15-element scorecard, each metric control-gated.

### Integration Points
- Card material/geometry: `frontend/src/lab/cards.ts` (+ `textures.ts` for face/relief maps).
- Capture at the 3 frozen cameras in `TableLab.tsx` (pos/fov UNCHANGED).
- New dated TP2 baseline dir under `docs/table-3d/anchors/` (e.g. `tp2-base/`) — `head/` and
  `reference-tag/` stay immutable.
- Metrics + scorecard scripts (TP0 rig; planner locates the exact capture/metric `.mjs` files) —
  re-run M1 / M2 / M5 / M6 / M9 (+ M10 watch).

</code_context>

<specifics>
## Specific Ideas

- **Full spec (SSOT):** `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP2 — doc WINS on any conflict with
  this index.
- Built on the **adopted post-encuadre scene** — see
  `docs/table-3d/ENCUADRE_CHECKPOINT_2026-06-10.md` §DECISIONS (composition ADOPTED 2026-06-11; all
  4 felt suit marks kept; cameras stay diagnostic → TP7; SeatHands opt-in → TP8).
- Risks (SSOT): over-clearcoat → plastic; mip over-sharpen → pip ringing; variance too high →
  messy; edge fake too strong → glowing border (casino). Restraint-first picks chosen to stay clear
  of all four.
- Success (SSOT): weighty legible Fournier stock with faint grain, tight contact, subtle dealt
  life; protagonist dominance intact.

</specifics>

<deferred>
## Deferred Ideas

- TP3 (chips de-Vegas + instancing/perf, M10 draw-calls), TP4 (rail/contour), TP5 (lighting/PCSS/
  ContactShadows), TP6 (screen-space/crevice AO — explicitly NOT a TP2 gate; depth/DOF/vignette),
  TP7 (formalize `conjunto`/`social` cameras — frozen-camera invariant), TP8 (SeatHands multi-hand,
  micro-life).
- Reconsidering CARD_W — the encuadre is ADOPTED; revisit ONLY if the TP2 operator gate fails on
  legibility (separate operator call).
- Mobile responsive camera framing (deferred per SSOT).

</deferred>
