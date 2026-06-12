# ROADMAP — Table 3D · PERFECTION PROGRAM (the table OBJECT → AAA)

> **Status: PLAN (authored 2026-06-09). Source of truth for ALL 3D table-OBJECT work.** No code
> changed by this document. Branch `spike/table-3d-hero`. Built from a multi-agent audit
> (code+geometry · assets+docs · AAA rendering research · pixel-level capture critique) → an
> architected program → an adversarial red-team; every red-team fix is folded in here so a future
> session can execute it autonomously with no re-litigation.
>
> **Governing principle (unchanged): IDENTITY BEFORE TECHNOLOGY.** The card is the absolute
> protagonist; the object is castizo, warm, tactile, premium-DISCREET; reward = rareza + carta +
> alma, NEVER money. No casino / Vegas / neon / crypto / gold / glow.

---

## 0. Relationship to the existing roadmaps (read this first)

- **`ROADMAP_TABLE_3D_PRODUCTION.md`** (the M0–M8 program) stays valid for its **non-table** milestones:
  M2 (castizo room), M4 (occupant/social presence as environment), M6 (mobile perf numeric gate),
  M7 (game integration), M8 (candidacy A/B vs the live 2D table). Those resume **after** this program.
- **THIS document supersedes PRODUCTION for everything about the table OBJECT.** It absorbs and deepens
  PRODUCTION's M1 (cards, already shipped-local), M3-feel (table-only slice) and M5 (rail/contour
  elegance), and adds the full material / lighting / shadow / depth / composition / camera / feel work.
- **In scope here (the table OBJECT only):** mesa (geometry, contour, rail, body), tapete (felt),
  cartas, fichas, materialidad, iluminación, sombras, profundidad, composición, cámaras, presencia
  física, sensación táctil, **sensación social via table-STATE only**, sensación castiza (of the
  object), premium artesanal.
- **OUT of scope here (later programs):** sala castiza / room / interior · entorno / backgrounds /
  backdrop **enhancement** (the current minimal floor-pool + backdrop sphere are **FROZEN baseline
  context** — neither enhanced nor removed) · decoración / props / lamps-as-objects · FX avanzados
  (particles / volumetrics / god-rays / **bloom**) · audio · game/Colyseus integration · **mobile
  perf as a deliverable** (here it is only a GUARDRAIL) · **full human-figure / occupant / per-seat
  modeling** (`?seats` stays opt-in / experimental / never default) · engine / gameplay / card-geometry
  changes (FROZEN).

---

## 1. Estado actual (verified 2026-06-09; updated 2026-06-12 — AAA-COMPLETE)

> **Table-3D PERFECTION program AAA-COMPLETE 2026-06-12 (auto-rendered under operator's standing
> directive, pending operator on-device confirmation). New protected reference tag:
> `table-3d-aaa-reference-2026-06-12` (LOCAL — push requires separate explicit operator
> confirmation). Old reference retained permanently: `table-3d-premium-reference-2026-06-04`.**
> Final scorecard: 67/75 (baseline 51/75). All 10 phases TP0-TP9 complete.
> Record: `docs/table-3d/TP9_OPERATOR_GATE.md`.

- **Branch** `spike/table-3d-hero` @ `e6b0726` (baseline; TP9 HEAD is ~44 commits ahead).
  **Protected reference tags:**
  - `table-3d-premium-reference-2026-06-04` (TP0 baseline — PERMANENT, never deleted)
  - `table-3d-aaa-reference-2026-06-12` (TP9 AAA lock — LOCAL, created 2026-06-12; push pending
    separate operator confirmation)
  + checkpoint tag `table-3d-lab-checkpoint-2026-06-04` present. Nothing pushed / merged / deployed.
- **Isolation verified:** the lab is one React tree served only at `/table-lab.html`; it imports
  nothing from the game and is **NOT** in the prod `vite build` (no `table-lab` input in
  `vite.config.ts`). `play.chiribito.com` / `chiribito.com` are unaffected.
- **Stack:** `three ^0.169` · `@react-three/fiber ^8.17` · `@react-three/drei ^9.114` · `gsap ^3.12.5`.
  **`postprocessing` + `@react-three/postprocessing` are NOT installed; `maath` absent.** Tooling
  present: `sharp`, Playwright. **No SSIM / pixelmatch / OCR library installed.**
- **Harness** `.dev-stack/lab-shot.mjs` present (Playwright, real D3D11 GPU, `--use-angle=d3d11
  --enable-gpu`, auto `spin=off`, viewport 1440×900 @ DPR2 → 2880×1800 PNG).
- **Scene today:** premium oval table (felt + brass reveal + two-part leather/wood rail + apron/plinth
  body + warm floor-pool + backdrop sphere + one warm key) **+ M1 cards** (real Fournier faces; staged
  hand = community `[1E,12C,11B]` + hole = la **Perla de Oros** `[10O,7O]`; chips demoted to an accent
  pot at `group[2.7,0,1.5] scale 0.66`). 12 camera presets incl. `card`(POV, fov 40) / `hero`(¾, fov 32)
  / `macro`(fov 26).
- **M1 status:** shipped-local, self-validated; **operator on-device perceptual gate still OPEN** (becomes
  a TP0 precondition — see TP0.0).
