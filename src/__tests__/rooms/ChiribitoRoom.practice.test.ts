/**
 * ChiribitoRoom.practice.test.ts
 *
 * Unit battery for the five practice-mode behaviors wired in Phase 4:
 *   1. onCreate seeds N bots + sets isPractice + _listing.unlisted
 *   2. botCount clamp [1,5]
 *   3. non-practice regression (isPractice false, no seeding, no unlisted)
 *   4. notifyTournamentEnd practice guard: skips stats + clock.setTimeout, broadcasts practiceEnd
 *   5. notifyTournamentEnd non-practice regression: byte-identical to pre-Phase-4
 *   6. playAgain handler: re-seeds chips=1000, starts new hand (practice only)
 *   7. dispose-on-empty: disconnect when clients.length===0 in practice
 *
 * Seam pattern: mirrors ChiribitoRoom.tournament.test.ts
 *   - jest.mock("@colyseus/core") + jest.mock("../../services/api-server-stats")
 *   - ChiribitoRoom.prototype.METHOD.call(fakeRoom, ...) — no real Room construction needed
 *
 * RED phase: practice-specific assertions FAIL until Task 2 adds the behaviors.
 * Regression describes (non-practice paths) may pass against current code.
 */

// ─────────────────────────────────────────────────────────────────────
// Module mocks — hoisted by Jest before imports
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

import { ChiribitoRoom } from "../../rooms/ChiribitoRoom";
import { CUSTOM_GAME_END } from "../../rooms/close-codes";
import { reportTournamentGameEnded } from "../../services/api-server-stats";
import { BotController } from "../../rooms/managers/BotController";
import { GameEngine } from "../../rooms/game/GameEngine";

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

/**
 * Build a minimal fakeRoom that supports onCreate without throwing.
 *
 * Seam choice: because onCreate constructs many managers (SessionManager,
 * BotController, etc.) we spy on BotController.prototype.seedBots to intercept
 * the seeding call without running full Colyseus infrastructure. Other
 * manager constructors are allowed to run (they accept the room-id + options
 * we stub) so we only mock the minimum needed.
 */
function makeOnCreateRoom() {
  const fakeRoom: any = {
    roomId: "room-test-001",
    maxClients: 6,
    autoDispose: true,
    // Colyseus Room API stubs
    setState: jest.fn(),
    setMetadata: jest.fn(),
    onMessage: jest.fn(),
    // _listing mirroring Colyseus Room._listing (default unlisted=false)
    _listing: { unlisted: false },
    // clock used by ConnectionMonitor and AnalyticsService inside onCreate
    clock: {
      setTimeout: jest.fn().mockReturnValue(0),
      setInterval: jest.fn().mockReturnValue(0),
    },
    // broadcast and send stubs (not exercised in onCreate tests)
    broadcast: jest.fn(),
    // fields onCreate sets
    isPractice: undefined as boolean | undefined,
    engine: undefined as any,
    botController: undefined as any,
  };

  return fakeRoom;
}

// ─────────────────────────────────────────────────────────────────────
// Describe 1: onCreate practice mode — seeding + isPractice + unlisted
// ─────────────────────────────────────────────────────────────────────

