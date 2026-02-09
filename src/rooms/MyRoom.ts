import { Room, Client } from "colyseus";
import { MyRoomState, Player } from "./schema/MyRoomState";
import * as jwt from "jsonwebtoken";
import { GameActions } from "./game/GameActions";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 6;
  public turnTimeout: NodeJS.Timeout | null = null;
  public dealerIndex: number = 0;
  public currentPlayerIndex: number = 0;
  public playersInHand: string[] = [];
  public playersActedThisRound: Set<string> = new Set();
  public playersAllIn: Set<string> = new Set();
  private actions!: GameActions;

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
    const token = options?.token || options?.auth?.token ||
      (options?.headers && typeof options.headers.authorization === 'string'
        ? options.headers.authorization.split(' ')[1]
        : undefined);

    if (!token) {
      console.warn("requestJoin: no token provided");
      return false;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("requestJoin: JWT_SECRET not set on server");
      return false;
    }

    try {
      const decoded = jwt.verify(token, secret) as any;
      // Attach decoded payload to options so onJoin can use it
      options.authUser = decoded;
      return true;
    } catch (err: any) {
      console.warn("requestJoin: token verification failed", err && err.message ? err.message : err);
      return false;
    }
  }

  onJoin(client: Client, options: any) {
    const player = new Player(client.sessionId);
    player.name = options.name || options.authUser?.username || `Player-${client.sessionId.slice(0, 4)}`;
    player.chips = options.chips || 1000;
    this.state.users.set(client.sessionId, player);

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
      this.actions.endRound([this.playersInHand[0]]);
    }
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
    if (this.turnTimeout) clearTimeout(this.turnTimeout);
  }

}
