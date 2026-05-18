# Chiribito — Handoff post-Slice A2.0

> Production-grade handoff para abrir una sesión nueva en limpio sin pérdida de contexto.
> Generado 2026-05-18. Fuente canónica: este doc + memoria persistente en `~/.claude/projects/C--Users-Usuario/memory/`.
> Predecesor: `docs/HANDOFF_A1.md`.

---

## ESTADO ACTUAL OFICIAL

| Campo | Valor |
|-------|-------|
| **HEAD** | `d5fd6aa` (push live en `origin/main` desde 2026-05-18) |
| **A2.0 closure commit** | `d5fd6aa` |
| **A2.0 slice range** | `c0365d2..d5fd6aa` (5 commits atómicos) |
| **A1 closure commit (anterior)** | `5ee6338` |
| **Slice activo** | NINGUNO — A2.0 cerrado y pusheado. Esperando "go" del user para abrir Slice B |
| **Tests vitest frontend** | **217/217 PASS** (213 prior + 4 nuevos en `debug-mode.test.ts`) |
| **Tests jest game-server** | **475/475 PASS** (unchanged — no code tocado) |
| **Tests jest api-server** | **27/27 PASS** (unchanged) |
| **E2E Playwright** | **40/40 PASS** confirmado vía `_results.json` Run 3 de 3 sequential runs |
| **Working tree** | limpio (solo `_screenshots/` + `.dev-stack/` gitignored) |
| **Visual baseline (canon Move polish)** | `.dev-stack/visual-audit__pre_polish_baseline/` (30 files — 29 PNG + measurements.json) |
| **Visual after A2.0** | `.dev-stack/visual-audit__A2.0_after/` (30 files) |
| **Deploy** | NO desplegado (user-locked decision) |

---

## Qué se ha cerrado

### Slice A2.0 — Sidebar dev-strings demolition + castizo headings (`c0365d2..d5fd6aa`)

Primer slice del Move polish post-A1. Scope user-locked: **estrictamente demolition + castizo, zero redesign, zero layout, zero A2.1 drift**.

| Commit | Tipo | Qué entregó |
|--------|------|-------------|
| `c0365d2` | docs | A2.0 design spec |
| `ba15995` | docs | A2.0 TDD plan |
| `bd5229a` | feat | `isDebugEnabled` helper + `body.debug-mode` bootstrap (single boot read de `import.meta.env.DEV \|\| URLSearchParams.has('debug')`; pure function; SSR-safe guard; 4 vitests pin truth table) |
| `9d67fdc` | chore | 6 dev-protocol rows marcadas `class="debug-only"` (Latencia/Calidad/Buffer/API/WS/Token) + 3 castizo headings (Players→Jugadores, Hand History→Historial, Activity→Actividad) + 4 lines CSS al EOF de `style.css`. **Amended una vez** (`e890c94→9d67fdc`) tras code review catched CSS specificity bug. |
| `d5fd6aa` | docs | A2.0 closeout — "What landed" en el spec |

### Behavior matrix logrado

| Env | URL | Dev-protocol rows visibles |
|-----|-----|----------------------------|
| `npm run dev:stack` (DEV=true) | any | **Sí** (body.debug-mode set) |
| Production build, default URL | `chiribito.com/mesa` | **No** ← objetivo logrado |
| Production build, `?debug=1` o presencia | `chiribito.com/mesa?debug=1` | **Sí** |
| Production build, `?debug=0` | `chiribito.com/mesa?debug=0` | **Sí** (presence-only contract) |

Headings castizos visibles en TODOS los environments unconditionally.

### Move 2 / Move 1.5 / Slice A1 (anteriores) — INTACTOS

- Move 2 (mid-game WS reconnect): `reconnect-director.ts` epoch-locked, calibrated backoff, 5s per-attempt timeout, heartbeat 5s/10s, discreet banner. E2E steps 8–12 verdes.
- Move 1.5 (reload + post-login recovery): `client.reconnect(reconnectionToken)` primitive, `recoverMesaOrOpenLobby` decision tree.
- Slice A1 (chrome cleanup): castizo copy + pot dedup + meta pills hide + contextual action panel.

---

## Documentos canónicos (leer en este orden)

### Operativos en el repo

