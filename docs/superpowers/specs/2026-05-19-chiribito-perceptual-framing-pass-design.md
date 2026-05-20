# Chiribito — Perceptual Framing Pass Design

> Spec written 2026-05-19 against HEAD `0acfb1f`.
> Status: design approved by user; awaiting written-spec review before transition to writing-plans skill.
> Predecessor specs: `2026-05-18-chiribito-runtime-diagnostic-design.md` (Runtime Diagnostic — CLOSED Phase D Primary), then Compact Density Pass (shipped, no spec doc — captured in `docs/HANDOFF_COMPACT_DENSITY_PASS.md`).
> Sibling sprints already shipped: Slice A1 (chrome cleanup), Slice A2.0 (sidebar debug), Runtime Diagnostic Phase A+B+C+D Primary, Compact Density Pass.

---

## Goal

Resolve the residual perceptual sensation of "mesa lejana" / weak action dominance that persists on **1920×1080 desktop with sidebar open** after the Compact Density Pass shipped. Validate that the residual driver is **surface-to-viewport ratio** (not raw card size, not internal density, not layout). Find the minimum proportional scale increase that delivers "action dominates better" without breaking castizo elegance, breathing room, or mobile ergonomics.

This is a **lightweight perceptual sprint**, runtime-first, gated probe-by-probe. Default outcome is **stop at L1 (+6%)** unless the brain explicitly says "still distant". Aggressive probes are escape hatches, not target.

---

## User-perceived problem (verbatim signal)

Captured 2026-05-19 immediately before this spec was written, mid-session after the Compact Density Pass shipped and was perceptually re-evaluated against real runtime:

1. **"Cartas todavía se sienten pequeñas y la mesa todavía se siente algo lejana cuando entro al runtime real"** — despite Compact Density Pass shipping.
2. **"Mi intuición fuerte ahora: el felt sigue teniendo demasiado protagonismo perceptual y la cámara de mesa sigue sintiéndose demasiado alejada"** — primary hypothesis pointer.
3. **"Mi intuición durante todo el sprint probablemente estaba viendo algo real que los números no capturaban"** — perceptual signal real, not artifact.
4. **"Quizá el verdadero problema perceptual restante es: tamaño relativo del felt / cámara perceptual / framing general de mesa / relación viewport ↔ acción / no simplemente CARD_W"** — explicit re-framing away from raw card size.

User-confirmed diagnosis (during clarification round in this same session):

- Primary: **#2 "Mesa lejos en viewport"** (surface-to-viewport ratio).
- Partial: **#1 "Felt domina, cartas isla"** (felt-to-cards ratio).
- NOT principal: raw card size, density pure, broken layout.
- Primary viewport for perception: **1920×1080 desktop with sidebar open**.
- Laptop (1366–1440 wide) does NOT trigger the sensation — confirms framing/viewport hypothesis vs internal-layout hypothesis.
- 1440p+ monitors likely amplify the problem further (proportional to viewport size).

---

## Framing math (current state baseline)

Layout structure (verified by reading `frontend/index.html:240-301` + `frontend/src/style.css`):

- `body` → `#app` grid `300px sidebar | 1fr main` (style.css:2915)
- `#table` flex centered, padding 40px 20px (style.css:2936)
- `.table-surface` max-width 980, padding 44/70, wood border 16px (style.css:3298)
- `#pixi-layer` inset 0 (covers full surface, including padding area)

Available area for `.table-surface` per viewport, with sidebar open:

| Viewport | Available (V − 300) | Mesa outer (980 + 32 wood) | Fill % |
|---|---|---|---|
| 1366×768 (laptop) | 1066 | 1012 | **95%** |
| 1920×1080 (1080p) | 1620 | 1012 | **62%** |
| 2560×1440 (1440p) | 2260 | 1012 | **45%** |

At 1920×1080 the gap (~38% empty area horizontally) is real and matches the user's perception. At laptop sizes the table already fills 95% — confirms why the sensation drops on laptops.

---

## Predecessor sprint context (Compact Density Pass — shipped)

Already-applied changes from the preceding sprint (HEAD `0acfb1f`, commit `f112cbc`):

