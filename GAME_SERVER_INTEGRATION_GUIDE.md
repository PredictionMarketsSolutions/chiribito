# Game Server Security Integration Guide

## Overview
This guide explains how to integrate the 5 game server security modules into the Colyseus game server (MyRoom.ts).

**Security Modules:**
1. **game-auth.ts** - JWT authentication and session management
2. **anti-cheat.ts** - Cheat detection (4 types)
3. **game-validation.ts** - Poker rules validation and state consistency
4. **game-audit.ts** - Comprehensive audit logging
5. **game-action-rate-limit.ts** - Rate limiting for game actions

---

## Integration Steps

### Step 1: Import All Security Modules in MyRoom.ts

```typescript
import {
  // Authentication
  verifyPlayerToken,
  ColyseusTokenManager,
  type PlayerJWTPayload,
  
  // Anti-Cheat
  detectSuspiciousAction,
  detectStateManipulation,
  detectCollusion,
  detectNetworkAnomaly,
  
  // Validation
  validatePokerAction,
  validatePlayerTurn,
  validateGameStateConsistency,
  
  // Audit
  gameAuditLog,
  auditPlayerAction,
  auditInvalidAction,
  auditCheatDetection,
  auditPlayerJoin,
  
  // Rate Limiting
  gameActionRateLimiter,
  checkAndRecordAction,
} from '../security/game-security-index';
```

### Step 2: Integrate JWT Authentication in onJoin Handler

**Location:** MyRoom.ts, `onJoin()` method (around line 100-110)

Replace the current onJoin implementation with:

```typescript
async onJoin(client: Client<any>, options: any) {
  try {
    // Extract and verify JWT token from client options
    const token = options?.token || options?.auth?.token;
    
    if (!token) {
      logger.warn(`[AUTH] Player ${client.id} attempted to join without token`);
      throw new Error('Authentication token required');
    }

    // Verify token using game auth module
    const playerPayload = await verifyPlayerToken(token);
    
    if (!playerPayload) {
      logger.error(`[AUTH] Invalid token for player ${client.id}`);
      throw new Error('Invalid authentication token');
    }

    // Store player info (will be used throughout the game)
    const playerData = {
      clientId: client.id,
      playerId: playerPayload.userId,
      username: playerPayload.username,
      joinedAt: Date.now(),
    };

    // Register session with token manager (handles timeouts, invalidation)
    ColyseusTokenManager.registerSession(client.id, {
      playerId: playerPayload.userId,
      clientId: client.id,
      token: token,
      joinedAt: Date.now(),
      lastHeartbeat: Date.now(),
    });

    // Audit log: player join
    auditPlayerJoin(this.roomId, playerPayload.userId, {
      username: playerPayload.username,
      clientId: client.id,
    });

    logger.info(
      `[GAME] Player ${playerPayload.username} (${playerPayload.userId}) joined room ${this.roomId}`
    );

    return playerData;
  } catch (error) {
    logger.error(`[AUTH_ERROR] Join failed for ${client.id}: ${error.message}`);
    throw error; // Reject connection
  }
}
```

### Step 3: Integrate Validation in Action Handler

**Location:** MyRoom.ts, in the action handler (where game actions are processed)

Example for a generic action handler:

```typescript
onMessage(client: Client, message: any) {
  try {
    const { action, amount, roomId } = message;
    
    // Get player ID from stored session
    const sessionData = ColyseusTokenManager.validateSession(client.id);
    if (!sessionData) {
      logger.warn(`[SECURITY] Invalid session for client ${client.id}`);
      return;
    }

    const playerId = sessionData.playerId;

    // Step 1: Check rate limiting
    const rateLimitCheck = checkAndRecordAction(playerId, action);
    if (!rateLimitCheck.allowed) {
      logger.warn(`[RATE_LIMIT] ${playerId}: ${rateLimitCheck.reason}`);
      auditInvalidAction(roomId, playerId, action, `Rate limit: ${rateLimitCheck.reason}`);
      client.send('error', {
        code: 'RATE_LIMITED',
        message: rateLimitCheck.reason,
      });
      return;
    }

    // Step 2: Validate game state and turn
    const validationResult = validatePlayerTurn(
      this.state,
      playerId,
      this.currentPhase
    );
    if (!validationResult.isValid) {
      logger.warn(`[VALIDATION] ${playerId}: ${validationResult.error}`);
      auditInvalidAction(roomId, playerId, action, validationResult.error);
      client.send('error', {
        code: 'INVALID_TURN',
        message: validationResult.error,
      });
      return;
    }

    // Step 3: Validate the specific action
    const actionValidation = validatePokerAction(
      this.state,
      playerId,
      action,
      amount
    );
    if (!actionValidation.isValid) {
      logger.warn(`[ACTION] ${playerId}: ${actionValidation.error}`);
      auditInvalidAction(roomId, playerId, action, actionValidation.error);
      client.send('error', {
        code: 'INVALID_ACTION',
        message: actionValidation.error,
      });
      return;
    }

    // Step 4: Detect anti-cheat violations
    const cheatCheck = detectSuspiciousAction(
      playerId,
      action,
      amount,
      this.lastActionTimestamp[playerId],
      this.actionCountPerSecond[playerId]
    );
    
    if (cheatCheck.suspicious) {
      auditCheatDetection(
        roomId,
        playerId,
        cheatCheck.type,
        cheatCheck.severity,
        cheatCheck.details
      );

      if (cheatCheck.severity === 'critical') {
        logger.error(`[CHEAT] Critical violation by ${playerId}: ${cheatCheck.type}`);
        client.close(1008, 'Cheating detected');
        return;
      }

      logger.warn(`[CHEAT] ${cheatCheck.severity} violation by ${playerId}`);
    }

    // Step 5: Execute the action
    this.executeAction(playerId, action, amount);

    // Step 6: Validate state consistency after action
    const stateConsistency = validateGameStateConsistency(this.state);
    if (!stateConsistency.isValid) {
      logger.error(`[STATE] Consistency check failed: ${stateConsistency.error}`);
      auditInvalidAction(roomId, playerId, action, `State inconsistency: ${stateConsistency.error}`);
      // Could trigger rollback or reset
      return;
    }

    // Step 7: Audit the successful action
    auditPlayerAction(roomId, playerId, action, amount, {
      potSize: this.state.pot,
      playerStack: this.state.players[playerId]?.chips,
      phase: this.currentPhase,
    });

    logger.debug(`[ACTION] ${playerId} performed ${action} for ${amount}`);

  } catch (error) {
    logger.error(`[ACTION_ERROR] ${error.message}`);
  }
}
```

