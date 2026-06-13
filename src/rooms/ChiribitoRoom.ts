import { Room, Client, CloseCode } from "@colyseus/core";
import { StateView } from "@colyseus/schema";
import { MesaState, Player } from "./schema/MesaState";
import { GameEngine } from "./game/GameEngine";
import logger from "../config/logger";
import { HEARTBEAT_INTERVAL, HEARTBEAT_TIMEOUT, ACTION_COOLDOWN } from "./game/constants";

import { allowCreateRoom, recordCreateRoom } from "../security/create-room-rate-limit";

// Room managers
import {
  SessionManager,
  ConnectionMonitor,
  SeatManager,
  RateLimiterService,
  AnalyticsService,
  AuthenticationService,
  PlayerLifecycleManager
} from "./managers";
import { BotController } from "./managers/BotController";
import { CASTIZO_ROSTER } from "./game/bots/profiles";
import { CUSTOM_GAME_END } from "./close-codes";
import { reportTournamentGameEnded } from "../services/api-server-stats";
import {
  API_URL,
  JWT_SECRET,
  AUTH_REQUEST_TIMEOUT_MS,
  HEARTBEAT_DISCONNECT_ENABLED
} from "../config/env";
import type { RoomOptions, JoinOptionsFromClient, JoinOptionsWithAuth } from "../types/room-options";

export class ChiribitoRoom extends Room<{ state: MesaState }> {
  maxClients = 6;
  /** True when the room was just created (client.create); used to rate-limit create-room in onAuth. */
  private roomJustCreated = false;
  /** All users that ever joined this table (by userId), used for tournament stats even if they disconnect. */
  private tournamentParticipantUserIds: Set<number> = new Set();
  public turnTimeout: NodeJS.Timeout | null = null;
  public dealerIndex: number = 0;
  public currentPlayerIndex: number = 0;
  public playersInHand: string[] = [];
  public playersActedThisRound: Set<string> = new Set();
  public playersAllIn: Set<string> = new Set();
  private engine!: GameEngine;
  private reconnectionTimeoutSeconds = 60;
  /** True when this is a practice room (no stats, no lobby listing, play-again, dispose-on-empty). */
  private isPractice = false;
  
  /** Modo torneo: envía a cada cliente si ganó o perdió y cierra la mesa. */
  public notifyTournamentEnd(champion: { sessionId: string; name: string; chips: number }): void {
    // gameResult broadcast: ALWAYS (practice AND normal)
    for (const client of this.clients) {
      const result = client.sessionId === champion.sessionId ? "won" : "lost";
      client.send("gameResult", { result, champion });
    }

    if (this.isPractice) {
      // Practice: skip stats POST, broadcast practiceEnd, do NOT disconnect
      // The client sends "playAgain" to restart the hand in the same room.
      this.broadcast("practiceEnd", { champion });
    } else {
      // Normal tournament: persist stats + disconnect (BYTE-IDENTICAL to pre-Phase-4)
      void this.reportTournamentStats(champion);

      // Cerrar cada cliente con código GAME_END para que el frontend no intente reconectar
      this.clock.setTimeout(() => {
        const clients = Array.from(this.clients);
        for (const client of clients) {
          client.leave(CUSTOM_GAME_END, "GAME_END");
        }
        this.disconnect();
      }, 800);
    }
  }

  // Managers
  private sessionManager!: SessionManager;
  private connectionMonitor!: ConnectionMonitor;
  private seatManager!: SeatManager;
  private rateLimiter!: RateLimiterService;
  private analytics!: AnalyticsService;
  private authService!: AuthenticationService;
  private lifecycleManager!: PlayerLifecycleManager;
  /** Bot turn loop — instantiated in onCreate; cleared in onDispose. Only active in bot rooms (Phase 4+). */
  private botController!: BotController;

