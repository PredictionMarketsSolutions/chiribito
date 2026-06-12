/**
 * M10 draw-call reader (TP0b) — accurate per-frame draw-call count from the headless lab.
 *
 * WHY this exists (TP0b deviation, recorded in 01-03-SUMMARY):
 *   The plan-contract interface for M10 is `window.__labStats.calls`, written by the
 *   StatsProbe (plan 01-02). Empirically that value reads a stale `1` under headless
 *   Chromium: StatsProbe reads `gl.info.render.calls` at the START of its useFrame —
 *   BEFORE R3F renders the scene that frame — and headless rAF throttling means the
 *   continuous render loop barely ticks. Rather than mutate the frozen StatsProbe and
 *   risk its zero-visual-change (M9) contract, this reader counts GPU draw calls
 *   DIRECTLY by wrapping the WebGL context's drawElements/drawArrays for one real frame.
 *   This is non-invasive (no scene/render-behavior change), deterministic, and matches
 *   the canonical `renderer.info.render.calls` definition (one count per draw command).
 *
 * Usage:
 *   node tools/table-3d/stats-read.mjs <baseUrl> <cam> [extraQuery]
 *   node tools/table-3d/stats-read.mjs http://localhost:5180 hero
 *   node tools/table-3d/stats-read.mjs http://localhost:5180 hero "&chips=full"
 * Prints JSON: { cam, calls } where `calls` is the steady full-scene draw-call count.
 *
 * Importable: `readDrawCalls(baseUrl, cam, extra)` → number.
 */
import { chromium } from "playwright";

const HEADLESS_ARGS = [
  "--headless=new",
  "--ignore-gpu-blocklist",
  "--enable-gpu",
  "--use-angle=d3d11",
  // keep rAF alive in headless so the render loop actually ticks (else throttled to ~0)
  "--disable-background-timer-throttling",
  "--disable-renderer-backgrounding",
  "--disable-backgrounding-occluded-windows",
];

/**
 * Launch the lab headless, wrap the GL draw calls, and return the steady per-frame count.
 * Samples several frames and returns the MAX non-zero (the genuine full-scene + shadow pass).
 */
export async function readDrawCalls(baseUrl, cam, extra = "") {
  const browser = await chromium.launch({ headless: true, args: HEADLESS_ARGS });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const url = `${baseUrl}/table-lab.html?cam=${cam}&spin=off&stats${extra}`;
    await page.goto(url, { waitUntil: "load", timeout: 30000 });
    await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    await page.waitForFunction(
      () => {
        const c = document.querySelector("canvas");
        return c && c.width > 600;
      },
      { timeout: 20000 },
    );
    await page.waitForTimeout(2000); // env + shadows settle

    const result = await page.evaluate(async () => {
      const cv = document.querySelector("canvas");
      const gl = cv.getContext("webgl2") || cv.getContext("webgl");
      if (!gl) return { ok: false, why: "no webgl context" };
      let n = 0;
      const wrap = (name) => {
        const orig = gl[name] && gl[name].bind(gl);
        if (orig)
          gl[name] = function () {
            n++;
            return orig.apply(gl, arguments);
          };
      };
      ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"].forEach(wrap);
      // Sample many rAF ticks; record the per-frame counts; full renders show up as the peaks.
      const counts = [];
      for (let f = 0; f < 90; f++) {
        n = 0;
        await new Promise((r) => requestAnimationFrame(r));
        counts.push(n);
      }
      const nonZero = counts.filter((c) => c > 0);
      const max = nonZero.length ? Math.max(...nonZero) : 0;
      // the steady color+shadow pass = the modal high value; use max as the conservative gate read
      return { ok: true, calls: max, framesRendered: nonZero.length, distinct: [...new Set(counts)].sort((a, b) => a - b) };
    });
    return result;
  } finally {
    await browser.close();
  }
}

// CLI
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("stats-read.mjs")) {
  const [, , baseUrl = "http://localhost:5180", cam = "hero", extra = ""] = process.argv;
  readDrawCalls(baseUrl, cam, extra)
    .then((r) => {
      console.log(JSON.stringify({ cam, extra, ...r }));
      process.exit(r.ok ? 0 : 1);
    })
    .catch((e) => {
      console.error("stats-read error:", e.message);
      process.exit(1);
    });
}
