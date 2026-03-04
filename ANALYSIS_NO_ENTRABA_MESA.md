# Análisis: Por qué no entraba a la mesa - Problema de WebSocket/Auth (3 marzo)

## Resumen Ejecutivo
El problema de "authorized" + "no entra" que ocurrió entre las 12:00 y 16:22 del 3 de marzo fue causado por una cascada de cambios fallidos en el flujo de autenticación WebSocket. El código fue revertido exitosamente al commit `529b93a` (2 marzo, 14:34).

---

## 1. El Flujo Correcto (Estado Actual - 529b93a)

### Cliente (frontend/src/main.ts línea 1537)
```typescript
async function joinRoom(forceReplace = false) {
  const client = new Client(WS_URL);
  
  joinedRoom = await client.joinOrCreate("my_room", {
    auth: { token },        // ✅ Token en options.auth.token
    name: username,
    forceReplace
  });
}
```

### Servidor (src/rooms/MyRoom.ts línea 492)
```typescript
async onAuth(client: Client, options: any) {
  // Extrae token de múltiples ubicaciones:
  const token = options?.token ||              // Intenta directo
                options?.auth?.token ||        // ✅ Encuentra aquí
                (options?.headers && ...);     // Fallback headers
  
  if (!token) throw new Error("NO_TOKEN");
  
  const decoded = jwt.verify(token, secret);   // Valida JWT
  options.authUser = decoded;
  return options.authUser;
}
```

**Estado correcto:** Token en `options.auth.token` → se extrae en servidor → JWT se valida → entra a la mesa.

---

## 2. Los Commits Problemáticos (Hoy - 3 de marzo)

### 14:05 - `5d7c610` ⚠️ BREAKING CHANGE
**Cambio:** Deshabilitó `protectRoute` para debug
```typescript
// ANTES (protegido):
app.use("/colyseus", protectRoute, monitor());

// DESPUÉS (sin protección):
app.use("/colyseus", monitor());  // ⚠️ Permitía acceso sin auth
```
**Impacto:** Menor - solo afecta a monitor, no al join.

---

### 14:03 - `2618e08` ⚠️ AGGRESSIVE LOGGING
**Cambio:** Añadió logging debugging en verifyClient
```typescript
verifyClient: (info, callback) => {
  logger.warn('|||||||||||||||||||||||||||||||||||||||||||');
  logger.warn('verifyClient ENTRY - WebSocket connection attempt detected');
  // ...
  callback(true);  // ✅ Aún accept
}
```
**Impacto:** Ninguno funcionalmente - solo logs.

---

### 13:56 - `dd7badc` a 13:10 - `537cfb1` ⚠️ CRITICAL HTTP SERVER CHANGES
**Cambio:** Múltiples iteraciones en cómo arrancar el servidor:
- Algunos elimininaban el HTTP server explícito
- Otros lo creaban manualmente
- Afectaban cómo se registraban las rutas `/matchmake/*`

```typescript
// Iteración A (13:56 - FINAL GANADORA):
const transport = new WebSocketTransport(options);
// Let Colyseus create HTTP server internally ✅

// Iteración B (13:40):
const httpServer = createServer(app);
gameServer.attach(httpServer);  // ❌ Conflictos con Colyseus

// Iteración C (13:35):
gameServer.attach(httpServer);  // ❌ Doble servidor
```

**Impacto:** Rompía ruta `/matchmake/joinOrCreate/my_room` - clientes podían conectar pero NO podían hacer join.

---

### 14:14 - `25f0a10` ⚠️ FORCED WEBSOCKET-ONLY
**Cambio:** Añadió `transports: ['websocket']` al cliente
```typescript
const client = new Client(WS_URL, {
  transports: ['websocket']  // Force-only, no HTTP fallback
} as any);
```
**Impacto:** Requería que el servidor REALMENTE tuviera WebSocket funcionando - exponía issues anteriores.

---

### 14:17 - `22b67a9` ⚠️ TOKEN COMO QUERY PARAMETER
**Cambio:** Intentó enviar token en URL en lugar de opciones
```typescript
// ANTES (correcto):
joinOrCreate("my_room", { auth: { token } })

// DESPUÉS (BROKEN):
const roomId = `my_room?token=${encodeURIComponent(state.token)}`;
joinOrCreate(roomId, { name: username })  // ❌ Token perdido
```

**Servidor esperaba:**
```typescript
options?.token || options?.auth?.token  // ❌ No encuentra nada aquí
```

**Impacto:** Token NO llegaba a `onAuth` → `NO_TOKEN` error → AUTH FALLABA.

---

