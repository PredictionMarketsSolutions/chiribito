# Chiribito — Gameplay Readability Diagnostic Design

> Spec written 2026-05-19 against HEAD `0acfb1f`.
> Status: design approved by user across five sections; awaiting written-spec review before transition to writing-plans skill.
> Predecessor specs (in chronological order): `2026-05-18-chiribito-visual-audit.md` → `2026-05-18-chiribito-slice-A1-chrome-cleanup-design.md` → `2026-05-18-chiribito-slice-A2.0-sidebar-debug-design.md` → `2026-05-18-chiribito-runtime-diagnostic-design.md` (Phase A+B+C+D-Primary SHIPPED) → Compact Density Pass (shipped, captured in `docs/HANDOFF_COMPACT_DENSITY_PASS.md`) → `2026-05-19-chiribito-perceptual-framing-pass-design.md` (hypothesis B runtime-falsified, NOT shipped).

---

## Nature of this sprint

This is **not** a UI fix sprint, not a tuning sprint, not a redesign sprint.

This is **perceptual research / gameplay cognition study / runtime visual behavior analysis**.

The artifact produced is understanding, not code. The companion is "AI structurally maps human perception already observed", not "AI interprets UX".

The framing is observation-first, theory-second. **The largest risk in this sprint is not "failing to find problems" — it is inventing or inducing problems that do not really exist perceptually.**

---

## Goal

Understand what the human eye actually does inside Chiribito's real runtime. Identify which perceptual driver(s) are responsible for the residual signals — "manos illegible" / "acción no salta" / "tensión perceptual insuficiente" — through observation-first methodology, never through theory-first hypothesis selection.

