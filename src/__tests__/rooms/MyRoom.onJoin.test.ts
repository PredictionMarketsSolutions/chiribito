/**
 * MyRoom.onJoin.test.ts
 * Ensures the joining client's StateView includes all players (including themselves)
 * so the client can see their own seat and hole cards.
 */

jest.mock("@colyseus/core", () => ({
  Room: class {},
  Client: class {},
  CloseCode: { CONSENTED: 4000 },
}));

import { StateView } from "@colyseus/schema";
import { MyRoom } from "../../rooms/MyRoom";
import { Player, MyRoomState } from "../../rooms/schema/MyRoomState";

describe("MyRoom onJoin StateView", () => {
  it("adds all players including the joining client to their view so they see their hand", () => {
    const state = new MyRoomState();
    const ownPlayer = new Player("session-joining");
    ownPlayer.name = "Joining";
    state.users.set("session-joining", ownPlayer);

    const otherPlayer = new Player("session-other");
    otherPlayer.name = "Other";
    state.users.set("session-other", otherPlayer);

    const client: { view: StateView | null } = { view: null };
    const handleJoin = jest.fn().mockReturnValue(ownPlayer);

    const fakeRoom: any = {
      state,
      lifecycleManager: { handleJoin },
      sessionManager: {},
      seatManager: {},
      connectionMonitor: {},
      analytics: {},
      clients: [client],
      broadcast: jest.fn(),
    };

    MyRoom.prototype.onJoin.call(fakeRoom, client as any, {});

    expect(client.view).toBeInstanceOf(StateView);
    expect(client.view!.has(ownPlayer)).toBe(true);
    expect(client.view!.has(otherPlayer)).toBe(true);
  });
});