### 15:25 - `9fa9fb4` 🔴 UWEB SOCKETS MIGRATION
**Cambio:** Migró de `WebSocketTransport` a `uWebSocketsTransport`
```typescript
import { uWebSocketsTransport } from "@colyseus/uwebsockets-transport";

transport: new uWebSocketsTransport({
  maxPayloadLength: 16 * 1024,
  idleTimeout: 120,
  // ...
})
```

**Impacto:** Ninguno técnico en código - pero...

---

### 16:22 - `b584bc4` 🔴 DEPLOY FAILURE
**Error en Render:**
```
Error: This version of uWS.js (v20.56.0) supports only Node.js versions 20, 22, 24 and 25
Error: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.38' not found
```

**Causa:** `uWebSockets.js` necesita `GLIBC_2.38` pero Render tiene versión anterior.

**Impacto:** ✅ CRÍTICO - El servidor ni siquiera arrancaba en Render.

---

## 3. Cascada de Fallos

```
13:10-13:56: HTTP Server Config Issues
    ↓
14:03-14:05: Logging + Disabling Protection
    ↓
14:14: Force WebSocket-only (expone issues)
    ↓
14:17: Token query parameter hack (BREAKS AUTH)
    ↓
15:25: Migrate to uWebSockets (no error)
    ↓
16:22: Deploy FAILS - incompatible GLIBC
```

---

## 4. Síntomas Observados

### Log de Render (3 marzo 13:09:42):
```json
"onAuth called" { "clientId":"S9nWJIIso", "hasToken":false, "options":"{}" }
"NO_TOKEN in onAuth" { "clientId":"S9nWJIIso" }
"onAuth failed" { "error":"NO_TOKEN" }
```

**Diagnóstico:**
- ✅ WebSocket upgrade FUNCIONABA (verifyClient fired)
- ✅ onAuth fue LLAMADO
- ❌ Pero `options` estaba VACÍO o NO contenía token
- ❌ Cliente enviaba token pero NO lleagaba al servidor

**Causa Raíz:** El hack de token query parameter (`22b67a9`) rompió la extracción del token en `onAuth`.

---

## 5. El Token Nunca Llegaba

### Por qué el cambio `22b67a9` fue fatal:

**Antes (correcto):**
```typescript
// ENVÍO: options = { auth: { token: "jwt..." }, name, forceReplace }
const token = options?.auth?.token  // ✅ Encuentra
```

**Después (roto):**
```typescript
// ENVÍO: roomId = "my_room?token=jwt...", options = { name, forceReplace }
const token = options?.auth?.token  // ❌ undefined - options = {}

// El servidor NUNCA vio el query parameter
```

---

## 6. Estado Actual (Commit 529b93a)

✅ **Volvimos al estado estable de ayer**

```
✓ Cliente envía: joinOrCreate("my_room", { auth: { token }, name, forceReplace })
✓ Servidor extrae: options.auth.token
✓ JWT validado: jwt.verify(token, secret)
✓ onAuth retorna: options.authUser
✓ Cliente se une: room.join()
```

---

## 7. Lecciones Aprendidas

1. **Nunca cambiar múltiples capas a la vez**
   - HTTP server handling (13:10-13:56)
   - Transport config (14:03-14:05)
   - Token passing (14:17)
   - Transport library (15:25)
   
2. **Test después de cada cambio crítico**
   - Cambio en cómo pasa el token → requiere test inmediato
   - Cambio HTTP server → requiere validar matchmake routes

3. **Logs claros en auth**
   - `hasToken: false` + `options: "{}"` fue la pista clave
   - Necesitaríamos logs que muestren qué hay realmente en `options` después

4. **No forzar transporte sin validar**
   - `transports: ['websocket']` fue prueba para forced fallback
   - Pero expuso que el token no llegaba

---

## 8. Recomendaciones Futuro

1. **Crear test E2E para join flow**
   ```typescript
   // Test que valida:
   // 1. Client puede hacer WebSocket upgrade
   // 2. onAuth recibe token
   // 3. Jugador entra a mesa
   // 4. Puede jugar
   ```

2. **Agregar logging en puntos críticos**
   ```typescript
   onAuth({ 
     tokenReceived: !!token,
     tokenSource: token ? 'options.auth' : 'missing',
     optionsKeys: Object.keys(options)
   })
   ```

3. **Usar CI para detectar regressions**
   - Las pruebas de `test:colyseus-integration` deberían fallar antes del push

4. **Git hooks pre-push**
   - Validar que tests pasan antes de pushear cambios en auth

---

## Conclusión

El problema NO fue un único cambio, sino una **cascada de 7 commits** entre las 13:10 y 16:22 que combinados rompieron el flujo de autenticación:

- Cambios en HTTP server config
- Cambio en cómo se envía el token (query param en lugar de opciones)
- Migración a transporte incompatible con Render

El estado actual (`529b93a`) está limpio y funcionando. Todos estos cambios han sido revertidos.

