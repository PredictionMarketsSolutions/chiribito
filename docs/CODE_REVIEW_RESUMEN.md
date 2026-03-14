# Code Review General – Resumen

**Fecha:** Marzo 2026  
**Estado revisado:** commit `27f24e1` (ui: winner 3s, roundEnded tests y idle heartbeat) – heartbeat activo en backend y frontend.

---

## 1. Estructura del proyecto

| Capa | Ubicación | Entrada | Rol |
|------|-----------|---------|-----|
| **Game server** | `src/` | `src/index.ts` → `app.config.ts` | Colyseus: rooms `my_room`, `lobby`; auth JWT; puerto 2567 |
| **API server** | `api-server/` | `api-server/src/index.ts` | Express: auth (register/login/refresh/forgot/reset), `/api/internal/game-ended`, TypeORM, Redis; puerto 3000 |
| **Frontend** | `frontend/` | `frontend/src/main.ts` | Vite, cliente Colyseus, auth, lobby, mesa; usa API_URL y WS_URL |

**Flujo:** Frontend → API (JWT) y WebSocket (Colyseus). Colyseus valida token con API y al final de partida llama a `POST /api/internal/game-ended` con `INTERNAL_API_SECRET`.

---

## 2. Puntos fuertes

- **Arquitectura:** MyRoom orquesta; GameEngine con IGameRoom; managers (Session, ConnectionMonitor, Seat, RateLimiter, Analytics, Auth, Lifecycle) bien separados. StateView para manos por cliente.
- **Seguridad:** JWT en API y sala, rate limit (API + sala), validación express-validator, heartbeat y ConnectionMonitor para timeouts.
- **Tests:** Backend (Jest): GameEngine, RoundManager, WinnerDeterminator, CardEvaluator, managers, integración GameFlow. Frontend (Vitest): connection, token-monitor, login-auto-rejoin, winner-display, round-end-winner, secure-storage.
- **Documentación:** CODE_REVIEW.md, CODE_REVIEW_GENERAL.md, docs de arquitectura, logging y Render.

---

## 3. Riesgos y mejoras prioritarias

### Alta prioridad

| Tema | Dónde | Recomendación |
|------|--------|----------------|
| **Tipado `any`** | MyRoom `onCreate/onAuth/onJoin(options: any)`; frontend `room.onMessage(..., (payload: any))` | Definir `RoomOptions`, `JoinOptions`, `AuthOptions` y tipos de payload (RoundEndedPayload, etc.) y usarlos en firma y handlers. |
| **main.ts muy grande** | `frontend/src/main.ts` ~1500+ líneas | Extraer: (1) lógica de conexión/sala (join, leave, reconnect, onMessage), (2) turn-timer y (3) cualquier flujo de rebuy/UI pesada. Dejar en main solo bootstrap y coordinación. |
| **Config/env dispersa** | `API_URL` en MyRoom, timeouts en `constants.ts`, JWT en `app.config` y `auth` | Centralizar en un módulo (p. ej. `src/config/env.ts`) y validar al arranque; usar ese módulo en MyRoom y constants. |

### Media prioridad

| Tema | Dónde | Recomendación |
|------|--------|----------------|
| **GameEngine `any`** | `_updateGameState(player: any, betAmounts: any)` | Usar tipo `Player` (schema) y tipo concreto para betAmounts. |
| **MyRoom sin tests unitarios** | Excluido de coverage | Añadir 1–2 tests de integración que unan a una sala, inicien partida y ejecuten una acción para evitar regresiones. |
| **Formato de errores API** | Varios endpoints | Unificar respuestas de error (p. ej. `{ error: string, code?: string }`) para que el frontend mapee siempre igual. |

### Baja prioridad

| Tema | Dónde | Recomendación |
|------|--------|----------------|
| **Pixi** | `pixiApp`/`pixiLib` como `any` | Definir tipo mínimo (renderer, ticker, Texture, Sprite) o documentar contrato. |
| **Security fuera de coverage** | `src/security/**` | Documentar en TESTING.md que se validan por integración/manual; opcional: tests con mocks que comprueben que rate-limit y audit se disparan. |
| **CI** | Build, Codecov, ESLint | Incluir build del frontend en CI si el deploy sirve el cliente; revisar si Codecov/ESLint deben ser obligatorios. |

---

## 4. Seguridad (resumen)

- **Bien:** JWT, bcrypt, rate limiting, validación de entrada, StateView para manos, endpoint interno protegido con `INTERNAL_API_SECRET`, no hay secrets hardcodeados en repo.
- **Revisar:** CORS / ALLOWED_ORIGINS en producción; no loguear tokens ni sesiones completas; rotación de JWT_SECRET y buenas prácticas con DB (env por entorno).

---

## 5. Testing (resumen)

- **Backend:** Suites por módulo (game, managers, rooms, integration); coverage con umbral en jest.config; ConnectionMonitor y MyRoom (tournament, onJoin, createRateLimit) con tests.
- **Frontend:** Vitest en módulos extraídos (connection, auth, game helpers); no hay E2E; valorar smoke (build + carga de app) en CI.

---

## 6. Checklist rápido

- [ ] Tipar opciones de MyRoom (onCreate, onAuth, onJoin) y payloads de mensajes en frontend.
- [ ] Reducir tamaño de main.ts extrayendo conexión/sala y turn-timer.
- [ ] Centralizar env del game server y usarlo en MyRoom y constants.
- [ ] Añadir al menos un test de integración que cubra join + start + una acción en MyRoom.
- [ ] Unificar formato de errores de la API.
- [ ] Documentar en TESTING.md la exclusión de MyRoom y security del coverage.

---

## 7. Referencias

- **Detalle por capas:** `docs/CODE_REVIEW.md`, `CODE_REVIEW_GENERAL.md`, `CODE_REVIEW_API_SERVER.md`, `CODE_REVIEW_GAME_BACKEND.md`, `CODE_REVIEW_FRONTEND.md`.
- **Arquitectura:** `docs/ARCHITECTURE.md`.
- **Logs y deploy:** `docs/RENDER_LOGS.md`.
