/**
 * GameEngine.ts
 * Main orchestrator for poker game logic.
 * Delegates to specialized modules: betting, rounds, winners, and actions.
 */

import { Client } from "@colyseus/core";
import type { IGameRoom } from "../../types/IGameRoom";
import { TURN_TIMEOUT, ALLIN_REVEAL_DELAY_MS } from "./constants";
import logger from "../../config/logger";
import {
  GameUtils,
  GameBroadcaster,
  RoundManager,
  PlayerActions,
  WinnerDeterminator
} from "./utils";

export class GameEngine {
  private handContributions = new Map<string, number>();
  private gameEndBroadcasted = false;
  private utils: GameUtils;
  private broadcaster: GameBroadcaster;
  private roundManager: RoundManager;
  private playerActions: PlayerActions;
  private winnerDeterminator: WinnerDeterminator;

  constructor(private room: IGameRoom) {
    this.utils = new GameUtils(room);
    this.broadcaster = new GameBroadcaster(room);
    this.roundManager = new RoundManager(room);
    this.playerActions = new PlayerActions(room);
    this.winnerDeterminator = new WinnerDeterminator(room);
  }

  // ============ Game Lifecycle ============

  handleStartGame(client: Client): void {
    // Block startGame if round is already in progress (prevents double-click)
    if (this.room.state.roundStarted) {
      client.send("error", { message: "Game already in progress" });
      return;
    }

    const activePlayers = Array.from(this.room.state.users.values()).filter(p => p.chips > 0);
    
    if (activePlayers.length < 2) {
      const msg = activePlayers.length === 1 
        ? "Necesitas al menos 1 jugador más para empezar" 
        : "Necesitas al menos 2 jugadores para empezar";
      client.send("error", { message: msg });
      return;
    }

    // Lock immediately to prevent double-click
    this.room.state.roundStarted = true;
    this.startNewHand();
  }

  startNewHand(): void {
    // Always reset game-ended broadcast guard when attempting to start a new hand.
    // This keeps the flag consistent even if we bail out due to not enough active players.
    this.gameEndBroadcasted = false;

    const playersWithChips = Array.from(this.room.state.users.values()).filter(p => p.chips > 0);
    if (playersWithChips.length < 2) {
      this.room.state.roundStarted = false;
      logger.info(`Not starting hand: need at least 2 players with chips`, {
        roomId: this.room.roomId,
        count: playersWithChips.length
      });
      return;
    }

    logger.info(`Starting new hand`, { roomId: this.room.roomId });
    
    this.roundManager.resetForNewHand(this.handContributions);
    this.roundManager.dealInitialHands();
    this.roundManager.resetDealerAndPhase();
    
    this.room.currentPlayerIndex = this.utils.getNextActiveIndexFrom(this.room.dealerIndex);
    
    if (this.room.currentPlayerIndex === -1) {
      this.room.state.roundStarted = false;
      return;
    }
    
    this.room.state.currentTurn = this.room.playersInHand[this.room.currentPlayerIndex];
    this.startBettingRound();
    this.startTurnTimer();
  }

  startBettingRound(): void {
    this.roundManager.startBettingRound();
  }

  proceedToNextPhase(): void {
    logger.info(`Proceeding to next phase`, {
      currentPhase: this.room.state.phase,
      roomId: this.room.roomId
    });

    this.roundManager.resetBetsForRound();

    // Auto-play if all remaining players are all-in
    const nonFoldedPlayers = this.utils.getPlayersInHandNonFolded();
    const allAllIn = nonFoldedPlayers.length > 1 && 
                     nonFoldedPlayers.every(id => this.room.playersAllIn.has(id));

    if (allAllIn) {
      logger.info(`All players all-in, auto-playing to showdown`, {
        roomId: this.room.roomId
      });
      this.startAllInShowdownReveal();
      return;
    }

    // Check if we've reached showdown
    if (this.room.state.phase !== "preflop" && this.room.state.communityCards.length >= 5) {
      this.endRoundWithWinners();
      return;
    }

    // Deal next community card and continue
    this.roundManager.dealNextCommunityCard();
    this.room.currentPlayerIndex = this.utils.getNextActiveIndexFrom(this.room.dealerIndex);

    if (this.room.currentPlayerIndex === -1) {
      this.proceedToNextPhase();
      return;
    }

    this.room.state.currentTurn = this.room.playersInHand[this.room.currentPlayerIndex];
    this.startBettingRound();
    this.startTurnTimer();
  }

