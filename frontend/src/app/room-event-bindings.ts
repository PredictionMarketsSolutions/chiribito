import type { RoomState } from "../types";
import type { PlayerActionPayload, TurnTimerPayload } from "../types/room-messages";
import { isPerfEnabled } from "../security";
import { perfStateChangeInc } from "../perf/perf-counters";

type RoomLike = {
  onMessage: (type: string, handler: (payload: any) => void) => void;
  onStateChange: (handler: (state: RoomState) => void) => void;
};

export type RoomEventBindingsDeps = {
  room: RoomLike;
  log: (message: string) => void;
  playActionSound: (action: string) => void;
  startTurnTimer: (turnId: string, timeoutMs: number, deadlineMs: number) => void;
  turnTimeoutMs: number;
  setLastRoomState: (state: RoomState) => void;
  isWinnerPhaseActive: () => boolean;
  renderState: (state: RoomState) => void;
  getNowMs?: () => number;
};

export function bindCoreRoomEvents(deps: RoomEventBindingsDeps): void {
  const getNowMs = deps.getNowMs ?? (() => Date.now());

  deps.room.onMessage("joined", (payload) => {
    deps.log(`Joined payload: ${JSON.stringify(payload)}`);
  });

  deps.room.onMessage("playerJoined", (payload) => {
    deps.log(`Player joined: ${JSON.stringify(payload)}`);
  });

  deps.room.onMessage("playerLeft", (payload) => {
    deps.log(`Player left: ${JSON.stringify(payload)}`);
  });

  deps.room.onMessage("playerAction", (payload: PlayerActionPayload) => {
    deps.log(`Player action: ${JSON.stringify(payload)}`);
    if (payload?.action && typeof payload.action === "string") {
      deps.playActionSound(payload.action);
    }
  });

  deps.room.onMessage("turnTimer", (payload: TurnTimerPayload) => {
    if (!payload || typeof payload !== "object") return;
    const record = payload as Record<string, unknown>;
    const turnId = typeof record.currentTurn === "string" ? record.currentTurn : "";
    const startedAt = typeof record.startedAt === "number" ? record.startedAt : null;
    const timeoutMs = typeof record.timeoutMs === "number" ? record.timeoutMs : deps.turnTimeoutMs;
    const serverTime = typeof record.serverTime === "number" ? record.serverTime : null;
    if (!turnId || startedAt === null || serverTime === null) return;

    const clientNow = getNowMs();
    const offsetMs = serverTime - clientNow;
    const deadlineMs = startedAt - offsetMs + timeoutMs;
    deps.startTurnTimer(turnId, timeoutMs, deadlineMs);
  });

  deps.room.onMessage("error", (payload) => {
    deps.log(`Server error: ${JSON.stringify(payload)}`);
  });

  deps.room.onStateChange((state) => {
    if (isPerfEnabled()) perfStateChangeInc();
    deps.setLastRoomState(state);
    if (!deps.isWinnerPhaseActive()) {
      deps.renderState(state);
    }
  });
}
