/**
 * MyRoom.tournament.test.ts
 * Tests for tournament end: notifyTournamentEnd sends gameResult (won/lost) to each client,
 * schedules delayed disconnect so all clients receive the message before close.
 */

// Avoid loading full @colyseus/core (pulls ESM deps like rou3 that Jest does not transform)
jest.mock("@colyseus/core", () => ({
  Room: class {},
  Client: class {},
  CloseCode: { CONSENTED: 4000 },
}));

jest.mock("../../services/api-server-stats", () => ({
  reportTournamentGameEnded: jest.fn().mockResolvedValue(undefined),
}));

import { MyRoom } from "../../rooms/MyRoom";
import { CUSTOM_GAME_END } from "../../rooms/close-codes";
import { reportTournamentGameEnded } from "../../services/api-server-stats";

describe("MyRoom tournament end", () => {
  it("notifyTournamentEnd sends gameResult won to champion and lost to others, then schedules disconnect", () => {
    const champion = { sessionId: "winner-1", name: "Winner", chips: 5000 };
    const sendWinner = jest.fn();
    const sendLoser = jest.fn();
    const disconnect = jest.fn();
    let scheduledCb: (() => void) | null = null;
    const clockSetTimeout = jest.fn((cb: () => void, ms: number) => {
      scheduledCb = cb;
      return 0;
    });

    const leave = jest.fn();
    const fakeRoom: any = {
      clients: [
        { sessionId: "winner-1", send: sendWinner, leave },
        { sessionId: "loser-2", send: sendLoser, leave },
      ],
      disconnect,
      clock: { setTimeout: clockSetTimeout },
    };
    fakeRoom.reportTournamentStats = jest.fn();

    MyRoom.prototype.notifyTournamentEnd.call(fakeRoom, champion);

    expect(sendWinner).toHaveBeenCalledTimes(1);
    expect(sendWinner).toHaveBeenCalledWith("gameResult", {
      result: "won",
      champion,
    });
    expect(sendLoser).toHaveBeenCalledTimes(1);
    expect(sendLoser).toHaveBeenCalledWith("gameResult", {
      result: "lost",
      champion,
    });
    expect(disconnect).not.toHaveBeenCalled();
    expect(clockSetTimeout).toHaveBeenCalledTimes(1);
    expect(clockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 800);

    if (scheduledCb) scheduledCb();
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(leave).toHaveBeenCalledTimes(2);
    expect(leave).toHaveBeenCalledWith(CUSTOM_GAME_END, "GAME_END");
  });

  it("notifyTournamentEnd sends lost to all when single client is not the champion", () => {
    const champion = { sessionId: "absent-winner", name: "Winner", chips: 1000 };
    const send = jest.fn();
    const leave = jest.fn();
    const disconnect = jest.fn();
    let scheduledCb: (() => void) | null = null;
    const clockSetTimeout = jest.fn((cb: () => void) => {
      scheduledCb = cb;
      return 0;
    });

    const fakeRoom: any = {
      clients: [{ sessionId: "only-player", send, leave }],
      disconnect,
      clock: { setTimeout: clockSetTimeout },
    };
    fakeRoom.reportTournamentStats = jest.fn();

    MyRoom.prototype.notifyTournamentEnd.call(fakeRoom, champion);

    expect(send).toHaveBeenCalledWith("gameResult", { result: "lost", champion });
    expect(clockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 800);
    if (scheduledCb) scheduledCb();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("notifyTournamentEnd schedules disconnect even with no clients", () => {
    const champion = { sessionId: "solo", name: "Solo", chips: 100 };
    const disconnect = jest.fn();
    let scheduledCb: (() => void) | null = null;
    const clockSetTimeout = jest.fn((cb: () => void) => {
      scheduledCb = cb;
      return 0;
    });

    const fakeRoom: any = {
      clients: [] as Array<{ sessionId: string; send: jest.Mock }>,
      disconnect,
      clock: { setTimeout: clockSetTimeout },
    };
    fakeRoom.reportTournamentStats = jest.fn();

    MyRoom.prototype.notifyTournamentEnd.call(fakeRoom, champion);

    expect(clockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 800);
    if (scheduledCb) scheduledCb();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("disconnect is delayed by 800ms so clients can receive gameResult before close", () => {
    const champion = { sessionId: "champ", name: "Champ", chips: 2000 };
    const send = jest.fn();
    const leave = jest.fn();
    const disconnect = jest.fn();
    const clockSetTimeout = jest.fn((cb: () => void, ms: number) => {
      expect(ms).toBe(800);
      return 0;
    });

    const fakeRoom: any = {
      clients: [
        { sessionId: "champ", send, leave },
        { sessionId: "other", send, leave },
      ],
      disconnect,
      clock: { setTimeout: clockSetTimeout },
    };
    fakeRoom.reportTournamentStats = jest.fn();

    MyRoom.prototype.notifyTournamentEnd.call(fakeRoom, champion);

    expect(clockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 800);
    expect(disconnect).not.toHaveBeenCalled();
  });

  describe("reportTournamentStats", () => {
    beforeEach(() => {
      (reportTournamentGameEnded as jest.Mock).mockClear();
    });

    it("does nothing when INTERNAL_API_SECRET is missing", async () => {
      delete process.env.INTERNAL_API_SECRET;
      const champion = { sessionId: "s1", name: "Champ", chips: 1000 };
      const fakeRoom: any = {
        roomId: "room-1",
        state: { users: new Map([["s1", {}]]) },
        sessionManager: {
          getUserId: () => 10,
        },
      };

      await (MyRoom.prototype as any).reportTournamentStats.call(fakeRoom, champion);
      expect(reportTournamentGameEnded).not.toHaveBeenCalled();
    });

    it("reports champion and participants when secret and userIds are available", async () => {
      process.env.INTERNAL_API_SECRET = "test-secret";
      const champion = { sessionId: "s1", name: "Champ", chips: 1000 };
      const fakeRoom: any = {
        roomId: "room-1",
        state: {
          users: new Map<string, any>([
            ["s1", {}],
            ["s2", {}],
          ]),
        },
        sessionManager: {
          getUserId: (sessionId: string) => {
            if (sessionId === "s1") return 10;
            if (sessionId === "s2") return 11;
            return undefined;
          },
        },
      };

      await (MyRoom.prototype as any).reportTournamentStats.call(fakeRoom, champion);

      expect(reportTournamentGameEnded).toHaveBeenCalledWith(
        expect.any(String),
        "test-secret",
        expect.objectContaining({
          championUserId: 10,
          participantUserIds: expect.arrayContaining([10, 11]),
        }),
      );
    });
  });
});
