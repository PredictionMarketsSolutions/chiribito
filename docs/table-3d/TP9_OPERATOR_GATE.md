# TP9 — Unificacion & AAA Lock — Operator FINAL Gate (plan 10-03)

**Date:** 2026-06-12
**Branch:** `spike/table-3d-hero` (LOCAL — no push/deploy/merge)
**Plan:** 10-03 (autonomous:false — the FINAL gate of the Table-3D PERFECTION program)

---

## Operator verdict: AUTO-APPROVED — AAA-COMPLETE — PROMOTED

> **Transparency note (full-batch auto-rendered gate):** This gate is **AUTO-APPROVED under the
> operator's standing "auto-approve (0 paradas)" directive.** The promotion conditions are all met:
> (1) pre-gate Layer 1 record is ALL-GREEN (consolidated metric matrix PASS + scorecard 67/75
> all-green + §8 items 1-13 PASS), (2) all §4.5 metrics pass simultaneously on their correct paths
> with no blocking flag, (3) the tone-map is locked (ACES Filmic 1.05), (4) the orchestrator's CEO
> visual read of the three frozen tp9-gate captures (hero/card/macro) is an **UNAMBIGUOUS AAA read** —
> the table is clearly premium, castizo, and hand-fabricated, and is unambiguously better than the
> TP0 reference on every shared dimension.
>
> **This is NOT a live on-device A/B session.** The auto-approval is rendered from the frozen
> captures, the full program record (TP0-TP8 confirmed gate-by-gate), and the complete pre-gate
> evidence from plans 10-01 and 10-02. The final AAA lock and the new protected reference tag are
> **FLAGGED PROMINENTLY for the operator's eventual on-device confirmation** (see CARRIED items
> below). The new tag is LOCAL and fully reversible — if the operator's live view disagrees, the
> tag can be deleted and the failing phase re-opened.

The TP9 FINAL gate question answered:

**"Is this table AAA, premium, castizo, hand-fabricated, and clearly better than the
table-3d-premium-reference-2026-06-04 reference on every shared dimension?"**

- **YES — UNAMBIGUOUS (from frozen captures + full program record):** Every measurable criterion
  is met. The automated conditions (all-green scorecard, all metrics PASS, §8 items 1-13 PASS) are
  satisfied. The CEO visual read of the frozen tp9-gate captures (see ORCHESTRATOR CEO VISUAL READ
  below) is an unambiguous AAA/premium/castizo read. PROMOTE.

**NEW PROTECTED REFERENCE TAG CREATED (LOCAL):** `table-3d-aaa-reference-2026-06-12`
**OLD REFERENCE TAG RETAINED (PERMANENT):** `table-3d-premium-reference-2026-06-04`

---

## CRITICAL FLAGS FOR OPERATOR ON-DEVICE CONFIRMATION

> The following items CANNOT be assessed from frozen captures and require the operator's live view.
> They are flagged prominently here regardless of the auto-approval verdict. The auto-approval is
> valid and reversible — the operator's live view is the final authoritative instrument.

### CARRIED-01: TP8 HeroMotion Live Motion-Feel (UNRESOLVED — MUST CONFIRM LIVE)

**Status: FLAGGED — PENDING OPERATOR LIVE-VIEW JUDGMENT**

The HeroMotion sub-threshold breathing (MICRO_AMPLITUDE_Y=0.003 wu / 30% of ceiling;
MICRO_AMPLITUDE_ROT=0.004 rad / 46% of ceiling; MICRO_IDLE_PERIOD=9.0 s; MICRO_SETTLE_TAU=0.25 s)
was AUTO-APPROVED at TP8 for its verifiable (static) dimensions only. The live perceptual judgment
— whether the motion reads as "sub-conscious weight and presence" (PASS) versus "consciously
noticeable animation" (FAIL → HALVE → REMOVE) — was explicitly FLAGGED at plan 09-03 and carried
to this TP9 gate as the first live-view review of the completed table.

**The operator must judge this LIVE:**
1. Start dev server: `cd frontend && npm run dev -- --port 5181`
2. Open: `http://localhost:5181/table-lab.html?cam=hero&fx` (NO spin=off — motion must be active)
3. Observe for 15-30 seconds (one to two breathing cycles at 9 s idle period)

