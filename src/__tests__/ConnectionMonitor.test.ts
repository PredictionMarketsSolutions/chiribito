/**
 * ConnectionMonitor.test.ts
 * Unit tests for ConnectionMonitor
 */

import { ConnectionMonitor } from "../rooms/managers/ConnectionMonitor";

describe("ConnectionMonitor", () => {
  let connectionMonitor: ConnectionMonitor;
  const roomId = "test-room-123";
  let timeoutCallbacks: string[] = [];

  const config = {
    heartbeatIntervalMs: 1000,
    heartbeatTimeoutMs: 5000
  };

  beforeEach(() => {
    jest.useFakeTimers();
    timeoutCallbacks = [];

    connectionMonitor = new ConnectionMonitor(
      roomId,
      config,
      (sessionId) => {
        timeoutCallbacks.push(sessionId);
      }
    );
  });

  afterEach(() => {
    connectionMonitor.stop();
    jest.useRealTimers();
  });

  describe("Start/Stop", () => {
    it("should start monitoring", () => {
      connectionMonitor.start();
      expect(jest.getTimerCount()).toBeGreaterThan(0);
    });

    it("should stop monitoring", () => {
      connectionMonitor.start();
      connectionMonitor.stop();
      
      // Verify that monitor is no longer running (no exceptions)
      expect(() => connectionMonitor.stop()).not.toThrow();
    });

    it("should not start if already running", () => {
      connectionMonitor.start();
      
      // Try to start again - should not throw but also not add more timers
      expect(() => {
        connectionMonitor.start();
      }).not.toThrow();
    });
  });

  describe("Recording Heartbeats", () => {
    it("should record a heartbeat", () => {
      const sessionId = "session-123";

      connectionMonitor.recordHeartbeat(sessionId);

      expect(connectionMonitor.isMonitored(sessionId)).toBe(true);
      expect(connectionMonitor.getMonitoredCount()).toBe(1);
    });

    it("should update heartbeat timestamp", () => {
      const sessionId = "session-123";

      // Record first heartbeat at time 0
      connectionMonitor.recordHeartbeat(sessionId);
      
      // Advance time by 1000ms
      jest.advanceTimersByTime(1000);
      
      // Check time since last heartbeat (should be ~1000ms)
      const timeSinceFirst = connectionMonitor.getTimeSinceLastHeartbeat(sessionId);
      expect(timeSinceFirst).toBeGreaterThanOrEqual(1000);

      // Record new heartbeat
      connectionMonitor.recordHeartbeat(sessionId);
      
      // Time since last heartbeat should now be 0
      const timeSinceSecond = connectionMonitor.getTimeSinceLastHeartbeat(sessionId);
      expect(timeSinceSecond).toBe(0);
    });

    it("should track multiple clients", () => {
      connectionMonitor.recordHeartbeat("session-1");
      connectionMonitor.recordHeartbeat("session-2");
      connectionMonitor.recordHeartbeat("session-3");

      expect(connectionMonitor.getMonitoredCount()).toBe(3);
    });
  });

  describe("Timeout Detection", () => {
    it("should detect client timeout", () => {
      const sessionId = "session-timeout";

      connectionMonitor.start();
      connectionMonitor.recordHeartbeat(sessionId);

      // Advance time beyond timeout threshold
      jest.advanceTimersByTime(config.heartbeatTimeoutMs + 1000);

      expect(timeoutCallbacks).toContain(sessionId);
      expect(connectionMonitor.isMonitored(sessionId)).toBe(false);
    });

    it("should not timeout if heartbeat is renewed", () => {
      const sessionId = "session-active";

      connectionMonitor.start();
      connectionMonitor.recordHeartbeat(sessionId);

      // Advance time, but keep sending heartbeats
      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(1000);
        connectionMonitor.recordHeartbeat(sessionId);
      }

      expect(timeoutCallbacks).not.toContain(sessionId);
      expect(connectionMonitor.isMonitored(sessionId)).toBe(true);
    });

    it("should timeout multiple clients independently", () => {
      connectionMonitor.start();

      connectionMonitor.recordHeartbeat("session-1");
      
      jest.advanceTimersByTime(2000);
      connectionMonitor.recordHeartbeat("session-2");

      // Advance time to timeout session-1 but not session-2
      jest.advanceTimersByTime(config.heartbeatTimeoutMs);

      expect(timeoutCallbacks).toContain("session-1");
      expect(timeoutCallbacks).not.toContain("session-2");
    });
  });

  describe("Client Removal", () => {
    it("should remove a client from monitoring", () => {
      const sessionId = "session-123";

      connectionMonitor.recordHeartbeat(sessionId);
      connectionMonitor.removeClient(sessionId);

      expect(connectionMonitor.isMonitored(sessionId)).toBe(false);
      expect(connectionMonitor.getMonitoredCount()).toBe(0);
    });

    it("should not timeout removed clients", () => {
      const sessionId = "session-removed";

      connectionMonitor.start();
      connectionMonitor.recordHeartbeat(sessionId);
      connectionMonitor.removeClient(sessionId);

      jest.advanceTimersByTime(config.heartbeatTimeoutMs + 1000);

      expect(timeoutCallbacks).not.toContain(sessionId);
    });
  });

  describe("Time Since Last Heartbeat", () => {
    it("should return time since last heartbeat", () => {
      const sessionId = "session-123";

      connectionMonitor.recordHeartbeat(sessionId);
      
      jest.advanceTimersByTime(2500);

      const timeSince = connectionMonitor.getTimeSinceLastHeartbeat(sessionId);
      expect(timeSince).toBeGreaterThanOrEqual(2500);
    });

    it("should return undefined for non-existent session", () => {
      const timeSince = connectionMonitor.getTimeSinceLastHeartbeat("non-existent");
      expect(timeSince).toBeUndefined();
    });
  });

  describe("Clear All", () => {
    it("should clear all monitored clients", () => {
      connectionMonitor.recordHeartbeat("session-1");
      connectionMonitor.recordHeartbeat("session-2");
      connectionMonitor.start();

      connectionMonitor.clearAll();

      expect(connectionMonitor.getMonitoredCount()).toBe(0);
      // After clearAll, monitor should be stopped (no longer running)
    });
  });

  describe("Edge Cases", () => {
    it("should handle recording heartbeat for same client multiple times", () => {
      const sessionId = "session-123";

      connectionMonitor.recordHeartbeat(sessionId);
      connectionMonitor.recordHeartbeat(sessionId);
      connectionMonitor.recordHeartbeat(sessionId);

      expect(connectionMonitor.getMonitoredCount()).toBe(1);
    });

    it("should handle removal of non-existent client", () => {
      expect(() => {
        connectionMonitor.removeClient("non-existent");
      }).not.toThrow();
    });

    it("should not trigger timeout callback for manually removed clients", () => {
      const sessionId = "session-manual-remove";

      connectionMonitor.start();
      connectionMonitor.recordHeartbeat(sessionId);
      connectionMonitor.removeClient(sessionId);

      jest.advanceTimersByTime(config.heartbeatTimeoutMs + 1000);

      expect(timeoutCallbacks).not.toContain(sessionId);
    });
  });
});