1. **`docs/superpowers/specs/2026-05-18-chiribito-slice-A2.0-sidebar-debug-design.md`** — spec A2.0 con "What landed" section al final (commit map, file touch list, test counts, visual diff, behavior matrix, risks observed, carry-forwards).
2. **`docs/superpowers/plans/2026-05-18-chiribito-slice-A2.0-sidebar-debug.md`** — TDD plan ejecutado (referencia).
3. **`docs/superpowers/specs/2026-05-18-chiribito-slice-A1-chrome-cleanup-design.md`** — spec A1 cerrado.
4. **`docs/superpowers/plans/2026-05-18-chiribito-slice-A1-chrome-cleanup.md`** — plan A1 ejecutado.
5. **`docs/superpowers/specs/2026-05-18-chiribito-visual-audit.md`** — audit visual original (baseline de los P0/P1/P2/P3 findings + roadmap propuesto A→G).
6. **`docs/superpowers/specs/2026-05-18-chiribito-move-2-design.md`** — spec Move 2 (reconnect).
7. **`docs/HANDOFF_A1.md`** — handoff anterior (referencia A1).
8. **`docs/HANDOFF_A2.0.md`** — este doc.
9. **`docs/RECONNECT_FINDINGS.md`** — origen Move 1 → 1.5 → 2 reconnect saga.
10. **`docs/ARCHITECTURE.md`** — arquitectura general.

### Memoria persistente (`~/.claude/projects/C--Users-Usuario/memory/`)

- `MEMORY.md` — índice general (entry Chiribito actualizada con HEAD `d5fd6aa`).
- `project_chiribito.md` — estado operativo + roadmap (RESUME POINT actualizado al cierre A2.0).
- `feedback_chiribito_approach.md` — modo de trabajo (lead engineer).
- `feedback_chiribito_north_star.md` — 6 principios visuales (tactility / mesa viva / claridad / ritmo / social-first / premium AAA).
- `feedback_chiribito_disciplined_format.md` — formato 6-puntos pre-cambio.
- `feedback_chiribito_browser_e2e_lesson.md` — "tests verdes ≠ UX funciona".
- `feedback_chiribito_colyseus_reconnect.md` — patrón Colyseus.
- `feedback_chiribito_e2e_multiplayer.md` — E2E requiere ≥2 jugadores.
- `feedback_chiribito_pixi_continuity.md` — patrón hide-don't-remove para Pixi.
- `feedback_chiribito_visibility_projection.md` — proyectar state-machine sobre nuevo eje sin duplicar lógica.
- `feedback_chiribito_castizo_vocabulary.md` — vocabulary lock canon.
- `feedback_chiribito_a1_root_causes.md` — root causes A1 + criterio "menos dashboard, más mesa" + qué NO tocar.

---

## Sequencing user-locked del Move polish

Decidido en brainstorming 2026-05-18 (post-A1, pre-A2.0). **No rearrancar discusión sin pregunta explícita del user.**

| # | Slice | Estado | Razón sequencing |
|---|-------|--------|------------------|
| **A2.0** | Sidebar dev-strings demolition + castizo headings | ✅ SHIPPED `d5fd6aa` | Micro slice min-risk para borrar P0-1 worst-offending strings sin redesign |
| **B** | Compact-table primitive mobile/tablet | **NEXT — esperando "go" del user** | Mobile-first leverage. Audit: "the largest delta between auth/lobby quality and mesa quality". Builds avatar-puck primitives that A2.1 reuses |
| **A2.1** | Sidebar full redesign (stack visualizer + hand-history component + activity feed) | Después de B | Hereda primitives de B (avatar puck, active-speaker ring) |

### Otras slices candidatas (defer hasta B + A2.1)

| # | Slice | Audit finding | Tamaño | Risk |
|---|-------|---------------|--------|------|
| **C** | Banner visibility en waiting + connection pill | P1-2 + P1-6 | Pequeño | Bajo |
| **D** | Touch targets + mobile chrome | P1-3 + P3 list | Pequeño | Mínimo |
| **E** | Table depth + tactile press | P1-5 + P2-1/2 | Medio | Bajo |
| **F** | Empty states + voice + ranking | P1-4 + P2-3/4/6 + P3 | Pequeño | Mínimo |

---

## Dirección visual / perceptual (canon — leer antes de cualquier slice del Move)

### 6 principios no negociables (`feedback_chiribito_north_star.md`)

