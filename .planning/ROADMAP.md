# Roadmap: Chiribito Table 3D — PERFECTION Program (AAA)

## Overview

Take the Chiribito 3D table OBJECT from "beautiful material-forward object whose protagonist just
landed (M1)" to AAA, element by element, identity-gated at every step: lock the eval instrument →
fix the stage (felt) → polish the protagonist (cards) → de-risk the accent (chips + perf) →
adjudicate the edge (rail/contour) → unify everything under one warm light → add photographic depth
→ lock the cameras → add the feel → run the verdict and promote a NEW protected reference. Every
phase carries an operator perceptual gate (stop-on-ambiguous) and a manual-deploy invariant.

> **Single source of truth: `docs/ROADMAP_TABLE_3D_PERFECTION.md`.** Each phase below maps to a TP
> section there (Phase N = TP(N−1)). The doc holds the full Objective · Dependencies · Subphases ·
> Acceptance + metric thresholds · Perceptual gate · Risks · Checkpoints · Rollback disposition ·
> Success. This roadmap is the GSD orchestration index over it. **Cross-cutting guardrails (SSOT §5)
> apply to EVERY phase**: anti-casino hard-NO, no push/deploy/merge without operator, perf guardrail,
> per-phase rollback tag, eval rig frozen at TP0, stop-on-ambiguous, lab stays out of prod build.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work. Here Phase N = **TP(N−1)** (Phase 1 = TP0 … Phase 10 = TP9).
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED).

- [x] **Phase 1: TP0 — Eval Rig & Baseline (BLOCKING)** - Lock the frozen rig + baseline + M1 precondition gate before any visual work. ✅ COMPLETE 2026-06-10.
- [x] **Phase 2: TP1 — Felt / Tapete Materiality (the stage)** - Turn the largest, weakest surface into believable woven baize that relights. ✅ COMPLETE 2026-06-10 (operator APPROVED; felt shipped as reference baseline).
- [x] **Phase 3: TP2 — Cartas Materiality & Legibility (protagonist)** - Push the cards from "good decal" to real card STOCK without softening legibility. (completed 2026-06-11)
- [x] **Phase 4: TP3 — Fichas Materiality + Perf (accent + instancing)** - Re-author chips as matte worn clay that recedes, and instance them (perf de-risk). ✅ COMPLETE 2026-06-11 (operator APPROVED; chips 3→4; instancing + de-Vegas SHIP).
- [x] **Phase 5: TP4 — Rail & Contour Elegance (the OPEN check)** - Adjudicate the slim-edge question (review, not auto-revert) + craft details. ✅ COMPLETE 2026-06-12 (operator APPROVED; slim+craft shipped as default; wood coaming + brass + tactility 3→4).
- [ ] **Phase 6: TP5 — Iluminación & Sombras (unify under one warm light)** - One coherent shaped warm light, per-material specular, PCSS + baked contact grounding.
- [ ] **Phase 7: TP6 — Profundidad & Composición (depth ON the table)** - Install restrained postprocessing (AO + whisper DOF + vignette/grain); kill dead zones via center table-state.
- [ ] **Phase 8: TP7 — Cámaras (lock the canonical money shots)** - Confirm the TP0-frozen HERO/POV/MACRO on the upgraded table; optional cinematic flythrough.
- [ ] **Phase 9: TP8 — Tactilidad, Micro-vida & Lectura Social (the FEEL)** - Sub-conscious micro-life + shared mid-play read via center table-state only.
- [ ] **Phase 10: TP9 — Unificación & AAA Lock (verdict → new reference)** - Full A/B, scorecard all-green, perf within guardrail, promote NEW protected reference.

## Phase Details

### Phase 1: TP0 — Eval Rig & Baseline (BLOCKING)