  // ============ Betting Actions ============

  handleBet(client: Client, amount: number): void {
    const validation = this._validateBetAction(client, amount);
    if (!validation.valid) return;

    const player = this.room.state.users.get(client.sessionId)!;
    const prevCurrentBet = this.room.state.currentBet;

    const betAmounts = this._calculateBetAmounts(player, amount, prevCurrentBet);
    this._updateGameState(player, betAmounts);
    this._broadcastAndEndTurn(player, betAmounts);
  }

  handleCall(client: Client): void {
    if (client.sessionId !== this.room.state.currentTurn) return;

    const player = this.room.state.users.get(client.sessionId);
    if (!player || player.isFolded) return;

    const chipsToCall = this.room.state.currentBet - player.currentBet;
    if (chipsToCall <= 0) {
      this.playerActions.handleCheck(client, () => this.endTurn());
      return;
    }

    const actualCall = Math.min(chipsToCall, player.chips);
    player.chips -= actualCall;
    player.currentBet += actualCall;
    this.utils.addToPot(actualCall, player.sessionId, this.handContributions);

    this.room.playersActedThisRound.add(player.sessionId);

    this.broadcaster.broadcastPlayerAction({
      playerId: player.sessionId,
      action: actualCall < chipsToCall ? "allIn" : "call",
      amount: actualCall,
      pot: this.room.state.pot
    });

    if (actualCall < chipsToCall || player.chips === 0) {
      this.room.playersAllIn.add(player.sessionId);
    }

    this.endTurn();
  }

  handleCheck(client: Client): void {
    this.playerActions.handleCheck(client, () => this.endTurn());
  }

  handleAllIn(client: Client): void {
    if (client.sessionId !== this.room.state.currentTurn) return;

    const player = this.room.state.users.get(client.sessionId);
    if (!player || player.isFolded) return;

    const allInAmount = this.room.state.currentBet + player.chips;
    this.handleBet(client, allInAmount);
  }

  handleRaise(client: Client, amount: number): void {
    this.handleBet(client, this.room.state.currentBet + amount);
  }

  handleFold(client: Client): void {
    this.playerActions.handleFold(client, this.handContributions, () => {
      if (this.room.playersInHand.length === 1) {
        this.endRound([this.room.playersInHand[0]], "Gana por fold");
      } else {
        this.endTurn();
      }
    });
  }

  handleFoldForTimeout(sessionId: string): void {
    this.playerActions.handleFoldForTimeout(sessionId, this.handContributions, () => {
      if (this.room.playersInHand.length === 1) {
        this.endRound([this.room.playersInHand[0]], "Gana por fold");
      } else {
        this.endTurn();
      }
    });
  }

  // ============ Turn Management ============

  endTurn(): void {
    const activePlayers = this.utils.getActivePlayerIds();
    const actedActivePlayersCount = activePlayers.filter(id =>
      this.room.playersActedThisRound.has(id)
    ).length;

    logger.info(`Turn ended`, {
      player: this.utils.getPlayerName(this.room.state.currentTurn),
      roomId: this.room.roomId
    });

    // Check if betting round is complete
    if (activePlayers.length === 0 || actedActivePlayersCount === activePlayers.length) {
      this.proceedToNextPhase();
      return;
    }

    // Move to next player
    this.room.currentPlayerIndex = this.utils.getNextActiveIndexFrom(this.room.currentPlayerIndex);

    if (this.room.currentPlayerIndex === -1) {
      this.proceedToNextPhase();
      return;
    }

    this.room.state.currentTurn = this.room.playersInHand[this.room.currentPlayerIndex];
    this.startTurnTimer();
  }

  startTurnTimer(): void {
    if (this.room.turnTimeout) clearTimeout(this.room.turnTimeout);

    const startedAt = Date.now();
    const timeoutMs = TURN_TIMEOUT;

    this.broadcaster.broadcastTurnTimer({
      currentTurn: this.room.state.currentTurn,
      startedAt,
      timeoutMs,
      serverTime: startedAt
    });

    this.room.turnTimeout = setTimeout(() => {
      this.handleFoldForTimeout(this.room.state.currentTurn);
    }, timeoutMs);
  }

