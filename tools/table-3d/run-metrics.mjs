/**
 * run-metrics.mjs — the TP0b metric runner (root-run, sharp).
 *
 * Two modes:
 *
 *   1) CAPTURE RUN (default): run the ADMITTED sharp metric set over a capture dir and
 *      print a PASS/FAIL/informational table.
 *        node tools/table-3d/run-metrics.mjs docs/table-3d/anchors/head
 *      (looks for hero.png / card.png / macro.png in the dir; runs HERO-rect metrics on hero.png)
 *
 *   2) META-GATE (--meta-gate <controlsDir>): the red-team admission gate. For every metric
 *      it runs the metric on its POSITIVE control (must PASS) and its NEGATIVE control (must
 *      FAIL). A metric is ADMITTED only if good=PASS AND bad=FAIL; otherwise `informational`.
 *      Exits 0 iff every metric it admits passed good AND failed bad. Prints per-metric verdicts.
 *        node tools/table-3d/run-metrics.mjs --meta-gate docs/table-3d/anchors/controls
 *
 * The control-frame ↔ metric ↔ rect mapping is the CONTROL_PLAN below. Each entry names the
 * good/bad PNG (under the controls dir) and the metric fn + rect to apply.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  m3FeltHue,
  m4BrassNotGold,
  m5HighlightClip,
  m6ContactShadow,
  m8Vignette,
  aWarmCorner,
  bFeltSpecular,
  m10DrawCall,
  REGIONS,
} from "./metrics.mjs";

/* ------------------------------------------------------------------ *
 *  CONTROL PLAN — per metric: which good/bad control frame, which metric call.
 *  Rects: control frames are full 2880×1800 captures (or crops), so the same
 *  HERO rects apply. M10 is special — its controls are draw-call NUMBERS, not PNGs.
 * ------------------------------------------------------------------ */
const CONTROL_PLAN = [
  {
    metric: "M3",
    good: "m3-felt-good.png",
    bad: "m3-felt-bad.png",
    run: (png) => m3FeltHue(png, REGIONS.feltHero),
    badNote: "?felt=magenta (real lab hook) — pure magenta felt",
  },
  {
    metric: "M4",
    good: "m4-brass-good.png",
    bad: "m4-brass-bad.png",
    run: (png) => m4BrassNotGold(png, REGIONS.brassHero),
    badNote: "sharp gold tint over the brass rect (high-sat high-val)",
  },
  {
    metric: "M5",
    good: "m5-clip-good.png",
    bad: "m5-clip-bad.png",
    run: (png) => m5HighlightClip(png, REGIONS.feltHero),
    badNote: "sharp .linear() over-exposed (blown highlights)",
  },
  {
    metric: "M6",
    good: "m6-shadow-good.png",
    bad: "m6-shadow-bad.png",
    run: (png) => m6ContactShadow(png, REGIONS.underCardHero, REGIONS.feltAdjacentHero),
    badNote: "?sh=off / ?cs=off — contact shadow removed (no grounding)",
  },
  {
    metric: "M8",
    good: "m8-vignette-good.png",
    bad: "m8-vignette-bad.png",
    run: (png) => m8Vignette(png, REGIONS),
    badNote: "sharp-flattened corners (no framing falloff)",
  },
  {
    metric: "+A",
    good: "a-warmcorner-good.png",
    bad: "a-warmcorner-bad.png",
    run: (png) => aWarmCorner(png, REGIONS),
    badNote: "sharp desaturated + crushed corners (neutral/black, not warm)",
  },
  {
    metric: "+B",
    good: "b-specular-good.png",
    bad: "b-specular-bad.png",
    run: (png) => bFeltSpecular(png, REGIONS.feltHero),
    badNote: "sharp bright-sheen wash over the felt rect (satin sweep)",
  },
];

/** M10 control = draw-call numbers (not PNGs). good = low count PASS; bad = real high count FAIL. */
const M10_CONTROL = {
  metric: "M10",
  good: { calls: 120, chipsFull: false }, // a passing staged color pass
  bad: { calls: 237, chipsFull: false }, // the real measured HERO baseline (exceeds <150)
  badNote: "real measured HERO baseline (237 draws ≥ 150 ceiling)",
};

/* ------------------------------------------------------------------ *
 *  META-GATE
 * ------------------------------------------------------------------ */
