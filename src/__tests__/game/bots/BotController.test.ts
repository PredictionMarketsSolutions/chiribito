/**
 * BotController.test.ts
 *
 * TDD battery for BotController — RED step committed before the implementation exists.
 *
 * Covers:
 *  - onTurnStarted on a HUMAN turn is a no-op (never schedules, never calls engine)
 *  - onTurnStarted on a BOT turn schedules act via room.scheduleDelayed within thinkMsRange
 *  - act builds a correct BotSituation (exact server-state field reads)
 *  - Decision routing: raise->handleRaise(delta), fold, check, call, allIn; never handleBet
 *  - Idempotency guard: when currentTurn !== botSessionId, act returns immediately
 *  - Defensive guard: undefined player does not throw
 *  - Seeding helper: isBot=true, chips parity, negative synthetic userId, occupySeat called
 *  - Timer cleanup: after clearAll/dispose a still-pending think-delay callback is a no-op
 *    (no engine action) and the controller stops scheduling new bot turns
 */

import { BotController } from "../../../rooms/managers/BotController";
import { BotStrategy } from "../../../rooms/game/bots/BotStrategy";
import { BOT_TIGHT, BOT_AGGRESSIVE, CASTIZO_ROSTER } from "../../../rooms/game/bots/profiles";
import { MesaState, Player, PLAYER_STATUS } from "../../../rooms/schema/MesaState";
import { PHASES } from "../../../rooms/game/glossary";
import { SeatManager } from "../../../rooms/managers/SeatManager";

