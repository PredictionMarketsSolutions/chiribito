export type LobbyPollingDeps = {
  refresh: () => Promise<void>;
  setIntervalFn?: typeof window.setInterval;
  clearIntervalFn?: typeof window.clearInterval;
  intervalMs?: number;
};

export function createLobbyPollingController(deps: LobbyPollingDeps) {
  const setIntervalFn = deps.setIntervalFn ?? window.setInterval.bind(window);
  const clearIntervalFn = deps.clearIntervalFn ?? window.clearInterval.bind(window);
  const intervalMs = deps.intervalMs ?? 5000;
  let pollId: number | null = null;

  const stop = (): void => {
    if (pollId !== null) {
      clearIntervalFn(pollId);
      pollId = null;
    }
  };

  const start = (): void => {
    stop();
    pollId = setIntervalFn(() => {
      deps.refresh().catch(() => undefined);
    }, intervalMs);
  };

  return {
    start,
    stop,
    isRunning: () => pollId !== null,
  };
}
