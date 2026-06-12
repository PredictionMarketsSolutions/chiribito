import { describe, it, expect } from "vitest";
import { heightDataToNormalData, toNormalMapTexture } from "./normalMapHelper";

// happy-dom has NO 2D canvas context (getContext("2d") → null), so the canvas wrappers
// (heightToNormalMap / makeHeightCanvas) cannot be exercised here. They are thin glue; ALL the
// Sobel logic lives in the PURE core `heightDataToNormalData`, which we unit-test directly with
// plain RGBA arrays. (toNormalMapTexture's colorSpace invariant works on a bare canvas element.)

/** Build an RGBA height buffer (red channel = height) from a per-pixel height fn. */
function heightData(W: number, H: number, fn: (x: number, y: number) => number): Uint8ClampedArray {
  const a = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = fn(x, y);
      const i = (y * W + x) * 4;
      a[i] = a[i + 1] = a[i + 2] = v;
      a[i + 3] = 255;
    }
  }
  return a;
}

function channels(d: Uint8ClampedArray) {
  const r: number[] = [], g: number[] = [], b: number[] = [], a: number[] = [];
  for (let i = 0; i < d.length; i += 4) {
    r.push(d[i]); g.push(d[i + 1]); b.push(d[i + 2]); a.push(d[i + 3]);
  }
  return { r, g, b, a };
}

describe("heightDataToNormalData — output shape", () => {
  it("returns W*H*4 bytes", () => {
    const out = heightDataToNormalData(heightData(16, 8, () => 128), 16, 8);
    expect(out.length).toBe(16 * 8 * 4);
  });
});

describe("heightDataToNormalData — flat uniform input", () => {
  it("flat field → every pixel is the up-normal: R≈128, G≈128, B≈255 (±1 rounding)", () => {
    const { r, g, b } = channels(heightDataToNormalData(heightData(8, 8, () => 128), 8, 8));
    for (let i = 0; i < r.length; i++) {
      expect(r[i]).toBeGreaterThanOrEqual(127);
      expect(r[i]).toBeLessThanOrEqual(129);
      expect(g[i]).toBeGreaterThanOrEqual(127);
      expect(g[i]).toBeLessThanOrEqual(129);
      expect(b[i]).toBeGreaterThanOrEqual(254);
      expect(b[i]).toBeLessThanOrEqual(255);
    }
  });

  it("alpha is always 255", () => {
    const { a } = channels(heightDataToNormalData(heightData(8, 8, () => 128), 8, 8));
    for (const v of a) expect(v).toBe(255);
  });
});

describe("heightDataToNormalData — B (Z) channel invariant", () => {
  it("B ≥ 128 on a flat field (Z always points out of the surface)", () => {
    const { b } = channels(heightDataToNormalData(heightData(16, 16, () => 200), 16, 16));
    for (const v of b) expect(v).toBeGreaterThanOrEqual(128);
  });

  it("B ≥ 128 on a diagonal ramp", () => {
    const out = heightDataToNormalData(
      heightData(16, 16, (x, y) => Math.round(((x + y) / (2 * 16)) * 200 + 28)),
      16, 16, 1.0,
    );
    const { b } = channels(out);
    for (const v of b) expect(v).toBeGreaterThanOrEqual(128);
  });
});

describe("heightDataToNormalData — R/G channel range", () => {
  it("R and G stay within [0,255] for a steep horizontal ramp (strength 4)", () => {
    const out = heightDataToNormalData(heightData(8, 8, (x) => Math.round((x / 7) * 255)), 8, 8, 4.0);
    const { r, g } = channels(out);
    for (const v of r) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(255); }
    for (const v of g) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(255); }
  });
});

describe("heightDataToNormalData — strength=0", () => {
  it("strength=0 → pure up-normal regardless of input variation", () => {
    const { r, g, b } = channels(
      heightDataToNormalData(heightData(8, 8, (x) => Math.round((x / 7) * 255)), 8, 8, 0),
    );
    for (let i = 0; i < r.length; i++) {
      expect(r[i]).toBeGreaterThanOrEqual(127);
      expect(r[i]).toBeLessThanOrEqual(129);
      expect(g[i]).toBeGreaterThanOrEqual(127);
      expect(g[i]).toBeLessThanOrEqual(129);
      expect(b[i]).toBeGreaterThanOrEqual(254);
      expect(b[i]).toBeLessThanOrEqual(255);
    }
  });
});

describe("heightDataToNormalData — horizontal ramp sign convention", () => {
  it("left→right increasing height biases R away from 128 (non-zero Gx)", () => {
    const SIZE = 16;
    const out = heightDataToNormalData(
      heightData(SIZE, SIZE, (x) => Math.round((x / (SIZE - 1)) * 255)),
      SIZE, SIZE, 1.0,
    );
    const { r } = channels(out);
    const mid = Math.floor(SIZE / 2);
    const rVals: number[] = [];
    for (let x = 1; x < SIZE - 1; x++) rVals.push(r[mid * SIZE + x]); // interior cols (skip wrap seam)
    const mean = rVals.reduce((s, v) => s + v, 0) / rVals.length;
    expect(Math.abs(mean - 128)).toBeGreaterThan(5);
  });
});

describe("toNormalMapTexture — normal-map colorSpace invariant (Pitfall 7)", () => {
  it("returns a THREE.CanvasTexture in NoColorSpace (never sRGB) + anisotropy 8", async () => {
    const THREE = await import("three");
    const canvas = document.createElement("canvas"); // bare element — no 2D context needed
    canvas.width = 4;
    canvas.height = 4;
    const tex = toNormalMapTexture(canvas);
    expect(tex).toBeInstanceOf(THREE.CanvasTexture);
    expect(tex.colorSpace).toBe(THREE.NoColorSpace);
    expect(tex.colorSpace).not.toBe(THREE.SRGBColorSpace);
    expect(tex.anisotropy).toBe(8);
  });
});
