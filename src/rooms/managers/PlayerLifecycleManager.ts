import { Client } from "@colyseus/core";
import { CUSTOM_SESSION_REPLACED } from "../close-codes";
import { MyRoomState, Player } from "../schema/MyRoomState";
import { SessionManager } from "./SessionManager";
import { SeatManager } from "./SeatManager";
import { ConnectionMonitor } from "./ConnectionMonitor";
import { AnalyticsService } from "./AnalyticsService";
import { GameEngine } from "../game/GameEngine";
import logger from "../../config/logger";

export interface PlayerLifecycleConfig {
  reconnectionTimeoutSeconds: number;
}

export interface LifecycleDependencies {
  sessionManager: SessionManager;
  seatManager: SeatManager;
  connectionMonitor: ConnectionMonitor;
  analytics: AnalyticsService;
}

/**
 * Manages player lifecycle: joining, leaving, reconnection, and cleanup.
 * Coordinates with multiple managers to maintain consistent state.
 */
export class PlayerLifecycleManager {
  private roomId: string;
  private config: PlayerLifecycleConfig;

  constructor(roomId: string, config?: Partial<PlayerLifecycleConfig>) {
    this.roomId = roomId;
    this.config = {
      reconnectionTimeoutSeconds: config?.reconnectionTimeoutSeconds ?? 60,
    };
  }

  /**
   * Handle player joining the room.
   * Manages session replacement, seat assignment, and state initialization.
   */
  handleJoin(
    client: Client,
    options: any,
    state: MyRoomState,
    dependencies: LifecycleDependencies,
    getAllClients: () => Client[],
    broadcastFn: (type: string, message: any, opts?: any) => void
  ): Player {
    const { sessionManager, seatManager, connectionMonitor, analytics } = dependencies;
    const userId = Number(options?.authUser?.userId);
    const replaceSessionId = typeof options?.replaceSessionId === "string"
      ? options.replaceSessionId
      : "";

    const previousSeatIndex = replaceSessionId
      ? state.users.get(replaceSessionId)?.seatIndex ?? -1
      : -1;

    const player = new Player(client.sessionId);
    player.name = options.name || options.authUser?.username || `Player-${client.sessionId.slice(0, 4)}`;
    player.chips = options.chips || 1000;
    player.seatIndex = previousSeatIndex >= 0 ? previousSeatIndex : this.getNextAvailableSeat(state);

    if (replaceSessionId) {
      const previousClient = getAllClients().find(c => c.sessionId === replaceSessionId);
      if (previousClient) {
        previousClient.leave(CUSTOM_SESSION_REPLACED, "SESSION_REPLACED");
      }
      
      // Remove old session from managers
      sessionManager.removeSession(replaceSessionId);

      const orderedEntries = Array.from(state.users.entries());
      let replaced = false;
      state.users.clear();
      orderedEntries.forEach(([sessionId, existingPlayer]) => {
        if (sessionId === replaceSessionId) {
          state.users.set(client.sessionId, player);
          replaced = true;
          return;
        }
        state.users.set(sessionId, existingPlayer);
      });
      if (!replaced) {
        state.users.set(client.sessionId, player);
      }
    } else {
      state.users.set(client.sessionId, player);
    }

    // Register session
    if (Number.isFinite(userId)) {
      sessionManager.registerSession(userId, client.sessionId);
    }

    // Mark seat as occupied
    if (player.seatIndex >= 0) {
      seatManager.occupySeat(player.seatIndex, userId);
    }

    // Track analytics
    analytics.recordConnection(client.sessionId);
    connectionMonitor.recordHeartbeat(client.sessionId);

    logger.info(`Player joined`, {
      name: player.name,
      sessionId: client.sessionId,
      roomId: this.roomId
    });

    // Notify the player they joined
    client.send("joined", { 
      name: player.name, 
      chips: player.chips,
      players: Array.from(state.users.values()).map(p => ({
        id: p.sessionId,
        name: p.name,
        chips: p.chips
      }))
    });

    // Notify other players
    broadcastFn("playerJoined", {
      id: client.sessionId,
      name: player.name,
      chips: player.chips
    }, { except: client });

    return player;
  }

