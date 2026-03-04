/**
 * RateLimiterService.test.ts
 * Unit tests for RateLimiterService
 */

import { RateLimiterService } from "../rooms/managers/RateLimiterService";

describe("RateLimiterService", () => {
  let rateLimiter: RateLimiterService;
  const roomId = "test-room-123";
  const defaultCooldownMs = 1000;

  beforeEach(() => {
    jest.useFakeTimers();
    rateLimiter = new RateLimiterService(roomId, {
      defaultCooldownMs,
      customCooldowns: new Map([
        ["bet", 500],
        ["chat", 2000]
      ])
    });
  });

  afterEach(() => {
    rateLimiter.clearAll();
    jest.useRealTimers();
  });

  describe("Action Allowance", () => {
    it("should allow action when no cooldown exists", () => {
      const sessionId = "session-123";
      const actionType = "call";

      expect(rateLimiter.isActionAllowed(sessionId, actionType)).toBe(true);
    });

    it("should block action during cooldown", () => {
      const sessionId = "session-123";
      const actionType = "call";

      rateLimiter.recordAction(sessionId, actionType);

      expect(rateLimiter.isActionAllowed(sessionId, actionType)).toBe(false);
    });

    it("should allow action after cooldown expires", () => {
      const sessionId = "session-123";
      const actionType = "call";

      rateLimiter.recordAction(sessionId, actionType);

      // Advance time beyond default cooldown
      jest.advanceTimersByTime(defaultCooldownMs + 100);

      expect(rateLimiter.isActionAllowed(sessionId, actionType)).toBe(true);
    });

    it("should handle custom cooldown durations", () => {
      const sessionId = "session-123";
      const actionType = "bet";

      rateLimiter.recordAction(sessionId, actionType);

      // Advance time within custom cooldown (500ms)
      jest.advanceTimersByTime(400);
      expect(rateLimiter.isActionAllowed(sessionId, actionType)).toBe(false);

      // Advance beyond custom cooldown
      jest.advanceTimersByTime(200);
      expect(rateLimiter.isActionAllowed(sessionId, actionType)).toBe(true);
    });

    it("should track different action types independently", () => {
      const sessionId = "session-123";

      rateLimiter.recordAction(sessionId, "call");
      rateLimiter.recordAction(sessionId, "bet");

      expect(rateLimiter.isActionAllowed(sessionId, "call")).toBe(false);
      expect(rateLimiter.isActionAllowed(sessionId, "bet")).toBe(false);

      // Advance time to expire only bet cooldown (500ms)
      jest.advanceTimersByTime(600);

      expect(rateLimiter.isActionAllowed(sessionId, "call")).toBe(false);
      expect(rateLimiter.isActionAllowed(sessionId, "bet")).toBe(true);
    });

    it("should track different sessions independently", () => {
      rateLimiter.recordAction("session-1", "call");
      rateLimiter.recordAction("session-2", "call");

      expect(rateLimiter.isActionAllowed("session-1", "call")).toBe(false);
      expect(rateLimiter.isActionAllowed("session-2", "call")).toBe(false);
      expect(rateLimiter.isActionAllowed("session-3", "call")).toBe(true);
    });
  });

  describe("Recording Actions", () => {
    it("should record an action", () => {
      const sessionId = "session-123";
      const actionType = "call";

      rateLimiter.recordAction(sessionId, actionType);

      expect(rateLimiter.isActionAllowed(sessionId, actionType)).toBe(false);
    });

    it("should update action timestamp on re-recording", () => {
      const sessionId = "session-123";
      const actionType = "call";

      rateLimiter.recordAction(sessionId, actionType);
      
      // Advance time partially
      jest.advanceTimersByTime(500);
      
      // Record again (reset cooldown)
      rateLimiter.recordAction(sessionId, actionType);

      // Original cooldown would have expired, but new recording extends it
      jest.advanceTimersByTime(600);
      expect(rateLimiter.isActionAllowed(sessionId, actionType)).toBe(false);

      // Advance remaining time
      jest.advanceTimersByTime(500);
      expect(rateLimiter.isActionAllowed(sessionId, actionType)).toBe(true);
    });
  });

  describe("Remaining Cooldown", () => {
    it("should return remaining cooldown time", () => {
      const sessionId = "session-123";
      const actionType = "call";

      rateLimiter.recordAction(sessionId, actionType);

      const remaining = rateLimiter.getRemainingCooldown(sessionId, actionType);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(defaultCooldownMs);
    });

    it("should return 0 when no cooldown exists", () => {
      const sessionId = "session-123";
      const actionType = "call";

      const remaining = rateLimiter.getRemainingCooldown(sessionId, actionType);
      expect(remaining).toBe(0);
    });

    it("should return 0 when cooldown has expired", () => {
      const sessionId = "session-123";
      const actionType = "call";

      rateLimiter.recordAction(sessionId, actionType);
      jest.advanceTimersByTime(defaultCooldownMs + 100);

      const remaining = rateLimiter.getRemainingCooldown(sessionId, actionType);
      expect(remaining).toBe(0);
    });

    it("should decrease over time", () => {
      const sessionId = "session-123";
      const actionType = "call";

      rateLimiter.recordAction(sessionId, actionType);

      const remaining1 = rateLimiter.getRemainingCooldown(sessionId, actionType);
      
      jest.advanceTimersByTime(300);
      
      const remaining2 = rateLimiter.getRemainingCooldown(sessionId, actionType);

      expect(remaining2).toBeLessThan(remaining1);
    });
  });

  describe("Clear Functions", () => {
    it("should clear all cooldowns for a client", () => {
      const sessionId = "session-123";

      rateLimiter.recordAction(sessionId, "call");
      rateLimiter.recordAction(sessionId, "bet");
      rateLimiter.recordAction(sessionId, "chat");

      rateLimiter.clearClient(sessionId);

      expect(rateLimiter.isActionAllowed(sessionId, "call")).toBe(true);
      expect(rateLimiter.isActionAllowed(sessionId, "bet")).toBe(true);
      expect(rateLimiter.isActionAllowed(sessionId, "chat")).toBe(true);
    });

    it("should clear specific action cooldown", () => {
      const sessionId = "session-123";

      rateLimiter.recordAction(sessionId, "call");
      rateLimiter.recordAction(sessionId, "bet");

      rateLimiter.clearAction(sessionId, "call");

      expect(rateLimiter.isActionAllowed(sessionId, "call")).toBe(true);
      expect(rateLimiter.isActionAllowed(sessionId, "bet")).toBe(false);
    });

    it("should clear all cooldowns", () => {
      rateLimiter.recordAction("session-1", "call");
      rateLimiter.recordAction("session-2", "bet");

      rateLimiter.clearAll();

      expect(rateLimiter.isActionAllowed("session-1", "call")).toBe(true);
      expect(rateLimiter.isActionAllowed("session-2", "bet")).toBe(true);
    });

    it("should handle clearing non-existent client", () => {
      expect(() => {
        rateLimiter.clearClient("non-existent");
      }).not.toThrow();
    });

    it("should handle clearing non-existent action", () => {
      const sessionId = "session-123";
      
      expect(() => {
        rateLimiter.clearAction(sessionId, "non-existent");
      }).not.toThrow();
    });
  });

  describe("Active Cooldowns", () => {
    it("should count active cooldowns for a client", () => {
      const sessionId = "session-123";

      expect(rateLimiter.getActiveCooldownCount(sessionId)).toBe(0);

      rateLimiter.recordAction(sessionId, "call");
      expect(rateLimiter.getActiveCooldownCount(sessionId)).toBe(1);

      rateLimiter.recordAction(sessionId, "bet");
      expect(rateLimiter.getActiveCooldownCount(sessionId)).toBe(2);
    });

    it("should get active cooldown types", () => {
      const sessionId = "session-123";

      rateLimiter.recordAction(sessionId, "call");
      rateLimiter.recordAction(sessionId, "bet");
      rateLimiter.recordAction(sessionId, "chat");

      const activeCooldowns = rateLimiter.getActiveCooldowns(sessionId);

      expect(activeCooldowns).toHaveLength(3);
      expect(activeCooldowns).toContain("call");
      expect(activeCooldowns).toContain("bet");
      expect(activeCooldowns).toContain("chat");
    });

    it("should only return currently active cooldowns", () => {
      const sessionId = "session-123";

      rateLimiter.recordAction(sessionId, "bet"); // 500ms cooldown
      rateLimiter.recordAction(sessionId, "call"); // 1000ms cooldown

      // Advance time to expire bet cooldown
      jest.advanceTimersByTime(600);

      const activeCooldowns = rateLimiter.getActiveCooldowns(sessionId);

      expect(activeCooldowns).toHaveLength(1);
      expect(activeCooldowns).toContain("call");
      expect(activeCooldowns).not.toContain("bet");
    });

    it("should return empty array for client with no cooldowns", () => {
      const activeCooldowns = rateLimiter.getActiveCooldowns("non-existent");
      expect(activeCooldowns).toEqual([]);
    });
  });

  describe("Config Update", () => {
    it("should update default cooldown", () => {
      const sessionId = "session-123";

      rateLimiter.updateConfig({ defaultCooldownMs: 2000 });

      rateLimiter.recordAction(sessionId, "newAction");
      
      jest.advanceTimersByTime(1500);
      expect(rateLimiter.isActionAllowed(sessionId, "newAction")).toBe(false);

      jest.advanceTimersByTime(600);
      expect(rateLimiter.isActionAllowed(sessionId, "newAction")).toBe(true);
    });

    it("should update custom cooldowns", () => {
      const sessionId = "session-123";

      rateLimiter.updateConfig({
        customCooldowns: new Map([["special", 3000]])
      });

      rateLimiter.recordAction(sessionId, "special");

      jest.advanceTimersByTime(2500);
      expect(rateLimiter.isActionAllowed(sessionId, "special")).toBe(false);

      jest.advanceTimersByTime(600);
      expect(rateLimiter.isActionAllowed(sessionId, "special")).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very short cooldowns", () => {
      rateLimiter.updateConfig({ defaultCooldownMs: 10 });
      
      const sessionId = "session-123";
      rateLimiter.recordAction(sessionId, "quick");

      jest.advanceTimersByTime(15);

      expect(rateLimiter.isActionAllowed(sessionId, "quick")).toBe(true);
    });

    it("should handle concurrent actions from same session", () => {
      const sessionId = "session-123";

      rateLimiter.recordAction(sessionId, "action1");
      rateLimiter.recordAction(sessionId, "action2");
      rateLimiter.recordAction(sessionId, "action3");

      expect(rateLimiter.getActiveCooldownCount(sessionId)).toBe(3);
    });

    it("should handle many clients simultaneously", () => {
      for (let i = 0; i < 100; i++) {
        rateLimiter.recordAction(`session-${i}`, "call");
      }

      for (let i = 0; i < 100; i++) {
        expect(rateLimiter.isActionAllowed(`session-${i}`, "call")).toBe(false);
      }

      jest.advanceTimersByTime(defaultCooldownMs + 100);

      for (let i = 0; i < 100; i++) {
        expect(rateLimiter.isActionAllowed(`session-${i}`, "call")).toBe(true);
      }
    });
  });
});
