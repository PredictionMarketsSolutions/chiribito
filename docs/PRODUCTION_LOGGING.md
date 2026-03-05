# 🚀 Guía de Logs en Producción

## Configuración Actual

### Archivos de Logs en Producción

| Archivo | Contenido | Tamaño Max | Rotación |
|---------|-----------|------------|----------|
| `logs/combined.log` | **Todos los eventos** (info, warn, error, debug) | 10MB | 5 archivos |
| `logs/error.log` | **Solo errores** (error level) | 10MB | 5 archivos |

**Total**: Hasta 100MB de logs (50MB combined + 50MB error)

---

## Variables de Entorno

```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=info        # Opcional: debug, info, warn, error

# API URL para validación de tokens
API_URL=https://api.tudominio.com

# JWT Secret
JWT_SECRET=tu_secret_production
```

---

## Formato de Logs

### Desarrollo (Texto coloreado para consola)
```
14:35:34 [info]: Starting new hand {"roomId":"abc123"}
14:35:35 [warn]: Client rate limited {"sessionId":"session-1"}
```

### Producción (JSON estructurado)
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
  "timestamp": "2026-03-05T14:35:35.456Z",
  "service": "chiribito-backend",
  "stack": "Error: Network error\n    at validateTokenRemote..."
}
```

---

## Iniciar en Producción

### Opción 1: Directamente con Node.js

```bash
# Build primero
npm run build

# Iniciar en producción
NODE_ENV=production npm start
```

### Opción 2: Con PM2 (Recomendado)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar servidor con PM2
pm2 start dist/index.js --name "chiri-backend" --env production

# Ver logs en tiempo real
pm2 logs chiri-backend

# Ver solo errores
pm2 logs chiri-backend --err

# Detener
pm2 stop chiri-backend

# Reiniciar
pm2 restart chiri-backend
```

#### Configuración PM2 (ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: 'chiri-backend',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
```

### Opción 3: Con Docker

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY logs ./logs

ENV NODE_ENV=production
ENV LOG_LEVEL=info

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

```bash
# Build imagen
docker build -t chiri-backend .

# Ejecutar con volumen para logs persistentes
docker run -d \
  --name chiri-backend \
  -p 3000:3000 \
  -v $(pwd)/logs:/app/logs \
  -e NODE_ENV=production \
  chiri-backend

# Ver logs
docker logs -f chiri-backend

# Ver logs del contenedor + archivos
docker exec chiri-backend cat /app/logs/combined.log
```

---

## Comandos para Ver Logs en Producción

### Usando scripts npm

```bash
# Ver todos los logs
NODE_ENV=production npm run logs

# Ver solo errores
NODE_ENV=production npm run logs:error

# Seguir logs en tiempo real
NODE_ENV=production npm run logs:watch
```

### Comandos directos (Linux/Mac)

```bash
# Ver últimas 100 líneas
tail -n 100 logs/combined.log

# Seguir logs en tiempo real
tail -f logs/combined.log

# Buscar palabra específica
grep "Player bet" logs/combined.log

# Contar errores
grep -c '"level":"error"' logs/combined.log

# Ver logs del día actual
grep "$(date +%Y-%m-%d)" logs/combined.log

# Ver errores de las últimas 24h
find logs -name "*.log" -mtime -1 -exec grep '"level":"error"' {} \;
```

### Comandos PowerShell (Windows)

```powershell
# Ver últimas 100 líneas
Get-Content logs\combined.log -Tail 100

# Seguir logs en tiempo real
Get-Content logs\combined.log -Wait -Tail 20

# Buscar palabra específica
Select-String -Path logs\combined.log -Pattern "Player bet"

# Contar errores
(Select-String -Path logs\combined.log -Pattern '"level":"error"').Count

# Ver logs de hoy
Get-Content logs\combined.log | Where-Object { $_ -match (Get-Date -Format "yyyy-MM-dd") }
```

---

## Rotación de Archivos

Cuando un archivo alcanza 10MB:

1. `combined.log` → `combined.log.1`
2. `combined.log.1` → `combined.log.2`
3. ...
4. `combined.log.4` → **eliminado**
5. Nuevo `combined.log` creado

**Total**: 5 archivos × 10MB = 50MB por tipo de log

---

## Análisis de Logs

### Parsear JSON con jq (Linux/Mac)

```bash
# Instalar jq
sudo apt-get install jq  # Ubuntu/Debian
brew install jq          # macOS

# Ver logs bonitos
cat logs/combined.log | jq '.'

