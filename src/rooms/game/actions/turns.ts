import { Client } from "@colyseus/core";
import type { GameRoom, GameHelpers } from "../types";
import { getActivePlayerIds } from "../state/selectors";
import { setCurrentTurn } from "../state/mutations";
import { TURN_TIMEOUT } from "../constants";

export function endTurn(room: GameRoom, helpers: GameHelpers) {
  if (room.turnTimeout) clearTimeout(room.turnTimeout);
  const current = room.state.users.get(room.state.currentTurn);
  console.log(`[TURN] End turn for ${current?.name ?? room.state.currentTurn}`);
  
  // Check if betting round is complete
  const activePlayers = getActivePlayerIds(room);
  
  const allActed = activePlayers.every(id => room.playersActedThisRound.has(id));
  
  if (activePlayers.length === 0) {
    helpers.proceedToNextPhase();
    return;
  }

  if (allActed && activePlayers.length > 0) {
    helpers.proceedToNextPhase();
    return;
  }
  
  // Move to next player
  do {
    room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.playersInHand.length;
    const nextPlayerId = room.playersInHand[room.currentPlayerIndex];
    const nextPlayer = room.state.users.get(nextPlayerId);
    
    if (!nextPlayer || nextPlayer.isFolded || room.playersAllIn.has(nextPlayerId)) continue;
    
    setCurrentTurn(room, nextPlayerId);
    helpers.startTurnTimer();
    return;
    
  } while (true);
}

export function startTurnTimer(room: GameRoom, helpers: GameHelpers) {
  if (room.turnTimeout) clearTimeout(room.turnTimeout);
  
  room.turnTimeout = setTimeout(() => {
    // Auto-fold if time runs out
    const player = room.state.users.get(room.state.currentTurn);
    if (player && !player.isFolded) {
      helpers.handleFoldForTimeout(player.sessionId);
    }
  }, TURN_TIMEOUT);
}

export function foldFromTimeout(room: GameRoom, helpers: GameHelpers, sessionId: string) {
  helpers.handleFoldForTimeout(sessionId);
}
