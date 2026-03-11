/**
 * Tests for turn timer (countdown chip).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { startTurnTimer, stopTurnTimer, updateTurnTimer, type TurnTimerState } from "./turn-timer";

function createMockChip(): HTMLSpanElement {
  const el = document.createElement("span");
  return el;
}

describe("turn-timer", () => {
  let chip: HTMLSpanElement;
  let state: TurnTimerState;

  beforeEach(() => {
    vi.useFakeTimers();
    chip = createMockChip();
    state = {
      turnTimerId: null,
      turnDeadlineMs: null,
      lastTurnId: null,
      lastTurnTimeoutMs: null,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("startTurnTimer", () => {
    it("updates state and chip text", () => {
      const now = 10000;
      vi.setSystemTime(now);
      startTurnTimer(state, "player-1", 30000, chip);

      expect(state.lastTurnId).toBe("player-1");
      expect(state.lastTurnTimeoutMs).toBe(30000);
      expect(state.turnDeadlineMs).toBe(now + 30000);
      expect(state.turnTimerId).not.toBeNull();
      expect(chip.textContent).toBe("30s");

      vi.advanceTimersByTime(1000);
      expect(chip.textContent).toBe("29s");
    });

    it("uses deadlineMs when provided", () => {
      vi.setSystemTime(0);
      startTurnTimer(state, "p1", 60000, chip, 50000);
      expect(state.turnDeadlineMs).toBe(50000);
      expect(chip.textContent).toBe("50s");
    });
  });

  describe("stopTurnTimer", () => {
    it("clears interval and resets state and chip", () => {
      startTurnTimer(state, "p1", 30000, chip);
      expect(state.turnTimerId).not.toBeNull();

      stopTurnTimer(state, chip);

      expect(state.turnTimerId).toBeNull();
      expect(state.turnDeadlineMs).toBeNull();
      expect(state.lastTurnId).toBeNull();
      expect(state.lastTurnTimeoutMs).toBeNull();
      expect(chip.textContent).toBe("-");
    });
  });

  describe("updateTurnTimer", () => {
    it("stops timer when round not active", () => {
      startTurnTimer(state, "p1", 30000, chip);
      updateTurnTimer(state, "p1", false, chip, 30000);
      expect(state.turnTimerId).toBeNull();
      expect(chip.textContent).toBe("-");
    });

    it("stops timer when currentTurnId is empty", () => {
      startTurnTimer(state, "p1", 30000, chip);
      updateTurnTimer(state, "", true, chip, 30000);
      expect(state.turnTimerId).toBeNull();
    });

    it("starts timer when turn id changes", () => {
      updateTurnTimer(state, "player-2", true, chip, 25000);
      expect(state.lastTurnId).toBe("player-2");
      expect(state.turnTimerId).not.toBeNull();
      expect(chip.textContent).toBe("25s");
    });

    it("does not restart when same turn and deadline set", () => {
      vi.setSystemTime(0);
      startTurnTimer(state, "p1", 30000, chip);
      const idBefore = state.turnTimerId;
      updateTurnTimer(state, "p1", true, chip, 30000);
      expect(state.turnTimerId).toBe(idBefore);
    });
  });
});
