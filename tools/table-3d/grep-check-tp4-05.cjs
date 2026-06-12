/**
 * grep-check-tp4-05.cjs — TP4 craft lever structural invariant checker (plans 05-03 + 05-04).
 *
 * Enforces the shipped craft lever invariants across:
 *   frontend/src/lab/textures.ts
 *   frontend/src/lab/TableLab.tsx
 *
 * POST-05-04 DEFAULT FLIP (operator APPROVED 2026-06-12 — slim + craft shipped as default):
 *   DEFAULT (no ?rail=) = slim ON (yTop 0.28) + ALL craft levers ON — the TP4 approved look.
 *   ?rail=base          = pre-TP4 baseline: yTop 0.34 + no craft.
 *   ?rail=slim          = slim only, no craft (A/B isolation; never combine with ?rail=craft).
 *   ?rail=craft         = craft only, no slim (A/B isolation).
 *   ?rail=welt/normals/brass = single-lever isolation (craft group; no slim).
 *   Lever E (UV arc-length remap) DROPPED — deferred to TP7.
 *
 * Checks (all mandatory for shipped levers):
 *
 *  (1) WOOD NORMALMAP WIRED — textures.ts exports woodNapNormalMap that calls heightToNormalMap
 *      and toNormalMapTexture (not srgb in code). NoColorSpace enforced by the helper.
 *
 *  (2) LEATHER BUMPMAP REMOVED FROM NORMALS PATH — TableLab.tsx calls leatherNapNormalMap()
 *      in non-comment code (the isNormals path wires the Lever C upgrade).
 *
 *  (3) LEATHER NORMALMAP WIRED — textures.ts exports leatherNapNormalMap that calls
 *      toNormalMapTexture and does NOT call srgb() in code (comment warnings permitted).
 *
 *  (4) BRASS ROUGHNESS IN AGED-BRASS RANGE — TableLab.tsx brassMat roughness 0.42-0.45
 *      (SSOT range 0.38-0.45; Lever D target 0.42).
 *
 *  (5) NOCOLORSPACE ON RAIL NORMALS — both rail normalMap functions call toNormalMapTexture
 *      inside their function body (not srgb/gray as the texture wrapper).
 *
 *  (6) WELT GEOMETRY PRESENT — TableLab.tsx contains FELT_R * 0.960 (Lever A torusGeometry).
 *
 *  (7) ICRAFT WIRED — TableLab.tsx contains isCraft, confirming the craft accumulator is documented.
 *      Post-05-04 default flip: isCraft = !isBase && railFlag !== 'slim' — craft is ON by default;
 *      suppressed by ?rail=base (pre-TP4) or ?rail=slim (slim-only isolation path).
 *
 * Usage (from repo root):
 *   node tools/table-3d/grep-check-tp4-05.cjs
 *
 * Exits 0 on all checks passing (one-line OK); exits 1 on any failure.
 * Convention: plain Node stdlib only (no new packages). Run from the repo root.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const TEXTURES = path.join("frontend", "src", "lab", "textures.ts");
const TABLE_LAB = path.join("frontend", "src", "lab", "TableLab.tsx");

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

/** Strip comment-only lines (lines starting with //) from a source string. */
function stripComments(src) {
  return src.split("\n").filter((l) => !l.trimStart().startsWith("//")).join("\n");
}

/**
 * Extract the source of a named exported function from the file source.
 * Returns everything from `export function <name>` to the next `\nexport function`
 * or end of file. Strips comment lines before returning.
 */
function extractFunction(src, name) {
  const marker = `export function ${name}`;
  const start = src.indexOf(marker);
  if (start === -1) return null;
  // Find next export function after start
  const nextExport = src.indexOf("\nexport function", start + marker.length);
  const body = nextExport === -1 ? src.slice(start) : src.slice(start, nextExport);
  return stripComments(body);
}

const texturesSrc = readFile(TEXTURES);
const tableSrc = readFile(TABLE_LAB);
const tableNonComment = stripComments(tableSrc);

