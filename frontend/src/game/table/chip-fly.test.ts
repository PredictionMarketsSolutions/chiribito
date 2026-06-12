import { describe, it, expect } from "vitest";
import { flyChips } from "./chip-fly";

const from = { x: 0, y: 0 };
const to = { x: 120, y: -60 };

describe("flyChips — driver decision branches", () => {
  it("creates no flying chips and resolves when reduced motion is on", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    await flyChips(container, from, to, { amount: 500, reducedMotion: true });
    expect(container.querySelectorAll(".chip-fly").length).toBe(0);
    container.remove();
  });

  it("does nothing for a non-positive amount", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    await flyChips(container, from, to, { amount: 0, reducedMotion: false });
    expect(container.querySelectorAll(".chip-fly").length).toBe(0);
    container.remove();
  });

  it("leaves no flying chips behind after settling", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    await flyChips(container, from, to, { count: 2, durationMs: 20, staggerMs: 2, reducedMotion: false });
    expect(container.querySelectorAll(".chip-fly").length).toBe(0);
    container.remove();
  });

  it("tags flying chips with denomination colour classes when colours are given", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    // chips are created synchronously; assert before they settle (long duration)
    void flyChips(container, from, to, { count: 3, colors: ["gold", "night", "green"], durationMs: 600, reducedMotion: false });
    const classes = [...container.querySelectorAll(".chip-fly")].map((e) => e.className);
    expect(classes.some((c) => c.includes("chip-fly--gold"))).toBe(true);
    expect(classes.some((c) => c.includes("chip-fly--night"))).toBe(true);
    container.remove();
  });
});