The sprint succeeds when we have a small set of convergent findings (where the user's narrative AND structural overlay coincide) ranked by signal strength — or an honest declaration of absence-of-convergence.

### Why this sprint exists

The Perceptual Framing Pass (2026-05-19, same day) tested the hypothesis that surface-to-viewport ratio was the principal residual driver. Runtime probe L1 (+6% proportional scale) produced marginal improvement in perception of "presencia/cercanía" but did NOT resolve the principal user-perceived signals ("manos siguen leyéndose mal" / "acción no salta"). **Hypothesis B (framing/viewport ratio) was therefore falsified as the principal driver.** Sprint closed clean: zero commits, working tree restored, HEAD `0acfb1f` intact.

What remains unresolved is the perceptual mechanism behind the residual pains. Candidates surfaced during that sprint included:

- Focal hierarchy too flat
- Felt absorbing focus that should be on game elements
- Hole cards + board not forming a strong perceptual cluster
- Action dispersed perceptually across the surface
- Gameplay tension not communicated visually
- Action events not registering temporally

None of these are pre-selected as the primary hypothesis. **All of them are candidate emergent axes; only observation determines which survive.**

---

## Framing rules (locked across all sections)

1. **Observation-first, never theory-first.** No axis is pre-selected. No verdict is pre-anchored. Patterns must surface from user verbatim observation before they can be analyzed structurally.
2. **Convergence requirement.** A finding is only valid if user verbatim AND structural overlay independently surface the same pattern.
3. **Loudness emerges from observation, not self-report.** The user does not rank the three user-perceived pains a priori — loudness emerges from observation frequency and structural correlation.
4. **Absence of convergence is a valid outcome.** If after the full three-stage process no convergent finding emerges, the sprint closes honestly with that verdict. Forcing findings is a worse outcome than absence.
5. **No finding automatically implies actionable intervention.** Even a strong convergent finding may not justify a code change — it may require more validation, enter backlog, remain as open perceptual truth, or belong to a game-feel layer not yet understood.
6. **Constraint-conflict does not invalidate findings.** If a finding's obvious solution would break locked identity invariants, the finding is recorded as an unresolved constraint conflict, not erased. "If we can't fix it, then it doesn't exist" reasoning is explicitly forbidden.
7. **Emergent axes are working lenses, not permanent ontology.** Axes named in this sprint are contextual analytic tools, not "the official UX theory of Chiribito".
8. **The sprint does not attempt to produce a unified theory of gameplay readability.** Output is signals, constraints, convergent patterns, perceptual tension zones — not a totalizing model.

---

## User-perceived signals (verbatim — captured from this session)

Recorded verbatim from the user, immediately prior to this spec being written. Reproduced here so the diagnostic does not silently re-categorize them:

1. **"manos/jugadores siguen leyéndose mal"** — hole cards + opponent seats hard to read; element-class legibility.
2. **"acción no salta"** — gameplay events do not register visually; temporal salience absent.
3. **"tensión perceptual insuficiente"** — visual hierarchy too flat; no climax, no dramatic accent.

User-supplied candidate causes (not pre-ranked, not pre-selected):

- Focal hierarchy too flat
- Felt absorbs too much focus
- No strong perceptual cluster of hole cards + board
- Action perceptually dispersed
- Gameplay tension not communicated
- Hand/board legibility weak in context

These are inputs to the diagnostic, not its conclusions.

---

## Methodology — Three-stage emergent structure

The methodology has three stages, executed in strict order, with explicit closure gates between them.

### Stage 1 — Pure observation (sealed)

**Setup runtime:**

- Live Chiribito multi-player, **≥2 seats** (necessary condition for "acción no salta" to surface in turn changes).
- Viewport: **1920×1080 desktop + sidebar open** (apples-to-apples with Compact Density Pass + Perceptual Framing Pass baseline).
- Mobile **out of scope for Stage 1** — preserved by MOBILE_* constants from Compact Density Pass; mobile perceptual investigation is a separate sprint if/when emerges.
- Source: `npm run dev:stack` (local) OR `play.chiribito.com` (production) — user's choice, but **same source through all three stages** to eliminate source-of-runtime as confound.

**Narration protocol — burst pattern (typed chat):**

- User plays 1-2 hands. AI says nothing.
- User pauses and narrates in chat, verbatim, what the eye did during those hands: what it fixed on first, what took time to register, what got lost, what competed, what surprised, what disappeared, where weight was felt, where emptiness was felt. **Stream-of-consciousness.** No filtering, no structuring, no classification, no pre-categorization.
- AI responds **only with a short acknowledgement** ("recibido"). Zero analysis. Zero overlay. Zero "interesting". Zero "could be X". Zero "look here". Zero theory.
- Repeat. Another burst of hands, another narration.
- **Stage 1 closes when the user decides.** Not earlier, not later. Estimated ~5-8 hands covered in ~30-45 min real-time, but the clock is the user's.

**AI behavior during Stage 1 — strictly enforced:**

- Produces no overlays.
- Produces no screenshots.
- Does not interpret user narrative.
- Does not ask "do you mean...?".
- Does not group patterns.
- Does not mention axes, rubrics, or hypotheses.
- Only captures verbatim into the notes file.

**Stage 1 discipline rules:**

- **No re-read previous bursts during Stage 1.** Re-reading older narration introduces accumulated bias and contaminates subsequent observation. Each burst must feel fresh.
- **Stage 1 verbatim is immutable once captured.** Older bursts are not edited to "make them clearer" — the original signal is preserved.
- **Fatigue guardrail.** If narration quality degrades due to fatigue, stop immediately and resume another day. Tired observation produces noise, forced findings, pseudo-patterns.

**Output Stage 1:** a single notes file at `docs/superpowers/findings/2026-05-19-gameplay-readability-stage1-verbatim.md` containing user narrative pasted literally, separated by bursts, with relative timestamps. Untracked during the sprint; tracking decision deferred to closure.

---

### Stage 2 — Joint structure extraction

**Trigger:** when the user explicitly closes Stage 1.

**Protocol:**

- Open the verbatim notes file together.
- AI extracts **only repeated patterns** — phrases, concepts, perceptual objects mentioned **2+ times across the narration**, ideally across distinct bursts.
- For each candidate pattern, AI shows the **verbatim quotes that support it** (without paraphrasing). User confirms or refutes whether it is a real pattern, not an echo of AI grouping.
- Confirmed patterns are grouped into **2-4 emergent axes**, named with words the user actually used (no AI-imposed taxonomy).
- If only 1 axis emerges with repeated mentions: work with 1.
- If 0 axes emerge with clear repetition: **absence-of-convergence — sprint closes here with that verdict explicitly**. Stage 3 NOT forced.
- No verdicts yet. No "this is the primary driver". Only: "these are the patterns that appeared repeatedly in your honest observation".

**Output Stage 2:** appended to the same notes file — list of emergent axes (or "0 axes emerged — absence of convergence"), each with verbatim quotes that support it.

---

### Stage 3 — Convergent consolidation

**Trigger:** Stage 2 produced ≥1 emergent axis AND the user decides to continue (not automatic).

**Protocol:**

- Re-start the runtime (same viewport, same multi-player setup, same source as Stages 1+2).
- Playwright captures frames targeted **to the moments where each emergent axis appeared in user narrative**. No a priori frames — only the verbatim moments already mentioned.
- AI produces overlays on those frames, restricted to a **closed repertoire of types**:
  - **Focal target marker** — a point/circle indicating where the eye structurally lands first
  - **Attention path arrows** — visual recorrido between elements
  - **Cluster boxes** — perceptual groups per Gestalt (proximity / similarity / continuity)
  - **Weight blobs** — visual weight map (contrast / saturation / size relative)
  - **Element-class outlines** — hole cards / board cards / seats / chips / chrome (for detecting competing weights)
- **PROHIBITED:** mockups, redesigns, suggestions, alternatives, casino references, Dribbble, "what if".
- **Overlay minimalism:** one overlay type at a time per frame, unless strictly necessary. Mixing overlay types makes the overlay itself dominate perceptually — breaking the idea of observing real runtime.
- **Overlay produced independently:** AI generates the overlay WITHOUT re-reading the specific verbatim quote during overlay creation. Overlay first, then validation against verbatim. This protects the hybrid validity — without it, overlays become post-hoc illustration of the verbatim, not independent structural signal.
- For each axis: **does my independent overlay show what your verbatim already said?**
  - Yes → **convergent finding**, enters the final doc.
  - No (overlay reveals something different, or nothing) → **structural signal discarded**; user verbatim remains as "flagged perception without structural mapping".

**Stage 3 discipline rules:**

- **Overlays are heuristic visualizations, not proof.** Even a convergent overlay remains plausible structural interpretation, not objective measurement.
- **Overlays are explanatory aids, not authoritative measurements.** Reinforces epistemic humility at the artifact level.
- **No gameplay-feel conclusions from isolated stills without runtime corroboration.** Many perceptual problems exist only in transition / timing / eye movement / turn flow. Protects against screenshot overfitting.
- **No frame captured a priori.** No "let me grab the showdown frame just in case". Only verbatim-mentioned moments.

**Output Stage 3:** final findings doc at `docs/superpowers/findings/2026-05-19-gameplay-readability-diagnostic.md` containing:

- Verbatim original (Stage 1) referenced
- Emergent axes (Stage 2) listed
- Convergent findings ranked by mention frequency (with explicit "frequency ≠ causal importance" disclaimer)
- Flagged perceptions (verbatim without structural mapping — open, unresolved)
- Discarded structural signals (overlay without convergence — honest log of what was discarded and why)
- Constraint conflicts (findings whose obvious solution would break locked invariants)
- **Closure verdict** — convergent / partial-convergent / absent-convergent

---

## Convergence rules (consolidated)

| Signal source | Convergent? | Status |
|---|---|---|
| User verbatim AND AI structural overlay both surface pattern | YES | **Convergent finding.** Enters final doc. |
| AI overlay surfaces pattern; user verbatim does NOT | NO | **Discarded** as theory-drift. Logged for honesty. |
| User verbatim surfaces pattern; AI overlay does NOT or shows nothing | PARTIAL | **Flagged perception** — real signal, no structural mapping; recorded as open. |
| Neither | — | Not a finding. Not recorded except as absence-of-convergence verdict. |

**Frequency ≠ causal importance.** Mention frequency is a proxy for signal strength, not a measure of causal weight. Highly verbalizable does not equal perceptually dominant.

---

## Runtime conditions

- **Primary viewport:** 1920×1080 desktop + sidebar open. Apples-to-apples with Compact Density Pass + Perceptual Framing Pass.
- **Multi-player setup:** ≥2 seats minimum. Recommended 3 seats (matches Compact Density Pass — diversity of turns without crowding).
- **Source:** `npm run dev:stack` OR `play.chiribito.com` — user's choice, but **same source across Stages 1+2+3**.
- **Game state coverage:** emerges from natural play. **No scripted state forcing.** Bursts cover whatever happens organically — preflop, board reveals, betting, showdown, occasional fold, occasional all-in.
- **Mobile:** out of scope for this diagnostic. Preserved by MOBILE_* constants. Mobile-specific sprint if/when emerges.

---

## Capture protocol

- **Stage 1:** zero captures. Verbatim text only.
- **Stage 2:** zero new captures. Re-reading verbatim only.
- **Stage 3:** Playwright captures strictly to verbatim-mentioned moments. PNG stills. Frame selection driven by verbatim quotes ("when X happened my eye went to Y"). **Zero a priori captures.** Zero "let me grab the showdown frame just in case".
- **Storage paths:**
  - Stage 3 stills + overlays: `.dev-stack/diag/gameplay-readability/{stage3-frames,stage3-overlays}/` — gitignored (`.dev-stack/` already in `.gitignore`).
  - Stage 1 verbatim: `docs/superpowers/findings/2026-05-19-gameplay-readability-stage1-verbatim.md` — untracked during sprint, tracking deferred to closure.
  - Stage 3 findings doc: `docs/superpowers/findings/2026-05-19-gameplay-readability-diagnostic.md` — tracked, atomic commit at closure.
  - Spec (this doc): `docs/superpowers/specs/2026-05-19-chiribito-gameplay-readability-diagnostic-design.md` — atomic commit at end of brainstorming step.

---

## Locked invariants 🔒

Preserved through this sprint AND any sprint derived from its findings. Direct port from Compact Density Pass + Perceptual Framing Pass closures:

- Wood border 16px solid `var(--wood-mid)`
- Gold rim 3px `rgba(244, 196, 48, 0.6)` via `.table-surface::before`
- Felt radial gradient (verde Chiribito: `#0f8f6a 0% → var(--felt-main) 45% → var(--felt-dark) 100%`)
- Oval geometry (`border-radius: 50% / 38%`)
- Seat CSS positions (6% / 94% — Slice A1 lock)
- Castizo vocabulary lock (Pasar / Igualar / Tirar / Envidarse / Apostar / Subir / Bote / Esperando / etc.)
- Cards Fournier `.webp` assets
- Composición chrome general (header / badges / action bar)
- Post-Compact-Density-Pass values: max-width 980, CARD_W/H 60/90, BOARD_SPREAD 67, HOLE_SPREAD 23, padding 44, header margin-bottom 16
- Elegant breathing room
- Stack base (Colyseus / Pixi v7 / GSAP / Vite / vanilla TS)

---

## Forbidden moves

Apply to this sprint AND any sprint that follows from its findings:

- Scaling ladders / viewport-fill tuning (**runtime-falsified by Perceptual Framing Pass — not to be re-litigated**)
- Density escalation beyond Compact Density Pass baseline
- Hyper-compaction
- Casino-clone drift (PokerStars / IDN / Zynga / generic poker density)
- Mockup loops (V1 → V4 closed, V5+ not authorized)
- Speculative tweaking pre-convergence
- Pixi internals churn / shaders / custom Graphics
- Architecture / engine / managers / schema changes
- Seat repositioning / oval modification
- Wood / gold rim / felt gradient adjustment
- Header layout / castizo vocab modification
- Designer intuition drift (theory before observation)
- Forced conclusions when convergence absent
- Mention-frequency-as-pseudo-metric (frequency ≠ causal importance)
- "If we can't fix it, then it doesn't exist" reasoning
- Mid-sprint hypothesis substitution
- Cross-contamination with Track B (Web/Product deployment layer runs in a separate session — never mixed)
- No mixed commits between spec/findings and unrelated Track B work
- Companion drift (using the companion for mockups, redesigns, speculative UI, casino references, or any output outside the closed overlay repertoire)
- Closure anti-recursion violation (no immediate follow-up diagnostic sprint in the same session as closure)
- Roadmap reflex (convergent findings do not automatically create implementation tasks)
- Ontology hardening (emergent axes are working lenses, not permanent ontology)
- Grand-theory production (the sprint does not produce a unified theory of gameplay readability)

---

## Closure criteria

**Stage 1 closes when:**

- The user declares it closed (no time pressure, no minimum).
- OR the fatigue guardrail triggers (quality degradation noticed → stop, resume another day).

**Stage 2 closes when ONE of two:**

- 2-4 emergent axes named with verbatim quote support, AND user has confirmed each axis is a real pattern.
- OR absence-of-convergence declared explicitly. **Sprint closes here with that verdict; Stage 3 NOT executed forced.**

**Stage 3 closes when:**

- Findings doc written, reviewed by user, committed.
- Sprint closes with that commit.

**Sprint global closure — one of three verdicts (sealed):**

- **Convergent** — ≥1 strong convergent finding identified, with constraint-conflict status flagged per finding.
- **Partial-convergent** — convergent findings + flagged perceptions (verbatim without structural mapping) + discarded structural signals (overlay without verbatim).
- **Absent-convergent** — no axes emerged at Stage 2 OR no overlays converged with verbatim at Stage 3. **Valid outcome — sprint closes honestly.**

**Closure anti-recursion:** the closure verdict seals the sprint. No immediate follow-up diagnostic sprint may begin in the same session.

---

## Output artifacts

| Artifact | Path | Tracked? | Created during |
|---|---|---|---|
| Spec (this doc) | `docs/superpowers/specs/2026-05-19-chiribito-gameplay-readability-diagnostic-design.md` | git, **1 commit** at end of brainstorming | brainstorming step 6 |
| Stage 1 verbatim | `docs/superpowers/findings/2026-05-19-gameplay-readability-stage1-verbatim.md` | untracked during sprint; track-decision at closure | Stage 1 |
| Stage 3 frames + overlays | `.dev-stack/diag/gameplay-readability/{stage3-frames,stage3-overlays}/` | gitignored (`.dev-stack/` already in `.gitignore`) | Stage 3 |
| Findings doc final | `docs/superpowers/findings/2026-05-19-gameplay-readability-diagnostic.md` | git, **1 atomic commit at closure** | Stage 3 |

---

## Commit discipline

- **Zero code commits across the entire sprint.** Doc commits only.
- **HEAD `0acfb1f` must remain an ancestor of all sprint commits.**
- Atomic per artifact at closure, no mid-sprint amalgams.
- Commit message convention:
  - `docs(spec): chiribito gameplay readability diagnostic design` (this spec)
  - `docs(diag): ...` (verbatim + findings)
- **No squash, no rebase.**
- **No mixed commits between spec/findings and unrelated Track B work.** Track B (Web/Product deployment layer) runs in a separate session.
- If sprint closes Absent-convergent at Stage 2: spec commit + a final commit recording the absence-of-convergence verdict. Nothing else.

---

## Sprint duration framing

- Stage 1: ~30-45 min of user active time (may split across 2-3 days if fatigue guardrail triggers).
- Stage 2: ~20-30 min of user active time (joint reading).
- Stage 3: ~30-60 min of user active time (re-capture + overlay review + co-writing findings).
- **Total real-time: ~1.5-2.5h user active, possibly distributed across 2-4 sessions.**
- If sprint closes Absent-convergent at Stage 2: ~50-75 min total. That is success, not a shortcut.

**Elapsed time is irrelevant; perceptual clarity is the pacing variable.** This sprint degrades if it begins to feel like "we have to finish today".

---

## Risks (known limitations of this methodology)

- **Multi-session calendar drift.** Stages 1 → 2 → 3 may span days. Source-of-runtime change between days could introduce confounds. *Mitigation:* same source locked across all stages. If calendar gap > 3 days, run a short fresh Stage 1 burst (5-10 min) as sanity check before Stage 2 — narrative should not contradict prior bursts; if it does, observation reopens silently and Stage 1 restarts.
- **Game-server RNG drift between Stage 3 captures.** Frames captured during Stage 3 are NOT pixel-reproducible — deck shuffling differs across sessions. *Mitigation:* accept "same moment-class, not identical moment" — perceptual structure is the target, not pixel-identity. Overlay analysis works on structure, not pixel match.
- **Convergence theater.** Temptation to call weak coincidences "convergence" to avoid absent-convergent verdict. *Mitigation:* convergent finding requires AI overlay produced independently (without re-reading the specific verbatim quote during overlay creation) AND user verbatim independent (not prompted by AI visual). Auditable from verbatim file timestamps.
- **Stage 3 scope creep.** Temptation to capture extra frames "just to check" or add overlay types "for completeness". *Mitigation:* capture only at verbatim-mentioned moments; overlay minimalism (one type per frame); structural exploration outside verbatim = forbidden by spec.
- **Fatigue masquerading as findings.** Tired brain finds patterns it would not find rested. *Mitigation:* fatigue guardrail + immutability of verbatim + absence-as-valid.
- **Track A/B cross-contamination.** Both tracks share the repo. Mid-sprint mental switch could blur conclusions. *Mitigation:* Track B in a separate session (chip already spawned); Track A is doc-only; HEAD `0acfb1f` is the shared start point but zero Track A code mutations; cross-track commit lock.
- **Constraint-conflict softening.** Once a finding lacks compatible solution, implicit pressure to walk it back. *Mitigation:* constraint conflicts remain unresolved findings, not invalid findings; findings ≠ implementation tasks.
- **Roadmap reflex.** Tendency post-diagnostic to immediately spec a fix sprint. *Mitigation:* closure anti-recursion + duration framing + findings ≠ roadmap.
- **Companion drift.** The companion could begin to be used for speculative mockups if conversation relaxes. *Mitigation:* companion locked to intake screen (observation-only mode + overlay types restricted to closed repertoire). Any use outside that repertoire = procedural error, not authorized by spec.

---

## Open questions (out of scope for this sprint, captured for future)

- **Multi-finding sequencing.** If multiple convergent findings emerge with similar signal strength, what determines priority for any future intervention? Frequency ≠ causal — but no clean alternative yet. Defer to fresh brainstorm after diagnostic closes.
- **Constraint-conflict resolution path.** If findings emerge with constraint-conflict status, is the next session a "honor finding X without breaking invariants" brainstorm, or a different methodology entirely? Defer until findings actually exist.
- **Mobile perceptual diagnostic.** Mobile out of scope here. Separate sprint if/when needed, with mobile-specific viewport (390×844 minimum + real Android device per Runtime Diag precedent). Not pre-decided.
- **Other viewports.** 1366×768 laptop already known not-problematic (Compact Density Pass insight). 1440p+ and 21:9 ultra-wide deferred from Perceptual Framing Pass; still deferred.
- **Pre-verbal perception capture.** If Stage 1 reveals that important perceptions consistently elude live narration (things felt but not verbalized until days later), Approach 3 (recording-first replay) becomes the natural follow-up methodology. Not enabled here.
- **Cross-validation between dev:stack and production.** "Same source across stages" mitigates within-sprint, but the question of "are dev:stack and production perceptually equivalent?" remains open — not formally tested.

---

## Acceptance criteria for this spec

- [x] Goal stated with explicit non-goals.
- [x] Predecessor sprint context referenced and the falsified hypothesis acknowledged.
- [x] User-perceived signals captured verbatim.
- [x] Three-stage methodology specified with explicit closure gates.
- [x] Companion role re-defined as structural mapping of observed perception, not UX interpretation.
- [x] Convergence rules consolidated into a single table.
- [x] Runtime conditions specified with source-consistency lock.
- [x] Capture protocol specified with verbatim-gated frame selection.
- [x] Locked invariants enumerated.
- [x] Forbidden moves exhaustively listed.
- [x] Closure criteria specified per stage and globally, with three sealed verdicts.
- [x] Output artifacts with tracked/untracked status and creation stage.
- [x] Commit discipline locked to doc-only, ancestor of `0acfb1f`, no cross-track mixing.
- [x] Duration framing prioritizes perceptual clarity over elapsed time.
- [x] Risks enumerated with mitigations.
- [x] Open questions captured without opening new rabbit holes.
- [x] Anti-grand-theory and anti-ontology-hardening guardrails included.

---

## Predecessor / related context pointers

- `docs/HANDOFF_COMPACT_DENSITY_PASS.md` — Compact Density Pass shipped (HEAD `0acfb1f`).
- `docs/HANDOFF_RUNTIME_DIAG.md` — Runtime Diagnostic CLOSED (Phase A+B+C+D Primary).
- `docs/superpowers/specs/2026-05-19-chiribito-perceptual-framing-pass-design.md` — falsified-hypothesis predecessor.
- `docs/superpowers/specs/2026-05-18-chiribito-runtime-diagnostic-design.md` — diagnostic methodology pattern.
- `docs/superpowers/specs/2026-05-18-chiribito-visual-audit.md` — original static screenshot audit.
- Memory: `feedback_chiribito_north_star.md`, `feedback_chiribito_browser_e2e_lesson.md`, `feedback_chiribito_disciplined_format.md`, `feedback_chiribito_castizo_vocabulary.md`, `feedback_chiribito_a1_root_causes.md`, `feedback_chiribito_runtime_probe_ladder_validated.md`.
- Project memory: `project_chiribito.md`, `project_chiribito_compact_density_pass.md`, `project_chiribito_perceptual_framing_pass.md`, `project_chiribito_runtime_diag.md`.
- `frontend/src/style.css` — surface CSS (locked).
- `frontend/src/game/table/TableScene.ts` — Pixi table scene (locked at post-Compact-Density-Pass values).

---

## Track B separation reminder

This sprint (Track A — Gameplay Readability Diagnostic) runs in cognitive isolation from Track B (Chiribito Web/Product Deployment Layer). Track B has its own session, its own scope, and its own commit history. Cross-contamination between the two tracks at any layer (code, doc, commit, conceptual framing) is explicitly forbidden by this spec.