# Filtrar solo errores
cat logs/combined.log | jq 'select(.level == "error")'

# Contar eventos por tipo
cat logs/combined.log | jq -r '.message' | sort | uniq -c | sort -rn

# Ver errores de una sala específica
cat logs/combined.log | jq 'select(.roomId == "abc123" and .level == "error")'

# Estadísticas de las últimas 100 líneas
tail -n 100 logs/combined.log | jq '[.level] | group_by(.) | map({level: .[0], count: length})'
```

### Parsear JSON con PowerShell

```powershell
# Leer y parsear JSON
$logs = Get-Content logs\combined.log | ForEach-Object { $_ | ConvertFrom-Json }

# Filtrar solo errores
$logs | Where-Object { $_.level -eq "error" }

# Contar eventos por nivel
$logs | Group-Object -Property level | Select-Object Name, Count

# Ver mensajes únicos
$logs | Select-Object -Property message -Unique

# Errores de una sala específica
$logs | Where-Object { $_.roomId -eq "abc123" -and $_.level -eq "error" }
```

---

## Integración con Servicios de Logging

### 1. Loggly

```typescript
// Instalar transport
npm install winston-loggly-bulk

// Agregar a logger.ts
import { Loggly } from 'winston-loggly-bulk';

if (isProduction) {
  logger.add(new Loggly({
    token: process.env.LOGGLY_TOKEN,
    subdomain: 'tusubdominio',
    tags: ['chiri-backend', 'production'],
    json: true
  }));
}
```

### 2. Papertrail

```typescript
npm install winston-papertrail

import { Papertrail } from 'winston-papertrail';

if (isProduction) {
  logger.add(new Papertrail({
    host: process.env.PAPERTRAIL_HOST,
    port: process.env.PAPERTRAIL_PORT,
    hostname: 'chiri-backend',
    program: 'colyseus'
  }));
}
```

### 3. Elasticsearch + Kibana (ELK Stack)

```bash
# docker-compose.yml
version: '3'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.6.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"
    volumes:
      - es-data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.6.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
      - ./logs:/logs
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.6.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  es-data:
```

```conf
# logstash.conf
input {
  file {
    path => "/logs/combined.log"
    codec => "json"
    type => "chiri-backend"
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "chiri-backend-%{+YYYY.MM.dd}"
  }
}
```

### 4. Datadog

```typescript
npm install winston-datadog-logs

import { DatadogTransport } from 'winston-datadog-logs';

if (isProduction) {
  logger.add(new DatadogTransport({
    apiKey: process.env.DATADOG_API_KEY,
    hostname: 'chiri-backend',
    service: 'colyseus-server',
    ddsource: 'nodejs'
  }));
}
```

---

## Monitoreo y Alertas

### Configurar Alertas Básicas

```bash
#!/bin/bash
# scripts/check-errors.sh

ERROR_COUNT=$(grep -c '"level":"error"' logs/combined.log)
THRESHOLD=10

if [ $ERROR_COUNT -gt $THRESHOLD ]; then
  echo "⚠️ ALERTA: $ERROR_COUNT errores detectados en logs"
  
  # Enviar notificación (ejemplo con curl a webhook)
  curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"⚠️ $ERROR_COUNT errores en chiri-backend\"}"
fi
```

```bash
# Ejecutar cada 5 minutos con cron
*/5 * * * * /path/to/scripts/check-errors.sh
```

### Healthcheck Endpoint

```typescript
// src/app.ts
app.get('/health', (req, res) => {
  const fs = require('fs');
  const logFile = 'logs/combined.log';
  
  // Check si los logs se están escribiendo
  const stats = fs.statSync(logFile);
  const lastModified = new Date(stats.mtime);
  const now = new Date();
  const diffMinutes = (now - lastModified) / 1000 / 60;
  
  if (diffMinutes > 10) {
    return res.status(500).json({
      status: 'unhealthy',
      reason: 'Logs not being written',
      lastModified: lastModified
    });
  }
  
  res.json({ status: 'healthy', logsActive: true });
});
```

---

## Backup de Logs

### Script de Backup Automático

```bash
#!/bin/bash
# scripts/backup-logs.sh

BACKUP_DIR="/backup/logs"
DATE=$(date +%Y-%m-%d)
ARCHIVE_NAME="chiri-logs-$DATE.tar.gz"

# Crear backup
tar -czf "$BACKUP_DIR/$ARCHIVE_NAME" logs/

