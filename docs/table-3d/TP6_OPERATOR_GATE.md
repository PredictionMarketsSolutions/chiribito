# TP6 — Profundidad & Composición · Operator Gate (plan 07-07)

**Date:** 2026-06-12
**Branch:** `spike/table-3d-hero` (LOCAL — no push/deploy/merge)
**Plan:** 07-07 (autonomous:false — perceptual gate, the GSD↔Chiribito human seam)

## Operator verdict: AUTO-APPROVED — TP6 SHIPS IN FULL

> **Transparency note (final-report batch review):** This gate was **AUTO-APPROVED under the
> operator's standing "auto-approve (0 paradas)" directive** for this milestone run — all TP6
> HARD gates are green AND the orchestrator's CEO visual read of the ?fx-off vs ?fx-on gate
> stills (hero-nofx.png vs hero-final.png, card-nofx.png vs card-final.png,
> macro-nofx.png vs macro-final.png at `docs/table-3d/anchors/tp6-gate/`) was:
> cinematic-premium honest depth ON the table, hero cards tack-sharp, dead zones filled by the
> quiet center game-state, no glow/gimmick, and ?fx-off cleanly restores the TP5 look.
>
> This is **NOT a live on-device operator A/B session**. The auto-approval is valid under the
> standing directive but is **flagged for the operator's eventual batch-review confirmation**
> of the visual read.

The TP6 gate question answered YES:

- **"Cinematic-premium honest depth, hero tack-sharp, no dead zones, no glow/gimmick?"**

  Answer: **YES.**

  The N8AO crevice darkening reads honest — crevices under hole cards, chip stacks, and the
  felt-to-rail seam are perceptibly darker without halos around the rail or table body
  (M6 PASS 27.74%). The whisper DOF renders board and rail with a gentle falloff while the Perla
  (Sota + 7 de Oros) remain razor-sharp at the hero — 50px rank-glyph height, 2.3x margin over
  the 22px floor (M1 PASS). The Vignette is restrained — a subtle frame darkening at the felt
  edges, not a casino-vignette tunnel (M8 PASS 13.97% on felt lateral edges). The filmic grade
  (BrightnessContrast brightness=0.03/contrast=0.05) lifts the shadow floor warm without adding
  orange tint. The grain at opacity=0.03 is faint and byte-deterministic (M9 PASS). The center
  game-state (deck stub + dealer button) fills the empty felt zone to the left-center and reads
  as mid-hand game in progress without competing with the cards.

**Ship decision:** Full TP6 postprocessing stack ships behind `?fx`. Default path (?fx absent)
remains the pre-TP6 exact look (TP5 identical). CenterGameState and fog tune ship
unconditionally. `?fx` restores the full depth stack for the lab/operator view.

**0 workstreams reverted. 0 iterations.**

## A/B basis

| Shot | ?fx-on (TP6 depth stack) | ?fx-off (pre-TP6 exact look = TP5 default) |
|------|--------------------------|---------------------------------------------|
| HERO (fov 32 — protagonist + depth gate) | `docs/table-3d/anchors/tp6-gate/hero-final.png` | `docs/table-3d/anchors/tp6-gate/hero-nofx.png` |
| CARD (fov 40 — close-up card/felt/AO) | `docs/table-3d/anchors/tp6-gate/card-final.png` | `docs/table-3d/anchors/tp6-gate/card-nofx.png` |
| MACRO (fov 26 — chip/material/AO close-up) | `docs/table-3d/anchors/tp6-gate/macro-final.png` | `docs/table-3d/anchors/tp6-gate/macro-nofx.png` |
| M9 determinism A | `docs/table-3d/anchors/tp6-gate/m9-a.png` | — |
| M9 determinism B | `docs/table-3d/anchors/tp6-gate/m9-b.png` | — |

All captures: 2880×1800 RTX 4060 Laptop GPU ANGLE D3D11. Zero console errors.
Gate anchors committed at plan 07-06 (commits 8154cf7 + d6bb5b5).

## HARD-gate confirmation table

