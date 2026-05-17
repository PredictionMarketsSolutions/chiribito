/**
 * ChiribitoRoom.onJoin.test.ts
 * Ensures the joining client's StateView includes all players (including themselves)
 * so the client can see their own seat and hole cards.
 */

jest.mock("@colyseus/core", () => ({
  Room: class {},
  Client: class {},
  CloseCode: { CONSENTED: 4000 },
}));

import { StateView } from "@colyseus/schema";
import { ChiribitoRoom } from "../../rooms/ChiribitoRoom";
import { Player, MesaState } from "../../rooms/schema/MesaState";

describe("ChiribitoRoom onJoin StateView", () => {
  it("adds all players including the joining client to their view so they see their hand", () => {
    const state = new MesaState();
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

    ChiribitoRoom.prototype.onJoin.call(fakeRoom, client as any, {});

    expect(client.view).toBeInstanceOf(StateView);
    expect(client.view!.has(ownPlayer)).toBe(true);
    expect(client.view!.has(otherPlayer)).toBe(true);
  });

  it("adds new player to existing clients' views so they see the new seat", () => {
    const state = new MesaState();
    const existingPlayer = new Player("session-existing");
    existingPlayer.name = "Existing";
    state.users.set("session-existing", existingPlayer);
    const joiningPlayer = new Player("session-joining");
    joiningPlayer.name = "Joining";
    state.users.set("session-joining", joiningPlayer);

    const existingClient = { view: new StateView() } as any;
    existingClient.view.add(existingPlayer);
    const joiningClient = { view: null as StateView | null };
    const handleJoin = jest.fn().mockReturnValue(joiningPlayer);

    const fakeRoom: any = {
      state,
      lifecycleManager: { handleJoin },
      sessionManager: {},
      seatManager: {},
      connectionMonitor: {},
      analytics: {},
      clients: [existingClient, joiningClient],
      broadcast: jest.fn(),
    };

    ChiribitoRoom.prototype.onJoin.call(fakeRoom, joiningClient as any, {});

    expect(joiningClient.view).toBeInstanceOf(StateView);
    expect(existingClient.view.has(joiningPlayer)).toBe(true);
  });

  it("passes getClients and broadcast to handleJoin so lifecycle can use them", () => {
    const state = new MesaState();
    const player = new Player("session-1");
    state.users.set("session-1", player);
    const client = { view: null as StateView | null };
    const broadcast = jest.fn();
    let getClientsRef: (() => unknown[]) | null = null;
    let broadcastRef: ((type: string, message: unknown, opts?: unknown) => void) | null = null;
    const handleJoin = jest.fn().mockImplementation((_client: unknown, _options: unknown, _state: unknown, _deps: unknown, getClients: () => unknown[], broadcastCb: (type: string, message: unknown, opts?: unknown) => void) => {
      getClientsRef = getClients;
      broadcastRef = broadcastCb;
      return player;
    });

    const fakeRoom: any = {
      state,
      lifecycleManager: { handleJoin },
      sessionManager: {},
      seatManager: {},
      connectionMonitor: {},
      analytics: {},
      clients: [client],
      broadcast,
    };

    ChiribitoRoom.prototype.onJoin.call(fakeRoom, client as any, {});

    expect(getClientsRef).not.toBeNull();
    expect(getClientsRef!()).toEqual([client]);
    expect(broadcastRef).not.toBeNull();
    broadcastRef!("testMessage", {});
    expect(broadcast).toHaveBeenCalledWith("testMessage", {}, undefined);
  });
});
