/**
 * BotController.ts
 *
 * Room-scoped manager that drives bot turns autonomously.
 *
 * Placement: src/rooms/managers/ — same pattern as the 7 existing room managers
 * (SessionManager, SeatManager, etc.). Bots are an impure, room-scoped concern:
 * they hold per-bot rng state and call engine.handle* with side effects. This
 * separates the impure layer from BotStrategy (pure, in game/bots/).
 *
 * Flow:
 *   GameEngine.startTurnTimer()
 *     → this.room.onTurnStarted?.(currentTurn)     [one hook line, Task 1]
 *       → BotController.onTurnStarted(sessionId)
 *         → schedule act via room.scheduleDelayed   [think-delay]
 *           → act(botSessionId)
 *             → BotStrategy.decide(situation, profile, rng)
 *             → engine.handle*(botStub)
 *
 * Security/correctness guarantees:
 *  - T-03-02: schedule via room.scheduleDelayed (Colyseus Clock). On room dispose the
 *    Colyseus Clock teardown cancels any pending Delayed timer — that framework safety net
 *    is the mechanism that actually stops a not-yet-fired bot callback. This controller does
 *    NOT (and cannot) cancel the Delayed itself: scheduleDelayed returns void (engine-frozen
 *    contract) and clearTimeout(Delayed) is a no-op against a Colyseus Clock handle. What the
 *    controller DOES own is a stronger, self-contained guarantee: after clearAll()/dispose,
 *    any think-delay callback that still fires performs NO engine action (the `disposed` flag
 *    short-circuits act(), and the cleared botRegistry makes the !entry guard fire too).
 *  - T-03-03: idempotency guard in act() — if currentTurn != botSessionId, return.
 *  - T-03-04: raise routes to handleRaise(delta), never handleBet (avoids silent rejection).
 *  - T-03-05: synthetic NEGATIVE userId for occupySeat (never collides with DB userIds).
 *  - Defensive throughout: game server has strictNullChecks:false — all .get() calls guarded.
 *
 * Scheduler contract (Phase 4 note): scheduleDelayed MUST be asynchronous in production
 * (the Colyseus Clock runs act() on a later tick, so act → handle* → endTurn → startTurnTimer
 * → onTurnStarted unwinds between turns). A SYNCHRONOUS scheduler — e.g. the test double
 * `scheduleDelayed: (cb) => cb()` — completes a bot turn INSIDE the engine call stack of the
 * preceding action. With a single bot broken by a human turn that is harmless, but with
 * MULTIPLE bots (bot→bot chaining) a synchronous scheduler would recurse one stack frame per
 * bot action for an entire hand and could exhaust the stack. Phase 4 (N bots) MUST keep the
 * production scheduler async and/or use a deferred (trampolined) scheduler in tests — never
 * `(cb) => cb()` for the bot-vs-bot path.
 */

import { BotStrategy } from "../game/bots/BotStrategy";
import type { BotProfile } from "../game/bots/profiles";
import type { IGameRoom, ActionClient } from "../../types/IGameRoom";
import type { GameEngine } from "../game/GameEngine";
import { Player, PLAYER_STATUS } from "../schema/MesaState";
import type { SeatManager } from "./SeatManager";

// ─────────────────────────────────────────────────────────────────────
// Per-bot registry entry
// ─────────────────────────────────────────────────────────────────────

interface BotEntry {
  profile: BotProfile;
  rng: () => number;
}

// ─────────────────────────────────────────────────────────────────────
// BotController
// ─────────────────────────────────────────────────────────────────────

export class BotController {
  /** Per-bot profile + rng registry, keyed by sessionId ("bot-1", "bot-2", …). */
  private botRegistry: Map<string, BotEntry> = new Map();

