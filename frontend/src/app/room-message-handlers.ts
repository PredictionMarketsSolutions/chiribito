import type { GameResultPayload, PlayerDisconnectedPayload } from "../types/room-messages";

type DeferredResult = { result: "won" | "lost"; champion?: GameResultPayload["champion"] } | null;

export type GameResultDeps = {
  payload: GameResultPayload;
  isWinnerPhaseActive: () => boolean;
  setDeferredTournamentResult: (value: DeferredResult) => void;
  getDeferredTournamentResult: () => DeferredResult;
  clearDeferredTimer: () => void;
  scheduleDeferredTimer: (callback: () => void, delayMs: number) => void;
  winnerDisplayMs: number;
  showTournamentResult: (result: "won" | "lost", champion?: GameResultPayload["champion"]) => void;
  renderLastState: () => void;
  log: (message: string) => void;
};

export function handleGameResultMessage(deps: GameResultDeps): void {
  const result: "won" | "lost" = deps.payload?.result === "won" ? "won" : "lost";
  deps.setDeferredTournamentResult({ result, champion: deps.payload?.champion });
  deps.log(result === "won" ? "¡Has ganado la mesa!" : "Has perdido. La mesa se ha cerrado.");

  if (deps.isWinnerPhaseActive()) {
    return;
  }

  deps.clearDeferredTimer();
  deps.scheduleDeferredTimer(() => {
    const deferred = deps.getDeferredTournamentResult();
    if (deferred) {
      deps.showTournamentResult(deferred.result, deferred.champion);
      deps.setDeferredTournamentResult(null);
    }
    deps.renderLastState();
  }, deps.winnerDisplayMs);
}

export function handlePlayerDisconnectedMessage(
  payload: PlayerDisconnectedPayload,
  log: (message: string) => void
): void {
  console.log("Player disconnected", payload);
  log(`${payload.playerName} se ha desconectado${payload.wasCurrentTurn ? " (era su turno)" : ""}`);
}

export type HeartbeatAckDeps = {
  lastHeartbeatSendTime: number;
  nowMs: number;
  recordRtt: (rttMs: number) => void;
  clearHeartbeatTimeout: () => void;
  isConnected: () => boolean;
  setConnected: () => void;
  replayBufferedActions: () => void;
};

export function handleHeartbeatAckMessage(deps: HeartbeatAckDeps): void {
  if (deps.lastHeartbeatSendTime > 0) {
    deps.recordRtt(deps.nowMs - deps.lastHeartbeatSendTime);
  }
  deps.clearHeartbeatTimeout();
  if (!deps.isConnected()) {
    deps.setConnected();
    deps.replayBufferedActions();
  }
}
