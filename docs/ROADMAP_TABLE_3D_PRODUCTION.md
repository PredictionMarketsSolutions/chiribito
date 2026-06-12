# ROADMAP — Table 3D → Production Candidate (fortification program)

> **Status: STRATEGIC ASSET (operator decision 2026-06-05).** The 3D table lab
> (`spike/table-3d-hero`, React Three Fiber) is no longer a paused spike or a passive reference.
> It is a **long-term strategic asset** that we are **fortifying** into a serious candidate to
> *one day* become Chiribito's official table. We are NOT integrating it today and NOT replacing
> the live 2D table today. The 2D table remains production. The 3D lab stays alive, all prior work
> is preserved, and it advances through the milestone program below.
>
> **Governing principle: IDENTITY BEFORE TECHNOLOGY.** The card is the absolute protagonist; the
> room is castizo, warm and social; the table feels *alive, not exhibited*. Performance and
> integration come AFTER identity and feel are proven. Reward = rareza + carta + alma, NEVER money.
> No casino / Vegas / neon / crypto. Cards over chips, always.

> **⟹ SOURCE OF TRUTH FOR TABLE-OBJECT WORK = `docs/ROADMAP_TABLE_3D_PERFECTION.md` (2026-06-09).**
> A focused TP0–TP9 program perfects the table OBJECT (mesa · tapete · cartas · fichas · materialidad ·
> luz · sombras · profundidad · composición · cámaras · presencia física · táctil · social-via-table-state ·
> castizo · premium artesanal) to AAA, with an eval rig, baked metric thresholds, perceptual gates,
> rollback dispositions and a "mesa terminada" definition. It absorbs/deepens this program's **M1**
> (cards, shipped-local), **M3-feel** (table-only slice) and **M5** (rail/contour). The milestones below
> that remain are the **non-table** ones — **M2 (castizo room), M4 (occupant/social environment),
> M6 (mobile perf gate), M7 (game integration), M8 (candidacy A/B)** — which resume AFTER the PERFECTION
> program completes. Run PERFECTION first.

---

## How we got here (decision log)

- The lab produced a genuinely premium oval table (protected reference, tag
  `table-3d-premium-reference-2026-06-04`). Operator validated the 3D *direction*.
- Unbiased CD/CPO evaluation (2026-06-05), incl. two adversarial advocates: the 3D is materially
  superior but, **as it exists today, it is not Chiribito** — it is a chip still-life on a black
  void, with zero cards, a failed human-presence attempt, and unverified mobile perf. Even the 3D's
  own strongest advocate could not exceed 68/100 confidence and named the identity problem
  (chips-as-protagonist ≈ casino) as "a promise, not a proof."
- **Operator call:** do not bury it, do not crown it — **fortify it**. Define what would have to be
  true for the 3D to earn the official-table seat, with clear milestones and objective gates.

---

## AUDIT — what is "demo" vs what "product" requires (code-grounded, 2026-06-05)

Read from `frontend/src/lab/TableLab.tsx` (641 lines) + `textures.ts` (700 lines). The lab is one
isolated React tree served only at `/table-lab.html`; it is **not** in the production `vite build`
(verified: no `table-lab` input in `vite.config.ts`) and imports **nothing** from the game.

