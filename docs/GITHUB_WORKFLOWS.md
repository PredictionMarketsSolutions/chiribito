# GitHub Actions: workflows y recomendaciones

Resumen de los workflows de CI y mejoras aplicadas o sugeridas.

## Workflows actuales

### 1. `test-coverage.yml` — Test y cobertura

- **Trigger:** `push` y `pull_request` en `main` y `develop`.
- **Jobs:**
  - **Backend tests:** Node 18.x y 20.x, `npm ci`, type check, Jest con cobertura, subida a Codecov, comentario en PR con resumen de cobertura (solo desde la matriz 20.x).
  - **Frontend tests:** Node 20.x, Vitest en `frontend/`.
  - **API server tests:** Node 20.x, Jest en `api-server/`.

**Mejoras aplicadas:**

- `concurrency` para cancelar ejecuciones obsoletas al hacer nuevo push.
- Acciones actualizadas: `actions/checkout@v4`, `actions/setup-node@v4`, `codecov/codecov-action@v4`, `actions/github-script@v7`.
- Comentario en PR: se actualiza el comentario existente si ya existe uno del bot, en lugar de crear varios.
- Comentario solo en el job de Node 20.x para evitar duplicados por la matriz.
- Comprobación de existencia de `coverage-summary.json` antes de comentar.
- Reporter `json-summary` añadido en `jest.config.js` para generar `coverage/coverage-summary.json`.
- Eliminado el paso redundante "Check coverage thresholds (GameEngine)" con `continue-on-error: true`.
- Variable de entorno `CI: true` en el workflow.

### 2. `build.yml` — Build y comprobaciones

- **Trigger:** `push` y `pull_request` en `main` y `develop`.
- **Jobs:**
  - **Build:** Node 20.x, `npm ci`, type check, **lint** (`npm run lint`), `build:game` y `build:api`.

**Mejoras aplicadas:**

- `concurrency` y mismas versiones de acciones que en test-coverage.
- Caché de npm con `cache: 'npm'`.
- **ESLint + Prettier** en el proyecto; paso `npm run lint` que falla si hay errores de lint.
- Inclusión de `build:api` para que el build sea completo.

---

## Recomendaciones

### Alta prioridad

1. **Codecov token**  
   Si usas Codecov, configura el secreto `CODECOV_TOKEN` en el repo. El workflow tiene `fail_ci_if_error: false` para no fallar si el token no está definido. Opcionalmente puedes actualizar a `codecov/codecov-action@v5` para usar la versión más reciente.

2. **Branches**  
   Si usas otras ramas base (por ejemplo `master`), añádelas en `on.push.branches` y `on.pull_request.branches` en ambos workflows.

### Media prioridad

3. **Protección de ramas**  
   En *Settings → Branches → Branch protection* para `main`/`develop`:
   - Require status checks: marcar los jobs que consideres obligatorios (p. ej. "Backend tests", "Build", "Frontend tests", "API server tests").
   - Opcional: "Require branches to be up to date before merging".
   - Ver **`docs/BRANCH_PROTECTION.md`** para pasos detallados.

4. **Dependabot**  
   Configurado en `.github/dependabot.yml` para npm (root y frontend) y github-actions. Revisar y fusionar los PRs que abra Dependabot.

### Opcional

6. **Cache de backend**  
   El job "Backend tests" usa solo la caché de npm de `setup-node`. Si el monorepo crece, puedes añadir `actions/cache` para `node_modules` del root (clave basada en `package-lock.json`) de forma similar a frontend y api-server.

7. **Workflow de release**  
   Si versionas con tags o publicas en npm, un workflow que se dispare con `release: published` o con tags `v*` puede ejecutar build, tests y publicar artefactos o paquetes.

8. **Seguridad**  
   Considerar `codeql-analysis.yml` o integraciones como Snyk para escaneo de vulnerabilidades en dependencias.

9. **Notificaciones**  
   Configurar notificaciones de fallos de CI (Slack, email, etc.) según las preferencias del equipo.

---

## Estructura de `.github`

```
.github/
  dependabot.yml       # Actualizaciones de dependencias y GitHub Actions
  workflows/
    build.yml          # Build, type check y lint
    test-coverage.yml  # Tests backend, frontend, API y cobertura
```

No hay workflows adicionales (p. ej. deploy o release) en este documento; se pueden añadir cuando se definan los entornos y la estrategia de despliegue.
