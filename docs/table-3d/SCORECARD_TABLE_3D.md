# Table 3D — AAA Scorecard (15 elements · 0–5)

**Authored:** 2026-06-09 (plan 02, TP0a-5)
**Baseline:** 🔒 LOCKED 2026-06-10 — operator accepted the proposed scores ("Baseline locked") as the TP0 baseline. Avg ≈ 3.4; weakest = depth (2, AO/vignette are TP6); strongest = cards/composition/cameras/lighting/rail/body/social-read (4). Any future regression in a scored element is a TP regression.
**Target:** green = every element ≥ 4/5 at TP9.
**Anchor paths:** `docs/table-3d/anchors/head/{hero,card,macro}.png` (committed at plan 06)
**Scale:** 0 = absent/broken · 1 = placeholder · 2 = recognisable · 3 = acceptable · 4 = good · 5 = AAA

---

## Scoring rubric

| Score | Label | Meaning |
|------:|-------|---------|
| 0 | Absent | Element is missing or actively broken; the scene reads as a prototype shell. |
| 1 | Placeholder | Token presence; no craft signal. Would not pass a QA screenshot review. |
| 2 | Recognisable | Element is present and readable but clearly CG/unfinished. |
| 3 | Acceptable | Meets a minimum bar; no embarrassment, but nothing memorable. |
| 4 | Good | Noticeably crafted; would read as high-quality in a production release. |
| 5 | AAA | "Castizo" — the defining word for Chiribito. Discreet, material-forward, unforgettable. |

---

## Scorecard