- `TableScene.ts:23-26`: CARD_W 52→60, CARD_H 78→90, BOARD_SPREAD 58→67, HOLE_SPREAD 20→23 (proportional +15%).
- `TableScene.ts:187-191`: mobile-aware boardCenter.y (0.48 desktop / 0.44 mobile) and deckPos.y (0.40 / 0.36).
- `style.css:3306`: `.table-surface { padding: 60 → 44 vertical }`.
- `style.css:3372`: `.table-header { margin-bottom: 32 → 16 }`.

Compact Density Pass improved cohesion, presence, tension, chrome integration, perceptual center. It did NOT resolve the residual surface-to-viewport ratio issue, which is the explicit target of this sprint.

---

## Approaches considered

### Rejected: A — `.table-surface { max-width }` only

Bumping max-width alone (e.g., 980→1080) without scaling Pixi constants worsens the felt-to-cards ratio. Cards stay 60×90 in an expanded Pixi canvas, so they look relatively smaller within the felt. This addresses #2 (viewport ratio) but worsens #1 (felt domina cartas isla), which the user flagged as a partial concern. Half-fix at best, regression at worst.

### Rejected: C — `transform: scale()` on `.table-surface`

Pixi rasterizes the canvas at its native resolution; the browser interpolates when CSS-scaling. At scale ≥ 1.1, card edges and small text exhibit visible anti-aliasing degradation. Additionally, `transform` does not update layout flow — the scaled surface visually occupies more space than its layout box, risking overlap with surrounding chrome. Not a viable permanent solution. Does not buy meaningful information as a probe either, since the visual effect of scale 1.10 via transform vs scale 1.10 via Pixi constants is essentially the same minus the blur penalty — the blur penalty alone makes it strictly worse as a probe.

### Selected: B refined — proportional scale via constants + max-width

Scale `.table-surface max-width` AND Pixi card-geometry constants (CARD_W, CARD_H, BOARD_SPREAD, HOLE_SPREAD) by the same percentage. Preserves felt-to-cards ratio exactly; addresses #2 directly. Implemented conservatively with a 3-level probe ladder, runtime-validated per level.

**Why this is not "another density pass":** Compact Density Pass increased card size in absolute terms within a fixed felt → addressed cohesion + presence. Perceptual Framing Pass scales card size **and** felt size together → addresses camera-distance perception while keeping the ratio that Compact Density Pass settled.

---

## Probe ladder (conservative)

Three levels specified; **L1 is the default stop**. L2/L3 are escape hatches gated by explicit user authorization after runtime review of the prior level.

| Variable | File | Baseline | **L1 (+6%)** | L2 (+10%) | L3 (+14%) |
|---|---|---|---|---|---|
| `.table-surface max-width` | `style.css:3300` | 980 | **1040** | 1080 | 1118 |
| `DESKTOP_CARD_W` | `TableScene.ts` | 60 | **64** | 66 | 68 |
| `DESKTOP_CARD_H` | `TableScene.ts` | 90 | **95** | 99 | 103 |
| `DESKTOP_BOARD_SPREAD` | `TableScene.ts` | 67 | **71** | 74 | 76 |
| `DESKTOP_HOLE_SPREAD` | `TableScene.ts` | 23 | **24** | 25 | 26 |

Expected fill % at 1920×1080 + sidebar open:

| Level | Mesa outer | Fill % |
|---|---|---|
| Baseline | 1012 | 62% |
| L1 | 1072 | 66% |
| L2 | 1112 | 69% |
| L3 | 1150 | 71% |

Mobile constants (CARD_W, CARD_H, BOARD_SPREAD, HOLE_SPREAD) remain **60/90/67/23 in all levels**. Mobile is fully preserved.

---

## Implementation — Mobile-safe refactor

Current module-level constants in `TableScene.ts:23-26` become two parallel sets of constants (DESKTOP_* and MOBILE_*), and the in-class constants used at render time become instance fields selected at construction time based on `window.innerWidth <= 768`.

### Refactor pattern

