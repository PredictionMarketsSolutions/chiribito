import { describe, it, expect } from "vitest";
import { potChipLayout, MAX_STACKS, MAX_PER_STACK } from "./chip-stack";

describe("potChipLayout — a physical pot pile built from an amount", () => {
  it("is empty for a zero or negative pot", () => {
    expect(potChipLayout(0)).toEqual([]);
    expect(potChipLayout(-100)).toEqual([]);
  });

  it("places a single low chip for a small pot", () => {
    const chips = potChipLayout(25);
    expect(chips.length).toBe(1);
    expect(chips[0].denom).toBe(25);
    expect(chips[0].z).toBe(0);
  });

  it("uses higher denominations for bigger pots (not a pile of 25s)", () => {
    const chips = potChipLayout(1000);
    expect(chips.length).toBeLessThan(5);
    expect(chips.some((c) => c.denom === 1000)).toBe(true);
  });

  it("grows the pile as the pot grows (monotonic up to the cap)", () => {
    const sizes = [25, 100, 500, 2000, 8000].map((a) => potChipLayout(a).length);
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeGreaterThanOrEqual(sizes[i - 1]);
    }
  });

  it("fills the centre for a huge pot but never explodes past the cap", () => {
    const chips = potChipLayout(10_000_000);
    expect(chips.length).toBeLessThanOrEqual(MAX_STACKS * MAX_PER_STACK);
    expect(chips.length).toBeGreaterThan(20);
  });

  it("stacks chips vertically — same column shares x,y, z increments by 1 from 0", () => {
    const chips = potChipLayout(8000); // 8 × 1000 → one column of 8
    const col = chips.filter((c) => c.x === chips[0].x && c.y === chips[0].y);
    const zs = col.map((c) => c.z).sort((a, b) => a - b);
    expect(zs[0]).toBe(0);
    for (let i = 1; i < zs.length; i++) expect(zs[i]).toBe(zs[i - 1] + 1);
  });

  it("never piles a single column higher than MAX_PER_STACK", () => {
    const chips = potChipLayout(50_000);
    const byColumn = new Map<string, number>();
    for (const c of chips) {
      const key = `${c.x}:${c.y}`;
      byColumn.set(key, (byColumn.get(key) ?? 0) + 1);
    }
    for (const count of byColumn.values()) expect(count).toBeLessThanOrEqual(MAX_PER_STACK);
  });

  it("gives every chip a known denomination and a non-negative height", () => {
    for (const c of potChipLayout(3725)) {
      expect([25, 100, 500, 1000]).toContain(c.denom);
      expect(c.z).toBeGreaterThanOrEqual(0);
    }
  });
});
