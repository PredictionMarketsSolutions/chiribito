# Chiribito — Compact Density Pass Handoff (session 2026-05-19, post-runtime-diag)

> # COMPACT DENSITY PASS OFFICIALLY SHIPPED — 2026-05-19
>
> Surgical 8-value tuning of TableScene + style.css that resolves the desktop dispersion problem (board flotando, chrome separado, ligera falta de cohesión) while preserving 100% of Chiribito's baseline identity (wood, gold rim, felt oval, gradient, padding lateral, seats CSS, action bar, header chrome structure).
>
> Mobile preserved at baseline `boardCenter.y=0.44` to protect Phase-D-Primary clearance between community cards and "TUS CARTAS" label. Desktop bajado a `0.48` (tercio medio). Cards `52→60` (modest +15%).
>
> **No casino-clone. No reinvention. No "mockup raro". Sigue siendo Chiribito.**
>
> Predecessor: `docs/HANDOFF_RUNTIME_DIAG.md` (Runtime Diagnostic CLOSED, Phase D Primary SHIPPED).

---

## CURRENT STATUS

| Field | Value |
|-------|-------|
| **HEAD (code commit)** | `f112cbc` `feat(table): compact density pass — desktop tuning + mobile preserved` |
| **HEAD (origin/main)** | `f112cbc` — synced |
| **Predecessor HEAD** | `f177b94` (Runtime Diagnostic officially closed) |
| **Working tree** | clean except `.superpowers/` + `_screenshots/` (both gitignored) |
| **Sprint** | Compact Table / Gameplay Density — **SHIPPED** |
| **Diagnostic status** | Runtime Diag CLOSED. Compact Density Pass CLOSED. |

---

## WHAT SHIPPED — exact diff

### `frontend/src/game/table/TableScene.ts`

**Module-level constants (lines 23-26)** — proportional bump:

```diff
- const CARD_W = 52;
- const CARD_H = 78;
- const BOARD_SPREAD = 58;
- const HOLE_SPREAD = 20;
+ const CARD_W = 60;
+ const CARD_H = 90;
+ const BOARD_SPREAD = 67;
+ const HOLE_SPREAD = 23;
```

**Inside `measureLayout()` (line 187-191)** — desktop bajado, mobile preservado:

```diff
- this.boardCenter = { x: w * 0.5, y: h * 0.44 };
- this.deckPos = { x: w * 0.5, y: h * 0.36 };
+ // Compact Table sprint — desktop bajado al tercio medio, mobile preservado en
+ // baseline 0.44 para no comprometer la claridad vertical post-Phase-D-Primary.
+ const mobile = typeof window !== "undefined" && window.innerWidth <= 768;
+ this.boardCenter = { x: w * 0.5, y: h * (mobile ? 0.44 : 0.48) };
+ this.deckPos = { x: w * 0.5, y: h * (mobile ? 0.36 : 0.40) };
```

### `frontend/src/style.css`

**`.table-surface` (line 3306)** — padding superior compactado:

```diff
- padding: 60px 70px;
+ padding: 44px 70px;
```

**`.table-header` (line 3372)** — margin-bottom compactado:

```diff
- margin-bottom: 32px;
+ margin-bottom: 16px;
```

**Total**: 8 valores cambiados, 2 archivos, 11 insertions / 8 deletions (1 commit, reversible).

---

## RATIONALE PERCEPTUAL FINAL

### El problema que se resolvió

Después del Runtime Diagnostic (Phase A+B+C+D), quedó identificado que `cardAreaPctOfFelt=2.81%` desktop era RED, pero reclasificado **fuera del diagnostic** (no era runtime issue) como territorio de gameplay composition. El sprint subsecuente debía resolver:

1. **Board demasiado arriba** (`boardCenter.y=0.44` en felt 640+px = board flotando en mitad superior)
2. **Pot demasiado separado** del board (~200px de chrome zone entre pot chip y community cards)
3. **Ligera dispersión** general (cartas chicas, chrome amplio, mucha respiración entre elementos activos)
4. **Falta de cercanía perceptual** sin perder elegancia

### La trampa que se evitó

