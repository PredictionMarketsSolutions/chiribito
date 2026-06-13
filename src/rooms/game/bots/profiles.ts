/**
 * profiles.ts
 *
 * BotSituation, BotDecision, BotProfile interfaces (spec §6.1 verbatim) and
 * the two synthetic test profiles used by the TDD battery in Plan 02.
 *
 * Pattern: glossary.ts — only `export interface` and `export const`, no class,
 * no default export, no @colyseus/core import, no process.env.
 *
 * Real castizo bot roster (Curro, Manola, etc.) is Phase 6.
 * These two profiles exist only to drive the deterministic unit tests.
 */

// ─────────────────────────────────────────────────────────────────────
// Situation — what the bot sees at decision time
// ─────────────────────────────────────────────────────────────────────

/**
 * Snapshot of the table from the bot's point of view.
 * All fields are plain numbers/strings — no Colyseus schema objects.
 * Built by BotController (Phase 3) from MesaState + Player fields.
 */
export interface BotSituation {
  /** 2 hole cards in canonical "<rank><suit>" format (e.g. "10O", "7C"). */
  hole: string[];
  /** 0–5 community cards revealed so far. */
  community: string[];
  /** Current game phase — one of the PHASES values: "preflop"|"card1"|...|"card5". */
  phase: string;
  /** Total chips in the pot. */
  pot: number;
  /** Table-level current bet all players must match (MesaState.currentBet). */
  currentBet: number;
  /** What this player has already put in this round (Player.currentBet). */
  myBet: number;
  /** Chips the bot still holds (Player.chips). */
  myChips: number;
  /**
   * Amount to call: Math.max(0, currentBet - myBet).
   * Pre-computed by BotController; 0 means the action is free.
   */
  toCall: number;
  /**
   * Number of non-folded, non-all-in opponents (excluding the bot itself).
   * Derived from GameUtils.getActivePlayerIds().length - 1.
   */
  activeOpponents: number;
}

// ─────────────────────────────────────────────────────────────────────
// Decision — what the bot wants to do
// ─────────────────────────────────────────────────────────────────────

/**
 * The bot's chosen action, emitted by BotStrategy.decide().
 *
 * BotController maps each action to the corresponding engine call:
 *   fold   → engine.handleFold(botClient)
 *   check  → engine.handleCheck(botClient)      ← only legal when toCall === 0
 *   call   → engine.handleCall(botClient)        ← engine computes actual chips
 *   raise  → engine.handleRaise(botClient, amount)
 *   allIn  → engine.handleAllIn(botClient)       ← engine computes total
 *
 * @see BotDecision.amount for the raise semantics note.
 */
export interface BotDecision {
  action: "fold" | "check" | "call" | "raise" | "allIn";
  /**
   * For `raise`: the DELTA (raise size) added above currentBet — NOT the
   * total bet amount. BotController passes this to engine.handleRaise().
   * Assumption A3 (RESEARCH.md): documented here so Phase 3 stays aligned.
   *
   * For `allIn`: omit (engine computes the correct amount itself).
   * For `fold`, `check`, `call`: omit (no amount parameter needed).
   *
   * @example
   * // Phase 3 BotController — `amount` is the raise DELTA above currentBet.
   * // Call handleRaise (delta), NOT handleBet (total target):
   * const decision = BotStrategy.decide(situation, profile, rng);
   * if (decision.action === "raise") {
   *   engine.handleRaise(botClient, decision.amount); // ✅ delta
   *   // engine.handleBet(botClient, decision.amount); // ❌ would be read as a
   *   //   TOTAL target < currentBet → silently rejected by _validateBetAction
   *   //   (no throw, pot unchanged, bot appears to stall then times out to fold).
   * }
   */
  amount?: number;
}

// ─────────────────────────────────────────────────────────────────────
// Profile — per-bot personality traits
// ─────────────────────────────────────────────────────────────────────

/**
 * Personality trait record for a single bot identity.
 * All numeric fields are normalized to [0, 1].
 */
export interface BotProfile {
  /** Unique machine identifier (stable across sessions). */
  id: string;
  /** Display name shown on the felt. */
  name: string;
  /** Optional avatar asset key (resolved by the frontend; Phase 6). */
  avatar?: string;
  /**
   * Scales bet/raise sizing: ~0.4–1.0× pot.
   * Injected into the sizing formula: Math.round(pot × (0.4 + 0.6 × aggression)).
   */
  aggression: number;
  /**
   * Base probability of attempting a bluff in eligible spots (toCall===0,
   * activeOpponents ≤ 2). Attenuated on later streets.
   */
  bluffFreq: number;
  /**
   * Extra margin added to the pot-odds call threshold.
   * Higher tightness → bot requires stronger hands to call.
   */
  tightness: number;
  /**
   * [min, max] simulated think-time in milliseconds.
   * Consumed by BotController (Phase 3) to add realism; not used in decide().
   */
  thinkMsRange: [number, number];
  /** Reserved for castizo flavor lines displayed in chat (Phase 6). */
  lines?: string[];
}