1. **TACTILIDAD** — acciones físicas, con peso. Deal/bet/call/collect con motion real.
2. **MESA VIVA** — nunca congelada/vacía/plana. Micro motion + glow + breathing + profundidad, incluso en idle.
3. **CLARIDAD EXTREMA** — turn/player-state/action/stack en milisegundos.
4. **RITMO VISUAL** — entrar → anticipar → impactar → asentarse. Cinematic dealing.
5. **SOCIAL-FIRST** — espacio social competitivo divertido, NO herramienta de poker.
6. **PREMIUM AAA** — limpieza, cohesión, contraste, profundidad, glow elegante.

### Criterio "menos dashboard, más mesa viva" (`feedback_chiribito_a1_root_causes.md`)

- Menos dashboard / Más mesa viva
- Menos tooling / Más experiencia social
- Menos ruido / Más claridad
- Premium controlado (gold + dark navy + serif editorial — chiribito.com canon)
- Tactilidad incremental sin overlays gratuitos

### Asset discipline (no negociable)

- **NO rehacer cartas premium oficiales** (Fournier, `frontend/public/cards/*.webp`) — canon.
- **NO rehacer mascotas oficiales** (`pato_y_toro`, `Character_Images_*`) — canon.
- **NO rehacer branding** (logo, paleta dark + gold + cream serif) — canon.
- El trabajo correcto es **integración**: spacing, layering, shadows, dealing, motion, stacking, placement, dramatismo, feedback, tactile feel.

### Orden temporal

1. **PRIMERO**: stability / reconnect / WS lifecycle (✅ ya hecho en Move 1.5 + 2).
2. **DESPUÉS**: chrome cleanup (✅ A1 + A2.0).
3. **AHORA**: mobile-first mesa fantasy (B), full sidebar (A2.1), connection feedback (C), touch targets (D), table depth/tactility (E), empty states + polish (F).

---

## No-touch list — DO NOT TOUCH sin "go" explícito

| Componente | Por qué |
|-----------|---------|
| `frontend/src/connection.ts` (excepto consts si Slice D toca timing) | Move 2 reconnect director — locked |
| `frontend/src/reconnect-director.ts` | Move 2 — protocolo crítico |
| `frontend/src/auth/recover-or-lobby.ts` | Move 1.5 — recovery |
| `frontend/src/security/secure-storage.ts` `Reconnect*` API | Move 1.5/2 token persistence |
| `frontend/src/game/table/TableScene.ts` constructor / destroy / measureLayout | Pixi continuity — hide-don't-remove pattern |
| `frontend/src/game/phase-indicator.ts` + `phases.ts` | Fase 3 funciona, NO rediseñar |
| `frontend/src/game/game-ui.ts` updateActionButtons líneas 290-340 (canX derivation) | Source-of-truth state-machine, NO duplicar |
| `frontend/index.html` líneas 320-375 (`.seat` rows) | Slice B territory — diseñar antes de tocar |
| `src/rooms/**` (game server) | Engine/managers/schemas/glossary — off-limits salvo go explícito |
| `api-server/src/**` | Auth/email/migrations — off-limits |
| `frontend/public/cards/*.webp`, `frontend/public/brand/*` | Asset discipline — branding canon |
| Castizo vocabulary tabla (`feedback_chiribito_castizo_vocabulary.md`) | NO reabrir vocabulario |
| `frontend/src/security/debug-mode.ts` core contract | A2.0 — pure function, no tocar salvo follow-up explícito |
| Las 12 filas player-facing del status-grid sidebar (Conexión, Mesa, Fase, Habla, Bote, Apuesta, Tu apuesta, Tus fichas, Comunitarias, Tu mano, Jugada, Ganadores) | A2.1 territory — A2.0 NO las tocó a propósito |

---

## Carry-forwards para Slice A2.1 (capturados en cierre A2.0)

Ningún bloqueador. Items para input del A2.1 brainstorm:

### Decisiones de selector/CSS

1. **`.debug-only` está anclada** a `#ui.panel .status-grid > div` por la specificity fix mid-A2.0. NO es utility genérico. Si A2.1 (o cualquier slice) quiere gateear OTROS elementos en `body.debug-mode`, repensar selector strategy: anchored per surface, generalized utility con global specificity (sin `!important` — el codebase tiene cero hoy), o reorganizar.
2. **CSS placement**: el block A2.0 está en EOF de `style.css:4635-4637` en vez de grouped con las `.status-grid` rules línea 1606. Defensible (safety). Cleanup opcional → mover next to related rules.
3. **Naming convention**: `.debug-only` es la primera utility class de su tipo. Codebase usa `is-*` prefix para state flags (`is-active`, `reconnect-banner--hidden`). Decidir convención antes del 2º uso de un body-class-driven utility.

