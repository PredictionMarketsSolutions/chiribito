/**
 * GameEngine.ts
 * Main orchestrator for poker game logic.
 * Delegates to specialized modules: betting, rounds, winners, and actions.
 * ~250 lines total (was 967 lines)
 */

import { Client } from "@colyseus/core";
import type { IGameRoom } from "../../types/IGameRoom";
import { TURN_TIMEOUT } from "./constants";
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
    const activePlayers = Array.from(this.room.state.users.values()).filter(p => p.chips > 0);
    
    if (activePlayers.length < 2) {
      const msg = activePlayers.length === 1 
        ? "Necesitas al menos 1 jugador más para empezar" 
        : "Necesitas al menos 2 jugadores para empezar";
      client.send("error", { message: msg });
      return;
    }

    if (this.room.state.roundStarted) {
      client.send("error", { message: "Game already in progress" });
      return;
    }

    this.startNewHand();
  }

  startNewHand(): void {
    logger.info(`Starting new hand`, { roomId: this.room.roomId });
    
    this.roundManager.resetForNewHand(this.handContributions);
    this.roundManager.dealInitialHands();
    this.roundManager.resetDealerAndPhase();
    
    this.room.state.roundStarted = true;
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
      while (this.room.state.communityCards.length < 5) {
        this.roundManager.dealNextCommunityCard();
      }
      this.endRoundWithWinners();
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
    const acted = this.room.playersActedThisRound.size;

    logger.info(`Turn ended`, {
      player: this.utils.getPlayerName(this.room.state.currentTurn),
      roomId: this.room.roomId
    });

    // Check if betting round is complete
    if (activePlayers.length === 0 || acted === activePlayers.length) {
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
  }

  private endRoundWithWinners(): void {
    const result = this.winnerDeterminator.determineWinners();
    this.endRound(result.winners, result.winningHand);
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
