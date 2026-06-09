/**
 * m1-m2-m12.mjs — the identity-anchor + protagonist-read metrics (TP0b · SSOT §4.5).
 *
 *   M12  REGIONAL MSE (sharp)  — the zero-visual-change / regression anchor. Mean
 *        squared error over a fixed region between two frames. M12 ~= 0 on a
 *        must-not-change region proves a phase changed ZERO pixels there; a high
 *        M12 flags an (intended or unintended) change. Scoped to FOV-INVARIANT
 *        regions at TP0 (HERO fov 32 / MACRO fov 26 are UNCHANGED; the POV `?cam=card`
 *        fov is still provisional 40-vs-37, locked by the operator in plan 05) → the
 *        POV-dependent M12 region is DEFERRED to plan 06 (rect finalized there).
 *
 *   M1   LEGIBILITY (px-height + operator-confirm seam) — the rank-glyph bbox height
 *        in px on a 1080p downscale of the POV frame. PASS-candidate iff ≥ 22px AND
 *        `requiresOperatorConfirm` (NO automated OCR hard gate — SSOT downgrades M1 to
 *        px-height + manual confirm). The operator confirm is plan 05.
 *
 *   M2   CARDS-vs-CHIPS area (region-segmentation, manual-polygon fallback) — cards'
 *        projected screen area ≥ 2.0× chips'. Pure-pixel segmentation is unreliable
 *        (color overlap), so the SSOT sanctions a manual-polygon fallback: traced
 *        card/chip polygons → area ratio. PASS iff ratio ≥ 2.0×.
 *
 * BAKED §4.5 THRESHOLDS: M1 ≥ 22px · M2 ≥ 2.0× · M12 churn floor (documented below).
 * INSTRUMENT-INTEGRITY CONTRACT: every metric returns { pass, value, threshold, detail }.
 * M12 is admitted via the red-team meta-gate (self-compare MSE≈0 PASS / different-crop
 * MSE-high FAIL). M1/M2 carry an operator/manual seam and are recorded informational at
 * TP0 (the hard read is the operator, plan 05) — never forced to auto-pass.
 *
 * Runs from the repo ROOT (where `sharp` resolves). Reuses the shared region primitives
 * from metrics.mjs (plan 01-03) — does not duplicate them.
 */
import sharp from "sharp";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { regionBuffer, REGIONS, FRAME } from "./metrics.mjs";

/* ------------------------------------------------------------------ *
 *  BAKED §4.5 THRESHOLDS
 * ------------------------------------------------------------------ */
export const THRESHOLDS = Object.freeze({
  // M1 — rank-glyph bbox height on a 1080p POV downscale.
  M1_PX_HEIGHT_MIN: 22,
  // M1 downscale target height (the SSOT's "1080p downscale of POV").
  M1_DOWNSCALE_H: 1080,
  // M2 — cards' projected area must be at least this multiple of chips'.
  M2_AREA_RATIO_MIN: 2.0,
  // M12 — regional MSE churn floor. Below this, two frames are "the same" for the
  //   region (zero visual change). Rationale: the harness is byte-deterministic at TP0
  //   (M9 proves md5-equal), so a TRUE no-change region yields MSE EXACTLY 0. The floor
  //   is set small but non-zero (1.0 in mean-squared 8-bit units, i.e. ~1 grey level RMS)
  //   to absorb any future re-encode/downscale rounding without admitting a real change
  //   (a visible tint/move is hundreds-to-thousands of MSE — see the meta-gate bad control).
  M12_MSE_CHURN_MAX: 1.0,
});

/* ------------------------------------------------------------------ *
 *  M12 — REGIONAL MSE  (the zero-visual-change anchor)
 *
 *  FOV-INVARIANT must-not-change regions for the TP0 zero-change proof. HERO/MACRO
 *  fovs are FINAL (32/26) so these rects are stable now. Authored against the real
 *  HERO/MACRO baselines captured this session. The POV-dependent region is PROVISIONAL
 *  (POV fov 40-vs-37 not yet operator-locked) → DEFERRED to plan 06.
 * ------------------------------------------------------------------ */
