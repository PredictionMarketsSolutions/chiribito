/**
 * Types for game UI rendering (refs + context).
 */

import type { RoomState } from "../types";
import type { WinnerDisplayState } from "./winner-display";

/** Subset passed to TableScene.syncFromState (avoids circular refs with GameUiContext). */
export type GameUiTableSyncContext = {
  currentSessionId: string | null;
  winnerDisplayState: WinnerDisplayState;
  revealedHands: Record<string, string[]> | null;
  allInRevealInProgress: boolean;
  previousCommunityCards: string[];
};

export type TableSceneController = {
  isActive: () => boolean;
  syncFromState: (state: RoomState, ctx: GameUiTableSyncContext) => void;
  /** Server-driven community update (e.g. communityCardRevealed) while state patch may lag. */
  syncCommunityFromServer: (cards: string[]) => void;
  updatePotDisplay: (value: number, previous: number | null) => void;
  playRoundEndCollectThen: (onComplete: () => void) => void;
  /**
   * Progressive board reveal for all-in showdown (replaces setTimeout + renderCardRow).
   * @param stepMs delay between revealing each new card (default 2000 to match legacy).
   */
  revealAllInSequential: (cards: string[], onComplete?: () => void, stepMs?: number) => void;
  cancelAllInReveal: () => void;
  reset: () => void;
};

export type GameUiRefs = {
  phaseStatus: HTMLSpanElement;
  turnStatus: HTMLSpanElement;
  yourTurnIndicator: HTMLDivElement;
  potStatus: HTMLSpanElement;
  betStatus: HTMLSpanElement;
  /** Sidebar — your own current bet on this street. */
  yourBetStatus: HTMLSpanElement | null;
  /** Sidebar — your remaining chip stack. */
  yourChipsStatus: HTMLSpanElement | null;
  potChip: HTMLSpanElement;
  phaseChip: HTMLSpanElement;
  /** Container for the 6-dot betting-round progress indicator. */
  phaseProgress: HTMLSpanElement | null;
  turnChip: HTMLSpanElement;
  /** Sub-label under the turn chip explaining *why* this player speaks. */
  turnReason: HTMLSpanElement | null;
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
  /** Phase string from the previous renderState call. Used to detect street transitions for the speaking-order badge. */
  previousPhase: string | null;
  allInRevealInProgress: boolean;
  latestPlayerNames: Map<string, string>;
  tableScene: TableSceneController | null;
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
