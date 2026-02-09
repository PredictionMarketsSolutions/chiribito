import type { GameRoom } from "../types";

export function broadcastBlindsPosted(
  room: GameRoom,
  payload: {
    smallBlind: { playerId: string; amount: number };
    bigBlind: { playerId: string; amount: number };
    currentBet: number;
    pot: number;
  }
) {
  room.broadcast("blindsPosted", payload);
}

export function broadcastBettingRoundStarted(
  room: GameRoom,
  payload: {
    phase: string;
    currentTurn: string;
    currentBet: number;
    pot: number;
  }
) {
  room.broadcast("bettingRoundStarted", payload);
}

export function broadcastPlayerAction(
  room: GameRoom,
  payload: {
    playerId: string;
    action: string;
    amount?: number;
    pot?: number;
  }
) {
  room.broadcast("playerAction", payload);
}

export function broadcastRoundEnded(
  room: GameRoom,
  payload: {
    winners: Array<{ playerId: string; amount: number }>;
    communityCards: string[];
    playerHands: Record<string, string[]>;
  }
) {
  room.broadcast("roundEnded", payload);
}
