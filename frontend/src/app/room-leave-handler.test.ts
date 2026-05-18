import { describe, it, expect, vi } from "vitest";
import { handleRoomLeave, type RoomLeaveDeps } from "./room-leave-handler";

describe("room-leave-handler", () => {
  function makeDeps(overrides: Partial<RoomLeaveDeps> = {}): RoomLeaveDeps {
    return {
      code: 4000,
      isTournamentEnded: vi.fn(() => false),
      setTournamentEnded: vi.fn(),
      setHadRoomWhenBackgrounded: vi.fn(),
      setShouldAutoReconnect: vi.fn(),
      clearLastRoomId: vi.fn(),
      clearReconnectionToken: vi.fn(),
      clearAuthToken: vi.fn(),
      resetRoomUi: vi.fn(),
      setConnectionState: vi.fn(),
      clearCurrentRoomRefs: vi.fn(),
      isTournamentResultOverlayHidden: vi.fn(() => true),
      showGameEndMessage: vi.fn(),
      log: vi.fn(),
      attemptReconnect: vi.fn(),
      alertUser: vi.fn(),
      ...overrides,
    };
  }

  it("handles code 4011 (session replaced)", () => {
    const deps = makeDeps({ code: 4011 });
    handleRoomLeave(deps);
    expect(deps.alertUser).toHaveBeenCalledWith("Tu sesion fue reemplazada por otro ingreso.");
    expect(deps.clearAuthToken).toHaveBeenCalled();
    expect(deps.clearReconnectionToken).toHaveBeenCalledTimes(1);
    expect(deps.resetRoomUi).toHaveBeenCalledWith("replaced");
    expect(deps.setConnectionState).toHaveBeenCalledWith("disconnected");
    expect(deps.attemptReconnect).not.toHaveBeenCalled();
  });

  it("handles code 4013 and shows end message when overlay hidden", () => {
    const deps = makeDeps({ code: 4013, isTournamentResultOverlayHidden: vi.fn(() => true) });
    handleRoomLeave(deps);
    expect(deps.setTournamentEnded).toHaveBeenCalledWith(true);
    expect(deps.clearCurrentRoomRefs).toHaveBeenCalled();
    expect(deps.clearReconnectionToken).toHaveBeenCalledTimes(1);
    expect(deps.showGameEndMessage).toHaveBeenCalled();
  });

  it("handles code 4013 without showing message when overlay is visible", () => {
    const deps = makeDeps({ code: 4013, isTournamentResultOverlayHidden: vi.fn(() => false) });
    handleRoomLeave(deps);
    expect(deps.showGameEndMessage).not.toHaveBeenCalled();
    expect(deps.clearReconnectionToken).toHaveBeenCalledTimes(1);
  });

  it("handles leave while tournament already ended", () => {
    const deps = makeDeps({ isTournamentEnded: vi.fn(() => true) });
    handleRoomLeave(deps);
    expect(deps.clearCurrentRoomRefs).toHaveBeenCalled();
    expect(deps.setShouldAutoReconnect).toHaveBeenCalledWith(false);
    expect(deps.clearReconnectionToken).toHaveBeenCalledTimes(1);
    expect(deps.attemptReconnect).not.toHaveBeenCalled();
  });

  it("attempts reconnect on unexpected disconnect WITHOUT dropping reconnectionToken", () => {
    const deps = makeDeps({ code: 4999, isTournamentEnded: vi.fn(() => false) });
    handleRoomLeave(deps);
    expect(deps.log).toHaveBeenCalledWith("Disconnected from room (code: 4999). Attempting to reconnect...");
    expect(deps.setConnectionState).toHaveBeenCalledWith("disconnected");
    expect(deps.attemptReconnect).toHaveBeenCalled();
    // CRITICAL: transient disconnects must KEEP the reconnect token so the
    // next reconnect (or hydration) can resume the seat. Dropping it here
    // would defeat Move 1.5's whole purpose for the most common case.
    expect(deps.clearReconnectionToken).not.toHaveBeenCalled();
  });
});
