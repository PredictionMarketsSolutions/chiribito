/**
 * m7-bloom-assert.mjs — M7 bloom-absence gate (TP0b · SSOT §4.5 / §5.4 anti-casino).
 *
 * Bloom / glow / postprocessing is a HARD-NO for this table (SSOT §5.4: "anti-casino —
 * no bloom, ever"). M7 asserts its absence two ways:
 *
 *   (A) CODE ASSERT (primary): recursively grep the lab source dir for
 *       /Bloom|EffectComposer|postprocessing/. ZERO matches → PASS. Any match →
 *       FAIL (a Bloom/EffectComposer mount or an `@react-three/postprocessing`
 *       import would be caught before it ships). postprocessing is NOT installed
 *       at TP0 (verified — package.json has none); TP6 is where any restrained
 *       depth work would be added, and it must be re-gated then.
 *
 *   (B) HISTOGRAM HALO CHECK (secondary, sharp): a frame with a real bloom mount
 *       grows a large connected bright halo → an oversized bright-pixel fraction in
 *       the luma histogram. The check flags a frame whose very-bright fraction
 *       exceeds a cap. This is the pixel-side confirmation of the code assert.
 *
 * Two modes:
 *
 *   1) ASSERT (default): run the code assert against the real lab dir + (optionally)
 *      the histogram check against a captured frame.
 *        node tools/table-3d/m7-bloom-assert.mjs --src frontend/src/lab --frame <png>
 *      Exits 0 iff NO postprocessing matches (and, if a frame is given, no halo).
 *
 *   2) META-GATE (--meta-gate <controlsDir>): the red-team admission gate. Runs the
 *      assert on a GOOD fixture dir (clean source → 0 matches → PASS) and a BAD fixture
 *      dir (a synthetic snippet containing `EffectComposer`/`Bloom` → match → FAIL); and
 *      the histogram check on a GOOD frame (normal → PASS) and a BAD frame (synthetic
 *      bright halo → FAIL). ADMITTED iff good=PASS AND bad=FAIL on BOTH sub-checks.
 *        node tools/table-3d/m7-bloom-assert.mjs --meta-gate docs/table-3d/anchors/controls
 *
 * Pure, testable core: `grepBloom(dir)` and `assertNoBloom(dir)` (no GPU needed) +
 * `haloFraction(png)` / `m7Histogram(png)` (sharp). Used by integrity.test.mjs.
 *
 * Runs from the repo ROOT (where `sharp` resolves).
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import sharp from "sharp";
import { luma8 } from "./metrics.mjs";

/* ------------------------------------------------------------------ *
 *  BAKED CONSTANTS
 * ------------------------------------------------------------------ */
export const M7 = Object.freeze({
  // The forbidden token — Bloom is permanently banned (M7 HARD GATE: casino trap + perf sink).
  // TP6 07-01 RELAXATION: EffectComposer and @react-three/postprocessing are now PERMITTED
  // (TP6 ships the postprocessing compositor behind ?fx). Only Bloom itself remains banned.
  // This mirrors the relaxation applied to grep-check-tp5-06.cjs CHECK 5 in plan 07-01.
  PATTERN: /Bloom/,
  // Source extensions to scan.
  EXTS: Object.freeze([".ts", ".tsx", ".js", ".jsx"]),
  // Histogram halo check: a "very bright" pixel is luma > this …
  HALO_LUMA_MIN: 245,
  // … and the frame fails the halo check if more than this fraction is that bright.
  // A clean TP0 frame (no bloom) sits far below this; a bloom halo blows past it.
  HALO_FRACTION_MAX: 0.04, // 4% of the frame very-bright = a large connected halo
});

/* ------------------------------------------------------------------ *
 *  (A) CODE ASSERT — recursive grep for the forbidden tokens.
 * ------------------------------------------------------------------ */

/** Recursively collect source files under `dir` (by extension). */
function collectSources(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out; // missing dir → no sources (caller decides if that's an error)
  }
  for (const name of entries) {
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".git") continue;
      out.push(...collectSources(p));
    } else if (M7.EXTS.includes(extname(name))) {
      out.push(p);
    }
  }
  return out;
}

/**
 * Grep `dir` (recursively) for /Bloom|EffectComposer|postprocessing/.
 * Returns the list of matches: [{ file, line, text }]. Empty = clean.
 */
export function grepBloom(dir) {
  const matches = [];
  for (const file of collectSources(dir)) {
    let src;
    try {
      src = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const lines = src.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (M7.PATTERN.test(lines[i])) {
        matches.push({ file, line: i + 1, text: lines[i].trim().slice(0, 120) });
      }
    }
  }
  return matches;
}

/**
 * M7 code-assert verdict: PASS iff ZERO /Bloom/ matches in `dir`.
 * TP6 relaxation (07-01): EffectComposer and @react-three/postprocessing now permitted.
 * Returns the §4.5 standard verdict shape.
 */
export function assertNoBloom(dir) {
  const matches = grepBloom(dir);
  return {
    metric: "M7/code",
    pass: matches.length === 0,
    value: { matchCount: matches.length },
    threshold: "0 matches of /Bloom/ in lab source (EffectComposer now permitted per TP6)",
    detail: { matches: matches.slice(0, 10) },
  };
}

/* ------------------------------------------------------------------ *
 *  (B) HISTOGRAM HALO CHECK — large connected bright halo (bloom signature).
 *  Pure fraction of very-bright pixels; a bloom mount blows the highlight bloom
 *  across the frame, pushing this fraction up. Cheap, sharp-based, deterministic.
 * ------------------------------------------------------------------ */

