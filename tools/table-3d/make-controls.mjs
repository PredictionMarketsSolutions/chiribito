/**
 * make-controls.mjs — build the positive + negative control-frame corpus for the meta-gate.
 *
 * Sources:
 *   - GOOD frames: the real frozen HERO baseline captured via the harness (full-res, in
 *     .dev-stack scratch). Passed in as --good <path>.
 *   - BAD frames: lab debug-flag captures where a real hook exists (M3 ?felt=magenta),
 *     otherwise sharp transforms of the good frame that violate exactly one metric.
 *
 * Output: DOWNSCALED PNGs (width 1280) into docs/table-3d/anchors/controls/ so the tracked
 * corpus stays small (Pitfall 5 — full-res frames are 2.4–4.9 MB each). The sharp metrics
 * sample fixed-pixel rects defined on the 2880×1800 frame, so each control is kept at FULL
 * resolution for the metric to read, then a downscaled copy is what gets committed.
 *
 * IMPORTANT: the metric REGION RECTS are 2880×1800 coordinates. The committed controls are
 * downscaled (1280w) for size, but the meta-gate reads the FULL-RES working copies in
 * .dev-stack so rect coordinates stay valid. The downscaled committed copy is the durable
 * artifact + a visual record; run-metrics --meta-gate is pointed at the full-res dir for the
 * numeric proof and at the committed dir to confirm the corpus exists.
 *
 * Usage:
 *   node tools/table-3d/make-controls.mjs \
 *     --good .dev-stack/diag/table-3d/tp0-controls/hero-good.png \
 *     --magenta .dev-stack/diag/table-3d/tp0-controls/hero-magenta.png \
 *     --shoff .dev-stack/diag/table-3d/tp0-controls/hero-shoff.png \
 *     --fullout .dev-stack/diag/table-3d/tp0-controls/full \
 *     --commitout docs/table-3d/anchors/controls
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { REGIONS } from "./metrics.mjs";

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}

const GOOD = arg("good", ".dev-stack/diag/table-3d/tp0-controls/hero-good.png");
const MAGENTA = arg("magenta", ".dev-stack/diag/table-3d/tp0-controls/hero-magenta.png");
const SHOFF = arg("shoff", ".dev-stack/diag/table-3d/tp0-controls/hero-shoff.png");
const FULLOUT = arg("fullout", ".dev-stack/diag/table-3d/tp0-controls/full");
const COMMITOUT = arg("commitout", "docs/table-3d/anchors/controls");
// The committed corpus is a DURABLE VISUAL + AUDIT record only — the meta-gate reads the
// full-res working copies in .dev-stack for the numeric proof. So the committed copies are
// downscaled hard + palette-quantized to keep the tracked corpus small (Pitfall 5: target
// the whole corpus well under 10 MB). 640px is ample to SEE what each control depicts.
const COMMIT_WIDTH = 640;

mkdirSync(FULLOUT, { recursive: true });
mkdirSync(COMMITOUT, { recursive: true });

/** Composite a solid-color patch over `rect` of `src`, write full-res to FULLOUT. */
async function tintRegion(src, rect, color, outName) {
  const patch = await sharp({
    create: { width: rect.width, height: rect.height, channels: 4, background: color },
  })
    .png()
    .toBuffer();
  const out = join(FULLOUT, outName);
  await sharp(src)
    .composite([{ input: patch, left: rect.left, top: rect.top }])
    .png()
    .toFile(out);
  return out;
}

/** Over-expose a region (blow highlights) by compositing PURE white (luma 255 > 250 cap). */
async function overexposeRegion(src, rect, outName) {
  return tintRegion(src, rect, { r: 255, g: 255, b: 255, alpha: 1 }, outName);
}

/** Wash a region with a satin bright-sheen (for +B bad: continuous specular sweep). */
async function sheenRegion(src, rect, outName) {
  // a bright low-sat wash → pushes many felt pixels above the sheen luma cap
  return tintRegion(src, rect, { r: 235, g: 240, b: 235, alpha: 0.85 }, outName);
}

/** For M6 bad we REMOVE the contact shadow: lift the under-card rect to the SAME brightness
 *  as adjacent open felt so it is NOT ≥12% darker. We sample the adjacent felt color and
 *  paint it opaquely over the under-card rect → darker% ≈ 0 → M6 FAILS (no grounding). */
async function liftShadowRegion(src, underRect, adjacentRect, outName) {
  const { data } = await sharp(src).extract(adjacentRect).raw().toBuffer({ resolveWithObject: true });
  let r = 0,
    g = 0,
    b = 0;
  const px = data.length / 3;
  for (let i = 0; i < data.length; i += 3) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  const color = { r: Math.round(r / px), g: Math.round(g / px), b: Math.round(b / px), alpha: 1 };
  return tintRegion(src, underRect, color, outName);
}

