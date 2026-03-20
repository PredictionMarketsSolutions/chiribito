import { describe, it, expect, vi } from "vitest";
import { resetRoomUi } from "./room-ui-reset";

describe("room-ui-reset", () => {
  it("resets base ui fields and clears room", () => {
    const makeEl = () => document.createElement("span");
    const deps = {
      getRoom: vi.fn(() => ({ id: "r1" } as any)),
      disconnectRoom: vi.fn(),
      setRoom: vi.fn(),
      setCurrentSessionId: vi.fn(),
      clearWinnerDisplay: vi.fn(),
      winnerDisplayState: { lastWinners: [], lastWinningHand: "-", winnerDisplayUntil: 0, winnerDisplayTimeoutId: null },
      clearDeferredTournamentTimer: vi.fn(),
      setRevealedHands: vi.fn(),
      gameUiContext: {
        currentSessionId: null,
        winnerDisplayState: { lastWinners: [], lastWinningHand: "-", winnerDisplayUntil: 0, winnerDisplayTimeoutId: null },
        revealedHands: null,
        previousCommunityCards: [],
        previousHandCards: [],
        previousPotValue: null,
        previousCurrentBetValue: null,
        allInRevealInProgress: false,
        latestPlayerNames: new Map<string, string>(),
      },
      resetPreviousWinnersKey: vi.fn(),
      resetAllInState: vi.fn(),
      clearAllInAnimationTimeout: vi.fn(),
      clearHandHistory: vi.fn(),
      renderHandHistoryUi: vi.fn(),
      setAuthOverlayVisible: vi.fn(),
      setAuthMessage: vi.fn(),
      roomStatusEl: makeEl(),
      phaseStatusEl: makeEl(),
      turnStatusEl: makeEl(),
      stopTurnTimer: vi.fn(),
      turnTimerState: { turnTimerId: null, turnDeadlineMs: null, lastTurnId: null, lastTurnTimeoutMs: null },
      turnTimerChipEl: makeEl(),
      potStatusEl: makeEl(),
      betStatusEl: makeEl(),
      communityStatusEl: makeEl(),
      handStatusEl: makeEl(),
      winningHandStatusEl: makeEl(),
      winnersStatusEl: makeEl(),
      potChipEl: makeEl(),
      phaseChipEl: makeEl(),
      turnChipEl: makeEl(),
      winningHandChipEl: makeEl(),
      renderCardRow: vi.fn(),
      communityCardsEl: document.createElement("div"),
      handCardsEl: document.createElement("div"),
      playersListEl: document.createElement("ul"),
      syncGameUiContext: vi.fn(),
      renderSeats: vi.fn(),
      setActionButtonsEnabled: vi.fn(),
    };

    resetRoomUi(deps as any, "left");

    expect(deps.disconnectRoom).toHaveBeenCalled();
    expect(deps.setRoom).toHaveBeenCalledWith(null);
    expect(deps.roomStatusEl.textContent).toBe("left");
    expect(deps.phaseStatusEl.textContent).toBe("waiting");
    expect(deps.winnersStatusEl.textContent).toBe("-");
  });
});
