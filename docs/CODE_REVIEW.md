# Code Review – Proyecto Chiri Backend

**Fecha:** Marzo 2026  
**Alcance:** Backend Colyseus (game server), API Express, frontend Vite, tests y CI.

---

## 1. Resumen ejecutivo

El proyecto es una aplicación de póker Texas Hold'em en tiempo real con Colyseus, API REST (Express + JWT) y cliente web. La arquitectura está bien separada (rooms, game engine, managers), hay buenos tests (386, ~90% coverage en código incluido) y seguridad considerada (JWT, rate limit, validación, StateView para manos). Para llevarlo al siguiente nivel conviene: reducir `any`, tipar payloads de mensajes, seguir partiendo el frontend, centralizar env y endurecer CI.

---

## 2. Arquitectura y estructura

### 2.1 Puntos fuertes

- **Separación clara:** `MyRoom` orquesta; `GameEngine` contiene la lógica de partida; utilidades (RoundManager, WinnerDeterminator, PlayerActions, GameUtils) están en módulos acotados y testeables.
- **IGameRoom:** La interfaz desacopla el motor del room real y facilita mocks en tests.
- **Managers extraídos:** AuthenticationService, SeatManager, RebuyManager, PlayerLifecycleManager, etc., con tests propios y responsabilidades definidas.
- **StateView (Colyseus):** Uso correcto de `@view()` en `Player.hand` y `client.view.add(player)` para que cada cliente solo vea su propia mano.
- **Tres “capas” bien delimitadas:** Game server (Colyseus), API (Express + TypeORM), frontend (Vite + módulos).

### 2.2 Mejoras sugeridas

- **MyRoom y security fuera de coverage:** Tiene sentido para no falsear el % con código difícil de unit-testear, pero conviene documentar en README/TESTING que MyRoom y `src/security/**` se validan vía integración/E2E o manualmente.
- **Frontend en un solo `main.ts` (~1550 líneas):** Ya hay extracción (config, types, audio, dom-refs, auth-helpers, hand-history, ui-cards). Siguiente paso: extraer conexión/sala, turn-timer, rebuy UI y quizá “game state → DOM” en un módulo de render/UI.

---

## 3. Calidad de código

### 3.1 Tipado y uso de `any`

**Backend (src):**

- `MyRoom.ts`: `onCreate(options: any)`, `requestJoin(options: any)`, `onAuth(client, options: any)`, `onJoin(client, options: any)`.  
  **Recomendación:** Definir interfaces `RoomOptions`, `JoinOptions`, `AuthOptions` (token, authUser, etc.) y usarlas.
- `GameEngine.ts`: `_updateGameState(player: any, betAmounts: any)`, `_broadcastAndEndTurn(player: any, betAmounts: any)`.  
  **Recomendación:** Usar `Player` (schema) y un tipo para `betAmounts` (p. ej. `Record<string, number>` o interfaz concreta).
- `IGameRoom.broadcast(type: string, data?: any)`: podría ser `data?: unknown` y tipar en cada llamada, o un union de payloads conocidos.
- `PlayerLifecycleManager`: `options: any`, `broadcastFn: (type: string, message: any, opts?: any)`.  
  **Recomendación:** Tipar `options` (join/reconnect) y un tipo genérico o union para `message`.

**Frontend (main.ts):**

- `pixiApp: any`, `pixiLib: any`: aceptable mientras no haya tipos oficiales; al menos comentar el contrato esperado.
- Handlers de mensajes: `(payload: any)` en `roundEnded`, `bustedOut`, `playerDisconnected`, etc.  
  **Recomendación:** Definir en `frontend/src/types.ts` (o en un `messages.ts`) interfaces como `RoundEndedPayload`, `BustedOutPayload`, etc., y usarlas en los listeners.
- Filtros como `entries.filter((p: any) => ...)`: el tipo de `entries` ya es `PlayerState[]`; se puede quitar el `any` y usar `PlayerState`.

