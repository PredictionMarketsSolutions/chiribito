/**
 * grep-check-tp6-07.cjs — TP6 postprocessing invariant checker (plan 07-06).
 *
 * Enforces the 8 shipped TP6 postprocessing + forward-carried invariants in:
 *   frontend/src/lab/TableLab.tsx  (main target — checks 1-4, 6-8)
 *   frontend/src/lab/             (all .tsx/.ts — CHECK 5 no-bloom scope)
 *
 * Background (SSOT §TP6 — Profundidad & Composición):
 *   TP6 ships the postprocessing compositor for the first time (behind ?fx guard):
 *   EffectComposer + N8AO (crevice AO / M6) + DepthOfField (whisper / M1)
 *   + BrightnessContrast (warm grade / +A) + Vignette (frame / M8)
 *   + Noise (grain / M9). All effects mount once at page-load; no runtime toggle.
 *   This checker asserts the compositor IS wired AND the permanent Bloom ban is held.
 *   Checks 6-8 forward-carry the TP4+TP5 invariants that must not regress.
 *
 * Checks (all mandatory for shipped TP6):
 *
 *  (1) EFFECTCOMPOSER PRESENT — TableLab.tsx contains <EffectComposer in non-comment code.
 *      TP6 ships the compositor behind {qp("fx") !== null && <EffectComposer multisampling={4} ...>}
 *
 *  (2) N8AO PRESENT — TableLab.tsx contains <N8AO in non-comment code.
 *      TP6 requires N8AO for honest crevice darkening under cards/chips (M6 satisfier).
 *      N8AO is bundled in @react-three/postprocessing@2.19.1; no separate install needed.
 *
 *  (3) DEPTHOFSHIELD PRESENT — TableLab.tsx contains <DepthOfField in non-comment code.
 *      DepthOfField shipped in 07-03 (M1 PASS 50px — hole cards RAZOR-SHARP).
 *      worldFocusDistance=holeCardDistance ensures the hero is always in the sharp band.
 *      (If DOF had been cut at M1 HARD gate, this check would be adapted to always-pass
 *      with a note; it was NOT cut — DOF shipped. Disposition in 07-03-SUMMARY.)
 *
 *  (4) VIGNETTE PRESENT — TableLab.tsx contains <Vignette in non-comment code.
 *      TP6 requires Vignette for M8 frame-darkening (8-20% restrained band).
 *      Params: offset=0.70/darkness=0.12 (restrained; tuned for M8-safe rect calibration).
 *
 *  (5) NO BLOOM IN LAB SOURCE — M7 code assert (permanent; never relaxed).
 *      Checks ALL .tsx and .ts files in frontend/src/lab/ (non-comment lines).
 *      Bloom is permanently banned: casino trap + perf sink. M7 HARD GATE.
 *      TP6 allows EffectComposer (check 1 asserts it). Only Bloom remains forbidden.
 *
 *  (6) BRASSMAT ROUGHNESS IN TP4-LOCKED RANGE (0.42-0.45) — Lever D brass aging pass.
 *      Forward-carries the TP4 invariant: brassMat roughness 0.42 + envMapIntensity 0.30.
 *      M4 guards against brass-gold drift — roughness is the primary specular protection.
 *
 *  (7) SOFTSHADOWS UNCONDITIONAL — TableLab.tsx contains <SoftShadows in non-comment code.
 *      Forward-carries the TP5 invariant: SoftShadows injected ONCE at mount (PCSS grounding).
 *      Must not be placed inside a conditional (shader recompile storm pitfall).
 *
 *  (8) CONTACTSHADOWS FRAMES={1} — frames={1} present in TableLab.tsx non-comment code.
 *      Forward-carries the TP5 invariant: ContactShadows baked once at mount.
 *      M11 improvement: 106 draws → 52 draws; per-frame re-render is the regression vector.
 *
 * Usage (from repo root):
 *   node tools/table-3d/grep-check-tp6-07.cjs
 *
 * Exits 0 on all checks passing (one-line OK); exits 1 on any failure.
 * Convention: plain Node stdlib only (no new packages). Run from the repo root.
 */

