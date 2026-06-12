/**
 * Unit tests for the T1 pure-pixel metric math (TP0b) — run with: node --test
 * (from the repo ROOT, where `sharp` resolves).
 *
 * These tests use sharp-SYNTHESIZED swatches (no GPU capture needed). They prove each
 * metric's math + verdict logic: PASS-on-good AND FAIL-on-bad for M3/M4/M5/M8, plus the
 * region-sampling primitive. This is the unit-level half of the red-team meta-gate; the
 * real-frame control-frame half lives in run-metrics.mjs --meta-gate (Task 2).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import {
  m3FeltHue,
  m4BrassNotGold,
  m5HighlightClip,
  m8Vignette,
  m10DrawCall,
  regionBuffer,
  meanRgb,
  THRESHOLDS,
} from "./metrics.mjs";

const TMP = mkdtempSync(join(tmpdir(), "t3d-metrics-"));
process.on("exit", () => {
  try {
    rmSync(TMP, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
});

/** Write a solid-color PNG swatch of {r,g,b} at w×h and return its path. */
async function solidSwatch(name, r, g, b, w = 400, h = 400) {
  const p = join(TMP, name);
  await sharp({
    create: { width: w, height: h, channels: 3, background: { r, g, b } },
  })
    .png()
    .toFile(p);
  return p;
}

/**
 * A frame where the four corners are `cornerFactor`× the center luma.
 * Built as a center fill with 4 darker corner squares composited on top, sized to
 * the metric's corner rects (360×260) so the region samples land on the dark patches.
 */
async function vignetteFrame(name, centerRgb, cornerFactor) {
  const p = join(TMP, name);
  const W = 2880,
    H = 1800;
  const cw = 360,
    ch = 260;
  const cc = {
    r: Math.round(centerRgb.r * cornerFactor),
    g: Math.round(centerRgb.g * cornerFactor),
    b: Math.round(centerRgb.b * cornerFactor),
  };
  const corner = await sharp({
    create: { width: cw, height: ch, channels: 3, background: cc },
  })
    .png()
    .toBuffer();
  await sharp({
    create: { width: W, height: H, channels: 3, background: centerRgb },
  })
    .composite([
      { input: corner, left: 0, top: 0 },
      { input: corner, left: W - cw, top: 0 },
      { input: corner, left: 0, top: H - ch },
      { input: corner, left: W - cw, top: H - ch },
    ])
    .png()
    .toFile(p);
  return p;
}

// Full-frame rect helper so synth swatches (smaller than 2880×1800) sample cleanly.
const fullRect = (w, h) => ({ left: 0, top: 0, width: w, height: h });

/* ----------------------------- Test 1: M3 ----------------------------- */
test("M3 felt-hue: in-palette #147a51 swatch PASSES (ΔE≈0); magenta FAILS (ΔE≫12)", async () => {
  // good: the literal felt mid-stop → ΔE ~0
  const good = await solidSwatch("m3-good.png", 0x14, 0x7a, 0x51);
  const rGood = await m3FeltHue(good, fullRect(400, 400));
  assert.equal(rGood.pass, true, `expected PASS, got ΔE=${rGood.value}`);
  assert.ok(rGood.value < 2, `expected ΔE≈0 on the exact stop, got ${rGood.value}`);

  // bad: pure magenta → far out of the green palette
  const bad = await solidSwatch("m3-bad.png", 0xff, 0x00, 0xff);
  const rBad = await m3FeltHue(bad, fullRect(400, 400));
  assert.equal(rBad.pass, false, `expected FAIL on magenta, got ΔE=${rBad.value}`);
  assert.ok(rBad.value > THRESHOLDS.M3_DELTA_E_MAX, `magenta ΔE should exceed 12, got ${rBad.value}`);
});

