import type { MyRoom } from "../MyRoom";

export type GameRoom = MyRoom;

export interface GameHelpers {
  startNewHand(): void;
  postBlinds(): void;
  startBettingRound(): void;
  endTurn(): void;
  proceedToNextPhase(): void;
  determineWinners(): string[];
  endRound(winners: string[]): void;
  startTurnTimer(): void;
  handleFoldForTimeout(sessionId: string): void;
}