**Tests:**

- Uso de `as any` en mocks (e.g. `mockRoom as any`) es habitual; está bien para tests, mejor si los mocks implementan interfaces concretas donde sea barato.

### 3.2 Constantes y configuración

- **MyRoom.ts línea 24:** `const API_URL = process.env.API_URL || "http://localhost:3000"` solo se usa para el auth del room. En `app.config.ts` ya hay validación de env; podría leerse de un único módulo `src/config/env.ts` (o el que use el game server) para no duplicar defaults.
- **Game constants:** `constants.ts` usa `process.env.TURN_TIMEOUT_MS`, etc., con fallbacks; está bien. Opcional: un `config.ts` del game server que exporte todo lo que el room/engine necesitan (API_URL, JWT_SECRET, timeouts) y validar al arranque.

### 3.3 Naming y comentarios

- Nombres en inglés en backend y mayormente en frontend; mensajes de UI en español. Consistente.
- Comentarios útiles en lógica delicada (e.g. rebuy, fold callback, sidepots). Algunos métodos públicos del GameEngine podrían tener JSDoc con una línea (qué hace y cuándo se llama).

---

## 4. Seguridad

### 4.1 Puntos fuertes

- JWT en API y en sala (AuthenticationService con reintentos y códigos de error claros).
- Rate limiting en API (express-rate-limit) y en sala (RateLimiterService, ACTION_COOLDOWN).
- Validación de peticiones en API (validators + validateRequest).
- Capa de seguridad en frontend (SecureStorage, validadores de email/password/username, stateGuard).
- Secrets: JWT_SECRET y REDIS_URL exigidos en producción (api-server e index/app.config); no se ven secrets hardcodeados en repo.

### 4.2 Recomendaciones

- **CORS / ALLOWED_ORIGINS:** Verificar que en producción solo se permitan orígenes explícitos y que el game server (si aplica) use la misma política.
- **Logs:** Evitar loguear tokens o datos de sesión completos; el uso actual de logger con roomId/sessionId parece adecuado.
- **Frontend:** `auth-helpers.request()` envía body JSON; si en el futuro se envían formularios o archivos, mantener Content-Type y validación alineados con el backend.

---

## 5. Testing

### 5.1 Puntos fuertes

- 386 tests, 16 suites; coverage global (sobre código incluido) ~90% líneas, umbral 80% en jest.config.
- Tests unitarios por módulo (GameUtils, PlayerActions, RoundManager, WinnerDeterminator, managers).
- Tests de integración (GameFlow.integration.test.ts) y de reglas (sidepot, all-in, fold).
- Setup centralizado (setup.ts, fetch mock) y uso de fake timers donde aplica.

### 5.2 Mejoras sugeridas

