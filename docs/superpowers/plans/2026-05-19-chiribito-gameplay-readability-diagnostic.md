# Chiribito Gameplay Readability Diagnostic — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Subagent-Driven execution is NOT appropriate for this plan — every task requires live human participation (narration, confirmation, runtime-driving) which cannot be delegated to a fresh subagent.

**Goal:** Execute the 3-stage observation-first perceptual diagnostic per locked spec, producing one of three sealed closure verdicts (Convergent / Partial-convergent / Absent-convergent).

**Architecture:** Doc-only sprint. Zero code commits. Workflow choreography across three sequential stages with explicit closure gates between them. Stage 2 and Stage 3 are conditional — absence-of-convergence at Stage 2 closes the sprint without forcing Stage 3.

**Tech Stack:** Companion server (node, port from session-info file) for visual overlays in Stage 3 + Playwright for Stage 3 runtime frame capture + git for atomic doc commits. Runtime source = user's pick of `npm run dev:stack` (local) OR `play.chiribito.com` (production), locked across all three stages.

**Spec (canonical authority):** [docs/superpowers/specs/2026-05-19-chiribito-gameplay-readability-diagnostic-design.md](../specs/2026-05-19-chiribito-gameplay-readability-diagnostic-design.md). **This plan does NOT re-state spec methodology — it operationalizes execution only.** If conflict between plan and spec, spec wins.

**Discipline (carry-forward from spec):**
- Observation-before-theory
- Stop-on-ambiguous
- Zero gameplay mutations
- Track A / Track B cognitively separated (Track B has its own session)
- Closure verdicts (including Absent-convergent) are all valid outcomes — no implementation pressure derived from findings

---

### Task 1: Pre-Stage-1 setup

**Files:**
- Create: `docs/superpowers/findings/2026-05-19-gameplay-readability-stage1-verbatim.md` (untracked during sprint)

**Steps:**

- [ ] **Step 1.1: Restart companion server (auto-exited after 30-min inactivity at last session)**

Run via Bash tool with `run_in_background: true`:
```
/c/Users/Usuario/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/brainstorming/scripts/start-server.sh --project-dir "/c/Users/Usuario/Documents/CHIRIBITO/chiri-infrastructure/chiri-app"
```
Expected output (read from background task output file after ~2s): JSON `{"type":"server-started","port":...,"url":"http://localhost:PORT","screen_dir":"...","state_dir":"..."}`. Save URL + screen_dir + state_dir for Step 4.3.

- [ ] **Step 1.2: User locks runtime source (one of two, immutable across all 3 stages)**

Ask user explicitly: "Para los tres stages voy a usar la misma source — ¿`npm run dev:stack` (local) o `play.chiribito.com` (producción)?" Wait for explicit user response. Record selection inline in this plan file as `**Runtime source locked: <selection>**`.

- [ ] **Step 1.3: User verifies multi-player runtime ready**

User opens chosen runtime in browser at viewport **1920×1080 + sidebar open**. User joins **≥2 seats** (recommended 3 — matches Compact Density Pass capture set). User confirms ready in chat.

- [ ] **Step 1.4: Create Stage 1 verbatim notes file (empty stub, untracked)**

Use Write tool to create the file at exact path: `docs/superpowers/findings/2026-05-19-gameplay-readability-stage1-verbatim.md` with the following exact content:

```markdown
# Chiribito Gameplay Readability — Stage 1 Verbatim Notes

> Spec: docs/superpowers/specs/2026-05-19-chiribito-gameplay-readability-diagnostic-design.md
> HEAD at sprint start: 85113f0 (spec commit, ancestor of 0acfb1f via 0acfb1f)
> Runtime source locked: <to be filled at Step 1.2>
> Multi-player setup: <to be filled at Step 1.3>
> Stage 1 immutability: once a burst is appended, it is NOT edited retroactively.

## Bursts
```

Do NOT commit this file. It stays untracked through Stage 1 + Stage 2.

---

### Task 2: Stage 1 — Pure observation (sealed)

**Files:**
- Modify: `docs/superpowers/findings/2026-05-19-gameplay-readability-stage1-verbatim.md` (append-only, immutable per-burst)

**Steps:**

- [ ] **Step 2.1: Receive narration burst from user**

User plays 1-2 hands then narrates verbatim in chat. AI uses Edit tool to append the user's narration to the verbatim file as a new subsection:

```markdown
### Burst N — [HH:MM relative timestamp]
<user's literal verbatim text, no edits, no paraphrasing>
```

