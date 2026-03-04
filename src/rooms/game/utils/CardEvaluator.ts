/**
 * CardEvaluator.ts
 * Pure functions for poker hand evaluation
 */

export type CardRankOrder = Record<string, number>;

export interface ParsedCard {
  rank: string;
  suit: string;
}

export interface HandScore {
  category: number;
  tiebreaker: number[];
}

export interface StraightResult {
  isStraight: boolean;
  high: number;
}

export class CardEvaluator {
  static parseCard(card: string): ParsedCard {
    const suit = card.slice(-1);
    const rank = card.slice(0, -1);
    return { rank, suit };
  }

  static isPerla(hole: string[]): boolean {
    if (hole.length < 2) return false;
    const first = CardEvaluator.parseCard(hole[0]);
    const second = CardEvaluator.parseCard(hole[1]);
    const sameSuit = first.suit === second.suit;
    const ranks = [first.rank, second.rank].sort();
    return sameSuit && ranks[0] === "10" && ranks[1] === "11";
  }

  static evaluateHand(cards: string[], rankOrder: CardRankOrder): HandScore {
    const parsed = cards.map(card => CardEvaluator.parseCard(card));
    const ranks = parsed.map(card => card.rank);
    const suits = parsed.map(card => card.suit);
    const rankCounts = new Map<string, number>();
    
    ranks.forEach(rank => {
      rankCounts.set(rank, (rankCounts.get(rank) ?? 0) + 1);
    });

    const flush = suits.every(suit => suit === suits[0]);
    const straightResult = CardEvaluator.isStraight(ranks, rankOrder);

    if (flush && straightResult.isStraight) {
      return { category: 8, tiebreaker: [straightResult.high] };
    }

    const countEntries = Array.from(rankCounts.entries())
      .map(([rank, count]) => ({ rank, count, value: rankOrder[rank] ?? 0 }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.value - a.value;
      });

    if (countEntries[0].count === 4) {
      const kicker = countEntries.find(entry => entry.count === 1);
      return {
        category: 7,
        tiebreaker: [countEntries[0].value, kicker ? kicker.value : 0]
      };
    }

    if (flush) {
      const sorted = ranks
        .map(rank => rankOrder[rank] ?? 0)
        .sort((a, b) => b - a);
      return { category: 6, tiebreaker: sorted };
    }

    if (countEntries[0].count === 3 && countEntries[1]?.count === 2) {
      return {
        category: 5,
        tiebreaker: [countEntries[0].value, countEntries[1].value]
      };
    }

    if (straightResult.isStraight) {
      return { category: 4, tiebreaker: [straightResult.high] };
    }

    if (countEntries[0].count === 3) {
      const kickers = countEntries
        .filter(entry => entry.count === 1)
        .map(entry => entry.value)
        .sort((a, b) => b - a);
      return {
        category: 3,
        tiebreaker: [countEntries[0].value, ...kickers]
      };
    }

    if (countEntries[0].count === 2 && countEntries[1]?.count === 2) {
      const pairValues = countEntries
        .filter(entry => entry.count === 2)
        .map(entry => entry.value)
        .sort((a, b) => b - a);
      const kicker = countEntries.find(entry => entry.count === 1);
      return {
        category: 2,
        tiebreaker: [...pairValues, kicker ? kicker.value : 0]
      };
    }

    if (countEntries[0].count === 2) {
      const kickers = countEntries
        .filter(entry => entry.count === 1)
        .map(entry => entry.value)
        .sort((a, b) => b - a);
      return {
        category: 1,
        tiebreaker: [countEntries[0].value, ...kickers]
      };
    }

    const highCards = ranks
      .map(rank => rankOrder[rank] ?? 0)
      .sort((a, b) => b - a);
    return { category: 0, tiebreaker: highCards };
  }

  static isStraight(ranks: string[], rankOrder: CardRankOrder): StraightResult {
    const values = Array.from(new Set(ranks.map(rank => rankOrder[rank] ?? 0)))
      .sort((a, b) => a - b);
    
    if (values.length !== 5) {
      return { isStraight: false, high: 0 };
    }

    const isConsecutive = values.every((value, index) => 
      index === 0 || value === values[index - 1] + 1
    );
    
    if (!isConsecutive) {
      return { isStraight: false, high: 0 };
    }

    return { isStraight: true, high: values[values.length - 1] };
  }

  static compareHands(a: HandScore, b: HandScore): number {
    if (a.category !== b.category) {
      return a.category > b.category ? 1 : -1;
    }

    const maxLen = Math.max(a.tiebreaker.length, b.tiebreaker.length);
    for (let i = 0; i < maxLen; i += 1) {
      const left = a.tiebreaker[i] ?? 0;
      const right = b.tiebreaker[i] ?? 0;
      if (left !== right) {
        return left > right ? 1 : -1;
      }
    }
    return 0;
  }

  static getHandName(category: number): string {
    switch (category) {
      case 9:
        return "Perla";
      case 8:
        return "Escalera de color";
      case 7:
        return "Poker";
      case 6:
        return "Color";
      case 5:
        return "Full";
      case 4:
        return "Escalera";
      case 3:
        return "Trio";
      case 2:
        return "Doble pareja";
      case 1:
        return "Pareja";
      default:
        return "Carta alta";
    }
  }

  static getCommunityCombos(community: string[]): string[][] {
    const combos: string[][] = [];
    for (let i = 0; i < community.length - 2; i += 1) {
      for (let j = i + 1; j < community.length - 1; j += 1) {
        for (let k = j + 1; k < community.length; k += 1) {
          combos.push([community[i], community[j], community[k]]);
        }
      }
    }
    return combos;
  }
}
