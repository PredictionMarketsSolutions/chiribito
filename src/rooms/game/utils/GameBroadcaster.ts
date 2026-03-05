/**
 * GameBroadcaster.ts
 * Event broadcasting for game state changes
 */

import type { IGameRoom } from "../../../types/IGameRoom";

export class GameBroadcaster {
  constructor(private room: IGameRoom) {}

  broadcastBettingRoundStarted(payload: {
    phase: string;
    currentTurn: string;
    currentBet: number;
    pot: number;
  }): void {
    this.room.broadcast("bettingRoundStarted", payload);
  }

  broadcastPlayerAction(payload: {
    playerId: string;
    action: string;
    amount?: number;
    pot?: number;
  }): void {
    this.room.broadcast("playerAction", payload);
  }

  broadcastRoundEnded(payload: {
    winners: Array<{ playerId: string; amount: number }>;
    communityCards: string[];
    winningHand: string;
    isAllInShowdown: boolean;
    playerHands: Record<string, string[]>;
  }): void {
    this.room.broadcast("roundEnded", payload);
  }

  broadcastTurnTimer(payload: {
    currentTurn: string;
    startedAt: number;
    timeoutMs: number;
    serverTime: number;
  }): void {
    this.room.broadcast("turnTimer", payload);
  }

  broadcastGameEnded(payload: {
    champion: {
      sessionId: string;
      name: string;
      chips: number;
    };
  }): void {
    this.room.broadcast("gameEnded", payload);
  }
}
