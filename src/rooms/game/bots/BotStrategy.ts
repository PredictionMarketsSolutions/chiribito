/**
 * BotStrategy.ts
 *
 * Pure, stateless decision brain for Chiribito bots.
 *
 * Public surface:
 *   BotStrategy.decide(situation, profile, rng): BotDecision
 *
 * Purity guarantees (required by CON-botstrategy-io and the determinism test):
 *   - NO Math.random — the injected `rng: () => number` is the ONLY randomness source.
 *   - NO @colyseus/core imports, NO IGameRoom, NO process.env.
 *   - Stateless: same seed + same situation → identical BotDecision every time.
 *
 * Made-hand strength (≥3 community cards) uses BestHand.bestHandOfN — the
 * SAME evaluation path as WinnerDeterminator. Bot and showdown can never diverge
 * (T-01-04 mitigation, shared utility from Plan 01).
 *
 * Numeric thresholds (BASE_STRENGTH values, tightness k, bluff attenuation,
 * raise threshold, sizing fraction) are within Claude's Discretion per CONTEXT.md.
 * Shapes (monotonic category mapping, pot-odds call, bluff condition) are locked.
 *
 * Pure static class — CardEvaluator pattern. Zero constructor params, no `this`.
 */

import { CardEvaluator } from "../utils/CardEvaluator";
import { BestHand } from "../utils/BestHand";
import { RANK_ORDER, PHASES } from "../glossary";
import type { BotSituation, BotDecision, BotProfile } from "./profiles";

// ─────────────────────────────────────────────────────────────────────
// Constants — tuned so the Plan-02 decision battery passes meaningfully.
// Shapes are locked; specific values are Claude's Discretion.
// ─────────────────────────────────────────────────────────────────────

/**
 * Category-to-base-strength mapping.
 * STRICTLY MONOTONIC (Pitfall 5): each value is greater than the previous.
 *   0 = Carta alta, 1 = Pareja, 2 = Doble pareja, 3 = Trío, 4 = Escalera,
 *   5 = Full,       6 = Color,  7 = Póker,         8 = Escalera de color,
 *   9 = Perla
 */
const BASE_STRENGTH: Readonly<Record<number, number>> = {
  0: 0.05,
  1: 0.22,
  2: 0.38,
  3: 0.55,
  4: 0.65,
  5: 0.75,
  6: 0.83,
  7: 0.92,
  8: 0.97,
  9: 1.00
};

/**
 * Maximum rank order value in Chiribito (As = 6).
 * Used to normalize tiebreaker fine-adjustment within a category.
 * (IN-01) Derived from glossary.RANK_ORDER so it tracks the deck automatically —
 * no silent drift if the rank order is ever re-scaled.
 */
const RANK_ORDER_MAX = Math.max(...Object.values(RANK_ORDER));

/**
 * Per-phase effective-strength discount (more caution with less information).
 * Applied after computing the raw strength to produce effectiveStrength.
 */
const PHASE_DISCOUNT: Record<string, number> = {
  [PHASES.WAITING]:  0.50,
  [PHASES.PREFLOP]:  0.55,
  [PHASES.CARD_1]:   0.65,
  [PHASES.CARD_2]:   0.75,
  [PHASES.CARD_3]:   0.88,
  [PHASES.CARD_4]:   0.94,
  [PHASES.CARD_5]:   1.00
};

/**
 * Per-phase bluff attenuation — later streets are riskier (board is more developed).
 * Multiplied with profile.bluffFreq to compute the actual bluff probability.
 */
const BLUFF_ATTENUATION: Record<string, number> = {
  [PHASES.WAITING]:  0.10,
  [PHASES.PREFLOP]:  1.00,
  [PHASES.CARD_1]:   0.90,
  [PHASES.CARD_2]:   0.80,
  [PHASES.CARD_3]:   0.60,
  [PHASES.CARD_4]:   0.40,
  [PHASES.CARD_5]:   0.20
};

/**
 * Minimum effective strength to value-bet/raise at free action (toCall === 0).
 * Must be comfortably above the Carta alta range (≈ 0.05-0.10) but below
 * the Perla-preflop effective strength (1.0 × PHASE_DISCOUNT[PREFLOP] = 0.55).
 */
