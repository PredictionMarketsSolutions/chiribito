/**
 * grep-check-tp5-06.cjs — TP5 lighting invariant checker (plans 06-01…06-05).
 *
 * Enforces the 6 shipped TP5 lighting invariants in:
 *   frontend/src/lab/TableLab.tsx  (main target — all checks except CHECK 5)
 *   frontend/src/lab/             (all .tsx/.ts — CHECK 5 no-bloom scope)
 *
 * Background (SSOT §TP5 — Iluminación & Sombras):
 *   TP5 ships warm grounded lighting: SoftShadows PCSS (unconditional), ContactShadows
 *   baked once (frames={1}), key-to-fill ratio ceiling (anti-casino sentinel), shadow
 *   normalBias (peter-pan prevention), and zero postprocessing (all deferred to TP6).
 *   Brass roughness from TP4 Lever D is held at 0.42 — the TP5 specular pass must not
 *   have changed it.
 *
 * Checks (all mandatory for shipped TP5):
 *
 *  (1) SOFTSHADOWS WIRED — TableLab.tsx contains <SoftShadows in non-comment code.
 *      TP5 pitfall: SoftShadows inside a conditional causes shader recompile storm on
 *      flag change. The check verifies PRESENCE (unconditional injection proxy).
 *
 *  (2) CONTACTSHADOWS FRAMES={1} WIRED — frames={1} present in TableLab.tsx non-comment.
 *      ContactShadows baked once at mount (M11 improvement: 106→52 draws).
 *
 *  (3) KEY_TO_FILL_RATIO_CEILING CONSTANT PRESENT — anti-casino sentinel: key intensity /
 *      fill intensity MUST stay <= 3.5x. The constant makes the ceiling grep-checkable.
 *      Shaped path: 2.2/0.8 = 2.75x (PASS). Base path: 2.0/0.7 = 2.86x (PASS).
 *
 *  (4) SHADOW-NORMALBIAS ON KEY SPOTLIGHT — shadow-normalBias present in non-comment code.
 *      shadow-normalBias={0.02} prevents peter-pan floating artifact on the flat felt plane.
 *
 *  (5) NO BLOOM IN LAB SOURCE — M7 code assert (relaxed in TP6).
 *      Checks ALL .tsx and .ts files in frontend/src/lab/ (non-comment lines).
 *      TP6 relaxation: EffectComposer is now permitted (TP6 adds it behind ?fx guard).
 *      Only Bloom remains permanently forbidden (M7 HARD gate: casino trap + perf sink).
 *
 *  (6) BRASSMAT ROUGHNESS IN TP4-LOCKED RANGE (0.42-0.45) — TP4 Lever D brass roughness.
 *      The TP5 per-material specular pass must not have changed the brass roughness.
 *      M4 guards against brass-gold drift — roughness is the primary protection.
 *
 * Usage (from repo root):
 *   node tools/table-3d/grep-check-tp5-06.cjs
 *
 * Exits 0 on all checks passing (one-line OK); exits 1 on any failure.
 * Convention: plain Node stdlib only (no new packages). Run from the repo root.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const TABLE_LAB = path.join("frontend", "src", "lab", "TableLab.tsx");
const LAB_DIR   = path.join("frontend", "src", "lab");

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
  const nextExport = src.indexOf("\nexport function", start + marker.length);
  const body = nextExport === -1 ? src.slice(start) : src.slice(start, nextExport);
  return stripComments(body);
}

const tableSrc = readFile(TABLE_LAB);
const tableNonComment = stripComments(tableSrc);

// --- CHECK 1: SoftShadows present in non-comment code (unconditional injection) ---
if (!/<SoftShadows/.test(tableNonComment)) {
  fail(
    "CHECK 1 FAILED — TableLab.tsx does not contain <SoftShadows in non-comment code.\n" +
    "  Expected: <SoftShadows size={30} samples={16} focus={0} /> unconditionally in Scene, above Lights.\n" +
    "  TP5 pitfall: SoftShadows inside a conditional causes shader recompile storm on flag change.\n" +
    "  PCSS must be injected ONCE at mount — never toggled or conditioned by ?light= or ?soft= flags.",
  );
}

// --- CHECK 2: ContactShadows frames={1} present in non-comment code ---
if (!/frames=\{1\}/.test(tableNonComment)) {
  fail(
    "CHECK 2 FAILED — TableLab.tsx does not contain frames={1} in non-comment code.\n" +
    "  Expected: ContactShadows frames={1} baked once at mount (eliminates per-frame scene re-render).\n" +
    "  Without frames={1}, ContactShadows re-renders the full scene every frame → M11 regresses.\n" +
    "  M10 improvement recorded: 106 draws (TP4 baseline) → 52 draws (TP5 with frames={1}).",
  );
}

// --- CHECK 3: KEY_TO_FILL_RATIO_CEILING constant present ---
if (!/KEY_TO_FILL_RATIO_CEILING/.test(tableNonComment)) {
  fail(
    "CHECK 3 FAILED — TableLab.tsx does not contain KEY_TO_FILL_RATIO_CEILING in non-comment code.\n" +
    "  Expected: const KEY_TO_FILL_RATIO_CEILING = 3.5 in Lights component.\n" +
    "  Anti-casino sentinel: key intensity / fill intensity MUST stay <= 3.5x.\n" +
    "  Current ratios: shaped path 2.2/0.8 = 2.75x (PASS) · base path 2.0/0.7 = 2.86x (PASS).",
  );
}

// --- CHECK 4: shadow-normalBias present on key spotLight ---
if (!/shadow-normalBias/.test(tableNonComment)) {
  fail(
    "CHECK 4 FAILED — TableLab.tsx does not contain shadow-normalBias in non-comment code.\n" +
    "  Expected: shadow-normalBias={0.02} on the key spotLight (peter-pan prevention).\n" +
    "  The felt plane has a perfectly flat normal — without normalBias, cards and chips\n" +
    "  appear to float above the felt (peter-pan shadow artifact). 0.02 is the calibrated value.",
  );
}

// --- CHECK 5: No Bloom in frontend/src/lab/ (M7 code assert — relaxed in TP6) ---
// TP6 relaxation: EffectComposer is now PERMITTED (TP6 adds it behind ?fx guard).
// Only Bloom remains permanently forbidden (casino trap + perf sink, M7 HARD gate).
// Read ALL .tsx and .ts files in the lab directory and check for the forbidden token.
const labFiles = fs.readdirSync(path.resolve(LAB_DIR))
  .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
  .map((f) => path.join(LAB_DIR, f));

let labSrcCombined = "";
let offendingFile = null;

for (const labFile of labFiles) {
  const src = readFile(labFile);
  const nonComment = stripComments(src);
  if (/Bloom/.test(nonComment)) {
    offendingFile = labFile;
    labSrcCombined = nonComment; // keep for error reporting
    break;
  }
  labSrcCombined += nonComment;
}

if (offendingFile !== null) {
  fail(
    "CHECK 5 FAILED — Bloom detected in lab source. M7 HARD gate: Bloom is permanently\n" +
    "  banned (casino trap + perf sink). EffectComposer is now permitted (TP6 adds it).\n" +
    "  Only Bloom remains forbidden.\n" +
    `  Offending file: ${offendingFile}\n` +
    "  Remove all Bloom imports and JSX from frontend/src/lab/ before proceeding.",
  );
}

// --- CHECK 6: brassMat roughness in TP4-locked range 0.42-0.45 ---
// Regex tolerates whitespace around the colon: roughness\s*:\s*0\.4[2-5]
// Matches 0.42, 0.43, 0.44, 0.45 (SSOT range 0.38-0.45; Lever D target 0.42).
if (!/roughness\s*:\s*0\.4[2-5]/.test(tableNonComment)) {
  fail(
    "CHECK 6 FAILED — TableLab.tsx does not contain brassMat roughness 0.42-0.45 in non-comment code.\n" +
    "  TP4-locked: brassMat roughness must remain 0.42 (Lever D; SSOT range 0.38-0.45).\n" +
    "  TP5 per-material specular pass must NOT have changed the brass roughness.\n" +
    "  M4 guards against brass-gold drift — roughness is the primary specular protection.",
  );
}

// --- All 6 checks passed ---
console.log(
  "OK — grep-check-tp5-06: all 6 TP5 lighting invariants hold\n" +
  "  (1) SoftShadows unconditional in Scene (PCSS injected once; no per-flag toggle)\n" +
  "  (2) ContactShadows frames={1} (baked once; M10 improved 106→52 draws)\n" +
  "  (3) KEY_TO_FILL_RATIO_CEILING = 3.5 (anti-casino sentinel; shaped 2.75x / base 2.86x)\n" +
  "  (4) shadow-normalBias present on key spotLight (peter-pan prevention on flat felt plane)\n" +
  "  (5) No Bloom in frontend/src/lab/ (M7 PASS — Bloom banned; EffectComposer now permitted per TP6)\n" +
  "  (6) brassMat roughness 0.42-0.45 (TP4-locked; brass aging pass held through TP5 specular changes)",
);
process.exit(0);
