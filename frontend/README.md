# Frontend - Poker Game Client

Vite + Pixi.js real-time poker client with WebSocket connection, RTT metrics, and action buffering.

## Architecture

```
frontend/
├── public/
│   └── cards/              # Card sprite assets
├── src/
│   ├── main.ts            # Main client logic & WebSocket connection
│   ├── style.css          # Dark theme with connection indicator animations
│   └── vite-env.d.ts      # Type definitions
├── index.html             # Game UI layout
├── vite.config.ts         # Vite bundler config
├── tsconfig.json          # TypeScript config
└── package.json
```

## Environment Setup

### Site configuration to create `.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:2567
```

For Render deployment:
```env
VITE_API_URL=https://api-service.onrender.com
VITE_WS_URL=wss://colyseus-service.onrender.com
```

Copy [.env.example](.env.example) to `.env`:
```bash
cp .env.example .env
```

## Setup

### First-time Installation

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Running

### Development

```bash
npm run dev
```

Output:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Production Build

```bash
npm run build

# Output: dist/ folder ready for deployment
```

### Preview Build

```bash
npm run build
npm run preview
```

## UI Components

### Status Panel (Left Sidebar)
Real-time display of:
- 🟢 **Conexión** - Visual indicator + RTT
- **Latencia** - Current round-trip time (ms)
- **Calidad** - excellent/good/degraded/poor
- **Buffer** - Pending actions count
- **API/WS** - Server URLs
- **Token** - Auth status
- **Room** - Connected room ID
- **Phase** - Game phase (waiting, preflop, flop, etc)
- **Pot/Bet** - Current stakes
- **Hand** - Your hole cards
- **Ganadores** - Winners of last round

### Game Canvas (Center)
- Dark felt table (rounded corners)
- Animated card dealing
- Player seats (up to 6)
- Chip stacks per player
- Dealer button indicator

### Controls Panel (Right Sidebar)
Game action buttons:
- **Start Game** - Initialize new hand (dealer only)
- **Check/Call/Fold** - Standard poker actions
- **Bet/Raise** - Wager chips

Plus:
- Bet amount input
- Game logs/messages
- Error displays

## Connection Monitoring

### Real-time Metrics

**RTT (Round-Trip Time)**
- Measures latency via heartbeat ACKs
- Samples last 20 measurements
- Moving average displayed

**Connection Quality**
```
excellent = RTT < 100ms  (🟢 Green)
good      = RTT < 300ms  (🟢 Light green)
degraded  = RTT < 1000ms (🟡 Yellow)
poor      = RTT > 1000ms (🔴 Red)
```

**Action Buffering**
- Queues actions during disconnects
- Max 50 buffered actions
- Replays on reconnect
- Shows buffer count in status

### Connection States

```
Disconnected (🔴 Red dot)
  ↓ (user joins)
Connecting (🟡 Yellow dot, pulsing 1.5s)
  ↓ (join succeeds)
Connected (🟢 Green dot, pulsing 2s)
  ↓ (network issue)
Disconnected (retry with exponential backoff)
```

### Reconnection Strategy

- 1s wait → attempt 1
- 2s wait → attempt 2
- 4s wait → attempt 3
- 8s wait → attempt 4
- ...doubling each time
- Max 10 attempts (total ~17 minutes)
- Auto-replace session if already logged in elsewhere

## Game Features

### Player Authentication
1. **Register** - Create new account (username, email, password)
2. **Login** - Sign in with email/password
3. **Join Table** - Connect to poker room

### Poker Gameplay
- **Blinds** - Small blind / Big blind positions
- **Betting Rounds** - Preflop, Flop, Turn, River
- **Hand Ranking** - Standard Texas Hold'em
- **Action History** - Per-player actions logged
- **Winner Calculation** - Automatic best hand evaluation

### Real-time Sync
- State changes broadcast to all players
- Card animations synchronized
- Turn timer countdown visible
- Pot/chip counts update live

## API Calls

### Authentication

**Register**
```typescript
POST ${API_URL}/api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Login**
```typescript
POST ${API_URL}/api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

Response contains JWT token stored in `localStorage`.

### Token Validation

Colyseus server validates token:
```
POST ${API_URL}/api/auth/validate
Headers: Authorization: Bearer ${token}
```

- Called on join
- 3 retry attempts with exponential backoff
- 8-second timeout per attempt

## WebSocket Messages

### Client → Server

**Join Room Action**
```typescript
room.joinOrCreate("my_room", {
  auth: { token },     // JWT token
  name: username,      // Display name
  forceReplace: false  // Force if already joined
})
```

**Game Actions**
```typescript
room.send("startGame");      // Start new hand
room.send("check");          // Check (bet 0)
room.send("call", amount);   // Match bet
room.send("fold");           // Fold hand
room.send("bet", amount);    // Open bet
room.send("raise", amount);  // Re-raise
room.send("heartbeat", Date.now()); // Keep-alive ping
```

### Server → Client

**State Changes**
```typescript
room.onStateChange((state) => {
  // Game state updated (players, cards, pot, etc)
})
```

**Messages**
```typescript
room.onMessage("heartbeat_ack", () => {
  // Server acknowledged heartbeat (RTT calculated)
})

