/**
 * optimize-cards.ts
 *
 * Re-encode every card asset under `frontend/public/cards/` to a sane
 * size for web/multiplayer (max 800 px wide, WebP quality 85). The
 * heredado deck shipped at print resolution (~1600×2500 each, 2-5 MB),
 * which is pointless for a 300 px tall on-screen card and made the
 * frontend bundle weigh ~57 MB.
 *
 * Idempotent: re-running on already-optimised files is a no-op for size
 * (sharp re-encodes the same content at the same params → similar bytes).
 *
 * Usage:
 *   npm install            # ensure sharp is present
 *   tsx scripts/optimize-cards.ts
 *   tsx scripts/optimize-cards.ts --dry-run         # report, do not write
 *   tsx scripts/optimize-cards.ts --width 1200      # custom max width
 *   tsx scripts/optimize-cards.ts --quality 90      # custom WebP quality
 */

import sharp from "sharp";
import { promises as fs } from "fs";
import { join } from "path";

interface Options {
  targetWidth: number;
  quality: number;
  dryRun: boolean;
  dir: string;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    targetWidth: 800,
    quality: 85,
    dryRun: false,
    dir: "frontend/public/cards"
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--width") opts.targetWidth = parseInt(argv[++i] ?? "", 10);
    else if (a === "--quality") opts.quality = parseInt(argv[++i] ?? "", 10);
    else if (a === "--dir") opts.dir = argv[++i] ?? opts.dir;
  }
  if (!Number.isFinite(opts.targetWidth) || opts.targetWidth < 100) {
    throw new Error(`Invalid --width: ${opts.targetWidth}`);
  }
  if (!Number.isFinite(opts.quality) || opts.quality < 1 || opts.quality > 100) {
    throw new Error(`Invalid --quality: ${opts.quality}`);
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const entries = await fs.readdir(opts.dir);
  // Process only image card faces; leave back.svg and back_logo.png alone.
  const targets = entries
    .filter((f) => /\.(webp|png)$/i.test(f))
    .filter((f) => !/^back(_logo)?\.(webp|png)$/i.test(f))
    .sort();

  console.log(`Chiribito card optimiser`);
  console.log(`  dir:      ${opts.dir}`);
  console.log(`  width:    ${opts.targetWidth}px (no enlargement)`);
  console.log(`  quality:  webp q${opts.quality}`);
  console.log(`  dry-run:  ${opts.dryRun}`);
  console.log(`  targets:  ${targets.length} files`);
  console.log("");

  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of targets) {
    const path = join(opts.dir, file);
    // Read into a buffer up-front so sharp doesn't keep a Windows file
    // handle open while we try to overwrite the same path.
    const input = await fs.readFile(path);
    const before = input.length;

    const pipeline = sharp(input).resize({
      width: opts.targetWidth,
      withoutEnlargement: true
    });
    const meta = await sharp(input).metadata();
    const optimised = await pipeline
      .webp({ quality: opts.quality, effort: 6 })
      .toBuffer();

    const after = optimised.length;
    totalBefore += before;
    totalAfter += after;

    const dims = `${meta.width}x${meta.height}`;
    const newExt = file.replace(/\.(webp|png)$/i, ".webp");
    const ratio = ((after / before) * 100).toFixed(1) + "%";

    console.log(
      `  ${file.padEnd(24)} ` +
      `${dims.padStart(11)}  ` +
      `${(before / 1024).toFixed(0).padStart(6)} KB → ` +
      `${(after / 1024).toFixed(0).padStart(6)} KB  ` +
      `(${ratio.padStart(6)})`
    );

    if (!opts.dryRun) {
      const newPath = join(opts.dir, newExt);
      // Write to a temp path then rename — atomic on the same filesystem,
      // dodges any leftover handle on Windows.
      const tmpPath = newPath + ".tmp";
      await fs.writeFile(tmpPath, optimised);
      if (newPath !== path) {
        await fs.unlink(path);
      }
      await fs.rename(tmpPath, newPath);
    }
  }

  console.log("");
  console.log(
    `Total: ${(totalBefore / 1024 / 1024).toFixed(2)} MB → ` +
    `${(totalAfter / 1024 / 1024).toFixed(2)} MB ` +
    `(saved ${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`
  );
  if (opts.dryRun) console.log("(dry run — no files written)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
