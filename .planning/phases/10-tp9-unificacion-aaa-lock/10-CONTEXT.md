# Phase 10: TP9 — Unificación & AAA Lock (verdict → new protected reference) - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning
**Mode:** Autonomous discuss (SSOT-grounded from `docs/ROADMAP_TABLE_3D_PERFECTION.md` §TP9 + §8). The FINAL phase. Operator FINAL gate auto-approved ONLY IF the scorecard is genuinely all-green (every element ≥4) AND all §4.5 metrics PASS simultaneously AND the orchestrator's CEO visual read across the 3 shots is an UNAMBIGUOUS "AAA/premium/castizo/clearly-better-than-the-reference" (operator's standing "auto-approve (0 paradas)" directive). **Per the SSOT, ANYTHING ambiguous or any below-green element / failed metric → DO NOT PROMOTE → flag for the operator's batch review + name the failing phase. The final AAA lock + the new-reference promotion are flagged PROMINENTLY for the operator's eventual on-device confirmation.**

<domain>
## Phase Boundary

TP9 is the **unification + AAA lock**: run the full multi-camera A/B, **drive the scorecard all-green (every element ≥4/5)**, finalize grade/tone-map consistency, confirm perf within guardrail, verify "mesa terminada" (§8) item-by-item, take the operator's FINAL gate, and **promote the finished table to the NEW protected reference** (a new git tag; the old TP0 protected tag is RETAINED FOREVER).

