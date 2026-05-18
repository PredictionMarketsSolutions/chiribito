import type { Room } from "@colyseus/sdk";
import type { WinnerDisplayState, TurnTimerState } from "../game";
import type { GameUiContext } from "../game/game-ui-types";

type ActionButtonsFlags = {
  canStart: boolean;
  canCheck: boolean;
  canCall: boolean;
  canFold: boolean;
  canAllIn: boolean;
  canBet: boolean;
  canRaise: boolean;
};

export type ResetRoomUiDeps = {
  getRoom: () => Room | null;
  disconnectRoom: (room: Room | null) => void;
  setRoom: (room: Room | null) => void;
  setCurrentSessionId: (sessionId: string | null) => void;
  clearWinnerDisplay: (state: WinnerDisplayState) => void;
  winnerDisplayState: WinnerDisplayState;
  clearDeferredTournamentTimer: () => void;
  setRevealedHands: (hands: Record<string, string[]> | null) => void;
  gameUiContext: GameUiContext;
  resetPreviousWinnersKey: () => void;
  resetAllInState: () => void;
  clearAllInAnimationTimeout: () => void;
  clearHandHistory: () => void;
  renderHandHistoryUi: () => void;
  setAuthOverlayVisible: (visible: boolean) => void;
  setAuthMessage: (message: string, type?: "success" | "error" | "info") => void;
  roomStatusEl: HTMLElement;
  phaseStatusEl: HTMLElement;
  turnStatusEl: HTMLElement;
  stopTurnTimer: (state: TurnTimerState, chipEl: HTMLElement) => void;
  turnTimerState: TurnTimerState;
  turnTimerChipEl: HTMLElement;
  potStatusEl: HTMLElement;
  betStatusEl: HTMLElement;
  communityStatusEl: HTMLElement;
  handStatusEl: HTMLElement;
  winningHandStatusEl: HTMLElement;
  winnersStatusEl: HTMLElement;
  potChipEl: HTMLElement;
  phaseChipEl: HTMLElement;
  turnChipEl: HTMLElement;
  winningHandChipEl: HTMLElement;
  renderCardRow: (el: HTMLElement, cards: string[], count: number) => void;
  communityCardsEl: HTMLElement;
  handCardsEl: HTMLElement;
  playersListEl: HTMLElement;
  syncGameUiContext: () => void;
  renderSeats: () => void;
  setActionButtonsEnabled: (flags: ActionButtonsFlags) => void;
  /** Clear Pixi table layer when leaving room (optional). */
  disarmTableScene?: () => void;
};

export function resetRoomUi(deps: ResetRoomUiDeps, message?: string): void {
  deps.disconnectRoom(deps.getRoom());
  deps.setRoom(null);
  deps.setCurrentSessionId(null);
  deps.clearWinnerDisplay(deps.winnerDisplayState);
  deps.clearDeferredTournamentTimer();
  deps.setRevealedHands(null);
  deps.gameUiContext.revealedHands = null;
  deps.gameUiContext.tableScene = null;
  deps.disarmTableScene?.();
  deps.gameUiContext.previousPotValue = null;
  deps.gameUiContext.previousCurrentBetValue = null;
  deps.resetPreviousWinnersKey();
  deps.resetAllInState();
  deps.gameUiContext.allInRevealInProgress = false;
  deps.gameUiContext.previousCommunityCards.length = 0;
  deps.gameUiContext.previousHandCards.length = 0;
  deps.clearAllInAnimationTimeout();
  deps.clearHandHistory();
  deps.renderHandHistoryUi();
  deps.setAuthOverlayVisible(true);
  deps.setAuthMessage("", "info");
  deps.roomStatusEl.textContent = message || "sin mesa";
  deps.phaseStatusEl.textContent = "Esperando";
  deps.turnStatusEl.textContent = "-";
  deps.stopTurnTimer(deps.turnTimerState, deps.turnTimerChipEl);
  deps.potStatusEl.textContent = "0";
  deps.betStatusEl.textContent = "0";
  deps.communityStatusEl.textContent = "-";
  deps.handStatusEl.textContent = "-";
  deps.winningHandStatusEl.textContent = "-";
  deps.winnersStatusEl.textContent = "-";
  deps.potChipEl.textContent = "0";
  deps.phaseChipEl.textContent = "Esperando";
  deps.turnChipEl.textContent = "-";
  deps.turnTimerChipEl.textContent = "-";
  deps.winningHandChipEl.textContent = "-";
  deps.renderCardRow(deps.communityCardsEl, [], 5);
  deps.renderCardRow(deps.handCardsEl, [], 2);
  deps.handCardsEl.classList.remove("has-perla");
  deps.playersListEl.innerHTML = "";
  deps.syncGameUiContext();
  deps.renderSeats();
  deps.setActionButtonsEnabled({
    canStart: false,
    canCheck: false,
    canCall: false,
    canFold: false,
    canAllIn: false,
    canBet: false,
    canRaise: false,
  });
}
