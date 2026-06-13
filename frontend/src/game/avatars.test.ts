/**
 * Tests for the castizo avatar glyph helper.
 * RED: fails until frontend/src/game/avatars.ts is created.
 */
import { describe, it, expect } from "vitest";
import { resolveAvatarGlyph, AVATAR_GLYPHS } from "./avatars";

describe("resolveAvatarGlyph", () => {
  it("resolves 'pato' to the pato glyph 🦆", () => {
    expect(resolveAvatarGlyph("pato")).toBe("🦆");
    expect(AVATAR_GLYPHS["pato"]).toBe("🦆");
  });

  it("resolves 'toro' to the toro glyph 🐂", () => {
    expect(resolveAvatarGlyph("toro")).toBe("🐂");
    expect(AVATAR_GLYPHS["toro"]).toBe("🐂");
  });

  it("unknown key returns the default glyph (not undefined, not a mascot glyph)", () => {
    const defaultGlyph = resolveAvatarGlyph("garrido");
    expect(defaultGlyph).toBeTruthy();
    expect(defaultGlyph).not.toBe("undefined");
    expect(defaultGlyph).not.toBe("🦆");
    expect(defaultGlyph).not.toBe("🐂");
    // Same for another unknown key
    const defaultGlyph2 = resolveAvatarGlyph("manola");
    expect(defaultGlyph2).toBe(defaultGlyph); // all unknown keys return the same default
  });

  it("empty string returns the default glyph (never 'undefined')", () => {
    const result = resolveAvatarGlyph("");
    expect(result).toBeTruthy();
    expect(result).not.toBe("undefined");
    expect(result).not.toBe("🦆");
    expect(result).not.toBe("🐂");
  });

  it("AVATAR_GLYPHS has a non-empty 'default' key", () => {
    expect(typeof AVATAR_GLYPHS["default"]).toBe("string");
    expect(AVATAR_GLYPHS["default"].length).toBeGreaterThan(0);
  });
});
