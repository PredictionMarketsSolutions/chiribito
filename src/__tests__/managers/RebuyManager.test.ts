/**
 * RebuyManager.test.ts
 * Tests for rebuy and seat reservation management
 */

import { RebuyManager } from "../../rooms/managers/RebuyManager";
import { SeatManager } from "../../rooms/managers/SeatManager";
import { SessionManager } from "../../rooms/managers/SessionManager";
import { MyRoomState, Player } from "../../rooms/schema/MyRoomState";
import { Client } from "@colyseus/core";

describe("RebuyManager", () => {
  let rebuyManager: RebuyManager;
  let seatManager: SeatManager;
  let sessionManager: SessionManager;
  let mockState: MyRoomState;
  let mockClient: Partial<Client>;
  let broadcastMock: jest.Mock;

  beforeEach(() => {
    rebuyManager = new RebuyManager("test-room", {
      rebuyTimeoutMs: 120000,
      rebuyAmount: 1000
    });
    seatManager = new SeatManager("test-room", 6, 120000);
    sessionManager = new SessionManager("test-room", 60);
    
    mockState = new MyRoomState();
    broadcastMock = jest.fn();

    mockClient = {
      sessionId: "session-1",
      send: jest.fn()
    };
  });

  afterEach(() => {
    // Clean up any timers from managers
    seatManager.clearAll();
    sessionManager.clearAll();
  });

  describe("constructor", () => {
    test("initializes with default config", () => {
      const manager = new RebuyManager("room-1");
      const config = manager.getConfig();
      expect(config.rebuyTimeoutMs).toBe(120000);
      expect(config.rebuyAmount).toBe(1000);
    });

    test("initializes with custom config", () => {
      const manager = new RebuyManager("room-1", {
        rebuyTimeoutMs: 60000,
        rebuyAmount: 500
      });
      const config = manager.getConfig();
      expect(config.rebuyTimeoutMs).toBe(60000);
      expect(config.rebuyAmount).toBe(500);
    });
  });

  describe("reserveSeat", () => {
    test("reserves seat and notifies client", () => {
      const userId = 123;
      const seatIndex = 2;

      rebuyManager.reserveSeat(
        mockClient as Client,
        seatIndex,
        userId,
        seatManager
      );

      expect(mockClient.send).toHaveBeenCalledWith("seatReserved", {
        seatIndex: 2,
        expiresIn: 120000
      });

      const reservation = seatManager.getReservation(seatIndex);
      expect(reservation).toBeDefined();
      expect(reservation?.userId).toBe(userId);
    });

    test("uses custom timeout from config", () => {
      const customManager = new RebuyManager("room-1", {
        rebuyTimeoutMs: 60000,
        rebuyAmount: 500
      });

      customManager.reserveSeat(
        mockClient as Client,
        1,
        456,
        seatManager
      );

      expect(mockClient.send).toHaveBeenCalledWith("seatReserved", {
        seatIndex: 1,
        expiresIn: 60000
      });
    });
  });

  describe("handleRebuy", () => {
    beforeEach(() => {
      // Setup player with no chips
      const player = new Player("session-1");
      player.name = "TestPlayer";
      player.chips = 0;
      player.seatIndex = 2;
      mockState.users.set("session-1", player);

      // Register session
      sessionManager.registerSession(100, "session-1");

      // Create seat reservation
      seatManager.reserveSeatForRebuy(2, 100);
    });

    test("successfully processes valid rebuy request", () => {
      const result = rebuyManager.handleRebuy(
        mockClient as Client,
        mockState,
        seatManager,
        sessionManager,
        broadcastMock
      );

      expect(result).toBe(true);

      const player = mockState.users.get("session-1");
      expect(player?.chips).toBe(1000);
      expect(player?.isFolded).toBe(false);

      expect(mockClient.send).toHaveBeenCalledWith("rebuySuccess", {
        chips: 1000,
        seatIndex: 2
      });

      expect(broadcastMock).toHaveBeenCalledWith("playerRebuyed", {
        playerId: "session-1",
        playerName: "TestPlayer",
        newChips: 1000,
        seatIndex: 2
      });

      // Reservation should be cleared
      expect(seatManager.getReservation(2)).toBeUndefined();
    });

    test("rejects rebuy when player not found", () => {
      const unknownClient: Partial<Client> = {
        sessionId: "unknown-session",
        send: jest.fn()
      };

      const result = rebuyManager.handleRebuy(
        unknownClient as Client,
        mockState,
        seatManager,
        sessionManager,
        broadcastMock
      );

      expect(result).toBe(false);
      expect(unknownClient.send).toHaveBeenCalledWith("error", {
        message: "Player not found"
      });
      expect(broadcastMock).not.toHaveBeenCalled();
    });

    test("rejects rebuy when player still has chips", () => {
      const player = mockState.users.get("session-1")!;
      player.chips = 500;

      const result = rebuyManager.handleRebuy(
        mockClient as Client,
        mockState,
        seatManager,
        sessionManager,
        broadcastMock
      );

      expect(result).toBe(false);
      expect(mockClient.send).toHaveBeenCalledWith("error", {
        message: "You still have chips, no rebuy needed"
      });
      expect(broadcastMock).not.toHaveBeenCalled();
    });

    test("rejects rebuy when player not seated", () => {
      const player = mockState.users.get("session-1")!;
      player.seatIndex = -1;

      const result = rebuyManager.handleRebuy(
        mockClient as Client,
        mockState,
        seatManager,
        sessionManager,
        broadcastMock
      );

      expect(result).toBe(false);
      expect(mockClient.send).toHaveBeenCalledWith("error", {
        message: "You are not seated"
      });
      expect(broadcastMock).not.toHaveBeenCalled();
    });

    test("rejects rebuy when reservation not found", () => {
      // Clear the reservation
      seatManager.clearReservation(2);

      const result = rebuyManager.handleRebuy(
        mockClient as Client,
        mockState,
        seatManager,
        sessionManager,
        broadcastMock
      );

      expect(result).toBe(false);
      expect(mockClient.send).toHaveBeenCalledWith("error", {
        message: "Seat reservation not found or expired"
      });
      expect(broadcastMock).not.toHaveBeenCalled();
    });

    test("rejects rebuy when userId mismatch", () => {
      // Create reservation for different user
      seatManager.clearReservation(2);
      seatManager.reserveSeatForRebuy(2, 999); // Different userId

      const result = rebuyManager.handleRebuy(
        mockClient as Client,
        mockState,
        seatManager,
        sessionManager,
        broadcastMock
      );

      expect(result).toBe(false);
      expect(mockClient.send).toHaveBeenCalledWith("error", {
        message: "Seat reservation not found or expired"
      });
    });

    test("rejects rebuy when userId not found in session manager", () => {
      // Remove session from session manager
      sessionManager.removeSession("session-1");

      const result = rebuyManager.handleRebuy(
        mockClient as Client,
        mockState,
        seatManager,
        sessionManager,
        broadcastMock
      );

      expect(result).toBe(false);
      expect(mockClient.send).toHaveBeenCalledWith("error", {
        message: "Seat reservation not found or expired"
      });
    });

    test("uses custom rebuy amount from config", () => {
      const customManager = new RebuyManager("room-1", {
        rebuyTimeoutMs: 60000,
        rebuyAmount: 2000
      });

      customManager.handleRebuy(
        mockClient as Client,
        mockState,
        seatManager,
        sessionManager,
        broadcastMock
      );

      const player = mockState.users.get("session-1");
      expect(player?.chips).toBe(2000);

      expect(mockClient.send).toHaveBeenCalledWith("rebuySuccess", {
        chips: 2000,
        seatIndex: 2
      });
    });
  });

  describe("getConfig", () => {
    test("returns config copy", () => {
      const config = rebuyManager.getConfig();
      expect(config.rebuyTimeoutMs).toBe(120000);
      expect(config.rebuyAmount).toBe(1000);
    });

    test("returns immutable copy", () => {
      const config = rebuyManager.getConfig();
      
      // Attempting to modify should not affect internal config
      (config as any).rebuyAmount = 5000;
      
      const newConfig = rebuyManager.getConfig();
      expect(newConfig.rebuyAmount).toBe(1000);
    });
  });

  describe("integration scenarios", () => {
    test("complete rebuy flow with multiple players", () => {
      // Setup two players
      const player1 = new Player("session-1");
      player1.chips = 0;
      player1.seatIndex = 1;
      mockState.users.set("session-1", player1);

      const player2 = new Player("session-2");
      player2.chips = 0;
      player2.seatIndex = 3;
      mockState.users.set("session-2", player2);

      sessionManager.registerSession(100, "session-1");
      sessionManager.registerSession(200, "session-2");

      // Reserve seats
      seatManager.reserveSeatForRebuy(1, 100);
      seatManager.reserveSeatForRebuy(3, 200);

      // Player 1 rebuys
      const result1 = rebuyManager.handleRebuy(
        mockClient as Client,
        mockState,
        seatManager,
        sessionManager,
        broadcastMock
      );

      expect(result1).toBe(true);
      expect(player1.chips).toBe(1000);
      expect(seatManager.getReservation(1)).toBeUndefined();

      // Player 2 rebuys
      const client2: Partial<Client> = { sessionId: "session-2", send: jest.fn() };
      const result2 = rebuyManager.handleRebuy(
        client2 as Client,
        mockState,
        seatManager,
        sessionManager,
        broadcastMock
      );

      expect(result2).toBe(true);
      expect(player2.chips).toBe(1000);
      expect(seatManager.getReservation(3)).toBeUndefined();

      expect(broadcastMock).toHaveBeenCalledTimes(2);
    });

    test("reservation expires before rebuy", () => {
      const player = new Player("session-1");
      player.chips = 0;
      player.seatIndex = 2;
      mockState.users.set("session-1", player);

      sessionManager.registerSession(100, "session-1");

      // Create and immediately clear reservation (simulating expiration)
      seatManager.reserveSeatForRebuy(2, 100);
      seatManager.clearReservation(2);

      const result = rebuyManager.handleRebuy(
        mockClient as Client,
        mockState,
        seatManager,
        sessionManager,
        broadcastMock
      );

      expect(result).toBe(false);
      expect(player.chips).toBe(0);
    });
  });
});
