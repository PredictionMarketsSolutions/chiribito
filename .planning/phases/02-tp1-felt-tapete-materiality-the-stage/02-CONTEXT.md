# Phase 2: TP1 — Felt / Tapete Materiality (the stage) - Context

**Gathered:** 2026-06-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Turn the felt — the largest, weakest surface (the "stage") — into believable woven baize that **relights**: a Charlie sheen lobe + a directional nap normalMap + restrained anisotropy, with the identity mark kept **born-in** the cloth, the green in-palette, and depth moved **out of baked albedo into material+light**. **Materiality ONLY** — grounding/shadows are TP5, depth/AO/vignette are TP6. The card stays the protagonist; the felt is the stage, never competing.

Built on the FROZEN TP0 baseline. The protected reference (`table-3d-premium-reference-2026-06-04` @ d17df37, in `docs/table-3d/anchors/reference-tag/`) is the FLOOR — the felt must NEVER regress below it.

</domain>

<decisions>
## Implementation Decisions

### Nap direction (the directional weave that makes the grazing sheen shift)
- **D-01:** Nap runs **concentric / oval-classic** — following the table's oval (the classic baize convention). The grazing-angle value shift (metric +B) reads as concentric weave around the felt, NOT linear and NOT radial-from-center.

### Sheen (Charlie lobe) — "fuzz, not satin"
- **D-02:** Sheen **present but contained → target ~0.65–0.75** (within the SSOT 0.6–0.85 band, deliberately mid-low). Explicitly AVOID a satin / modern-casino look. sheenColor = a slightly-lighter Chiribito green (per SSOT). Keep roughness 0.90–0.94 (anti-satin). The operator A/B at POV+MACRO is the judge.