describe("ChiribitoRoom onCreate — practice mode", () => {
  let seedBotsSpy: jest.SpyInstance;

  beforeEach(() => {
    // Intercept BotController.prototype.seedBots — we assert the call args without
    // running real seeding (which requires a live SeatManager with slots).
    seedBotsSpy = jest.spyOn(BotController.prototype, "seedBots").mockImplementation(() => {});
  });

  afterEach(() => {
    seedBotsSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("sets isPractice = true when mode is 'practice'", () => {
    const fakeRoom = makeOnCreateRoom();
    ChiribitoRoom.prototype.onCreate.call(fakeRoom, { mode: "practice", botCount: 3 });
    expect(fakeRoom.isPractice).toBe(true);
  });

  it("sets _listing.unlisted = true for practice rooms", () => {
    const fakeRoom = makeOnCreateRoom();
    ChiribitoRoom.prototype.onCreate.call(fakeRoom, { mode: "practice", botCount: 3 });
    expect(fakeRoom["_listing"].unlisted).toBe(true);
  });

  it("calls seedBots once with count=3 and chips=1000 for botCount:3", () => {
    const fakeRoom = makeOnCreateRoom();
    ChiribitoRoom.prototype.onCreate.call(fakeRoom, { mode: "practice", botCount: 3 });
    expect(seedBotsSpy).toHaveBeenCalledTimes(1);
    expect(seedBotsSpy).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ chips: 1000 })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────
// Describe 2: botCount clamping
// ─────────────────────────────────────────────────────────────────────

describe("ChiribitoRoom onCreate — botCount clamp [1,5]", () => {
  let seedBotsSpy: jest.SpyInstance;

  beforeEach(() => {
    seedBotsSpy = jest.spyOn(BotController.prototype, "seedBots").mockImplementation(() => {});
  });

  afterEach(() => {
    seedBotsSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("clamps botCount:99 to 5", () => {
    const fakeRoom = makeOnCreateRoom();
    ChiribitoRoom.prototype.onCreate.call(fakeRoom, { mode: "practice", botCount: 99 });
    expect(seedBotsSpy).toHaveBeenCalledWith(5, expect.anything());
  });

  it("clamps botCount:0 to 1", () => {
    const fakeRoom = makeOnCreateRoom();
    ChiribitoRoom.prototype.onCreate.call(fakeRoom, { mode: "practice", botCount: 0 });
    expect(seedBotsSpy).toHaveBeenCalledWith(1, expect.anything());
  });

  it("clamps botCount undefined to 1", () => {
    const fakeRoom = makeOnCreateRoom();
    ChiribitoRoom.prototype.onCreate.call(fakeRoom, { mode: "practice" });
    expect(seedBotsSpy).toHaveBeenCalledWith(1, expect.anything());
  });

  it("clamps botCount:-3 to 1", () => {
    const fakeRoom = makeOnCreateRoom();
    ChiribitoRoom.prototype.onCreate.call(fakeRoom, { mode: "practice", botCount: -3 });
    expect(seedBotsSpy).toHaveBeenCalledWith(1, expect.anything());
  });
});

// ─────────────────────────────────────────────────────────────────────
// Describe 3: onCreate non-practice regression
// ─────────────────────────────────────────────────────────────────────

describe("ChiribitoRoom onCreate — non-practice regression", () => {
  let seedBotsSpy: jest.SpyInstance;

  beforeEach(() => {
    seedBotsSpy = jest.spyOn(BotController.prototype, "seedBots").mockImplementation(() => {});
  });

  afterEach(() => {
    seedBotsSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("isPractice is falsy when no mode is passed", () => {
    const fakeRoom = makeOnCreateRoom();
    ChiribitoRoom.prototype.onCreate.call(fakeRoom, {});
    expect(fakeRoom.isPractice).toBeFalsy();
  });

  it("seedBots is NOT called for non-practice rooms", () => {
    const fakeRoom = makeOnCreateRoom();
    ChiribitoRoom.prototype.onCreate.call(fakeRoom, {});
    expect(seedBotsSpy).not.toHaveBeenCalled();
  });

  it("_listing.unlisted stays false for non-practice rooms", () => {
    const fakeRoom = makeOnCreateRoom();
    ChiribitoRoom.prototype.onCreate.call(fakeRoom, {});
    expect(fakeRoom["_listing"].unlisted).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Describe 4: notifyTournamentEnd — practice guard
// ─────────────────────────────────────────────────────────────────────

describe("ChiribitoRoom notifyTournamentEnd — practice mode guard", () => {
  beforeEach(() => {
    (reportTournamentGameEnded as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("still sends gameResult to every human client (practice keeps the broadcast)", () => {
    const champion = { sessionId: "human-1", name: "Champion", chips: 4000 };
    const sendHuman = jest.fn();

    const fakeRoom: any = {
      isPractice: true,
      clients: [{ sessionId: "human-1", send: sendHuman, leave: jest.fn() }],
      broadcast: jest.fn(),
      clock: { setTimeout: jest.fn() },
      disconnect: jest.fn(),
      reportTournamentStats: jest.fn(),
    };

    ChiribitoRoom.prototype.notifyTournamentEnd.call(fakeRoom, champion);

    expect(sendHuman).toHaveBeenCalledWith("gameResult", { result: "won", champion });
  });

  it("broadcasts practiceEnd with { champion } for practice rooms", () => {
    const champion = { sessionId: "human-1", name: "Champion", chips: 4000 };

    const fakeRoom: any = {
      isPractice: true,
      clients: [{ sessionId: "human-1", send: jest.fn(), leave: jest.fn() }],
      broadcast: jest.fn(),
      clock: { setTimeout: jest.fn() },
      disconnect: jest.fn(),
      reportTournamentStats: jest.fn(),
    };

    ChiribitoRoom.prototype.notifyTournamentEnd.call(fakeRoom, champion);

    expect(fakeRoom.broadcast).toHaveBeenCalledWith(
      "practiceEnd",
      expect.objectContaining({ champion })
    );
  });

  it("does NOT call reportTournamentStats in practice mode", () => {
    const champion = { sessionId: "human-1", name: "Champion", chips: 4000 };
    const reportTournamentStatsMock = jest.fn();

    const fakeRoom: any = {
      isPractice: true,
      clients: [{ sessionId: "human-1", send: jest.fn(), leave: jest.fn() }],
      broadcast: jest.fn(),
      clock: { setTimeout: jest.fn() },
      disconnect: jest.fn(),
      reportTournamentStats: reportTournamentStatsMock,
    };

    ChiribitoRoom.prototype.notifyTournamentEnd.call(fakeRoom, champion);

    expect(reportTournamentStatsMock).not.toHaveBeenCalled();
  });

  it("does NOT call clock.setTimeout (no 800ms disconnect) in practice mode", () => {
    const champion = { sessionId: "human-1", name: "Champion", chips: 4000 };
    const clockSetTimeout = jest.fn();

    const fakeRoom: any = {
      isPractice: true,
      clients: [{ sessionId: "human-1", send: jest.fn(), leave: jest.fn() }],
      broadcast: jest.fn(),
      clock: { setTimeout: clockSetTimeout },
      disconnect: jest.fn(),
      reportTournamentStats: jest.fn(),
    };

    ChiribitoRoom.prototype.notifyTournamentEnd.call(fakeRoom, champion);

    expect(clockSetTimeout).not.toHaveBeenCalled();
  });

  it("does NOT call disconnect in practice mode", () => {
    const champion = { sessionId: "human-1", name: "Champion", chips: 4000 };
    const disconnect = jest.fn();

    const fakeRoom: any = {
      isPractice: true,
      clients: [{ sessionId: "human-1", send: jest.fn(), leave: jest.fn() }],
      broadcast: jest.fn(),
      clock: { setTimeout: jest.fn() },
      disconnect,
      reportTournamentStats: jest.fn(),
    };

    ChiribitoRoom.prototype.notifyTournamentEnd.call(fakeRoom, champion);

    expect(disconnect).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────
// Describe 5: notifyTournamentEnd — non-practice regression (else-branch)
// ─────────────────────────────────────────────────────────────────────

describe("ChiribitoRoom notifyTournamentEnd — non-practice regression", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls reportTournamentStats for non-practice rooms", () => {
    const champion = { sessionId: "champ", name: "Champ", chips: 2000 };
    const reportTournamentStatsMock = jest.fn();
    let scheduledCb: (() => void) | null = null;
    const clockSetTimeout = jest.fn((cb: () => void) => { scheduledCb = cb; return 0; });
    const leave = jest.fn();
    const disconnect = jest.fn();

    const fakeRoom: any = {
      // isPractice NOT set (undefined) → non-practice path
      clients: [{ sessionId: "champ", send: jest.fn(), leave }],
      broadcast: jest.fn(),
      clock: { setTimeout: clockSetTimeout },
      disconnect,
      reportTournamentStats: reportTournamentStatsMock,
    };

    ChiribitoRoom.prototype.notifyTournamentEnd.call(fakeRoom, champion);

    expect(reportTournamentStatsMock).toHaveBeenCalledTimes(1);
    expect(clockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 800);
    expect(disconnect).not.toHaveBeenCalled();

    // Invoke scheduled callback to confirm disconnect fires
    if (scheduledCb) scheduledCb();
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(leave).toHaveBeenCalledWith(CUSTOM_GAME_END, "GAME_END");
  });
});

// ─────────────────────────────────────────────────────────────────────
// Describe 6: playAgain handler
// ─────────────────────────────────────────────────────────────────────

describe("ChiribitoRoom playAgain handler", () => {
  let seedBotsSpy: jest.SpyInstance;
  let startNewHandSpy: jest.SpyInstance;

  beforeEach(() => {
    seedBotsSpy = jest.spyOn(BotController.prototype, "seedBots").mockImplementation(() => {});
    // Spy on GameEngine.prototype.startNewHand to prevent real execution
    // (the real impl calls state.resetDeck() which requires a real MesaState).
    startNewHandSpy = jest.spyOn(GameEngine.prototype, "startNewHand").mockImplementation(() => {});
  });

  afterEach(() => {
    seedBotsSpy.mockRestore();
    startNewHandSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("re-seeds all players chips=1000, currentBet=0, isFolded=false and calls startNewHand", () => {
    // Capture the onMessage handlers registered in onCreate
    const messageHandlers: Map<string, (client: any, data?: any) => void> = new Map();
    const fakeRoom = makeOnCreateRoom();
    fakeRoom.onMessage = jest.fn((type: string, cb: (client: any, data?: any) => void) => {
      messageHandlers.set(type, cb);
    });

    // Set up state with two players with depleted chips (after a tournament).
    // Note: onCreate also creates a real GameEngine (this.engine = new GameEngine(this))
    // but startNewHandSpy intercepts it so no real state calls are made.
    fakeRoom.state = {
      users: new Map([
        ["human-1", { chips: 0, currentBet: 200, isFolded: true }],
        ["bot-1", { chips: 3000, currentBet: 0, isFolded: false, isBot: true }],
      ]),
      roundStarted: false,
    };

    // Run onCreate to register all message handlers (creates real GameEngine+BotController)
    ChiribitoRoom.prototype.onCreate.call(fakeRoom, { mode: "practice", botCount: 1 });

    // Retrieve the playAgain handler registered by onCreate
    const playAgainHandler = messageHandlers.get("playAgain");
    expect(playAgainHandler).toBeDefined();

    // Invoke the handler as a client would
    const fakeClient = { sessionId: "human-1" };
    playAgainHandler!(fakeClient);

    // All players reset to chips=1000
    expect(fakeRoom.state.users.get("human-1").chips).toBe(1000);
    expect(fakeRoom.state.users.get("bot-1").chips).toBe(1000);

    // Bet amounts cleared
    expect(fakeRoom.state.users.get("human-1").currentBet).toBe(0);
    expect(fakeRoom.state.users.get("bot-1").currentBet).toBe(0);

    // isFolded cleared
    expect(fakeRoom.state.users.get("human-1").isFolded).toBe(false);

    // roundStarted set to true before startNewHand
    expect(fakeRoom.state.roundStarted).toBe(true);

    // startNewHand called (via the spy)
    expect(startNewHandSpy).toHaveBeenCalledTimes(1);
  });

  it("playAgain is a no-op mid-hand (roundStarted guard) — no re-seed, no startNewHand (CR-01)", () => {
    // CR-01: a client must not be able to send playAgain while a hand is live
    // to refill every stack to 1000 and force a re-deal (integrity/griefing).
    // With roundStarted=true the handler returns before touching any state.
    const messageHandlers: Map<string, (client: any, data?: any) => void> = new Map();
    const fakeRoom = makeOnCreateRoom();
    fakeRoom.onMessage = jest.fn((type: string, cb: (client: any, data?: any) => void) => {
      messageHandlers.set(type, cb);
    });

    // Live hand in progress: a losing human sits at 0, a bot holds chips.
    fakeRoom.state = {
      users: new Map([
        ["human-1", { chips: 0, currentBet: 200, isFolded: true }],
        ["bot-1", { chips: 3000, currentBet: 0, isFolded: false, isBot: true }],
      ]),
      roundStarted: true, // ← hand IS live
    };

    ChiribitoRoom.prototype.onCreate.call(fakeRoom, { mode: "practice", botCount: 1 });

    const playAgainHandler = messageHandlers.get("playAgain");
    expect(playAgainHandler).toBeDefined();

    playAgainHandler!({ sessionId: "human-1" });

    // No re-seed: chips untouched (the losing human is NOT refilled to 1000).
    expect(fakeRoom.state.users.get("human-1").chips).toBe(0);
    expect(fakeRoom.state.users.get("human-1").currentBet).toBe(200);
    expect(fakeRoom.state.users.get("human-1").isFolded).toBe(true);
    expect(fakeRoom.state.users.get("bot-1").chips).toBe(3000);

    // roundStarted stays true (the live hand is not disturbed).
    expect(fakeRoom.state.roundStarted).toBe(true);

    // startNewHand is NOT called → no re-deal mid-hand.
    expect(startNewHandSpy).not.toHaveBeenCalled();
  });

  it("playAgain is a no-op on non-practice rooms (isPractice guard)", () => {
    const messageHandlers: Map<string, (client: any) => void> = new Map();
    const fakeRoom = makeOnCreateRoom();
    fakeRoom.onMessage = jest.fn((type: string, cb: (client: any) => void) => {
      messageHandlers.set(type, cb);
    });
    fakeRoom.state = {
      users: new Map([["human-1", { chips: 0, currentBet: 0, isFolded: false }]]),
      roundStarted: false,
    };

    // Non-practice onCreate
    ChiribitoRoom.prototype.onCreate.call(fakeRoom, {});

    const playAgainHandler = messageHandlers.get("playAgain");

    if (playAgainHandler) {
      // Handler exists but must do nothing for non-practice rooms
      playAgainHandler({ sessionId: "human-1" });
      expect(startNewHandSpy).not.toHaveBeenCalled();
    }
    // If the handler is not registered at all for non-practice, that's also acceptable
    // (the test is: startNewHand must NOT be called)
    expect(startNewHandSpy).not.toHaveBeenCalled();
  });

  it("clears a stale active turnTimeout before re-dealing (clearTimeout branch)", () => {
    const messageHandlers: Map<string, (client: any, data?: any) => void> = new Map();
    const fakeRoom = makeOnCreateRoom();
    fakeRoom.onMessage = jest.fn((type: string, cb: (client: any, data?: any) => void) => {
      messageHandlers.set(type, cb);
    });
    fakeRoom.state = {
      users: new Map([
        ["human-1", { chips: 0, currentBet: 50, isFolded: false }],
        ["bot-1", { chips: 2000, currentBet: 0, isFolded: false, isBot: true }],
      ]),
      roundStarted: false,
    };
    ChiribitoRoom.prototype.onCreate.call(fakeRoom, { mode: "practice", botCount: 1 });

    // A stale turn timer lingers from the finished hand → the handler must clear it.
    const staleTimer = setTimeout(() => {}, 100000);
    fakeRoom.turnTimeout = staleTimer;

    messageHandlers.get("playAgain")!({ sessionId: "human-1" });

    expect(fakeRoom.turnTimeout).toBeNull();
    expect(startNewHandSpy).toHaveBeenCalledTimes(1);
    clearTimeout(staleTimer);
  });

  it("returns early (no startNewHand, no throw) when state.users is missing — WR-04 guard", () => {
    const messageHandlers: Map<string, (client: any, data?: any) => void> = new Map();
    const fakeRoom = makeOnCreateRoom();
    fakeRoom.onMessage = jest.fn((type: string, cb: (client: any, data?: any) => void) => {
      messageHandlers.set(type, cb);
    });
    // Practice, not mid-hand, but a degenerate state with no users map.
    fakeRoom.state = { roundStarted: false };
    ChiribitoRoom.prototype.onCreate.call(fakeRoom, { mode: "practice", botCount: 1 });

    const handler = messageHandlers.get("playAgain")!;
    expect(() => handler({ sessionId: "human-1" })).not.toThrow();
    expect(startNewHandSpy).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────
// Describe 7: dispose-on-empty
// ─────────────────────────────────────────────────────────────────────

describe("ChiribitoRoom onLeave — dispose-on-empty (practice)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls disconnect when isPractice and clients.length === 0 after leave", async () => {
    const handleLeave = jest.fn().mockResolvedValue(undefined);
    const tryGameEnd = jest.fn();
    const disconnect = jest.fn();
    const client = { sessionId: "human-1" };

    const fakeRoom: any = {
      isPractice: true,
      // After this client leaves, the array will be empty
      clients: [] as any[],
      lifecycleManager: { handleLeave },
      engine: { tryGameEnd },
      state: {},
      sessionManager: {},
      seatManager: {},
      connectionMonitor: {},
      analytics: {},
      playersInHand: [],
      broadcast: jest.fn(),
      allowReconnection: jest.fn().mockResolvedValue(undefined),
      disconnect,
    };

    await ChiribitoRoom.prototype.onLeave.call(fakeRoom, client as any, 4000);

    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("does NOT call disconnect when isPractice but a human still remains", async () => {
    const handleLeave = jest.fn().mockResolvedValue(undefined);
    const tryGameEnd = jest.fn();
    const disconnect = jest.fn();
    const client = { sessionId: "human-1" };

    const fakeRoom: any = {
      isPractice: true,
      // Another human client remains after this leave
      clients: [{ sessionId: "human-2" }] as any[],
      lifecycleManager: { handleLeave },
      engine: { tryGameEnd },
      state: {},
      sessionManager: {},
      seatManager: {},
      connectionMonitor: {},
      analytics: {},
      playersInHand: [],
      broadcast: jest.fn(),
      allowReconnection: jest.fn().mockResolvedValue(undefined),
      disconnect,
    };

    await ChiribitoRoom.prototype.onLeave.call(fakeRoom, client as any, 4000);

    expect(disconnect).not.toHaveBeenCalled();
  });

  it("does NOT call disconnect for non-practice rooms even when clients.length === 0", async () => {
    const handleLeave = jest.fn().mockResolvedValue(undefined);
    const tryGameEnd = jest.fn();
    const disconnect = jest.fn();
    const client = { sessionId: "human-1" };

    const fakeRoom: any = {
      // isPractice NOT set (undefined) — non-practice room
      clients: [] as any[],
      lifecycleManager: { handleLeave },
      engine: { tryGameEnd },
      state: {},
      sessionManager: {},
      seatManager: {},
      connectionMonitor: {},
      analytics: {},
      playersInHand: [],
      broadcast: jest.fn(),
      allowReconnection: jest.fn().mockResolvedValue(undefined),
      disconnect,
    };

    await ChiribitoRoom.prototype.onLeave.call(fakeRoom, client as any, 4000);

    expect(disconnect).not.toHaveBeenCalled();
  });
});