export const M12_REGIONS = Object.freeze({
  // HERO (fov 32, FINAL): open felt identity patch — reuse the calibrated feltHero rect.
  heroFelt: REGIONS.feltHero,
  // HERO (fov 32, FINAL): aged-brass identity reveal — reuse the calibrated brassHero rect.
  heroBrass: REGIONS.brassHero,
  // MACRO (fov 26, FINAL): a central felt/cards identity patch on the MACRO frame.
  //   MACRO frames the lower-left table; a centered patch lands on lit felt + card edge.
  macroIdentity: { left: FRAME.width / 2 - 300, top: FRAME.height / 2 - 200, width: 600, height: 400 },

  // PROVISIONAL POV identity region (fov 40, NOT operator-locked) — DEFERRED to plan 06.
  // Listed so plan 06 can finalize it against the blessed POV frame; NOT asserted at TP0.
  povLegibilityProvisional: REGIONS.feltPovProvisional,
});

/** The FOV-invariant region keys that ARE asserted for the TP0 zero-change proof. */
export const M12_FOV_INVARIANT_KEYS = Object.freeze(["heroFelt", "heroBrass"]);
/** Regions DEFERRED to plan 06 (POV fov not yet locked). */
export const M12_DEFERRED_KEYS = Object.freeze(["povLegibilityProvisional"]);

/**
 * Regional MSE between two frames over `rect`: mean over channels & pixels of
 * (a-b)^2. 0 = byte-identical region; grows with any visual change. The core of the
 * zero-visual-change anchor. Both frames must share dimensions for the rect to align.
 */
export async function m12RegionalMSE(frameA, frameB, rect, label = "region") {
  const a = await regionBuffer(frameA, rect);
  const b = await regionBuffer(frameB, rect);
  // Align on the smaller channel count (RGB vs RGBA tolerance) and pixel count.
  const ch = Math.min(a.channels, b.channels);
  const usableChannels = Math.min(ch, 3); // ignore alpha for the visual MSE
  const n = Math.min(a.count, b.count);
  let sum = 0;
  for (let p = 0; p < n; p++) {
    const ia = p * a.channels;
    const ib = p * b.channels;
    for (let c = 0; c < usableChannels; c++) {
      const d = a.data[ia + c] - b.data[ib + c];
      sum += d * d;
    }
  }
  const mse = sum / (n * usableChannels);
  return {
    metric: "M12",
    pass: mse <= THRESHOLDS.M12_MSE_CHURN_MAX,
    value: round(mse, 4),
    threshold: `regional MSE ≤ ${THRESHOLDS.M12_MSE_CHURN_MAX} (zero-visual-change)`,
    detail: { label, rect, mse: round(mse, 6) },
  };
}

/**
 * Prove ZERO visual change for the FOV-INVARIANT must-not-change regions between a
 * current capture set and a baseline set. `current`/`baseline` are { hero, macro } PNG
 * path maps. Returns per-region verdicts + an overall pass (all regions MSE ≤ floor).
 * The POV-dependent region is NOT included (deferred to plan 06).
 */
export async function m12ZeroChangeProof(current, baseline) {
  const rows = [];
  // HERO felt + brass (fov 32, FINAL)
  if (current.hero && baseline.hero) {
    rows.push(await m12RegionalMSE(current.hero, baseline.hero, M12_REGIONS.heroFelt, "HERO felt (fov32)"));
    rows.push(await m12RegionalMSE(current.hero, baseline.hero, M12_REGIONS.heroBrass, "HERO brass (fov32)"));
  }
  // MACRO identity (fov 26, FINAL)
  if (current.macro && baseline.macro) {
    rows.push(await m12RegionalMSE(current.macro, baseline.macro, M12_REGIONS.macroIdentity, "MACRO identity (fov26)"));
  }
  const pass = rows.length > 0 && rows.every((r) => r.pass);
  return { pass, rows, deferred: M12_DEFERRED_KEYS.slice() };
}

/* ------------------------------------------------------------------ *
 *  M1 — LEGIBILITY (px-height + operator-confirm seam)
 *
 *  SSOT downgrades M1 to a fixed pixel-height check + a MANUAL operator confirm — there
 *  is NO automated OCR hard gate. The rank-glyph bbox is measured (manually/assisted) on
 *  the frozen frame; this function reports the measured px height vs the 22px floor and
 *  ALWAYS sets requiresOperatorConfirm:true (the px-height is necessary, NOT sufficient).
 *  The actual on-device legibility confirm is plan 05.
 * ------------------------------------------------------------------ */

