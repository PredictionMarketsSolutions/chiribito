import { describe, it, expect } from "vitest";
import { applyWinnerUiState, getWinnerBannerText, type WinnerUiState } from "./round-ended-winner-ui";

describe("round-ended-winner-ui", () => {
  it("applyWinnerUiState updates state and DOM", () => {
    const state: WinnerUiState = { lastWinners: [], lastWinningHand: "-" };
    const winnersStatusEl = document.createElement("span");
    const winningHandStatusEl = document.createElement("span");
    const winningHandChipEl = document.createElement("span");

    applyWinnerUiState(state, {
      winnerIds: ["p1", "p2"],
      winningHand: "Escalera",
      winnersStatusEl,
      winningHandStatusEl,
      winningHandChipEl,
    });

    expect(state.lastWinners).toEqual(["p1", "p2"]);
    expect(state.lastWinningHand).toBe("Escalera");
    expect(winnersStatusEl.textContent).toBe("p1, p2");
    expect(winningHandStatusEl.textContent).toBe("Escalera");
    expect(winningHandChipEl.textContent).toBe("Escalera");
  });

  it("getWinnerBannerText uses mapped player name", () => {
    const names = new Map<string, string>([["p1", "Ana"]]);
    expect(getWinnerBannerText("Escalera", ["p1"], names)).toBe("Escalera para Ana");
  });

  it("getWinnerBannerText returns empty when winning hand or winners missing", () => {
    const names = new Map<string, string>();
    expect(getWinnerBannerText("", ["p1"], names)).toBe("");
    expect(getWinnerBannerText("Trío", [], names)).toBe("");
  });
});
