import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") sessionId: string;
  @type("string") name: string = "";
  @type(["string"]) hand: ArraySchema<string> = new ArraySchema<string>();
  @type("number") chips: number = 1000;
  @type("number") currentBet: number = 0;
  @type("boolean") isFolded: boolean = false;

  constructor(sessionId: string) {
    super();
    this.sessionId = sessionId;
  }
}

export class MyRoomState extends Schema {
  @type({ map: Player }) users = new MapSchema<Player>();
  @type(["string"]) deck: ArraySchema<string> = new ArraySchema<string>();
  @type(["string"]) communityCards: ArraySchema<string> = new ArraySchema<string>();
  @type("number") pot: number = 0;
  @type("number") currentBet: number = 0;
  @type("string") currentTurn: string = "";
  @type("boolean") roundStarted: boolean = false;
  @type("string") phase: string = "waiting";  // waiting, preflop, flop, turn, river
  @type("string") lastRaiser: string = "";

  constructor() {
    super();
    this.resetDeck();
  }

  resetDeck() {
    const suits = ["H", "D", "C", "S"];
    const ranks = ["8", "9", "10", "J", "Q", "K", "A"];
    this.deck.clear();
    for (const suit of suits) {
      for (const rank of ranks) {
        this.deck.push(`${rank}${suit}`);
      }
    }
    // Shuffle deck
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  dealCard(): string {
    return this.deck.shift() || "";
  }
}
