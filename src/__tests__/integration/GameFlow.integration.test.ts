/**
 * GameFlow.test.ts
 * Tests for game flow validation - verifies bug fixes for startGame and game end detection
 * These tests validate the behavior through the GameEngine and room state
 */

import { StateView } from "@colyseus/schema";
import { GameEngine } from "../../rooms/game/GameEngine";
import { MyRoomState, Player, PLAYER_STATUS } from "../../rooms/schema/MyRoomState";
import { GameBroadcaster } from "../../rooms/game/utils/GameBroadcaster";
import { Room, Client } from "@colyseus/core";

describe("GameFlow Bug Fixes", () => {
  let roomState: MyRoomState;
  let engine: GameEngine;
  let mockRoom: any;
  let broadcaster: GameBroadcaster;

  beforeEach(() => {
    // Setup mock room with all required properties
    mockRoom = {
      state: new MyRoomState(),
      broadcast: jest.fn(),
      clients: [],
      playersInHand: [],
      playersActedThisRound: new Set<string>(),
      playersAllIn: new Set<string>(),
      turnTimeout: null,
      dealerIndex: 0,
      currentPlayerIndex: 0,
      scheduleDelayed: jest.fn((cb: () => void) => cb()),
      onPlayerBusted: jest.fn(),
      notifyTournamentEnd: jest.fn(),
      sessionManager: {
        getUserId: jest.fn(),
        getSessionId: jest.fn(),
      },
      lifecycleManager: {
        handlePlayerBusted: jest.fn(),
      },
    };

    roomState = mockRoom.state;
    broadcaster = new GameBroadcaster(mockRoom);

    // Keep broadcaster reference
    (mockRoom as any).broadcaster = broadcaster;

    // Initialize room state with some players
    const player1 = new Player("player-1");
    player1.chips = 1000;
    player1.name = "Player 1";

    const player2 = new Player("player-2");
    player2.chips = 1000;
    player2.name = "Player 2";

    roomState.users.set("player-1", player1);
    roomState.users.set("player-2", player2);

    // Create GameEngine with mock room
    engine = new GameEngine(mockRoom);
  });

  afterEach(() => {
    // Clean up any timers or async operations
    if (mockRoom.turnTimeout) {
      clearTimeout(mockRoom.turnTimeout);
      mockRoom.turnTimeout = null;
    }
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  describe("Bug Fix #1: startGame double-click prevention", () => {
    it("should set roundStarted to true immediately in handleStartGame", () => {
      // Verify initial state
      expect(roomState.roundStarted).toBe(false);

      // Call handleStartGame with a client
      const mockClient = { send: jest.fn() } as any;

      engine.handleStartGame(mockClient);

      // Verify: roundStarted should be set to true
      expect(roomState.roundStarted).toBe(true);
    });

    it("should block second startGame call when roundStarted is already true", () => {
      const mockClient = { send: jest.fn() } as any;

      // First call should succeed
      engine.handleStartGame(mockClient);
      expect(roomState.roundStarted).toBe(true);

      // Reset mock to check second call
      mockClient.send.mockClear();

      // Second call should fail and send error
      engine.handleStartGame(mockClient);

      // Verify: client.send should have been called with error
      expect(mockClient.send).toHaveBeenCalledWith(
        "error",
        expect.objectContaining({
          message: expect.stringContaining("already in progress"),
        })
      );
    });

    it("should check roundStarted flag BEFORE validating active players", () => {
      // Set roundStarted to true first
      roomState.roundStarted = true;

      // Remove all players (would fail validation if checked)
      roomState.users.clear();

      const mockClient = { send: jest.fn() } as any;

      // Call should still check roundStarted first and reject
      engine.handleStartGame(mockClient);

      // Should get "already in progress" error, not "need 2 players" error
      expect(mockClient.send).toHaveBeenCalledWith(
        "error",
        expect.objectContaining({
          message: expect.stringContaining("already in progress"),
        })
      );
    });
  });

  describe("Bug Fix #2: game end detection when only 1 player remains", () => {
    it("should have checkGameEnd method that detects 1 remaining player", () => {
      // Verify method exists
      expect(engine["checkGameEnd"]).toBeDefined();
      expect(typeof engine["checkGameEnd"]).toBe("function");
    });

    it("should call checkGameEnd during endRound after payouts", () => {
      // Spy on checkGameEnd
      const checkGameEndSpy = jest.spyOn(engine as any, "checkGameEnd");

      // Call endRound
      engine.endRound(["player-1"], null, false);

      // Verify checkGameEnd was called
      expect(checkGameEndSpy).toHaveBeenCalled();

      checkGameEndSpy.mockRestore();
    });

    it("should broadcast gameEnded when only 1 player has chips > 0", () => {
      // Set one player's chips to 0
      const player2 = roomState.users.get("player-2") as Player;
      player2.chips = 0;

      // Call checkGameEnd manually
      engine["checkGameEnd"]();

      // Verify: broadcaster.broadcastGameEnded was called
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        "gameEnded",
        expect.objectContaining({
          champion: expect.objectContaining({
            sessionId: "player-1",
            chips: 1000,
          }),
        })
      );
      // Tournament mode: notifyTournamentEnd called with champion so room can send gameResult and close
      expect(mockRoom.notifyTournamentEnd).toHaveBeenCalledWith({
        sessionId: "player-1",
        name: "Player 1",
        chips: 1000,
      });
    });

    it("should NOT broadcast gameEnded when multiple players have chips > 0", () => {
      // Both players have chips
      const player1 = roomState.users.get("player-1") as Player;
      const player2 = roomState.users.get("player-2") as Player;
      player1.chips = 1000;
      player2.chips = 500;

      // Clear broadcast mock
      mockRoom.broadcast.mockClear();

      // Call checkGameEnd
      engine["checkGameEnd"]();

      // Verify: gameEnded should NOT be broadcast
      const gameEndedCalls = mockRoom.broadcast.mock.calls.filter(
        (call: any[]) => call[0] === "gameEnded"
      );
      expect(gameEndedCalls.length).toBe(0);
    });

    it("tryGameEnd broadcasts gameEnded when 1 player left", () => {
      const player2 = roomState.users.get("player-2") as Player;
      player2.chips = 0;

      engine.tryGameEnd();

      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        "gameEnded",
        expect.objectContaining({
          champion: expect.objectContaining({ sessionId: "player-1" }),
        })
      );
      expect(mockRoom.notifyTournamentEnd).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "player-1", name: "Player 1", chips: 1000 })
      );
    });

    it("does not call notifyTournamentEnd when multiple players have chips", () => {
      mockRoom.notifyTournamentEnd.mockClear();
      engine["checkGameEnd"]();
      expect(mockRoom.notifyTournamentEnd).not.toHaveBeenCalled();
    });

    it("should prevent startGame when less than 2 active players", () => {
      // Set only 1 player with chips
      const player2 = roomState.users.get("player-2") as Player;
      player2.chips = 0;

      const mockClient = { send: jest.fn() } as any;

      // Try to start game
      engine.handleStartGame(mockClient);

      // Should get error about needing 2 players
      expect(mockClient.send).toHaveBeenCalledWith(
        "error",
        expect.objectContaining({
          message: expect.stringMatching(
            /al menos.*jugador|at least.*player/i
          ),
        })
      );
    });
  });

  describe("roundStarted state consistency", () => {
    it("should initialize roundStarted as false", () => {
      expect(roomState.roundStarted).toBe(false);
    });

    it("should set roundStarted to true after startNewHand call", () => {
      const mockClient = { send: jest.fn() } as any;
      engine.handleStartGame(mockClient);

      expect(roomState.roundStarted).toBe(true);
    });

    it("should keep roundStarted true after endRound when 2+ players have chips (auto-start next hand)", () => {
      const mockClient = { send: jest.fn() } as any;

      // Start game (both players have chips)
      engine.handleStartGame(mockClient);
      expect(roomState.roundStarted).toBe(true);

      // End round with one winner; both still have chips → auto-start next hand
      engine.endRound(["player-1"], null, false);

      expect(roomState.roundStarted).toBe(true);
    });

    it("should set roundStarted to false after endRound when only 1 player has chips (game over)", () => {
      const mockClient = { send: jest.fn() } as any;

      engine.handleStartGame(mockClient);
      expect(roomState.roundStarted).toBe(true);

      // One player busted (0 chips)
      const player2 = roomState.users.get("player-2") as Player;
      player2.chips = 0;

      engine.endRound(["player-1"], null, false);

      expect(roomState.roundStarted).toBe(false);
    });

    it("should not start a hand when only one player has chips (startNewHand guard)", () => {
      const player2 = roomState.users.get("player-2") as Player;
      player2.chips = 0;

      roomState.roundStarted = true;
      engine.startNewHand();

      expect(roomState.roundStarted).toBe(false);
      expect(mockRoom.playersInHand.length).toBe(0);
    });

    it("should keep gameEndBroadcasted true when startNewHand bails out (<2 players)", () => {
      const player2 = roomState.users.get("player-2") as Player;
      player2.chips = 0;

      (engine as any).gameEndBroadcasted = true;
      roomState.roundStarted = true;

      engine.startNewHand();

      expect((engine as any).gameEndBroadcasted).toBe(true);
      expect(roomState.roundStarted).toBe(false);
    });
  });

  // Rebuy: onPlayerBusted callback tests removed (feature no longer exists).

  describe("playerStatus (server-only transitions)", () => {
    it("sets playerStatus to in_hand when hand starts (dealInitialHands)", () => {
      const mockClient = { send: jest.fn() } as any;
      engine.handleStartGame(mockClient);

      const p1 = roomState.users.get("player-1") as Player;
      const p2 = roomState.users.get("player-2") as Player;
      expect(p1.playerStatus).toBe(PLAYER_STATUS.IN_HAND);
      expect(p2.playerStatus).toBe(PLAYER_STATUS.IN_HAND);
    });

    it("sets playerStatus to seated for all players after endRound when next hand does not start", () => {
      const mockClient = { send: jest.fn() } as any;
      engine.handleStartGame(mockClient);
      const p1 = roomState.users.get("player-1") as Player;
      const p2 = roomState.users.get("player-2") as Player;
      expect(p1.playerStatus).toBe(PLAYER_STATUS.IN_HAND);
      expect(p2.playerStatus).toBe(PLAYER_STATUS.IN_HAND);

      p2.chips = 0; // only 1 player with chips → no auto startNewHand after endRound
      engine.endRound(["player-1"], "High Card", false);

      expect(p1.playerStatus).toBe(PLAYER_STATUS.SEATED);
      expect(p2.playerStatus).toBe(PLAYER_STATUS.SEATED);
    });

    it("sets playerStatus to seated after endRound even when one player has 0 chips (bust)", () => {
      const player2 = roomState.users.get("player-2") as Player;
      player2.chips = 0;
      player2.seatIndex = 1;

      engine.endRound(["player-1"], "High Card", false);

      expect((roomState.users.get("player-1") as Player).playerStatus).toBe(PLAYER_STATUS.SEATED);
      expect(player2.playerStatus).toBe(PLAYER_STATUS.SEATED);
    });
  });

  // Rebuy: tryResumeAfterRebuy tests removed (feature no longer exists).

  describe("all-in showdown: one with chips, rest all-in — show showdown (no check each street)", () => {
    beforeEach(() => {
      mockRoom.broadcast.mockClear();
      mockRoom.scheduleDelayed.mockClear?.();
    });

    it("when one player has chips and rest are all-in, goes to all-in showdown (reveal cards, no turn)", () => {
      mockRoom.playersInHand = ["player-1", "player-2"];
      mockRoom.playersAllIn = new Set(["player-1"]);
      mockRoom.dealerIndex = 0;
      roomState.phase = "preflop";
      roomState.communityCards.clear();
      roomState.currentBet = 0;
      mockRoom.playersActedThisRound.clear();

      const p1 = roomState.users.get("player-1") as Player;
      const p2 = roomState.users.get("player-2") as Player;
      p1.chips = 0;
      p2.chips = 1000;
      p1.isFolded = false;
      p2.isFolded = false;

      (engine as any).proceedToNextPhase();

      expect(mockRoom.scheduleDelayed).toHaveBeenCalled();
      expect(roomState.currentTurn).toBe("");
    });

    it("when one has chips and rest all-in (wrongly in playersAllIn), still goes to showdown", () => {
      mockRoom.playersInHand = ["player-1", "player-2"];
      mockRoom.playersAllIn = new Set(["player-1", "player-2"]);
      roomState.phase = "card1";
      roomState.communityCards.clear();
      roomState.communityCards.push("1O", "7C", "8E");
      mockRoom.playersActedThisRound.clear();

      const p1 = roomState.users.get("player-1") as Player;
      const p2 = roomState.users.get("player-2") as Player;
      p1.chips = 0;
      p2.chips = 500;
      p1.isFolded = false;
      p2.isFolded = false;

      (engine as any).proceedToNextPhase();

      expect(mockRoom.scheduleDelayed).toHaveBeenCalled();
      expect(roomState.currentTurn).toBe("");
    });

    it("three players: two all-in, one with chips — goes to showdown (no turn for chip holder)", () => {
      const p3 = new Player("player-3");
      p3.chips = 800;
      p3.isFolded = false;
      p3.currentBet = 0;
      roomState.users.set("player-3", p3);

      mockRoom.playersInHand = ["player-1", "player-2", "player-3"];
      mockRoom.playersAllIn = new Set(["player-1", "player-2"]);
      mockRoom.dealerIndex = 0;
      roomState.phase = "preflop";
      roomState.communityCards.clear();
      mockRoom.playersActedThisRound.clear();

      const p1 = roomState.users.get("player-1") as Player;
      const p2 = roomState.users.get("player-2") as Player;
      p1.chips = 0;
      p2.chips = 0;
      p1.isFolded = false;
      p2.isFolded = false;

      (engine as any).proceedToNextPhase();

      expect(mockRoom.scheduleDelayed).toHaveBeenCalled();
      expect(roomState.currentTurn).toBe("");
    });

    it("when two or more have chips, normal betting — turn is assigned, no auto-showdown", () => {
      mockRoom.playersInHand = ["player-1", "player-2"];
      mockRoom.playersAllIn = new Set([]);
      mockRoom.dealerIndex = 0;
      roomState.phase = "preflop";
      roomState.communityCards.clear();
      roomState.currentBet = 0;
      mockRoom.playersActedThisRound.clear();

      const p1 = roomState.users.get("player-1") as Player;
      const p2 = roomState.users.get("player-2") as Player;
      p1.chips = 500;
      p2.chips = 500;
      p1.isFolded = false;
      p2.isFolded = false;

      (engine as any).proceedToNextPhase();

      expect(mockRoom.scheduleDelayed).not.toHaveBeenCalled();
      expect(roomState.currentTurn).not.toBe("");
      expect(roomState.communityCards.length).toBe(1);
    });
  });

  describe("all-in showdown card reveal", () => {
    it("reveals community cards progressively and only then broadcasts roundEnded (winner at end)", () => {
      mockRoom.playersInHand = ["player-1", "player-2"];
      mockRoom.playersAllIn = new Set(["player-1", "player-2"]);
      roomState.communityCards.clear();
      roomState.phase = "flop";
      roomState.pot = 500;
      const p1 = roomState.users.get("player-1") as Player;
      const p2 = roomState.users.get("player-2") as Player;
      p1.currentBet = 250;
      p2.currentBet = 250;
      p1.chips = 0;
      p2.chips = 0;

      (engine as any).proceedToNextPhase();

      expect(mockRoom.scheduleDelayed).toHaveBeenCalled();
      const roundEndedCalls = (mockRoom.broadcast as jest.Mock).mock.calls.filter(
        (call: unknown[]) => call[0] === "roundEnded"
      );
      const communityRevealCalls = (mockRoom.broadcast as jest.Mock).mock.calls.filter(
        (call: unknown[]) => call[0] === "communityCardRevealed"
      );
      expect(communityRevealCalls.length).toBe(5);
      expect(roundEndedCalls.length).toBe(1);
      expect(roundEndedCalls[0][1].isAllInShowdown).toBe(true);
    });

    it("roundEnded payload includes winningHand, playerHands and winners for client winner display", () => {
      mockRoom.playersInHand = ["player-1", "player-2"];
      mockRoom.playersAllIn = new Set(["player-1", "player-2"]);
      roomState.communityCards.clear();
      roomState.phase = "flop";
      roomState.pot = 500;
      const p1 = roomState.users.get("player-1") as Player;
      const p2 = roomState.users.get("player-2") as Player;
      p1.currentBet = 250;
      p2.currentBet = 250;
      p1.chips = 0;
      p2.chips = 0;
      p1.hand.push("1O", "1E");
      p2.hand.push("2C", "2O");

      (engine as any).proceedToNextPhase();

      const roundEndedCalls = (mockRoom.broadcast as jest.Mock).mock.calls.filter(
        (call: unknown[]) => call[0] === "roundEnded"
      );
      expect(roundEndedCalls.length).toBe(1);
      const payload = roundEndedCalls[0][1];
      expect(payload).toHaveProperty("winningHand");
      expect(typeof payload.winningHand).toBe("string");
      expect(payload).toHaveProperty("playerHands");
      expect(typeof payload.playerHands).toBe("object");
      expect(payload.playerHands).toHaveProperty("player-1");
      expect(payload.playerHands).toHaveProperty("player-2");
      expect(Array.isArray(payload.playerHands["player-1"])).toBe(true);
      expect(Array.isArray(payload.playerHands["player-2"])).toBe(true);
      expect(payload.playerHands["player-1"]).toEqual(["1O", "1E"]);
      expect(payload.playerHands["player-2"]).toEqual(["2C", "2O"]);
      expect(payload).toHaveProperty("communityCards");
      expect(Array.isArray(payload.communityCards)).toBe(true);
      expect(payload.communityCards.length).toBe(5);
      expect(payload).toHaveProperty("winners");
      expect(Array.isArray(payload.winners)).toBe(true);
      payload.winners.forEach((w: { playerId: string; amount: number }) => {
        expect(typeof w.playerId).toBe("string");
        expect(typeof w.amount).toBe("number");
      });
    });
  });

  describe("roundEnded payload (winner display UI)", () => {
    it("endRound broadcast always sends winningHand and playerHands for every user", () => {
      roomState.phase = "river";
      roomState.pot = 300;
      roomState.communityCards.push("1O", "7C", "8E", "9C", "10O");
      const p1 = roomState.users.get("player-1") as Player;
      const p2 = roomState.users.get("player-2") as Player;
      p1.hand.push("1C", "1E");
      p2.hand.push("2C", "2E");
      p1.isFolded = false;
      p2.isFolded = false;
      mockRoom.playersInHand = ["player-1", "player-2"];

      (engine as any).endRoundWithWinners(false);

      const roundEndedCalls = (mockRoom.broadcast as jest.Mock).mock.calls.filter(
        (call: unknown[]) => call[0] === "roundEnded"
      );
      expect(roundEndedCalls.length).toBe(1);
      const payload = roundEndedCalls[0][1];
      expect(payload.winningHand).toBeDefined();
      expect(typeof payload.winningHand).toBe("string");
      expect(payload.playerHands).toBeDefined();
      expect(Object.keys(payload.playerHands)).toContain("player-1");
      expect(Object.keys(payload.playerHands)).toContain("player-2");
      expect(payload.playerHands["player-1"]).toEqual(["1C", "1E"]);
      expect(payload.playerHands["player-2"]).toEqual(["2C", "2E"]);
      expect(Array.isArray(payload.winners)).toBe(true);
      expect(Array.isArray(payload.communityCards)).toBe(true);
      expect(payload.communityCards.length).toBe(5);
    });
  });

  describe("StateView (per-client hand visibility)", () => {
    it("StateView.add(player) allows client to see own hand only when player is in state", () => {
      const state = new MyRoomState();
      const player = new Player("session-1");
      player.hand.push("1O", "7C");
      state.users.set("session-1", player);
      const view = new StateView();
      view.add(player);
      expect(view.has(player)).toBe(true);
      const otherPlayer = new Player("session-2");
      state.users.set("session-2", otherPlayer);
      expect(view.has(otherPlayer)).toBe(false);
    });
  });
});

