import type { Room } from "@colyseus/sdk";
import type { WinnerDisplayState } from "../game";

export type ApplyPostJoinSetupDeps = {
  joinedRoom: Room;
  setRoom: (room: Room) => void;
  setCurrentSessionId: (sessionId: string | null) => void;
  setShouldAutoReconnect: (value: boolean) => void;
  setTournamentEnded: (value: boolean) => void;
  setAuthOverlayVisible: (value: boolean) => void;
  setLobbyOverlayVisible: (value: boolean) => void;
  setTournamentResultVisible: (value: boolean) => void;
  stopLobbyPolling: () => void;
  setConnectionState: (state: "disconnected" | "connecting" | "connected") => void;
  setReconnectAttempts: (value: number) => void;
  winnerDisplayState: WinnerDisplayState;
  clearDeferredTournamentTimer: () => void;
  winningHandStatusEl: HTMLElement;
  winningHandChipEl: HTMLElement;
  winnersStatusEl: HTMLElement;
  clearHandHistory: () => void;
  renderHandHistoryUi: () => void;
  preloadCardImages: () => void;
  setRoomStatusText: (text: string) => void;
  saveLastRoomId: (roomId: string) => void;
  log: (message: string) => void;
};

export function applyPostJoinSetup(deps: ApplyPostJoinSetupDeps): string {
  deps.setRoom(deps.joinedRoom);
  deps.setCurrentSessionId(deps.joinedRoom.sessionId);
  deps.setShouldAutoReconnect(true);
  deps.setTournamentEnded(false);
  deps.setAuthOverlayVisible(false);
  deps.setLobbyOverlayVisible(false);
  deps.setTournamentResultVisible(false);
  deps.stopLobbyPolling();
  deps.setConnectionState("connected");
  deps.setReconnectAttempts(0);
  deps.winnerDisplayState.lastWinningHand = "-";
  deps.winnerDisplayState.lastWinners = [];
  deps.clearDeferredTournamentTimer();
  deps.winningHandStatusEl.textContent = deps.winnerDisplayState.lastWinningHand;
  deps.winningHandChipEl.textContent = deps.winnerDisplayState.lastWinningHand;
  deps.winnersStatusEl.textContent = "-";
  deps.clearHandHistory();
  deps.renderHandHistoryUi();
  deps.preloadCardImages();

  const roomId = (deps.joinedRoom as { id?: string; roomId?: string }).id
    ?? (deps.joinedRoom as { roomId?: string }).roomId
    ?? "joined";
  deps.setRoomStatusText(roomId);
  deps.saveLastRoomId(roomId);
  deps.log("Joined room successfully.");
  return roomId;
}

export function finalizeJoinAttempt(
  mode: "joinOrCreate" | "create" | "joinById",
  refs: {
    setJoinInProgress: (value: boolean) => void;
    setJoinByIdEnabled: (enabled: boolean) => void;
    setCreateTableEnabled: (enabled: boolean) => void;
    schedule: (callback: () => void, delayMs: number) => void;
    createCooldownMs: number;
  }
): void {
  refs.setJoinInProgress(false);
  refs.setJoinByIdEnabled(true);
  if (mode === "create") {
    refs.schedule(() => {
      refs.setCreateTableEnabled(true);
    }, refs.createCooldownMs);
  } else {
    refs.setCreateTableEnabled(true);
  }
}
