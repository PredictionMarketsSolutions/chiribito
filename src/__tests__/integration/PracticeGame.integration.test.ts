/**
 * PracticeGame.integration.test.ts
 *
 * Phase 4 proof of correctness: 1 human + 3 bots play a COMPLETE Chiribito game
 * (all 6 streets, showdown, side-pots) to a single champion, AND
 * reportTournamentGameEnded is asserted NEVER invoked (REQ-no-stats-no-ranking proof).
 *
 * Key differences from BotHand.integration.test.ts (1 human + 1 bot):
 *   (a) 3 bots: bot-1, bot-2, bot-3
 *   (b) DEFERRED scheduler — prevents bot→bot recursion stack overflow (Pitfall 2)
 *   (c) Real ChiribitoRoom.notifyTournamentEnd wired with isPractice=true so the
 *       no-stats guard actually executes; asserts reportTournamentGameEnded === 0 calls
 *
 * Scheduler note (BotController.ts header, lines 34–43):
 *   A synchronous `scheduleDelayed: (cb) => cb()` with 3+ bots recurses:
 *   bot-A act() → endTurn → onTurnStarted(bot-B) → scheduleDelayed(act-B) → act-B()
 *   → endTurn → onTurnStarted(bot-C) → scheduleDelayed(act-C) → act-C() → …
 *   This exhausts the call stack (RangeError: Maximum call stack size exceeded).
 *   Solution: enqueue callbacks; drain with a while-loop (trampoline). Each drained
 *   bot act() may enqueue the NEXT bot callback rather than calling it inline, so the
 *   chain unwinds iteratively with O(1) stack depth.
 */

// ─────────────────────────────────────────────────────────────────────
// Module mocks — hoisted before imports
// ─────────────────────────────────────────────────────────────────────

jest.mock("@colyseus/core", () => ({
  Room: class {},
  Client: class {},
  CloseCode: { CONSENTED: 4000 },
}));

jest.mock("../../services/api-server-stats", () => ({
  reportTournamentGameEnded: jest.fn().mockResolvedValue(undefined),
}));

// ─────────────────────────────────────────────────────────────────────
// Imports
// ─────────────────────────────────────────────────────────────────────

import { GameEngine } from "../../rooms/game/GameEngine";
import { MesaState, Player } from "../../rooms/schema/MesaState";
import { BotController } from "../../rooms/managers/BotController";
import { BOT_AGGRESSIVE } from "../../rooms/game/bots/profiles";
import { ChiribitoRoom } from "../../rooms/ChiribitoRoom";
import { reportTournamentGameEnded } from "../../services/api-server-stats";

