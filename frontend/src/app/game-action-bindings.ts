type QueueActionFn = (action: string, data: unknown) => void;
type LogFn = (message: string) => void;

export type GameActionBindingRefs = {
  startGameButton: HTMLButtonElement;
  checkButton: HTMLButtonElement;
  callButton: HTMLButtonElement;
  foldButton: HTMLButtonElement;
  allInButton: HTMLButtonElement;
  betButton: HTMLButtonElement;
  raiseButton: HTMLButtonElement;
  betAmountInput: HTMLInputElement;
};

export function getBetAmountFromInput(input: HTMLInputElement): number {
  const amount = parseInt(input.value, 10);
  return Number.isFinite(amount) ? amount : 0;
}

export function bindGameActionButtons(
  refs: GameActionBindingRefs,
  queueAction: QueueActionFn,
  log: LogFn
): void {
  refs.startGameButton.addEventListener("click", () => {
    queueAction("startGame", undefined);
  });

  refs.checkButton.addEventListener("click", () => {
    queueAction("check", undefined);
  });

  refs.callButton.addEventListener("click", () => {
    queueAction("call", undefined);
  });

  refs.foldButton.addEventListener("click", () => {
    queueAction("fold", undefined);
  });

  refs.allInButton.addEventListener("click", () => {
    queueAction("allIn", undefined);
  });

  refs.betButton.addEventListener("click", () => {
    const amount = getBetAmountFromInput(refs.betAmountInput);
    if (amount <= 0) {
      log("Invalid bet amount.");
      return;
    }
    queueAction("bet", amount);
  });

  refs.raiseButton.addEventListener("click", () => {
    const amount = getBetAmountFromInput(refs.betAmountInput);
    if (amount <= 0) {
      log("Invalid raise amount.");
      return;
    }
    queueAction("raise", amount);
  });
}
