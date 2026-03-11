/**
 * Tests for room-state helpers (schema → plain data).
 */

import { describe, it, expect } from "vitest";
import { isPlayerState, schemaArrayToCards, getUserEntries } from "./room-state";
import type { RoomState, PlayerState } from "../types";

describe("room-state", () => {
  describe("isPlayerState", () => {
    it("returns true for valid player object", () => {
      const p: PlayerState = {
        sessionId: "s1",
        name: "Alice",
        chips: 100,
        currentBet: 0,
        isFolded: false,
        seatIndex: 0,
      };
      expect(isPlayerState(p)).toBe(true);
    });

    it("returns false for null or undefined", () => {
      expect(isPlayerState(null)).toBe(false);
      expect(isPlayerState(undefined)).toBe(false);
    });

    it("returns false for non-object", () => {
      expect(isPlayerState("string")).toBe(false);
      expect(isPlayerState(42)).toBe(false);
    });

    it("returns false when required fields are missing or wrong type", () => {
      expect(isPlayerState({})).toBe(false);
      expect(isPlayerState({ sessionId: "s1", name: "A" })).toBe(false);
      expect(isPlayerState({ sessionId: 1, name: "A", chips: 0, currentBet: 0, isFolded: false, seatIndex: 0 })).toBe(false);
    });
  });

  describe("schemaArrayToCards", () => {
    it("returns [] for null or undefined", () => {
      expect(schemaArrayToCards(null)).toEqual([]);
      expect(schemaArrayToCards(undefined)).toEqual([]);
    });

    it("returns array as-is when already array", () => {
      const arr = ["1O", "7C"];
      expect(schemaArrayToCards(arr)).toEqual(["1O", "7C"]);
    });

    it("uses toArray() when present", () => {
      const schema = { toArray: () => ["2C", "2O"] };
      expect(schemaArrayToCards(schema)).toEqual(["2C", "2O"]);
    });

    it("iterates by length when no toArray", () => {
      const schema = { length: 2, 0: "1O", 1: "7C" };
      expect(schemaArrayToCards(schema)).toEqual(["1O", "7C"]);
    });

    it("skips non-string indices", () => {
      const schema = { length: 2, 0: "1O", 1: 99 };
      expect(schemaArrayToCards(schema)).toEqual(["1O"]);
    });
  });

  describe("getUserEntries", () => {
    it("returns [] when state or users missing", () => {
      expect(getUserEntries({} as RoomState)).toEqual([]);
      expect(getUserEntries({ users: undefined } as RoomState)).toEqual([]);
    });

    it("returns entries from Map", () => {
      const p1: PlayerState = { sessionId: "s1", name: "A", chips: 100, currentBet: 0, isFolded: false, seatIndex: 0 };
      const p2: PlayerState = { sessionId: "s2", name: "B", chips: 200, currentBet: 10, isFolded: false, seatIndex: 1 };
      const state: RoomState = { users: new Map([["s1", p1], ["s2", p2]]) };
      expect(getUserEntries(state)).toHaveLength(2);
      expect(getUserEntries(state).map((p) => p.sessionId).sort()).toEqual(["s1", "s2"]);
    });

    it("filters out invalid entries when using Map", () => {
      const p1 = { sessionId: "s1", name: "A", chips: 100, currentBet: 0, isFolded: false, seatIndex: 0 };
      const bad = { sessionId: "s2" };
      const state: RoomState = { users: new Map([["s1", p1 as PlayerState], ["s2", bad as PlayerState]]) };
      const entries = getUserEntries(state);
      expect(entries).toHaveLength(1);
      expect(entries[0].sessionId).toBe("s1");
    });
  });
});
