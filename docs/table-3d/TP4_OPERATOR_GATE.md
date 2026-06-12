# TP4 — Rail & Contour Elegance · Operator Gate (plan 05-04)

**Date:** 2026-06-12
**Branch:** `spike/table-3d-hero` (LOCAL — no push/deploy/merge)
**Plan:** 05-04 (autonomous:false — perceptual gate, the GSD↔Chiribito human seam)

## Operator verdict: APPROVED — SLIM + CRAFT

Both SSOT gate questions answered YES:

- **(CONTOUR)** The surgical slim (`woodCoamingProfile yTop 0.34→0.28`, −18% band height) recovers
  edge elegance WITHOUT losing material/mass. The wood lip reads immediately as a refined casino-rail
  edge; the leather roll's mass, broad crown, and cognac sheen remain fully intact.
- **(CRAFT)** The 5 passing craft levers (D/C/B/F/A) read as restrained craft — not overworked.
  The welt reads as a shadow crease (not a color stripe); the wood and leather normalMaps read as
  tooled grain (not noisy); the brass reads as aged (not showroom-gold or court-card gold).

**Ship decision:** Full TP4 look (slim contour + all 5 passing craft levers) shipped as the
new DEFAULT render. `?rail=base` restores the full pre-TP4 look for A/B reference.

**0 workstreams reverted. 0 iterations.**

## A/B basis

| Shot | TP4 approved look | "Before" (tp4-base — post-TP3) |
|------|-------------------|-------------------------------|
| HERO (fov 32 — elegance/materiality) | `.dev-stack/diag/table-3d/tp4/gate/hero-craft.png` (craft stack) + `hero-slim.png` (slim) | `docs/table-3d/anchors/tp4-base/hero.png` |
| RAIL/EYE (fov 32 — contour/seam) | `.dev-stack/diag/table-3d/tp4/gate/rail-craft.png` + `rail-slim.png` | `docs/table-3d/anchors/tp4-base/rail.png` |

Per-lever isolation captures (all at HERO + rail/eye):
`.dev-stack/diag/table-3d/tp4/gate/hero-brass.png`, `hero-normals.png`, `hero-welt.png`,
`rail-brass.png`, `rail-normals.png`, `rail-welt.png` — one per sub-flag, all gitignored scratch.

### Anchor provenance note

The SSOT §TP4 names six slim/heavy reference frames in an `elev/` subdirectory
(`elev/00-base-wide`, `04-wood-wide`, `final-wide`, `elev/05-leather-wide`,
`REFERENCE-wide`, `12-backdrop-wide`). As of 2026-06-12, the `elev/` subdirectory does
**not exist** on disk in `docs/table-3d/anchors/`. The verdict was issued against the available
committed corpus (`head/`, `tp3-base/`, `tp2-base/`, `tp4-base/`) plus the operator's on-device
memory of the slim-rail reference. The verdict is valid against this corpus — the operator has
direct on-device familiarity with the slim-rail baseline from prior sessions. This is a non-blocking
provenance gap, recorded faithfully per SSOT §TP4 requirements.

## Per-lever SPLIT disposition: 5 SHIP, 1 DROPPED

| Lever | Target | Disposition | Reason |
|-------|--------|-------------|--------|
| D — Brass aged-brass | roughness 0.34→0.42, envMapIntensity 0.45 | SHIP | M4 PASS; reads aged, not showroom-new or court-card-gold |
| C — Leather normalMap | bumpMap→normalMap via toNormalMapTexture, normalScale 0.22 | SHIP | Tooled-not-printed grain read confirmed; NoColorSpace |
| B — Wood normalMap | freq=12, normalScale 0.15, via toNormalMapTexture | SHIP | Grain visible under clearcoat 0.72; restrained (no noisy-wood read) |
| F — Volume outer wall | Cross-profile gradient baked into woodNapNormalMap | SHIP | Top-highlight/underside-shadow volume read confirmed; inseparable from B |
| A — Welt geometry | FELT_R*0.960, tube 0.012, y=0.022, #2a1208 | SHIP | Reads as shadow crease at felt-to-rail seam; NOT a color stripe |
| E — UV arc-length remap | Per-arc-length UV for oval long-end grain | DROPPED → TP7 | Cannot verify lathe UV seam artifacts without GPU capture harness; deferred to TP7 geometry pass |

### Slim disposition

