/**
 * AnalyticsService.test.ts
 * Unit tests for AnalyticsService
 */

import { AnalyticsService } from "../rooms/managers/AnalyticsService";

describe("AnalyticsService", () => {
  let analyticsService: AnalyticsService;
  const roomId = "test-room-123";
  const logIntervalMs = 300000; // 5 minutes

  beforeEach(() => {
    jest.useFakeTimers();
    analyticsService = new AnalyticsService(roomId, logIntervalMs);
  });

  afterEach(() => {
    analyticsService.clearAll();
    jest.useRealTimers();
  });

  describe("Start/Stop", () => {
    it("should start analytics logging", () => {
      analyticsService.start();
      
      // Should not throw
      expect(() => analyticsService.stop()).not.toThrow();
    });

    it("should stop analytics logging", () => {
      analyticsService.start();
      analyticsService.stop();

      // Verify stopped
      expect(() => analyticsService.stop()).not.toThrow();
    });

    it("should not start if already running", () => {
      analyticsService.start();
      
      expect(() => {
        analyticsService.start();
      }).not.toThrow();
    });
  });

  describe("Connection Recording", () => {
    it("should record a new connection", () => {
      const sessionId = "session-123";

      analyticsService.recordConnection(sessionId);

      const stats = analyticsService.getSessionStats(sessionId);
      expect(stats).toBeDefined();
      expect(stats?.joinTime).toBeGreaterThan(0);
      expect(stats?.disconnections).toBe(0);
      expect(stats?.reconnections).toBe(0);
    });

    it("should track total sessions", () => {
      analyticsService.recordConnection("session-1");
      analyticsService.recordConnection("session-2");
      analyticsService.recordConnection("session-3");

      expect(analyticsService.getTotalSessions()).toBe(3);
    });

    it("should record disconnection", () => {
      const sessionId = "session-123";

      analyticsService.recordConnection(sessionId);
      analyticsService.recordDisconnection(sessionId);

      const stats = analyticsService.getSessionStats(sessionId);
      expect(stats?.disconnections).toBe(1);
      expect(stats?.leaveTime).toBeDefined();
    });

    it("should record multiple disconnections", () => {
      const sessionId = "session-123";

      analyticsService.recordConnection(sessionId);
      analyticsService.recordDisconnection(sessionId);
      analyticsService.recordDisconnection(sessionId);

      const stats = analyticsService.getSessionStats(sessionId);
      expect(stats?.disconnections).toBe(2);
    });

    it("should record reconnection", () => {
      const sessionId = "session-123";

      analyticsService.recordConnection(sessionId);
      analyticsService.recordDisconnection(sessionId);
      analyticsService.recordReconnection(sessionId);

      const stats = analyticsService.getSessionStats(sessionId);
      expect(stats?.reconnections).toBe(1);
      expect(stats?.leaveTime).toBeUndefined(); // Back online
    });
  });

  describe("Message Tracking", () => {
    it("should record messages received", () => {
      const sessionId = "session-123";

      analyticsService.recordConnection(sessionId);
      analyticsService.recordMessageReceived(sessionId);
      analyticsService.recordMessageReceived(sessionId);
      analyticsService.recordMessageReceived(sessionId);

      const stats = analyticsService.getSessionStats(sessionId);
      expect(stats?.messagesReceived).toBe(3);
    });

    it("should record messages sent", () => {
      const sessionId = "session-123";

      analyticsService.recordConnection(sessionId);
      analyticsService.recordMessageSent(sessionId);
      analyticsService.recordMessageSent(sessionId);

      const stats = analyticsService.getSessionStats(sessionId);
      expect(stats?.messagesSent).toBe(2);
    });

    it("should track received and sent separately", () => {
      const sessionId = "session-123";

      analyticsService.recordConnection(sessionId);
      analyticsService.recordMessageReceived(sessionId);
      analyticsService.recordMessageReceived(sessionId);
      analyticsService.recordMessageSent(sessionId);

      const stats = analyticsService.getSessionStats(sessionId);
      expect(stats?.messagesReceived).toBe(2);
      expect(stats?.messagesSent).toBe(1);
    });
  });

  describe("Action Tracking", () => {
    it("should record actions performed", () => {
      const sessionId = "session-123";

      analyticsService.recordConnection(sessionId);
      analyticsService.recordAction(sessionId);
      analyticsService.recordAction(sessionId);
      analyticsService.recordAction(sessionId);

      const stats = analyticsService.getSessionStats(sessionId);
      expect(stats?.actionsPerformed).toBe(3);
    });
  });

  describe("Error Tracking", () => {
    it("should record errors", () => {
      const sessionId = "session-123";

      analyticsService.recordConnection(sessionId);
      analyticsService.recordError(sessionId);
      analyticsService.recordError(sessionId);

      const stats = analyticsService.getSessionStats(sessionId);
      expect(stats?.errors).toBe(2);
    });
  });

  describe("Session Duration", () => {
    it("should calculate session duration for active session", () => {
      const sessionId = "session-123";

      analyticsService.recordConnection(sessionId);
      
      jest.advanceTimersByTime(60000); // 1 minute

      const duration = analyticsService.getSessionDuration(sessionId);
      expect(duration).toBeGreaterThanOrEqual(60000);
    });

    it("should calculate session duration for disconnected session", () => {
      const sessionId = "session-123";

      analyticsService.recordConnection(sessionId);
      
      jest.advanceTimersByTime(30000);
      
      analyticsService.recordDisconnection(sessionId);

      const duration = analyticsService.getSessionDuration(sessionId);
      expect(duration).toBeGreaterThanOrEqual(30000);
    });

    it("should return undefined for non-existent session", () => {
      const duration = analyticsService.getSessionDuration("non-existent");
      expect(duration).toBeUndefined();
    });
  });

  describe("Summary Generation", () => {
    it("should generate empty summary", () => {
      const summary = analyticsService.generateSummary();

      expect(summary.totalConnections).toBe(0);
      expect(summary.currentConnections).toBe(0);
      expect(summary.averageSessionDurationMs).toBe(0);
      expect(summary.totalDisconnections).toBe(0);
      expect(summary.totalReconnections).toBe(0);
      expect(summary.totalMessages).toBe(0);
      expect(summary.totalActions).toBe(0);
      expect(summary.totalErrors).toBe(0);
    });

    it("should generate summary with active sessions", () => {
      analyticsService.recordConnection("session-1");
      analyticsService.recordConnection("session-2");
      analyticsService.recordConnection("session-3");

      jest.advanceTimersByTime(60000);

      const summary = analyticsService.generateSummary();

      expect(summary.totalConnections).toBe(3);
      expect(summary.currentConnections).toBe(3);
      expect(summary.averageSessionDurationMs).toBeGreaterThanOrEqual(60000);
    });

    it("should differentiate active and disconnected sessions", () => {
      analyticsService.recordConnection("session-1");
      analyticsService.recordConnection("session-2");
      analyticsService.recordConnection("session-3");

      analyticsService.recordDisconnection("session-2");

      const summary = analyticsService.generateSummary();

      expect(summary.totalConnections).toBe(3);
      expect(summary.currentConnections).toBe(2);
    });

    it("should aggregate all metrics", () => {
      analyticsService.recordConnection("session-1");
      analyticsService.recordMessageReceived("session-1");
      analyticsService.recordMessageSent("session-1");
      analyticsService.recordMessageSent("session-1");
      analyticsService.recordAction("session-1");
      analyticsService.recordAction("session-1");
      analyticsService.recordAction("session-1");
      analyticsService.recordError("session-1");
      analyticsService.recordDisconnection("session-1");

      analyticsService.recordConnection("session-2");
      analyticsService.recordMessageReceived("session-2");
      analyticsService.recordAction("session-2");
      analyticsService.recordReconnection("session-2");

      const summary = analyticsService.generateSummary();

      expect(summary.totalConnections).toBe(2);
      expect(summary.totalMessages).toBe(4); // 2 received + 2 sent
      expect(summary.totalActions).toBe(4);
      expect(summary.totalErrors).toBe(1);
      expect(summary.totalDisconnections).toBe(1);
      expect(summary.totalReconnections).toBe(1);
    });

    it("should calculate average session duration correctly", () => {
      analyticsService.recordConnection("session-1");
      jest.advanceTimersByTime(60000);
      
      analyticsService.recordConnection("session-2");
      jest.advanceTimersByTime(60000);

      const summary = analyticsService.generateSummary();

      // Session 1: 120000ms, Session 2: 60000ms
      // Average: (120000 + 60000) / 2 = 90000ms
      expect(summary.averageSessionDurationMs).toBeGreaterThanOrEqual(90000);
      expect(summary.averageSessionDurationMs).toBeLessThanOrEqual(120000);
    });
  });

  describe("Active Sessions", () => {
    it("should count active sessions", () => {
      analyticsService.recordConnection("session-1");
      analyticsService.recordConnection("session-2");
      analyticsService.recordConnection("session-3");

      expect(analyticsService.getActiveSessions()).toBe(3);
    });

    it("should exclude disconnected sessions from active count", () => {
      analyticsService.recordConnection("session-1");
      analyticsService.recordConnection("session-2");
      analyticsService.recordConnection("session-3");

      analyticsService.recordDisconnection("session-2");

      expect(analyticsService.getActiveSessions()).toBe(2);
    });

    it("should include reconnected sessions in active count", () => {
      analyticsService.recordConnection("session-1");
      analyticsService.recordDisconnection("session-1");
      
      expect(analyticsService.getActiveSessions()).toBe(0);

      analyticsService.recordReconnection("session-1");

      expect(analyticsService.getActiveSessions()).toBe(1);
    });
  });

  describe("Session Removal", () => {
    it("should remove a session", () => {
      const sessionId = "session-123";

      analyticsService.recordConnection(sessionId);
      analyticsService.removeSession(sessionId);

      const stats = analyticsService.getSessionStats(sessionId);
      expect(stats).toBeUndefined();
    });

    it("should decrease total sessions on removal", () => {
      analyticsService.recordConnection("session-1");
      analyticsService.recordConnection("session-2");

      expect(analyticsService.getTotalSessions()).toBe(2);

      analyticsService.removeSession("session-1");

      expect(analyticsService.getTotalSessions()).toBe(1);
    });
  });

  describe("Clear All", () => {
    it("should clear all analytics", () => {
      analyticsService.recordConnection("session-1");
      analyticsService.recordConnection("session-2");
      analyticsService.start();

      analyticsService.clearAll();

      expect(analyticsService.getTotalSessions()).toBe(0);
      expect(analyticsService.getActiveSessions()).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle recording stats for non-existent session gracefully", () => {
      expect(() => {
        analyticsService.recordMessageReceived("non-existent");
        analyticsService.recordMessageSent("non-existent");
        analyticsService.recordAction("non-existent");
        analyticsService.recordError("non-existent");
        analyticsService.recordDisconnection("non-existent");
        analyticsService.recordReconnection("non-existent");
      }).not.toThrow();
    });

    it("should handle getting stats for non-existent session", () => {
      const stats = analyticsService.getSessionStats("non-existent");
      expect(stats).toBeUndefined();
    });

    it("should handle many concurrent sessions", () => {
      for (let i = 0; i < 100; i++) {
        analyticsService.recordConnection(`session-${i}`);
        analyticsService.recordMessageReceived(`session-${i}`);
        analyticsService.recordAction(`session-${i}`);
      }

      expect(analyticsService.getTotalSessions()).toBe(100);
      expect(analyticsService.getActiveSessions()).toBe(100);

      const summary = analyticsService.generateSummary();
      expect(summary.totalConnections).toBe(100);
      expect(summary.totalMessages).toBe(100);
      expect(summary.totalActions).toBe(100);
    });

    it("should handle multiple disconnections and reconnections", () => {
      const sessionId = "session-123";

      analyticsService.recordConnection(sessionId);
      
      // Simulate unstable connection
      analyticsService.recordDisconnection(sessionId);
      analyticsService.recordReconnection(sessionId);
      analyticsService.recordDisconnection(sessionId);
      analyticsService.recordReconnection(sessionId);
      analyticsService.recordDisconnection(sessionId);
      analyticsService.recordReconnection(sessionId);

      const stats = analyticsService.getSessionStats(sessionId);
      expect(stats?.disconnections).toBe(3);
      expect(stats?.reconnections).toBe(3);
      expect(stats?.leaveTime).toBeUndefined(); // Currently online
    });
  });
});
