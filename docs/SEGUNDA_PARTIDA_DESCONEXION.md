# Desconexión en la segunda partida (sin refresh ni reemplazo manual)

## Qué pasa

- Dos clientes en la misma mesa, primera partida bien.
- En la **segunda partida** uno de ellos aparece como "Session removed" y al instante "Session registered" con **otra** `sessionId`, luego "Attempted to occupy already taken seat" y la partida se bloquea (turno con sessionId, sin acciones).
- El usuario **no** hace refresh ni reemplazo de sesión; los dos clientes siguen abiertos.
- El fallo es **constante** en la 2.ª partida pero no en un momento concreto (ni en una acción ni en una fase específica).

## Por qué aparece "Session removed" + "Session registered" (otra sessionId)

En el código, "Session removed" solo se escribe en dos sitios:

1. **Al hacer limpieza de un cliente que se va** (`handleLeaveCleanup`): el servidor ha recibido `onLeave` (la conexión se cerró).
2. **Al reemplazar sesión** (`handleJoin` con `replaceSessionId`): se borra la sesión antigua y se registra la nueva.

Si el usuario no hace reemplazo manual, entonces **la conexión de ese cliente se cerró** (el servidor recibió `onLeave`). Después, el **frontend reconecta solo** (`attemptReconnect` → `joinRoom(true)`), entra una **nueva** conexión con nueva `sessionId` y el auth devuelve `replaceSessionId`; por eso ves "Session removed" (la antigua) y "Session registered" (la nueva).

Es decir: algo cierra la conexión; el usuario no hace nada; la app abre otra conexión y entra con reemplazo de sesión.

## Posibles causas de que la conexión se cierre (siempre en 2.ª partida)

1. **Timeout de heartbeat del servidor**  
   Si no llegan mensajes `heartbeat` del cliente durante `HEARTBEAT_TIMEOUT_MS` (por defecto 90 s), el servidor hace `client.leave(4000, "Heartbeat timeout")`.  
   En logs deberías ver **"Forcing disconnect for unresponsive client"** justo antes.  
   Si **no** aparece ese log, el cierre no viene de nuestro timeout.

2. **Timeout de idle en Render / proxy**  
   Algunos entornos cierran conexiones WebSocket tras ~60 s sin tráfico. En la segunda partida puede haber menos mensajes que en la primera (menos acciones por minuto), y si el único tráfico son heartbeats cada 30 s, un timeout de 60 s en el proxy podría cerrar la conexión sin que nuestro código la cierre.

3. **Timeout interno de Colyseus**  
   Colyseus puede tener ping/pong u otros timeouts; si no se envían a tiempo, puede cerrar la conexión.

4. **Red**  
   Micro-cortes que cierran el WebSocket sin que el usuario note un “refresh”.

## Fix ya aplicado (para que la partida no se quede bloqueada)

Cuando entra la **nueva** conexión con `replaceSessionId`:

- En **PlayerLifecycleManager**: antes de ocupar el asiento de la nueva sesión se **libera** ese asiento en `SeatManager` (porque la sesión anterior ya no existe).
- En **MyRoom.onJoin**: se actualizan `state.currentTurn`, `playersInHand`, `playersActedThisRound` y `playersAllIn` para usar la **nueva** `sessionId`.

Con eso, aunque se produzca esa desconexión + reconexión en la 2.ª partida, la partida debería seguir jugable (sin "Attempted to occupy already taken seat" y con turno/nombre correctos). Es importante tener este fix desplegado.

## Qué revisar para reducir que pase

1. **Logs**  
   Si ves **"Forcing disconnect for unresponsive client"** justo antes del "Session removed", el cierre lo hace nuestro heartbeat. Si no lo ves, el cierre viene de fuera (Render, Colyseus o red).

2. **Heartbeat del servidor (si somos nosotros quienes cerramos)**  
   En producción puedes subir `HEARTBEAT_TIMEOUT_MS` (por ejemplo 120000 o 180000 ms) para ser menos estrictos y no expulsar por unos segundos de retraso.

3. **Timeout de Render / WebSockets**  
   Revisar en la documentación de Render si hay timeout de conexiones WebSocket o de idle y a cuántos segundos; si es ~60 s, intentar que haya tráfico (por ejemplo heartbeat + heartbeat_ack) con intervalo menor a 60 s (ya mandáis cada 30 s; confirmar que el servidor responde con `heartbeat_ack`).

4. **Cliente**  
   El frontend ya hace reconexión automática con `joinRoom(true)`; no hace falta que el usuario haga nada. Con el fix anterior, esa reconexión debería dejar la partida en estado correcto.

## Resumen

- No es un “reemplazo” ni un “refresh” que haga el usuario: es **desconexión real** + **reconexión automática** del frontend.
- El fix (liberar asiento y actualizar currentTurn / playersInHand / etc. en reemplazo) evita que la partida se bloquee cuando eso pase.
- Para que deje de ocurrir tanto, hay que identificar quién cierra la conexión (logs "Forcing disconnect", Render, Colyseus) y ajustar timeouts o tráfico según corresponda.
