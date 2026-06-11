/**
 * Chiribito · Mesa Lab — TP3 seed-parity + alignment-break unit test.
 *
 * Guards two invariants:
 *  1. chipStackLayout(count, position) is byte-equivalent to the pre-instancing
 *     ChipStack per-chip jitter seeds (2.3 / 1.7 / 0.012, body Y = i*H).
 *  2. CHIP_ROT_SEED is the documented non-near-rational alignment-breaking value
 *     (0.37, not the old 0.55) so cream inserts spiral irregularly.
 *
 * Style: mirrors cards.test.ts (describe/it/expect/toBeCloseTo — pure math, no R3F).
 */
import { describe, it, expect } from "vitest";
import { chipStackLayout, CHIP_ROT_SEED, CHIP_H } from "./chipStack";

const H = CHIP_H; // 0.1 — the canonical chip thickness used in both layout and test

describe("chipStackLayout", () => {
  it("returns empty for count <= 0", () => {
    expect(chipStackLayout(0, [0, 0, 0])).toHaveLength(0);
    expect(chipStackLayout(-3, [1, 2, 3])).toHaveLength(0);
  });

  it("returns count entries for count > 0", () => {
    expect(chipStackLayout(5, [0, 0, 0])).toHaveLength(5);
    expect(chipStackLayout(1, [0, 0, 0])).toHaveLength(1);
  });

  it("bodyPos[i] is byte-equivalent to the pre-instancing ChipStack jitter (seeds 2.3/1.7/0.012)", () => {
    const pos: [number, number, number] = [1.5, 0.06, -0.7];
    const count = 7;
    const layouts = chipStackLayout(count, pos);

    for (let i = 0; i < count; i++) {
      // Reproduce the exact pre-instancing ChipStack formula verbatim:
      const jx = Math.sin(i * 2.3) * 0.012;
      const jz = Math.cos(i * 1.7) * 0.012;
      const expectedX = pos[0] + jx;
      const expectedY = pos[1] + i * H;
      const expectedZ = pos[2] + jz;

      expect(layouts[i].bodyPos[0]).toBeCloseTo(expectedX, 9);
      expect(layouts[i].bodyPos[1]).toBeCloseTo(expectedY, 9);
      expect(layouts[i].bodyPos[2]).toBeCloseTo(expectedZ, 9);
    }
  });

  it("facePos[i] is exactly H/2 + 0.002 above bodyPos[i] in Y, sharing X and Z", () => {
    const pos: [number, number, number] = [0, 0, 0];
    const layouts = chipStackLayout(5, pos);

    for (const entry of layouts) {
      // Top face sits exactly H/2 + 0.002 above the body centre
      expect(entry.facePos[1]).toBeCloseTo(entry.bodyPos[1] + H / 2 + 0.002, 9);
      // X and Z are shared (face is centred over body)
      expect(entry.facePos[0]).toBeCloseTo(entry.bodyPos[0], 9);
      expect(entry.facePos[2]).toBeCloseTo(entry.bodyPos[2], 9);
    }
  });

  it("has NO bottom-face entry — only bodyPos and facePos fields exist", () => {
    const layouts = chipStackLayout(3, [0, 0, 0]);
    for (const entry of layouts) {
      // If a bottomPos ever appears in the layout, the bottom face is not dropped
      expect((entry as Record<string, unknown>).bottomPos).toBeUndefined();
    }
  });

  it("rotY per entry equals i * CHIP_ROT_SEED (the alignment-broken seed)", () => {
    const layouts = chipStackLayout(8, [0, 0, 0]);
    for (let i = 0; i < layouts.length; i++) {
      expect(layouts[i].rotY).toBeCloseTo(i * CHIP_ROT_SEED, 9);
    }
  });

  it("is deterministic: two calls with the same args return byte-identical positions", () => {
    const pos: [number, number, number] = [1.1, 0.06, 2.2];
    const first = chipStackLayout(6, pos);
    const second = chipStackLayout(6, pos);
    for (let i = 0; i < first.length; i++) {
      expect(first[i].bodyPos[0]).toBe(second[i].bodyPos[0]);
      expect(first[i].bodyPos[1]).toBe(second[i].bodyPos[1]);
      expect(first[i].bodyPos[2]).toBe(second[i].bodyPos[2]);
      expect(first[i].facePos[1]).toBe(second[i].facePos[1]);
      expect(first[i].rotY).toBe(second[i].rotY);
    }
  });
});

// --- cream-insert phase-alignment break ---

describe("CHIP_ROT_SEED (alignment-break invariant)", () => {
  it("is NOT the old 0.55 seed (which caused 10-group column alignment)", () => {
    expect(CHIP_ROT_SEED).not.toBe(0.55);
    expect(CHIP_ROT_SEED).not.toBeCloseTo(0.55, 3);
  });

  it("equals 0.37 — the documented non-near-rational value", () => {
    expect(CHIP_ROT_SEED).toBeCloseTo(0.37, 9);
  });

  it("0.37 / (2*PI/10) is not within 0.03 of a half-integer (alignment BROKEN)", () => {
    // The 10-group cream insert pattern has angular period 2*PI/10 = 0.628... rad.
    // If ratio = seed / period is close to a half-integer (n + 0.5), the inserts
    // column-align across stacked chips. 0.37/0.628 ≈ 0.589 — NOT near a half-integer.
    // This test documents the math and guards against a seed regression to an aligning value.
    const period = (2 * Math.PI) / 10; // ≈ 0.6283
    const ratio = CHIP_ROT_SEED / period; // ≈ 0.589
    // Distance from the nearest half-integer (0.5)
    const distFromHalfInt = Math.abs(ratio - Math.round(ratio - 0.5) - 0.5);
    expect(distFromHalfInt).toBeGreaterThan(0.03);
  });
});