| # | Dimension | Demo state TODAY (in code) | What PRODUCT requires | Gap |
|---|-----------|----------------------------|------------------------|-----|
| 1 | **The card** | **Zero cards rendered.** No card mesh, texture, or geometry anywhere (`grep card/carta/hand` = comments only). | Spanish Fournier cards as the **absolute protagonist**: community at centre, hole cards legible. | **Critical / blocking.** This is the identity core and it is entirely absent. |
| 2 | **Chip vs card hierarchy (casino risk)** | 54 chips (`17+12+14+9` stacks + 2 loose) are the ONLY objects; they fill the centre. | Chips demoted to **accent**; a modest, legible pot; cards dominate the frame. | Hierarchy is inverted — reads as money/casino, the prohibited image. |
| 3 | **Data / state** | Counts and positions are **hardcoded literals**; a static still-life. | Driven by real game state (cards on table, pot, turn, winner). | No data path exists. |
| 4 | **Atmosphere (escaparate → castizo)** | `background = #060403` (near-black) + a dark backdrop sphere + a floor light pool. Lights are warm, but the frame reads as a black **showcase**. | A **castizo warm room** (a madrileño tavern): the table *inhabits a place*. | Reads as luxury product shot, not a warm social room. |
| 5 | **Alive vs exhibited** | `autoRotate` on by default (catalogue spin) + orbit camera. | A stable **player camera**; subtle ambient life + dealing/turn rhythm; "being played", not "rotating". | The signature motion is literally a showroom turntable. |
| 6 | **Human presence (social)** | `Seats` (opt-in `?seats=on`) = 6 revolved lathe torsos, flat brown `#47262a` — read as featureless "mounds". | Presence that reads as **people playing** (hands on the felt, silhouettes), or a documented re-approach. | Fails the "hay gente jugando" threshold (operator-confirmed). |
| 7 | **Contour / elegance** | Two-part rail (`leatherProfile` + `woodCoamingProfile`) + `bodyProfile` apron/plinth → massive outer contour. | A refined, finer "poker-table" edge that keeps the material. | Operator-flagged: gained mass, lost edge elegance. |
| 8 | **Mobile performance** | ~170 draw calls (54 chips × 3 meshes ≈ 162 alone, no instancing); per-frame `ContactShadows`; `shadow-mapSize 2048`; `dpr [1,2]`; continuous `autoRotate` render loop; `preserveDrawingBuffer:true`. **Unverified on mobile.** | **≥55–60fps on a defined mid-range phone**, sane battery + load time. | Heavy + unproven on a mobile-heavy product. |
| 9 | **Integration / architecture** | 641-line monolith; isolated React tree; not in prod build; no bridge to Colyseus `MesaState`/`Player.hand`. | A mountable component fed by game state, added as a **progressive visual layer** — never a rewrite. | No data contract, no componentization, no bridge. |

**Headline:** the lab is a beautiful *object*. To become a *product* it must first become *Chiribito*
— and that is an **identity** problem (1, 2, 4, 5, 6) before it is a **technology** problem (8, 9).

---

## THE FORTIFICATION PROGRAM (milestones — identity first)

Each milestone is isolated, reversible, and gated. Order is deliberate: identity & feel (M1–M5)
before technology (M6–M7) before the candidacy decision (M8). Nothing here touches the live game.
The protected reference (`table-3d-premium-reference-2026-06-04`) is never degraded.

### M0 — Lab foundations: keep it alive & measurable
- **Objective:** make the lab a permanent, reproducible test bench without degrading the reference.
  Confirm the protected tag, the capture harness (`.dev-stack/lab-shot.mjs`, D3D11 GPU), the camera
  presets, and this living roadmap doc. Define the **eval rig** every later gate uses.
- **Gate (objective):** reference tag intact; `lab-shot.mjs` regenerates the `REFERENCE-*` shots
  byte-comparably; this doc exists and is the single source of program truth.

### M1 — The card becomes the absolute protagonist *(IDENTITY #1 — blocking)*
> **✅ IMPLEMENTED + SELF-VALIDATED (shipped-local) 2026-06-09 — `854231c`. Objective gates pass
> decisively; awaiting the operator on-device perceptual gate. See `docs/HANDOFF_TABLE_3D_M1_CARDS.md`.**
- **Objective:** model the Spanish Fournier cards in 3D (textured planes with the real card faces),
  large, fronto-parallel to the player camera, fully legible — community cards centred, hole cards
  read clearly. **Demote the chips to an accent**; the pot becomes modest and legible, not a tower.
  Re-aim the camera to serve card legibility, not rail glamour.
- **Gate (objective):**
  - In the canonical hero + player-POV captures, the **cards' projected screen area ≥ 2× the chips'**;
    rank + suit are legible at mobile resolution (1080p downscaled).
  - Blind read: an uninformed viewer says "a hand of Spanish cards", NOT "casino chips".
  - Operator on-device perceptual gate. Stop-on-ambiguous.

### M2 — The castizo room *(IDENTITY — warm, not a showcase)*
- **Objective:** replace the black void with a warm castizo room (madrileño tavern): wood, warm
  lamp light, a suggestion of wall/window/ambience — no neon, no Vegas. The table inhabits a place.
- **Gate (objective):** A/B vs the current black background; reads "warm tavern", not "luxury
  showcase"; zero casino/Vegas drift; operator gate.

### M3 — Alive, not exhibited *(FEEL)*
- **Objective:** kill the catalogue `autoRotate`; set a stable player camera; add subtle ambient
  life borrowed from the Rincón language (do NOT invent a new system) + a dealing/turn rhythm. The
  table is *being played*, not *spinning in a vitrine*.