### Pre-existing nits (informational)

4. **SSR guard** en `debug-mode.ts:14` (`typeof window === "undefined"`) es theatrical — codebase es browser-only. Cero risk; cero perf cost; puede limpiarse en sweep futuro.
5. **`isDebugEnabled` re-export** en EOF de `security/index.ts` en vez de en sección labeled. Plan acceptó esto explícitamente.
6. **JSDoc "Read once at boot"** describe convention del caller (main.ts call once), no del function. Función es pura y re-readable.

### Tech-debt observada (defer)

7. **Duplicate `.status-grid` rules** en `style.css:3245-3268` (unscoped, dead code en current markup) + `style.css:1600-1640` (scoped activo). Future cleanup slice.

### Drift documental aceptado

8. Commit body de `9d67fdc` dice "Tests: 217/217 frontend, **471/471 game**, 27/27 api". Real game count es **475/475**. Vino de un Task 1 spec reviewer que midió mal. NO re-amended (disciplina = un amend por slice, ya usado por el CSS fix). Documentado en closeout doc `## What landed` Risks section. Cero impacto operativo — solo un número wrong en un commit body.

---

## Hallazgos arquitectónicos importantes de A2.0 (lecciones)

### 1. CSS specificity siempre se audita contra reglas heredadas, no contra las nuevas entre sí

El bug original en `e890c94` venía de comparar specificity solo entre las dos nuevas reglas (`body.debug-mode .debug-only` > `.debug-only`) sin auditar contra `#ui.panel .status-grid > div { display: flex }` que ya existía en `style.css:1606` con specificity (1,2,1) — mayor que ambas nuevas. **Patrón learned**: cuando una nueva regla aplica a un selector ya gobernado por otro, grep todas las reglas existentes que tocan ese DOM antes de elegir specificity.

### 2. Dev mode + happy-dom enmascaran CSS cascade bugs

- En `npm run dev:stack` siempre `import.meta.env.DEV === true` → `body.debug-mode` siempre se setea → la show rule "would" aplicar (pero pierde cascade igual; outcome accidentalmente correcto porque la regla heredada ya muestra los rows).
- En vitest + happy-dom no hay CSS engine real, así que `getComputedStyle()` no refleja cascade. Los 217/217 verdes NO probaban el outcome visual.
- **Verificación correcta**: `npm run build && grep --selectors -- dist/assets/*.css` para auditar bundle minified. O Playwright real-browser smoke. O manual production build inspection.

### 3. Visibility projection patrón validado en un segundo eje (env boolean)

El pattern de A1.4 (`state → derived booleans → mutation` paralelo a otro eje) ahora se ha aplicado en A2.0 con `env boolean → body class → CSS`. Mismo principio, distinto eje. Reusable para futuros gates condicionales (e.g. feature flags, A/B variants).

### 4. Audit visual baseline canónico para todo el Move

`.dev-stack/visual-audit__pre_polish_baseline/` se capturó ANTES de A2.0 con todos los slices del Move polish en mente. Slice B y A2.1 lo reusan como baseline común. NO re-capturar este baseline durante el Move — solo crear `__<slice>_after/` snapshots.

---

## Cómo retomar (próxima sesión)

### Si el user dice "Hola Chiribito" o equivalente

1. Leer este doc + `project_chiribito.md` (memoria) ANTES de tocar nada.
2. `cd Documents\CHIRIBITO\chiri-infrastructure\chiri-app`.
3. `git log --oneline -8` + `git status --short` — confirmar HEAD = `d5fd6aa` (o un commit nuevo posterior si la sesión avanzó). Si el HEAD difiere y no hay record en este handoff o en memoria: STOP y leer el último commit message.
4. Verificar `git diff origin/main` → vacío (slice A2.0 pusheado).
5. Tests baseline a verificar antes de cualquier cambio:
   - `cd frontend && npm test` → 217/217
   - `cd .. && npm test` → 475/475
   - `cd api-server && npm test` → 27/27
