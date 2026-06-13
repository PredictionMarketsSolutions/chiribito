/**
 * BotStrategy.test.ts
 * Full decision battery for BotStrategy.decide()
 *
 * RED step: BotStrategy.ts does not exist yet — this suite must fail with a
 * module-resolution error until the GREEN step creates it.
 *
 * Covers (per plan 01-02):
 *  - Strong hands (Trío+/Perla) raise when toCall === 0
 *  - Strong hands call/raise/allIn when facing a bet (never fold)
 *  - Weak hands check for free, fold without pot odds
 *  - Safety: never amount > myChips, check only when toCall===0, allIn when toCall>=myChips
 *  - Bluffing bounded by bluffFreq, only activeOpponents <= 2
 *  - Determinism: same seed + same situation → deep-equal BotDecision
 *  - Defensive: empty hole does not throw
 */

import { BotStrategy, __test__ } from "../../../rooms/game/bots/BotStrategy";
import { BOT_TIGHT, BOT_AGGRESSIVE, CURRO, MANOLA, RUFINO, CHATO, PAQUI, GARRIDO, CASTIZO_ROSTER, type BotSituation } from "../../../rooms/game/bots/profiles";
import { PHASES, RANK_ORDER } from "../../../rooms/game/glossary";
import { BestHand } from "../../../rooms/game/utils/BestHand";

// ─────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────

/**
 * Minimal deterministic LCG — no external dependencies.
 * Constants: multiplier 1664525, increment 1013904223 (Numerical Recipes).
 * Returns values in [0, 1).
 */
