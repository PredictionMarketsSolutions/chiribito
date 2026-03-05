import type { MyRoomState } from "../rooms/schema/MyRoomState";
import type { Client } from "@colyseus/core";

/**
 * IGameRoom - Interface to decouple GameEngine from MyRoom concrete implementation
 * Enables testing GameEngine with mocks and reduces tight coupling
 */
export interface IGameRoom {
  // Room properties
  readonly roomId: string;
  readonly state: MyRoomState;
  readonly clients: Client[];

  // Game state - players and cards
  playersInHand: string[];
  readonly playersAllIn: Set<string>;
  readonly playersActedThisRound: Set<string>;
  dealerIndex: number;
  currentPlayerIndex: number;
  turnTimeout: NodeJS.Timeout | null;

  // Broadcasting method (from Colyseus Room)
  broadcast(type: string, data?: any): void;

  /** Schedule a callback after delay (e.g. for all-in showdown card reveal). */
  scheduleDelayed(callback: () => void, ms: number): void;
}