- **MyRoom:** Sin tests unitarios (excluido del coverage). Valorar 1–2 tests de integración E2E que levanten un room real y ejecuten un flujo mínimo (join, start, una acción) para evitar regresiones gordas.
- **Security (src/security/**):** Excluidos del coverage. Si se usan en producción, añadir tests que comprueben que rate-limit, audit y validación se disparan como se espera (aunque sea con mocks).
- **Frontend:** No hay tests automáticos; al menos un smoke (build + quizá carga de la app) en CI daría más confianza antes de deploy.

---

## 6. API y backend Express

### 6.1 Puntos fuertes

- Controladores separados (AuthController, UserController), middleware de auth y validación.
- Uso de TypeORM, repositorios, y validación de JWT_SECRET/REDIS en producción.
- Carga de `.env` desde api-server o raíz del monorepo.

### 6.2 Recomendaciones

- **Respuestas de error:** Unificar formato (p. ej. `{ error: string, code?: string }`) en todos los endpoints para que el frontend pueda mapear siempre igual (ya se hace en auth en buena parte).
- **Health check:** Si existe ruta tipo `/health` o `/ping`, que no requiera auth y que use solo dependencias ligeras (DB/Redis opcionales según diseño).

---

## 7. Frontend

### 7.1 Puntos fuertes

- Refactor reciente: config, types, audio, dom-refs, auth-helpers, hand-history, ui-cards; reduce acoplamiento y facilita tests futuros.
- Normalización de `communityCards` (schemaArrayToCards) para Colyseus ArraySchema.
- Manejo de errores de auth (AUTH_TIMEOUT, AUTH_UNAVAILABLE) y de reconexión con MAX_RECONNECT_ATTEMPTS.
- Heartbeat, buffer de acciones y replay en reconexión bien alineados con el backend.

### 7.2 Mejoras sugeridas

- **main.ts sigue siendo grande:** Extraer: (1) conexión/sala (join, leave, reconnect, mensajes de sala), (2) turn-timer y (3) lógica de “rebuy UI” (diálogos, timeouts). Dejar en main.ts solo bootstrap, event listeners de alto nivel y coordinación.
- **Tipado de payloads:** Sustituir `payload: any` en `room.onMessage(...)` por tipos definidos (RoundEndedPayload, etc.) para menos bugs y mejor autocompletado.
- **Pixi:** `pixiApp`/`pixiLib` como `any`; si la API que usas es estable, se puede declarar un tipo mínimo (renderer, ticker, Texture, Sprite) para evitar errores en tiempo de desarrollo.

---

## 8. DevOps y CI/CD

### 8.1 Puntos fuertes

- GitHub Actions: build + typecheck + test-coverage; subida a Codecov; comentario de coverage en PRs.
- Build del game y del api-server separados; frontend con Vite y alias para Colyseus ESM.

### 8.2 Recomendaciones

- **Build workflow:** Incluir `npm run build` (o el script que construya también el frontend) si el deploy sirve el cliente desde este repo, para que CI detecte fallos de build del frontend.
- **Coverage:** El workflow de coverage usa `secrets.CODECOV_TOKEN`; si no está definido, el step sigue (fail_ci_if_error: false). Valorar marcar el job como fallido si falla la subida a Codecov en main/develop, o documentar que el token es opcional.
- **ESLint:** El step de ESLint tiene `continue-on-error: true`. Si se adopta ESLint como estándar, fijar reglas y quitar el continue-on-error para que los PRs cumplan formato y reglas.

---

## 9. Checklist de prioridades

| Prioridad | Acción |
|----------|--------|
| Alta     | Tipar payloads de mensajes Colyseus en frontend (RoundEndedPayload, etc.) y sustituir `any` en handlers. |
| Alta     | Definir RoomOptions/JoinOptions/AuthOptions y usarlos en MyRoom y onAuth/onJoin. |
| Media    | Extraer de main.ts: módulo de “room connection” (join/leave/reconnect/mensajes) y módulo de “rebuy UI”. |
| Media    | Centralizar env del game server (API_URL, timeouts) en un config y usarlo desde MyRoom y constants. |
| Media    | Añadir al menos un test E2E o de integración que cubra un flujo mínimo de MyRoom (join + start + una acción). |
| Baja     | Reducir `any` en GameEngine (_updateGameState, _broadcastAndEndTurn) usando tipo Player y tipo para betAmounts. |
| Baja     | Documentar en TESTING.md que MyRoom y security están excluidos del coverage y cómo se validan. |
| Baja     | Revisar si el build en CI debe incluir el frontend y si la subida a Codecov debe ser obligatoria. |

---

## 10. Conclusión

El proyecto está en buen estado para producción: arquitectura clara, tests sólidos, seguridad y refactors recientes bien encaminados. El code review sugiere sobre todo mejoras de tipado (menos `any`, interfaces para opciones y payloads), seguir modularizando el frontend y afinar CI (build frontend, Codecov, ESLint). Con estas mejoras incrementales se gana en mantenibilidad y detección temprana de fallos.
