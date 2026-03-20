import { describe, it, expect, beforeEach } from "vitest";
import { setupCardPopover } from "./card-popover";

describe("card-popover", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="seats">
        <div class="seat-hand" data-cards='["1O","2O"]'></div>
      </div>
      <div id="popover" class="hidden" aria-hidden="true"></div>
      <div id="cards"></div>
    `;
  });

  it("shows popover with cards on click", () => {
    const seatsEl = document.querySelector("#seats") as HTMLElement;
    const cardPopover = document.querySelector("#popover") as HTMLElement;
    const cardPopoverCards = document.querySelector("#cards") as HTMLElement;
    setupCardPopover({ seatsEl, cardPopover, cardPopoverCards });
    (document.querySelector(".seat-hand") as HTMLElement).click();
    expect(cardPopover.classList.contains("hidden")).toBe(false);
    expect(cardPopoverCards.children.length).toBeGreaterThan(0);
  });
});