function makeLcg(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/**
 * BotSituation factory — canonical defaults represent a junk preflop hand
 * with no current bet and 2 active opponents.
 */
function makeSituation(overrides: Partial<BotSituation> = {}): BotSituation {
  return {
    hole: ["5O", "6C"],       // canonical IDs — off-suit low (Carta alta baseline)
    community: [],
    phase: PHASES.PREFLOP,
    pot: 100,
    currentBet: 0,
    myBet: 0,
    myChips: 500,
    toCall: 0,
    activeOpponents: 2,
    ...overrides
  };
}

// ─────────────────────────────────────────────────────────────────────
// Canonical hand constants (Chiribito "<rank><suit>" format)
// ─────────────────────────────────────────────────────────────────────

/** Sota + 7 de Oros — the Perla (strongest hole combination). */
const PERLA_HAND = ["10O", "7O"];

/** Trío de Caballos community gives hole ["11O","11C"] a Trío or better. */
const TRIO_HOLE = ["11O", "11C"];
const TRIO_COMMUNITY_5 = ["11E", "5B", "6O", "12C", "1O"]; // 5 community → Trío
const TRIO_COMMUNITY_3 = ["11E", "5B", "6O"];               // 3 community → Trío

/** Full House: hole ["12O","12C"], community with three 12s is impossible;
 *  instead use hole ["12O","12C"] + community giving a Full (Caballo-pair completes). */
const FULL_HOLE = ["12O", "12C"];          // pair of Reyes
const FULL_COMMUNITY_5 = ["12E", "11O", "11C", "5B", "6C"]; // full house: 3×Rey + 2×Caballo → category 5

/** Junk hole — no pair, lowest cards, off-suit. */
const JUNK_HOLE = ["5O", "6C"];

/** Pair of Ases — moderate-to-strong preflop. */
const PAIR_HOLE = ["1O", "1C"];

/** Community that gives junk hole nothing useful. */
const BLANK_COMMUNITY_3 = ["12O", "11E", "6B"];   // no pair with 5O/6C
const BLANK_COMMUNITY_5 = ["12O", "11E", "7B", "1B", "1E"]; // junk hole still no pair; community has pair

// ─────────────────────────────────────────────────────────────────────
// describe BotStrategy
// ─────────────────────────────────────────────────────────────────────

describe("BotStrategy", () => {

  // ───────────────────────────────────────────────
  // Strong hand plays aggressively
  // ───────────────────────────────────────────────
  describe("decide — strong hand plays aggressively", () => {

    it("raises with Trío or better (5-card community) when toCall === 0", () => {
      const situation = makeSituation({
        hole: TRIO_HOLE,
        community: TRIO_COMMUNITY_5,
        phase: PHASES.CARD_5,
        pot: 200,
        toCall: 0
      });
      const decision = BotStrategy.decide(situation, BOT_AGGRESSIVE, makeLcg(42));
      expect(decision.action).toBe("raise");
      expect(typeof decision.amount).toBe("number");
      expect(decision.amount as number).toBeGreaterThan(0);
    });

    it("raises with Trío (3-card community) when toCall === 0", () => {
      const situation = makeSituation({
        hole: TRIO_HOLE,
        community: TRIO_COMMUNITY_3,
        phase: PHASES.CARD_3,
        pot: 150,
        toCall: 0
      });
      const decision = BotStrategy.decide(situation, BOT_AGGRESSIVE, makeLcg(42));
      expect(["raise", "allIn"]).toContain(decision.action);
    });

    it("raises with Perla hole cards (preflop, toCall === 0)", () => {
      const situation = makeSituation({
        hole: PERLA_HAND,
        community: [],
        phase: PHASES.PREFLOP,
        pot: 100,
        toCall: 0
      });
      const decision = BotStrategy.decide(situation, BOT_AGGRESSIVE, makeLcg(7));
      expect(decision.action).toBe("raise");
      expect(typeof decision.amount).toBe("number");
      expect(decision.amount as number).toBeGreaterThan(0);
    });

    it("raises with Perla even against BOT_TIGHT profile", () => {
      const situation = makeSituation({
        hole: PERLA_HAND,
        community: [],
        phase: PHASES.PREFLOP,
        pot: 100,
        toCall: 0
      });
      const decision = BotStrategy.decide(situation, BOT_TIGHT, makeLcg(99));
      expect(decision.action).toBe("raise");
    });

    it("calls or raises when Full+ faces a bet (never folds)", () => {
      // Full house facing toCall 50, pot 200 — strong hand should NOT fold
      const situation = makeSituation({
        hole: FULL_HOLE,
        community: FULL_COMMUNITY_5,
        phase: PHASES.CARD_5,
        pot: 200,
        currentBet: 50,
        myBet: 0,
        myChips: 500,
        toCall: 50
      });
      const decision = BotStrategy.decide(situation, BOT_AGGRESSIVE, makeLcg(11));
      expect(["call", "raise", "allIn"]).toContain(decision.action);
      expect(decision.action).not.toBe("fold");
    });

    it("prefers raise/allIn with very high strength (Full+) facing a small bet", () => {
      // Full house facing tiny toCall=10, pot 200 — should prefer aggressive action
      const situation = makeSituation({
        hole: FULL_HOLE,
        community: FULL_COMMUNITY_5,
        phase: PHASES.CARD_5,
        pot: 200,
        currentBet: 10,
        myBet: 0,
        myChips: 500,
        toCall: 10
      });
      const decision = BotStrategy.decide(situation, BOT_AGGRESSIVE, makeLcg(33));
      expect(["raise", "allIn"]).toContain(decision.action);
    });

    it("raises with a pair of Ases preflop (moderate-strong hand)", () => {
      const situation = makeSituation({
        hole: PAIR_HOLE,
        community: [],
        phase: PHASES.PREFLOP,
        pot: 100,
        toCall: 0
      });
      const decision = BotStrategy.decide(situation, BOT_AGGRESSIVE, makeLcg(5));
      // Pair of Aces is strong preflop — aggressive bot should raise
      expect(["raise", "allIn"]).toContain(decision.action);
    });

  });

  // ───────────────────────────────────────────────
  // Weak hand folds or checks
  // ───────────────────────────────────────────────
  describe("decide — weak hand folds or checks", () => {

    it("checks (not raises) Carta alta when toCall === 0 (free action)", () => {
      // Junk hand, free action — should check to not build pot
      const situation = makeSituation({
        hole: JUNK_HOLE,
        community: BLANK_COMMUNITY_3,
        phase: PHASES.CARD_3,
        pot: 100,
        toCall: 0,
        // Force activeOpponents > 2 so bluff is suppressed
        activeOpponents: 3
      });
      // Use a seed that won't randomly trigger bluff (which requires opponents <= 2 anyway)
      const decision = BotStrategy.decide(situation, BOT_TIGHT, makeLcg(1));
      // With junk and activeOpponents > 2, must check or fold; toCall === 0 so fold is wasteful
      expect(decision.action).toBe("check");
    });

    it("folds Carta alta when facing a bet with bad pot odds", () => {
      // toCall 80, pot 100 → pot odds = 80/(100+80) ≈ 0.44; junk strength << 0.44
      const situation = makeSituation({
        hole: JUNK_HOLE,
        community: BLANK_COMMUNITY_3,
        phase: PHASES.CARD_3,
        pot: 100,
        currentBet: 80,
        myBet: 0,
        myChips: 500,
        toCall: 80,
        activeOpponents: 2
      });
      const decision = BotStrategy.decide(situation, BOT_TIGHT, makeLcg(2));
      expect(decision.action).toBe("fold");
    });

    it("folds junk with even worse pot odds (toCall large vs pot)", () => {
      const situation = makeSituation({
        hole: JUNK_HOLE,
        community: BLANK_COMMUNITY_5,
        phase: PHASES.CARD_5,
        pot: 50,
        currentBet: 200,
        myBet: 0,
        myChips: 500,
        toCall: 200
      });
      const decision = BotStrategy.decide(situation, BOT_TIGHT, makeLcg(3));
      expect(decision.action).toBe("fold");
    });

  });

  // ───────────────────────────────────────────────
  // Safety rules
  // ───────────────────────────────────────────────
  describe("decide — safety rules", () => {

    it("never returns amount > myChips across a varied sweep", () => {
      const chipValues = [1, 5, 10, 50, 100, 250, 500];
      const toCallValues = [0, 5, 20, 50];
      const potValues = [10, 50, 100, 500];

      let seed = 100;
      for (const myChips of chipValues) {
        for (const toCall of toCallValues) {
          if (toCall > myChips) continue; // all-in path tested separately
          for (const pot of potValues) {
            const situation = makeSituation({
              hole: PERLA_HAND, // strong hand → will try to raise
              community: TRIO_COMMUNITY_5,
              phase: PHASES.CARD_5,
              pot,
              currentBet: toCall,
              myBet: 0,
              myChips,
              toCall
            });
            const decision = BotStrategy.decide(situation, BOT_AGGRESSIVE, makeLcg(seed++));
            if (decision.amount !== undefined) {
              expect(decision.amount).toBeLessThanOrEqual(myChips);
            }
          }
        }
      }
    });

    it("only emits check when toCall === 0", () => {
      // Run across many situations; verify that action === 'check' implies toCall === 0
      const situations: BotSituation[] = [
        makeSituation({ toCall: 0 }),
        makeSituation({ toCall: 10, currentBet: 10 }),
        makeSituation({ toCall: 50, currentBet: 50, pot: 200 }),
        makeSituation({ toCall: 0, hole: JUNK_HOLE, community: BLANK_COMMUNITY_3, phase: PHASES.CARD_3, activeOpponents: 3 }),
        makeSituation({ toCall: 0, hole: PERLA_HAND }),
        makeSituation({ toCall: 5, currentBet: 5, myChips: 10 })
      ];
      situations.forEach((situation, i) => {
        const decision = BotStrategy.decide(situation, BOT_TIGHT, makeLcg(200 + i));
        if (decision.action === "check") {
          expect(situation.toCall).toBe(0);
        }
      });
    });

    it("emits allIn (not call) when toCall >= myChips with callable strength", () => {
      // Strong hand, toCall exceeds chips → must be allIn
      const situation = makeSituation({
        hole: TRIO_HOLE,
        community: TRIO_COMMUNITY_5,
        phase: PHASES.CARD_5,
        pot: 500,
        currentBet: 600,
        myBet: 0,
        myChips: 500,
        toCall: 600 // toCall >= myChips (600 >= 500)
      });
      const decision = BotStrategy.decide(situation, BOT_AGGRESSIVE, makeLcg(42));
      expect(decision.action).toBe("allIn");
      expect(decision.action).not.toBe("call");
    });

    it("folds or goes allIn (not call) when forced all-in with weak hand", () => {
      // Junk hand, toCall >= myChips → fold or allIn (never 'call')
      const situation = makeSituation({
        hole: JUNK_HOLE,
        community: BLANK_COMMUNITY_5,
        phase: PHASES.CARD_5,
        pot: 50,
        currentBet: 600,
        myBet: 0,
        myChips: 500,
        toCall: 600
      });
      const decision = BotStrategy.decide(situation, BOT_TIGHT, makeLcg(13));
      expect(["fold", "allIn"]).toContain(decision.action);
      expect(decision.action).not.toBe("call");
    });

    it("raise amount when present is >= 1 (positive legal minimum delta)", () => {
      // Strong hand free action → raise with amount >= 1
      const situation = makeSituation({
        hole: TRIO_HOLE,
        community: TRIO_COMMUNITY_5,
        phase: PHASES.CARD_5,
        pot: 100,
        toCall: 0,
        myChips: 500
      });
      const decision = BotStrategy.decide(situation, BOT_AGGRESSIVE, makeLcg(7));
      if (decision.action === "raise") {
        expect(decision.amount).toBeDefined();
        expect(decision.amount as number).toBeGreaterThanOrEqual(1);
      }
    });

    it("raise amount is always an integer when defined", () => {
      // Verify sizing rounds to integer
      const situation = makeSituation({
        hole: TRIO_HOLE,
        community: TRIO_COMMUNITY_5,
        phase: PHASES.CARD_5,
        pot: 100,
        toCall: 0,
        myChips: 500
      });
      for (let seed = 0; seed < 20; seed++) {
        const decision = BotStrategy.decide(situation, BOT_AGGRESSIVE, makeLcg(seed));
        if (decision.amount !== undefined) {
          expect(Number.isInteger(decision.amount)).toBe(true);
        }
      }
    });

  });

  // ───────────────────────────────────────────────
  // Bluffing
  // ───────────────────────────────────────────────
  describe("decide — bluffing", () => {

    it("bluff probability is bounded near bluffFreq under varied seeds", () => {
      // BOT_AGGRESSIVE has bluffFreq 0.25; junk hand, toCall 0, activeOpponents 2
      // Run 200 seeds and count bluff-raises; rate must be <= bluffFreq + tolerance
      const N = 200;
      const tolerance = 0.15; // generous tolerance for sample variance
      let bluffCount = 0;

      for (let seed = 0; seed < N; seed++) {
        const situation = makeSituation({
          hole: JUNK_HOLE,
          community: BLANK_COMMUNITY_3,
          phase: PHASES.CARD_3,
          toCall: 0,
          activeOpponents: 2
        });
        const decision = BotStrategy.decide(situation, BOT_AGGRESSIVE, makeLcg(seed));
        if (decision.action === "raise") {
          bluffCount++;
        }
      }

      const observedRate = bluffCount / N;
      expect(observedRate).toBeLessThanOrEqual(BOT_AGGRESSIVE.bluffFreq + tolerance);
      // Also confirm it is well below 1.0 (sanity guard)
      expect(observedRate).toBeLessThan(0.7);
    });

    it("bluff rate for BOT_TIGHT is near zero (bluffFreq 0.05)", () => {
      const N = 100;
      const tolerance = 0.12;
      let bluffCount = 0;

      for (let seed = 0; seed < N; seed++) {
        const situation = makeSituation({
          hole: JUNK_HOLE,
          community: BLANK_COMMUNITY_3,
          phase: PHASES.CARD_3,
          toCall: 0,
          activeOpponents: 2
        });
        const decision = BotStrategy.decide(situation, BOT_TIGHT, makeLcg(seed));
        if (decision.action === "raise") {
          bluffCount++;
        }
      }

      const observedRate = bluffCount / N;
      expect(observedRate).toBeLessThanOrEqual(BOT_TIGHT.bluffFreq + tolerance);
    });

    it("NEVER bluff-raises when activeOpponents > 2 (regardless of seed)", () => {
      // With 3 opponents, bluff condition is suppressed
      const N = 100;
      for (let seed = 0; seed < N; seed++) {
        const situation = makeSituation({
          hole: JUNK_HOLE,
          community: BLANK_COMMUNITY_3,
          phase: PHASES.CARD_3,
          toCall: 0,
          activeOpponents: 3 // > 2 → never bluff
        });
        const decision = BotStrategy.decide(situation, BOT_AGGRESSIVE, makeLcg(seed));
        // With junk hand and no pot odds, should check (not raise)
        expect(decision.action).toBe("check");
      }
    });

    it("same seed + same situation → deep-equal BotDecision (determinism)", () => {
      // Call decide() twice with the SAME seed — both calls must produce deep-equal output
      const situation = makeSituation({
        hole: JUNK_HOLE,
        community: BLANK_COMMUNITY_3,
        phase: PHASES.CARD_3,
        toCall: 0,
        activeOpponents: 2
      });

      const decision1 = BotStrategy.decide(situation, BOT_AGGRESSIVE, makeLcg(42));
      const decision2 = BotStrategy.decide(situation, BOT_AGGRESSIVE, makeLcg(42));

      expect(decision1).toEqual(decision2);
    });

    it("rng drives the bluff branch: a value below the threshold raises, a value above it checks", () => {
      // (IN-04) Proves rng actually drives the bluff branch WITHOUT coupling to the
      // LCG output distribution. The bluff condition is
      //   rng() < profile.bluffFreq × BLUFF_ATTENUATION[phase].
      // For BOT_AGGRESSIVE at CARD_3 that threshold is 0.25 × 0.60 = 0.15.
      // A stub rng returning 0.05 (below) must force a bluff-raise; one returning
      // 0.50 (above) must force a check. The junk hand's effective strength here
      // (~0.21) is below RAISE_THRESHOLD_FREE, so the value-raise branch never
      // pre-empts the bluff branch — the only thing that changes the outcome is rng.
      const situation = makeSituation({
        hole: JUNK_HOLE,
        community: BLANK_COMMUNITY_3,
        phase: PHASES.CARD_3,
        toCall: 0,
        activeOpponents: 2
      });

      const bluffThreshold = BOT_AGGRESSIVE.bluffFreq * 0.6; // attenuation(card3) = 0.60
      const belowThreshold = (): number => bluffThreshold - 0.05; // 0.10 < 0.15 → bluff
      const aboveThreshold = (): number => bluffThreshold + 0.05; // 0.20 > 0.15 → check

      const bluffed = BotStrategy.decide(situation, BOT_AGGRESSIVE, belowThreshold);
      const checked = BotStrategy.decide(situation, BOT_AGGRESSIVE, aboveThreshold);

      // rng below the threshold bluff-raises; above it checks — the two differ.
      expect(bluffed.action).toBe("raise");
      expect(checked.action).toBe("check");
      expect(bluffed.action).not.toBe(checked.action);
    });

  });

  // ───────────────────────────────────────────────
  // Defensive (empty hole / edge inputs)
  // ───────────────────────────────────────────────
  describe("decide — defensive (strictNullChecks:false guards)", () => {

    it("does not throw with empty hole array; returns safe action", () => {
      // Empty hole — defensive guard; strictNullChecks:false means no TS error, must not throw
      expect(() => {
        const situation = makeSituation({ hole: [] });
        BotStrategy.decide(situation, BOT_TIGHT, makeLcg(1));
      }).not.toThrow();
    });

    it("returns fold or check (safe action) with empty hole", () => {
      const situation = makeSituation({ hole: [], toCall: 0, activeOpponents: 3 });
      const decision = BotStrategy.decide(situation, BOT_TIGHT, makeLcg(1));
      expect(["fold", "check"]).toContain(decision.action);
    });

    it("does not throw with empty community at card3+ phase", () => {
      // Phase mismatch — community should have 3 cards at CARD_3 but may be empty
      expect(() => {
        const situation = makeSituation({
          hole: JUNK_HOLE,
          community: [],
          phase: PHASES.CARD_3
        });
        BotStrategy.decide(situation, BOT_TIGHT, makeLcg(1));
      }).not.toThrow();
    });

    it("does not throw with toCall === 0 and zero chips", () => {
      expect(() => {
        const situation = makeSituation({ myChips: 0, toCall: 0 });
        BotStrategy.decide(situation, BOT_TIGHT, makeLcg(1));
      }).not.toThrow();
    });

  });

  // ───────────────────────────────────────────────
  // Strength-category monotonicity (WR-05 / Pitfall 5)
  // ───────────────────────────────────────────────
  describe("strength-category monotonicity (Pitfall 5)", () => {

    it("BASE_STRENGTH has all ten category keys 0..9, each in (0, 1]", () => {
      const keys = Object.keys(__test__.BASE_STRENGTH)
        .map(Number)
        .sort((a, b) => a - b);
      expect(keys).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      // Every value must be a finite number in (0, 1].
      for (const k of keys) {
        const v = __test__.BASE_STRENGTH[k];
        expect(typeof v).toBe("number");
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThan(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    });

    it("BASE_STRENGTH is STRICTLY increasing 0→9 (the literal Pitfall-5 invariant)", () => {
      // Assert the base table directly, NOT via normalizeCategory: the
      // `Math.min(nextBase - 0.001, …)` clamp inside normalizeCategory can MASK a
      // de-ordered base (it pulls category c below a too-low c+1), so the table
      // itself is the only unambiguous guard. A future edit that lowers or swaps
      // any BASE_STRENGTH[c] breaks THIS test outright — genuinely meaningful.
      for (let c = 1; c <= 9; c++) {
        expect(__test__.BASE_STRENGTH[c]).toBeGreaterThan(__test__.BASE_STRENGTH[c - 1]);
      }
    });

    it("normalizeCategory(c, []) is non-decreasing and tops out at Perla (c=9 → 1.0)", () => {
      // With an empty tiebreaker the fine-adjustment is 0, so normalizeCategory
      // reads back the (clamped) base. Combined with the strict-base test above,
      // this confirms the public mapping never regresses and pins the Perla ceiling.
      const values: number[] = [];
      for (let c = 0; c <= 9; c++) {
        values.push(__test__.normalizeCategory(c, []));
      }
      for (let c = 1; c <= 9; c++) {
        expect(values[c]).toBeGreaterThan(values[c - 1]);
      }
      expect(values[9]).toBe(1.0);
    });

    it("a maxed within-category tiebreaker never crosses into the next category", () => {
      // Monotonicity must survive the fine-adjustment too: normalizeCategory(c, [max])
      // must stay strictly below the NEXT category's base (the Math.min clamp). This
      // locks that no high-kicker hand of category c ever outranks the floor of c+1.
      const RANK_MAX = Math.max(...Object.values(RANK_ORDER)); // As = 6
      for (let c = 0; c <= 8; c++) {
        const withMaxKicker = __test__.normalizeCategory(c, [RANK_MAX]);
        const nextBase = __test__.normalizeCategory(c + 1, []);
        expect(withMaxKicker).toBeLessThan(nextBase);
        // …and still at or above its own base (fine-adjustment is non-negative).
        expect(withMaxKicker).toBeGreaterThanOrEqual(__test__.normalizeCategory(c, []));
      }
    });

    it("BEHAVIORAL: real made-hand strength rises Doble pareja < Trío < Full < Póker", () => {
      // Drives the SAME mapping the brain uses (computeStrength →
      // normalizeCategory(score.category, score.tiebreaker)) over real card inputs,
      // so the monotonic ordering is asserted end-to-end through CardEvaluator +
      // BestHand, not just on the constant table. Fixtures verified to yield
      // categories 2 < 3 < 5 < 7.
      const rank = { ...RANK_ORDER };
      const strengthOf = (hole: string[], community: string[]): number => {
        const r = BestHand.bestHandOfN(hole, community, rank);
        expect(r).not.toBeNull();
        return __test__.normalizeCategory(r!.score.category, r!.score.tiebreaker);
      };

      const doblePareja = strengthOf(["11O", "11C"], ["12O", "12C", "5B", "6E", "7B"]); // cat 2
      const trio = strengthOf(["11O", "11C"], ["11E", "5B", "6O", "12C", "1O"]);        // cat 3
      const full = strengthOf(["12O", "12C"], ["12E", "11O", "11C", "5B", "6C"]);       // cat 5
      const poker = strengthOf(["12O", "12C"], ["12E", "12B", "5O", "6C", "7E"]);       // cat 7

      expect(doblePareja).toBeLessThan(trio);
      expect(trio).toBeLessThan(full);
      expect(full).toBeLessThan(poker);
    });

  });

});

// ─────────────────────────────────────────────────────────────────────
// Castizo roster — shape, locked trait values, modulation proofs
// (RED: these tests fail until profiles.ts exports the castizo consts)
// ─────────────────────────────────────────────────────────────────────

describe("Castizo roster", () => {

  // ── Roster shape ──────────────────────────────────────────────────

  it("CASTIZO_ROSTER has length 6", () => {
    expect(CASTIZO_ROSTER).toHaveLength(6);
  });

  it("each roster entry has a unique id", () => {
    const ids = CASTIZO_ROSTER.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(6);
  });

  it("roster names are exactly the locked castizo names in order", () => {
    const expectedNames = [
      "Curro el Tranquilo",
      "La Manola",
      "Rufino el Toro",
      "El Chato",
      "La Paqui",
      "Garrido",
    ];
    expect(CASTIZO_ROSTER.map((p) => p.name)).toEqual(expectedNames);
  });

  it("every const has a non-empty avatar and a thinkMsRange tuple [min, max] with min < max", () => {
    for (const p of CASTIZO_ROSTER) {
      expect(typeof p.avatar).toBe("string");
      expect(p.avatar!.length).toBeGreaterThan(0);
      expect(p.thinkMsRange).toHaveLength(2);
      expect(p.thinkMsRange[0]).toBeLessThan(p.thinkMsRange[1]);
    }
  });

  // ── Exact locked trait values ──────────────────────────────────────

  it("CURRO has exact locked traits {aggression 0.3, bluffFreq 0.1, tightness 0.7}", () => {
    expect(CURRO.aggression).toBe(0.3);
    expect(CURRO.bluffFreq).toBe(0.1);
    expect(CURRO.tightness).toBe(0.7);
  });

  it("MANOLA has exact locked traits {aggression 0.8, bluffFreq 0.4, tightness 0.3}", () => {
    expect(MANOLA.aggression).toBe(0.8);
    expect(MANOLA.bluffFreq).toBe(0.4);
    expect(MANOLA.tightness).toBe(0.3);
  });

  it("RUFINO has exact locked traits {aggression 0.75, bluffFreq 0.25, tightness 0.5}", () => {
    expect(RUFINO.aggression).toBe(0.75);
    expect(RUFINO.bluffFreq).toBe(0.25);
    expect(RUFINO.tightness).toBe(0.5);
  });

  it("CHATO has exact locked traits {aggression 0.5, bluffFreq 0.2, tightness 0.5}", () => {
    expect(CHATO.aggression).toBe(0.5);
    expect(CHATO.bluffFreq).toBe(0.2);
    expect(CHATO.tightness).toBe(0.5);
  });

  it("PAQUI has exact locked traits {aggression 0.55, bluffFreq 0.45, tightness 0.45}", () => {
    expect(PAQUI.aggression).toBe(0.55);
    expect(PAQUI.bluffFreq).toBe(0.45);
    expect(PAQUI.tightness).toBe(0.45);
  });

  it("GARRIDO has exact locked traits {aggression 0.7, bluffFreq 0.2, tightness 0.65}", () => {
    expect(GARRIDO.aggression).toBe(0.7);
    expect(GARRIDO.bluffFreq).toBe(0.2);
    expect(GARRIDO.tightness).toBe(0.65);
  });

  // ── Mascot avatars ─────────────────────────────────────────────────

  it("CURRO.avatar === 'pato'", () => {
    expect(CURRO.avatar).toBe("pato");
  });

  it("RUFINO.avatar === 'toro'", () => {
    expect(RUFINO.avatar).toBe("toro");
  });

  // ── Test-profiles preserved ────────────────────────────────────────

  it("BOT_TIGHT still importable and has id 'tight-test'", () => {
    expect(BOT_TIGHT.id).toBe("tight-test");
  });

  it("BOT_AGGRESSIVE still importable and has id 'aggressive-test'", () => {
    expect(BOT_AGGRESSIVE.id).toBe("aggressive-test");
  });

  // ── Trait modulation A: La Manola raises more often and larger than Curro ──

  it("La Manola raises strictly more often than Curro over seeds 1..100 (free action, made pair)", () => {
    // Moderate FREE-action situation: made pair, phase card3, pot 200, toCall 0
    const situation = makeSituation({
      hole: PAIR_HOLE,
      phase: PHASES.CARD_3,
      pot: 200,
      toCall: 0,
      currentBet: 0,
      myBet: 0,
      myChips: 500,
      activeOpponents: 2,
      community: BLANK_COMMUNITY_3,
    });

    let curroRaises = 0;
    let manolaRaises = 0;
    let curroTotal = 0;
    let manolaTotal = 0;

    for (let seed = 1; seed <= 100; seed++) {
      const d1 = BotStrategy.decide(situation, CURRO, makeLcg(seed));
      const d2 = BotStrategy.decide(situation, MANOLA, makeLcg(seed));
      if (d1.action === "raise") {
        curroRaises++;
        curroTotal += d1.amount ?? 0;
      }
      if (d2.action === "raise") {
        manolaRaises++;
        manolaTotal += d2.amount ?? 0;
      }
    }

    // La Manola (aggression 0.8) raises more often than Curro (aggression 0.3)
    expect(manolaRaises).toBeGreaterThan(curroRaises);
    // When both raise, La Manola's average raise amount is larger
    if (manolaRaises > 0 && curroRaises > 0) {
      expect(manolaTotal / manolaRaises).toBeGreaterThan(curroTotal / curroRaises);
    }
  });

  // ── Trait modulation B: pot-odds split — Curro folds / La Manola calls ──

  it("Curro folds and La Manola calls the same borderline pot-odds spot (seed 42)", () => {
    // pot=100, toCall=7 → potOdds = 7/107 ≈ 0.0654
    // Hole: 5O+6C. Community: 12O+11E+1B (Rey, Caballo, As of Bastos — no pairing with hole).
    // Best 5-card hand = carta alta; highest card = As (rank 6/6).
    // rawStrength ≈ 0.135; effectiveStrength ≈ 0.135 × 0.88 = 0.1188
    // Curro  callThreshold = 0.0654 + (0.7×0.15=0.105) = 0.1704 → 0.1188 ≤ 0.1704 → FOLD
    // Manola callThreshold = 0.0654 + (0.3×0.15=0.045) = 0.1104 → 0.1188 > 0.1104 → CALL
    const CARTA_ALTA_COMMUNITY = ["12O", "11E", "1B"]; // Rey(5), Caballo(4), As(6) — no 5/6 in hole
    const situation = makeSituation({
      hole: JUNK_HOLE,
      phase: PHASES.CARD_3,
      pot: 100,
      toCall: 7,
      currentBet: 7,
      myBet: 0,
      myChips: 500,
      community: CARTA_ALTA_COMMUNITY,
      activeOpponents: 2,
    });

    const curroDecision = BotStrategy.decide(situation, CURRO, makeLcg(42));
    const manolaDecision = BotStrategy.decide(situation, MANOLA, makeLcg(42));

    expect(curroDecision.action).toBe("fold");
    expect(manolaDecision.action).toBe("call");
  });

});