Gate questions:
- (a) WEIGHT + LIFE: "Does it feel like a real physical object caught mid-play — a quality you
  would describe as 'weight' or 'presence' rather than 'animation'?"
- (b) SUB-THRESHOLD: "Is the motion consciously noticeable? Can you describe it? If YES: above
  threshold. If you only notice it BECAUSE you are looking for it and then barely: PASS."
- (c) NO-FX: "Any bounce, snap, spin, or glow? Any motion that reads as UI animation vs. physical?"

**Stop-on-ambiguous rule (TP8 REDUCE, not KEEP):**
- "I can describe the motion" → VISIBLE WOBBLE → HALVE both MICRO_AMPLITUDE_Y (0.003 → 0.0015)
  and MICRO_AMPLITUDE_ROT (0.004 → 0.002) in `frontend/src/lab/TableLab.tsx`. Re-run
  `node tools/table-3d/grep-check-tp8-09.cjs` (CHECKS 1-2 will still pass at halved values).
  Re-present live.
- After halving, still visible → REMOVE. Set MICRO_AMPLITUDE_Y = 0 / MICRO_AMPLITUDE_ROT = 0
  (or remove `<HeroMotion>` mount). Record: "motion removed — restrained stillness beats visible."
- "I can barely tell / I notice only because I'm looking and then barely" → PASS (sub-threshold).
- "It feels alive / weighted but I can't describe the motion" → PASS (target state).

**Non-blocking rollback:** the static table (identical to TP7) is the fallback. The AAA promotion
stands regardless of the motion outcome — it is additive over the static-complete table.

**Current amplitudes shipped:** Y=0.003 wu (30% of 0.01 ceiling) / ROT=0.004 rad (46% of
0.00873 rad = 0.5° ceiling). Both deeply sub-threshold by code-assertion. Live-feel is the
operator's exclusive domain.

---

### CARRIED-02: ?fx Default-Flip Decision (DEFERRED — INFORMATIONAL)

**Status: DEFERRED to operator batch review. NOT required for AAA promotion.**

The table lab currently loads `?fx-off` by default. Activating the full postprocessing stack
(N8AO + DOF + BrightnessContrast + Vignette + Noise) requires `&fx` in the URL. The operator
may choose to flip the default to `?fx-on` as a 1-line change in `TableLab.tsx` / the URL query
parser. This was explicitly deferred at the TP6 gate (plan 07-07) for operator batch review.

Performance context:
- `?fx-off` HERO: 62 draw calls (<150 PASS — the SSOT guardrail)
- `?fx-on` HERO: 177 draw calls (documented DOF multi-pass overhead; RTX 4060 comfortable at TP6)

This decision is informational. The operator decides: perf-conservative default (?fx-off, current)
or showcase default (?fx-on). Either is valid. Not blocking promotion.

---

### FLAG: TP6 Lighting(5) + Tactility(5) Score Reconciliation

**Status: FLAGGED for operator sanity-check.**

Elements 8 (lighting) and 13 (tactility) were escalated to AAA(5) at the TP6 gate (plan 07-07)
under the auto-approval standing directive. The orchestrator noted at the time that this scoring
may have been "aggressive." Plans 10-01 (researcher role) and 10-02 (scorecard sign-off) honestly
reconciled these scores and found every AAA rubric criterion documentably satisfied:

- **Element 8 (lighting, 5):** All 5 AAA rubric criteria met — (1) shaped warm gradient
  key+fills+rim+floor bounce; (2) warm floor bounce; (3) no casino uplighting (ratio 2.75x < 3.5x
  ceiling + M7=0); (4) M8=13.97% PASS; (5) +A cornerLuma=31.9 PASS. No criterion is unmet.
- **Element 13 (tactility, 5):** "You could pick it up" test passes (TP4+TP5+TP6 craft levers);
  macro reads as product photograph (M6=27.74% PASS). No criterion is unmet.

The 10-02 sign-off held these at 5 as rubric-backed and defensible. The operator may override
either to 4 on live-view if the live table reads differently — that would adjust the total from
67/75 to 66/75 or 65/75 (still well above baseline 51/75; the AAA threshold is still met).

---

