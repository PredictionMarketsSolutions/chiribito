import { describe, it, expect, afterEach, vi } from "vitest";
import { prefersReducedMotion, countUpValueAt, tiltFromPointer, applyRevealOrder, runCountUp, attachCarnetTilt, attachLacreShine } from "./interactions";

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

describe("runCountUp", () => {
  it("with reduced motion, sets the final formatted value immediately", () => {
    const el = document.createElement("span");
    runCountUp(el, 18420, (n) => `${(n / 1000).toFixed(1)}K`, { reducedMotion: true });
    expect(el.textContent).toBe("18.4K");
  });
  it("with a non-positive target, shows the formatted target without animating", () => {
    const el = document.createElement("span");
    runCountUp(el, 0, (n) => String(n), { reducedMotion: false });
    expect(el.textContent).toBe("0");
  });
});

describe("attachCarnetTilt", () => {
  it("does nothing under reduced motion (no transform var set)", () => {
    const holder = document.createElement("div");
    attachCarnetTilt(holder, { reducedMotion: true });
    holder.dispatchEvent(new Event("pointermove"));
    expect(holder.style.getPropertyValue("--tiltX")).toBe("");
  });
});

describe("attachCarnetTilt active path", () => {
  it("sets --tiltX/--tiltY on pointermove and resets them on pointerleave", () => {
    const holder = document.createElement("div");
    holder.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 300, right: 200, bottom: 300, x: 0, y: 0, toJSON() {} } as DOMRect);
    attachCarnetTilt(holder, { reducedMotion: false });
    holder.dispatchEvent(new MouseEvent("pointermove", { clientX: 200, clientY: 150 }));
    expect(holder.style.getPropertyValue("--tiltY")).toBe("7.00deg");
    holder.dispatchEvent(new MouseEvent("pointerleave"));
    expect(holder.style.getPropertyValue("--tiltX")).toBe("0deg");
    expect(holder.style.getPropertyValue("--tiltY")).toBe("0deg");
  });
});

describe("attachLacreShine", () => {
  it("adds the alive class when motion is allowed", () => {
    const shine = document.createElement("span");
    attachLacreShine(shine, { reducedMotion: false });
    expect(shine.classList.contains("lacre__shine--alive")).toBe(true);
  });
  it("falls back to a static opacity under reduced motion", () => {
    const shine = document.createElement("span");
    attachLacreShine(shine, { reducedMotion: true });
    expect(shine.classList.contains("lacre__shine--alive")).toBe(false);
    expect(shine.style.opacity).toBe("0.5");
  });
});
