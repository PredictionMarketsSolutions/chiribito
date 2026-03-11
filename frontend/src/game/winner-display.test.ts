/**
 * Tests for winner display phase (5s after round end).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  WINNER_DISPLAY_MS,
  startWinnerDisplayPhase,
  clearWinnerDisplay,
  isInWinnerPhase,
  type WinnerDisplayState,
} from "./winner-display";

describe("winner-display", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("startWinnerDisplayPhase", () => {
    it("sets winnerDisplayUntil and schedules timeout", () => {
      const state: WinnerDisplayState = {
        lastWinners: [],
        lastWinningHand: "-",
        winnerDisplayUntil: 0,
        winnerDisplayTimeoutId: null,
      };
      const onTimeout = vi.fn();
      const now = 10000;
      vi.setSystemTime(now);

      startWinnerDisplayPhase(state, onTimeout);

      expect(state.winnerDisplayUntil).toBe(now + WINNER_DISPLAY_MS);
      expect(state.winnerDisplayTimeoutId).not.toBeNull();
      expect(onTimeout).not.toHaveBeenCalled();

      vi.advanceTimersByTime(WINNER_DISPLAY_MS);

      expect(onTimeout).toHaveBeenCalledTimes(1);
      expect(state.winnerDisplayUntil).toBe(0);
      expect(state.lastWinners).toEqual([]);
      expect(state.lastWinningHand).toBe("-");
      expect(state.winnerDisplayTimeoutId).toBeNull();
    });

    it("clears previous timeout when starting again", () => {
      const state: WinnerDisplayState = {
        lastWinners: ["p1"],
        lastWinningHand: "Pareja",
        winnerDisplayUntil: 1,
        winnerDisplayTimeoutId: null,
      };
      const onTimeout = vi.fn();
      startWinnerDisplayPhase(state, onTimeout);
      const firstId = state.winnerDisplayTimeoutId;
      startWinnerDisplayPhase(state, onTimeout);
      expect(state.winnerDisplayTimeoutId).not.toBe(firstId);
      vi.advanceTimersByTime(WINNER_DISPLAY_MS);
      expect(onTimeout).toHaveBeenCalledTimes(1);
    });
  });

  describe("clearWinnerDisplay", () => {
    it("resets state and clears timeout", () => {
      const state: WinnerDisplayState = {
        lastWinners: ["p1"],
        lastWinningHand: "Pareja",
        winnerDisplayUntil: Date.now() + 5000,
        winnerDisplayTimeoutId: setTimeout(() => {}, 5000),
      };

      clearWinnerDisplay(state);

      expect(state.lastWinners).toEqual([]);
      expect(state.lastWinningHand).toBe("-");
      expect(state.winnerDisplayUntil).toBe(0);
      expect(state.winnerDisplayTimeoutId).toBeNull();
    });
  });

  describe("isInWinnerPhase", () => {
    it("returns true when winnerDisplayUntil is in the future", () => {
      const state: WinnerDisplayState = {
        lastWinners: [],
        lastWinningHand: "-",
        winnerDisplayUntil: Date.now() + 3000,
        winnerDisplayTimeoutId: null,
      };
      expect(isInWinnerPhase(state)).toBe(true);
    });

    it("returns false when winnerDisplayUntil is 0", () => {
      const state: WinnerDisplayState = {
        lastWinners: [],
        lastWinningHand: "-",
        winnerDisplayUntil: 0,
        winnerDisplayTimeoutId: null,
      };
      expect(isInWinnerPhase(state)).toBe(false);
    });

    it("returns false when winnerDisplayUntil is in the past", () => {
      const state: WinnerDisplayState = {
        lastWinners: [],
        lastWinningHand: "-",
        winnerDisplayUntil: Date.now() - 1000,
        winnerDisplayTimeoutId: null,
      };
      expect(isInWinnerPhase(state)).toBe(false);
    });
  });
});
