import { Room, Client, CloseCode } from "@colyseus/core";
import { StateView } from "@colyseus/schema";
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
import { CUSTOM_REBUY_TIMEOUT } from "./close-codes";

const API_URL = process.env.API_URL || "http://localhost:3000";

const REBUY_KICK_CHECK_INTERVAL_MS = 15000; // cada 15s revisar reservas de rebuy expiradas

export class MyRoom extends Room<{ state: MyRoomState }> {
  maxClients = 6;
  public turnTimeout: NodeJS.Timeout | null = null;
  public dealerIndex: number = 0;
  public currentPlayerIndex: number = 0;
  public playersInHand: string[] = [];
  public playersActedThisRound: Set<string> = new Set();
  public playersAllIn: Set<string> = new Set();
  private engine!: GameEngine;
  private reconnectionTimeoutSeconds = 60;
  private rebuyKickCheckInterval: ReturnType<typeof setInterval> | null = null;

  /** Callback usado por GameEngine cuando un jugador queda con 0 fichas (bust). */
  public onPlayerBusted?: (sessionId: string, seatIndex: number) => void;
  /** Callback para retrasar game ended si hay jugadores en ventana de rebuy. */
  public onHasPlayersInRebuyWindow?: () => boolean;

  /** Modo torneo: envía a cada cliente si ganó o perdió y cierra la mesa. */
  public notifyTournamentEnd(champion: { sessionId: string; name: string; chips: number }): void {
    for (const client of this.clients) {
      const result = client.sessionId === champion.sessionId ? "won" : "lost";
      client.send("gameResult", { result, champion });
    }
    // Retrasar disconnect para que todos los clientes reciban gameResult antes de cerrar la conexión
    this.clock.setTimeout(() => this.disconnect(), 800);
  }

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
   * Reserve a seat for a player who busted out (0 chips).
   * Converts sessionId to userId via sessionManager; seatManager.reserveSeatForRebuy requires userId.
   */
  private reserveSeat(sessionId: string, seatIndex: number): void {
    const userId = this.sessionManager.getUserId(sessionId);
    if (userId === undefined) return;
    const client = this.clients.find(c => c.sessionId === sessionId);
    if (!client) return;
    this.rebuyManager.reserveSeat(client, seatIndex, userId, this.seatManager);
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
    // Game setup / out-of-round actions: startGame, rejoin, rebuy (busted can rebuy while no hand)
    const gameSetupActions = new Set(['startGame', 'rejoin', 'rebuy']);
    
    // Block game actions if round is not active (rebuy allowed so busted player can rebuy)
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

    const requestedName = typeof options?.tableName === "string" ? options.tableName.trim() : "";
    const safeName = requestedName ? requestedName.slice(0, 32) : "";
    const defaultName = `Mesa ${this.roomId.slice(0, 6)}`;
    this.setMetadata({
      name: safeName || defaultName,
      createdAt: Date.now()
    });

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
    // Rebuy window must be shorter than HEARTBEAT_TIMEOUT (90s) so client isn't disconnected before rebuy expires
    this.rebuyManager = new RebuyManager(this.roomId, {
      rebuyTimeoutMs: 60000, // 60s
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
          client.leave(4000, "Heartbeat timeout");
        }
      }
    );

    // Callback para jugadores que quedan con 0 fichas: reservar asiento y ventana de rebuy
    this.onPlayerBusted = (sessionId: string, seatIndex: number) => {
      this.reserveSeat(sessionId, seatIndex);
    };
    // No declarar game ended mientras haya alguien en ventana de rebuy
    this.onHasPlayersInRebuyWindow = () => this.seatManager.hasActiveRebuyReservations();

    // Tarea periódica: expulsar clientes que no hicieron rebuy antes de que expire la reserva
    this.rebuyKickCheckInterval = setInterval(() => {
      const expired = this.seatManager.takeExpiredReservations();
      for (const { userId } of expired) {
        const sessionId = this.sessionManager.getSessionId(userId);
        if (sessionId) {
          const client = this.clients.find(c => c.sessionId === sessionId);
          if (client) {
            logger.info(`Kicking client for rebuy timeout`, { sessionId, userId, roomId: this.roomId });
            client.leave(CUSTOM_REBUY_TIMEOUT, "REBUY_TIMEOUT");
          }
        }
      }
    }, REBUY_KICK_CHECK_INTERVAL_MS);

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

    // Rebuy message handler (allowed when round not active so busted can rebuy)
    this.onMessage("rebuy", (client) => {
      if (!this.isActionAllowed(client.sessionId, "rebuy")) return;
      const ok: boolean = this.handleRebuy(client);
      if (ok === true) this.engine.tryResumeAfterRebuy();
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
    const player = this.lifecycleManager.handleJoin(
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
    // StateView: each client sees all players (names, chips, seats) so the table UI works.
    // Player.hand is @view() so per-client visibility for private cards is handled by the schema.
    client.view = new StateView();
    for (const p of this.state.users.values()) {
      client.view.add(p);
    }
    // Existing clients must see the new player in their view.
    for (const c of this.clients) {
      if (c !== client && c.view) {
        (c.view as StateView).add(player);
      }
    }
  }

  async onLeave(client: Client, code: number) {
    const consented = code === CloseCode.CONSENTED;
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
    this.engine.tryGameEnd();
  }

  scheduleDelayed(callback: () => void, ms: number): void {
    this.clock.setTimeout(callback, ms);
  }

  onDispose() {
    logger.info(`Room disposing`, { roomId: this.roomId });
    if (this.turnTimeout) clearTimeout(this.turnTimeout);
    if (this.rebuyKickCheckInterval) {
      clearInterval(this.rebuyKickCheckInterval);
      this.rebuyKickCheckInterval = null;
    }
    
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