Durante exploration (4 iteraciones de mockups V1→V4), hubo deriva hacia "casino-clone direction": estudio de LobbyVIP/IDN/PokerStars como **target estético** en lugar de **diagnóstico**. Las propuestas escalaron a `CARD_W=84-96`, `felt=860-900`, `seats=12%/88%`, `pot=below board integrated` — composiciones agresivas que cruzaban el límite del alma original de Chiribito.

**El usuario detectó la sobrecorrección y forzó recalibración**: "Antes de esta exploración, las cartas y la mesa SE SENTÍAN MEJOR. Tenían dispersión, sí, pero tenían alma. Ahora siento que estamos sobrepensando composición y alejándonos del game feel real."

**El hallazgo central del sprint**:
> Chiribito no necesitaba reinventarse. Necesitaba correcciones perceptuales suaves preservando la identidad original.

### Decisión final (locked)

| Decisión | Valor | Por qué |
|----------|-------|---------|
| `CARD_W` desktop + mobile | 52 → **60** (+15%) | Mínimo bump que resuelve diagnostic. 72/84/96 sacaban del alma original. |
| `boardCenter.y` desktop | 0.44 → **0.48** | Board sienta en tercio medio. Cohesión clara. |
| `boardCenter.y` mobile | **0.44** (preservado) | Protege clearance Phase-D-Primary entre community + TUS CARTAS. |
| `deckPos.y` | tracks boardCenter | Deal animation arc preserved (deck → board feels right). |
| `.table-surface padding-top` | 60 → **44px** | Pot/phase/turn/timer chrome 16px más cerca del felt. |
| `.table-header margin-bottom` | 32 → **16px** | Header row → felt gap halved. Chrome ya no se siente separado. |
| Mobile detection | JS `window.innerWidth <= 768` | Match canonical breakpoint (multiple uses in style.css). |

### Trade-offs documentados

- **Mobile boardCenter.y es JS-detected**, no CSS media query. Razón: el valor vive en `TableScene.measureLayout()` (Pixi runtime), no en CSS. ResizeObserver re-trigger al rotate device. Aceptado como trade-off — alternativa sería CSS variable, más infrastructure por value único.
- **Cards en mobile crecen también (CARD_W=60)** — el bump es global, no desktop-only. Acción intencional: cartas levemente más legibles también ayudan en mobile sin tocar layout vertical.
- **Header chrome compress aplica a desktop solamente** vía cascada normal (mobile @media `.table-header { margin-bottom: 16px }` ya tenía ese valor — coincidencia que el desktop converge ahí).

---

## VERIFICATION — runtime real, no mockups

### Tests (post-edit, post-mobile-revert)

| Suite | Resultado |
|-------|-----------|
| frontend vitest | **225/225 PASS** ✅ |
| game-server jest | **475/475 PASS** ✅ |
| api-server jest | **27/27 PASS** ✅ |
| **Total** | **727/727 PASS** — zero regression |

### Runtime captures (multi-player 3-seat mid-mano)

Real apples-to-apples via git stash flow. Both states captured from same dev:stack, same multi-player flow, same Playwright harness.

| State | Path | community | desktop | mobile |
|-------|------|-----------|---------|--------|
| **BEFORE** baseline (52/0.44/0.36) | `.dev-stack/diag/baseline/` | 2 | `mano-completa-desktop.png` | `mano-completa-mobile.png` |
| **AFTER** mid-mano (post-mobile-revert) | `.dev-stack/diag/after/` | 2 | `mano-completa-desktop.png` | `mano-completa-mobile.png` |
| **BEFORE** advanced (52/0.44/0.36) | `.dev-stack/diag/before/advanced/` | 4 | `mano-completa-desktop.png` | `mano-completa-mobile.png` |
| **AFTER** advanced (60/0.48 desktop, 60/0.44 mobile) | `.dev-stack/diag/after/advanced/` | 4 | `mano-completa-desktop.png` | `mano-completa-mobile.png` |

Capture scripts (untracked, in `.dev-stack/`, gitignored — preserved locally as diagnostic record):
- `.dev-stack/b1-baseline-capture.ts` (pre-existing, from Runtime Diag Phase B1)
- `.dev-stack/b1-after-capture.ts` (this sprint — 2-community mid-mano capture)
- `.dev-stack/b1-advanced-capture.ts` (this sprint — 4+ community advanced state capture)

### Perceptual reading (user-validated)

