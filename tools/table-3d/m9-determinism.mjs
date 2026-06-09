/**
 * m9-determinism.mjs — M9 byte-identity determinism gate (TP0b · SSOT §4.5 / §5.6).
 *
 * M9 (SSOT §4.5): two consecutive captures of the SAME url under `&spin=off` +
 * reduced-motion MUST be byte-identical → `md5(captureA) === md5(captureB)`.
 * This is the determinism anchor: every later apples-to-apples comparison
 * (M12 regional MSE, the per-phase diffs) is only valid if the capture pipeline
 * is deterministic. A non-deterministic capture invalidates the whole program.
 *
 * Two modes:
 *
 *   1) CAPTURE+CHECK (default): capture `?cam=<shot>` TWICE via the harness
 *      (`.dev-stack/lab-shot.mjs`, which auto-appends `&spin=off`) to two scratch
 *      PNGs and assert md5 equality. There is NO `useFrame` animation in the lab at
 *      TP0 (verified) and `&spin=off` freezes autoRotate → the two frames must match.
 *        node tools/table-3d/m9-determinism.mjs --shot hero --port 5181
 *      Exits 0 iff the two captures are byte-identical.
 *
 *   2) META-GATE (--meta-gate <controlsDir>): the red-team admission gate. Runs M9 on
 *      its POSITIVE control (two byte-identical files → md5 equal → PASS) and its
 *      NEGATIVE control (a 1-byte-altered copy → md5 differ → FAIL). ADMITTED iff
 *      good=PASS AND bad=FAIL. Exits 0 iff the admission is consistent.
 *        node tools/table-3d/m9-determinism.mjs --meta-gate docs/table-3d/anchors/controls
 *
 * Pure, testable core: `md5(path)` and `m9(aPath, bPath)` — used by integrity.test.mjs.
 *
 * Runs from the repo ROOT (where `playwright` resolves, for the capture path).
 */
import { createHash } from "node:crypto";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

/* ------------------------------------------------------------------ *
 *  PURE CORE — md5 byte-identity (SSOT §4.5 M9 definition)
 * ------------------------------------------------------------------ */

/** md5 hex digest of a file's raw bytes. */
export function md5(path) {
  return createHash("md5").update(readFileSync(path)).digest("hex");
}

/**
 * M9 pure verdict over two capture paths: PASS iff the two files are byte-identical
 * (md5 equal). Returns the §4.5 standard verdict shape.
 */
export function m9(aPath, bPath) {
  const a = md5(aPath);
  const b = md5(bPath);
  return {
    metric: "M9",
    pass: a === b,
    value: { md5A: a, md5B: b },
    threshold: "md5(captureA) === md5(captureB) (byte-identical)",
    detail: { equal: a === b },
  };
}

/* ------------------------------------------------------------------ *
 *  CAPTURE PATH — capture a shot TWICE via the harness, then md5-compare.
 *  The harness auto-appends `&spin=off`; the default (no `?stats`) capture path
 *  is what we hash (StatsProbe renders null — proven zero-visual-change in plan 02).
 * ------------------------------------------------------------------ */

const HARNESS = ".dev-stack/lab-shot.mjs";

/** Capture `?cam=<shot>` to `outPath` via the harness against `http://localhost:<port>`. */
function captureOnce(shot, port, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  const url = `http://localhost:${port}/table-lab.html?cam=${shot}`;
  const res = spawnSync(process.execPath, [HARNESS, outPath], {
    env: { ...process.env, LAB_URL: url },
    encoding: "utf8",
    timeout: 120000,
  });
  if (res.status !== 0) {
    throw new Error(
      `harness failed for ${url} (exit ${res.status}): ${res.stderr || res.stdout}`,
    );
  }
  // surface the harness ERRORS line so console errors during capture are visible
  const errLine = (res.stdout || "").split("\n").find((l) => l.startsWith("ERRORS"));
  return { url, errLine: errLine ? errLine.trim() : "ERRORS (not printed)" };
}

