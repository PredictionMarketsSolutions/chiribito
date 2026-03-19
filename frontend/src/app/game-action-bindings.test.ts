import { describe, it, expect, vi, beforeEach } from "vitest";
import { bindGameActionButtons, getBetAmountFromInput } from "./game-action-bindings";

describe("game-action-bindings", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="start-game"></button>
      <button id="check"></button>
      <button id="call"></button>
      <button id="fold"></button>
      <button id="all-in"></button>
      <button id="bet"></button>
      <button id="raise"></button>
      <input id="bet-amount" />
    `;
  });

  it("getBetAmountFromInput returns 0 for invalid values", () => {
    const input = document.querySelector("#bet-amount") as HTMLInputElement;
    input.value = "abc";
    expect(getBetAmountFromInput(input)).toBe(0);
  });

  it("binds simple actions and dispatches queueAction", () => {
    const queueAction = vi.fn();
    const log = vi.fn();
    bindGameActionButtons(
      {
        startGameButton: document.querySelector("#start-game") as HTMLButtonElement,
        checkButton: document.querySelector("#check") as HTMLButtonElement,
        callButton: document.querySelector("#call") as HTMLButtonElement,
        foldButton: document.querySelector("#fold") as HTMLButtonElement,
        allInButton: document.querySelector("#all-in") as HTMLButtonElement,
        betButton: document.querySelector("#bet") as HTMLButtonElement,
        raiseButton: document.querySelector("#raise") as HTMLButtonElement,
        betAmountInput: document.querySelector("#bet-amount") as HTMLInputElement,
      },
      queueAction,
      log
    );

    (document.querySelector("#start-game") as HTMLButtonElement).click();
    (document.querySelector("#check") as HTMLButtonElement).click();
    (document.querySelector("#call") as HTMLButtonElement).click();
    (document.querySelector("#fold") as HTMLButtonElement).click();
    (document.querySelector("#all-in") as HTMLButtonElement).click();

    expect(queueAction).toHaveBeenCalledWith("startGame", undefined);
    expect(queueAction).toHaveBeenCalledWith("check", undefined);
    expect(queueAction).toHaveBeenCalledWith("call", undefined);
    expect(queueAction).toHaveBeenCalledWith("fold", undefined);
    expect(queueAction).toHaveBeenCalledWith("allIn", undefined);
    expect(log).not.toHaveBeenCalled();
  });

  it("logs and blocks bet/raise when amount is invalid", () => {
    const queueAction = vi.fn();
    const log = vi.fn();
    const betAmountInput = document.querySelector("#bet-amount") as HTMLInputElement;
    betAmountInput.value = "0";

    bindGameActionButtons(
      {
        startGameButton: document.querySelector("#start-game") as HTMLButtonElement,
        checkButton: document.querySelector("#check") as HTMLButtonElement,
        callButton: document.querySelector("#call") as HTMLButtonElement,
        foldButton: document.querySelector("#fold") as HTMLButtonElement,
        allInButton: document.querySelector("#all-in") as HTMLButtonElement,
        betButton: document.querySelector("#bet") as HTMLButtonElement,
        raiseButton: document.querySelector("#raise") as HTMLButtonElement,
        betAmountInput,
      },
      queueAction,
      log
    );

    (document.querySelector("#bet") as HTMLButtonElement).click();
    (document.querySelector("#raise") as HTMLButtonElement).click();

    expect(queueAction).not.toHaveBeenCalledWith("bet", expect.anything());
    expect(queueAction).not.toHaveBeenCalledWith("raise", expect.anything());
    expect(log).toHaveBeenCalledWith("Invalid bet amount.");
    expect(log).toHaveBeenCalledWith("Invalid raise amount.");
  });

  it("dispatches bet and raise with parsed amount", () => {
    const queueAction = vi.fn();
    const log = vi.fn();
    const betAmountInput = document.querySelector("#bet-amount") as HTMLInputElement;
    betAmountInput.value = "150";

    bindGameActionButtons(
      {
        startGameButton: document.querySelector("#start-game") as HTMLButtonElement,
        checkButton: document.querySelector("#check") as HTMLButtonElement,
        callButton: document.querySelector("#call") as HTMLButtonElement,
        foldButton: document.querySelector("#fold") as HTMLButtonElement,
        allInButton: document.querySelector("#all-in") as HTMLButtonElement,
        betButton: document.querySelector("#bet") as HTMLButtonElement,
        raiseButton: document.querySelector("#raise") as HTMLButtonElement,
        betAmountInput,
      },
      queueAction,
      log
    );

    (document.querySelector("#bet") as HTMLButtonElement).click();
    (document.querySelector("#raise") as HTMLButtonElement).click();
    expect(queueAction).toHaveBeenCalledWith("bet", 150);
    expect(queueAction).toHaveBeenCalledWith("raise", 150);
    expect(log).not.toHaveBeenCalledWith("Invalid bet amount.");
    expect(log).not.toHaveBeenCalledWith("Invalid raise amount.");
  });
});
