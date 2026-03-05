# 📊 Cómo Ver Logs en Render

## Render captura logs automáticamente

Cuando despliegas en Render, **NO necesitas archivos de logs**. Render captura todo lo que tu aplicación escribe a `stdout` y `stderr` (console.log, console.error, etc).

## Cómo Ver Logs en Render

### 1. Dashboard Web
1. Ve a https://dashboard.render.com
2. Selecciona tu servicio (ej: "chiri-backend")
3. Click en la pestaña **"Logs"**
4. Verás logs en tiempo real

### 2. Funciones del Dashboard
- **Live tail**: Logs en tiempo real (auto-scroll)
- **Búsqueda**: Buscar por texto
- **Filtros**: Por nivel (info, error, etc)
- **Descargar**: Puedes descargar los logs

### 3. Render CLI
También puedes ver logs desde tu terminal:

```bash
# Instalar Render CLI
npm install -g @render/cli

# Login
render login

# Ver logs en tiempo real
render logs --service <tu-service-id> --tail
```

## Qué Logs Verás en Render

Tu aplicación usa Winston, que en producción (NODE_ENV=production) escribe:

```json
{
  "level": "info",
  "message": "Starting new hand",
  "roomId": "abc123",
  "timestamp": "2026-03-05T14:35:34.123Z"
}
```

Render captura estas líneas JSON automáticamente.

## Configuración en Render

### Variables de Entorno
Asegúrate de tener en tu servicio de Render:

```
NODE_ENV=production
LOG_LEVEL=info
```

### ¿Winston escribe a archivos en Render?

**NO** - Porque en Render:
- El filesystem es **efímero** (se borra en cada deploy)
- No hay acceso directo al filesystem
- Los archivos se perderían

Por eso Winston en producción escribe a **console**, y Render captura el console.

## Persistencia de Logs en Render

### Planes Free/Starter
- Logs disponibles por **7 días**
- Después se borran automáticamente

### Plan Pro/Team
- Logs disponibles por **30 días**
- Puedes exportar a servicios externos

## Exportar Logs a Servicios Externos

Si necesitas logs por más tiempo, puedes integrar con:

### 1. Datadog
```typescript
import { createLogger, format, transports } from 'winston';
import { Datadog } from 'datadog-winston';

const logger = createLogger({
  transports: [
    new Datadog({
      apiKey: process.env.DATADOG_API_KEY,
      service: 'chiri-backend',
      ddsource: 'nodejs',
      ddtags: 'env:production'
    })
  ]
});
```

**Variables en Render:**
```
DATADOG_API_KEY=tu_api_key_aqui
```

### 2. Loggly
```typescript
import { Loggly } from 'winston-loggly-bulk';

const logger = createLogger({
  transports: [
    new Loggly({
      token: process.env.LOGGLY_TOKEN,
      subdomain: process.env.LOGGLY_SUBDOMAIN,
      tags: ['nodejs', 'production'],
      json: true
    })
  ]
});
```

**Variables en Render:**
```
LOGGLY_TOKEN=tu_token_aqui
LOGGLY_SUBDOMAIN=tu_subdomain
```

### 3. Better Stack (Logtail)
```typescript
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);

const logger = createLogger({
  transports: [
    new LogtailTransport(logtail)
  ]
});
```

**Variables en Render:**
```
LOGTAIL_SOURCE_TOKEN=tu_token_aqui
```

## Monitoreo en Render

### Health Checks
Render hace health checks automáticos. Configura un endpoint:

```typescript
// En tu app.ts
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
```

**En Render Dashboard:**
- Settings → Health Check Path: `/health`

### Alertas
Render puede enviar alertas a:
- **Slack**: Notificaciones de deploys y errores
- **Discord**: Webhooks para eventos
- **Email**: Alertas de CPU, memoria, crashes

**Configurar en:** Settings → Notifications

## Mejores Prácticas para Render

### ✅ DO
- Usa `console.log` y `console.error` (Render los captura)
- Envía logs estructurados (JSON) en producción
- Configura LOG_LEVEL=info en producción
- Integra con servicio externo para logs > 7 días
- Usa Health Check endpoint

### ❌ DON'T
- No intentes escribir a archivos (filesystem efímero)
- No uses LOG_LEVEL=debug en producción (mucho ruido)
- No logees información sensible (passwords, tokens)

## Troubleshooting

### No veo logs en Render
1. Verifica que NODE_ENV=production
2. Verifica que tu app esté escribiendo a console
3. Revisa el build log (puede haber fallado el deploy)

### Logs se pierden después de 7 días
- Actualiza a plan Pro (30 días)
- O integra con servicio externo (Datadog, Loggly)

### Necesito buscar logs antiguos
- Exporta logs regularmente desde Render
- O integra con servicio de persistencia (ver arriba)

## Comparación: Local vs Render

| Feature | Local (Winston files) | Render (Dashboard) |
|---------|----------------------|-------------------|
| **Almacenamiento** | Archivos en disco | Captura stdout/stderr |
| **Persistencia** | Hasta que borres | 7 días (Free), 30 días (Pro) |
| **Acceso** | `npm run logs` | Dashboard web o CLI |
| **Formato** | JSON en archivos | JSON en dashboard |
| **Rotación** | 5 archivos × 10MB | Automática por Render |
| **Búsqueda** | PowerShell/jq | Búsqueda web integrada |
| **Exportación** | Copiar archivos | Descargar desde dashboard |

## Ejemplo: Ver Logs de Producción

### Desde Dashboard
```
1. https://dashboard.render.com
2. Click en "chiri-backend"
3. Tab "Logs"
4. Buscar: "Starting new hand"
5. Filtrar: level=error
```

### Desde CLI
```bash
# Ver últimos 100 logs
render logs --service srv-xxxxx --tail 100

# Seguir en tiempo real
render logs --service srv-xxxxx --tail

# Filtrar por error
render logs --service srv-xxxxx --tail | grep error
```

## Integración Recomendada para Producción

Para un proyecto serio, recomiendo:

1. **Render Dashboard**: Para ver logs en tiempo real durante desarrollo/debug
2. **Better Stack (Logtail)**: Gratis hasta 1GB/mes, fácil setup
3. **Datadog**: Si necesitas métricas + logs + APM integrado

## Resumen

✅ **En Render NO necesitas archivos de logs**  
✅ **Render captura automáticamente todo lo que escribes a console**  
✅ **Ve logs en:** https://dashboard.render.com → Tu servicio → Logs  
✅ **Para persistencia larga:** Integra Datadog, Loggly, o Better Stack  
✅ **Los archivos `logs/*.log` son solo para ejecución local**  