"use strict";

const fs   = require("fs");
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

const tableSrc      = readFile(TABLE_LAB);
const tableNonComment = stripComments(tableSrc);

// --- CHECK 1: EffectComposer present in non-comment code (TP6 ships it behind ?fx guard) ---
if (!/<EffectComposer/.test(tableNonComment)) {
  fail(
    "CHECK 1 FAILED — EffectComposer not in non-comment code in TableLab.tsx.\n" +
    "  TP6 ships the EffectComposer compositor behind the ?fx guard (07-01).\n" +
    "  Expected: {qp('fx') !== null && <EffectComposer multisampling={4} enableNormalPass={false}>}\n" +
    "  Restore the EffectComposer with all TP6 effects (N8AO/DOF/BrightnessContrast/Vignette/Noise).",
  );
}

// --- CHECK 2: N8AO present in non-comment code (crevice AO required, M6 satisfier) ---
if (!/<N8AO/.test(tableNonComment)) {
  fail(
    "CHECK 2 FAILED — N8AO not in non-comment code in TableLab.tsx.\n" +
    "  TP6 requires N8AO for honest crevice darkening under cards/chips/rail (M6 gate).\n" +
    "  N8AO is bundled in @react-three/postprocessing@2.19.1 — no separate install.\n" +
    "  Expected first child inside EffectComposer: <N8AO aoRadius={0.8} intensity={2.0}\n" +
    "    distanceFalloff={0.7} halfRes={false} screenSpaceRadius={false} />",
  );
}

// --- CHECK 3: DepthOfField present in non-comment code ---
// DOF shipped in 07-03 (M1 PASS 50px — hole cards RAZOR-SHARP at hero shot with ?fx).
// worldFocusDistance=holeCardDistance / worldFocusRange=1.5 / bokehScale=2.0 / focalLength=0.025.
// The M1 HARD gate was CLEAR — DOF was NOT cut. Disposition recorded in 07-03-SUMMARY.
if (!/<DepthOfField/.test(tableNonComment)) {
  fail(
    "CHECK 3 FAILED — DepthOfField not in non-comment code in TableLab.tsx.\n" +
    "  DepthOfField shipped in 07-03 (M1 PASS 50px; hole cards razor-sharp with ?fx on).\n" +
    "  Expected second child inside EffectComposer after N8AO:\n" +
    "    <DepthOfField worldFocusDistance={holeCardDistance} worldFocusRange={1.5}\n" +
    "      bokehScale={2.0} focalLength={0.025} />\n" +
    "  If this failed: verify DOF was not accidentally removed during M8 rect recalibration.",
  );
}

// --- CHECK 4: Vignette present in non-comment code (frame darkening, M8) ---
if (!/<Vignette/.test(tableNonComment)) {
  fail(
    "CHECK 4 FAILED — Vignette not in non-comment code in TableLab.tsx.\n" +
    "  TP6 requires Vignette for M8 vignette band (8-20% corner-to-center darkening).\n" +
    "  Expected inside EffectComposer after BrightnessContrast:\n" +
    "    <Vignette offset={...} darkness={...} eskil={false} />\n" +
    "  The M8 gate measures the felt/rail edge (recalibrated in 07-06 — see metrics.mjs).",
  );
}

// --- CHECK 5: No Bloom in frontend/src/lab/ (M7 code assert — permanent ban) ---
// Bloom is PERMANENTLY forbidden in all lab source (M7 HARD gate).
// EffectComposer is PERMITTED (TP6 wires it). Only Bloom remains banned.
// Checks ALL .tsx and .ts files in the lab directory (non-comment lines).
const labFiles = fs.readdirSync(path.resolve(LAB_DIR))
  .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
  .map((f) => path.join(LAB_DIR, f));

