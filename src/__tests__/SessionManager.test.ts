/**
 * SessionManager.test.ts
 * Unit tests for SessionManager
 */

import { SessionManager } from "../rooms/managers/SessionManager";

describe("SessionManager", () => {
  let sessionManager: SessionManager;
  const roomId = "test-room-123";

  beforeEach(() => {
    sessionManager = new SessionManager(roomId);
  });

  describe("Session Registration", () => {
    it("should register a new session", () => {
      const userId = 1;
      const sessionId = "session-abc";

      sessionManager.registerSession(userId, sessionId);

      expect(sessionManager.hasActiveSession(userId)).toBe(true);
      expect(sessionManager.getSessionId(userId)).toBe(sessionId);
      expect(sessionManager.getUserId(sessionId)).toBe(userId);
    });

    it("should return correct active count", () => {
      sessionManager.registerSession(1, "session-1");
      sessionManager.registerSession(2, "session-2");
      sessionManager.registerSession(3, "session-3");

      expect(sessionManager.getActiveCount()).toBe(3);
    });

    it("should remove pending status on registration", () => {
      const userId = 1;
      sessionManager.addPending(userId);

      expect(sessionManager.isPending(userId)).toBe(true);

      sessionManager.registerSession(userId, "session-1");

      expect(sessionManager.isPending(userId)).toBe(false);
    });
  });

  describe("Session Removal", () => {
    it("should remove a session", () => {
      const userId = 1;
      const sessionId = "session-abc";

      sessionManager.registerSession(userId, sessionId);
      sessionManager.removeSession(sessionId);

      expect(sessionManager.hasActiveSession(userId)).toBe(false);
      expect(sessionManager.getSessionId(userId)).toBeUndefined();
      expect(sessionManager.getUserId(sessionId)).toBeUndefined();
    });

    it("should handle removal of non-existent session", () => {
      expect(() => {
        sessionManager.removeSession("non-existent");
      }).not.toThrow();
    });

    it("should decrease active count on removal", () => {
      sessionManager.registerSession(1, "session-1");
      sessionManager.registerSession(2, "session-2");

      expect(sessionManager.getActiveCount()).toBe(2);

      sessionManager.removeSession("session-1");

      expect(sessionManager.getActiveCount()).toBe(1);
    });
  });

  describe("Session Replacement", () => {
    it("should replace an existing session", () => {
      const userId = 1;
      const oldSessionId = "session-old";
      const newSessionId = "session-new";

      sessionManager.registerSession(userId, oldSessionId);
      sessionManager.replaceSession(oldSessionId, newSessionId);

      expect(sessionManager.getSessionId(userId)).toBe(newSessionId);
      expect(sessionManager.getUserId(newSessionId)).toBe(userId);
      expect(sessionManager.getUserId(oldSessionId)).toBeUndefined();
    });

    it("should handle replacement of non-existent session", () => {
      expect(() => {
        sessionManager.replaceSession("non-existent", "new-session");
      }).not.toThrow();
    });

    it("should maintain active count on replacement", () => {
      sessionManager.registerSession(1, "session-old");

      const countBefore = sessionManager.getActiveCount();
      sessionManager.replaceSession("session-old", "session-new");
      const countAfter = sessionManager.getActiveCount();

      expect(countBefore).toBe(countAfter);
    });
  });

  describe("Pending Users", () => {
    it("should mark user as pending", () => {
      const userId = 1;

      sessionManager.addPending(userId);

      expect(sessionManager.isPending(userId)).toBe(true);
    });

    it("should not mark registered user as pending", () => {
      const userId = 1;

      sessionManager.addPending(userId);
      sessionManager.registerSession(userId, "session-1");

      expect(sessionManager.isPending(userId)).toBe(false);
    });
  });

  describe("Querying", () => {
    beforeEach(() => {
      sessionManager.registerSession(1, "session-1");
      sessionManager.registerSession(2, "session-2");
      sessionManager.registerSession(3, "session-3");
    });

    it("should check if user has active session", () => {
      expect(sessionManager.hasActiveSession(1)).toBe(true);
      expect(sessionManager.hasActiveSession(999)).toBe(false);
    });

    it("should get session ID for user", () => {
      expect(sessionManager.getSessionId(1)).toBe("session-1");
      expect(sessionManager.getSessionId(999)).toBeUndefined();
    });

    it("should get user ID for session", () => {
      expect(sessionManager.getUserId("session-1")).toBe(1);
      expect(sessionManager.getUserId("non-existent")).toBeUndefined();
    });

    it("should get all session IDs", () => {
      const sessionIds = sessionManager.getAllSessionIds();

      expect(sessionIds).toHaveLength(3);
      expect(sessionIds).toContain("session-1");
      expect(sessionIds).toContain("session-2");
      expect(sessionIds).toContain("session-3");
    });
  });

  describe("Clear All", () => {
    it("should clear all sessions", () => {
      sessionManager.registerSession(1, "session-1");
      sessionManager.registerSession(2, "session-2");
      sessionManager.addPending(3);

      sessionManager.clearAll();

      expect(sessionManager.getActiveCount()).toBe(0);
      expect(sessionManager.hasActiveSession(1)).toBe(false);
      expect(sessionManager.isPending(3)).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiple users with different sessions", () => {
      sessionManager.registerSession(1, "session-1");
      sessionManager.registerSession(2, "session-2");

      expect(sessionManager.getSessionId(1)).toBe("session-1");
      expect(sessionManager.getSessionId(2)).toBe("session-2");
    });

    it("should handle reregistration of same user", () => {
      sessionManager.registerSession(1, "session-old");
      sessionManager.registerSession(1, "session-new");

      // New session should overwrite old one
      expect(sessionManager.getSessionId(1)).toBe("session-new");
      expect(sessionManager.getActiveCount()).toBe(1);
    });
  });
});
