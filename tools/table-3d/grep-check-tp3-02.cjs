/**
 * grep-check-tp3-02.cjs — TP3 plan 04-02 structural invariant checker.
 *
 * Enforces three structural assertions after the TP3 instancing migration:
 *
 *  (1) INSTANCES WIRED — TableLab.tsx contains the token `Instances` (outside the import
 *      line) confirming drei instancing is wired into the scene.
 *
 *  (2) BOTTOM FACE DROPPED — After stripping comment lines, TableLab.tsx does NOT contain
 *      the bottom-face rotation literal `[Math.PI / 2, 0, 0]` (the never-seen bottom face
 *      that was the draw-call waste). The TOP-face `[-Math.PI / 2, 0,` MUST still be present.
 *
 *  (3) CHIP TEXTURES RIGHT-SIZED — Within the chipFaceTexture / chipFaceBump / chipEdgeTexture
 *      function bodies in textures.ts:
 *        - `const S = 512` appears for chipFaceTexture and chipFaceBump (two occurrences)
 *        - `const W = 512` appears for chipEdgeTexture
 *        - `const S = 2048` and `const W = 2048` do NOT appear in any of those three functions
 *
 * Usage (from repo root):
 *   node tools/table-3d/grep-check-tp3-02.cjs
 *
 * Exits 0 on all checks passing (prints one-line OK); exits 1 on any failure (prints reason).
 *
 * Convention: plain Node stdlib only (no new packages). Run from the repo root.
 */

"use strict";

const fs = require("fs");
const path = require("path");

// --- paths (relative to repo root) ---
const TABLE_LAB = path.join("frontend", "src", "lab", "TableLab.tsx");
const TEXTURES = path.join("frontend", "src", "lab", "textures.ts");

// --- helpers ---
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

// --- CHECK 1: Instances token wired in TableLab.tsx (outside the import line) ---
const tableSrc = readFile(TABLE_LAB);
const tableLines = tableSrc.split("\n");

// Find lines containing "Instances" that are NOT the import line
const instancesLines = tableLines.filter(
  (line) => line.includes("Instances") && !line.trimStart().startsWith("import"),
);
if (instancesLines.length === 0) {
  fail(
    "CHECK 1 FAILED — TableLab.tsx does not contain `Instances` outside the import line.\n" +
    "  Expected: <Instances geometry={...} material={...}> usage in InstancedChipStack.\n" +
    "  Actual: no non-import Instances token found.",
  );
}

// --- CHECK 2a: Bottom face mesh rotation literal absent (outside comment lines) ---
// Strip lines whose trimmed content starts with `//` (comment lines)
const nonCommentLines = tableLines.filter((line) => !line.trimStart().startsWith("//"));
const nonCommentSrc = nonCommentLines.join("\n");

// Bottom face was: `<mesh ... rotation={[Math.PI / 2, 0, 0]} ...>` (chip bottom face).
// We check for `<mesh` followed (within 3 lines) by `rotation={[Math.PI / 2, 0, 0]}`.
// This avoids false positives on <Lightformer rotation={[Math.PI / 2, 0, 0]}> which is
// a valid scene lighting element, not a chip face mesh.
// Strategy: split into JSX element groups around `<mesh` occurrences.
let bottomFaceFound = false;
for (let i = 0; i < nonCommentLines.length; i++) {
  if (nonCommentLines[i].includes("<mesh") || nonCommentLines[i].trimStart().startsWith("<mesh")) {
    // Check this line + up to 6 following lines (inline + multi-line JSX prop block)
    const block = nonCommentLines.slice(i, i + 7).join("\n");
    const BOTTOM_ROT_RE = /rotation=\{\s*\[Math\.PI\s*\/\s*2,\s*0,\s*0\]\s*\}/;
    if (BOTTOM_ROT_RE.test(block)) {
      bottomFaceFound = true;
      break;
    }
  }
}
if (bottomFaceFound) {
  fail(
    "CHECK 2a FAILED — TableLab.tsx still contains a <mesh> bottom-face rotation\n" +
    "  `rotation={[Math.PI / 2, 0, 0]}` outside of comment lines.\n" +
    "  The never-seen bottom face was supposed to be dropped in TP3 (SSOT §TP3).",
  );
}

