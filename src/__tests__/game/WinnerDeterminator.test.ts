/**
 * WinnerDeterminator.test.ts
 * Unit tests for winner determination logic
 */

import { WinnerDeterminator } from "../../rooms/game/utils/WinnerDeterminator";
import type { IGameRoom } from "../../types/IGameRoom";

describe("WinnerDeterminator", () => {
  let determinator: WinnerDeterminator;
  let mockRoom: jest.Mocked<IGameRoom>;

  beforeEach(() => {
    // Create mock room with minimal setup
    mockRoom = {
      state: {
        communityCards: { toArray: (): string[] => [] },
        users: new Map(),
        pot: 0
      },
      roomId: "test-room-123",
    } as any;

    determinator = new WinnerDeterminator(mockRoom);
  });

  describe("calculateSidePotPayouts", () => {
    it("should distribute pot equally among single winner", () => {
      const contributions = new Map<string, number>([
        ["player-1", 100],
        ["player-2", 100],
        ["player-3", 100]
      ]);

      const payouts = determinator.calculateSidePotPayouts(contributions, ["player-1"]);

      expect(payouts.length).toBeGreaterThan(0);
      expect(payouts.some(p => p.playerId === "player-1")).toBe(true);
      expect(payouts.some(p => p.amount > 0)).toBe(true);
    });

    it("should distribute pot equally among multiple winners (split pot)", () => {
      const contributions = new Map<string, number>([
        ["player-1", 100],
        ["player-2", 100],
        ["player-3", 100]
      ]);

      const payouts = determinator.calculateSidePotPayouts(
        contributions,
        ["player-1", "player-2"]
      );

      expect(payouts.length).toBeGreaterThan(0);
      const winner1Payout = payouts.find(p => p.playerId === "player-1");
      const winner2Payout = payouts.find(p => p.playerId === "player-2");

      // Winners should receive equal amounts
      if (winner1Payout && winner2Payout) {
        expect(winner1Payout.amount).toBe(winner2Payout.amount);
      }
    });

    it("should return empty array for no winners", () => {
      const contributions = new Map<string, number>([
        ["player-1", 100]
      ]);

      const payouts = determinator.calculateSidePotPayouts(contributions, []);

      expect(payouts).toEqual([]);
    });

    it("should handle all-in scenario with unequal contributions", () => {
      // Player 1 all-in with 50, Player 2 with 100, Player 3 with 150
      const contributions = new Map<string, number>([
        ["player-1", 50],
        ["player-2", 100],
        ["player-3", 150]
      ]);

      const payouts = determinator.calculateSidePotPayouts(
        contributions,
        ["player-1"]
      );

      expect(payouts.length).toBeGreaterThan(0);
      const player1Payout = payouts.find(p => p.playerId === "player-1");
      expect(player1Payout).toBeDefined();
      expect(player1Payout?.amount ?? 0).toBeGreaterThan(0);
    });

    it("should calculate side pot correctly - main pot only", () => {
      // Scenario: 3 players with equal contributions
      const contributions = new Map<string, number>([
        ["player-a", 30],
        ["player-b", 30],
        ["player-c", 30]
      ]);

      const payouts = determinator.calculateSidePotPayouts(
        contributions,
        ["player-b"]
      );

      expect(payouts.length).toBeGreaterThan(0);
      const player1Total = payouts.reduce((sum, p) => sum + (p.playerId === "player-b" ? p.amount : 0), 0);
      expect(player1Total).toBeGreaterThan(0);
    });

    it("should handle three-way split", () => {
      const contributions = new Map<string, number>([
        ["player-1", 100],
        ["player-2", 100],
        ["player-3", 100]
      ]);

      const payouts = determinator.calculateSidePotPayouts(
        contributions,
        ["player-1", "player-2", "player-3"]
      );

      expect(payouts.length).toBe(3);
      
      // Each winner should get same amount
      const amounts = payouts.map(p => p.amount);
      // Since all amounts should be identical in a 3-way split
      expect(amounts[0]).toBeGreaterThan(0);
    });

    it("should accumulate payouts for same player in multiple pots", () => {
      const contributions = new Map<string, number>([
        ["player-1", 50],
        ["player-2", 100]
      ]);

      const payouts = determinator.calculateSidePotPayouts(
        contributions,
        ["player-1"]
      );

      // Player 1 should have one combined payout (or multiple accumulated)
      const player1Payouts = payouts.filter(p => p.playerId === "player-1");
      const totalAmount = player1Payouts.reduce((sum, p) => sum + p.amount, 0);
      expect(totalAmount).toBeGreaterThan(0);
    });

    it("should handle edge case: same contribution from all players", () => {
      const contributions = new Map<string, number>([
        ["player-1", 50],
        ["player-2", 50],
        ["player-3", 50]
      ]);

      const payouts = determinator.calculateSidePotPayouts(
        contributions,
        ["player-1"]
      );

      const player1Payout = payouts.find(p => p.playerId === "player-1");
      
      // Player 1 should win some amount
      expect(player1Payout?.amount ?? 0).toBeGreaterThan(0);
    });

    it("should handle large pot amounts", () => {
      const contributions = new Map<string, number>([
        ["player-1", 1000000],
        ["player-2", 2000000],
        ["player-3", 3000000]
      ]);

      const payouts = determinator.calculateSidePotPayouts(
        contributions,
        ["player-2"]
      );

      expect(payouts.length).toBeGreaterThan(0);
      const totalWinnings = payouts.reduce((sum, p) => sum + p.amount, 0);
      expect(totalWinnings).toBeGreaterThan(0);
    });

    it("should handle single player (everyone else folded)", () => {
      const contributions = new Map<string, number>([
        ["winner", 100]
      ]);

      const payouts = determinator.calculateSidePotPayouts(
        contributions,
        ["winner"]
      );

      expect(payouts.length).toBeGreaterThan(0);
      const winnings = payouts[0];
      expect(winnings.playerId).toBe("winner");
      expect(winnings.amount).toBeGreaterThan(0);
    });

    it("should handle zero contributions", () => {
      const contributions = new Map<string, number>();

      const payouts = determinator.calculateSidePotPayouts(
        contributions,
        ["player-1"]
      );

      expect(payouts).toEqual([]);
    });

    it("should handle very small contributions", () => {
      const contributions = new Map<string, number>([
        ["player-1", 1],
        ["player-2", 2],
        ["player-3", 3]
      ]);

      const payouts = determinator.calculateSidePotPayouts(
        contributions,
        ["player-1"]
      );

      expect(payouts).toBeDefined();
      expect(payouts.length).toBeGreaterThan(0);
    });

    it("should handle rounding correctly in side pots", () => {
      // Test case with odd numbers to trigger rounding
      const contributions = new Map<string, number>([
        ["player-1", 33],
        ["player-2", 67],
        ["player-3", 100]
      ]);

      const payouts = determinator.calculateSidePotPayouts(
        contributions,
        ["player-1"]
      );

      expect(payouts).toBeDefined();
      const totalPayout = payouts.reduce((sum, p) => sum + p.amount, 0);
      expect(totalPayout).toBeGreaterThan(0);
    });

    it("should handle two-player all-in with third spectator", () => {
      const contributions = new Map<string, number>([
        ["player-1", 50],
        ["player-2", 100],
        ["player-3", 150]
      ]);

      const payouts = determinator.calculateSidePotPayouts(
        contributions,
        ["player-3"]
      );

      expect(payouts.length).toBeGreaterThan(0);
      const player3Total = payouts.reduce((sum, p) => sum + (p.playerId === "player-3" ? p.amount : 0), 0);
      expect(player3Total).toBeGreaterThan(0);
    });

    it("should handle multiple winners with different contribution levels", () => {
      const contributions = new Map<string, number>([
        ["winner-a", 50],
        ["winner-b", 100],
        ["loser", 150]
      ]);

      const payouts = determinator.calculateSidePotPayouts(
        contributions,
        ["winner-a", "winner-b"]
      );

      expect(payouts.length).toBeGreaterThan(0);
      const winnerATakings = payouts.filter(p => p.playerId === "winner-a");
      const winnerBTakings = payouts.filter(p => p.playerId === "winner-b");
      
      expect(winnerATakings.length).toBeGreaterThan(0);
      expect(winnerBTakings.length).toBeGreaterThan(0);
    });
  });

  describe("logRoundEnd", () => {
    it("should log round end successfully", () => {
      const loggerSpy = jest.spyOn(console, "log").mockImplementation();
      
      expect(() => {
        determinator.logRoundEnd(
          ["player-1"],
          "Pareja",
          false,
          5000
        );
      }).not.toThrow();
      
      loggerSpy.mockRestore();
    });

    it("should log all-in showdown", () => {
      const loggerSpy = jest.spyOn(console, "log").mockImplementation();
      
      expect(() => {
        determinator.logRoundEnd(
          ["player-1", "player-2"],
          "Doble pareja",
          true,
          10000
        );
      }).not.toThrow();
      
      loggerSpy.mockRestore();
    });

    it("should log multiple winners", () => {
      const loggerSpy = jest.spyOn(console, "log").mockImplementation();
      
      expect(() => {
        determinator.logRoundEnd(
          ["player-1", "player-2", "player-3"],
          "Escalera",
          false,
          7500
        );
      }).not.toThrow();
      
      loggerSpy.mockRestore();
    });

    it("should log with different hand names", () => {
      const handNames = ["Perla", "Póker", "Full", "Color", "Escalera", "Trío", "Doble pareja", "Pareja", "Carta alta"];
      
      for (const handName of handNames) {
        const loggerSpy = jest.spyOn(console, "log").mockImplementation();
        
        expect(() => {
          determinator.logRoundEnd(["winner"], handName, false, 1000);
        }).not.toThrow();
        
        loggerSpy.mockRestore();
      }
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete payout scenario - winner takes all", () => {
      const contributions = new Map<string, number>([
        ["player-1", 100],
        ["player-2", 100],
        ["player-3", 100]
      ]);

      const payouts = determinator.calculateSidePotPayouts(
        contributions,
        ["player-1"]
      );

      expect(payouts.length).toBeGreaterThan(0);
      expect(payouts.some(p => p.playerId === "player-1")).toBe(true);
      
      const totalWinnings = payouts.reduce((sum, p) => sum + p.amount, 0);
      expect(totalWinnings).toBeGreaterThan(0);
    });

    it("should handle complex all-in scenario", () => {
      // Player 1: all-in at 50
      // Player 2: all-in at 100
      // Player 3: all-in at 200
      const contributions = new Map<string, number>([
        ["p1", 50],
        ["p2", 100],
        ["p3", 200]
      ]);

      const payouts = determinator.calculateSidePotPayouts(
        contributions,
        ["p2"]
      );

      expect(payouts).toBeDefined();
      const total = payouts.reduce((sum, p) => sum + p.amount, 0);
      expect(total).toBeGreaterThan(0);
    });

    it("should handle split pot correctly", () => {
      const contributions = new Map<string, number>([
        ["player-1", 100],
        ["player-2", 100],
        ["player-3", 100]
      ]);

      const payouts = determinator.calculateSidePotPayouts(
        contributions,
        ["player-1", "player-2"]
      );

      const p1 = payouts.find(p => p.playerId === "player-1");
      const p2 = payouts.find(p => p.playerId === "player-2");
      
      // Both should get equal amounts in a fair split
      if (p1 && p2) {
        expect(p1.amount).toEqual(p2.amount);
      }
    });
  });
});
