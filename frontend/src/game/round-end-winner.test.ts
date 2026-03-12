/**
 * Tests for roundEnded winner-display logic: when to start phase and extracted data.
 */

import { describe, it, expect } from "vitest";
import {
  getWinnerDisplayFromRoundEnd,
  type RoundEndedPayload,
} from "./round-end-winner";

describe("round-end-winner", () => {
  describe("getWinnerDisplayFromRoundEnd", () => {
    it("returns empty and startPhaseNow false for null/undefined payload", () => {
      expect(getWinnerDisplayFromRoundEnd(null)).toEqual({
        winnerIds: [],
        winningHand: "",
        startPhaseNow: false,
      });
      expect(getWinnerDisplayFromRoundEnd(undefined)).toEqual({
        winnerIds: [],
        winningHand: "",
        startPhaseNow: false,
      });
    });

    it("returns empty for payload without winners", () => {
      expect(
        getWinnerDisplayFromRoundEnd({} as RoundEndedPayload)
      ).toEqual({ winnerIds: [], winningHand: "", startPhaseNow: false });
      expect(
        getWinnerDisplayFromRoundEnd({ winners: [] })
      ).toEqual({ winnerIds: [], winningHand: "", startPhaseNow: false });
    });

    it("extracts winner ids and winning hand and startPhaseNow true for normal hand", () => {
      const payload: RoundEndedPayload = {
        winners: [{ playerId: "s1", amount: 100 }, { playerId: "s2", amount: 50 }],
        winningHand: "Pareja",
        isAllInShowdown: false,
      };
      const result = getWinnerDisplayFromRoundEnd(payload);
      expect(result.winnerIds).toEqual(["s1", "s2"]);
      expect(result.winningHand).toBe("Pareja");
      expect(result.startPhaseNow).toBe(true);
    });

    it("startPhaseNow true when single winner (e.g. fold)", () => {
      const payload: RoundEndedPayload = {
        winners: [{ playerId: "only-winner" }],
        winningHand: "-",
      };
      const result = getWinnerDisplayFromRoundEnd(payload);
      expect(result.winnerIds).toEqual(["only-winner"]);
      expect(result.startPhaseNow).toBe(true);
    });

    it("startPhaseNow false for all-in showdown with 5 community cards (phase starts after reveal)", () => {
      const payload: RoundEndedPayload = {
        winners: [{ playerId: "s1" }],
        winningHand: "Escalera",
        isAllInShowdown: true,
        communityCards: [1, 2, 3, 4, 5],
      };
      const result = getWinnerDisplayFromRoundEnd(payload);
      expect(result.winnerIds).toEqual(["s1"]);
      expect(result.winningHand).toBe("Escalera");
      expect(result.startPhaseNow).toBe(false);
    });

    it("startPhaseNow true for all-in showdown with fewer than 5 community cards", () => {
      const payload: RoundEndedPayload = {
        winners: [{ playerId: "s1" }],
        winningHand: "Pareja",
        isAllInShowdown: true,
        communityCards: [1, 2, 3],
      };
      const result = getWinnerDisplayFromRoundEnd(payload);
      expect(result.startPhaseNow).toBe(true);
    });

    it("ignores winners entries without valid playerId", () => {
      const payload: RoundEndedPayload = {
        winners: [
          { playerId: "valid" },
          { playerId: "" },
          { amount: 10 },
          null as any,
          { playerId: "also-valid" },
        ],
        winningHand: "-",
      };
      const result = getWinnerDisplayFromRoundEnd(payload);
      expect(result.winnerIds).toEqual(["valid", "also-valid"]);
      expect(result.startPhaseNow).toBe(true);
    });

    it("uses empty string for missing winningHand", () => {
      const payload: RoundEndedPayload = {
        winners: [{ playerId: "s1" }],
      };
      const result = getWinnerDisplayFromRoundEnd(payload);
      expect(result.winningHand).toBe("");
    });

    it("treats non-array communityCards as length 0", () => {
      const payload: RoundEndedPayload = {
        winners: [{ playerId: "s1" }],
        isAllInShowdown: true,
        communityCards: "not-array" as any,
      };
      const result = getWinnerDisplayFromRoundEnd(payload);
      expect(result.startPhaseNow).toBe(true);
    });
  });
});