// --- CHECK 2b: Top face rotation prop still present ---
// Top face: rotation={[-Math.PI / 2, 0, <rotY>]} — check that the prop form is present
const TOP_FACE_RE = /rotation=\{\s*\[-Math\.PI\s*\/\s*2,\s*0,/;
if (!TOP_FACE_RE.test(tableSrc)) {
  fail(
    "CHECK 2b FAILED — TableLab.tsx is missing the top-face rotation prop\n" +
    "  `rotation={[-Math.PI / 2, 0,` which is required for the instanced <Instance> rotation.\n" +
    "  Top-face instances must have rotation={[-Math.PI/2, 0, rotY]} to lie flat on top.",
  );
}

// --- CHECK 3: Chip textures right-sized in textures.ts ---
const texSrc = readFile(TEXTURES);

// Extract the region between each chip function header and the next `export function`
// to scope the S/W constant checks to just those three functions.
function extractFunctionBody(src, funcName) {
  const startIdx = src.indexOf(`export function ${funcName}`);
  if (startIdx === -1) return null;
  // Find the next `export function` after this one
  const nextExportIdx = src.indexOf("\nexport function", startIdx + 1);
  return nextExportIdx === -1 ? src.slice(startIdx) : src.slice(startIdx, nextExportIdx);
}

const chipFaceBody = extractFunctionBody(texSrc, "chipFaceTexture");
const chipBumpBody = extractFunctionBody(texSrc, "chipFaceBump");
const chipEdgeBody = extractFunctionBody(texSrc, "chipEdgeTexture");

if (!chipFaceBody) fail("CHECK 3 FAILED — Could not find `chipFaceTexture` function in textures.ts");
if (!chipBumpBody) fail("CHECK 3 FAILED — Could not find `chipFaceBump` function in textures.ts");
if (!chipEdgeBody) fail("CHECK 3 FAILED — Could not find `chipEdgeTexture` function in textures.ts");

// chipFaceTexture and chipFaceBump must declare `const S = 512`
if (!/const\s+S\s*=\s*512/.test(chipFaceBody)) {
  fail(
    "CHECK 3 FAILED — chipFaceTexture in textures.ts does not declare `const S = 512`.\n" +
    "  Expected: S right-sized from 2048 → 512 for mip-friendly chip face texture.",
  );
}
if (!/const\s+S\s*=\s*512/.test(chipBumpBody)) {
  fail(
    "CHECK 3 FAILED — chipFaceBump in textures.ts does not declare `const S = 512`.\n" +
    "  Expected: S right-sized from 2048 → 512 for mip-friendly chip bump texture.",
  );
}

// chipEdgeTexture must declare `const W = 512`
if (!/const\s+W\s*=\s*512/.test(chipEdgeBody)) {
  fail(
    "CHECK 3 FAILED — chipEdgeTexture in textures.ts does not declare `const W = 512`.\n" +
    "  Expected: W right-sized from 2048 → 512 for mip-friendly chip edge texture.",
  );
}

// None of the three must still declare the old 2048 sizes
if (/const\s+S\s*=\s*2048/.test(chipFaceBody)) {
  fail(
    "CHECK 3 FAILED — chipFaceTexture in textures.ts still declares `const S = 2048`.\n" +
    "  Must be changed to 512.",
  );
}
if (/const\s+S\s*=\s*2048/.test(chipBumpBody)) {
  fail(
    "CHECK 3 FAILED — chipFaceBump in textures.ts still declares `const S = 2048`.\n" +
    "  Must be changed to 512.",
  );
}
if (/const\s+W\s*=\s*2048/.test(chipEdgeBody)) {
  fail(
    "CHECK 3 FAILED — chipEdgeTexture in textures.ts still declares `const W = 2048`.\n" +
    "  Must be changed to 512.",
  );
}

// --- All checks passed ---
console.log(
  "OK — grep-check-tp3-02: all 3 structural invariants hold\n" +
  "  (1) Instances wired in TableLab.tsx outside import line\n" +
  "  (2) Bottom-face rotation [Math.PI/2,0,0] absent; top-face [-Math.PI/2,0,...] present\n" +
  "  (3) chipFaceTexture S=512, chipFaceBump S=512, chipEdgeTexture W=512; no 2048 remnants",
);
process.exit(0);
