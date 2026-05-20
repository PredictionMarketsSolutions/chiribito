import { describe, it, expect } from "vitest";
import { SUIT_CODES, SUIT_NAMES_ES, suitGlyph } from "./suits";

describe("suits", () => {
  it("has the 4 canonical Spanish suits in canon order", () => {
    expect(SUIT_CODES).toEqual(["O", "C", "E", "B"]);
    expect(SUIT_NAMES_ES.O).toBe("Oros");
    expect(SUIT_NAMES_ES.B).toBe("Bastos");
  });

  it("builds an svg glyph tagged with its suit", () => {
    const g = suitGlyph("E", 16);
    expect(g.getAttribute("data-suit")).toBe("E");
    expect(g.getAttribute("width")).toBe("16");
  });
});