async function captureAndCheck({ shot, port, outDir }) {
  const aPath = join(outDir, `m9-${shot}-a.png`);
  const bPath = join(outDir, `m9-${shot}-b.png`);
  console.log(`M9 determinism — capturing ?cam=${shot} TWICE (port ${port}, &spin=off auto)...`);
  const a = captureOnce(shot, port, aPath);
  const b = captureOnce(shot, port, bPath);
  console.log(`  A: ${aPath}  [${a.errLine}]`);
  console.log(`  B: ${bPath}  [${b.errLine}]`);
  const verdict = m9(aPath, bPath);
  console.log(`\n  md5(A) = ${verdict.value.md5A}`);
  console.log(`  md5(B) = ${verdict.value.md5B}`);
  console.log(`\nM9: ${verdict.pass ? "PASS (byte-identical → deterministic)" : "FAIL (md5 differ → NON-deterministic)"}`);
  return verdict;
}

/* ------------------------------------------------------------------ *
 *  META-GATE — good = two identical files (PASS); bad = 1-byte-altered (FAIL).
 *  The control PNGs are created by make-integrity-controls.mjs (Task 2) under the
 *  controls dir as: m9-good-a.png / m9-good-b.png (identical) and m9-bad.png
 *  (a 1-byte-altered copy of m9-good-a.png).
 * ------------------------------------------------------------------ */

const M9_CONTROL = Object.freeze({
  goodA: "m9-good-a.png",
  goodB: "m9-good-b.png", // byte-identical to goodA
  bad: "m9-bad.png", // 1-byte-altered copy of goodA → md5 differs
});

function metaGate(controlsDir) {
  const goodA = join(controlsDir, M9_CONTROL.goodA);
  const goodB = join(controlsDir, M9_CONTROL.goodB);
  const bad = join(controlsDir, M9_CONTROL.bad);

  for (const p of [goodA, goodB, bad]) {
    if (!existsSync(p)) {
      console.error(`M9 meta-gate: missing control frame ${p}`);
      return { ok: false };
    }
  }

  // GOOD control: two byte-identical files → M9 must PASS.
  const good = m9(goodA, goodB);
  // BAD control: good-A vs the 1-byte-altered copy → M9 must FAIL.
  const badV = m9(goodA, bad);

  const admitted = good.pass === true && badV.pass === false;

  console.log("\nM9 META-GATE — determinism admission (red-team: PASS-on-good AND FAIL-on-bad)\n");
  console.log("control | result | md5 pair");
  console.log("--------|--------|---------------------------------------------------------------");
  console.log(`good    | ${good.pass ? "PASS" : "FAIL"}   | ${good.value.md5A} == ${good.value.md5B}`);
  console.log(`bad     | ${badV.pass ? "PASS" : "FAIL"}   | ${badV.value.md5A} != ${badV.value.md5B}`);
  console.log(`\nM9 verdict: ${admitted ? "ADMITTED" : "informational"} (good must PASS, bad must FAIL)`);

  return { ok: admitted, good, bad: badV };
}

/* ------------------------------------------------------------------ *
 *  CLI
 * ------------------------------------------------------------------ */
function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}

// Only run CLI side-effects when invoked directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("m9-determinism.mjs")) {
  const argv = process.argv.slice(2);
  if (argv[0] === "--meta-gate") {
    const dir = argv[1] || "docs/table-3d/anchors/controls";
    const { ok } = metaGate(dir);
    process.exit(ok ? 0 : 1);
  } else {
    const shot = arg("shot", "hero");
    const port = arg("port", "5181");
    const outDir = arg("out", ".dev-stack/diag/table-3d/tp0-integrity");
    const verdict = await captureAndCheck({ shot, port, outDir });
    process.exit(verdict.pass ? 0 : 1);
  }
}
