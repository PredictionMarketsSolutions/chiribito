# Phase 6: TP5 — Iluminación & Sombras (unify under one warm light) - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning
**Mode:** Autonomous discuss (SSOT-grounded from `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP5; operator's recorded intent). Operator gate = the human seam — but per the operator's standing "auto-approve (0 paradas)" directive for this milestone run, the gate is auto-approved IF the hard gates are green AND the visual read is good; ambiguous → SSOT default-stop + flag for batch review.

<domain>
## Phase Boundary

TP5 shapes the warm key into a **gentle warm gradient that keeps the WHOLE table read (NOT a casino-cone pool)**, adds **per-material specular** + **felt green-bounce**, and upgrades grounding with **PCSS soft shadows + baked ContactShadows** — so every TP1–TP4 material reads under ONE coherent warm light with honest contact and zero casino harshness.

**HARD invariants (SSOT §TP5 + red-team):**
- **TP5 owns ONLY light + shadow grounding with NO postprocessing.** ALL screen-space / crevice AO moves to **TP6** (red-team #2). No bloom (M7), no SSAO, no vignette-as-postFX here.
- **NO casino cone:** never a single hard white cone over dark. A `key-to-fill ratio ceiling` so the key can NEVER collapse to a cone; the existing decay-0 + generous-fill rig is the FLOOR it must not breach. Keep generous warm fill + high penumbra.
- **PER-MATERIAL specular only — NOT a global IBL/exposure bump** (red-team #13). Crisp SMALL highlights on chips/brass/rim/card-edges WITHOUT tipping wood→wet or brass→gold. **Re-run M4 brass at the END of TP5** (the new speculars must not push brass to gold).
- **NO new shadow-casting light** added (perf guardrail). The single existing shadow-caster stays the only one.
- Warm key ~`#fff1d6`; rim only LIGHTLY cool. Lift crushed blacks into a WARM graded shadow (metric +A warm-corner floor) — never a cold void.
- Touch ONLY `frontend/src/lab/` (the light rig + per-material specular params + shadow setup) + `tools/table-3d/` check helpers. Do NOT change geometry (felt/cards/chips/rail/body profiles), cameras (frozen), or the material identities — only their specular response + the lights/shadows.
- **LOCAL only** — no push / deploy / merge.

**Non-blocking rollback (flag):** ship the grounding upgrades (PCSS + baked ContactShadows + warm shadow floor); **keep the prior flat-warm key if the pool-shaping fails** (reads as a spotlight). The grounding and the key-reshaping are separable.

**Out of scope / deferred:** screen-space + crevice AO → **TP6**; depth/composition → TP6; postprocessing → later; the final brass aging lighting pass is part of TP5's per-material specular (M4 re-run at END).
</domain>

<decisions>
## Implementation Decisions

### SSOT-locked (operator's recorded intent)
1. **Key as warm gradient toward the rail** with generous fill PRESERVED — enforce a `key-to-fill ratio ceiling` (cannot collapse to a cone). Warm/cool dimensionality via a LOW cool fill opposite + a light rim/kicker. Warm key ~`#fff1d6`.
2. **Per-material specular tuning** (each material's own specular/clearcoat/roughness response, NOT a global IBL/exposure): chips, brass, rim, card-edges throw crisp SMALL highlights; wood must NOT go wet, brass must NOT go gold. M4 brass re-run at END must PASS.
3. **Felt green-bounce** onto object undersides (subtle GI — a low green bounce/fill from the felt, not a lamp).
4. **Apron/rail outer wall lit as a VOLUME** (top-highlight → underside-shadow) — this resolves "table floats" (red-team #7; it's a lighting fix, the geometry already exists from prior phases).
5. **Grounding (the must-ship deliverable):**
   - drei `SoftShadows` (PCSS): size 25–35, samples ~16, focus 0 — contact-hard near / soft far. **Inject ONCE** (PCSS recompiles shadow shaders — don't toggle per-frame).
   - key `shadow-mapSize 2048` + tuned near/far + bias/normalBias (no acne, no peter-panning).
   - `ContactShadows frames={1}` (baked ONCE — removes the per-frame scene re-render → **M11 improves**), far/scale tuned to ground rail + body too. Lower ContactShadows opacity to avoid double-darkening with SoftShadows.
   - Lift crushed blacks into a WARM graded shadow floor (+A).
6. **A `?light=` (or similar) A/B flag** so the new lighting/grounding is apples-to-apples vs the prior rig (mirror the `?card=`/`?chips=`/`?rail=` precedent); document the flag map. The key-reshaping behind the flag is separately revertible from the grounding (the non-blocking split).
7. **Operator gate (last plan, `autonomous: false`)** at all 3 frozen money shots: every material under ONE warm motivated light, honest grounding, restrained highlights, no casino harshness / cold void.

### Anti-casino HARD gates (must PASS)
- NO single hard white cone (key-to-fill ceiling). NO bloom (**M7** = 0). **M5** highlight-clip PASS (small speculars present but not clipping). **M6** contact-shadow presence PASS under every object. **M4** brass PASS at END (no gold drift). **M11** improved (or not regressed) by `frames={1}`. No new shadow-casting light.

### Claude's discretion (within the locked frame)
- The exact light rig deltas (key cone angle/penumbra/decay, fill intensity/color, rim placement), the per-material specular values, the green-bounce mechanism (a low hemisphere/bounce fill vs a tinted fill), the PCSS + ContactShadows exact params — tuned at the capture step, kept restrained (anti-casino, anti-double-darken, anti-wet/gold risks).
- Plan/wave decomposition (grounding wave + key-reshaping wave + per-material-specular wave + green-bounce + operator gate last). The grounding ships independently of the key-reshaping (the non-blocking split).
</decisions>

<code_context>
## Existing Code Insights (frontend/src/lab/TableLab.tsx)

- `ContactShadows` already imported (drei). The scene already has a shadow-casting key (the TP2 work tuned its `shadow-radius`); `castShadow`/`receiveShadow` are wired on meshes + the chip `<Instances>`.
- There is a "low warm wash raking the table BODY" light (~L770) — the apron/plinth illumination the SSOT wants shaped as a volume.
- The existing rig is described as "decay-0 + generous fill" — the FLOOR the key-to-fill ceiling must not breach.
- Materials are `MeshPhysicalMaterial` (felt/cards/chips/leather/wood) + `MeshStandardMaterial` (brass) — each has its own specular/clearcoat/roughness to tune per-material (NOT a global bump).
- Shared normal-map helper, the metric kit (`tools/table-3d/` — M4 brass HSV, M5 highlight-clip, M6 contact-shadow, M7 bloom, M11 frame-time, +A warm-floor), the GPU-faithful capture harness `.dev-stack/lab-shot.mjs` (RTX 4060; ?cam=hero|card|macro) — all established.
- The `?card=`/`?chips=`/`?rail=` flag precedent (qp()) for the new `?light=` A/B.
</code_context>

<specifics>
## Risks (SSOT §TP5)
- Tight bright key over dark = the casino look → keep generous warm fill + high penumbra + the key-to-fill ceiling.
- SoftShadows + ContactShadows double-darken → lower ContactShadows opacity.
- PCSS recompiles shadow shaders → inject ONCE (not per-frame).
- Global specular tips wood→wet / brass→gold → per-material ONLY; re-run M4 at END.

**Success:** one coherent shaped warm light; per-material restrained specular + green-bounce; PCSS + baked contact ground every object; no casino harshness; M11 improved by `frames={1}`.
</specifics>

<deferred>
## Deferred Ideas
- Screen-space / crevice AO, depth/composition → **TP6**.
- Postprocessing (bloom/vignette/SSAO) — explicitly OUT of TP5.
- Multi-hand staging → TP8; diagnostic cams → TP7.
</deferred>
