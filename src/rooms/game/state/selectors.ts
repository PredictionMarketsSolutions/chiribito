import type { GameRoom } from "../types";

export function getPlayer(room: GameRoom, sessionId: string) {
  return room.state.users.get(sessionId);
}

export function getPlayerName(room: GameRoom, sessionId: string) {
  return getPlayer(room, sessionId)?.name ?? sessionId;
}

export function getPlayersWithChips(room: GameRoom) {
  return Array.from(room.state.users.values()).filter(p => p.chips > 0);
}

export function getActivePlayerIds(room: GameRoom) {
  return room.playersInHand
    .filter(id => !room.state.users.get(id)!.isFolded)
    .filter(id => !room.playersAllIn.has(id));
}

export function getFirstActivePlayerIndex(room: GameRoom) {
  return room.playersInHand.findIndex(id =>
    !room.state.users.get(id)!.isFolded && !room.playersAllIn.has(id)
  );
}
