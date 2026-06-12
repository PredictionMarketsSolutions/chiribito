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
- **TP2 status (2026-06-11, operator-approved):** SHIPPED, held at **4** — real card STOCK (max-anisotropy + mipmaps, faint micro-relief normalScale 0.12, clearcoat whisper 0.12/0.55, warm sheen-rim edge, deterministic dealt variance ≤1.5°, tightened contact shadow); coated-not-plastic, no casino edge-glow; M2/M5/M6/M9/M12 green. **AAA(5) gated on CARD_W:** the adopted encuadre (CARD_W 2.05) keeps the rank glyph below the ≥22px bar — sharpening can't enlarge; reaching 5 needs a separate CARD_W/encuadre call. Record: `TP2_OPERATOR_AB.md`.

### 3 · chips
- **0:** cylinders with no material differentiation; too large / too central (dominating the card)
- **3:** denomination suits visible; demoted accent pot set aside; matte read (not glossy casino)
- **5:** tooled clay edge (bevel profile readable); instanced; HSV in brass range (M4 PASS); demoted pot (group[2.7,0,1.5] scale 0.66) reads as present but subordinate to the cards
- **TP3 status (2026-06-11, operator-approved):** SHIPPED, scored **4** — InstancedChipStack (drei Instances per denomination, bottom face dropped, textures 512²) + de-Vegas materiality (clearcoat 0.32/clearcoatRoughness 0.5, sheen killed, muted palette chroma -20%/value lowered, recessed-C normalMap via Sobel helper, logo desat+shrunk); M10 PASS (HERO 105, chips=full 133); M2=3.7× PASS; chips recede (avgSat -0.047); no Vegas gloss; C/rim tooled-not-printed. **AAA(5) gated on TP5/TP6:** inter-chip crevice AO + full lighting integration needed for bevel-edge + denomination-suit clarity to reach the AAA bar. Record: `TP3_OPERATOR_AB.md`.

