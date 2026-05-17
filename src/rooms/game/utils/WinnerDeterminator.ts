/**
 * WinnerDeterminator.ts
 * Determines round winners and calculates payouts
 */

import logger from "../../../config/logger";
import type { IGameRoom } from "../../../types/IGameRoom";
import { CardEvaluator, type CardRankOrder, type HandScore } from "./CardEvaluator";
import { GameUtils } from "./GameUtils";
import { RANK_ORDER } from "../glossary";

export class WinnerDeterminator {
  // Canonical Chiribito rank order (see src/rooms/game/glossary.ts):
  // 5 < 6 < 7 < Sota (10) < Caballo (11) < Rey (12) < As (1).
  private rankOrder: CardRankOrder = { ...RANK_ORDER };

  private utils: GameUtils;

  constructor(private room: IGameRoom) {
    this.utils = new GameUtils(room);
  }

  determineWinners(): { winners: string[]; winningHand: string } {
    return this.determineWinnersForEligible(this.utils.getPlayersInHandNonFolded());
  }

  private determineWinnersForEligible(eligibleIds: string[]): { winners: string[]; winningHand: string } {
    const community = this.room.state.communityCards.toArray();
    const communityCombos = CardEvaluator.getCommunityCombos(community);
    
    let winners: string[] = [];
    let bestScore: HandScore | null = null;
    let bestName = "Sin ganador";

    for (const playerId of eligibleIds) {
      const player = this.room.state.users.get(playerId);
      if (!player) continue;

      const hole = player.hand.toArray();

      // Special case: Perla (10♠J♠)
      if (CardEvaluator.isPerla(hole)) {
        winners = [playerId];
        bestScore = { category: 9, tiebreaker: [] };
        bestName = "Perla";
        break;
      }

      let playerBest: HandScore | null = null;
      let playerBestName = "";

      for (const combo of communityCombos) {
        const fiveCards = [...hole, ...combo];
        const score = CardEvaluator.evaluateHand(fiveCards, this.rankOrder);

        if (!playerBest || CardEvaluator.compareHands(score, playerBest) > 0) {
          playerBest = score;
          playerBestName = CardEvaluator.getHandName(score.category);
        }
      }

      if (playerBest) {
        if (!bestScore || CardEvaluator.compareHands(playerBest, bestScore) > 0) {
          winners = [playerId];
          bestScore = playerBest;
          bestName = playerBestName;
        } else if (bestScore && CardEvaluator.compareHands(playerBest, bestScore) === 0) {
          winners.push(playerId);
        }
      }
    }

    return { winners: winners.length > 0 ? winners : eligibleIds, winningHand: bestName };
  }

  calculateSidePotPayouts(
    contributions: Map<string, number>,
    winners: string[]
  ): Array<{ playerId: string; amount: number }> {
    const payouts = new Map<string, number>();

    if (winners.length === 0) return [];

    const contributionEntries = Array.from(contributions.entries())
      .filter(([_, amount]) => amount > 0)
      .sort((a, b) => a[1] - b[1]);

    // Get unique contribution levels
    const levels = Array.from(new Set(contributionEntries.map(([_, amount]) => amount)))
      .sort((a, b) => a - b);

    let previousLevel = 0;

    for (const level of levels) {
      // Find participants at this level (contributed >= level)
      const participantEntries = contributionEntries
        .filter(([_, amount]) => amount >= level);
      
      const participants = participantEntries.map(([id]) => id);

      const sidePotAmount = (level - previousLevel) * participants.length;
      
      if (sidePotAmount <= 0 || participants.length === 0) {
        previousLevel = level;
        continue;
      }

      // Only winners who are participants in this sidepot can claim it
      const eligibleWinners = winners.filter(w => participants.includes(w));

      if (eligibleWinners.length === 0) {
        // No winner eligible for this sidepot
        // Return chips to participants proportionally (uncalled bets)
        // Each participant gets back their contribution to this sidepot level
        const returnPerParticipant = (level - previousLevel);
        for (const participantId of participants) {
          payouts.set(participantId, (payouts.get(participantId) ?? 0) + returnPerParticipant);
        }
      } else {
        // Split sidepot among eligible winners
        const base = Math.floor(sidePotAmount / eligibleWinners.length);
        let remainder = sidePotAmount % eligibleWinners.length;

        for (const winnerId of eligibleWinners) {
          const bonus = remainder > 0 ? 1 : 0;
          payouts.set(winnerId, (payouts.get(winnerId) ?? 0) + base + bonus);
          if (remainder > 0) remainder -= 1;
        }
      }
      
      previousLevel = level;
    }

    // Convert to array format
    return Array.from(payouts.entries()).map(([playerId, amount]) => ({
      playerId,
      amount
    }));
  }

  logRoundEnd(
    winners: string[],
    winningHand: string,
    isAllInShowdown: boolean,
    pot: number
  ): void {
    logger.info(`Round ended`, {
      winners: winners.join(", "),
      winningHand,
      isAllInShowdown,
      pot,
      roomId: this.room.roomId
    });
  }
}