- **Known weak points (from the audit + capture critique):** felt is the weakest material (flat
  `MeshStandardMaterial`, no sheen/anisotropy/normal; the vignette + warm-to-dark falloff is **baked into
  albedo** → double-darkens, fights relight). Chips are un-instanced (the #1 perf liability + the top
  identity risk: glossy / oversized C at macro). `ContactShadows` lacks `frames={1}` (per-frame scene
  re-render). Only **one** shadow-casting light → the apron/body falls to undifferentiated dark ("table
  floats" = a LIGHTING problem, the body geometry already exists). Rail/contour elegance-check is OPEN.
  No locked money-shot camera. **No postprocessing/depth stack at all.**

---

## 2. Diagnóstico

The lab is a beautiful, material-forward **object** whose protagonist (cards) just landed (M1). To
reach AAA it must now win at the **material, light and frame** level, element by element, without ever
breaking identity. The honest gaps, ordered by impact:

1. **The stage is flat.** The felt — the largest surface everything sits on — is a flat lit disc with
   baked vignette and no woven-cloth physics (no sheen/nap/anisotropy). Fixing it lifts every other
   element for almost no cost. *(TP1)*
2. **The protagonist is a great decal, not yet card STOCK.** M1 cards read clearly but lack stock
   micro-relief, coated sheen, edge read and tight contact. *(TP2)*
3. **The accent is a casino risk + the #1 perf liability.** Chips lean glossy with an oversized C and
   are un-instanced (~the worst draw-call case). *(TP3)*
4. **The edge elegance question is open.** The two-part rail + apron gained mass; the operator flagged a
   lost slim "poker-table" edge. The **body already exists** — "floats" is a lighting problem, not
   missing geometry. *(TP4 review + TP5 lighting)*
5. **One flat key, no honest depth.** A single warm key, no shaped falloff, no PCSS soft shadows, no AO,
   no postprocessing → no photographic depth and crushed/cold darks at wide framings. *(TP5, TP6)*
6. **No locked frame.** No canonical money shot; presets unvalidated against a finished table. *(TP7)*
7. **No life / no shared read.** The object is static and reads as a single still-life, not a warm,
   shared, mid-play Spanish card table. *(TP8)*

**Diagnosis verdict:** the work is a disciplined, element-by-element materiality + light + frame +
feel program, **identity-gated at every step**, that ends by promoting a new protected reference.

---

## 3. Visión objetivo — what "AAA Chiribito table" means

A table that, in a single still, reads as **a real, hand-fabricated, warm Spanish card table caught
mid-hand** — woven baize you could feel the nap of, Fournier cards you could pick up, worn clay chips
that recede, a cordobán-and-mahogany rail with a refined edge, aged brass (never gold), all under one
coherent warm light with honest soft shadows and photographic-but-restrained depth — **with the cards
unmistakably the protagonist**, and **zero** casino / Vegas / neon / glow / gimmick. Premium is
expressed through restraint and craft, not richness or spectacle.

---

## 4. The EVAL RIG (the frozen instrument — locked at TP0, used at EVERY gate)

Apples-to-apples is non-negotiable (the Chiribito runtime-probe-ladder discipline). The rig is **frozen
at TP0 and never mutated mid-program** (red-team fixes #6, #4 baked in):

### 4.1 The three canonical money shots (FROZEN at TP0)
Reused verbatim at every gate. Driven by `?cam=` + `?spin=off`:
- **HERO** — `?cam=hero` (¾ view, **fov 32**) — the overall premium read.
- **POV** — `?cam=card` (player POV) — **fov tightened 40 → 37** (decided now to reduce near-card
  stretch while keeping the protagonist large; the operator may revert to 40 as the ONE allowed TP0
  preset refinement, before any baseline is captured). Grazing angle → judges felt nap + grounding.
- **MACRO** — `?cam=macro` (**fov 26**) — material close-up (felt weave, card grain, chip clay, rail).

> Cameras are **decided at TP0, not TP7** — so all TP1–TP6 captures share TP9's framing (no mid-program
> re-baseline). TP7 only *confirms* the locked presets on the upgraded table + optionally adds a
> non-canonical cinematic flythrough.

### 4.2 The fixed staged scene (FROZEN at TP0)
- `LAB_COMMUNITY = [1E, 12C, 11B]` (As de Espadas · Rey de Copas · Caballo de Bastos).
- `LAB_HOLE = [10O, 7O]` (la **Perla de Oros**, Sota + 7 — all 5 cards FACE-UP).
- Demoted accent pot at `group[2.7,0,1.5] scale 0.66`.
- **DECIDED: no face-down card is added to the Perla hand** (red-team #6 / TP2.3 resolved — the frozen
  5-card scene stays immutable so the SSIM/MSE anchor is valid). Any face-down/deck-stub object is a
  **center-of-table** prop introduced via TP6 staging, never a 6th card in the hand.

### 4.3 Capture pipeline & corpus persistence (TP0 deliverable — red-team #9)
- Capture: dev server on 5173 → `LAB_URL="http://localhost:5173/table-lab.html?cam=<hero|card|macro>"
  node .dev-stack/lab-shot.mjs <out.png>`.
- `.dev-stack/` is **gitignored** → the baseline + protected-reference frames would NOT survive a clean
  checkout. **TP0 MUST persist the anchor corpus** (baseline HEAD + protected-tag frames + the
  positive/negative metric control frames) to a tracked location: commit them under
  `docs/table-3d/anchors/` (small PNGs) OR a dedicated `table-3d-anchors` branch. Without this the
  regression anchor is unreproducible.

### 4.4 The AAA scorecard (TP0 deliverable)
A 0–5 rubric for each of **15 elements**: felt · cards · chips · leather rail · wood coaming · brass ·
body/contour · lighting · shadows · depth · composition · cameras · tactility · social-read ·
premium-overall. Each rubric level anchored to a concrete capture description. Baseline scored at TP0;
target green = **≥ 4/5** every element at TP9.

### 4.5 The metric kit — 12 objective metrics with CONCRETE thresholds (red-team #3, #4)
Built in **TP0b** with a feasibility tier. **A metric is admitted to the gate-set ONLY after it
produces the expected result on a known-good AND a known-bad control frame** (red-team meta-gate); until
validated it is informational. Pre-decided tooling: **`sharp`-based pixel math**; **SSIM proxy = sharp
MSE** (pre-approved — no SSIM lib needed; a vendored JS SSIM is optional TIER-2); **legibility = fixed
pixel-height + manual operator confirm (NO automated OCR hard gate)**.

| # | Metric | Concrete default threshold (tunable, but a default MUST exist) | Tier |
|---|--------|----------------------------------------------------------------|------|
| M1 | Card legibility | hole-card rank-glyph bbox height **≥ 22 px** on a 1080p downscale of POV **+ operator manual "legible" confirm** | T3 (px-check + manual) |
| M2 | Cards-vs-chips area | cards' projected screen area **≥ 2.0×** chips' (region segmentation; manual polygon fallback) | T2 |
| M3 | Felt-hue-in-palette | mean Lab **ΔE < 12** from nearest of `#1f9163 / #147a51 / #0a4a33` over a fixed felt sample rect | T1 |
| M4 | Brass-not-gold | brass region within HSV ceiling **H 35–48° · S ≤ 0.55 · V ≤ 0.80** (no high-sat high-val gold) | T1 |
| M5 | Highlight-clip | pixels with luma > 250: **< 0.5%** of felt region · **< 1.5%** whole frame | T1 |
| M6 | Contact-shadow presence | directly under each hole card + each chip stack, luma **≥ 12% darker** than adjacent open felt | T1 |
| M7 | Bloom-absence | **no Bloom effect mounted** (code assert) AND no large connected bright halo in histogram | T1 |
| M8 | Vignette hierarchy | mean corner luma **8–20% below** center luma (band: < 8% = no framing, > 20% = void) | T1 |
| M9 | Determinism | two consecutive captures **byte-identical** (md5 equal) under `spin=off` + reduced-motion | T1 |
| M10 | Draw-call ceiling | HERO/POV/MACRO staged color pass **< 150**; `?chips=full` SEPARATE looser ceiling **< 220** (stress diagnostic, not a hero) | T1 |
| M11 | Frame-time floor | median frame-time **< 8 ms** at HERO on the RTX 4060, **vsync OFF**, full `?fx` (not "≥60 vsync-locked") | T1 |
| M12 | Regional MSE | **legibility region** + **felt-mark identity region** MSE-vs-**previous-phase** tag below churn threshold (changed only what intended). **Whole-frame-vs-reference = operator A/B only, informational** | T2 |
| +A | Warm-corner floor | corner luma ≥ a floor (not crushed black) AND corner hue **warm** (not neutral) — reconciles TP5.3 lift vs TP6 vignette | T1 |
| +B | Felt-specular extent | bright-sheen pixel fraction below a small cap AND **no continuous specular sweep** across felt ("fuzz" not "satin") | T1/2 |

> **SSIM-vs-reference is NOT an auto pass/fail for visual phases** (every visual phase is *designed* to
> differ from the reference). It is used ONLY regionally for must-not-change regions (M12) and as
> operator A/B whole-frame. (Red-team #5.)

---

## 5. Cross-cutting GUARDRAILS (apply to every phase)

1. **PERF (guardrail, not a deliverable):** HERO/POV/MACRO color pass **< 150 draw calls**; `?chips=full`
   separate ceiling **< 220** (stress diagnostic, may be exempt); frame-time **< 8 ms** vsync-OFF on the
   RTX 4060 with full `?fx`. Keep `dpr [1,2]`, anisotropy cap 8–16, `Environment frames={1}`,
   `ContactShadows frames={1}`, **only ONE shadow-casting light**, lean postprocessing (AO + light DOF +
   vignette + grain — **NEVER bloom**). Measure every phase via `renderer.info.render.calls` + a
   frame-time read (`?stats`). A phase that regresses desktop perf below floor without a clear win does
   not ship. Keeps the later ≥55–60 fps **mobile** gate (other program) reachable.
2. **REFERENCE NEVER DEGRADED:** every experiment captures the same 3 frozen shots, regionally MSE-checked
   (M12). The protected tag `table-3d-premium-reference-2026-06-04` is immutable, superseded only by an
   explicit operator promotion at TP9; the old tag is **retained forever** as history.
3. **REVERSIBILITY + per-phase ROLLBACK DISPOSITION:** create a per-phase git tag **before** starting each
   TP (e.g. `tp1-before-felt`). Every experiment is opt-in via a query flag (`?fx`, `?cards`, `?chips`,
   `?felt`, `?seats`, …) and revertible in one commit. **Roll back when a gate fails AND 1–2 fix
   iterations don't resolve it.** On rollback, the **disposition** (red-team #10) is:

   | Phase | On rollback |
   |-------|-------------|
   | TP0a / TP0b | **BLOCKING** — a broken instrument halts the program; fix the rig first |
   | TP1 felt | **non-blocking** — keep current felt, proceed |
   | TP2 cards | **non-blocking, flag** — protagonist already shipped at M1 |
   | TP3 chips | **split** — de-Vegas material non-blocking (keep current chips); **instancing must-ship-or-revert** (perf net-positive or don't ship) |
   | TP4 contour | **non-blocking** — keep the current validated contour; ship only craft upgrades that passed independently |
   | TP5 lighting | **non-blocking, flag** — ship grounding upgrades, keep prior key if pool-shaping fails |
   | TP6 depth | **non-blocking, flag** — cut the weakest effect; keep table without `?fx` if needed |
   | TP7 cameras | keep the TP0 locked presets if no refinement wins |
   | TP8 feel | **non-blocking** — keep the static-but-complete table |
   | TP9 verdict | cannot roll back — **return to the named failing phase** |

   **Global escalation cap:** if ≥ 3 phases roll back to "keep current," OR any BLOCKING phase fails, OR
   the total stuck-iteration count exceeds budget → **HALT and escalate to the operator** with a status
   report; do not grind.
4. **IDENTITY / ANTI-CASINO (hard NO):** no casino / Vegas / neon / crypto / slots / ostentatious gold /
   glow / bloom / jackpot / spotlight-cone / gaming-UI energy. Card = absolute protagonist; chips =
   demoted accent (never deleted). **Brass-not-gold** (M4); felt green in-palette (M3); warm color
   temperature. Fournier faces reused, **NEVER redrawn**; the ornate casino-badge `logo.png` stays OFF
   the felt.
5. **STRICT TABLE-OBJECT SCOPE + anti-occupant DENY-LIST (red-team #1):** nothing in the OUT list. No
   room / environment / backgrounds enhancement (floor-pool + backdrop sphere FROZEN). **Table-state
   staging is CENTER-OF-TABLE ONLY** — allowed: a face-down **deck stub** + a **dealer button** (and at
   most a center discard). **FORBIDDEN: any per-seat object** — opponent hands, per-player stacks, seat
   markers, modeled people. Depth/atmosphere/social ALL come from rendering ON the table + center
   table-state, never from a room or people.
6. **APPLES-TO-APPLES EVAL:** the §4 rig at EVERY gate. Micro-motion / autoRotate **freeze** under the
   capture flag so frames are pixel-deterministic (M9).
7. **STOP-ON-AMBIGUOUS (DEFAULT STOP):** one perceptual variable per gate; micro-phases; reversible single
   commits. An ambiguous operator brain-reaction → **STOP**, do not escalate "one more rung." The
   **6-point pre-change format** (§10) is filled before each TP.
8. **NO PUSH / DEPLOY / MERGE** without explicit operator confirmation (Chiribito manual-deploy policy,
   Vercel team `chiribito293-7173`). Lab stays visual-only, lab-only, not in the prod build; re-verify
   isolation (no `table-lab` input in `vite.config.ts`) at TP9.
9. **CRAFT / SHARED-REFACTOR DISCIPLINE:** reuse the kit pattern (`useChipKit`/`useCardKit`: shared
   geometry + shared base material + per-item map in `useMemo`) for any new element; add every new
   material to the single `textures.ts` factory following its colorspace discipline; the **bump→normal**
   upgrade is **ONE shared height→normal helper** feeding leather + chips + felt + wood; reuse
   `CHIP_PALETTES` + `C_ARC` + `drawSuit` verbatim so the felt mark, chip C and any new inlay stay
   color-locked.

---

## 6. The phases (TP0 → TP9)

> Each phase: **Objective · Dependencies · Subphases · Objective acceptance + metric thresholds ·
> Perceptual gate (stop-on-ambiguous) · Risks · Checkpoints · Rollback (+disposition) · Success.**
> Identity-before-tech ordering: stage → protagonist → accent → contour → unify-light → frame-depth →
> lens → feel → verdict.

### TP0 — Eval rig & baseline (lock the instrument) · **BLOCKING**
**Objective:** lock the frozen rig (§4) and a complete baseline of the CURRENT state, so every later gate
is apples-to-apples and the protected reference is provably never degraded. **TP0 is split** (red-team #3):

- **TP0.0 — M1 precondition gate (red-team #12):** operator confirms the **M1 cards-as-protagonist**
  read on-device **BEFORE any materiality work**. If it fails → stop before TP1 (refine M1 cards), not a
  surprise inside TP2.
- **TP0a — the cheap, must-have rig (zero visual change):** verify `lab-shot.mjs` for HERO/POV/MACRO
  (D3D11, `spin=off`, DPR2, no console errors); **freeze the 3 presets** (HERO 32 / POV **37** / MACRO 26)
  + the **Perla staged hand** + demoted pot, recorded verbatim here; capture the baseline corpus at HEAD
  **and** at the protected tag (worktree/checkout); read draw-call + frame-time baseline via
  `renderer.info` + a `?stats` overlay (vsync OFF); author the 15-element scorecard with baseline scores;
  **persist the anchor corpus to a tracked location** (`docs/table-3d/anchors/`).
- **TP0b — metric tooling (a real build, tiered):** implement the §4.5 metrics by tier; **validate each
  against a positive + negative control frame** before admitting it to the gate-set; pre-bake the
  thresholds (already in §4.5); pre-approve **MSE-as-SSIM-proxy**; **downgrade legibility to px-height +
  manual confirm**.

**Acceptance:** rig frozen + recorded here; baseline captures (HEAD + tag) persisted; draw/frame-time
baseline recorded; scorecard baseline filled; every admitted metric passes its controls.
**Perceptual gate:** operator blesses the 3 money shots as the canonical views (incl. POV fov 37 vs 40).
One refinement allowed, then locked. **Rollback:** N/A visual; **BLOCKING** if the rig/metrics are wrong —
never proceed on a broken instrument. **Success:** a frozen, operator-blessed rig + complete baseline +
persisted anchor + validated metric kit exist on disk and in this doc.

### TP1 — Tapete / felt materiality (the stage) · dep: TP0
**Objective:** turn the largest, weakest surface into believable woven baize — directional nap sheen,
micro-relief normal, restrained anisotropy — with the identity mark kept **born-in** the cloth, the green
in-palette, and depth moved out of baked albedo into material/light so it relights.
**Acceptance + metrics:** felt → `MeshPhysicalMaterial` with a Charlie sheen lobe (**sheen 0.6–0.85**,
sheenColor a slightly-lighter Chiribito green, **sheenRoughness 0.55–0.8**), a tiled tangent-space nap
`normalMap` (**repeat 6–10, normalScale 0.2–0.35**, built via the **shared height→normal helper** — first
use), low **anisotropy 0.15–0.4** — visible as a grazing-angle value shift at POV (metric +B passes:
"fuzz" not "satin"). Mark stays baked INTO the maps (NOT a floating decal; PlaneGeometry+alphaTest
discipline preserved; `polygonOffset` on the brass torus if any coplanar fight). **Remove the radial
vignette from albedo** but **keep a light-RESPONSIVE micro edge-darkening** so felt never regresses below
reference between TP1 and TP5/TP6 (red-team #8). Keep roughness **0.90–0.94** (anti-satin). M3 felt-hue
PASS; M5 highlight-clip on felt PASS; MACRO inlay sharpness ≥ baseline (raise felt canvas res or use an
inlay-only map).
**Perceptual gate (materiality-only):** operator A/B at POV + MACRO — does it read as real woven baize
without satin/casino-green? **Judge cloth materiality ONLY**; grounding/depth is deferred to TP5/TP6 (so
an ambiguous depth reaction does not trip this gate — red-team #8). Stop-on-ambiguous: if "cloth" isn't
clearly improved OR any satin/casino drift is sensed, STOP; iterate ≤ 2 then roll back.
**Risks:** sheen on too-low roughness → satin; anisotropy > 0.5 → brushed metal; re-baking the mark wrong
→ lost "born-in" / sunburst; felt texture-memory cost. **Rollback (non-blocking):** keep current felt,
proceed. **Success:** calm premium directional baize, born-in mark, in-palette, relights, crisp MACRO
inlay; scorecard felt **+≥2**.

### TP2 — Cartas materiality & legibility polish (protagonist) · dep: TP0, TP1
**Objective:** push the protagonist from "good decal" to "real card STOCK" — faint face micro-relief +
coated sheen, max-anisotropy crispness, a cheap paper-edge read, tighter contact, restrained dealt
variance — **without ever softening hole-card legibility.**
**Acceptance + metrics:** face anisotropy **8 → `renderer.capabilities.getMaxAnisotropy()` (cap 16)**;
mipmaps + LinearMipmapLinear confirmed (slight negative mip bias only if text still softens). Faint
card-stock micro-relief normal (linen/emboss hint) + a whisper of coat (**clearcoat 0.12–0.18,
clearcoatRoughness 0.5–0.6**) — NOT glossy/laminated. Paper-edge via a **CHEAP fake** (warm sheen rim /
baked edge gradient on the stock body) — **explicitly NO `MeshTransmissionMaterial`/transmission**. Fix
the face-to-bevel seam (no thin cream rim / z-fight at MACRO; `CARD_CORNER 0.17` unchanged, curveSegments
≥ 14). Restrained dealt variance: per-card resting micro-tilt/yaw **≤ ~1.5–2°**, **frozen
deterministically** (M9). Near-edge contact-shadow tightened/darkened vs the lifted far edge (card visibly
bites the cloth — M6). **M1 legibility MUST NOT regress; M2 cards-vs-chips ≥ 2× maintained.**
**Perceptual gate:** operator A/B at POV + MACRO — physical printed STOCK while razor-legible? Stop-on-
ambiguous: any legibility loss OR more plastic/laminated → STOP and revert that lever.
**Risks:** over-clearcoat → plastic; mip over-sharpen → pip ringing; variance too high → messy; edge fake
too strong → glowing border (casino). **Rollback (non-blocking, flag).** **Success:** weighty legible
Fournier stock with faint grain, tight contact, subtle dealt life; protagonist dominance intact.

### TP3 — Fichas materiality & physicality + perf de-risk · dep: TP0, TP1
**Objective:** re-author chips as **matte worn clay** that recedes as a quiet accent, lock the
chip↔card hierarchy, AND fix the program's #1 perf liability by **instancing** — protecting identity and
the later mobile gate together.
**Acceptance + metrics:** de-Vegas the material — clearcoat to a **matte clay seal 0.32–0.42**
(clearcoatRoughness 0.4–0.5), gloss killed, micro-grain added, the **C/rim tooled as a real RECESSED
mark (bump→normal via the shared helper)**, face logo desaturated + shrunk. Accent recedes: accent-stack
chroma **muted ~15–20%** + value lowered so cards dominate (M2 ≥ 2× holds; chip region no longer the
second-brightest/most-saturated object after cards — histogram). Stack physicality: keep hand-stacked
jitter; deliver **inter-chip separation via GEOMETRY/material only** (jitter + a baked edge-darkening on
the chip body) — **screen-space inter-chip AO is a TP6 bonus, never a TP3 gate** (red-team #2). Break the
deterministic 10-group cream-insert phase-alignment. **PERF:** convert stacks to `InstancedMesh`/drei
`Instances` per denomination (one body set + one TOP-face set per suit); **drop the never-seen bottom
face**; right-size chip textures (2048² → smaller, mip-friendly), bump→normal. Demoted-pot chip draws
target **~42 → ≤ ~10**; `?chips=full` back within its < 220 ceiling. M10 PASS; MACRO chip quality ≥
baseline (instancing = visual-parity + perf).
**Perceptual gate:** operator A/B at HERO + MACRO — worn artisanal clay that RECEDES, C tooled-not-printed,
no Vegas gloss? Stop-on-ambiguous: chips still pull the eye / read plastic → STOP; any instancing look
change = regression. **Risks:** instancing tempting a heavy central pile (do NOT — keep demoted);
instancing breaks if faces differ per chip (group by denomination); over-muting → chips vanish (demote,
never delete); bump→normal mis-bake. **Rollback (SPLIT):** de-Vegas non-blocking (keep current chips);
**instancing must-ship-or-revert** (net-positive perf or don't ship). **Success:** matte recessive tooled
clay, hierarchy locked, instanced within ceiling, mobile gate kept reachable.

### TP4 — Rail & contour elegance (the OPEN elegance-check) · dep: TP0, TP1
**Objective:** adjudicate the recorded elegance question (the two-part rail + apron/plinth gained mass,
possibly lost the slim refined poker-table edge) and add the flagged craft details — as a **review, not an
auto-revert.** **The apron/plinth BODY already exists (`bodyProfile`); the "table floats" read is a
LIGHTING problem fixed in TP5, NOT missing geometry. TP4 may only REFINE existing profiles — never ADD
furniture mass** (red-team #7).
**Acceptance + metrics:** **verdict FIRST** — a structured side-by-side of the frozen shots of the CURRENT
contour vs the recorded slim-rail set (`elev/00-base-wide`, `04-wood-wide`, `final-wide` = slim;
`elev/05-leather-wide`, `REFERENCE-wide`, `12-backdrop-wide` = heavy) → record "edge elegance lost /
acceptable / lost-in-specific-respect." If "lost": surgically slim `leatherProfile` / `woodCoamingProfile`
/ refine the outer profile toward edge thinness **without deleting the leather+wood material story or the
mass**; reversible. Craft details (in-scope): a **welt/cord at the felt-to-rail seam** (hide the hard CG
join); wood + leather + brass get **normalMaps** (shared helper); **per-arc-length / tri-planar UV** so
grain stops stretching at the oval long-ends; brass → **aged-brass** within the **single locked M4 HSV
target** (roughness 0.38–0.45, lower env); restrained edge-wear where arms rest; the rail outer wall reads
as a curved **volume** (top-highlight→underside-shadow), not a flat black band. Edge-thickness ratio
(rail band height / felt radius) measured before/after; M4 brass PASS; no perf regression.
**Perceptual gate:** operator verdict at HERO + a rail/eye view — "recovered edge elegance WITHOUT losing
material/mass?" **Stop-on-ambiguous → DEFAULT STOP and KEEP the current validated contour** (the elegance-
check may legitimately conclude "keep as-is"). **Risks:** auto-reverting to the slim rail (forbidden —
discards validated mass); slimming too far → thin disc; noisy wood normals under heavy clearcoat; fussy
welt. **Rollback (non-blocking):** keep current contour; ship only the independent craft upgrades (welt /
normalMaps / UV fix / brass tune) that passed. **Success:** elegance adjudicated with evidence; edge
recovered OR consciously kept-with-craft; craft details land; identity intact.

### TP5 — Iluminación & sombras (unify all materials under one warm light) · dep: TP0–TP4
**Objective:** shape the warm key into a **gentle warm gradient/falloff that keeps the WHOLE table read**
(NOT a casino-cone pool — red-team scope #3), add per-material specular + felt green-bounce, and upgrade
grounding with **PCSS soft shadows + baked ContactShadows** — so every TP1–TP4 material reads under ONE
coherent warm light with honest contact and zero casino harshness. **AO ownership:** TP5 owns ONLY
light + shadow grounding it can deliver with **no postprocessing**; **ALL screen-space / crevice AO moves
to TP6** (red-team #2). 
**Acceptance + metrics:** reframe the key as a **warm gradient toward the rail with generous fill
preserved** (a `key-to-fill ratio ceiling` so it can never collapse to a cone; the existing decay-0 +
generous-fill rig is the floor it must not breach). Warm/cool dimensionality via a low cool fill opposite
+ a light rim/kicker. **PER-MATERIAL specular tuning (NOT a global IBL/exposure bump — red-team #13)** so
chips/brass/rim/card-edges throw crisp SMALL highlights without tipping wood→wet / brass→gold (re-run **M4
brass at the END of TP5**, not just TP4). Felt **green-bounce** onto object undersides (subtle GI). Light
the **apron/rail outer wall as a volume** (this resolves "table floats" — red-team #7). Grounding: drei
**`SoftShadows` (PCSS, size 25–35, samples ~16, focus 0)** — contact-hard near / soft far; key
`shadow-mapSize 2048` + tuned near/far + bias/normalBias (no acne/peter-pan); **`ContactShadows frames={1}`**
(baked once — removes the per-frame scene re-render → M11 improves) with far/scale tuned to ground rail+body
too. Lift crushed blacks into **warm** graded shadow (metric +A warm-corner floor). **Anti-casino hard
gates:** NO single hard white cone; **NO bloom** (M7); M5 highlight-clip PASS while small speculars now
present; warm key (~`#fff1d6`, rim only lightly cool). **No new shadow-casting light** added for depth
(perf guardrail). M6 contact-shadow presence PASS under every object.
**Perceptual gate:** operator A/B at all 3 shots — every material under ONE warm motivated light, honest
grounding, restrained highlights, no casino harshness/cold void? Stop-on-ambiguous: pool reads as a
spotlight OR specular tips glossy → STOP, pull back intensity/penumbra/clearcoat. **Risks:** tight bright
key over dark = the casino look (keep generous warm fill, high penumbra); SoftShadows + ContactShadows
double-darken (lower ContactShadows opacity); PCSS recompiles shadow shaders (inject once); global specular
tips wood→wet / brass→gold (per-material only). **Rollback (non-blocking, flag):** ship grounding upgrades,
keep prior flat-warm key if pool-shaping fails. **Success:** one coherent shaped warm light; per-material
restrained specular + green-bounce; PCSS + baked contact ground every object; no casino harshness; M11
improved by `frames={1}`.

### TP6 — Profundidad & composición (depth ON the table, never a room) · dep: TP0,1,2,3,5
**Objective:** install the in-scope **restrained postprocessing** stack (first time it exists) for
photographic depth ON/around the table — **N8AO** + a whisper of **DOF** on the hole cards + table-edge
vignette/fog + a faint filmic grade — and resolve composition (kill empty-felt zones via **center
table-STATE**, lock cards>board>rail layering). **NO environment is built.** **TP6 owns ALL screen-space /
crevice AO** (satisfies TP5's grounding-crevice need — red-team #2).
**Acceptance + metrics:** install `@react-three/postprocessing` + `postprocessing` (currently absent);
`EffectComposer` (`enableNormalPass`, MSAA 4) **behind a `?fx` flag** so it A/Bs and freezes for capture.
**N8AO** (aoRadius 0.5–1.5 world, intensity 1.5–3, distanceFalloff 0.5–1) — honest crevice darkening
under cards/chips/rail (M6 / crevice). **DepthOfField** focused on the hole cards (focusDistance tied to
hole-card world pos, bokehScale 1.5–3) — **hole cards stay razor-sharp (M1 HARD gate)**; board/rail/accent
fall gently soft. Restrained **Vignette** (offset 0.3–0.5, darkness 0.5–0.8 — **M8 band 8–20%**) + tuned
existing fog so the FAR rail reads as air (grade/AO/DOF/vignette/fog only — **frozen backdrop untouched**).
Faint filmic grade + grain (Noise opacity 0.02–0.05; warm-lifted shadows; gentle highlight roll-off →
metric +A). **Composition:** kill empty-felt zones with **CENTER-OF-TABLE table-STATE only** — a face-down
**deck stub** + a **dealer button** (and at most a center discard); **NO opponent hand / per-seat object**
(red-team #1). Reinforce cards>board>rail via focus/exposure. **HARD anti-casino: NO Bloom mounted (M7);
no glow halos; DOF never softens the hero.**
**Perceptual gate:** operator A/B (`?fx` off vs on) at all 3 shots — cinematic-premium honest depth, hero
tack-sharp, no dead zones, no glow/gimmick? Stop-on-ambiguous: DOF gimmicky OR hero softens OR "effect-y"
→ STOP and reduce each effect. **Risks:** bloom = #1 casino trap (banned + perf sink); DOF too strong →
soft hero fails M1; AO radius wrong → halos/no-effect; postprocessing is the main desktop-fps drop
(measure each, cut weakest); table-state creeping to props/room (center game-state only). **Rollback
(non-blocking, flag):** cut the weakest effect; keep table without `?fx`. **Success:** restrained AO +
whisper DOF + edge vignette/fog + grain give photographic depth ON the table only; hero razor-sharp; empty
zones replaced by a shared mid-play read; no bloom; M11 within floor.

### TP7 — Cámaras (lock the canonical money shots) · dep: TP0–TP6
**Objective:** **confirm** the TP0-frozen HERO/POV/MACRO presets against the upgraded table (cameras were
decided at TP0 — red-team #6, so NO mid-program re-baseline), and optionally add a non-canonical restrained
cinematic flythrough that freezes to the canonical still under the capture flag.
**Acceptance + metrics:** the 3 presets re-evaluated on the finished materials/light/depth and reconfirmed
LOCKED (longer-lens, distortion-free; fovs in the ~50–85 mm-equiv product range; never fisheye; top-down
retained only as a layout diagnostic, never a hero). Protagonist hole cards compose as a dominant
lower-third mass, board mid-frame, rail framing, chips off-center accent. `autoRotate` OFF for capture
(M9). M1/M2 still PASS at the final HERO/POV.
**Perceptual gate:** operator confirms the canonical hero on-device — "is THIS the money shot of the
finished table?" Stop-on-ambiguous: if no preset clearly wins, **keep the TP0 set**; do not invent new
framing late. **Risks:** late preset churn breaks continuity (avoided — TP0 froze them); over-designed
cinematic move → spectacle (keep it still-equivalent). **Rollback:** keep TP0 presets. **Success:** the
canonical money shots are reconfirmed/locked; the eval framing is final for TP9.

### TP8 — Tactilidad, micro-vida & lectura social (the FEEL) · dep: TP0,1,2,3,5,6
**Objective:** add restrained micro-life that sells weight **without ever being consciously noticed** (card
settle, chip-land settle, a breathing stillness) and complete the SHARED mid-play **social read via
table-STATE only** (center game-state from TP6 + the staged mid-hand + demoted live-stakes pot) with the
castizo + premium-artisanal feel integrated — gated behind `prefers-reduced-motion` AND frozen under the
capture flag for deterministic gates.
**Acceptance + metrics:** sub-threshold micro-motion on **hero objects only** (hole cards, top chip):
amplitude **< ~0.01 world units / < ~0.5°**, settle 0.2–0.4 s, idle period 6–12 s near-zero — via `useFrame`
+ `maath/easing` (add if needed) or existing `gsap`. **ALL micro-motion freezes** under (a)
`matchMedia(prefers-reduced-motion)` AND (b) the harness `spin=off`/capture flag → **M9 determinism HARD**.
Because the harness can't see frozen motion, the amplitude bound is **operator-live-view + a static CODE
assertion** that the easing constants ≤ the documented thresholds (red-team coherence). Social read via
**CENTER table-STATE only** (deck stub / button / center discard) — **NO modeled humans; `?seats` stays
opt-in/never default**; M2 ≥ 2× holds (accent didn't grow). Castizo/artisanal lives in the OBJECT (cordobán,
aged brass, mahogany, the inlaid Spanish suits + Chiribito medallion) under the warm light — no room, no
decor. Restrained-only: no flip/spin/glow FX, no bouncy easing (no-FX assertion).
**Perceptual gate (LIVE view, not a still):** does it feel ALIVE and weighty + read as a shared mid-play
game, with NO motion consciously noticeable? Stop-on-ambiguous: any visible wobble → HALVE it; if still
seen → remove it. **Restrained stillness beats visible motion.** **Risks:** visible wobble = gimmick;
motion during capture = non-deterministic (must freeze); per-frame cost (few hero objects only);
table-state creeping to props/figures. **Rollback (non-blocking):** keep the static-but-complete table.
**Success:** the object breathes with sub-conscious weight (frozen for capture, reduced-motion-respecting)
and reads as a warm castizo shared mid-play game via table-state alone.

### TP9 — Unificación & AAA lock (the verdict → new protected reference) · dep: TP0–TP8
**Objective:** run the full multi-camera A/B, drive the scorecard all-green, finalize grade/tone-map
consistency, confirm perf within guardrail, verify "mesa terminada," take the operator's final gate, and
**promote the result to the NEW protected table reference** (old tag retained).
**Acceptance + metrics:** full A/B matrix at the 3 locked shots: **NEW vs TP0-baseline AND NEW vs the
correct comparison basis** — **vs the M1 captures for card/composition/protagonist elements** (the chip-
centric protected tag lacks cards) and **vs the protected tag for felt/rail/chips/lighting** (red-team
DoD #2). Scorecard every element **≥ 4/5**; total recorded vs baseline. **ALL §4.5 metrics PASS
simultaneously** at the locked shots (single consolidated run). Final grade/tone-map consistency across all
3 shots; **ACES (default) vs AgX/Neutral decision finalized and recorded** (AgX only if ACES washes
low-contrast textures); re-run the full metric matrix after any final grade tweak. Perf within guardrail
(M10 + M11). "mesa terminada" (§8) checked item-by-item. Operator FINAL on-device gate → create a NEW git
tag as the new protected reference; update this doc; **retain the old tag forever**.
**Perceptual gate:** operator final verdict across all 3 shots + a live view — "AAA, premium, castizo,
hand-fabricated table, and clearly better than the reference?" Stop-on-ambiguous: ANYTHING ambiguous →
**do NOT promote**; return to the specific failing phase. **Risks:** promoting a marginal win (promote only
on an unambiguous yes); a late grade tweak silently shifting earlier gates (re-run the matrix); per-phase
perf creep caught only here (the guardrail is enforced per-phase). **Rollback:** cannot promote on any
below-green element / failed metric / ambiguous verdict — return to the named failing phase. **Success:**
the table is declared **AAA-complete**; new protected reference tag created; ready to hand off to the next
big Chiribito area.

---

## 7. Optimal execution order & dependency graph

```
TP0 (rig+baseline, M1 precondition)  ── BLOCKING gate ──┐
   ├─ TP1 felt (stage) ─────────────┐                   │
   │     ├─ TP2 cards (protagonist)  │ (dep TP0,TP1)     │
   │     ├─ TP3 chips + instancing   │ (dep TP0,TP1)     │
   │     └─ TP4 rail/contour review  │ (dep TP0,TP1)     │
   │                                 ▼                   │
   └────────────────────────► TP5 lighting+shadows (dep TP0–TP4)
                                     ▼
                              TP6 depth+composition (dep TP0,1,2,3,5)  ← owns ALL screen-space AO
                                     ▼
                              TP7 cameras confirm (dep TP0–TP6)
                                     ▼
                              TP8 feel + social-read (dep TP0,1,2,3,5,6)
                                     ▼
                              TP9 AAA lock + new reference (dep TP0–TP8)
```

- **TP1 first** (the stage everything sits on), then **TP2/TP3/TP4** can be done in any order (they each
  depend only on TP0+TP1 and touch independent elements) — but the recommended sequence is **TP2 → TP3 →
  TP4** (protagonist polish → accent + perf de-risk → contour review).
- **Materials (TP1–TP4) before lighting (TP5)** — you can't light materials that aren't set.
- **Lighting (TP5) before depth/postprocessing (TP6)** — AO/DOF/grade sit on top of the lit scene.
- **Cameras decided at TP0**, only *confirmed* at TP7 (no mid-program re-baseline).
- **Feel (TP8) late** — micro-life + social read are the final integration, after the frame is set.
- **TP9 last** — the consolidated verdict + promotion.

---

## 8. Definición de "MESA TERMINADA" (Definition of Done — exhaustive & checkable)

The table is AAA-complete only when **every** condition below is met (red-team gaps closed):

1. **FELT** reads as real woven baize: directional nap sheen + micro-relief normal visible at grazing POV;
   green within `#1f9163 / #147a51 / #0a4a33` (M3); mark born-in (no decal/z-fight); crisp inlay at MACRO;
   **relights correctly (no baked vignette) AND is not flatter/less-grounded than the reference** (paired
   check — red-team).
2. **CARDS** are the unambiguous protagonist: real Fournier faces, razor-legible at POV @1080p (rank glyph
   ≥ 22 px + operator confirm — M1); read as physical card STOCK (faint grain + coat + edge, tight near-edge
   contact); cards-vs-chips screen-area ≥ 2× (M2).
3. **CHIPS** read as matte worn clay, demoted/recessive (muted ~15–20%, no Vegas gloss, tooled-not-printed
   C), AND instanced within ceiling (demoted-pot draws ~42 → ≤ ~10; `?chips=full` < 220; bottom faces
   dropped; textures right-sized).
4. **RAIL/CONTOUR** elegance adjudicated: fine poker-table edge recovered OR consciously kept-with-craft;
   welt/cord at the felt-to-rail seam; wood/leather/brass on normalMaps with per-arc-length UV (no oval-end
   grain stretch); **brass = aged-brass within the locked HSV target, NOT gold (M4)**; rail outer wall reads
   as a curved volume; **no furniture mass was ADDED (the body already existed)**.
5. **LIGHTING** is one coherent shaped warm gradient (motivated, generous fill, no fixture modeled, no
   cone), per-material restrained specular on brass/rim/card-edges, felt green-bounce on undersides,
   warm/cool dimensionality — NO casino cone, NO bloom (M7), NO cold void (metric +A).
6. **SHADOWS/GROUNDING** are honest: PCSS soft shadows (contact-hard near/soft far) on cards+chips; baked
   `ContactShadows frames={1}` grounding rail+body; **crevice/inter-object AO present under every card/chip
   and in gaps/seam — delivered by TP6's N8AO** (AO ownership = TP6, red-team #2).
7. **DEPTH** is photographic and restrained, achieved ON the table only (NO room built): N8AO + a whisper
   of DOF (hole cards tack-sharp — HARD) + table-edge vignette/fog (M8) + faint filmic grade/grain; NO
   bloom/glow anywhere (M7).
8. **COMPOSITION** has no dead zones: empty felt replaced by **CENTER-OF-TABLE table-STATE** (deck stub /
   dealer button / center discard) reading as a SHARED mid-play game; cards>board>rail layering reinforced.
   **NEGATIVE CHECK: no per-seat / opponent / occupant object anywhere** (red-team #1).
9. **CAMERAS:** 2–3 canonical money shots LOCKED (longer-lens, distortion-free, deterministic under
   `spin=off`), operator-blessed as the finished-table views.
10. **FEEL:** sub-conscious micro-life (settle/breathe on hero objects only, < ~0.5°) that is felt-not-seen,
    frozen under capture + reduced-motion (M9); the object reads warm, castizo, premium-artisanal.
11. **PERF GUARDRAIL met:** HERO draw calls < 150; `?chips=full` < 220; frame-time < 8 ms vsync-OFF on the
    RTX 4060 (M10, M11) — the later mobile gate not made impossible.
12. **REFERENCE INTEGRITY:** the protected tag was never degraded; the final state is unambiguously ≥ it on
    every shared element (felt/rail/chips/lighting) and ≥ the M1 captures on card/composition; a NEW
    protected reference tag is created, the old one retained as history.
13. **METRIC INTEGRITY:** all §4.5 metrics were validated against positive+negative control frames before
    gating (red-team meta-gate).
14. **VERDICT:** AAA scorecard all-green (every element ≥ 4/5), all objective metrics pass simultaneously at
    the locked shots, and the operator gives an unambiguous on-device final yes.

---

## 9. Riesgos globales

- **Casino-drift vectors:** felt sheen → satin; chip gloss; brass → gold (esp. the TP4-ages-it vs
  TP5-sharpens-it tug — a single locked M4 HSV target both must respect, re-checked at end of TP5); bloom;
  a bright key-cone over a dark void; a glowing card edge. All gated by M4/M5/M7/+A/+B + stop-on-ambiguous.
- **Scope-creep vectors:** table-state staging drifting toward props/room or a per-seat opponent hand
  (deny-list: center-of-table only); "table floats" tempting new body geometry (it's a lighting fix);
  enhancing the backdrop/floor (frozen).
- **Executability traps (pre-solved here):** no SSIM/OCR lib (MSE proxy + px-height+manual pre-approved);
  placeholder thresholds (baked in §4.5); AO ownership inversion (TP6 owns AO); mid-program camera
  re-baseline (frozen at TP0); gitignored anchor corpus (persisted at TP0); undefined rollback disposition
  (table in §5.3).
- **Perf creep across phases** caught only at TP9 → the guardrail is enforced **per-phase** (M10/M11 each
  gate), not deferred.
- **Inter-phase felt-depth gap** (TP1 de-bakes vignette before TP5/TP6 rebuild depth) → TP1 keeps a
  light-responsive micro edge-darkening + judges materiality-only.

---

## 10. The 6-point pre-change format (fill before EVERY TP)

```
TP<n> — <title>
• Objetivo:     <the one thing this phase proves>
• Restricciones:<identity invariants + the metric thresholds in play>
• Non-goals:    <explicitly what this phase does NOT touch (the OUT list + later TPs)>
• Riesgos:      <the casino/scope/perf vectors for THIS phase>
• Plan:         <subphases TP<n>.1..; one perceptual variable per gate>
• Validación:   <the 3-shot capture set + which metrics + the perceptual gate>
```

---

## 11. Cómo reanudar en sesión nueva (resume protocol — this doc is the ONLY source of truth)

1. `git checkout spike/table-3d-hero` → `cd frontend && npm run dev` (Vite on 5173; 5174 if busy).
2. Open `http://localhost:5173/table-lab.html` (default = `card` POV). Params: `?cam=hero|card|macro|…`,
   `?cards=off`, `?chips=full|off`, `?spin=off`, `?fx` (after TP6), `?stats` (after TP0), `?felt=…`,
   `?seats=on` (experimental — never a deliverable).
3. **Capture (copy-paste):**
   ```
   LAB_URL="http://localhost:5173/table-lab.html?cam=hero" node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/<tp>/hero.png
   LAB_URL="http://localhost:5173/table-lab.html?cam=card" node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/<tp>/pov.png
   LAB_URL="http://localhost:5173/table-lab.html?cam=macro" node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/<tp>/macro.png
   ```
   (Real D3D11; `spin=off` auto-applied. Then `Read` each PNG. The IDE preview tool CANNOT capture WebGL.)
4. **Start point:** **TP0** (rig + baseline + M1 precondition gate). Do TP0a → TP0b before any visual work.
5. Per phase: fill the §10 6-point format → tag `tp<n>-before-<slug>` → micro-phase edits → capture the 3
   shots → run the admitted metrics → operator perceptual gate (stop-on-ambiguous) → atomic local commit
   (NO push) → on success, advance per §7; on failure, apply the §5.3 rollback disposition.
6. **Gotchas:** PowerShell here-strings for commit messages — **no double quotes inside** (use git-bash or
   `-F`). z-fighting between the felt plane (y=0) and any coplanar disc → separate in Y / `polygonOffset`.
   Keep the lab out of the prod `vite build`.
7. **Never:** push/deploy/merge without the operator; degrade the protected reference; redraw the Fournier
   faces; touch engine/gameplay/card-geometry; build a room / enhance the backdrop / model occupants;
   add a per-seat object; mount Bloom.

---

## 12. Open operator inputs (carried — not blocking the plan)
- The **M1 cards on-device perceptual gate** (becomes TP0.0).
- Confirm the **POV fov 37** (vs 40) and the 3 money shots at the TP0 blessing gate.
- (Later program) the **reference mid-range phone** for the mobile ≥55–60 fps gate.

---

*Authored by the Chiribito table program (multi-agent audit → architect → red-team, all fixes folded in),
2026-06-09. Branch `spike/table-3d-hero`. No code changed by this document.*
