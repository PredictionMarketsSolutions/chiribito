import { describe, it, expect, vi } from "vitest";
import {
  handleGameResultMessage,
  handlePlayerDisconnectedMessage,
  handleHeartbeatAckMessage,
} from "./room-message-handlers";

describe("room-message-handlers", () => {
  describe("handleGameResultMessage", () => {
    it("stores deferred result and schedules display when not in winner phase", () => {
      let deferred: { result: "won" | "lost"; champion?: unknown } | null = null;
      const scheduleDeferredTimer = vi.fn((callback: () => void) => callback());
      const showTournamentResult = vi.fn();
      const renderLastState = vi.fn();
      const clearDeferredTimer = vi.fn();

      handleGameResultMessage({
        payload: { result: "won", champion: { name: "ana" } } as any,
        isWinnerPhaseActive: () => false,
        setDeferredTournamentResult: (value) => {
          deferred = value as any;
        },
        getDeferredTournamentResult: () => deferred as any,
        clearDeferredTimer,
        scheduleDeferredTimer,
        winnerDisplayMs: 3000,
        showTournamentResult,
        renderLastState,
        log: vi.fn(),
      });

      expect(clearDeferredTimer).toHaveBeenCalled();
      expect(scheduleDeferredTimer).toHaveBeenCalledWith(expect.any(Function), 3000);
      expect(showTournamentResult).toHaveBeenCalledWith("won", { name: "ana" });
      expect(renderLastState).toHaveBeenCalled();
      expect(deferred).toBeNull();
    });

    it("does not schedule timer when winner phase is active", () => {
      const scheduleDeferredTimer = vi.fn();
      handleGameResultMessage({
        payload: { result: "lost" } as any,
        isWinnerPhaseActive: () => true,
        setDeferredTournamentResult: vi.fn(),
        getDeferredTournamentResult: () => null,
        clearDeferredTimer: vi.fn(),
        scheduleDeferredTimer,
        winnerDisplayMs: 3000,
        showTournamentResult: vi.fn(),
        renderLastState: vi.fn(),
        log: vi.fn(),
      });
      expect(scheduleDeferredTimer).not.toHaveBeenCalled();
    });
  });

  describe("handlePlayerDisconnectedMessage", () => {
    it("logs disconnect message with current turn hint", () => {
      const log = vi.fn();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      handlePlayerDisconnectedMessage(
        { playerName: "Luis", wasCurrentTurn: true } as any,
        log
      );
      expect(log).toHaveBeenCalledWith("Luis se ha desconectado (era su turno)");
      consoleSpy.mockRestore();
    });
  });

  describe("handleHeartbeatAckMessage", () => {
    it("records RTT and reconnects state when currently disconnected", () => {
      const recordRtt = vi.fn();
      const clearHeartbeatTimeout = vi.fn();
      const setConnected = vi.fn();
      const replayBufferedActions = vi.fn();

      handleHeartbeatAckMessage({
        lastHeartbeatSendTime: 1000,
        nowMs: 1450,
        recordRtt,
        clearHeartbeatTimeout,
        isConnected: () => false,
        setConnected,
        replayBufferedActions,
      });

      expect(recordRtt).toHaveBeenCalledWith(450);
      expect(clearHeartbeatTimeout).toHaveBeenCalled();
      expect(setConnected).toHaveBeenCalled();
      expect(replayBufferedActions).toHaveBeenCalled();
    });

    it("does not replay buffered actions when already connected", () => {
      const setConnected = vi.fn();
      const replayBufferedActions = vi.fn();
      handleHeartbeatAckMessage({
        lastHeartbeatSendTime: 0,
        nowMs: 3000,
        recordRtt: vi.fn(),
        clearHeartbeatTimeout: vi.fn(),
        isConnected: () => true,
        setConnected,
        replayBufferedActions,
      });
      expect(setConnected).not.toHaveBeenCalled();
      expect(replayBufferedActions).not.toHaveBeenCalled();
    });
  });
});
