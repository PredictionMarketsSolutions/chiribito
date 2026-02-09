import type { GameRoom, GameHelpers } from "../../types";
import { getPlayerName, getPlayersWithChips } from "../../state/selectors";
import { resetForNewHand } from "../../state/mutations";

export function handleStartGame(room: GameRoom, helpers: GameHelpers, clientSessionId: string) {
  console.log(`[ACTION] ${getPlayerName(room, clientSessionId)} startGame`);
  if (room.state.users.size < 2) {
    room.clients.find(c => c.sessionId === clientSessionId)?.send("error", { message: "At least 2 players required to start" });
    return;
  }

  if (room.state.roundStarted) {
    room.clients.find(c => c.sessionId === clientSessionId)?.send("error", { message: "Game already in progress" });
    return;
  }

  helpers.startNewHand();
}

export function startNewHand(room: GameRoom, helpers: GameHelpers) {
  console.log("[ROUND] Starting new hand");
  // Reset game state
  resetForNewHand(room);

  // Set up players for new hand
  const players = getPlayersWithChips(room);
  players.forEach(player => {
    player.hand.clear();
    player.currentBet = 0;
    player.isFolded = false;
    // Deal two cards to each player
    player.hand.push(room.state.dealCard(), room.state.dealCard());
    room.playersInHand.push(player.sessionId);
  });

  // Set dealer and blinds
  room.dealerIndex = (room.dealerIndex + 1) % players.length;
  room.state.roundStarted = true;
  room.state.phase = "preflop";

  // Post blinds
  helpers.postBlinds();
  
  // Start first betting round
  helpers.startBettingRound();
}
