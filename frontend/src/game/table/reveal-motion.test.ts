import { describe, it, expect } from "vitest";
import { flipState, FLIP_MIN_WIDTH_FACTOR, flipEaseInOut } from "./reveal-motion";

describe("flipState", () => {
  it("starts closed: full width, back showing", () => {
    const s = flipState(0);
    expect(s.widthFactor).toBeCloseTo(1, 6);
    expect(s.showFront).toBe(false);
  });

  it("swaps to the face at the midpoint, at the perceptual width floor", () => {
    const s = flipState(0.5);
    expect(s.widthFactor).toBeCloseTo(FLIP_MIN_WIDTH_FACTOR, 6);
    expect(s.showFront).toBe(true);
  });

  it("ends open: full width, face showing", () => {
    const s = flipState(1);
    expect(s.widthFactor).toBeCloseTo(1, 6);
    expect(s.showFront).toBe(true);
  });

  it("never narrows below the perceptual floor across the whole turn", () => {
    for (let i = 0; i <= 20; i += 1) {
      const { widthFactor } = flipState(i / 20);
      expect(widthFactor).toBeGreaterThanOrEqual(FLIP_MIN_WIDTH_FACTOR - 1e-9);
      expect(widthFactor).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it("shows the back before the midpoint and the face from the midpoint on", () => {
    expect(flipState(0.25).showFront).toBe(false);
    expect(flipState(0.49).showFront).toBe(false);
    expect(flipState(0.5).showFront).toBe(true);
    expect(flipState(0.75).showFront).toBe(true);
  });

  it("clamps out-of-range progress instead of extrapolating", () => {
    expect(flipState(-0.5)).toEqual(flipState(0));
    expect(flipState(1.5)).toEqual(flipState(1));
  });
});

describe("flipState — custom width floor (mobile sobriety)", () => {
  it("honors a higher floor so the turn never goes razor edge-on", () => {
    expect(flipState(0.5, 0.16).widthFactor).toBeCloseTo(0.16, 6);
  });
  it("still opens and closes at full width regardless of the floor", () => {
    expect(flipState(0, 0.16).widthFactor).toBeCloseTo(1, 6);
    expect(flipState(1, 0.16).widthFactor).toBeCloseTo(1, 6);
  });
  it("keeps the midpoint face-swap with a custom floor", () => {
    expect(flipState(0.49, 0.16).showFront).toBe(false);
    expect(flipState(0.5, 0.16).showFront).toBe(true);
  });
  it("never narrows below the custom floor across the whole turn", () => {
    for (let i = 0; i <= 20; i += 1) {
      const { widthFactor } = flipState(i / 20, 0.16);
      expect(widthFactor).toBeGreaterThanOrEqual(0.16 - 1e-9);
      expect(widthFactor).toBeLessThanOrEqual(1 + 1e-9);
    }
  });
});

describe("flipEaseInOut", () => {
  it("pins the endpoints and the midpoint", () => {
    expect(flipEaseInOut(0)).toBeCloseTo(0, 6);
    expect(flipEaseInOut(0.5)).toBeCloseTo(0.5, 6);
    expect(flipEaseInOut(1)).toBeCloseTo(1, 6);
  });
  it("is monotonic non-decreasing", () => {
    let prev = -1;
    for (let i = 0; i <= 20; i += 1) {
      const v = flipEaseInOut(i / 20);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });
  it("eases in then out (slower than linear early, faster late)", () => {
    expect(flipEaseInOut(0.25)).toBeLessThan(0.25);
    expect(flipEaseInOut(0.75)).toBeGreaterThan(0.75);
  });
  it("clamps out-of-range input", () => {
    expect(flipEaseInOut(-1)).toBeCloseTo(0, 6);
    expect(flipEaseInOut(2)).toBeCloseTo(1, 6);
  });
});
