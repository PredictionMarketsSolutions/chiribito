import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";
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
  AnalyticsService,
  RebuyManager,
  AuthenticationService,
  PlayerLifecycleManager
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
  private rebuyManager!: RebuyManager;
  private authService!: AuthenticationService;
  private lifecycleManager!: PlayerLifecycleManager;

  private getNextAvailableSeat(): number {
    return this.seatManager.getNextAvailableSeat() ?? -1;
  }

  /**
   * Reserve a seat for a player who busted out (0 chips)
   * Allows time for rebuy decision
   */
  private reserveSeat(sessionId: string, seatIndex: number) {
    const client = this.clients.find(c => c.sessionId === sessionId);
    const userId = this.sessionManager.getUserId(sessionId);
    
    if (client && userId) {
      this.rebuyManager.reserveSeat(client, seatIndex, userId, this.seatManager);
    }
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
    return this.rebuyManager.handleRebuy(
      client,
      this.state,
      this.seatManager,
      this.sessionManager,
      (type, message) => this.broadcast(type, message)
    );
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

  onCreate(options: any) {
    this.setState(new MyRoomState());
    this.autoDispose = false;
    this.engine = new GameEngine(this);

    // Initialize managers
    this.sessionManager = new SessionManager(this.roomId, this.reconnectionTimeoutSeconds);
    this.authService = new AuthenticationService(this.roomId, {
      apiUrl: API_URL,
      jwtSecret: process.env.JWT_SECRET || "",
      maxRetries: 3,
      retryDelayMs: 500,
      requestTimeoutMs: 8000
    });
    this.rebuyManager = new RebuyManager(this.roomId, {
      rebuyTimeoutMs: 120000,
      rebuyAmount: 1000
    });
    this.seatManager = new SeatManager(this.roomId, this.maxClients, this.rebuyManager.getConfig().rebuyTimeoutMs);
    this.rateLimiter = new RateLimiterService(this.roomId, {
      defaultCooldownMs: ACTION_COOLDOWN,
      customCooldowns: new Map([
        ["startGame", 2000],
        ["bet", 100],
        ["raise", 100]
      ])
    });
    this.analytics = new AnalyticsService(this.roomId, 300000); // 5 minutes
    this.lifecycleManager = new PlayerLifecycleManager(this.roomId, {
      reconnectionTimeoutSeconds: this.reconnectionTimeoutSeconds
    });
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
    return this.authService.requestJoin(options);
  }

  async onAuth(client: Client, options: any) {
    const result = await this.authService.authenticate(client, options, this.sessionManager);
    
    // Store results in options for onJoin
    options.authUser = result.authUser;
    if (result.replaceSessionId) {
      options.replaceSessionId = result.replaceSessionId;
    }
    
    return options.authUser;
  }

  onJoin(client: Client, options: any) {
    this.lifecycleManager.handleJoin(
      client,
      options,
      this.state,
      {
        sessionManager: this.sessionManager,
        seatManager: this.seatManager,
        connectionMonitor: this.connectionMonitor,
        analytics: this.analytics
      },
      () => Array.from(this.clients),
      (type, message, opts) => this.broadcast(type, message, opts)
    );
  }

  async onLeave(client: Client, consented: boolean) {
    await this.lifecycleManager.handleLeave(
      client,
      consented,
      this.state,
      {
        sessionManager: this.sessionManager,
        seatManager: this.seatManager,
        connectionMonitor: this.connectionMonitor,
        analytics: this.analytics
      },
      this.playersInHand,
      this.engine,
      (c, seconds) => this.allowReconnection(c, seconds) as any as Promise<Client>,
      (type, message, opts) => this.broadcast(type, message, opts)
    );
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
