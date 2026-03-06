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

import { MyRoom } from "../../rooms/MyRoom";

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

    const fakeRoom = {
      clients: [
        { sessionId: "winner-1", send: sendWinner },
        { sessionId: "loser-2", send: sendLoser },
      ],
      disconnect,
      clock: { setTimeout: clockSetTimeout },
    };

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
  });

  it("notifyTournamentEnd sends lost to all when single client is not the champion", () => {
    const champion = { sessionId: "absent-winner", name: "Winner", chips: 1000 };
    const send = jest.fn();
    const disconnect = jest.fn();
    let scheduledCb: (() => void) | null = null;
    const clockSetTimeout = jest.fn((cb: () => void) => {
      scheduledCb = cb;
      return 0;
    });

    const fakeRoom = {
      clients: [{ sessionId: "only-player", send }],
      disconnect,
      clock: { setTimeout: clockSetTimeout },
    };

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

    const fakeRoom = {
      clients: [] as Array<{ sessionId: string; send: jest.Mock }>,
      disconnect,
      clock: { setTimeout: clockSetTimeout },
    };

    MyRoom.prototype.notifyTournamentEnd.call(fakeRoom, champion);

    expect(clockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 800);
    if (scheduledCb) scheduledCb();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("disconnect is delayed by 800ms so clients can receive gameResult before close", () => {
    const champion = { sessionId: "champ", name: "Champ", chips: 2000 };
    const send = jest.fn();
    const disconnect = jest.fn();
    const clockSetTimeout = jest.fn((cb: () => void, ms: number) => {
      expect(ms).toBe(800);
      return 0;
    });

    const fakeRoom = {
      clients: [
        { sessionId: "champ", send },
        { sessionId: "other", send },
      ],
      disconnect,
      clock: { setTimeout: clockSetTimeout },
    };

    MyRoom.prototype.notifyTournamentEnd.call(fakeRoom, champion);

    expect(clockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 800);
    expect(disconnect).not.toHaveBeenCalled();
  });
});
