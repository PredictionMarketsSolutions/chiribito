import { describe, it, expect } from "vitest";
import { slideEase, dampedSettle, chipFlightTransform, chipBurstCount } from "./chip-motion";

describe("slideEase — chip slide with inertia (ease-out, felt friction)", () => {
  it("is pinned at the endpoints", () => {
    expect(slideEase(0)).toBe(0);
    expect(slideEase(1)).toBe(1);
  });

  it("decelerates into the target (past the diagonal in the first half)", () => {
    expect(slideEase(0.5)).toBeGreaterThan(0.5);
  });

  it("is monotonic increasing", () => {
    let prev = -Infinity;
    for (let t = 0; t <= 1.0001; t += 0.1) {
      const v = slideEase(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe("dampedSettle — settle with a small damped overshoot (a chip landing)", () => {
  it("starts at 0 and settles at 1", () => {
    expect(dampedSettle(0)).toBeCloseTo(0, 6);
    expect(dampedSettle(1)).toBeCloseTo(1, 6);
  });

  it("overshoots past 1 before settling (a physical bounce, not flat)", () => {
    let maxV = -Infinity;
    for (let t = 0; t <= 1.0001; t += 0.02) maxV = Math.max(maxV, dampedSettle(t));
    expect(maxV).toBeGreaterThan(1);
  });

  it("keeps the overshoot subtle, never arcade/exaggerated", () => {
    let maxV = -Infinity;
    for (let t = 0; t <= 1.0001; t += 0.02) maxV = Math.max(maxV, dampedSettle(t));
    expect(maxV).toBeLessThan(1.15);
  });
});

describe("chipFlightTransform — a chip sliding from origin to the pot", () => {
  const from = { x: 0, y: 0 };
  const to = { x: 100, y: -40 };

  it("starts exactly at the origin, flat", () => {
    const s = chipFlightTransform(0, from, to);
    expect(s.x).toBeCloseTo(0, 6);
    expect(s.y).toBeCloseTo(0, 6);
    expect(s.scale).toBeCloseTo(1, 6);
  });

  it("settles exactly at the destination, flat", () => {
    const s = chipFlightTransform(1, from, to);
    expect(s.x).toBeCloseTo(100, 6);
    expect(s.y).toBeCloseTo(-40, 6);
    expect(s.scale).toBeCloseTo(1, 6);
  });

  it("overshoots the destination near the end (inertia past the pot, then settles)", () => {
    let beyond = false;
    for (let t = 0.6; t < 1; t += 0.02) {
      if (chipFlightTransform(t, from, to).x > 100) beyond = true;
    }
    expect(beyond).toBe(true);
  });

  it("lifts subtly mid-flight then settles flat (scale > 1 mid, = 1 at both ends)", () => {
    const mid = chipFlightTransform(0.5, from, to);
    expect(mid.scale).toBeGreaterThan(1);
    expect(mid.scale).toBeLessThan(1.12);
  });

  it("clamps out-of-range t to the endpoints (safe for rAF overrun)", () => {
    expect(chipFlightTransform(-1, from, to).x).toBeCloseTo(0, 6);
    expect(chipFlightTransform(2, from, to).x).toBeCloseTo(100, 6);
  });
});

describe("chipBurstCount — how many chips fly for a bet amount", () => {
  it("is 0 for non-positive amounts", () => {
    expect(chipBurstCount(0)).toBe(0);
    expect(chipBurstCount(-50)).toBe(0);
  });

  it("flies at least one chip for any positive bet", () => {
    expect(chipBurstCount(1)).toBeGreaterThanOrEqual(1);
  });

  it("flies more chips for bigger bets (non-decreasing)", () => {
    let prev = -1;
    for (const a of [1, 50, 200, 1000, 5000]) {
      const n = chipBurstCount(a);
      expect(n).toBeGreaterThanOrEqual(prev);
      prev = n;
    }
  });

  it("caps the burst so huge bets never spray (premium, not a jackpot)", () => {
    expect(chipBurstCount(1e9)).toBeLessThanOrEqual(5);
  });
});
