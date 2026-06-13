# Chiribito — Modo Práctica contra la Máquina (jugar vs bots)

> **Estado:** PLAN — diseño cerrado, **NO ejecutado**. Pendiente de revisión del operador.
> **Fecha:** 2026-06-11 · **Ecosistema:** Chiribito (aislado de PMS / PT / XPrediction / F90+).
> **Ejecución:** DIFERIDA — se implementa **después** de cerrar el trabajo de la Mesa 3D
> (rama `spike/table-3d-hero`), en su propia rama. Riesgo cero para la sesión 3D en curso.
> **Idioma de este doc:** prosa en español (para revisión del operador); identificadores,
> nombres de archivo, tipos y comandos en inglés (regla del repo: el código va en inglés).
> Al ejecutar, este archivo se copiará a `docs/superpowers/specs/2026-06-11-practice-vs-bots-design.md`
> dentro de la rama del feature.

---

## 1. TL;DR

Un **modo de práctica/aprendizaje** donde el usuario crea una mesa, **elige de 1 a 5 rivales-máquina**
con **personalidad castiza** (nombre + carácter), y juega una partida de Chiribito completa **sin
necesidad de otros humanos**. Los bots juegan con **criterio creíble** (entienden la fuerza de su mano,
apuestan y se retiran con sentido, farolean de vez en cuando) y la práctica **no ensucia las stats ni
el ranking reales**.

**Veredicto técnico:** viable, dificultad moderada, **footprint mínimo en el motor**. Los bots viven
*server-side* (mismo proceso que la sala), reutilizan la API del `GameEngine` que ya usan los humanos,
y el cerebro reutiliza el `CardEvaluator` existente. El núcleo de reglas del juego **no se reescribe**.

---

## 2. Decisiones de producto (confirmadas por el operador)

| # | Decisión | Elección | Implicación |
|---|----------|----------|-------------|
| 1 | **Formato** | Configurable: **1 a 5 bots** | El usuario elige nº de rivales al crear la mesa. El motor ya soporta 6 asientos. |
| 2 | **Dificultad** | **Un nivel sólido y creíble** | Un único nivel de competencia bien afinado; la variedad viene del *estilo* de cada personaje, no de "tontos/listos". |
| 3 | **Propósito** | **Práctica / aprender, sin presión** | Mesa práctica efímera; **no** registra stats ni toca el ranking; alma anti-casino intacta. |
| 4 | **Personalidad** | **Castiza, con nombre + carácter** | Roster de personajes con apodos y rasgos; se apoya en las mascotas pato/toro ya existentes. |

---

## 3. Principios e invariantes de Chiribito que este plan respeta

- **Anti-casino / alma castiza:** la práctica es para *aprender y disfrutar*, no para simular apuestas.
  Sin presión, sin métricas de "ganancia", sin dark patterns. Los bots tienen alma (nombre, carácter).
- **Motor de reglas CONGELADO** salvo dos adiciones quirúrgicas y aditivas (un campo de schema + un
  hook opcional). No se reescribe ninguna regla de reparto, apuestas, calles, showdown ni side-pots.
- **`frontend/src/lab/` NO se toca** — es territorio exclusivo de la Mesa 3D. Guard-de-rama antes de
  cualquier cambio (ver §14).
- **Identidad de la mesa, baraja castiza (28 cartas), vocabulario y nombres de mano** (`Perla`,
  `Escalera de color`, `Color`, `Full`, `Escalera`, `Trío`, `Doble pareja`, `Pareja`, `Carta alta`)
  se conservan exactamente.
- **Deploy/push siempre con confirmación manual del operador** (política Chiribito; Vercel team
  `chiribito293-7173`). Commits locales atómicos durante la ejecución.

---

## 4. Alcance

