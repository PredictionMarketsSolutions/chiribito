import { describe, it, expect } from "vitest";
import { createCardElement } from "./ui-cards";
import { holeCardRestDegrees, applyHoleCardRest } from "./ui-cards-rest";
import { HOLE_REST_ROT_MAX } from "./game/table/deal-motion";

const MAX_DEG = (HOLE_REST_ROT_MAX * 180) / Math.PI;

describe("holeCardRestDegrees", () => {
  it("is deterministic — the same hole-card index always rests at the same angle", () => {
    expect(holeCardRestDegrees(0)).toBe(holeCardRestDegrees(0));
    expect(holeCardRestDegrees(1)).toBe(holeCardRestDegrees(1));
  });

  it("leans the two hole cards differently (a hand never lays them mirror-perfect)", () => {
    expect(holeCardRestDegrees(0)).not.toBe(holeCardRestDegrees(1));
  });

  it("stays within the conservative resting bound (<= 1.5deg — legibility first)", () => {
    expect(Math.abs(holeCardRestDegrees(0))).toBeLessThanOrEqual(MAX_DEG + 1e-9);
    expect(Math.abs(holeCardRestDegrees(1))).toBeLessThanOrEqual(MAX_DEG + 1e-9);
  });
});

describe("applyHoleCardRest", () => {
  function row(...cards: string[]): HTMLElement {
    const el = document.createElement("div");
    cards.forEach((c) => el.appendChild(createCardElement(c)));
    return el;
  }

  it("gives each hole card a static resting rotation (transforms only)", () => {
    const el = row("10O", "7O");
    applyHoleCardRest(el);
    expect((el.children[0] as HTMLElement).style.transform).toMatch(/^rotate\(-?\d/);
    expect((el.children[1] as HTMLElement).style.transform).toMatch(/^rotate\(-?\d/);
  });

  it("rests the two cards at different angles (asymmetry = placed by a hand)", () => {
    const el = row("10O", "7O");
    applyHoleCardRest(el);
    const a = (el.children[0] as HTMLElement).style.transform;
    const b = (el.children[1] as HTMLElement).style.transform;
    expect(a).not.toBe(b);
  });

  it("is idempotent — re-applying on a keyed re-render never jitters the angle", () => {
    const el = row("10O", "7O");
    applyHoleCardRest(el);
    const first = (el.children[0] as HTMLElement).style.transform;
    applyHoleCardRest(el);
    const second = (el.children[0] as HTMLElement).style.transform;
    expect(second).toBe(first);
  });

  it("pivots on the card centre (no vertical drift that would hurt legibility)", () => {
    const el = row("10O", "7O");
    applyHoleCardRest(el);
    expect((el.children[0] as HTMLElement).style.transformOrigin).toBe("center");
  });
});