/**
 * M1 verdict. `glyphPx` is the measured rank-glyph bbox height in px on the 1080p POV
 * downscale (authored manually against the frozen frame, or passed by an assisted tool).
 * When omitted, the metric reports `measured:null` and stays a deferred operator gate.
 */
export function m1Legibility(glyphPx = null, { downscaleH = THRESHOLDS.M1_DOWNSCALE_H } = {}) {
  const measured = typeof glyphPx === "number" ? glyphPx : null;
  const pxOk = measured !== null && measured >= THRESHOLDS.M1_PX_HEIGHT_MIN;
  return {
    metric: "M1",
    // pass is the px-CANDIDATE only; the gate is the operator confirm (seam below).
    pass: pxOk,
    requiresOperatorConfirm: true,
    value: { glyphPxHeight: measured, downscaleH },
    threshold: `rank-glyph bbox ≥ ${THRESHOLDS.M1_PX_HEIGHT_MIN}px on ${downscaleH}p POV downscale + operator confirm`,
    detail: {
      pxCandidate: pxOk,
      note: "px-height is necessary-not-sufficient; on-device operator legibility confirm is plan 05 (no automated OCR hard gate).",
    },
  };
}

/**
 * Helper: downscale a POV frame to the M1 reference height (1080p) and return the
 * scaled PNG buffer + the scale factor, so a manual/assisted bbox is measured in the
 * SAME coordinate space the threshold is defined in. (Measuring the bbox itself stays
 * manual per the SSOT.)
 */
export async function m1DownscalePov(povPng, downscaleH = THRESHOLDS.M1_DOWNSCALE_H) {
  const meta = await sharp(povPng).metadata();
  const scale = downscaleH / meta.height;
  const buf = await sharp(povPng).resize({ height: downscaleH }).png().toBuffer();
  return { buffer: buf, scale, srcHeight: meta.height, srcWidth: meta.width };
}

/* ------------------------------------------------------------------ *
 *  M2 — CARDS-vs-CHIPS area (region-segmentation, manual-polygon fallback)
 *
 *  Pure-pixel card/chip segmentation is unreliable (the painted court cards share
 *  warm tones with chips). The SSOT sanctions a MANUAL-POLYGON fallback: trace the
 *  card-region and chip-region polygons on the frozen frame, sum their areas, ratio.
 *  This function computes the ratio from supplied polygon areas (or rect areas) and
 *  verdicts it ≥ 2.0×. It is recorded informational at TP0 (the polygons are authored
 *  by the operator/plan 05) — never silently auto-admitted.
 * ------------------------------------------------------------------ */