  // ============ Round End ============

  endRound(winners: string[], winningHand: string, isAllInShowdown = false): void {
    if (this.room.turnTimeout) clearTimeout(this.room.turnTimeout);

    this.room.state.roundStarted = false;

    const winnerPayouts = this.winnerDeterminator.calculateSidePotPayouts(
      this.handContributions,
      winners
    );

    winnerPayouts.forEach(payout => {
      const player = this.room.state.users.get(payout.playerId);
      if (player) player.chips += payout.amount;
    });

    const playerHands: Record<string, string[]> = {};
    for (const [id, player] of this.room.state.users) {
      playerHands[id] = player.hand.toArray();
    }

    this.broadcaster.broadcastRoundEnded({
      winners: winnerPayouts,
      communityCards: this.room.state.communityCards.toArray(),
      winningHand,
      isAllInShowdown,
      playerHands
    });

    this.winnerDeterminator.logRoundEnd(winners, winningHand, isAllInShowdown, this.room.state.pot);

    // Reservar asiento y ventana de rebuy para jugadores que quedaron con 0 fichas (bust)
    for (const [, player] of this.room.state.users) {
      if (player.chips === 0 && player.seatIndex >= 0 && this.room.onPlayerBusted) {
        this.room.onPlayerBusted(player.sessionId, player.seatIndex);
      }
    }

    // Check if game should end (only 1 active player remaining)
    this.checkGameEnd();

    // Auto-start next hand only if we still have 2+ players with chips after payouts (avoids flip when loser ends with 0)
    const playersWithChipsAfterPayout = Array.from(this.room.state.users.values()).filter(p => p.chips > 0);
    if (playersWithChipsAfterPayout.length >= 2) {
      this.room.state.roundStarted = true;
      this.startNewHand();
    }
  }

  private endRoundWithWinners(isAllInShowdown = false): void {
    const result = this.winnerDeterminator.determineWinners();
    this.endRound(result.winners, result.winningHand, isAllInShowdown);
  }

  /**
   * All-in showdown: reveal community cards one at a time (1s delay), then show winner.
   * Client should show each card as it arrives and only show winner on "roundEnded".
   */
  private startAllInShowdownReveal(): void {
    // Prevent any pending turn-timeout from firing during the reveal sequence.
    if (this.room.turnTimeout) {
      clearTimeout(this.room.turnTimeout);
      this.room.turnTimeout = null;
    }
    // There is no "turn" during all-in auto-reveal.
    this.room.state.currentTurn = "";

    if (this.room.state.communityCards.length >= 5) {
      this.endRoundWithWinners(true);
      return;
    }

    const revealNext = (): void => {
      if (this.room.state.communityCards.length >= 5) {
        this.endRoundWithWinners(true);
        return;
      }
      this.roundManager.dealNextCommunityCard();
      const cards = this.room.state.communityCards.toArray();
      const lastIndex = cards.length - 1;
      if (lastIndex >= 0) {
        this.broadcaster.broadcastCommunityCardRevealed({
          index: lastIndex,
          card: cards[lastIndex],
          communityCards: cards
        });
      }
      if (this.room.state.communityCards.length >= 5) {
        this.room.scheduleDelayed(() => this.endRoundWithWinners(true), ALLIN_REVEAL_DELAY_MS);
      } else {
        this.room.scheduleDelayed(revealNext, ALLIN_REVEAL_DELAY_MS);
      }
    };

    this.room.scheduleDelayed(revealNext, ALLIN_REVEAL_DELAY_MS);
  }

  /**
   * Check if game should end (only 1 player with chips remaining).
   * If there are players in rebuy window, do not end yet — wait for rebuy or timeout.
   */
  private checkGameEnd(): void {
    const activePlayers = Array.from(this.room.state.users.values()).filter(p => p.chips > 0);
    if (activePlayers.length !== 1) return;

    const inRebuyWindow = this.room.onHasPlayersInRebuyWindow?.();
    if (inRebuyWindow) {
      logger.info(`Game not ended: players in rebuy window`, { roomId: this.room.roomId });
      return;
    }

    if (this.gameEndBroadcasted) return;

    const winner = activePlayers[0];
    logger.info(`Game ended - champion crowned`, {
      winner: winner.name,
      sessionId: winner.sessionId,
      finalChips: winner.chips,
      roomId: this.room.roomId
    });

    this.broadcaster.broadcastGameEnded({
      champion: {
        sessionId: winner.sessionId,
        name: winner.name,
        chips: winner.chips
      }
    });
    this.gameEndBroadcasted = true;

    this.room.notifyTournamentEnd?.({
      sessionId: winner.sessionId,
      name: winner.name,
      chips: winner.chips
    });
  }

