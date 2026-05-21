import { describe, it, expect, afterEach, vi } from "vitest";
import { prefersReducedMotion, countUpValueAt, tiltFromPointer, applyRevealOrder } from "./interactions";

afterEach(() => { vi.unstubAllGlobals(); });

describe("prefersReducedMotion", () => {
  it("is false when matchMedia is unavailable (jsdom default)", () => {
    expect(prefersReducedMotion()).toBe(false);
  });
  it("is true when the media query matches", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q,
      addEventListener() {}, removeEventListener() {} }));
    expect(prefersReducedMotion()).toBe(true);
  });
});

describe("countUpValueAt (easeOutCubic, rounded)", () => {
  it("is 0 at t<=0 and the target at t>=1", () => {
    expect(countUpValueAt(142, 0)).toBe(0);
    expect(countUpValueAt(142, 1)).toBe(142);
    expect(countUpValueAt(142, 2)).toBe(142); // clamped
  });
  it("is monotonic and never overshoots the target", () => {
    const a = countUpValueAt(142, 0.3);
    const b = countUpValueAt(142, 0.6);
    expect(a).toBeLessThanOrEqual(b);
    expect(b).toBeLessThanOrEqual(142);
  });
});

describe("tiltFromPointer", () => {
  const rect = { left: 0, top: 0, width: 200, height: 300 };
  it("is flat at the centre", () => {
    expect(tiltFromPointer(100, 150, rect, 7)).toEqual({ rotateX: 0, rotateY: 0 });
  });
  it("clamps to ±maxDeg at the edges", () => {
    expect(tiltFromPointer(200, 150, rect, 7).rotateY).toBeCloseTo(7);
    expect(tiltFromPointer(0, 150, rect, 7).rotateY).toBeCloseTo(-7);
    expect(Math.abs(tiltFromPointer(100, 0, rect, 7).rotateX)).toBeCloseTo(7);
  });
});

describe("applyRevealOrder", () => {
  it("sets --reveal-i incrementally", () => {
    const a = document.createElement("div");
    const b = document.createElement("div");
    applyRevealOrder([a, b]);
    expect(a.style.getPropertyValue("--reveal-i")).toBe("0");
    expect(b.style.getPropertyValue("--reveal-i")).toBe("1");
  });
});