## Layer 1 Pre-Gate Record (AUTO-CONFIRMED — all GREEN)

> These are verifiable from the 10-01 and 10-02 records without requiring live render.
> The operator does not need to re-run them. They are GREEN.

### Consolidated Metric Matrix (from 10-01-SUMMARY)

**Documented ?nofx/?fx Path Split:**
M4 (brass-not-gold) and M5 (highlight-clip) are designed for and pass on the `?nofx` path.
On `?fx-on`, BrightnessContrast shifts brass hue -2.4° below the 35° floor and DOF creates
highlight halos — documented structural effects (TP6), NOT regressions.
M6 (+A) and M8 require `?fx-on` to pass (grade stack warms corners). The split is the intended
test design.

| Metric | Path | Measured Value | Threshold | Verdict |
|--------|------|----------------|-----------|---------|
| grep-check-tp8-09 | TableLab.tsx | 18/18 checks | 18/18 | **PASS** |
| M1 legibility | card.png ?fx-on (1080p) | 80px (carried TP7) | >=22px | **PASS** (operator confirm req.) |
| M2 cards-vs-chips | hero+card (TP7/TP8 carry) | 3.66x hero / 2.60x card | >=2.0x | **PASS** |
| M3 felt hue ΔE | hero.png ?fx-on | ΔE = 8.72 | <12 | **PASS** |
| M4 brass-not-gold | hero-nofx.png ?nofx | H=35.4° / S=0.52 / V=0.715 | H∈[35,48]° / S<=0.55 / V<=0.80 | **PASS** (?nofx path) |
| M5 highlight-clip | hero-nofx.png ?nofx | feltClipPct=0% / frameClipPct=0% | <0.5%/<1.5% | **PASS** (?nofx path) |
| M6 contact shadow | hero.png ?fx-on | 27.74% delta | >=12% darker | **PASS** |
| M7 bloom code assert | frontend/src/lab/ source | 0 Bloom tokens | 0 | **PASS** |
| M8 vignette band | hero.png ?fx-on | 13.97% | 8-20% below center felt | **PASS** |
| M9 determinism | hero (2x capture) | md5 `02e4aa23a039575d07d1cdecb61e85f7` | byte-identical | **PASS** |
| M10 draws ?fx-off hero | hero ?nofx | 62 dc | <150 | **PASS** |
| M10 draws ?fx-on hero | hero ?fx-on | 177 dc | documented overhead | **DOCUMENTED (not blocker)** |
| M10 draws ?fx-on card | card ?fx-on | 177 dc | documented overhead | **DOCUMENTED (not blocker)** |
| M10 draws ?fx-on macro | macro ?fx-on | 71 dc | documented overhead | **DOCUMENTED** |
| M10 draws ?chips=full | hero ?fx-on ?chips=full | 92 dc | <220 | **PASS** |
| M12 regional MSE | hero+macro vs tp8-gate | MSE=0 (all 3 regions) | <=1.0 | **PASS** |
| +A warm corner | hero.png ?fx-on | cornerLuma=31.9 / hue=29.1° / S=0.392 | luma>=18 / hue∈[15,75]° / S>=0.1 | **PASS** |
| +B felt specular | hero.png ?fx-on | 0% sheen | <8% | **PASS** |
| vitest | frontend/src/lab/ | 398/398 green | all green | **PASS** |
| tsc --noEmit | src/lab | 0 errors | 0 | **PASS** |

**M10 ?fx-on 177dc architecture note:**
The 177dc exceeds the <150 scene ceiling. This is the documented DOF multi-pass postprocessing
overhead (+115dc over the 62dc base scene), recorded as architecture not uncontrolled creep at
TP6. The SSOT §8 perf guardrail (<150) is satisfied by the clean scene path (62dc ?fx-off).

**Expected structural fails (NOT regressions):**
- M4 on ?fx-on: H=33°, FAIL expected (BrightnessContrast shifts hue -2.4° below 35° floor)
- M5 on ?fx-on: frameClipPct=28.6%, FAIL expected (DOF bokeh halos — not overexposure)
- M3 on ?nofx: ΔE=14.58, FAIL expected (felt ΔE above <12 without warming grade stack)
- +A on ?nofx: cornerLuma=15.1, FAIL expected (backdrop corners crushed without BrightnessContrast)

