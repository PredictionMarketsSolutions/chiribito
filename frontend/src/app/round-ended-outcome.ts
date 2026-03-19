import type { WinnerDisplayState } from "../game";
import { getWinnerBannerText } from "./round-ended-winner-ui";

export type WinnerDisplayLike = {
  winnerIds: string[];
  winningHand: string;
  startPhaseNow: boolean;
};

type CommonOutcomeDeps = {
  winnerDisplayState: WinnerDisplayState;
  currentSessionId: string | null;
  latestPlayerNames: Map<string, string>;
  applyWinnerUi: (winnerIds: string[], winningHand: string) => void;
  playWinEffect: () => void;
  startWinnerDisplayPhase: () => void;
  renderLastState: () => void;
  showWinnerBanner: (text: string) => void;
  setPreviousCommunityCards: (cards: string[]) => void;
};

export type AllInOutcomeDeps = CommonOutcomeDeps & {
  winnerIds: string[];
  winningHand: string;
  communityCards: string[];
  allInCardsRevealedByServer: boolean;
  setAllInRevealInProgress: (value: boolean) => void;
  revealAllInCards: (cards: string[], onComplete: () => void) => void;
};

export function applyAllInShowdownOutcome(deps: AllInOutcomeDeps): void {
  const showWinners = () => {
    deps.applyWinnerUi(deps.winnerIds, deps.winningHand);

    if (deps.currentSessionId && deps.winnerDisplayState.lastWinners.includes(deps.currentSessionId)) {
      deps.playWinEffect();
    }

    deps.setAllInRevealInProgress(false);
    deps.setPreviousCommunityCards([...deps.communityCards]);
    deps.startWinnerDisplayPhase();
    deps.renderLastState();

    const bannerText = getWinnerBannerText(
      deps.winnerDisplayState.lastWinningHand,
      deps.winnerDisplayState.lastWinners,
      deps.latestPlayerNames
    );
    if (bannerText) deps.showWinnerBanner(bannerText);
  };

  deps.setPreviousCommunityCards([...deps.communityCards]);
  if (deps.allInCardsRevealedByServer) {
    showWinners();
  } else {
    deps.revealAllInCards(deps.communityCards, showWinners);
  }
}

export type StandardOutcomeDeps = CommonOutcomeDeps & {
  winnerDisplay: WinnerDisplayLike;
  fallbackWinningHand: string;
  setPreviousWinnersKey: (key: string) => void;
};

export function applyStandardRoundOutcome(deps: StandardOutcomeDeps): void {
  const resolvedWinningHand = deps.winnerDisplay.winningHand || deps.fallbackWinningHand;
  deps.applyWinnerUi(deps.winnerDisplayState.lastWinners, resolvedWinningHand);

  if (deps.winnerDisplay.winnerIds.length > 0) {
    deps.applyWinnerUi(deps.winnerDisplay.winnerIds, deps.winnerDisplayState.lastWinningHand);
    deps.setPreviousWinnersKey(deps.winnerDisplayState.lastWinners.join("|"));

    if (deps.currentSessionId && deps.winnerDisplayState.lastWinners.includes(deps.currentSessionId)) {
      deps.playWinEffect();
    }

    if (deps.winnerDisplay.startPhaseNow) {
      deps.startWinnerDisplayPhase();
    }

    const bannerText = getWinnerBannerText(
      deps.winnerDisplayState.lastWinningHand,
      deps.winnerDisplayState.lastWinners,
      deps.latestPlayerNames
    );
    if (bannerText) deps.showWinnerBanner(bannerText);
  }

  deps.renderLastState();
}
