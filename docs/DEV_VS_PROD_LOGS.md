# 📊 Diferencias: Logs en Desarrollo vs Producción

## Configuración Actual

### ✅ Desarrollo (NODE_ENV=development)

**Archivos**:
- `logs/dev.log` - Todos los logs (5MB × 3 = 15MB total)
- `logs/dev-error.log` - Solo errores (5MB × 3 = 15MB total)

**Formato**: Texto coloreado legible
```
14:35:34 [info]: Starting new hand {"roomId":"abc123"}
14:35:35 [warn]: Client rate limited {"sessionId":"session-1"}
14:35:36 [error]: Token validation failed {"error":"Network error"}
```

**Nivel de log**: `debug` (todos los eventos incluyendo debug)

**Ejecución**:
```bash
npm run dev
# O explícitamente:
NODE_ENV=development npm run dev
```

---

### ⚡ Producción (NODE_ENV=production)

**Archivos**:
- `logs/combined.log` - Todos los logs (10MB × 5 = 50MB total)
- `logs/error.log` - Solo errores (10MB × 5 = 50MB total)

**Formato**: JSON estructurado (para agregadores como ELK, Datadog)
```json
{
  "level": "info",
  "message": "Starting new hand",
  "roomId": "abc123",
  "timestamp": "2026-03-05T14:35:34.123Z",
  "service": "chiribito-backend"
}
```

```json
{
  "level": "error",
  "message": "Token validation failed after 3 attempts",
  "error": "Network error",
  "roomId": "test-room",
  "timestamp": "2026-03-05T14:35:36.789Z",
  "service": "chiribito-backend",
  "stack": "Error: Network error\n    at AuthenticationService..."
}
```

**Nivel de log**: `info` (sin mensajes debug)

**Ejecución**:
```bash
# Opción 1: Con build
npm run build
npm run start:prod

# Opción 2: Sin build (desarrollo con formato de producción)
npm run dev:prod
```

---

## Tabla Comparativa

| Característica | Desarrollo | Producción |
|----------------|------------|------------|
| **NODE_ENV** | `development` | `production` |
| **Formato** | Texto coloreado | JSON |
| **Archivo all** | `dev.log` | `combined.log` |
| **Archivo error** | `dev-error.log` | `error.log` |
| **Tamaño max** | 5MB × 3 = 15MB | 10MB × 5 = 50MB |
| **Nivel default** | `debug` | `info` |
| **Stack traces** | ✅ Sí | ✅ Sí (en JSON) |
| **Colores** | ✅ Sí | ❌ No |
| **Timestamp** | `HH:mm:ss` | ISO 8601 UTC |
| **Metadata** | JSON inline | JSON estructurado |

---

## Comandos para Cada Ambiente

### Desarrollo

```bash
# Iniciar servidor (desarrollo)
npm run dev

# Ver logs mientras corre (en otra terminal)
npm run logs:watch

# Ver errores
npm run logs:error

# Buscar término
npm run logs:search "Player bet"
```

### Producción (Local Testing)

```bash
# Opción 1: Simular producción sin build
npm run dev:prod

# Opción 2: Build y producción completa
npm run build
npm run start:prod

# Ver logs (producción)
NODE_ENV=production npm run logs:watch

# Analizar JSON
Get-Content logs\combined.log | ConvertFrom-Json | Format-Table
```

### Producción (Deploy Real)

```bash
# Con PM2
pm2 start ecosystem.config.js --env production
pm2 logs chiri-backend

# Con Docker
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/logs:/app/logs \
  -e NODE_ENV=production \
  chiri-backend

docker logs -f chiri-backend
```

---

## Probar Ambos Formatos Localmente

### 1️⃣ Ver formato de Desarrollo

```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Ver logs en tiempo real
npm run logs:watch

# Resultado:
# 14:35:34 [info]: Starting new hand {"roomId":"abc123"}
```

### 2️⃣ Ver formato de Producción

```bash
# Terminal 1: Iniciar en modo producción
npm run dev:prod

# Terminal 2: Ver logs en tiempo real
NODE_ENV=production npm run logs:watch

# Resultado (JSON):
# {"level":"info","message":"Starting new hand","roomId":"abc123",...}
```

---

## Cuándo Usar Cada Uno

### Usa **Desarrollo** cuando:
- 🛠️ Estás desarrollando features localmente
- 🐛 Estás debuggeando problemas
- 👀 Necesitas ver logs legibles en consola rápidamente
- 📝 Quieres todos los detalles (incluyendo debug logs)

