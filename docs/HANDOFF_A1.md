# Chiribito — Handoff post-Slice A1

> Production-grade handoff para abrir una sesión nueva en limpio sin pérdida de contexto.
> Generado 2026-05-18. Fuente canónica: este doc + memoria persistente en `~/.claude/projects/C--Users-Usuario/memory/`.

---

## ESTADO ACTUAL OFICIAL

| Campo | Valor |
|-------|-------|
| **HEAD** | `5ee6338` |
| **Branch** | `main` (push live en `origin/main`) |
| **Slice activo** | NINGUNO (A1 cerrado, esperando autorización del user para abrir A2) |
| **Tests vitest frontend** | **213/213 PASS** |
| **Tests jest game-server** | **475/475 PASS** |
| **Tests jest api-server** | **27/27 PASS** |
| **E2E Playwright** | **40/40 × 3 runs estables** |
| **Working tree** | limpio (solo `_screenshots/` + `.dev-stack/` gitignored) |
| **Visual baseline** | `.dev-stack/visual-audit__A1_baseline/` (29 PNG + measurements.json) |
| **Visual after** | `.dev-stack/visual-audit__A1_after/` (29 PNG) |
| **Deploy** | NO desplegado (sigue siendo decisión user-locked) |

---

## Qué se ha cerrado

### Slice A1 — Chrome Cleanup (`33a7a57..5ee6338`)

Cuatro micro-slices + spec + plan + closeout, todo en `main`:

| Commit | Slice | Qué entregó |
|--------|-------|-------------|
| `33a7a57` | docs | Implementation plan TDD |
| `3bc2928` | A1.1 | Castizo localization sweep (13 strings + 1 test) |
| `5ecdd8e` | A1.2 | Pot dedup (Pixi potText.visible=false + 200ms CSS pulse al DOM badge) |
| `bfb96d6` | A1.3 | Contextual meta pills + applyHideIfEmpty helper (6 vitests) + min-height responsive |
| `d5e583f` | A1.4 | Contextual action panel + computeActionButtonsVisibility (7 vitests) + cascade hide |
| `5ee6338` | docs | Closeout — "What landed" section en el spec |

### Move 2 (anterior, `c438595..0bc8f92`) — INTACTO

- Mid-game WS reconnect production-grade.
- `reconnect-director.ts` epoch-locked, calibrated backoff, 5s per-attempt timeout.
- Heartbeat hardening 5s/10s.
- Discreet banner.
- E2E steps 8–12 funcionando (incluidos en los 40/40 actuales).

### Move 1.5 (anterior, `8333eb9..c438595`) — INTACTO

- `client.reconnect(reconnectionToken)` primitive para reload + post-login recovery.
- `recoverMesaOrOpenLobby` decision tree.

---

## Documentos canónicos (leer en este orden)

### Operativos

1. **`docs/superpowers/specs/2026-05-18-chiribito-slice-A1-chrome-cleanup-design.md`** — spec A1 con "What landed" section al final.
2. **`docs/superpowers/plans/2026-05-18-chiribito-slice-A1-chrome-cleanup.md`** — plan TDD ejecutado (referencia).
3. **`docs/superpowers/specs/2026-05-18-chiribito-visual-audit.md`** — el audit visual completo (baseline de los P0/P1/P2/P3 findings).
4. **`docs/superpowers/specs/2026-05-18-chiribito-move-2-design.md`** — spec Move 2 (reconnect).
5. **`docs/RECONNECT_FINDINGS.md`** — origen Move 1 → 1.5 → 2 reconnect saga.
6. **`docs/ARCHITECTURE.md`** — arquitectura general.

### Memoria persistente (`~/.claude/projects/C--Users-Usuario/memory/`)

- `MEMORY.md` — índice general.
- `project_chiribito.md` — estado operativo + roadmap.
- `feedback_chiribito_approach.md` — modo de trabajo (lead engineer).
- `feedback_chiribito_north_star.md` — 6 principios visuales (tactility / mesa viva / claridad / ritmo / social-first / premium AAA).
- `feedback_chiribito_disciplined_format.md` — formato 6-puntos pre-cambio.
- `feedback_chiribito_browser_e2e_lesson.md` — "tests verdes ≠ UX funciona".
- `feedback_chiribito_colyseus_reconnect.md` — patrón Colyseus.
- `feedback_chiribito_e2e_multiplayer.md` — E2E requiere ≥2 jugadores.
- **NUEVOS post-A1:**
  - `feedback_chiribito_pixi_continuity.md` — patrón hide-don't-remove para Pixi.
  - `feedback_chiribito_visibility_projection.md` — proyectar state-machine sobre nuevo eje sin duplicar lógica.
  - `feedback_chiribito_castizo_vocabulary.md` — vocabulary lock canon.
  - `feedback_chiribito_a1_root_causes.md` — root causes + "menos dashboard, más mesa" + qué NO tocar.

