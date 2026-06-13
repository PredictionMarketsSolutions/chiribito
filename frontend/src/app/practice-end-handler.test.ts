import { describe, it, expect, vi, beforeEach } from "vitest";
import { handlePracticeEndMessage, bindPracticeEndOverlay } from "./practice-end-handler";

describe("practice-end-handler", () => {
  describe("handlePracticeEndMessage", () => {
    it("calls showPracticeEndScreen with the champion object", () => {
      const showPracticeEndScreen = vi.fn();
      const log = vi.fn();

      handlePracticeEndMessage({
        payload: { champion: { name: "Bot 1", chips: 6000 } },
        showPracticeEndScreen,
        log,
      });

      expect(showPracticeEndScreen).toHaveBeenCalledWith({ name: "Bot 1", chips: 6000 });
    });

    it("missing champion: payload {} calls showPracticeEndScreen with {}", () => {
      const showPracticeEndScreen = vi.fn();
      const log = vi.fn();

      handlePracticeEndMessage({
        payload: {},
        showPracticeEndScreen,
        log,
      });

      expect(showPracticeEndScreen).toHaveBeenCalledWith({});
    });

    it("logs the champion name", () => {
      const showPracticeEndScreen = vi.fn();
      const log = vi.fn();

      handlePracticeEndMessage({
        payload: { champion: { name: "Máquina 2", chips: 3000 } },
        showPracticeEndScreen,
        log,
      });

      expect(log).toHaveBeenCalled();
    });
  });

  describe("bindPracticeEndOverlay", () => {
    let otraPartidaBtn: HTMLButtonElement;
    let salirBtn: HTMLButtonElement;

    beforeEach(() => {
      document.body.innerHTML = `
        <button id="otra-partida-btn">Otra partida</button>
        <button id="practice-salir-btn">Salir</button>
      `;
      otraPartidaBtn = document.querySelector("#otra-partida-btn") as HTMLButtonElement;
      salirBtn = document.querySelector("#practice-salir-btn") as HTMLButtonElement;
    });

    it("Otra partida: first click calls sendPlayAgain exactly once", () => {
      const sendPlayAgain = vi.fn();

      bindPracticeEndOverlay({
        otraPartidaBtn,
        sendPlayAgain,
      });

      otraPartidaBtn.click();

      expect(sendPlayAgain).toHaveBeenCalledTimes(1);
    });

    it("Otra partida: button is disabled after first click — second click does NOT call sendPlayAgain again", () => {
      const sendPlayAgain = vi.fn();

      bindPracticeEndOverlay({
        otraPartidaBtn,
        sendPlayAgain,
      });

      otraPartidaBtn.click();
      otraPartidaBtn.click();

      expect(sendPlayAgain).toHaveBeenCalledTimes(1);
    });

    it("Salir: click calls leave callback", () => {
      const sendPlayAgain = vi.fn();
      const leave = vi.fn();

      bindPracticeEndOverlay({
        otraPartidaBtn,
        salirBtn,
        sendPlayAgain,
        leave,
      });

      salirBtn.click();

      expect(leave).toHaveBeenCalledTimes(1);
    });

    it("Salir: no leave callback — no error", () => {
      const sendPlayAgain = vi.fn();

      expect(() => {
        bindPracticeEndOverlay({
          otraPartidaBtn,
          sendPlayAgain,
          // no salirBtn, no leave
        });
        salirBtn.click();
      }).not.toThrow();
    });
  });
});
