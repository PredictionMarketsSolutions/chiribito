# Chiribito — Table 3D PERFECTION Program (the table OBJECT → AAA)

## What This Is

An isolated visual R&D program to take the Chiribito 3D table **OBJECT** to AAA quality,
element by element (felt · cards · chips · rail · brass · body · light · shadow · depth ·
composition · cameras · tactility · social-read · premium-overall). It lives entirely in a
lab React tree served only at `/table-lab.html` on branch `spike/table-3d-hero` — it imports
nothing from the game and is **NOT** in the prod `vite build`. `play.chiribito.com` /
`chiribito.com` are unaffected. This is a perceptual, operator-in-the-loop craft program, not
a feature build.

> **Single source of truth for ALL table-OBJECT work: `docs/ROADMAP_TABLE_3D_PERFECTION.md`.**
> This `.planning/` layer is only the GSD orchestration/state index over that document. When the
> two ever disagree, the SSOT doc wins; update this layer to match, never the reverse.

## Core Value

The **CARD is the absolute protagonist**; the object is castizo, warm, tactile, premium-DISCREET;
premium is expressed through **restraint and craft, never richness or spectacle**; reward = rareza
+ carta + alma, **NEVER money**. The protected reference is **never degraded**. If everything else
fails, identity (anti-casino, card-first, castizo, warm) must hold.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ M1 — cards as protagonist (real Fournier faces, staged Perla hand) — shipped-local (on-device
  operator gate still OPEN → re-confirmed at TP0.0 before any materiality work).

### Active

<!-- The "MESA TERMINADA" Definition of Done (SSOT §8). Building toward all 14. -->

- [ ] FELT reads as real woven baize (nap sheen + micro-relief normal), in-palette, mark born-in, relights (no baked vignette).
- [ ] CARDS are unambiguous protagonist: razor-legible at POV, physical card STOCK, cards-vs-chips screen-area ≥ 2×.
- [ ] CHIPS read as matte worn clay, demoted/recessive, AND instanced within the perf ceiling.
- [ ] RAIL/CONTOUR elegance adjudicated (recovered OR consciously kept-with-craft); welt; normalMaps; brass = aged-brass NOT gold.
- [ ] LIGHTING is one coherent shaped warm gradient (no cone, no bloom, no cold void); per-material restrained specular; felt green-bounce.
- [ ] SHADOWS/GROUNDING honest: PCSS soft shadows + baked ContactShadows; crevice/inter-object AO under every card/chip (delivered by TP6).
- [ ] DEPTH photographic & restrained, ON the table only: N8AO + whisper DOF (hero tack-sharp) + edge vignette/fog + faint grade; NO bloom.
- [ ] COMPOSITION no dead zones: CENTER-OF-TABLE table-STATE only; cards>board>rail layering; NO per-seat/occupant object anywhere.
- [ ] CAMERAS: 2–3 canonical money shots LOCKED (deterministic), operator-blessed.
- [ ] FEEL: sub-conscious micro-life (felt-not-seen, < ~0.5°), frozen under capture + reduced-motion.
- [ ] PERF GUARDRAIL met: HERO draw calls < 150; `?chips=full` < 220; frame-time < 8 ms vsync-OFF on the RTX 4060.
- [ ] REFERENCE INTEGRITY: protected tag never degraded; NEW protected reference tag created, old retained.
- [ ] METRIC INTEGRITY: every §4.5 metric validated against positive+negative control frames before gating.
- [ ] VERDICT: AAA scorecard all-green (every element ≥ 4/5), all metrics pass simultaneously, operator unambiguous on-device final yes.

### Out of Scope

<!-- SSOT §1 OUT list + §5.5 deny-list. Explicit boundaries — do not re-add. -->

