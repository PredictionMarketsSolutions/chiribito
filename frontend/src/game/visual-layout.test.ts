import { describe, it, expect } from "vitest";
import { computeVisualSeatLayout, TARGET_FRONT_INDEX, TOTAL_SEATS } from "./visual-layout";
import type { RoomState, PlayerState } from "../types";

function player(p: Partial<PlayerState> & Pick<PlayerState, "sessionId" | "name" | "seatIndex">): PlayerState {
  return {
    chips: 1000,
    currentBet: 0,
    isFolded: false,
    ...p,
  };
}

describe("computeVisualSeatLayout", () => {
  it("rotates so local player seat maps to TARGET_FRONT_INDEX visual slot", () => {
    const state: RoomState = {
      users: new Map<string, PlayerState>([
        ["a", player({ sessionId: "a", name: "A", seatIndex: 0 })],
        ["b", player({ sessionId: "b", name: "B", seatIndex: 1 })],
      ]),
      dealerIndex: 0,
    };
    const { visualSeats, visualSeatNumbers } = computeVisualSeatLayout(state, "a");
    expect(visualSeats[TARGET_FRONT_INDEX]?.sessionId).toBe("a");
    expect(visualSeatNumbers[TARGET_FRONT_INDEX]).toBe(0);
    expect(TOTAL_SEATS).toBe(6);
  });

  it("with no session id does not shift", () => {
    const state: RoomState = {
      users: new Map<string, PlayerState>([
        ["a", player({ sessionId: "a", name: "A", seatIndex: 2 })],
      ]),
    };
    const { visualSeatNumbers } = computeVisualSeatLayout(state, null);
    for (let i = 0; i < TOTAL_SEATS; i += 1) {
      expect(visualSeatNumbers[i]).toBe(i);
    }
  });
});
