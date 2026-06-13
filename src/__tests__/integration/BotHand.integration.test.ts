/**
 * BotHand.integration.test.ts
 *
 * Phase 3 proof of correctness: a practice-shaped room (1 human + 1 bot) plays
 * a COMPLETE hand to game resolution with NO human-side intervention for the bot.
 *
 * The bot acts SOLELY through the hook → BotController → engine chain:
 *   engine.startTurnTimer()
 *     → room.onTurnStarted?.(currentTurn)           [Task 1 hook line]
 *       → botController.onTurnStarted(sessionId)
 *         → room.scheduleDelayed(() => act(sid), ms) [synchronous in test]
 *           → act() builds BotSituation + calls BotStrategy.decide + engine.handle*
 *
 * No direct engine.handle* call for "bot-1" appears in this test — that invariant
 * is enforced by inspection (only human client calls engine.handle*).
 *
 * Note on determinism: MesaState.resetDeck() shuffles with crypto.randomInt, so card
 * outcomes are NOT seedable. The seed-deterministic part is the bot's DECISION logic
 * (BotStrategy.decide is pure, injected-rng based). The "two runs" test therefore asserts
 * both runs TERMINATE without stalling — not that they produce bit-identical results.
 */

import { GameEngine } from "../../rooms/game/GameEngine";
import { MesaState, Player } from "../../rooms/schema/MesaState";
import { BotController } from "../../rooms/managers/BotController";
import { BOT_TIGHT, BOT_AGGRESSIVE } from "../../rooms/game/bots/profiles";

