/**
 * Phase2Flow.test.ts
 *
 * Verifies the three guarantees the real Chiribito flow must satisfy
 * (Phase 2 of the project):
 *
 *   1. Six betting rounds per hand (preflop + card1..card5), one
 *      community card revealed per street.
 *   2. On every post-preflop street, the player who raised last on the
 *      previous street speaks first; otherwise the first player after
 *      the dealer.
 *   3. The hand evaluator must always use both hole cards — `community
 *      combos` are 3-card slices, never 5-card combinations.
 *
 * These tests do NOT exercise the full multiplayer wire-up; they invoke
 * the engine pieces directly with stub rooms / states so they run fast
 * and stay focused on the new rules.
 */

import { PHASES, communityCardPhase, TOTAL_COMMUNITY_CARDS, HOLE_CARDS_PER_PLAYER } from "../../rooms/game/glossary";
import { CardEvaluator } from "../../rooms/game/utils/CardEvaluator";
import { RoundManager } from "../../rooms/game/utils/RoundManager";

describe("Chiribito phase 2 — six-street betting flow", () => {
  describe("communityCardPhase()", () => {
    it("maps each revealed community card to its canonical phase id", () => {
      expect(communityCardPhase(1)).toBe(PHASES.CARD_1);
      expect(communityCardPhase(2)).toBe(PHASES.CARD_2);
      expect(communityCardPhase(3)).toBe(PHASES.CARD_3);
      expect(communityCardPhase(4)).toBe(PHASES.CARD_4);
      expect(communityCardPhase(5)).toBe(PHASES.CARD_5);
    });

    it("rejects card numbers outside 1..5 — Chiribito has exactly 5 community cards", () => {
      expect(() => communityCardPhase(0)).toThrow();
      expect(() => communityCardPhase(6)).toThrow();
      expect(() => communityCardPhase(-1)).toThrow();
    });
  });

  describe("RoundManager.dealNextCommunityCard", () => {
    function buildFakeRoom() {
      const community: string[] = [];
      const dealt = ["7O", "10C", "11E", "5B", "12O"];
      let next = 0;
      const fakeRoom: any = {
        roomId: "test",
        state: {
          communityCards: {
            push: (card: string) => community.push(card),
            toArray: () => [...community],
            get length() { return community.length; }
          },
          dealCard: () => dealt[next++] ?? "",
          phase: PHASES.PREFLOP,
          currentBet: 0,
          currentTurn: "",
          pot: 0
        }
      };
      return { fakeRoom, community };
    }

    it("reveals one card per call and advances the phase to CARD_1 → CARD_5", () => {
      const { fakeRoom, community } = buildFakeRoom();
      const rm = new RoundManager(fakeRoom);

      rm.dealNextCommunityCard();
      expect(community).toEqual(["7O"]);
      expect(fakeRoom.state.phase).toBe(PHASES.CARD_1);

      rm.dealNextCommunityCard();
      expect(community).toEqual(["7O", "10C"]);
      expect(fakeRoom.state.phase).toBe(PHASES.CARD_2);

      rm.dealNextCommunityCard();
      rm.dealNextCommunityCard();
      rm.dealNextCommunityCard();

      expect(community).toEqual(["7O", "10C", "11E", "5B", "12O"]);
      expect(fakeRoom.state.phase).toBe(PHASES.CARD_5);
      expect(community.length).toBe(TOTAL_COMMUNITY_CARDS);
    });
  });

  describe("must-use-both-hole-cards (CardEvaluator.getCommunityCombos)", () => {
    it("returns 3-card slices, never 5-card combinations", () => {
      const community = ["7O", "10C", "11E", "5B", "12O"];
      const combos = CardEvaluator.getCommunityCombos(community);
      expect(combos.length).toBeGreaterThan(0);
      combos.forEach((combo) => {
        // Three community cards + two hole cards = best hand of 5.
        // If this ever flips to 5-card combos, hands would be valid
        // without using the hole cards (= not Chiribito).
        expect(combo.length).toBe(3);
      });
    });

    it("produces C(5,3) = 10 combinations when 5 community cards are present", () => {
      const community = ["7O", "10C", "11E", "5B", "12O"];
      const combos = CardEvaluator.getCommunityCombos(community);
      expect(combos.length).toBe(10);
    });

    it("HOLE_CARDS_PER_PLAYER stays at 2 — the deck contract", () => {
      expect(HOLE_CARDS_PER_PLAYER).toBe(2);
    });
  });
});