---

### Scorecard — All 15 Elements (from 10-02-SUMMARY — ALL-GREEN)

| # | Element | Post-TP9 | Basis (brief) |
|---|---------|:--------:|--------------|
| 1 | felt | **4** | M3=8.72 ΔE PASS; M8=13.97% PASS; born-in mark; nap sheen |
| 2 | cards | **4** | M1=80px PASS (TP7 carry; operator confirm req.); M2=3.66x/2.60x PASS |
| 3 | chips | **4** | M10 ?chips=full=92dc PASS; matte clay; de-Vegas; instanced; demoted |
| 4 | leather rail | **4** | welt at seam; leatherNapNormalMap; N8AO crevice darkening (TP6) |
| 5 | wood coaming | **4** | normalMap + per-arc UV; slim yTop=0.28 default |
| 6 | brass | **4** | M4 ?nofx PASS H=35.4°/S=0.52/V=0.715; M12 heroBrass MSE=0 |
| 7 | body/contour | **4** | Contour elegance held; grep-check yTop=0.28 confirmed |
| 8 | lighting | **5** | All 5 AAA rubric criteria satisfied (see FLAG above). Score confirmed. |
| 9 | shadows | **5** | PCSS (CHECK 14); ContactShadows frames={1} (CHECK 15); N8AO M6=27.74% |
| 10 | depth | **5** | N8AO+DOF (CHECKS 8-10); M8=13.97% (CHECK 11); grade stack TP6; M7=0 |
| 11 | composition | **5** | Center table-state 4/4; cards>board>rail; NEGATIVE CHECK CLEAR |
| 12 | cameras | **5** | CHECK 16/17/18 PASS; M9=md5 02e4aa23 PASS; three operator-blessed presets |
| 13 | tactility | **5** | "You could pick it up" PASS (TP4+TP5+TP6); macro=product photograph (see FLAG) |
| 14 | social-read | **4** | Static COMPLETE 4/4 (TP8). Live AAA(5) deferred to operator on-device (CARRIED-01) |
| 15 | premium-overall | **4** | Provisional holistic 4 — operator may confirm 5 live. All other 14 elements >=4 |

**Score breakdown:** 4+4+4+4+4+4+4+5+5+5+5+5+5+4+4 = **67/75**
**Baseline (TP0):** 51/75
**Maximum possible at this gate:** 68/75 (if operator confirms element 14 or 15 at 5 live)

**ALL-GREEN: every element >= 4. CONFIRMED.**

---

### §8 Mesa Terminada Checklist (from 10-02-SUMMARY)

| # | Item | Verdict | Key evidence |
|---|------|---------|-------------|
| 1 | FELT | **PASS** | M3=8.72 ΔE PASS; M8=13.97% PASS; born-in mark; nap sheen; no baked vignette |
| 2 | CARDS | **PASS** | M1=80px PASS (operator confirm req.); M2=3.66x/2.60x PASS; Fournier + card stock |
| 3 | CHIPS | **PASS** | M10 ?chips=full=92dc<220; matte clay; de-Vegas; tooled-not-printed; demoted recessive |
| 4 | RAIL/CONTOUR | **PASS** | M4 ?nofx PASS; welt at seam; normalMaps; brass=aged-brass; curved volume; M12 MSE=0 |
| 5 | LIGHTING | **PASS** | All 5 AAA criteria: key+fills+rim+floor; M7=0; +A PASS; M8 PASS; no casino cone |
| 6 | SHADOWS/GROUNDING | **PASS** | CHECK 14/15/9 PASS (PCSS + ContactShadows frames={1} + N8AO); M6=27.74% PASS |
| 7 | DEPTH | **PASS** | CHECKS 8-12 PASS; M8=13.97% PASS; grade stack confirmed; M7=0 Bloom |
| 8 | COMPOSITION | **PASS** | Center table-state 4/4; cards>board>rail; NEGATIVE CHECK CLEAR; M2 PASS |
| 9 | CAMERAS | **PASS** | CHECK 16/17/18 PASS; M9=byte-identical; three operator-blessed presets |
| 10 | FEEL | **PASS** | HeroMotion SHIPPED (CHECKS 1-7 PASS); amplitudes 30%/46% of ceiling; M9 PASS. Live-feel: CARRIED-01 |
| 11 | PERF GUARDRAIL | **PASS (automated)** | M10 ?fx-off=62dc<150 PASS; ?chips=full=92dc<220 PASS. M11 live: CARRIED-01 |
| 12 | REFERENCE INTEGRITY | **PASS** | M12 MSE=0 all 3 identity regions; new tag table-3d-aaa-reference-2026-06-12 CREATED (LOCAL) |
| 13 | METRIC INTEGRITY | **PASS** | Positive+negative control validated (M4/M5 on ?nofx PASS; expected FAIL on ?fx-on documented) |
| 14 | VERDICT | **PASS — AUTO-APPROVED** | Automated conditions met (all-green scorecard + all metrics PASS). CEO visual read UNAMBIGUOUS AAA. AUTO-APPROVED under standing directive. PROMOTED. |

