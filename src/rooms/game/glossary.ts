/**
 * glossary.ts
 *
 * Canonical source of truth for the Chiribito deck and its vocabulary.
 *
 * The Spanish deck is 28 cards: 4 suits × 7 ranks.
 *   Suits: Oros, Copas, Espadas, Bastos
 *   Ranks: 5, 6, 7, Sota (10), Caballo (11), Rey (12), As (1)
 *
 * Equivalence with the French deck (used in international poker
 * variants of synthetic poker):
 *   5  ↔ 8        Sota    ↔ J  (Jack)
 *   6  ↔ 9        Caballo ↔ Q  (Queen)
 *   7  ↔ 10       Rey     ↔ K  (King)
 *                 As      ↔ A  (Ace)
 *
 * The "Perla" — Sota + 7 same suit (a.k.a. J + 10 suited in French) —
 * is the strongest hand: the only hole-card combo that completes every
 * possible straight.
 *
 * Card IDs in code/state are encoded as "<rank><suit>" with single-letter
 * suit codes:
 *   "10O" = Sota de Oros
 *   "7C"  = 7 de Copas
 *   "1B"  = As de Bastos
 *   "11E" = Caballo de Espadas
 *
 * Suits use the legacy single-letter codes (O / C / E / B) for backward
 * compatibility with persisted assets and tests. Ranks are kept numeric
 * so the game engine can sort and compare without locale.
 */

// ─────────────────────────────────────────────────────────────────────
// Suits
// ─────────────────────────────────────────────────────────────────────

export const SUIT_CODES = ["O", "C", "E", "B"] as const;
export type SuitCode = (typeof SUIT_CODES)[number];

export const SUIT_NAMES_ES: Record<SuitCode, string> = {
  O: "Oros",
  C: "Copas",
  E: "Espadas",
  B: "Bastos"
};

export const SUIT_NAMES_EN: Record<SuitCode, string> = {
  O: "Coins",
  C: "Cups",
  E: "Swords",
  B: "Clubs"
};

// ─────────────────────────────────────────────────────────────────────
// Ranks
// ─────────────────────────────────────────────────────────────────────

/** Numeric rank codes used in card IDs. Ordered from low to high. */
export const RANK_CODES = ["5", "6", "7", "10", "11", "12", "1"] as const;
export type RankCode = (typeof RANK_CODES)[number];

/** Strength order — lower index = lower value. As is always the highest. */
export const RANK_ORDER: Readonly<Record<RankCode, number>> = {
  "5": 0,
  "6": 1,
  "7": 2,
  "10": 3, // Sota
  "11": 4, // Caballo
  "12": 5, // Rey
  "1": 6   // As
};

export const RANK_NAMES_ES: Record<RankCode, string> = {
  "5": "5",
  "6": "6",
  "7": "7",
  "10": "Sota",
  "11": "Caballo",
  "12": "Rey",
  "1": "As"
};

/** Equivalence to the French deck rank. */
export const RANK_TO_FRENCH: Record<RankCode, string> = {
  "5": "8",
  "6": "9",
  "7": "10",
  "10": "J", // Jack
  "11": "Q", // Queen
  "12": "K", // King
  "1": "A"   // Ace
};

// ─────────────────────────────────────────────────────────────────────
// The Perla — strongest hole-card combination
// ─────────────────────────────────────────────────────────────────────

/** The two ranks that form the Perla when held in the same suit. */
export const PERLA_RANKS = ["10", "7"] as const; // Sota + 7 (J + 10 in French)

// ─────────────────────────────────────────────────────────────────────
// Game phases — Chiribito has 6 betting streets, NOT 4 (no flop/turn/river).
// ─────────────────────────────────────────────────────────────────────

/**
 * Phase sequence:
 *   WAITING  — no hand in progress; waiting for `startGame`.
 *   PREFLOP  — hole cards dealt, no community cards revealed, first betting round.
 *   CARD_1   — first community card revealed, second betting round.
 *   CARD_2   — second community card revealed, third betting round.
 *   CARD_3   — third community card revealed, fourth betting round.
 *   CARD_4   — fourth community card revealed, fifth betting round.
 *   CARD_5   — fifth community card revealed, sixth betting round → showdown.
 *
 * Six betting rounds total — that's the Chiribito spec. Community cards
 * are revealed one at a time (never as flop / turn / river).
 */
export const PHASES = {
  WAITING: "waiting",
  PREFLOP: "preflop",
  CARD_1:  "card1",
  CARD_2:  "card2",
  CARD_3:  "card3",
  CARD_4:  "card4",
  CARD_5:  "card5"
} as const;

export type GamePhase = (typeof PHASES)[keyof typeof PHASES];

/** Returns the phase identifier for the N-th community card revealed (1-5). */
export function communityCardPhase(cardNumber: number): GamePhase {
  switch (cardNumber) {
    case 1: return PHASES.CARD_1;
    case 2: return PHASES.CARD_2;
    case 3: return PHASES.CARD_3;
    case 4: return PHASES.CARD_4;
    case 5: return PHASES.CARD_5;
    default:
      throw new Error(`Invalid community card number: ${cardNumber} (expected 1-5)`);
  }
}

/** Number of community cards revealed in total during a complete hand. */
export const TOTAL_COMMUNITY_CARDS = 5;

/** Number of hole cards dealt to each player at the start of a hand. */
export const HOLE_CARDS_PER_PLAYER = 2;

/** Number of betting rounds in a complete Chiribito hand. */
export const TOTAL_BETTING_ROUNDS = 6;

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

export interface ParsedCard {
  rank: RankCode;
  suit: SuitCode;
}

export function parseCard(card: string): ParsedCard {
  const suit = card.slice(-1) as SuitCode;
  const rank = card.slice(0, -1) as RankCode;
  return { rank, suit };
}

export function cardName(card: string): string {
  const { rank, suit } = parseCard(card);
  return `${RANK_NAMES_ES[rank]} de ${SUIT_NAMES_ES[suit]}`;
}

export function buildDeck(): string[] {
  const deck: string[] = [];
  for (const suit of SUIT_CODES) {
    for (const rank of RANK_CODES) {
      deck.push(`${rank}${suit}`);
    }
  }
  return deck;
}