### Qué SÍ (MVP de este plan)
- Crear una **mesa práctica** eligiendo **1–5** rivales-máquina.
- Bots *server-side* que ocupan asiento, juegan su turno con criterio y tienen nombre/carácter castizo.
- Partida completa de Chiribito contra ellos (las 6 calles, showdown, side-pots, fin de partida).
- **Sin** impacto en stats/ranking. Al terminar, opción de **"otra partida"**.
- Distintivo visual de "máquina" en la mesa + entrada clara desde el lobby ("Jugar contra la máquina").

### Qué NO (YAGNI — fuera de este MVP, anotado para el futuro)
- ❌ Múltiples niveles de dificultad (fácil/normal/difícil) — descartado en la decisión #2.
- ❌ Torneo competitivo vs máquina que cuente para el ranking — descartado en la decisión #3.
- ❌ Matchmaking, salas práctica públicas/listadas, persistencia de partidas de práctica.
- ❌ IA por aprendizaje automático. El cerebro es heurístico, determinista y testeable.
- ❌ Chat/voz de los bots más allá de frases puntuales de sabor (opcional, Fase 6).

---

## 5. Arquitectura

### 5.1 Decisión central: bots *server-side, in-process* (Enfoque A)

Se evaluaron dos enfoques:

| | **A — Bot server-side in-process (ELEGIDO)** | B — Bot como cliente Colyseus externo |
|---|---|---|
| Qué es | El bot es un `Player` en `state.users` (con `isBot=true`) que **no tiene socket**. Un `BotController` dentro de la sala decide y ejecuta su jugada llamando al `GameEngine`. | Procesos/clients que se conectan por WebSocket como un humano (lo que hace el `table-bot.ts` actual). |
| Acceso a cartas | Directo: el server ve `player.hand` (privada para humanos vía `@view()`, pero local en el server). | Requiere que el bot "vea" sus cartas por la red como un cliente. |
| Coste en prod | Nulo: sin procesos extra, sin auth de invitado, sin latencia de red. | Alto: ¿quién lanza N procesos por mesa? Auth por bot, latencia, fragilidad, escalado raro. |
| Robustez/test | Lógica pura testeable sin red; determinista. | Frágil (DOM/red), difícil de testear. |
| Footprint motor | Mínimo (1 hook opcional + 1 campo). | Cero en el motor, pero infra externa pesada. |

**Se elige A.** Es como lo hacen los juegos reales: los rivales-máquina son parte del servidor de la
partida, no clientes externos. El `table-bot.ts` actual (harness de percepción DOM-driven que solo
hace Pasar/Igualar) **no es producto** y no se reutiliza como rival; sí sirve de referencia mental.

### 5.2 Componentes nuevos (todos en el game server, `src/`)

| Componente | Archivo (nuevo) | Responsabilidad | Pureza |
|---|---|---|---|
| `BotStrategy` | `src/rooms/game/bots/BotStrategy.ts` | **Cerebro.** Dada la situación (mano, comunidad, bote, apuesta, fichas, fase, perfil), devuelve una decisión `{ action, amount }`. **Función pura** — sin estado, sin red. | Pura → TDD directo |
| `BotProfile` | `src/rooms/game/bots/profiles.ts` | Catálogo de personajes castizos + sus rasgos (`aggression`, `bluffFreq`, `tightness`, `avatar`, frases). | Datos puros |
| `BotController` | `src/rooms/game/bots/BotController.ts` | **Pegamento.** Sabe qué asientos son bots; cuando es su turno, espera un delay natural, llama a `BotStrategy` y **ejecuta** la jugada vía el `GameEngine` (con un `ActionClient` stub). | Con estado (vive en la sala) |
| Bot seeding | en `ChiribitoRoom.onCreate` (rama práctica) | Siembra N `Player` bot con fichas y asiento al crear una mesa práctica. | — |

### 5.3 Punto de enganche ÚNICO (mínimo footprint)