// ─────────────────────────────────────────────────────────────────────
// Seeded LCG — verbatim from BotHand.integration.test.ts
// ─────────────────────────────────────────────────────────────────────
function makeLcg(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ─────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────

describe("PracticeGame integration — 1 human + 3 bots", () => {
  // Deferred scheduler queue: callbacks are enqueued here, not called inline.
  // Drained after each human action and at the top of each drive-loop iteration.
  let queue: Array<() => void>;

  // Track how many times the scheduler was called (for the no-recursion proof)
  let scheduleDelayedCallCount: number;

  let state: MesaState;
  let mockRoom: any;
  let engine: GameEngine;
  let botController: BotController;

  beforeEach(() => {
    // Prevent the 60s TURN_TIMEOUT from firing during the test
    jest.useFakeTimers();

    // Reset the deferred queue
    queue = [];
    scheduleDelayedCallCount = 0;
    (reportTournamentGameEnded as jest.Mock).mockClear();

    // Build the practice room state: 1 human + 3 bots
    state = new MesaState();

    const human = new Player("human-1");
    human.name = "Human";
    human.chips = 1000;
    state.users.set("human-1", human);

    const bot1 = new Player("bot-1");
    bot1.name = "Bot 1";
    bot1.chips = 1000;
    bot1.isBot = true;
    state.users.set("bot-1", bot1);

    const bot2 = new Player("bot-2");
    bot2.name = "Bot 2";
    bot2.chips = 1000;
    bot2.isBot = true;
    state.users.set("bot-2", bot2);

    const bot3 = new Player("bot-3");
    bot3.name = "Bot 3";
    bot3.chips = 1000;
    bot3.isBot = true;
    state.users.set("bot-3", bot3);

    // Deferred scheduler — enqueue, NOT inline call.
    // This is the trampolined-scheduler fix for Pitfall 2 (multi-bot stack overflow).
    const scheduleDelayed = (cb: () => void) => {
      scheduleDelayedCallCount++;
      queue.push(cb);
    };

    mockRoom = {
      roomId: "test-practice-3bots",
      state,
      clients: [], // no real WebSocket clients — gameResult loop is a no-op (empty clients)
      playersInHand: [] as string[],
      playersActedThisRound: new Set<string>(),
      playersAllIn: new Set<string>(),
      dealerIndex: 0,
      currentPlayerIndex: 0,
      turnTimeout: null as NodeJS.Timeout | null,
      broadcast: jest.fn(),
      scheduleDelayed,
      // reportTournamentStats: stub to detect accidental invocation in the practice branch
      reportTournamentStats: jest.fn(),
      // isPractice: true so the practice guard in notifyTournamentEnd fires
      isPractice: true,
    };

    engine = new GameEngine(mockRoom);
    botController = new BotController(mockRoom, engine);

    // Register 3 bots with BOT_AGGRESSIVE and deterministic LCG rngs
    botController.registerBot("bot-1", BOT_AGGRESSIVE, makeLcg(42));
    botController.registerBot("bot-2", BOT_AGGRESSIVE, makeLcg(137));
    botController.registerBot("bot-3", BOT_AGGRESSIVE, makeLcg(999));

    // Wire the hook: room.onTurnStarted → botController.onTurnStarted
    mockRoom.onTurnStarted = (sid: string) => botController.onTurnStarted(sid);

    // Wire the REAL notifyTournamentEnd with isPractice=true so the no-stats guard runs.
    // The practice branch: broadcasts "practiceEnd", skips reportTournamentStats, skips disconnect.
    // mockRoom.clients = [] so the gameResult loop is a no-op (no real sockets).
    mockRoom.notifyTournamentEnd = ChiribitoRoom.prototype.notifyTournamentEnd.bind(mockRoom);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  /**
   * Helper: drain the scheduler queue iteratively (trampoline).
   * Each drained bot callback may enqueue the NEXT bot, so we keep draining
   * until the queue is empty. This avoids deep recursion for N bots.
   */
  function drainQueue(): void {
    while (queue.length > 0) {
      const cb = queue.shift()!;
      cb();
    }
  }

  it("plays to champion without hitting the safety counter", () => {
    const humanClient = { sessionId: "human-1", send: jest.fn() } as any;
    engine.handleStartGame(humanClient);
    drainQueue();

    let safety = 8000;
    while (state.roundStarted && safety-- > 0) {
      // Drain any pending bot callbacks at the top of each iteration
      drainQueue();

      const turn = state.currentTurn;
      if (!turn) break;

      if (turn === "human-1") {
        const humanPlayer = state.users.get("human-1");
        if (!humanPlayer || humanPlayer.chips <= 0) break;
        const stub = { sessionId: "human-1", send: jest.fn() } as any;
        // Human strategy: check when free, call when facing a bet
        if (state.currentBet === humanPlayer.currentBet) {
          engine.handleCheck(stub);
        } else {
          engine.handleCall(stub);
        }
        drainQueue();
      }
    }

    // Drain any final pending callbacks
    drainQueue();

    expect(safety).toBeGreaterThan(0);

    // Exactly one player holds all chips at the end
    const playersWithChips = Array.from(state.users.values()).filter(p => p.chips > 0);
    expect(playersWithChips).toHaveLength(1);
  });

  it("reportTournamentGameEnded is NEVER invoked — no-stats guarantee (REQ-no-stats-no-ranking)", () => {
    const humanClient = { sessionId: "human-1", send: jest.fn() } as any;
    engine.handleStartGame(humanClient);
    drainQueue();

    let safety = 8000;
    while (state.roundStarted && safety-- > 0) {
      drainQueue();

      const turn = state.currentTurn;
      if (!turn) break;

      if (turn === "human-1") {
        const humanPlayer = state.users.get("human-1");
        if (!humanPlayer || humanPlayer.chips <= 0) break;
        const stub = { sessionId: "human-1", send: jest.fn() } as any;
        if (state.currentBet === humanPlayer.currentBet) {
          engine.handleCheck(stub);
        } else {
          engine.handleCall(stub);
        }
        drainQueue();
      }
    }

    drainQueue();

    // THE REQ-no-stats-no-ranking PROOF: stats endpoint must NEVER be called in practice mode
    expect((reportTournamentGameEnded as jest.Mock).mock.calls.length).toBe(0);

    // Double-check: the room-level reportTournamentStats stub also never called
    expect(mockRoom.reportTournamentStats).not.toHaveBeenCalled();
  });

  it("practiceEnd was broadcast at game end", () => {
    const humanClient = { sessionId: "human-1", send: jest.fn() } as any;
    engine.handleStartGame(humanClient);
    drainQueue();

    let safety = 8000;
    while (state.roundStarted && safety-- > 0) {
      drainQueue();
      const turn = state.currentTurn;
      if (!turn) break;
      if (turn === "human-1") {
        const humanPlayer = state.users.get("human-1");
        if (!humanPlayer || humanPlayer.chips <= 0) break;
        const stub = { sessionId: "human-1", send: jest.fn() } as any;
        if (state.currentBet === humanPlayer.currentBet) {
          engine.handleCheck(stub);
        } else {
          engine.handleCall(stub);
        }
        drainQueue();
      }
    }

    drainQueue();

    // The practice branch in notifyTournamentEnd must have broadcast "practiceEnd"
    expect(mockRoom.broadcast).toHaveBeenCalledWith(
      "practiceEnd",
      expect.objectContaining({ champion: expect.any(Object) })
    );
  });

  it("all four players were seeded and dealt in (state.users.size === 4)", () => {
    // Before starting: 4 players in state
    expect(state.users.size).toBe(4);

    const humanClient = { sessionId: "human-1", send: jest.fn() } as any;
    engine.handleStartGame(humanClient);
    drainQueue();

    // Scheduler was called at least once — bots had turns via the hook
    expect(scheduleDelayedCallCount).toBeGreaterThan(0);
  });

  it("no stack overflow with 3 bots — deferred scheduler prevents recursion", () => {
    // The very existence of this test completing without RangeError proves the
    // deferred scheduler works. We also assert the queue was used (not synchronous).
    const humanClient = { sessionId: "human-1", send: jest.fn() } as any;
    engine.handleStartGame(humanClient);
    drainQueue();

    let safety = 8000;
    while (state.roundStarted && safety-- > 0) {
      drainQueue();
      const turn = state.currentTurn;
      if (!turn) break;
      if (turn === "human-1") {
        const humanPlayer = state.users.get("human-1");
        if (!humanPlayer || humanPlayer.chips <= 0) break;
        const stub = { sessionId: "human-1", send: jest.fn() } as any;
        if (state.currentBet === humanPlayer.currentBet) {
          engine.handleCheck(stub);
        } else {
          engine.handleCall(stub);
        }
        drainQueue();
      }
    }

    drainQueue();

    // The deferred scheduler was used (callbacks were enqueued, not called inline)
    expect(scheduleDelayedCallCount).toBeGreaterThan(0);

    // The drive loop completed without stack overflow (implicit: we got here)
    expect(safety).toBeGreaterThanOrEqual(0);
  });
});
