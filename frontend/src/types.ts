/**
 * Frontend game and UI types
 */
export type PlayerState = {
  sessionId: string;
  name: string;
  chips: number;
  currentBet: number;
  isFolded: boolean;
  seatIndex: number;
  hand?: string[];
};

export type RoomState = {
  users?: Map<string, PlayerState> | Record<string, PlayerState>;
  dealerIndex?: number;
  currentTurn?: string;
  phase?: string;
  pot?: number;
  currentBet?: number;
  roundStarted?: boolean;
  communityCards?: string[] | { toArray?: () => string[]; length?: number };
};

export type HandHistoryWinner = {
  playerId: string;
  amount?: number;
};

export type HandHistoryEntry = {
  id: number;
  timestamp: number;
  winners: HandHistoryWinner[];
  winningHand: string;
  /** Cartas privadas del primer ganador (para mostrar junto al nombre de la jugada). */
  winningCards?: string[];
  communityCards: string[];
  pot: number;
  yourHand?: string[];
};

export type SoundEffect =
  | "bet"
  | "call"
  | "raise"
  | "check"
  | "fold"
  | "allIn"
  | "win"
  | "lose"
  | "deal"
  | "reveal"
  | "click"
  | "hover"
  | "yourTurn"
  | "perlaArrive"
  | "tick";

export type ConnectionState = "disconnected" | "connecting" | "connected";

export type BufferedAction = {
  action: string;
  data: unknown;
  timestamp: number;
};