`GameEngine.startTurnTimer()` (`src/rooms/game/GameEngine.ts:323`) se ejecuta **siempre** que empieza
el turno de alguien (desde `startNewHand`, `proceedToNextPhase` y `endTurn`). Es el único sitio que
necesitamos. Al final de ese método añadimos:

```ts
// GameEngine.startTurnTimer(), al final — aditivo, no cambia la lógica del timer humano
this.room.onTurnStarted?.(this.room.state.currentTurn);
```

- `onTurnStarted?` es un **miembro opcional** nuevo de `IGameRoom`.
- **Mesa con humanos:** la sala normal **no** define `onTurnStarted` → `?.` no hace nada → **impacto cero**.
- **Mesa práctica:** `ChiribitoRoom` (cuando `mode==="practice"`) implementa `onTurnStarted` y delega
  en `BotController.onTurnStarted(sessionId)`.

`BotController.onTurnStarted(sessionId)`:
1. Si `sessionId` no es un bot → return.
2. Programa `room.scheduleDelayed(() => this.act(sessionId), delay)` con `delay` aleatorio acotado
   (≈ 700–1800 ms) para que se sienta natural. Siempre `≪ TURN_TIMEOUT` (60 s) → el bot nunca cae por
   timeout.

### 5.4 Ejecutar la jugada: `ActionClient` stub (reutiliza validación intacta)

Los handlers del `GameEngine` (`handleBet/handleCall/handleCheck/handleFold/handleRaise/handleAllIn`)
reciben hoy un `Client` de Colyseus y validan `client.sessionId === state.currentTurn`. El bot **no
tiene** `Client`. Solución mínima y limpia:

- Introducir el tipo `type ActionClient = Pick<Client, "sessionId" | "send">` (en `IGameRoom.ts` o un
  `types/ActionClient.ts`) y **ampliar las firmas** de esos handlers de `Client` a `ActionClient`
  (los handlers solo usan `.sessionId` y `.send(...)`). Cambio de tipos, **no de lógica**.
- El `BotController` construye `const botClient = { sessionId: bot.sessionId, send: () => {} }` y llama
  `engine.handleBet(botClient, amount)`, etc. Como `botClient.sessionId === currentTurn`, **pasa la
  misma validación que un humano**. Toda la mecánica (pot, side-pots, calles, showdown) es idéntica.

### 5.5 Por qué NO tocamos la regla de "mínimo 2 jugadores"

`handleStartGame` exige `≥ 2` players con fichas (`GameEngine.ts:49`). Al **sembrar los bots como
`Player` reales con fichas** en `state.users`, el conteo es `1 humano + N bots ≥ 2` de forma natural.
La regla sensible **queda intacta**. El "single-player" se logra poblando la mesa, no debilitando el motor.

### 5.6 Diagrama — un turno de bot

```
startNewHand / proceedToNextPhase / endTurn
        │  (setean state.currentTurn y llaman a…)
        ▼
GameEngine.startTurnTimer()
   • broadcastTurnTimer (igual que hoy)
   • arma turnTimeout de 60 s (igual que hoy)
   • room.onTurnStarted?.(currentTurn)   ◀── NUEVO, opcional
        │
        ▼ (solo en mesa práctica)
BotController.onTurnStarted(sessionId)
   • ¿es bot? si no → return
   • scheduleDelayed(act, 700–1800 ms)   ◀── timing natural
        │
        ▼
BotController.act(sessionId)
   • lee Player.hand (server-side) + community + pot + currentBet + chips + phase + profile
   • decision = BotStrategy.decide(situation, profile)   ◀── PURO
   • engine.handle{Bet|Call|Check|Fold|Raise|AllIn}(botClient, amount?)
        │
        ▼
   …flujo idéntico al de un humano → endTurn() → siguiente turno
```

---

## 6. El cerebro: `BotStrategy` (puro y testeable)

### 6.1 Entrada / salida

