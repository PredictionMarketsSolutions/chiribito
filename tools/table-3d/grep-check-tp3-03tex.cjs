/**
 * grep-check-tp3-03tex.cjs — TP3 plan 04-03 texture structural invariant checker.
 *
 * Enforces Task 1 (de-Vegas chip textures) invariants on frontend/src/lab/textures.ts:
 *
 *  (1) CHIPFACENORMALMAP EXPORT EXISTS — textures.ts exports a function named
 *      `chipFaceNormalMap` (de-Vegas normal map producer for the recessed-C groove).
 *
 *  (2) NORMALMAP USES SHARED HELPER — the body of `chipFaceNormalMap` references both
 *      `heightToNormalMap` (Sobel height→normal conversion) and `toNormalMapTexture`
 *      (NoColorSpace CanvasTexture wrapper) — the shared normalMapHelper pattern.
 *
 *  (3) NO SRGB ON NORMAL CANVAS — the `chipFaceNormalMap` function body does NOT call
 *      `srgb(` (which would apply SRGBColorSpace to the normal map, destroying XYZ
 *      components — Pitfall #3). The normal path must use toNormalMapTexture only.
 *
 *  (4) CHIP TEXTURES STILL 512 — chipFaceTexture and chipFaceBump still declare
 *      `const S = 512` (the 04-02 right-size is preserved, not reverted to 2048);
 *      chipEdgeTexture still declares `const W = 512`.
 *
 *  (5) LOGO SHRUNK — chipFaceTextureDV's body has a cSize literal below `r * 1.26`
 *      (confirming the logo is shrunk vs the pre-de-Vegas r*1.26 baseline).
 *      Accepts r*1.02, r*1.0, r*1.1, r*1.05, r*1.10, r*1.15, r*1.20 — any factor < 1.26.
 *
 *  (6) LOGO DESATURATED — a `saturate` filter string appears in chipFaceTextureDV
 *      near the C draw (confirming ctx.filter = "saturate(...)" is applied).
 *
 * Usage (from repo root):
 *   node tools/table-3d/grep-check-tp3-03tex.cjs
 *
 * Exits 0 on all checks passing (prints one-line OK); exits 1 on any failure.
 * Convention: plain Node stdlib only (no new packages). Run from the repo root.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const TEXTURES = path.join("frontend", "src", "lab", "textures.ts");

function readFile(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    fail(`File not found: ${filePath} (run from repo root)`);
  }
  return fs.readFileSync(abs, "utf8");
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

// Helper: extract the body of an export function by name (from its signature to the next export function)
function extractFunctionBody(src, funcName) {
  const startIdx = src.indexOf(`export function ${funcName}`);
  if (startIdx === -1) return null;
  const nextExportIdx = src.indexOf("\nexport function", startIdx + 1);
  return nextExportIdx === -1 ? src.slice(startIdx) : src.slice(startIdx, nextExportIdx);
}

const texSrc = readFile(TEXTURES);

// --- CHECK 1: chipFaceNormalMap export exists ---
if (!/export\s+function\s+chipFaceNormalMap/.test(texSrc)) {
  fail(
    "CHECK 1 FAILED — textures.ts does not export `chipFaceNormalMap`.\n" +
    "  Expected: `export function chipFaceNormalMap(cImg?)` to exist (TP3 de-Vegas recessed-C normalMap).",
  );
}

// --- CHECK 2: chipFaceNormalMap uses heightToNormalMap + toNormalMapTexture ---
const normalMapBody = extractFunctionBody(texSrc, "chipFaceNormalMap");
if (!normalMapBody) {
  fail("CHECK 2 FAILED — Could not extract body of `chipFaceNormalMap` from textures.ts.");
}
if (!/heightToNormalMap/.test(normalMapBody)) {
  fail(
    "CHECK 2 FAILED — chipFaceNormalMap does not call `heightToNormalMap`.\n" +
    "  Expected: the shared Sobel helper from normalMapHelper.ts to be used for height→normal conversion.",
  );
}
if (!/toNormalMapTexture/.test(normalMapBody)) {
  fail(
    "CHECK 2 FAILED — chipFaceNormalMap does not call `toNormalMapTexture`.\n" +
    "  Expected: toNormalMapTexture(canvas) to set NoColorSpace (Pitfall #3 guard).",
  );
}

// --- CHECK 3: chipFaceNormalMap does NOT call srgb() on the normal canvas ---
// Allow `srgb` to appear in COMMENTS inside the function, but not as a function call.
// We check that `srgb(` (a call) is absent from the function body.
if (/(?<!\/\/.*)srgb\s*\(/.test(normalMapBody.replace(/\/\/[^\n]*/g, ""))) {
  fail(
    "CHECK 3 FAILED — chipFaceNormalMap contains a `srgb(` call.\n" +
    "  Normal maps MUST use toNormalMapTexture (NoColorSpace), never srgb() — Pitfall #3.\n" +
    "  The sRGB gamma decode destroys XYZ normal components.",
  );
}

