# Phase 8: TP7 — Cámaras (lock the canonical money shots) - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning
**Mode:** Autonomous discuss (SSOT-grounded from `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP7). Operator gate auto-approved IF hard gates green AND visual read good (operator's standing "auto-approve (0 paradas)" directive); ambiguous → SSOT default-stop (KEEP TP0 presets) + flag for batch review.

<domain>
## Phase Boundary

TP7 is a **CONFIRMATION** phase, not a redesign. It **re-evaluates the TP0-frozen HERO / POV / MACRO camera presets against the now-finished table** (TP1 felt → TP6 depth) and **reconfirms them LOCKED**. Cameras were decided at TP0 — **NO mid-program re-baseline** (red-team #6). Optionally, add a **non-canonical, restrained cinematic flythrough** that FREEZES to the canonical still under the capture flag (opt-in; still-equivalent; never spectacle).

**HARD invariants (SSOT §TP7 + red-team #6):**
- **The 3 canonical presets are FROZEN (TP0).** Default outcome = reconfirm + KEEP. Do NOT invent new framing late; do NOT churn the presets. A tiny correction is allowed ONLY if a preset clearly FAILS on the finished table — but the default + stop-on-ambiguous is KEEP TP0.
- Presets stay **longer-lens, distortion-free, fovs in the ~50–85 mm-equiv product range, NEVER fisheye**. Top-down retained ONLY as a layout diagnostic, NEVER a hero.
- Protagonist composition holds: **hole cards = dominant lower-third mass, board mid-frame, rail framing, chips off-center accent.**
- **`autoRotate` OFF for capture (M9** determinism). **M1 / M2 still PASS** at the final HERO/POV (on the finished materials/light/depth).
- Any optional flythrough is **non-canonical + behind a flag + FREEZES to the canonical still** for capture (still-equivalent — no over-designed cinematic spectacle). It must NOT alter the 3 frozen money-shot presets.
- Touch ONLY `frontend/src/lab/` (camera confirmation + the optional flythrough flag) + `tools/table-3d/`. **LOCAL only** — no push/deploy/merge.

**Rollback:** keep the TP0 presets (the safe default).

**Out of scope / deferred:** multi-hand / per-seat staging + micro-life + social-read → **TP8**; final AAA scorecard sign-off → **TP9**; building an environment/room → forbidden.
</domain>

<decisions>
## Implementation Decisions

### SSOT-locked
1. **Re-evaluate + reconfirm** the 3 TP0 presets (HERO fov32 / POV-card fov40 / MACRO fov26 — confirm the actual locked values) on the finished table; record M1 (hole-card legibility) + M2 (cards-vs-chips) still PASS at the final HERO/POV; confirm the framing reads as the money shots of the finished table.
2. **Default = KEEP.** Reconfirm LOCKED. A correction is allowed ONLY if a preset clearly fails (distortion, hero softens, protagonist breaks) — and stop-on-ambiguous → keep TP0.
3. **`autoRotate` OFF for capture** (M9). The OrbitControls clamp (from the M1 refinement — flattering front arc) stays.
4. **Optional flythrough** (Claude's discretion whether to include): a restrained, non-canonical cinematic orbit behind a flag (e.g. `?fly`) that FREEZES to the canonical still for capture; still-equivalent; does NOT touch the 3 frozen presets. If it risks spectacle/churn, SKIP it (it is optional).
5. **Operator gate (last plan, autonomous:false)** at the canonical hero (+ the 3 shots): "is THIS the money shot of the finished table?" Stop-on-ambiguous → keep the TP0 set.

### HARD gates
- M1 hole-card legibility PASS at final POV/HERO; M2 cards-vs-chips ≥2x PASS; M9 autoRotate-off capture determinism; presets distortion-free in the mm-equiv range, never fisheye; the 3 frozen presets unchanged (or a recorded, justified, minimal correction only).

### Claude's discretion
- Whether to include the optional flythrough (default: include a restrained still-freezing one behind a flag, OR skip if it adds risk — Claude's call, kept restrained).
- The exact confirmation captures + the M1/M2 re-measure method on the finished table.
</decisions>

<code_context>
## Existing Code Insights (frontend/src/lab/TableLab.tsx)
- The camera presets behind `?cam=` (hero / card[POV] / macro + the diagnostic rail / conjunto / social cams). The frozen money shots = hero fov32, POV-card fov40 (locked at TP0; 37 discarded), macro fov26.
- The OrbitControls are CLAMPED to a flattering front arc (polar/azimuth limits, autoRotate off) from the TP0 M1 refinement — keep this.
- `autoRotate` should be OFF for deterministic capture (M9).
- The metric kit (`tools/table-3d/`): M1 (hole-card px-height + operator-confirm), M2 (cards-vs-chips), M9 (capture determinism) + the GPU-faithful harness `.dev-stack/lab-shot.mjs` (?cam=, ?spin=off).
- The full TP1–TP6 stack is now live (felt/cards/chips/rail/lighting/depth) — the cameras are re-evaluated against THIS finished table.
</code_context>

<specifics>
## Risks (SSOT §TP7)
- Late preset churn breaks continuity → avoided (TP0 froze them; default = keep).
- Over-designed cinematic move → spectacle → keep any flythrough still-equivalent + opt-in, or skip it.

**Success:** the canonical money shots are reconfirmed/LOCKED on the finished table; the eval framing is final for TP9; M1/M2 PASS; autoRotate off for capture.
</specifics>

<deferred>
## Deferred Ideas
- Multi-hand / per-seat staging, micro-life, social-read → **TP8**.
- Final AAA scorecard sign-off → **TP9**.
- New framing / new presets → forbidden (TP0-frozen).
</deferred>
