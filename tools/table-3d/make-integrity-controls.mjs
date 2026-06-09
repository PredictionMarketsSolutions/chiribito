/**
 * make-integrity-controls.mjs — build the positive + negative control corpus for the
 * INTEGRITY meta-gates (M9 determinism, M7 bloom-absence, M12 regional-MSE). Plan 01-04
 * companion to plan 01-03's make-controls.mjs (which builds the T1 colour-metric corpus).
 *
 * Sources:
 *   - GOOD frame: the real frozen HERO baseline captured via the harness (full-res, in
 *     .dev-stack scratch). Passed as --good <path>.
 *
 * Controls produced (full-res working copies → FULLOUT; downscaled committed → COMMITOUT):
 *
 *   M9 determinism:
 *     m9-good-a.png / m9-good-b.png  — two BYTE-IDENTICAL copies of the good frame (PASS)
 *     m9-bad.png                     — a 1-byte-altered copy of good-A (md5 differs → FAIL)
 *
 *   M7 bloom-absence:
 *     m7-src-good/Clean.tsx          — a clean component, no forbidden token (0 matches → PASS)
 *     m7-src-bad/Glow.tsx            — a synthetic EffectComposer+Bloom mount (match → FAIL)
 *     m7-halo-good.png               — the normal good frame (low very-bright fraction → PASS)
 *     m7-halo-bad.png                — a synthetic large bright halo over the frame (FAIL)
 *
 *   M12 regional-MSE:
 *     m12-good.png                   — the good frame (self-compare MSE 0 → PASS)
 *     m12-bad-tinted.png             — the good frame with the HERO felt rect tinted (MSE high → FAIL)
 *
 * The committed corpus is DOWNSCALED hard (palette-quantized) to keep the tracked dir small
 * (Pitfall 5). The NUMERIC meta-gate runs on the FULL-RES working copies in .dev-stack (M12
 * rects + M9 byte-identity are defined on the 2880×1800 frame). M9's 1-byte-alter is applied
 * to the full-res copy so md5 differs there; the committed downscaled m9-bad is a visual record.
 *
 * Usage (from repo ROOT):
 *   node tools/table-3d/make-integrity-controls.mjs \
 *     --good .dev-stack/diag/table-3d/tp0-controls/hero-good.png \
 *     --fullout .dev-stack/diag/table-3d/tp0-integrity-controls/full \
 *     --commitout docs/table-3d/anchors/controls
 */
import sharp from "sharp";
import { mkdirSync, copyFileSync, readFileSync, openSync, writeSync, closeSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REGIONS } from "./metrics.mjs";

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}

const GOOD = arg("good", ".dev-stack/diag/table-3d/tp0-controls/hero-good.png");
const FULLOUT = arg("fullout", ".dev-stack/diag/table-3d/tp0-integrity-controls/full");
const COMMITOUT = arg("commitout", "docs/table-3d/anchors/controls");
const COMMIT_WIDTH = 640; // ample to SEE each control; keeps the tracked corpus small.

mkdirSync(FULLOUT, { recursive: true });
mkdirSync(COMMITOUT, { recursive: true });

/** Downscale + palette-quantize a full-res control into the committed corpus. */
async function commitCopy(fullPath, name) {
  await sharp(fullPath)
    .resize({ width: COMMIT_WIDTH })
    .png({ compressionLevel: 9, palette: true, quality: 70, colors: 128 })
    .toFile(join(COMMITOUT, name));
}

/** Alter exactly one byte of a file in place (so its md5 changes). */
function flipLastByte(path) {
  const buf = readFileSync(path);
  buf[buf.length - 1] = buf[buf.length - 1] ^ 0xff;
  const fd = openSync(path, "w");
  writeSync(fd, buf, 0, buf.length, 0);
  closeSync(fd);
}

/** Composite a solid patch over `rect` of `src`, write full-res to FULLOUT. */
async function tintRegion(src, rect, color, outName) {
  const patch = await sharp({
    create: { width: rect.width, height: rect.height, channels: 4, background: color },
  })
    .png()
    .toBuffer();
  const out = join(FULLOUT, outName);
  await sharp(src).composite([{ input: patch, left: rect.left, top: rect.top }]).png().toFile(out);
  return out;
}

/** Paint a large bright halo over the center of the frame (bloom signature). */
async function brightHalo(src, outName) {
  const meta = await sharp(src).metadata();
  const w = Math.round(meta.width * 0.6);
  const h = Math.round(meta.height * 0.6);
  const left = Math.round((meta.width - w) / 2);
  const top = Math.round((meta.height - h) / 2);
  // a near-white opaque block → a large connected very-bright region (luma > 245)
  const halo = await sharp({
    create: { width: w, height: h, channels: 4, background: { r: 252, g: 250, b: 248, alpha: 1 } },
  })
    .png()
    .toBuffer();
  const out = join(FULLOUT, outName);
  await sharp(src).composite([{ input: halo, left, top }]).png().toFile(out);
  return out;
}