```ts
// Top of file — module-level constants
const DESKTOP_CARD_W = 64;           // L1 value; bumps to L2/L3 if user authorizes escalation
const DESKTOP_CARD_H = 95;
const DESKTOP_BOARD_SPREAD = 71;
const DESKTOP_HOLE_SPREAD = 24;

const MOBILE_CARD_W = 60;            // LOCKED — Phase D Primary preservation
const MOBILE_CARD_H = 90;
const MOBILE_BOARD_SPREAD = 67;
const MOBILE_HOLE_SPREAD = 23;

// Inside class TableScene
private readonly cardW: number;
private readonly cardH: number;
private readonly boardSpread: number;
private readonly holeSpread: number;

constructor(opts: TableSceneOptions) {
  // ... existing setup ...
  const mobile = typeof window !== "undefined" && window.innerWidth <= 768;
  this.cardW = mobile ? MOBILE_CARD_W : DESKTOP_CARD_W;
  this.cardH = mobile ? MOBILE_CARD_H : DESKTOP_CARD_H;
  this.boardSpread = mobile ? MOBILE_BOARD_SPREAD : DESKTOP_BOARD_SPREAD;
  this.holeSpread = mobile ? MOBILE_HOLE_SPREAD : DESKTOP_HOLE_SPREAD;
  // ... rest of ctor uses this.cardW / this.cardH / this.boardSpread / this.holeSpread ...
}
```

### Usage sites in `TableScene.ts` (8 line-level edits; item 7 has 2 token replacements on the same line)

1. ctor:88 — hole sprite `s.width = CARD_W` → `this.cardW`
2. ctor:89 — hole sprite `s.height = CARD_H` → `this.cardH`
3. ctor:101 — board sprite `s.width = CARD_W` → `this.cardW`
4. ctor:102 — board sprite `s.height = CARD_H` → `this.cardH`
5. `layoutStaticUi:199` — `CARD_H * 0.85` → `this.cardH * 0.85`
6. `applyBoardPositions:207` — `BOARD_SPREAD` → `this.boardSpread`
7. `holePosFor:213` — `HOLE_SPREAD` → `this.holeSpread` (used twice in the expression)
8. line 394 — `BOARD_SPREAD` → `this.boardSpread` (deal-animation start positions)

### Mobile detection trade-off (consciously accepted)

Mobile detection is **ctor-time, not measureLayout-time**. If the viewport changes from desktop to mobile mid-session (browser resize, orientation flip on a hybrid device), cards keep the size selected at TableScene construction. This matches current behavior — `CARD_W` is a module-level const today, so it does not change mid-session either. Trade-off is acceptable for this sprint; future work can hoist detection to `measureLayout()` plus sprite-resize logic if mid-session adaptation becomes a requirement.

---

## Capture protocol (per probe level)

For each level (starting at L1; L2/L3 only on explicit user authorization):

1. **Apply changes** — edit `style.css:3300` (max-width) and `TableScene.ts:23-26` + 8 usage-site refactors (per Implementation section). Single working-tree state.
2. **Static verification:**
   - `cd frontend && npx tsc --noEmit` — TypeScript clean.
   - `cd frontend && npm test` — vitest 225/225 PASS.
   - (game-server jest 475/475 + api-server jest 27/27 not affected by frontend visual changes; sanity-rerun only if anything red.)
3. **Start dev:stack** — `npm run dev:stack` from repo root, brings up postgres (5432), api-server (3000), game-server (2567), frontend (5173). Reuses already-running stack if alive.
4. **Comparative captures** — Playwright apples-to-apples via git stash flow (same protocol as Compact Density Pass, see `.dev-stack/b*-capture.ts` gitignored scripts already in place):
   - **Desktop 1920×1080, sidebar OPEN** — 2 frames: multi-player 3-seat mid-mano (early street, 0–2 community cards), and advanced state (CALLE 5/6 — 4 community cards visible).
   - **Mobile 390×844** — same 2 frames, sanity check only (mobile must show zero perceptual delta from baseline).
   - Output: `.dev-stack/diag/perceptual-framing/{baseline,L1}/mano-completa-{desktop,mobile}.png` (gitignored). Baseline regenerated from HEAD `0acfb1f` via `git stash` + capture + `git stash pop` to ensure apples-to-apples.
5. **Share with user:**
   - Live URL `http://localhost:5173/` (user opens in real browser, sidebar open, validates perceptually).
   - + screenshots committed to `.dev-stack/diag/perceptual-framing/` as reference (not for review-driving — runtime is authoritative).
