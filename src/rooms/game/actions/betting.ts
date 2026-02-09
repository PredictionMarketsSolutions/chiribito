import { Client } from "colyseus";
import type { GameRoom, GameHelpers } from "../types";
import { getPlayerName } from "../state/selectors";
import { addToPot, removeFromHand } from "../state/mutations";
import { broadcastPlayerAction } from "../state/broadcast";

export function handleBet(room: GameRoom, helpers: GameHelpers, client: Client, amount: number) {
  if (client.sessionId !== room.state.currentTurn) return;
  
  const player = room.state.users.get(client.sessionId);
  if (!player || player.isFolded) return;
  console.log(`[ACTION] ${getPlayerName(room, client.sessionId)} bet ${amount}`);
  
  const prevCurrentBet = room.state.currentBet;
  const minRaise = prevCurrentBet * 2;
  if (amount < room.state.currentBet) {
    client.send("error", { message: `${player.name}: bet must be at least ${room.state.currentBet}` });
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
  
  // Place the bet
  player.chips -= chipsToCall;
  player.currentBet += chipsToCall;
  addToPot(room, chipsToCall);

  const isRaise = amount > prevCurrentBet;
  if (isRaise) {
    room.state.currentBet = amount;
    room.state.lastRaiser = player.sessionId;
    room.playersActedThisRound.clear(); // Reset action for other players
  }
  
  room.playersActedThisRound.add(player.sessionId);
  
  broadcastPlayerAction(room, {
    playerId: player.sessionId,
    action: isRaise ? "raise" : "bet",
    amount,
    pot: room.state.pot
  });
  
  helpers.endTurn();
}

export function handleCall(room: GameRoom, helpers: GameHelpers, client: Client) {
  if (client.sessionId !== room.state.currentTurn) return;
  
  const player = room.state.users.get(client.sessionId);
  if (!player || player.isFolded) return;
  console.log(`[ACTION] ${getPlayerName(room, client.sessionId)} call`);
  
  const chipsToCall = room.state.currentBet - player.currentBet;
  if (chipsToCall <= 0) {
    handleCheck(room, helpers, client);
    return;
  }
  
  const actualCall = Math.min(chipsToCall, player.chips);
  player.chips -= actualCall;
  player.currentBet += actualCall;
  addToPot(room, actualCall);
  
  room.playersActedThisRound.add(player.sessionId);
  
  broadcastPlayerAction(room, {
    playerId: player.sessionId,
    action: actualCall < chipsToCall ? "allIn" : "call",
    amount: actualCall,
    pot: room.state.pot
  });
  
  if (actualCall < chipsToCall) {
    room.playersAllIn.add(player.sessionId);
  }
  
  helpers.endTurn();
}

export function handleCheck(room: GameRoom, helpers: GameHelpers, client: Client) {
  if (client.sessionId !== room.state.currentTurn) return;
  
  const player = room.state.users.get(client.sessionId);
  if (!player || player.isFolded) return;
  console.log(`[ACTION] ${getPlayerName(room, client.sessionId)} check`);
  
  if (player.currentBet < room.state.currentBet) {
    client.send("error", { message: `${player.name}: cannot check, you need to call or fold` });
    return;
  }
  
  broadcastPlayerAction(room, {
    playerId: player.sessionId,
    action: "check",
    pot: room.state.pot
  });
  
  room.playersActedThisRound.add(player.sessionId);
  helpers.endTurn();
}

export function handleRaise(room: GameRoom, helpers: GameHelpers, client: Client, amount: number) {
  const player = room.state.users.get(client.sessionId);
  console.log(`[ACTION] ${player?.name ?? "Unknown"} raise ${amount}`);
  handleBet(room, helpers, client, room.state.currentBet + amount);
}

export function handleFold(room: GameRoom, helpers: GameHelpers, client: Client) {
  if (client.sessionId !== room.state.currentTurn) return;
  
  const player = room.state.users.get(client.sessionId);
  if (!player || player.isFolded) return;
  console.log(`[ACTION] ${getPlayerName(room, client.sessionId)} fold`);
  
  player.isFolded = true;
  removeFromHand(room, client.sessionId);
  
  broadcastPlayerAction(room, {
    playerId: player.sessionId,
    action: "fold"
  });
  
  // If only one player remains, they win
  if (room.playersInHand.length === 1) {
    helpers.endRound([room.playersInHand[0]], "Gana por fold");
    return;
  }
  
  helpers.endTurn();
}

export function handleFoldFromTimeout(room: GameRoom, helpers: GameHelpers, sessionId: string) {
  const player = room.state.users.get(sessionId);
  if (!player || player.isFolded) return;
  handleFold(room, helpers, { sessionId } as Client);
}