room.onMessage("playerJoined", (payload) => {
  // New player joined the table
})

room.onMessage("bettingRoundStarted", (payload) => {
  // Betting round begun
})

room.onMessage("turnTimer", (payload) => {
  // Your turn, timer started
})

room.onMessage("roundEnded", (payload) => {
  // Round complete, winner determined
})
```

## Development

### TypeScript Compilation

```bash
# From root directory
npm run build:game

# Or from frontend
npm run build
```

### Hot Reload

All changes auto-reload during `npm run dev`:
- `.ts` files → TypeScript recompiled
- `.css` files → Live CSS injection
- `.html` changes → Page reloaded

### Debugging

**Browser Console (F12 → Console)**
- All logs prefixed with timestamp
- Connection state changes logged
- Error/warning messages displayed

**Browser Network Tab (F12 → Network)**
- WebSocket connection visible
- Message payloads inspectable
- RTT metrics shown in timestamps

**Local Storage**
```javascript
// In console:
localStorage.getItem('jwt_token')  // Current JWT
localStorage.removeItem('jwt_token') // Clear auth
```

## Testing

### Manual Test: Connection Quality

1. Open DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Observe:
   - Indicator turns yellow (connecting)
   - RTT increases > 500ms
   - Status shows "degraded"
   - Server auto-reconnects

4. Go offline:
   - Click action (bet/fold)
   - Shows "buffered (1/50)"
   - Go back online
   - Action replays automatically

### Manual Test: Rate Limiting

1. Click "Bet" button 5 times rapidly
2. First succeeds, others show "on cooldown"
3. Wait 200ms
4. Next bet succeeds

### E2E Test Script

```bash
# From root
npm run login-and-join

# Outputs:
# ✓ Register successful
# ✓ JWT acquired
# ✓ Joined room
# ✓ Connected listening to messages
```

## Performance

**Build Size:**
- CSS: 11.28 kB (optimized)
- JS: ~200 kB (Pixi.js included)
- Gzipped: ~60 kB total

**Runtime:**
- Initial load: ~2s
- WebSocket connect: ~50-100ms
- Action response: <200ms

**Memory:**
- ~50MB with Pixi canvas
- 1MB localStorage
- 5MB browser cache

## Troubleshooting

### WebSocket Connection Failed
1. Check `VITE_WS_URL` in `.env`
2. Ensure Colyseus server running (`npm run dev` in root)
3. Browser console shows: `CONNECTING → CONNECTED` (green dot)

### "Invalid Token" Error
1. Clear localStorage: `localStorage.clear()`
2. Register/login again
3. Token expires after 7 days (in JWT payload)

### High RTT (>1000ms)
Normal - app handles gracefully:
- Indicator turns red
- UI shows "degraded"
- Server auto-reconnects
- App fully responsive

### Actions Not Executing
1. Check green indicator (must be connected)
2. Check buffer not full (max 50)
3. Check server logs for rate limiting
4. Try different action after 200ms

### Card Images Not Loading
1. Check `public/cards/` folder exists
2. Ensure image filenames correct
3. Check browser console for 404 errors
4. Verify Vite serves public/ correctly

## Related Documentation

- **[Main README](../README.md)** - Project overview
- **[SECURITY.md](../SECURITY.md)** - Security practices
- **[SOCKET_IMPROVEMENTS.md](../SOCKET_IMPROVEMENTS.md)** - Connection architecture
- **[IMPROVEMENTS_CHANGELOG.md](../IMPROVEMENTS_CHANGELOG.md)** - Feature updates


Open `http://localhost:5173`.

## Basic flow

1) Register or Login
2) Join Table
3) Use action buttons (start game, bet, raise, call, check, fold)

## Troubleshooting

- If you get `EADDRINUSE` on 3000 or 2567, check which process is using the port.
- If join fails, ensure the API and Colyseus servers are running.
