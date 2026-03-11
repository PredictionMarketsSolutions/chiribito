/**
 * Overlay UI: lobby visibility, lobby message, tournament result.
 * Pure helpers that take DOM refs; no global state.
 */

export type OverlayRefs = {
  lobbyOverlay: HTMLElement;
  lobbyMessage: HTMLElement;
  tournamentResultOverlay: HTMLElement;
  tournamentResultTitle: HTMLElement;
  tournamentResultMessage: HTMLElement;
};

export type SetAuthOverlayVisibleFn = (visible: boolean) => void;

export function setLobbyOverlayVisible(
  refs: OverlayRefs,
  visible: boolean
): void {
  if (visible) {
    refs.lobbyOverlay.classList.remove("hidden");
  } else {
    refs.lobbyOverlay.classList.add("hidden");
  }
}

export function setLobbyMessage(
  refs: OverlayRefs,
  message: string,
  type: "success" | "error" | "info" = "info"
): void {
  refs.lobbyMessage.textContent = message;
  refs.lobbyMessage.classList.remove("success", "error", "info", "visible");
  if (!message) return;
  refs.lobbyMessage.classList.add("visible", type);
}

export function showTournamentResult(
  refs: OverlayRefs,
  setAuthVisible: SetAuthOverlayVisibleFn,
  result: "won" | "lost",
  champion?: { sessionId?: string; name?: string; chips?: number }
): void {
  const name = champion?.name ?? "Ganador";
  const chips = champion?.chips ?? 0;
  if (result === "won") {
    refs.tournamentResultTitle.textContent = "¡Has ganado!";
    refs.tournamentResultMessage.textContent = `Eres el campeón de la mesa con ${chips} fichas. La mesa se ha cerrado.`;
  } else {
    refs.tournamentResultTitle.textContent = "Has perdido";
    refs.tournamentResultMessage.textContent = `${name} ha ganado la mesa con ${chips} fichas. La mesa se ha cerrado.`;
  }
  refs.tournamentResultOverlay.classList.remove("hidden");
  setAuthVisible(false);
  setLobbyOverlayVisible(refs, false);
}

export function setTournamentResultVisible(refs: OverlayRefs, visible: boolean): void {
  if (visible) {
    refs.tournamentResultOverlay.classList.remove("hidden");
  } else {
    refs.tournamentResultOverlay.classList.add("hidden");
  }
}

export function showGameEndMessage(refs: OverlayRefs): void {
  refs.tournamentResultTitle.textContent = "Fin de la mesa";
  refs.tournamentResultMessage.textContent = "La mesa se ha cerrado. Puedes volver al lobby para unirte a otra.";
  refs.tournamentResultOverlay.classList.remove("hidden");
}