```ts
interface BotSituation {
  hole: string[];            // Player.hand (2 cartas, server-side)
  community: string[];       // state.communityCards (0..5 según calle)
  phase: string;             // PHASES (waiting→preflop→card1..card5)
  pot: number;
  currentBet: number;        // apuesta a igualar de la mesa
  myBet: number;             // lo ya puesto por el bot esta ronda
  myChips: number;
  toCall: number;            // currentBet - myBet
  activeOpponents: number;   // rivales no retirados
}
interface BotDecision { action: "fold" | "check" | "call" | "raise" | "allIn"; amount?: number; }
BotStrategy.decide(s: BotSituation, p: BotProfile, rng: () => number): BotDecision
```
`rng` inyectable (semilla) → **determinismo en tests**, aleatoriedad controlada en runtime.

### 6.2 Estimación de fuerza (reutiliza lo que ya existe)

- **Con ≥3 cartas comunitarias:** se forma la mejor mano de 5 = 2 hole + el mejor combo de 3 community,
  exactamente como el `WinnerDeterminator` (vía `CardEvaluator.getCommunityCombos` + `evaluateHand` +
  `compareHands`, con el `rankOrder` canónico de `glossary.ts`). **Tarea de Fase 1:** extraer esa
  "mejor mano de N" a una utilidad pura compartida por `WinnerDeterminator` y `BotStrategy` para que
  **nunca diverjan** (si hoy está inline en el determinador, refactor mínimo y aditivo).
- **Preflop / pocas comunitarias:** heurística de fuerza de las 2 hole: `isPerla` (máxima), pareja,
  suited, altura de rangos. Normalizada a un escalar `strength ∈ [0,1]`.
- La fuerza se traduce a una **fuerza efectiva por fase** (más cautelosa cuanta menos información hay).

### 6.3 Política de decisión (un nivel sólido, modulado por el perfil)

Mezcla **fuerza** + **pot odds** (`toCall / (pot + toCall)`) + **rasgos del perfil**:
- `tightness` ↑ → umbral de continuación más alto (juega menos manos).
- `aggression` ↑ → más sube/relanza vs. igualar; tamaños de apuesta mayores (fracción del bote).
- `bluffFreq` ↑ → probabilidad acotada de farolear con mano floja en posiciones favorables.
- Reglas de seguridad: nunca apuesta más fichas de las que tiene; `allIn` cuando corresponde; `check`
  gratis si `toCall === 0` y la mano no justifica construir bote; respeta `currentBet` mínimo.

El **nivel base es competente** (no regala manos buenas, no paga sin odds); los perfiles dan **textura**
(uno más conservador, otro más fanfarrón), cumpliendo "un solo nivel sólido + personalidad".

### 6.4 Timing natural
Delay `700–1800 ms` por jugada (vía `rng`), siempre `≪ TURN_TIMEOUT`. Da sensación de que el rival
"piensa" y evita ráfagas instantáneas. Configurable por perfil (un personaje "lento", otro "rápido").

---

## 7. Personalidad castiza (`BotProfile` + roster)

```ts
interface BotProfile {
  id: string;
  name: string;          // apodo castizo (se serializa al cliente vía Player.name)
  avatar?: string;       // icono/mascota (p.ej. "pato" | "toro" | …) — se serializa
  aggression: number;    // 0..1   } rasgos de estrategia —
  bluffFreq: number;     // 0..1   } NO se serializan (el humano no ve la "config" del rival)
  tightness: number;     // 0..1   }
  thinkMsRange: [number, number];
  lines?: { win?: string[]; bluffCaught?: string[]; fold?: string[] }; // frases de sabor (Fase 6)
}
```

**Roster inicial propuesto** (provisional — a validar/retocar por el operador en Fase 6; el alma manda):