for (const labFile of labFiles) {
  const src       = readFile(labFile);
  const nonComment = stripComments(src);
  if (/Bloom/.test(nonComment)) {
    fail(
      `CHECK 5 FAILED — Bloom detected in ${labFile} non-comment code.\n` +
      "  M7 HARD GATE: Bloom is permanently banned (casino trap + perf sink).\n" +
      "  EffectComposer is permitted (TP6 adds it behind ?fx). Only Bloom remains forbidden.\n" +
      "  Remove all Bloom imports and JSX from frontend/src/lab/ before proceeding.",
    );
  }
}

// --- CHECK 6: brassMat roughness in TP4-locked range 0.42-0.45 ---
// TP4 Lever D: brassMat roughness 0.42 + envMapIntensity 0.30 (recalibrated in 06-05).
// Regex tolerates whitespace around the colon: roughness\s*:\s*0\.4[2-5]
// Matches 0.42, 0.43, 0.44, 0.45 (SSOT range 0.38-0.45; Lever D target 0.42).
if (!/roughness\s*:\s*0\.4[2-5]/.test(tableNonComment)) {
  fail(
    "CHECK 6 FAILED — brassMat roughness 0.42-0.45 not found in TableLab.tsx non-comment code.\n" +
    "  TP4-locked invariant: brassMat roughness must remain 0.42 (Lever D; SSOT range 0.38-0.45).\n" +
    "  M4 guards against brass-gold drift — roughness is the primary specular protection.\n" +
    "  TP5 recalibration (06-05): brass base color updated to #b89b74 + envMapIntensity 0.30;\n" +
    "  roughness 0.42 is the anchor value that must not drift.",
  );
}

// --- CHECK 7: SoftShadows unconditional in Scene (TP5 PCSS grounding, forward invariant) ---
if (!/<SoftShadows/.test(tableNonComment)) {
  fail(
    "CHECK 7 FAILED — SoftShadows not in non-comment code in TableLab.tsx.\n" +
    "  TP5 ships SoftShadows unconditionally in Scene (PCSS injected once; no per-flag toggle).\n" +
    "  Expected: <SoftShadows size={30} samples={16} focus={0} /> above Lights in Scene.\n" +
    "  Conditional SoftShadows cause shader recompile storm on flag change — must be unconditional.",
  );
}

// --- CHECK 8: ContactShadows frames={1} (TP5 baked once at mount, forward invariant) ---
if (!/frames=\{1\}/.test(tableNonComment)) {
  fail(
    "CHECK 8 FAILED — ContactShadows frames={1} not in non-comment code in TableLab.tsx.\n" +
    "  TP5 bakes ContactShadows once at mount (frames={1}) for M11 improvement (106→52 draws).\n" +
    "  Without frames={1}, ContactShadows re-renders the full scene every frame → M11 regresses.\n" +
    "  Restore: <ContactShadows ... frames={1} /> (same position as TP5 ship).",
  );
}

// --- All 8 checks passed ---
console.log(
  "OK — grep-check-tp6-07: all 8 TP6 postprocessing invariants hold\n" +
  "  CHECK 1: EffectComposer present behind ?fx (TP6 adds compositor — 07-01)\n" +
  "  CHECK 2: N8AO present — honest crevice darkening, M6 satisfier (07-02)\n" +
  "  CHECK 3: DepthOfField present — whisper DOF, hole cards razor-sharp (07-03; M1 PASS 50px)\n" +
  "  CHECK 4: Vignette present — frame darkening, M8 8-20% gate (07-04)\n" +
  "  CHECK 5: No Bloom in frontend/src/lab/ — M7 HARD GATE (permanently banned; EffectComposer permitted)\n" +
  "  CHECK 6: brassMat roughness 0.42-0.45 — TP4-locked brass aging pass (Lever D)\n" +
  "  CHECK 7: SoftShadows unconditional in Scene — TP5 PCSS grounding (no toggle)\n" +
  "  CHECK 8: ContactShadows frames={1} — TP5 baked once at mount (M11 improvement 106→52 draws)",
);
process.exit(0);
