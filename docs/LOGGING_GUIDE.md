# 📊 Guía de Sistema de Logging

## Estado Actual (Marzo 2026)

### Logs en Desarrollo (Actual)
- ✅ **Logs a consola** - Todos los eventos van a terminal en tiempo real
- ❌ **No hay archivos de logs** - Los logs NO persisten en disco en modo desarrollo
- ✅ **Winston Logger configurado** - Listo para producción

### Logs en Producción
- ✅ **Archivos persistentes** en `logs/combined.log` y `logs/error.log`
- ✅ **Rotación automática** - Max 10MB × 5 archivos
- ✅ **Formato JSON** - Para agregadores de logs (ELK, Splunk, etc.)

---

## Eventos Loggeados por Categoría

### 🎮 Game Engine
| Evento | Nivel | Metadata |
|--------|-------|----------|
| Starting new hand | info | roomId |
| Proceeding to next phase | info | currentPhase, roomId |
| All players all-in | info | roomId |
| Turn ended | info | phase, nextPlayer, roomId |
| Game ended - champion crowned | info | championId, chips, roomId |
| Player bet | info | playerId, amount, phase, roomId |

### 💰 Winner Determination
| Evento | Nivel | Metadata |
|--------|-------|----------|
| Round ended | info | winners, payouts, pot, sidepots, roomId |

### 👤 Player Lifecycle
| Evento | Nivel | Metadata |
|--------|-------|----------|
| Player joined | info | userId, sessionId, roomId |
| Player left | info | sessionId, roomId |
| Session replaced | info | userId, oldSessionId, newSessionId |

### 🪙 Rebuy Manager
| Evento | Nivel | Metadata |
|--------|-------|----------|
| Seat reserved for rebuy | info | userId, seatIndex, roomId |
| Player rebuyed | info | userId, chips, seatIndex, roomId |

### 🔐 Authentication
| Evento | Nivel | Metadata |
|--------|-------|----------|
| Token validation attempt | warn | attempt, maxRetries, roomId |
| Token validation failed | error | error, roomId |

### 📍 Session Manager
| Evento | Nivel | Metadata |
|--------|-------|----------|
| Session registered | info | userId, sessionId, roomId |
| Session removed | info | userId, sessionId, roomId |
| Session replaced | info | userId, oldSessionId, newSessionId |

### 🔗 Connection Monitor
| Evento | Nivel | Metadata |
|--------|-------|----------|
| ConnectionMonitor started | info | intervalMs, timeoutMs, roomId |
| Client heartbeat timeout | warn | sessionId, roomId |

### 📊 Analytics Service
| Evento | Nivel | Metadata |
|--------|-------|----------|
| Analytics summary | info | totalConnections, currentConnections, averageDuration, etc. |

---

## Cómo Habilitar Logs Persistentes en Desarrollo

### Opción A: Modificar logger.ts (Recomendado)

```typescript
// src/config/logger.ts

// Agregar después de la línea 32
if (isDevelopment) {
  // Habilitar logs a archivos también en desarrollo
  logger.add(new winston.transports.File({ 
    filename: 'logs/dev.log',
    maxsize: 5242880, // 5MB
    maxFiles: 3,
  }));
}
```

### Opción B: Crear directorio logs manualmente

```bash
# En la raíz del proyecto
mkdir logs

# El logger automáticamente empezará a escribir en producción
NODE_ENV=production npm run dev
```

---

## Formato de Logs

### Desarrollo (Consola)
```
14:35:34 [info]: Starting new hand {"roomId":"abc123"}
14:35:35 [info]: Player bet {"playerId":"player-1","amount":100,"phase":"preflop","roomId":"abc123"}
```

### Producción (JSON)
```json
{
  "level": "info",
  "message": "Starting new hand",
  "roomId": "abc123",
  "timestamp": "2026-03-05T14:35:34.123Z",
  "service": "chiribito-backend"
}
```

---

## Análisis de Logs

### Ver logs en tiempo real
```bash
npm run dev
```

### Buscar eventos específicos (producción)
```bash
# Ver solo errores
cat logs/error.log | grep "CHEAT_DETECTED"

# Ver logs de una sala específica
cat logs/combined.log | grep "abc123"

# Ver apuestas
cat logs/combined.log | grep "Player bet"
```

### Usar herramientas de análisis
```bash
# Instalar pino-pretty para formato bonito
npm install -g pino-pretty

# Ver logs formateados
cat logs/combined.log | pino-pretty
```

---

## Mejoras Futuras Sugeridas

### ✅ Implementar (Alta Prioridad)
- [ ] **Database logging** - Persistir eventos críticos en PostgreSQL
- [ ] **Structured metadata** - Agregar más contexto a cada log
- [ ] **Log correlation IDs** - Trackear requests completos

