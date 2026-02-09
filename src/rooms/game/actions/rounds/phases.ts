import type { GameRoom, GameHelpers } from "../../types";
import { getFirstActivePlayerIndex } from "../../state/selectors";
import { resetBetsForRound, setCurrentTurn } from "../../state/mutations";
import { broadcastBettingRoundStarted, broadcastRoundEnded } from "../../state/broadcast";

export function startBettingRound(room: GameRoom) {
  room.playersActedThisRound.clear();
  console.log(`[ROUND] Betting round started (${room.state.phase}) | currentBet=${room.state.currentBet} pot=${room.state.pot}`);
  broadcastBettingRoundStarted(room, {
    phase: room.state.phase,
    currentTurn: room.state.currentTurn,
    currentBet: room.state.currentBet,
    pot: room.state.pot
  });
}

export function proceedToNextPhase(room: GameRoom, helpers: GameHelpers) {
  console.log(`[ROUND] Proceeding to next phase from ${room.state.phase}`);
  // Reset player bets for new round
  resetBetsForRound(room);
  
  // Deal community cards based on phase
  switch (room.state.phase) {
    case "preflop":
      room.state.phase = "flop";
      // Deal flop (3 cards)
      room.state.communityCards.push(
        room.state.dealCard(),
        room.state.dealCard(),
        room.state.dealCard()
      );
      break;
      
    case "flop":
      room.state.phase = "turn";
      // Deal turn (1 card)
      room.state.communityCards.push(room.state.dealCard());
      break;
      
    case "turn":
      room.state.phase = "river";
      // Deal river (1 card)
      room.state.communityCards.push(room.state.dealCard());
      break;
      
    case "river":
      // Showdown
      helpers.endRound(helpers.determineWinners());
      return;
  }
  
  // Start next betting round
  room.currentPlayerIndex = getFirstActivePlayerIndex(room);
  
  if (room.currentPlayerIndex === -1) {
    // No active players (all-in or folded) -> auto-advance
    helpers.proceedToNextPhase();
    return;
  }
  
  setCurrentTurn(room, room.playersInHand[room.currentPlayerIndex]);
  helpers.startBettingRound();
  helpers.startTurnTimer();
}

export function determineWinners(room: GameRoom): string[] {
  const rankValues: Record<string, number> = {
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 11,
    "Q": 12,
    "K": 13,
    "A": 14
  };

  const community = room.state.communityCards.toArray();
  let bestRank = -1;
  let winners: string[] = [];

  room.playersInHand.forEach(id => {
    const player = room.state.users.get(id);
    if (!player || player.isFolded) return;

    const cards = [...player.hand.toArray(), ...community];
    const maxRank = cards.reduce((max, card) => {
      const rank = card.startsWith("10") ? "10" : card[0];
      const value = rankValues[rank] ?? 0;
      return Math.max(max, value);
    }, 0);

    if (maxRank > bestRank) {
      bestRank = maxRank;
      winners = [id];
      return;
    }

    if (maxRank === bestRank) {
      winners.push(id);
    }
  });

  return winners;
}

export function endRound(room: GameRoom, helpers: GameHelpers, winners: string[]) {
  if (room.turnTimeout) clearTimeout(room.turnTimeout);
  const winnerNames = winners
    .map(id => room.state.users.get(id)?.name ?? id)
    .join(", ");
  console.log(`[ROUND] Ended. Winners: ${winnerNames || "none"}`);
  
  // Calculate and distribute winnings
  const winnersList = winners.map(id => ({
    playerId: id,
    amount: Math.floor(room.state.pot / winners.length)
  }));
  
  // Update player chips
  winnersList.forEach(winner => {
    const player = room.state.users.get(winner.playerId);
    if (player) player.chips += winner.amount;
  });
  
  // Broadcast results
  broadcastRoundEnded(room, {
    winners: winnersList,
    communityCards: room.state.communityCards.toArray(),
    playerHands: Object.fromEntries(
      room.playersInHand
        .filter(id => !room.state.users.get(id)!.isFolded)
        .map(id => [id, room.state.users.get(id)!.hand.toArray()])
    )
  });
  
  // Start new hand after a delay
  setTimeout(() => {
    if (room.state.users.size >= 2) {
      helpers.startNewHand();
    } else {
      room.state.roundStarted = false;
    }
  }, 10000); // 10 seconds before next hand
}