### Step 4: Integrate Auction Log Reset on Hand Start

**Location:** MyRoom.ts, when a new hand starts

```typescript
startNewHand() {
  // Get all players in the game
  for (const playerId of Object.keys(this.state.players)) {
    // Reset hand action counters for rate limiting
    gameActionRateLimiter.resetHandCounters(playerId);
  }

  // Audit log: hand start
  for (const playerId of Object.keys(this.state.players)) {
    gameAuditLog.recordEvent('hand_start', this.roomId, playerId, {
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      players: Object.keys(this.state.players).length,
    });
  }

  // Continue with existing hand start logic...
  this.dealCards();
  this.startBettingRound();
}
```

### Step 5: Integrate Audit Log on Hand End

**Location:** MyRoom.ts, when a hand ends

```typescript
endHand(winner: string) {
  // Audit log: hand end
  gameAuditLog.recordEvent('hand_end', this.roomId, winner, {
    amount: this.state.pot,
    runner_up: this.state.players[
      Object.keys(this.state.players).find(p => p !== winner)
    ]?.name,
    duration: Date.now() - this.handStartTime,
  });

  // Continue with existing hand end logic...
}
```

### Step 6: Integrate Cleanup on Player Leave

**Location:** MyRoom.ts, `onLeave()` method

```typescript
async onLeave(client: Client, consented: boolean) {
  try {
    const sessionData = ColyseusTokenManager.validateSession(client.id);
    const playerId = sessionData?.playerId || client.id;

    // Audit log: player leave
    auditPlayerLeave(this.roomId, playerId, consented ? 'voluntary' : 'disconnected', {
      clientId: client.id,
    });

    // Invalidate the session token
    ColyseusTokenManager.invalidateSession(client.id);

    // Clean up rate limiter data if player has been inactive
    gameActionRateLimiter.cleanup();

    logger.info(`[GAME] Player ${playerId} left room ${this.roomId}`);
  } catch (error) {
    logger.error(`[LEAVE_ERROR] ${error.message}`);
  }
}
```

### Step 7: Add Periodic Security Maintenance

**Location:** MyRoom constructor or startup

```typescript
// Add periodic cleanup and monitoring
setInterval(() => {
  // Clean up inactive players from rate limiter
  const cleaned = gameActionRateLimiter.cleanup(1800000); // 30 minutes
  
  if (cleaned > 0) {
    logger.info(`[MAINTENANCE] Cleaned up ${cleaned} inactive players`);
  }

  // Get security statistics
  const stats = gameActionRateLimiter.getStatistics();
  if (stats.bannedPlayers > 0 || stats.playersWithViolations > 0) {
    logger.warn(`[SECURITY] Banned: ${stats.bannedPlayers}, Violations: ${stats.totalViolations}`);
  }

  // Clear old audit logs
  const cleared = gameAuditLog.clearOldEvents();
  if (cleared > 0) {
    logger.info(`[AUDIT] Cleared ${cleared} old audit events`);
  }
}, 300000); // Run every 5 minutes
```

---

## Security Flow Diagram

