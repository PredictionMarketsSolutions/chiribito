# Chiri Backend - Poker Game Server

Production-ready WebSocket-based poker game with real-time connections, comprehensive security, and advanced networking features.

## 📊 Project Status

### ✅ Current Version: 0.16.0

**Latest Updates (Feb 2026):**
- ✅ Socket connection reliability system (heartbeat monitoring, exponential backoff)
- ✅ Real-time RTT metrics and connection quality tracking
- ✅ Action buffering for offline resilience  
- ✅ Rate limiting (anti-spam protection)
- ✅ Server-side analytics and monitoring
- ✅ Mobile background handling
- ✅ Password hashing with bcryptjs
- ✅ SSL/TLS validation
- ✅ Protected admin routes (/colyseus, /playground)
- ✅ Comprehensive security documentation

**Build Status:** ✅ All components compile without errors

### Repository Structure

```
Chiri-backend/
├── src/                          # Colyseus game server
│   ├── rooms/
│   │   ├── MyRoom.ts            # Main game room with socket monitoring
│   │   └── game/                # Game logic (actions, state management)
│   ├── config/
│   │   └── auth.ts              # JWT + bcryptjs password hashing
│   └── app.config.ts            # Server config with protected routes
├── api-server/                   # Express.js API server
│   └── src/
│       ├── index.ts             # API endpoints (auth, validation)
│       └── config/database.ts   # PostgreSQL connection
├── frontend/                     # Pixi.js test client
│   └── src/
│       ├── main.ts              # Socket connection + UI logic
│       └── style.css            # Dark theme with animations
├── scripts/                      # Testing & utilities
│   └── login-and-join.ts        # E2E test script
├── SECURITY.md                   # Security policy & best practices
├── SOCKET_IMPROVEMENTS.md        # Socket architecture documentation
└── IMPROVEMENTS_CHANGELOG.md     # Recent feature updates
```

## 📋 Documentation Map

| Document | Purpose | Audience |
|----------|---------|----------|
| **[SOCKET_IMPROVEMENTS.md](SOCKET_IMPROVEMENTS.md)** | Heartbeat, reconnection, RTT metrics | Architects, DevOps |
| **[IMPROVEMENTS_CHANGELOG.md](IMPROVEMENTS_CHANGELOG.md)** | Feature summary (buffering, rate limiting, etc) | Dev Team |
| **[SECURITY.md](SECURITY.md)** | Security practices & vulnerability fixes | Security, DevOps |
| **[api-server/README.md](api-server/README.md)** | API endpoints documentation | Backend devs |
| **[frontend/README.md](frontend/README.md)** | Frontend setup & testing | Frontend devs |

This repo contains:

- **Colyseus game server** (port 2567) - WebSocket game logic with bidirectional heartbeat
- **API server (Express + Postgres)** (port 3000) - Auth, token validation, user management
- **Pixi.js test frontend** (port 5173) - Real-time game visualization

## Prerequisites

- Node.js 18+ (for built-in `fetch`)
- Postgres running locally

Optional:
- pgAdmin or psql for database management

## Environment files

### Root `.env` (Colyseus) - SECURITY CRITICAL

```env
PORT=2567
JWT_SECRET=use-a-strong-random-secret-here-min-32-chars
NODE_ENV=development
MONITOR_PASSWORD=your-secure-monitor-password
API_URL=http://localhost:3000
```

⚠️ **Security Notes:**
- `JWT_SECRET` must be at least 32 random characters  
- `MONITOR_PASSWORD` protects `/colyseus` and `/playground` admin routes
- Never commit `.env` with real secrets
- See [.env.example](.env.example) for template

### `api-server/.env` (API) - SECURITY CRITICAL

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=use-a-strong-password
DB_DATABASE=PokerBase
DB_SSL=false
JWT_SECRET=use-a-strong-random-secret-here-min-32-chars
NODE_ENV=development
BCRYPT_ROUNDS=10
```

⚠️ **Security Notes:**
- `DB_PASSWORD` must be strong (16+ chars in production)
- `JWT_SECRET` must match root `.env`
- Set `DB_SSL=true` with proper certificates in production
- See [api-server/.env.example](api-server/.env.example) for template

### `frontend/.env` (Frontend)

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:2567
```

See [frontend/.env.example](frontend/.env.example) for template

### First-time local DB setup

Create the database (one time):

```bash
psql -U postgres
CREATE DATABASE "PokerBase";
\q
```

Run migrations:

```bash
cd api-server
npm run migration:run -- -d src/config/database.ts
```

## Start locally

Open **three terminals**:

### 1️⃣ API server

```bash
cd api-server
npm run dev
```

Output:
```
Database connected successfully
Server is running on http://localhost:3000
```

### 2️⃣ Colyseus server

```bash
npm run dev
```

Output:
```
[xxxx] Listen on ws://localhost:2567
```

### 3️⃣ Frontend (Pixi test client)

```bash
cd frontend
npm install
npm run dev
```

Output:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

## 🧪 Testing

### Manual Testing - Quick Start

1. **Open** `http://localhost:5173` in browser
2. **Register** new account or login
3. **Join Table** - you should see:
   - 🟢 Green connection indicator = connected
   - RTT displayed (should be <100ms locally)
   - "Ready" status showing

### Connection Quality Tests

**Test 1: Normal Connection**
```
Expected: Green indicator, RTT < 100ms, "excellent"
```

**Test 2: Throttle Network (DevTools - Slow 3G)**
- Open DevTools → Network → Slow 3G
- Expected: Yellow indicator, RTT > 500ms, "degraded"
- Server should reconnect after 30s

