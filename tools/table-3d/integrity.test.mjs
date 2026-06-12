/**
 * integrity.test.mjs — unit tests for the INTEGRITY metric kit (TP0b · plan 01-04).
 * Run with: node --test tools/table-3d/integrity.test.mjs  (from the repo ROOT).
 *
 * Covers the three behaviors the plan specifies, using sharp-SYNTHESIZED frames and
 * tmp source fixtures (no GPU capture, no dev server needed):
 *
 *   Test 1 (M9):  two identical PNGs → md5 equal → PASS;  a 1-byte-altered copy →
 *                 md5 differs → FAIL.
 *   Test 2 (M7):  a clean source dir → grep returns 0 matches → assert PASS;  a
 *                 fixture file containing `EffectComposer` → match → assert FAIL.
 *   Test 3 (M12): MSE of an image against itself is 0 → zero-visual-change PASS;
 *                 MSE against a visibly different crop is ≫ 0 → change detected → FAIL.
 *
 * Plus seam coverage: M1 always requiresOperatorConfirm; M2 ratio ≥ 2.0× verdict;
 * M7 histogram halo PASS/FAIL; polygonArea shoelace.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, copyFileSync, readFileSync, writeSync, openSync, closeSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

import { md5, m9 } from "./m9-determinism.mjs";
import { grepBloom, assertNoBloom, m7Histogram, haloFraction } from "./m7-bloom-assert.mjs";
import {
  m12RegionalMSE,
  m1Legibility,
  m2CardsVsChips,
  polygonArea,
  THRESHOLDS,
} from "./m1-m2-m12.mjs";

const TMP = mkdtempSync(join(tmpdir(), "t3d-integrity-"));
process.on("exit", () => {
  try {
    rmSync(TMP, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
});

/** Write a solid-color PNG of {r,g,b} at w×h and return its path. */
async function solidPng(name, r, g, b, w = 600, h = 400) {
  const p = join(TMP, name);
  await sharp({ create: { width: w, height: h, channels: 3, background: { r, g, b } } })
    .png()
    .toFile(p);
  return p;
}

/* ============================= Test 1: M9 ============================= */
test("M9: two byte-identical PNGs PASS (md5 equal); a 1-byte-altered copy FAILS", async () => {
  // Two identical files: copy bytes → md5 must match → PASS.
  const a = await solidPng("m9-a.png", 20, 120, 80);
  const b = join(TMP, "m9-b.png");
  copyFileSync(a, b);
  const good = m9(a, b);
  assert.equal(good.pass, true, `expected identical PASS, md5 ${good.value.md5A} vs ${good.value.md5B}`);
  assert.equal(good.value.md5A, good.value.md5B);

  // A 1-byte-altered copy: flip the final byte → md5 must differ → FAIL.
  const bad = join(TMP, "m9-bad.png");
  copyFileSync(a, bad);
  const buf = readFileSync(bad);
  buf[buf.length - 1] = buf[buf.length - 1] ^ 0xff; // alter exactly one byte
  const fd = openSync(bad, "w");
  writeSync(fd, buf, 0, buf.length, 0);
  closeSync(fd);
  const badV = m9(a, bad);
  assert.equal(badV.pass, false, "expected 1-byte-altered FAIL");
  assert.notEqual(badV.value.md5A, badV.value.md5B);

  // md5() itself is a stable hex digest.
  assert.match(md5(a), /^[0-9a-f]{32}$/);
});

/* ============================= Test 2: M7 ============================= */
test("M7 code-assert: clean source dir PASSES (0 matches); EffectComposer fixture FAILS", async () => {
  // GOOD fixture: a clean .tsx with no forbidden token.
  const goodDir = join(TMP, "m7-src-good");
  mkdirSync(goodDir, { recursive: true });
  writeFileSync(
    join(goodDir, "Clean.tsx"),
    "export function Clean(){ return null; } // a harmless component, no glow\n",
  );
  const good = assertNoBloom(goodDir);
  assert.equal(good.pass, true, `expected clean PASS, got ${good.value.matchCount} matches`);
  assert.equal(good.value.matchCount, 0);

  // BAD fixture: a snippet that mounts EffectComposer + Bloom → must be caught.
  const badDir = join(TMP, "m7-src-bad");
  mkdirSync(badDir, { recursive: true });
  writeFileSync(
    join(badDir, "Glow.tsx"),
    [
      'import { EffectComposer, Bloom } from "@react-three/postprocessing";',
      "export function Glow(){ return (<EffectComposer><Bloom intensity={2}/></EffectComposer>); }",
    ].join("\n"),
  );
  const bad = assertNoBloom(badDir);
  assert.equal(bad.pass, false, "expected EffectComposer fixture FAIL");
  assert.ok(bad.value.matchCount > 0, "grep must catch the real mount");
  // grepBloom surfaces file+line so a reviewer sees WHERE.
  const hits = grepBloom(badDir);
  assert.ok(hits.some((h) => /EffectComposer|Bloom|postprocessing/.test(h.text)));
});

