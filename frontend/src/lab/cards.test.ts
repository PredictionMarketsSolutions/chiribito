import { describe, it, expect } from "vitest";
import {
  labCardFaceUrl,
  rowPositionsX,
  communityLayout,
  holeLayout,
  CARD_W,
  MAX_TILT_RAD,
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

// --- TP2 Lever 6: dealt variance bound + determinism ----------------------------------------
// MAX_TILT_RAD = (1.5 * PI / 180) = 0.0262 rad. The per-card micro-tilt and micro-yaw each
// stay within this bound so the hole-pair opposite-sign fan invariant is preserved (the added
// z amplitude <= 0.026 is strictly less than HOLE_FAN * 0.5 = 0.07, so the base sign cannot
// flip). Seeds are integer-constant Math.sin(i * prime) — same every call → M9 satisfied.
// Variance is off by default (?card=base and default call); opt-in via { variance: true }.
describe("dealt variance (Lever 6)", () => {
  const COMMUNITY_IDS = ["1E", "12C", "11B", "5C", "7E"];
  const HOLE_IDS = ["10O", "7O"];

  it("MAX_TILT_RAD is exported and equals (1.5 * PI / 180) — the <= 0.026 rad bound", () => {
    expect(MAX_TILT_RAD).toBeCloseTo((1.5 * Math.PI) / 180, 6);
    // hard bound: ~0.026 rad (= 1.5 deg exactly 0.02618); ceiling 0.0262 catches regressions
    expect(MAX_TILT_RAD).toBeLessThanOrEqual(0.0262);
    // ensure it is described as <= 0.026 in comments throughout this suite
  });

  it("community variance: all micro-tilt + micro-yaw offsets are within <= 0.026 rad", () => {
    const base = communityLayout(COMMUNITY_IDS); // no variance — baseline z rotation
    const varied = communityLayout(COMMUNITY_IDS, { variance: true });
    expect(varied).toHaveLength(COMMUNITY_IDS.length);
    for (let i = 0; i < varied.length; i++) {
      // x-rotation offset (micro-tilt): delta from -PI/2
      const tilt = varied[i].rotation[0] - (-Math.PI / 2);
      expect(Math.abs(tilt)).toBeLessThanOrEqual(0.026);
      // z-rotation offset (micro-yaw): delta from the base yaw
      const yawDelta = varied[i].rotation[2] - base[i].rotation[2];
      expect(Math.abs(yawDelta)).toBeLessThanOrEqual(0.026);
    }
  });

  it("community variance is deterministic: two calls with same ids produce identical poses", () => {
    const first = communityLayout(COMMUNITY_IDS, { variance: true });
    const second = communityLayout(COMMUNITY_IDS, { variance: true });
    for (let i = 0; i < first.length; i++) {
      expect(first[i].rotation[0]).toBe(second[i].rotation[0]);
      expect(first[i].rotation[2]).toBe(second[i].rotation[2]);
    }
  });

  it("hole variance: all micro-tilt + micro-yaw offsets are within <= 0.026 rad", () => {
    const base = holeLayout(HOLE_IDS); // no variance — baseline rotations
    const varied = holeLayout(HOLE_IDS, { variance: true });
    expect(varied).toHaveLength(HOLE_IDS.length);
    for (let i = 0; i < varied.length; i++) {
      // x-rotation offset (micro-tilt): delta from base
      const tiltDelta = varied[i].rotation[0] - base[i].rotation[0];
      expect(Math.abs(tiltDelta)).toBeLessThanOrEqual(0.026);
      // z-rotation offset (micro-yaw): delta from base
      const yawDelta = varied[i].rotation[2] - base[i].rotation[2];
      expect(Math.abs(yawDelta)).toBeLessThanOrEqual(0.026);
    }
  });

  it("hole variance is deterministic: two calls with same ids produce identical poses", () => {
    const first = holeLayout(HOLE_IDS, { variance: true });
    const second = holeLayout(HOLE_IDS, { variance: true });
    for (let i = 0; i < first.length; i++) {
      expect(first[i].rotation[0]).toBe(second[i].rotation[0]);
      expect(first[i].rotation[2]).toBe(second[i].rotation[2]);
    }
  });

  it("hole variance preserves opposite-sign fan invariant (CRITICAL: added z < HOLE_FAN*0.5)", () => {
    const varied = holeLayout(HOLE_IDS, { variance: true });
    // The hole-pair MUST still fan in opposite z-directions even with variance applied
    expect(Math.sign(varied[0].rotation[2])).toBe(-Math.sign(varied[1].rotation[2]));
  });

  it("hole variance preserves height-stagger dy > 0.05 (no coplanar z-fight)", () => {
    const varied = holeLayout(HOLE_IDS, { variance: true });
    const dy = varied[1].position[1] - varied[0].position[1];
    expect(dy).toBeGreaterThan(0.05);
  });

  it("default call (no variance option) returns the same poses as before Lever 6", () => {
    // The variance feature must be opt-in — default behaviour is unchanged for M9 backward compat
    const defaultPoses = holeLayout(HOLE_IDS);
    const noVariance = holeLayout(HOLE_IDS, { variance: false });
    for (let i = 0; i < defaultPoses.length; i++) {
      expect(defaultPoses[i].rotation[0]).toBe(noVariance[i].rotation[0]);
      expect(defaultPoses[i].rotation[2]).toBe(noVariance[i].rotation[2]);
    }
  });
});
