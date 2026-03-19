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
  it("applyPostJoinSetup resets ui/session state and returns room id", () => {
    const winnerDisplayState = createWinnerState();
    const joinedRoom = { sessionId: "s1", id: "r1" } as any;
    const winningHandStatusEl = document.createElement("span");
    const winningHandChipEl = document.createElement("span");
    const winnersStatusEl = document.createElement("span");

    const roomId = applyPostJoinSetup({
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
      winnerDisplayState,
      clearDeferredTournamentTimer: vi.fn(),
      winningHandStatusEl,
      winningHandChipEl,
      winnersStatusEl,
      clearHandHistory: vi.fn(),
      renderHandHistoryUi: vi.fn(),
      preloadCardImages: vi.fn(),
      setRoomStatusText: vi.fn(),
      saveLastRoomId: vi.fn(),
      log: vi.fn(),
    });

    expect(roomId).toBe("r1");
    expect(winnerDisplayState.lastWinningHand).toBe("-");
    expect(winnerDisplayState.lastWinners).toEqual([]);
    expect(winningHandStatusEl.textContent).toBe("-");
    expect(winningHandChipEl.textContent).toBe("-");
    expect(winnersStatusEl.textContent).toBe("-");
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