  private async reportTournamentStats(champion: { sessionId: string; name: string; chips: number }): Promise<void> {
    const internalSecret = process.env.INTERNAL_API_SECRET || "";
    if (!internalSecret) {
      logger.warn("INTERNAL_API_SECRET missing; tournament stats not persisted", { roomId: this.roomId });
      return;
    }

    const championUserId = this.sessionManager.getUserId(champion.sessionId);
    // userId can be 0; only treat undefined/null as missing
    if (championUserId === undefined || championUserId === null) {
      logger.warn("Champion userId not found; tournament stats not persisted", { roomId: this.roomId });
      return;
    }

    // Use the full set of participants (all users that have ever been authenticated in this room),
    // not just the current this.state.users (which no longer includes disconnected players).
    const participantUserIds = Array.from(this.tournamentParticipantUserIds)
      .filter((id): id is number => typeof id === "number" && Number.isFinite(id));

    if (participantUserIds.length === 0) {
      logger.warn("No participants resolved to userIds; tournament stats not persisted", { roomId: this.roomId });
      return;
    }

    await reportTournamentGameEnded(API_URL, internalSecret, {
      championUserId,
      participantUserIds,
    });
  }

  private getNextAvailableSeat(): number {
    return this.seatManager.getNextAvailableSeat() ?? -1;
  }

  /**
   * Clean up expired seat reservations (no longer needed - handled by SeatManager)
   */
  private cleanupExpiredReservations() {
    // SeatManager handles this automatically
  }

  /**
   * Check if client action is under rate limit
   * Returns true if action is allowed, false if rate limited
   */
  private isActionAllowed(sessionId: string, actionType: string): boolean {
    // Game setup / out-of-round actions: startGame, rejoin
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

  onCreate(options: RoomOptions = {}) {
    this.setState(new MesaState());
    this.autoDispose = false;

    // Normalize options once (WR-03): the default `= {}` only covers the no-arg
    // call; a caller passing `null`/`undefined` explicitly would still bypass it
    // under strictNullChecks:false. Read mode/botCount/tableName from `opts`
    // uniformly so isPractice, seeding, and metadata share the same safe reads.
    const opts = options ?? {};
    const mode = opts.mode;
    const botCount = opts.botCount;

    // Practice mode detection (Phase 4) — set BEFORE setMetadata and lobby exclusion
    this.isPractice = mode === "practice";

    const requestedName = typeof opts.tableName === "string" ? opts.tableName.trim() : "";
    const safeName = requestedName ? requestedName.slice(0, 32) : "";
    const defaultName = `Mesa ${this.roomId.slice(0, 6)}`;
    this.setMetadata({
      name: safeName || defaultName,
      createdAt: Date.now(),
      ...(this.isPractice ? { mode: "practice" } : {})
    });

    // Lobby exclusion (Phase 4) — identical pattern to LobbyRoom.ts:52.
    // _listing.unlisted = true prevents updateLobby() from ever publishing this
    // room to the $lobby channel, so the frontend lobby never sees practice rooms.
    // Use bracket access + as any because _listing is a private Colyseus field.
    // Do NOT use setPrivate(true) — that blocks joinById too (Pitfall 4).
    // Guard the deref (WR-02): _listing is present at onCreate today (Colyseus
    // wires it before onCreate, same as LobbyRoom.onCreate), but under
    // strictNullChecks:false an undefined _listing (version bump / changed
    // ordering) would throw synchronously and kill creation for ALL practice
    // rooms. One optional guard makes this resilient.
    if (this.isPractice) {
      const listing = (this as any)["_listing"];
      if (listing) listing.unlisted = true;
    }

    this.engine = new GameEngine(this);

    // BotController — wires the onTurnStarted hook to the bot turn loop.
    // Phase 3 instantiates it here; Phase 4 will conditionally seed bots
    // based on { mode, botCount } room options. Seeding is intentionally
    // NOT called here — this phase keeps seeding test-driven.
    this.botController = new BotController(this, this.engine);

    // Initialize managers
    this.sessionManager = new SessionManager(this.roomId, this.reconnectionTimeoutSeconds);
    this.authService = new AuthenticationService(this.roomId, {
      apiUrl: API_URL,
      jwtSecret: JWT_SECRET,
      maxRetries: 3,
      retryDelayMs: 500,
      requestTimeoutMs: AUTH_REQUEST_TIMEOUT_MS,
    });
    this.seatManager = new SeatManager(this.roomId, this.maxClients);
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
        const client = this.clients.find(c => c.sessionId === sessionId);
        if (!client) return;
        if (HEARTBEAT_DISCONNECT_ENABLED) {
          logger.warn(`Client unresponsive — disconnecting on heartbeat timeout`, {
            sessionId,
            roomId: this.roomId,
            timeoutMs: HEARTBEAT_TIMEOUT
          });
          client.leave(4000, "Heartbeat timeout");
        } else {
          logger.warn(`Client unresponsive — disconnect disabled by env flag`, {
            sessionId,
            roomId: this.roomId
          });
        }
      }
    );

