/**
 * BestHand.ts
 * Pure utility for computing the best 5-card hand from hole + community cards.
 *
 * Shared between WinnerDeterminator (showdown) and BotStrategy (hand evaluation)
 * so the two evaluation paths can never diverge (CON-shared-best-hand-util).
 *
 * Rules:
 *   1. Perla (Sota + 7 same suit) is the strongest combination — category 9.
 *      Detected from hole cards alone, before any community combo is evaluated.
 *   2. Returns null when community.length < 3 (CardEvaluator.getCommunityCombos
 *      returns [] for < 3 cards, so no 5-card hand is constructible).
 *   3. Otherwise iterates all 3-card community combos, evaluates each 5-card
 *      hand (hole + combo) via CardEvaluator, and returns the best result.
 *
 * Pure static class — zero constructor params, no instance state,
 * no @colyseus/core import, no process.env reads.
 */

import { CardEvaluator, type HandScore, type CardRankOrder } from "./CardEvaluator";

export interface BestHandResult {
  score: HandScore;
  name: string;
}

export class BestHand {
  /**
   * Returns the best 5-card hand achievable from hole + community cards,
   * including the Perla special case (category 9, early-exit from evaluation).
   *
   * Returns null if community.length < 3 (no 3-card combos exist).
   *
   * @param hole        2 hole cards in canonical "<rank><suit>" format (e.g. "10O", "7C")
   * @param community   0–5 community cards in the same format
   * @param rankOrder   Canonical Chiribito rank order from glossary.RANK_ORDER
   */
  static bestHandOfN(
    hole: string[],
    community: string[],
    rankOrder: CardRankOrder
  ): BestHandResult | null {
    // (1) Perla early-exit: detected from hole cards only, before any combo loop.
    //     Result shape matches WinnerDeterminator exactly: { category: 9, tiebreaker: [] }.
    if (CardEvaluator.isPerla(hole)) {
      return { score: { category: 9, tiebreaker: [] }, name: "Perla" };
    }

    // (2) Community combo check: returns [] for < 3 cards.
    const combos = CardEvaluator.getCommunityCombos(community);
    if (combos.length === 0) return null;

    // (3) Iterate combos, keep the best 5-card hand.
    //     Defensive initialization (strictNullChecks: false).
    let best: HandScore | null = null;
    let bestName = "";

    for (const combo of combos) {
      const score = CardEvaluator.evaluateHand([...hole, ...combo], rankOrder);
      if (!best || CardEvaluator.compareHands(score, best) > 0) {
        best = score;
        bestName = CardEvaluator.getHandName(score.category);
      }
    }

    return best ? { score: best, name: bestName } : null;
  }
}