| Apodo | Estilo | aggression / bluff / tightness | Nota |
|---|---|---|---|
| **Curro el Tranquilo** | tight-passive | 0.3 / 0.1 / 0.7 | Juega pocas manos, casi no farolea. Mascota **pato**. |
| **La Manola** | loose-aggressive | 0.8 / 0.4 / 0.3 | Agresiva y fanfarrona, te mete presión. |
| **Rufino el Toro** | aggressive | 0.75 / 0.25 / 0.5 | Embiste con manos buenas. Mascota **toro** (celebra Escalera+). |
| **El Chato** | balanced | 0.5 / 0.2 / 0.5 | Calculador, equilibrado. |
| **La Paqui** | tricky | 0.55 / 0.45 / 0.45 | Faroleo medio, difícil de leer. |
| **Garrido** | tight-aggressive | 0.7 / 0.2 / 0.65 | El más sólido de la mesa. |

- **Mascotas pato/toro:** reutilizar las que ya existen animadas en el simulador web (memoria del
  proyecto: el toro celebra Escalera+). Asignadas a Curro (pato) y Rufino (toro) como `avatar`.
- **Lo que se serializa al cliente:** `Player.name`, `Player.isBot` (nuevo, boolean) y opcionalmente
  `Player.avatar`. **Los rasgos de estrategia NO se serializan** (el rival no debe ser "leíble" por config).

---

## 8. Modo práctica (room mode)

- **Creación:** `client.create("mesa", { mode: "practice", botCount: N, name, auth })`
  (`N ∈ [1,5]`). `room-session-controller.ts` pasa estas options (hoy ya pasa `tableName`/`name`).
- **Seeding:** en `onCreate`, si `mode==="practice"`, sembrar `N` bots (Player + `isBot` + perfil +
  fichas iguales a las del humano + asiento vía `SeatManager.occupySeat`) e instanciar el `BotController`.
- **Sin stats:** hoy `notifyTournamentEnd` es un **método de la clase** `ChiribitoRoom`
  (`ChiribitoRoom.ts:46`) que hace broadcast del campeón **y** llama a `reportTournamentStats`
  (`POST /api/internal/game-ended`). En práctica se gobierna con el modo: `notifyTournamentEnd`
  detecta `mode==="practice"` y **omite la llamada a `reportTournamentStats`** (el endpoint **no** se
  invoca → **cero stats, cero ranking**), conservando solo el aviso de fin a los clientes. El
  `broadcastGameEnded` (aviso de fin, sin persistencia) se mantiene. *(Nota: como el método siempre
  existe en la instancia, el `?.` del `GameEngine` no basta por sí solo — el guard por modo es lo que
  garantiza el no-reporte.)*
- **Ciclo de vida:**
  - El humano abandona (`onLeave`) y no quedan humanos → **dispose** de la sala (no dejar bots solos).
  - Fin de partida (un solo jugador con fichas) en práctica → mensaje de **fin de práctica** + opción
    **"otra partida"** (re-seed de fichas y nueva mano) en vez del flujo torneo/disconnect.
- **No pública:** la mesa práctica **no se lista** en el lobby (`GET /api/rooms` / `lobby-polling.ts`),
  es efímera y personal (flag de metadata para excluirla del listado).

---

## 9. Cambios por capa (resumen de superficie)

| Capa | Archivo | Cambio | Naturaleza |
|---|---|---|---|
| Schema | `src/rooms/schema/MesaState.ts` | `+ @type("boolean") isBot=false` (y opcional `avatar`) en `Player` | Aditivo |
| Types | `src/types/IGameRoom.ts` | `+ onTurnStarted?(sessionId): void`; `ActionClient = Pick<Client,...>` | Aditivo |
| Engine | `src/rooms/game/GameEngine.ts` | 1 línea en `startTurnTimer` (`onTurnStarted?.`); firmas `Client`→`ActionClient` en handlers | Quirúrgico |
| Engine util | `src/rooms/game/utils/WinnerDeterminator.ts` | Extraer "mejor mano de N" a util pura compartida (si está inline) | Refactor mínimo |
| Bots (nuevo) | `src/rooms/game/bots/{BotStrategy,BotController,profiles}.ts` | Cerebro + pegamento + roster | Nuevo |
| Room | `src/rooms/ChiribitoRoom.ts` | Rama `mode==="practice"`: seeding + `BotController` + `onTurnStarted` + no-stats + dispose-on-empty + exclusión de lobby | Aditivo (gated por mode) |
| Frontend | `frontend/src/app/room-session-controller.ts`, `frontend/src/main.ts`, `frontend/index.html` | Entrada "Jugar contra la máquina" + selector 1–5 + distintivo de bot + fin-de-práctica/otra-partida | Aditivo |
| API server | — | **Sin cambios** (práctica no reporta) | — |