> Desktop: cohesión y presencia ganadas sin perder alma. Board ya no flota. Chrome ya no separado. Cartas con peso sin dominar.
>
> Mobile: Phase D Primary clearance preservada. Cartas levemente más legibles. Mesa intacta compositivamente.
>
> Identity: sigue siendo Chiribito. No "mockup raro". No casino-clone.

---

## WHAT WAS APPROVED · WHAT WAS DISCARDED

### Approved (shipped)

✅ `CARD_W=60` (modest bump from 52)
✅ Desktop `boardCenter.y=0.48`
✅ Mobile `boardCenter.y=0.44` (revert)
✅ Header chrome compaction (60→44 padding, 32→16 margin)
✅ Proportional `BOARD_SPREAD` + `HOLE_SPREAD` scaling
✅ `deckPos` tracking `boardCenter` proportionally

### Discarded during exploration (do NOT propose again without explicit go)

❌ `CARD_W ≥ 72` — sacaba del alma original. Tested in mockup V2-V4, user pushed back.
❌ `CARD_W = 84/96` — territorio "casino-loud" no "premium-elegant". Tested in mockup V3 "Modern" + "Compact" candidates.
❌ Felt shrink (`max-width: 980 → 860`) — comprime identidad. Tested in mockup V3-V4.
❌ Seat repositioning (`6%/94% → 12%/88%`) — pierde la "respiración alrededor del oval". Tested in mockup V3-V4.
❌ Pot relocation (below board, integrated) — rompe expectativa poker tradicional. Tested in mockup V3-V4.
❌ Wood border thinning (16px → 8-10px) — identidad sagrada. Not proposed in final V4.
❌ Gold rim removal — identidad sagrada.
❌ Felt gradient change — verde Chiribito es marca.
❌ Pot relocation to absolute floating element — estructural, no minimal.

### Discarded mockup iterations (NO REOPEN)

❌ Mockup V1 (CARD_W 52→64→72→84→96 abstract geometric)
❌ Mockup V2 (real visual language, CARD_W 64/72 × boardY 0.44/0.48 grid)
❌ Mockup V3 (composition spectrum baseline + Tuned + Modern + Compact — used LobbyVIP/IDN as target instead of diagnostic)
❌ Mockup V4 (balanced cohesion pass — Cercanía Suave / Plena)

**No V5/V6/Vn**. Iteration mockup-loop officially closed. Future tuning happens on runtime, no más HTML mockups.

---

## RESTRICTIONS STABILIZED (carry-forward)

### Identity invariants — NO TOUCH sin "go" explícito

🔒 Wood border 16px `#8b5a3c`
🔒 Gold rim interior `rgba(244, 196, 48, 0.6)`
🔒 Felt oval `border-radius: 50% / 38%`
🔒 Felt radial gradient `#0f8f6a → #054a36` (verde Chiribito, no verde casino)
🔒 Felt `max-width: 980px` desktop
🔒 Felt `padding: 44px 70px` (lateral preserved, vertical compacted in this sprint)
🔒 `.table-header` structure (pot row + meta row)
🔒 Seat CSS positions (`6%/94%`, `10%/90%`) — NO seat hugging closer
🔒 Seat width 160px
🔒 Action button bar bottom-right (CHECK/CALL/FOLD/ALL-IN)
🔒 Card popover styling (`card-popover.ts`)
🔒 Castizo vocabulary lock (Pasar/Igualar/Tirar/etc.)
🔒 Fournier-style Spanish deck `.webp` assets

### From Runtime Diagnostic (inherited)

🔒 `frontend/src/security/perf-mode.ts` — Heisenberg discipline
🔒 `frontend/src/perf/perf-counters.ts` — counter shape stable for matrix.json compatibility
🔒 B1 baseline pair PNGs at `.dev-stack/diag/baseline/` — historical reference
🔒 TableScene constructor / destroy — Pixi continuity
🔒 `frontend/src/connection.ts` (except `attachPerfWsCounters` from Phase A)
🔒 `frontend/src/reconnect-director.ts` — Move 2 critical
🔒 `frontend/src/auth/recover-or-lobby.ts` — Move 1.5 recovery
🔒 `src/rooms/**` (game server engine)
🔒 `api-server/src/**` (auth/migrations)
🔒 `frontend/public/cards/*.webp`, `frontend/public/brand/*` — branding canon

