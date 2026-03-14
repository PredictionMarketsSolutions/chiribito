/**
 * Tipos de payloads de mensajes de sala (room.onMessage).
 * Alineados con el backend GameBroadcaster y MyRoom.
 */

export type GameResultPayload = {
  result?: "won" | "lost";
  champion?: {
    sessionId?: string;
    name?: string;
    chips?: number;
  };
};

export type RoundEndedPayload = {
  winners?: Array<{ playerId: string; amount: number }>;
  communityCards?: string[] | unknown;
  winningHand?: string;
  isAllInShowdown?: boolean;
  playerHands?: Record<string, string[]>;
};

export type CommunityCardRevealedPayload = {
  index?: number;
  card?: string;
  communityCards?: string[] | unknown;
};

export type PlayerActionPayload = {
  action?: string;
  playerId?: string;
  amount?: number;
  pot?: number;
};

export type TurnTimerPayload = {
  currentTurn?: string;
  startedAt?: number;
  timeoutMs?: number;
  serverTime?: number;
};

export type PlayerDisconnectedPayload = {
  playerName?: string;
  wasCurrentTurn?: boolean;
  [key: string]: unknown;
};

export type ErrorPayload = {
  message?: string;
  [key: string]: unknown;
};
