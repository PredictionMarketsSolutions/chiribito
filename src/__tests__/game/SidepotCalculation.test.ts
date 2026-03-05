/**
 * SidepotCalculation.test.ts
 * Tests to reproduce and verify the chip loss bug in sidepot calculations
 */

import { WinnerDeterminator } from "../../rooms/game/utils/WinnerDeterminator";
import { MyRoomState, Player } from "../../rooms/schema/MyRoomState";

describe("Sidepot Calculation - Chip Conservation Bug", () => {
  let mockRoom: any;
  let winnerDeterminator: WinnerDeterminator;

  beforeEach(() => {
    mockRoom = {
      state: new MyRoomState(),
      roomId: "test-room",
    };
    winnerDeterminator = new WinnerDeterminator(mockRoom);
  });

  it("should conserve total chips: input = output", () => {
    // Setup: 3 players with different contributions
    const contributions = new Map([
      ["A", 1000],
      ["B", 600],
      ["C", 200],
    ]);

    const winners = ["A"]; // A wins all pots

    // Calculate payouts
    const payouts = winnerDeterminator.calculateSidePotPayouts(contributions, winners);

    // Verify: Total payout should equal total contributions
    const totalContributions = Array.from(contributions.values()).reduce((a, b) => a + b, 0);
    const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);

    expect(totalPayouts).toBe(totalContributions);
  });

  it("should correctly calculate sidepots for 3 players with unequal all-ins", () => {
    // Scenario: A=1000, B=600, C=200
    // Expected sidepots:
    // - Main pot (level 200): 200 × 3 = 600
    // - Side pot 1 (level 600-200): 400 × 2 = 800 (only A and B)
    // - Side pot 2 (level 1000-600): 400 × 1 = 400 (only A)
    // Total: 1800

    const contributions = new Map([
      ["A", 1000],
      ["B", 600],
      ["C", 200],
    ]);

    const winners = ["A"]; // A wins everything

    const payouts = winnerDeterminator.calculateSidePotPayouts(contributions, winners);

    // A should get 1800 total
    const aPayoutEntry = payouts.find((p) => p.playerId === "A");
    expect(aPayoutEntry).toBeDefined();
    expect(aPayoutEntry!.amount).toBe(1800);

    // Total distributed should be 1800
    const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);
    expect(totalPayouts).toBe(1800);
  });

  it("should distribute split pot correctly with remainder", () => {
    // 3 players contribute 101 each, A and B split
    const contributions = new Map([
      ["A", 101],
      ["B", 101],
      ["C", 101],
    ]);

    const winners = ["A", "B"]; // A and B split

    const payouts = winnerDeterminator.calculateSidePotPayouts(contributions, winners);

    const totalContributions = 303;
    const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);

    // Total should be conserved
    expect(totalPayouts).toBe(totalContributions);

    // A and B should get roughly equal amounts (one gets extra remainder chip)
    const aPayout = payouts.find((p) => p.playerId === "A")?.amount ?? 0;
    const bPayout = payouts.find((p) => p.playerId === "B")?.amount ?? 0;
    const cPayout = payouts.find((p) => p.playerId === "C")?.amount ?? 0;

    expect(aPayout + bPayout).toBe(303);
    expect(cPayout).toBe(0); // C is not a winner
    expect(Math.abs(aPayout - bPayout)).toBeLessThanOrEqual(1); // Difference at most 1
  });

  it("should handle heads-up overbet correctly", () => {
    // A: 1000, B: 300
    // Main pot: 300 × 2 = 600
    // Side pot: 700 × 1 = 700
    // Total: 1300
    // If B wins (better hand):
    // B gets main pot: 600
    // A gets back uncalled bet: 700
    // Total distributed: 1300

    const contributions = new Map([
      ["A", 1000],
      ["B", 300],
    ]);

    // B wins (better hand)
    const winners = ["B"];

    const payouts = winnerDeterminator.calculateSidePotPayouts(contributions, winners);

    const totalContributions = 1300;
    const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);

    expect(totalPayouts).toBe(totalContributions);
  });

  it("should verify no chips are created or destroyed", () => {
    // Property-based test: for ANY contribution distribution,
    // total output must equal total input

    const testCases = [
      // [contributions]
      new Map([["A", 100], ["B", 100]]),
      new Map([["A", 500], ["B", 300], ["C", 100]]),
      new Map([["A", 1000], ["B", 1000], ["C", 1000], ["D", 500]]),
      new Map([["A", 250], ["B", 250], ["C", 250], ["D", 250]]),
      new Map([["A", 999], ["B", 888], ["C", 777], ["D", 666], ["E", 555]]),
    ];

    for (const contributions of testCases) {
      const winners = [Array.from(contributions.keys())[0]]; // First player wins
      const payouts = winnerDeterminator.calculateSidePotPayouts(contributions, winners);

      const totalIn = Array.from(contributions.values()).reduce((a, b) => a + b, 0);
      const totalOut = payouts.reduce((sum, p) => sum + p.amount, 0);

      expect(totalOut).toBe(totalIn);
    }
  });

  it("should correctly identify participants at each sidepot level", () => {
    // Manual verification: A=1000, B=600, C=200
    // Level 200: participants = [A, B, C] (3 players)
    // Level 600: participants = [A, B] (2 players, C already out)
    // Level 1000: participants = [A] (1 player, B and C out)

    const contributions = new Map([
      ["A", 1000],
      ["B", 600],
      ["C", 200],
    ]);

    const winners = ["C"]; // C wins what they're eligible for

    const payouts = winnerDeterminator.calculateSidePotPayouts(contributions, winners);

    // C should only get main pot: 200 × 3 = 600
    const cPayout = payouts.find((p) => p.playerId === "C")?.amount ?? 0;
    expect(cPayout).toBe(600);

    // Total distributed should be 1800 (all contributions)
    const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);
    expect(totalPayouts).toBe(1800);
  });
});
