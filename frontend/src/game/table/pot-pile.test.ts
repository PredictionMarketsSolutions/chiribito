import { describe, it, expect } from "vitest";
import { renderPotPile } from "./pot-pile";
import { potChipLayout } from "./chip-stack";

describe("renderPotPile — paints the physical pot pile in the centre", () => {
  it("paints one .pot-chip element per chip in the layout", () => {
    const c = document.createElement("div");
    renderPotPile(c, 3725);
    expect(c.querySelectorAll(".pot-chip").length).toBe(potChipLayout(3725).length);
  });

  it("clears the pile when the pot drops to zero", () => {
    const c = document.createElement("div");
    renderPotPile(c, 1000);
    renderPotPile(c, 0);
    expect(c.querySelectorAll(".pot-chip").length).toBe(0);
  });

  it("repaints (does not accumulate) when the pot changes", () => {
    const c = document.createElement("div");
    renderPotPile(c, 8000);
    renderPotPile(c, 25);
    expect(c.querySelectorAll(".pot-chip").length).toBe(1);
  });

  it("tags each chip with its denomination colour class", () => {
    const c = document.createElement("div");
    renderPotPile(c, 1000);
    expect(c.querySelector(".pot-chip--gold")).not.toBeNull();
  });
});
