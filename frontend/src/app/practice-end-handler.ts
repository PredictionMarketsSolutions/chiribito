/**
 * Practice-end message handler.
 * Pure functions with injected deps — no globals, fully testable.
 * Mirrors handleGameResultMessage in room-message-handlers.ts.
 */

export type PracticeEndDeps = {
  payload: { champion?: { name?: string; chips?: number } };
  showPracticeEndScreen: (champion: { name?: string; chips?: number }) => void;
  log: (msg: string) => void;
};

export function handlePracticeEndMessage(deps: PracticeEndDeps): void {
  deps.log(`Fin de la partida práctica. Campeón: ${deps.payload.champion?.name ?? "—"}`);
  deps.showPracticeEndScreen(deps.payload.champion ?? {});
}

export type PracticeEndOverlayDeps = {
  otraPartidaBtn: HTMLButtonElement;
  salirBtn?: HTMLButtonElement;
  sendPlayAgain: () => void;
  leave?: () => void;
};

export function bindPracticeEndOverlay(deps: PracticeEndOverlayDeps): void {
  // Pitfall 5: disable the button on first click to prevent double-send.
  deps.otraPartidaBtn.addEventListener("click", () => {
    if (deps.otraPartidaBtn.disabled) return;
    deps.otraPartidaBtn.disabled = true;
    deps.sendPlayAgain();
  });

  if (deps.salirBtn && deps.leave) {
    const leaveHandler = deps.leave;
    deps.salirBtn.addEventListener("click", () => {
      leaveHandler();
    });
  }
}
