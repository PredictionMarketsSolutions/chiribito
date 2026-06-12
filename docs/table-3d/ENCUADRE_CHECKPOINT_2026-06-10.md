# ENCUADRE / Composition Exploration — Checkpoint 2026-06-10

> **STATUS: ADOPTED 2026-06-11.** The operator reviewed this full-scene composition exploration at the
> TP1 gate and **ADOPTED it as the new scene baseline** (see §DECISIONS below). The TP1 felt *material*
> (sheen/nap/aniso/aoMap) and the 3 frozen money-shot *cameras* (`card`/`hero`/`macro`) remain
> **unchanged** — only scene *composition* (felt size, card size, board count, hand layout) was adopted;
> the diagnostic cameras + multi-hand staging stay opt-in (→ TP7/TP8). `b2c9dd4` is promoted WIP→baseline.

## How we got here

Phase 2 / TP1 (felt) was operator-**APPROVED** and closed (`0a47b59`, see `TP1_OPERATOR_AB.md`). At the
gate the operator asked, before TP2's local card detail, to validate the **full-scene composition** —
"encuadre primero": whole table visible, cards protagonist, board + pot + several hands, social read,
camera↔players↔felt. This file records that exploration.

## What was explored (all on `spike/table-3d-hero`, behind flags where possible)

| Lever | File | From → To | Flag / scope |
|-------|------|-----------|--------------|
| Diagnostic camera `conjunto` | TableLab.tsx | *(new)* `pos[1.0,8.0,16.5] target[0,0.05,1.9] fov37` | `?cam=conjunto` — NOT a money shot |
| Diagnostic camera `social` | TableLab.tsx | *(new)* `pos[0,9.0,17.6] target[0,0,1.6] fov39` | `?cam=social` — NOT a money shot |
| Multi-hand staging `SeatHands` | TableLab.tsx | *(new)* face-down opponent hands at the 6 seats (card stock body, no faces; scale 0.62; hx=s.x·0.7, hz=s.z·0.72) | **opt-in `?seats=on`** (alongside existing `<Seats/>` torsos). Default scene unchanged. TP8 scope. |
| Felt suit-mark gate | TableLab.tsx | *(new)* `?marks=off` → empty `aceImgs` (clean felt) | opt-in; **default keeps the 4 marks (identity)**. `feltTexture` itself untouched. |
| Bigger table | TableLab.tsx | `FELT_R 5.2 → 6.5` | **GLOBAL** (changes default scene proportions) |
| Smaller cards | cards.ts | `CARD_W 2.4 → 2.05` | **GLOBAL** |
| Full 5-card board | TableLab.tsx | `LAB_COMMUNITY ["1E","12C","11B"] → [...,"5C","7E"]` | **GLOBAL** |
| Hand whole (back) | cards.ts | `HOLE_Z 3.35 → 2.3` | **GLOBAL** |
| Hand whole (flatter) | cards.ts | `HOLE_LIFT 0.42 → 0.2` | **GLOBAL** |
| Hand whole (separated pair) | cards.ts | `HOLE_PITCH CARD_W·0.73 → CARD_W·0.98` | **GLOBAL** |

The GLOBAL levers change what the frozen money-shot cameras *render* (bigger felt / 5 cards / new hand),
but NOT their pos/fov values. Lab unit tests still pass (27/27) — `HOLE_PITCH·0.98 < CARD_W` and
`HOLE_Z 2.3 > 2` keep the cards.test.ts assertions green.

## Captures (local scratch, gitignored — `.dev-stack/diag/table-3d/`)

- `tp1-fullscene/` — framing variants (wide/room/gather/top/eye/close/rail) on the TP1 felt.
- `tp1-social/conjunto_v4.png`, `social_v4.png` — bigger table + 5-board + whole hand + multi-hand (marks ON).
- `tp1-social/conjunto_clean.png`, `hand_clean.png` — same, marks OFF (clean felt).
- `tp1-social/hand_card_v4.png` — POV, hand whole.

## Operator feedback captured through the iterations

- Direction accepted ("vamos bien"); wants table bigger, people spaced, cards smaller, 5-board to fit,
  **hand cards WHOLE** (the overlapping/cut pair was the main snag → fixed by separating + flattening).
- The ornate "sword" under the hand = the **Espada suit emblem baked into the felt** (one of 4 cardinal
  "ADN on the cloth" marks), front cardinal point. Last "casi" snag.

## ✅ DECISIONS (resolved 2026-06-11)

1. **Composition direction — ADOPTED.** The bigger-table + 5-board + smaller-cards + whole-hand layout
   becomes the new scene baseline (GLOBAL levers in `b2c9dd4` stand). TP2 builds on top of it.
2. **Felt suit marks — MANTENER all 4.** Identity call: the 4 cardinal "ADN on the cloth" marks stay,
   including the front Espada under the hand. (`?marks=off` remains a diagnostic toggle; default = 4.)
3. **Cameras — stay DIAGNOSTIC.** `conjunto`/`social` are NOT formalized (that touches the TP0-frozen
   camera invariant → deferred to **TP7**). The 3 money-shot pos/fov are unchanged.
4. **Multi-hand staging — stays opt-in** (`?seats=on`); formalization deferred to **TP8**.
5. **→ NOW: TP2** (Cartas materiality & legibility), the original Phase 3, opens on the adopted scene.
   WATCH: smaller cards (CARD_W 2.05) put M1 hole-card legibility under pressure — TP2 must re-measure
   M1 first and must NOT regress it (max-anisotropy + mipmaps are the legibility-defending lever).

## Revert (if the exploration is dropped)

`git checkout 0a47b59 -- frontend/src/lab/TableLab.tsx frontend/src/lab/cards.ts`  — restores the exact
TP1-approved scene. Or `git revert <wip-commit>`. The captures stay in scratch for reference.

## Invariants honored

- No push to `main`; no merge; LOCAL+spike push only (operator-authorized checkpoint). ✅
- Absolute isolation from `feat/web-timeline-2026` — only `frontend/src/lab/` touched, only on spike. ✅
- TP1 felt material + frozen money-shot cameras unchanged. ✅ · TP1 not reopened. ✅