---

## NEXT — NO AUTO-START

Per Chiribito modus operandi: **next session opens fresh with explicit user framing**. NO auto-start of subsequent work. NO assumption that another tuning pass is needed.

### Optional next directions (the user opens explicitly)

⏳ **Phase W**: landing fork from `polito101/WEB-CHIRIBITO` (Next.js) → integrate with `play.chiribito.com`
⏳ **Phase A apex cutover**: `chiribito.com` → currently NOT pointing to play; production deploy decision
⏳ **Optional backlog from Runtime Diag** (only if user revisits):
  - `#7 mobile-GPU + thermal` on real Android USB
  - `#1 frame-pacing real-prod retest` on 60Hz hardware
  - longer-window texture-memory capture
  - formal Phase E closure
⏳ **New gameplay sprints** (chat history / observer mode / hand history / etc.) — outside this sprint's scope

### NOT next

❌ No another composition pass — the area is calibrated
❌ No mockup iteration on the same axes
❌ No casino-direction revisit

---

## CAVEATS PENDING

### Known limitations

1. **Mobile boardCenter.y check is JS-based** (`window.innerWidth <= 768`), not CSS media query. Works correctly but introduces a JS branch in `measureLayout()`. If future sprints add tablet-specific breakpoints, consider migrating to CSS variable pattern:
   ```css
   :root { --board-y: 0.48; }
   @media (max-width: 768px) { :root { --board-y: 0.44; } }
   ```
   ```ts
   const boardY = parseFloat(getComputedStyle(...).getPropertyValue('--board-y'));
   ```
   Not done in this sprint — minimal change discipline.

2. **`.dev-stack/b*-capture.ts` scripts are local-only** (gitignored). If disk wipes, scripts must be regenerated from this handoff's content list. Bumping them to `docs/` is a future cleanup decision.

3. **Tests run was `npm test` at root + `cd api-server && npm test` + `cd frontend && npx vitest run`** — covers the full 727. Playwright E2E (`scripts/e2e-browser.ts`, 40 steps) NOT re-run this session because the changes are visual/spatial only. If user wants E2E confirmation, run `npx tsx scripts/e2e-browser.ts` (requires dev:stack alive).

4. **The dev:stack was left running** at end of session (postgres 5432 / api 3000 / game 2567 / frontend 5173). User to terminate manually if not continuing immediately (background task `bzt7tuacp` per session log).

### Not caveats — just remembering

- HEAD `f112cbc` is the production code state. `f177b94` was Runtime Diag close-out.
- Origin/main fully synced.
- No untracked-but-tracked-worthy files. `.superpowers/` (brainstorm session content) and `_screenshots/` (Playwright cache) are gitignored expectation.
- Mobile @media `(max-width: 768px) .table-header { margin-bottom: 16px }` already had the same value the desktop now converges to. Pure coincidence.

---

## RESUME PROTOCOL — RETIRED

This sprint is officially closed. There is no resume of the compact-density-pass sprint.

When the user opens the next Chiribito session ("Hola Chiribito" / equivalent), do NOT re-enter this sprint flow. Read:
1. `project_chiribito.md` (memory) — global Chiribito state
2. `project_chiribito_compact_density_pass.md` (memory) — this sprint summary
3. `docs/HANDOFF_COMPACT_DENSITY_PASS.md` (this file) — full close-out

…for state-of-the-world, but treat any new work as a fresh sprint with its own scope, plan, and no-touch list.

---

## ARTIFACTS INVENTORY

### Committed to repo (HEAD f112cbc)

```
frontend/src/game/table/TableScene.ts                          (M — 4 const + measureLayout branch)
frontend/src/style.css                                          (M — 2 vars)
```

### Local-only (gitignored, preserved as record)

