/**
 * Winner display phase (5s after round end). State is owned by caller.
 */

export const WINNER_DISPLAY_MS = 5000;

export type WinnerDisplayState = {
  lastWinners: string[];
  lastWinningHand: string;
  winnerDisplayUntil: number;
  winnerDisplayTimeoutId: ReturnType<typeof setTimeout> | null;
};

export function startWinnerDisplayPhase(
  state: WinnerDisplayState,
  onTimeout: () => void
): void {
  if (state.winnerDisplayTimeoutId !== null) {
    clearTimeout(state.winnerDisplayTimeoutId);
    state.winnerDisplayTimeoutId = null;
  }
  state.winnerDisplayUntil = Date.now() + WINNER_DISPLAY_MS;
  state.winnerDisplayTimeoutId = setTimeout(() => {
    state.winnerDisplayUntil = 0;
    state.lastWinners = [];
    state.lastWinningHand = "-";
    state.winnerDisplayTimeoutId = null;
    onTimeout();
  }, WINNER_DISPLAY_MS);
}

export function clearWinnerDisplay(state: WinnerDisplayState): void {
  state.lastWinners = [];
  state.lastWinningHand = "-";
  state.winnerDisplayUntil = 0;
  if (state.winnerDisplayTimeoutId !== null) {
    clearTimeout(state.winnerDisplayTimeoutId);
    state.winnerDisplayTimeoutId = null;
  }
}

export function isInWinnerPhase(state: WinnerDisplayState): boolean {
  return state.winnerDisplayUntil > 0 && Date.now() < state.winnerDisplayUntil;
}
