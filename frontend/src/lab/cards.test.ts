import { describe, it, expect } from "vitest";
import {
  labCardFaceUrl,
  rowPositionsX,
  communityLayout,
  holeLayout,
  CARD_W,
} from "./cards";

describe("labCardFaceUrl", () => {
  it("maps suit codes to the real Fournier filenames", () => {
    expect(labCardFaceUrl("10O")).toBe("/cards/10%20DE%20ORO.webp");
    expect(labCardFaceUrl("7O")).toBe("/cards/7%20DE%20ORO.webp");
    expect(labCardFaceUrl("1E")).toBe("/cards/1%20DE%20ESPADA.webp");
    expect(labCardFaceUrl("12C")).toBe("/cards/12%20DE%20COPAS.webp");
    expect(labCardFaceUrl("11B")).toBe("/cards/11%20DE%20BASTOS.webp");
  });

  it("percent-encodes the spaces so TextureLoader can fetch", () => {
    expect(labCardFaceUrl("5C")).not.toContain(" ");
  });
});

describe("rowPositionsX", () => {
  it("returns empty for n<=0", () => {
    expect(rowPositionsX(0, 1)).toEqual([]);
    expect(rowPositionsX(-2, 1)).toEqual([]);
  });

  it("centres a single card at the origin", () => {
    expect(rowPositionsX(1, 3)).toEqual([0]);
  });

  it("is symmetric about 0 (sum ≈ 0)", () => {
    for (const n of [2, 3, 4, 5]) {
      const xs = rowPositionsX(n, 1.3);
      const sum = xs.reduce((a, b) => a + b, 0);
      expect(Math.abs(sum)).toBeLessThan(1e-9);
    }
  });

  it("is strictly ascending with constant pitch", () => {
    const pitch = 1.7;
    const xs = rowPositionsX(4, pitch);
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i] - xs[i - 1]).toBeCloseTo(pitch, 9);
    }
  });
});

describe("communityLayout", () => {
  it("produces one pose per id, centred, flat on the felt at a constant height", () => {
    const ids = ["1E", "12C", "11B"];
    const poses = communityLayout(ids);
    expect(poses).toHaveLength(3);
    expect(poses.map((p) => p.id)).toEqual(ids);
    // symmetric in x
    const sumX = poses.reduce((a, p) => a + p.position[0], 0);
    expect(Math.abs(sumX)).toBeLessThan(1e-9);
    // all rest at the same felt height and same z (a tidy row)
    const ys = poses.map((p) => p.position[1]);
    const zs = poses.map((p) => p.position[2]);
    expect(new Set(ys).size).toBe(1);
    expect(new Set(zs).size).toBe(1);
    // laid flat (≈ -90° about X)
    for (const p of poses) expect(p.rotation[0]).toBeCloseTo(-Math.PI / 2, 6);
  });

  it("spaces community cards wider than a card so they do not overlap", () => {
    const xs = communityLayout(["1E", "12C", "11B"]).map((p) => p.position[0]);
    expect(xs[1] - xs[0]).toBeGreaterThan(CARD_W);
  });
});

describe("holeLayout", () => {
  it("produces two fanned, lifted cards near the player edge (+z)", () => {
    const poses = holeLayout(["10O", "7O"]);
    expect(poses).toHaveLength(2);
    // both on the player's side of the table
    for (const p of poses) expect(p.position[2]).toBeGreaterThan(2);
    // fanned in opposite directions (mirror roll about z)
    expect(Math.sign(poses[0].rotation[2])).toBe(-Math.sign(poses[1].rotation[2]));
    // lifted toward the camera (more upright than a flat -90°)
    for (const p of poses) expect(p.rotation[0]).toBeGreaterThan(-Math.PI / 2);
  });

  it("height-staggers the overlapping pair so the cards never sit coplanar (no z-fighting)", () => {
    const poses = holeLayout(["10O", "7O"]);
    // premise: the held pair OVERLAPS in x (HOLE_PITCH < CARD_W) — that overlap is the
    // blessed 'variant B' composition. Two cards overlapping at the SAME height are coplanar:
    // the depth buffer can't resolve them → they interpenetrate and z-fight (the M1 'cards
    // mix / flicker between each other' bug). So an overlapping pair MUST be separated in height.
    const dx = poses[1].position[0] - poses[0].position[0];
    expect(dx).toBeLessThan(CARD_W); // they overlap in x
    const dy = poses[1].position[1] - poses[0].position[1];
    expect(dy).toBeGreaterThan(0.05); // the later card rests clearly ON TOP — no coplanar overlap
  });
});