**HARD invariants (SSOT §TP9 + red-team DoD #2):**
- **Scorecard EVERY element ≥4/5.** If ANY element is below-green (<4), TP9 CANNOT promote — return to that phase (or, in this auto-run, FLAG it + name the failing phase for the operator). The total is recorded vs the TP0 baseline.
- **ALL §4.5 metrics PASS SIMULTANEOUSLY** at the 3 locked shots in a SINGLE consolidated run (M1/M2/M4/M5/M6/M7/M8/M9/M10/M11/M12/+A as admitted). A late grade tweak silently shifting an earlier gate is a risk → re-run the FULL matrix after any final grade change.
- **Full A/B matrix vs the CORRECT basis** (red-team DoD #2): NEW vs TP0-baseline; AND vs the M1 captures for card/composition/protagonist elements (the chip-centric protected tag lacks cards); AND vs the protected tag for felt/rail/chips/lighting.
- **Grade/tone-map consistency** across all 3 shots; the **ACES (default) vs AgX/Neutral decision finalized + recorded** (AgX ONLY if ACES washes low-contrast textures). Restrained — TP6 owns the postprocessing; TP9 only finalizes/records consistency.
- **Perf within guardrail** (M10 + M11) — per-phase perf creep is caught here.
- **"mesa terminada" (§8) checked item-by-item.**
- **Promote = a NEW git TAG (LOCAL only — NO push/deploy/merge; the new-reference tag is created locally; pushing/promoting remotely needs explicit operator confirmation, NOT given here).** The OLD TP0 protected tag is RETAINED. Update the SSOT roadmap doc to record the new reference.
- **Stop-on-ambiguous: ANYTHING ambiguous → DO NOT PROMOTE.** Promote ONLY on an unambiguous yes. Return to the named failing phase (or flag it).
- Touch ONLY `frontend/src/lab/` (ONLY if a final grade/tone-map consistency tweak is genuinely needed — else docs/metrics only) + `tools/table-3d/` + `docs/table-3d/`. **LOCAL only.**

**Rollback:** cannot promote on any below-green element / failed metric / ambiguous verdict → return to the named failing phase (or flag for batch review). The static-but-complete table stands either way.

**Out of scope:** any NEW materiality/lighting/depth/camera/motion work (those phases are DONE — TP9 unifies + locks, it does not add features); a remote push/deploy of the new reference (operator-confirmed, separate).
</domain>

<decisions>
## Implementation Decisions

### SSOT-locked
1. **Consolidated metric matrix:** ALL admitted §4.5 metrics in ONE run at the 3 locked shots (?cam=hero/card/macro, ?fx&spin=off frozen) — every one PASS simultaneously. Record the full matrix.
2. **Full A/B vs the correct basis** (red-team DoD #2): NEW vs TP0-baseline; vs M1 captures for cards/composition/protagonist; vs the protected tag for felt/rail/chips/lighting.
3. **Scorecard all-green:** every element ≥4/5; record post-TP9 + the total vs baseline. **If any element is <4 → FLAG + name the phase (do NOT promote).** Honestly re-assess the flagged TP6-aggressive lighting+tactility scores here (don't carry inflation into the AAA lock).
4. **Grade/tone-map:** finalize consistency across the 3 shots; record the ACES-vs-AgX decision (default ACES; AgX only if ACES washes low-contrast textures). If a tweak is made, RE-RUN the full matrix.
5. **Perf guardrail:** M10 (draw count) + M11 (frame-time) within floor at the locked shots (?fx-on cost noted, RTX 4060).
6. **"mesa terminada" §8 checklist** item-by-item (the researcher pulls §8).
7. **Operator FINAL gate (last plan, autonomous:false):** "AAA, premium, castizo, hand-fabricated table, and clearly better than the reference?" across all 3 shots + a live view. Promote ONLY on an unambiguous yes.
8. **Promotion:** create a NEW git tag (e.g. `table-3d-aaa-reference-2026-06-12` — Claude's discretion on the name) as the new protected reference, LOCAL; retain the old tag; update the SSOT roadmap doc. NO push.

### My (orchestrator) auto-approve posture for the FINAL gate
- Auto-approve + promote ONLY IF: scorecard all ≥4 AND all metrics PASS simultaneously AND my CEO visual read across the 3 shots is an UNAMBIGUOUS AAA/premium/castizo/clearly-better. Create the tag LOCAL.
- If ANYTHING is ambiguous / any element <4 / any metric fails → DO NOT auto-promote; FLAG prominently + name the failing phase for the operator's batch review (record a "ready-pending-operator-final-confirmation" state, do NOT fabricate an AAA verdict).
- Regardless, the final AAA lock is flagged for the operator's eventual on-device confirmation (it is the single most consequential gate; auto-approval here is transparent + reversible — the tag is LOCAL).

### Claude's discretion
- Whether any final grade/tone-map consistency tweak is needed (default: none — record consistency); the new tag name; the exact A/B matrix presentation.
</decisions>

<code_context>
## Existing Code Insights
- The full TP1–TP8 stack is live (felt/cards/chips/rail/lighting/depth/micro-life). The grade/tone-map: the TP6 BrightnessContrast grade + the renderer's tone-mapping (confirm ACES vs AgX/Neutral). The ?fx flag gates the postprocessing.
- The frozen captures are deterministic (spin=off + reduced-motion freeze). The metric kit (`tools/table-3d/`) has all admitted metrics + the consolidated runner; the harness `.dev-stack/lab-shot.mjs`.
- The TP0 protected reference tag (the old reference) + the M1 capture corpus (for the card/composition A/B basis) exist. The grep-check chain (tp8-09 = 18 checks) is the forward-carry base.
- `docs/table-3d/SCORECARD_TABLE_3D.md` (the 15-element scorecard — drive all-green; honestly reconcile the TP6-flagged lighting+tactility) + the SSOT §8 "mesa terminada" checklist.
</code_context>

<specifics>
## Risks (SSOT §TP9)
- Promoting a MARGINAL win → promote ONLY on an unambiguous yes (else flag).
- A late grade tweak silently shifting earlier gates → re-run the FULL matrix after any grade change.
- Per-phase perf creep caught only here → confirm M10+M11 guardrail.
- Carrying inflated scores into the AAA lock → honestly reconcile (esp. the TP6-flagged lighting+tactility).

**Success:** the table is declared AAA-complete; the new protected reference tag created (LOCAL); the SSOT doc updated; ready to hand off to the next big Chiribito area.
</specifics>

<deferred>
## Deferred Ideas
- A remote push/deploy of the new reference → operator-confirmed, separate (Chiribito manual-deploy policy).
- Any new feature work → the program is COMPLETE at TP9; new work is a new milestone.
</deferred>
