import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  normalizeWinnerRankingData,
  renderWinnersRanking,
  renderWinnersRankingError,
  refreshWinnersRanking,
  type WinnersRankingDeps,
} from "./winners-ranking";

describe("winners-ranking", () => {
  describe("normalizeWinnerRankingData", () => {
    it("returns empty for non-array payload", () => {
      expect(normalizeWinnerRankingData(null)).toEqual([]);
      expect(normalizeWinnerRankingData({})).toEqual([]);
    });

    it("filters invalid entries and coerces numeric fields", () => {
      const entries = normalizeWinnerRankingData([
        { id: 1, username: "ana", gamesPlayed: "4", gamesWon: "2" },
        { id: "bad", username: "x" },
        { id: 2, username: "luis", gamesPlayed: 10 },
      ]);
      expect(entries).toEqual([
        { id: 1, username: "ana", gamesPlayed: 4, gamesWon: 2 },
        { id: 2, username: "luis", gamesPlayed: 10, gamesWon: 0 },
      ]);
    });
  });

  describe("renderWinnersRanking", () => {
    let listEl: HTMLUListElement;

    beforeEach(() => {
      document.body.innerHTML = `<ul id="ranking"></ul>`;
      listEl = document.querySelector("#ranking") as HTMLUListElement;
    });

    it("renders empty message when there are no entries", () => {
      renderWinnersRanking(listEl, []);
      expect(listEl.children).toHaveLength(1);
      expect(listEl.textContent).toContain("Todavía no hay datos de ranking.");
    });

    it("renders list with medals for top 3", () => {
      renderWinnersRanking(listEl, [
        { id: 1, username: "u1", gamesPlayed: 10, gamesWon: 5 },
        { id: 2, username: "u2", gamesPlayed: 7, gamesWon: 3 },
        { id: 3, username: "u3", gamesPlayed: 6, gamesWon: 2 },
      ]);
      expect(listEl.children).toHaveLength(3);
      expect(listEl.querySelector(".ranking-pos.gold")?.textContent).toBe("1");
      expect(listEl.querySelector(".ranking-pos.silver")?.textContent).toBe("2");
      expect(listEl.querySelector(".ranking-pos.bronze")?.textContent).toBe("3");
    });
  });

  describe("renderWinnersRankingError", () => {
    it("renders fallback error row", () => {
      const list = document.createElement("ul");
      renderWinnersRankingError(list);
      expect(list.textContent).toContain("No se pudo cargar el ranking.");
    });
  });

  describe("refreshWinnersRanking", () => {
    let deps: WinnersRankingDeps;
    let listEl: HTMLUListElement;

    beforeEach(() => {
      document.body.innerHTML = `<ul id="ranking"></ul>`;
      listEl = document.querySelector("#ranking") as HTMLUListElement;
      deps = {
        apiUrl: "http://api",
        listEl,
        fetchFn: vi.fn(),
        log: vi.fn(),
      };
    });

    it("fetches, normalizes and renders ranking", async () => {
      vi.mocked(deps.fetchFn).mockResolvedValue({
        ok: true,
        json: async () => [{ id: 1, username: "ana", gamesWon: 2, gamesPlayed: 3 }],
      } as Response);

      await refreshWinnersRanking(deps);

      expect(deps.fetchFn).toHaveBeenCalledWith("http://api/api/ranking/top-winners", expect.any(Object));
      expect(listEl.textContent).toContain("ana");
      expect(listEl.textContent).toContain("2 ganadas");
    });

    it("renders error row and logs on HTTP error", async () => {
      vi.mocked(deps.fetchFn).mockResolvedValue({
        ok: false,
        status: 503,
      } as Response);

      await refreshWinnersRanking(deps);

      expect(listEl.textContent).toContain("No se pudo cargar el ranking.");
      expect(deps.log).toHaveBeenCalledWith("Ranking error: HTTP 503");
    });
  });
});