> **`frontend/src/lab/` NO aparece** en esta lista. Intacto.

---

## 10. Plan de implementación por fases (TDD, commits atómicos)

> Cada fase termina **verde** (tests + lint/format) y con commit local atómico. Sin push/deploy salvo
> visto bueno explícito del operador (§3).

- **Fase 0 — Aislamiento.** Crear rama `feat/practice-vs-bots` **desde `main`** (no desde
  `spike/table-3d-hero`) en un **worktree propio** (p.ej. `chiri-practice-wt`). Copiar este PLAN.md a
  `docs/superpowers/specs/`. **No** usar el `.planning/` actual (es de la Mesa 3D); si se quiere GSD,
  workspace/workstream separado. *Criterio:* worktree limpio, build base verde.
- **Fase 1 — `BotStrategy` puro (cerebro).** TDD. Util compartida "mejor mano de N" + estimación de
  fuerza + política. Sin tocar la sala. *Criterio:* batería de tests unitarios (manos fuertes suben,
  basura se retira sin odds, Perla juega fuerte, farol acotado, nunca apuesta de más); determinista con
  `rng` semilla.
- **Fase 2 — Schema + `ActionClient`.** `Player.isBot`; `ActionClient` y ampliación de firmas de
  handlers. *Criterio:* tests del motor existentes siguen verdes (sin regresión); type-check limpio.
- **Fase 3 — `BotController` + hook + seeding.** `onTurnStarted` en `IGameRoom`/`GameEngine`
  (1 línea); `BotController.onTurnStarted/act`; seeding de bots en práctica. *Criterio:* test de
  integración — sala práctica simulada juega una **mano completa** 1 humano + 1 bot sin intervención.
- **Fase 4 — Modo práctica end-to-end (server).** Options `mode/botCount`, no-stats, dispose-on-empty,
  "otra partida", exclusión de lobby. *Criterio:* integración con 1 humano + 3 bots, partida hasta
  campeón, **verificado que NO se llama** al endpoint de stats.
- **Fase 5 — Frontend.** Entrada "Jugar contra la máquina" + selector 1–5 + distintivo de bot en la
  mesa + pantalla de fin/“otra partida”. *Criterio:* flujo jugable en navegador; sin tocar `lab/`.
- **Fase 6 — Personalidad castiza.** Roster final, avatares pato/toro, frases de sabor; afinado de
  rasgos con el operador. *Criterio:* visто bueno del operador al "sabor".
- **Fase 7 — Verificación + (opcional) deploy gated.** E2E Playwright (crear práctica, jugar mano
  completa, fin, otra partida); suites completas verdes; deploy manual **solo** si el operador lo aprueba.

---

## 11. Estrategia de pruebas

- **Unit (Jest, game server):** `BotStrategy` con decenas de situaciones (preflop/medio/río, con/sin
  odds, Perla, farol con semilla fija). `npx jest src/__tests__/.../BotStrategy.test.ts --runInBand`.
- **Integración (Jest):** sala práctica con `BotController`, mano completa y partida completa; aserción
  explícita de **no-stats**. `npm test`.
- **Frontend (Vitest):** selector de rivales, render del distintivo de bot, pantalla de fin.
  `cd frontend && npx vitest run`.
