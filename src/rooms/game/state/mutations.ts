import type { GameRoom } from "../types";

export function resetForNewHand(room: GameRoom) {
  room.state.resetDeck();
  room.state.communityCards.clear();
  room.state.pot = 0;
  room.state.currentBet = 0;
  room.state.lastRaiser = "";
  room.playersInHand = [];
  room.playersActedThisRound.clear();
  room.playersAllIn.clear();
}

export function resetBetsForRound(room: GameRoom) {
  room.state.users.forEach(player => {
    player.currentBet = 0;
  });
  room.state.currentBet = 0;
}

export function removeFromHand(room: GameRoom, sessionId: string) {
  room.playersInHand = room.playersInHand.filter(id => id !== sessionId);
}

export function addToPot(room: GameRoom, amount: number) {
  room.state.pot += amount;
}

export function setCurrentBet(room: GameRoom, amount: number) {
  room.state.currentBet = amount;
}

export function setCurrentTurn(room: GameRoom, sessionId: string) {
  room.state.currentTurn = sessionId;
}