6. **User reviews perceptually** in real browser, applies the Stop Criteria checklist (next section).

---

## Stop criteria (perceptual checklist)

After viewing the active level in real runtime at 1920×1080 with sidebar open:

| Dimension | Direction | Check |
|---|---|---|
| Action dominance | **+ (want more)** | Does board + holes + chrome chips dominate more perceptually? |
| Camera closeness | **+ (want more)** | Does the mesa feel closer, less "lejana"? |
| Breathing room | **preserve** | Is breathing between elements still intact? |
| Crowdedness | **avoid** | Does it start to feel tight, hyper-compact? |
| Casino drift | **avoid** | Does it start to feel like PokerStars / IDN / generic modern poker density? |
| Castizo identity | **preserve** | Wood / gold / felt gradient / oval / vocab all intact? |
| Elegance | **preserve** | Does it lose castizo elegance? |

### Decision tree

- ✅ **Action + closeness improve AND no red flags** → **STOP at this level. Commit. Sprint closes.**
- ⚠️ **Small improvement, brain says "still distant" AND no red flags** → user explicitly authorizes escalation → bump to next level → repeat protocol.
- 🛑 **Any red flag triggered (crowdedness / casino / elegance loss)** → **ROLLBACK working tree. No commit. Re-frame.**
- 🤔 **Indistinguishable from baseline** → hypothesis is wrong. **STOP. Discuss with user.** Possibly the residual driver is not surface-to-viewport ratio after all (see Open Questions).

**Default outcome:** STOP at L1. The user has stated explicitly that perfecting the last 5% is not worth the risk of casino drift or breathing-room loss.

---

## Rollback path

**Strategy: single atomic commit at the final approved level.** All probe iterations live in working tree only; no intermediate commits.

- L1 approved → 1 commit on `main`: `feat(table): perceptual framing pass L1 — desktop +6% proportional scale, mobile preserved`.
- L1→L2 escalation → working tree mutates to L2 values; no commit between.
- Rollback at any pre-commit point → `git checkout -- frontend/src/style.css frontend/src/game/table/TableScene.ts` clears working tree.
- Rollback after commit (commit was a mistake post-shipping perception) → `git reset --hard HEAD~1` (single self-contained commit; no dependents).
- Tests and dev:stack remain active throughout the loop for tight feedback. If vitest unexpectedly breaks (it should not — value-only changes, no logic changes), pause and diagnose before continuing.

---

## Sprint scope (locked)

### IN

- ✅ Approach B refined: 3-level probe ladder; L1 obligatory first.
- ✅ Mobile-safe refactor (instance fields + DESKTOP_* / MOBILE_* paired constants).
- ✅ Runtime validation gating each level before escalation.
- ✅ Apples-to-apples Playwright captures via git stash flow.
- ✅ Static verification (`tsc --noEmit` + vitest 225/225) per probe level.

### OUT (deferred — conditional on residual after step 1)

- ⏸️ Step 2 of original sprint plan (felt-to-cards ratio specific fix) — only if L1/L2/L3 leave #1 residual.
- ⏸️ Step 3 (micro-ajustes internos) — only if steps 1+2 leave residual.

### OUT (rejected explicitly with rationale)

- ❌ Approach A pure (max-width only) — worsens felt-to-cards ratio.
- ❌ Approach C (`transform: scale`) — anti-aliasing degradation + layout flow overlap.
- ❌ Aggressive max-width (≥ +20%) — user-vetoed.
- ❌ Chrome collapse aggressive — does not address horizontal viewport gap.
- ❌ Sidebar forced collapse — changes functionality, not chrome neutral.
- ❌ Any HTML mockup work / V5+ direction — user-vetoed.
- ❌ Pixi internals (custom Graphics, shaders, scene-graph restructuring).
- ❌ Seat repositioning / oval geometry change.
- ❌ Wood border / gold rim / felt gradient adjustment.
- ❌ Header layout / castizo vocab change.
- ❌ Architecture churn (no manager / engine / schema / framework changes).
- ❌ Casino-clone / hyper-density drift in any form.

### Identity invariants 🔒 (preserved through all levels)