**Goal**: Lock the frozen eval rig (3 money shots, frozen scene, 15-element scorecard, 12-metric kit) and a complete baseline of the CURRENT state so every later gate is apples-to-apples and the protected reference is provably never degraded. Includes TP0.0 (operator confirms M1 cards-as-protagonist on-device), TP0a (cheap must-have rig, zero visual change), TP0b (tiered metric tooling, each validated against positive+negative control frames). Full spec: `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP0 + §4.
**Depends on**: Nothing (first phase)
**Success Criteria** (what must be TRUE):

  1. The 3 presets (HERO 32 / POV 37 / MACRO 26), Perla staged hand and demoted pot are frozen and recorded verbatim; baseline captured at HEAD AND at the protected tag; anchor corpus persisted to a tracked location (`docs/table-3d/anchors/`).
  2. Draw-call + frame-time baseline recorded (`renderer.info` + `?stats`, vsync OFF); the 15-element scorecard authored with baseline scores.
  3. Every admitted metric (SSOT §4.5) passes its positive AND negative control frame before being allowed to gate; un-validated metrics are informational only.
  4. **[OPERATOR GATE — manual/on-device]** TP0.0: operator confirms the M1 cards-as-protagonist read on-device; AND operator blesses the 3 money shots as the canonical views (incl. POV fov 37 vs 40 — one refinement allowed, then locked). BLOCKING: never proceed on a broken instrument or a failed M1 read.

**Plans**: 6 plans (5 waves)

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Wave-0 foundation: install frontend deps, restore the Playwright harness, smoke-verify the 3 shots, cut the tp0-before-rig rollback tag, re-assert prod-build isolation

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Dependency-free ?stats StatsProbe (renders null, zero visual change) + freeze the 3 presets verbatim + author the 15-element scorecard

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — TP0b T1 pure-pixel metrics (M3/M4/M5/M6/M8/+A/+B + M10) with exact §4.5 thresholds + positive/negative control-frame meta-gate
- [x] 01-04-PLAN.md — TP0b integrity metrics: M9 determinism + M7 bloom-absence code-assert + M12 regional-MSE zero-visual-change proof + M1/M2 operator seam

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-05-PLAN.md — OPERATOR GATE (autonomous:false): TP0.0 M1 precondition + money-shot blessing (POV fov 37-vs-40) + M1-legibility + M11 on-device read

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 01-06-PLAN.md — IRREVERSIBLE baseline freeze: capture HEAD + protected-tag corpus (throwaway worktree), downscale + persist to docs/table-3d/anchors/, scorecard baseline, region rects

### Phase 2: TP1 — Felt / Tapete Materiality (the stage)

**Goal**: Turn the largest, weakest surface into believable woven baize — directional nap sheen, micro-relief normal, restrained anisotropy — with the identity mark kept born-in the cloth, green in-palette, and depth moved out of baked albedo into material/light so it relights. Full spec: §TP1.
**Depends on**: Phase 1
**Success Criteria** (what must be TRUE):

  1. Felt → MeshPhysicalMaterial with a Charlie sheen lobe (sheen 0.6–0.85, lighter-green sheenColor, sheenRoughness 0.55–0.8) + tiled tangent-space nap normalMap (built via the shared height→normal helper) + low anisotropy 0.15–0.4; metric +B passes ("fuzz" not "satin"); roughness kept 0.90–0.94.
  2. Radial vignette removed from albedo but a light-RESPONSIVE micro edge-darkening kept so felt never regresses below reference between TP1 and TP5/TP6; M3 felt-hue PASS; M5 highlight-clip on felt PASS; MACRO inlay sharpness ≥ baseline; mark stays born-in (no floating decal / z-fight).
  3. **[OPERATOR GATE — manual A/B]** Operator A/B at POV + MACRO: reads as real woven baize without satin/casino-green (materiality ONLY; grounding/depth deferred to TP5/TP6). Stop-on-ambiguous → iterate ≤2 then roll back (non-blocking: keep current felt, proceed).

**Plans**: 4 plans (4 waves)

Plans:

**Wave 1**

- [x] 02-01-PLAN.md — Foundation: cut tp1-before-felt rollback tag (pre-edit HEAD) + resolve A1 (aoMap uv/uv2 from three source) + author the shared height→normal Sobel helper (FIRST USE) + its Vitest unit test

**Wave 2** *(blocked on Wave 1)*

- [x] 02-02-PLAN.md — textures.ts: feltTexture S→2048 (D-04) + remove baked vignette (D-03, M3 gradient untouched); new feltNapNormalMap (D-01 concentric/oval, LINEAR, repeat 8) + feltEdgeAoMap (D-03 subtle, LINEAR)

**Wave 3** *(blocked on Wave 2)*

- [x] 02-03-PLAN.md — TableLab felt → MeshPhysicalMaterial (D-02 sheen ~0.70/sheenColor lighter-green/sheenRoughness 0.65/anisotropy 0.25, roughness 0.93) + aoMap uv wiring per A1; capture HERO/MACRO/POV + M3/M5/+B gates PASS

**Wave 4** *(blocked on Wave 3)*

- [x] 02-04-PLAN.md — OPERATOR GATE (autonomous:false): materiality-only A/B at POV+MACRO vs anchors/head + never below anchors/reference-tag (D-05); stop-on-ambiguous → ≤2 iterations then non-blocking rollback. ✅ APPROVED 2026-06-10 (0 iterations, ship) → docs/table-3d/TP1_OPERATOR_AB.md. Operator added forward composition feedback for TP2+ (see that doc + STATE.md).

### Phase 3: TP2 — Cartas Materiality & Legibility (protagonist)

**Goal**: Push the protagonist from "good decal" to real card STOCK — faint face micro-relief + coated sheen, max-anisotropy crispness, a cheap paper-edge read, tighter contact, restrained dealt variance — without ever softening hole-card legibility. Full spec: §TP2.
**Depends on**: Phase 1, Phase 2
**Success Criteria** (what must be TRUE):

  1. Face anisotropy raised to max (cap 16) + mipmaps confirmed; faint card-stock micro-relief normal + a whisper of clearcoat (0.12–0.18, clearcoatRoughness 0.5–0.6) — NOT glossy; paper-edge via a CHEAP fake (no transmission material); face-to-bevel seam fixed (no cream rim / z-fight at MACRO; CARD_CORNER 0.17 unchanged).
  2. Restrained dealt variance (per-card micro-tilt/yaw ≤ ~1.5–2°, frozen deterministically — M9); near-edge contact-shadow tightened (M6); M1 legibility MUST NOT regress; M2 cards-vs-chips ≥ 2× maintained.
  3. **[OPERATOR GATE — manual A/B]** Operator A/B at POV + MACRO: physical printed STOCK while razor-legible. Stop-on-ambiguous: any legibility loss OR more plastic/laminated → STOP and revert that lever (non-blocking, flag).

**Plans**: 6 plans (6 waves — strictly sequential; one perceptual variable per gate, each lever's A/B depends on the prior state captured)

Plans:

**Wave 1**

- [x] 03-01-PLAN.md — Wave-0 foundation: cut the tp2-before-cards rollback tag + capture the tp2-base post-encuadre baseline (3 frozen shots) + re-measure the M1 legibility floor + verify/recalibrate the M6 region rects

**Wave 2** *(blocked on Wave 1)*

- [x] 03-02-PLAN.md — Levers 1+2 (legibility-first): face anisotropy to getMaxAnisotropy() cap 16 via useThree + mipmaps confirmed; face-to-bevel seam fix (CARD_CORNER 0.17 / curveSegments 14 unchanged)

**Wave 3** *(blocked on Wave 2)*

- [x] 03-03-PLAN.md — Levers 3+4: faint card-stock micro-relief normal (shared Sobel helper, normalScale 0.12, NoColorSpace) + clearcoat whisper (0.12 / clearcoatRoughness 0.55)

**Wave 4** *(blocked on Wave 3)*

- [x] 03-04-PLAN.md — Levers 5+6: warm sheen-rim paper-edge (sheen-only, no transmission) + deterministic dealt variance (<= 1.5 deg, seeded, M9 byte-identity, unit-tested)

**Wave 5** *(blocked on Wave 4)*

- [x] 03-05-PLAN.md — Lever 7 (near-edge contact-shadow tighten, M6) + the consolidated pre-gate ledger (M1/M2/M5/M6/M9/M12 at the 3 frozen shots + per-lever ?card= flag map)

**Wave 6** *(blocked on Wave 5)*

- [x] 03-06-PLAN.md — OPERATOR GATE (autonomous:false): A/B at POV + MACRO "physical printed STOCK while razor-legible?"; stop-on-ambiguous to revert the named lever (non-blocking, flag); HARD gates M1/M2 restated; CARD_W/encuadre escalation recorded if legibility falls short

### Phase 4: TP3 — Fichas Materiality + Perf (accent + instancing)

**Goal**: Re-author chips as matte worn clay that recedes as a quiet accent, lock the chip↔card hierarchy, AND fix the program's #1 perf liability by instancing — protecting identity and the later mobile gate together. Full spec: §TP3.
**Depends on**: Phase 1, Phase 2
**Success Criteria** (what must be TRUE):

  1. De-Vegas material (matte clay seal 0.32–0.42, gloss killed, micro-grain, C/rim tooled as a RECESSED mark via the shared bump→normal helper, face logo desaturated+shrunk); accent recedes (chroma muted ~15–20%, value lowered) so M2 ≥ 2× holds and chips are no longer the second-brightest/most-saturated object after cards.
  2. PERF: stacks converted to InstancedMesh/drei Instances per denomination, bottom face dropped, chip textures right-sized; demoted-pot chip draws ~42 → ≤ ~10; `?chips=full` back within < 220; M10 PASS; MACRO chip quality ≥ baseline.
  3. **[OPERATOR GATE — manual A/B]** Operator A/B at HERO + MACRO: worn artisanal clay that RECEDES, C tooled-not-printed, no Vegas gloss. Stop-on-ambiguous: chips pull the eye / read plastic → STOP. Rollback SPLIT: de-Vegas non-blocking (keep current); instancing must-ship-or-revert (net-positive perf or don't ship).

**Plans**: 4 plans (4 waves — strictly sequential; the two workstreams have different rollback dispositions and share files, and the operator locked instancing-FIRST, so each wave depends on the prior)

Plans:

**Wave 1**

- [x] 04-01-PLAN.md — Wave-0 foundation: cut the tp3-before-chips rollback tag + capture the tp3-base post-TP2 baseline (3 frozen shots) + record the M10 draw-call baseline (HERO + ?chips=full) as the must-ship-or-revert target basis

**Wave 2** *(blocked on Wave 1)*

- [x] 04-02-PLAN.md — INSTANCING (must-ship-or-revert): ChipStack → drei <Instances> per denomination (one body + one TOP-face) + drop the bottom face + chip textures 2048→512 + break the 10-group cream phase-alignment (0.37 seed, unit-tested seed parity); gate M10 net-positive (<150 HERO / <220 chips=full / demoted ≤~10) + strict MACRO parity vs tp3-base; behind ?chips=

**Wave 3** *(blocked on Wave 2)*

- [x] 04-03-PLAN.md — DE-VEGAS (non-blocking): matte clay material (clearcoat 0.32 / clearcoatRoughness 0.5 / sheen 0 killed; face bumpMap→normalMap via the shared helper, recessed C) + chroma muted ~20% + value lowered + logo desat+shrunk + micro-grain; gate M2 ≥ 2× + chips recede + MACRO quality ≥ baseline; STOP-on-ambiguous → revert (non-blocking); behind ?chips=

**Wave 4** *(blocked on Wave 3)*

- [x] 04-04-PLAN.md — OPERATOR GATE (autonomous:false): A/B at HERO + MACRO "worn artisanal clay that RECEDES, C tooled-not-printed, no Vegas gloss?"; HARD gates M10 PASS + M2 ≥ 2× restated; confirm the SPLIT disposition (instancing must-ship; de-Vegas non-blocking) ✅ APPROVED 2026-06-11 (0 reverts, 0 iterations) → docs/table-3d/TP3_OPERATOR_AB.md

### Phase 5: TP4 — Rail & Contour Elegance (the OPEN check)

**Goal**: Adjudicate the recorded elegance question (two-part rail + apron gained mass, possibly lost the slim refined edge) and add the flagged craft details — as a REVIEW, not an auto-revert. The body already exists; "table floats" is a LIGHTING problem fixed in TP5, NOT missing geometry. TP4 may only REFINE existing profiles, never ADD furniture mass. Full spec: §TP4.
**Depends on**: Phase 1, Phase 2
**Success Criteria** (what must be TRUE):

  1. VERDICT FIRST: a structured side-by-side of the frozen shots, current contour vs the recorded slim-rail set, recorded as "edge elegance lost / acceptable / lost-in-specific-respect". If "lost": surgically slim leather/wood/outer profiles toward edge thinness without deleting the material story or the mass (reversible).
  2. Craft details land where they pass independently: welt/cord at the felt-to-rail seam; wood/leather/brass normalMaps (shared helper) + per-arc-length UV (no oval-end grain stretch); brass → aged-brass within the single locked M4 HSV target (M4 PASS); rail outer wall reads as a curved volume; no perf regression.
  3. **[OPERATOR GATE — manual verdict]** Operator verdict at HERO + a rail/eye view: "recovered edge elegance WITHOUT losing material/mass?" Stop-on-ambiguous → DEFAULT STOP and KEEP the current validated contour (non-blocking; ship only independent craft upgrades that passed).

**Plans**: 4 plans (05-01 verdict/baseline, 05-02 surgical slim, 05-03 craft levers, 05-04 operator gate)

Plans:

- [x] 05-01: TP4 Baseline Capture + Elegance Verdict (COMPLETE 2026-06-12 — verdict=lost-in-specific-respect; tp4-before-rail tag; hero+rail anchors; TP4_VERDICT.md)
- [x] 05-02: Surgical Slim (woodCoamingProfile yTop 0.34→0.28, behind ?rail=slim)
- [x] 05-03: Craft Levers (welt, wood/leather normalMaps, brass aged-brass tune, UV remap, outer wall volume)
- [x] 05-04: Operator Gate APPROVED 2026-06-12 — slim+craft shipped as default; ?rail=base added; scorecard wood 3→4, brass 3→4, tactility 3→4

### Phase 6: TP5 — Iluminación & Sombras (unify under one warm light)

**Goal**: Shape the warm key into a gentle warm gradient that keeps the WHOLE table read (NOT a casino cone), add per-material specular + felt green-bounce, and upgrade grounding with PCSS soft shadows + baked ContactShadows — so every TP1–TP4 material reads under ONE coherent warm light with honest contact and zero casino harshness. TP5 owns ONLY light+shadow grounding deliverable with no postprocessing; ALL screen-space/crevice AO moves to TP6. Full spec: §TP5.
**Depends on**: Phase 1, Phase 2, Phase 3, Phase 4, Phase 5
**Success Criteria** (what must be TRUE):

  1. Key reframed as a warm gradient toward the rail with generous fill preserved (a key-to-fill ratio ceiling so it can never collapse to a cone); warm/cool dimensionality via a low cool fill + light rim; PER-MATERIAL specular tuning (NOT a global IBL/exposure bump) so chips/brass/rim/card-edges throw crisp small highlights without tipping wood→wet or brass→gold (re-run M4 at the END of TP5); felt green-bounce on undersides; apron/rail outer wall lit as a volume (resolves "table floats").
  2. Grounding: drei SoftShadows (PCSS, size 25–35, samples ~16) contact-hard near / soft far; key shadow-mapSize 2048 tuned (no acne/peter-pan); ContactShadows frames={1} (baked once → M11 improves); crushed blacks lifted into WARM graded shadow (metric +A). Anti-casino: no single hard white cone; NO bloom (M7); M5 highlight-clip PASS; M6 contact-shadow presence PASS under every object; no new shadow-casting light.
  3. **[OPERATOR GATE — manual A/B]** Operator A/B at all 3 shots: every material under ONE warm motivated light, honest grounding, restrained highlights, no casino harshness/cold void. Stop-on-ambiguous: pool reads as a spotlight OR specular tips glossy → STOP (non-blocking, flag: ship grounding, keep prior key if pool-shaping fails).

**Plans**: 6 plans (6 waves)

Plans:

- [ ] 06-01-PLAN.md — GROUNDING: SoftShadows PCSS + ContactShadows frames={1} warm + key shadow frustum (must-ship, always-on)
- [ ] 06-02-PLAN.md — KEY RESHAPING: ?light= flag + warm gradient angle 0.72 + KEY_TO_FILL_RATIO_CEILING + green-bounce hemisphere
- [ ] 06-03-PLAN.md — PER-MATERIAL SPECULAR: wood/body/card/chip deltas; brass UNCHANGED (TP4-locked); M4 re-run at END
- [ ] 06-04-PLAN.md — GREEN-BOUNCE + BODY VOLUME verification: ?cam=rail captures + M6/M7 at rail
- [ ] 06-05-PLAN.md — METRIC SUITE + grep-check-tp5-06.cjs: 6 structural checks + full M4/M5/M6/+A/M7/M10 pre-gate confirmation
- [ ] 06-06-PLAN.md — OPERATOR GATE (autonomous:false): A/B at all 3 shots; TP5_OPERATOR_GATE.md + scorecard update

### Phase 7: TP6 — Profundidad & Composición (depth ON the table)

**Goal**: Install the in-scope restrained postprocessing stack (first time it exists) for photographic depth ON/around the table — N8AO + a whisper of DOF on the hole cards + table-edge vignette/fog + a faint filmic grade — and resolve composition (kill empty-felt zones via CENTER table-STATE, lock cards>board>rail). NO environment is built. TP6 owns ALL screen-space/crevice AO. Full spec: §TP6.
**Depends on**: Phase 1, Phase 2, Phase 3, Phase 6
**Success Criteria** (what must be TRUE):

  1. Install `@react-three/postprocessing` + `postprocessing`; EffectComposer (enableNormalPass, MSAA 4) behind a `?fx` flag (A/Bs + freezes for capture). N8AO honest crevice darkening under cards/chips/rail; DepthOfField focused on the hole cards — hole cards stay razor-sharp (M1 HARD gate); restrained Vignette (M8 band 8–20%) + tuned fog; faint filmic grade + grain (metric +A).
  2. Composition: empty-felt zones killed with CENTER-OF-TABLE table-STATE only (face-down deck stub + dealer button, at most a center discard); NO opponent hand / per-seat object (negative check). cards>board>rail reinforced via focus/exposure. HARD anti-casino: NO Bloom mounted (M7); no glow halos; DOF never softens the hero. M11 within floor.
  3. **[OPERATOR GATE — manual A/B]** Operator A/B (`?fx` off vs on) at all 3 shots: cinematic-premium honest depth, hero tack-sharp, no dead zones, no glow/gimmick. Stop-on-ambiguous: DOF gimmicky OR hero softens OR "effect-y" → STOP and reduce each effect (non-blocking, flag: cut the weakest, keep table without `?fx`).

**Plans**: TBD

Plans:

- [ ] TBD during planning

### Phase 8: TP7 — Cámaras (lock the canonical money shots)

**Goal**: CONFIRM the TP0-frozen HERO/POV/MACRO presets against the upgraded table (cameras were decided at TP0 — no mid-program re-baseline), and optionally add a non-canonical restrained cinematic flythrough that freezes to the canonical still under the capture flag. Full spec: §TP7.
**Depends on**: Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, Phase 7
**Success Criteria** (what must be TRUE):

  1. The 3 presets re-evaluated on the finished materials/light/depth and reconfirmed LOCKED (longer-lens, distortion-free, ~50–85 mm-equiv; never fisheye; top-down only as a layout diagnostic). Protagonist hole cards compose as a dominant lower-third mass; `autoRotate` OFF for capture (M9); M1/M2 still PASS at the final HERO/POV.
  2. **[OPERATOR GATE — manual on-device]** Operator confirms the canonical hero on-device: "is THIS the money shot of the finished table?" Stop-on-ambiguous: if no preset clearly wins, keep the TP0 set; do not invent new framing late.

**Plans**: TBD

Plans:

- [ ] TBD during planning

### Phase 9: TP8 — Tactilidad, Micro-vida & Lectura Social (the FEEL)

**Goal**: Add restrained micro-life that sells weight without ever being consciously noticed (card settle, chip-land settle, a breathing stillness) and complete the SHARED mid-play social read via table-STATE only (center game-state + staged mid-hand + demoted live-stakes pot), castizo + premium-artisanal feel integrated — gated behind prefers-reduced-motion AND frozen under the capture flag. Full spec: §TP8.
**Depends on**: Phase 1, Phase 2, Phase 3, Phase 4, Phase 6, Phase 7
**Success Criteria** (what must be TRUE):

  1. Sub-threshold micro-motion on hero objects only (amplitude < ~0.01 world units / < ~0.5°, settle 0.2–0.4 s, idle period 6–12 s) via useFrame + easing; ALL micro-motion freezes under matchMedia(prefers-reduced-motion) AND the capture flag → M9 determinism HARD; amplitude bound enforced by operator-live-view + a static CODE assertion that easing constants ≤ the documented thresholds.
  2. Social read via CENTER table-STATE only (deck stub / button / center discard); NO modeled humans (`?seats` opt-in/never default); M2 ≥ 2× holds; castizo/artisanal lives in the OBJECT under warm light (no room, no decor); no flip/spin/glow FX, no bouncy easing.
  3. **[OPERATOR GATE — LIVE view, not a still]** Does it feel ALIVE and weighty + read as a shared mid-play game, with NO motion consciously noticeable? Stop-on-ambiguous: any visible wobble → HALVE it; if still seen → remove it (restrained stillness beats visible motion; non-blocking: keep the static-but-complete table).

**Plans**: TBD

Plans:

- [ ] TBD during planning

### Phase 10: TP9 — Unificación & AAA Lock (verdict → new reference)

**Goal**: Run the full multi-camera A/B, drive the scorecard all-green, finalize grade/tone-map consistency, confirm perf within guardrail, verify "mesa terminada", take the operator's final gate, and promote the result to the NEW protected table reference (old tag retained). Full spec: §TP9 + §8.
**Depends on**: Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, Phase 7, Phase 8, Phase 9
**Success Criteria** (what must be TRUE):

  1. Full A/B matrix at the 3 locked shots: NEW vs TP0-baseline AND vs the correct comparison basis (vs the M1 captures for card/composition/protagonist; vs the protected tag for felt/rail/chips/lighting). Scorecard every element ≥ 4/5; ALL §4.5 metrics PASS simultaneously at the locked shots (single consolidated run); ACES vs AgX decision finalized + recorded; perf within guardrail (M10 + M11); "mesa terminada" (§8) checked item-by-item.
  2. **[OPERATOR GATE — final on-device verdict]** Operator final verdict across all 3 shots + a live view: "AAA, premium, castizo, hand-fabricated table, and clearly better than the reference?" Stop-on-ambiguous: ANYTHING ambiguous → do NOT promote; return to the specific failing phase.
  3. On an unambiguous operator yes: create a NEW git tag as the new protected reference; update the SSOT doc; retain the old tag forever. (Cannot promote on any below-green element / failed metric / ambiguous verdict.)

**Plans**: TBD

Plans:

- [ ] TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order, honoring the SSOT §7 dependency graph: 1 (TP0, BLOCKING) → 2 (TP1) → 3 (TP2) → 4 (TP3) → 5 (TP4) → 6 (TP5) → 7 (TP6) → 8 (TP7) → 9 (TP8) → 10 (TP9). Phases 3/4/5 each depend only on 1+2 and may run in any order; recommended 3 → 4 → 5.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. TP0 — Eval Rig & Baseline (BLOCKING) | 6/6 | ✅ Complete | 2026-06-10 |
| 2. TP1 — Felt Materiality | 4/4 | ✅ Complete | 2026-06-10 |
| 3. TP2 — Cartas Materiality & Legibility | 6/6 | Complete   | 2026-06-11 |
| 4. TP3 — Fichas Materiality + Perf | 4/4 | ✅ Complete | 2026-06-11 |
| 5. TP4 — Rail & Contour Elegance | 4/4 | ✅ Complete | 2026-06-12 |
| 6. TP5 — Iluminación & Sombras | 0/6 | In planning | - |
| 7. TP6 — Profundidad & Composición | 0/TBD | Not started | - |
| 8. TP7 — Cámaras | 0/TBD | Not started | - |
| 9. TP8 — Tactilidad & Lectura Social | 0/TBD | Not started | - |
| 10. TP9 — AAA Lock & New Reference | 0/TBD | Not started | - |
