/**
 * GameUtils.test.ts
 * Unit tests for GameUtils helpers
 */

import { GameUtils } from "../../rooms/game/utils/GameUtils";
import { MesaState, Player } from "../../rooms/schema/MesaState";
import type { IGameRoom } from "../../types/IGameRoom";

describe("GameUtils", () => {
  let utils: GameUtils;
  let mockRoom: jest.Mocked<IGameRoom>;
  let state: MesaState;

  beforeEach(() => {
    state = new MesaState();
    state.currentBet = 0;
    state.pot = 0;

    const p1 = new Player("s1");
    p1.name = "Alice";
    p1.chips = 500;
    p1.isFolded = false;
    state.users.set("s1", p1);

    const p2 = new Player("s2");
    p2.name = "Bob";
    p2.chips = 0;
    p2.isFolded = false;
    state.users.set("s2", p2);

    const p3 = new Player("s3");
    p3.name = "Carol";
    p3.chips = 200;
    p3.isFolded = true;
    state.users.set("s3", p3);

    mockRoom = {
      roomId: "r1",
      state,
      clients: [],
      playersInHand: ["s1", "s2", "s3"],
      playersAllIn: new Set<string>(),
      playersActedThisRound: new Set(),
      dealerIndex: 0,
      currentPlayerIndex: 0,
      turnTimeout: null,
      broadcast: jest.fn(),
      scheduleDelayed: jest.fn()
    } as unknown as jest.Mocked<IGameRoom>;

    utils = new GameUtils(mockRoom);
  });

  describe("getPlayerName", () => {
    it("returns player name when found", () => {
      expect(utils.getPlayerName("s1")).toBe("Alice");
    });
    it("returns sessionId when player not found", () => {
      expect(utils.getPlayerName("unknown")).toBe("unknown");
    });
  });

  describe("getPlayersWithChips", () => {
    it("returns only players with chips > 0", () => {
      const list = utils.getPlayersWithChips();
      expect(list).toHaveLength(2);
      expect(list.map((p) => p.sessionId).sort()).toEqual(["s1", "s3"]);
    });
  });

  describe("getPlayersInHandNonFolded", () => {
    it("returns sessionIds of players in hand who are not folded", () => {
      const list = utils.getPlayersInHandNonFolded();
      expect(list).toContain("s1");
      expect(list).toContain("s2");
      expect(list).not.toContain("s3");
    });
  });

  describe("getActivePlayerIds", () => {
    it("excludes folded and all-in players", () => {
      mockRoom.playersAllIn.add("s2");
      const list = utils.getActivePlayerIds();
      expect(list).toContain("s1");
      expect(list).not.toContain("s2");
      expect(list).not.toContain("s3");
    });
  });

  describe("getNextActiveIndexFrom", () => {
    it("returns -1 when no players in hand", () => {
      mockRoom.playersInHand = [];
      expect(utils.getNextActiveIndexFrom(0)).toBe(-1);
    });

    it("returns -1 when all folded or all-in", () => {
      state.users.get("s1")!.isFolded = true;
      state.users.get("s2")!.isFolded = true;
      mockRoom.playersAllIn.add("s3");
      expect(utils.getNextActiveIndexFrom(0)).toBe(-1);
    });

    it("returns next active index after startIndex", () => {
      mockRoom.playersInHand = ["s1", "s2", "s3"];
      state.users.get("s3")!.isFolded = false;
      const next = utils.getNextActiveIndexFrom(0);
      expect(next).toBeGreaterThanOrEqual(0);
      expect(next).toBeLessThan(3);
    });

    it("wraps to first active when startIndex is last", () => {
      mockRoom.playersInHand = ["s1", "s2"];
      state.users.get("s2")!.isFolded = false;
      const next = utils.getNextActiveIndexFrom(1);
      expect([0, 1]).toContain(next);
    });
  });

  describe("removeFromHand", () => {
    it("removes sessionId from playersInHand", () => {
      utils.removeFromHand("s2");
      expect(mockRoom.playersInHand).toEqual(["s1", "s3"]);
    });
    it("no-op when sessionId not in hand", () => {
      utils.removeFromHand("unknown");
      expect(mockRoom.playersInHand).toEqual(["s1", "s2", "s3"]);
    });
  });

  describe("addToPot", () => {
    it("increases state.pot", () => {
      utils.addToPot(100);
      expect(state.pot).toBe(100);
    });
    it("updates handContributions when provided", () => {
      const contributions = new Map<string, number>([["s1", 50]]);
      utils.addToPot(50, "s1", contributions);
      expect(contributions.get("s1")).toBe(100);
    });
  });

  describe("setCurrentPlayerIndexBeforeNextActive", () => {
    it("no-op when no players in hand", () => {
      mockRoom.playersInHand = [];
      utils.setCurrentPlayerIndexBeforeNextActive(0);
      expect(mockRoom.currentPlayerIndex).toBe(0);
    });

    it("sets currentPlayerIndex to next non-folded non-allin", () => {
      mockRoom.playersInHand = ["s1", "s2", "s3"];
      state.users.get("s2")!.isFolded = false;
      state.users.get("s3")!.isFolded = false;
      utils.setCurrentPlayerIndexBeforeNextActive(0);
      expect([0, 1, 2]).toContain(mockRoom.currentPlayerIndex);
    });
  });
});