- Wood border 16px solid `var(--wood-mid)`.
- Gold rim 3px `rgba(244, 196, 48, 0.6)` via `.table-surface::before`.
- Felt radial gradient (`#0f8f6a 0% → var(--felt-main) 45% → var(--felt-dark) 100%`).
- Oval geometry (`border-radius: 50% / 38%`).
- Seat CSS positions (6%/94% — Slice A1 lock).
- Castizo vocab (Pasar/Igualar/Tirar/Envidarse/Apostar/Subir, Bote, Esperando, etc.).
- Cards Fournier `.webp` assets.
- Chrome compositive structure (header / badges / action bar).

---

## Open questions / risks

### Risks

- **L1 produces no perceptible delta from baseline.** Hypothesis (surface-to-viewport ratio) may be wrong. Mitigation: stop, re-frame; no value-driven changes shipped without runtime confirmation.
- **L1 produces a perceptible delta but introduces casino drift or breathing-room loss.** Mitigation: rollback working tree; no commit. Replan from a different hypothesis (e.g., maybe the issue is sidebar-area, not table-area).
- **Mobile regression slips in via the refactor.** Mitigation: capture protocol explicitly includes mobile sanity check at 390×844 every level; mobile constants paired explicitly with `MOBILE_*` prefix to avoid accidental coupling to desktop probe values.
- **Mid-session viewport flip (desktop↔mobile) keeps stale card sizes.** Mitigation: consciously accepted trade-off; matches current behavior; documented in implementation section.
- **TypeScript compile breaks via the refactor.** Mitigation: `tsc --noEmit` step in capture protocol; refactor is mechanical (constant rename + field addition), low risk.
- **Captures from prior sprint scripts diverge in environment** (e.g., dev:stack flakiness, seeded data drift). Mitigation: git stash flow re-runs baseline capture at start of each level; not relying on stale baseline snapshots.

### Open questions (out of scope for this sprint, captured for future)

- If L1 does NOT improve the perception, is the residual driver something else? Candidates: (a) sidebar width 300px eats too much viewport — could investigate user-driven collapse default vs lower default width; (b) `#table` padding 40/20 outer chrome eats space — could probe small reduction; (c) felt vignetting/gradient bias — could probe shifting the felt's visual focal point. **All deferred — not part of this sprint.**
- Should larger 16:9 monitors (1440p / 2560×1440 and above) or 21:9 ultra-wide setups get their own probe ladder optimization? Probably yes long-term, but only after the 1920×1080 sweet spot is found and shipped. Deferred.

---

## Acceptance criteria for this spec

- [x] User-perceived problem captured verbatim.
- [x] Framing math derived from real CSS values (not assumed).
- [x] Hypothesis stated explicitly with diagnostic confirmation from user.
- [x] All approaches considered (A, B, C) with rejection rationale.
- [x] Selected approach (B refined) with conservative probe ladder.
- [x] Mobile-safe refactor pattern specified at line-level granularity.
- [x] Capture protocol specified — runtime + comparative screenshots + stash flow.
- [x] Stop criteria specified with explicit decision tree.
- [x] Rollback path single-commit atomic.
- [x] Sprint scope IN/OUT/LOCKED enumerated.
- [x] Identity invariants enumerated.
- [x] Risks + open questions captured.

---

## Predecessor / related context pointers

- `docs/HANDOFF_COMPACT_DENSITY_PASS.md` — Compact Density Pass shipped (HEAD `0acfb1f`).
- `docs/HANDOFF_RUNTIME_DIAG.md` — Runtime Diagnostic CLOSED (Phase A+B+C+D Primary).
- `.claude/projects/C--Users-Usuario/memory/project_chiribito_compact_density_pass.md` — sprint memory snapshot.
- `.claude/projects/C--Users-Usuario/memory/feedback_chiribito_north_star.md` — 6-principle visual gate.
- `.claude/projects/C--Users-Usuario/memory/feedback_chiribito_disciplined_format.md` — 6-point format.
- `.claude/projects/C--Users-Usuario/memory/feedback_chiribito_browser_e2e_lesson.md` — runtime-first lesson.
- `frontend/src/game/table/TableScene.ts:23-26` — constants under modification.
- `frontend/src/style.css:3298-3312` — `.table-surface` under modification.