/** Shoelace area of a polygon [[x,y],…] in px². */
export function polygonArea(points) {
  if (!Array.isArray(points) || points.length < 3) return 0;
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

/**
 * M2 verdict from card/chip areas (px²). Accepts either summed areas directly
 * ({ cardsArea, chipsArea }) or arrays of polygons ({ cardPolys, chipPolys }).
 * PASS iff cardsArea / chipsArea ≥ 2.0×.
 */
export function m2CardsVsChips({ cardsArea, chipsArea, cardPolys, chipPolys } = {}) {
  const cards =
    typeof cardsArea === "number"
      ? cardsArea
      : (cardPolys || []).reduce((s, p) => s + polygonArea(p), 0);
  const chips =
    typeof chipsArea === "number"
      ? chipsArea
      : (chipPolys || []).reduce((s, p) => s + polygonArea(p), 0);
  const ratio = chips > 0 ? cards / chips : (cards > 0 ? Infinity : NaN);
  return {
    metric: "M2",
    pass: Number.isFinite(ratio) && ratio >= THRESHOLDS.M2_AREA_RATIO_MIN,
    value: { ratio: Number.isFinite(ratio) ? round(ratio, 2) : ratio, cardsArea: round(cards, 0), chipsArea: round(chips, 0) },
    threshold: `cards area ≥ ${THRESHOLDS.M2_AREA_RATIO_MIN}× chips area`,
    detail: {
      method: cardPolys || chipPolys ? "manual-polygon fallback (SSOT-sanctioned)" : "supplied areas",
      note: "segmentation is the manual-polygon fallback; polygons authored at the operator gate (plan 05).",
    },
  };
}

/* ------------------------------------------------------------------ *
 *  small util
 * ------------------------------------------------------------------ */
function round(n, d = 2) {
  if (!Number.isFinite(n)) return n;
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

/* ------------------------------------------------------------------ *
 *  META-GATE — M12 only (M1/M2 carry operator/manual seams; not auto-gated).
 *  good = a frame vs ITSELF (MSE 0 → PASS); bad = a frame vs a TINTED region copy
 *  (MSE high → FAIL). Control layout under the controls dir:
 *    m12-good.png        (a frame)
 *    m12-bad-tinted.png  (the same frame with the HERO felt rect tinted)
 * ------------------------------------------------------------------ */
const M12_CONTROL = Object.freeze({
  good: "m12-good.png",
  badTinted: "m12-bad-tinted.png",
  rectKey: "heroFelt", // the rect that is unchanged (good) vs tinted (bad)
});

async function metaGate(controlsDir) {
  const good = join(controlsDir, M12_CONTROL.good);
  const bad = join(controlsDir, M12_CONTROL.badTinted);
  for (const p of [good, bad]) {
    if (!existsSync(p)) {
      console.error(`M12 meta-gate: missing control ${p}`);
      return { ok: false };
    }
  }
  const rect = M12_REGIONS[M12_CONTROL.rectKey];
  // GOOD: good vs itself over the rect → MSE 0 → PASS.
  const goodV = await m12RegionalMSE(good, good, rect, "self (zero change)");
  // BAD: good vs the tinted copy over the SAME rect → MSE high → FAIL.
  const badV = await m12RegionalMSE(good, bad, rect, "tinted region (change)");
  const admitted = goodV.pass === true && badV.pass === false;

  console.log("\nM12 META-GATE — regional-MSE admission (red-team: PASS-on-good AND FAIL-on-bad)\n");
  console.log("control | result | MSE");
  console.log("--------|--------|----------------");
  console.log(`good    | ${goodV.pass ? "PASS" : "FAIL"}   | ${goodV.value} (self-compare)`);
  console.log(`bad     | ${badV.pass ? "PASS" : "FAIL"}   | ${badV.value} (tinted region)`);
  console.log(`\nM12 verdict: ${admitted ? "ADMITTED" : "informational"} (good MSE≈0 PASS, bad MSE-high FAIL)`);
  console.log("NOTE: M12 admitted on FOV-INVARIANT frames; the POV-dependent M12 region is DEFERRED to plan 06 (POV fov locked in plan 05).");

  return { ok: admitted, good: goodV, bad: badV };
}

/* ------------------------------------------------------------------ *
 *  CLI
 * ------------------------------------------------------------------ */
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("m1-m2-m12.mjs")) {
  const argv = process.argv.slice(2);
  if (argv[0] === "--meta-gate") {
    const dir = argv[1] || "docs/table-3d/anchors/controls";
    const { ok } = await metaGate(dir);
    process.exit(ok ? 0 : 1);
  } else if (argv[0] === "--zero-change") {
    // node m1-m2-m12.mjs --zero-change <currentDir> <baselineDir>
    const curDir = argv[1];
    const baseDir = argv[2];
    if (!curDir || !baseDir) {
      console.error("usage: --zero-change <currentDir> <baselineDir> (each holds hero.png/macro.png)");
      process.exit(2);
    }
    const cur = { hero: join(curDir, "hero.png"), macro: join(curDir, "macro.png") };
    const base = { hero: join(baseDir, "hero.png"), macro: join(baseDir, "macro.png") };
    const proof = await m12ZeroChangeProof(cur, base);
    console.log("\nM12 ZERO-VISUAL-CHANGE PROOF — FOV-INVARIANT must-not-change regions\n");
    console.log("region                 | MSE     | verdict");
    console.log("-----------------------|---------|--------");
    for (const r of proof.rows) {
      console.log(`${pad(r.detail.label, 22)} | ${pad(String(r.value), 7)} | ${r.pass ? "ZERO-CHANGE" : "CHANGED"}`);
    }
    console.log(`\nOverall: ${proof.pass ? "ZERO VISUAL CHANGE (all fov-invariant regions MSE ≤ floor)" : "CHANGE DETECTED"}`);
    console.log(`DEFERRED to plan 06 (POV fov not yet locked): ${proof.deferred.join(", ")}`);
    process.exit(proof.pass ? 0 : 1);
  } else {
    console.log("m1-m2-m12.mjs — modes: --meta-gate <dir> | --zero-change <curDir> <baseDir>");
    console.log("Exports: m12RegionalMSE, m12ZeroChangeProof, m1Legibility, m2CardsVsChips, polygonArea");
  }
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}