---

## Cómo retomar (próxima sesión)

### Si el user dice "Hola Chiribito" o equivalente

1. Leer este doc + `project_chiribito.md` (memoria) ANTES de tocar nada.
2. `cd Documents\CHIRIBITO\chiri-infrastructure\chiri-app`.
3. `git log --oneline -8` + `git status --short` — confirmar HEAD = `5ee6338`.
4. Verificar que no haya drift:
   - `git diff origin/main` → vacío.
   - `cd frontend && npm test` → 213/213.
   - `cd .. && npm test` → 475/475.
   - `cd api-server && npm test` → 27/27.
5. Si el user pide validación visual o E2E, **NO** asumir — boot dev-stack y correr `scripts/e2e-browser.ts` o `scripts/visual-audit.ts`.
6. Esperar señal de "abrimos Slice X" o "cambio de foco". NO arrancar trabajo sin el go explícito.

### Si el user autoriza Slice A2 (sidebar / player rail)

- Empezar por brainstorming skill (no implementación directa — política casa, ver `feedback_chiribito_disciplined_format.md`).
- Spec → plan → execute, mismo flujo que A1.
- Reusable: `scripts/visual-audit.ts` (mantener baseline `__A1_baseline` archivado para comparar).
- A2 puede tocar libremente el sidebar (P0-1 del audit). Vocabulario castizo aplica a nuevos headings.
- NO tocar seats / avatars / mesa-around-rim layout (eso es B).

### Si el user autoriza Slice B (compact-table primitive mobile/tablet)

- También brainstorming → spec → plan → execute.
- Empezar por inspeccionar el seat-around-rim del desktop actual y diseñar la versión < 1100px.
- NO rehacer cartas, mascotas, branding (asset discipline en north star).
- Cambio mayor — pre-trabajo de audit visual obligatorio.

### Si el user pide otro foco

- Roadmap aún válido: A2 / B / C (banner visibility) / D (touch targets) / E (depth + tactility) / F (lobby polish).
- Detalles en `docs/superpowers/specs/2026-05-18-chiribito-visual-audit.md` sección "Proposed roadmap".

---

## No-touch list resumida (DO NOT TOUCH sin "go" explícito)

| Componente | Por qué |
|-----------|---------|
| `frontend/src/connection.ts` (excepto consts si Slice D toca timing) | Move 2 reconnect director — locked |
| `frontend/src/reconnect-director.ts` | Move 2 — protocolo crítico |
| `frontend/src/auth/recover-or-lobby.ts` | Move 1.5 — recovery |
| `frontend/src/security/secure-storage.ts` `Reconnect*` API | Move 1.5/2 token persistence |
| `frontend/src/game/table/TableScene.ts` constructor / destroy / measureLayout | Pixi continuity — hide-don't-remove pattern |
| `frontend/src/game/phase-indicator.ts` + `phases.ts` | Fase 3 funciona, NO rediseñar |
| `frontend/src/game/game-ui.ts` updateActionButtons líneas 290-340 (canX derivation) | Source of truth state-machine, NO duplicar |
| `frontend/index.html` líneas 320-375 (`.seat` rows) | Slice B territory |
| `src/rooms/**` (game server) | Engine/managers/schemas/glossary — off-limits salvo go explícito |
| `api-server/src/**` | Auth/email/migrations — off-limits |
| `frontend/public/cards/*.webp`, `frontend/public/brand/*` | Asset discipline — branding canon |
| Castizo vocabulary tabla (ver `feedback_chiribito_castizo_vocabulary.md`) | NO reabrir vocabulario |

---

## Hallazgos arquitectónicos importantes de A1 (lecciones para próximos slices)

### 1. Patrón "hide-don't-remove" para Pixi

`TableScene` mantiene refs internos que `measureLayout`, `updatePot`, `destroy` necesitan vivos. Hide via `.visible = false`, nunca remover el objeto. Detalles + ejemplo en `feedback_chiribito_pixi_continuity.md`.

### 2. Patrón "visibility projection" para state machines

`updateActionButtons` ya computaba `canX`. A1.4 NO duplicó esa lógica — solo añadió un eje paralelo (`computeActionButtonsVisibility`) usando los mismos inputs. Aplicar este patrón cualquier vez que necesites añadir un nuevo eje (`hidden`, `highlighted`, `pulsing`, etc.) a un state-machine existente. Detalles en `feedback_chiribito_visibility_projection.md`.

