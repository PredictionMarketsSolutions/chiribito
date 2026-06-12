# HANDOFF — Table 3D · M1: the card as the absolute protagonist

> **Status: M1 IMPLEMENTED + SELF-VALIDATED (shipped-local), awaiting the operator
> on-device perceptual gate.** Branch `spike/table-3d-hero`, commit `854231c`.
> Local only — **no push, no deploy, no merge**. Read `docs/ROADMAP_TABLE_3D_PRODUCTION.md`
> for the full M0–M8 program; this doc covers M1.

**Date:** 2026-06-09
**Predecessor:** `1c16842` (M1 kickoff) on the M0 lab (`docs/HANDOFF_TABLE_3D_LAB.md`).

---

## What M1 delivers

The lab's signature problem was that the scene rendered **zero cards** — a chip still-life on
a black void (the casino image we forbid). M1 turns it into **a hand of Spanish cards**.

- **Real Fournier faces, never redrawn.** Cards reuse the exact `.webp` faces the game already
  ships at `/cards/<rank> DE <SUIT>.webp` (`O→ORO, C→COPAS, E→ESPADA, B→BASTOS`; ranks
  5/6/7/10/11/12/1). The lab maps + loads them itself — it still imports nothing from the game.
- **Cards as physical objects.** Each card = an extruded rounded-rect **cream stock body** (soft
  beveled edge that catches warm rim light + casts a real contact shadow on the felt) + a
  **face decal** (the rounded shape with UVs remapped to [0,1] so the face fills it edge-to-edge,
  anisotropy 8 for crisp rank/suit at the grazing table angle).
- **Staged hand** (a believable mid-hand): community = **As de Espadas · Rey de Copas · Caballo
  de Bastos**; the player's hole cards = **la Perla de Oros** (Sota + 7 de Oros — the strongest
  hole pair), fanned + lifted toward a new player-POV camera.
- **Chips demoted to an accent.** The old 54-chip central tower (17/12/14/9 + 2 loose) is now a
  small side pot (6/4/3 + 1 loose, scaled 0.66, off to the right). Chips are identity — **demoted,
  never deleted.**
- **Camera re-aimed for legibility.** New default preset `card` (player POV: hole cards large in
  the foreground, the board read beyond). All prior presets (`hero`, `wide`, `top`, …) still work.

### Files (isolated to the lab)
- `frontend/src/lab/cards.ts` (new) — face-URL map, card proportions, rounded-card geometry
  (body + face), and the **unit-tested** layout math (`rowPositionsX`, `communityLayout`, `holeLayout`).
- `frontend/src/lab/cards.test.ts` (new) — 9 vitest cases (URL mapping, centred/ascending rows,
  flat community, fanned+lifted hole cards).
- `frontend/src/lab/TableLab.tsx` (edited) — `useCardKit` / `useCardFaces` / `Card` / `CardGroup`
  (mirrors the chip-kit pattern), the staged hand, the `card` camera preset, chip demotion.

### New URL params
- `?cards=off` — restore the pre-M1 table (no cards).
- `?chips=full` — restore the old heavy central pot (reference / regression).
- `?chips=off` — clear chips entirely.
- `?cam=card` — the new default player POV (also `hero`, `wide`, `top`, `room`, `rail`, `eye`, …).

---

## M1 gate — where we stand

| Gate | Result |
|------|--------|
| Cards' projected screen area ≥ **2×** the chips' | ✅ decisive (≈5–8× in the hero/wide/card captures — not marginal) |
| Rank + suit **legible at 1080p downscaled** | ✅ the 7 de Oros' coins + the Sota's "10" + each community suit read clearly |
| Blind read = **"a hand of Spanish cards", not "casino chips"** | ✅ unambiguous |
| **Operator on-device perceptual gate** | ⏳ **OPEN — the operator's call. Stop-on-ambiguous.** |

**Captures (D3D11, real GPU):** `.dev-stack/diag/table-3d/m1/{card,hero,wide}.png`
(regenerate: dev server on 5173 → `LAB_URL="http://localhost:5173/table-lab.html?cam=card" node .dev-stack/lab-shot.mjs .dev-stack/diag/table-3d/m1/card.png`).

**Verification:** frontend **362/362 vitest** green (9 new, 0 regressions) · **tsc clean in `src/lab/`**
(the 12 pre-existing card-popover/token-monitor/connection errors are unchanged, not the lab) ·
**`vite build` green** (the lab is dev-only — NOT in the prod bundle; `play.chiribito.com` unaffected).

---

## Invariants held (unchanged)
- The card is the protagonist; chips are an accent; reward = rareza + carta + alma, never money.
- No casino / Vegas / neon / crypto. Warm, castizo, premium-discreet.
- The protected premium reference (tag `table-3d-premium-reference-2026-06-04`) is **untouched**;
  M1 is reversible (`?cards=off`).
- Live 2D table stays production. **No integration / no push / no deploy / no merge.**
- Engine / gameplay / Colyseus / card geometry **FROZEN** — M1 is visual-only, lab-only.

---

## Two operator inputs still open (carried from the roadmap)
1. **The M1 perceptual gate** — view the captures (or `npm run dev` → `/table-lab.html`) and confirm
   the cards read as Chiribito on device. Stop-on-ambiguous: if the brain reaction is ambiguous, STOP.
2. **The M6 reference mid-range phone** — pick the device for the later ≥55–60fps numeric gate.

## How to resume
`git checkout spike/table-3d-hero` → `cd frontend && npm run dev` → `http://localhost:5173/table-lab.html`.
- If M1 passes the operator gate → **M2: the castizo room** (replace the `#060403` black void with a
  warm madrileño-tavern room; A/B vs the current black background; zero casino/Vegas drift).
- If the gate flags the cards → tune in `cards.ts` (size `CARD_W/CARD_H`, `HOLE_LIFT`/`HOLE_FAN`,
  `communityLayout`/`holeLayout`) + the `card` preset in `TableLab.tsx`; re-capture; re-gate.