6. Si el user pide validación visual o E2E, **NO** asumir — boot dev-stack y correr `scripts/e2e-browser.ts` o `scripts/visual-audit.ts`.
7. Esperar señal de "abrimos Slice X" o "cambio de foco". NO arrancar trabajo sin "go" explícito.

### Si el user autoriza Slice B (compact-table primitive mobile/tablet) — siguiente locked

- Empezar por **brainstorming skill** (`superpowers:brainstorming`) — política casa, ver `feedback_chiribito_disciplined_format.md` (formato 6-puntos pre-cambio).
- Spec → plan → execute, mismo flujo que A1 y A2.0.
- **Reusar `__pre_polish_baseline`** como visual baseline canon. Crear `__B_after/` post-slice.
- Areas safe to touch: `frontend/index.html:320-375` (las 6 `.seat` rows), `frontend/index.html:393-398` (mobile-seats fallback), `style.css` reglas de `.seat*`, `frontend/src/game/visual-layout.ts` (seat positioning logic).
- Areas to NOT touch en B: TableScene constructor/destroy/measureLayout, reconnect path, sidebar (eso es A2.1), las 12 filas player-facing del status-grid.
- **Riesgo medio sobre Pixi continuity** si la oval cambia aspect ratio. Validar reconnect E2E 40/40 tras cada cambio.

### Si el user autoriza A2.1 antes que B

- Posible pero NO recomendado (los carry-forwards de A2.0 sobre selector/naming se benefician de tener las primitives de B primero).
- Si user insiste: explicar tradeoff, dejar decisión al user.

### Si el user pide otro foco distinto

- Roadmap aún válido: C / D / E / F en cualquier orden.
- Detalles en `docs/superpowers/specs/2026-05-18-chiribito-visual-audit.md` sección "Proposed roadmap".

---

## Riesgos conocidos heredados (no resueltos por A2.0)

1. **Single-player auto-dispose** — `src/rooms/game/GameEngine.ts:440 checkGameEnd()`: user solo en mesa la pierde a cualquier disconnect. E2E mitiga con player2 spawn. Real-prod fix requiere "go" explícito (toca engine).
2. **`idle-timeout-modal` DOM/CSS huérfano** post Move 2. Dead but harmless. Cleanup deferido.
3. **Reconnect banner no aparece en pre-game `Esperando`** (audit P1-2). Cosmetic. Defer a Slice C.
4. **Touch targets sub-44px** en `Unirme`, `Refrescar`, `Salir` (audit P1-3, measurements.json desktop-1440 + mobile-375). Defer a Slice D.
5. **Mobile/tablet mesa fantasy roto** (audit P0-2, P1-1). Specifically Slice B.
6. **`.debug-only` no es utility genérico** post A2.0 (anclada a `#ui.panel .status-grid > div`). Considerar selector strategy en A2.1.

---

## Comandos de validación rápida

```bash
cd C:\Users\Usuario\Documents\CHIRIBITO\chiri-infrastructure\chiri-app

# State sync
git log --oneline -7
git status --short
git rev-parse HEAD                          # debe ser d5fd6aa (o posterior si avanzó)
git fetch origin && git rev-parse origin/main  # debe matchear local

# Tests
cd frontend && npm test                     # 217/217
cd .. && npm test                           # 475/475
cd api-server && npm test                   # 27/27

# Dev stack
npm run dev:stack                           # embedded-postgres + api + game + frontend en localhost:5173

# E2E (necesita dev-stack corriendo)
npx tsx scripts/e2e-browser.ts              # 40/40 PASS
npx tsx scripts/visual-audit.ts             # 30 PNG + measurements.json

# Production smoke (verificación A2.0 hide en producción)
cd frontend && npm run build && npx vite preview --port 5174
# Abrir http://localhost:5174 → 12 filas en sidebar
# Abrir http://localhost:5174/?debug=1 → 18 filas en sidebar
```

Si el dev-stack se rompe (postgres crash 0xC0000142 en Windows tras horas), kill stale + restart:

```bash
netstat -ano | grep ':5432 '                # find postgres PID
taskkill //F //PID <pid>
rm -f .dev-stack/pid
npm run dev:stack                           # restart cleanly
```

---

## Push posture

`origin/main` = `d5fd6aa` desde 2026-05-18. Slice A2.0 oficialmente shipped. Branch sin commits ahead vs remote. Próxima slice continuará en `main` (no PR flow — Chiribito trabaja directo en main per project convention).