# Subir a S3 (ejemplo)
aws s3 cp "$BACKUP_DIR/$ARCHIVE_NAME" s3://my-bucket/logs/

# Limpiar backups antiguos (mayores a 30 días)
find "$BACKUP_DIR" -name "chiri-logs-*.tar.gz" -mtime +30 -delete

echo "✅ Backup completado: $ARCHIVE_NAME"
```

```bash
# Ejecutar diariamente a las 2 AM con cron
0 2 * * * /path/to/scripts/backup-logs.sh
```

---

## Troubleshooting

### Problema: Logs no se están escribiendo

```bash
# 1. Verificar permisos del directorio
ls -la logs/
chmod 755 logs/

# 2. Verificar variable de entorno
echo $NODE_ENV

# 3. Verificar que el servidor está corriendo en producción
ps aux | grep node

# 4. Probar manualmente
NODE_ENV=production node dist/index.js
```

### Problema: Archivos de logs muy grandes

```bash
# Limpiar logs antiguos
find logs/ -name "*.log.*" -mtime +7 -delete

# Comprimir logs
gzip logs/combined.log.1
gzip logs/combined.log.2

# Rotar manualmente
mv logs/combined.log logs/combined.log.backup
# Winston creará un nuevo archivo automáticamente
```

### Problema: Disco lleno

```bash
# Ver uso de disco
df -h

# Ver tamaño de logs
du -sh logs/

# Limpiar logs emergencia
> logs/combined.log
> logs/error.log

# Configurar logrotate (Linux)
sudo nano /etc/logrotate.d/chiri-backend
```

```conf
# /etc/logrotate.d/chiri-backend
/path/to/chiri-backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 node node
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Mejores Prácticas

### ✅ DO

- ✅ Usar JSON en producción para facilitar parsing
- ✅ Incluir contexto relevante (roomId, playerId, sessionId)
- ✅ Configurar rotación de logs
- ✅ Monitorear errores automáticamente
- ✅ Hacer backups periódicos
- ✅ Usar log levels apropiados (debug, info, warn, error)
- ✅ Agregar timestamps en UTC
- ✅ Incluir stack traces en errores

### ❌ DON'T

- ❌ Loggear contraseñas o tokens completos
- ❌ Loggear información sensible (tarjetas, emails sin hash)
- ❌ Usar `console.log` en producción
- ❌ Dejar logs sin rotación (crecimiento infinito)
- ❌ Ignorar errores en logs
- ❌ Loggear demasiado (performance impact)
- ❌ Olvidar limpiar logs antiguos

---

## Ejemplo de Sesión de Debugging

```bash
# 1. Ver últimos errores
tail -n 50 logs/error.log

# 2. Buscar contexto del error
grep "abc123" logs/combined.log | tail -n 100

# 3. Filtrar por rango de tiempo (si tienes timestamps)
grep "2026-03-05T14:" logs/combined.log

# 4. Analizar patrón de errores
grep '"level":"error"' logs/combined.log | grep "Token validation" | wc -l

# 5. Ver actividad de un jugador específico
grep "player-123" logs/combined.log | jq '.'
```

---

## Métricas Clave a Monitorear

| Métrica | Comando | Threshold |
|---------|---------|-----------|
| **Errores por hora** | `grep '"level":"error"' logs/combined.log \| wc -l` | < 10 |
| **Rate limits activados** | `grep "Client rate limited" logs/combined.log \| wc -l` | < 50 |
| **Token validation fails** | `grep "Token validation failed" logs/combined.log \| wc -l` | < 5 |
| **Disconnects inesperados** | `grep "unresponsive client" logs/combined.log \| wc -l` | < 10 |
| **Tamaño de logs** | `du -sh logs/` | < 100MB |

---

## Checklist de Deploy

Antes de deployar a producción:

- [ ] ✅ `NODE_ENV=production` configurado
- [ ] ✅ Directorio `logs/` existe con permisos correctos
- [ ] ✅ Variables de entorno configuradas (.env.production)
- [ ] ✅ Winston transport de archivos habilitado
- [ ] ✅ Rotación de logs configurada
- [ ] ✅ Backup automático configurado (opcional)
- [ ] ✅ Monitoreo de errores configurado
- [ ] ✅ Alertas configuradas (Slack/Email)
- [ ] ✅ Healthcheck endpoint funcionando
- [ ] ✅ PM2 o Docker configurado correctamente

---

**Última actualización**: Marzo 5, 2026  
**Estado**: ✅ Configuración lista para producción
