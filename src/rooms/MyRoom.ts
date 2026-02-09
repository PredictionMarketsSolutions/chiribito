import { Room, Client } from "colyseus";
import { ArraySchema } from "@colyseus/schema";
import { MyRoomState, Player } from "./schema/MyRoomState";
import * as jwt from "jsonwebtoken";

const TURN_TIMEOUT = 12000; // 12 seconds per turn
const SMALL_BLIND = 10;
const BIG_BLIND = 20;

export class MyRoom extends Room<MyRoomState> {
  maxClients = 6;
  private turnTimeout: NodeJS.Timeout | null = null;
  private dealerIndex: number = 0;
  private currentPlayerIndex: number = 0;
  private playersInHand: string[] = [];
  private playersActedThisRound: Set<string> = new Set();
  private playersAllIn: Set<string> = new Set();

  onCreate(options: any) {
    this.setState(new MyRoomState());
    this.autoDispose = false;

    // Game messages
    this.onMessage("startGame", (client) => this.handleStartGame(client));
    this.onMessage("bet", (client, amount: number) => this.handleBet(client, amount));
    this.onMessage("call", (client) => this.handleCall(client));
    this.onMessage("check", (client) => this.handleCheck(client));
    this.onMessage("fold", (client) => this.handleFold(client));
    this.onMessage("raise", (client, amount: number) => this.handleRaise(client, amount));
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
    console.log(client.sessionId, "joined!");
    const player = new Player(client.sessionId);
    player.name = options.name || options.authUser?.username || `Player-${client.sessionId.slice(0, 4)}`;
    player.chips = options.chips || 1000;
    this.state.users.set(client.sessionId, player);

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
    console.log(client.sessionId, "left!");
    const player = this.state.users.get(client.sessionId);
    if (player) {
      player.isFolded = true;
      // If it's their turn, end their turn
      if (this.state.currentTurn === client.sessionId) {
        this.endTurn();
      }
      // Remove from active players
      const playerIndex = this.playersInHand.indexOf(client.sessionId);
      if (playerIndex > -1) {
        this.playersInHand.splice(playerIndex, 1);
      }
    }
    
    // If only one player remains, they win
    if (this.playersInHand.length === 1 && this.state.roundStarted) {
      this.endRound([this.playersInHand[0]]);
    }
  }

  private handleStartGame(client: Client) {
    if (this.state.users.size < 2) {
      client.send("error", { message: "At least 2 players required to start" });
      return;
    }

    if (this.state.roundStarted) {
      client.send("error", { message: "Game already in progress" });
      return;
    }

    this.startNewHand();
  }

  private startNewHand() {
    // Reset game state
    this.state.resetDeck();
    this.state.communityCards.clear();
    this.state.pot = 0;
    this.state.currentBet = 0;
    this.state.lastRaiser = "";
    this.playersInHand = [];
    this.playersActedThisRound.clear();
    this.playersAllIn.clear();

    // Set up players for new hand
    const players = Array.from(this.state.users.values()).filter(p => p.chips > 0);
    players.forEach(player => {
      player.hand.clear();
      player.currentBet = 0;
      player.isFolded = false;
      // Deal two cards to each player
      player.hand.push(this.state.dealCard(), this.state.dealCard());
      this.playersInHand.push(player.sessionId);
    });

    // Set dealer and blinds
    this.dealerIndex = (this.dealerIndex + 1) % players.length;
    this.state.roundStarted = true;
    this.state.phase = "preflop";

    // Post blinds
    this.postBlinds();
    
    // Start first betting round
    this.startBettingRound();
  }

