/**
 * Tests for winner display phase (3s after round end, then UI reset).
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

  describe("WINNER_DISPLAY_MS", () => {
    it("is 3000 so winner is shown for 3 seconds before UI reset", () => {
      expect(WINNER_DISPLAY_MS).toBe(3000);
    });
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

    it("keeps winner phase active for full WINNER_DISPLAY_MS then resets state and calls onTimeout", () => {
      const state: WinnerDisplayState = {
        lastWinners: ["s1"],
        lastWinningHand: "Pareja",
        winnerDisplayUntil: 0,
        winnerDisplayTimeoutId: null,
      };
      const now = 5000;
      vi.setSystemTime(now);
      const onTimeout = vi.fn();
      startWinnerDisplayPhase(state, onTimeout);
      expect(isInWinnerPhase(state)).toBe(true);
      vi.advanceTimersByTime(WINNER_DISPLAY_MS - 1);
      expect(isInWinnerPhase(state)).toBe(true);
      expect(onTimeout).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(state.winnerDisplayUntil).toBe(0);
      expect(state.lastWinners).toEqual([]);
      expect(state.lastWinningHand).toBe("-");
      expect(state.winnerDisplayTimeoutId).toBeNull();
      expect(onTimeout).toHaveBeenCalledTimes(1);
      expect(isInWinnerPhase(state)).toBe(false);
    });
  });

  describe("clearWinnerDisplay", () => {
    it("resets state and clears timeout", () => {
      const state: WinnerDisplayState = {
        lastWinners: ["p1"],
        lastWinningHand: "Pareja",
        winnerDisplayUntil: Date.now() + WINNER_DISPLAY_MS,
        winnerDisplayTimeoutId: setTimeout(() => {}, WINNER_DISPLAY_MS),
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