AI must NOT add interpretation, headings, or commentary inside the burst. Only append literally what the user typed.

- [ ] **Step 2.2: AI responds with brief acknowledgement only**

AI reply ≤ 3 words. Examples: "recibido", "anotado", "siguiente". **Forbidden in AI reply during Stage 1:** any analysis, any question about the narration, any overlay, any "interesante", any "podría ser X", any "mira aquí", any theory, any axis mention, any pattern-grouping hint, any "do you mean...?".

- [ ] **Step 2.3: Loop 2.1 + 2.2 until Stage 1 closure trigger**

User-driven closure. Two acceptable triggers:
- User declares closure explicitly ("Stage 1 cerrado" or equivalent unambiguous signal).
- Fatigue guardrail: if user mentions fatigue, AI **does NOT push** — waits for user explicit decision to pause / resume another day / continue.

AI does NOT propose closure. AI does NOT count manos. AI does NOT remind user of time. AI does NOT suggest patterns mid-stream.

- [ ] **Step 2.4: User declares Stage 1 closure explicitly**

User says "Stage 1 cerrado" or equivalent. From this point the verbatim file is **immutable** — no retroactive edits to make bursts "clearer".

---

### Task 3: Stage 2 — Joint structure extraction

**Files:**
- Modify: `docs/superpowers/findings/2026-05-19-gameplay-readability-stage1-verbatim.md` (append "## Stage 2" section)

**Steps:**

- [ ] **Step 3.1: AI re-reads complete verbatim file**

Read the entire verbatim notes file. Identify phrases/concepts/perceptual objects mentioned **2+ times across distinct bursts**. Do NOT impose taxonomy. Use only words the user used.

- [ ] **Step 3.2: AI presents candidate patterns to user with verbatim quote support**