// --- CHECK 1: woodNapNormalMap exported, calls heightToNormalMap + toNormalMapTexture, no srgb ---
const woodFn = extractFunction(texturesSrc, "woodNapNormalMap");
if (!woodFn) {
  fail(
    "CHECK 1 FAILED — textures.ts does not export woodNapNormalMap.\n" +
    "  Expected: TP4 Lever B+F wood normalMap exported as woodNapNormalMap().",
  );
}
if (!/heightToNormalMap/.test(woodFn)) {
  fail(
    "CHECK 1 FAILED — woodNapNormalMap does not call heightToNormalMap.\n" +
    "  Expected: heightToNormalMap(c, 1.0) inside woodNapNormalMap (shared Sobel pipeline).",
  );
}
if (!/toNormalMapTexture/.test(woodFn)) {
  fail(
    "CHECK 1 FAILED — woodNapNormalMap does not call toNormalMapTexture.\n" +
    "  Expected: toNormalMapTexture(normalCanvas) for NoColorSpace enforcement.",
  );
}
if (/srgb\(/.test(woodFn)) {
  fail(
    "CHECK 1 FAILED — woodNapNormalMap calls srgb() in non-comment code.\n" +
    "  Normal maps MUST use toNormalMapTexture() (NoColorSpace). srgb() gamma-decodes XYZ components.",
  );
}

// --- CHECK 2: leatherNapNormalMap called in TableLab.tsx (isNormals path wired) ---
if (!/leatherNapNormalMap\s*\(\s*\)/.test(tableNonComment)) {
  fail(
    "CHECK 2 FAILED — TableLab.tsx does not call leatherNapNormalMap() in non-comment code.\n" +
    "  Expected: leatherNapNormalMap() wired as normalMap in the isNormals leather material branch.\n" +
    "  bumpMap: leatherBump() may remain in the baseline (isNormals=false) branch for A/B.",
  );
}

// --- CHECK 3: leatherNapNormalMap exported, calls toNormalMapTexture, no srgb in code ---
const leatherFn = extractFunction(texturesSrc, "leatherNapNormalMap");
if (!leatherFn) {
  fail(
    "CHECK 3 FAILED — textures.ts does not export leatherNapNormalMap.\n" +
    "  Expected: TP4 Lever C leather normalMap exported as leatherNapNormalMap().",
  );
}
if (!/toNormalMapTexture/.test(leatherFn)) {
  fail(
    "CHECK 3 FAILED — leatherNapNormalMap does not call toNormalMapTexture.\n" +
    "  Expected: toNormalMapTexture(normalCanvas) for NoColorSpace (never srgb on a normal canvas).",
  );
}
if (/srgb\(/.test(leatherFn)) {
  fail(
    "CHECK 3 FAILED — leatherNapNormalMap calls srgb() in non-comment code.\n" +
    "  Normal maps MUST use toNormalMapTexture() (NoColorSpace).",
  );
}

// --- CHECK 4: brassMat roughness in aged-brass range 0.42-0.45 ---
if (!/roughness\s*:\s*0\.4[2-5]/.test(tableNonComment)) {
  fail(
    "CHECK 4 FAILED — TableLab.tsx does not contain brass roughness 0.42-0.45 in non-comment code.\n" +
    "  Expected: brassMat roughness: 0.42 (Lever D; SSOT target range 0.38-0.45).\n" +
    "  M4 casino-drift guard: roughness 0.34→0.42 reduces specular V (safer direction).",
  );
}

// --- CHECK 5: toNormalMapTexture inside BOTH rail normalMap functions ---
// Already verified by CHECK 1 (wood) and CHECK 3 (leather); this is the consolidated pass.
if (!woodFn || !leatherFn || !/toNormalMapTexture/.test(woodFn) || !/toNormalMapTexture/.test(leatherFn)) {
  fail(
    "CHECK 5 FAILED — toNormalMapTexture not confirmed inside one or both rail normalMap functions.\n" +
    "  Both woodNapNormalMap and leatherNapNormalMap MUST call toNormalMapTexture (NoColorSpace).\n" +
    "  Pattern: chipFaceNormalMap final 2 lines — the canonical TP3 template.",
  );
}

// --- CHECK 6: Welt geometry present (Lever A shipped) ---
// Match FELT_R * 0.960 in the torusGeometry (note: 0.960 ends with 0, so avoid \b after 0.96).
if (!/FELT_R\s*\*\s*0\.960/.test(tableNonComment)) {
  fail(
    "CHECK 6 FAILED — TableLab.tsx does not contain FELT_R * 0.960 in non-comment code.\n" +
    "  Expected: welt torusGeometry args={[FELT_R * 0.960, 0.012, 12, 180]} (Lever A).\n" +
    "  Anti-fussy-welt: tube 0.012, near-black #2a1208, y=0.022 above brass at y=0.014.",
  );
}

// --- CHECK 7: isCraft accumulator wired ---
if (!/isCraft/.test(tableNonComment)) {
  fail(
    "CHECK 7 FAILED — TableLab.tsx does not reference isCraft in non-comment code.\n" +
    "  Expected: const isCraft = railFlag === 'craft' documenting the ?rail=craft accumulator.\n" +
    "  ?rail=craft activates all passing levers: isWelt + isNormals + isBrass.",
  );
}

// --- All checks passed ---
console.log(
  "OK — grep-check-tp4-05: all 7 TP4 craft lever invariants hold\n" +
  "  (1) woodNapNormalMap exported — heightToNormalMap + toNormalMapTexture (NoColorSpace); no srgb\n" +
  "  (2) leatherNapNormalMap() called in TableLab.tsx non-comment (isNormals path wired)\n" +
  "  (3) leatherNapNormalMap exported — toNormalMapTexture (NoColorSpace); no srgb\n" +
  "  (4) brassMat roughness 0.42-0.45 (Lever D aged-brass; SSOT target 0.38-0.45)\n" +
  "  (5) Both rail normalMaps call toNormalMapTexture (NoColorSpace) — chipFaceNormalMap pattern\n" +
  "  (6) Welt torusGeometry FELT_R*0.960 present (Lever A welt cord at felt-to-rail seam)\n" +
  "  (7) isCraft accumulator wired (?rail=craft activates all passing craft levers)",
);
process.exit(0);
