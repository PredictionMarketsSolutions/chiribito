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

    // Game messages
    this.onMessage("startGame", (client) => this.engine.handleStartGame(client));
    this.onMessage("bet", (client, amount: number) => this.engine.handleBet(client, amount));
    this.onMessage("call", (client) => this.engine.handleCall(client));
    this.onMessage("check", (client) => this.engine.handleCheck(client));
    this.onMessage("fold", (client) => this.engine.handleFold(client));
    this.onMessage("raise", (client, amount: number) => this.engine.handleRaise(client, amount));
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

  private async validateTokenRemote(token: string): Promise<void> {
    const maxAttempts = 2;
    const timeoutMs = 3000;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${API_URL}/api/auth/validate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("INVALID_TOKEN");
        }
        return;
      } catch (err) {
        if (attempt >= maxAttempts) {
          throw err instanceof Error ? err : new Error("AUTH_UNAVAILABLE");
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      } finally {
        clearTimeout(timeoutId);
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
  }

}