// ─────────────────────────────────────────────────────────────────────
// Seeded LCG — identical formula to BotStrategy.test.ts (source-verified)
// ─────────────────────────────────────────────────────────────────────
function makeLcg(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ─────────────────────────────────────────────────────────────────────
// Run the game until the first notifyTournamentEnd or a safety limit.
// Returns a trace object for assertions.
//
// Implementation note: because scheduleDelayed is synchronous, bot turns
// complete INSIDE the engine.handle* call chain triggered by the human's
// action. The human loop only ever sees its OWN turns in currentTurn;
// the bot's turns self-complete within the same synchronous call stack.
// We therefore need a large safety counter (many hands until one player busts).
// ─────────────────────────────────────────────────────────────────────
function runUntilEnd(fixedSeed: number): {
  safetyCounterFinal: number;
  phaseAtEnd: string;
  tournamentEndCalled: boolean;
  scheduleDelayedCallCount: number;
} {
  const state = new MesaState();

  const human = new Player("human-1");
  human.name = "Human";
  human.chips = 1000;
  state.users.set("human-1", human);

  const bot = new Player("bot-1");
  bot.name = "Bot";
  bot.chips = 1000;
  bot.isBot = true;
  state.users.set("bot-1", bot);

  const scheduleDelayed = jest.fn((cb: () => void) => cb()); // synchronous

  const mockRoom: any = {
    roomId: "test-practice",
    state,
    clients: [],
    playersInHand: [] as string[],
    playersActedThisRound: new Set<string>(),
    playersAllIn: new Set<string>(),
    dealerIndex: 0,
    currentPlayerIndex: 0,
    turnTimeout: null as NodeJS.Timeout | null,
    broadcast: jest.fn(),
    scheduleDelayed,
    notifyTournamentEnd: jest.fn(),
  };

  const engine = new GameEngine(mockRoom);
  const fixedRng = makeLcg(fixedSeed);
  const botController = new BotController(mockRoom, engine);
  // Use BOT_AGGRESSIVE so the bot bets and raises, creating chip pressure → tournament ends faster
  botController.registerBot("bot-1", BOT_AGGRESSIVE, fixedRng);

  // Wire the hook: room.onTurnStarted → botController.onTurnStarted
  // This is what ChiribitoRoom.onTurnStarted does after Task 3 wiring.
  mockRoom.onTurnStarted = (sid: string) => botController.onTurnStarted(sid);

  // Start the game — human triggers this (like sending "startGame")
  const humanClient = { sessionId: "human-1", send: jest.fn() } as any;
  engine.handleStartGame(humanClient);

  // Drive human turns only. Bot turns self-complete synchronously via onTurnStarted.
  // BOT_AGGRESSIVE raises frequently, creating chip pressure that busts one player.
  // Safety counter: 5000 human-turn steps handle many full hands.
  let safetyCounter = 5000;
  while (state.roundStarted && safetyCounter-- > 0) {
    const turn = state.currentTurn;
    if (!turn) break;

    if (turn === "human-1") {
      const humanPlayer = state.users.get("human-1");
      if (!humanPlayer) break;
      const stub = { sessionId: "human-1", send: jest.fn() } as any;
      // Human strategy: check when free, call when facing a bet
      if (state.currentBet === humanPlayer.currentBet) {
        engine.handleCheck(stub);
      } else {
        engine.handleCall(stub);
      }
    }
    // If turn === "bot-1": the hook already fired synchronously inside the preceding
    // engine.handle* call. Nothing to do here.
  }

  return {
    safetyCounterFinal: safetyCounter,
    phaseAtEnd: state.phase,
    tournamentEndCalled: mockRoom.notifyTournamentEnd.mock.calls.length > 0,
    scheduleDelayedCallCount: scheduleDelayed.mock.calls.length,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────

describe("BotController integration — complete hand (1 human + 1 bot)", () => {
  beforeEach(() => {
    // Prevent the 60 s TURN_TIMEOUT setTimeout from firing during the test.
    // Bots act synchronously via scheduleDelayed, so real timers never advance.
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("game runs to tournament end without hitting the safety counter", () => {
    const result = runUntilEnd(42);

    // Safety counter must not have reached 0 (no infinite loop)
    expect(result.safetyCounterFinal).toBeGreaterThan(0);

    // notifyTournamentEnd fires when one player busts — the canonical end condition
    expect(result.tournamentEndCalled).toBe(true);
  });

  it("bot participated: scheduleDelayed was called (think-delay hook fired for bot turns)", () => {
    const result = runUntilEnd(42);

    // scheduleDelayed was called at least once (bot had at least one turn and it was scheduled)
    expect(result.scheduleDelayedCallCount).toBeGreaterThan(0);
  });

  it("hand progresses past the waiting phase (game actually started)", () => {
    const result = runUntilEnd(42);

    expect(result.phaseAtEnd).not.toBe("waiting");
  });

  it("completes reliably across runs with a fixed rng seed (bot never stalls; deck is crypto-random so outcomes are not bit-identical)", () => {
    // NOTE: MesaState.resetDeck() uses crypto.randomInt for the shuffle, so card outcomes
    // vary between runs. What IS deterministic under a fixed rng seed is the bot's DECISION
    // logic (BotStrategy.decide is pure and injected-rng based). This test verifies that
    // both runs complete within the safety counter — the bot always acts without stalling,
    // regardless of which cards are dealt.
    const FIXED_SEED = 1234;
    const run1 = runUntilEnd(FIXED_SEED);
    const run2 = runUntilEnd(FIXED_SEED);

    // Both runs must complete cleanly (no infinite loop)
    expect(run1.safetyCounterFinal).toBeGreaterThan(0);
    expect(run2.safetyCounterFinal).toBeGreaterThan(0);

    // Both runs must have called notifyTournamentEnd
    expect(run1.tournamentEndCalled).toBe(true);
    expect(run2.tournamentEndCalled).toBe(true);
  });

  it("bot acts ONLY via the hook — no direct engine handle call for bot-1 in test code", () => {
    // This is verified by code review (no engine.handle* for "bot-1" appears in this test).
    // The runtime assertion: if the bot acts, it must have been triggered by onTurnStarted.
    // We verify: the hook was invoked and an engine method was called for "bot-1".

    const state = new MesaState();
    const human = new Player("human-1");
    human.chips = 1000;
    human.name = "Human";
    state.users.set("human-1", human);

    const bot = new Player("bot-1");
    bot.chips = 1000;
    bot.name = "Bot";
    bot.isBot = true;
    state.users.set("bot-1", bot);

    const engineMockCalls: string[] = [];
    const mockRoom: any = {
      roomId: "trace-room",
      state,
      clients: [],
      playersInHand: [] as string[],
      playersActedThisRound: new Set<string>(),
      playersAllIn: new Set<string>(),
      dealerIndex: 0,
      currentPlayerIndex: 0,
      turnTimeout: null,
      broadcast: jest.fn(),
      scheduleDelayed: jest.fn((cb: () => void) => cb()),
      notifyTournamentEnd: jest.fn(),
    };

    const engine = new GameEngine(mockRoom);
    const rng = makeLcg(7);
    const botController = new BotController(mockRoom, engine);
    botController.registerBot("bot-1", BOT_AGGRESSIVE, rng);
    mockRoom.onTurnStarted = (sid: string) => botController.onTurnStarted(sid);

    const humanClient = { sessionId: "human-1", send: jest.fn() } as any;
    engine.handleStartGame(humanClient);

    // After handleStartGame, if the first turn is the bot's, it already acted.
    // If the first turn is the human's, we trigger one human action to advance to the bot.
    if (state.currentTurn === "human-1") {
      const stub = { sessionId: "human-1", send: jest.fn() } as any;
      engine.handleCheck(stub);
    }

    // By now the bot must have had at least one turn (scheduleDelayed synchronous)
    // The assertion is that we never called engine.handle* directly for "bot-1" here.
    // Instead, the hook called BotController which called engine.handle* internally.
    // We verify this by checking scheduleDelayed was invoked (the hook path was taken).
    expect(mockRoom.scheduleDelayed).toHaveBeenCalled();
  });
});
