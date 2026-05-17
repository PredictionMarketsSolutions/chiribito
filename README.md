# Chiribito

> A revival of Spanish synthetic poker — from the underground card rooms of Madrid to your screen.
>
> Revival del **póker sintético español** — de las timbas del Madrid clandestino a tu pantalla.

[![Status](https://img.shields.io/badge/status-work%20in%20progress-orange?style=flat-square)](#status)
[![Node](https://img.shields.io/badge/node-20%20LTS-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-strict-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-UNLICENSED-lightgrey?style=flat-square)](#license)

---

## 🇬🇧 English

**Chiribito** is an online multiplayer card game that rescues a poker variant born in Madrid in the 1950s and played in the back rooms of the **Círculo de Bellas Artes**, the **Tiro de Pichón de Somontes** and dozens of clandestine card rooms until it was eventually buried by Texas Hold'em around the year 2000.

This project is a social, casual, web-based revival of that game — built with care, with personality, and with a working multiplayer engine. **It is not** a Texas Hold'em clone, **it is not** a real-money gambling site, and **it has no intention of competing with PokerStars**. It is its own thing.

> The Spanish term *chiribito* also means *spark* in old Madrid slang. Fitting.

### The game in 60 seconds

- **Deck**: 28 cards, Spanish suits (**Oros**, **Copas**, **Espadas**, **Bastos**), ranks `5–6–7–Sota–Caballo–Rey–As`. Equivalent to `8–9–10–J–Q–K–A` in the French deck.
- **Hand**: 2 hole cards dealt right-to-left, 5 community cards revealed **one at a time** with a betting round between each → **6 betting rounds total**.
- **Must use both hole cards** to form your hand.
- **No blinds.** No-Limit. All-in at any moment.
- **Colour beats Full House** (yes, on purpose).
- **The Perla** (`Sota + 7`, same suit — `J/10s` in the French deck) is the strongest hand — the only one that completes every possible straight.

### Status

| Component | State |
|---|---|
| Game engine (Colyseus, server-authoritative) | ✅ working — bet/raise/call/fold/all-in/sidepots covered by tests |
| Hand evaluator | ✅ working — Colour > Full, Perla detection, 7-card best hand |
| Auth + user accounts (Express + PostgreSQL) | ✅ working — JWT + refresh tokens + password reset |
| Canonical Chiribito deck (5-6-7-Sota-Caballo-Rey-As) + correct Perla | ✅ Sprint 1.4 — glossary in `src/rooms/game/glossary.ts` is source of truth |
| Real Chiribito betting rounds (6 streets, one card at a time) | ⏳ Phase 2 — engine still uses heredado 4-street flow |
| Identity rename (`ChiribitoRoom`, `MesaState`, room id `mesa`) | ✅ Sprint 1.4 |
| Card assets at sane sizes | ✅ Sprint 1.5 — 28 cards re-encoded to ~95 KB each (folder went 57 MB → 2.9 MB, −95%) |
| Production deploy | ⚪ not active — Render targets exist, secrets pending rotation |

We do not claim "production ready". Anything that says so somewhere else in this repo is a leftover and you can ignore it.

### Tech stack

```
Game server      Colyseus 0.17 + TypeScript on Node 20
API server       Express 4 + TypeORM + PostgreSQL + Redis (ioredis)
Frontend         Vite + PixiJS 7 + GSAP
Auth             JWT (jsonwebtoken) + bcryptjs + Resend (transactional email)
Hosting          Render.com (3 services: chiri-colyseus, chiri-api, chiri-frontend)
CI               GitHub Actions (build, lint, jest, vitest) + Dependabot
```

### Quick start (local development)

Requirements: Node 20, npm 10, PostgreSQL 14+, Redis (optional in dev).

```bash
# 1. Install
npm install
cd api-server && npm install && cd ..
cd frontend  && npm install && cd ..

# 2. Configure
cp .env.example .env
cp api-server/.env.example api-server/.env
cp frontend/.env.example  frontend/.env
# Fill in JWT_SECRET, DB_*, RESEND_API_KEY etc.

# 3. Initialise the database
cd api-server && npm run init-db && npm run migration:run && cd ..

# 4. Run the three services in separate terminals
npm run dev:api       # API server   :3000
npm run dev           # Game server  :2567
cd frontend && npm run dev   # Frontend :5173
```

### Repository layout

```
chiri-app/
├── src/                    Game server (Colyseus)
│   ├── rooms/              ChiribitoRoom + GameEngine + 8 managers
│   ├── security/           Real, used security primitives only
│   ├── services/           Server-to-server (game → api)
│   └── config/             env, auth, logger
├── api-server/             Auth & user REST API (Express + TypeORM)
├── frontend/               Vite + PixiJS client
├── docs/                   ARCHITECTURE.md, CI.md
├── scripts/                One-off scripts (sidepot fuzz, etc.)
└── .github/workflows/      build.yml + test-coverage.yml
```

### Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). One paragraph: three services (game, API, frontend) talking over WebSocket and HTTP. The game server is the source of truth for the deck and the cards, the API server is the source of truth for users and stats, and the frontend is just a renderer. Nothing important is trusted to the client.

### Security posture (honest version)

- JWT signing secrets and Colyseus monitor credentials are required in production. The server refuses to boot without them — no insecure fallback.
- The deck is shuffled with `crypto.randomInt` (Fisher–Yates) and is **never** sent to clients.
- The Colyseus monitor (`/colyseus`) is gated behind basic-auth in production; the playground (`/playground`) is fully disabled there.
- A CI guard fails any pull request that commits a real `.env` file.
- 0 critical / 0 high / 0 moderate npm advisories. Remaining low-severity advisories live in dev-only chains (Colyseus playground) and are accepted because the playground is never exposed in production.

### Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md). Short version: branch per sprint, commit semantically, build + lint + tests green before push, no `Co-Authored-By` machine signatures.

### License

`UNLICENSED` — private project. If you want to use any of this, ask first.

---

## 🇪🇸 Español

**Chiribito** es un juego de cartas multijugador online que rescata una variante de póker nacida en Madrid en los años 50 y jugada en los reservados del **Círculo de Bellas Artes**, el **Tiro de Pichón de Somontes** y decenas de garitos clandestinos hasta que el Texas Hold'em la enterró hacia el año 2000.

Este proyecto es un revival social, casual y web de aquel juego — hecho con cariño, con personalidad, y con un motor multijugador que funciona. **No es** un clon de Texas Hold'em, **no es** una sala de apuestas reales, y **no pretende competir con PokerStars**. Es su propia cosa.

> En la jerga madrileña antigua, *chiribito* también significa *chispa*. Le va bien.

### El juego en 60 segundos

- **Baraja**: 28 cartas, baraja española (**Oros**, **Copas**, **Espadas**, **Bastos**), rangos `5–6–7–Sota–Caballo–Rey–As`. Equivalencia francesa: `8–9–10–J–Q–K–A`.
- **Mano**: 2 cartas tapadas repartidas de derecha a izquierda, 5 comunitarias reveladas **una por una** con ronda de apuesta entre cada una → **6 rondas de apuestas**.
- **Obligatorio usar las dos cartas** de la mano.
- **No hay ciegas.** No-Limit. *Envidarse* (ir al all-in) en cualquier momento.
- **Color gana a Full** (sí, así).
- **La Perla** (`Sota + 7` del mismo palo — `J + 10` en baraja francesa) es la mejor mano: la única que liga todas las escaleras posibles.

### Estado real

| Componente | Estado |
|---|---|
| Motor de juego (Colyseus, lógica en servidor) | ✅ funciona — apuesta/subida/igualar/pasar/envido/sidepots cubiertos con tests |
| Evaluador de manos | ✅ funciona — Color > Full, detección de Perla, mejor mano de 7 cartas |
| Auth + cuentas (Express + PostgreSQL) | ✅ funciona — JWT + refresh tokens + reset de contraseña |
| Baraja canónica del Chiribito (5-6-7-Sota-Caballo-Rey-As) + Perla correcta | ✅ Sprint 1.4 — el glosario en `src/rooms/game/glossary.ts` es la fuente de verdad |
| Rondas reales del Chiribito (6 calles, una carta a la vez) | ⏳ Fase 2 — el motor sigue con las 4 calles del repo heredado |
| Renombrado a identidad propia (`ChiribitoRoom`, `MesaState`, sala `mesa`) | ✅ Sprint 1.4 |
| Assets de cartas en tamaños decentes | ✅ Sprint 1.5 — 28 cartas re-encodeadas a ~95 KB cada una (carpeta de 57 MB → 2.9 MB, −95%) |
| Deploy de producción | ⚪ inactivo — los servicios Render existen pero los secretos están pendientes de rotación |

No decimos "production ready". Si algún rincón del repo lo dice, es restos del proyecto heredado y se va a limpiar.

### Stack técnico

```
Servidor de juego   Colyseus 0.17 + TypeScript sobre Node 20
Servidor API        Express 4 + TypeORM + PostgreSQL + Redis (ioredis)
Frontend            Vite + PixiJS 7 + GSAP
Auth                JWT (jsonwebtoken) + bcryptjs + Resend (email transaccional)
Hosting             Render.com (3 servicios: chiri-colyseus, chiri-api, chiri-frontend)
CI                  GitHub Actions (build, lint, jest, vitest) + Dependabot
```

### Arranque rápido (desarrollo local)

Requisitos: Node 20, npm 10, PostgreSQL 14+, Redis (opcional en dev).

```bash
# 1. Instalar
npm install
cd api-server && npm install && cd ..
cd frontend  && npm install && cd ..

# 2. Configurar
cp .env.example .env
cp api-server/.env.example api-server/.env
cp frontend/.env.example  frontend/.env
# Rellena JWT_SECRET, DB_*, RESEND_API_KEY, etc.

# 3. Inicializar la base de datos
cd api-server && npm run init-db && npm run migration:run && cd ..

# 4. Lanzar los tres servicios en terminales separadas
npm run dev:api       # API server   :3000
npm run dev           # Game server  :2567
cd frontend && npm run dev   # Frontend :5173
```

### Estructura del repo

```
chiri-app/
├── src/                    Servidor de juego (Colyseus)
│   ├── rooms/              ChiribitoRoom + GameEngine + 8 managers
│   ├── security/           Primitivas de seguridad reales y usadas
│   ├── services/           Servidor a servidor (game → api)
│   └── config/             env, auth, logger
├── api-server/             API REST de auth y usuarios (Express + TypeORM)
├── frontend/               Cliente Vite + PixiJS
├── docs/                   ARCHITECTURE.md, CI.md
├── scripts/                Scripts puntuales (fuzz de sidepots, etc.)
└── .github/workflows/      build.yml + test-coverage.yml
```

### Arquitectura

Léete [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Un párrafo: tres servicios (game, API, frontend) hablando por WebSocket y HTTP. El servidor de juego es la única fuente de verdad para la baraja y las cartas, el servidor API lo es para usuarios y estadísticas, y el frontend es un renderer. Nada importante se delega al cliente.

### Postura de seguridad (versión honesta)

- Los secretos de firma JWT y las credenciales del monitor Colyseus son obligatorios en producción. El servidor se niega a arrancar sin ellos — no hay fallback inseguro.
- La baraja se baraja con `crypto.randomInt` (Fisher–Yates) y **nunca** se envía al cliente.
- El monitor Colyseus (`/colyseus`) está protegido con basic-auth en producción; el playground (`/playground`) está completamente desactivado allí.
- Un check de CI hace fallar cualquier pull request que intente commitear un `.env` real.
- 0 vulnerabilidades npm críticas / 0 high / 0 moderate. Las low restantes son del chain del playground de Colyseus (dev-only) y están aceptadas porque el playground no se expone en producción.

### Contribuir

Lee [`CONTRIBUTING.md`](CONTRIBUTING.md). Resumen: branch por sprint, commits semánticos, build + lint + tests en verde antes del push, sin firmas `Co-Authored-By` de máquina.

### Licencia

`UNLICENSED` — proyecto privado. Si quieres usar algo, pregunta primero.

---

## Glosario / Glossary

| Castellano | English equivalent | Nota |
|---|---|---|
| **Chiribito** | (proper name) | Variante española de póker; también *chispa* en jerga antigua |
| **Perla** | The Pearl | `Sota + 7` mismo palo · `J + 10s` (J/Ts) en baraja francesa. Mejor mano. |
| **Oros / Copas / Espadas / Bastos** | Coins / Cups / Swords / Clubs | Los 4 palos de la baraja española |
| **As** | Ace | Rango `1` en la baraja |
| **Sota / Caballo / Rey** | Jack / Queen / King | Cartas figura (`10`, `11`, `12`) |
| **Timba** | High-stakes card game | Partida fuerte, frecuentemente clandestina |
| **Garito** | Clandestine card room | Sala donde se jugaba al margen de la ley |
| **Envidarse** | Go all-in | "Ir con todo lo que tienes" en pleno juego |
| **Tomar la alternativa** | Earn one's stripes | Pasar a jugar en mesas de jugadores grandes |

---

*Última actualización · Last updated: 2026-05-17 · Sprint 1.2 · HEAD `main`*