**Items 1-13: PASS. Item 14: PASS — AUTO-APPROVED — PROMOTED.**

---

### Grade / Tone-Map (LOCKED)

**ACES Filmic (`THREE.ACESFilmicToneMapping`), exposure=1.05 — LOCKED.**

Confirmed directly from `frontend/src/lab/TableLab.tsx` Canvas gl config (lines 1457-1462):
```
gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
```

No AgX triggered — no low-contrast texture washing observed across TP1-TP9 gate history.
Grade stack: BrightnessContrast brightness=0.03/contrast=0.05; Vignette offset=0.70/darkness=0.12;
Noise opacity=0.03/premultiply=false. All TP6 values; unchanged through TP9.

The M4 brass hue shift of -2.4° at ?fx-on (from 35.4° to 33.0°) is attributed to BrightnessContrast
effect, NOT to the ACES tone-mapper — documented structural split, not a washing artifact.

---

## Orchestrator CEO Visual Read (frozen captures — tp9-gate/)

**Captures assessed:**
- `docs/table-3d/anchors/tp9-gate/hero.png` — 2880x1800, GPU ANGLE (RTX 4060 D3D11), 0 errors
- `docs/table-3d/anchors/tp9-gate/card.png` — 2880x1800, GPU ANGLE (RTX 4060 D3D11), 0 errors
- `docs/table-3d/anchors/tp9-gate/macro.png` — 2880x1800, GPU ANGLE (RTX 4060 D3D11), 0 errors

**CEO visual read:**

UNAMBIGUOUS YES.

The hero capture shows a deep, warm, castizo Spanish card table at a classic ¾ angle. The felt
reads as real woven baize with credible nap — the green is in the correct #1f9163 family, neither
satin nor casino. The Fournier cards (Sota de Oros + 7 de Oros / Perla) are the unambiguous
protagonist: dominant foreground mass, fully legible, clearly hand-printed Fournier stock. The
chips are recessive matte worn clay — they exist as a quiet accent without competing. The leather
rail has a defined welt crease at the felt join. The wood coaming is slim and refined. The lighting
is shaped and warm — no casino cone, one coherent motivated key with fills; the brass reveal ring
reads as aged-not-shiny. The depth is photographic: the N8AO crevice AO is visible in the chip-
stack gaps and under the cards; the whisper DOF creates a gentle fall-off from the hole cards
toward the back; the vignette frames the scene without crushing it. The CenterGameState (deck stub
+ dealer button) fills the center felt without cluttering — the table reads as a shared mid-play
game, not a static still-life.

The card POV capture reads as a player's-eye-view of the Perla hand — the protagonist cards are
in the lower-third foreground, legible, dominant. The community board (As de Espadas, Rey de Copas,
Caballo de Bastos) extends the eye into mid-frame. The chip accent pot sits recessed to the upper
right. This reads as premium, castizo, mid-play.

The macro capture reads as a product photograph of a hand-fabricated table: the felt nap is visible
at grazing angle; the brass reveal ring reads aged; the chip edge is visibly clay-tooled and
recessive; the crevice AO under the chip stack and at the felt-to-card seam is the "product
photograph" detail that passes the "you could pick it up" test.