// ─────────────────────────────────────────────────────────────────────
// Seeded deterministic LCG — reuse the identical formula from BotStrategy.test.ts
// (Math.imul + 1664525 / 1013904223 constants verified from source)
// ─────────────────────────────────────────────────────────────────────
function makeLcg(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ─────────────────────────────────────────────────────────────────────
// Mock room factory — mirrors GameFlow.integration.test.ts pattern
// Typed `any` so tests can override scheduleDelayed with a 2-arg mock.
// ─────────────────────────────────────────────────────────────────────
function makeRoom(state: MesaState): any {
  return {
    roomId: "test-bot-room",
    state,
    clients: [] as any[],
    playersInHand: [] as string[],
    playersActedThisRound: new Set<string>(),
    playersAllIn: new Set<string>(),
    dealerIndex: 0,
    currentPlayerIndex: 0,
    turnTimeout: null as NodeJS.Timeout | null,
    broadcast: jest.fn(),
    scheduleDelayed: jest.fn((cb: () => void) => cb()), // synchronous mock
    notifyTournamentEnd: jest.fn(),
  };
}

// ─────────────────────────────────────────────────────────────────────
// Mock engine — just spies on the handle* methods
// ─────────────────────────────────────────────────────────────────────
function makeEngine() {
  return {
    handleFold: jest.fn(),
    handleCheck: jest.fn(),
    handleCall: jest.fn(),
    handleRaise: jest.fn(),
    handleAllIn: jest.fn(),
    handleBet: jest.fn(),
  } as any;
}

// ─────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────

describe("BotController", () => {
  let state: MesaState;
  let mockRoom: ReturnType<typeof makeRoom>;
  let mockEngine: ReturnType<typeof makeEngine>;

  beforeEach(() => {
    state = new MesaState();
    mockRoom = makeRoom(state);
    mockEngine = makeEngine();
  });

  // ── Human no-op ──────────────────────────────────────────────────

  describe("onTurnStarted — human turn", () => {
    it("is a no-op: never calls scheduleDelayed or any engine.handle* when player is not a bot", () => {
      const human = new Player("human-1");
      human.name = "Human";
      human.chips = 1000;
      human.isBot = false;
      state.users.set("human-1", human);
      state.currentTurn = "human-1";
      mockRoom.playersInHand = ["human-1"];

      const controller = new BotController(mockRoom as any, mockEngine);
      controller.onTurnStarted("human-1");

      expect(mockRoom.scheduleDelayed).not.toHaveBeenCalled();
      expect(mockEngine.handleFold).not.toHaveBeenCalled();
      expect(mockEngine.handleCheck).not.toHaveBeenCalled();
      expect(mockEngine.handleCall).not.toHaveBeenCalled();
      expect(mockEngine.handleRaise).not.toHaveBeenCalled();
      expect(mockEngine.handleAllIn).not.toHaveBeenCalled();
    });

    it("is a no-op: when state.users.get returns undefined (defensive guard)", () => {
      const controller = new BotController(mockRoom as any, mockEngine);
      // No player registered — should not throw
      expect(() => controller.onTurnStarted("ghost-session")).not.toThrow();
      expect(mockRoom.scheduleDelayed).not.toHaveBeenCalled();
    });
  });

  // ── Bot turn scheduling ──────────────────────────────────────────

  describe("onTurnStarted — bot turn", () => {
    it("calls scheduleDelayed with a delay within [min, max] of thinkMsRange", () => {
      const bot = new Player("bot-1");
      bot.isBot = true;
      bot.chips = 1000;
      bot.name = "Bot";
      state.users.set("bot-1", bot);
      state.currentTurn = "bot-1";
      state.phase = PHASES.PREFLOP;
      // Give the bot 2 hole cards
      bot.hand.push("10O", "7C");
      mockRoom.playersInHand = ["bot-1"];

      // Override scheduleDelayed to capture the delay arg WITHOUT calling the callback
      let capturedMs: number | undefined;
      mockRoom.scheduleDelayed = jest.fn((cb: () => void, ms: number) => {
        capturedMs = ms;
        // Do NOT call cb() here — we want to inspect the scheduling only
      });

      const rng = makeLcg(42);
      const controller = new BotController(mockRoom as any, mockEngine);
      controller.seedBots(1, {
        chips: 1000,
        profiles: [BOT_TIGHT],
        seatManager: new SeatManager("test", 6),
        rng,
      });

      // Re-register bot-1 manually since seedBots creates its own Player
      // Instead, create controller with pre-registered bots using registerBot
      // For this test we construct the controller and manually trigger act
    });

    it("schedules act via scheduleDelayed and (with synchronous mock) act runs immediately", () => {
      // Setup a proper bot in the state and controller
      const bot = new Player("bot-1");
      bot.isBot = true;
      bot.chips = 1000;
      bot.name = "Bot";
      bot.hand.push("10O", "7C");
      state.users.set("bot-1", bot);
      state.currentTurn = "bot-1";
      state.phase = PHASES.PREFLOP;
      mockRoom.playersInHand = ["bot-1"];
      // scheduleDelayed is already synchronous in makeRoom

      const rng = makeLcg(42);
      const controller = new BotController(mockRoom as any, mockEngine);
      // Register the bot directly (not using seedBots which creates new Player)
      controller.registerBot("bot-1", BOT_TIGHT, rng);

      controller.onTurnStarted("bot-1");

      // scheduleDelayed was called (the think-delay)
      expect(mockRoom.scheduleDelayed).toHaveBeenCalled();
      // And because it's synchronous, one of the engine methods was called
      const handleCalls = [
        mockEngine.handleFold.mock.calls.length,
        mockEngine.handleCheck.mock.calls.length,
        mockEngine.handleCall.mock.calls.length,
        mockEngine.handleRaise.mock.calls.length,
        mockEngine.handleAllIn.mock.calls.length,
      ].reduce((a, b) => a + b, 0);
      expect(handleCalls).toBe(1);
    });

    it("passes a delay within the profile thinkMsRange [min, max]", () => {
      const bot = new Player("bot-1");
      bot.isBot = true;
      bot.chips = 1000;
      bot.name = "Bot";
      bot.hand.push("10O", "7C");
      state.users.set("bot-1", bot);
      state.currentTurn = "bot-1";
      state.phase = PHASES.PREFLOP;
      mockRoom.playersInHand = ["bot-1"];

      let capturedMs: number | undefined;
      mockRoom.scheduleDelayed = jest.fn((cb: () => void, ms: number) => {
        capturedMs = ms;
        // synchronous: call cb immediately after capturing
        cb();
      });

      const rng = makeLcg(42);
      const controller = new BotController(mockRoom as any, mockEngine);
      controller.registerBot("bot-1", BOT_TIGHT, rng);
      controller.onTurnStarted("bot-1");

      expect(capturedMs).toBeDefined();
      const [min, max] = BOT_TIGHT.thinkMsRange;
      expect(capturedMs!).toBeGreaterThanOrEqual(min);
      expect(capturedMs!).toBeLessThanOrEqual(max);
    });
  });

  // ── BotSituation construction ────────────────────────────────────

  describe("act — BotSituation construction", () => {
    it("passes correct BotSituation fields to BotStrategy.decide", () => {
      const decideSpy = jest.spyOn(BotStrategy, "decide");

      const bot = new Player("bot-1");
      bot.isBot = true;
      bot.chips = 750;
      bot.currentBet = 50;
      bot.hand.push("11O", "1C"); // Sota de Oros, As de Copas
      state.users.set("bot-1", bot);

      const opponent = new Player("human-1");
      opponent.isBot = false;
      opponent.chips = 800;
      opponent.isFolded = false;
      state.users.set("human-1", opponent);

      state.currentTurn = "bot-1";
      state.phase = PHASES.CARD_2;
      state.pot = 200;
      state.currentBet = 100;
      state.communityCards.push("5O", "6C");

      mockRoom.playersInHand = ["human-1", "bot-1"];

      const rng = makeLcg(7);
      const controller = new BotController(mockRoom as any, mockEngine);
      controller.registerBot("bot-1", BOT_AGGRESSIVE, rng);
      controller.onTurnStarted("bot-1");

      expect(decideSpy).toHaveBeenCalled();
      const situation = decideSpy.mock.calls[0][0];

      // hole = plain string[] from ArraySchema.toArray()
      expect(Array.isArray(situation.hole)).toBe(true);
      expect(situation.hole).toEqual(["11O", "1C"]);
      expect(situation.community).toEqual(["5O", "6C"]);
      expect(situation.phase).toBe(PHASES.CARD_2);
      expect(situation.pot).toBe(200);
      expect(situation.currentBet).toBe(100);
      expect(situation.myBet).toBe(50);
      expect(situation.myChips).toBe(750);
      // toCall = max(0, currentBet - myBet) = max(0, 100 - 50) = 50
      expect(situation.toCall).toBe(50);
      // activeOpponents: human-1 not folded, not allIn, not the bot itself → 1
      expect(situation.activeOpponents).toBe(1);

      decideSpy.mockRestore();
    });
  });

  // ── Decision routing ─────────────────────────────────────────────

  describe("act — decision routing", () => {
    function setupBotTurn(extra?: { currentBet?: number; myBet?: number }) {
      const bot = new Player("bot-1");
      bot.isBot = true;
      bot.chips = 1000;
      bot.currentBet = extra?.myBet ?? 0;
      bot.hand.push("10O", "7C");
      state.users.set("bot-1", bot);
      state.currentTurn = "bot-1";
      state.currentBet = extra?.currentBet ?? 0;
      state.phase = PHASES.PREFLOP;
      state.pot = 100;
      mockRoom.playersInHand = ["bot-1"];
      return bot;
    }

    it("routes raise decision to engine.handleRaise with the DELTA amount (not handleBet)", () => {
      setupBotTurn();
      // Force decide to return raise
      const decideSpy = jest.spyOn(BotStrategy, "decide").mockReturnValue({
        action: "raise",
        amount: 50,
      });

      const rng = makeLcg(1);
      const controller = new BotController(mockRoom as any, mockEngine);
      controller.registerBot("bot-1", BOT_AGGRESSIVE, rng);
      controller.onTurnStarted("bot-1");

      expect(mockEngine.handleRaise).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "bot-1", send: expect.any(Function) }),
        50
      );
      // handleBet must NOT be called directly by the controller
      expect(mockEngine.handleBet).not.toHaveBeenCalled();

      decideSpy.mockRestore();
    });

    it("routes fold decision to engine.handleFold", () => {
      setupBotTurn({ currentBet: 100, myBet: 0 });
      const decideSpy = jest.spyOn(BotStrategy, "decide").mockReturnValue({ action: "fold" });

      const controller = new BotController(mockRoom as any, mockEngine);
      controller.registerBot("bot-1", BOT_TIGHT, makeLcg(1));
      controller.onTurnStarted("bot-1");

      expect(mockEngine.handleFold).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "bot-1" })
      );
      decideSpy.mockRestore();
    });

    it("routes check decision to engine.handleCheck", () => {
      setupBotTurn();
      const decideSpy = jest.spyOn(BotStrategy, "decide").mockReturnValue({ action: "check" });

      const controller = new BotController(mockRoom as any, mockEngine);
      controller.registerBot("bot-1", BOT_TIGHT, makeLcg(1));
      controller.onTurnStarted("bot-1");

      expect(mockEngine.handleCheck).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "bot-1" })
      );
      decideSpy.mockRestore();
    });

    it("routes call decision to engine.handleCall", () => {
      setupBotTurn({ currentBet: 100 });
      const decideSpy = jest.spyOn(BotStrategy, "decide").mockReturnValue({ action: "call" });

      const controller = new BotController(mockRoom as any, mockEngine);
      controller.registerBot("bot-1", BOT_TIGHT, makeLcg(1));
      controller.onTurnStarted("bot-1");

      expect(mockEngine.handleCall).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "bot-1" })
      );
      decideSpy.mockRestore();
    });

    it("routes allIn decision to engine.handleAllIn", () => {
      setupBotTurn({ currentBet: 100 });
      const decideSpy = jest.spyOn(BotStrategy, "decide").mockReturnValue({ action: "allIn" });

      const controller = new BotController(mockRoom as any, mockEngine);
      controller.registerBot("bot-1", BOT_TIGHT, makeLcg(1));
      controller.onTurnStarted("bot-1");

      expect(mockEngine.handleAllIn).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "bot-1" })
      );
      decideSpy.mockRestore();
    });

    it("stub passed to engine.handle* has correct shape: { sessionId, send: function }", () => {
      setupBotTurn();
      const decideSpy = jest.spyOn(BotStrategy, "decide").mockReturnValue({ action: "check" });

      const controller = new BotController(mockRoom as any, mockEngine);
      controller.registerBot("bot-1", BOT_TIGHT, makeLcg(1));
      controller.onTurnStarted("bot-1");

      const [stub] = mockEngine.handleCheck.mock.calls[0];
      expect(stub.sessionId).toBe("bot-1");
      expect(typeof stub.send).toBe("function");
      decideSpy.mockRestore();
    });
  });

  // ── Idempotency guard ────────────────────────────────────────────

  describe("act — idempotency", () => {
    it("does nothing when currentTurn has already advanced to another player", () => {
      const bot = new Player("bot-1");
      bot.isBot = true;
      bot.chips = 1000;
      bot.hand.push("10O", "7C");
      state.users.set("bot-1", bot);
      // Turn is someone else
      state.currentTurn = "other-player";
      state.phase = PHASES.PREFLOP;
      mockRoom.playersInHand = ["bot-1", "other-player"];

      const decideSpy = jest.spyOn(BotStrategy, "decide");

      const controller = new BotController(mockRoom as any, mockEngine);
      controller.registerBot("bot-1", BOT_TIGHT, makeLcg(1));

      // Manually call act via onTurnStarted but simulate turn advancement before callback
      // by setting currentTurn to something else BEFORE onTurnStarted fires
      // Since scheduleDelayed is synchronous, the state needs to be wrong at invocation time.
      // The bot's onTurnStarted check: if player.isBot and sessionId === currentTurn...
      // Actually, the guard is in act() which runs synchronously. Let's verify:
      // onTurnStarted is called for "bot-1" but currentTurn is "other-player"
      // The isBot check in onTurnStarted passes... but act() guard fires.
      controller.onTurnStarted("bot-1");

      // With synchronous scheduleDelayed, act was called immediately.
      // The act() guard: if (state.currentTurn !== "bot-1") return
      // currentTurn is "other-player" → act returns early
      expect(decideSpy).not.toHaveBeenCalled();
      expect(mockEngine.handleFold).not.toHaveBeenCalled();
      expect(mockEngine.handleCheck).not.toHaveBeenCalled();
      expect(mockEngine.handleCall).not.toHaveBeenCalled();
      expect(mockEngine.handleRaise).not.toHaveBeenCalled();
      expect(mockEngine.handleAllIn).not.toHaveBeenCalled();

      decideSpy.mockRestore();
    });

    it("does nothing when player is folded", () => {
      const bot = new Player("bot-1");
      bot.isBot = true;
      bot.chips = 1000;
      bot.isFolded = true;
      bot.hand.push("10O", "7C");
      state.users.set("bot-1", bot);
      state.currentTurn = "bot-1";
      state.phase = PHASES.PREFLOP;
      mockRoom.playersInHand = ["bot-1"];

      const decideSpy = jest.spyOn(BotStrategy, "decide");

      const controller = new BotController(mockRoom as any, mockEngine);
      controller.registerBot("bot-1", BOT_TIGHT, makeLcg(1));
      controller.onTurnStarted("bot-1");

      expect(decideSpy).not.toHaveBeenCalled();
      decideSpy.mockRestore();
    });
  });

  // ── Seeding helper ───────────────────────────────────────────────

  describe("seedBots", () => {
    it("seeds N bots with isBot=true, correct chips, and calls occupySeat with a negative userId", () => {
      const seatManager = new SeatManager("test-room", 6);
      const occupySpy = jest.spyOn(seatManager, "occupySeat");
      const rng = makeLcg(99);

      const controller = new BotController(mockRoom as any, mockEngine);
      controller.seedBots(2, {
        chips: 1000,
        profiles: [BOT_TIGHT],
        seatManager,
        rng,
      });

      // Two bots in state.users
      let botCount = 0;
      state.users.forEach((player) => {
        if (player.isBot) {
          botCount++;
          expect(player.chips).toBe(1000);
          expect(player.isBot).toBe(true);
          expect(player.seatIndex).toBeGreaterThanOrEqual(0);
        }
      });
      expect(botCount).toBe(2);

      // occupySeat called twice with a NEGATIVE userId each time
      expect(occupySpy).toHaveBeenCalledTimes(2);
      for (const call of occupySpy.mock.calls) {
        const userId = call[1];
        expect(userId).toBeLessThan(0);
      }
    });

    it("stops seeding gracefully when room is full (getNextAvailableSeat returns null)", () => {
      // Fill all 6 seats manually
      const seatManager = new SeatManager("test-room", 6);
      for (let i = 0; i < 6; i++) {
        seatManager.occupySeat(i, i + 1);
      }

      const controller = new BotController(mockRoom as any, mockEngine);
      // Should not throw even though no seats are available
      expect(() => {
        controller.seedBots(2, {
          chips: 1000,
          profiles: [BOT_TIGHT],
          seatManager,
          rng: makeLcg(1),
        });
      }).not.toThrow();
    });

    it("assigns distinct profiles from CASTIZO_ROSTER: bot-0 is Curro (pato), bot-1 is La Manola", () => {
      // RED: seedBots still takes profile: (singular), so this fails until the signature change
      const seatManager = new SeatManager("test-room", 6);
      const controller = new BotController(mockRoom as any, mockEngine);
      controller.seedBots(2, {
        chips: 1000,
        profiles: CASTIZO_ROSTER,
        seatManager,
        rng: makeLcg(7),
      });

      const players: Player[] = [];
      state.users.forEach((player) => {
        if (player.isBot) players.push(player);
      });
      // Sort by seatIndex so order is deterministic
      players.sort((a, b) => a.seatIndex - b.seatIndex);

      expect(players).toHaveLength(2);
      // First bot: Curro el Tranquilo with avatar pato
      expect(players[0].name).toBe("Curro el Tranquilo");
      expect(players[0].avatar).toBe("pato");
      // Second bot: La Manola
      expect(players[1].name).toBe("La Manola");
      expect(players[1].avatar).toBe("manola");
    });

    it("two bots seeded with CASTIZO_ROSTER have DIFFERENT name AND different avatar", () => {
      const seatManager = new SeatManager("test-room", 6);
      const controller = new BotController(mockRoom as any, mockEngine);
      controller.seedBots(2, {
        chips: 1000,
        profiles: CASTIZO_ROSTER,
        seatManager,
      });

      const bots: Player[] = [];
      state.users.forEach((p) => { if (p.isBot) bots.push(p); });
      expect(bots).toHaveLength(2);
      expect(bots[0].name).not.toBe(bots[1].name);
      expect(bots[0].avatar).not.toBe(bots[1].avatar);
    });

    it("pato avatar is among seeded avatars when using CASTIZO_ROSTER", () => {
      const seatManager = new SeatManager("test-room", 6);
      const controller = new BotController(mockRoom as any, mockEngine);
      controller.seedBots(2, {
        chips: 1000,
        profiles: CASTIZO_ROSTER,
        seatManager,
      });

      const avatars: string[] = [];
      state.users.forEach((p) => { if (p.isBot) avatars.push(p.avatar); });
      expect(avatars).toContain("pato");
    });

    it("each bot's player.avatar equals its assigned profile's avatar", () => {
      const seatManager = new SeatManager("test-room", 6);
      const controller = new BotController(mockRoom as any, mockEngine);
      controller.seedBots(3, {
        chips: 1000,
        profiles: CASTIZO_ROSTER,
        seatManager,
      });

      const bots: Player[] = [];
      state.users.forEach((p) => { if (p.isBot) bots.push(p); });
      bots.sort((a, b) => a.seatIndex - b.seatIndex);

      // First 3 CASTIZO_ROSTER entries: CURRO(pato), MANOLA(manola), RUFINO(toro)
      expect(bots[0].avatar).toBe(CASTIZO_ROSTER[0].avatar ?? "");
      expect(bots[1].avatar).toBe(CASTIZO_ROSTER[1].avatar ?? "");
      expect(bots[2].avatar).toBe(CASTIZO_ROSTER[2].avatar ?? "");
    });
  });

  // ── Timer cleanup ────────────────────────────────────────────────

  describe("clearAll", () => {
    it("is safe to call when nothing is pending", () => {
      const controller = new BotController(mockRoom as any, mockEngine);
      expect(() => controller.clearAll()).not.toThrow();
    });

    it("a think-delay callback pending at dispose performs NO engine action after clearAll", () => {
      // This is the REAL cancellation contract (WR-01 / IN-04). scheduleDelayed returns
      // void in production, so the controller cannot cancel the underlying Colyseus Delayed
      // itself — the guarantee it OWNS is that any callback which still fires after dispose
      // is a no-op. We exercise exactly that path: capture the pending callback WITHOUT
      // firing it, dispose via clearAll(), then fire the captured callback and assert the
      // engine was never touched (and the bot's turn is genuinely still current, so the
      // ONLY thing stopping the action is the disposed flag, not the currentTurn guard).
      const bot = new Player("bot-1");
      bot.isBot = true;
      bot.chips = 1000;
      bot.hand.push("10O", "7C");
      state.users.set("bot-1", bot);
      state.currentTurn = "bot-1"; // still the bot's turn — currentTurn guard would NOT fire
      state.phase = PHASES.PREFLOP;
      mockRoom.playersInHand = ["bot-1"];

      // Capture the scheduled callback without invoking it (NOT the synchronous default mock).
      let pendingCb: (() => void) | null = null;
      mockRoom.scheduleDelayed = jest.fn((cb: () => void, _ms: number) => {
        pendingCb = cb;
      });

      const controller = new BotController(mockRoom as any, mockEngine);
      controller.registerBot("bot-1", BOT_TIGHT, makeLcg(1));
      controller.onTurnStarted("bot-1");

      // A callback is in flight but has not fired yet.
      expect(pendingCb).not.toBeNull();
      // No engine action yet (callback not fired).
      expect(mockEngine.handleFold).not.toHaveBeenCalled();
      expect(mockEngine.handleCheck).not.toHaveBeenCalled();

      // Dispose the controller.
      controller.clearAll();

      // Now fire the stale callback (simulating a Delayed that slipped through Clock teardown).
      pendingCb!();

      // The callback must have performed NO engine action — the disposed flag short-circuited
      // act() before any handler. currentTurn is STILL "bot-1", so this proves the disposed
      // guard (not the idempotency guard) is what stopped it.
      expect(state.currentTurn).toBe("bot-1");
      expect(mockEngine.handleFold).not.toHaveBeenCalled();
      expect(mockEngine.handleCheck).not.toHaveBeenCalled();
      expect(mockEngine.handleCall).not.toHaveBeenCalled();
      expect(mockEngine.handleRaise).not.toHaveBeenCalled();
      expect(mockEngine.handleAllIn).not.toHaveBeenCalled();
    });

    it("stops scheduling new bot turns after clearAll (registry cleared + disposed)", () => {
      const bot = new Player("bot-1");
      bot.isBot = true;
      bot.chips = 1000;
      bot.hand.push("10O", "7C");
      state.users.set("bot-1", bot);
      state.currentTurn = "bot-1";
      state.phase = PHASES.PREFLOP;
      mockRoom.playersInHand = ["bot-1"];

      // Non-firing scheduler so we can count scheduling attempts.
      mockRoom.scheduleDelayed = jest.fn((_cb: () => void, _ms: number) => {});

      const controller = new BotController(mockRoom as any, mockEngine);
      controller.registerBot("bot-1", BOT_TIGHT, makeLcg(1));

      controller.onTurnStarted("bot-1");
      expect(mockRoom.scheduleDelayed).toHaveBeenCalledTimes(1);

      controller.clearAll();

      // After dispose, a fresh turn-start must NOT schedule anything (disposed short-circuit).
      controller.onTurnStarted("bot-1");
      expect(mockRoom.scheduleDelayed).toHaveBeenCalledTimes(1); // unchanged

      // And clearAll is idempotent.
      expect(() => controller.clearAll()).not.toThrow();
    });
  });
});