const RAISE_THRESHOLD_FREE = 0.30;

/**
 * Above this effective strength, prefer raise/allIn over a plain call.
 * Chosen so Full (category 5 → 0.75 base × 1.0 at card5 = 0.75) is well above it.
 */
const RAISE_INSTEAD_OF_CALL = 0.60;

/**
 * Above this effective strength, consider going allIn.
 * Set at Póker level (category 7 → 0.92 base × 1.0 = 0.92 at card5).
 */
const VERY_STRONG_THRESHOLD = 0.85;

/**
 * Scale factor for the tightness margin on pot-odds call threshold.
 * Actual margin = profile.tightness × TIGHTNESS_K.
 * Kept small so even tight bots will call with decent hands.
 */
const TIGHTNESS_K = 0.15;

// ─────────────────────────────────────────────────────────────────────
// BotStrategy class
// ─────────────────────────────────────────────────────────────────────

export class BotStrategy {
  // ──────────────────────────────────────────────
  // Public surface
  // ──────────────────────────────────────────────

  /**
   * Compute the bot's next action.
   *
   * @param situation  Snapshot of the table from the bot's perspective.
   * @param profile    Personality traits controlling sizing and tendencies.
   * @param rng        Seeded RNG — the ONLY randomness source (injected for determinism).
   *                   Never call Math.random() inside this method.
   */
  static decide(
    situation: BotSituation,
    profile: BotProfile,
    rng: () => number
  ): BotDecision {
    const { myChips, toCall, pot, activeOpponents } = situation;

    // (A) Compute effective strength (raw strength × phase discount)
    const rawStrength = BotStrategy.computeStrength(situation);
    // (IN-02) PHASE_DISCOUNT maps all seven PHASES values; an unmapped phase
    // hitting this `?? 0.55` fallback indicates a Phase 3 caller bug (bad phase string).
    const phaseDiscount = PHASE_DISCOUNT[situation.phase] ?? 0.55;
    const effectiveStrength = Math.min(1, rawStrength * phaseDiscount);

    // (B) Pot odds
    const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0;

    // (C) Forced all-in branch: toCall >= myChips (Engine: allIn, not call)
    //     Never emit 'call' here — it would be a silent mis-handle.
    //     (WR-01) When forced all-in the bot can only ever commit `myChips`,
    //     never the full `toCall`. The real price it pays is `myChips`, so its
    //     true pot odds are myChips/(pot+myChips) — strictly more favorable than
    //     the toCall-based figure whenever toCall > myChips. Using `toCall` here
    //     would make short-stacked bots fold cheap all-in calls a covering pot
    //     justifies. Keep the `myChips > 0` defensive guard (strictNullChecks:false).
    if (toCall >= myChips && myChips > 0) {
      const allInCost = myChips; // bot can only put in its stack
      const allInPotOdds = allInCost / (pot + allInCost);
      // Go all-in only when strength justifies the (corrected) pot odds.
      if (effectiveStrength > allInPotOdds || effectiveStrength >= RAISE_INSTEAD_OF_CALL) {
        return { action: "allIn" };
      }
      return { action: "fold" };
    }

    // (D) myChips === 0 — nothing left to do
    if (myChips <= 0) {
      return { action: "check" };
    }

    // (E) Facing a bet (toCall > 0)
    if (toCall > 0) {
      const tightnessMargin = profile.tightness * TIGHTNESS_K;
      const callThreshold = potOdds + tightnessMargin;

      // Very strong hand → aggressive raise or all-in
      if (effectiveStrength >= VERY_STRONG_THRESHOLD) {
        // Prefer all-in at the very top; raise otherwise
        if (rng() < profile.aggression) {
          return { action: "allIn" };
        }
        const amount = BotStrategy.raiseDelta(situation, profile);
        return { action: "raise", amount };
      }

      // Strong enough to raise instead of just call
      if (effectiveStrength >= RAISE_INSTEAD_OF_CALL) {
        // Raise with probability scaled by aggression; call otherwise
        if (rng() < profile.aggression * 0.6) {
          const amount = BotStrategy.raiseDelta(situation, profile);
          return { action: "raise", amount };
        }
        return { action: "call" };
      }

      // Call when pot odds justify it
      if (effectiveStrength > callThreshold) {
        return { action: "call" };
      }

      // Insufficient strength or odds → fold
      return { action: "fold" };
    }

    // (F) Free action (toCall === 0)
    // Value bet/raise with decent strength
    if (effectiveStrength >= RAISE_THRESHOLD_FREE) {
      const amount = BotStrategy.raiseDelta(situation, profile);
      return { action: "raise", amount };
    }

    // Bluff branch: only when activeOpponents <= 2 (per CONTEXT.md locked policy)
    if (activeOpponents <= 2) {
      // (IN-02) BLUFF_ATTENUATION maps all seven PHASES values; an unmapped phase
      // hitting this `?? 0.5` fallback indicates a Phase 3 caller bug (bad phase string).
      const bluffAttenuation = BLUFF_ATTENUATION[situation.phase] ?? 0.5;
      const bluffFreqAttenuated = profile.bluffFreq * bluffAttenuation;
      if (rng() < bluffFreqAttenuated) {
        const amount = BotStrategy.raiseDelta(situation, profile);
        return { action: "raise", amount };
      }
    }

    // Weak hand, no bluff → free check
    return { action: "check" };
  }