For each candidate pattern, AI shows in chat:
- Pattern name (in user's exact words, NOT paraphrased).
- Verbatim quotes from at least 2 distinct bursts that support the pattern, with burst reference.

Ask user per candidate: "¿Es esto un patrón real en lo que viste, o es un artifact de mi grouping?"

AI presents one pattern at a time OR all at once depending on user preference (ask at start of step).

- [ ] **Step 3.3: User confirms or refutes each candidate**

User responds per candidate: confirmed / refuted / unclear. AI records the verdict. Refuted candidates dropped immediately. Unclear candidates dropped (stop-on-ambiguous applies).

- [ ] **Step 3.4: Group confirmed patterns into 2-4 emergent axes (OR declare absence)**

If ≥1 pattern confirmed: group confirmed patterns into 2-4 axes, each named in user's words.

If 0 patterns confirmed: declare **absence-of-convergence at Stage 2**. Skip directly to Task 5 (Sprint closure with absent-convergent verdict).

- [ ] **Step 3.5: Append Stage 2 results to verbatim file**

Use Edit tool to append to the verbatim file:

```markdown
## Stage 2 — Emergent axes (or absence)

<one of:>

### Emergent axes
- **Axis 1 name (user's words)** — supporting bursts: N, M, ...
- **Axis 2 name** — supporting bursts: ...
(2-4 axes max)

OR:

### Absence-of-convergence declared
No pattern survived the 2+-mention threshold AND user confirmation. Sprint closes with absent-convergent verdict.
```

- [ ] **Step 3.6: Stage 2 closure decision gate**

If ≥1 axis emerged AND user explicitly authorizes Stage 3: proceed to Task 4.
If absence-of-convergence: proceed directly to Task 5 (skip Task 4).
If user wants to pause/resume Stage 3 another day: pause; closure gate stays open until user resumes.

---

### Task 4: Stage 3 — Convergent consolidation (CONDITIONAL — only if Stage 2 emerged ≥1 axis AND user authorizes)

**Files:**
- Create: `.dev-stack/diag/gameplay-readability/stage3-frames/<axis>-<moment>.png` (gitignored)
- Create: `.dev-stack/diag/gameplay-readability/stage3-overlays/<axis>-<moment>-<overlay-type>.png` (gitignored)

**Steps:**

- [ ] **Step 4.1: User re-starts runtime, same source as Stages 1+2**

User opens locked runtime source + multi-player setup (1920×1080 + sidebar open + ≥2 seats). Confirms ready.

- [ ] **Step 4.2: AI confirms companion server is up**

Run via Bash:
```
curl -sS -o /dev/null -w 'HTTP %{http_code}\n' --max-time 3 http://localhost:<PORT>/
```
where `<PORT>` is from session-info saved in Step 1.1. Expected: `HTTP 200`. If `HTTP 000` or `server-stopped` flag exists in state_dir: re-run Step 1.1 to restart server, get new port.

- [ ] **Step 4.3: For each emergent axis, identify verbatim-mentioned moments**

For each axis from Stage 2 output, AI extracts from verbatim quotes the specific game moments where the axis manifested ("cuando salió la 3ª carta del board mi ojo se fue a..."). One moment per axis-quote pair.

- [ ] **Step 4.4: AI captures Playwright frame per verbatim moment**

For each moment from Step 4.3, AI uses Playwright (script pattern from prior sprints in `.dev-stack/b*-capture.ts`) to capture one PNG of the runtime at that moment. File: `.dev-stack/diag/gameplay-readability/stage3-frames/<axis-slug>-<moment-slug>.png`.

**Forbidden:** capture frames not anchored to a verbatim quote. No "déjame agarrar el showdown frame por si acaso".

- [ ] **Step 4.5: AI produces ONE structural overlay per frame, independently**

For each captured frame, AI:
1. **Closes the verbatim file context mentally** (does NOT re-read the specific quote during overlay creation — overlay first, validation after).
2. Picks ONE overlay type from the closed repertoire:
   - Focal target marker (point/circle)
   - Attention path arrows
   - Cluster boxes (Gestalt grouping)
   - Weight blobs (visual weight map)
   - Element-class outlines (hole cards / board / seats / chips / chrome)
3. Produces the overlay PNG via Pillow/PIL script (or equivalent) over the captured frame.

File: `.dev-stack/diag/gameplay-readability/stage3-overlays/<axis-slug>-<moment-slug>-<overlay-type>.png`.

**Forbidden:** mixing overlay types on a single frame unless strictly necessary; mockups; redesigns; suggestions; alternatives; casino references.

- [ ] **Step 4.6: AI validates each overlay against verbatim quote (post-overlay)**

For each overlay, AI compares to the verbatim quote that motivated the moment:
- AI overlay independently shows what verbatim said → **CONVERGENT FINDING**. Both signals agree.
- AI overlay shows something different OR nothing → **DISCARDED STRUCTURAL SIGNAL**. Logged for honesty in Stage 3 output.

AI records verdict per overlay in a working notes scratchpad (in-chat or staged in findings doc draft).

- [ ] **Step 4.7: User reviews convergent findings + discarded signals**

AI presents in chat: convergent findings (with frame + overlay paths), discarded signals (with frame + overlay paths + explanation of mismatch). User confirms the verdicts or flags concerns.

- [ ] **Step 4.8: Identify flagged perceptions (verbatim without structural mapping)**

If during Stage 2 a pattern was named but no convergent overlay materialized in Stage 3, the pattern remains as **flagged perception** — real signal, no structural mapping yet, recorded as open/unresolved.

- [ ] **Step 4.9: Identify constraint conflicts**

For each convergent finding, AI checks: does the obvious solution to this finding break any locked invariant (wood / gold rim / felt / oval / castizo / seat positions / Compact Density values)? If yes, finding gets a `constraint-conflict: <which-invariants>` tag. Finding remains valid (unresolved, not invalid).

---

### Task 5: Sprint closure

**Files:**
- Create: `docs/superpowers/findings/2026-05-19-gameplay-readability-diagnostic.md` (tracked, atomic commit)

**Steps:**

- [ ] **Step 5.1: Determine sprint closure verdict**

One of three sealed verdicts:
- **Convergent** — ≥1 strong convergent finding identified (path: Stage 1 → Stage 2 → Stage 3 produced ≥1 convergence).
- **Partial-convergent** — convergent findings + flagged perceptions + discarded signals coexist (path: Stage 1 → Stage 2 → Stage 3 produced mixed signal).
- **Absent-convergent** — closed at Stage 2 with no axes emerged OR closed at Stage 3 with no overlays converged (path: Stage 1 → Stage 2 absence, OR Stage 1 → Stage 2 → Stage 3 with all discards).

- [ ] **Step 5.2: Write findings doc**

Use Write tool to create `docs/superpowers/findings/2026-05-19-gameplay-readability-diagnostic.md` with this exact structure:

```markdown
# Chiribito — Gameplay Readability Diagnostic Findings

> Spec: docs/superpowers/specs/2026-05-19-chiribito-gameplay-readability-diagnostic-design.md
> Plan: docs/superpowers/plans/2026-05-19-chiribito-gameplay-readability-diagnostic.md
> HEAD at sprint start: 85113f0 (spec) / 0acfb1f (pre-sprint baseline, ancestor)
> Runtime source used: <locked value from Step 1.2>
> Stage 1 verbatim file: docs/superpowers/findings/2026-05-19-gameplay-readability-stage1-verbatim.md
> Stage 3 frames + overlays: .dev-stack/diag/gameplay-readability/ (gitignored)

## Closure verdict

**<Convergent / Partial-convergent / Absent-convergent>**

## Path taken

<one-paragraph narrative of how the sprint flowed across stages, including any fatigue pauses or calendar gaps>

## Convergent findings (ranked by mention frequency — disclaimer: frequency ≠ causal importance)

### Finding 1: <axis name in user's words>
- **Mentions:** N across distinct bursts
- **Verbatim support:** <quotes>
- **Overlay evidence:** path to overlay PNG
- **Constraint conflict:** <if any, which invariants>
- **Status:** convergent / unresolved

(repeat per finding, or write "No convergent findings — closure was absent-convergent at Stage <N>" if absent verdict)

## Flagged perceptions (verbatim without structural mapping — open, unresolved)

(list, or "None" if none)

## Discarded structural signals (overlay without verbatim convergence — honest log)

(list overlays produced that did NOT converge with verbatim, with brief reason, or "None" if all overlays converged)

## Constraint conflicts summary

(table or list of findings whose obvious solution would break locked invariants)

## Open work derived (NOT a roadmap — pure observation)

(captured perceptual observations or methodological lessons. Explicit reminder: findings ≠ implementation tasks. Closure anti-recursion applies — no immediate follow-up diagnostic in same session.)

## Closure stamp

Sprint closed YYYY-MM-DD. Verdict: <verdict>. HEAD at closure: <sha>. Next session opens fresh.
```

- [ ] **Step 5.3: User reviews findings doc**

AI shows findings doc to user. User reads, requests changes if any. AI iterates inline. Repeat until user explicitly approves.

- [ ] **Step 5.4: Decide on Stage 1 verbatim tracking**

Ask user: "¿Trackeo `2026-05-19-gameplay-readability-stage1-verbatim.md` en git (junto al findings doc) o se queda untracked como working notes?" Record decision.

- [ ] **Step 5.5: Atomic commit findings doc (+ verbatim file if user authorizes tracking)**

Stage only the findings doc (and optionally the verbatim file per Step 5.4 decision). Do NOT stage `.superpowers/`, `_screenshots/`, or any other untracked files. Do NOT stage `.dev-stack/diag/` (gitignored anyway).

```bash
git add docs/superpowers/findings/2026-05-19-gameplay-readability-diagnostic.md
# Optional per Step 5.4:
# git add docs/superpowers/findings/2026-05-19-gameplay-readability-stage1-verbatim.md
git commit -m "docs(diag): chiribito gameplay readability diagnostic findings — <verdict>"
```

Expected: 1 file changed (or 2 if verbatim also tracked). HEAD advances. Parent must be `85113f0` (spec) — verify with `git log --oneline -3`.

- [ ] **Step 5.6: Declare sprint closure verdict in chat**

AI reports to user in Spanish: "Sprint cerrado. Verdict: <verdict>. HEAD: <new-sha>. Closure anti-recursion: ningún sprint diagnóstico de gameplay readability puede iniciarse en esta sesión."

- [ ] **Step 5.7: Update memory (optional)**

Optional: update `MEMORY.md` index with a one-line pointer to a new memory file capturing the sprint outcome. NOT a roadmap memory — just historical record per Chiribito convention. Decide with user.

---

## Notes on agentic execution

- **Subagent-driven dispatch is NOT appropriate for this plan.** Every task requires live human participation (narration, confirmation, runtime-driving). A fresh subagent has no shared session context with the user and cannot execute these steps.
- **Inline execution is the only sensible mode.** Use `superpowers:executing-plans` skill if/when execution begins.
- **No batching across stage boundaries.** Each stage closes explicitly before the next opens. Do not pre-stage Task 4 work while Task 2 is still active.
- **Calendar drift is allowed.** Stages 1 → 2 → 3 can span days. If calendar gap > 3 days between stages, run a short fresh Stage 1 burst (5-10 min) as sanity check per spec Risks section.