### Edge-darkening (replacing the baked albedo vignette)
- **D-03:** **Very subtle — physical depth ONLY.** Remove the radial vignette baked into the felt albedo (`feltTexture` lines 492–497, black 0→0.5) and replace it with a light-RESPONSIVE micro edge-darkening that barely reads — just enough that the felt never regresses below the protected reference between TP1 and TP5/TP6. NOT a heavy premium vignette (heavier depth is TP6's job).

### MACRO inlay sharpness (the born-in mark + suits)
- **D-04:** **Raise the sharpness — prioritize money-shot visual quality.** The mark + 4 suits are baked into a 1024² canvas (soft at MACRO). Crisp them up — raise the felt canvas res and/or add a separate inlay-only map; the planner picks whichever gives the sharpest MACRO inlay (operator intent = visual quality at the money shots, memory cost secondary). The mark stays **born-in** (no floating decal; PlaneGeometry+alphaTest discipline; `polygonOffset` on the brass torus if any coplanar z-fight).

### North star (the operator's framing for the A/B gate)
- **D-05:** "Tapete **físico, castizo, táctil, premium** — sin deriva a Vegas/casino." The whole phase is judged against this: a calm, material-forward, tactile cloth.

### Claude's Discretion
- The nap normalMap construction (procedural height→normal vs tiled), the precise sheen/sheenColor within the band, the exact normalMap repeat (6–10) + normalScale (0.2–0.35), the anisotropy value (0.15–0.4), and the inlay-sharpness mechanism (canvas-res vs inlay-only map) — all HOW, left to research/planning within the SSOT ranges + D-01…D-05.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The spec (authoritative — doc wins on conflict)
- `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP1 (lines 268–289) — full TP1 objective, acceptance + metric thresholds (sheen 0.6–0.85, sheenRoughness 0.55–0.8, nap repeat 6–10 / normalScale 0.2–0.35, anisotropy 0.15–0.4, roughness 0.90–0.94), the materiality-only A/B gate, risks, non-blocking rollback.
- `docs/ROADMAP_TABLE_3D_PERFECTION.md` §5 — cross-cutting guardrails (anti-casino hard-NO, no push/deploy/merge without operator, per-phase rollback tag, eval rig frozen at TP0, lab out of prod build).
- `.planning/ROADMAP.md` Phase 2 — GSD orchestration index + success criteria.

### The frozen baseline + reference floor (TP0)
- `docs/table-3d/TP0_BASELINE.md` — frozen rig, presets (HERO fov32 / POV fov40 / MACRO fov26), perf baseline, freeze record.
- `docs/table-3d/anchors/reference-tag/{hero,card,macro}.png` — the PROTECTED reference (d17df37); the felt FLOOR.
- `docs/table-3d/anchors/head/{hero,card,macro}.png` — the TP0 HEAD baseline (the A/B "before").
- `docs/table-3d/SCORECARD_TABLE_3D.md` — felt baseline = 3 (TP1 success = felt **+≥2** → target ≥4).

### The eval kit (the gates TP1 must pass)
- `tools/table-3d/metrics.mjs` — M3 felt-hue (ΔE<12 from #1f9163/#147a51/#0a4a33), M5 highlight-clip, +B felt-specular ("fuzz" not "satin"); felt regions.
- `tools/table-3d/region-rects.json` — finalized fixed rects (feltHero, feltPov) the felt metrics read.
- `tools/table-3d/run-metrics.mjs` — capture-run + meta-gate runner.
- `.dev-stack/lab-shot.mjs` — GPU-faithful capture harness (RTX 4060 ANGLE D3D11; the A/B + freeze capture path).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/lab/textures.ts` `feltTexture()` (line 422): felt canvas (1024², `S=1024`). Base radial gradient = the M3 anchors (#1f9163→#147a51→#0a4a33, lines 436–438). Mark (logo, lr=r*0.34) + brass ring + 4 ace suits baked in (born-in). **Radial vignette baked into the albedo at lines 492–497 (black 0→0.5) — TP1 REMOVES this (D-03).** Inlay sharpness (D-04) raises S and/or adds an inlay-only map here.
- `frontend/src/lab/TableLab.tsx` felt material (~lines 369–375): currently `MeshStandardMaterial({ map: feltTexture, roughness: 0.93, metalness: 0, envMapIntensity: 0.3, alphaTest: 0.5 })` — **NO sheen / normalMap / anisotropy.** TP1 → `MeshPhysicalMaterial` (D-02 sheen, D-01 concentric nap normalMap, anisotropy, keep roughness 0.90–0.94). The `?felt=magenta|basic` debug hooks live here.
- Felt mesh: `<planeGeometry args={[FELT_R*2, FELT_R*2, 1, 1]}>` rotated −π/2 (~TableLab 430), inside the `scale={[OVAL_X,1,1]}` group (OVAL_X=1.22). **The nap UVs/tangents must account for the OVAL_X x-stretch so the concentric nap isn't distorted into an ellipse-brushed look.**

### Established Patterns
- **Procedural canvas textures** (`textures.ts`) → `THREE.CanvasTexture` (srgb / NoColorSpace helpers, anisotropy 8). The nap normalMap should follow this idiom or a shared helper.
- **Shared height→normal helper — FIRST USE** (per SSOT). Does NOT exist yet; TP1 introduces it as a shared util (researcher: confirm absence; planner: create it, reusable by TP4/TP5 normal maps).
- **Mark born-in discipline + z-fight caution**: PlaneGeometry + alphaTest (no floating decal); `polygonOffset` on the brass torus if any coplanar fight. (Z-fight lesson from TP0's hole cards — see `cards.ts` HOLE_STACK.)

### Integration Points
- The felt material is the only consumer of `feltTexture()`. Material/texture changes are isolated to `frontend/src/lab/`; the game tree is untouched.
- The eval kit reads the felt via the frozen presets + region-rects — re-run M3/M5/+B over a fresh HERO/MACRO capture after each felt iteration; A/B vs `anchors/head/` and never below `anchors/reference-tag/`.

</code_context>

<specifics>
## Specific Ideas

- North star (D-05): "tapete físico, castizo, táctil, premium — sin deriva a Vegas/casino."
- Concrete targets the operator set: nap **concentric/oval**; sheen **~0.65–0.75** (contained); edge-darkening **very subtle** (physical depth only); MACRO inlay **noticeably sharper** (money-shot quality first).

</specifics>

<deferred>
## Deferred Ideas

- **"Social" / lectura social** — the operator's north star said "social," but the shared mid-play social read is **TP8** (Tactilidad, Micro-vida & Lectura Social), not TP1. TP1's A/B gate is materiality-only. Noted so it's not lost.
- **Heavier depth / grounding / AO / pronounced vignette** — explicitly deferred: shadows/grounding = TP5, depth/AO/restrained-vignette = TP6. TP1 keeps edge-darkening barely-there (D-03).
- **Dual 2D-classic / 3D-immersive view-mode architecture** — a standing operator directive, its own future workstream (memory `chiribito-table-dual-view-modes`); not TP1.

</deferred>

---

*Phase: 2-TP1 — Felt / Tapete Materiality (the stage)*
*Context gathered: 2026-06-10*