    // Start managers
    this.connectionMonitor.start();
    this.analytics.start();

    // Bot seeding (Phase 4) — seatManager is fully initialized above; seed after it.
    // Clamp botCount to [1,5]: never trust client-supplied values (T-04-03).
    if (this.isPractice) {
      const clampedCount = Math.max(1, Math.min(5, botCount ?? 1));
      this.botController.seedBots(clampedCount, {
        chips: 1000,
        profiles: CASTIZO_ROSTER,
        seatManager: this.seatManager,
      });
    }

    // playAgain handler (Phase 4) — re-seeds chips=1000 and starts a new hand.
    // Non-practice rooms return immediately (T-04-02 guard).
    // Not gated through isActionAllowed: this is an out-of-round action (like startGame).
    this.onMessage("playAgain", (_client) => {
      if (!this.isPractice) return;
      // Mid-hand guard (CR-01): playAgain is only meaningful once the game has
      // ended (champion holds all chips → roundStarted=false). Mirror the
      // handleStartGame roundStarted guard so a client cannot send playAgain
      // mid-hand to refill every stack to 1000 and force a re-deal (integrity
      // break / griefing). Genuine end-of-game keeps roundStarted=false → proceeds.
      if (this.state.roundStarted) return;
      // Defend the read (WR-04): the handler is a client-triggered entry point;
      // under strictNullChecks:false a missing state.users would throw
      // "not iterable". onCreate always setState(new MesaState()) first, so this
      // holds in production, but guarding matches the codebase convention.
      if (!this.state?.users) return;
      for (const [, player] of this.state.users) {
        // Skip any undefined entry while iterating (WR-04 defensive).
        if (!player) continue;
        player.chips = 1000;
        player.currentBet = 0;
        player.isFolded = false;
      }
      // Clear any stale turn timer before re-dealing. After a full re-seed every
      // player has chips, so startNewHand cannot hit its <2 / currentPlayerIndex
      // === -1 early-return (which would skip startTurnTimer's own clear); this
      // guards that path defensively regardless (WR-01: startNewHand owns the
      // rest of the reset on the genuine end-of-game path, which is the only one
      // reachable here now that the roundStarted guard is in place).
      if (this.turnTimeout) {
        clearTimeout(this.turnTimeout);
        this.turnTimeout = null;
      }
      // Set roundStarted before startNewHand to avoid stale state (Pitfall 6)
      this.state.roundStarted = true;
      this.engine.startNewHand();
    });

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
      this.connectionMonitor.recordHeartbeat(client.sessionId, this.state.users.get(client.sessionId)?.name);
      this.analytics.recordMessageReceived(client.sessionId);
      client.send("heartbeat_ack");
    });

  }

  // Validate JWT before allowing join. Colyseus calls `requestJoin` when a client tries to join.
  async requestJoin(options: JoinOptionsFromClient, isNew?: boolean) {
    if (isNew) this.roomJustCreated = true;
    return this.authService.requestJoin(options);
  }

  async onAuth(client: Client, options: JoinOptionsWithAuth) {
    const result = await this.authService.authenticate(client, options, this.sessionManager);

    // Track every authenticated user as a tournament participant (by stable userId).
    const participantUserId = result.authUser?.userId;
    if (participantUserId != null && typeof participantUserId === "number") {
      this.tournamentParticipantUserIds.add(participantUserId);
    }

    // Rate-limit creating new rooms (first client joining a just-created room)
    if (this.roomJustCreated) {
      this.roomJustCreated = false;
      const userId = result.authUser?.userId;
      if (userId != null && typeof userId === "number") {
        if (!allowCreateRoom(userId)) {
          logger.warn("Create room rate limited", { userId, roomId: this.roomId });
          throw new Error("CREATE_ROOM_RATE_LIMIT");
        }
        recordCreateRoom(userId);
      }
    }

    // Store results in options for onJoin
    options.authUser = result.authUser;
    if (result.replaceSessionId) {
      options.replaceSessionId = result.replaceSessionId;
    }

    return options.authUser;
  }

  onJoin(client: Client, options: JoinOptionsWithAuth) {
    // Initialize view before handleJoin so the client always has a view even if handleJoin throws.
    client.view = new StateView();
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
    for (const p of this.state.users.values()) {
      client.view!.add(p);
    }
    // Existing clients must see the new player in their view.
    for (const c of this.clients) {
      if (c !== client && c.view) {
        (c.view as StateView).add(player);
      }
    }
    // Replaced session: point room state at the new sessionId so turn/actions work.
    const replaceSessionId = options.replaceSessionId;
    if (replaceSessionId && typeof replaceSessionId === "string") {
      const newSessionId = client.sessionId;
      if (this.state.currentTurn === replaceSessionId) {
        this.state.currentTurn = newSessionId;
      }
      const idx = this.playersInHand.indexOf(replaceSessionId);
      if (idx >= 0) {
        this.playersInHand[idx] = newSessionId;
      }
      if (this.playersActedThisRound.has(replaceSessionId)) {
        this.playersActedThisRound.delete(replaceSessionId);
        this.playersActedThisRound.add(newSessionId);
      }
      if (this.playersAllIn.has(replaceSessionId)) {
        this.playersAllIn.delete(replaceSessionId);
        this.playersAllIn.add(newSessionId);
      }
    }
  }

  async onLeave(client: Client, code: number) {
    const consented = code === CloseCode.CONSENTED;
    const reason =
      code === CloseCode.CONSENTED
        ? "client_left_voluntarily"
        : code === CUSTOM_GAME_END
          ? "game_ended"
          : `disconnected_code_${code}`;
    await this.lifecycleManager.handleLeave(
      client,
      consented,
      reason,
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

    // Dispose-on-empty for practice rooms (Phase 4, REQ-dispose-on-empty).
    // Bots have no Colyseus Client entry, so clients.length === 0 means no humans remain.
    // this.disconnect() triggers onDispose which calls botController.clearAll() (no timer leak).
    // autoDispose=false means Colyseus will NOT auto-dispose; we must call disconnect() explicitly.
    if (this.isPractice && this.clients.length === 0) {
      this.disconnect();
    }
  }

  /** IGameRoom hook: fires on every turn start; delegates to BotController (no-op when no bots registered). */
  onTurnStarted(sessionId: string): void {
    this.botController?.onTurnStarted(sessionId);
  }

  scheduleDelayed(callback: () => void, ms: number): void {
    this.clock.setTimeout(callback, ms);
  }

  onDispose() {
    logger.info(`Room disposing`, { roomId: this.roomId });
    if (this.turnTimeout) clearTimeout(this.turnTimeout);

    // Dispose all managers
    this.connectionMonitor?.clearAll();
    this.seatManager?.clearAll();
    this.rateLimiter?.clearAll();
    this.sessionManager?.clearAll();
    this.botController?.clearAll();
    
    // Log analytics summary
    if (this.analytics) {
      this.analytics.logSummary();
      this.analytics.clearAll();
    }
  }

}
