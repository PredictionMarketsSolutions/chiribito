# Phase 5: TP4 — Rail & Contour Elegance (the OPEN check) - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning
**Mode:** Autonomous discuss (SSOT-grounded — answers derived from `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP4, the operator's pre-recorded intent; no live grey-area pause per the operator's "autónomo sin parar" directive). The operator perceptual gate (05-04 / last plan) remains the human seam.

<domain>
## Phase Boundary

TP4 **adjudicates** the recorded rail/contour elegance question — *did the two-part rail + apron/plinth gain mass at the cost of the slim refined poker-table edge?* — as a **REVIEW, not an auto-revert**, and lands the flagged **craft details** that pass independently.

**HARD invariants (SSOT §TP4 + red-team #7):**
- The apron/plinth **BODY already exists** (`bodyProfile()`); the "table floats" read is a **LIGHTING problem fixed in TP5, NOT missing geometry**. TP4 may only **REFINE existing profiles — never ADD furniture mass.**
- **Auto-reverting to the slim rail is FORBIDDEN** (it discards validated mass). Any edge-slimming is *surgical + reversible* and must never delete the leather+wood material story or the mass.
- **Non-blocking, default-STOP**: if the elegance read is ambiguous, KEEP the current validated contour and ship only the independent craft upgrades that passed. The elegance-check may legitimately conclude "keep as-is."
- Touch **only** `frontend/src/lab/` (rail/contour geometry + wood/leather/brass materials/textures) + `tools/table-3d/` check helpers. Do NOT touch felt / cards / chips / cameras (frozen). `/table-lab.html` stays out of the production Vite build (SSOT §5.8).
- **LOCAL only** — no push / deploy / merge (Chiribito manual-deploy policy).

**Out of scope (deferred):** adding furniture mass (forbidden); the "table floats" grounding → **TP5** (lighting + PCSS/ContactShadows); screen-space / crevice AO → **TP6**; postprocessing → later.
</domain>

<decisions>
## Implementation Decisions

### SSOT-locked (operator's recorded intent — do NOT re-litigate)
1. **VERDICT FIRST.** Before any geometry edit, produce a structured side-by-side of the **frozen money shots** (current contour) vs the **recorded slim-rail reference set**, and record one verdict: **"edge elegance lost / acceptable / lost-in-specific-respect."**
   - Recorded **SLIM** references: `elev/00-base-wide`, `04-wood-wide`, `final-wide`.
   - Recorded **HEAVY** references: `elev/05-leather-wide`, `REFERENCE-wide`, `12-backdrop-wide`.
   - Only **if "lost"** → surgically slim `leatherProfile` / `woodCoamingProfile` / refine the outer profile toward edge thinness, **without** deleting the leather+wood material story or the mass; **reversible**.
2. **Craft details — each ships independently iff it passes on its own** (a failing one is dropped, not blocking):
   - **Welt / cord** at the felt-to-rail seam (hide the hard CG join).
   - **normalMaps** on wood + leather + brass via the **shared helper** (`heightToNormalMap` → `toNormalMapTexture`, **NoColorSpace**, the felt/card/chip precedent — never `srgb()`).
   - **Per-arc-length / tri-planar UV** so grain stops stretching at the oval long-ends.
   - **brass → aged-brass** within the **single locked M4 HSV target** (roughness 0.38–0.45, lower env) — **M4 brass PASS** (no drift to gold; casino-drift vector, SSOT §casino-drift).
   - Restrained **edge-wear** where arms rest.
   - The rail **outer wall reads as a curved volume** (top-highlight → underside-shadow), not a flat black band.
3. **Metrics / gates:** edge-thickness ratio (rail band height / felt radius) measured **before/after**; **M4 brass PASS**; **no perf regression** (M10 holds vs current). Material reads judged at HERO + a rail/eye view.
4. **Operator perceptual gate (last plan, `autonomous: false`)** at HERO + a rail/eye view: *"recovered edge elegance WITHOUT losing material/mass?"* Stop-on-ambiguous → DEFAULT STOP + KEEP current contour; ship only the passed craft upgrades.

### Claude's discretion (within the locked frame)
- The exact A/B flag mechanism — mirror the established `?chips=` / `?card=` pattern with a `?rail=` (or similar) flag so current-vs-refined contour + each craft lever is apples-to-apples comparable; document the flag map in the SUMMARY.
- Plan/wave decomposition (verdict plan first; craft levers grouped or split; the surgical edge-slim only if verdict=lost; operator gate last). One perceptual variable per gate where it aids the read, per the TP2/TP3 precedent.
- The precise normalMap strengths / welt geometry / UV method — tuned at the capture step, kept restrained (anti-fussy-welt, anti-noisy-wood-normals-under-clearcoat risks).
- Whether the verdict comes out "lost" / "acceptable" / "lost-in-specific-respect" is an **evidence-driven finding**, not pre-decided — record it honestly; "acceptable/keep" is a valid outcome that still ships the independent craft upgrades.
</decisions>

<code_context>
## Existing Code Insights (frontend/src/lab/TableLab.tsx)

- `leatherProfile()` (~L107): the padded leather rail you rest arms on; `rOut = FELT_R * 1.072` (~5.57), meets the wood coaming. Revolved cross-section.
- `woodCoamingProfile()` (~L131): the outer turned-wood coaming that frames the leather. Revolved cross-section.
- `bodyProfile()` (~L157): the table BODY — molded wood apron (`waist = FELT_R*1.085`) + plinth foot (`plinth = FELT_R*1.135`, fascia at y −1.44, chamfer onto floor). **This is the mass that ALREADY EXISTS — refine only, never add.**
- The rail is **two revolved cross-sections (leather + wood coaming) + the body**, scaled into the oval.
- Shared normal-map helper precedent: `normalMapHelper.ts` `heightToNormalMap` + `toNormalMapTexture` (NoColorSpace), already used by felt nap (TP1), card micro-relief (TP2), chip recessed-C (TP3) — the established pattern to mirror for wood/leather/brass.
- M4 brass HSV target is **locked at TP0** (aged-brass, not court-card gold) — the metric kit + `tools/table-3d/` checkers already encode it.
- Capture: GPU-faithful Playwright harness `.dev-stack/lab-shot.mjs` (RTX 4060 ANGLE D3D11) on an ephemeral vite port; frozen money shots `?cam=hero|card|macro` + a rail/eye view for the gate. Scratch → gitignored `.dev-stack/diag/`.
</code_context>

<specifics>
## Specific Ideas / Risks (SSOT §TP4)

**Risks to actively avoid:**
- Auto-reverting to the slim rail (FORBIDDEN — discards validated mass).
- Slimming too far → the table reads as a thin disc.
- Noisy wood normals under heavy clearcoat.
- A fussy / overworked welt.

**Success:** elegance adjudicated **with evidence**; the edge is either recovered OR consciously kept-with-craft; the craft details land; identity intact (poker-table furniture, premium via restraint, never casino).
</specifics>

<deferred>
## Deferred Ideas

- Adding furniture mass — **forbidden** in TP4.
- "Table floats" grounding → **TP5** (warm-key gradient + PCSS soft shadows + baked ContactShadows).
- Screen-space / crevice AO → **TP6**.
- Brass also gets a final lighting pass in **TP5** (per SSOT: "ages it at the END of TP5, not just TP4").
</deferred>
