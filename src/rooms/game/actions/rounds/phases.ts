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
      const result = helpers.determineWinners();
      helpers.endRound(result.winners, result.winningHand);
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

export function determineWinners(room: GameRoom): { winners: string[]; winningHand: string } {
  const rankOrder: Record<string, number> = {
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

  const community = room.state.communityCards.toArray();
  const communityCombos = getCommunityCombos(community);
  let winners: string[] = [];
  let bestScore: HandScore | null = null;
  let bestName = "Sin ganador";

  room.playersInHand.forEach(id => {
    const player = room.state.users.get(id);
    if (!player || player.isFolded) return;
    const hole = player.hand.toArray();
    if (hole.length < 2) return;

    let playerBest: HandScore | null = null;
    if (isPerla(hole)) {
      playerBest = { category: 9, tiebreaker: [] };
    } else {
      communityCombos.forEach(combo => {
        const hand = evaluateHand([...hole, ...combo], rankOrder);
        if (!playerBest || compareHands(hand, playerBest) > 0) {
          playerBest = hand;
        }
      });
    }

    if (!playerBest) return;

    if (!bestScore || compareHands(playerBest, bestScore) > 0) {
      bestScore = playerBest;
      bestName = getHandName(playerBest.category);
      winners = [id];
      return;
    }

    if (compareHands(playerBest, bestScore) === 0) {
      winners.push(id);
    }
  });

  return { winners, winningHand: bestName };
}

function getHandName(category: number) {
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

function getCommunityCombos(community: string[]) {
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

function parseCard(card: string) {
  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  return { rank, suit };
}

function isPerla(hole: string[]) {
  if (hole.length < 2) return false;
  const first = parseCard(hole[0]);
  const second = parseCard(hole[1]);
  const sameSuit = first.suit === second.suit;
  const ranks = [first.rank, second.rank].sort();
  return sameSuit && ranks[0] === "10" && ranks[1] === "11";
}

function evaluateHand(cards: string[], rankOrder: Record<string, number>) {
  const parsed = cards.map(parseCard);
  const ranks = parsed.map(card => card.rank);
  const suits = parsed.map(card => card.suit);
  const rankCounts = new Map<string, number>();
  ranks.forEach(rank => {
    rankCounts.set(rank, (rankCounts.get(rank) ?? 0) + 1);
  });

  const flush = suits.every(suit => suit === suits[0]);
  const straightResult = isStraight(ranks, rankOrder);

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

function isStraight(ranks: string[], rankOrder: Record<string, number>) {
  const values = Array.from(new Set(ranks.map(rank => rankOrder[rank] ?? 0)))
    .sort((a, b) => a - b);
  if (values.length !== 5) {
    return { isStraight: false, high: 0 };
  }

  const straightOne = [1, 2, 3, 4, 5];
  const straightTwo = [2, 3, 4, 5, 6];
  const matchesOne = values.every((value, index) => value === straightOne[index]);
  const matchesTwo = values.every((value, index) => value === straightTwo[index]);

  if (matchesOne) {
    return { isStraight: true, high: 5 };
  }

  if (matchesTwo) {
    return { isStraight: true, high: 6 };
  }

  return { isStraight: false, high: 0 };
}

function compareHands(a: { category: number; tiebreaker: number[] }, b: { category: number; tiebreaker: number[] }) {
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

export function endRound(room: GameRoom, helpers: GameHelpers, winners: string[], winningHand?: string) {
  if (room.turnTimeout) clearTimeout(room.turnTimeout);
  const winnerNames = winners
    .map(id => room.state.users.get(id)?.name ?? id)
    .join(", ");
  console.log(`[ROUND] Ended. Winners: ${winnerNames || "none"} | Hand: ${winningHand ?? "n/a"}`);
  
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
    winningHand: winningHand ?? "",
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
