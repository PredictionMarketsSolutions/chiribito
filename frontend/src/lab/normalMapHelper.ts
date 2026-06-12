/**
 * normalMapHelper.ts — shared height-to-tangent-space-normalMap utility
 *
 * FIRST USE (SSOT §5.9): introduced in TP1 (felt nap), reusable by TP3 chips,
 * TP4 wood, TP5, etc.
 *
 * Self-contained — imports nothing from ./textures so downstream consumers do
 * not pull felt-specific code.
 */

import * as THREE from "three";

// ---------------------------------------------------------------------------
// Canvas helpers (local copies — not exported from textures.ts)
// ---------------------------------------------------------------------------

/**
 * Create a blank canvas of the given dimensions and return both the canvas and
 * its 2D rendering context.  Re-declared here (verbatim from textures.ts
 * lines 120-125) so this module is self-contained.
 */
export function makeCanvas(
  w: number,
  h: number,
): { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d")! };
}

// ---------------------------------------------------------------------------
// Sobel height→normal conversion
// ---------------------------------------------------------------------------

/**
 * Convert a grayscale height-field canvas to a tangent-space normal map canvas.
 *
 * Algorithm: 3×3 Sobel finite differences over the luminance channel, with
 * wrapping (torus) boundary conditions so tiled textures are seam-free.
 *
 * Encoding convention (three.js standard):
 *   R = (+X + 1) / 2 × 255   (tangent direction)
 *   G = (+Y + 1) / 2 × 255   (bitangent direction)
 *   B = (+Z + 1) / 2 × 255   (surface normal, always ≥ 0 → B ≥ 128)
 *
 * @param heightCanvas  Canvas whose RED channel encodes height (0 = low, 255 = high).
 * @param strength      Sobel gradient multiplier before normalising.  1.0 = neutral;
 *                      increase for more pronounced micro-relief, decrease for subtlety.
 * @returns A new canvas of the same dimensions containing the RGB normal map.
 */
/**
 * PURE Sobel core — RGBA height DATA (red channel = height, 0..255) → RGBA normal DATA.
 * No canvas: unit-testable directly in any environment (happy-dom has no 2D canvas, so the
 * canvas wrappers below cannot be unit-tested — but THIS core, which holds all the logic, can).
 * Wrapping (torus) boundary so tiled textures are seam-free.
 * Encoding (three.js standard): R=(+X+1)/2·255, G=(+Y+1)/2·255, B=(+Z+1)/2·255 (B≥128 since Z≥0).
 */
export function heightDataToNormalData(
  input: Uint8ClampedArray | number[],
  W: number,
  H: number,
  strength = 1.0,
): Uint8ClampedArray {
  const od = new Uint8ClampedArray(W * H * 4);

  /** Read normalised height (0..1) from the red channel with wrapping boundary. */
  const getH = (x: number, y: number): number => {
    const xi = ((x % W) + W) % W;
    const yi = ((y % H) + H) % H;
    return input[(yi * W + xi) * 4] / 255;
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // 3×3 neighbourhood
      const tl = getH(x - 1, y - 1);
      const tc = getH(x, y - 1);
      const tr = getH(x + 1, y - 1);
      const cl = getH(x - 1, y);
      const cr = getH(x + 1, y);
      const bl = getH(x - 1, y + 1);
      const bc = getH(x, y + 1);
      const br = getH(x + 1, y + 1);

      // Sobel kernels
      const gx = tr + 2 * cr + br - (tl + 2 * cl + bl);
      const gy = bl + 2 * bc + br - (tl + 2 * tc + tr);

      // Surface normal in tangent space
      let nx = -gx * strength;
      let ny = -gy * strength;
      let nz = 1.0;

      // Normalise
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len;
      ny /= len;
      nz /= len;

      // Encode to [0, 255] RGB (Uint8ClampedArray clamps automatically)
      const i = (y * W + x) * 4;
      od[i] = Math.round((nx + 1) * 0.5 * 255); // R = +X
      od[i + 1] = Math.round((ny + 1) * 0.5 * 255); // G = +Y
      od[i + 2] = Math.round((nz + 1) * 0.5 * 255); // B = +Z
      od[i + 3] = 255;
    }
  }

  return od;
}

/**
 * Convert a grayscale height-field canvas to a tangent-space normal map canvas.
 * Thin canvas I/O around the pure `heightDataToNormalData` core (runtime use; the core
 * is the unit-tested logic). Same dimensions in/out.
 */
export function heightToNormalMap(
  heightCanvas: HTMLCanvasElement,
  strength = 1.0,
): HTMLCanvasElement {
  const W = heightCanvas.width;
  const H = heightCanvas.height;

  const input = heightCanvas.getContext("2d")!.getImageData(0, 0, W, H).data;

  const { c, ctx } = makeCanvas(W, H);
  const out = ctx.createImageData(W, H);
  out.data.set(heightDataToNormalData(input, W, H, strength));
  ctx.putImageData(out, 0, 0);
  return c;
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

/**
 * Build a square height-field canvas and populate it with a caller-supplied
 * drawing function.
 *
 * @param size    Canvas side length in pixels.
 * @param drawFn  Drawing callback; receives the 2D context and `size`.
 */
export function makeHeightCanvas(
  size: number,
  drawFn: (ctx: CanvasRenderingContext2D, size: number) => void,
): HTMLCanvasElement {
  const { c, ctx } = makeCanvas(size, size);
  drawFn(ctx, size);
  return c;
}

/**
 * Wrap a normal-map canvas in a THREE.CanvasTexture set to NoColorSpace.
 *
 * Normal maps MUST NOT be sRGB-decoded; using NoColorSpace ensures the RGB
 * values are read as raw XYZ components (Pitfall 7 in TP1 RESEARCH.md).
 * anisotropy=8 matches the project convention from textures.ts gray().
 */
export function toNormalMapTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}