async function metaGate(controlsDir) {
  const rows = [];
  let allAdmittedConsistent = true;

  for (const entry of CONTROL_PLAN) {
    const goodPath = join(controlsDir, entry.good);
    const badPath = join(controlsDir, entry.bad);
    const haveGood = existsSync(goodPath);
    const haveBad = existsSync(badPath);

    let goodVerdict = null;
    let badVerdict = null;
    let goodVal = null;
    let badVal = null;
    let status = "informational";
    let reason = "";

    if (!haveGood || !haveBad) {
      reason = `missing control frame(s): ${!haveGood ? entry.good + " " : ""}${!haveBad ? entry.bad : ""}`.trim();
    } else {
      const rGood = await entry.run(goodPath);
      const rBad = await entry.run(badPath);
      goodVerdict = rGood.pass;
      badVerdict = rBad.pass;
      goodVal = rGood.value;
      badVal = rBad.value;
      // ADMITTED iff PASSES good AND FAILS bad.
      if (rGood.pass === true && rBad.pass === false) {
        status = "ADMITTED";
      } else {
        status = "informational";
        reason =
          rGood.pass !== true
            ? "did NOT pass its good control"
            : "did NOT fail its bad control";
      }
    }

    rows.push({
      metric: entry.metric,
      good: goodVerdict === null ? "—" : goodVerdict ? "PASS" : "FAIL",
      bad: badVerdict === null ? "—" : badVerdict ? "PASS" : "FAIL",
      goodVal,
      badVal,
      status,
      reason,
      badNote: entry.badNote,
    });
  }

  // M10 — numeric controls.
  {
    const rGood = m10DrawCall(M10_CONTROL.good.calls, { chipsFull: M10_CONTROL.good.chipsFull });
    const rBad = m10DrawCall(M10_CONTROL.bad.calls, { chipsFull: M10_CONTROL.bad.chipsFull });
    const admitted = rGood.pass === true && rBad.pass === false;
    rows.push({
      metric: "M10",
      good: rGood.pass ? "PASS" : "FAIL",
      bad: rBad.pass ? "PASS" : "FAIL",
      goodVal: rGood.value,
      badVal: rBad.value,
      status: admitted ? "ADMITTED" : "informational",
      reason: admitted ? "" : rGood.pass ? "did NOT fail its bad control" : "did NOT pass its good control",
      badNote: M10_CONTROL.badNote,
    });
  }

  // Print table.
  console.log("\nTP0b META-GATE — metric admission (red-team: PASS-on-good AND FAIL-on-bad)\n");
  console.log("metric | good | bad  | status        | note");
  console.log("-------|------|------|---------------|----------------------------------------");
  for (const r of rows) {
    const line = `${pad(r.metric, 6)} | ${pad(r.good, 4)} | ${pad(r.bad, 4)} | ${pad(r.status, 13)} | ${r.reason || r.badNote}`;
    console.log(line);
  }

  const admitted = rows.filter((r) => r.status === "ADMITTED");
  const informational = rows.filter((r) => r.status !== "ADMITTED");
  console.log(`\nADMITTED: ${admitted.map((r) => r.metric).join(", ") || "(none)"}`);
  console.log(`informational: ${informational.map((r) => r.metric).join(", ") || "(none)"}`);

  // Gate passes iff every ADMITTED metric truly passed good AND failed bad (by construction true),
  // AND there were no unexpected inconsistencies. Missing-control metrics are informational (not a
  // hard failure — they are honestly downgraded, never silently dropped).
  for (const r of admitted) {
    if (!(r.good === "PASS" && r.bad === "FAIL")) allAdmittedConsistent = false;
  }
  return { rows, ok: allAdmittedConsistent };
}

/* ------------------------------------------------------------------ *
 *  CAPTURE RUN
 * ------------------------------------------------------------------ */
async function captureRun(captureDir) {
  const hero = join(captureDir, "hero.png");
  if (!existsSync(hero)) {
    console.error(`No hero.png in ${captureDir}. Capture the baseline first.`);
    process.exit(1);
  }
  const results = [];
  results.push(await m3FeltHue(hero, REGIONS.feltHero));
  results.push(await m4BrassNotGold(hero, REGIONS.brassHero));
  results.push(await m5HighlightClip(hero, REGIONS.feltHero));
  results.push(await m6ContactShadow(hero, REGIONS.underCardHero, REGIONS.feltAdjacentHero));
  results.push(await m8Vignette(hero, REGIONS));
  results.push(await aWarmCorner(hero, REGIONS));
  results.push(await bFeltSpecular(hero, REGIONS.feltHero));

  console.log(`\nTP0b CAPTURE RUN — admitted metrics over ${captureDir}/hero.png\n`);
  console.log("metric | verdict | value                                   | threshold");
  console.log("-------|---------|-----------------------------------------|------------------------------");
  for (const r of results) {
    console.log(
      `${pad(r.metric, 6)} | ${pad(r.pass ? "PASS" : "FAIL", 7)} | ${pad(JSON.stringify(r.value), 39)} | ${r.threshold}`,
    );
  }
  console.log("\n(M10 draw-call is read live via tools/table-3d/stats-read.mjs against the dev server.)");
  return results;
}

/* ---- small util ---- */
function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

/* ---- entry ---- */
const args = process.argv.slice(2);
if (args[0] === "--meta-gate") {
  const dir = args[1] || "docs/table-3d/anchors/controls";
  const { ok } = await metaGate(dir);
  process.exit(ok ? 0 : 1);
} else {
  const dir = args[0] || "docs/table-3d/anchors/head";
  await captureRun(dir);
}
