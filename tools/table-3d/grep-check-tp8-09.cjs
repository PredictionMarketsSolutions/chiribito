/**
 * grep-check-tp8-09.cjs — TP8 micro-motion invariant checker (plan 09-02).
 *
 * Enforces the 18 TP8 micro-motion + TP7 camera invariants in:
 *   frontend/src/lab/TableLab.tsx  (main target — all checks)
 *   frontend/src/lab/             (all .tsx/.ts — CHECK 5 no-FX scope, CHECK 12 no-Bloom scope)
 *
 * Background (SSOT §TP8 — Tactilidad, micro-vida & lectura social):
 *   TP8 adds sub-threshold breathing on the two hero objects (hole-card group + demoted accent
 *   pot) via a single HeroMotion useFrame component. Because the harness captures the scene
 *   FROZEN (motion zeroed under spin=off), the harness CANNOT verify that the micro-motion
 *   amplitude is sub-threshold during a live render. This static grep-check is the only
 *   orchestrator-verifiable bound on the amplitude constants. It also asserts the no-FX
 *   invariant (no bouncy/gimmicky easing) and the presence of the freeze guard, covering all
 *   three dimensions of the motion specification without requiring a live render.
 *
 *   CHECKS 1-7 are the NEW TP8 micro-motion invariants:
 *
 *  (1)  MICRO_AMPLITUDE_Y <= 0.01wu — TP8 Y-amplitude sub-threshold.
 *  (2)  MICRO_AMPLITUDE_ROT <= 0.00873 rad (0.5°) — TP8 rotation sub-threshold.
 *  (3)  MICRO_IDLE_PERIOD in [6, 12]s — TP8 idle period SSOT range.
 *  (4)  MICRO_SETTLE_TAU in [0.2, 0.4]s — TP8 settle time SSOT range.
 *  (5)  No Elastic/Bounce/Back/Flip/Glow in lab source — TP8 no-FX assertion.
 *  (6)  Freeze guard (motionFrozen / frozen) present in non-comment code — M9 determinism gate.
 *  (7)  reducedMotion / prefers-reduced-motion present — accessibility freeze.
 *
 *   CHECKS 8-18 are FORWARD-CARRIED from grep-check-tp7-08.cjs (the 11 TP7 camera invariants):
 *
 *  (8)  EFFECTCOMPOSER PRESENT — TableLab.tsx contains <EffectComposer in non-comment code.
 *  (9)  N8AO PRESENT — TableLab.tsx contains <N8AO in non-comment code.
 *  (10) DEPTHOFSHIELD PRESENT — TableLab.tsx contains <DepthOfField in non-comment code.
 *  (11) VIGNETTE PRESENT — TableLab.tsx contains <Vignette in non-comment code.
 *  (12) NO BLOOM IN LAB SOURCE — M7 code assert (permanent; never relaxed).
 *  (13) BRASSMAT ROUGHNESS IN TP4-LOCKED RANGE (0.42-0.45) — Lever D brass aging pass.
 *  (14) SOFTSHADOWS UNCONDITIONAL — TableLab.tsx contains <SoftShadows in non-comment code.
 *  (15) CONTACTSHADOWS FRAMES={1} — frames={1} present in TableLab.tsx non-comment code.
 *  (16) AUTOROTATE={FALSE} HARDCODED — M9 determinism HARD GATE.
 *  (17) TP0-FROZEN PRESET FOVS PRESENT — fov: 32 / fov: 40 / fov: 26 all present.
 *  (18) NO SECOND PERSPECTIVECAMERA WITH MAKEDEFAULT — flythrough anti-pattern guard.
 *
 * Usage (from repo root):
 *   node tools/table-3d/grep-check-tp8-09.cjs
 *
 * Exits 0 on all 18 checks passing (one-line OK); exits 1 on any failure.
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

const src = readFile(TABLE_LAB);
const nc  = stripComments(src);

// ─── CHECKS 1-7: NEW TP8 micro-motion invariants ─────────────────────────────────────────────

// --- CHECK 1: MICRO_AMPLITUDE_Y declared and value <= 0.01wu ---
// SSOT §TP8: amplitude in Y must remain below 0.01 world units at all times.
// The named constant is required so this check can extract and compare the bound statically.
const m1 = nc.match(/MICRO_AMPLITUDE_Y\s*=\s*([0-9.]+)/);
const v1 = m1 ? parseFloat(m1[1]) : NaN;
if (isNaN(v1) || v1 > 0.01) {
  fail(
    "CHECK 1 FAILED — MICRO_AMPLITUDE_Y not found or value > 0.01wu in TableLab.tsx.\n" +
    "  SSOT TP8 threshold: amplitude < 0.01 world units. Current value: " + v1 + "\n" +
    "  Named constant required so this check can verify the sub-threshold bound.\n" +
    "  Restrained stillness beats visible motion — err LESS, not more.",
  );
}

// --- CHECK 2: MICRO_AMPLITUDE_ROT declared and value <= 0.00873 rad (0.5°) ---
// SSOT §TP8: rotation amplitude must remain below 0.5° = 0.00873 radians at all times.
const m2 = nc.match(/MICRO_AMPLITUDE_ROT\s*=\s*([0-9.]+)/);
const v2 = m2 ? parseFloat(m2[1]) : NaN;
if (isNaN(v2) || v2 > 0.00873) {
  fail(
    "CHECK 2 FAILED — MICRO_AMPLITUDE_ROT not found or value > 0.00873 rad (0.5°).\n" +
    "  SSOT TP8 threshold: rotation amplitude < 0.5° = 0.00873 radians. Current: " + v2 + "\n" +
    "  Named constant required for static amplitude verification.",
  );
}

// --- CHECK 3: MICRO_IDLE_PERIOD declared and value in [6, 12]s ---
// SSOT §TP8: idle period must be in the range 6–12 seconds (near-zero feel).
const m3 = nc.match(/MICRO_IDLE_PERIOD\s*=\s*([0-9.]+)/);
const v3 = m3 ? parseFloat(m3[1]) : NaN;
if (isNaN(v3) || v3 < 6 || v3 > 12) {
  fail(
    "CHECK 3 FAILED — MICRO_IDLE_PERIOD not found or value outside [6, 12]s.\n" +
    "  SSOT TP8: idle period must be 6–12s near-zero. Current: " + v3,
  );
}

// --- CHECK 4: MICRO_SETTLE_TAU declared and value in [0.2, 0.4]s ---
// SSOT §TP8: settle tau must be in the range 0.2–0.4 seconds (exponential decay speed).
const m4 = nc.match(/MICRO_SETTLE_TAU\s*=\s*([0-9.]+)/);
const v4 = m4 ? parseFloat(m4[1]) : NaN;
if (isNaN(v4) || v4 < 0.2 || v4 > 0.4) {
  fail(
    "CHECK 4 FAILED — MICRO_SETTLE_TAU not found or value outside [0.2, 0.4]s.\n" +
    "  SSOT TP8: settle tau must be 0.2–0.4s. Current: " + v4,
  );
}

// --- CHECK 5: no bouncy/flip/spin/glow easing in lab source (no-FX assertion) ---
// SSOT §TP8 no-FX assertion: no Elastic / Bounce / Back / Flip / Glow easing in lab source.
// Use exponential decay only: v += (target - v) * (1 - Math.exp(-delta / tau)).
// Scans ALL .tsx and .ts files in the lab directory; strips comments before matching.
// Note: uses /\b(Elastic|Bounce|Back\.out|Back\.in|Flip|Glow)\b/i — not bare "Spin" (too broad:
// would match the legitimate qp("spin") parameter string in non-bounce context).
const labFiles = fs.readdirSync(path.resolve(LAB_DIR))
  .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
  .map((f) => path.join(LAB_DIR, f));

for (const labFile of labFiles) {
  const fileSrc        = readFile(labFile);
  const fileNonComment = stripComments(fileSrc);
  const fxMatch        = fileNonComment.match(/\b(Elastic|Bounce|Back\.out|Back\.in|Flip|Glow)\b/);
  if (fxMatch) {
    fail(
      "CHECK 5 FAILED — forbidden easing token found in " + labFile + ": " + fxMatch[0] + "\n" +
      "  SSOT TP8 no-FX assertion: no Elastic / Bounce / Back / Flip / Glow easing.\n" +
      "  Use exponential decay only: v += (target - v) * (1 - Math.exp(-delta / tau)).",
    );
  }
}

// --- CHECK 6: freeze guard present in TableLab.tsx (motionFrozen or frozen guards useFrame) ---
// M9 HARD GATE: the HeroMotion useFrame must begin with 'if (frozen) return' where
// frozen = isFrozen || reducedMotion. Without this guard, captures are non-deterministic.
const hasFreezeGuard = nc.includes("motionFrozen") || nc.includes("if (frozen)");
if (!hasFreezeGuard) {
  fail(
    "CHECK 6 FAILED — freeze guard (motionFrozen / frozen) not found in non-comment code.\n" +
    "  M9 HARD GATE: the HeroMotion useFrame must begin with 'if (frozen) return' where\n" +
    "  frozen = isFrozen || reducedMotion. Without this guard, captures are non-deterministic.",
  );
}

// --- CHECK 7: reducedMotion (prefers-reduced-motion compliance) present ---
// SSOT §TP8: micro-motion MUST freeze under prefers-reduced-motion as well as spin=off.
const hasReducedMotion = nc.includes("reducedMotion") || nc.includes("prefers-reduced-motion");
if (!hasReducedMotion) {
  fail(
    "CHECK 7 FAILED — reducedMotion / prefers-reduced-motion not found in non-comment code.\n" +
    "  SSOT TP8: micro-motion MUST freeze under prefers-reduced-motion as well as spin=off.\n" +
    "  Declare: const reducedMotion = typeof window !== 'undefined' &&\n" +
    "    window.matchMedia('(prefers-reduced-motion: reduce)').matches;",
  );
}

// ─── CHECKS 8-18: FORWARD-CARRIED FROM grep-check-tp7-08.cjs (verbatim) ─────────────────────

// --- CHECK 8: EffectComposer present in non-comment code (TP6 ships it behind ?fx guard) ---
if (!/<EffectComposer/.test(nc)) {
  fail(
    "CHECK 8 FAILED — EffectComposer not in non-comment code in TableLab.tsx.\n" +
    "  TP6 ships the EffectComposer compositor behind the ?fx guard (07-01).\n" +
    "  Expected: {qp('fx') !== null && <EffectComposer multisampling={4} enableNormalPass={false}>}\n" +
    "  Restore the EffectComposer with all TP6 effects (N8AO/DOF/BrightnessContrast/Vignette/Noise).",
  );
}

// --- CHECK 9: N8AO present in non-comment code (crevice AO required, M6 satisfier) ---
if (!/<N8AO/.test(nc)) {
  fail(
    "CHECK 9 FAILED — N8AO not in non-comment code in TableLab.tsx.\n" +
    "  TP6 requires N8AO for honest crevice darkening under cards/chips/rail (M6 gate).\n" +
    "  N8AO is bundled in @react-three/postprocessing@2.19.1 — no separate install.\n" +
    "  Expected first child inside EffectComposer: <N8AO aoRadius={0.8} intensity={2.0}\n" +
    "    distanceFalloff={0.7} halfRes={false} screenSpaceRadius={false} />",
  );
}

// --- CHECK 10: DepthOfField present in non-comment code ---
// DOF shipped in 07-03 (M1 PASS 50px — hole cards RAZOR-SHARP at hero shot with ?fx).
// worldFocusDistance=holeCardDistance / worldFocusRange=1.5 / bokehScale=2.0 / focalLength=0.025.
// The M1 HARD gate was CLEAR — DOF was NOT cut. Disposition recorded in 07-03-SUMMARY.
if (!/<DepthOfField/.test(nc)) {
  fail(
    "CHECK 10 FAILED — DepthOfField not in non-comment code in TableLab.tsx.\n" +
    "  DepthOfField shipped in 07-03 (M1 PASS 50px; hole cards razor-sharp with ?fx on).\n" +
    "  Expected second child inside EffectComposer after N8AO:\n" +
    "    <DepthOfField worldFocusDistance={holeCardDistance} worldFocusRange={1.5}\n" +
    "      bokehScale={2.0} focalLength={0.025} />\n" +
    "  If this failed: verify DOF was not accidentally removed during M8 rect recalibration.",
  );
}

// --- CHECK 11: Vignette present in non-comment code (frame darkening, M8) ---
if (!/<Vignette/.test(nc)) {
  fail(
    "CHECK 11 FAILED — Vignette not in non-comment code in TableLab.tsx.\n" +
    "  TP6 requires Vignette for M8 vignette band (8-20% corner-to-center darkening).\n" +
    "  Expected inside EffectComposer after BrightnessContrast:\n" +
    "    <Vignette offset={...} darkness={...} eskil={false} />\n" +
    "  The M8 gate measures the felt/rail edge (recalibrated in 07-06 — see metrics.mjs).",
  );
}

// --- CHECK 12: No Bloom in frontend/src/lab/ (M7 code assert — permanent ban) ---
// Bloom is PERMANENTLY forbidden in all lab source (M7 HARD gate).
// EffectComposer is PERMITTED (TP6 wires it). Only Bloom remains banned.
// Checks ALL .tsx and .ts files in the lab directory (non-comment lines).
for (const labFile of labFiles) {
  const fileSrc        = readFile(labFile);
  const fileNonComment = stripComments(fileSrc);
  if (/Bloom/.test(fileNonComment)) {
    fail(
      `CHECK 12 FAILED — Bloom detected in ${labFile} non-comment code.\n` +
      "  M7 HARD GATE: Bloom is permanently banned (casino trap + perf sink).\n" +
      "  EffectComposer is permitted (TP6 adds it behind ?fx). Only Bloom remains forbidden.\n" +
      "  Remove all Bloom imports and JSX from frontend/src/lab/ before proceeding.",
    );
  }
}

// --- CHECK 13: brassMat roughness in TP4-locked range 0.42-0.45 ---
// TP4 Lever D: brassMat roughness 0.42 + envMapIntensity 0.30 (recalibrated in 06-05).
// Regex tolerates whitespace around the colon: roughness\s*:\s*0\.4[2-5]
// Matches 0.42, 0.43, 0.44, 0.45 (SSOT range 0.38-0.45; Lever D target 0.42).
if (!/roughness\s*:\s*0\.4[2-5]/.test(nc)) {
  fail(
    "CHECK 13 FAILED — brassMat roughness 0.42-0.45 not found in TableLab.tsx non-comment code.\n" +
    "  TP4-locked invariant: brassMat roughness must remain 0.42 (Lever D; SSOT range 0.38-0.45).\n" +
    "  M4 guards against brass-gold drift — roughness is the primary specular protection.\n" +
    "  TP5 recalibration (06-05): brass base color updated to #b89b74 + envMapIntensity 0.30;\n" +
    "  roughness 0.42 is the anchor value that must not drift.",
  );
}

// --- CHECK 14: SoftShadows unconditional in Scene (TP5 PCSS grounding, forward invariant) ---
if (!/<SoftShadows/.test(nc)) {
  fail(
    "CHECK 14 FAILED — SoftShadows not in non-comment code in TableLab.tsx.\n" +
    "  TP5 ships SoftShadows unconditionally in Scene (PCSS injected once; no per-flag toggle).\n" +
    "  Expected: <SoftShadows size={30} samples={16} focus={0} /> above Lights in Scene.\n" +
    "  Conditional SoftShadows cause shader recompile storm on flag change — must be unconditional.",
  );
}

// --- CHECK 15: ContactShadows frames={1} (TP5 baked once at mount, forward invariant) ---
if (!/frames=\{1\}/.test(nc)) {
  fail(
    "CHECK 15 FAILED — ContactShadows frames={1} not in non-comment code in TableLab.tsx.\n" +
    "  TP5 bakes ContactShadows once at mount (frames={1}) for M11 improvement (106→52 draws).\n" +
    "  Without frames={1}, ContactShadows re-renders the full scene every frame → M11 regresses.\n" +
    "  Restore: <ContactShadows ... frames={1} /> (same position as TP5 ship).",
  );
}

// --- CHECK 16: autoRotate={false} hardcoded (M9 determinism HARD GATE) ---
// autoRotate={false} must be present as a LITERAL in non-comment code.
// The harness appends spin=off to the URL — this is NOT the same as OrbitControls autoRotate.
// If autoRotate were re-enabled (e.g. autoRotate={qp("spin") !== "off"}), the harness
// spin=off param would NOT freeze OrbitControls autoRotation → captures become non-deterministic.
// M9 HARD GATE: this check must NEVER be removed or weakened.
if (!/autoRotate=\{false\}/.test(nc)) {
  fail(
    "CHECK 16 FAILED — autoRotate={false} not present in non-comment code in TableLab.tsx.\n" +
    "  M9 determinism HARD GATE: autoRotate must be hardcoded false. Do NOT change to\n" +
    "  autoRotate={qp('spin') !== 'off'} or any truthy expression — the harness param 'spin=off'\n" +
    "  is NOT the OrbitControls autoRotate prop. Keep autoRotate={false} unconditional.",
  );
}

// --- CHECK 17: all three TP0-frozen preset fovs present (32=hero, 40=card/POV, 26=macro) ---
// The operator locked these three fov values at the TP0 gate (fov 37 was discarded).
// All three must be present in the cam useMemo presets (non-comment code).
// If any fov is changed, this check fails — forcing a recorded gate justification before
// the TP8 operator gate approves any correction.
if (
  !/fov:\s*32/.test(nc) ||
  !/fov:\s*40/.test(nc) ||
  !/fov:\s*26/.test(nc)
) {
  fail(
    "CHECK 17 FAILED — one or more TP0-frozen preset fovs missing from TableLab.tsx.\n" +
    "  Required: fov: 32 (hero), fov: 40 (card/POV), fov: 26 (macro).\n" +
    "  If a fov value was changed during TP8 for a justified preset correction, update\n" +
    "  this check with the recorded correction value + gate reference.",
  );
}

// --- CHECK 18: no second PerspectiveCamera with makeDefault (flythrough anti-pattern) ---
// A second PerspectiveCamera with makeDefault would override the preset camera and break
// the frozen money shots. The expected pattern is exactly ONE PerspectiveCamera with makeDefault.
// OrbitControls also carries makeDefault (expected, not counted here).
// Any optional ?fly flythrough must animate the existing camera via useFrame, NOT add a
// second PerspectiveCamera with makeDefault.
const perspCamMatches        = nc.match(/<PerspectiveCamera[^>]*makeDefault[^>]*>/g) || [];
const perspCamMakeDefaultCount = perspCamMatches.length;
if (perspCamMakeDefaultCount > 1) {
  fail(
    "CHECK 18 FAILED — more than one PerspectiveCamera with makeDefault found in non-comment code.\n" +
    "  A second PerspectiveCamera with makeDefault overrides the preset camera and breaks\n" +
    "  the frozen money shots. The optional ?fly flythrough must animate the existing camera\n" +
    "  reference via useFrame, NOT add a second makeDefault camera.\n" +
    `  Found: ${perspCamMakeDefaultCount} PerspectiveCamera elements with makeDefault (expected: 1).`,
  );
}

// --- All 18 checks passed ---
console.log(
  "OK — grep-check-tp8-09: all 18 TP8 micro-motion + TP7 camera invariants hold\n" +
  "  CHECK 1: MICRO_AMPLITUDE_Y <= 0.01wu — TP8 Y-amplitude sub-threshold\n" +
  "  CHECK 2: MICRO_AMPLITUDE_ROT <= 0.00873 rad (0.5°) — TP8 rotation sub-threshold\n" +
  "  CHECK 3: MICRO_IDLE_PERIOD in [6, 12]s — TP8 idle period SSOT range\n" +
  "  CHECK 4: MICRO_SETTLE_TAU in [0.2, 0.4]s — TP8 settle time SSOT range\n" +
  "  CHECK 5: No Elastic/Bounce/Back/Flip/Glow in lab source — TP8 no-FX assertion\n" +
  "  CHECK 6: Freeze guard (motionFrozen/frozen) present — M9 determinism gate\n" +
  "  CHECK 7: reducedMotion/prefers-reduced-motion present — accessibility freeze\n" +
  "  CHECK 8: EffectComposer present behind ?fx (TP6)\n" +
  "  CHECK 9: N8AO present — crevice darkening, M6 satisfier (TP6)\n" +
  "  CHECK 10: DepthOfField present (or cut — M1 HARD gate; disposition in 07-03-SUMMARY) (TP6)\n" +
  "  CHECK 11: Vignette present — frame darkening, M8 gate (TP6)\n" +
  "  CHECK 12: No Bloom in frontend/src/lab/ — M7 HARD GATE (permanently banned) (TP5)\n" +
  "  CHECK 13: brassMat roughness 0.42-0.45 — TP4-locked brass aging pass\n" +
  "  CHECK 14: SoftShadows unconditional in Scene — TP5 PCSS grounding\n" +
  "  CHECK 15: ContactShadows frames={1} — TP5 baked once at mount\n" +
  "  CHECK 16: autoRotate={false} hardcoded — M9 determinism HARD GATE (TP7)\n" +
  "  CHECK 17: fov: 32 / fov: 40 / fov: 26 all present — TP0-frozen money-shot presets (TP7)\n" +
  "  CHECK 18: no second makeDefault camera — flythrough uses useFrame only (TP7)",
);
process.exit(0);