- **E2E (Playwright):** crear práctica con N bots y jugar hasta el final, 0 errores de consola.
- **No-regresión:** las suites actuales (game/api/frontend) deben seguir verdes — el feature es aditivo.

---

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Romper mesas con humanos | Hook `onTurnStarted` **opcional**; mesas normales no lo cablean → impacto cero. Tests de no-regresión. |
| Bot que "se siente tonto" | Nivel base competente (fuerza real + pot odds), reutiliza `CardEvaluator`; afinado en Fase 6. |
| Divergencia evaluador bot vs. showdown | Util "mejor mano de N" **compartida** con `WinnerDeterminator` (Fase 1). |
| `strictNullChecks:false` en game server | Código nuevo escrito defensivo; tests cubren ramas nulas. |
| Bot bloquea el turno / timers | Delay siempre `≪ TURN_TIMEOUT`; `act` idempotente; limpiar timers al disponer la sala. |
| Reconexión/abandono del humano | `dispose` de la sala práctica al quedar sin humanos. |
| Fuga de info del bot al cliente | Solo se serializa `name/isBot/avatar`; rasgos de estrategia y `hand` del bot quedan server-side. |

---

## 13. Definición de Hecho (DoD)

- [ ] El usuario crea una mesa práctica eligiendo 1–5 rivales y juega una partida completa solo.
- [ ] Los bots juegan con criterio creíble (no regalan manos, no pagan sin odds, farolean a veces).
- [ ] Cada bot tiene nombre/carácter castizo; pato y toro presentes.
- [ ] La práctica **no** crea stats ni toca el ranking (verificado: endpoint de stats no se invoca).
- [ ] Al terminar, opción "otra partida"; al irse el humano, la sala se cierra.
- [ ] Suites game/api/frontend verdes; E2E de práctica verde; `frontend/src/lab/` intacto.
- [ ] Cero regresión en mesas con humanos.

---

## 14. Coordinación con la Mesa 3D (lo que el operador pidió)

- **Cero solape de archivos.** La Mesa 3D toca **solo** `frontend/src/lab/`; este feature toca el
  **game server** (`src/rooms/...`) y la **UI de juego** (`frontend/src/app`, `main.ts`, `index.html`,
  **no** `lab/`). No comparten ficheros.
- **El choque real sería el cerebro de GSD:** el `.planning/` actual está **dedicado a la Mesa 3D**
  (programa Table 3D Perfection, Fase 3/TP2 en curso). **Este plan NO usa ese `.planning/`** ni lanza
  `/gsd-autonomous` sobre él. Si se quiere GSD para este feature, será en **workspace/workstream
  separado** dentro de la rama propia.
- **Rama propia, ejecución diferida.** Se implementa en `feat/practice-vs-bots` (desde `main`, en
  worktree aparte) **cuando el operador cierre/pause la Mesa 3D**. Mientras tanto, este documento queda
  guardado fuera del repo (en `Documents\CHIRIBITO\planes\…`) para **no ensuciar** el working tree de
  la sesión 3D.

---

## 15. Cómo arrancar la ejecución (cuando toque)

1. Confirmar que la Mesa 3D está en pausa/cerrada y `git status` limpio en su rama.
2. `git worktree add ../chiri-practice-wt -b feat/practice-vs-bots main` (rama desde `main`).
3. Copiar este `PLAN.md` → `docs/superpowers/specs/2026-06-11-practice-vs-bots-design.md` y commitear.
4. Ejecutar Fases 1→7 (TDD, commits atómicos). Verificación final + deploy **solo** con OK del operador.
5. (Opcional) Para conducirlo con GSD: inicializar un workspace/workstream GSD **separado** en esa
   rama — nunca el `.planning/` de la Mesa 3D.

---

*Fin del plan. Pendiente de revisión del operador antes de cualquier implementación.*