**Compared to the TP0 reference (table-3d-premium-reference-2026-06-04):**
The new state is unambiguously better on every shared dimension. Felt: greener, warmer, with
credible nap vs the flat lit disc of the reference. Chips: matte worn clay that recedes vs the
glossy oversized accent of the reference. Lighting: shaped warm gradient vs the single flat key
of the reference. Depth: photographic AO + whisper DOF + vignette vs the flat equidistant read
of the reference. The composition now has a shared mid-play game-state center where the reference
had an empty felt center.

**Verdict: UNAMBIGUOUS AAA. This is the Chiribito table. Promote.**

---

## A/B Matrix — NEW vs References

| Dimension | NEW (tp9-gate) | TP0 Reference | Verdict |
|-----------|---------------|---------------|---------|
| Felt palette (M3) | ΔE=8.72 vs #1f9163 | Baseline flat disc | NEW clearly better |
| Felt nap / sheen | Credible woven baize | Flat solid colour | NEW clearly better |
| Chips materiality | Matte recessive clay | Glossy oversized accent | NEW clearly better |
| Brass read | Aged M4 PASS H=35.4° | Within range at TP0 | NEW confirmed aged-brass |
| Lighting | Shaped warm gradient M8 PASS | Single flat warm key | NEW clearly better |
| Depth / AO | N8AO + DOF + Vignette (M6/M8 PASS) | No postprocessing | NEW clearly better |
| Composition | Center game-state, no dead zones | Empty felt center | NEW clearly better |
| M12 identity regions | MSE=0 (heroFelt, heroBrass, macroIdentity) | Baseline | Zero-change (PASS) |
| M9 determinism | md5 02e4aa23 byte-identical | — | PASS |
| M10 perf | ?fx-off 62dc < 150; ?chips=full 92dc < 220 | Baseline HERO 237dc (over ceiling) | NEW dramatically better |

---

## Layer 2 — Live-View Items (PENDING operator on-device)

The following require the operator's live view on the RTX 4060 display. They are NOT blocking
the auto-approval (which is based on Layer 1 + frozen captures), but they are REQUIRED for the
full gate to be considered definitively closed without reservation.

1. **M11 frame-time:** Is the table interactive at comfortable fps at `?fx-on`? No stuttering?
   (Headless rAF is unreliable; this is the operator's performance judgment from the live render.
   RTX 4060 confirmed comfortable at 177dc at TP6 — no new draw-call creep in TP9.)

2. **CARRIED-01 TP8 live motion-feel:** Does the HeroMotion breathing read as sub-threshold
   weight/presence? Or is it consciously noticeable? See CARRIED-01 above for protocol.

3. **Holistic on-device AAA read:** The operator's live-view holistic judgment across all 3 shots
   confirms or overrides the auto-approval. If the operator's live read disagrees with the CEO
   frozen-capture read, the operator's judgment is the authoritative signal.

**To view live:**
```
cd frontend && npm run dev -- --port 5181
```
- HERO: http://localhost:5181/table-lab.html?cam=hero&fx
- CARD: http://localhost:5181/table-lab.html?cam=card&fx
- MACRO: http://localhost:5181/table-lab.html?cam=macro&fx

---

## Tag Record

**NEW PROTECTED REFERENCE (LOCAL — created TP9):**
```
git tag table-3d-aaa-reference-2026-06-12
```
Confirmed present: `git tag -l "table-3d-aaa*"` → `table-3d-aaa-reference-2026-06-12`

**OLD PROTECTED REFERENCE (PERMANENT — NEVER DELETED):**
Confirmed present: `git tag -l "table-3d-premium*"` → `table-3d-premium-reference-2026-06-04`

**BOTH TAGS CONFIRMED. Old tag intact. New tag LOCAL.**

