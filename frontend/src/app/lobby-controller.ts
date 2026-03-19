export type OpenLobbyDeps = {
  hasToken: () => boolean;
  setAuthOverlayVisible: (visible: boolean) => void;
  setLobbyOverlayVisible: (visible: boolean) => void;
  log: (message: string) => void;
  onEnterLobby: () => void;
  setJoinInProgress: (value: boolean) => void;
  setLobbyJoinButtonsEnabled: (enabled: boolean) => void;
  refreshLobbyRooms: () => Promise<void>;
  refreshWinnersRanking: () => Promise<void>;
  startLobbyPolling: () => void;
};

export async function openLobbyFlow(deps: OpenLobbyDeps): Promise<void> {
  if (!deps.hasToken()) {
    deps.setAuthOverlayVisible(true);
    deps.setLobbyOverlayVisible(false);
    deps.log("No token. Login o registro requerido.");
    return;
  }

  deps.setAuthOverlayVisible(false);
  deps.setLobbyOverlayVisible(true);
  deps.onEnterLobby();
  deps.setJoinInProgress(false);
  deps.setLobbyJoinButtonsEnabled(true);
  await deps.refreshLobbyRooms();
  await deps.refreshWinnersRanking();
  deps.startLobbyPolling();
}