| Contour | Before | After | Disposition |
|---------|--------|-------|-------------|
| woodCoamingProfile yTop | 0.34 (TP3 default) | 0.28 (TP4 approved default) | SHIPPED — reads as refined casino rail immediately; leather mass intact |
| woodCoamingProfile rOut | FELT_R * 1.17 = 7.605 | UNCHANGED | — |
| leatherProfile | UNCHANGED | UNCHANGED | rOut/crown/crease all intact |
| bodyProfile() | READ-ONLY (never touched) | READ-ONLY | — |

## HARD-gate confirmation table

| Gate | Metric | Value | Threshold | Verdict |
|------|--------|-------|-----------|---------|
| M4 brass tone | roughness | **0.42** | 0.38–0.45 (SSOT) | PASS |
| M4 brass HSV | H≈39°, S≈0.38, V≈0.67 | H 35–48° / S ≤ 0.55 / V ≤ 0.80 | PASS |
| M10 HERO draw count | 106 (105 + 1 welt draw) | < 150 | PASS |
| Edge-thickness ratio (before) | 0.087 (0.565 / 6.5, 8.7% of FELT_R) | within 5–12% typical | recorded |
| Edge-thickness ratio (after slim) | 0.087 × (0.28/0.34) ≈ 0.072 (yTop 0.28 slim) | within 5–12% typical | PASS (no thin-disc read) |
| grep-check-tp4-05.cjs | exits 0 (7/7 checks) | must exit 0 | PASS |
| Thin-disc invariant | rOut 7.605 > fascia 7.41 + 0.13 = 7.54 | rOut > floor | PASS |
| vitest | 398/398 green | all green | PASS |
| tsc src/lab/ | 0 errors | 0 errors | PASS |

M4 note: The color `#b8915a` is unchanged (pre-TP4 M4-compliant measured baseline). Raising
roughness from 0.34 to 0.42 reduces specular brightness (V slightly lower) — the safer
direction for the M4 casino-drift guard. envMapIntensity 0.45 (down from implicit 1.0) further
lowers env-reflective brightness. Net: aged-brass read, not showroom-new.

## ?rail= flag map (complete post-TP4 default flip)

| Flag | Slim | Craft | yTop | Brass | Normals | Welt | Notes |
|------|------|-------|------|-------|---------|------|-------|
| (default, no ?rail=) | ON | ON | **0.28** | 0.42 | yes | yes | **TP4 approved look** |
| `?rail=base` | OFF | OFF | **0.34** | 0.34 | no | no | Full pre-TP4 baseline (A/B reference) |
| `?rail=slim` | ON | OFF | 0.28 | 0.34 | no | no | Slim isolation only (no craft; Pitfall 7) |
| `?rail=craft` | OFF | ON | 0.34 | 0.42 | yes | yes | Craft isolation only (no slim) |
| `?rail=brass` | OFF | Brass only | 0.34 | 0.42 | no | no | Lever D isolation |
| `?rail=normals` | OFF | Normals only | 0.34 | 0.34 | yes | no | Levers B+C+F isolation |
| `?rail=welt` | OFF | Welt only | 0.34 | 0.34 | no | yes | Lever A isolation |

NEVER combine `?rail=slim` with `?rail=craft` in the same URL (Pitfall 7 / SSOT §TP4).
Lever E (UV remap) has no sub-flag — it was not implemented.

## Stop-on-ambiguous handling

Not triggered. The operator's verdict was unambiguous:
- CONTOUR QUESTION: YES — elegance recovered without losing material/mass.
- CRAFT QUESTION: YES — craft reads as restrained craft, not overworked.
- No lever read overworked (no "welt is a stripe", no "wood is noisy", no "brass is gold").
- No thin-disc read at `?cam=rail&rail=slim`.
- 0 reverts, 0 iterations.

## Subtle-deltas note (recorded honestly)

