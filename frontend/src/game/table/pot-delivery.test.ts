import { describe, it, expect } from "vitest";
import { deliverPotToWinner } from "./pot-delivery";
import { renderPotPile } from "./pot-pile";

const from = { x: 0, y: 0 };
const to = { x: 140, y: 120 };

describe("deliverPotToWinner — the pot slides to the winner, then the centre clears", () => {
  it("clears the pot pile after delivering", async () => {
    const surface = document.createElement("div");
    const pile = document.createElement("div");
    document.body.append(surface, pile);
    renderPotPile(pile, 3000);
    expect(pile.querySelectorAll(".pot-chip").length).toBeGreaterThan(0);

    await deliverPotToWinner(surface, pile, from, to, 3000, { durationMs: 20, staggerMs: 2, reducedMotion: false });

    expect(pile.querySelectorAll(".pot-chip").length).toBe(0);
    surface.remove();
    pile.remove();
  });

  it("still clears the pile instantly under reduced motion", async () => {
    const surface = document.createElement("div");
    const pile = document.createElement("div");
    document.body.append(surface, pile);
    renderPotPile(pile, 1000);

    await deliverPotToWinner(surface, pile, from, to, 1000, { reducedMotion: true });

    expect(pile.querySelectorAll(".pot-chip").length).toBe(0);
    surface.remove();
    pile.remove();
  });

  it("does nothing and resolves for an empty pot", async () => {
    const surface = document.createElement("div");
    const pile = document.createElement("div");
    document.body.append(surface, pile);
    await deliverPotToWinner(surface, pile, from, to, 0, { reducedMotion: false });
    expect(surface.querySelectorAll(".chip-fly").length).toBe(0);
    surface.remove();
    pile.remove();
  });
});
