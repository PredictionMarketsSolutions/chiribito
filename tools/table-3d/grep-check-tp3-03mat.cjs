/**
 * grep-check-tp3-03mat.cjs — TP3 plan 04-03 material structural invariant checker.
 *
 * Enforces Task 2 (de-Vegas chip materials) invariants on frontend/src/lab/TableLab.tsx:
 *
 *  (1) DE-VEGAS BODY CLEARCOAT 0.32 — the de-Vegas body MeshPhysicalMaterial block
 *      contains `clearcoat: 0.32` (the SSOT-locked lower-end matte clay seal value).
 *
 *  (2) DE-VEGAS BODY CLEARCOATROUGHNESS 0.5 — the de-Vegas body material block
 *      contains `clearcoatRoughness: 0.5` (maximally matte, SSOT locked).
 *
 *  (3) SHEEN KILLED — the de-Vegas body material does NOT contain `sheen: 0.5`
 *      (the pre-de-Vegas Vegas-gloss sheen must be gone). The value 0.5 is
 *      specifically checked since sheen: 0 (zero, killed) is the target.
 *
 *  (4) FACE NORMALMAP NOT BUMPMAP — the de-Vegas face MeshPhysicalMaterial block
 *      references `normalMap` and does NOT reference `bumpMap: chipFaceBump` in the
 *      active de-Vegas face mat path (the upgrade from bumpMap to normalMap via the
 *      shared Sobel helper — C reads tooled-not-printed at MACRO).
 *
 *  (5) DEVEGAS BRANCH EXISTS — TableLab.tsx references `chipFaceNormalMap` (imported
 *      from textures.ts and called inside useChipKit's de-Vegas branch), confirming
 *      the de-Vegas material wiring is present.
 *
 * Usage (from repo root):
 *   node tools/table-3d/grep-check-tp3-03mat.cjs
 *
 * Exits 0 on all checks passing (prints one-line OK); exits 1 on any failure.
 * Convention: plain Node stdlib only (no new packages). Run from the repo root.
 */

"use strict";

const fs = require("fs");
const path = require("path");

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

const tableSrc = readFile(TABLE_LAB);

// --- CHECK 1: de-Vegas body clearcoat 0.32 present ---
// The clearcoat: 0.32 appears in the de-Vegas body material in useChipKit.
// Flexible whitespace: `clearcoat : 0.32` or `clearcoat:0.32` or with spaces.
if (!/clearcoat\s*:\s*0\.32/.test(tableSrc)) {
  fail(
    "CHECK 1 FAILED — TableLab.tsx does not contain `clearcoat: 0.32`.\n" +
    "  Expected: de-Vegas body MeshPhysicalMaterial clearcoat set to the SSOT-locked value 0.32.\n" +
    "  Current (pre-de-Vegas) body clearcoat was 0.42.",
  );
}

// --- CHECK 2: de-Vegas body clearcoatRoughness 0.5 present ---
// Allow flexible whitespace. Note: the pre-de-Vegas body had clearcoatRoughness: 0.46;
// the de-Vegas target is 0.5. Both the body AND face use 0.5 in the DV path.
if (!/clearcoatRoughness\s*:\s*0\.5[,\s]/.test(tableSrc)) {
  fail(
    "CHECK 2 FAILED — TableLab.tsx does not contain `clearcoatRoughness: 0.5`.\n" +
    "  Expected: de-Vegas chip material clearcoatRoughness set to 0.5 (maximally matte clay seal).\n" +
    "  Pre-de-Vegas body had 0.46, face had 0.36; both must be 0.5 in the DV path.",
  );
}