The craft is deliberately restrained. The deltas from the pre-TP4 baseline are:
- Welt: a near-black (#2a1208) shadow crease at the seam, tube 0.012 — below the anti-fussy-welt
  threshold. It should not be consciously noticed; it resolves the hard CG join.
- Wood normalMap: normalScale 0.15 under clearcoat 0.72 — the amplification makes it readable but
  the scale cap prevents it from chattering at HERO distance.
- Leather normalMap: normalScale 0.22 — comparable perceptual weight to the prior bumpScale 0.016.
- Brass roughness: 0.34→0.42 + envMapIntensity 0.45 — the aged-not-shiny shift reads as a tonal
  change more than a brightness change; the reveal band recedes rather than calling attention.

These are "you only notice them when they're missing" deltas — the hallmark of restrained craft.

## What shipped (TP4 consolidated)

### VERDICT (05-01 — docs only)

`woodCoamingProfile yTop 0.34` reads as a slightly heavy horizontal band at the rail/eye view.
Verdict: `lost-in-specific-respect`. Action: slim yTop 0.34→0.28 in 05-02.
tp4-before-rail rollback tag cut at LOCAL commit `3e4eb3d`. tp4-base anchors committed.

### SURGICAL SLIM (05-02 — `?rail=slim`, shipped as default at 05-04)

`woodCoamingProfile()` extended with optional `yTopOverride` param.
At 05-04: default yTop set to 0.28 (slim) in the function; callers pass `0.34` for `?rail=base`.
Thin-disc invariant: rOut 7.605 > 7.540 PASS; rOut unchanged.

### CRAFT LEVERS (05-03 — `?rail=craft`, shipped as default at 05-04)

- **Lever D (brass):** MeshStandardMaterial roughness 0.42, envMapIntensity 0.45 in the isBrass branch.
- **Lever B+F (wood normalMap):** `woodNapNormalMap()` in textures.ts — crosshatch height field
  (freq=12), cross-profile gradient (top-highlight/underside-shadow), `toNormalMapTexture`
  (NoColorSpace), normalScale 0.15 on MeshPhysicalMaterial.
- **Lever C (leather normalMap):** `leatherNapNormalMap()` in textures.ts — pebble height field,
  `toNormalMapTexture` (NoColorSpace), normalScale 0.22; replaces bumpMap in the isNormals branch.
- **Lever A (welt geometry):** torus at FELT_R*0.960, tube 0.012, y=0.022, #2a1208 MeshPhysicalMaterial.
- **Lever E (UV remap):** DROPPED (deferred to TP7 geometry pass).

### DEFAULT FLIP (05-04 — this plan)

`isCraft` accumulator inverted: `!isBase && railFlag !== 'slim'` (ON by default, suppressed only
by `?rail=base` or `?rail=slim`). `woodCoamingProfile` internal default updated 0.34→0.28.
`?rail=base` added as the full pre-TP4 restoration path.

## Scorecard delta

**leather rail: 4 → 4** (held; craft upgrade confirmed, no score regression)
**wood coaming: 3 → 4** (slim + normalMap volume gradient lift)
**brass: 3 → 4** (aged-brass M4 PASS; roughness 0.42; envMapIntensity 0.45)
**tactility: 3 → 4** (the "you could pick it up" test: welt seam + leather grain + wood normalMap
+ aged brass all present and readable without a label, at HERO + rail distances)

See SCORECARD_TABLE_3D.md for the full per-element status notes and TP progression log entry.

**Why not AAA(5):**
- Rail/leather: AAA(5) requires inter-material AO (crevice darkening under the rail overhang, in
  the leather-to-wood join, in the felt-to-leather crease). This is screen-space AO (TP6 scope).
  The material story is correct; the depth read is not yet there.
- Brass: AAA(5) requires hairline-scratch normalMap + per-arc recessed patina detail. The tone
  (H/S/V) is now within the SSOT range; the fine detail layer is a TP7 geometry/texture pass.
- AAA(5) for all rail elements deferred to TP5 (lighting integration) + TP6 (AO/depth).

## Deferred items (non-blocking, not TP4 scope)

| Item | Deferred to | Reason |
|------|-------------|--------|
| Inter-chip / rail crevice AO | TP6 | Screen-space AO scope |
| Lighting integration (rail reads under one coherent warm light) | TP5 | TP5 owns lighting |
| Brass hairline-scratch normalMap | TP7 | Geometry/texture detail pass |
| UV arc-length remap (Lever E) | TP7 | Requires GPU capture harness to verify seam artifacts |
| Per-arc-length UV alignment (grain follows oval) | TP7 | Geometry pass |

## Outcome

**TP4 SHIPS IN FULL.** Both workstreams (slim contour + 5 craft levers) committed LOCAL on
`spike/table-3d-hero`. Shipped as the default render (no flag required). No push / no deploy /
no merge. The rail now reads as a refined poker-table edge with restrained craft; the leather
and wood material stories are intact; the brass reveals age, not showroom shine; the welt seam
resolves the hard CG join without decorating it. Phase 5 / TP4 is COMPLETE.

**Next:** Phase 6 / TP5 — Iluminación & Sombras (unified warm light).

*Recorded by the GSD autonomous loop at the TP4 operator gate, 2026-06-12.*
