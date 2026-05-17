/**
 * RoundManager.ts
 * Manages round progression, betting rounds, and hand resets
 */

import logger from "../../../config/logger";
import type { IGameRoom } from "../../../types/IGameRoom";
import { PLAYER_STATUS } from "../../schema/MesaState";
import { GameUtils } from "./GameUtils";
import { GameBroadcaster } from "./GameBroadcaster";
import { PHASES, communityCardPhase, HOLE_CARDS_PER_PLAYER } from "../glossary";

export class RoundManager {
  private utils: GameUtils;
  private broadcaster: GameBroadcaster;

  constructor(private room: IGameRoom) {
    this.utils = new GameUtils(room);
    this.broadcaster = new GameBroadcaster(room);
  }

  resetForNewHand(handContributions: Map<string, number>): void {
    this.room.state.resetDeck();
    this.room.state.communityCards.clear();
    this.room.state.pot = 0;
    this.room.state.currentBet = 0;
    this.room.state.lastRaiser = "";
    this.room.playersInHand = [];
    this.room.playersActedThisRound.clear();
    this.room.playersAllIn.clear();
    handContributions.clear();
  }

  resetBetsForRound(): void {
    this.room.state.users.forEach(player => {
      player.currentBet = 0;
    });
    this.room.state.currentBet = 0;
  }

  dealNextCommunityCard(): void {
    const nextCard = this.room.state.dealCard();
    if (!nextCard) return;
    this.room.state.communityCards.push(nextCard);
    // Phase identifier mirrors the count of community cards revealed so far
    // (PHASES.CARD_1 … PHASES.CARD_5). Six betting rounds in total.
    this.room.state.phase = communityCardPhase(this.room.state.communityCards.length);
  }

  startBettingRound(): void {
    this.room.playersActedThisRound.clear();
    logger.info(`Betting round started`, {
      phase: this.room.state.phase,
      currentBet: this.room.state.currentBet,
      pot: this.room.state.pot,
      roomId: this.room.roomId
    });
    this.broadcaster.broadcastBettingRoundStarted({
      phase: this.room.state.phase,
      currentTurn: this.room.state.currentTurn,
      currentBet: this.room.state.currentBet,
      pot: this.room.state.pot
    });
  }

  dealInitialHands(): void {
    const players = this.utils.getPlayersWithChips();
    players.forEach(player => {
      player.hand.clear();
      player.currentBet = 0;
      player.isFolded = false;
      player.playerStatus = PLAYER_STATUS.IN_HAND;
      // Chiribito deals exactly two hole cards per player.
      for (let i = 0; i < HOLE_CARDS_PER_PLAYER; i++) {
        player.hand.push(this.room.state.dealCard());
      }
      this.room.playersInHand.push(player.sessionId);
    });
  }

  resetDealerAndPhase(): void {
    const players = this.utils.getPlayersWithChips();
    this.room.dealerIndex = (this.room.dealerIndex + 1) % players.length;
    this.room.state.dealerIndex = this.room.dealerIndex;
    this.room.state.phase = PHASES.PREFLOP;
  }
}