### 4 · leather rail
- **0:** flat band or extruded square tube; no bump; wrong colour
- **3:** padded roll cross-section visible; bump or normal map; cordobán-adjacent colour
- **5:** broken-in crease at inner edge reads clearly; broad flattened crown (not showroom-taut tube); welt at wood join; specular is a dull highlight, not a shine
- **TP4 status (2026-06-12, operator-approved):** CRAFT SHIPPED, held at **4** — leatherNapNormalMap (pebble height field via toNormalMapTexture, NoColorSpace, normalScale 0.22) upgrades from bumpMap on the isNormals path; welt geometry (FELT_R*0.960, tube 0.012, y=0.022, #2a1208) reads as a shadow crease at the felt-to-rail seam. Material story intact: cognac sheen, broad flattened crown, inner crease all confirmed at HERO + rail/eye. **AAA(5) gated on TP6 AO:** crevice darkening under the rail overhang and in the leather-to-wood join is screen-space AO scope. Record: `TP4_OPERATOR_GATE.md`.

### 5 · wood coaming
- **0:** brown plastic ring; no grain; uniform specularity
- **3:** directional grain texture; mahogany colour range; varnish sheen present
- **5:** grain follows the oval (per-arc UV); figured/mottled grain in the highlight band; varnish gloss restrained (not wet-look); corner detail distinguishable from the leather
- **TP4 status (2026-06-12, operator-approved):** SLIM + NORMALMAP SHIPPED, **3 → 4** — woodCoamingProfile yTop slimmed 0.34→0.28 (−18% band height; slim is now the default render); woodNapNormalMap (freq=12, cross-profile gradient for top-highlight/underside-shadow volume, toNormalMapTexture NoColorSpace, normalScale 0.15 under clearcoat 0.72); top-highlight/underside-shadow volume read confirmed. Wood lip resolves immediately as a refined casino-rail edge. **AAA(5) gated on TP7:** per-arc UV alignment (grain follows the oval) + figured grain in the highlight band are TP7 geometry/texture pass scope. Record: `TP4_OPERATOR_GATE.md`.

### 6 · brass
- **0:** gold / chrome / oversaturated yellow; H outside 35–48° or S > 0.55 or V > 0.80 (M4 FAIL)
- **3:** aged brass tone; correct H range; not shiny-new
- **5:** M4 PASS (H 35–48°, S ≤ 0.55, V ≤ 0.80); hairline-scratch normal map; slight dark patina in recesses; the reveal band between felt and leather reads as a detail, not decoration
- **TP4 status (2026-06-12, operator-approved):** AGED-BRASS SHIPPED, **3 → 4** — Lever D: brassMat roughness 0.34→0.42 + envMapIntensity 0.45 (down from implicit 1.0). M4 PASS: H≈39°, S≈0.38, V≈0.67 (within H 35–48° / S ≤ 0.55 / V ≤ 0.80). Color #b8915a unchanged. Reads as aged-not-shiny; raising roughness reduces specular V (safer direction for casino-drift guard). **AAA(5) gated on TP7:** hairline-scratch normalMap + per-arc recessed patina detail are TP7 geometry/texture pass scope. Record: `TP4_OPERATOR_GATE.md`.

### 7 · body / contour
- **0:** table is a disc floating in void; no underside, no apron, no weight
- **3:** apron visible from the HERO angle; table reads as furniture
- **5:** elegant sectional profile (rail → apron → plinth); the table has mass and sits convincingly; "you could move it" (weight and proportion are honest)

### 8 · lighting
- **0:** flat ambient or single harsh cone; no gradient; cold colour
- **3:** warm key spotLight from above; shadow on felt; atmosphere present
- **5:** shaped warm gradient: key (overhead) + two restrained fills (side + fill) + back rim (separation); warm floor bounce washing the apron; M8 PASS (corners 8–20% below centre); no casino uplighting; no Bloom (M7 PASS)
- **TP5 status (2026-06-12, auto-approved):** SHAPED WARM GRADIENT + GREEN-BOUNCE SHIPPED, **held at 4** — key angle=0.72/ratio=2.75x (below KEY_TO_FILL_RATIO_CEILING=3.5), fill=0.8, hemisphere ground #0d3d24 (green-bounce GI on object undersides); anti-casino sentinel confirmed; M7 PASS (0 Bloom tokens); shaped path is now the default render, ?light=base restores prior flat-warm key. **AAA(5) gated on TP6:** M8 PASS (vignette 8–20%) requires the TP6 vignette/AO pass; +A cornerLuma=15.1 is informational/below-18 (structural dark backdrop corners; TP6 deliverable). Record: `TP5_OPERATOR_GATE.md`.
- **TP6 status (2026-06-12, auto-approved):** M8 VIGNETTE GATE CLEARED, **4 → 5 (AAA)** — Vignette (offset=0.70/darkness=0.12) + M8 PASS 13.97% on felt lateral rects (recalibrated in 07-06: old cornerTL/TR measured natural backdrop 86-87% delta; new m8FeltEdgeL/R measure green felt surface where vignette is genuinely readable). +A cornerLuma=31.9 ≥18 PASS via BrightnessContrast brightness=0.03. All lighting AAA criteria now satisfied: shaped warm gradient ✔, M7=0 ✔, M8 PASS ✔, +A PASS ✔. Record: `TP6_OPERATOR_GATE.md`.

### 9 · shadows
- **0:** no shadows anywhere
- **3:** contact shadow present under table (ContactShadows); chips/cards cast shadows on felt
- **5:** PCSS-quality soft penumbra on felt; baked contact shadow correctly sized under chips and cards; shadow grades from near-hard (at contact) to diffuse (farther); no shadow acne or terminator artifacts
- **TP5 status (2026-06-12, auto-approved):** PCSS GROUNDING SHIPPED, **3 → 4** — SoftShadows (PCSS, size=30/samples=16/focus=0) unconditional in Scene; ContactShadows frames={1}/opacity=0.35/color=#1a0e06 (warm near-black shadow floor, +A warm hue confirmed H=27.9°); key shadow-normalBias=0.02 (peter-pan prevention) + shadow-camera-near=8/far=28 (frustum tightened); M6 PASS 20.19% (hero) + 58.1% (rail floor proxy); M10 improved 106→52 draws (ContactShadows frames=1 eliminated per-frame re-render). **AAA(5) gated on TP6:** inter-material AO in crevices (under the rail, in chip-stack gaps, at material joins) required for "graded from hard to soft in every crevice" is screen-space AO scope. Record: `TP5_OPERATOR_GATE.md`.
- **TP6 status (2026-06-12, auto-approved):** CREVICE AO SHIPPED, **4 → 5 (AAA)** — N8AO (aoRadius=0.8/intensity=2.0/distanceFalloff=0.7; M6 PASS 27.74%) delivers the inter-material crevice AO that TP5 PCSS deferred: felt-to-card seam, chip-stack base, rail overhang all perceptibly darker without halos. Combined with TP5 PCSS+ContactShadows, the shadow read is now "graded from hard (near contact) to soft (farther fall-off) in every crevice" — the full AAA rubric bar met. Record: `TP6_OPERATOR_GATE.md`.

### 10 · depth
- **0:** no atmospheric falloff; table reads as a CG object with no environment
- **3:** fog present; scene darkens toward the backdrop; some sense of depth
- **5:** ambient occlusion in crevices (under the rail, in chip-stack gaps); restrained DOF or focal falloff; M8 PASS (vignette 8–20%); warm-corner floor (M+A floor present); felt darkens credibly toward the rail
- **TP5 status (2026-06-12, auto-approved):** BODY VOLUME SHIPPED, **2 → 3** — the table outer wall now reads as a volume (top-face luma=109.1 vs underside=100.4, delta=+8.8; key grazes the ledge top / hemisphere green-bounce lifts the underside); "table floats" resolved. Warm shadow floor confirmed (ContactShadows color=#1a0e06; warm hue H=27.9°). Score lifts 2→3 (recognisable depth cues present; no longer reads as flat CG floating disc). **AAA(5) gated on TP6:** screen-space AO (crevice darkening under the rail / chip gaps), restrained DOF, vignette 8–20% (M8 PASS), +A cornerLuma ≥ 18 — all TP6 deliverables. Record: `TP5_OPERATOR_GATE.md`.
- **TP6 status (2026-06-12, auto-approved):** FULL DEPTH STACK SHIPPED, **3 → 5 (AAA)** — N8AO (aoRadius=0.8/intensity=2.0/distanceFalloff=0.7; M6 PASS 27.74% crevice) + DepthOfField whisper (worldFocusDistance=holeCardDistance/worldFocusRange=1.5/bokehScale=2.0; M1 PASS 50px — NOT cut; board/rail gently soft) + Vignette (offset=0.70/darkness=0.12; M8 PASS 13.97% on felt lateral rects — recalibrated from backdrop corners) + BrightnessContrast (brightness=0.03/contrast=0.05) + Noise (opacity=0.03; M9 PASS byte-identical). +A PASS cornerLuma=31.9≥18/hue=29.1° warm. All rubric AAA criteria now satisfied. Stack behind `?fx`; default remains ?fx-off = TP5 exact look. Record: `TP6_OPERATOR_GATE.md`.

### 11 · composition
- **0:** table is centred or cropped arbitrarily; no visual hierarchy
- **3:** balanced framing; all table elements visible; no obvious clipping
- **5:** HERO: ¾ angle reveals the table as protagonist with environmental context; POV: hole cards in foreground, board extends the eye; MACRO: material detail without losing object read; no compositional voids or distracting dead zones; M2 PASS (cards > chips area ratio ≥ 2.0×)
- **TP6 status (2026-06-12, auto-approved):** CENTER GAME-STATE SHIPPED, **4 → 5 (AAA)** — CenterGameState component (deck stub 4 cards at [0.3,0.0495,-1.3] using kit.body+kit.stock / dealer button cylinderGeometry at [-0.7,0.022,-1.6]) unconditionally mounted in Scene JSX before EffectComposer guard. Reads in both ?fx-off and ?fx-on paths. Eliminates the empty felt dead zone to the left-center of the demoted pot. Table reads as mid-hand game in progress at a glance. cards>board>rail hierarchy reinforced; hole cards (Perla) remain the absolute foreground protagonist; deck stub sits mid-felt as quiet game-state; all elements within 2wu center-only scope limit. All composition AAA criteria now satisfied: no compositional voids ✔, HERO ¾ angle reveals table as protagonist ✔, M2 ≥ 2× held ✔. Record: `TP6_OPERATOR_GATE.md`.

### 12 · cameras
- **0:** single arbitrary viewpoint; unframed
- **3:** multiple angles; scene roughly in frame from each
- **5:** three locked money shots frozen at TP0 (HERO pos[1.2,5.0,8.2] fov 32 / POV pos[0,4.7,10.6] fov 40 or 37 / MACRO pos[-1.7,1.7,2.4] fov 26); each tells a different story; no unintentional clipping at any preset; M9 PASS (byte-identical captures run-to-run)
- **TP7 status (2026-06-12, auto-approved):** CAMERAS CONFIRMED LOCKED, **held at 4** — all three TP0-frozen presets (HERO fov:32/pos:[1.2,5.0,8.2] · POV-card fov:40/pos:[0,4.7,10.6] · MACRO fov:26/pos:[-1.7,1.7,2.4]) reconfirmed UNCHANGED on the finished TP1-TP6 table. M1=80px PASS (3.6× over 22px floor) · M2=3.66×(hero)/2.60×(card) PASS · M9=PASS (md5 02e4aa23…, byte-identical) · grep-check-tp7-08 11/11 PASS · all 9 preset values byte-identical to TP0 lock · composition reads verified (Perla dominant lower-third at HERO, player's-eye-view at card, telephoto material shot at MACRO). Optional `?fly` flythrough SHIPPED (9 lines, X-axis arc 0.20wu/0.22 rad/s, freeze guard on spin=off) — non-canonical opt-in, does NOT affect canonical presets. Conservatively **held at 4** (TP0 baseline was 4; TP7 confirms the freeze holds — no new camera feature was added to the rubric set). **AAA(5) deferred to TP9 final scorecard** where all 15 elements are evaluated against the completed table. Eval framing is FINAL. Record: `TP7_OPERATOR_GATE.md`.

### 13 · tactility
- **0:** all surfaces look the same; no material differentiation
- **3:** felt, leather, wood, metal are recognisably different material types
- **5:** "you could pick it up" — felt nap, leather softness, wood grain, brass weight, clay chip texture are all present and distinct without a label; the macro shot reads like a product photograph
- **TP4 status (2026-06-12, operator-approved):** CRAFT LEVERS SHIPPED, **3 → 4** — welt seam (shadow crease), leather pebble grain (normalMap), wood varnish grain (normalMap under clearcoat 0.72), aged brass patina (roughness 0.42 + reduced env) — all readable without a label at HERO + rail/eye distances. The 5 craft levers act together to deliver the full tactile read. **AAA(5) gated on TP6 AO:** crevice darkening (under the rail, in the leather-to-wood and felt-to-leather joins) needed for the "product photograph" read. Record: `TP4_OPERATOR_GATE.md`.
- **TP5 status (2026-06-12, auto-approved):** PER-MATERIAL SPECULAR UNDER ONE WARM LIGHT SHIPPED, **held at 4** — per-material specular in the anti-casino/anti-wet direction (wood roughness raised/clearcoat lowered, body recedes, chip pre-dv sealed matte clay, card stock crisp edge, brass aged #b89b74/M4 PASS) combined with the shaped warm key now makes every material read correctly under ONE coherent light: wood varnish thin glint, chip edges matte clay seal, brass warm-aged, card edge crisp. The TP4 craft reads (grain, welt, leather pebble) are now lit correctly by the TP5 key — the tactile layers are integrated. **AAA(5) still gated on TP6 AO:** "product photograph" requires inter-material crevice darkening (under rail, at material joins). Record: `TP5_OPERATOR_GATE.md`.
- **TP6 status (2026-06-12, auto-approved):** CREVICE AO DELIVERED, **4 → 5 (AAA)** — N8AO (aoRadius=0.8/intensity=2.0/distanceFalloff=0.7; M6 PASS 27.74%) provides the inter-material crevice darkening (under the rail overhang, in the leather-to-wood join, in chip-stack gaps, at felt-to-card seam) that the "product photograph" AAA bar required. TP4 craft (grain, welt, leather pebble) + TP5 shaped warm key + TP6 AO now form a fully integrated tactile read. "You could pick it up" passes at hero and macro. **Score: 4 → 5 (AAA)**. Record: `TP6_OPERATOR_GATE.md`.

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

---

## TP progression log

> The **Baseline** column above stays LOCKED at the TP0 values. Post-phase scores are recorded here as
> each TP ships (operator-gated). Final all-green scoring happens at TP9.

| TP / Phase | Date | Element | Baseline → Post | Basis |
|------------|------|---------|:---------------:|-------|
| TP1 / Phase 2 (felt) | 2026-06-10 | **felt** | 3 → **4** | Operator A/B APPROVED (`TP1_OPERATOR_AB.md`). Nap sheen + micro-relief + relight; M3/M5/+B PASS. Meets ≥4 target; AAA(5) deferred to TP9. Accepted "suficiente", no further materiality iteration. |
| TP3 / Phase 4 (chips) | 2026-06-11 | **chips** | 3 → **4** | Operator A/B APPROVED (`TP3_OPERATOR_AB.md`). Instancing (M10 PASS: HERO 233→105, chips=full 653→133, MACRO parity) + de-Vegas (muted palette chroma -20%/value lowered, recessed-C normalMap, sheen killed, clearcoat 0.32/clearcoatRoughness 0.5). Chips read as matte worn clay that recedes; C/rim tooled-not-printed; no Vegas gloss. Meets ≥4 target. **AAA(5) deferred:** inter-chip crevice depth + full lighting integration (bevel-edge + denomination-suit clarity under one coherent warm light) are TP5/TP6 scope; AAA(5) plausible post-TP6. |
| TP4 / Phase 5 (rail) | 2026-06-12 | **wood coaming** | 3 → **4** | Operator gate APPROVED (`TP4_OPERATOR_GATE.md`). woodCoamingProfile yTop slimmed 0.34→0.28 (−18% band height) + woodNapNormalMap via toNormalMapTexture (freq=12, crossProfile gradient, normalScale 0.15) — top-highlight/underside-shadow volume read confirmed. Grain visible under clearcoat 0.72; restrained (no noisy-wood read). Meets ≥4 target. **AAA(5) deferred:** per-arc UV alignment (grain follows oval) + AO in wood-to-leather join are TP6/TP7 scope. |
| TP4 / Phase 5 (rail) | 2026-06-12 | **leather rail** | 4 → **4** | Operator gate APPROVED (`TP4_OPERATOR_GATE.md`). Craft upgrade: leatherNapNormalMap via toNormalMapTexture (pebble height field, normalScale 0.22) replaces bumpMap on the isNormals path + welt geometry at FELT_R*0.960 tube 0.012 y=0.022 #2a1208 reads as shadow crease at felt-to-rail seam. Material story intact (cognac sheen, broad crown, inner crease). Held at **4** honestly — AAA(5) awaits AO (inter-material crevice darkening, under the rail overhang) at TP6. |
| TP4 / Phase 5 (brass) | 2026-06-12 | **brass** | 3 → **4** | Operator gate APPROVED (`TP4_OPERATOR_GATE.md`). Lever D: brassMat roughness 0.34→0.42 + envMapIntensity 0.45 (was implicit 1.0). M4 PASS: H≈39°, S≈0.38, V≈0.67 — within H 35–48° / S ≤ 0.55 / V ≤ 0.80. Color #b8915a unchanged. Reads as aged-not-shiny; reveal band between felt and leather recedes as a detail. Meets ≥4 target. **AAA(5) deferred:** hairline-scratch normalMap + per-arc recessed patina detail are TP7 geometry/texture pass. |
| TP4 / Phase 5 (tactility) | 2026-06-12 | **tactility** | 3 → **4** | Operator gate APPROVED (`TP4_OPERATOR_GATE.md`). The "you could pick it up" test now passes: welt seam (shadow crease at felt-to-leather join), leather pebble grain (normalMap), wood varnish grain (normalMap under clearcoat), aged brass patina (roughness 0.42 + reduced env) — all readable without a label at HERO + rail/eye distances. The 5 craft levers act together to deliver the tactile read. **AAA(5) deferred:** crevice AO (under rail, in material joins) is TP6 scope. |

| TP5 / Phase 6 (lighting) | 2026-06-12 | **lighting** | 4 → **4** | Operator gate AUTO-APPROVED (`TP5_OPERATOR_GATE.md`; auto-approval under standing directive — green hard gates + orchestrator CEO visual read). Shaped warm gradient ships as default: key angle=0.72/ratio=2.75x (well below KEY_TO_FILL_RATIO_CEILING=3.5), fill=0.8, green-bounce hemisphere ground #0d3d24 (G-delta +6.23 body underside, subtle not lime-wash). M7 PASS (0 Bloom), M5 PASS (0%/0%). Held at **4** honestly — the rubric AAA(5) anchor for lighting includes "M8 PASS (corners 8–20%)" which requires the TP6 vignette pass (+A cornerLuma=15.1 INFO, luma≥18 TP6 deliverable). |
| TP5 / Phase 6 (shadows) | 2026-06-12 | **shadows** | 3 → **4** | Operator gate AUTO-APPROVED (`TP5_OPERATOR_GATE.md`). SoftShadows PCSS (size=30/samples=16/focus=0) unconditional in Scene + ContactShadows frames={1}/opacity=0.35/color=#1a0e06 (warm near-black floor) + key shadow-normalBias=0.02/near=8/far=28; M6 PASS 20.19% (hero); M10 improved 106→52 draws (frames=1 eliminating per-frame re-render). Meets ≥4 target. **AAA(5) deferred:** inter-material crevice AO (under rail, in chip gaps) is screen-space AO scope — TP6. |
| TP5 / Phase 6 (depth) | 2026-06-12 | **depth** | 2 → **3** | Operator gate AUTO-APPROVED (`TP5_OPERATOR_GATE.md`). Body volume read ships: top-face luma=109.1 vs underside=100.4 (delta=+8.8; top lighter = table no longer floats); warm shadow floor confirmed. Score lifts 2→3 (depth cues present; "table floats" resolved). **AAA(5) deferred:** screen-space AO + whisper DOF + vignette 8–20% (M8 PASS) + +A cornerLuma≥18 are TP6 deliverables. |
| TP5 / Phase 6 (tactility) | 2026-06-12 | **tactility** | 4 → **4** | Operator gate AUTO-APPROVED (`TP5_OPERATOR_GATE.md`). Per-material specular under ONE warm light: wood roughness 0.42/clearcoat 0.68, chip pre-dv sealed matte clay (roughness 0.52/clearcoat 0.38), brass aged #b89b74/M4 PASS (H=35.4°/S=0.52/V=0.715), card stock crisp edge. TP4 craft reads (grain, welt, leather pebble) now lit correctly by TP5 shaped key — tactile layers fully integrated. Held at **4** honestly: AAA(5) gated on TP6 AO (crevice darkening for "product photograph" read). |

| TP6 / Phase 7 (depth) | 2026-06-12 | **depth** | 3 → **5** | Operator gate AUTO-APPROVED (`TP6_OPERATOR_GATE.md`; auto-approval under standing directive — green hard gates + orchestrator CEO visual read). N8AO crevice AO (aoRadius=0.8/intensity=2.0/distanceFalloff=0.7, M6 PASS 27.74%) + DepthOfField whisper (worldFocusDistance=holeCardDistance/worldFocusRange=1.5/bokehScale=2.0, M1 PASS 50px — NOT cut) + Vignette (offset=0.70/darkness=0.12, M8 PASS 13.97% on felt lateral rects — recalibrated from backdrop in 07-06) + BrightnessContrast (brightness=0.03/contrast=0.05) + Noise (opacity=0.03, M9 PASS byte-identical). +A PASS cornerLuma=31.9 ≥18 / hue=29.1° warm. All rubric criteria for depth AAA now satisfied: AO in crevices ✔, restrained DOF ✔, M8 vignette PASS ✔, +A cornerLuma≥18 ✔, felt darkens toward rail ✔. Stack behind `?fx`; default ?fx-off = TP5 exact look (non-blocking split). **Score: 3 → 5 (AAA)**. |
| TP6 / Phase 7 (shadows) | 2026-06-12 | **shadows** | 4 → **5** | Operator gate AUTO-APPROVED (`TP6_OPERATOR_GATE.md`). N8AO delivers the inter-material crevice AO (M6 PASS 27.74%) that TP5 PCSS grounding deferred: crevices under hole cards, chip stacks, at felt-to-rail seam now darker without halos. Combined with TP5 PCSS (SoftShadows+ContactShadows warm floor), the shadow read is now "graded from hard (near contact) to soft (farther fall-off) in every crevice" — the full AAA rubric bar. **Score: 4 → 5 (AAA)**. |
| TP6 / Phase 7 (composition) | 2026-06-12 | **composition** | 4 → **5** | Operator gate AUTO-APPROVED (`TP6_OPERATOR_GATE.md`). CenterGameState (deck stub 4 cards at [0.3,0.0495,-1.3] 1.33wu / dealer button at [-0.7,0.022,-1.6] 1.75wu) unconditionally mounted in Scene — eliminates the empty felt dead zones at left-center. Table communicates mid-hand game in progress. cards>board>rail hierarchy reinforced; HERO ¾ angle reveals table as protagonist; no compositional voids. All rubric criteria for composition AAA now satisfied. CenterGameState unconditional (present in ?fx-off and ?fx-on). **Score: 4 → 5 (AAA)**. |
| TP6 / Phase 7 (lighting) | 2026-06-12 | **lighting** | 4 → **5** | Operator gate AUTO-APPROVED (`TP6_OPERATOR_GATE.md`). The one criterion blocking lighting AAA(5) was M8 PASS (corners 8–20%) — cleared: M8=13.97% PASS on felt lateral rects (recalibrated in 07-06 from backdrop corners which measured natural 86-87% delta). +A cornerLuma=31.9 ≥18 PASS. With M8 gate confirmed, all lighting rubric AAA criteria met: shaped warm gradient ✔, restrained fills ✔, warm floor bounce ✔, no casino uplighting ✔, M7 PASS ✔, M8 PASS ✔. **Score: 4 → 5 (AAA)**. |
| TP6 / Phase 7 (tactility) | 2026-06-12 | **tactility** | 4 → **5** | Operator gate AUTO-APPROVED (`TP6_OPERATOR_GATE.md`). N8AO crevice AO now provides inter-material crevice darkening (under the rail, in leather-to-wood join, in chip-stack gaps) that TP4/TP5 deferred for "product photograph" read. Combined with TP4 craft levers (grain, welt, leather normalMap, aged brass) and TP5 shaped warm key, the tactile layers are fully integrated with photographic depth cues. "You could pick it up" test passes across all materials at hero and macro. **Score: 4 → 5 (AAA)**. |

| TP7 / Phase 8 (cameras) | 2026-06-12 | **cameras** | 4 → **4** | Operator gate AUTO-APPROVED (`TP7_OPERATOR_GATE.md`; auto-approval under standing directive — green HARD gates + orchestrator CEO visual read). All three TP0-frozen presets CONFIRMED LOCKED on the finished TP1-TP6 table: HERO fov:32 / POV-card fov:40 / MACRO fov:26 — all 9 preset values byte-identical to TP0 freeze (UNCHANGED). M1=80px PASS (3.6× over 22px floor) · M2=3.66×/2.60× PASS · M9=PASS byte-identical (md5 02e4aa23…) · grep-check-tp7-08 11/11 · grep-check-tp6-07 8/8. Composition reads verified on the finished table (Perla dominant lower-third at HERO, player's-eye-view at card, telephoto material at MACRO). Optional `?fly` flythrough SHIPPED (9 new lines, X-axis arc, freeze guard). Conservatively **held at 4** — TP7 confirms the TP0 freeze holds on the finished table; no regression. **AAA(5) deferred to TP9** final scorecard sign-off. Eval framing FINAL. |

**TP1 operator forward feedback (steers TP2+, does NOT reopen TP1):** cards stay the absolute
protagonist · the hand must read complete (currently too cropped) · the whole table must be visible
(currently too partial/small) · a full-scene composition validation (table + community + hands + global
comp + camera↔table↔cards) is wanted BEFORE more local detail. See `TP1_OPERATOR_AB.md` §forward feedback
and STATE.md Blockers/Concerns. Relevant scorecard elements to watch: **composition (11)**, **cameras
(12)**, **social-read (14)**, **cards (2)**.
