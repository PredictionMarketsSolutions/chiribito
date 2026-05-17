import { Schema, MapSchema, ArraySchema, type, view } from "@colyseus/schema";
import { randomInt } from "crypto";
import { buildDeck } from "../game/glossary";

/**
 * Valores válidos de estado del jugador. Solo el servidor puede asignarlos (nunca desde mensajes del cliente).
 * Seguridad: no existe onMessage ni API que permita al cliente cambiar playerStatus.
 */
export const PLAYER_STATUS = {
  SEATED: "seated",
  IN_HAND: "in_hand",
} as const;
export type PlayerStatusValue = (typeof PLAYER_STATUS)[keyof typeof PLAYER_STATUS];

const DEFAULT_PLAYER_STATUS: PlayerStatusValue = PLAYER_STATUS.SEATED;

export class Player extends Schema {
  @type("string") sessionId: string;
  @type("string") name: string = "";
  /** Solo visible para el cliente que tiene este Player en su StateView (cartas privadas). */
  @view() @type(["string"]) hand: ArraySchema<string> = new ArraySchema<string>();
  @type("number") chips: number = 1000;
  @type("number") currentBet: number = 0;
  @type("boolean") isFolded: boolean = false;
  @type("number") seatIndex: number = -1;
  /** Estado dentro de la sala. Solo el servidor lo actualiza (join → seated, deal hand → in_hand, end round → seated). */
  @type("string") playerStatus: string = DEFAULT_PLAYER_STATUS;

  constructor(sessionId: string) {
    super();
    this.sessionId = sessionId;
  }
}

export class MesaState extends Schema {
  @type({ map: Player }) users = new MapSchema<Player>();
  @type(["string"]) communityCards: ArraySchema<string> = new ArraySchema<string>();
  @type("number") pot: number = 0;
  @type("number") currentBet: number = 0;
  @type("string") currentTurn: string = "";
  @type("number") dealerIndex: number = 0;
  @type("boolean") roundStarted: boolean = false;
  @type("string") phase: string = "waiting";  // waiting, preflop, flop, turn, river
  @type("string") lastRaiser: string = "";

  // Deck lives server-side only. Never decorated with @type so it is never
  // serialized to clients — otherwise any client could read the upcoming cards.
  private deck: string[] = [];

  constructor() {
    super();
    this.resetDeck();
  }

  resetDeck() {
    // Canonical Chiribito deck — 28 cards (Spanish suits, ranks 5-6-7-Sota-Caballo-Rey-As).
    // See src/rooms/game/glossary.ts.
    this.deck = buildDeck();
    // Cryptographically-secure Fisher–Yates shuffle.
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  dealCard(): string {
    return this.deck.shift() ?? "";
  }
}
