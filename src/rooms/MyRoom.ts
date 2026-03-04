import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";
import * as jwt from "jsonwebtoken";
import { GameEngine } from "./game/GameEngine";
import logger from "../config/logger";
import { HEARTBEAT_INTERVAL, HEARTBEAT_TIMEOUT, ACTION_COOLDOWN } from "./game/constants";

// Security audit logging
import { gameAuditLog } from "../security/game-audit";
import { gameActionRateLimiter } from "../security/game-action-rate-limit";

// Room managers
import {
  SessionManager,
  ConnectionMonitor,
  SeatManager,
  RateLimiterService,
  AnalyticsService
} from "./managers";

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
  private reconnectionTimeoutSeconds = 60;

  // Managers
  private sessionManager!: SessionManager;
  private connectionMonitor!: ConnectionMonitor;
  private seatManager!: SeatManager;
  private rateLimiter!: RateLimiterService;
  private analytics!: AnalyticsService;

  // Rebuy constants
  private readonly REBUY_TIMEOUT_MS = 120000; // 120 seconds
  private readonly REBUY_AMOUNT = 1000;

  private getNextAvailableSeat(): number {
    return this.seatManager.getNextAvailableSeat() ?? -1;
  }

  /**
   * Reserve a seat for a player who busted out (0 chips)
   * Allows 120s for rebuy decision
   */
  private reserveSeat(sessionId: string, seatIndex: number) {
    this.seatManager.reserveSeatForRebuy(seatIndex, this.sessionManager.getUserId(sessionId) ?? 0);

    // Notify client of reservation
    const client = this.clients.find(c => c.sessionId === sessionId);
    if (client) {
      client.send("seatReserved", {
        seatIndex,
        expiresIn: this.REBUY_TIMEOUT_MS
      });
    }

    logger.info(`Seat reserved for rebuy`, {
      sessionId,
      seatIndex,
      roomId: this.roomId,
      expiresIn: `${this.REBUY_TIMEOUT_MS}ms`
    });
  }

  /**
   * Clean up expired seat reservations (no longer needed - handled by SeatManager)
   */
  private cleanupExpiredReservations() {
    // SeatManager handles this automatically
  }

  /**
   * Process a rebuy request from a player
   */
  private handleRebuy(client: Client): boolean {
    const player = this.state.users.get(client.sessionId);
    if (!player) {
      client.send("error", { message: "Player not found" });
      return false;
    }

    if (player.chips > 0) {
      client.send("error", { message: "You still have chips, no rebuy needed" });
      return false;
    }

    if (player.seatIndex < 0) {
      client.send("error", { message: "You are not seated" });
      return false;
    }

    const reservation = this.seatManager.getReservation(player.seatIndex);
    const userId = this.sessionManager.getUserId(client.sessionId);
    
    if (!reservation || !userId || reservation.userId !== userId) {
      client.send("error", { message: "Seat reservation not found or expired" });
      return false;
    }

    // Remove reservation and rebuy
    this.seatManager.clearReservation(player.seatIndex);
    player.chips = this.REBUY_AMOUNT;
    player.isFolded = false;

    client.send("rebuySuccess", {
      chips: this.REBUY_AMOUNT,
      seatIndex: player.seatIndex
    });

    this.broadcast("playerRebuyed", {
      playerId: client.sessionId,
      playerName: player.name,
      newChips: this.REBUY_AMOUNT,
      seatIndex: player.seatIndex
    });

    logger.info(`Player rebuyed`, {
      player: player.name,
      sessionId: client.sessionId,
      newChips: this.REBUY_AMOUNT,
      roomId: this.roomId
    });

    return true;
  }

  /**
   * Check if client action is under rate limit
   * Returns true if action is allowed, false if rate limited
   */
  private isActionAllowed(sessionId: string, actionType: string): boolean {
    // Game setup actions (startGame, rejoin) can be used outside active round
    const gameSetupActions = new Set(['startGame', 'rejoin']);
    
    // Block game actions if round is not active
    if (!this.state.roundStarted && !gameSetupActions.has(actionType)) {
      logger.warn(`Action blocked - round not active`, { sessionId, actionType, roomId: this.roomId });
      return false;
    }

    if (!this.rateLimiter.isActionAllowed(sessionId, actionType)) {
      logger.warn(`Client rate limited`, { sessionId, actionType, roomId: this.roomId });
      return false;
    }
    
    this.rateLimiter.recordAction(sessionId, actionType);
    return true;
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

    // Update session tracking
    this.sessionManager.replaceSession(oldSessionId, newClient.sessionId);

    newClient.send("reconnected", {
      id: newClient.sessionId,
      name: existingPlayer.name,
      chips: existingPlayer.chips
    });
  }

  private handleLeaveCleanup(client: Client) {
    const player = this.state.users.get(client.sessionId);
    const wasCurrentTurn = this.state.currentTurn === client.sessionId;
    
    logger.info(`Player leaving`, {
      name: player?.name ?? "Unknown",
      sessionId: client.sessionId,
      wasCurrentTurn,
      roomId: this.roomId
    });
    
    if (player) {
      const foldIndex = this.playersInHand.indexOf(client.sessionId);
      player.isFolded = true;
      const playerIndex = this.playersInHand.indexOf(client.sessionId);
      if (playerIndex > -1) {
        this.playersInHand.splice(playerIndex, 1);
      }

      // Broadcast player disconnection to all clients
      this.broadcast("playerDisconnected", {
        playerId: client.sessionId,
        playerName: player.name,
        wasCurrentTurn,
        timestamp: Date.now()
      });

      if (wasCurrentTurn && this.playersInHand.length > 0 && foldIndex !== -1) {
        this.engine.setCurrentPlayerIndexBeforeNextActive(foldIndex);
      }

      if (wasCurrentTurn) {
        logger.info(`Ending turn for disconnected player`, {
          player: player.name,
          sessionId: client.sessionId,
          roomId: this.roomId
        });
        this.engine.endTurn();
      }

      // Remove player from the room completely
      this.state.users.delete(client.sessionId);
    }

    if (this.playersInHand.length === 1 && this.state.roundStarted) {
      this.engine.endRound([this.playersInHand[0]], "Gana por fold");
    }

    // Clean up session tracking
    this.sessionManager.removeSession(client.sessionId);
    
    // Clean up other managers
    this.connectionMonitor.removeClient(client.sessionId);
    this.rateLimiter.clearClient(client.sessionId);
    this.analytics.removeSession(client.sessionId);

    // Notify other players
    this.broadcast("playerLeft", {
      id: client.sessionId
    });
  }

  onCreate(options: any) {
    this.setState(new MyRoomState());
    this.autoDispose = false;
    this.engine = new GameEngine(this);

    // Initialize managers
    this.sessionManager = new SessionManager(this.roomId, this.reconnectionTimeoutSeconds);
    this.seatManager = new SeatManager(this.roomId, this.maxClients, this.REBUY_TIMEOUT_MS);
    this.rateLimiter = new RateLimiterService(this.roomId, {
      defaultCooldownMs: ACTION_COOLDOWN,
      customCooldowns: new Map([
        ["startGame", 2000],
        ["bet", 100],
        ["raise", 100]
      ])
    });
    this.analytics = new AnalyticsService(this.roomId, 300000); // 5 minutes
    this.connectionMonitor = new ConnectionMonitor(
      this.roomId,
      {
        heartbeatIntervalMs: HEARTBEAT_INTERVAL,
        heartbeatTimeoutMs: HEARTBEAT_TIMEOUT
      },
      (sessionId) => {
        // Handle timeout: disconnect client
        const client = this.clients.find(c => c.sessionId === sessionId);
        if (client) {
          logger.info(`Forcing disconnect for unresponsive client`, { sessionId, roomId: this.roomId });
          client.close(4000, "Heartbeat timeout");
        }
      }
    );

    // Start managers
    this.connectionMonitor.start();
    this.analytics.start();

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
    this.onMessage("allIn", (client) => {
      if (!this.isActionAllowed(client.sessionId, "allIn")) return;
      this.engine.handleAllIn(client);
    });
    this.onMessage("raise", (client, amount: number) => {
      if (!this.isActionAllowed(client.sessionId, "raise")) return;
      this.engine.handleRaise(client, amount);
    });

    // Heartbeat message handler
    this.onMessage("heartbeat", (client) => {
      this.connectionMonitor.recordHeartbeat(client.sessionId);
      this.analytics.recordMessageReceived(client.sessionId);
      client.send("heartbeat_ack");
    });

    // Rebuy message handler
    this.onMessage("rebuy", (client) => {
      this.handleRebuy(client);
    });
  }

  // Validate JWT before allowing join. Colyseus calls `requestJoin` when a client tries to join.
  async requestJoin(options: any, isNew?: boolean) {
    if (!options?.authUser) {
      logger.warn("Request join without authUser", { roomId: this.roomId });
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
      logger.error("JWT_SECRET not set on server", { roomId: this.roomId });
      throw new Error("SERVER_CONFIG");
    }

    const decoded = jwt.verify(token, secret) as any;
    await this.validateTokenRemote(token);
    options.authUser = decoded;

    const userId = Number(decoded?.userId);
    if (!Number.isFinite(userId)) {
      throw new Error("INVALID_TOKEN");
    }

    const hasActiveSession = this.sessionManager.hasActiveSession(userId);
    const isPending = this.sessionManager.isPending(userId);

    if ((hasActiveSession || isPending) && !options?.forceReplace) {
      throw new Error("SESSION_EXISTS");
    }

    if (hasActiveSession && options?.forceReplace) {
      options.replaceSessionId = this.sessionManager.getSessionId(userId);
    }

    this.sessionManager.addPending(userId);
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
          logger.error(`Token validation failed after ${maxAttempts} attempts`, { error: String(err), roomId: this.roomId });
          throw err instanceof Error ? err : new Error("AUTH_UNAVAILABLE");
        }
        
        // Exponential backoff: 500ms, 1s, 2s
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        logger.warn(`Token validation attempt ${attempt}/${maxAttempts} failed, retrying in ${delayMs}ms`, { roomId: this.roomId });
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
      
      // Remove old session from managers
      this.sessionManager.removeSession(replaceSessionId);

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

    // Register session
    if (Number.isFinite(userId)) {
      this.sessionManager.registerSession(userId, client.sessionId);
    }

    // Mark seat as occupied
    if (player.seatIndex >= 0) {
      this.seatManager.occupySeat(player.seatIndex, userId);
    }

    // Track analytics
    this.analytics.recordConnection(client.sessionId);
    this.connectionMonitor.recordHeartbeat(client.sessionId);

    logger.info(`Player joined`, {
      name: player.name,
      sessionId: client.sessionId,
      roomId: this.roomId
    });

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
    const userId = this.sessionManager.getUserId(client.sessionId);

    if (!consented && userId) {
      try {
        const reconnected = await this.allowReconnection(client, this.reconnectionTimeoutSeconds);
        this.replaceSession(client.sessionId, reconnected);
        this.analytics.recordReconnection(reconnected.sessionId);
        return;
      } catch {
        // Reconnection failed or timed out. Continue cleanup.
        this.analytics.recordDisconnection(client.sessionId);
      }
    }

    this.handleLeaveCleanup(client);
  }

  onDispose() {
    logger.info(`Room disposing`, { roomId: this.roomId });
    if (this.turnTimeout) clearTimeout(this.turnTimeout);
    
    // Dispose all managers
    this.connectionMonitor?.clearAll();
    this.seatManager?.clearAll();
    this.rateLimiter?.clearAll();
    this.sessionManager?.clearAll();
    
    // Log analytics summary
    if (this.analytics) {
      this.analytics.logSummary();
      this.analytics.clearAll();
    }
  }

}
