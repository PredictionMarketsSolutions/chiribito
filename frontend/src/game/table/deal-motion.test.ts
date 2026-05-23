import { describe, it, expect } from "vitest";
import { restingRotationFor, HOLE_REST_ROT_MAX } from "./deal-motion";

describe("restingRotationFor", () => {
  it("is deterministic — same inputs return the same angle on every call", () => {
    expect(restingRotationFor(0, 0)).toBe(restingRotationFor(0, 0));
    expect(restingRotationFor(3, 1)).toBe(restingRotationFor(3, 1));
  });

  it("stays within the conservative magnitude bound (incl. wrap-around slots)", () => {
    for (let v = 0; v < 12; v += 1) {
      for (let c = 0; c < 2; c += 1) {
        expect(Math.abs(restingRotationFor(v, c))).toBeLessThanOrEqual(HOLE_REST_ROT_MAX + 1e-9);
      }
    }
  });

  it("leans the two cards of a pair differently (never mirror-perfect)", () => {
    for (let v = 0; v < 6; v += 1) {
      expect(restingRotationFor(v, 0)).not.toBe(restingRotationFor(v, 1));
    }
  });

  it("never returns NaN, even for out-of-range indices", () => {
    expect(Number.isNaN(restingRotationFor(99, 0))).toBe(false);
    expect(Number.isNaN(restingRotationFor(99, 1))).toBe(false);
    expect(Number.isNaN(restingRotationFor(0, 5))).toBe(false);
  });
});