  // ──────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────

  /**
   * Compute raw hand strength ∈ [0, 1] (before phase discount).
   *
   * Uses BestHand.bestHandOfN (shared evaluation path with WinnerDeterminator)
   * when ≥3 community cards are available; falls back to the preflop heuristic
   * for earlier streets.
   */
  private static computeStrength(situation: BotSituation): number {
    const { hole, community } = situation;

    // Defensive guard for missing hole cards (strictNullChecks: false environment)
    if (!hole || hole.length < 2) {
      return 0.02; // very low but non-zero so fold path works cleanly
    }

    // Made-hand strength: use shared BestHand utility (≥3 community cards)
    if (community && community.length >= 3) {
      const result = BestHand.bestHandOfN(hole, community, { ...RANK_ORDER });
      if (result) {
        return BotStrategy.normalizeCategory(result.score.category, result.score.tiebreaker);
      }
      // bestHandOfN returned null (shouldn't happen when community.length>=3, but defensive)
    }

    // Preflop / early streets (<3 community): fixed heuristic.
    // (WR-04) For card1 (1 community) and card2 (2 community) this is intentionally
    // HOLE-ONLY in v1 — the locked "no draw detection" decision — so the revealed
    // board is ignored here. Note that `decide` then applies a RISING phase discount
    // (PHASE_DISCOUNT card1=0.65, card2=0.75) over the SAME hole-only signal:
    // confidence climbs while the information used stays flat. This is a known
    // calibration coupling, not a bug; flagged for Phase 6 tuning to revisit
    // (e.g. folding a board-paired hole card into the pair signal) rather than be
    // discovered as "bots ignore the first two streets".
    return BotStrategy.preflopHeuristic(hole);
  }

  /**
   * Normalize a made-hand category (0–9) to [0, 1] using BASE_STRENGTH, with
   * a small within-category fine-adjustment from the first tiebreaker rank value.
   *
   * Monotonicity guarantee: the fine-adjustment is bounded below the gap to the
   * next category, so the overall ordering is never violated (Pitfall 5).
   */
  private static normalizeCategory(category: number, tiebreaker: number[]): number {
    const base = BASE_STRENGTH[category] ?? 0.05;
    if (category >= 9) return 1.0; // Perla — maximum

    const nextBase = BASE_STRENGTH[category + 1] ?? 1.0;
    const gap = nextBase - base;

    // Fine-adjustment: map first tiebreaker value over [0, RANK_ORDER_MAX] → [0, 0.5×gap]
    const tbValue = tiebreaker && tiebreaker.length > 0 ? tiebreaker[0] : 0;
    const fineAdj = (tbValue / RANK_ORDER_MAX) * (gap * 0.5);

    return Math.min(nextBase - 0.001, base + fineAdj);
  }

