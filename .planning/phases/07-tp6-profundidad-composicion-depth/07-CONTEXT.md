# Phase 7: TP6 — Profundidad & Composición (depth ON the table) - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning
**Mode:** Autonomous discuss (SSOT-grounded from `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP6). Operator gate auto-approved IF hard gates green AND visual read good (operator's standing "auto-approve (0 paradas)" directive); ambiguous → SSOT default-stop + flag for batch review.

<domain>
## Phase Boundary

TP6 installs the **restrained postprocessing stack (the FIRST time it exists)** for photographic depth ON/around the table — **N8AO + a whisper of DOF on the hole cards + table-edge vignette/fog + a faint filmic grade + grain** — and resolves **composition** (kill empty-felt zones via a CENTER-of-table game-STATE; lock cards>board>rail). **NO environment / room is built.** **TP6 owns ALL screen-space / crevice AO** (it satisfies the grounding-crevice need deferred from TP1–TP5 — red-team #2).

**HARD invariants (SSOT §TP6 + red-team):**
- **NO Bloom mounted** (M7=0) — bloom is the #1 casino trap + a perf sink. NO glow halos.
- **DOF NEVER softens the hero** — the hole cards stay **razor-sharp (M1 HARD gate)**; only board/rail/accent fall gently soft.
- **Everything behind a `?fx` flag** — `EffectComposer` (enableNormalPass, MSAA 4) so it A/Bs (off vs on) and FREEZES for capture. Default may be ?fx-on (Claude's discretion) but the off-path must restore the exact pre-TP6 look.
- **Composition = CENTER game-STATE ONLY** — a face-down **deck stub** + a **dealer button** (+ at most a center discard). **NO opponent hand / per-seat object / props / room** (red-team #1; table-state must not creep to a scene).
- **Frozen backdrop / cameras / geometry untouched** — only grade/AO/DOF/vignette/fog/grain + the center game-state objects. Tune the EXISTING fog (don't build an environment).
- **Postprocessing is the main desktop-fps drop** — measure each effect's cost; **M11 within floor**; cut the weakest effect if perf breaches.
- Touch ONLY `frontend/src/lab/` + `tools/table-3d/` + `package.json` (the two new deps). **LOCAL only** — no push/deploy/merge.

**INTEGRATION CONCERN (must handle):** TP6 ADDS `EffectComposer`, but the TP5 `grep-check-tp5-06.cjs` CHECK asserts **no EffectComposer** in lab source (a TP5-era M7/anti-postprocessing proxy). TP6 SUPERSEDES that: the invariant becomes **"EffectComposer present (TP6) but NO Bloom."** The plan MUST update/relax the TP5 grep-check's no-EffectComposer assertion to a no-Bloom assertion (or supersede it) so the TP5 check doesn't false-fail once TP6 mounts the composer — while keeping the M7 no-bloom guard intact. Author a `grep-check-tp6-*.cjs` asserting EffectComposer+effects present AND no Bloom import/JSX.

**Non-blocking rollback (flag):** cut the weakest effect; keep the table fully usable without `?fx`.

**Out of scope / deferred:** building an environment/room (forbidden); cameras → **TP7**; multi-hand/per-seat staging → **TP8**; final scorecard → TP9.
</domain>

<decisions>
## Implementation Decisions

### SSOT-locked
1. **Install deps:** `@react-three/postprocessing` + `postprocessing` (currently absent — a package install; both are the canonical pmndrs/drei-ecosystem libs, legitimate). `EffectComposer` with `enableNormalPass` + MSAA 4, behind `?fx`.
2. **N8AO** — aoRadius 0.5–1.5 (world), intensity 1.5–3, distanceFalloff 0.5–1: honest crevice darkening under cards/chips/rail (this is the AO owed since TP5). No halos (radius right), not no-effect.
3. **DepthOfField** — focusDistance tied to the hole-card world position, bokehScale 1.5–3: hole cards **razor-sharp (M1 HARD)**; board/rail/accent gently soft. DOF must NEVER soften the hero.
4. **Vignette** — offset 0.3–0.5, darkness 0.5–0.8, restrained (**M8 band 8–20%**) + tune the EXISTING fog so the FAR rail reads as air (frozen backdrop untouched).
5. **Filmic grade + grain** — Noise opacity 0.02–0.05; warm-lifted shadows; gentle highlight roll-off (→ +A). Faint, not an Instagram filter.
6. **Composition** — kill empty-felt zones with a CENTER game-STATE ONLY: a face-down deck stub + a dealer button (+ at most a center discard). NO opponent hand / per-seat / props / room. Reinforce cards>board>rail via focus/exposure.
7. **Operator gate (last plan, autonomous:false)** at all 3 shots: `?fx` off vs on — cinematic-premium honest depth, hero tack-sharp, no dead zones, no glow/gimmick?

### Anti-casino / HARD gates (must PASS)
- **M7** no bloom (0). **M1** hero hole-cards razor-sharp (DOF must not soften — re-measure with ?fx on). **M8** vignette band 8–20%. **M6/crevice** AO honest darkening present (no halos). **M11/draw-count/fps** within floor (postprocessing is the fps drop — measure each effect, cut the weakest if it breaches). No glow halos.

### Claude's discretion (within the locked frame)
- The exact N8AO/DOF/vignette/noise params (tuned at capture, restrained); the ?fx default (on vs off) and the flag map; the deck-stub + dealer-button geometry/placement (center only, restrained); the per-effect wave decomposition; whether to measure-and-cut a weak effect.
- The grep-check transition (relax TP5's no-EffectComposer to no-Bloom; author the TP6 grep-check).
</decisions>

<code_context>
## Existing Code Insights
- NO postprocessing currently exists in `frontend/src/lab/` (the TP5 grep-check asserts EffectComposer absent — TP6 changes this).
- An existing **fog** is in the scene (to tune, not rebuild). The frozen backdrop + the 3 frozen money-shot cameras (fov32 hero / card / macro fov26) are LOCKED (TP0) — do not move them.
- The `?card=`/`?chips=`/`?rail=`/`?light=` flag precedent (qp()) for the new `?fx`.
- The metric kit (`tools/table-3d/`): M1 hole-card legibility (px-height + operator-confirm), M6 contact/crevice, M7 bloom, M8 vignette band, M11 frame-time/draw-count, +A warm-floor — plus the GPU-faithful harness `.dev-stack/lab-shot.mjs` (the `?fx` must FREEZE for a deterministic capture).
- The hole cards (the Perla: Sota + 7 de Oros) are the DOF focus subject + the M1 sharpness subject.
</code_context>

<specifics>
## Risks (SSOT §TP6)
- **Bloom = the #1 casino trap** (banned + perf sink) — never mount it.
- DOF too strong → soft hero fails M1 → keep the hero in the sharp plane, bokehScale restrained.
- AO radius wrong → halos or no-effect → tune aoRadius/distanceFalloff.
- Postprocessing = the main desktop-fps drop → measure each effect, cut the weakest if M11 breaches.
- Table-state creeping to props/room → CENTER game-state only (deck stub + button), nothing per-seat.

**Success:** restrained AO + whisper DOF + edge vignette/fog + grain = photographic depth ON the table only; hero razor-sharp; empty zones replaced by a shared mid-play read; no bloom; M11 within floor.
</specifics>

<deferred>
## Deferred Ideas
- Building an environment/room — forbidden in TP6.
- Cameras (formalize/lock the money shots) → **TP7**.
- Multi-hand / per-seat staging → **TP8**.
- Final AAA scorecard sign-off → **TP9**.
</deferred>