async function main() {
  // ---------------- M9 determinism ----------------
  // two byte-identical full-res copies
  const m9a = join(FULLOUT, "m9-good-a.png");
  const m9b = join(FULLOUT, "m9-good-b.png");
  copyFileSync(GOOD, m9a);
  copyFileSync(GOOD, m9b); // identical bytes → md5 equal
  // a 1-byte-altered full-res copy → md5 differs
  const m9bad = join(FULLOUT, "m9-bad.png");
  copyFileSync(GOOD, m9bad);
  flipLastByte(m9bad);
  // Committed M9 corpus must SELF-VALIDATE (the plan's Task-2 verify points --meta-gate at
  // the committed dir). Downscaling re-encodes pixels, so a 1-byte-altered FULL-RES frame
  // would re-encode back to identical committed bytes (the alter is in the trailing CRC, not
  // the pixels) → the bad control could not fail. So: commit good-a once, COPY it byte-for-byte
  // to good-b (guaranteed md5-equal → good PASS), then make bad a 1-byte-altered COPY of the
  // COMMITTED good-a (guaranteed md5-differ → bad FAIL). M9 is pure byte-identity, so a
  // post-encode byte flip is a faithful known-bad.
  await commitCopy(GOOD, "m9-good-a.png");
  copyFileSync(join(COMMITOUT, "m9-good-a.png"), join(COMMITOUT, "m9-good-b.png"));
  copyFileSync(join(COMMITOUT, "m9-good-a.png"), join(COMMITOUT, "m9-bad.png"));
  flipLastByte(join(COMMITOUT, "m9-bad.png"));

  // ---------------- M7 bloom-absence ----------------
  // clean source fixture (committed — tiny text, lives in the tracked controls dir)
  const srcGoodDir = join(COMMITOUT, "m7-src-good");
  const srcBadDir = join(COMMITOUT, "m7-src-bad");
  mkdirSync(srcGoodDir, { recursive: true });
  mkdirSync(srcBadDir, { recursive: true });
  // NB: the GOOD fixture text must NOT contain any forbidden token — not even in a
  // comment — or the code-assert (correctly) flags it. Keep the comment token-free.
  writeFileSync(
    join(srcGoodDir, "Clean.tsx"),
    "// M7 GOOD control: a clean lab-style component — renders nothing, no extra render passes.\nexport function Clean() {\n  return null;\n}\n",
  );
  writeFileSync(
    join(srcBadDir, "Glow.tsx"),
    [
      "// M7 BAD control: a synthetic bloom mount the code-assert MUST catch.",
      'import { EffectComposer, Bloom } from "@react-three/postprocessing";',
      "export function Glow() {",
      "  return (",
      "    <EffectComposer>",
      "      <Bloom intensity={2} luminanceThreshold={0.2} />",
      "    </EffectComposer>",
      "  );",
      "}",
      "",
    ].join("\n"),
  );
  // also mirror the source fixtures into FULLOUT so a single --meta-gate dir works either way
  mkdirSync(join(FULLOUT, "m7-src-good"), { recursive: true });
  mkdirSync(join(FULLOUT, "m7-src-bad"), { recursive: true });
  copyFileSync(join(srcGoodDir, "Clean.tsx"), join(FULLOUT, "m7-src-good", "Clean.tsx"));
  copyFileSync(join(srcBadDir, "Glow.tsx"), join(FULLOUT, "m7-src-bad", "Glow.tsx"));

  // histogram halo frames
  await sharp(GOOD).png().toFile(join(FULLOUT, "m7-halo-good.png")); // normal frame (full-res)
  const m7haloBad = await brightHalo(GOOD, "m7-halo-bad.png"); // synthetic halo (full-res)
  await commitCopy(GOOD, "m7-halo-good.png");
  await commitCopy(m7haloBad, "m7-halo-bad.png");

  // ---------------- M12 regional-MSE ----------------
  await sharp(GOOD).png().toFile(join(FULLOUT, "m12-good.png")); // self-compare → MSE 0
  // tint the HERO felt rect a strong magenta → MSE over that rect is large → FAIL
  const m12bad = await tintRegion(GOOD, REGIONS.feltHero, { r: 255, g: 0, b: 255, alpha: 1 }, "m12-bad-tinted.png");
  await commitCopy(GOOD, "m12-good.png");
  await commitCopy(m12bad, "m12-bad-tinted.png");

  console.log("Integrity controls written:");
  console.log("  full-res working copies →", FULLOUT);
  console.log("  downscaled committed corpus →", COMMITOUT);
  console.log("  + committed source fixtures → m7-src-good/ , m7-src-bad/");
}

main().catch((e) => {
  console.error("make-integrity-controls error:", e.message);
  process.exit(1);
});
