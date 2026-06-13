import { describe, it, expect, vi, beforeEach } from "vitest";
import { bindPracticeEntry } from "./practice-entry";

function buildDom() {
  document.body.innerHTML = `
    <div class="practice-selector" role="group" aria-label="Rivales">
      <button type="button" class="practice-selector__chip" data-bots="1" aria-pressed="false">1</button>
      <button type="button" class="practice-selector__chip" data-bots="2" aria-pressed="false">2</button>
      <button type="button" class="practice-selector__chip is-selected" data-bots="3" aria-pressed="true">3</button>
      <button type="button" class="practice-selector__chip" data-bots="4" aria-pressed="false">4</button>
      <button type="button" class="practice-selector__chip" data-bots="5" aria-pressed="false">5</button>
    </div>
    <button id="practice-start" type="button">Empezar</button>
  `;
}

describe("practice-entry", () => {
  describe("bindPracticeEntry", () => {
    beforeEach(() => {
      buildDom();
    });

    it("default: clicking #practice-start with default DOM selection (3) calls joinRoom with practiceBotCount:3", async () => {
      const joinRoom = vi.fn().mockResolvedValue(undefined);
      const log = vi.fn();

      bindPracticeEntry({
        getSelectorEl: () => document.querySelector(".practice-selector")!,
        getStartBtn: () => document.querySelector("#practice-start") as HTMLButtonElement,
        joinRoom,
        log,
      });

      (document.querySelector("#practice-start") as HTMLButtonElement).click();
      // Allow microtask/promise to settle
      await Promise.resolve();

      expect(joinRoom).toHaveBeenCalledWith(false, {
        mode: "create",
        practiceMode: "practice",
        practiceBotCount: 3,
      });
    });

    it("selection change: clicking data-bots='4' chip then #practice-start calls joinRoom with practiceBotCount:4", async () => {
      const joinRoom = vi.fn().mockResolvedValue(undefined);
      const log = vi.fn();

      bindPracticeEntry({
        getSelectorEl: () => document.querySelector(".practice-selector")!,
        getStartBtn: () => document.querySelector("#practice-start") as HTMLButtonElement,
        joinRoom,
        log,
      });

      const chip4 = document.querySelector<HTMLButtonElement>("[data-bots='4']")!;
      chip4.click();
      (document.querySelector("#practice-start") as HTMLButtonElement).click();
      await Promise.resolve();

      expect(joinRoom).toHaveBeenCalledWith(false, {
        mode: "create",
        practiceMode: "practice",
        practiceBotCount: 4,
      });
    });

    it("selection change: clicked chip gains is-selected and aria-pressed=true; others lose them", () => {
      const joinRoom = vi.fn().mockResolvedValue(undefined);

      bindPracticeEntry({
        getSelectorEl: () => document.querySelector(".practice-selector")!,
        getStartBtn: () => document.querySelector("#practice-start") as HTMLButtonElement,
        joinRoom,
        log: vi.fn(),
      });

      const chip2 = document.querySelector<HTMLButtonElement>("[data-bots='2']")!;
      chip2.click();

      expect(chip2.classList.contains("is-selected")).toBe(true);
      expect(chip2.getAttribute("aria-pressed")).toBe("true");

      // Other chips must not be selected
      const others = document.querySelectorAll<HTMLButtonElement>(".practice-selector__chip:not([data-bots='2'])");
      others.forEach((c) => {
        expect(c.classList.contains("is-selected")).toBe(false);
        expect(c.getAttribute("aria-pressed")).toBe("false");
      });
    });

    it("clamp high: a chip with data-bots='9' resolves to 5", async () => {
      // Inject an out-of-range chip
      document.querySelector(".practice-selector")!.innerHTML += `
        <button type="button" class="practice-selector__chip" data-bots="9" aria-pressed="false">9</button>
      `;

      const joinRoom = vi.fn().mockResolvedValue(undefined);

      bindPracticeEntry({
        getSelectorEl: () => document.querySelector(".practice-selector")!,
        getStartBtn: () => document.querySelector("#practice-start") as HTMLButtonElement,
        joinRoom,
        log: vi.fn(),
      });

      document.querySelector<HTMLButtonElement>("[data-bots='9']")!.click();
      (document.querySelector("#practice-start") as HTMLButtonElement).click();
      await Promise.resolve();

      expect(joinRoom).toHaveBeenCalledWith(false, {
        mode: "create",
        practiceMode: "practice",
        practiceBotCount: 5,
      });
    });

    it("clamp low: a chip with data-bots='0' resolves to 1", async () => {
      document.querySelector(".practice-selector")!.innerHTML += `
        <button type="button" class="practice-selector__chip" data-bots="0" aria-pressed="false">0</button>
      `;

      const joinRoom = vi.fn().mockResolvedValue(undefined);

      bindPracticeEntry({
        getSelectorEl: () => document.querySelector(".practice-selector")!,
        getStartBtn: () => document.querySelector("#practice-start") as HTMLButtonElement,
        joinRoom,
        log: vi.fn(),
      });

      document.querySelector<HTMLButtonElement>("[data-bots='0']")!.click();
      (document.querySelector("#practice-start") as HTMLButtonElement).click();
      await Promise.resolve();

      expect(joinRoom).toHaveBeenCalledWith(false, {
        mode: "create",
        practiceMode: "practice",
        practiceBotCount: 1,
      });
    });

    it("joinRoom rejection is caught and logged (no unhandled rejection)", async () => {
      const joinRoom = vi.fn().mockRejectedValue(new Error("Network error"));
      const log = vi.fn();

      bindPracticeEntry({
        getSelectorEl: () => document.querySelector(".practice-selector")!,
        getStartBtn: () => document.querySelector("#practice-start") as HTMLButtonElement,
        joinRoom,
        log,
      });

      (document.querySelector("#practice-start") as HTMLButtonElement).click();
      // Wait for the rejected promise to be caught
      await new Promise((r) => setTimeout(r, 0));

      expect(log).toHaveBeenCalledWith(expect.stringContaining("Network error"));
    });
  });
});