**Test 3: Offline Simulation**
- DevTools → Network → Offline
- Click action (bet/fold/raise)
- Expected: Shows "buffered (1/50)"
- Go back online
- Expected: Action replays automatically ✓

**Test 4: Rate Limiting**
- Click "Bet" button 5 times rapidly
- Expected: First works, others show "on cooldown (XXms)"
- Wait 200ms
- Expected: Next bet works

### Automated E2E Test

```bash
# Set environment variables
$env:TEST_USERNAME="testuser"
$env:TEST_EMAIL="test@example.com"
$env:TEST_PASSWORD="testpass123"

# Run test
npm run login-and-join

# Expected output:
# ✓ Register/Login successful
# ✓ JWT acquired
# ✓ Joined room successfully
# ✓ Received join confirmation
```

### Load Testing

```bash
# Simulate 99 concurrent clients
npm run loadtest

# This will:
# - Create 99 WebSocket connections
# - Show connection stats
# - Report any errors
```

## 📊 Logs & Monitoring

### Server-Side Logs

**Colyseus Console (Terminal 2):**
```
[HEARTBEAT] Client ... unresponsive (95000ms without heartbeat)
[HEARTBEAT] Forcing disconnect for unresponsive client ...
[ANALYTICS] Room: abc123 | Players: 6 | Avg RTT: 45ms | Min: 23ms | Max: 102ms
[ANALYTICS SUMMARY] Room abc123:
  Total connections: 6
  Average RTT: 45ms
  Total joins: 7
```

**API Server Console (Terminal 1):**
```
Database connected successfully
POST /api/auth/register - 200
POST /api/auth/login - 200
POST /api/auth/validate - 200
```

### Client-Side Logs

**Browser Console (F12 → Console):**
```
[🟡] Connection: connecting
[↓] Joined room: room-123
[🟢] Connection: connected
✓ Replayed 2 buffered actions...
⚠️ Connection degraded: 1234ms RTT (poor)
```

### Connection Status Panel

Located on left sidebar, shows real-time:
- 🟢 **Conexión** - Visual indicator (green/yellow/red)
- **Latencia** - Current RTT in milliseconds
- **Calidad** - excellent/good/degraded/poor
- **Buffer** - number of buffered actions pending

## 🔧 Endpoints

### Game Server
- **Main:** `ws://localhost:2567`
- **Playground:** `http://localhost:2567/playground` (interactive test)
- **Monitor:** `http://localhost:2567/colyseus` (admin dashboard)
  - Requires: `MONITOR_PASSWORD` header

### API Server
- **Auth Register:** `POST http://localhost:3000/api/auth/register`
- **Auth Login:** `POST http://localhost:3000/api/auth/login`
- **Token Validate:** `POST http://localhost:3000/api/auth/validate`
- **Health:** `GET http://localhost:3000/health`

### Headers (Protected Routes)
```
Authorization: Bearer <JWT_TOKEN>
```

## 🚀 Build & Deploy

### Local Build

```bash
# Build everything
npm run build

# Output:
# ✓ frontend compiled (11.28 kB CSS)
# ✓ api-server compiled
# ✓ colyseus server ready
```

### Verify Build

```bash
# Check for TypeScript errors
npm run build:game && npm run build:api

# Start from dist
npm run build:start
```

### Render Deployment

1. **API Server** (web service)
   ```
   Build: npm install && npm run build
   Start: npm run start:api
   ```

2. **Colyseus** (web service)
   ```
   Build: npm install && npm run build:game
   Start: npm start
   ```

3. **Frontend** (static site)
   ```
   Build: npm install && npm run build:game
   Publish: frontend/dist
   Environment:
     VITE_API_URL=https://api.example.com
     VITE_WS_URL=wss://colyseus.example.com
   ```

## ⚠️ Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `EADDRINUSE` | Port already in use | Kill process or change `PORT` in `.env` |
| `ECONNREFUSED` | Server not running | Start all 3 terminals |
| `Postgres error` | DB not running | `brew services start postgresql` or start Postgres service |
| `JWT_SECRET mismatch` | Different secrets in root/.env vs api-server/.env | Use same value in both |
| `"not joined" on action` | Frontend not connected yet | Check connection indicator, wait for green dot |
| `High RTT (> 1000ms)` | Network degraded | This is normal - app will reconnect automatically |
| `"Max reconnection attempts"` | Too many reconnects | Check API_URL/WS_URL are correct, restart server |

## 🔐 Security Features

✅ **Authentication**
- JWT tokens (RS256 signing)
- Token validation with exponential backoff
- Session replacement detection

✅ **Data Protection**
- Passwords hashed with bcryptjs (12 rounds prod, 10 dev)
- SSL/TLS validation in production
- Protected admin routes (/colyseus, /playground)

✅ **Rate Limiting**
- 200ms cooldown per action type
- Client-side + server-side validation
- Protection against spam/DoS

✅ **Monitoring**
- Server-side RTT metrics
- Connection analytics per player
- Heartbeat timeout detection (90s)

See [SECURITY.md](SECURITY.md) for complete security documentation.

## 📈 Performance Metrics

**Connection Health:**
- Heartbeat interval: 30s (server), 25s (client)
- RTT alert threshold: >1000ms (degraded)
- Reconnection backoff: 1s → 512s (10 attempts)

**Action Processing:**
- Rate limit: 200ms per action
- Action buffer: max 50 pending
- State sync: Colyseus automatic

**Infrastructure:**
- Max clients per room: 6 (configurable)
- Memory per client: ~50KB
- Typical RTT (local): 10-50ms

