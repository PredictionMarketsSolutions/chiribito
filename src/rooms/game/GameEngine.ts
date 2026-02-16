import { Client } from "@colyseus/core";
import type { MyRoom } from "../MyRoom";
import { TURN_TIMEOUT } from "./constants";

export class GameEngine {
  constructor(private room: MyRoom) {}

  handleStartGame(client: Client) {
    console.log(`[ACTION] ${this.getPlayerName(client.sessionId)} startGame`);
    if (this.room.state.users.size < 2) {
      client.send("error", { message: "At least 2 players required to start" });
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
    console.log(`[ACTION] ${this.getPlayerName(client.sessionId)} bet ${amount}`);

    const prevCurrentBet = this.room.state.currentBet;
    const minRaise = prevCurrentBet * 2;
    if (amount < this.room.state.currentBet) {
      client.send("error", { message: `${player.name}: bet must be at least ${this.room.state.currentBet}` });
      return;
    }

    if (amount > prevCurrentBet && amount < minRaise) {
      client.send("error", { message: `${player.name}: raise must be at least ${minRaise} (current bet ${prevCurrentBet})` });
      return;
    }

    const chipsToCall = amount - player.currentBet;
    if (chipsToCall > player.chips) {
      client.send("error", { message: `${player.name}: not enough chips` });
      return;
    }

    player.chips -= chipsToCall;
    player.currentBet += chipsToCall;
    this.addToPot(chipsToCall);

    const isRaise = amount > prevCurrentBet;
    if (isRaise) {
      this.room.state.currentBet = amount;
      this.room.state.lastRaiser = player.sessionId;
      this.room.playersActedThisRound.clear();
    }

    this.room.playersActedThisRound.add(player.sessionId);

    this.broadcastPlayerAction({
      playerId: player.sessionId,
      action: isRaise ? "raise" : "bet",
      amount,
      pot: this.room.state.pot
    });

    this.endTurn();
  }

  handleCall(client: Client) {
    if (client.sessionId !== this.room.state.currentTurn) return;

    const player = this.room.state.users.get(client.sessionId);
    if (!player || player.isFolded) return;
    console.log(`[ACTION] ${this.getPlayerName(client.sessionId)} call`);

    const chipsToCall = this.room.state.currentBet - player.currentBet;
    if (chipsToCall <= 0) {
      this.handleCheck(client);
      return;
    }

    const actualCall = Math.min(chipsToCall, player.chips);
    player.chips -= actualCall;
    player.currentBet += actualCall;
    this.addToPot(actualCall);

    this.room.playersActedThisRound.add(player.sessionId);

    this.broadcastPlayerAction({
      playerId: player.sessionId,
      action: actualCall < chipsToCall ? "allIn" : "call",
      amount: actualCall,
      pot: this.room.state.pot
    });

    if (actualCall < chipsToCall) {
      this.room.playersAllIn.add(player.sessionId);
    }

    this.endTurn();
  }

  handleCheck(client: Client) {
    if (client.sessionId !== this.room.state.currentTurn) return;

    const player = this.room.state.users.get(client.sessionId);
    if (!player || player.isFolded) return;
    console.log(`[ACTION] ${this.getPlayerName(client.sessionId)} check`);

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

  handleRaise(client: Client, amount: number) {
    const player = this.room.state.users.get(client.sessionId);
    console.log(`[ACTION] ${player?.name ?? "Unknown"} raise ${amount}`);
    this.handleBet(client, this.room.state.currentBet + amount);
  }

  handleFold(client: Client) {
    if (client.sessionId !== this.room.state.currentTurn) return;

    const player = this.room.state.users.get(client.sessionId);
    if (!player || player.isFolded) return;
    console.log(`[ACTION] ${this.getPlayerName(client.sessionId)} fold`);

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
    console.log("[ROUND] Starting new hand");
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
    console.log(`[ROUND] Betting round started (${this.room.state.phase}) | currentBet=${this.room.state.currentBet} pot=${this.room.state.pot}`);
    this.broadcastBettingRoundStarted({
      phase: this.room.state.phase,
      currentTurn: this.room.state.currentTurn,
      currentBet: this.room.state.currentBet,
      pot: this.room.state.pot
    });
  }

  proceedToNextPhase() {
    console.log(`[ROUND] Proceeding to next phase from ${this.room.state.phase}`);
    this.resetBetsForRound();

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

    this.room.playersInHand.forEach(id => {
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

  endRound(winners: string[], winningHand?: string) {
    if (this.room.turnTimeout) clearTimeout(this.room.turnTimeout);
    const winnerNames = winners
      .map(id => this.room.state.users.get(id)?.name ?? id)
      .join(", ");
    console.log(`[ROUND] Ended. Winners: ${winnerNames || "none"} | Hand: ${winningHand ?? "n/a"}`);

    const winnersList = winners.map(id => ({
      playerId: id,
      amount: Math.floor(this.room.state.pot / winners.length)
    }));

    winnersList.forEach(winner => {
      const player = this.room.state.users.get(winner.playerId);
      if (player) player.chips += winner.amount;
    });

    this.broadcastRoundEnded({
      winners: winnersList,
      communityCards: this.room.state.communityCards.toArray(),
      winningHand: winningHand ?? "",
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
    console.log(`[TURN] End turn for ${current?.name ?? this.room.state.currentTurn}`);

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

  private addToPot(amount: number) {
    this.room.state.pot += amount;
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