  /**
   * Preflop / early-street strength heuristic.
   * Normalized to [0, 1].
   *
   * Priority:
   *   1. Perla (isPerla) → 1.0 (maximum strength, per spec §6.2)
   *   2. Pair → scaled by rank height: 0.35 + 0.30 × (rankValue / RANK_ORDER_MAX)
   *   3. Suited bonus: +0.07 if same suit
   *   4. Rank-height baseline: 0.05 + 0.25 × (bestRankValue / RANK_ORDER_MAX)
   *
   * Designed so:
   *   - Perla = 1.0
   *   - High pair (Aces) ≈ 0.65
   *   - Low pair (5s) ≈ 0.35
   *   - Suited high cards ≈ 0.25–0.35
   *   - Off-suit low junk ≈ 0.05–0.10
   */
  private static preflopHeuristic(hole: string[]): number {
    // Perla check first — early exit
    if (CardEvaluator.isPerla(hole)) {
      return 1.0;
    }

    // Parse both hole cards defensively
    if (hole.length < 2) return 0.02;

    const card0 = CardEvaluator.parseCard(hole[0]);
    const card1 = CardEvaluator.parseCard(hole[1]);

    // Cast to string key — RANK_ORDER is Readonly<Record<RankCode,number>> with literal keys;
    // accessing with a plain string requires a cast (strictNullChecks:false env, safe here).
    const rankValue0 = (RANK_ORDER as Record<string, number>)[card0.rank] ?? 0;
    const rankValue1 = (RANK_ORDER as Record<string, number>)[card1.rank] ?? 0;
    const bestRankValue = Math.max(rankValue0, rankValue1);

    const isPair = card0.rank === card1.rank;
    const isSuited = card0.suit === card1.suit;

    if (isPair) {
      // Pair: base 0.35, scaled up by rank height to 0.65 for top pair (Aces)
      return 0.35 + 0.30 * (bestRankValue / RANK_ORDER_MAX);
    }

    // Not a pair: rank-height baseline + suited bonus
    const baseline = 0.05 + 0.25 * (bestRankValue / RANK_ORDER_MAX);
    const suitedBonus = isSuited ? 0.07 : 0.0;
    return Math.min(0.65, baseline + suitedBonus); // cap below pair of Aces
  }

  /**
   * Compute raise delta (amount to raise ABOVE currentBet — see RESEARCH Q1 / Pitfall 1).
   *
   * INVARIANT: returns the DELTA above currentBet — Phase 3 must call
   * handleRaise(client, amount), NOT handleBet. (WR-03)
   *
   * Formula: Math.round(pot × (0.4 + 0.6 × aggression))
   * Clamped to [1, myChips - toCall] — never overbet, never zero, and reserve
   * `toCall` so the total commitment (toCall + delta) stays within the stack.
   *
   * (WR-02) The engine executes a raise as handleRaise → handleBet(currentBet+delta),
   * requiring toCall + delta chips. If the delta alone approached myChips, the
   * engine would clamp toCall+delta to myChips and flag isAllIn — silently
   * degrading a "raise" into an all-in on the wire. Reserving `toCall` here keeps
   * a raise a raise. Intentional top-of-stack aggression is unaffected: the
   * very-strong branch emits an explicit `allIn` rather than relying on this delta.
   *
   * BotController calls engine.handleRaise(botClient, amount) where amount is
   * this DELTA, NOT the total bet. (Alternatively: engine.handleBet(client, currentBet + delta))
   */
  private static raiseDelta(situation: BotSituation, profile: BotProfile): number {
    const raw = Math.round(situation.pot * (0.4 + 0.6 * profile.aggression));
    // Clamp: [1, myChips - toCall] — leave room to call first so a "raise"
    // stays a raise on the wire (legal minimum delta 1, never exceed stack).
    const maxDelta = Math.max(1, situation.myChips - situation.toCall);
    return Math.max(1, Math.min(raw, maxDelta));
  }
}

/**
 * Test-only internals (WR-05). Exposed minimally so the monotonicity invariant
 * (Pitfall 5) can be asserted directly without breaking encapsulation or
 * touching the public BotStrategy.decide signature. Not part of the runtime
 * contract — do NOT consume from production code.
 */
export const __test__ = {
  BASE_STRENGTH,
  /** Direct access to the private monotonic category→strength mapping. */
  normalizeCategory: (category: number, tiebreaker: number[]): number =>
    (BotStrategy as unknown as {
      normalizeCategory(c: number, t: number[]): number;
    }).normalizeCategory(category, tiebreaker)
} as const;
