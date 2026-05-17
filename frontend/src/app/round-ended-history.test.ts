import { describe, it, expect } from "vitest";
import {
  getWinnersForHistory,
  getWinningCardsFromPayload,
  buildRoundEndedHistoryData,
  shouldRenderLastRoomState,
} from "./round-ended-history";

describe("round-ended-history", () => {
  it("extracts winners for history from valid payload winners", () => {
    const winners = getWinnersForHistory({
      winners: [
        { playerId: "p1", amount: 120 },
        { playerId: "p2" },
        { foo: "bar" },
      ],
    } as any);
    expect(winners).toEqual([
      { playerId: "p1", amount: 120 },
      { playerId: "p2", amount: undefined },
    ]);
  });

  it("returns first winner cards when available", () => {
    const cards = getWinningCardsFromPayload(
      {
        playerHands: {
          p1: ["1O", "1C"],
        },
      } as any,
      [{ playerId: "p1", amount: 40 }]
    );
    expect(cards).toEqual(["1O", "1C"]);
  });

  it("builds history data with normalized fields", () => {
    // Fixture cards belong to the canonical Chiribito deck only:
    // ranks 5, 6, 7, 10 (Sota), 11 (Caballo), 12 (Rey), 1 (As).
    const data = buildRoundEndedHistoryData(
      {
        winners: [{ playerId: "a1", amount: 10 }],
        communityCards: ["1O", "5O"],
        playerHands: {
          a1: ["7O", "6O"],
          me: ["10O", "11O"],
        },
      } as any,
      {
        currentSessionId: "me",
        potText: "250",
        schemaArrayToCards: (value) => (Array.isArray(value) ? value.map(String) : []),
      }
    );

    expect(data.winnersForHistory).toEqual([{ playerId: "a1", amount: 10 }]);
    expect(data.communityCards).toEqual(["1O", "5O"]);
    expect(data.yourHand).toEqual(["10O", "11O"]);
    expect(data.potValue).toBe(250);
    expect(data.winningCards).toEqual(["7O", "6O"]);
  });

  it("shouldRenderLastRoomState depends on state + winner phase", () => {
    expect(shouldRenderLastRoomState(null as any, false)).toBe(false);
    expect(shouldRenderLastRoomState({} as any, true)).toBe(false);
    expect(shouldRenderLastRoomState({} as any, false)).toBe(true);
  });
});