  /**
   * Call after a player leaves so we can broadcast game ended if only 1 remains (e.g. after rebuy timeout kick).
   */
  tryGameEnd(): void {
    this.checkGameEnd();
  }

  /**
   * Call after a successful rebuy: if we were waiting (no round) and now have 2+ players with chips, start a new hand.
   */
  tryResumeAfterRebuy(): void {
    if (this.room.state.roundStarted) return;
    const playersWithChips = Array.from(this.room.state.users.values()).filter(p => p.chips > 0);
    if (playersWithChips.length >= 2) {
      this.room.state.roundStarted = true;
      this.startNewHand();
    }
  }

  // ============ Betting Helpers ============

  private _validateBetAction(client: Client, amount: number): { valid: boolean } {
    if (client.sessionId !== this.room.state.currentTurn) return { valid: false };

    const player = this.room.state.users.get(client.sessionId);
    if (!player || player.isFolded) return { valid: false };

    logger.info(`Player bet`, {
      player: this.utils.getPlayerName(client.sessionId),
      amount,
      roomId: this.room.roomId
    });

    if (amount < this.room.state.currentBet) {
      client.send("error", { 
        message: `${player.name}: bet must be at least ${this.room.state.currentBet}` 
      });
      return { valid: false };
    }

    return { valid: true };
  }

  private _calculateBetAmounts(
    player: any,
    amount: number,
    prevCurrentBet: number
  ) {
    const opponents = this.room.playersInHand
      .filter(id => id !== player.sessionId)
      .map(id => this.room.state.users.get(id))
      .filter((op): op is NonNullable<typeof op> => Boolean(op && !op.isFolded));

    const maxCallableBet = opponents.length > 0
      ? Math.max(...opponents.map(op => op.currentBet + op.chips))
      : Infinity;

    const targetAmount = Math.min(amount, maxCallableBet);
    const chipsToCall = targetAmount - player.currentBet;
    const actualChipsToAdd = Math.min(chipsToCall, player.chips);
    const actualFinalBet = player.currentBet + actualChipsToAdd;

    const isAllIn = actualChipsToAdd === player.chips && player.chips > 0;
    const isRaise = actualFinalBet > prevCurrentBet;

    return {
      actualChipsToAdd,
      actualFinalBet,
      isAllIn,
      isRaise,
      prevCurrentBet,
      targetAmount
    };
  }

  private _updateGameState(player: any, betAmounts: any) {
    const { actualChipsToAdd, actualFinalBet, isAllIn, isRaise } = betAmounts;

    player.chips -= actualChipsToAdd;
    player.currentBet += actualChipsToAdd;
    this.utils.addToPot(actualChipsToAdd, player.sessionId, this.handContributions);

    if (isAllIn) {
      this.room.playersAllIn.add(player.sessionId);
    }

    if (isRaise) {
      this.room.state.currentBet = actualFinalBet;
      this.room.state.lastRaiser = player.sessionId;
      this.room.playersActedThisRound.clear();
    }

    this.room.playersActedThisRound.add(player.sessionId);
  }

  private _broadcastAndEndTurn(player: any, betAmounts: any) {
    const { actualChipsToAdd, isAllIn, isRaise } = betAmounts;

    this.broadcaster.broadcastPlayerAction({
      playerId: player.sessionId,
      action: isAllIn ? "allIn" : (isRaise ? "raise" : "bet"),
      amount: actualChipsToAdd,
      pot: this.room.state.pot
    });

    this.endTurn();
  }

  // ============ Helpers ============

  setCurrentPlayerIndexBeforeNextActive(fromIndex: number): void {
    this.utils.setCurrentPlayerIndexBeforeNextActive(fromIndex);
  }

  private getPlayerName(sessionId: string): string {
    return this.utils.getPlayerName(sessionId);
  }
}
