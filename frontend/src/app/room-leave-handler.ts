export type RoomLeaveDeps = {
  code: number;
  isTournamentEnded: () => boolean;
  setTournamentEnded: (value: boolean) => void;
  setHadRoomWhenBackgrounded: (value: boolean) => void;
  setShouldAutoReconnect: (value: boolean) => void;
  clearLastRoomId: () => void;
  clearAuthToken: () => void;
  resetRoomUi: (message?: string) => void;
  setConnectionState: (state: "disconnected" | "connecting" | "connected") => void;
  clearCurrentRoomRefs: () => void;
  isTournamentResultOverlayHidden: () => boolean;
  showGameEndMessage: () => void;
  log: (message: string) => void;
  attemptReconnect: () => void;
  alertUser: (message: string) => void;
};

export function handleRoomLeave(deps: RoomLeaveDeps): void {
  // 4011 = session replaced by another login.
  if (deps.code === 4011) {
    deps.alertUser("Tu sesion fue reemplazada por otro ingreso.");
    deps.setShouldAutoReconnect(false);
    deps.clearLastRoomId();
    deps.clearAuthToken();
    deps.resetRoomUi("replaced");
    deps.setConnectionState("disconnected");
    return;
  }

  // 4013 = table closed after tournament end.
  if (deps.code === 4013) {
    deps.setTournamentEnded(true);
    deps.setHadRoomWhenBackgrounded(false);
    deps.setShouldAutoReconnect(false);
    deps.clearLastRoomId();
    deps.setConnectionState("disconnected");
    deps.clearCurrentRoomRefs();
    if (!deps.isTournamentResultOverlayHidden()) return;
    deps.showGameEndMessage();
    return;
  }

  if (deps.isTournamentEnded()) {
    deps.setHadRoomWhenBackgrounded(false);
    deps.setShouldAutoReconnect(false);
    deps.clearLastRoomId();
    deps.setConnectionState("disconnected");
    deps.clearCurrentRoomRefs();
    if (!deps.isTournamentResultOverlayHidden()) return;
    deps.showGameEndMessage();
    return;
  }

  deps.log(`Disconnected from room (code: ${deps.code}). Attempting to reconnect...`);
  deps.setConnectionState("disconnected");
  deps.attemptReconnect();
}