  private postBlinds() {
    const players = this.playersInHand.map(id => this.state.users.get(id)!);
    const smallBlindPos = (this.dealerIndex + 1) % players.length;
    const bigBlindPos = (this.dealerIndex + 2) % players.length;
    
    const smallBlindPlayer = players[smallBlindPos];
    const bigBlindPlayer = players[bigBlindPos];
    
    // Post small blind
    const smallBlind = Math.min(SMALL_BLIND, smallBlindPlayer.chips);
    smallBlindPlayer.chips -= smallBlind;
    smallBlindPlayer.currentBet = smallBlind;
    this.state.pot += smallBlind;
    
    // Post big blind
    const bigBlind = Math.min(BIG_BLIND, bigBlindPlayer.chips);
    bigBlindPlayer.chips -= bigBlind;
    bigBlindPlayer.currentBet = bigBlind;
    this.state.pot += bigBlind;
    
    this.state.currentBet = bigBlind;
    
    // Set first player to act (UTG)
    this.currentPlayerIndex = (bigBlindPos + 1) % players.length;
    this.state.currentTurn = players[this.currentPlayerIndex].sessionId;
    
    this.broadcast("blindsPosted", {
      smallBlind: { playerId: smallBlindPlayer.sessionId, amount: smallBlind },
      bigBlind: { playerId: bigBlindPlayer.sessionId, amount: bigBlind },
      currentBet: this.state.currentBet,
      pot: this.state.pot
    });
    
    this.startTurnTimer();
  }

  private startBettingRound() {
    this.playersActedThisRound.clear();
    this.broadcast("bettingRoundStarted", {
      phase: this.state.phase,
      currentTurn: this.state.currentTurn,
      currentBet: this.state.currentBet,
      pot: this.state.pot
    });
  }

  private handleBet(client: Client, amount: number) {
    if (client.sessionId !== this.state.currentTurn) return;
    
    const player = this.state.users.get(client.sessionId);
    if (!player || player.isFolded) return;
    
    const minRaise = this.state.currentBet * 2;
    if (amount < this.state.currentBet) {
      client.send("error", { message: `Bet must be at least ${this.state.currentBet}` });
      return;
    }
    
    const chipsToCall = amount - player.currentBet;
    if (chipsToCall > player.chips) {
      client.send("error", { message: "Not enough chips" });
      return;
    }
    
    // Place the bet
    player.chips -= chipsToCall;
    player.currentBet += chipsToCall;
    this.state.pot += chipsToCall;
    
    if (amount > this.state.currentBet) {
      this.state.currentBet = amount;
      this.state.lastRaiser = player.sessionId;
      this.playersActedThisRound.clear(); // Reset action for other players
    }
    
    this.playersActedThisRound.add(player.sessionId);
    
    this.broadcast("playerAction", {
      playerId: player.sessionId,
      action: amount > player.currentBet ? "raise" : "bet",
      amount,
      pot: this.state.pot
    });
    
    this.endTurn();
  }

  private handleCall(client: Client) {
    if (client.sessionId !== this.state.currentTurn) return;
    
    const player = this.state.users.get(client.sessionId);
    if (!player || player.isFolded) return;
    
    const chipsToCall = this.state.currentBet - player.currentBet;
    if (chipsToCall <= 0) {
      this.handleCheck(client);
      return;
    }
    
    const actualCall = Math.min(chipsToCall, player.chips);
    player.chips -= actualCall;
    player.currentBet += actualCall;
    this.state.pot += actualCall;
    
    this.playersActedThisRound.add(player.sessionId);
    
    this.broadcast("playerAction", {
      playerId: player.sessionId,
      action: actualCall < chipsToCall ? "allIn" : "call",
      amount: actualCall,
      pot: this.state.pot
    });
    
    if (actualCall < chipsToCall) {
      this.playersAllIn.add(player.sessionId);
    }
    
    this.endTurn();
  }

  private handleCheck(client: Client) {
    if (client.sessionId !== this.state.currentTurn) return;
    
    const player = this.state.users.get(client.sessionId);
    if (!player || player.isFolded) return;
    
    if (player.currentBet < this.state.currentBet) {
      client.send("error", { message: "Cannot check, you need to call or fold" });
      return;
    }
    
    this.broadcast("playerAction", {
      playerId: player.sessionId,
      action: "check",
      pot: this.state.pot
    });
    
    this.playersActedThisRound.add(player.sessionId);
    this.endTurn();
  }

  private handleRaise(client: Client, amount: number) {
    this.handleBet(client, this.state.currentBet + amount);
  }

