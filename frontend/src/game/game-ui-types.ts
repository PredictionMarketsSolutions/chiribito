/**
 * Types for game UI rendering (refs + context).
 */

import type { RoomState } from "../types";
import type { WinnerDisplayState } from "./winner-display";

export type GameUiRefs = {
  phaseStatus: HTMLSpanElement;
  turnStatus: HTMLSpanElement;
  yourTurnIndicator: HTMLDivElement;
  potStatus: HTMLSpanElement;
  betStatus: HTMLSpanElement;
  potChip: HTMLSpanElement;
  phaseChip: HTMLSpanElement;
  turnChip: HTMLSpanElement;
  turnTimerChip: HTMLSpanElement;
  winningHandStatus: HTMLSpanElement;
  winningHandChip: HTMLSpanElement;
  winnersStatus: HTMLSpanElement;
  communityStatus: HTMLSpanElement;
  handStatus: HTMLSpanElement;
  communityCardsEl: HTMLDivElement;
  handCardsEl: HTMLDivElement;
  seatsEl: HTMLDivElement;
  playersList: HTMLUListElement;
  mobileSeatsList: HTMLUListElement;
  startGameButton: HTMLButtonElement;
  checkButton: HTMLButtonElement;
  callButton: HTMLButtonElement;
  foldButton: HTMLButtonElement;
  allInButton: HTMLButtonElement;
  betButton: HTMLButtonElement;
  raiseButton: HTMLButtonElement;
};

export type GameUiContext = {
  currentSessionId: string | null;
  winnerDisplayState: WinnerDisplayState;
  revealedHands: Record<string, string[]> | null;
  previousCommunityCards: string[];
  previousHandCards: string[];
  previousPotValue: number | null;
  previousCurrentBetValue: number | null;
  allInRevealInProgress: boolean;
  latestPlayerNames: Map<string, string>;
};

export type ActionButtonsEnabled = {
  canStart: boolean;
  canCheck: boolean;
  canCall: boolean;
  canFold: boolean;
  canAllIn: boolean;
  canBet: boolean;
  canRaise: boolean;
};
