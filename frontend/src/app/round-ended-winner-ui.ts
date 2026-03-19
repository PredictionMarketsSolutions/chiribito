export type WinnerUiState = {
  lastWinners: string[];
  lastWinningHand: string;
};

export function applyWinnerUiState(
  state: WinnerUiState,
  params: {
    winnerIds: string[];
    winningHand: string;
    winnersStatusEl: HTMLElement;
    winningHandStatusEl: HTMLElement;
    winningHandChipEl: HTMLElement;
  }
): void {
  state.lastWinners = params.winnerIds;
  state.lastWinningHand = params.winningHand;
  params.winnersStatusEl.textContent = state.lastWinners.join(", ") || "-";
  params.winningHandStatusEl.textContent = state.lastWinningHand;
  params.winningHandChipEl.textContent = state.lastWinningHand;
}

export function getWinnerBannerText(
  winningHand: string,
  winnerIds: string[],
  latestPlayerNames: Map<string, string>
): string {
  const firstWinnerId = winnerIds[0];
  if (!winningHand || !firstWinnerId) return "";
  const firstWinnerName = latestPlayerNames.get(firstWinnerId) ?? firstWinnerId;
  return `${winningHand} para ${firstWinnerName}`;
}
