import type { HandHistoryWinner, RoomState } from "../types";
import type { RoundEndedPayload } from "../types/room-messages";

export type RoundEndedHistoryData = {
  winnersForHistory: HandHistoryWinner[];
  communityCards: string[];
  yourHand: string[] | undefined;
  potValue: number;
  winningCards: string[] | undefined;
};

export function getWinnersForHistory(payload: RoundEndedPayload): HandHistoryWinner[] {
  const winnersPayload = Array.isArray(payload?.winners) ? payload.winners : [];
  return winnersPayload
    .filter((winner: any) => winner && typeof winner.playerId === "string")
    .map((winner: any) => ({
      playerId: winner.playerId,
      amount: typeof winner.amount === "number" ? winner.amount : undefined,
    }));
}

export function getWinningCardsFromPayload(
  payload: RoundEndedPayload,
  winnersForHistory: HandHistoryWinner[]
): string[] | undefined {
  if (!payload?.playerHands || typeof payload.playerHands !== "object" || winnersForHistory.length === 0) {
    return undefined;
  }
  const firstWinnerId = winnersForHistory[0].playerId;
  const cards = payload.playerHands[firstWinnerId];
  if (Array.isArray(cards) && cards.length > 0) {
    return cards;
  }
  return undefined;
}

export function buildRoundEndedHistoryData(
  payload: RoundEndedPayload,
  params: {
    currentSessionId: string | null;
    potText: string | null;
    schemaArrayToCards: (value: unknown) => string[];
  }
): RoundEndedHistoryData {
  const winnersForHistory = getWinnersForHistory(payload);
  const communityCards = params.schemaArrayToCards(payload?.communityCards);
  const yourHand = params.currentSessionId && payload?.playerHands?.[params.currentSessionId]
    ? payload.playerHands[params.currentSessionId]
    : undefined;
  const potValue = Number(params.potText ?? 0);
  const winningCards = getWinningCardsFromPayload(payload, winnersForHistory);

  return {
    winnersForHistory,
    communityCards,
    yourHand,
    potValue,
    winningCards,
  };
}

export function shouldRenderLastRoomState(
  state: RoomState | null,
  isWinnerPhaseActive: boolean
): boolean {
  return Boolean(state) && !isWinnerPhaseActive;
}