/* ----------------------------- Test 2: M4 ----------------------------- */
test("M4 brass-not-gold: aged-brass swatch PASSES; high-sat high-val gold FAILS", async () => {
  // good aged brass: hue ~42°, S≈0.50, V≈0.72 → within ceiling.
  // V*255≈184; S=0.5 → min = V*(1-S)=92. R=184,G≈ (42° between R and G) ,B=92.
  // pick a concrete RGB known to land in-band: (184, 150, 92) → H≈42, S≈0.50, V≈0.72.
  const good = await solidSwatch("m4-good.png", 184, 150, 92);
  const rGood = await m4BrassNotGold(good, fullRect(400, 400));
  assert.equal(rGood.pass, true, `expected brass PASS, got ${JSON.stringify(rGood.value)}`);

  // bad gold: high sat + high val (e.g. 255,200,20) → S≈0.92, V=1.0 → fails S and V ceilings.
  const bad = await solidSwatch("m4-bad.png", 255, 200, 20);
  const rBad = await m4BrassNotGold(bad, fullRect(400, 400));
  assert.equal(rBad.pass, false, `expected gold FAIL, got ${JSON.stringify(rBad.value)}`);
});

/* ----------------------------- Test 3: M5 ----------------------------- */
test("M5 highlight-clip: mid-luma swatch PASSES; all-white swatch FAILS", async () => {
  // good: mid grey (luma ~128) → 0% clipped
  const good = await solidSwatch("m5-good.png", 128, 128, 128, 2880, 1800);
  const rGood = await m5HighlightClip(good, REGIONS_feltRect());
  assert.equal(rGood.pass, true, `expected PASS, got ${JSON.stringify(rGood.value)}`);

  // bad: pure white (luma 255) → 100% clipped, blows both caps
  const bad = await solidSwatch("m5-bad.png", 255, 255, 255, 2880, 1800);
  const rBad = await m5HighlightClip(bad, REGIONS_feltRect());
  assert.equal(rBad.pass, false, `expected white FAIL, got ${JSON.stringify(rBad.value)}`);
  assert.ok(rBad.value.feltClipPct > THRESHOLDS.M5_FELT_CLIP_PCT_MAX);
  assert.ok(rBad.value.frameClipPct > THRESHOLDS.M5_FRAME_CLIP_PCT_MAX);
});

/* ----------------------------- Test 4: M8 ----------------------------- */
test("M8 vignette: corners 12% darker PASS (in 8–20% band); flat frame FAILS (<8%)", async () => {
  const center = { r: 30, g: 120, b: 80 };
  // corners at 0.88× center → 12% below → inside the 8–20 band.
  const good = await vignetteFrame("m8-good.png", center, 0.88);
  const rGood = await m8Vignette(good);
  assert.equal(rGood.pass, true, `expected PASS, got ${rGood.value}% below`);
  assert.ok(rGood.value >= 8 && rGood.value <= 20, `expected in-band, got ${rGood.value}`);

  // flat: corners == center → 0% below → fails (no framing).
  const bad = await vignetteFrame("m8-bad.png", center, 1.0);
  const rBad = await m8Vignette(bad);
  assert.equal(rBad.pass, false, `expected flat-frame FAIL, got ${rBad.value}% below`);
  assert.ok(rBad.value < 8, `flat frame should be <8% below, got ${rBad.value}`);
});

/* -------------------- Test 5: region helper primitive -------------------- */
test("region helper: .extract() over a synthetic image returns the expected mean RGB", async () => {
  const p = await solidSwatch("region.png", 100, 150, 200, 500, 500);
  const buf = await regionBuffer(p, { left: 50, top: 50, width: 200, height: 200 });
  const mean = meanRgb(buf);
  assert.ok(Math.abs(mean.r - 100) < 1, `r ${mean.r}`);
  assert.ok(Math.abs(mean.g - 150) < 1, `g ${mean.g}`);
  assert.ok(Math.abs(mean.b - 200) < 1, `b ${mean.b}`);
});

/* -------------------- Bonus: M10 verdict logic (pure) -------------------- */
test("M10 draw-call: 120 PASSES default ceiling; 180 FAILS; 200 PASSES chips=full", async () => {
  assert.equal(m10DrawCall(120).pass, true);
  assert.equal(m10DrawCall(180).pass, false);
  assert.equal(m10DrawCall(200, { chipsFull: true }).pass, true);
  assert.equal(m10DrawCall(NaN).pass, false, "non-numeric calls must fail closed");
  assert.equal(m10DrawCall(undefined).pass, false, "missing calls must fail closed");
});

/** The M5 test uses a 2880×1800 felt rect inside the synthetic frame. */
function REGIONS_feltRect() {
  return { left: 360, top: 470, width: 320, height: 200 };
}