test("M7 histogram: a normal mid-luma frame PASSES; a near-white (bloom-halo) frame FAILS", async () => {
  // GOOD: mid grey frame → ~0% very-bright → PASS.
  const good = await solidPng("m7-halo-good.png", 90, 90, 90, 1200, 800);
  const goodV = await m7Histogram(good);
  assert.equal(goodV.pass, true, `expected normal-frame PASS, got ${goodV.value.veryBrightPct}%`);

  // BAD: near-white frame (luma > 245 everywhere) → 100% very-bright → a large halo → FAIL.
  const bad = await solidPng("m7-halo-bad.png", 252, 252, 252, 1200, 800);
  const badV = await m7Histogram(bad);
  assert.equal(badV.pass, false, `expected halo FAIL, got ${badV.value.veryBrightPct}%`);
  assert.ok((await haloFraction(bad)) > 0.5, "near-white frame is mostly very-bright");
});

/* ============================= Test 3: M12 ============================= */
test("M12: MSE of an image against itself is 0 (zero-visual-change PASS); a different crop is ≫0 (FAIL)", async () => {
  const frame = await solidPng("m12-frame.png", 31, 145, 99, 800, 600);
  const rect = { left: 100, top: 100, width: 300, height: 200 };

  // self-compare → MSE exactly 0 → PASS (zero visual change).
  const same = await m12RegionalMSE(frame, frame, rect, "self");
  assert.equal(same.value, 0, `self-MSE must be 0, got ${same.value}`);
  assert.equal(same.pass, true, "self-compare must PASS (zero-visual-change)");

  // a visibly different frame (different solid color) → MSE ≫ floor → FAIL (change detected).
  const other = await solidPng("m12-other.png", 200, 40, 40, 800, 600);
  const diff = await m12RegionalMSE(frame, other, rect, "different");
  assert.equal(diff.pass, false, `expected change FAIL, MSE=${diff.value}`);
  assert.ok(diff.value > THRESHOLDS.M12_MSE_CHURN_MAX, `different crop MSE must exceed floor, got ${diff.value}`);
  assert.ok(diff.value > 1000, `a saturated color swap should be a large MSE, got ${diff.value}`);
});

/* ===================== Seam coverage: M1 / M2 ===================== */
test("M1 legibility: ≥22px is a px-CANDIDATE but ALWAYS requires operator confirm (no auto OCR gate)", () => {
  const legible = m1Legibility(28);
  assert.equal(legible.pass, true, "28px ≥ 22px → px-candidate true");
  assert.equal(legible.requiresOperatorConfirm, true, "M1 must ALWAYS require operator confirm");

  const tooSmall = m1Legibility(14);
  assert.equal(tooSmall.pass, false, "14px < 22px → px-candidate false");
  assert.equal(tooSmall.requiresOperatorConfirm, true);

  const unmeasured = m1Legibility();
  assert.equal(unmeasured.value.glyphPxHeight, null, "no measurement → null (deferred to operator)");
  assert.equal(unmeasured.pass, false);
});

test("M2 cards-vs-chips: ratio ≥ 2.0× PASSES; chips-dominant FAILS; polygon fallback computes area", () => {
  // cards 3× chips → PASS.
  const dominant = m2CardsVsChips({ cardsArea: 30000, chipsArea: 10000 });
  assert.equal(dominant.pass, true, `expected ≥2× PASS, ratio=${dominant.value.ratio}`);
  assert.equal(dominant.value.ratio, 3);

  // chips dominate (cards 0.5× chips) → FAIL.
  const chipsWin = m2CardsVsChips({ cardsArea: 5000, chipsArea: 10000 });
  assert.equal(chipsWin.pass, false, "chips-dominant must FAIL the protagonist read");

  // manual-polygon fallback: a 200×100 card rect vs a 50×50 chip rect → ratio 8× → PASS.
  const cardPoly = [[0, 0], [200, 0], [200, 100], [0, 100]];
  const chipPoly = [[0, 0], [50, 0], [50, 50], [0, 50]];
  assert.equal(polygonArea(cardPoly), 20000);
  assert.equal(polygonArea(chipPoly), 2500);
  const viaPolys = m2CardsVsChips({ cardPolys: [cardPoly], chipPolys: [chipPoly] });
  assert.equal(viaPolys.pass, true);
  assert.equal(viaPolys.value.ratio, 8);
  assert.match(viaPolys.detail.method, /manual-polygon/);
});