/** Fraction (0..1) of frame pixels with luma > cut. */
export async function haloFraction(pngPath, cut = M7.HALO_LUMA_MIN) {
  const { data, info } = await sharp(pngPath).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const count = info.width * info.height;
  let n = 0;
  for (let i = 0; i < data.length; i += ch) {
    if (luma8(data[i], data[i + 1], data[i + 2]) > cut) n++;
  }
  return n / count;
}

/**
 * M7 histogram-halo verdict: PASS iff the very-bright fraction is below the cap
 * (no large connected bright halo). Returns the §4.5 standard verdict shape.
 */
export async function m7Histogram(pngPath) {
  const frac = await haloFraction(pngPath, M7.HALO_LUMA_MIN);
  const pct = frac * 100;
  return {
    metric: "M7/halo",
    pass: frac <= M7.HALO_FRACTION_MAX,
    value: { veryBrightPct: round(pct, 3) },
    threshold: `very-bright (luma>${M7.HALO_LUMA_MIN}) ≤ ${M7.HALO_FRACTION_MAX * 100}% of frame`,
    detail: { fraction: round(frac, 5) },
  };
}

function round(n, d = 3) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

/* ------------------------------------------------------------------ *
 *  META-GATE — good (clean src + normal frame) PASS; bad (EffectComposer fixture
 *  + bright-halo frame) FAIL. ADMITTED iff both sub-checks pass-on-good / fail-on-bad.
 *  Control layout under the controls dir:
 *    m7-src-good/  (a clean .tsx with no forbidden token)
 *    m7-src-bad/   (a .tsx fixture containing `EffectComposer`/`Bloom`)
 *    m7-halo-good.png  (normal frame)
 *    m7-halo-bad.png   (synthetic bright-halo frame)
 * ------------------------------------------------------------------ */
const M7_CONTROL = Object.freeze({
  srcGood: "m7-src-good",
  srcBad: "m7-src-bad",
  haloGood: "m7-halo-good.png",
  haloBad: "m7-halo-bad.png",
});

async function metaGate(controlsDir) {
  const srcGood = join(controlsDir, M7_CONTROL.srcGood);
  const srcBad = join(controlsDir, M7_CONTROL.srcBad);
  const haloGood = join(controlsDir, M7_CONTROL.haloGood);
  const haloBad = join(controlsDir, M7_CONTROL.haloBad);

  for (const p of [srcGood, srcBad, haloGood, haloBad]) {
    if (!existsSync(p)) {
      console.error(`M7 meta-gate: missing control ${p}`);
      return { ok: false };
    }
  }

  // CODE-ASSERT sub-gate
  const codeGood = assertNoBloom(srcGood); // clean → PASS
  const codeBad = assertNoBloom(srcBad); // has EffectComposer → FAIL
  // HISTOGRAM sub-gate
  const haloGoodV = await m7Histogram(haloGood); // normal → PASS
  const haloBadV = await m7Histogram(haloBad); // bright halo → FAIL

  const codeAdmitted = codeGood.pass === true && codeBad.pass === false;
  const haloAdmitted = haloGoodV.pass === true && haloBadV.pass === false;
  const admitted = codeAdmitted && haloAdmitted;

  console.log("\nM7 META-GATE — bloom-absence admission (red-team: PASS-on-good AND FAIL-on-bad)\n");
  console.log("sub-check  | good | bad  | detail");
  console.log("-----------|------|------|--------------------------------------------------");
  console.log(
    `code-assert| ${codeGood.pass ? "PASS" : "FAIL"} | ${codeBad.pass ? "PASS" : "FAIL"} | good=${codeGood.value.matchCount} match · bad=${codeBad.value.matchCount} match`,
  );
  console.log(
    `histogram  | ${haloGoodV.pass ? "PASS" : "FAIL"} | ${haloBadV.pass ? "PASS" : "FAIL"} | good=${haloGoodV.value.veryBrightPct}% · bad=${haloBadV.value.veryBrightPct}% bright`,
  );
  console.log(`\nM7 verdict: ${admitted ? "ADMITTED" : "informational"} (both sub-checks: good PASS, bad FAIL)`);

  return { ok: admitted, codeGood, codeBad, haloGoodV, haloBadV };
}

/* ------------------------------------------------------------------ *
 *  CLI
 * ------------------------------------------------------------------ */
function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("m7-bloom-assert.mjs")) {
  const argv = process.argv.slice(2);
  if (argv[0] === "--meta-gate") {
    const dir = argv[1] || "docs/table-3d/anchors/controls";
    const { ok } = await metaGate(dir);
    process.exit(ok ? 0 : 1);
  } else {
    const src = arg("src", "frontend/src/lab");
    const frame = arg("frame", null);
    const code = assertNoBloom(src);
    console.log(`M7 code-assert on ${src}: ${code.pass ? "PASS" : "FAIL"} (${code.value.matchCount} match)`);
    if (!code.pass) {
      for (const m of code.detail.matches) console.log(`  ${m.file}:${m.line}  ${m.text}`);
    }
    let halo = { pass: true };
    if (frame) {
      halo = await m7Histogram(frame);
      console.log(`M7 histogram on ${frame}: ${halo.pass ? "PASS" : "FAIL"} (${halo.value.veryBrightPct}% very-bright)`);
    }
    process.exit(code.pass && halo.pass ? 0 : 1);
  }
}
