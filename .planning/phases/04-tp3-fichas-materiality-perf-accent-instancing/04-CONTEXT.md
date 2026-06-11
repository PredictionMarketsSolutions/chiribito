# Phase 4: TP3 — Fichas Materiality + Perf (accent + instancing) - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — operator accepted all 3 grey areas as recommended

<domain>
## Phase Boundary

Re-author the chips as **matte worn clay that RECEDES** as a quiet accent (de-Vegas materiality), lock
the chip↔card hierarchy, AND fix the program's #1 perf liability by **instancing** the chip stacks. Work
is lab-only (`frontend/src/lab/`) on `spike/table-3d-hero`, behind flags, on the post-TP2 scene. Ends at
the operator A/B gate (HERO + MACRO). **SPLIT rollback:** de-Vegas is non-blocking (keep current chips if
it fails); instancing is **must-ship-or-revert** (net-positive perf or don't ship).

OUT of scope: rail/contour (TP4), lighting/PCSS/ContactShadows (TP5), screen-space/crevice AO incl.
**inter-chip AO** (TP6 — NOT a TP3 gate), depth/DOF (TP6), cameras (TP7), social/multi-hand (TP8). The 3
frozen money-shot cameras + the felt + the shipped card-stock are UNCHANGED.

</domain>

<decisions>
## Implementation Decisions

### Sequencing & Eval-Rig  *(operator-decided: Instancing-first + tp3-base)*
- **Instancing FIRST** (strict visual PARITY vs the current chip look), **THEN de-Vegas** materiality on
  the instanced chips. Rationale: instancing is the objective/risky workstream (must-ship-or-revert);
  de-Vegas (perceptual, non-blocking) applies cleanly to the shared clay body afterward.
- **Capture a tp3-base** (the current post-TP2 chips) as the apples-to-apples "before". M10 baseline is
  known (TP0: HERO ~233 / MACRO ~195 / `?chips=full` 637 — all OVER ceiling; TP3 is the fix).
- **SPLIT rollback:** de-Vegas **non-blocking** (keep current chips if ambiguous); instancing
  **must-ship-or-revert** (net-positive perf or don't ship).

### De-Vegas Material  *(operator-decided: max-mate / max-recede)*
- **clay seal (clearcoat) 0.32** (low end) / **clearcoatRoughness 0.5** — maximally matte.
- **chroma muted −20%** + value lowered (recede more).
- **C / rim mark tooled RECESSED** via the shared bump→normal helper (`normalMapHelper`).
- **face logo desaturated + shrunk.**
- micro-grain added; gloss killed.
- Goal: the accent **recedes** so cards dominate — **M2 ≥ 2× holds**; chips are no longer the
  second-brightest / most-saturated object after cards (histogram).

### Instancing & Perf  *(operator-decided: drei Instances + 512²)*
- **drei `<Instances>` / `<Instance>` per denomination** (one body set + one TOP-face set per suit); **drop
  the never-seen bottom face**.
- **chip textures right-sized 2048² → 512²** (mip-friendly; chips are small/recessive).
- **strict visual PARITY** — any instancing look change = regression; MACRO chip quality ≥ baseline.
- bump→normal for the chip face (shared helper).
- **Targets:** demoted-pot chip draws **~42 → ≤ ~10**; `?chips=full` back within **< 220**; **M10 PASS**.
- Break the deterministic 10-group cream-insert phase-alignment (SSOT).
- Keep the hand-stacked jitter; inter-chip separation via **GEOMETRY / material only** (jitter + a baked
  edge-darkening on the chip body) — screen-space inter-chip AO is a **TP6 bonus, NEVER a TP3 gate** (red-team #2).

### Locked by SSOT §TP3 — implement as specified (NOT re-litigated)
- de-Vegas: matte clay seal 0.32–0.42, gloss killed, micro-grain, C tooled RECESSED, face logo desat+shrunk;
  accent chroma muted ~15–20%, value lowered.
- instancing: `InstancedMesh`/drei Instances per denomination (one body + one top-face per suit); drop the
  bottom face; right-size chip textures; bump→normal. demoted-pot ~42 → ≤ ~10; `?chips=full` < 220; M10 PASS;
  MACRO chip quality ≥ baseline (instancing = visual-parity).
- **M2 cards-vs-chips ≥ 2× MUST hold** (hierarchy — the cards stay the protagonist).
- Gate: operator A/B at HERO + MACRO — worn artisanal clay that RECEDES, C tooled-not-printed, no Vegas gloss.
  Stop-on-ambiguous: chips pull the eye / read plastic → STOP.
- **Rollback SPLIT:** de-Vegas non-blocking (keep current); instancing must-ship-or-revert.

### Claude's Discretion
- `?` flag names + wiring, capture cadence, the tp3-base dir naming, exact micro-grain / bump strength
  within "restrained", and the drei-Instances grouping detail — at Claude's discretion within the above.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/lab/TableLab.tsx` — `useChipKit(cImg)` (chip **body** `LatheGeometry` via `chipProfile()`
  + per-suit edge + face material with `map: chipFaceTexture`, `bumpMap: chipFaceBump`); **`ChipStack`**
  (pushes N **individual** chip meshes with per-chip jitter into a `<group>` — THIS is the draw-call
  liability to instance); the demoted **pot** (~line 816; `?chips=full` restores the heavy central pot).
- `frontend/src/lab/textures.ts` — `chipFaceTexture` / `chipFaceBump` / `chipEdgeTexture` (the chip textures
  to right-size 2048²→512² + de-Vegas: mute chroma, recess the C, desat+shrink the logo).
- `frontend/src/lab/normalMapHelper.ts` — shared **bump→normal Sobel helper** (felt nap + card micro-relief
  precedent; reuse for the recessed C-mark + chip face bump→normal).
- The TP1 felt + TP2 card `MeshPhysicalMaterial` pattern — the de-Vegas **clay** material mirrors it (a
  MATTE clearcoat seal instead of a whisper; sheen killed).
- Frozen TP0 metric rig: M2 (cards-vs-chips area ≥ 2×), **M10 draw-calls** (read via `stats-read.mjs`
  drawElements/drawArrays wrapper — NOT StatsProbe gl.info, which is stale under headless rAF throttle),
  MACRO chip-quality.

### Established Patterns
- Lab isolated at `/table-lab.html`; NOT in the prod build; only `frontend/src/lab/` on `spike/table-3d-hero`.
- Materiality via `MeshPhysicalMaterial` (TP1/TP2 precedent: sheen/clearcoat/normalMap/bumpMap).
- A/B discipline: ONE variable per gate, behind a `?` flag, Playwright apples-to-apples capture at the frozen
  shots, STOP-on-ambiguous. `?chips=full` already exists (heavy-pot restore).
- Determinism (M9) + the deterministic jitter pattern (TP2 Lever 6) — relevant to "break the 10-group
  cream-insert phase-alignment" without going random.

### Integration Points
- Chip material/geometry: `useChipKit` + `ChipStack` in `TableLab.tsx`; chip textures in `textures.ts`.
- Instancing: replace `ChipStack`'s per-chip mesh push with **drei `<Instances>` per denomination** (body +
  top-face), dropping the bottom face.
- Capture at HERO (M10 / hierarchy) + MACRO (chip quality) frozen cameras.
- New dated `tp3-base` dir under `docs/table-3d/anchors/` (head/ + reference-tag/ + tp2-base/ stay immutable).
- M10 / M2 metric scripts (TP0 rig) — re-run; M10 is the must-ship gate for instancing.

</code_context>

<specifics>
## Specific Ideas

- **Full spec (SSOT):** `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP3 — doc WINS on any conflict.
- Built on the **post-TP2 scene** (adopted encuadre + shipped 7-lever card-stock) — chips unchanged since
  the adopted scene, so the current chips are the tp3-base "before".
- M10 baseline (TP0): HERO ~233 / MACRO ~195 / `?chips=full` 637 — all over ceiling; TP3 instancing fixes it.
- SSOT red-team: a heavy central pile is FORBIDDEN (keep the pot demoted); over-muting → chips vanish
  (demote, never delete); instancing breaks if faces differ per chip (group by denomination); inter-chip
  screen-space AO is TP6, never a TP3 gate.

</specifics>

<deferred>
## Deferred Ideas

- TP4 (rail/contour), TP5 (lighting/PCSS/ContactShadows), TP6 (screen-space/crevice AO incl. inter-chip;
  depth/DOF/vignette), TP7 (cameras), TP8 (social/multi-hand), TP9 (AAA lock).
- Carried TP2 items (per-lever `?card=` flag wiring; M1 px-method; AAA(5) cards / CARD_W revisit) — not TP3 scope.

</deferred>
