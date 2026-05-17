/**
 * ChiribitoRoom.onCreate.test.ts
 * Tests for onCreate (setState, metadata, managers, message handlers),
 * heartbeat handler, and isActionAllowed via message handlers.
 */

const messageHandlers: Record<string, (...args: any[]) => void> = {};
const mockRoomMessage = jest.fn((type: string, handler: (...args: any[]) => void) => {
  messageHandlers[type] = handler;
});

let connectionMonitorTimeoutCallback: ((sessionId: string) => void) | null = null;

jest.mock("@colyseus/core", () => ({
  Room: class MockRoom {
    onMessage = mockRoomMessage;
  },
  Client: class {},
  CloseCode: { CONSENTED: 4000 },
}));

const mockHandleStartGame = jest.fn();
const mockHandleBet = jest.fn();
const mockHandleCall = jest.fn();
const mockHandleCheck = jest.fn();
const mockHandleFold = jest.fn();
const mockHandleAllIn = jest.fn();
const mockHandleRaise = jest.fn();

jest.mock("../../rooms/game/GameEngine", () => ({
  GameEngine: jest.fn().mockImplementation(() => ({
    handleStartGame: mockHandleStartGame,
    handleBet: mockHandleBet,
    handleCall: mockHandleCall,
    handleCheck: mockHandleCheck,
    handleFold: mockHandleFold,
    handleAllIn: mockHandleAllIn,
    handleRaise: mockHandleRaise,
    tryGameEnd: jest.fn(),
  })),
}));

const mockConnectionMonitor = {
  start: jest.fn(),
  clearAll: jest.fn(),
  recordHeartbeat: jest.fn(),
};
jest.mock("../../rooms/managers", () => ({
  SessionManager: jest.fn().mockImplementation(() => ({ getUserId: jest.fn(), clearAll: jest.fn() })),
  ConnectionMonitor: jest.fn().mockImplementation((_roomId: string, _config: unknown, onTimeout: (sessionId: string) => void) => {
    connectionMonitorTimeoutCallback = onTimeout;
    return mockConnectionMonitor;
  }),
  SeatManager: jest.fn().mockImplementation(() => ({ getNextAvailableSeat: jest.fn(), clearAll: jest.fn(), occupySeat: jest.fn(), freeSeat: jest.fn() })),
  RateLimiterService: jest.fn().mockImplementation(() => ({
    isActionAllowed: jest.fn().mockReturnValue(true),
    recordAction: jest.fn(),
    clearAll: jest.fn(),
  })),
  AnalyticsService: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    recordMessageReceived: jest.fn(),
    logSummary: jest.fn(),
    clearAll: jest.fn(),
  })),
  AuthenticationService: jest.fn().mockImplementation(() => ({
    requestJoin: jest.fn().mockResolvedValue(true),
    authenticate: jest.fn(),
  })),
  PlayerLifecycleManager: jest.fn().mockImplementation(() => ({
    handleJoin: jest.fn(),
    handleLeave: jest.fn(),
  })),
}));

import { ChiribitoRoom } from "../../rooms/ChiribitoRoom";
import { MesaState } from "../../rooms/schema/MesaState";

