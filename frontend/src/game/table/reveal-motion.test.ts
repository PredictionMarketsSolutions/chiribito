import { describe, it, expect } from "vitest";
import { flipState, FLIP_MIN_WIDTH_FACTOR } from "./reveal-motion";

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