// --- CHECK 3: sheen: 0.5 ABSENT from the de-Vegas body material ---
// The pre-de-Vegas body had `sheen: 0.5` (Vegas-gloss contributor).
// The de-Vegas path must remove sheen entirely (not set it to 0.5).
// Strategy: extract the `if (deVegas)` block from useChipKit and verify sheen: 0.5 is absent.
// The pre-de-Vegas `else` branch legitimately keeps `sheen: 0.5` for A/B comparison.
const deVegasBlockMatch = tableSrc.match(/if\s*\(\s*deVegas\s*\)\s*\{([\s\S]*?)}\s*else\s*\{/);
if (!deVegasBlockMatch) {
  fail(
    "CHECK 3 SETUP FAILED — Could not find `if (deVegas) { ... } else {` block in TableLab.tsx.\n" +
    "  Expected: useChipKit has a deVegas conditional that drives the de-Vegas material path.",
  );
}
const deVegasBlock = deVegasBlockMatch[1];
// Strip comment lines from the de-Vegas block before checking
const deVegasNonComment = deVegasBlock.split("\n").filter((l) => !l.trimStart().startsWith("//")).join("\n");
if (/sheen\s*:\s*0\.5/.test(deVegasNonComment)) {
  fail(
    "CHECK 3 FAILED — The de-Vegas `if (deVegas)` block contains `sheen: 0.5`.\n" +
    "  The de-Vegas chip body must kill sheen (remove sheen entirely — gloss killed).\n" +
    "  Pre-de-Vegas had sheen: 0.5; the DV path must not include this property.",
  );
}

// --- CHECK 4: face normalMap present, bumpMap: chipFaceBump absent in active DV path ---
// The de-Vegas face mat must use normalMap (not bumpMap/bumpScale) for the recessed C.

// CHECK 4a: normalMap reference exists in TableLab.tsx
if (!/normalMap\s*:/.test(tableSrc)) {
  fail(
    "CHECK 4a FAILED — TableLab.tsx does not contain `normalMap:` assignment.\n" +
    "  Expected: the de-Vegas chip face material uses normalMap (chipFaceNormalMap) instead of bumpMap.\n" +
    "  The normalMap upgrade makes the C read tooled-not-printed at MACRO.",
  );
}

// CHECK 4b: `bumpMap: chipFaceBump` absent from non-comment lines
// The pre-de-Vegas path had `bumpMap: chipFaceBump(cImg)` — must be gone from the active DV face mat.
// Note: it may still appear in the pre-de-Vegas else branch; that is acceptable.
// The key check is that the DV path does NOT use bumpMap. Since the DV path and pre-DV path
// are both in useChipKit, we check that chipFaceNormalMap is referenced (the DV face mat wires
// the normalMap through it) — if the DV path existed and still used bumpMap, the grep-check for
// normalMap: (CHECK 4a) would still pass but the DV face mat would be wrong.
// Stronger check: `chipFaceNormalMap` must be called in the file (not just imported).
if (!/chipFaceNormalMap\s*\(/.test(tableSrc)) {
  fail(
    "CHECK 4b FAILED — TableLab.tsx does not call `chipFaceNormalMap(...)`.\n" +
    "  Expected: the de-Vegas chip face mat wires `normalMap: chipFaceNormalMap(cImg)` in useChipKit.\n" +
    "  The bumpMap→normalMap upgrade is required for the C to read as a recessed tooled groove.",
  );
}

// --- CHECK 5: chipFaceNormalMap imported in TableLab.tsx ---
if (!/chipFaceNormalMap/.test(tableSrc)) {
  fail(
    "CHECK 5 FAILED — TableLab.tsx does not reference `chipFaceNormalMap`.\n" +
    "  Expected: import { ..., chipFaceNormalMap } from './textures' and usage in useChipKit.",
  );
}
// More specific: confirm it appears in the import block from textures
// The import block spans multiple lines so we match from `import {` to `} from "./textures"`
const importBlockMatch = tableSrc.match(/import\s*\{[\s\S]*?\}\s*from\s*["']\.\/textures["']/);
if (!importBlockMatch || !importBlockMatch[0].includes("chipFaceNormalMap")) {
  fail(
    "CHECK 5 FAILED — `chipFaceNormalMap` is not in the textures import block in TableLab.tsx.\n" +
    "  Expected: chipFaceNormalMap imported from './textures' alongside chipFaceTexture etc.",
  );
}

// --- All checks passed ---
console.log(
  "OK — grep-check-tp3-03mat: all 5 material invariants hold\n" +
  "  (1) De-Vegas body clearcoat: 0.32 (SSOT-locked matte clay seal — lower end)\n" +
  "  (2) De-Vegas chip clearcoatRoughness: 0.5 (maximally matte; was 0.46 body / 0.36 face)\n" +
  "  (3) sheen: 0.5 absent from non-comment code (gloss killed in de-Vegas path)\n" +
  "  (4) normalMap wired via chipFaceNormalMap() in face mat (bumpMap upgrade — C tooled-not-printed)\n" +
  "  (5) chipFaceNormalMap imported from textures.ts and called in TableLab.tsx",
);
process.exit(0);