describe("ChiribitoRoom onCreate and message handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(messageHandlers).forEach((k) => delete messageHandlers[k]);
    connectionMonitorTimeoutCallback = null;
  });

  describe("ChiribitoRoom instance", () => {
    it("initializes class fields when instantiated", () => {
      const room = new ChiribitoRoom();
      expect(room.maxClients).toBe(6);
      expect((room as any).reconnectionTimeoutSeconds).toBe(60);
      expect(room.turnTimeout).toBe(null);
      expect(room.dealerIndex).toBe(0);
      expect(room.currentPlayerIndex).toBe(0);
      expect(room.playersInHand).toEqual([]);
    });
  });

  describe("onCreate", () => {
    it("sets state, autoDispose false, metadata with default name when options empty", () => {
      const setState = jest.fn();
      const setMetadata = jest.fn();
      const fakeRoom: any = {
        setState,
        setMetadata,
        onMessage: mockRoomMessage,
        roomId: "abc12",
        autoDispose: true,
        reconnectionTimeoutSeconds: 60,
        maxClients: 6,
        clock: { setTimeout: jest.fn() },
        clients: [],
      };

      ChiribitoRoom.prototype.onCreate.call(fakeRoom, {});

      expect(setState).toHaveBeenCalledTimes(1);
      expect(setState.mock.calls[0][0]).toBeInstanceOf(MesaState);
      expect(fakeRoom.autoDispose).toBe(false);
      expect(setMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Mesa abc12",
          createdAt: expect.any(Number),
        })
      );
    });

    it("sets metadata name from options.tableName trimmed and sliced to 32", () => {
      const setState = jest.fn();
      const setMetadata = jest.fn();
      const fakeRoom: any = {
        setState,
        setMetadata,
        onMessage: mockRoomMessage,
        roomId: "xyz",
        autoDispose: true,
        reconnectionTimeoutSeconds: 60,
        maxClients: 6,
        clock: { setTimeout: jest.fn() },
        clients: [],
      };

      ChiribitoRoom.prototype.onCreate.call(fakeRoom, { tableName: "  Mi Mesa Larga  " });

      expect(setMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Mi Mesa Larga",
          createdAt: expect.any(Number),
        })
      );
    });

    it("registers message handlers for startGame, bet, call, check, fold, allIn, raise, heartbeat", () => {
      const fakeRoom: any = {
        setState: jest.fn(),
        setMetadata: jest.fn(),
        onMessage: mockRoomMessage,
        roomId: "r1",
        autoDispose: true,
        reconnectionTimeoutSeconds: 60,
        maxClients: 6,
        clock: { setTimeout: jest.fn() },
        clients: [],
      };

      ChiribitoRoom.prototype.onCreate.call(fakeRoom, {});

      expect(messageHandlers["startGame"]).toBeDefined();
      expect(messageHandlers["bet"]).toBeDefined();
      expect(messageHandlers["call"]).toBeDefined();
      expect(messageHandlers["check"]).toBeDefined();
      expect(messageHandlers["fold"]).toBeDefined();
      expect(messageHandlers["allIn"]).toBeDefined();
      expect(messageHandlers["raise"]).toBeDefined();
      expect(messageHandlers["heartbeat"]).toBeDefined();
    });
  });

  describe("heartbeat handler", () => {
    it("records heartbeat, records message in analytics, sends heartbeat_ack", () => {
      const fakeRoom: any = {
        state: new MesaState(),
        setState: jest.fn((s: MesaState) => {
          fakeRoom.state = s;
        }),
        setMetadata: jest.fn(),
        onMessage: mockRoomMessage,
        roomId: "r1",
        autoDispose: true,
        reconnectionTimeoutSeconds: 60,
        maxClients: 6,
        clock: { setTimeout: jest.fn() },
        clients: [],
      };
      ChiribitoRoom.prototype.onCreate.call(fakeRoom, {});

      const client = { sessionId: "s1", send: jest.fn() };
      messageHandlers["heartbeat"]!.call(fakeRoom, client);

      expect(mockConnectionMonitor.recordHeartbeat).toHaveBeenCalledWith("s1", undefined);
      expect(fakeRoom.analytics.recordMessageReceived).toHaveBeenCalledWith("s1");
      expect(client.send).toHaveBeenCalledWith("heartbeat_ack");
    });
  });

  describe("connectionMonitor timeout callback", () => {
    it("disconnects the client when HEARTBEAT_DISCONNECT_ENABLED is on (default)", () => {
      const fakeRoom: any = {
        setState: jest.fn(),
        setMetadata: jest.fn(),
        onMessage: mockRoomMessage,
        roomId: "r1",
        autoDispose: true,
        reconnectionTimeoutSeconds: 60,
        maxClients: 6,
        clock: { setTimeout: jest.fn() },
        clients: [],
      };
      ChiribitoRoom.prototype.onCreate.call(fakeRoom, {});

      expect(connectionMonitorTimeoutCallback).not.toBeNull();
      const leave = jest.fn();
      const client = { sessionId: "s1", leave };
      fakeRoom.clients = [client];

      connectionMonitorTimeoutCallback!("s1");

      // HEARTBEAT_DISCONNECT_ENABLED defaults to true → client.leave fires.
      expect(leave).toHaveBeenCalledWith(4000, "Heartbeat timeout");
    });

    it("does not throw when client not found for sessionId", () => {
      const fakeRoom: any = {
        setState: jest.fn(),
        setMetadata: jest.fn(),
        onMessage: mockRoomMessage,
        roomId: "r1",
        autoDispose: true,
        reconnectionTimeoutSeconds: 60,
        maxClients: 6,
        clock: { setTimeout: jest.fn() },
        clients: [{ sessionId: "other" }],
      };
      ChiribitoRoom.prototype.onCreate.call(fakeRoom, {});

      expect(() => connectionMonitorTimeoutCallback!("missing-session")).not.toThrow();
    });
  });

  describe("isActionAllowed via message handlers", () => {
    function bindRoomContext(fakeRoom: any) {
      fakeRoom.isActionAllowed = (ChiribitoRoom.prototype as any).isActionAllowed.bind(fakeRoom);
    }
    function invokeHandler(type: string, ...args: any[]) {
      const handler = messageHandlers[type];
      if (!handler) throw new Error(`No handler for ${type}`);
      return (room: any) => handler.apply(room, args);
    }

    it("blocks bet when round not started (does not call engine.handleBet)", () => {
      const fakeRoom: any = {
        setState: jest.fn(),
        setMetadata: jest.fn(),
        onMessage: mockRoomMessage,
        roomId: "r1",
        autoDispose: true,
        reconnectionTimeoutSeconds: 60,
        maxClients: 6,
        clock: { setTimeout: jest.fn() },
        clients: [],
      };
      ChiribitoRoom.prototype.onCreate.call(fakeRoom, {});
      fakeRoom.state = { roundStarted: false };
      fakeRoom.rateLimiter = { isActionAllowed: jest.fn().mockReturnValue(true), recordAction: jest.fn() };
      bindRoomContext(fakeRoom);

      const client = { sessionId: "s1" };
      invokeHandler("bet", client, 100)(fakeRoom);

      expect(mockHandleBet).not.toHaveBeenCalled();
    });

    it("allows startGame when round not started (gameSetupActions)", () => {
      const fakeRoom: any = {
        setState: jest.fn(),
        setMetadata: jest.fn(),
        onMessage: mockRoomMessage,
        roomId: "r1",
        autoDispose: true,
        reconnectionTimeoutSeconds: 60,
        maxClients: 6,
        clock: { setTimeout: jest.fn() },
        clients: [],
      };
      ChiribitoRoom.prototype.onCreate.call(fakeRoom, {});
      fakeRoom.state = { roundStarted: false };
      fakeRoom.rateLimiter = { isActionAllowed: jest.fn().mockReturnValue(true), recordAction: jest.fn() };
      bindRoomContext(fakeRoom);

      const client = { sessionId: "s1" };
      invokeHandler("startGame", client)(fakeRoom);

      expect(mockHandleStartGame).toHaveBeenCalledWith(client);
    });

    it("blocks action when rateLimiter.isActionAllowed returns false", () => {
      const fakeRoom: any = {
        setState: jest.fn(),
        setMetadata: jest.fn(),
        onMessage: mockRoomMessage,
        roomId: "r1",
        autoDispose: true,
        reconnectionTimeoutSeconds: 60,
        maxClients: 6,
        clock: { setTimeout: jest.fn() },
        clients: [],
      };
      ChiribitoRoom.prototype.onCreate.call(fakeRoom, {});
      fakeRoom.state = { roundStarted: true };
      fakeRoom.rateLimiter = { isActionAllowed: jest.fn().mockReturnValue(false), recordAction: jest.fn() };
      bindRoomContext(fakeRoom);

      const client = { sessionId: "s1" };
      invokeHandler("call", client)(fakeRoom);

      expect(mockHandleCall).not.toHaveBeenCalled();
      expect(fakeRoom.rateLimiter.recordAction).not.toHaveBeenCalled();
    });

    it("allows bet when round started and rate limit ok, calls recordAction and engine.handleBet", () => {
      const recordAction = jest.fn();
      const fakeRoom: any = {
        setState: jest.fn(),
        setMetadata: jest.fn(),
        onMessage: mockRoomMessage,
        roomId: "r1",
        autoDispose: true,
        reconnectionTimeoutSeconds: 60,
        maxClients: 6,
        clock: { setTimeout: jest.fn() },
        clients: [],
      };
      ChiribitoRoom.prototype.onCreate.call(fakeRoom, {});
      fakeRoom.state = { roundStarted: true };
      fakeRoom.rateLimiter = { isActionAllowed: jest.fn().mockReturnValue(true), recordAction };
      bindRoomContext(fakeRoom);

      const client = { sessionId: "s1" };
      invokeHandler("bet", client, 50)(fakeRoom);

      expect(recordAction).toHaveBeenCalledWith("s1", "bet");
      expect(mockHandleBet).toHaveBeenCalledWith(client, 50);
    });

    it("invokes handleCall, handleCheck, handleFold, handleAllIn, handleRaise when allowed", () => {
      const fakeRoom: any = {
        setState: jest.fn(),
        setMetadata: jest.fn(),
        onMessage: mockRoomMessage,
        roomId: "r1",
        autoDispose: true,
        reconnectionTimeoutSeconds: 60,
        maxClients: 6,
        clock: { setTimeout: jest.fn() },
        clients: [],
      };
      ChiribitoRoom.prototype.onCreate.call(fakeRoom, {});
      fakeRoom.state = { roundStarted: true };
      fakeRoom.rateLimiter = { isActionAllowed: jest.fn().mockReturnValue(true), recordAction: jest.fn() };
      bindRoomContext(fakeRoom);

      const client = { sessionId: "s1" };

      invokeHandler("call", client)(fakeRoom);
      expect(mockHandleCall).toHaveBeenCalledWith(client);

      invokeHandler("check", client)(fakeRoom);
      expect(mockHandleCheck).toHaveBeenCalledWith(client);

      invokeHandler("fold", client)(fakeRoom);
      expect(mockHandleFold).toHaveBeenCalledWith(client);

      invokeHandler("allIn", client)(fakeRoom);
      expect(mockHandleAllIn).toHaveBeenCalledWith(client);

      invokeHandler("raise", client, 200)(fakeRoom);
      expect(mockHandleRaise).toHaveBeenCalledWith(client, 200);
    });
  });
});