```
.dev-stack/diag/baseline/mano-completa-desktop.png             (596 KB — pre-sprint baseline)
.dev-stack/diag/baseline/mano-completa-mobile.png              (1003 KB — pre-sprint baseline)
.dev-stack/diag/after/mano-completa-desktop.png                (post-edit, 2 community)
.dev-stack/diag/after/mano-completa-mobile.png                 (post-mobile-revert, 2 community)
.dev-stack/diag/before/advanced/mano-completa-desktop.png      (52/0.44, 4 community, stash flow)
.dev-stack/diag/before/advanced/mano-completa-mobile.png       (52/0.44, 4 community)
.dev-stack/diag/after/advanced/mano-completa-desktop.png       (60/0.48 desktop, 4 community)
.dev-stack/diag/after/advanced/mano-completa-mobile.png        (60/0.44 mobile, 4 community)
.dev-stack/b1-baseline-capture.ts                              (from Runtime Diag Phase B1)
.dev-stack/b1-after-capture.ts                                 (this sprint, mid-mano)
.dev-stack/b1-advanced-capture.ts                              (this sprint, advanced state)
.superpowers/brainstorm/2157-1779201866/content/*.html         (V1-V4 mockup HTMLs, retired)
```

### Memory persistente (`~/.claude/projects/C--Users-Usuario/memory/`)

- `MEMORY.md` — index (updated this session)
- `project_chiribito.md` — Chiribito project resume point (HEAD updated to f112cbc)
- `project_chiribito_compact_density_pass.md` — this sprint summary (new)
- `project_chiribito_runtime_diag.md` — Runtime Diag CLOSED (unchanged historical record)
- `feedback_chiribito_north_star.md` — 6 visual principles
- `feedback_chiribito_disciplined_format.md` — 6-point format
- `feedback_chiribito_browser_e2e_lesson.md` — tests-green-≠-UX-works
- `feedback_chiribito_castizo_vocabulary.md` — vocabulary lock
- All other historical Chiribito memory files unchanged

---

## ROADMAP CONTEXT

```
✅ Move 1 (auth recovery)
✅ Move 1.5 (post-login + reload recovery)
✅ Move 2 (mid-game WS reconnect)
✅ Slice A1 (chrome cleanup)
✅ Slice A2.0 (sidebar dev-strings hide + castizo)
✅ Phase G + P (production deploy, play.chiribito.com live)
✅ Runtime Diag spec + plan + Phase A instrumentation
✅ Runtime Diag Phase B captures (8/9; #7 reclassified to backlog)
✅ Runtime Diag Phase C findings + sequencing (P1+P5 bucket)
✅ Runtime Diag Phase D Primary (mobile labelIntrusionPct 13.73 → 0)
🔒 Runtime Diagnostic OFFICIALLY CLOSED (2026-05-19)
✅ Compact Density Pass (CARD_W 60 + boardCenter.y 0.48 desktop / 0.44 mobile + chrome compaction)
🔒 Compact Density Pass OFFICIALLY CLOSED (2026-05-19)
⏳ Optional backlog: #7 real-Android, #1 real-prod retest, long-window texture-memory, formal Phase E
⏳ Phase W (landing fork from polito101/WEB-CHIRIBITO Next.js)
⏳ Phase A apex cutover (chiribito.com)
```

---

## REFERENCES

### In-repo
- `frontend/src/game/table/TableScene.ts:23-26, 187-191` — the 6 TableScene values
- `frontend/src/style.css:3306, 3372` — the 2 CSS values
- `docs/HANDOFF_RUNTIME_DIAG.md` — predecessor diagnostic closure
- `docs/HANDOFF_A2.0.md` — Slice A2.0 closure (still valid for sidebar/castizo lock)
- `docs/HANDOFF_A1.md` — earlier handoff
- `docs/RECONNECT_FINDINGS.md` — Move 1/1.5/2 reconnect saga
- `docs/superpowers/specs/2026-05-18-chiribito-visual-audit.md` — original static screenshot audit (Slices A-G baseline)

### Memory persistente
- See "Memory persistente" section above

### External (referenced as DIAGNOSTIC only, never as TARGET)
- LobbyVIP / IDN poker layouts — modern compact table density patterns
- Zynga Poker — cinematic action-centric composition
- PokerStars — classic green felt poker table

These were used in mockup V3 exploration as **data points for understanding modern poker density principles** (cards 7.5-10% felt-width, board 55-65% felt-inner, pot near board, seat hugging, central density). They are NOT a stylistic target. Chiribito has its own visual language.

---

**End of Compact Density Pass handoff. Sprint closed. Origin synced. Ready for next direction (user opens).**