- **Gate (objective):** a 10s clip reads "a living table mid-hand", not "a rotating product";
  no motion the user *consciously* notices (Chiribito rule); `prefers-reduced-motion` respected.

### M4 — Social presence *(FEEL — social)*
- **Objective:** solve human presence that reads as people playing — attack the **silhouette first**
  (shoulders, hands on the felt, asymmetry), or re-approach (e.g. hands + cards + chips per seat
  instead of headless torsos). If it still doesn't cross, document the re-approach. Never degrade the
  table.
- **Gate (objective):** crosses "hay gente jugando", or a logged decision to re-approach/park.

### M5 — Contour elegance *(REFINEMENT)*
- **Objective:** rail/silhouette review — recover the fine, refined "poker-table" edge without
  losing the material (tune `leatherProfile` / `woodCoamingProfile` / `bodyProfile`). A review, not a
  revert.
- **Gate (objective):** side-by-side of the exterior silhouette; elegance recovered AND material
  kept; operator gate.

### M6 — Mobile performance proven *(TECHNOLOGY — hard numeric gate)*
- **Objective:** `InstancedMesh` per denomination (≈162 → ~4–8 draw calls); `ContactShadows
  frames={1}` (bake once); shadow-map 2048 → 1024 on mobile (consider dropping realtime shadow); `dpr`
  cap ~1.5; pause `autoRotate` when idle; textures 2048² → 1024²; drop `preserveDrawingBuffer` in prod.
- **Gate (objective, measured):** **≥55–60fps sustained** on a defined mid-range phone (pick the
  device), no stutter, measured battery drain acceptable, first-interactive load acceptable on a
  mid mobile network. Numbers recorded, not vibes.

### M7 — Integration readiness *(ARCHITECTURE — no rewrite)*
- **Objective:** componentize the monolith; define the **data contract** to game state (cards via
  `Player.hand` `@view()`, community cards, pot, turn, winner); render the 3D scene as a
  **non-interactive visual layer** fed by a mock `MesaState` in a dev harness — zero changes to the
  production game.
- **Gate (objective):** the 3D scene renders a real hand from a mock Colyseus state end-to-end in a
  dev harness; the data contract is documented; production game untouched.

### M8 — Candidacy decision *(DECISION)*
- **Objective:** full on-device A/B vs the live 2D table, with M1–M7 all green.
- **Gate:** operator A/B decision — "candidate approved to plan integration" / "continue" / "archive
  as material reference". This is the coronation gate; it is the operator's call.

---

## Invariants (carry-forward, non-negotiable)
- The card is the protagonist; chips are an accent; reward = rareza + carta + alma, never money.
- No casino / Vegas / neon / crypto. Warm, castizo, social, premium-discreet.
- The protected reference table is never degraded; experiments are opt-in & reversible.
- The live 2D table stays production until M8 says otherwise. No integration / no push / no deploy
  without explicit operator confirmation (Chiribito deploy policy).
- Identity & feel (M1–M5) gate before technology (M6–M7). Stop-on-ambiguous on every perceptual gate.

## How to resume
`git checkout spike/table-3d-hero` → `cd frontend && npm run dev` → `http://localhost:5173/table-lab.html`.
Capture via `.dev-stack/lab-shot.mjs` (`--use-angle=d3d11 --enable-gpu`). Next concrete step: **M1**
(the card as protagonist). See `docs/HANDOFF_TABLE_3D_LAB.md` for the lab internals.

---

## SESSION CHECKPOINT — 2026-06-05 (formal close) · RESUME FROM HERE

- **Branch:** `spike/table-3d-hero` · **tip:** `d5aad26` · working tree **clean** · **nothing pushed/merged/deployed**.
- **Commits this session:** `ce3c371` (this roadmap) · `d5aad26` (redirect lab handoff to M0–M8).
- **Decided:** 3D = long-term **strategic asset**, fortify via **M0–M8**, **identity before technology**, the **card = absolute protagonist**. Live 2D stays production.
- **Discarded:** "3D as the production table NOW", "3D as a passive reference only", and "bury the 3D". Also: no integration / no replacement today.
- **Protected:** premium reference (tag `table-3d-premium-reference-2026-06-04`) · all prior lab work · engine/gameplay/Colyseus/geometry **FROZEN** (visual-only) · the live 2D table.
- **Docs updated today:** this file (new) · `docs/HANDOFF_TABLE_3D_LAB.md` (redirect banner) · `~/.claude/ceo-os/chiribito/roadmap.md` (strategy status) · project memory `project_chiribito_table_3d_reset.md` (banner) + `MEMORY.md` index line.

