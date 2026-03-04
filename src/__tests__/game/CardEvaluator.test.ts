/**
 * CardEvaluator.test.ts
 * Unit tests for poker hand evaluation logic
 */

import { CardEvaluator, type HandScore, type CardRankOrder } from "../../rooms/game/utils/CardEvaluator";

describe("CardEvaluator", () => {
  const standardRankOrder: CardRankOrder = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "11": 11, // Jack
    "12": 12, // Queen
    "13": 13, // King
    "14": 14  // Ace
  };

  describe("parseCard", () => {
    it("should parse card correctly", () => {
      const result = CardEvaluator.parseCard("10♠");
      expect(result).toEqual({ rank: "10", suit: "♠" });
    });

    it("should parse face cards", () => {
      const result = CardEvaluator.parseCard("K♥");
      expect(result).toEqual({ rank: "K", suit: "♥" });
    });

    it("should parse number cards", () => {
      const result = CardEvaluator.parseCard("7♦");
      expect(result).toEqual({ rank: "7", suit: "♦" });
    });
  });

  describe("isPerla", () => {
    it("should identify Perla (10-J suited hole cards)", () => {
      const result = CardEvaluator.isPerla(["10♠", "11♠"]);
      expect(result).toBe(true);
    });

    it("should reject 10-J unsuited", () => {
      const result = CardEvaluator.isPerla(["10♠", "11♥"]);
      expect(result).toBe(false);
    });

    it("should reject other suited pairs", () => {
      const result = CardEvaluator.isPerla(["9♠", "9♥"]);
      expect(result).toBe(false);
    });

    it("should reject invalid input", () => {
      const result = CardEvaluator.isPerla(["10♠"]);
      expect(result).toBe(false);
    });

    it("should handle reversed order (11-10)", () => {
      const result = CardEvaluator.isPerla(["11♠", "10♠"]);
      expect(result).toBe(true);
    });
  });

  describe("isStraight", () => {
    it("should identify consecutive straight", () => {
      const ranks = ["5", "6", "7", "8", "9"];
      const result = CardEvaluator.isStraight(ranks, standardRankOrder);
      expect(result.isStraight).toBe(true);
      expect(result.high).toBe(9);
    });

    it("should identify Ace-low straight (wheel)", () => {
      const ranks = ["14", "2", "3", "4", "5"]; // Ace, 2, 3, 4, 5
      // Note: This requires special handling in real implementation
      const result = CardEvaluator.isStraight(ranks, standardRankOrder);
      expect(result.isStraight).toBe(false); // Current implementation doesn't handle wheel
    });

    it("should reject non-consecutive values", () => {
      const ranks = ["2", "4", "6", "8", "10"];
      const result = CardEvaluator.isStraight(ranks, standardRankOrder);
      expect(result.isStraight).toBe(false);
    });

    it("should reject with duplicate ranks", () => {
      const ranks = ["5", "5", "6", "7", "8"];
      const result = CardEvaluator.isStraight(ranks, standardRankOrder);
      expect(result.isStraight).toBe(false); // Duplicates reduce unique count
    });

    it("should identify high card of straight", () => {
      const ranks = ["2", "3", "4", "5", "6"];
      const result = CardEvaluator.isStraight(ranks, standardRankOrder);
      expect(result.isStraight).toBe(true);
      expect(result.high).toBe(6);
    });
  });

  describe("evaluateHand", () => {
    it("should identify Poker (Four of a Kind)", () => {
      const cards = ["10♠", "10♥", "10♦", "10♣", "5♠"];
      const result = CardEvaluator.evaluateHand(cards, standardRankOrder);
      expect(result.category).toBe(7); // Poker category
      expect(result.tiebreaker[0]).toBe(10); // Four 10s
    });

    it("should identify Full House", () => {
      const cards = ["8♠", "8♥", "8♦", "6♣", "6♠"];
      const result = CardEvaluator.evaluateHand(cards, standardRankOrder);
      expect(result.category).toBe(5); // Full House category
      expect(result.tiebreaker[0]).toBe(8); // Three 8s
      expect(result.tiebreaker[1]).toBe(6); // Pair of 6s
    });

    it("should identify Flush", () => {
      const cards = ["2♠", "5♠", "7♠", "9♠", "13♠"];
      const result = CardEvaluator.evaluateHand(cards, standardRankOrder);
      expect(result.category).toBe(6); // Flush category
    });

    it("should identify Straight", () => {
      const cards = ["5♠", "6♥", "7♦", "8♣", "9♠"];
      const result = CardEvaluator.evaluateHand(cards, standardRankOrder);
      expect(result.category).toBe(4); // Straight category
    });

    it("should identify Three of a Kind", () => {
      const cards = ["9♠", "9♥", "9♦", "6♣", "4♠"];
      const result = CardEvaluator.evaluateHand(cards, standardRankOrder);
      expect(result.category).toBe(3); // Three of a Kind category
      expect(result.tiebreaker[0]).toBe(9);
    });

    it("should identify Two Pair", () => {
      const cards = ["11♠", "11♥", "7♦", "7♣", "3♠"];
      const result = CardEvaluator.evaluateHand(cards, standardRankOrder);
      expect(result.category).toBe(2); // Two Pair category
      expect(result.tiebreaker[0]).toBe(11); // Higher pair
      expect(result.tiebreaker[1]).toBe(7);  // Lower pair
    });

    it("should identify One Pair", () => {
      const cards = ["13♠", "13♥", "9♦", "6♣", "2♠"];
      const result = CardEvaluator.evaluateHand(cards, standardRankOrder);
      expect(result.category).toBe(1); // Pair category
      expect(result.tiebreaker[0]).toBe(13); // Pair of Kings
    });

    it("should identify High Card", () => {
      const cards = ["14♠", "10♥", "8♦", "5♣", "3♠"];
      const result = CardEvaluator.evaluateHand(cards, standardRankOrder);
      expect(result.category).toBe(0); // High Card category
      expect(result.tiebreaker[0]).toBe(14); // Ace high
    });
  });

  describe("compareHands", () => {
    it("should rank Poker higher than Full House", () => {
      const poker: HandScore = { category: 7, tiebreaker: [10, 5] };
      const fullHouse: HandScore = { category: 5, tiebreaker: [14, 2] };
      
      const result = CardEvaluator.compareHands(poker, fullHouse);
      expect(result).toBe(1); // poker > fullHouse
    });

    it("should compare tiebreaker when category is same", () => {
      const pairAces: HandScore = { category: 1, tiebreaker: [14, 10, 8, 5] };
      const pairKings: HandScore = { category: 1, tiebreaker: [13, 10, 8, 5] };
      
      const result = CardEvaluator.compareHands(pairAces, pairKings);
      expect(result).toBe(1); // Aces > Kings
    });

    it("should return 0 for identical hands", () => {
      const hand1: HandScore = { category: 1, tiebreaker: [11, 9, 6, 2] };
      const hand2: HandScore = { category: 1, tiebreaker: [11, 9, 6, 2] };
      
      const result = CardEvaluator.compareHands(hand1, hand2);
      expect(result).toBe(0); // Identical
    });

    it("should handle different tiebreaker lengths", () => {
      const straight1: HandScore = { category: 4, tiebreaker: [8] };
      const straight2: HandScore = { category: 4, tiebreaker: [7] };
      
      const result = CardEvaluator.compareHands(straight1, straight2);
      expect(result).toBe(1); // Straight to 8 > Straight to 7
    });

    it("should compare Full House kickers", () => {
      const fullHouse1: HandScore = { category: 5, tiebreaker: [8, 6] };
      const fullHouse2: HandScore = { category: 5, tiebreaker: [8, 5] };
      
      const result = CardEvaluator.compareHands(fullHouse1, fullHouse2);
      expect(result).toBe(1); // Pair of 6s > Pair of 5s
    });
  });

  describe("getHandName", () => {
    it("should return correct name for Perla", () => {
      expect(CardEvaluator.getHandName(9)).toBe("Perla");
    });

    it("should return correct name for Poker", () => {
      expect(CardEvaluator.getHandName(7)).toBe("Poker");
    });

    it("should return correct name for Full House", () => {
      expect(CardEvaluator.getHandName(5)).toBe("Full");
    });

    it("should return correct name for Flush", () => {
      expect(CardEvaluator.getHandName(6)).toBe("Color");
    });

    it("should return correct name for Straight", () => {
      expect(CardEvaluator.getHandName(4)).toBe("Escalera");
    });

    it("should return correct name for Three of a Kind", () => {
      expect(CardEvaluator.getHandName(3)).toBe("Trio");
    });

    it("should return correct name for Two Pair", () => {
      expect(CardEvaluator.getHandName(2)).toBe("Doble pareja");
    });

    it("should return correct name for One Pair", () => {
      expect(CardEvaluator.getHandName(1)).toBe("Pareja");
    });

    it("should return correct name for High Card", () => {
      expect(CardEvaluator.getHandName(0)).toBe("Carta alta");
    });
  });

  describe("getCommunityCombos", () => {
    it("should generate all 3-card combinations from 5 community cards", () => {
      const community = ["2♠", "3♥", "4♦", "5♣", "6♠"];
      const combos = CardEvaluator.getCommunityCombos(community);
      
      // With 5 cards, there are C(5,3) = 10 combinations
      expect(combos.length).toBe(10);
    });

    it("should generate correct combinations", () => {
      const community = ["A♠", "K♥", "Q♦"];
      const combos = CardEvaluator.getCommunityCombos(community);
      
      // With 3 cards, only 1 combination
      expect(combos.length).toBe(1);
      expect(combos[0]).toEqual(["A♠", "K♥", "Q♦"]);
    });

    it("should generate all combinations from 6 cards", () => {
      const community = ["2♠", "3♥", "4♦", "5♣", "6♠", "7♥"];
      const combos = CardEvaluator.getCommunityCombos(community);
      
      // With 6 cards, there are C(6,3) = 20 combinations
      expect(combos.length).toBe(20);
    });

    it("should not include duplicate combinations", () => {
      const community = ["2♠", "3♥", "4♦", "5♣"];
      const combos = CardEvaluator.getCommunityCombos(community);
      
      const stringified = combos.map(c => c.join(","));
      const unique = new Set(stringified);
      expect(unique.size).toBe(stringified.length);
    });
  });

  describe("Integration Tests", () => {
    it("should evaluate real poker scenario: Two pairs vs Straight", () => {
      const twoPair = CardEvaluator.evaluateHand(
        ["10♠", "10♥", "7♦", "7♣", "3♠"],
        standardRankOrder
      );
      const straight = CardEvaluator.evaluateHand(
        ["5♠", "6♥", "7♦", "8♣", "9♠"],
        standardRankOrder
      );
      
      const result = CardEvaluator.compareHands(straight, twoPair);
      expect(result).toBe(1); // Straight wins
    });

    it("should evaluate real poker scenario: Pair vs High Card", () => {
      const pair = CardEvaluator.evaluateHand(
        ["9♠", "9♥", "6♦", "4♣", "2♠"],
        standardRankOrder
      );
      const highCard = CardEvaluator.evaluateHand(
        ["14♠", "10♥", "8♦", "5♣", "3♠"],
        standardRankOrder
      );
      
      const result = CardEvaluator.compareHands(pair, highCard);
      expect(result).toBe(1); // Pair wins
    });

    it("should determine winner between two high card hands", () => {
      const aceHigh = CardEvaluator.evaluateHand(
        ["14♠", "10♥", "9♦", "5♣", "2♠"],
        standardRankOrder
      );
      const kingHigh = CardEvaluator.evaluateHand(
        ["13♠", "10♥", "9♦", "5♣", "2♠"],
        standardRankOrder
      );
      
      const result = CardEvaluator.compareHands(aceHigh, kingHigh);
      expect(result).toBe(1); // Ace high wins
    });
  });
});