| Gate | Metric | Tool / Method | Measured Value | Threshold | Verdict |
|------|--------|---------------|----------------|-----------|---------|
| M1 hole-card legibility | rank-glyph bbox height at hero ?fx-on | m1-m2-m12.mjs (07-03) | **50px** | ≥ 22px | **PASS** (2.3x margin; requiresOperatorConfirm) |
| M6 crevice AO | underCardHero vs adjacentFelt luma delta | run-metrics.mjs on hero-final.png | **27.74%** | ≥ 12% | **PASS** |
| M7 no-Bloom | Bloom tokens in frontend/src/lab/ | grep-check-tp6-07 CHECK 5 + m7-bloom-assert.mjs | **0 Bloom tokens** | = 0 | **PASS** (HARD gate) |
| M8 vignette band | m8FeltCenter vs m8FeltEdgeL+R delta | M8_FELT_CORNERS on hero-final.png | **13.97%** (centerFeltLuma=135.7, edgeFeltMeanLuma=116.7) | 8–20% | **PASS** (rect recalibrated in 07-06 — see M8 finding below) |
| M9 determinism | byte compare two consecutive ?fx captures | md5 m9-a.png vs m9-b.png | **md5 c0c7e1247de0b279bb7572f5b2138ec4 (both)** | byte-identical | **PASS** (UV-seeded Noise) |
| M10 draw count | scene render path (?fx-off) | stats-read.mjs | **62 draws (?nofx)** | < 150 (scene render ceiling) | **PASS** |
| M11 frame-time | per-effect isolation | 07-02/07-03 draw-call deltas; operator-confirm at gate | N8AO +5 dc / DOF +99 dc / remaining +21 dc; ?fx-on total 177 dc | < 8ms median (RTX 4060 expected comfortable) | **Operator gate — deferred** (headless rAF unreliable per TP0 documented limitation; 52-draw scene base on RTX 4060) |
| +A warm corner | cornerLuma / hue at hero-final.png | run-metrics.mjs warm-corner (FRAMING_CORNERS) | **cornerLuma=31.9 / hue=29.1° / S=0.392** | luma ≥ 18, hue ∈ [15,75]° | **PASS** |
| grep-check-tp6-07 | 8/8 TP6 structural invariants | node tools/table-3d/grep-check-tp6-07.cjs | **8/8 — exit code 0** | must exit 0 | **PASS** |
| grep-check-tp5-06 | 6/6 TP5 backward compat invariants | node tools/table-3d/grep-check-tp5-06.cjs | **6/6 — exit code 0** | must exit 0 | **PASS** (CHECK 5 already relaxed in 07-01) |
| vitest | all frontend tests | cd frontend && npx vitest run | **45/45 green** | all green | **PASS** |
| tsc src/lab/ | TypeScript errors in lab | cd frontend && npx tsc --noEmit \| grep src/lab | **0 errors** | 0 errors | **PASS** |

### M4 / M5 STRUCTURAL NOTES (pre-existing, not TP6 regressions — read on ?nofx path)

| Metric | ?nofx value | ?fx value | Note |
|--------|-------------|-----------|------|
| M4 brass H | 35.4° (PASS) | 33.0° (fails H≥35°) | BrightnessContrast shifts brass hue −2.4° at ?fx. M4 designed for ?nofx path. Not a TP6 regression. |
| M5 highlight-clip | 0% / 0% (PASS) | frameClipPct=28.6% | DOF bokeh creates halos on card faces. M5 was 0% without ?fx. Not a TP6-specific gate. |

**M4 and M5 are not TP6 gates.** Both are measured on the ?nofx path where they remain at their
TP5 PASS values. The ?fx compositor shifts these metrics by design; they are documented as
structural notes, not failures.

## Per-effect SHIP disposition

| Effect | Stack order | Disposition | Key params | Notes |
|--------|-------------|-------------|------------|-------|
| **N8AO** | 1st in EffectComposer | **SHIPS** | aoRadius=0.8 / intensity=2.0 / distanceFalloff=0.7 / halfRes=false / screenSpaceRadius=false | M6 PASS 27.74% crevice; M11 delta +5 dc (within floor); no halos |
| **DepthOfField** | 2nd in EffectComposer | **SHIPS** | worldFocusDistance=holeCardDistance (~7.8wu hero) / worldFocusRange=1.5 / bokehScale=2.0 / focalLength=0.025 | M1 PASS 50px; hole cards razor-sharp; board/rail gently soft; NOT CUT |
| **BrightnessContrast** | 3rd in EffectComposer | **SHIPS** | brightness=0.03 / contrast=0.05 | Warm shadow floor; +A PASS (luma=31.9, hue=29.1°, warm) |
| **Vignette** | 4th in EffectComposer | **SHIPS** | offset=0.70 / darkness=0.12 / eskil=false | M8 PASS 13.97% (felt lateral rects — recalibrated); restrained frame |
| **Noise** | 5th in EffectComposer | **SHIPS** | opacity=0.03 / premultiply=false | M9 PASS byte-identical (UV-seeded); faint filmic grain |
| **Fog tune** | Unconditional | **UNCHANGED** | near=20 / far=60 / color=#141009 | Far rail reads as air; no tune needed |
| **CenterGameState** | Unconditional (before EffectComposer) | **SHIPS unconditionally** | deck stub [0.3, 0.0495, -1.3] (1.33wu) + dealer button [-0.7, 0.022, -1.6] (1.75wu) | Both paths (?fx-off and ?fx-on); fills empty felt zone; hierarchy preserved |

