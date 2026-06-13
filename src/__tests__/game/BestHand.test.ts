/**
 * BestHand.test.ts
 * Unit tests for the best-hand-of-N extraction utility.
 *
 * RED step: imports BestHand which does not exist yet — this suite must fail
 * until BestHand.ts is created (Task 2 GREEN).
 */

import { BestHand } from "../../rooms/game/utils/BestHand";
import { CardEvaluator } from "../../rooms/game/utils/CardEvaluator";
import { RANK_ORDER } from "../../rooms/game/glossary";

// Canonical Chiribito rank order (spread copy mirrors WinnerDeterminator pattern)
const rankOrder = { ...RANK_ORDER };
// rankOrder = { "5":0, "6":1, "7":2, "10":3, "11":4, "12":5, "1":6 }

describe("BestHand", () => {
  describe("bestHandOfN", () => {
    // ─── null when community < 3 cards ──────────────────────────────────

    it("returns null when community is empty (0 cards)", () => {
      const result = BestHand.bestHandOfN(["5O", "6C"], [], rankOrder);
      expect(result).toBeNull();
    });

    it("returns null when community has 1 card", () => {
      const result = BestHand.bestHandOfN(["5O", "6C"], ["7E"], rankOrder);
      expect(result).toBeNull();
    });

    it("returns null when community has exactly 2 cards", () => {
      const result = BestHand.bestHandOfN(["5O", "6C"], ["7E", "11B"], rankOrder);
      expect(result).toBeNull();
    });

    // ─── Perla early-exit ────────────────────────────────────────────────

    it("returns Perla (category 9) for Sota+7 de Oros with no community", () => {
      const result = BestHand.bestHandOfN(["10O", "7O"], [], rankOrder);
      expect(result).not.toBeNull();
      expect(result!.score).toEqual({ category: 9, tiebreaker: [] });
      expect(result!.name).toBe("Perla");
    });

    it("returns Perla (category 9) for Sota+7 de Copas with no community", () => {
      const result = BestHand.bestHandOfN(["10C", "7C"], [], rankOrder);
      expect(result).not.toBeNull();
      expect(result!.score).toEqual({ category: 9, tiebreaker: [] });
      expect(result!.name).toBe("Perla");
    });

    it("returns Perla for Sota+7 de Espadas regardless of card order", () => {
      const result = BestHand.bestHandOfN(["7E", "10E"], [], rankOrder);
      expect(result).not.toBeNull();
      expect(result!.score).toEqual({ category: 9, tiebreaker: [] });
      expect(result!.name).toBe("Perla");
    });

    it("returns Perla even when 5 community cards are present (short-circuits combo loop)", () => {
      // Perla must be detected from hole cards BEFORE evaluating any community combos
      const result = BestHand.bestHandOfN(
        ["10C", "7C"],
        ["5O", "6O", "11B", "12E", "1O"],
        rankOrder
      );
      expect(result).not.toBeNull();
      expect(result!.score).toEqual({ category: 9, tiebreaker: [] });
      expect(result!.name).toBe("Perla");
    });

    // ─── non-null for exactly 3 community cards ──────────────────────────

    it("returns a non-null result for exactly 3 community cards (minimum working size)", () => {
      // hole: 5O 6C (junk, non-Perla)
      // community: 12O 12C 12E → Trío de Reyes from the combo
      const result = BestHand.bestHandOfN(
        ["5O", "6C"],
        ["12O", "12C", "12E"],
        rankOrder
      );
      expect(result).not.toBeNull();
      expect(result!.score.category).toBeGreaterThanOrEqual(0);
      expect(typeof result!.name).toBe("string");
    });

    // ─── 5-community max-score selection ────────────────────────────────

    it("returns the best 5-card hand from 2 hole + 5 community for a Trío board", () => {
      // hole: 11O 11C (pair of Caballos)
      // community: 11E 5B 6O 12C 1O
      // Best combo: 11O+11C+11E gives Trío; but also has a pair of Reyes in community
      // Expected: at least Trío (category 3) from the Caballo trio
      const result = BestHand.bestHandOfN(
        ["11O", "11C"],
        ["11E", "5B", "6O", "12C", "1O"],
        rankOrder
      );
      expect(result).not.toBeNull();
      // Trío de Caballos = category 3; or possibly Full (3+2) if applicable
      expect(result!.score.category).toBeGreaterThanOrEqual(3);
    });

    // ─── Trío > Doble pareja ─────────────────────────────────────────────

    it("correctly identifies that Trío (cat 3) ranks above Doble pareja (cat 2)", () => {
      // hand A: Trío de Reyes
      const trioResult = BestHand.bestHandOfN(
        ["12O", "12C"],
        ["12E", "5B", "6O"],
        rankOrder
      );

      // hand B: Doble pareja — Caballos + 7s
      const dosParejaResult = BestHand.bestHandOfN(
        ["11O", "11C"],
        ["7O", "7C", "5E"],
        rankOrder
      );

      expect(trioResult).not.toBeNull();
      expect(dosParejaResult).not.toBeNull();
      expect(trioResult!.score.category).toBe(3);   // Trío
      expect(dosParejaResult!.score.category).toBe(2); // Doble pareja

      // Trío must compare > Doble pareja
      const cmp = CardEvaluator.compareHands(trioResult!.score, dosParejaResult!.score);
      expect(cmp).toBe(1);
    });
  });

  describe("WinnerDeterminator parity", () => {
    it("deep-equals the max score from manually running the inline algorithm (bit-identical extraction)", () => {
      // Fixed non-Perla hole + 5 community cards
      const hole = ["1O", "12O"];   // As de Oros + Rey de Oros
      const community = ["5O", "6O", "11O", "7C", "12C"];

      // Manually run the exact inline algorithm from WinnerDeterminator:
      const combos = CardEvaluator.getCommunityCombos(community);
      let expectedBest = null as ReturnType<typeof CardEvaluator.evaluateHand> | null;
      for (const combo of combos) {
        const score = CardEvaluator.evaluateHand([...hole, ...combo], rankOrder);
        if (!expectedBest || CardEvaluator.compareHands(score, expectedBest) > 0) {
          expectedBest = score;
        }
      }

      // bestHandOfN must return the SAME score
      const result = BestHand.bestHandOfN(hole, community, rankOrder);
      expect(result).not.toBeNull();
      expect(result!.score).toEqual(expectedBest);
    });

    it("returns the correct hand name matching CardEvaluator.getHandName for the best category", () => {
      const hole = ["11O", "11C"]; // pair of Caballos
      const community = ["11E", "5B", "6O", "12C", "1O"];

      const result = BestHand.bestHandOfN(hole, community, rankOrder);
      expect(result).not.toBeNull();
      // Name must match the canonical CardEvaluator.getHandName for the returned category
      expect(result!.name).toBe(CardEvaluator.getHandName(result!.score.category));
    });
  });
});