// ─────────────────────────────────────────────────────────────────────
// Synthetic test profiles (TDD only — real roster is Phase 6)
// ─────────────────────────────────────────────────────────────────────

/**
 * Tight test profile.
 * Low aggression, near-zero bluff frequency, high tightness.
 * Rarely bets or bluffs; requires strong pot odds to call.
 */
export const BOT_TIGHT: BotProfile = {
  id: "tight-test",
  name: "Tight Bot",
  aggression: 0.4,
  bluffFreq: 0.05,
  tightness: 0.8,
  thinkMsRange: [500, 1500]
};

/**
 * Aggressive test profile.
 * High aggression, moderate bluff frequency, low tightness.
 * Bets large, bluffs more often, and calls with weaker hands.
 */
export const BOT_AGGRESSIVE: BotProfile = {
  id: "aggressive-test",
  name: "Aggressive Bot",
  aggression: 0.9,
  bluffFreq: 0.25,
  tightness: 0.2,
  thinkMsRange: [200, 800]
};

// ─────────────────────────────────────────────────────────────────────
// Castizo roster (Phase 6) — PROVISIONAL until operator SC4 flavor sign-off
// Values are LOCKED per ROADMAP SC1; names/lines/avatars are provisional.
// ─────────────────────────────────────────────────────────────────────

/**
 * Curro el Tranquilo — mascot: pato.
 * Tight-passive: waits for strong hands, rarely bluffs, requires good pot odds to call.
 */
export const CURRO: BotProfile = {
  id: "curro-el-tranquilo",
  name: "Curro el Tranquilo",
  avatar: "pato",
  aggression: 0.3,
  bluffFreq: 0.1,
  tightness: 0.7,
  thinkMsRange: [900, 2000],
  lines: ["Pa qué el prisa...", "Yo espero mi momento, compare."],
};

/**
 * La Manola — loose-aggressive.
 * High aggression and bluff frequency; plays wide and bets big.
 */
export const MANOLA: BotProfile = {
  id: "la-manola",
  name: "La Manola",
  avatar: "manola",
  aggression: 0.8,
  bluffFreq: 0.4,
  tightness: 0.3,
  thinkMsRange: [700, 1600],
  lines: ["¡Ahí va eso, cielo!", "La Manola no se achanta."],
};

/**
 * Rufino el Toro — mascot: toro.
 * Aggressive with moderate tightness; charges in with big bets.
 */
export const RUFINO: BotProfile = {
  id: "rufino-el-toro",
  name: "Rufino el Toro",
  avatar: "toro",
  aggression: 0.75,
  bluffFreq: 0.25,
  tightness: 0.5,
  thinkMsRange: [600, 1500],
  lines: ["¡Embiste, Rufino!", "Aquí mando yo, parné."],
};

/**
 * El Chato — balanced.
 * Average traits across the board; unpredictable to opponents.
 */
export const CHATO: BotProfile = {
  id: "el-chato",
  name: "El Chato",
  avatar: "chato",
  aggression: 0.5,
  bluffFreq: 0.2,
  tightness: 0.5,
  thinkMsRange: [700, 1800],
  lines: ["Ni chicha ni limoná...", "El Chato siempre al medio."],
};

/**
 * La Paqui — tricky.
 * High bluff frequency at moderate aggression; hard to put on a hand.
 */
export const PAQUI: BotProfile = {
  id: "la-paqui",
  name: "La Paqui",
  avatar: "paqui",
  aggression: 0.55,
  bluffFreq: 0.45,
  tightness: 0.45,
  thinkMsRange: [700, 1800],
  lines: ["¡Ay, qué gracia!", "A ver quién me lee la cara, salaíllo."],
};

/**
 * Garrido — tight-aggressive.
 * High tightness with elevated aggression; waits and then strikes hard.
 */
export const GARRIDO: BotProfile = {
  id: "garrido",
  name: "Garrido",
  avatar: "garrido",
  aggression: 0.7,
  bluffFreq: 0.2,
  tightness: 0.65,
  thinkMsRange: [700, 1800],
  lines: ["Garrido espera su hora.", "Con calma y con agallas."],
};

/**
 * The full castizo roster in seating order.
 * Ordered for `BotController.seedBots({ profiles: CASTIZO_ROSTER })`.
 * Length: 6 — covers all seats in a practice table (Phase 4 clamps botCount to [1,5]).
 */
export const CASTIZO_ROSTER: BotProfile[] = [
  CURRO,
  MANOLA,
  RUFINO,
  CHATO,
  PAQUI,
  GARRIDO,
];