```
Client Action
    ↓
[1] Validate Session Token
    ├─ Invalid: Reject connection
    ├─ Valid: Continue
    ↓
[2] Check Rate Limiting
    ├─ Exceeded: Log violation, send error
    ├─ OK: Continue
    ↓
[3] Validate Player Turn
    ├─ Invalid: Log violation, send error
    ├─ Valid: Continue
    ↓
[4] Validate Poker Action
    ├─ Invalid: Log violation, send error
    ├─ Valid: Continue
    ↓
[5] Detect Anti-Cheat Violations
    ├─ Critical: Ban player, close connection
    ├─ High/Medium: Log warning, continue
    ├─ None: Continue
    ↓
[6] Execute Action
    ↓
[7] Validate Game State Consistency
    ├─ Invalid: Log error, possible rollback
    ├─ Valid: Continue
    ↓
[8] Audit Log Action
    ↓
[9] Broadcast to other clients
```

---

## Testing Security Integration

### Test 1: JWT Authentication
```typescript
// Should reject connection without token
client.connect(roomName, {}); // Should fail

// Should accept with valid token
const token = generateTestJWT();
client.connect(roomName, { token }); // Should succeed
```

### Test 2: Rate Limiting
```typescript
// Send 10 actions in rapid succession
for (let i = 0; i < 10; i++) {
  client.send('action', { action: 'check' });
}
// Should start rejecting after few actions
```

### Test 3: Anti-Cheat
```typescript
// Try impossible action (bet -100)
client.send('action', { action: 'raise', amount: -100 });
// Should be rejected and logged

// Try action while folded
client.send('action', { action: 'fold' });
client.send('action', { action: 'raise', amount: 100 });
// Second action should be rejected
```

### Test 4: Validation
```typescript
// Try to act out of turn
client2.send('action', { action: 'check' }); // client1's turn
// Should be rejected

// Try invalid bet amount
client.send('action', { action: 'raise', amount: 1000000 });
// Should be rejected as exceeds stack
```

---

## Security Checklist

- [ ] All imports added to MyRoom.ts
- [ ] JWT validation in onJoin() handler
- [ ] Rate limiting check in action handler
- [ ] Player turn validation in action handler
- [ ] Poker action validation in action handler
- [ ] Anti-cheat detection in action handler
- [ ] Game state consistency check in action handler
- [ ] Action audit logging in action handler
- [ ] Rate limiter reset at hand start
- [ ] Audit log for hand start/end
- [ ] Session cleanup in onLeave()
- [ ] Periodic maintenance job running
- [ ] Error handling for all security checks
- [ ] Logging at appropriate levels (debug, info, warn, error)
- [ ] Tested with invalid tokens
- [ ] Tested with rate limit violations
- [ ] Tested with invalid actions
- [ ] Tested with impossible game states

---

## Performance Considerations

1. **Rate Limit Cleanup**: Runs every 5 minutes, removes inactive players
2. **Audit Log Retention**: Keeps 7 days of logs, max 10,000 events in memory
3. **Token Validation**: ~5ms per JWT verification (cached when possible)
4. **Anti-Cheat Detection**: ~1ms per check (minimal computational cost)
5. **Game Validation**: ~2ms per state consistency check

Total overhead per action: ~10-15ms

---

## Monitoring and Alerting

### Key Metrics to Monitor
- Number of failed authentications
- Rate limit violations per player
- Anti-cheat detections by severity
- Invalid action attempts
- Game state inconsistencies
- Session management (active sessions, timeouts)

### Alert Conditions
- Player with >5 violations → Auto-ban
- Critical cheat detection → Immediate disconnect
- State consistency failure → Game reset required
- Suspicious player pattern → Flag for review

---

## Configuration

Adjust these constants in the security modules as needed:

```typescript
// In game-action-rate-limit.ts
DEFAULT_ACTION_LIMITS: {
  fold: { cooldownMs: 500, maxActionsPerSecond: 1 },
  check: { cooldownMs: 500, maxActionsPerSecond: 1 },
  raise: { cooldownMs: 1000, maxActionsPerSecond: 0.5 },
  // ... adjust based on game speed requirements
}

// In game-auth.ts
TOKEN_EXPIRY_CHECK_INTERVAL: 60000; // Check token expiry every 60 seconds
SESSION_TIMEOUT: ONE_HOUR; // Session expires after 1 hour

// In anti-cheat.ts
SUSPICIOUS_ACTION_LIMIT: 10 APS; // Warn if >10 actions per second
IMPOSSIBLE_BET_LIMIT: 1.5x stack; // Don't allow betting >150% of stack
```

---

## Troubleshooting

### Issue: "Invalid authentication token"
- Verify token generation is correct
- Check token hasn't expired
- Ensure token includes required fields (userId, username)

### Issue: Actions being rate limited too aggressively
- Increase cooldownMs in DEFAULT_ACTION_LIMITS
- Increase maxActionsPerSecond limits
- Check player's internet connection

### Issue: False positive anti-cheat detections
- Review anti-cheat thresholds in `detectSuspiciousAction()`
- Adjust timing sensitivity for network anomalies
- Consider player latency in calculations

### Issue: Audit logs growing too large
- Reduce retention period (default 7 days)
- Implement log rotation to persistent storage
- Archive old logs to database

---

## Next Steps

1. Implement integration following the guide above
2. Run security tests for each module
3. Monitor logs for false positives
4. Adjust thresholds based on game metrics
5. Implement persistent audit log storage
6. Add admin dashboard for security monitoring