- Sala castiza / room / interior / backgrounds enhancement — later program (floor-pool + backdrop sphere are FROZEN baseline; neither enhanced nor removed).
- Decoración / props / lamps-as-objects — out of the table-OBJECT scope.
- Advanced FX: particles / volumetrics / god-rays / **bloom** — bloom is the #1 casino trap, hard-banned.
- Audio · game/Colyseus integration — separate programs.
- **Mobile perf as a deliverable** — here it is only a GUARDRAIL (the ≥55–60 fps mobile gate is the other program's M6).
- **Full human-figure / occupant / per-seat modeling** — `?seats` stays opt-in/experimental/never default; NO per-seat object anywhere.
- Engine / gameplay / card-geometry changes — FROZEN.
- Redrawing the Fournier card faces — NEVER; the ornate casino-badge `logo.png` stays OFF the felt.

## Context

- **Branch:** `spike/table-3d-hero` @ `e6b0726` baseline; protected tag `table-3d-premium-reference-2026-06-04` + checkpoint `table-3d-lab-checkpoint-2026-06-04` present.
- **Stack:** `three ^0.169` · `@react-three/fiber ^8.17` · `@react-three/drei ^9.114` · `gsap ^3.12.5`. `postprocessing` + `@react-three/postprocessing` NOT installed (TP6 installs them). `maath` absent (TP8 adds if needed). No SSIM/pixelmatch/OCR lib (use sharp MSE proxy + px-height + manual confirm).
- **Harness:** `.dev-stack/lab-shot.mjs` (Playwright, real D3D11 GPU, `--use-angle=d3d11 --enable-gpu`, auto `spin=off`, viewport 1440×900 @ DPR2 → 2880×1800 PNG). `.dev-stack/` is **gitignored** → TP0 MUST persist the anchor corpus to a tracked location (`docs/table-3d/anchors/`).
- **Scene today:** premium oval table + M1 cards (community `[1E,12C,11B]` + hole = Perla de Oros `[10O,7O]`, all face-up) + demoted accent pot. 12 camera presets incl. `card`/`hero`/`macro`.
- **Eval rig (frozen at TP0):** 3 money shots HERO(fov 32) / POV(fov 37, operator may revert to 40 once) / MACRO(fov 26); frozen staged scene; 15-element 0–5 scorecard; 12-metric kit (SSOT §4).

## Constraints

- **Identity / anti-casino (hard NO)**: no casino / Vegas / neon / crypto / slots / ostentatious gold / glow / bloom / jackpot / spotlight-cone / gaming-UI energy. Brass-not-gold (metric M4); felt green in-palette (M3); warm color temperature.
- **Deploy/Git**: **NO push / deploy / merge without explicit operator confirmation** (Chiribito manual-deploy policy, Vercel team `chiribito293-7173`). Atomic LOCAL commits only. Per-phase rollback tag `tp<n>-before-<slug>` BEFORE each phase.
- **Perf (guardrail, not deliverable)**: HERO/POV/MACRO < 150 draw calls; `?chips=full` < 220; frame-time < 8 ms vsync-OFF on the RTX 4060 with full `?fx`. Measure every phase (`renderer.info` + `?stats`). A phase that regresses perf below floor without a clear win does not ship.
- **Reference never degraded**: protected tag immutable, superseded only by explicit operator promotion at TP9; old tag retained forever.
- **Reversibility**: every experiment opt-in via a query flag, revertible in one commit. Roll back when a gate fails AND 1–2 fix iterations don't resolve it (per-phase disposition table, SSOT §5.3). Global escalation cap: ≥3 phases roll back to "keep current", OR any BLOCKING phase fails, OR stuck-iteration budget exceeded → HALT and escalate to operator.
- **Strict table-OBJECT scope + anti-occupant deny-list**: table-state staging is CENTER-OF-TABLE ONLY (deck stub + dealer button, at most a center discard). FORBIDDEN: any per-seat object.
- **Stop-on-ambiguous (DEFAULT STOP)**: one perceptual variable per gate; micro-phases; reversible single commits. Ambiguous operator brain-reaction → STOP, do not escalate "one more rung". Fill the 6-point pre-change format (SSOT §10) before each phase.
- **Eval rig frozen at TP0, never mutated mid-program**; apples-to-apples capture at EVERY gate; metrics admitted to the gate-set only after passing positive+negative control frames.
- **Lab isolation**: re-verify at TP9 that there is no `table-lab` input in `vite.config.ts` (lab stays out of the prod build).

## Key Decisions

<!-- Decisions that constrain future work (folded in from the SSOT red-team). -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SSOT = `docs/ROADMAP_TABLE_3D_PERFECTION.md`; this `.planning/` is only an orchestration index | Avoid drift / re-litigation; the doc is the architected+red-teamed plan | ✓ Good |
| TP0→TP9 mapped to GSD Phase 1→Phase 10 (Phase = TP + 1) | Avoid the JS falsy-zero hazard of "Phase 0"; each phase name carries "TPx" | ✓ Good |
| Cameras decided at TP0 (frozen), only CONFIRMED at TP7 | No mid-program re-baseline; all TP1–TP6 share TP9's framing | ✓ Good |
| MSE-as-SSIM-proxy (sharp); legibility = px-height + manual confirm (NO automated OCR hard gate) | No SSIM/OCR lib installed; keep the instrument cheap and real | ✓ Good |
| ALL screen-space / crevice AO is owned by TP6 (not TP5) | TP5 owns only light+shadow grounding with no postprocessing | ✓ Good |
| No face-down 6th card added to the Perla hand | Keep the frozen 5-card scene immutable so the SSIM/MSE anchor stays valid | ✓ Good |
| Center-of-table table-STATE only (deck stub / dealer button / center discard) | Anti-occupant deny-list; depth/social from rendering, never a room/people | ✓ Good |
| Each phase's operator perceptual gate = a HUMAN verification checkpoint (the GSD↔Chiribito seam) | Combine GSD autonomous orchestration with Chiribito's manual perceptual validation, NOT replace it | ✓ Good |
| POV fov 37 (vs 40) — ONE allowed TP0 preset refinement, then locked | Reduce near-card stretch while keeping protagonist large; operator confirms at TP0 | — Pending (operator) |
| ACES (default) vs AgX/Neutral tone-map finalized at TP9 | AgX only if ACES washes low-contrast textures | — Pending (TP9) |

---
*Last updated: 2026-06-09 after GSD bootstrap of the Table 3D PERFECTION program.*