### Usa **Producción** cuando:
- 🚀 Despliegas a servidor remoto
- 📊 Usas agregadores de logs (ELK, Datadog, Loggly)
- 🔍 Necesitas parsear logs con scripts/herramientas
- ⚡ Quieres mejor performance (menos logging overhead)

---

## Ejemplo Visual de Output

### Desarrollo (Consola)
```
14:35:34 [info]: Starting new hand {"roomId":"abc123"}
14:35:34 [info]: Player joined {"userId":123,"sessionId":"sess-1","roomId":"abc123"}
14:35:35 [info]: Player bet {"playerId":"player-1","amount":100,"phase":"preflop","roomId":"abc123"}
14:35:36 [warn]: Client rate limited {"sessionId":"sess-2","actionType":"bet","roomId":"abc123"}
14:35:37 [error]: Token validation failed after 3 attempts {"error":"Network error","roomId":"abc123"}
```

### Producción (JSON)
```json
{"level":"info","message":"Starting new hand","roomId":"abc123","timestamp":"2026-03-05T14:35:34.123Z","service":"chiribito-backend"}
{"level":"info","message":"Player joined","userId":123,"sessionId":"sess-1","roomId":"abc123","timestamp":"2026-03-05T14:35:34.456Z","service":"chiribito-backend"}
{"level":"info","message":"Player bet","playerId":"player-1","amount":100,"phase":"preflop","roomId":"abc123","timestamp":"2026-03-05T14:35:35.789Z","service":"chiribito-backend"}
{"level":"warn","message":"Client rate limited","sessionId":"sess-2","actionType":"bet","roomId":"abc123","timestamp":"2026-03-05T14:35:36.012Z","service":"chiribito-backend"}
{"level":"error","message":"Token validation failed after 3 attempts","error":"Network error","roomId":"abc123","timestamp":"2026-03-05T14:35:37.345Z","service":"chiribito-backend","stack":"Error: Network error\n    at..."}
```

---

## Análisis de Logs: Desarrollo vs Producción

### Desarrollo (legible directo)
```bash
npm run logs | grep "error"
# 14:35:37 [error]: Token validation failed...
```

### Producción (necesita parsing)
```bash
# PowerShell
Get-Content logs\combined.log | ConvertFrom-Json | Where-Object { $_.level -eq "error" }

# Linux/Mac con jq
cat logs/combined.log | jq 'select(.level == "error")'
```

---

## Mejores Prácticas por Ambiente

### Desarrollo ✅
- ✅ Usa `npm run dev` (formato coloreado)
- ✅ Revisa logs en consola en tiempo real
- ✅ Usa `npm run logs:watch` para seguimiento
- ✅ Habilita nivel `debug` si necesitas detalles
- ✅ No te preocupes por el tamaño de logs

### Producción ✅
- ✅ Usa `NODE_ENV=production` siempre
- ✅ Configura rotación de logs
- ✅ Monitorea `error.log` automáticamente
- ✅ Integra con agregador de logs (ELK/Datadog)
- ✅ Configura alertas para errores críticos
- ✅ Haz backups periódicos del directorio logs/
- ✅ Limpia logs antiguos (>7 días)

---

## Quick Start

### Para empezar a ver logs AHORA

```bash
# 1. Instalar cross-env si falta
npm install

# 2. Iniciar en desarrollo
npm run dev

# 3. En otra terminal, seguir logs
npm run logs:watch

# 4. Para probar producción localmente
npm run dev:prod
# (Ver logs en logs/combined.log en formato JSON)
```

---

## Troubleshooting

### "npm run logs" falla
```bash
# Problema: No hay archivos de logs todavía
# Solución: Ejecuta el servidor primero

npm run dev
# Espera unos segundos, luego:
npm run logs
```

### Quiero ver formato JSON localmente
```bash
# Usa npm run dev:prod para simular producción
npm run dev:prod

# Los logs irán a logs/combined.log en formato JSON
Get-Content logs\combined.log -Wait
```

### Los archivos no se crean
```bash
# Verifica que el directorio logs/ existe
ls logs/

# Si no existe, créalo
mkdir logs

# Verifica NODE_ENV
echo $env:NODE_ENV  # PowerShell
echo $NODE_ENV      # bash
```

---

**Conclusión**: Ambos ambientes están configurados y listos. La principal diferencia es el formato (texto legible vs JSON estructurado) y el tamaño de archivos. Ambos persisten a disco automáticamente.
