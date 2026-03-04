/**
 * WinnerDeterminator.ts
 * Determines round winners and calculates payouts
 */

import logger from "../../../config/logger";
import type { IGameRoom } from "../../../types/IGameRoom";
import { CardEvaluator, type CardRankOrder, type HandScore } from "./CardEvaluator";
import { GameUtils } from "./GameUtils";

export class WinnerDeterminator {
  private rankOrder: CardRankOrder = {
    "7": 0,
    "8": 1,
    "9": 2,
    "10": 3,
    "11": 4,
    "12": 5,
    "1": 6
  };

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
    const payouts: Array<{ playerId: string; amount: number }> = [];

    if (winners.length === 0) return payouts;

    const sortedContributions = Array.from(contributions.entries())
      .sort((a, b) => a[1] - b[1]);

    let previousLevel = 0;
    const claimedPlayers = new Set(winners);

    for (const [playerId, totalContribution] of sortedContributions) {
      const betAmount = totalContribution - previousLevel;
      const potSize = betAmount * sortedContributions.length;
      const splitAmount = Math.floor(potSize / claimedPlayers.size);

      for (const winnerId of claimedPlayers) {
        const existingIndex = payouts.findIndex(p => p.playerId === winnerId);
        if (existingIndex !== -1) {
          payouts[existingIndex].amount += splitAmount;
        } else {
          payouts.push({ playerId: winnerId, amount: splitAmount });
        }
      }

      previousLevel = totalContribution;
    }

    return payouts;
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
