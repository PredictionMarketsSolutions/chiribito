import { describe, it, expect, vi, beforeEach } from "vitest";
import { openLobbyFlow, type OpenLobbyDeps } from "./lobby-controller";

describe("lobby-controller", () => {
  let deps: OpenLobbyDeps;

  beforeEach(() => {
    deps = {
      hasToken: vi.fn(() => true),
      setAuthOverlayVisible: vi.fn(),
      setLobbyOverlayVisible: vi.fn(),
      log: vi.fn(),
      onEnterLobby: vi.fn(),
      setJoinInProgress: vi.fn(),
      setLobbyJoinButtonsEnabled: vi.fn(),
      refreshLobbyRooms: vi.fn().mockResolvedValue(undefined),
      refreshWinnersRanking: vi.fn().mockResolvedValue(undefined),
      startLobbyPolling: vi.fn(),
    };
  });

  it("shows auth overlay and logs when there is no token", async () => {
    vi.mocked(deps.hasToken).mockReturnValue(false);
    await openLobbyFlow(deps);
    expect(deps.setAuthOverlayVisible).toHaveBeenCalledWith(true);
    expect(deps.setLobbyOverlayVisible).toHaveBeenCalledWith(false);
    expect(deps.log).toHaveBeenCalledWith("No token. Login o registro requerido.");
    expect(deps.refreshLobbyRooms).not.toHaveBeenCalled();
  });

  it("opens lobby, refreshes data and starts polling when token exists", async () => {
    await openLobbyFlow(deps);
    expect(deps.setAuthOverlayVisible).toHaveBeenCalledWith(false);
    expect(deps.setLobbyOverlayVisible).toHaveBeenCalledWith(true);
    expect(deps.onEnterLobby).toHaveBeenCalled();
    expect(deps.setJoinInProgress).toHaveBeenCalledWith(false);
    expect(deps.setLobbyJoinButtonsEnabled).toHaveBeenCalledWith(true);
    expect(deps.refreshLobbyRooms).toHaveBeenCalled();
    expect(deps.refreshWinnersRanking).toHaveBeenCalled();
    expect(deps.startLobbyPolling).toHaveBeenCalled();
  });
});
