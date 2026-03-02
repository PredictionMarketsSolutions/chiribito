import { Client } from "@colyseus/core";
import type { MyRoom } from "../MyRoom";
import { TURN_TIMEOUT } from "./constants";
import logger from "../../config/logger";

export class GameEngine {
  private handContributions = new Map<string, number>();

  constructor(private room: MyRoom) {}

  handleStartGame(client: Client) {
    logger.info(`Player starting game`, {
      player: this.getPlayerName(client.sessionId),
      sessionId: client.sessionId,
      roomId: this.room.roomId
    });
    
    // Count only players with chips > 0 (exclude busted out players)
    const activePlayers = Array.from(this.room.state.users.values())
      .filter(p => p.chips > 0);
    
    if (activePlayers.length < 2) {
      const count = activePlayers.length;
      const message = count === 1 
        ? "Necesitas al menos 1 jugador más para empezar" 
        : "Necesitas al menos 2 jugadores para empezar";
      client.send("error", { message });
      return;
    }

    if (this.room.state.roundStarted) {
      client.send("error", { message: "Game already in progress" });
      return;
    }

    this.startNewHand();
  }

  handleBet(client: Client, amount: number) {
    if (client.sessionId !== this.room.state.currentTurn) return;

    const player = this.room.state.users.get(client.sessionId);
    if (!player || player.isFolded) return;
    logger.info(`Player bet`, {
      player: this.getPlayerName(client.sessionId),
      amount,
      roomId: this.room.roomId
    });

    const prevCurrentBet = this.room.state.currentBet;
    const minRaise = prevCurrentBet * 2;

    const opponents = this.room.playersInHand
      .filter(id => id !== player.sessionId)
      .map(id => this.room.state.users.get(id))
      .filter((op): op is NonNullable<typeof op> => Boolean(op && !op.isFolded));

    const maxCallableBet = opponents.length > 0
      ? Math.max(...opponents.map(op => op.currentBet + op.chips))
      : Infinity;

    const targetAmount = Math.min(amount, maxCallableBet);
     
    // Can't bet less than current bet
    if (targetAmount < this.room.state.currentBet) {
      client.send("error", { message: `${player.name}: bet must be at least ${this.room.state.currentBet}` });
      return;
    }

    // Calculate how much chips the player needs to put in
    const chipsToCall = targetAmount - player.currentBet;
    
    // If player doesn't have enough chips, they go all-in with what they have
    const actualChipsToAdd = Math.min(chipsToCall, player.chips);
    const actualFinalBet = player.currentBet + actualChipsToAdd;
    const isAllIn = actualChipsToAdd === player.chips && player.chips > 0;
    
    // Validate raise amount (but allow all-in even if smaller than min raise)
    const isRaise = actualFinalBet > prevCurrentBet;
    if (isRaise && !isAllIn && actualFinalBet < minRaise) {
      client.send("error", { message: `${player.name}: raise must be at least ${minRaise} (current bet ${prevCurrentBet})` });
      return;
    }

    // Process the bet
    player.chips -= actualChipsToAdd;
    player.currentBet += actualChipsToAdd;
    this.addToPot(actualChipsToAdd, player.sessionId);

    if (isAllIn) {
      this.room.playersAllIn.add(player.sessionId);
    }

    if (isRaise) {
      this.room.state.currentBet = actualFinalBet;
      this.room.state.lastRaiser = player.sessionId;
      this.room.playersActedThisRound.clear();
    }

    this.room.playersActedThisRound.add(player.sessionId);

    this.broadcastPlayerAction({
      playerId: player.sessionId,
      action: isAllIn ? "allIn" : (isRaise ? "raise" : "bet"),
      amount: actualChipsToAdd,
      pot: this.room.state.pot
    });

    this.endTurn();
  }