/** Flatten corners (for M8 bad): paint the top corners the same luma as center → no falloff. */
async function flattenCorners(src, outName) {
  // sample center color, paint it into the top corners so corner≈center (no vignette).
  const { data } = await sharp(src)
    .extract(REGIONS.centerHero)
    .raw()
    .toBuffer({ resolveWithObject: true });
  let r = 0,
    g = 0,
    b = 0;
  const px = data.length / 3;
  for (let i = 0; i < data.length; i += 3) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  const color = { r: Math.round(r / px), g: Math.round(g / px), b: Math.round(b / px), alpha: 1 };
  const corner = await sharp({
    create: { width: 360, height: 260, channels: 4, background: color },
  })
    .png()
    .toBuffer();
  const out = join(FULLOUT, outName);
  await sharp(src)
    .composite([
      { input: corner, left: 0, top: 0 },
      { input: corner, left: 2880 - 360, top: 0 },
    ])
    .png()
    .toFile(out);
  return out;
}

/** Desaturate + crush the top corners (for +A bad): neutral/black, not warm. */
async function neutralizeCorners(src, outName) {
  const corner = await sharp({
    create: { width: 360, height: 260, channels: 4, background: { r: 6, g: 6, b: 7, alpha: 1 } },
  })
    .png()
    .toBuffer();
  const out = join(FULLOUT, outName);
  await sharp(src)
    .composite([
      { input: corner, left: 0, top: 0 },
      { input: corner, left: 2880 - 360, top: 0 },
    ])
    .png()
    .toFile(out);
  return out;
}

/** Downscale + palette-quantize a full-res control into the committed corpus. */
async function commitCopy(fullPath, name) {
  await sharp(fullPath)
    .resize({ width: COMMIT_WIDTH })
    .png({ compressionLevel: 9, palette: true, quality: 70, colors: 128 })
    .toFile(join(COMMITOUT, name));
}

async function main() {
  // --- GOOD controls ---
  // The positive control is the SAME real baseline frame for every metric. The full-res
  // working dir keeps a per-metric copy (so the meta-gate can name them per metric), but the
  // committed corpus stores it ONCE as `_hero-good.png` to avoid 7× duplication (Pitfall 5).
  const goodNames = [
    "m3-felt-good.png",
    "m4-brass-good.png",
    "m5-clip-good.png",
    "m6-shadow-good.png",
    "m8-vignette-good.png",
    "a-warmcorner-good.png",
    "b-specular-good.png",
  ];
  for (const name of goodNames) {
    await sharp(GOOD).png().toFile(join(FULLOUT, name)); // full-res working copy (per metric)
  }
  await commitCopy(GOOD, "_hero-good.png"); // single shared committed positive control

  // --- BAD controls ---
  // M3: real lab hook ?felt=magenta (pure magenta felt) → ΔE ≫ 12.
  await sharp(MAGENTA).png().toFile(join(FULLOUT, "m3-felt-bad.png"));
  await commitCopy(MAGENTA, "m3-felt-bad.png");

  // M4: sharp gold tint over the brass rect (high-sat high-val gold) → fails S/V ceiling.
  const m4bad = await tintRegion(GOOD, REGIONS.brassHero, { r: 255, g: 205, b: 25, alpha: 1 }, "m4-brass-bad.png");
  await commitCopy(m4bad, "m4-brass-bad.png");

  // M5: blow out the felt rect → highlight-clip fraction exceeds caps.
  const m5bad = await overexposeRegion(GOOD, REGIONS.feltHero, "m5-clip-bad.png");
  await commitCopy(m5bad, "m5-clip-bad.png");

  // M6: lift the under-card region to adjacent-felt brightness (remove contact shadow) → not ≥12% darker.
  const m6bad = await liftShadowRegion(GOOD, REGIONS.underCardHero, REGIONS.feltAdjacentHero, "m6-shadow-bad.png");
  await commitCopy(m6bad, "m6-shadow-bad.png");

  // M8: flatten the top corners to center luma → <8% below (no framing).
  const m8bad = await flattenCorners(GOOD, "m8-vignette-bad.png");
  await commitCopy(m8bad, "m8-vignette-bad.png");

  // +A: neutralize + crush top corners → fails warm AND floor.
  const abad = await neutralizeCorners(GOOD, "a-warmcorner-bad.png");
  await commitCopy(abad, "a-warmcorner-bad.png");

  // +B: satin sheen wash over the felt rect → sheen fraction exceeds cap.
  const bbad = await sheenRegion(GOOD, REGIONS.feltHero, "b-specular-bad.png");
  await commitCopy(bbad, "b-specular-bad.png");

  console.log("Controls written:");
  console.log("  full-res working copies →", FULLOUT);
  console.log("  downscaled committed corpus →", COMMITOUT);
}

main().catch((e) => {
  console.error("make-controls error:", e.message);
  process.exit(1);
});
