import { describe, it, expect, vi } from "vitest";
import type { WinnerDisplayState } from "../game";
import { applyAllInShowdownOutcome, applyStandardRoundOutcome } from "./round-ended-outcome";

function createWinnerState(): WinnerDisplayState {
  return {
    lastWinners: [],
    lastWinningHand: "-",
    winnerDisplayUntil: 0,
    winnerDisplayTimeoutId: null,
  };
}

describe("round-ended-outcome", () => {
  it("applies all-in outcome directly when cards already revealed", () => {
    const winnerDisplayState = createWinnerState();
    const applyWinnerUi = vi.fn((winnerIds: string[], winningHand: string) => {
      winnerDisplayState.lastWinners = winnerIds;
      winnerDisplayState.lastWinningHand = winningHand;
    });
    const deps = {
      winnerDisplayState,
      currentSessionId: "me",
      latestPlayerNames: new Map([["w1", "Ana"]]),
      applyWinnerUi,
      playWinEffect: vi.fn(),
      startWinnerDisplayPhase: vi.fn(),
      renderLastState: vi.fn(),
      showWinnerBanner: vi.fn(),
      setPreviousCommunityCards: vi.fn(),
      winnerIds: ["w1", "me"],
      winningHand: "Escalera",
      communityCards: ["1O", "2O", "3O", "4O", "5O"],
      allInCardsRevealedByServer: true,
      setAllInRevealInProgress: vi.fn(),
      revealAllInCards: vi.fn(),
    };

    applyAllInShowdownOutcome(deps);

    expect(applyWinnerUi).toHaveBeenCalledWith(["w1", "me"], "Escalera");
    expect(deps.playWinEffect).toHaveBeenCalled();
    expect(deps.startWinnerDisplayPhase).toHaveBeenCalled();
    expect(deps.revealAllInCards).not.toHaveBeenCalled();
    expect(deps.showWinnerBanner).toHaveBeenCalledWith("Escalera para Ana");
  });

  it("applies all-in outcome through reveal callback when cards not revealed", () => {
    const winnerDisplayState = createWinnerState();
    const applyWinnerUi = vi.fn((winnerIds: string[], winningHand: string) => {
      winnerDisplayState.lastWinners = winnerIds;
      winnerDisplayState.lastWinningHand = winningHand;
    });
    const revealAllInCards = vi.fn((_: string[], onComplete: () => void) => onComplete());

    applyAllInShowdownOutcome({
      winnerDisplayState,
      currentSessionId: null,
      latestPlayerNames: new Map(),
      applyWinnerUi,
      playWinEffect: vi.fn(),
      startWinnerDisplayPhase: vi.fn(),
      renderLastState: vi.fn(),
      showWinnerBanner: vi.fn(),
      setPreviousCommunityCards: vi.fn(),
      winnerIds: ["w1"],
      winningHand: "Pareja",
      communityCards: ["1O", "2O", "3O", "4O", "5O"],
      allInCardsRevealedByServer: false,
      setAllInRevealInProgress: vi.fn(),
      revealAllInCards,
    });

    expect(revealAllInCards).toHaveBeenCalled();
    expect(applyWinnerUi).toHaveBeenCalledWith(["w1"], "Pareja");
  });

  it("applies standard outcome and sets previous winner key", () => {
    const winnerDisplayState = createWinnerState();
    const applyWinnerUi = vi.fn((winnerIds: string[], winningHand: string) => {
      winnerDisplayState.lastWinners = winnerIds;
      winnerDisplayState.lastWinningHand = winningHand;
    });
    const setPreviousWinnersKey = vi.fn();
    const playWinEffect = vi.fn();

    applyStandardRoundOutcome({
      winnerDisplayState,
      currentSessionId: "me",
      latestPlayerNames: new Map([["me", "Yo"]]),
      applyWinnerUi,
      playWinEffect,
      startWinnerDisplayPhase: vi.fn(),
      renderLastState: vi.fn(),
      showWinnerBanner: vi.fn(),
      setPreviousCommunityCards: vi.fn(),
      winnerDisplay: {
        winnerIds: ["me"],
        winningHand: "Trio",
        startPhaseNow: true,
      },
      fallbackWinningHand: "-",
      setPreviousWinnersKey,
    });

    expect(applyWinnerUi).toHaveBeenCalledWith([], "Trio");
    expect(applyWinnerUi).toHaveBeenCalledWith(["me"], "Trio");
    expect(setPreviousWinnersKey).toHaveBeenCalledWith("me");
    expect(playWinEffect).toHaveBeenCalled();
  });
});