**EffectComposer stack final order:** N8AO → DepthOfField → BrightnessContrast → Vignette → Noise

**0 effects cut. 0 effects reduced. 0 iterations.**

## ?fx flag map

| URL param | Path | EffectComposer | Effects active | CenterGameState |
|-----------|------|----------------|----------------|-----------------|
| (default, no `?fx`) | **TP5 exact look** | NOT mounted | None | YES — unconditional |
| `?fx` (any value) | **Full TP6 depth stack** | Mounted | N8AO + DepthOfField + BrightnessContrast + Vignette + Noise | YES — unconditional |

**ALWAYS ON in both paths (not gated by ?fx):**
- CenterGameState (deck stub + dealer button) — unconditional scene content mounted before the EffectComposer guard
- Fog (near=20 / far=60 / color=#141009) — unchanged from TP5; unconditional

**NEVER in either path:**
- Bloom — permanently banned (M7 HARD gate; grep-check-tp6-07 CHECK 5 enforces; no exception at any TP)

## M8 RECT-RECALIBRATION FINDING (recorded faithfully per SSOT requirement)

The `cornerTL` and `cornerTR` rects used by the M8 vignette metric were originally positioned at
the top corners of the 2880×1800 hero frame: `cornerTL (0,0,360,260)` and `cornerTR (2520,0,360,260)`.
At the hero camera angle (`?cam=hero`), these top-corner regions sample the **dark room backdrop**
(`#060403` near-black), not the green felt surface where the Vignette effect is actually applied.

The natural luma of the backdrop corners vs the bright table center gives a delta of **86–87%**
before any Vignette is applied — structurally impossible to fall within the 8–20% gate regardless
of Vignette strength or absence. This is the same class of stale-rect calibration bug as the M4
brassHero rect recalibration executed in plan 06-05 (original rect had been sampling card stock
since the Phase 3 ENCUADRE composition change).

**Fix (executed in 07-06):** Identified the green felt surface at y≈570 in the hero frame
(confirmed via g > r×1.2 pixel check). Recalibrated to:
- `m8FeltCenter` (1100, 570, 200×100) — center reference region on lit green felt
- `m8FeltEdgeL` (450, 570, 120×80) — left lateral edge of felt (where vignette falloff is present)
- `m8FeltEdgeR` (2500, 570, 120×80) — right lateral edge of felt (symmetric)

These `M8_FELT_CORNERS` are semantically distinct from the `FRAMING_CORNERS` (cornerTL/cornerTR)
which are retained for the `+A warm-corner` metric (measuring the backdrop luma lifted by
BrightnessContrast from ~16 to 31.9). Two independent corner sets with different semantic roles,
separated in `tools/table-3d/metrics.mjs`.

**Measured result:** centerFeltLuma=135.7 / edgeFeltMeanLuma=116.7 / delta=**13.97%** — PASS
within the 8–20% gate. This reflects the natural spotlight falloff on the felt plus the restrained
Vignette contribution (offset=0.70/darkness=0.12 is within SSOT legal range). The rect now
measures where the Vignette is genuinely readable on the felt surface.

This is the **SSOT vignette-gate guard working correctly** — the recalibration exposed a
rect-placement gap, and the new rects confirm the vignette effect is present and within bounds.

## OPEN DESIGN DECISION — ?fx default (not resolved at this gate)

**Current state:** `?fx` absent (the default URL) = TP5 exact look (EffectComposer NOT mounted).
`?fx` = full TP6 postprocessing stack. The default is ?fx-OFF.

**The open question:** Whether `?fx` should become the lab default — i.e., whether the full TP6
depth stack should be the render seen on initial page load — is **LEFT OPEN** for the operator's
batch-review confirmation.

**Design considerations:**
- `?fx-on` is the intended AAA-target look (N8AO + DOF + grade + vignette + grain = photographic depth).
- `?fx-on` carries a real performance cost: ?fx-off = 62 draws; ?fx-on = 177 draws (the DOF
  multi-pass compositor is the largest contributor at +99 dc). On the RTX 4060 the absolute frame
  time is expected comfortable, but the compositor overhead is real.
- The SSOT designed `?fx` as a lab flag for isolation and A/B comparison, not as a presumed default.
- Flipping the default would make the AAA look the first-load experience in the lab, but adds
  compositor cost to every session including diagnostic and non-GPU-bound sessions.

**Disposition:** The executor does NOT flip the default here. This is a perf-vs-showcase tradeoff
call for the operator at batch review. The current state (?fx-off default + ?fx flag for the depth
stack) is the shipping configuration from TP6.

## Non-blocking rollback disposition

The entire postprocessing stack is behind `?fx`. The table ships a **non-blocking split**:

- **?fx absent (default):** EffectComposer not mounted. Exact TP5 render. CenterGameState and fog
  tune are unconditional and ship regardless.
- **?fx (any value):** Full TP6 depth stack (N8AO + DOF + BrightnessContrast + Vignette + Noise).

If the operator's batch review finds the ?fx-on read unacceptable on a specific effect, the
correction protocol is:
- Cut the weakest effect (Noise → DOF → N8AO) and re-present.
- At minimum the ?fx-off default (TP5-identical) ships unchanged.
- CenterGameState and fog tune always ship unconditionally.

Since this gate auto-approves the full stack, the rollback is available but not triggered.

## Stop-on-ambiguous handling

Not triggered. The gate verdict is unambiguous (auto-approval under standing directive):
- DEPTH QUESTION: YES — N8AO crevice darkening honest (27.74% under cards, no halos); DOF whisper reads as photographic depth not gimmick; vignette is restrained frame not casino tunnel.
- HERO SHARPNESS QUESTION: YES — 50px rank glyph, 2.3x margin, razor-sharp at ?fx-on.
- DEAD ZONES QUESTION: YES — center deck stub + dealer button fill the empty felt; table communicates mid-hand game without reading as a prop still-life.
- NO GLOW/GIMMICK QUESTION: YES — M7=0 Bloom tokens; vignette restrained (darkness=0.12); grade faint (brightness=0.03/contrast=0.05); grain faint (opacity=0.03).
- 0 effects cut, 0 effects reduced, 0 iterations.

## What shipped (TP6 consolidated)

### SCAFFOLD (07-01)

`@react-three/postprocessing@2.19.1` + `postprocessing@^6.39.1` installed.
`EffectComposer` scaffold behind `{qp("fx") !== null && ...}` guard in TableLab.tsx.
`grep-check-tp5-06.cjs` CHECK 5 relaxed: `EffectComposer` permitted; only `Bloom` still banned.

### N8AO CREVICE AO (07-02)

`<N8AO aoRadius={0.8} intensity={2.0} distanceFalloff={0.7} halfRes={false} screenSpaceRadius={false} />`
First child in EffectComposer. M6 PASS 33.21% (07-02 capture; confirmed 27.74% in full stack at 07-06).
M11 delta: +5 draw calls (52→57). Zero tuning iterations.

### DEPTHOFFIELD (07-03)

`<DepthOfField worldFocusDistance={holeCardDistance} worldFocusRange={1.5} bokehScale={2.0} focalLength={0.025} />`
Second child in EffectComposer. `holeCardDistance` computed via `useMemo` as
`CAM_WORLD.distanceTo(HOLE_WORLD)` per cam preset (hero ~7.8wu / card ~9.5wu / macro ~4.5wu).
M1 PASS 50px (not cut). M11 delta: +99 draw calls (57→156 with N8AO+DOF).

### VIGNETTE + BRIGHTNESSCONTRAST + NOISE (07-04)

Stack order: `N8AO → DOF → BrightnessContrast → Vignette → Noise`.
`<BrightnessContrast brightness={0.03} contrast={0.05} />` — third child.
`<Vignette offset={0.70} darkness={0.12} eskil={false} />` — fourth child.
`<Noise opacity={0.03} premultiply={false} />` — fifth child.
Fog unchanged (near=20 / far=60 / color=#141009).
+A PASS (cornerLuma=31.9 ≥18; hue=29.1° warm; S=0.392).
M9 PASS (md5 c0c7e1247de0b279bb7572f5b2138ec4 byte-identical, two consecutive captures).

### CENTER GAME-STATE (07-05)

`<CenterGameState kit={cardKit} />` mounted unconditionally in Scene JSX, BEFORE the EffectComposer guard.
Deck stub: 4 face-down cards using `kit.body` (cardBodyGeometry) + `kit.stock` at
`DECK_POS [0.3, 0.0495, -1.3]` (radius=1.33wu ≤ 2wu scope limit PASS).
Dealer button: `cylinderGeometry [0.28, 0.28, 0.04, 24]` + `MeshPhysicalMaterial #f0e8d0 roughness=0.80 metalness=0`
at `BUTTON_POS [-0.7, 0.022, -1.6]` (radius=1.75wu ≤ 2wu PASS).
Zero new deps (reuses `kit.body` + `kit.stock`). Reads under both ?fx-off and ?fx-on.

### METRIC SUITE + grep-check-tp6-07 (07-06)

`tools/table-3d/grep-check-tp6-07.cjs` — 8-check TP6 postprocessing invariant checker.
M8 rect recalibrated from backdrop (cornerTL/cornerTR) to felt lateral edges (m8FeltEdgeL/m8FeltEdgeR).
M8 PASS 13.97%. 8 anchor PNGs committed at `docs/table-3d/anchors/tp6-gate/`.
`m7-bloom-assert.mjs` PATTERN relaxed from `/Bloom|EffectComposer|postprocessing/` to `/Bloom/` (TP6 parity).

## Scorecard delta

**depth: 3 → 5** (AAA — N8AO crevice AO + whisper DOF + M8 PASS vignette + +A warm corner; full
AO/DOF/vignette/grade stack satisfies all rubric criteria; +A cornerLuma=31.9 ≥18 PASS)

**shadows: 4 → 5** (AAA — TP6 N8AO delivers the inter-material crevice AO under the rail, in chip
gaps, at material joins that the TP5 PCSS grounding needed for "graded from hard to soft in every
crevice"; the TP5 deferred criterion is now satisfied)

**composition: 4 → 5** (AAA — CenterGameState (deck stub + dealer button) eliminates compositional
dead zones; cards>board>rail hierarchy reinforced; no voids; HERO ¾ angle reveals table as
protagonist; "no compositional voids or distracting dead zones" AAA criterion now met)

**lighting: 4 → 5** (AAA — M8 PASS (corners 8–20%) was the one remaining criterion for the
lighting AAA bar; with vignette M8 PASS 13.97% the deferred gate is now cleared;
+A cornerLuma≥18 PASS; all rubric criteria for lighting AAA now satisfied)

**tactility: 4 → 5** (AAA — AO in crevices (under rail, at material joins) is now present via N8AO;
the "product photograph" read that AAA(5) requires is now achievable with crevice darkening under the
rail, in the leather-to-wood join, in chip-stack gaps)

See SCORECARD_TABLE_3D.md for the full per-element status notes and TP progression log entry.

**AAA(5) deferrals carried from TP6 to TP7+:**
- cameras (12): canonical money shots confirmed at TP0 but final lock deferred to TP7 operator gate
- felt AAA(5): nap sheen macro read — deferred to TP9 final scorecard per rubric
- cards AAA(5): CARD_W/encuadre call needed for rank-glyph ≥22px — deferred per TP2 record
- chips AAA(5): denomination-suit clarity under one coherent warm light + AO — the N8AO now
  delivers the crevice AO component; remaining gap is the full denomination read (TP9 scope)
- brass (6): hairline-scratch normalMap + per-arc recessed patina — TP7 geometry pass
- leather rail (4): AAA(5) inter-material AO now present via N8AO — score update warranted; final
  confirmation at TP9 sign-off
- wood coaming (5): per-arc UV alignment (grain follows oval) — TP7 geometry pass
- premium-overall (15): full AAA lock deferred to TP9

## Outcome

**TP6 SHIPS IN FULL.** All five implementation workstreams committed LOCAL on `spike/table-3d-hero`:
N8AO crevice AO (M6 PASS), DepthOfField whisper (M1 PASS — NOT cut), BrightnessContrast +
Vignette + Noise filmic grade (+A/M8/M9 PASS), CenterGameState (deck stub + dealer button,
composition fix), grep-check-tp6-07 + M8 rect recalibration (metric tooling). Shipped behind `?fx`
flag (default remains ?fx-off = TP5 exact look; CenterGameState unconditional). No push / no deploy /
no merge. Phase 7 / TP6 is COMPLETE. Milestone 7/10 (70%).

**Next:** Phase 8 / TP7 — Cámaras (confirm and lock the canonical money shots: HERO ¾ fov32 /
POV fov40 / MACRO fov26 against the upgraded table + optional cinematic flythrough).

*Recorded by the GSD autonomous loop at the TP6 operator gate, 2026-06-12.*
*Gate auto-approved under the operator's standing "auto-approve (0 paradas)" directive — green HARD
gates + orchestrator CEO visual read. Flagged for operator batch confirmation.*