  /**
   * Pending think-delay handles keyed by bot sessionId. These come from
   * room.scheduleDelayed, which returns void (engine-frozen contract), so in
   * production the stored value is `undefined` and this Map is purely a record of
   * "a bot turn is in flight" — it is NOT a cancellation mechanism. Real cancellation
   * of the underlying Colyseus Delayed happens via the Clock's own dispose teardown.
   * clearAll() empties this Map and flips `disposed` so any callback that still fires
   * is a no-op (see act()).
   */
  private pendingHandles: Map<string, ReturnType<typeof setTimeout>> = new Map();

  /**
   * Set true by clearAll()/dispose. Once disposed, act() short-circuits before any
   * engine call, so a think-delay callback that fires after the room is torn down
   * performs NO game action. This is the genuine cleanup guarantee the controller owns
   * (clearTimeout against a Colyseus Delayed is a no-op, and scheduleDelayed returns
   * void, so we cannot rely on cancelling the handle itself).
   */
  private disposed = false;

  constructor(
    private room: IGameRoom,
    private engine: GameEngine
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // Public: hook delegate — called by ChiribitoRoom.onTurnStarted
  // ─────────────────────────────────────────────────────────────────

  /**
   * Reacts to every turn-start fired by GameEngine.startTurnTimer.
   * Fast no-op for human turns. Schedules act() for bot turns.
   */
  onTurnStarted(sessionId: string): void {
    // Disposed room: never schedule a new bot turn.
    if (this.disposed) return;

    const player = this.room.state.users.get(sessionId);
    // Defensive guard: undefined player (strictNullChecks:false) or human → no-op
    if (!player || !player.isBot) return;

    const entry = this.botRegistry.get(sessionId);
    if (!entry) return;

    const [min, max] = entry.profile.thinkMsRange;
    // Reuse the bot's rng for the think-delay (deterministic in tests under fixed seed)
    const thinkMs = Math.round(min + entry.rng() * (max - min));

    // Schedule act via room.scheduleDelayed (Colyseus Clock, not raw setTimeout).
    // PRODUCTION: the Clock fires this on a LATER tick — act() runs after the current
    // call stack unwinds (see "Scheduler contract" in the header). The returned value is
    // void in production, so `handle` is undefined; pendingHandles is a liveness record,
    // not a cancellation token. Cancellation-on-dispose is handled by the disposed flag.
    // TEST ONLY: a synchronous double `scheduleDelayed: (cb) => cb()` fires act() inline.
    // That is safe for 1 bot (a human turn breaks the chain) but UNSAFE for bot-vs-bot —
    // Phase 4 must keep production async / use a deferred test scheduler (header note).
    const handle = this.room.scheduleDelayed(() => {
      this.act(sessionId);
    }, thinkMs) as any;

    this.pendingHandles.set(sessionId, handle);
  }

  // ─────────────────────────────────────────────────────────────────
  // Public: register a bot without seeding a Player (used by tests
  // that set up Players manually and just need the rng/profile).
  // ─────────────────────────────────────────────────────────────────

  registerBot(sessionId: string, profile: BotProfile, rng: () => number): void {
    this.botRegistry.set(sessionId, { profile, rng });
  }

  // ─────────────────────────────────────────────────────────────────
  // Public: seeding helper
  // ─────────────────────────────────────────────────────────────────

  /**
   * Seed `count` bot Player entries into room.state.users.
   *
   * @param count  Number of bots to add (stops gracefully if room is full).
   * @param opts
   *   chips        - Starting chip count (mirror the human's initial stack, default 1000).
   *   profiles     - Ordered BotProfile array; each bot at index i gets profiles[i % profiles.length].
   *                  Use CASTIZO_ROSTER for production (6 distinct castizo profiles).
   *                  Pass a single-element array [BOT_TIGHT] in tests for uniform seeding.
   *   seatManager  - SeatManager instance for seat acquisition.
   *   rng          - Optional seeded rng base; if provided, each bot derives an independent
   *                  seed from it (advanced per-index) to avoid correlated decision sequences.
   *                  If omitted, each bot gets a per-seat Math.random-based rng.
   */
  seedBots(
    count: number,
    opts: {
      chips?: number;
      profiles: BotProfile[];
      seatManager: SeatManager;
      rng?: () => number;
    }
  ): void {
    const chips = opts.chips ?? 1000;
    const state = this.room.state;

    // WR-01 (defensive, strictNullChecks:false): an empty roster makes `i % 0`
    // NaN → profiles[NaN] undefined → profile.name throws inside the loop. seedBots
    // is a public reusable surface, so guard it (CON-strictnullchecks-defensive).
    if (!opts.profiles || opts.profiles.length === 0) return;

    for (let i = 0; i < count; i++) {
      const seat = opts.seatManager.getNextAvailableSeat();
      if (seat === null) break; // room full — stop gracefully

      // Pick distinct profile per bot position (wraps safely via %)
      const profile = opts.profiles[i % opts.profiles.length];

      // sessionId scheme: "bot-1", "bot-2", … — visually distinct from Colyseus UUIDs
      const sessionId = `bot-${seat + 1}`;

      // Create the Player entry
      const player = new Player(sessionId);
      // T-03-05: set isBot FIRST (Pitfall 5) before any other field
      player.isBot = true;
      player.name = profile.name;
      // Phase 6: set the castizo avatar key for frontend glyph resolution
      player.avatar = profile.avatar ?? "";
      player.chips = chips;
      player.seatIndex = seat;
      player.playerStatus = PLAYER_STATUS.SEATED;

      state.users.set(sessionId, player);

      // T-03-05: synthetic NEGATIVE userId — never collides with positive DB userIds
      opts.seatManager.occupySeat(seat, -(seat + 1), player.name);

      // Per-bot independent rng to avoid correlated decision sequences (anti-pattern).
      // When a seeded base rng is provided, advance it once per index to derive a
      // distinct seed-value; each bot then gets a fresh LCG at that seed.
      // In production (no rng passed), each bot gets an isolated Math.random closure.
      let botRng: () => number;
      if (opts.rng) {
        // Advance the base rng i+1 times to get a per-bot seed value, then use that
        // value to generate the bot's independent rng stream.
        const seedValue = opts.rng();
        const perBotSeed = Math.floor(seedValue * 0x100000000) ^ (seat + 1);
        let s = perBotSeed >>> 0;
        botRng = (): number => {
          s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
          return s / 0x100000000;
        };
      } else {
        // Production: each bot gets a unique seed from time + seat offset
        const productionSeed = (Date.now() ^ (seat + 1)) >>> 0;
        let s = productionSeed;
        botRng = (): number => {
          s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
          return s / 0x100000000;
        };
      }
      this.botRegistry.set(sessionId, { profile, rng: botRng });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Public: cleanup on room dispose
  // ─────────────────────────────────────────────────────────────────

  /**
   * Dispose the controller: mark it disposed and empty internal maps.
   * Called from ChiribitoRoom.onDispose alongside the other manager clearAll calls.
   *
   * What stops a pending bot turn after dispose:
   *  - The Colyseus Clock's own teardown cancels the underlying Delayed timer
   *    (the framework safety net; we do NOT — and cannot — clearTimeout it, since
   *    scheduleDelayed returns void and clearTimeout against a Colyseus Delayed is a no-op).
   *  - Independently, this controller guarantees that any callback which DOES still fire is a
   *    no-op: `disposed = true` short-circuits act() before any engine call, and clearing
   *    botRegistry makes act()'s `!entry` guard fire as a second layer.
   *
   * Idempotent: safe to call multiple times.
   */
  clearAll(): void {
    this.disposed = true;
    // Empty the liveness record (handles are void/undefined in production — nothing to cancel here).
    this.pendingHandles.clear();
    // Clear the registry so any stale callback that still fires hits the `!entry` guard in act().
    this.botRegistry.clear();
  }

  // ─────────────────────────────────────────────────────────────────
  // Private: execute the bot's decision
  // ─────────────────────────────────────────────────────────────────

  /**
   * Execute the bot's turn action.
   *
   * Guards:
   *  0. disposed → return (room torn down; any in-flight callback must do nothing).
   *  1. Remove the pending handle first (the scheduled callback has now fired).
   *  2. currentTurn !== botSessionId → return (turn already advanced, or never was ours).
   *  3. player undefined / folded / !isBot → return.
   *  4. hand not dealt in (missing or < 2 cards) → return.
   *
   * Do NOT call onTurnStarted from here — the engine's endTurn → startTurnTimer →
   * onTurnStarted chain handles the next turn. Calling it here would cause re-entrancy.
   */
  private act(botSessionId: string): void {
    // 0. Disposed room: a stale think-delay callback must perform NO engine action.
    if (this.disposed) return;

    // 1. Remove our own pending handle (it has now fired)
    this.pendingHandles.delete(botSessionId);

    const state = this.room.state;

    // 2. Idempotency: is it still this bot's turn?
    if (state.currentTurn !== botSessionId) return;

    // 3. Player existence + sanity guards
    const player = state.users.get(botSessionId);
    if (!player || player.isFolded || !player.isBot) return;

    // 4. Hand guard (strictNullChecks:false). A Player always constructs `hand` as an
    //    ArraySchema, but the deck can run dry — MesaState.dealCard() returns "" when empty,
    //    so a hand may be short/malformed in a degenerate seeding path. Don't assume structure.
    const hole = player.hand ? player.hand.toArray() : []; // ArraySchema → string[] (Pitfall 3)
    if (hole.length < 2) return; // not a dealt-in hand — nothing to act on
    const community = state.communityCards ? state.communityCards.toArray() : [];

    // 5. Build BotSituation from exact server-state reads (see RESEARCH Q3 / CONTEXT.md)
    const toCall = Math.max(0, state.currentBet - player.currentBet);

    // activeOpponents: non-folded, non-all-in players in the hand, excluding this bot
    const activeOpponents = this.room.playersInHand
      .filter((id: string) => id !== botSessionId)
      .filter((id: string) => !this.room.state.users.get(id)?.isFolded)
      .filter((id: string) => !this.room.playersAllIn.has(id))
      .length;

    const situation = {
      hole,
      community,
      phase: state.phase,
      pot: state.pot,
      currentBet: state.currentBet,
      myBet: player.currentBet,
      myChips: player.chips,
      toCall,
      activeOpponents,
    };

    // 6. Retrieve bot's registry entry
    const entry = this.botRegistry.get(botSessionId);
    if (!entry) return;

    // 7. Decide
    const decision = BotStrategy.decide(situation, entry.profile, entry.rng);

    // 8. Build ActionClient stub (Phase 2 contract — send MUST be present for type conformance)
    const stub: ActionClient = { sessionId: botSessionId, send: () => {} } as ActionClient;

    // 9. Route decision to the correct engine handler
    //    CRITICAL (T-03-04): raise → handleRaise(delta), NEVER handleBet(delta)
    //    handleRaise(stub, amount) calls handleBet(stub, currentBet + amount) internally.
    //    Calling handleBet directly with the delta (< currentBet) would be silently rejected.
    switch (decision.action) {
      case "fold":
        this.engine.handleFold(stub);
        break;
      case "check":
        this.engine.handleCheck(stub);
        break;
      case "call":
        this.engine.handleCall(stub);
        break;
      case "raise":
        this.engine.handleRaise(stub, decision.amount ?? 1);
        break;
      case "allIn":
        this.engine.handleAllIn(stub);
        break;
      default:
        // Defensive: BotDecision.action is a closed union, so this is unreachable today.
        // If it ever triggers (contract drift), fold is the only universally-legal terminal
        // action — it always advances the turn. A check here would be silently REJECTED by
        // the engine when facing a bet (toCall > 0), stalling the bot to a timeout fold — the
        // exact failure this phase exists to prevent. So default → fold, never check.
        this.engine.handleFold(stub);
    }
  }
}
