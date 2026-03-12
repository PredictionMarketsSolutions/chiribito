/**
 * Round-ended payload parsing: decide if we should start the winner display phase
 * and extract winner ids + winning hand. Used by roundEnded handler and tests.
 */

export type RoundEndedPayload = {
  winners?: Array<{ playerId?: string; amount?: number }>;
  winningHand?: string;
  isAllInShowdown?: boolean;
  communityCards?: unknown[] | unknown;
};

export type WinnerDisplayFromRoundEnd = {
  winnerIds: string[];
  winningHand: string;
  /** True when we should start the winner phase immediately (normal hand or fold win). False when all-in showdown with 5 cards (phase starts after reveal). */
  startPhaseNow: boolean;
};

/**
 * From a roundEnded payload, returns winner ids, winning hand string, and whether
 * to start the winner display phase immediately (vs after all-in reveal).
 */
export function getWinnerDisplayFromRoundEnd(payload: RoundEndedPayload | null | undefined): WinnerDisplayFromRoundEnd {
  const empty: WinnerDisplayFromRoundEnd = { winnerIds: [], winningHand: "", startPhaseNow: false };
  if (!payload || typeof payload !== "object") return empty;

  const winners = Array.isArray(payload.winners) ? payload.winners : [];
  const winnerIds = winners
    .filter((w): w is { playerId: string } => {
      const id = (w as { playerId?: string })?.playerId;
      return typeof id === "string" && id.length > 0;
    })
    .map((w) => w.playerId);
  const winningHand = typeof payload.winningHand === "string" ? payload.winningHand : "";
  const isAllInShowdown = Boolean(payload.isAllInShowdown);
  const communityCards = payload.communityCards;
  const communityCardsLength = Array.isArray(communityCards) ? communityCards.length : 0;
  const isAllInWithFiveCards = isAllInShowdown && communityCardsLength === 5;

  const startPhaseNow = winnerIds.length > 0 && !isAllInWithFiveCards;

  return { winnerIds, winningHand, startPhaseNow };
}
