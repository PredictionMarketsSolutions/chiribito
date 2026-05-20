/**
 * Turn timer UI (countdown chip). State owned by caller.
 */

export type TurnTimerState = {
  turnTimerId: ReturnType<typeof setInterval> | null;
  turnDeadlineMs: number | null;
  lastTurnId: string | null;
  lastTurnTimeoutMs: number | null;
};

export function startTurnTimer(
  state: TurnTimerState,
  turnId: string,
  timeoutMs: number,
  chipEl: HTMLElement,
  deadlineMs?: number,
  onSecond?: (secondsLeft: number) => void
): void {
  state.lastTurnId = turnId;
  state.lastTurnTimeoutMs = timeoutMs;
  state.turnDeadlineMs = typeof deadlineMs === "number" ? deadlineMs : Date.now() + timeoutMs;

  let lastSecond = -1;
  const tick = () => {
    if (!state.turnDeadlineMs) return;
    const remainingMs = state.turnDeadlineMs - Date.now();
    const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    chipEl.textContent = `${remainingSeconds}s`;
    if (onSecond && remainingSeconds !== lastSecond) {
      lastSecond = remainingSeconds;
      onSecond(remainingSeconds);
    }
  };

  if (state.turnTimerId !== null) {
    clearInterval(state.turnTimerId);
  }
  tick();
  state.turnTimerId = setInterval(tick, 250);
}

export function stopTurnTimer(state: TurnTimerState, chipEl: HTMLElement): void {
  if (state.turnTimerId !== null) {
    clearInterval(state.turnTimerId);
    state.turnTimerId = null;
  }
  state.turnDeadlineMs = null;
  state.lastTurnId = null;
  state.lastTurnTimeoutMs = null;
  chipEl.textContent = "-";
}

export function updateTurnTimer(
  state: TurnTimerState,
  currentTurnId: string,
  roundActive: boolean,
  chipEl: HTMLElement,
  defaultTimeoutMs: number,
  onSecond?: (secondsLeft: number) => void
): void {
  if (!roundActive || !currentTurnId) {
    stopTurnTimer(state, chipEl);
    return;
  }
  if (currentTurnId !== state.lastTurnId || state.turnDeadlineMs === null) {
    startTurnTimer(state, currentTurnId, defaultTimeoutMs, chipEl, undefined, onSecond);
  }
}
