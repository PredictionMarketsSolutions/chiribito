/**
 * GameEngine.flow.test.ts
 * Focused tests to increase coverage of GameEngine control flow.
 * We mock ./utils to avoid depending on full poker logic.
 */

jest.mock("../rooms/game/utils", () => {
  class GameUtils {
    getPlayersInHandNonFolded = jest.fn();
    getNextActiveIndexFrom = jest.fn();
    getActivePlayerIds = jest.fn();
    getPlayerName = jest.fn();
    addToPot = jest.fn();
  }

  class GameBroadcaster {
    broadcastPlayerAction = jest.fn();
    broadcastTurnTimer = jest.fn();
    broadcastRoundEnded = jest.fn();
    broadcastCommunityCardRevealed = jest.fn();
  }

  class RoundManager {
    resetForNewHand = jest.fn();
    dealInitialHands = jest.fn();
    resetDealerAndPhase = jest.fn();
    startBettingRound = jest.fn();
    resetBetsForRound = jest.fn();
    dealNextCommunityCard = jest.fn();
  }

  class PlayerActions {
    handleCheck = jest.fn();
    handleFold = jest.fn();
    handleFoldForTimeout = jest.fn();
  }

  class WinnerDeterminator {
    determineWinners = jest.fn();
    calculateSidePotPayouts = jest.fn();
    logRoundEnd = jest.fn();
  }

  return {
    GameUtils,
    GameBroadcaster,
    RoundManager,
    PlayerActions,
    WinnerDeterminator,
  };
});

import { GameEngine } from "../rooms/game/GameEngine";
import { MyRoomState, Player } from "../rooms/schema/MyRoomState";
import type { IGameRoom } from "../types/IGameRoom";

function makeRoom(): jest.Mocked<IGameRoom> {
  const state = new MyRoomState();
  state.roundStarted = true;
  state.phase = "preflop" as any;
  state.currentTurn = "p1";
  state.currentBet = 0;
  state.pot = 0;
  state.communityCards.clear();

  const p1 = new Player("p1");
  p1.name = "P1";
  p1.chips = 1000;
  p1.currentBet = 0;
  const p2 = new Player("p2");
  p2.name = "P2";
  p2.chips = 1000;
  p2.currentBet = 0;
  state.users.set("p1", p1);
  state.users.set("p2", p2);

  const room: any = {
    roomId: "test-room",
    state,
    clients: [],
    playersInHand: ["p1", "p2"],
    playersAllIn: new Set<string>(),
    playersActedThisRound: new Set<string>(),
    dealerIndex: 0,
    currentPlayerIndex: 0,
    turnTimeout: null,
    broadcast: jest.fn(),
    scheduleDelayed: jest.fn((cb: () => void) => cb()),
  };

  return room as jest.Mocked<IGameRoom>;
}

