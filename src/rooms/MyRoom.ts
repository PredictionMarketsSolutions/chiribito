import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";
import * as jwt from "jsonwebtoken";
import { GameEngine } from "./game/GameEngine";

const API_URL = process.env.API_URL || "http://localhost:3000";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 6;
  public turnTimeout: NodeJS.Timeout | null = null;
  public dealerIndex: number = 0;
  public currentPlayerIndex: number = 0;
  public playersInHand: string[] = [];
  public playersActedThisRound: Set<string> = new Set();
  public playersAllIn: Set<string> = new Set();
  private engine!: GameEngine;
  private activeUsers: Map<number, string> = new Map();
  private sessionUsers: Map<string, number> = new Map();
  private pendingUsers: Set<number> = new Set();
  private reconnectionTimeoutSeconds = 60;

  // Heartbeat & connection monitoring
  private clientHeartbeats: Map<string, number> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
  private readonly HEARTBEAT_TIMEOUT_MS = 90000; // 90 seconds (3 missed heartbeats)

  // Connection analytics per client
  private connectionStats = new Map<string, {
    joins: number;
    rejoins: number;
    heartbeatsMissed: number;
    latencyMs: number[];
    lastLatency: number;
    averageLatency: number;
  }>();
  private analyticsInterval: NodeJS.Timeout | null = null;

  // Rate limiting per client to prevent spam attacks
  private actionCooldowns = new Map<string, Map<string, number>>();
  private readonly ACTION_COOLDOWN_MS = 200; // 200ms between actions

  private getNextAvailableSeat(): number {
    const occupied = new Set<number>();
    this.state.users.forEach((player) => {
      if (player.seatIndex >= 0) occupied.add(player.seatIndex);
    });

    for (let i = 0; i < this.maxClients; i += 1) {
      if (!occupied.has(i)) return i;
    }
    return -1;
  }

  /**
   * Start monitoring client heartbeats to detect dead connections
   * Sends periodic heartbeat requests to all clients
   */
  private startHeartbeatMonitor() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const deadClients: string[] = [];

      // Check for unresponsive clients
      this.clients.forEach(client => {
        const lastHeartbeat = this.clientHeartbeats.get(client.sessionId) ?? Date.now();
        const timeSinceLastHeartbeat = now - lastHeartbeat;

        if (timeSinceLastHeartbeat > this.HEARTBEAT_TIMEOUT_MS) {
          console.warn(`[HEARTBEAT] Client ${client.sessionId} is unresponsive (${timeSinceLastHeartbeat}ms without heartbeat)`);
          deadClients.push(client.sessionId);
        }
      });

      // Force disconnect dead clients
      deadClients.forEach(sessionId => {
        const client = this.clients.find(c => c.sessionId === sessionId);
        if (client) {
          console.log(`[HEARTBEAT] Forcing disconnect for unresponsive client ${sessionId}`);
          client.close(4000, "Heartbeat timeout");
        }
      });

      // Send heartbeat request to all healthy clients
      this.broadcast("heartbeat");
    }, this.HEARTBEAT_INTERVAL_MS);
  }

  /**
   * Stop heartbeat monitoring when room is disposed
   */
  private stopHeartbeatMonitor() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.clientHeartbeats.clear();
  }

  /**
   * Check if client action is under rate limit
   * Returns true if action is allowed, false if rate limited
   */
  private isActionAllowed(sessionId: string, actionType: string): boolean {
    const now = Date.now();
    
    if (!this.actionCooldowns.has(sessionId)) {
      this.actionCooldowns.set(sessionId, new Map());
    }
    
    const cooldowns = this.actionCooldowns.get(sessionId)!;
    const lastTime = cooldowns.get(actionType) ?? 0;
    
    if (now - lastTime < this.ACTION_COOLDOWN_MS) {
      console.warn(`[RATE_LIMIT] Client ${sessionId} rate limited on ${actionType}`);
      return false;
    }
    
    cooldowns.set(actionType, now);
    return true;
  }

  /**
   * Start analytics reporting for connection quality monitoring
   * Logs health statistics every 60 seconds
   */
  private startAnalytics() {
    this.analyticsInterval = setInterval(() => {
      if (this.connectionStats.size === 0) return;
      
      const stats = Array.from(this.connectionStats.values());
      const avgLatency = stats.length > 0 
        ? stats.reduce((sum, s) => sum + s.averageLatency, 0) / stats.length 
        : 0;
      const maxLatency = Math.max(...stats.map(s => s.lastLatency || 0));
      const minLatency = Math.min(...stats.map(s => s.lastLatency || Infinity));
      
      console.log(`[ANALYTICS] Room: ${this.roomId} | Players: ${stats.length} | ` +
                  `Avg RTT: ${avgLatency.toFixed(0)}ms | Min: ${minLatency === Infinity ? 0 : minLatency}ms | Max: ${maxLatency}ms`);
    }, 60000);
  }

  /**
   * Log analytics summary when room is disposed
   */
  private logAnalyticsSummary() {
    if (this.connectionStats.size === 0) {
      console.log(`[ANALYTICS SUMMARY] Room ${this.roomId}: No connection data`);
      return;
    }
    
    const stats = Array.from(this.connectionStats.entries());
    const avgLatency = stats.length > 0
      ? stats.reduce((sum, [_, s]) => sum + s.averageLatency, 0) / stats.length
      : 0;
    
    console.log(`[ANALYTICS SUMMARY] Room ${this.roomId}:`);
    console.log(`  Total connections: ${stats.length}`);
    console.log(`  Average RTT: ${avgLatency.toFixed(0)}ms`);
    console.log(`  Total joins: ${stats.reduce((sum, [_, s]) => sum + s.joins, 0)}`);
    console.log(`  Total rejoins: ${stats.reduce((sum, [_, s]) => sum + s.rejoins, 0)}`);
    
    // Log per-client stats
    stats.forEach(([sessionId, s]) => {
      const playerName = this.state.users.get(sessionId)?.name || "Unknown";
      console.log(`    ${playerName}: ${s.averageLatency.toFixed(0)}ms avg, ${s.joins} joins, ${s.rejoins} rejoins`);
    });
  }

  private replaceSession(oldSessionId: string, newClient: Client) {
    const existingPlayer = this.state.users.get(oldSessionId);
    if (!existingPlayer) return;

    existingPlayer.sessionId = newClient.sessionId;
    this.state.users.delete(oldSessionId);
    this.state.users.set(newClient.sessionId, existingPlayer);

    this.playersInHand = this.playersInHand.map(id => id === oldSessionId ? newClient.sessionId : id);
    if (this.state.currentTurn === oldSessionId) {
      this.state.currentTurn = newClient.sessionId;
    }

    const userId = this.sessionUsers.get(oldSessionId);
    if (userId) {
      this.activeUsers.set(userId, newClient.sessionId);
      this.sessionUsers.delete(oldSessionId);
      this.sessionUsers.set(newClient.sessionId, userId);
      this.pendingUsers.delete(userId);
    }

    newClient.send("reconnected", {
      id: newClient.sessionId,
      name: existingPlayer.name,
      chips: existingPlayer.chips
    });
  }

  private handleLeaveCleanup(client: Client) {
    const player = this.state.users.get(client.sessionId);
    console.log(`[LEAVE] ${player?.name ?? "Unknown"} (${client.sessionId})`);
    if (player) {
      const wasCurrentTurn = this.state.currentTurn === client.sessionId;
      const foldIndex = this.playersInHand.indexOf(client.sessionId);
      player.isFolded = true;
      const playerIndex = this.playersInHand.indexOf(client.sessionId);
      if (playerIndex > -1) {
        this.playersInHand.splice(playerIndex, 1);
      }

      if (wasCurrentTurn && this.playersInHand.length > 0 && foldIndex !== -1) {
        this.engine.setCurrentPlayerIndexBeforeNextActive(foldIndex);
      }

      if (wasCurrentTurn) {
        this.engine.endTurn();
      }

      // Remove player from the room completely
      this.state.users.delete(client.sessionId);
    }

    if (this.playersInHand.length === 1 && this.state.roundStarted) {
      this.engine.endRound([this.playersInHand[0]], "Gana por fold");
    }

    const userId = this.sessionUsers.get(client.sessionId);
    if (userId) {
      const currentSessionId = this.activeUsers.get(userId);
      if (currentSessionId === client.sessionId) {
        this.activeUsers.delete(userId);
      }
      this.pendingUsers.delete(userId);
      this.sessionUsers.delete(client.sessionId);
    }

    // Notify other players
    this.broadcast("playerLeft", {
      id: client.sessionId
    });
  }

  onCreate(options: any) {
    this.setState(new MyRoomState());
    this.autoDispose = false;
    this.engine = new GameEngine(this);

    // Game messages with rate limiting
    this.onMessage("startGame", (client) => {
      if (!this.isActionAllowed(client.sessionId, "startGame")) return;
      this.engine.handleStartGame(client);
    });
    this.onMessage("bet", (client, amount: number) => {
      if (!this.isActionAllowed(client.sessionId, "bet")) return;
      this.engine.handleBet(client, amount);
    });
    this.onMessage("call", (client) => {
      if (!this.isActionAllowed(client.sessionId, "call")) return;
      this.engine.handleCall(client);
    });
    this.onMessage("check", (client) => {
      if (!this.isActionAllowed(client.sessionId, "check")) return;
      this.engine.handleCheck(client);
    });
    this.onMessage("fold", (client) => {
      if (!this.isActionAllowed(client.sessionId, "fold")) return;
      this.engine.handleFold(client);
    });
    this.onMessage("raise", (client, amount: number) => {
      if (!this.isActionAllowed(client.sessionId, "raise")) return;
      this.engine.handleRaise(client, amount);
    });

    // Heartbeat message to detect dead connections & track latency
    this.onMessage("heartbeat", (client, clientTimestampMs?: number) => {
      this.clientHeartbeats.set(client.sessionId, Date.now());
      
      // Calculate and track latency if client sent timestamp
      if (clientTimestampMs && typeof clientTimestampMs === 'number') {
        const now = Date.now();
        const latency = now - clientTimestampMs;
        
        // Update analytics
        let stats = this.connectionStats.get(client.sessionId);
        if (!stats) {
          stats = { joins: 0, rejoins: 0, heartbeatsMissed: 0, latencyMs: [], lastLatency: 0, averageLatency: 0 };
        }
        stats.latencyMs.push(latency);
        if (stats.latencyMs.length > 30) stats.latencyMs.shift(); // Keep last 30
        stats.lastLatency = latency;
        stats.averageLatency = stats.latencyMs.reduce((a, b) => a + b, 0) / stats.latencyMs.length;
        this.connectionStats.set(client.sessionId, stats);
      }
      
      client.send("heartbeat_ack");
    });

    // Start heartbeat monitoring
    this.startHeartbeatMonitor();
    this.startAnalytics();
  }

  // Validate JWT before allowing join. Colyseus calls `requestJoin` when a client tries to join.
  async requestJoin(options: any, isNew?: boolean) {
    if (!options?.authUser) {
      console.warn("requestJoin: no authUser provided");
      return false;
    }
    return true;
  }

  async onAuth(client: Client, options: any) {
    const token = options?.token || options?.auth?.token ||
      (options?.headers && typeof options.headers.authorization === 'string'
        ? options.headers.authorization.split(' ')[1]
        : undefined);

    if (!token) {
      throw new Error("NO_TOKEN");
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("onAuth: JWT_SECRET not set on server");
      throw new Error("SERVER_CONFIG");
    }

    const decoded = jwt.verify(token, secret) as any;
    await this.validateTokenRemote(token);
    options.authUser = decoded;

    const userId = Number(decoded?.userId);
    if (!Number.isFinite(userId)) {
      throw new Error("INVALID_TOKEN");
    }

    const existingSessionId = this.activeUsers.get(userId);
    const hasPending = this.pendingUsers.has(userId);

    if ((existingSessionId || hasPending) && !options?.forceReplace) {
      throw new Error("SESSION_EXISTS");
    }

    if (existingSessionId && options?.forceReplace) {
      options.replaceSessionId = existingSessionId;
    }

    this.pendingUsers.add(userId);
    return options.authUser;
  }

  /**
   * Validate token with API server using exponential backoff
   * This ensures token is still valid and user still exists
   */
  private async validateTokenRemote(token: string): Promise<void> {
    const maxAttempts = 3;
    const initialDelayMs = 500;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      // Increased timeout: 8 seconds for slower networks
      const timeoutMs = 8000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${API_URL}/api/auth/validate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          signal: controller.signal
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error("INVALID_TOKEN");
          }
          throw new Error(`HTTP ${response.status}`);
        }
        
        // Token valid
        return;
      } catch (err) {
        clearTimeout(timeoutId);
        
        const isLastAttempt = attempt >= maxAttempts;
        const isAuthError = err instanceof Error && err.message === "INVALID_TOKEN";
        
        // Don't retry auth errors - fail immediately
        if (isAuthError) {
          throw err;
        }
        
        // For network errors, use exponential backoff
        if (isLastAttempt) {
          console.error(`[AUTH] Token validation failed after ${maxAttempts} attempts:`, err);
          throw err instanceof Error ? err : new Error("AUTH_UNAVAILABLE");
        }
        
        // Exponential backoff: 500ms, 1s, 2s
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[AUTH] Token validation attempt ${attempt}/${maxAttempts} failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  onJoin(client: Client, options: any) {
    const userId = Number(options?.authUser?.userId);
    const replaceSessionId = typeof options?.replaceSessionId === "string"
      ? options.replaceSessionId
      : "";

    const previousSeatIndex = replaceSessionId
      ? this.state.users.get(replaceSessionId)?.seatIndex ?? -1
      : -1;

    const player = new Player(client.sessionId);
    player.name = options.name || options.authUser?.username || `Player-${client.sessionId.slice(0, 4)}`;
    player.chips = options.chips || 1000;
    player.seatIndex = previousSeatIndex >= 0 ? previousSeatIndex : this.getNextAvailableSeat();

    if (replaceSessionId) {
      const previousClient = this.clients.find(c => c.sessionId === replaceSessionId);
      if (previousClient) {
        previousClient.leave(4001, "SESSION_REPLACED");
      }
      const previousUserId = this.sessionUsers.get(replaceSessionId);
      if (previousUserId) {
        this.activeUsers.delete(previousUserId);
        this.sessionUsers.delete(replaceSessionId);
      }

      const orderedEntries = Array.from(this.state.users.entries());
      let replaced = false;
      this.state.users.clear();
      orderedEntries.forEach(([sessionId, existingPlayer]) => {
        if (sessionId === replaceSessionId) {
          this.state.users.set(client.sessionId, player);
          replaced = true;
          return;
        }
        this.state.users.set(sessionId, existingPlayer);
      });
      if (!replaced) {
        this.state.users.set(client.sessionId, player);
      }

      this.playersInHand = this.playersInHand.map(id => id === replaceSessionId ? client.sessionId : id);
      if (this.state.currentTurn === replaceSessionId) {
        this.state.currentTurn = client.sessionId;
      }
    } else {
      this.state.users.set(client.sessionId, player);
    }

    if (Number.isFinite(userId)) {
      this.activeUsers.set(userId, client.sessionId);
      this.sessionUsers.set(client.sessionId, userId);
      this.pendingUsers.delete(userId);
    }

    console.log(`[JOIN] ${player.name} (${client.sessionId})`);

    // Notify the player they joined
    client.send("joined", { 
      name: player.name, 
      chips: player.chips,
      players: Array.from(this.state.users.values()).map(p => ({
        id: p.sessionId,
        name: p.name,
        chips: p.chips
      }))
    });

    // Notify other players
    this.broadcast("playerJoined", {
      id: client.sessionId,
      name: player.name,
      chips: player.chips
    }, { except: client });
  }

  async onLeave(client: Client, consented: boolean) {
    const userId = this.sessionUsers.get(client.sessionId);

    if (!consented && userId) {
      try {
        const reconnected = await this.allowReconnection(client, this.reconnectionTimeoutSeconds);
        this.replaceSession(client.sessionId, reconnected);
        return;
      } catch {
        // Reconnection failed or timed out. Continue cleanup.
      }
    }

    this.handleLeaveCleanup(client);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
    if (this.turnTimeout) clearTimeout(this.turnTimeout);
    // Stop heartbeat monitoring
    this.stopHeartbeatMonitor();
    // Stop analytics reporting
    if (this.analyticsInterval) clearInterval(this.analyticsInterval);
    // Log final analytics summary
    this.logAnalyticsSummary();
  }

}
