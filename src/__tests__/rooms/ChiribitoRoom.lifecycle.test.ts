/**
 * ChiribitoRoom.lifecycle.test.ts
 * Tests for onLeave, onDispose, scheduleDelayed.
 */

jest.mock("@colyseus/core", () => ({
  Room: class {},
  Client: class {},
  CloseCode: { CONSENTED: 4000 },
}));

import { ChiribitoRoom } from "../../rooms/ChiribitoRoom";

describe("ChiribitoRoom lifecycle", () => {
  describe("onLeave", () => {
    it("calls lifecycleManager.handleLeave and engine.tryGameEnd", async () => {
      const handleLeave = jest.fn().mockResolvedValue(undefined);
      const tryGameEnd = jest.fn();
      const client = { sessionId: "c1" };

      const fakeRoom: any = {
        lifecycleManager: { handleLeave },
        engine: { tryGameEnd },
        state: {},
        sessionManager: {},
        seatManager: {},
        connectionMonitor: {},
        analytics: {},
        playersInHand: [],
        broadcast: jest.fn(),
        allowReconnection: jest.fn().mockResolvedValue(undefined),
      };

      await ChiribitoRoom.prototype.onLeave.call(fakeRoom, client as any, 1000);

      expect(handleLeave).toHaveBeenCalledTimes(1);
      expect(handleLeave).toHaveBeenCalledWith(
        client,
        false,
        "disconnected_code_1000",
        fakeRoom.state,
        expect.any(Object),
        fakeRoom.playersInHand,
        fakeRoom.engine,
        expect.any(Function),
        expect.any(Function)
      );
      expect(tryGameEnd).toHaveBeenCalledTimes(1);
    });

    it("passes consented true when code is CloseCode.CONSENTED", async () => {
      const handleLeave = jest.fn().mockResolvedValue(undefined);
      const tryGameEnd = jest.fn();
      const client = { sessionId: "c1" };

      const fakeRoom: any = {
        lifecycleManager: { handleLeave },
        engine: { tryGameEnd },
        state: {},
        sessionManager: {},
        seatManager: {},
        connectionMonitor: {},
        analytics: {},
        playersInHand: [],
        broadcast: jest.fn(),
        allowReconnection: jest.fn().mockResolvedValue(undefined),
      };

      await ChiribitoRoom.prototype.onLeave.call(fakeRoom, client as any, 4000); // CONSENTED

      expect(handleLeave).toHaveBeenCalledWith(
        client,
        true,
        "client_left_voluntarily",
        fakeRoom.state,
        expect.objectContaining({
          sessionManager: fakeRoom.sessionManager,
          seatManager: fakeRoom.seatManager,
          connectionMonitor: fakeRoom.connectionMonitor,
          analytics: fakeRoom.analytics,
        }),
        fakeRoom.playersInHand,
        fakeRoom.engine,
        expect.any(Function),
        expect.any(Function)
      );
    });

    it("passes broadcast callback to handleLeave so lifecycle can broadcast", async () => {
      const broadcast = jest.fn();
      let captureBroadcast: ((type: string, message: unknown, opts?: unknown) => void) | null = null;
      const handleLeave = jest.fn().mockImplementation((
        _client: unknown,
        _consented: boolean,
        _reason: string,
        _state: unknown,
        _deps: unknown,
        _playersInHand: unknown,
        _engine: unknown,
        _allowReconnection: unknown,
        broadcastCb: (type: string, message: unknown, opts?: unknown) => void
      ) => {
        captureBroadcast = broadcastCb;
        return Promise.resolve();
      });
      const tryGameEnd = jest.fn();
      const client = { sessionId: "c1" };

      const fakeRoom: any = {
        lifecycleManager: { handleLeave },
        engine: { tryGameEnd },
        state: {},
        sessionManager: {},
        seatManager: {},
        connectionMonitor: {},
        analytics: {},
        playersInHand: [],
        broadcast,
        allowReconnection: jest.fn().mockResolvedValue(undefined),
      };

      await ChiribitoRoom.prototype.onLeave.call(fakeRoom, client as any, 1000);

      expect(captureBroadcast).not.toBeNull();
      captureBroadcast!("playerLeft", { sessionId: "c1" });
      expect(broadcast).toHaveBeenCalledWith("playerLeft", { sessionId: "c1" }, undefined);
    });
  });

  describe("onDispose", () => {
    it("clears turnTimeout and all managers, logs analytics summary", () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout").mockImplementation(() => {});
      const connectionMonitor = { clearAll: jest.fn() };
      const seatManager = { clearAll: jest.fn() };
      const rateLimiter = { clearAll: jest.fn() };
      const sessionManager = { clearAll: jest.fn() };
      const analytics = { logSummary: jest.fn(), clearAll: jest.fn() };

      const fakeRoom: any = {
        roomId: "room-1",
        turnTimeout: 12345 as any,
        connectionMonitor,
        seatManager,
        rateLimiter,
        sessionManager,
        analytics,
      };

      ChiribitoRoom.prototype.onDispose.call(fakeRoom);

      expect(clearTimeoutSpy).toHaveBeenCalledWith(12345);
      expect(connectionMonitor.clearAll).toHaveBeenCalledTimes(1);
      expect(seatManager.clearAll).toHaveBeenCalledTimes(1);
      expect(rateLimiter.clearAll).toHaveBeenCalledTimes(1);
      expect(sessionManager.clearAll).toHaveBeenCalledTimes(1);
      expect(analytics.logSummary).toHaveBeenCalledTimes(1);
      expect(analytics.clearAll).toHaveBeenCalledTimes(1);
      clearTimeoutSpy.mockRestore();
    });

    it("does not call clearTimeout when turnTimeout is null", () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout").mockImplementation(() => {});
      const fakeRoom: any = {
        roomId: "room-1",
        turnTimeout: null,
        connectionMonitor: { clearAll: jest.fn() },
        seatManager: { clearAll: jest.fn() },
        rateLimiter: { clearAll: jest.fn() },
        sessionManager: { clearAll: jest.fn() },
        analytics: { logSummary: jest.fn(), clearAll: jest.fn() },
      };

      ChiribitoRoom.prototype.onDispose.call(fakeRoom);

      expect(clearTimeoutSpy).not.toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it("handles missing connectionMonitor gracefully", () => {
      const fakeRoom: any = {
        roomId: "room-1",
        turnTimeout: null,
        connectionMonitor: undefined,
        seatManager: { clearAll: jest.fn() },
        rateLimiter: { clearAll: jest.fn() },
        sessionManager: { clearAll: jest.fn() },
        analytics: { logSummary: jest.fn(), clearAll: jest.fn() },
      };

      expect(() => ChiribitoRoom.prototype.onDispose.call(fakeRoom)).not.toThrow();
      expect(fakeRoom.seatManager.clearAll).toHaveBeenCalled();
    });

    it("does not call analytics when analytics is undefined", () => {
      const fakeRoom: any = {
        roomId: "room-1",
        turnTimeout: null,
        connectionMonitor: { clearAll: jest.fn() },
        seatManager: { clearAll: jest.fn() },
        rateLimiter: { clearAll: jest.fn() },
        sessionManager: { clearAll: jest.fn() },
        analytics: undefined,
      };

      expect(() => ChiribitoRoom.prototype.onDispose.call(fakeRoom)).not.toThrow();
    });

    it("handles undefined seatManager, rateLimiter, sessionManager in onDispose", () => {
      const fakeRoom: any = {
        roomId: "room-1",
        turnTimeout: null,
        connectionMonitor: { clearAll: jest.fn() },
        seatManager: undefined,
        rateLimiter: undefined,
        sessionManager: undefined,
        analytics: undefined,
      };

      expect(() => ChiribitoRoom.prototype.onDispose.call(fakeRoom)).not.toThrow();
    });
  });

  describe("scheduleDelayed", () => {
    it("schedules callback with clock.setTimeout", () => {
      const callback = jest.fn();
      const clockSetTimeout = jest.fn((cb: () => void, ms: number) => {
        expect(ms).toBe(1500);
        return 0;
      });

      const fakeRoom: any = {
        clock: { setTimeout: clockSetTimeout },
      };

      ChiribitoRoom.prototype.scheduleDelayed.call(fakeRoom, callback, 1500);

      expect(clockSetTimeout).toHaveBeenCalledTimes(1);
      expect(clockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1500);
      const scheduledCb = clockSetTimeout.mock.calls[0][0];
      scheduledCb();
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("getNextAvailableSeat (private)", () => {
    it("returns seatManager.getNextAvailableSeat or -1 when null", () => {
      const fakeRoom: any = {
        seatManager: { getNextAvailableSeat: jest.fn().mockReturnValue(3) },
      };
      expect((ChiribitoRoom.prototype as any).getNextAvailableSeat.call(fakeRoom)).toBe(3);
      fakeRoom.seatManager.getNextAvailableSeat.mockReturnValue(null);
      expect((ChiribitoRoom.prototype as any).getNextAvailableSeat.call(fakeRoom)).toBe(-1);
    });
  });

  describe("cleanupExpiredReservations (private)", () => {
    it("runs without throwing (no-op, SeatManager handles)", () => {
      const fakeRoom: any = {};
      expect(() => (ChiribitoRoom.prototype as any).cleanupExpiredReservations.call(fakeRoom)).not.toThrow();
    });
  });
});