### 🔮 Considerar (Media Prioridad)
- [ ] **ELK Stack integration** - Elasticsearch + Logstash + Kibana
- [ ] **Real-time dashboards** - Grafana para visualización
- [ ] **Alert system** - Notificaciones en Slack/Discord para errores críticos

### 💡 Ideas (Baja Prioridad)
- [ ] **Replay system** - Reconstruir partidas desde logs
- [ ] **Performance metrics** - APM con Prometheus
- [ ] **Player behavior analytics** - Análisis de patrones de juego

---

## Game Audit Log (En Memoria)

**Ubicación**: `src/security/game-audit.ts`

**Eventos rastreados**:
```typescript
PLAYER_JOIN, PLAYER_LEAVE, PLAYER_REJOIN
HAND_START, HAND_END
ACTION_TAKEN, ACTION_INVALID
POT_UPDATE, WINNER_DECLARED
CHEAT_DETECTED
DISCONNECT, RECONNECT, TIMEOUT
```

**Limitaciones**:
- ❌ Max 10,000 eventos en memoria
- ❌ Se pierden al reiniciar servidor
- ❌ Retención: 7 días (solo en memoria activa)

**Mejora Sugerida**: Persistir en base de datos

---

## Analytics Service (En Memoria)

**Ubicación**: `src/rooms/managers/AnalyticsService.ts`

**Métricas rastreadas por sesión**:
```typescript
- joinTime, leaveTime
- disconnections, reconnections
- messagesReceived, messagesSent
- actionsPerformed
- errors
```

**Resumen cada 5 minutos** con:
- Total connections
- Current connections
- Average session duration
- Total actions/messages/errors

**Limitaciones**:
- ❌ Se pierde al reiniciar servidor
- ❌ No histórico más allá de sesión actual

---

## Recomendaciones para Logs Persistentes

### 1. Crear tabla de logs en PostgreSQL

```sql
CREATE TABLE game_events (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(50) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  player_id VARCHAR(50),
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  INDEX idx_room_timestamp (room_id, timestamp),
  INDEX idx_event_type (event_type)
);
```

### 2. Agregar DatabaseLogger service

```typescript
class DatabaseLogger {
  async logEvent(event: GameAuditEvent): Promise<void> {
    await db.query(
      'INSERT INTO game_events (room_id, event_type, player_id, metadata) VALUES ($1, $2, $3, $4)',
      [event.roomId, event.type, event.playerId, event.details]
    );
  }
}
```

### 3. Consultar histórico

```sql
-- Ver todas las partidas del día
SELECT * FROM game_events 
WHERE timestamp > NOW() - INTERVAL '1 day'
ORDER BY timestamp DESC;

-- Ver una partida específica
SELECT * FROM game_events 
WHERE room_id = 'abc123'
ORDER BY timestamp ASC;

-- Análisis de ganadores
SELECT player_id, COUNT(*) as wins
FROM game_events
WHERE event_type = 'WINNER_DECLARED'
GROUP BY player_id
ORDER BY wins DESC;
```

---

## Comandos Útiles

```bash
# Ver logs en desarrollo (consola)
npm run dev

# Iniciar en producción con logs persistentes
NODE_ENV=production npm start

# Ver logs de error recientes
tail -f logs/error.log

# Ver todos los logs recientes
tail -f logs/combined.log

# Buscar palabra específica en logs
grep "player-1" logs/combined.log

# Contar errores
grep -c "error" logs/combined.log
```

---

## Estado Actual: Resumen

| Característica | Estado | Comentarios |
|---------------|--------|-------------|
| Logs a Consola | ✅ Funciona | Perfecto para desarrollo |
| Logs a Archivo (dev) | ❌ Deshabilitado | Fácil de activar |
| Logs a Archivo (prod) | ✅ Configurado | `logs/combined.log`, `logs/error.log` |
| Analytics en Memoria | ✅ Funciona | Se pierde al reiniciar |
| Game Audit en Memoria | ✅ Funciona | Max 10k eventos |
| Database Logging | ❌ No implementado | Recomendado para persistencia |
| Log Rotation | ✅ Configurado | 10MB × 5 archivos |
| Structured Logging | ✅ JSON en prod | Listo para agregadores |

---

**Conclusión**: El sistema de logging está bien estructurado pero actualmente **no persiste en desarrollo**. Para ver logs persistentes, necesitas:
1. Ejecutar en modo producción, O
2. Modificar `logger.ts` para habilitar file transport en desarrollo, O
3. Implementar database logging para histórico completo
