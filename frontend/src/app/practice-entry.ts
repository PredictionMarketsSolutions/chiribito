/**
 * Practice entry controller.
 * Pure function with injected deps — no globals, fully testable.
 * Mirrors lobby-controller.ts / game-action-bindings.ts pattern.
 */

export type PracticeEntryDeps = {
  getSelectorEl: () => HTMLElement;
  getStartBtn: () => HTMLButtonElement;
  joinRoom: (
    forceReplace: boolean,
    opts: { mode: "create"; practiceMode: "practice"; practiceBotCount: number }
  ) => Promise<void>;
  log: (msg: string) => void;
};

export function bindPracticeEntry(deps: PracticeEntryDeps): void {
  const selectorEl = deps.getSelectorEl();
  const chips = selectorEl.querySelectorAll<HTMLButtonElement>(".practice-selector__chip");

  // Pitfall 4: read default from the DOM's pre-selected chip to stay in sync with markup.
  const preSelected = selectorEl.querySelector<HTMLButtonElement>(".practice-selector__chip.is-selected");
  let selectedBots = Math.max(1, Math.min(5, parseInt(preSelected?.dataset.bots ?? "3", 10)));

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const n = parseInt(chip.dataset.bots ?? "3", 10);
      selectedBots = Math.max(1, Math.min(5, n));
      chips.forEach((c) => {
        const isThis = c === chip;
        c.classList.toggle("is-selected", isThis);
        c.setAttribute("aria-pressed", String(isThis));
      });
    });
  });

  deps.getStartBtn().addEventListener("click", () => {
    deps
      .joinRoom(false, { mode: "create", practiceMode: "practice", practiceBotCount: selectedBots })
      .catch((err: unknown) =>
        deps.log(`Practice join error: ${err instanceof Error ? err.message : String(err)}`)
      );
  });
}