describe("GameEngine flow", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Date, "now").mockReturnValue(1700000000000);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("handleStartGame: blocks if round already started", () => {
    const room = makeRoom();
    room.state.roundStarted = true;
    const engine = new GameEngine(room);
    const client: any = { send: jest.fn() };

    engine.handleStartGame(client);

    expect(client.send).toHaveBeenCalledWith("error", { message: "Game already in progress" });
  });

  it("handleStartGame: errors when <2 active players", () => {
    const room = makeRoom();
    room.state.roundStarted = false;
    // Make one player bust
    room.state.users.get("p2")!.chips = 0;
    const engine = new GameEngine(room);
    const client: any = { send: jest.fn() };

    engine.handleStartGame(client);

    expect(client.send).toHaveBeenCalledWith("error", expect.objectContaining({ message: expect.any(String) }));
  });

  it("startNewHand: bails out when <2 players with chips", () => {
    const room = makeRoom();
    room.state.users.get("p2")!.chips = 0;
    const engine = new GameEngine(room);

    engine.startNewHand();

    expect(room.state.roundStarted).toBe(false);
  });

  it("proceedToNextPhase: when only one non-folded player, ends round by fold", () => {
    const room = makeRoom();
    const engine = new GameEngine(room);
    const utils: any = (engine as any).utils;
    utils.getPlayersInHandNonFolded.mockReturnValue(["p1"]);

    const endRoundSpy = jest.spyOn(engine as any, "endRound").mockImplementation(() => {});

    engine.proceedToNextPhase();

    expect(endRoundSpy).toHaveBeenCalledWith(["p1"], "Gana por fold", false);
  });

  it("proceedToNextPhase: reaches showdown when 5 community cards and not preflop", () => {
    const room = makeRoom();
    room.state.phase = "turn" as any;
    room.state.communityCards.clear();
    room.state.communityCards.push("a", "b", "c", "d", "e");
    const engine = new GameEngine(room);
    const utils: any = (engine as any).utils;
    utils.getPlayersInHandNonFolded.mockReturnValue(["p1", "p2"]);

    const endRoundWithWinnersSpy = jest.spyOn(engine as any, "endRoundWithWinners").mockImplementation(() => {});

    engine.proceedToNextPhase();

    expect(endRoundWithWinnersSpy).toHaveBeenCalled();
  });

  it("proceedToNextPhase: deals next card, fixes -1 index using activePlayerIds, then starts betting+timer", () => {
    const room = makeRoom();
    const engine = new GameEngine(room);
    const utils: any = (engine as any).utils;
    const roundManager: any = (engine as any).roundManager;

    utils.getPlayersInHandNonFolded.mockReturnValue(["p1", "p2"]);
    utils.getNextActiveIndexFrom.mockReturnValueOnce(-1).mockReturnValueOnce(0);
    utils.getActivePlayerIds.mockReturnValue(["p2"]);

    const startBettingRoundSpy = jest.spyOn(engine, "startBettingRound");
    const startTurnTimerSpy = jest.spyOn(engine, "startTurnTimer").mockImplementation(() => {});

    engine.proceedToNextPhase();

    expect(roundManager.dealNextCommunityCard).toHaveBeenCalled();
    expect(room.currentPlayerIndex).toBe(1); // p2 index
    expect(room.state.currentTurn).toBe("p2");
    expect(startBettingRoundSpy).toHaveBeenCalled();
    expect(startTurnTimerSpy).toHaveBeenCalled();
  });

  it("handleCall: when chipsToCall <= 0, delegates to handleCheck and ends turn", () => {
    const room = makeRoom();
    room.state.currentBet = 0;
    room.state.users.get("p1")!.currentBet = 0;
    room.state.currentTurn = "p1";
    const engine = new GameEngine(room);

    const playerActions: any = (engine as any).playerActions;
    const endTurnSpy = jest.spyOn(engine, "endTurn").mockImplementation(() => {});
    playerActions.handleCheck.mockImplementation((_client: any, cb: () => void) => cb());

    engine.handleCall({ sessionId: "p1" } as any);

    expect(playerActions.handleCheck).toHaveBeenCalled();
    expect(endTurnSpy).toHaveBeenCalled();
  });

  it("handleCall: broadcasts call/allIn and marks all-in when needed", () => {
    const room = makeRoom();
    room.state.currentBet = 100;
    room.state.users.get("p1")!.currentBet = 0;
    room.state.users.get("p1")!.chips = 50; // forces all-in
    room.state.currentTurn = "p1";
    const engine = new GameEngine(room);

    const broadcaster: any = (engine as any).broadcaster;
    const utils: any = (engine as any).utils;
    jest.spyOn(engine, "endTurn").mockImplementation(() => {});

    engine.handleCall({ sessionId: "p1" } as any);

    expect(utils.addToPot).toHaveBeenCalledWith(50, "p1", expect.any(Map));
    expect(broadcaster.broadcastPlayerAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: "allIn", amount: 50 })
    );
    expect(room.playersAllIn.has("p1")).toBe(true);
  });

  it("startTurnTimer: broadcasts timer and folds on timeout", () => {
    const room = makeRoom();
    room.state.currentTurn = "p1";
    const engine = new GameEngine(room);

    const broadcaster: any = (engine as any).broadcaster;
    const foldSpy = jest.spyOn(engine as any, "handleFoldForTimeout").mockImplementation(() => {});

    engine.startTurnTimer();

    expect(broadcaster.broadcastTurnTimer).toHaveBeenCalledWith(
      expect.objectContaining({ currentTurn: "p1", timeoutMs: expect.any(Number) })
    );

    jest.runOnlyPendingTimers();
    expect(foldSpy).toHaveBeenCalledWith("p1");
  });

  it("startAllInShowdownReveal: when already 5 cards, ends round with winners immediately", () => {
    const room = makeRoom();
    room.state.communityCards.clear();
    room.state.communityCards.push("a", "b", "c", "d", "e");
    const engine = new GameEngine(room);

    const endRoundWithWinnersSpy = jest.spyOn(engine as any, "endRoundWithWinners").mockImplementation(() => {});

    (engine as any).startAllInShowdownReveal();

    expect(room.state.currentTurn).toBe("");
    expect(endRoundWithWinnersSpy).toHaveBeenCalledWith(true);
  });

  it("startAllInShowdownReveal: reveals cards and schedules winner at the end", () => {
    const room = makeRoom();
    // Start with 4 cards so we reveal one and then end.
    room.state.communityCards.clear();
    room.state.communityCards.push("a", "b", "c", "d");
    const engine = new GameEngine(room);

    const roundManager: any = (engine as any).roundManager;
    const broadcaster: any = (engine as any).broadcaster;
    const endRoundWithWinnersSpy = jest.spyOn(engine as any, "endRoundWithWinners").mockImplementation(() => {});

    roundManager.dealNextCommunityCard.mockImplementation(() => {
      room.state.communityCards.push("e");
    });

    (engine as any).startAllInShowdownReveal();

    // First scheduleDelayed triggers revealNext
    expect(room.scheduleDelayed).toHaveBeenCalled();
    expect(roundManager.dealNextCommunityCard).toHaveBeenCalled();
    expect(broadcaster.broadcastCommunityCardRevealed).toHaveBeenCalledWith(
      expect.objectContaining({ index: 4, card: "e" })
    );
    // At 5 cards, it schedules endRoundWithWinners(true)
    expect(endRoundWithWinnersSpy).toHaveBeenCalledWith(true);
  });
});