// --- CHECK 4: chip textures still at 512 (04-02 right-size preserved) ---
const chipFaceBody = extractFunctionBody(texSrc, "chipFaceTexture");
const chipBumpBody = extractFunctionBody(texSrc, "chipFaceBump");
const chipEdgeBody = extractFunctionBody(texSrc, "chipEdgeTexture");

if (!chipFaceBody) fail("CHECK 4 FAILED — Could not find `chipFaceTexture` in textures.ts");
if (!chipBumpBody) fail("CHECK 4 FAILED — Could not find `chipFaceBump` in textures.ts");
if (!chipEdgeBody) fail("CHECK 4 FAILED — Could not find `chipEdgeTexture` in textures.ts");

if (!/const\s+S\s*=\s*512/.test(chipFaceBody)) {
  fail(
    "CHECK 4 FAILED — chipFaceTexture does not declare `const S = 512`.\n" +
    "  The 04-02 right-size must be preserved (not reverted to 2048).",
  );
}
if (!/const\s+S\s*=\s*512/.test(chipBumpBody)) {
  fail(
    "CHECK 4 FAILED — chipFaceBump does not declare `const S = 512`.\n" +
    "  The 04-02 right-size must be preserved (not reverted to 2048).",
  );
}
if (!/const\s+W\s*=\s*512/.test(chipEdgeBody)) {
  fail(
    "CHECK 4 FAILED — chipEdgeTexture does not declare `const W = 512`.\n" +
    "  The 04-02 right-size must be preserved (not reverted to 2048).",
  );
}
// Also verify no 2048 re-appears
if (/const\s+S\s*=\s*2048/.test(chipFaceBody)) {
  fail("CHECK 4 FAILED — chipFaceTexture still declares `const S = 2048` (must be 512).");
}
if (/const\s+S\s*=\s*2048/.test(chipBumpBody)) {
  fail("CHECK 4 FAILED — chipFaceBump still declares `const S = 2048` (must be 512).");
}
if (/const\s+W\s*=\s*2048/.test(chipEdgeBody)) {
  fail("CHECK 4 FAILED — chipEdgeTexture still declares `const W = 2048` (must be 512).");
}

// --- CHECK 5: logo shrunk in chipFaceTextureDV (cSize factor < 1.26) ---
const chipFaceDVBody = extractFunctionBody(texSrc, "chipFaceTextureDV");
if (!chipFaceDVBody) {
  fail(
    "CHECK 5 FAILED — textures.ts does not contain `chipFaceTextureDV`.\n" +
    "  Expected: the de-Vegas face texture function with muted palette + shrunk logo.",
  );
}

// Look for a cSize assignment with a factor strictly less than 1.26
// Matches: r * 1.02, r*1.0, r * 1.10, r * 1.15, r * 1.20, r*1.25, etc. — any < 1.26
const cSizeMatch = chipFaceDVBody.match(/cSize\s*=\s*r\s*\*\s*([\d.]+)/);
if (!cSizeMatch) {
  fail(
    "CHECK 5 FAILED — chipFaceTextureDV does not contain a `cSize = r * <factor>` assignment.\n" +
    "  Expected: logo shrunk by setting cSize to r * <factor where factor < 1.26>.",
  );
}
const cSizeFactor = parseFloat(cSizeMatch[1]);
if (cSizeFactor >= 1.26) {
  fail(
    `CHECK 5 FAILED — chipFaceTextureDV cSize factor is ${cSizeFactor}, which is >= 1.26.\n` +
    "  The logo must be shrunk (cSize < r*1.26). De-Vegas requires a smaller, quieter logo.",
  );
}

// --- CHECK 6: logo desaturated in chipFaceTextureDV (saturate filter present) ---
if (!/saturate/.test(chipFaceDVBody)) {
  fail(
    "CHECK 6 FAILED — chipFaceTextureDV does not contain a `saturate` filter.\n" +
    "  Expected: ctx.filter = \"saturate(...)\" applied before the C draw (logo desaturation).",
  );
}

// --- All checks passed ---
console.log(
  "OK — grep-check-tp3-03tex: all 6 texture invariants hold\n" +
  "  (1) chipFaceNormalMap exported from textures.ts\n" +
  "  (2) chipFaceNormalMap calls heightToNormalMap + toNormalMapTexture (shared helper)\n" +
  "  (3) No srgb() call on the normal canvas (NoColorSpace path enforced)\n" +
  "  (4) chipFaceTexture S=512, chipFaceBump S=512, chipEdgeTexture W=512 (04-02 right-size preserved)\n" +
  "  (5) chipFaceTextureDV cSize < r*1.26 (logo shrunk vs pre-de-Vegas baseline)\n" +
  "  (6) chipFaceTextureDV contains saturate filter (logo desaturated)",
);
process.exit(0);