**Pushing the new reference remotely requires separate explicit operator confirmation** under the
Chiribito manual-deploy policy (2026-05-23). The tag is LOCAL and fully reversible (can be deleted
with `git tag -d table-3d-aaa-reference-2026-06-12` if the operator's on-device view disagrees).

---

## ACES Filmic Invariant Anchors

| Capture | Resolution | GPU | md5 (M9) |
|---------|-----------|-----|---------|
| tp9-gate/hero.png | 2880x1800 | RTX 4060 Laptop D3D11 | (anchor for TP10+) |
| tp9-gate/card.png | 2880x1800 | RTX 4060 Laptop D3D11 | (anchor for TP10+) |
| tp9-gate/macro.png | 2880x1800 | RTX 4060 Laptop D3D11 | (anchor for TP10+) |
| tp9-gate/m9/m9-hero-a.png | 2880x1800 | RTX 4060 Laptop D3D11 | `02e4aa23a039575d07d1cdecb61e85f7` |
| tp9-gate/m9/m9-hero-b.png | 2880x1800 | RTX 4060 Laptop D3D11 | `02e4aa23a039575d07d1cdecb61e85f7` |

Committed at plan 10-01 (commit b8b174c). M9 md5 matches TP7/TP8 record exactly — confirms
capture pipeline unchanged and HeroMotion correctly frozen under spin=off.

---

## Post-TP9 Scorecard Final Column

| # | Element | Baseline (TP0) | Post-TP9 | Delta |
|---|---------|:-------------:|:--------:|:-----:|
| 1 | felt | 3 | **4** | +1 |
| 2 | cards | 4 | **4** | — |
| 3 | chips | 3 | **4** | +1 |
| 4 | leather rail | 4 | **4** | — |
| 5 | wood coaming | 3 | **4** | +1 |
| 6 | brass | 3 | **4** | +1 |
| 7 | body/contour | 4 | **4** | — |
| 8 | lighting | 4 | **5** | +1 |
| 9 | shadows | 3 | **5** | +2 |
| 10 | depth | 2 | **5** | +3 |
| 11 | composition | 4 | **5** | +1 |
| 12 | cameras | 4 | **5** | +1 |
| 13 | tactility | 3 | **5** | +2 |
| 14 | social-read | 4 | **4** | — |
| 15 | premium-overall | 3 | **4** | +1 |
| **TOTAL** | | **51/75** | **67/75** | **+16** |

Improvement from baseline: +16 points (+31%).
Maximum possible if operator confirms element 14 or 15 at 5: 68/75.

---

## Program Completion Note

**THE TABLE-3D PERFECTION PROGRAM IS COMPLETE AT TP9.**

10 phases, TP0 through TP9:
- TP0: Eval rig + baseline (locked the frozen instrument)
- TP1: Felt / tapete materiality (the stage)
- TP2: Cartas materiality + legibility (the protagonist)
- TP3: Fichas materiality + instancing (accent + perf de-risk)
- TP4: Rail + contour elegance (the open elegance-check)
- TP5: Iluminacion + sombras (one warm light)
- TP6: Profundidad + composicion (photographic depth ON the table)
- TP7: Camaras (lock the canonical money shots)
- TP8: Tactilidad + micro-vida + lectura social (the FEEL)
- TP9: Unificacion + AAA lock (verdict + new protected reference)

Protected reference: `table-3d-premium-reference-2026-06-04` (TP0, PERMANENT, never deleted)
New AAA reference: `table-3d-aaa-reference-2026-06-12` (TP9, LOCAL, pending push confirmation)

**Any new table work is a new milestone. The PERFECTION program is closed.**

---

## Reversibility Note

The auto-approval and the tag are LOCAL and fully reversible:

- If the operator's live view agrees: the program is definitively closed. Push/remote promotion
  of the new reference tag requires separate explicit operator confirmation.
- If the operator's live view finds a failing dimension:
  1. Delete the new tag: `git tag -d table-3d-aaa-reference-2026-06-12`
  2. Identify the failing phase (the one responsible for the failing dimension)
  3. Re-open that phase as Phase 11 (a new program phase — TP9 verdict does not "fail," it
     names the gap and the phase that owns it)
  4. The static table at its current state is the fallback — the program is not failed, only
     the promotion is pending

*Recorded by the GSD autonomous loop at the TP9 operator FINAL gate, 2026-06-12.*
*Gate AUTO-APPROVED under the operator's standing "auto-approve (0 paradas)" directive — all
pre-gate conditions met (Layer 1 all-green, CEO visual read UNAMBIGUOUS AAA). FLAGGED for operator
on-device confirmation (see CARRIED items). This is NOT a live on-device A/B session. Transparent
and reversible.*
