/**
 * Tests for getCurrentHandName (current hand display for the player).
 */
import { getCurrentHandName } from "./current-hand";

describe("current-hand", () => {
  it("returns empty when hole has less than 2 cards", () => {
    expect(getCurrentHandName([], [])).toBe("");
    expect(getCurrentHandName(["1C"], ["7O", "8E", "9C"])).toBe("");
  });

  it("returns Carta alta when community has less than 3 cards (from start)", () => {
    expect(getCurrentHandName(["1C", "1E"], [])).toBe("Carta alta");
    expect(getCurrentHandName(["1C", "1E"], ["7O", "8E"])).toBe("Carta alta");
  });

  it("returns Perla when hole is 10J suited", () => {
    expect(getCurrentHandName(["10O", "11O"], ["7E", "8C", "9C"])).toBe("Perla");
  });

  it("returns Pareja when best hand is a pair", () => {
    const community = ["7O", "8E", "9C", "12C", "2E"];
    expect(getCurrentHandName(["1C", "1E"], community)).toBe("Pareja");
  });

  it("returns Carta alta when no made hand", () => {
    const community = ["7O", "8E", "9C", "12C", "2E"];
    expect(getCurrentHandName(["1C", "3O"], community)).toBe("Carta alta");
  });

  it("returns Trio when three of a kind", () => {
    const community = ["1O", "1E", "7C", "8C", "9C"];
    expect(getCurrentHandName(["1C", "2O"], community)).toBe("Trio");
  });
});
