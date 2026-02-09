import type { GameRoom, GameHelpers } from "../../types";
import { SMALL_BLIND, BIG_BLIND } from "../../constants";
import { addToPot, setCurrentBet, setCurrentTurn } from "../../state/mutations";
import { broadcastBlindsPosted } from "../../state/broadcast";

export function postBlinds(room: GameRoom, helpers: GameHelpers) {
  const players = room.playersInHand.map(id => room.state.users.get(id)!);
  const smallBlindPos = (room.dealerIndex + 1) % players.length;
  const bigBlindPos = (room.dealerIndex + 2) % players.length;
  
  const smallBlindPlayer = players[smallBlindPos];
  const bigBlindPlayer = players[bigBlindPos];
  
  // Post small blind
  const smallBlind = Math.min(SMALL_BLIND, smallBlindPlayer.chips);
  console.log(`[BLIND] ${smallBlindPlayer.name} posts small blind ${smallBlind}`);
  smallBlindPlayer.chips -= smallBlind;
  smallBlindPlayer.currentBet = smallBlind;
  addToPot(room, smallBlind);
  
  // Post big blind
  const bigBlind = Math.min(BIG_BLIND, bigBlindPlayer.chips);
  console.log(`[BLIND] ${bigBlindPlayer.name} posts big blind ${bigBlind}`);
  bigBlindPlayer.chips -= bigBlind;
  bigBlindPlayer.currentBet = bigBlind;
  addToPot(room, bigBlind);
  
  setCurrentBet(room, bigBlind);
  
  // Set first player to act (UTG)
  room.currentPlayerIndex = (bigBlindPos + 1) % players.length;
  setCurrentTurn(room, players[room.currentPlayerIndex].sessionId);
  
  broadcastBlindsPosted(room, {
    smallBlind: { playerId: smallBlindPlayer.sessionId, amount: smallBlind },
    bigBlind: { playerId: bigBlindPlayer.sessionId, amount: bigBlind },
    currentBet: room.state.currentBet,
    pot: room.state.pot
  });
  
  helpers.startTurnTimer();
}
