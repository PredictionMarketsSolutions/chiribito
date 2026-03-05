/**
 * PlayerActions.test.ts
 * Unit tests for check, fold, foldForTimeout
 */

import { PlayerActions } from "../../rooms/game/utils/PlayerActions";
import { MyRoomState, Player } from "../../rooms/schema/MyRoomState";
import type { IGameRoom } from "../../types/IGameRoom";
import type { Client } from "@colyseus/core";

describe("PlayerActions", () => {
  let actions: PlayerActions;
  let mockRoom: jest.Mocked<IGameRoom>;
  let state: MyRoomState;

  function createMockRoom(): jest.Mocked<IGameRoom> {
    state = new MyRoomState();
    state.currentTurn = "p1";
    state.currentBet = 0;
    state.pot = 0;

    const p1 = new Player("p1");
    p1.name = "Alice";
    p1.isFolded = false;
    p1.currentBet = 0;
    state.users.set("p1", p1);

    const p2 = new Player("p2");
    p2.name = "Bob";
    p2.isFolded = false;
    p2.currentBet = 0;
    state.users.set("p2", p2);

    return {
      roomId: "room-1",
      state,
      clients: [],
      playersInHand: ["p1", "p2"],
      playersAllIn: new Set(),
      playersActedThisRound: new Set(),
      dealerIndex: 0,
      currentPlayerIndex: 0,
      turnTimeout: null,
      broadcast: jest.fn(),
      scheduleDelayed: jest.fn((cb: () => void) => cb())
    } as unknown as jest.Mocked<IGameRoom>;
  }

  beforeEach(() => {
    mockRoom = createMockRoom();
    actions = new PlayerActions(mockRoom);
  });

  describe("handleCheck", () => {
    it("does nothing when not current turn", () => {
      state.currentTurn = "p2";
      const callback = jest.fn();
      actions.handleCheck({ sessionId: "p1" } as Client, callback);
      expect(callback).not.toHaveBeenCalled();
      expect(mockRoom.playersActedThisRound.has("p1")).toBe(false);
    });

    it("does nothing when player not in room", () => {
      const callback = jest.fn();
      actions.handleCheck({ sessionId: "unknown" } as Client, callback);
      expect(callback).not.toHaveBeenCalled();
    });

    it("does nothing when player already folded", () => {
      state.users.get("p1")!.isFolded = true;
      const callback = jest.fn();
      actions.handleCheck({ sessionId: "p1" } as Client, callback);
      expect(callback).not.toHaveBeenCalled();
    });

    it("sends error when cannot check (currentBet < state.currentBet)", () => {
      state.currentBet = 100;
      const p1 = state.users.get("p1")!;
      p1.currentBet = 0;
      const client = { sessionId: "p1", send: jest.fn() } as unknown as Client;
      const callback = jest.fn();
      actions.handleCheck(client, callback);
      expect(client.send).toHaveBeenCalledWith("error", expect.objectContaining({ message: expect.stringContaining("cannot check") }));
      expect(callback).not.toHaveBeenCalled();
    });

    it("broadcasts check and calls callback when valid", () => {
      const client = { sessionId: "p1" } as Client;
      const callback = jest.fn();
      actions.handleCheck(client, callback);
      expect(mockRoom.broadcast).toHaveBeenCalledWith("playerAction", expect.objectContaining({ action: "check", playerId: "p1" }));
      expect(mockRoom.playersActedThisRound.has("p1")).toBe(true);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe("handleFold", () => {
    it("does nothing when not current turn", () => {
      state.currentTurn = "p2";
      const callback = jest.fn();
      actions.handleFold({ sessionId: "p1" } as Client, new Map(), callback);
      expect(callback).not.toHaveBeenCalled();
      expect(state.users.get("p1")!.isFolded).toBe(false);
    });

    it("does nothing when player not in room", () => {
      const callback = jest.fn();
      actions.handleFold({ sessionId: "unknown" } as Client, new Map(), callback);
      expect(callback).not.toHaveBeenCalled();
    });

    it("does nothing when player already folded", () => {
      state.users.get("p1")!.isFolded = true;
      const callback = jest.fn();
      actions.handleFold({ sessionId: "p1" } as Client, new Map(), callback);
      expect(callback).not.toHaveBeenCalled();
    });

    it("marks folded, removes from hand, broadcasts and calls callback", () => {
      const client = { sessionId: "p1" } as Client;
      const callback = jest.fn();
      actions.handleFold(client, new Map(), callback);
      expect(state.users.get("p1")!.isFolded).toBe(true);
      expect(mockRoom.playersInHand).toEqual(["p2"]);
      expect(mockRoom.broadcast).toHaveBeenCalledWith("playerAction", expect.objectContaining({ action: "fold", playerId: "p1" }));
      expect(callback).toHaveBeenCalled();
    });

    it("when one player left still calls callback", () => {
      mockRoom.playersInHand = ["p1", "p2"];
      const client = { sessionId: "p1" } as Client;
      const callback = jest.fn();
      actions.handleFold(client, new Map(), callback);
      expect(mockRoom.playersInHand).toEqual(["p2"]);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe("handleFoldForTimeout", () => {
    it("does nothing when player not in room", () => {
      const callback = jest.fn();
      actions.handleFoldForTimeout("unknown", new Map(), callback);
      expect(callback).not.toHaveBeenCalled();
    });

    it("delegates to handleFold when player exists", () => {
      const callback = jest.fn();
      actions.handleFoldForTimeout("p1", new Map(), callback);
      expect(state.users.get("p1")!.isFolded).toBe(true);
      expect(callback).toHaveBeenCalled();
    });
  });
});