| # | Element | Baseline | Target | 0 — absent | 3 — acceptable | 5 — AAA | Primary anchor |
|---|---------|:-------:|:------:|------------|----------------|---------|---------------|
| 1 | **felt** | **3** | ≥ 4 | Flat-lit disc, solid colour, no texture signal | Woven look, correct palette (#1f9163 family), no nap | Nap sheen, micro-relief visible in rake light, relights as camera moves | `macro` |
| 2 | **cards** | **4** | ≥ 4 | Decal / coloured plane; rank unreadable | Legible stock; suit icons distinct | Razor-legible Fournier stock; rank glyph ≥ 22 px on 1080p POV downscale; face texture punchy at M1 shot distance | `card (POV)` |
| 3 | **chips** | **3** | ≥ 4 | Oversized glossy coins; no denomination read | Matte, demoted accent pot; size-correct | Tooled clay edges; instanced; denomination suits readable; brass-not-gold (M4 PASS); demoted pot reads as identity, not clutter | `hero` / `macro` |
| 4 | **leather rail** | **4** | ≥ 4 | Flat band / plastic tube | Padded roll; bump visible; correct colour | Broken-in cordobán with welt; crease at inner edge; broad flattened crown reads as comfortable; bump map reacts to key light | `hero` / `rail` |
| 5 | **wood coaming** | **3** | ≥ 4 | Brown plastic ring | Varnished mahogany read; grain directional | Figured grain; per-arc UV alignment (grain follows the oval); varnish gloss restrained; joint detail at corners | `hero` |
| 6 | **brass** | **3** | ≥ 4 | Gold / gaudy; oversaturated | Aged brass tone; HSV roughly in range | Brass-not-gold (M4 PASS: H 35–48°, S ≤ 0.55, V ≤ 0.80); hairline scratches in normal map; reveals dirt and age, not showroom shine | `macro` |
| 7 | **body / contour** | **4** | ≥ 4 | Table floats; no apron, no plinth, no mass | Silhouette present; table has underside depth | Elegant sectional edge; apron + plinth read as furniture mass; the "you could move it" test passes | `hero` / `wide` |
| 8 | **lighting** | **4** | ≥ 4 | Flat ambient; no directionality | One warm key spotLight; shadow present | Shaped warm gradient: key overhead + two restrained fills + back rim for separation; warm floor bounce washes the apron; no casino uplighting | all 3 |
| 9 | **shadows** | **3** | ≥ 4 | No shadows / hard aliased shadow | Contact shadow present; soft edges | PCSS-quality penumbra on the felt; baked contact shadow under chips and cards; graded from hard (near contact) to soft (farther fall-off) | `hero` |
| 10 | **depth** | **2** | ≥ 4 | No depth cues; everything equidistant | Some atmospheric falloff; fog present | AO in crevices; restrained depth-of-field (not bokeh-soup); vignette 8–20% (M8 PASS); felt darkens toward rail | `hero` |
| 11 | **composition** | **4** | ≥ 4 | Dead zones; table cut off; no hierarchy | Balanced; all elements within frame | Cards dominate foreground read; board extends the eye into mid; rail + coaming frame the scene; no compositional voids; HERO: ¾ angle reveals table as protagonist | `hero` |
| 12 | **cameras** | **4** | ≥ 4 | Arbitrary / unframed; no intentional angle | Usable angles; table mostly in frame | Three locked money shots (HERO ¾ fov 32 / POV player fov 40 or 37 / MACRO detail fov 26); each tells a different story; zero unintentional clipping | all 3 |
| 13 | **tactility** | **3** | ≥ 4 | CG-flat; no material read | Material type recognisable (cloth / leather / wood / metal) | "You could pick it up" test passes: felt nap, leather grain, wood varnish, brass patina, clay chip edges — all readable without a label | `macro` |
| 14 | **social-read** | **4** | ≥ 4 | Still-life; no game narrative | Staged hand present; pot visible | Shared mid-play read: the Perla (Sota + 7 de Oros) reads as protagonist; community cards tell the board state; pot placement signals action without dominating; the scene invites imagination | `hero` |
| 15 | **premium-overall** | **3** | ≥ 4 | Prototype quality; would not ship | "It works"; presentable but forgettable | AAA, castizo, discreet. Chiribito's table is the one you remember — not because it's loud, but because every material is correct. The card is the protagonist. | all 3 |

---

## Per-element rubric anchor descriptions (0 / 3 / 5)

The descriptions in the table above are the operative anchors for operator scoring.
Additional per-level notes:

### 1 · felt
- **0:** solid-colour plane, no texture, no specular variation
- **3:** woven UV texture visible; colour within #1f9163–#0a4a33 palette; no catastrophic tiling
- **5:** nap direction visible in grazing light (macro shot); subtle specular extent (M+B < cap); felt ΔE < 12 (M3 PASS); colour relights credibly as camera moves

### 2 · cards
- **0:** no face texture or rank unreadable at any size
- **3:** rank + suit readable at full resolution; edges not Z-fighting; correct face texture loaded
- **5:** rank glyph bbox ≥ 22 px on 1080p POV downscale (M1 PASS + operator confirm); Fournier stock identifiable; hole cards fanned + lifted correctly (holeLayout); no visible Z-fight or mip aliasing

### 3 · chips
- **0:** cylinders with no material differentiation; too large / too central (dominating the card)
- **3:** denomination suits visible; demoted accent pot set aside; matte read (not glossy casino)
- **5:** tooled clay edge (bevel profile readable); instanced; HSV in brass range (M4 PASS); demoted pot (group[2.7,0,1.5] scale 0.66) reads as present but subordinate to the cards

### 4 · leather rail
- **0:** flat band or extruded square tube; no bump; wrong colour
- **3:** padded roll cross-section visible; bump or normal map; cordobán-adjacent colour
- **5:** broken-in crease at inner edge reads clearly; broad flattened crown (not showroom-taut tube); welt at wood join; specular is a dull highlight, not a shine

### 5 · wood coaming
- **0:** brown plastic ring; no grain; uniform specularity
- **3:** directional grain texture; mahogany colour range; varnish sheen present
- **5:** grain follows the oval (per-arc UV); figured/mottled grain in the highlight band; varnish gloss restrained (not wet-look); corner detail distinguishable from the leather

### 6 · brass
- **0:** gold / chrome / oversaturated yellow; H outside 35–48° or S > 0.55 or V > 0.80 (M4 FAIL)
- **3:** aged brass tone; correct H range; not shiny-new
- **5:** M4 PASS (H 35–48°, S ≤ 0.55, V ≤ 0.80); hairline-scratch normal map; slight dark patina in recesses; the reveal band between felt and leather reads as a detail, not decoration

### 7 · body / contour
- **0:** table is a disc floating in void; no underside, no apron, no weight
- **3:** apron visible from the HERO angle; table reads as furniture
- **5:** elegant sectional profile (rail → apron → plinth); the table has mass and sits convincingly; "you could move it" (weight and proportion are honest)

### 8 · lighting
- **0:** flat ambient or single harsh cone; no gradient; cold colour
- **3:** warm key spotLight from above; shadow on felt; atmosphere present
- **5:** shaped warm gradient: key (overhead) + two restrained fills (side + fill) + back rim (separation); warm floor bounce washing the apron; M8 PASS (corners 8–20% below centre); no casino uplighting; no Bloom (M7 PASS)

### 9 · shadows
- **0:** no shadows anywhere
- **3:** contact shadow present under table (ContactShadows); chips/cards cast shadows on felt
- **5:** PCSS-quality soft penumbra on felt; baked contact shadow correctly sized under chips and cards; shadow grades from near-hard (at contact) to diffuse (farther); no shadow acne or terminator artifacts

### 10 · depth
- **0:** no atmospheric falloff; table reads as a CG object with no environment
- **3:** fog present; scene darkens toward the backdrop; some sense of depth
- **5:** ambient occlusion in crevices (under the rail, in chip-stack gaps); restrained DOF or focal falloff; M8 PASS (vignette 8–20%); warm-corner floor (M+A floor present); felt darkens credibly toward the rail

### 11 · composition
- **0:** table is centred or cropped arbitrarily; no visual hierarchy
- **3:** balanced framing; all table elements visible; no obvious clipping
- **5:** HERO: ¾ angle reveals the table as protagonist with environmental context; POV: hole cards in foreground, board extends the eye; MACRO: material detail without losing object read; no compositional voids or distracting dead zones; M2 PASS (cards > chips area ratio ≥ 2.0×)

### 12 · cameras
- **0:** single arbitrary viewpoint; unframed
- **3:** multiple angles; scene roughly in frame from each
- **5:** three locked money shots frozen at TP0 (HERO pos[1.2,5.0,8.2] fov 32 / POV pos[0,4.7,10.6] fov 40 or 37 / MACRO pos[-1.7,1.7,2.4] fov 26); each tells a different story; no unintentional clipping at any preset; M9 PASS (byte-identical captures run-to-run)

### 13 · tactility
- **0:** all surfaces look the same; no material differentiation
- **3:** felt, leather, wood, metal are recognisably different material types
- **5:** "you could pick it up" — felt nap, leather softness, wood grain, brass weight, clay chip texture are all present and distinct without a label; the macro shot reads like a product photograph

### 14 · social-read
- **0:** still-life or empty table; no game narrative
- **3:** Perla hand staged; pot present; scene reads as "a card game happened here"
- **5:** the Perla (la mejor mano de Chiribito) reads as protagonist at the POV shot; community cards tell the board state clearly; demoted pot implies action without dominating; the scene invites a player's imagination; occupants are implied (not shown — seats remain opt-in)

### 15 · premium-overall
- **0:** prototype; the scene would not survive a pitch deck
- **3:** presentable; meets a minimum bar; could be a beta screenshot
- **5:** AAA, castizo, discreet. The table would not embarrass Chiribito next to a reference photograph of a real Spanish card table. Every material is correct. The card is the protagonist. The scene is inviting, not intimidating.

---

## Anchor-shot mapping

| Anchor shot | URL | Preset values (code) | Primary elements evaluated |
|-------------|-----|----------------------|---------------------------|
| HERO | `?cam=hero&spin=off` | pos[1.2,5.0,8.2] target[0,0.5,0] fov 32 | body/contour, lighting, shadows, depth, composition, cameras, social-read, premium-overall |
| POV (card) | `?cam=card&spin=off` | pos[0,4.7,10.6] target[0,0.25,1.2] fov 40* | cards (M1), composition (M2), cameras |
| MACRO | `?cam=macro&spin=off` | pos[-1.7,1.7,2.4] target[-1.55,0.05,1.05] fov 26 | felt, chips, brass, tactility |

> \* POV fov is 40 in the code today. Operator may refine to 37 at plan 05 (the one allowed TP0
> edit, before the irreversible baseline freeze). This scorecard uses whatever the code is at freeze time.

---

## Baseline scoring instructions (operator — plan 05/06)

1. Run the dev server: `cd frontend && npm run dev`
2. Capture the 3 money shots with the harness (from repo root):
   ```
   LAB_URL="http://localhost:5173/table-lab.html?cam=hero"  node .dev-stack/lab-shot.mjs docs/table-3d/anchors/head/hero.png
   LAB_URL="http://localhost:5173/table-lab.html?cam=card"  node .dev-stack/lab-shot.mjs docs/table-3d/anchors/head/card.png
   LAB_URL="http://localhost:5173/table-lab.html?cam=macro" node .dev-stack/lab-shot.mjs docs/table-3d/anchors/head/macro.png
   ```
3. Open each anchor PNG and score each element 0–5 using the rubric above.
4. Replace each baseline placeholder in the Baseline column with your score.
5. Commit: `git commit -F <msgfile>` (avoid double-quotes in PowerShell here-strings — HANDOFF §11.6).
6. The baseline is now locked. Any future regression in a scored element is a TP regression.
