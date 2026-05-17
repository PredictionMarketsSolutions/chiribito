/**
 * GameEngine.ts
 * Main orchestrator for poker game logic.
 * Delegates to specialized modules: betting, rounds, winners, and actions.
 */

import { Client } from "@colyseus/core";
import type { IGameRoom } from "../../types/IGameRoom";
import { PLAYER_STATUS } from "../schema/MesaState";
import { TURN_TIMEOUT, ALLIN_REVEAL_DELAY_MS } from "./constants";
import { PHASES, TOTAL_COMMUNITY_CARDS } from "./glossary";
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
    const playersWithChips = Array.from(this.room.state.users.values()).filter(p => p.chips > 0);
    if (playersWithChips.length < 2) {
      this.room.state.roundStarted = false;
      logger.info(`Not starting hand: need at least 2 players with chips`, {
        roomId: this.room.roomId,
        count: playersWithChips.length
      });
      return;
    }

    // Reset game-ended broadcast guard only when a new hand actually starts.
    // If we bail out due to <2 players, keep the previous \"game ended\" state.
    this.gameEndBroadcasted = false;

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

    // Showdown cuando no hay más apuestas: todos all-in O solo uno tiene fichas (el resto all-in).
    // En ambos casos se muestran las cartas y el ganador; el jugador con fichas NO tiene que hacer check en cada calle.
    const nonFoldedPlayers = this.utils.getPlayersInHandNonFolded();
    const countWithChips = nonFoldedPlayers.filter(id => {
      const p = this.room.state.users.get(id);
      return p != null && p.chips > 0;
    }).length;
    const allInShowdown =
      nonFoldedPlayers.length > 1 && countWithChips <= 1;

    if (allInShowdown) {
      logger.info(`All-in showdown (all in or one with chips), auto-playing to reveal`, {
        roomId: this.room.roomId
      });
      this.startAllInShowdownReveal();
      return;
    }

    // Sole remaining player wins immediately (no more betting or cards)
    if (nonFoldedPlayers.length === 1) {
      logger.info(`Only one player left in hand, wins by fold`, {
        roomId: this.room.roomId,
        winner: nonFoldedPlayers[0]
      });
      this.endRound(nonFoldedPlayers, "Gana por fold", false);
      return;
    }

    // Check if we've reached showdown — all five community cards revealed and
    // we are past the preflop betting round. Phase 2: Chiribito reveals one
    // community card per street, six betting rounds in total.
    if (
      this.room.state.phase !== PHASES.PREFLOP &&
      this.room.state.communityCards.length >= TOTAL_COMMUNITY_CARDS
    ) {
      this.endRoundWithWinners();
      return;
    }

    // Deal next community card and continue.
    this.roundManager.dealNextCommunityCard();

    // Authentic Chiribito speaking order: on every post-preflop street, the
    // player who was the last to raise (or, if nobody has raised yet, the
    // first player after the dealer) speaks first. `state.lastRaiser` is
    // preserved across streets within a hand (only cleared in
    // `resetForNewHand`), so it carries the aggressor's identity forward.
    this.room.currentPlayerIndex = this.pickFirstSpeakerForNewStreet();

    // Fall back to the first active player if no eligible speaker was found
    // (e.g. last raiser folded between streets — edge case).
    const activePlayerIds = this.utils.getActivePlayerIds();
    if (this.room.currentPlayerIndex === -1 && activePlayerIds.length > 0) {
      const firstActiveId = activePlayerIds[0];
      const idx = this.room.playersInHand.indexOf(firstActiveId);
      if (idx !== -1) {
        this.room.currentPlayerIndex = idx;
      }
    }

    if (this.room.currentPlayerIndex === -1) {
      this.proceedToNextPhase();
      return;
    }

    this.room.state.currentTurn = this.room.playersInHand[this.room.currentPlayerIndex];
    this.startBettingRound();
    this.startTurnTimer();
  }

  /**
   * Chiribito speaking order on a new street (post-preflop):
   *   1. If `state.lastRaiser` is still in the hand and not folded,
   *      they speak first.
   *   2. Otherwise, the first active player clockwise from the dealer
   *      speaks first.
   * Returns an index into `playersInHand`, or -1 if no eligible speaker.
   */
  private pickFirstSpeakerForNewStreet(): number {
    const lastRaiser = this.room.state.lastRaiser;
    if (lastRaiser) {
      const idx = this.room.playersInHand.indexOf(lastRaiser);
      if (idx >= 0) {
        const player = this.room.state.users.get(lastRaiser);
        if (player && !player.isFolded) {
          return idx;
        }
      }
    }
    return this.utils.getNextActiveIndexFrom(this.room.dealerIndex);
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

    // Move to next player (e.g. after an all-in, the only player with chips must get the turn to check)
    this.room.currentPlayerIndex = this.utils.getNextActiveIndexFrom(this.room.currentPlayerIndex);

    if (this.room.currentPlayerIndex === -1 && activePlayers.length > 0) {
      const nextToAct = activePlayers.find(id => !this.room.playersActedThisRound.has(id));
      if (nextToAct) {
        const idx = this.room.playersInHand.indexOf(nextToAct);
        if (idx !== -1) this.room.currentPlayerIndex = idx;
      }
    }

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

    // Estado "seated" entre manos para todos los de la mesa. Solo el servidor actualiza (seguridad).
    for (const [, player] of this.room.state.users) {
      player.playerStatus = PLAYER_STATUS.SEATED;
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

    if (this.room.state.communityCards.length >= TOTAL_COMMUNITY_CARDS) {
      this.endRoundWithWinners(true);
      return;
    }

    const revealNext = (): void => {
      if (this.room.state.communityCards.length >= TOTAL_COMMUNITY_CARDS) {
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
      if (this.room.state.communityCards.length >= TOTAL_COMMUNITY_CARDS) {
        this.room.scheduleDelayed(() => this.endRoundWithWinners(true), ALLIN_REVEAL_DELAY_MS);
      } else {
        this.room.scheduleDelayed(revealNext, ALLIN_REVEAL_DELAY_MS);
      }
    };

    this.room.scheduleDelayed(revealNext, ALLIN_REVEAL_DELAY_MS);
  }

  /**
   * Check if game should end (only 1 player with chips remaining).
   */
  private checkGameEnd(): void {
    const activePlayers = Array.from(this.room.state.users.values()).filter(p => p.chips > 0);
    if (activePlayers.length !== 1) return;

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
   * Call after a player leaves so we can broadcast game ended if only 1 remains.
   */
  tryGameEnd(): void {
    this.checkGameEnd();
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
