# Migración a Colyseus 0.17

## Cambios aplicados

### Dependencias (package.json)

- **Backend**: `colyseus` ^0.17.8, `@colyseus/core` ^0.17.32, `@colyseus/schema` ^4.0.8, `@colyseus/tools` ^0.17.18, `@colyseus/ws-transport` ^0.17.9, `@colyseus/monitor` ^0.17.7, `@colyseus/playground` ^0.17.10, `@colyseus/auth` ^0.17.6.
- **Frontend**: `@colyseus/sdk` ^0.17.26 (en `vite.config.ts` el alias `colyseus.js` → `@colyseus/sdk`).
- **Dev**: `@colyseus/loadtest` ^0.17.8, `@colyseus/testing` ^0.17.11.
- Instalación: `npm install --legacy-peer-deps` por conflictos de peer (p. ej. zod con playground).

### Room (MyRoom.ts)

- Genérico: `Room<MyRoomState>` → `Room<{ state: MyRoomState }>` (formato 0.17).
- **onLeave**: `onLeave(client, consented: boolean)` → `onLeave(client, code: number)`. Se usa `CloseCode.CONSENTED` para decidir si fue consentido: `const consented = code === CloseCode.CONSENTED`.
- **CloseCode**: importado desde `@colyseus/core` (también disponible en el paquete `colyseus`).

### Códigos de cierre personalizados

Colyseus 0.17 reserva 4000–4010. Para no chocar con ellos se usan:

- **4011** – sesión reemplazada por otro login (`CUSTOM_SESSION_REPLACED` en `src/rooms/close-codes.ts`).
- **4012** – tiempo de rebuy agotado (`CUSTOM_REBUY_TIMEOUT`).

El frontend comprueba `code === 4011` para mostrar “Tu sesión fue reemplazada…”.

### LobbyRoom

- Ya no hace falta llamar manualmente a `updateLobby()` tras `setMetadata()`; se actualiza solo.

### app.config.ts

- Se mantiene la sintaxis anterior (`config()` de `@colyseus/tools`); la nueva sintaxis con `defineServer`/`defineRoom` es opcional y el proyecto sigue con la actual (transport custom, Express, `beforeListen`).

### Tests

- **MyRoom.tournament.test.ts**: se hace `jest.mock("@colyseus/core", ...)` para no cargar el core real (y sus dependencias ESM como `rou3`) en Jest.

## Referencia

- [Guía de migración 0.17](https://docs.colyseus.io/migrating/0.17)
- Códigos de cierre: 4000 CONSENTED, 4001 SERVER_SHUTDOWN, 4002 WITH_ERROR, 4003 FAILED_TO_RECONNECT, 4010 MAY_TRY_RECONNECT.