  handleCall(client: Client) {
    if (client.sessionId !== this.room.state.currentTurn) return;

    const player = this.room.state.users.get(client.sessionId);
    if (!player || player.isFolded) return;
    logger.info(`Player call`, {
      player: this.getPlayerName(client.sessionId),
      roomId: this.room.roomId
    });

    const chipsToCall = this.room.state.currentBet - player.currentBet;
    if (chipsToCall <= 0) {
      this.handleCheck(client);
      return;
    }

    const actualCall = Math.min(chipsToCall, player.chips);
    player.chips -= actualCall;
    player.currentBet += actualCall;
    this.addToPot(actualCall, player.sessionId);

    this.room.playersActedThisRound.add(player.sessionId);

    this.broadcastPlayerAction({
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

  handleCheck(client: Client) {
    if (client.sessionId !== this.room.state.currentTurn) return;

    const player = this.room.state.users.get(client.sessionId);
    if (!player || player.isFolded) return;
    logger.info(`Player check`, {
      player: this.getPlayerName(client.sessionId),
      roomId: this.room.roomId
    });

    if (player.currentBet < this.room.state.currentBet) {
      client.send("error", { message: `${player.name}: cannot check, you need to call or fold` });
      return;
    }

    this.broadcastPlayerAction({
      playerId: player.sessionId,
      action: "check",
      pot: this.room.state.pot
    });

    this.room.playersActedThisRound.add(player.sessionId);
    this.endTurn();
  }

  handleAllIn(client: Client) {
    if (client.sessionId !== this.room.state.currentTurn) return;

    const player = this.room.state.users.get(client.sessionId);
    if (!player || player.isFolded) return;
    logger.info(`Player all-in`, {
      player: this.getPlayerName(client.sessionId),
      roomId: this.room.roomId
    });

    // All-in with all remaining chips
    const allInAmount = this.room.state.currentBet + player.chips;
    this.handleBet(client, allInAmount);
  }

  handleRaise(client: Client, amount: number) {
    const player = this.room.state.users.get(client.sessionId);
    logger.info(`Player raise`, {
      player: player?.name ?? "Unknown",
      amount,
      roomId: this.room.roomId
    });
    this.handleBet(client, this.room.state.currentBet + amount);
  }

  handleFold(client: Client) {
    if (client.sessionId !== this.room.state.currentTurn) return;

    const player = this.room.state.users.get(client.sessionId);
    if (!player || player.isFolded) return;
    logger.info(`Player fold`, {
      player: this.getPlayerName(client.sessionId),
      roomId: this.room.roomId
    });

    const foldIndex = this.room.playersInHand.indexOf(client.sessionId);
    player.isFolded = true;
    this.removeFromHand(client.sessionId);

    if (this.room.playersInHand.length > 0 && foldIndex !== -1) {
      this.setCurrentPlayerIndexBeforeNextActive(foldIndex);
    }

    this.broadcastPlayerAction({
      playerId: player.sessionId,
      action: "fold"
    });

    if (this.room.playersInHand.length === 1) {
      this.endRound([this.room.playersInHand[0]], "Gana por fold");
      return;
    }

    this.endTurn();
  }

  handleFoldForTimeout(sessionId: string) {
    const player = this.room.state.users.get(sessionId);
    if (!player || player.isFolded) return;
    this.handleFold({ sessionId } as Client);
  }

  startNewHand() {
    logger.info(`Starting new hand`, { roomId: this.room.roomId });
    this.resetForNewHand();

    const players = this.getPlayersWithChips();
    players.forEach(player => {
      player.hand.clear();
      player.currentBet = 0;
      player.isFolded = false;
      player.hand.push(this.room.state.dealCard(), this.room.state.dealCard());
      this.room.playersInHand.push(player.sessionId);
    });

    this.room.dealerIndex = (this.room.dealerIndex + 1) % players.length;
    this.room.state.dealerIndex = this.room.dealerIndex;
    this.room.state.roundStarted = true;
    this.room.state.phase = "preflop";

    this.room.currentPlayerIndex = this.getNextActiveIndexFrom(this.room.dealerIndex);
    if (this.room.currentPlayerIndex === -1) {
      this.room.state.roundStarted = false;
      return;
    }
    this.room.state.currentTurn = this.room.playersInHand[this.room.currentPlayerIndex];
    this.startBettingRound();
    this.startTurnTimer();
  }

  startBettingRound() {
    this.room.playersActedThisRound.clear();
    logger.info(`Betting round started`, {
      phase: this.room.state.phase,
      currentBet: this.room.state.currentBet,
      pot: this.room.state.pot,
      roomId: this.room.roomId
    });
    this.broadcastBettingRoundStarted({
      phase: this.room.state.phase,
      currentTurn: this.room.state.currentTurn,
      currentBet: this.room.state.currentBet,
      pot: this.room.state.pot
    });
  }

  proceedToNextPhase() {
    logger.info(`Proceeding to next phase`, {
      currentPhase: this.room.state.phase,
      roomId: this.room.roomId
    });
    this.resetBetsForRound();

    // Check if all non-folded players are all-in - if so, auto-play to showdown
    const nonFoldedPlayers = this.getPlayersInHandNonFolded();
    const allRemainingAllIn = nonFoldedPlayers.length > 1 && 
                              nonFoldedPlayers.every(id => this.room.playersAllIn.has(id));

    if (allRemainingAllIn) {
      logger.info(`All remaining players all-in, auto-playing to showdown`, {
        phase: this.room.state.phase,
        communityCards: this.room.state.communityCards.length,
        roomId: this.room.roomId
      });
      // Auto-play from preflop to showdown (deal all remaining community cards)
      while (this.room.state.communityCards.length < 5) {
        this.dealNextCommunityCard();
      }
      const result = this.determineWinners();
      this.endRound(result.winners, result.winningHand, true);
      return;
    }

    if (this.room.state.phase !== "preflop" && this.room.state.communityCards.length >= 5) {
      const result = this.determineWinners();
      this.endRound(result.winners, result.winningHand);
      return;
    }

    this.dealNextCommunityCard();

    this.room.currentPlayerIndex = this.getNextActiveIndexFrom(this.room.dealerIndex);

    if (this.room.currentPlayerIndex === -1) {
      this.proceedToNextPhase();
      return;
    }

    this.room.state.currentTurn = this.room.playersInHand[this.room.currentPlayerIndex];
    this.startBettingRound();
    this.startTurnTimer();
  }

  determineWinners(): { winners: string[]; winningHand: string } {
    return this.determineWinnersForEligible(this.getPlayersInHandNonFolded());
  }

  private determineWinnersForEligible(eligibleIds: string[]): { winners: string[]; winningHand: string } {
    const rankOrder: Record<string, number> = {
      "7": 0,
      "8": 1,
      "9": 2,
      "10": 3,
      "11": 4,
      "12": 5,
      "1": 6
    };

    type HandScore = {
      category: number;
      tiebreaker: number[];
    };

    const community = this.room.state.communityCards.toArray();
    const communityCombos = this.getCommunityCombos(community);
    let winners: string[] = [];
    let bestScore: HandScore | null = null;
    let bestName = "Sin ganador";

    eligibleIds.forEach(id => {
      const player = this.room.state.users.get(id);
      if (!player || player.isFolded) return;
      const hole = player.hand.toArray();
      if (hole.length < 2) return;

      let playerBest: HandScore | null = null;
      if (this.isPerla(hole)) {
        playerBest = { category: 9, tiebreaker: [] };
      } else {
        communityCombos.forEach(combo => {
          const hand = this.evaluateHand([...hole, ...combo], rankOrder);
          if (!playerBest || this.compareHands(hand, playerBest) > 0) {
            playerBest = hand;
          }
        });
      }

      if (!playerBest) return;

      if (!bestScore || this.compareHands(playerBest, bestScore) > 0) {
        bestScore = playerBest;
        bestName = this.getHandName(playerBest.category);
        winners = [id];
        return;
      }

      if (this.compareHands(playerBest, bestScore) === 0) {
        winners.push(id);
      }
    });

    return { winners, winningHand: bestName };
  }

  private calculateSidePotPayouts() {
    const payouts = new Map<string, number>();
    const contributions = Array.from(this.handContributions.entries())
      .filter(([, amount]) => amount > 0);

    if (contributions.length === 0) {
      return { payouts, winningHand: "" };
    }

    const levels = Array.from(new Set(contributions.map(([, amount]) => amount))).sort((a, b) => a - b);
    let previousLevel = 0;
    let primaryWinningHand = "";

    levels.forEach((level) => {
      const participants = contributions
        .filter(([, amount]) => amount >= level)
        .map(([playerId]) => playerId);

      if (participants.length === 0) {
        previousLevel = level;
        return;
      }

      const sidePotAmount = (level - previousLevel) * participants.length;
      if (sidePotAmount <= 0) {
        previousLevel = level;
        return;
      }

      const eligible = participants.filter((playerId) => {
        const player = this.room.state.users.get(playerId);
        return Boolean(player && !player.isFolded);
      });

      if (eligible.length === 0) {
        previousLevel = level;
        return;
      }

      const result = this.determineWinnersForEligible(eligible);
      if (!primaryWinningHand && result.winningHand) {
        primaryWinningHand = result.winningHand;
      }

      const orderedWinners = this.room.playersInHand.filter(id => result.winners.includes(id));
      const splitBase = Math.floor(sidePotAmount / orderedWinners.length);
      let remainder = sidePotAmount % orderedWinners.length;

      orderedWinners.forEach((winnerId) => {
        const bonus = remainder > 0 ? 1 : 0;
        payouts.set(winnerId, (payouts.get(winnerId) ?? 0) + splitBase + bonus);
        if (remainder > 0) remainder -= 1;
      });

      previousLevel = level;
    });

    return { payouts, winningHand: primaryWinningHand };
  }

  endRound(winners: string[], winningHand?: string, isAllInShowdown: boolean = false) {
    if (this.room.turnTimeout) clearTimeout(this.room.turnTimeout);
    
    // CRITICAL: Block all player actions during showdown
    this.room.state.roundStarted = false;
    
    const winnerNames = winners
      .map(id => this.room.state.users.get(id)?.name ?? id)
      .join(", ");
    logger.info(`Round ended`, {
      winners: winnerNames || "none",
      winningHand: winningHand ?? "n/a",
      isAllInShowdown,
      roomId: this.room.roomId
    });

    const sidePotResult = this.calculateSidePotPayouts();

    let winnersList = Array.from(sidePotResult.payouts.entries())
      .filter(([, amount]) => amount > 0)
      .map(([playerId, amount]) => ({ playerId, amount }));

    if (winnersList.length === 0 && winners.length > 0) {
      winnersList = winners.map(id => ({
        playerId: id,
        amount: Math.floor(this.room.state.pot / winners.length)
      }));
    }

    winnersList.forEach(winner => {
      const player = this.room.state.users.get(winner.playerId);
      if (player) player.chips += winner.amount;
    });

    // Check for players with 0 chips and remove them from the round
    const playersWithoutChips: string[] = [];
    this.room.state.users.forEach((player, sessionId) => {
      if (player.chips === 0 && player.seatIndex >= 0) {
        playersWithoutChips.push(sessionId);
      }
    });

    // Reserve seats and remove players with 0 chips
    playersWithoutChips.forEach(sessionId => {
      const player = this.room.state.users.get(sessionId);
      if (player && player.seatIndex >= 0) {
        // Call private method through room's public interface
        (this.room as any).reserveSeat(sessionId, player.seatIndex);
        
        // Remove player from active game
        player.isFolded = true;
        const playerIndex = this.room.playersInHand.indexOf(sessionId);
        if (playerIndex >= 0) {
          this.room.playersInHand.splice(playerIndex, 1);
        }

        // Notify client of busted out status
        const client = this.room.clients.find(c => c.sessionId === sessionId);
        if (client) {
          client.send("bustedOut", {
            seatIndex: player.seatIndex,
            message: "¡Te has quedado sin fichas!",
            rebuyCost: 1000,
            timeoutSeconds: 120
          });
        }

        logger.info(`Player busted out - seat reserved for rebuy`, {
          player: player.name,
          sessionId,
          seatIndex: player.seatIndex,
          roomId: this.room.roomId
        });

        // Broadcast to all clients
        this.room.broadcast("playerBustedOut", {
          playerId: sessionId,
          playerName: player.name,
          seatIndex: player.seatIndex
        });
      }
    });

    this.broadcastRoundEnded({
      winners: winnersList,
      communityCards: this.room.state.communityCards.toArray(),
      winningHand: winningHand ?? sidePotResult.winningHand ?? "",
      isAllInShowdown,
      playerHands: Object.fromEntries(
        this.room.playersInHand
          .filter(id => !this.room.state.users.get(id)!.isFolded)
          .map(id => [id, this.room.state.users.get(id)!.hand.toArray()])
      )
    });

    setTimeout(() => {
      if (this.room.state.users.size >= 2) {
        this.startNewHand();
      } else {
        this.room.state.roundStarted = false;
      }
    }, 10000);
  }

  endTurn() {
    if (this.room.turnTimeout) clearTimeout(this.room.turnTimeout);
    const current = this.room.state.users.get(this.room.state.currentTurn);
    logger.info(`Turn ended`, {
      player: current?.name ?? this.room.state.currentTurn,
      roomId: this.room.roomId
    });

    const activePlayers = this.getActivePlayerIds();
    const allActed = activePlayers.every(id => this.room.playersActedThisRound.has(id));

    if (activePlayers.length === 0) {
      this.proceedToNextPhase();
      return;
    }

    if (allActed && activePlayers.length > 0) {
      this.proceedToNextPhase();
      return;
    }

    do {
      this.room.currentPlayerIndex = (this.room.currentPlayerIndex + 1) % this.room.playersInHand.length;
      const nextPlayerId = this.room.playersInHand[this.room.currentPlayerIndex];
      const nextPlayer = this.room.state.users.get(nextPlayerId);

      if (!nextPlayer || nextPlayer.isFolded || this.room.playersAllIn.has(nextPlayerId)) continue;

      this.room.state.currentTurn = nextPlayerId;
      this.startTurnTimer();
      return;
    } while (true);
  }

  startTurnTimer() {
    if (this.room.turnTimeout) clearTimeout(this.room.turnTimeout);
    const startedAt = Date.now();
    this.broadcastTurnTimer({
      currentTurn: this.room.state.currentTurn,
      startedAt,
      timeoutMs: TURN_TIMEOUT,
      serverTime: startedAt
    });

    this.room.turnTimeout = setTimeout(() => {
      const player = this.room.state.users.get(this.room.state.currentTurn);
      if (player && !player.isFolded) {
        this.handleFoldForTimeout(player.sessionId);
      }
    }, TURN_TIMEOUT);
  }

  setCurrentPlayerIndexBeforeNextActive(fromIndex: number) {
    const totalPlayers = this.room.playersInHand.length;
    if (totalPlayers === 0) return;

    let candidateIndex = fromIndex - 1;
    if (candidateIndex < 0) {
      candidateIndex = totalPlayers - 1;
    }

    let safety = totalPlayers;
    while (safety > 0) {
      const candidateId = this.room.playersInHand[candidateIndex];
      const candidate = this.room.state.users.get(candidateId);
      if (candidate && !candidate.isFolded && !this.room.playersAllIn.has(candidateId)) {
        this.room.currentPlayerIndex = candidateIndex;
        return;
      }
      candidateIndex -= 1;
      if (candidateIndex < 0) {
        candidateIndex = totalPlayers - 1;
      }
      safety -= 1;
    }

    this.room.currentPlayerIndex = candidateIndex;
  }

  private getPlayerName(sessionId: string) {
    return this.room.state.users.get(sessionId)?.name ?? sessionId;
  }

  private getPlayersWithChips() {
    return Array.from(this.room.state.users.values()).filter(p => p.chips > 0);
  }

  private getPlayersInHandNonFolded() {
    return this.room.playersInHand.filter(id => {
      const player = this.room.state.users.get(id);
      return player && !player.isFolded;
    });
  }

  private getActivePlayerIds() {
    return this.room.playersInHand
      .filter(id => !this.room.state.users.get(id)!.isFolded)
      .filter(id => !this.room.playersAllIn.has(id));
  }

  private getNextActiveIndexFrom(startIndex: number) {
    const totalPlayers = this.room.playersInHand.length;
    if (totalPlayers === 0) return -1;

    let candidateIndex = startIndex;
    for (let i = 0; i < totalPlayers; i += 1) {
      candidateIndex = (candidateIndex + 1) % totalPlayers;
      const candidateId = this.room.playersInHand[candidateIndex];
      const candidate = this.room.state.users.get(candidateId);
      if (candidate && !candidate.isFolded && !this.room.playersAllIn.has(candidateId)) {
        return candidateIndex;
      }
    }

    return -1;
  }

  private dealNextCommunityCard() {
    const nextCard = this.room.state.dealCard();
    if (!nextCard) return;
    this.room.state.communityCards.push(nextCard);
    const cardNumber = this.room.state.communityCards.length;
    this.room.state.phase = `card${cardNumber}`;
  }

  private resetForNewHand() {
    this.room.state.resetDeck();
    this.room.state.communityCards.clear();
    this.room.state.pot = 0;
    this.room.state.currentBet = 0;
    this.room.state.lastRaiser = "";
    this.room.playersInHand = [];
    this.room.playersActedThisRound.clear();
    this.room.playersAllIn.clear();
    this.handContributions.clear();
  }

  private resetBetsForRound() {
    this.room.state.users.forEach(player => {
      player.currentBet = 0;
    });
    this.room.state.currentBet = 0;
  }

  private removeFromHand(sessionId: string) {
    this.room.playersInHand = this.room.playersInHand.filter(id => id !== sessionId);
  }

  private addToPot(amount: number, playerId?: string) {
    this.room.state.pot += amount;
    if (playerId) {
      this.handContributions.set(playerId, (this.handContributions.get(playerId) ?? 0) + amount);
    }
  }

  private broadcastBettingRoundStarted(payload: {
    phase: string;
    currentTurn: string;
    currentBet: number;
    pot: number;
  }) {
    this.room.broadcast("bettingRoundStarted", payload);
  }

  private broadcastPlayerAction(payload: {
    playerId: string;
    action: string;
    amount?: number;
    pot?: number;
  }) {
    this.room.broadcast("playerAction", payload);
  }

  private broadcastRoundEnded(payload: {
    winners: Array<{ playerId: string; amount: number }>;
    communityCards: string[];
    winningHand: string;
    isAllInShowdown: boolean;
    playerHands: Record<string, string[]>;
  }) {
    this.room.broadcast("roundEnded", payload);
  }

  private broadcastTurnTimer(payload: {
    currentTurn: string;
    startedAt: number;
    timeoutMs: number;
    serverTime: number;
  }) {
    this.room.broadcast("turnTimer", payload);
  }

  private getHandName(category: number) {
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

  private getCommunityCombos(community: string[]) {
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

  private parseCard(card: string) {
    const suit = card.slice(-1);
    const rank = card.slice(0, -1);
    return { rank, suit };
  }

  private isPerla(hole: string[]) {
    if (hole.length < 2) return false;
    const first = this.parseCard(hole[0]);
    const second = this.parseCard(hole[1]);
    const sameSuit = first.suit === second.suit;
    const ranks = [first.rank, second.rank].sort();
    return sameSuit && ranks[0] === "10" && ranks[1] === "11";
  }

  private evaluateHand(cards: string[], rankOrder: Record<string, number>) {
    const parsed = cards.map(card => this.parseCard(card));
    const ranks = parsed.map(card => card.rank);
    const suits = parsed.map(card => card.suit);
    const rankCounts = new Map<string, number>();
    ranks.forEach(rank => {
      rankCounts.set(rank, (rankCounts.get(rank) ?? 0) + 1);
    });

    const flush = suits.every(suit => suit === suits[0]);
    const straightResult = this.isStraight(ranks, rankOrder);

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

  private isStraight(ranks: string[], rankOrder: Record<string, number>) {
    const values = Array.from(new Set(ranks.map(rank => rankOrder[rank] ?? 0)))
      .sort((a, b) => a - b);
    if (values.length !== 5) {
      return { isStraight: false, high: 0 };
    }

    const isConsecutive = values.every((value, index) => index === 0 || value === values[index - 1] + 1);
    if (!isConsecutive) {
      return { isStraight: false, high: 0 };
    }

    return { isStraight: true, high: values[values.length - 1] };
  }

  private compareHands(a: { category: number; tiebreaker: number[] }, b: { category: number; tiebreaker: number[] }) {
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
}