  /**
   * Handle player leaving the room.
   * Attempts reconnection for non-consented leaves with user IDs.
   */
  async handleLeave(
    client: Client,
    consented: boolean,
    state: MyRoomState,
    dependencies: LifecycleDependencies,
    playersInHand: string[],
    engine: GameEngine,
    allowReconnectionFn: (client: Client, seconds: number) => Promise<Client>,
    broadcastFn: (type: string, message: any, opts?: any) => void
  ): Promise<void> {
    const { sessionManager, analytics } = dependencies;
    const userId = sessionManager.getUserId(client.sessionId);

    if (!consented && userId) {
      try {
        const reconnected = await allowReconnectionFn(client, this.config.reconnectionTimeoutSeconds);
        this.replaceSession(client.sessionId, reconnected, state, playersInHand, dependencies);
        analytics.recordReconnection(reconnected.sessionId);
        return;
      } catch {
        // Reconnection failed or timed out. Continue cleanup.
        analytics.recordDisconnection(client.sessionId);
      }
    }

    this.handleLeaveCleanup(client, state, playersInHand, dependencies, engine, broadcastFn);
  }

  /**
   * Replace an old session with a new client during reconnection.
   * Maintains player order and game state consistency.
   */
  private replaceSession(
    oldSessionId: string,
    newClient: Client,
    state: MyRoomState,
    playersInHand: string[],
    dependencies: LifecycleDependencies
  ): void {
    const { sessionManager } = dependencies;
    const existingPlayer = state.users.get(oldSessionId);
    if (!existingPlayer) return;

    existingPlayer.sessionId = newClient.sessionId;
    state.users.delete(oldSessionId);
    state.users.set(newClient.sessionId, existingPlayer);

    // Update playersInHand array
    const handIndex = playersInHand.indexOf(oldSessionId);
    if (handIndex >= 0) {
      playersInHand[handIndex] = newClient.sessionId;
    }

    if (state.currentTurn === oldSessionId) {
      state.currentTurn = newClient.sessionId;
    }

    sessionManager.replaceSession(oldSessionId, newClient.sessionId);

    newClient.send("reconnected", {
      id: existingPlayer.sessionId,
      name: existingPlayer.name,
      chips: existingPlayer.chips
    });

    logger.info(`Session replaced`, {
      oldSessionId,
      newSessionId: newClient.sessionId,
      roomId: this.roomId
    });
  }

  /**
   * Full cleanup when a player permanently leaves.
   * Handles fold, turn progression, manager cleanup, and winner determination.
   */
  private handleLeaveCleanup(
    client: Client,
    state: MyRoomState,
    playersInHand: string[],
    dependencies: LifecycleDependencies,
    engine: GameEngine,
    broadcastFn: (type: string, message: any, opts?: any) => void
  ): void {
    const { sessionManager, seatManager, connectionMonitor, analytics } = dependencies;
    const player = state.users.get(client.sessionId);
    const wasCurrentTurn = state.currentTurn === client.sessionId;

    if (player) {
      const playerIndex = playersInHand.indexOf(client.sessionId);
      
      if (playerIndex >= 0) {
        player.isFolded = true;
        playersInHand.splice(playerIndex, 1);

        broadcastFn("playerDisconnected", {
          playerId: client.sessionId,
          playerName: player.name,
          wasCurrentTurn,
          timestamp: Date.now()
        });

        // Solo avanzar turno/ronda si la partida sigue en curso (evita doble endRound al desconectar tras game over)
        if (wasCurrentTurn && playersInHand.length > 0 && state.roundStarted) {
          engine.setCurrentPlayerIndexBeforeNextActive(playerIndex);
          engine.endTurn();
        }
      }

      if (player.seatIndex >= 0) {
        seatManager.freeSeat(player.seatIndex);
      }
      state.users.delete(client.sessionId);
    }

    // Ganador por fold solo si la ronda estaba activa (evita pagar dos veces al ganador)
    if (playersInHand.length === 1 && state.roundStarted) {
      engine.endRound([playersInHand[0]], "Gana por fold");
    }

    // Manager cleanup
    sessionManager.removeSession(client.sessionId);
    connectionMonitor.removeClient(client.sessionId);
    analytics.removeSession(client.sessionId);

    broadcastFn("playerLeft", { id: client.sessionId });

    logger.info(`Player left`, {
      sessionId: client.sessionId,
      roomId: this.roomId
    });
  }

  /**
   * Find the next available seat index.
   */
  private getNextAvailableSeat(state: MyRoomState): number {
    const occupiedSeats = new Set(
      Array.from(state.users.values()).map(p => p.seatIndex).filter(s => s >= 0)
    );

    for (let i = 0; i < 9; i++) {
      if (!occupiedSeats.has(i)) {
        return i;
      }
    }
    return -1;
  }

  getConfig(): Readonly<PlayerLifecycleConfig> {
    return { ...this.config };
  }
}