  private handleFold(client: Client) {
    if (client.sessionId !== this.state.currentTurn) return;
    
    const player = this.state.users.get(client.sessionId);
    if (!player || player.isFolded) return;
    
    player.isFolded = true;
    this.playersInHand = this.playersInHand.filter(id => id !== client.sessionId);
    
    this.broadcast("playerAction", {
      playerId: player.sessionId,
      action: "fold"
    });
    
    // If only one player remains, they win
    if (this.playersInHand.length === 1) {
      this.endRound([this.playersInHand[0]]);
      return;
    }
    
    this.endTurn();
  }

  private endTurn() {
    if (this.turnTimeout) clearTimeout(this.turnTimeout);
    
    // Check if betting round is complete
    const activePlayers = this.playersInHand
      .filter(id => !this.state.users.get(id)!.isFolded)
      .filter(id => !this.playersAllIn.has(id));
    
    const allActed = activePlayers.every(id => this.playersActedThisRound.has(id));
    
    if (allActed && activePlayers.length > 0) {
      this.proceedToNextPhase();
      return;
    }
    
    // Move to next player
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.playersInHand.length;
      const nextPlayerId = this.playersInHand[this.currentPlayerIndex];
      const nextPlayer = this.state.users.get(nextPlayerId);
      
      if (!nextPlayer || nextPlayer.isFolded) continue;
      
      this.state.currentTurn = nextPlayerId;
      this.startTurnTimer();
      return;
      
    } while (true);
  }

  private proceedToNextPhase() {
    // Reset player bets for new round
    this.state.users.forEach(player => {
      player.currentBet = 0;
    });
    this.state.currentBet = 0;
    
    // Deal community cards based on phase
    switch (this.state.phase) {
      case "preflop":
        this.state.phase = "flop";
        // Deal flop (3 cards)
        this.state.communityCards.push(
          this.state.dealCard(),
          this.state.dealCard(),
          this.state.dealCard()
        );
        break;
        
      case "flop":
        this.state.phase = "turn";
        // Deal turn (1 card)
        this.state.communityCards.push(this.state.dealCard());
        break;
        
      case "turn":
        this.state.phase = "river";
        // Deal river (1 card)
        this.state.communityCards.push(this.state.dealCard());
        break;
        
      case "river":
        // Showdown
        this.endRound(this.determineWinners());
        return;
    }
    
    // Start next betting round
    this.currentPlayerIndex = this.playersInHand.findIndex(id => 
      !this.state.users.get(id)!.isFolded
    );
    
    if (this.currentPlayerIndex === -1) {
      // Shouldn't happen, but just in case
      this.endRound([]);
      return;
    }
    
    this.state.currentTurn = this.playersInHand[this.currentPlayerIndex];
    this.startBettingRound();
    this.startTurnTimer();
  }

  private determineWinners(): string[] {
    // This is a simplified version - you'll want to implement proper hand evaluation
    // For now, just return players who haven't folded
    return this.playersInHand.filter(id => !this.state.users.get(id)!.isFolded);
  }

  private endRound(winners: string[]) {
    if (this.turnTimeout) clearTimeout(this.turnTimeout);
    
    // Calculate and distribute winnings
    const winnersList = winners.map(id => ({
      playerId: id,
      amount: Math.floor(this.state.pot / winners.length)
    }));
    
    // Update player chips
    winnersList.forEach(winner => {
      const player = this.state.users.get(winner.playerId);
      if (player) player.chips += winner.amount;
    });
    
    // Broadcast results
    this.broadcast("roundEnded", {
      winners: winnersList,
      communityCards: this.state.communityCards.toArray(),
      playerHands: Object.fromEntries(
        this.playersInHand
          .filter(id => !this.state.users.get(id)!.isFolded)
          .map(id => [id, this.state.users.get(id)!.hand.toArray()])
      )
    });
    
    // Start new hand after a delay
    setTimeout(() => {
      if (this.state.users.size >= 2) {
        this.startNewHand();
      } else {
        this.state.roundStarted = false;
      }
    }, 10000); // 10 seconds before next hand
  }

  private startTurnTimer() {
    if (this.turnTimeout) clearTimeout(this.turnTimeout);
    
    this.turnTimeout = setTimeout(() => {
      // Auto-fold if time runs out
      const player = this.state.users.get(this.state.currentTurn);
      if (player && !player.isFolded) {
        this.handleFold({ sessionId: player.sessionId } as Client);
      }
    }, TURN_TIMEOUT);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
    if (this.turnTimeout) clearTimeout(this.turnTimeout);
  }

  startGame() {
    console.log("Game started!");
    this.state.roundStarted = true;
    this.state.pot = 0;
    this.state.communityCards.clear();
    this.state.resetDeck();
    this.state.phase = "preflop";  // Make sure to set initial phase

    // Deal 2 cards to each player
    this.state.users.forEach(player => {
      player.hand = new ArraySchema<string>(
        this.state.dealCard(),
        this.state.dealCard()
      );
      player.currentBet = 0;
      player.isFolded = false;
    });

    // Select first player to act
    const firstPlayer = Array.from(this.state.users.values())[0];
    if (firstPlayer) {
      this.state.currentTurn = firstPlayer.sessionId;
      this.state.lastRaiser = firstPlayer.sessionId; // Track last raiser for betting rounds
    }
  }

  // Helper method to advance to the next player's turn
  private advanceTurn() {
    const activePlayers = this.playersInHand
      .filter(id => !this.state.users.get(id)!.isFolded)
      .filter(id => !this.playersAllIn.has(id));

    // If we've gone full circle and it's back to the last raiser, proceed to next phase
    if (this.state.currentTurn === this.state.lastRaiser) {
      this.proceedToNextPhase();
      return;
    }

    // Find next active player
    let nextPlayerIndex = (this.currentPlayerIndex + 1) % this.playersInHand.length;
    let nextPlayerId = this.playersInHand[nextPlayerIndex];
    
    // Find next active player who hasn't folded and isn't all-in
    while (activePlayers.includes(nextPlayerId) === false && activePlayers.length > 0) {
      nextPlayerIndex = (nextPlayerIndex + 1) % this.playersInHand.length;
      nextPlayerId = this.playersInHand[nextPlayerIndex];
      
      // Prevent infinite loop
      if (nextPlayerIndex === this.currentPlayerIndex) {
        break;
      }
    }
    
    this.currentPlayerIndex = nextPlayerIndex;
    this.state.currentTurn = nextPlayerId;
    this.startTurnTimer();
  }
  
  // Method to handle the end of a hand
  private finishHand() {
    // Determine winners and distribute the pot
    const activePlayers = Array.from(this.state.users.values()).filter(p => !p.isFolded);
    
    if (activePlayers.length === 1) {
      // Single winner takes the pot
      const winner = activePlayers[0];
      winner.chips += this.state.pot;
      this.broadcast("handComplete", {
        winners: [winner.sessionId],
        pot: this.state.pot,
        handRank: "Wins by default"
      });
    } else {
      // In a real game, you'd evaluate hands here
      // For now, just split the pot among active players
      const share = Math.floor(this.state.pot / activePlayers.length);
      activePlayers.forEach(player => player.chips += share);
      
      this.broadcast("handComplete", {
        winners: activePlayers.map(p => p.sessionId),
        pot: this.state.pot,
        handRank: "Split pot"
      });
    }
    
    // Reset game state for next hand
    this.state.pot = 0;
    this.state.communityCards.clear();
    this.state.currentBet = 0;
    this.state.lastRaiser = "";
    this.state.phase = "waiting";
    this.state.roundStarted = false;
    
    // Reset player states
    this.state.users.forEach(player => {
      player.hand.clear();
      player.currentBet = 0;
      player.isFolded = false;
    });
    
    // Start a new hand after a delay if there are enough players
    setTimeout(() => {
      const activePlayers = Array.from(this.state.users.values()).filter(p => p.chips > 0);
      if (activePlayers.length >= 2) {
        this.startNewHand();
      }
    }, 5000);
  }
}
