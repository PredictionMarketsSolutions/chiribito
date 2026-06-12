/**
 * grep-check-tp7-08.cjs — TP7 camera invariant checker (plan 08-01).
 *
 * Enforces the 11 TP7 camera + forward-carried invariants in:
 *   frontend/src/lab/TableLab.tsx  (main target — all checks except CHECK 5)
 *   frontend/src/lab/             (all .tsx/.ts — CHECK 5 no-bloom scope)
 *
 * Background (SSOT §TP7 — Cámaras: lock the canonical money shots):
 *   TP7 CONFIRMS the three TP0-frozen money-shot presets (card fov:40 / hero fov:32 /
 *   macro fov:26) against the finished TP1-TP6 table. The phase asks one question:
 *   "do the TP0 presets still hold as money shots?" The expected answer is YES; the
 *   default is KEEP. Checks 1-8 forward-carry all TP6 postprocessing invariants.
 *   Checks 9-11 are the new TP7 camera invariants.
 *
 * Checks (all mandatory):
 *
 *  FORWARD-CARRIED FROM grep-check-tp6-07.cjs (CHECKS 1-8):
 *
 *  (1) EFFECTCOMPOSER PRESENT — TableLab.tsx contains <EffectComposer in non-comment code.
 *  (2) N8AO PRESENT — TableLab.tsx contains <N8AO in non-comment code.
 *  (3) DEPTHOFSHIELD PRESENT — TableLab.tsx contains <DepthOfField in non-comment code.
 *  (4) VIGNETTE PRESENT — TableLab.tsx contains <Vignette in non-comment code.
 *  (5) NO BLOOM IN LAB SOURCE — M7 code assert (permanent; never relaxed).
 *  (6) BRASSMAT ROUGHNESS IN TP4-LOCKED RANGE (0.42-0.45) — Lever D brass aging pass.
 *  (7) SOFTSHADOWS UNCONDITIONAL — TableLab.tsx contains <SoftShadows in non-comment code.
 *  (8) CONTACTSHADOWS FRAMES={1} — frames={1} present in TableLab.tsx non-comment code.
 *
 *  NEW TP7 CAMERA INVARIANTS (CHECKS 9-11):
 *
 *  (9)  AUTOROTATE={FALSE} HARDCODED — M9 determinism HARD GATE.
 *       autoRotate={false} must be present as a literal. The harness param spin=off is NOT
 *       the same as OrbitControls autoRotate — enabling autoRotate breaks M9 determinism
 *       even with spin=off in the URL.
 *
 *  (10) TP0-FROZEN PRESET FOVS PRESENT — fov: 32 (hero), fov: 40 (card/POV), fov: 26 (macro).
 *       All three frozen values from the TP0 operator gate must be present in non-comment code.
 *       If a fov changes, this check fails, forcing a recorded justification.
 *
 *  (11) NO SECOND PERSPECTIVECAMERA WITH MAKEDEFAULT — flythrough anti-pattern guard.
 *       A second makeDefault PerspectiveCamera would override the preset camera and break
 *       the frozen money shots. Only ONE PerspectiveCamera may carry makeDefault.
 *       OrbitControls makeDefault is expected and not counted here.
 *
 * Usage (from repo root):
 *   node tools/table-3d/grep-check-tp7-08.cjs
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

const tableSrc        = readFile(TABLE_LAB);
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
  const src        = readFile(labFile);
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

// --- CHECK 9: autoRotate={false} hardcoded (M9 determinism HARD GATE) ---
// autoRotate={false} must be present as a LITERAL in non-comment code.
// The harness appends spin=off to the URL — this is NOT the same as OrbitControls autoRotate.
// If autoRotate were re-enabled (e.g. autoRotate={qp("spin") !== "off"}), the harness
// spin=off param would NOT freeze OrbitControls autoRotation → captures become non-deterministic.
// M9 HARD GATE: this check must NEVER be removed or weakened.
if (!/autoRotate=\{false\}/.test(tableNonComment)) {
  fail(
    "CHECK 9 FAILED — autoRotate={false} not present in non-comment code in TableLab.tsx.\n" +
    "  M9 determinism HARD GATE: autoRotate must be hardcoded false. Do NOT change to\n" +
    "  autoRotate={qp('spin') !== 'off'} or any truthy expression — the harness param 'spin=off'\n" +
    "  is NOT the OrbitControls autoRotate prop. Keep autoRotate={false} unconditional.",
  );
}

// --- CHECK 10: all three TP0-frozen preset fovs present (32=hero, 40=card/POV, 26=macro) ---
// The operator locked these three fov values at the TP0 gate (fov 37 was discarded).
// All three must be present in the cam useMemo presets (non-comment code).
// If any fov is changed, this check fails — forcing a recorded gate justification before
// the TP7 operator gate approves any correction.
if (
  !/fov:\s*32/.test(tableNonComment) ||
  !/fov:\s*40/.test(tableNonComment) ||
  !/fov:\s*26/.test(tableNonComment)
) {
  fail(
    "CHECK 10 FAILED — one or more TP0-frozen preset fovs missing from TableLab.tsx.\n" +
    "  Required: fov: 32 (hero), fov: 40 (card/POV), fov: 26 (macro).\n" +
    "  If a fov value was changed during TP7 for a justified preset correction, update\n" +
    "  this check with the recorded correction value + gate reference.",
  );
}

// --- CHECK 11: no second PerspectiveCamera with makeDefault (flythrough anti-pattern) ---
// A second PerspectiveCamera with makeDefault would override the preset camera and break
// the frozen money shots. The expected pattern is exactly ONE PerspectiveCamera with makeDefault.
// OrbitControls also carries makeDefault (expected, not counted here).
// Any optional ?fly flythrough must animate the existing camera via useFrame, NOT add a
// second PerspectiveCamera with makeDefault.
const perspCamMatches = tableNonComment.match(/<PerspectiveCamera[^>]*makeDefault[^>]*>/g) || [];
const perspCamMakeDefaultCount = perspCamMatches.length;
if (perspCamMakeDefaultCount > 1) {
  fail(
    "CHECK 11 FAILED — more than one PerspectiveCamera with makeDefault found in non-comment code.\n" +
    "  A second PerspectiveCamera with makeDefault overrides the preset camera and breaks\n" +
    "  the frozen money shots. The optional ?fly flythrough must animate the existing camera\n" +
    "  reference via useFrame, NOT add a second makeDefault camera.\n" +
    `  Found: ${perspCamMakeDefaultCount} PerspectiveCamera elements with makeDefault (expected: 1).`,
  );
}

// --- All 11 checks passed ---
console.log(
  "OK — grep-check-tp7-08: all 11 TP7 camera invariants hold\n" +
  "  CHECK 1: EffectComposer present behind ?fx (TP6)\n" +
  "  CHECK 2: N8AO present — crevice darkening, M6 satisfier (TP6)\n" +
  "  CHECK 3: DepthOfField present (or cut — M1 HARD gate; disposition in 07-03-SUMMARY) (TP6)\n" +
  "  CHECK 4: Vignette present — frame darkening, M8 gate (TP6)\n" +
  "  CHECK 5: No Bloom in frontend/src/lab/ — M7 HARD GATE (permanently banned) (TP5)\n" +
  "  CHECK 6: brassMat roughness 0.42-0.45 — TP4-locked brass aging pass\n" +
  "  CHECK 7: SoftShadows unconditional in Scene — TP5 PCSS grounding\n" +
  "  CHECK 8: ContactShadows frames={1} — TP5 baked once at mount\n" +
  "  CHECK 9: autoRotate={false} hardcoded — M9 determinism HARD GATE (TP7)\n" +
  "  CHECK 10: fov: 32 / fov: 40 / fov: 26 all present — TP0-frozen money-shot presets (TP7)\n" +
  "  CHECK 11: no second makeDefault PerspectiveCamera — flythrough uses useFrame only (TP7)",
);
process.exit(0);
