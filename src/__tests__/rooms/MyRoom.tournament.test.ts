/**
 * MyRoom.tournament.test.ts
 * Tests for tournament end: notifyTournamentEnd sends gameResult (won/lost) to each client and closes the room.
 */

import { MyRoom } from "../../rooms/MyRoom";

describe("MyRoom tournament end", () => {
  it("notifyTournamentEnd sends gameResult won to champion and lost to others, then disconnects", () => {
    const champion = { sessionId: "winner-1", name: "Winner", chips: 5000 };
    const sendWinner = jest.fn();
    const sendLoser = jest.fn();
    const disconnect = jest.fn();

    const fakeRoom = {
      clients: [
        { sessionId: "winner-1", send: sendWinner },
        { sessionId: "loser-2", send: sendLoser },
      ],
      disconnect,
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
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("notifyTournamentEnd sends lost to all when single client is not the champion", () => {
    const champion = { sessionId: "absent-winner", name: "Winner", chips: 1000 };
    const send = jest.fn();
    const disconnect = jest.fn();

    const fakeRoom = {
      clients: [{ sessionId: "only-player", send }],
      disconnect,
    };

    MyRoom.prototype.notifyTournamentEnd.call(fakeRoom, champion);

    expect(send).toHaveBeenCalledWith("gameResult", { result: "lost", champion });
    expect(disconnect).toHaveBeenCalled();
  });

  it("notifyTournamentEnd calls disconnect even with no clients", () => {
    const champion = { sessionId: "solo", name: "Solo", chips: 100 };
    const disconnect = jest.fn();

    const fakeRoom = {
      clients: [] as Array<{ sessionId: string; send: jest.Mock }>,
      disconnect,
    };

    MyRoom.prototype.notifyTournamentEnd.call(fakeRoom, champion);

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
