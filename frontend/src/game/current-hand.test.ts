/**
 * Tests for getCurrentHandName (current hand display for the player).
 *
 * All test cards come from the canonical Chiribito deck:
 *   ranks   5, 6, 7, 10 (Sota), 11 (Caballo), 12 (Rey), 1 (As)
 *   suits   O (Oros), C (Copas), E (Espadas), B (Bastos)
 *
 * Ranks 2, 3, 4, 8, 9 do NOT exist in this deck. If a future test ever
 * uses one, treat it as a bug.
 */
import { describe, it, expect } from "vitest";
import { getCurrentHandName } from "./current-hand";

describe("current-hand", () => {
  it("returns empty when hole has less than 2 cards", () => {
    expect(getCurrentHandName([], [])).toBe("");
    expect(getCurrentHandName(["1C"], ["7O", "10E", "11C"])).toBe("");
  });

  it("returns Carta alta when community has less than 3 cards (from start)", () => {
    expect(getCurrentHandName(["1C", "1E"], [])).toBe("Carta alta");
    expect(getCurrentHandName(["1C", "12E"], ["7O", "5E"])).toBe("Carta alta");
  });

  it("returns Perla when hole is Sota (10) + 7 of the same suit", () => {
    expect(getCurrentHandName(["10O", "7O"], ["12E", "11C", "5C"])).toBe("Perla");
    expect(getCurrentHandName(["7C", "10C"], ["12E", "11O", "5O"])).toBe("Perla");
  });

  it("does NOT call Sota + Caballo suited a Perla (the heredado mistake)", () => {
    // Used to be Perla in the broken Hold'em-style code. Now must NOT be.
    const result = getCurrentHandName(["10O", "11O"], ["12E", "5C", "6C"]);
    expect(result).not.toBe("Perla");
  });

  it("returns Pareja when best hand is a pair", () => {
    const community = ["5O", "6E", "7C", "12C", "11E"];
    expect(getCurrentHandName(["1C", "1E"], community)).toBe("Pareja");
  });

  it("returns Carta alta when no made hand", () => {
    // With only 7 ranks in the Chiribito deck, straights happen easily.
    // Use the minimum 3 community cards to keep this test focused.
    const community = ["5O", "6B", "7C"];
    expect(getCurrentHandName(["1C", "12E"], community)).toBe("Carta alta");
  });

  it("returns Trío when three of a kind", () => {
    const community = ["1O", "1E", "7C", "12C", "11C"];
    expect(getCurrentHandName(["1C", "5O"], community)).toBe("Trío");
  });

  it("returns Doble pareja when two distinct pairs are made", () => {
    const community = ["5O", "5E", "12C", "11E", "7B"];
    expect(getCurrentHandName(["1C", "1B"], community)).toBe("Doble pareja");
  });
});
