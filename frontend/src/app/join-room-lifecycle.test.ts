import { describe, it, expect, vi } from "vitest";
import { applyPostJoinSetup, finalizeJoinAttempt } from "./join-room-lifecycle";
import type { WinnerDisplayState } from "../game";

function createWinnerState(): WinnerDisplayState {
  return {
    lastWinners: ["old"],
    lastWinningHand: "old",
    winnerDisplayUntil: 0,
    winnerDisplayTimeoutId: null,
  };
}

describe("join-room-lifecycle", () => {
  function buildPostJoinDeps(
    joinedRoom: any,
    overrides: Partial<Parameters<typeof applyPostJoinSetup>[0]> = {},
  ) {
    return {
      joinedRoom,
      setRoom: vi.fn(),
      setCurrentSessionId: vi.fn(),
      setShouldAutoReconnect: vi.fn(),
      setTournamentEnded: vi.fn(),
      setAuthOverlayVisible: vi.fn(),
      setLobbyOverlayVisible: vi.fn(),
      setTournamentResultVisible: vi.fn(),
      stopLobbyPolling: vi.fn(),
      setConnectionState: vi.fn(),
      setReconnectAttempts: vi.fn(),
      winnerDisplayState: createWinnerState(),
      clearDeferredTournamentTimer: vi.fn(),
      winningHandStatusEl: document.createElement("span"),
      winningHandChipEl: document.createElement("span"),
      winnersStatusEl: document.createElement("span"),
      clearHandHistory: vi.fn(),
      renderHandHistoryUi: vi.fn(),
      preloadCardImages: vi.fn(),
      setRoomStatusText: vi.fn(),
      saveLastRoomId: vi.fn(),
      saveReconnectionToken: vi.fn(),
      log: vi.fn(),
      ...overrides,
    };
  }

  it("applyPostJoinSetup resets ui/session state and returns room id", () => {
    const winnerDisplayState = createWinnerState();
    const joinedRoom = { sessionId: "s1", id: "r1" } as any;
    const winningHandStatusEl = document.createElement("span");
    const winningHandChipEl = document.createElement("span");
    const winnersStatusEl = document.createElement("span");

    const roomId = applyPostJoinSetup({
      ...buildPostJoinDeps(joinedRoom),
      winnerDisplayState,
      winningHandStatusEl,
      winningHandChipEl,
      winnersStatusEl,
    });

    expect(roomId).toBe("r1");
    expect(winnerDisplayState.lastWinningHand).toBe("-");
    expect(winnerDisplayState.lastWinners).toEqual([]);
    expect(winningHandStatusEl.textContent).toBe("-");
    expect(winningHandChipEl.textContent).toBe("-");
    expect(winnersStatusEl.textContent).toBe("-");
  });

  it("applyPostJoinSetup persists reconnectionToken when room exposes one", () => {
    const saveReconnectionToken = vi.fn();
    const saveLastRoomId = vi.fn();
    applyPostJoinSetup(
      buildPostJoinDeps(
        { sessionId: "s2", id: "r2", reconnectionToken: "recon-abc" },
        { saveReconnectionToken, saveLastRoomId },
      ),
    );
    expect(saveLastRoomId).toHaveBeenCalledWith("r2");
    expect(saveReconnectionToken).toHaveBeenCalledTimes(1);
    expect(saveReconnectionToken).toHaveBeenCalledWith("recon-abc");
  });

  it("applyPostJoinSetup does NOT call saveReconnectionToken when token is missing or empty", () => {
    const saveReconnectionToken = vi.fn();
    applyPostJoinSetup(
      buildPostJoinDeps(
        { sessionId: "s3", id: "r3" /* no reconnectionToken */ },
        { saveReconnectionToken },
      ),
    );
    expect(saveReconnectionToken).not.toHaveBeenCalled();

    const saveReconnectionToken2 = vi.fn();
    applyPostJoinSetup(
      buildPostJoinDeps(
        { sessionId: "s4", id: "r4", reconnectionToken: "" },
        { saveReconnectionToken: saveReconnectionToken2 },
      ),
    );
    expect(saveReconnectionToken2).not.toHaveBeenCalled();
  });

  it("finalizeJoinAttempt enables buttons immediately for non-create", () => {
    const setJoinInProgress = vi.fn();
    const setJoinByIdEnabled = vi.fn();
    const setCreateTableEnabled = vi.fn();
    const schedule = vi.fn();

    finalizeJoinAttempt("joinById", {
      setJoinInProgress,
      setJoinByIdEnabled,
      setCreateTableEnabled,
      schedule,
      createCooldownMs: 2000,
    });

    expect(setJoinInProgress).toHaveBeenCalledWith(false);
    expect(setJoinByIdEnabled).toHaveBeenCalledWith(true);
    expect(setCreateTableEnabled).toHaveBeenCalledWith(true);
    expect(schedule).not.toHaveBeenCalled();
  });

  it("finalizeJoinAttempt schedules create button enable on create mode", () => {
    const setCreateTableEnabled = vi.fn();
    const schedule = vi.fn((cb: () => void) => cb());

    finalizeJoinAttempt("create", {
      setJoinInProgress: vi.fn(),
      setJoinByIdEnabled: vi.fn(),
      setCreateTableEnabled,
      schedule,
      createCooldownMs: 2000,
    });

    expect(schedule).toHaveBeenCalledWith(expect.any(Function), 2000);
    expect(setCreateTableEnabled).toHaveBeenCalledWith(true);
  });
});
