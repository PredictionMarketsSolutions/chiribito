import { Client } from "@colyseus/core";
import { PlayerLifecycleManager } from "../../rooms/managers/PlayerLifecycleManager";
import { SessionManager } from "../../rooms/managers/SessionManager";
import { SeatManager } from "../../rooms/managers/SeatManager";
import { ConnectionMonitor } from "../../rooms/managers/ConnectionMonitor";
import { AnalyticsService } from "../../rooms/managers/AnalyticsService";
import { MyRoomState, Player } from "../../rooms/schema/MyRoomState";
import { GameEngine } from "../../rooms/game/GameEngine";

describe("PlayerLifecycleManager", () => {
  let manager: PlayerLifecycleManager;
  let sessionManager: SessionManager;
  let seatManager: SeatManager;
  let connectionMonitor: ConnectionMonitor;
  let analytics: AnalyticsService;
  let mockState: MyRoomState;
  let mockEngine: Partial<GameEngine>;
  let playersInHand: string[];
  let broadcastCalls: any[];
  let mockClients: Client[];

  const createMockClient = (sessionId: string): Client => ({
    sessionId,
    send: jest.fn(),
    leave: jest.fn(),
  } as any);

  const broadcastFn = (type: string, message: any, opts?: any) => {
    broadcastCalls.push({ type, message, opts });
  };

  const getAllClientsFn = () => mockClients;

  const allowReconnectionFn = (client: Client, seconds: number): Promise<Client> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error("timeout")), 100);
    });
  };

  beforeEach(() => {
    manager = new PlayerLifecycleManager("test-room", { reconnectionTimeoutSeconds: 60 });
    sessionManager = new SessionManager("test-room", 60);
    seatManager = new SeatManager("test-room", 6, 120000);
    connectionMonitor = new ConnectionMonitor("test-room", {
      heartbeatIntervalMs: 30000,
      heartbeatTimeoutMs: 60000
    }, () => {});
    analytics = new AnalyticsService("test-room");
    mockState = new MyRoomState();
    playersInHand = [];
    broadcastCalls = [];
    mockClients = [];

    mockEngine = {
      setCurrentPlayerIndexBeforeNextActive: jest.fn(),
      endTurn: jest.fn(),
      endRound: jest.fn(),
    };
  });

  afterEach(() => {
    sessionManager.clearAll();
    seatManager.clearAll();
    connectionMonitor.clearAll();
    analytics.clearAll();
  });

  const dependencies = () => ({
    sessionManager,
    seatManager,
    connectionMonitor,
    analytics,
  });

  describe("constructor", () => {
    it("should use default config when no config provided", () => {
      const mgr = new PlayerLifecycleManager("room-1");
      const config = mgr.getConfig();
      expect(config.reconnectionTimeoutSeconds).toBe(60);
    });

    it("should use custom config when provided", () => {
      const mgr = new PlayerLifecycleManager("room-1", { reconnectionTimeoutSeconds: 120 });
      const config = mgr.getConfig();
      expect(config.reconnectionTimeoutSeconds).toBe(120);
    });
  });

  describe("handleJoin - new player", () => {
    it("should add a new player to the room state", () => {
      const client = createMockClient("session-1");
      const options = {
        authUser: { userId: 1, username: "Alice" },
        name: "Alice",
        chips: 1500,
      };

      const player = manager.handleJoin(client, options, mockState, dependencies(), getAllClientsFn, broadcastFn);

      expect(player.sessionId).toBe("session-1");
      expect(player.name).toBe("Alice");
      expect(player.chips).toBe(1500);
      expect(mockState.users.get("session-1")).toBe(player);
    });

    it("should register session and occupy seat", () => {
      const client = createMockClient("session-2");
      const options = {
        authUser: { userId: 2, username: "Bob" },
        chips: 1000,
      };

      manager.handleJoin(client, options, mockState, dependencies(), getAllClientsFn, broadcastFn);

      expect(sessionManager.getSessionId(2)).toBe("session-2");
      expect(seatManager.isSeatOccupied(0)).toBe(true);
    });

    it("should record analytics and heartbeat", () => {
      const client = createMockClient("session-3");
      const options = { authUser: { userId: 3 } };

      manager.handleJoin(client, options, mockState, dependencies(), getAllClientsFn, broadcastFn);

      expect(analytics.getTotalSessions()).toBe(1);
      expect(connectionMonitor.isMonitored("session-3")).toBe(true);
    });

    it("should send joined message to client", () => {
      const client = createMockClient("session-4");
      const options = { authUser: { userId: 4 }, name: "Charlie", chips: 2000 };

      manager.handleJoin(client, options, mockState, dependencies(), getAllClientsFn, broadcastFn);

      expect(client.send).toHaveBeenCalledWith("joined", expect.objectContaining({
        name: "Charlie",
        chips: 2000,
        players: expect.any(Array),
      }));
    });

    it("should broadcast playerJoined to other clients", () => {
      const client = createMockClient("session-5");
      const options = { authUser: { userId: 5 }, name: "Dave" };

      manager.handleJoin(client, options, mockState, dependencies(), getAllClientsFn, broadcastFn);

      expect(broadcastCalls).toContainEqual({
        type: "playerJoined",
        message: expect.objectContaining({
          id: "session-5",
          name: "Dave",
        }),
        opts: { except: client },
      });
    });

    it("should assign next available seat", () => {
      const client1 = createMockClient("session-1");
      const client2 = createMockClient("session-2");
      const options1 = { authUser: { userId: 1 } };
      const options2 = { authUser: { userId: 2 } };

      const player1 = manager.handleJoin(client1, options1, mockState, dependencies(), getAllClientsFn, broadcastFn);
      const player2 = manager.handleJoin(client2, options2, mockState, dependencies(), getAllClientsFn, broadcastFn);

      expect(player1.seatIndex).toBe(0);
      expect(player2.seatIndex).toBe(1);
    });

    it("should use default name when no name provided", () => {
      const client = createMockClient("abcd-1234");
      const options = { authUser: { userId: 1 } };

      const player = manager.handleJoin(client, options, mockState, dependencies(), getAllClientsFn, broadcastFn);

      expect(player.name).toBe("Player-abcd");
    });
  });

  describe("handleJoin - session replacement", () => {
    it("should replace existing session when replaceSessionId provided", () => {
      const oldClient = createMockClient("old-session");
      const newClient = createMockClient("new-session");
      mockClients = [oldClient];

      const oldPlayer = new Player("old-session");
      oldPlayer.name = "Alice";
      oldPlayer.chips = 1500;
      oldPlayer.seatIndex = 2;
      mockState.users.set("old-session", oldPlayer);
      sessionManager.registerSession(1, "old-session");

      const options = {
        authUser: { userId: 1, username: "Alice" },
        replaceSessionId: "old-session",
      };

      const newPlayer = manager.handleJoin(newClient, options, mockState, dependencies(), getAllClientsFn, broadcastFn);

      expect(newPlayer.sessionId).toBe("new-session");
      expect(newPlayer.seatIndex).toBe(2);
      expect(mockState.users.get("old-session")).toBeUndefined();
      expect(mockState.users.get("new-session")).toBe(newPlayer);
    });

    it("should kick old client with SESSION_REPLACED code", () => {
      const oldClient = createMockClient("old-session");
      const newClient = createMockClient("new-session");
      mockClients = [oldClient];

      const oldPlayer = new Player("old-session");
      mockState.users.set("old-session", oldPlayer);

      const options = {
        authUser: { userId: 1 },
        replaceSessionId: "old-session",
      };

      manager.handleJoin(newClient, options, mockState, dependencies(), getAllClientsFn, broadcastFn);

      expect(oldClient.leave).toHaveBeenCalledWith(4001, "SESSION_REPLACED");
    });

    it("should remove old session from sessionManager", () => {
      const oldClient = createMockClient("old-session");
      const newClient = createMockClient("new-session");
      mockClients = [oldClient];

      const oldPlayer = new Player("old-session");
      mockState.users.set("old-session", oldPlayer);
      sessionManager.registerSession(1, "old-session");

      const options = {
        authUser: { userId: 1 },
        replaceSessionId: "old-session",
      };

      manager.handleJoin(newClient, options, mockState, dependencies(), getAllClientsFn, broadcastFn);

      expect(sessionManager.getSessionId(1)).toBe("new-session");
    });

    it("should maintain player order when replacing session", () => {
      const client1 = createMockClient("session-1");
      const client2 = createMockClient("session-2");
      const client3 = createMockClient("session-3");
      const newClient2 = createMockClient("new-session-2");

      mockState.users.set("session-1", new Player("session-1"));
      mockState.users.set("session-2", new Player("session-2"));
      mockState.users.set("session-3", new Player("session-3"));
      mockClients = [client2];

      const options = {
        authUser: { userId: 2 },
        replaceSessionId: "session-2",
      };

      manager.handleJoin(newClient2, options, mockState, dependencies(), getAllClientsFn, broadcastFn);

      const userIds = Array.from(mockState.users.keys());
      expect(userIds).toEqual(["session-1", "new-session-2", "session-3"]);
    });
  });

  describe("handleLeave - reconnection", () => {
    it("should attempt reconnection for non-consented leave with userId", async () => {
      const client = createMockClient("session-1");
      const player = new Player("session-1");
      mockState.users.set("session-1", player);
      sessionManager.registerSession(1, "session-1");

      const reconnectedClient = createMockClient("session-reconnected");
      const allowReconnectSuccess = jest.fn().mockResolvedValue(reconnectedClient);

      await manager.handleLeave(
        client,
        false,
        mockState,
        dependencies(),
        playersInHand,
        mockEngine as GameEngine,
        allowReconnectSuccess,
        broadcastFn
      );

      expect(allowReconnectSuccess).toHaveBeenCalledWith(client, 60);
      expect(mockState.users.has("session-reconnected")).toBe(true);
    });

    it("should clean up if reconnection fails", async () => {
      const client = createMockClient("session-1");
      const player = new Player("session-1");
      mockState.users.set("session-1", player);
      sessionManager.registerSession(1, "session-1");

      await manager.handleLeave(
        client,
        false,
        mockState,
        dependencies(),
        playersInHand,
        mockEngine as GameEngine,
        allowReconnectionFn,
        broadcastFn
      );

      expect(mockState.users.get("session-1")).toBeUndefined();
      expect(broadcastCalls.some(c => c.type === "playerLeft")).toBe(true);
    });

    it("should skip reconnection for consented leave", async () => {
      const client = createMockClient("session-1");
      const player = new Player("session-1");
      mockState.users.set("session-1", player);
      sessionManager.registerSession(1, "session-1");

      const allowReconnectSpy = jest.fn();

      await manager.handleLeave(
        client,
        true,
        mockState,
        dependencies(),
        playersInHand,
        mockEngine as GameEngine,
        allowReconnectSpy,
        broadcastFn
      );

      expect(allowReconnectSpy).not.toHaveBeenCalled();
      expect(mockState.users.get("session-1")).toBeUndefined();
    });

    it("should skip reconnection if no userId", async () => {
      const client = createMockClient("session-1");
      const player = new Player("session-1");
      mockState.users.set("session-1", player);

      const allowReconnectSpy = jest.fn();

      await manager.handleLeave(
        client,
        false,
        mockState,
        dependencies(),
        playersInHand,
        mockEngine as GameEngine,
        allowReconnectSpy,
        broadcastFn
      );

      expect(allowReconnectSpy).not.toHaveBeenCalled();
    });
  });

  describe("handleLeaveCleanup", () => {
    it("should remove player from room state", async () => {
      const client = createMockClient("session-1");
      const player = new Player("session-1");
      mockState.users.set("session-1", player);

      await manager.handleLeave(
        client,
        true,
        mockState,
        dependencies(),
        playersInHand,
        mockEngine as GameEngine,
        allowReconnectionFn,
        broadcastFn
      );

      expect(mockState.users.get("session-1")).toBeUndefined();
    });

    it("should fold player and remove from playersInHand", async () => {
      const client = createMockClient("session-1");
      const player = new Player("session-1");
      mockState.users.set("session-1", player);
      playersInHand.push("session-1");

      await manager.handleLeave(
        client,
        true,
        mockState,
        dependencies(),
        playersInHand,
        mockEngine as GameEngine,
        allowReconnectionFn,
        broadcastFn
      );

      expect(player.isFolded).toBe(true);
      expect(playersInHand).not.toContain("session-1");
    });

    it("should broadcast playerDisconnected when player was in hand", async () => {
      const client = createMockClient("session-1");
      const player = new Player("session-1");
      player.name = "Alice";
      mockState.users.set("session-1", player);
      playersInHand.push("session-1");

      await manager.handleLeave(
        client,
        true,
        mockState,
        dependencies(),
        playersInHand,
        mockEngine as GameEngine,
        allowReconnectionFn,
        broadcastFn
      );

      expect(broadcastCalls).toContainEqual({
        type: "playerDisconnected",
        message: expect.objectContaining({
          playerId: "session-1",
          playerName: "Alice",
        }),
      });
    });

    it("should progress turn if leaving player was current turn and round is active", async () => {
      const client = createMockClient("session-1");
      const player = new Player("session-1");
      mockState.users.set("session-1", player);
      mockState.currentTurn = "session-1";
      mockState.roundStarted = true;
      playersInHand.push("session-1", "session-2");

      await manager.handleLeave(
        client,
        true,
        mockState,
        dependencies(),
        playersInHand,
        mockEngine as GameEngine,
        allowReconnectionFn,
        broadcastFn
      );

      expect(mockEngine.setCurrentPlayerIndexBeforeNextActive).toHaveBeenCalledWith(0);
      expect(mockEngine.endTurn).toHaveBeenCalled();
    });

    it("should not progress turn if leaving player was not current turn", async () => {
      const client = createMockClient("session-1");
      const player = new Player("session-1");
      mockState.users.set("session-1", player);
      mockState.currentTurn = "session-2";
      playersInHand.push("session-1", "session-2");

      await manager.handleLeave(
        client,
        true,
        mockState,
        dependencies(),
        playersInHand,
        mockEngine as GameEngine,
        allowReconnectionFn,
        broadcastFn
      );

      expect(mockEngine.setCurrentPlayerIndexBeforeNextActive).not.toHaveBeenCalled();
      expect(mockEngine.endTurn).not.toHaveBeenCalled();
    });

    it("should end round if only one player remains", async () => {
      const client = createMockClient("session-1");
      const player = new Player("session-1");
      mockState.users.set("session-1", player);
      mockState.roundStarted = true;
      playersInHand.push("session-1", "session-2");

      await manager.handleLeave(
        client,
        true,
        mockState,
        dependencies(),
        playersInHand,
        mockEngine as GameEngine,
        allowReconnectionFn,
        broadcastFn
      );

      expect(mockEngine.endRound).toHaveBeenCalledWith(["session-2"], "Gana por fold");
    });

    it("should not end round if round not started", async () => {
      const client = createMockClient("session-1");
      const player = new Player("session-1");
      mockState.users.set("session-1", player);
      mockState.roundStarted = false;
      playersInHand.push("session-1", "session-2");

      await manager.handleLeave(
        client,
        true,
        mockState,
        dependencies(),
        playersInHand,
        mockEngine as GameEngine,
        allowReconnectionFn,
        broadcastFn
      );

      expect(mockEngine.endRound).not.toHaveBeenCalled();
    });

    it("should not call endTurn when round already ended (avoids double payout on disconnect)", async () => {
      const client = createMockClient("session-1");
      const player = new Player("session-1");
      mockState.users.set("session-1", player);
      mockState.currentTurn = "session-1";
      mockState.roundStarted = false; // partida ya terminada (game over)
      playersInHand.push("session-1", "session-2");

      await manager.handleLeave(
        client,
        true,
        mockState,
        dependencies(),
        playersInHand,
        mockEngine as GameEngine,
        allowReconnectionFn,
        broadcastFn
      );

      expect(mockEngine.endTurn).not.toHaveBeenCalled();
      expect(mockEngine.endRound).not.toHaveBeenCalled();
    });

    it("should free seat when player leaves", async () => {
      const client = createMockClient("session-1");
      const player = new Player("session-1");
      player.seatIndex = 2;
      mockState.users.set("session-1", player);
      const freeSeatSpy = jest.spyOn(seatManager, "freeSeat");

      await manager.handleLeave(
        client,
        true,
        mockState,
        dependencies(),
        playersInHand,
        mockEngine as GameEngine,
        allowReconnectionFn,
        broadcastFn
      );

      expect(freeSeatSpy).toHaveBeenCalledWith(2);
      freeSeatSpy.mockRestore();
    });

    it("should clean up all managers", async () => {
      const client = createMockClient("session-1");
      const player = new Player("session-1");
      mockState.users.set("session-1", player);
      sessionManager.registerSession(1, "session-1");
      connectionMonitor.recordHeartbeat("session-1");
      analytics.recordConnection("session-1");

      await manager.handleLeave(
        client,
        true,
        mockState,
        dependencies(),
        playersInHand,
        mockEngine as GameEngine,
        allowReconnectionFn,
        broadcastFn
      );

      expect(sessionManager.getUserId("session-1")).toBeUndefined();
      expect(connectionMonitor.isMonitored("session-1")).toBe(false);
      expect(analytics.getTotalSessions()).toBe(0);
    });

    it("should broadcast playerLeft message", async () => {
      const client = createMockClient("session-1");
      const player = new Player("session-1");
      mockState.users.set("session-1", player);

      await manager.handleLeave(
        client,
        true,
        mockState,
        dependencies(),
        playersInHand,
        mockEngine as GameEngine,
        allowReconnectionFn,
        broadcastFn
      );

      expect(broadcastCalls).toContainEqual({
        type: "playerLeft",
        message: { id: "session-1" },
      });
    });
  });

  describe("getConfig", () => {
    it("should return a copy of the config", () => {
      const config1 = manager.getConfig();
      const config2 = manager.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });

    it("should not allow external modification", () => {
      const config = manager.getConfig();
      (config as any).reconnectionTimeoutSeconds = 999;

      const freshConfig = manager.getConfig();
      expect(freshConfig.reconnectionTimeoutSeconds).toBe(60);
    });
  });
});