### NEXT SESSION → M1: THE CARD AS ABSOLUTE PROTAGONIST (start here, no re-analysis needed)

**Why first:** the scene renders **zero cards** (verified: `grep card/carta/hand` in `frontend/src/lab` = comments only). A 3D Chiribito table with no cards is not Chiribito. M1 turns the chip still-life into a hand of cards.

**Objective:** Spanish Fournier cards as the dominant objects — community cards centred + the player's hole cards legible — chips demoted to a modest accent pot, camera re-aimed to serve card legibility.

**Approach (confirm in a short brainstorm before building):**
- Cards = textured planes (`PlaneGeometry`) using the REAL Fournier `.webp` faces the game already ships (reuse the game's card assets; **do NOT redraw official cards — locked**). A card = thin rounded plane (front `.webp` + `back-clean` back), on/just off the felt.
- Reuse the lab's material discipline (PBR, the ONE warm light, `alphaTest` for rounded corners like the chip faces). Mirror the `useChipKit`/`Chip`/`ChipStack` pattern with a `useCardKit`/`Card`/`Hand`.
- Camera: add a stable card-reading player-POV preset; demote `autoRotate` for M1 captures (full kill is M3).
- Chips: shrink the central pile to an accent so cards dominate — **do NOT delete chips** (they're identity too), just re-rank.
- Files: `frontend/src/lab/TableLab.tsx` (+ a `Cards`/`Hand` component & card kit) and `frontend/src/lab/textures.ts` (card texture loading if needed). Isolated; touches nothing in the game.

**Gate (objective — all must pass to close M1):**
1. In the hero + a new player-POV capture, cards' projected screen area **≥ 2×** the chips'.
2. Rank + suit **legible at 1080p downscaled** (mobile-legibility bar).
3. Blind read = "a hand of Spanish cards", NOT "casino chips".
4. Operator on-device perceptual gate. **Stop-on-ambiguous → STOP.**

**Discipline:** brainstorm (brief) → spec → TDD the pure pieces (card layout / placement / legibility) → build isolated → apples-to-apples capture (`.dev-stack/lab-shot.mjs`, D3D11) → operator gate. No merge/push/deploy.

**Two operator inputs still open:**
- Confirm **GO to start M1** (build the cards in the lab).
- Pick the **reference mid-range phone** for M6's ≥55–60fps numeric gate (or accept a defined baseline).

---

## SESSION CHECKPOINT — 2026-06-09 (M1 implemented-local) · RESUME FROM HERE

- **Branch:** `spike/table-3d-hero` · **tip:** `854231c` (feat) → docs commit follows · working tree clean ·
  **nothing pushed/merged/deployed.**
- **Done:** **M1 — cards as the absolute protagonist** built + self-validated. Real Fournier faces on
  rounded card stock; staged hand (community `1E/12C/11B` + hole = la Perla de Oros `10O/7O`); chips
  demoted to an accent pot; new player-POV `card` camera (default). Isolated to `/table-lab.html`.
  Full record: **`docs/HANDOFF_TABLE_3D_M1_CARDS.md`**.
- **M1 objective gates:** ✅ cards' screen area ≫ 2× chips' · ✅ rank+suit legible at 1080p ·
  ✅ blind read = "a hand of Spanish cards". Captures: `.dev-stack/diag/table-3d/m1/{card,hero,wide}.png`.
- **Verification:** frontend 362/362 vitest (9 new) · tsc clean in `src/lab/` · `vite build` green ·
  lab still NOT in the prod bundle (production unaffected).
- **OPEN (operator):** (1) the **M1 on-device perceptual gate** (stop-on-ambiguous); (2) the **M6
  reference phone**. New escape hatches: `?cards=off`, `?chips=full`, `?chips=off`.
- **NEXT (if M1 passes the gate) → M2: the castizo room** — replace the `#060403` black void with a
  warm madrileño-tavern room (wood, warm lamp light, a suggestion of wall/window); A/B vs the current
  black background; zero casino/Vegas drift; operator gate. The cards + table stay as the protagonist.
