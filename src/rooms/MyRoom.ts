import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";
import * as jwt from "jsonwebtoken";
import { GameActions } from "./game/GameActions";

const API_URL = process.env.API_URL || "http://localhost:3000";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 6;
  public turnTimeout: NodeJS.Timeout | null = null;
  public dealerIndex: number = 0;
  public currentPlayerIndex: number = 0;
  public playersInHand: string[] = [];
  public playersActedThisRound: Set<string> = new Set();
  public playersAllIn: Set<string> = new Set();
  private actions!: GameActions;
  private activeUsers: Map<number, string> = new Map();
  private sessionUsers: Map<string, number> = new Map();
  private pendingUsers: Set<number> = new Set();

  onCreate(options: any) {
    this.setState(new MyRoomState());
    this.autoDispose = false;
    this.actions = new GameActions(this);

    // Game messages
    this.onMessage("startGame", (client) => this.actions.handleStartGame(client));
    this.onMessage("bet", (client, amount: number) => this.actions.handleBet(client, amount));
    this.onMessage("call", (client) => this.actions.handleCall(client));
    this.onMessage("check", (client) => this.actions.handleCheck(client));
    this.onMessage("fold", (client) => this.actions.handleFold(client));
    this.onMessage("raise", (client, amount: number) => this.actions.handleRaise(client, amount));
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
    const response = await fetch(`${API_URL}/api/auth/validate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("INVALID_TOKEN");
    }
  }

  onJoin(client: Client, options: any) {
    const userId = Number(options?.authUser?.userId);
    const replaceSessionId = typeof options?.replaceSessionId === "string"
      ? options.replaceSessionId
      : "";

    const player = new Player(client.sessionId);
    player.name = options.name || options.authUser?.username || `Player-${client.sessionId.slice(0, 4)}`;
    player.chips = options.chips || 1000;

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

  onLeave(client: Client, consented: boolean) {
    const player = this.state.users.get(client.sessionId);
    console.log(`[LEAVE] ${player?.name ?? "Unknown"} (${client.sessionId})`);
    if (player) {
      player.isFolded = true;
      // If it's their turn, end their turn
      if (this.state.currentTurn === client.sessionId) {
        this.actions.endTurn();
      }
      // Remove from active players
      const playerIndex = this.playersInHand.indexOf(client.sessionId);
      if (playerIndex > -1) {
        this.playersInHand.splice(playerIndex, 1);
      }
    }
    
    // If only one player remains, they win
    if (this.playersInHand.length === 1 && this.state.roundStarted) {
      this.actions.endRound([this.playersInHand[0]], "Gana por fold");
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
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
    if (this.turnTimeout) clearTimeout(this.turnTimeout);
  }

}
