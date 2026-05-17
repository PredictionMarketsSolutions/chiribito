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
    setCurrentPlayerIndexBeforeNextActive = jest.fn();
  }

  class GameBroadcaster {
    broadcastPlayerAction = jest.fn();
    broadcastTurnTimer = jest.fn();
    broadcastRoundEnded = jest.fn();
    broadcastCommunityCardRevealed = jest.fn();
    broadcastGameEnded = jest.fn();
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
import { MesaState, Player } from "../rooms/schema/MesaState";
import type { IGameRoom } from "../types/IGameRoom";

function makeRoom(): jest.Mocked<IGameRoom> {
  const state = new MesaState();
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

  it("handleStartGame: starts when 2+ players and round not started", () => {
    const room = makeRoom();
    room.state.roundStarted = false;
    const engine = new GameEngine(room);
    const roundManager: any = (engine as any).roundManager;
    const client: any = { send: jest.fn() };

    engine.handleStartGame(client);

    expect(room.state.roundStarted).toBe(true);
    expect(roundManager.resetForNewHand).toHaveBeenCalled();
    expect(roundManager.dealInitialHands).toHaveBeenCalled();
  });

  it("handleStartGame: errors when 0 active players (all bust)", () => {
    const room = makeRoom();
    room.state.roundStarted = false;
    room.state.users.get("p1")!.chips = 0;
    room.state.users.get("p2")!.chips = 0;
    const engine = new GameEngine(room);
    const client: any = { send: jest.fn() };

    engine.handleStartGame(client);

    expect(client.send).toHaveBeenCalledWith("error", expect.objectContaining({ message: expect.stringContaining("2 jugadores") }));
  });

  it("startNewHand: bails out when <2 players with chips", () => {
    const room = makeRoom();
    room.state.users.get("p2")!.chips = 0;
    const engine = new GameEngine(room);

    engine.startNewHand();

    expect(room.state.roundStarted).toBe(false);
  });

  it("startNewHand: bails out when getNextActiveIndexFrom returns -1", () => {
    const room = makeRoom();
    const engine = new GameEngine(room);
    const utils: any = (engine as any).utils;
    utils.getNextActiveIndexFrom.mockReturnValue(-1);

    engine.startNewHand();

    expect(room.state.roundStarted).toBe(false);
  });

  it("proceedToNextPhase: all-in showdown path calls startAllInShowdownReveal", () => {
    const room = makeRoom();
    room.state.phase = "flop" as any;
    room.state.communityCards.clear();
    room.state.communityCards.push("a", "b", "c");
    const engine = new GameEngine(room);
    const utils: any = (engine as any).utils;
    utils.getPlayersInHandNonFolded.mockReturnValue(["p1", "p2"]);
    const p1 = room.state.users.get("p1")!;
    p1.chips = 0;
    const startAllInSpy = jest.spyOn(engine as any, "startAllInShowdownReveal").mockImplementation(() => {});

    engine.proceedToNextPhase();

    expect(startAllInSpy).toHaveBeenCalled();
  });

  it("proceedToNextPhase: when currentPlayerIndex stays -1 and activePlayerIds length > 0, still starts betting and timer", () => {
    const room = makeRoom();
    const engine = new GameEngine(room);
    const utils: any = (engine as any).utils;
    const roundManager: any = (engine as any).roundManager;
    utils.getPlayersInHandNonFolded.mockReturnValue(["p1", "p2"]);
    utils.getNextActiveIndexFrom.mockReturnValue(-1);
    utils.getActivePlayerIds.mockReturnValue(["p1", "p2"]);
    const startTurnTimerSpy = jest.spyOn(engine, "startTurnTimer").mockImplementation(() => {});

    engine.proceedToNextPhase();

    expect(roundManager.dealNextCommunityCard).toHaveBeenCalled();
    expect(startTurnTimerSpy).toHaveBeenCalled();
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

  it("handleCheck: delegates to playerActions.handleCheck with endTurn callback", () => {
    const room = makeRoom();
    room.state.currentTurn = "p1";
    const engine = new GameEngine(room);
    const playerActions: any = (engine as any).playerActions;
    const endTurnSpy = jest.spyOn(engine, "endTurn").mockImplementation(() => {});
    const client = { sessionId: "p1" };

    engine.handleCheck(client as any);

    expect(playerActions.handleCheck).toHaveBeenCalledWith(client, expect.any(Function));
    playerActions.handleCheck.mock.calls[0][1]();
    expect(endTurnSpy).toHaveBeenCalled();
  });

  it("handleAllIn: when not turn returns without calling handleBet", () => {
    const room = makeRoom();
    room.state.currentTurn = "p2";
    const engine = new GameEngine(room);
    const handleBetSpy = jest.spyOn(engine, "handleBet").mockImplementation(() => {});

    engine.handleAllIn({ sessionId: "p1" } as any);

    expect(handleBetSpy).not.toHaveBeenCalled();
  });

  it("handleAllIn: delegates to handleBet with currentBet + chips", () => {
    const room = makeRoom();
    room.state.currentTurn = "p1";
    room.state.currentBet = 50;
    room.state.users.get("p1")!.chips = 200;
    const engine = new GameEngine(room);
    const handleBetSpy = jest.spyOn(engine, "handleBet").mockImplementation(() => {});

    engine.handleAllIn({ sessionId: "p1" } as any);

    expect(handleBetSpy).toHaveBeenCalledWith(expect.anything(), 250);
  });

  it("handleRaise: delegates to handleBet with currentBet + amount", () => {
    const room = makeRoom();
    room.state.currentBet = 100;
    const engine = new GameEngine(room);
    const handleBetSpy = jest.spyOn(engine, "handleBet").mockImplementation(() => {});

    engine.handleRaise({ sessionId: "p1" } as any, 50);

    expect(handleBetSpy).toHaveBeenCalledWith(expect.anything(), 150);
  });

  it("handleFold: when one player left calls endRound", () => {
    const room = makeRoom();
    room.playersInHand = ["p1", "p2"];
    const engine = new GameEngine(room);
    const playerActions: any = (engine as any).playerActions;
    const endRoundSpy = jest.spyOn(engine as any, "endRound").mockImplementation(() => {});

    playerActions.handleFold.mockImplementation((_c: any, _contrib: any, cb: () => void) => {
      room.playersInHand = ["p1"];
      cb();
    });

    engine.handleFold({ sessionId: "p1" } as any);

    expect(endRoundSpy).toHaveBeenCalledWith(["p1"], "Gana por fold");
  });

  it("handleFold: when multiple players left calls endTurn", () => {
    const room = makeRoom();
    const engine = new GameEngine(room);
    const playerActions: any = (engine as any).playerActions;
    const endTurnSpy = jest.spyOn(engine, "endTurn").mockImplementation(() => {});

    playerActions.handleFold.mockImplementation((_c: any, _contrib: any, cb: () => void) => cb());

    engine.handleFold({ sessionId: "p1" } as any);

    expect(endTurnSpy).toHaveBeenCalled();
  });

  it("handleFoldForTimeout: when one player left calls endRound", () => {
    const room = makeRoom();
    room.playersInHand = ["p1", "p2"];
    const engine = new GameEngine(room);
    const playerActions: any = (engine as any).playerActions;
    const endRoundSpy = jest.spyOn(engine as any, "endRound").mockImplementation(() => {});

    playerActions.handleFoldForTimeout.mockImplementation((_sid: string, _contrib: any, cb: () => void) => {
      room.playersInHand = ["p2"];
      cb();
    });

    engine.handleFoldForTimeout("p1");

    expect(endRoundSpy).toHaveBeenCalledWith(["p2"], "Gana por fold");
  });

  it("endTurn: when all active players have acted, calls proceedToNextPhase", () => {
    const room = makeRoom();
    const engine = new GameEngine(room);
    const utils: any = (engine as any).utils;
    utils.getActivePlayerIds.mockReturnValue(["p1", "p2"]);
    room.playersActedThisRound.add("p1");
    room.playersActedThisRound.add("p2");
    const proceedSpy = jest.spyOn(engine as any, "proceedToNextPhase").mockImplementation(() => {});

    engine.endTurn();

    expect(proceedSpy).toHaveBeenCalled();
  });

  it("endTurn: moves to next player and starts turn timer", () => {
    const room = makeRoom();
    room.playersActedThisRound.clear();
    const engine = new GameEngine(room);
    const utils: any = (engine as any).utils;
    utils.getActivePlayerIds.mockReturnValue(["p1", "p2"]);
    utils.getNextActiveIndexFrom.mockReturnValue(1);
    const startTurnTimerSpy = jest.spyOn(engine, "startTurnTimer").mockImplementation(() => {});

    engine.endTurn();

    expect(room.currentPlayerIndex).toBe(1);
    expect(room.state.currentTurn).toBe("p2");
    expect(startTurnTimerSpy).toHaveBeenCalled();
  });

  it("endTurn: when currentPlayerIndex -1 finds nextToAct and sets index", () => {
    const room = makeRoom();
    room.playersActedThisRound.clear();
    const engine = new GameEngine(room);
    const utils: any = (engine as any).utils;
    utils.getActivePlayerIds.mockReturnValue(["p1", "p2"]);
    utils.getNextActiveIndexFrom.mockReturnValue(-1);
    const startTurnTimerSpy = jest.spyOn(engine, "startTurnTimer").mockImplementation(() => {});

    engine.endTurn();

    expect(startTurnTimerSpy).toHaveBeenCalled();
  });

  it("endRound: pays winners, broadcasts, sets SEATED, calls checkGameEnd", () => {
    const room = makeRoom();
    const engine = new GameEngine(room);
    const winnerDeterminator: any = (engine as any).winnerDeterminator;
    const broadcaster: any = (engine as any).broadcaster;
    winnerDeterminator.calculateSidePotPayouts.mockReturnValue([
      { playerId: "p1", amount: 100 }
    ]);
    const checkGameEndSpy = jest.spyOn(engine as any, "checkGameEnd").mockImplementation(() => {});

    (engine as any).endRound(["p1"], "High card", false);

    expect(room.state.users.get("p1")!.chips).toBe(1100);
    expect(broadcaster.broadcastRoundEnded).toHaveBeenCalled();
    expect(checkGameEndSpy).toHaveBeenCalled();
    expect(room.state.users.get("p1")!.playerStatus).toBe("seated");
  });

  it("endRound: when 2+ players with chips after payout, starts new hand", () => {
    const room = makeRoom();
    const engine = new GameEngine(room);
    const winnerDeterminator: any = (engine as any).winnerDeterminator;
    winnerDeterminator.calculateSidePotPayouts.mockReturnValue([
      { playerId: "p1", amount: 50 },
      { playerId: "p2", amount: 50 }
    ]);
    jest.spyOn(engine as any, "checkGameEnd").mockImplementation(() => {});
    const startNewHandSpy = jest.spyOn(engine, "startNewHand").mockImplementation(() => {});

    (engine as any).endRound(["p1", "p2"], "Split", false);

    expect(startNewHandSpy).toHaveBeenCalled();
  });

  it("checkGameEnd: when one player with chips broadcasts and notifies tournament end", () => {
    const room = makeRoom();
    room.state.users.get("p2")!.chips = 0;
    const engine = new GameEngine(room);
    const broadcaster: any = (engine as any).broadcaster;
    room.notifyTournamentEnd = jest.fn();

    (engine as any).checkGameEnd();

    expect(broadcaster.broadcastGameEnded).toHaveBeenCalledWith(
      expect.objectContaining({ champion: expect.objectContaining({ sessionId: "p1", name: "P1" }) })
    );
    expect(room.notifyTournamentEnd).toHaveBeenCalled();
  });

  it("checkGameEnd: when gameEndBroadcasted true does not broadcast again", () => {
    const room = makeRoom();
    room.state.users.get("p2")!.chips = 0;
    const engine = new GameEngine(room);
    (engine as any).gameEndBroadcasted = true;
    const broadcaster: any = (engine as any).broadcaster;
    expect(broadcaster.broadcastGameEnded).toBeDefined();

    (engine as any).checkGameEnd();

    expect(broadcaster.broadcastGameEnded).not.toHaveBeenCalled();
  });

  it("tryGameEnd: calls checkGameEnd", () => {
    const room = makeRoom();
    const engine = new GameEngine(room);
    const checkSpy = jest.spyOn(engine as any, "checkGameEnd").mockImplementation(() => {});

    engine.tryGameEnd();

    expect(checkSpy).toHaveBeenCalled();
  });

  it("setCurrentPlayerIndexBeforeNextActive: delegates to utils", () => {
    const room = makeRoom();
    const engine = new GameEngine(room);
    const utils: any = (engine as any).utils;
    utils.setCurrentPlayerIndexBeforeNextActive = jest.fn();

    engine.setCurrentPlayerIndexBeforeNextActive(1);

    expect(utils.setCurrentPlayerIndexBeforeNextActive).toHaveBeenCalledWith(1);
  });
});