### 3. `parentElement` chains > expandir el ref bag

Cuando necesitas tocar un elemento DOM que NO está en tu `GameUiRefs` (e.g. `.bet-group`, `.action-group`, `.game-actions` containers), usa `parentElement` desde un button que SÍ está en el bag. Evita ampliar la interfaz y crashes de "undefined.classList" cuando expandes el código antes que el type.

### 4. Audit visual antes de cualquier slice perceptivo

`scripts/visual-audit.ts` con baseline archivado en `.dev-stack/visual-audit__<slice>_baseline/`. Diff slice-por-slice. Detalles en `feedback_chiribito_a1_root_causes.md` sección "Aprendizaje meta".

### 5. Vitest NO type-checa en runtime

`tsc --noEmit` SÍ checa, pero `npm test` (vitest + esbuild) NO. Cualquier campo de ref que no exista en `GameUiRefs` será `undefined` en runtime y crasheará SILENTLY. Lección de A1.4: el primer pase referenció `refs.betAmountInput` (que vive en `GameActionBindingRefs`, otro type) — todos los tests pasaron, pero `.game-actions` container seguía visible porque la línea con el crash abortaba el helper antes de llegar al container toggle.

Mitigación: si una función de helper espera muchos refs y no estás 100% seguro de que todos existen, considera:
- Añadir el ref al type apropiado + binding.
- O usar `parentElement` chains (ver punto 3).
- O `if (!refs.foo) return` defensivo al inicio.

### 6. "Menos dashboard, más mesa viva" — criterio visual

Detalles canonizados en `feedback_chiribito_a1_root_causes.md`. Resumen: el chrome (sidebars, action panels, status pills) es soporte. La mesa (felt + cards + chips + presence) es protagonista. Cualquier diseño que invierta esta jerarquía falla el criterio.

---

## Riesgos conocidos (heredados, no resueltos por A1)

1. **Single-player auto-dispose** (`src/rooms/game/GameEngine.ts:440 checkGameEnd`): user solo en mesa la pierde a cualquier disconnect. E2E mitiga con player2 spawn. Real-prod fix requiere "go" explícito (toca engine).
2. **`idle-timeout-modal` DOM/CSS huérfano** post Move 2 Slice D. Dead but harmless. Cleanup deferido.
3. **Reconnect banner no aparece en pre-game `Esperando`** (Move 2 audit P1-2). Cosmetic. Defer to Slice C.
4. **Touch targets sub-44px** en `Unirme`, `Refrescar`, `Salir` (audit P1-3). Defer to Slice D.
5. **Sidebar sigue siendo dev/debug** (audit P0-1 sin tocar — A2 lo aborda).

---

## Comandos de validación rápida

```bash
cd C:\Users\Usuario\Documents\CHIRIBITO\chiri-infrastructure\chiri-app

# State sync
git log --oneline -5
git status --short
git rev-parse HEAD                          # debe ser 5ee6338

# Tests
cd frontend && npm test                     # 213/213
cd .. && npm test                           # 475/475
cd api-server && npm test                   # 27/27

# Si dev-stack está corriendo (npm run dev:stack):
npx tsx scripts/e2e-browser.ts              # 40/40 × 3 runs
npx tsx scripts/visual-audit.ts             # 30 PNG + measurements.json
```

Si el dev-stack se rompe (postgres crash 0xC0000142 en Windows tras horas), kill stale + reboot:

```bash
netstat -ano | grep ':5432 '                # find postgres PID
taskkill //F //PID <pid>
rm -f .dev-stack/pid
npm run dev:stack                            # restart cleanly
```

---

## Próximos focos candidatos (cuando el user autorice)

| # | Slice | Audit finding | Tamaño estimado | Risk |
|---|-------|---------------|------------------|------|
| **A2** | Sidebar / player rail | P0-1 (mayor del audit aún sin tocar) | Medio-grande | Bajo (sidebar es self-contained) |
| **B** | Compact-table mobile/tablet | P0-2 + P1-1 | Grande | Medio (layout structural) |
| **C** | Banner visibility waiting + connection pill | P1-2 + P1-6 | Pequeño | Bajo (sigue Move 2 wiring) |
| **D** | Touch targets + mobile chrome | P1-3 + P3 list | Pequeño | Mínimo |
| **E** | Table depth + tactile press | P1-5 + P2-1/2 | Medio | Bajo (CSS-only) |
| **F** | Empty states + voice + ranking | P1-4 + P2-3/4/6 + P3 | Pequeño | Mínimo |

Decisión del user determina el orden. Recomendación implícita en el audit doc: A2 primero porque resuelve el hallazgo más visible que A1 dejó intacto a propósito.
