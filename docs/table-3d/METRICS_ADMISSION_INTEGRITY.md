# TP0b — INTEGRITY Metric Admission Ledger (red-team meta-gate)

**Authored:** 2026-06-09 (plan 01-04)
**Instruments:** `tools/table-3d/{m9-determinism,m7-bloom-assert,m1-m2-m12}.mjs` (sharp + crypto),
run from the repo ROOT. Reuse the shared sharp region primitives from `metrics.mjs` (plan 01-03).
**Companion ledger:** the T1 **colour** metrics (M3/M4/M5/M6/+B/M10/M8/+A) are admitted in
`METRICS_ADMISSION.md` (plan 01-03). This file is the **INTEGRITY** half: M9, M7, M12 (+ the
M1/M2 protagonist-read seam).
**Baseline frame:** HERO `?cam=hero` (fov 32) + MACRO `?cam=macro` (fov 26), captured via
`.dev-stack/lab-shot.mjs` (2880×1800, RTX 4060 D3D11) from THIS worktree's dev server (port 5181).
The POV (`?cam=card`) fov is NOT yet operator-locked (40 in code, 37 candidate) — any
POV-dependent rect is **PROVISIONAL** and is finalized in plan 01-06 after the operator gate.

---

## The rule (SSOT §4.5 meta-gate · §8 DoD #13)

> A metric is admitted to the gate-set **ONLY** after it produces the expected result on a
> known-good **AND** a known-bad control frame. Until validated it is **informational**.

A metric is **ADMITTED** iff it `PASSES` its positive (known-good) control **AND** `FAILS`
its negative (known-bad) control. Otherwise it is recorded **informational** — never silently
dropped, never forced to pass. NO md5 / MSE / px-height / verdict in this ledger is fabricated;
every number below was produced by running the named instrument this session.

**Meta-gate runners** (each exits 0 iff its metric passed good AND failed bad):
```
node tools/table-3d/m9-determinism.mjs  --meta-gate docs/table-3d/anchors/controls
node tools/table-3d/m7-bloom-assert.mjs --meta-gate docs/table-3d/anchors/controls
node tools/table-3d/m1-m2-m12.mjs       --meta-gate <full-res controls dir>     # M12
```

**Control frames** are committed DOWNSCALED (640w, palette-quantized) under
`docs/table-3d/anchors/controls/` (built by `tools/table-3d/make-integrity-controls.mjs`).
The single shared positive frame is the real HERO baseline; each metric's negative control is
its `*-bad` artifact. The M12 numeric proof runs on the FULL-RES working copies in
`.dev-stack/diag/table-3d/tp0-integrity-controls/full/` (the felt rect is a 2880×1800 coordinate
that cannot be sampled on a 640w downscale); the committed M12 PNGs are a durable visual record.
M9 byte-identity + M7 (code-assert + halo) self-validate on the committed corpus too — the
committed `m9-bad.png` is a post-encode 1-byte-altered copy of the committed `m9-good-a.png`
(so its md5 genuinely differs), and the committed source fixtures `m7-src-good/`,`m7-src-bad/`
+ halo frames are read directly.

---

## Admission table

| Metric | §4.5 threshold (baked) | Good control | Good result | Bad control | Bad result | Verdict |
|--------|------------------------|--------------|-------------|-------------|------------|---------|
| **M9** determinism | `md5(A) === md5(B)` (byte-identical, `&spin=off`) | two byte-identical HERO copies | md5 **equal** (`fa8bb180…` == `fa8bb180…`) → PASS | a 1-byte-altered copy | md5 **differ** (`fa8bb180…` ≠ `8d0d6e2b…`) → FAIL | **ADMITTED** |
| **M7** bloom-absence (code) | 0 matches of `/Bloom\|EffectComposer\|postprocessing/` in lab src | clean `.tsx` fixture | **0** matches → PASS | `EffectComposer`+`Bloom` fixture | **4** matches → FAIL | **ADMITTED** |
| **M7** bloom-absence (halo) | very-bright (luma>245) ≤ 4% of frame | normal HERO frame | **0%** bright → PASS | synthetic bright halo (60% block) | **36%** bright → FAIL | **ADMITTED** |
| **M12** regional-MSE | regional MSE ≤ 1.0 (zero-visual-change) | HERO frame vs **itself** | MSE **0** → PASS | HERO frame vs felt-rect-tinted copy | MSE **34886.03** → FAIL | **ADMITTED** (fov-invariant) |
| **M1** legibility | rank-glyph bbox ≥ 22px on 1080p POV + operator confirm | — (px-candidate only) | px ≥22 is necessary-not-sufficient | — | — | **informational + operator-confirm** (plan 05) |
| **M2** cards-vs-chips | cards area ≥ 2.0× chips area | — (manual polygons) | verdict logic proven in unit test | — | — | **informational (manual polygon fallback)** (plan 05) |

**ADMITTED (3 integrity gates):** M9 · M7 (code + halo) · M12 (fov-invariant scope)
**informational / operator-seam (2):** M1 (operator confirm) · M2 (manual polygon)

All three integrity meta-gate runners exit **0** (good PASS, bad FAIL). Unit suite
`node --test tools/table-3d/integrity.test.mjs` → **6/6 pass**.

---

## M7 — bloom is provably NOT mounted (anti-casino, SSOT §5.4)

The code-assert run against the **real** lab tree:

```
$ node tools/table-3d/m7-bloom-assert.mjs --src frontend/src/lab
M7 code-assert on frontend/src/lab: PASS (0 match)

$ grep -rIl "Bloom\|EffectComposer\|postprocessing" frontend/src/lab ; echo "exit $?"
exit 1            # exit 1 = ZERO matches = M7 PASS
```

`postprocessing` / `@react-three/postprocessing` is **not installed** at TP0 (`frontend/package.json`
has no such dep) and `TableLab.tsx` imports none. Bloom is a hard-NO; if any future plan mounts an
`EffectComposer`/`Bloom` (the SSOT permits only a **restrained** depth/AO pass at TP6, never a
casino glow), this code-assert catches it before it ships and TP6 must re-gate it.

---

## M9 — determinism is real (apples-to-apples anchor, SSOT §5.6)

Two consecutive harness captures of `?cam=hero` (`&spin=off` auto-applied; no `useFrame` animation
exists in the lab at TP0) are **byte-identical**:

```
$ node tools/table-3d/m9-determinism.mjs --shot hero --port 5181
  md5(A) = fa8bb180c987c700d6c0506fd2e90bf8
  md5(B) = fa8bb180c987c700d6c0506fd2e90bf8
M9: PASS (byte-identical → deterministic)
```

This determinism is the precondition for every later regional-MSE / per-phase diff: a
non-deterministic capture would invalidate the whole comparison program (T-04-01 mitigated).

---

## M12 — ZERO-VISUAL-CHANGE proof for TP0 (the regression anchor)

TP0 edits **zero scene pixels** (the instrument is tooling + debug-param captures + sharp
transforms only). M12 proves it on the **FOV-INVARIANT must-not-change regions** — HERO (fov 32)
and MACRO (fov 26) are UNCHANGED presets, so their rects are stable now. A fresh capture this
session vs the HEAD baseline:

```
$ node tools/table-3d/m1-m2-m12.mjs --zero-change <current> <baseline>

region                 | MSE     | verdict
-----------------------|---------|--------
HERO felt (fov32)      | 0       | ZERO-CHANGE
HERO brass (fov32)     | 0       | ZERO-CHANGE
MACRO identity (fov26) | 0       | ZERO-CHANGE

Overall: ZERO VISUAL CHANGE (all fov-invariant regions MSE ≤ floor)
```

The fresh HERO capture was in fact **byte-identical** to the HEAD baseline (md5 `fa8bb180…` both),
so the regional MSE is **exactly 0** — the strongest possible zero-change evidence (T-04-04
mitigated for the fov-stable surface).

### M12 POV-region — DEFERRED to plan 06 (not asserted here)

The POV-dependent M12 region (the card-legibility region on the `?cam=card` frame) is
**PROVISIONAL** and **DEFERRED to plan 01-06**. Reason: the POV fov is not yet operator-locked
(40 in code, 37 candidate; the operator picks it at the plan-05 gate). Asserting an M12 region
against a non-final POV frame would gate against a frame that is about to change. Once the operator
locks the POV fov (plan 05) and the rect is finalized in `region-rects.json` (plan 06), plan 06
re-runs the POV-region M12 against the blessed POV frame. This mirrors how plan 01-03 defers its
POV-dependent colour rects to plan 06.

**M12 churn floor rationale:** the floor is `1.0` (mean-squared 8-bit units ≈ 1 grey level RMS).
A TRUE no-change region is byte-identical → MSE exactly 0 (proven above); the small non-zero floor
absorbs any future re-encode/downscale rounding without admitting a real change — the bad control
(a tinted felt rect) is **34886** MSE, four orders of magnitude over the floor.

---

## M1 / M2 — the protagonist-read seam (operator / manual, NOT auto-gated at TP0)

Per the SSOT, M1 and M2 are **semi-automated** with an operator/manual seam — they are NOT pure
auto pass/fail at TP0:

- **M1 legibility** (`m1Legibility`): reports the rank-glyph bbox px-height vs the **≥22px** floor
  on a 1080p POV downscale and **ALWAYS** sets `requiresOperatorConfirm: true`. The px-height is
  *necessary-not-sufficient*; there is **no automated OCR hard gate** (SSOT downgrades M1 to
  px-height + manual). The on-device legibility confirm is the **plan-05 operator gate**. Recorded
  **informational + operator-confirm** here — not admitted as an automated gate.
  (Helper `m1DownscalePov` produces the 1080p POV downscale + scale factor so a manual/assisted
  bbox is measured in the threshold's coordinate space.)

- **M2 cards-vs-chips** (`m2CardsVsChips`): cards' projected screen area must be **≥ 2.0×** chips'.
  Pure-pixel segmentation is unreliable (painted court cards share warm tones with chips), so the
  SSOT sanctions a **manual-polygon fallback**: traced card/chip polygons → shoelace area → ratio.
  The verdict logic is proven in the unit suite (ratio 3× PASS, 0.5× FAIL, polygon path 8×), but
  the polygons themselves are authored at the **plan-05 operator gate**. Recorded
  **informational (manual polygon fallback)** here — not silently auto-admitted (no reliable
  good/bad control without the operator's polygons).

---

## Phase sign-off items satisfied (01-VALIDATION §Validation Sign-Off)

- **M9 byte-identical** — ✅ proven (two consecutive HERO captures → identical md5).
- **M7 code-assert green** — ✅ proven (real `frontend/src/lab` → 0 matches; grep exit 1).
- **Zero-visual-change via M12 regional MSE ≈ 0** — ✅ proven on the fov-invariant regions
  (HERO felt/brass + MACRO identity, MSE 0 vs HEAD). POV-region portion deferred to plan 06.

---

## Instrument deviations (recorded for SUMMARY)

1. **M7 GOOD source fixture must be token-free.** The first `Clean.tsx` control contained the word
   "postprocessing" *in a comment* → the code-assert (correctly) flagged it (1 match) and the M7
   good control FAILED. This is the assert working as intended (it greps text, not just imports).
   Fixed (Rule 1) by rewording the clean fixture comment to avoid every forbidden token; M7 good
   then returned 0 matches → ADMITTED. Lesson: negative-control GOOD frames must not even *mention*
   the banned token.

2. **Committed M9 bad control is altered POST-downscale.** A 1-byte flip on the *full-res* frame is
   lost when `make-integrity-controls` downscales+re-encodes for the committed corpus (the alter is
   in the trailing CRC, not the pixels), so the committed good-a/good-b/bad would all re-encode to
   identical bytes and the bad control could not fail. Fixed by committing good-a, byte-copying it
   to good-b (guaranteed md5-equal), and making `m9-bad.png` a 1-byte-altered COPY of the committed
   good-a (guaranteed md5-differ). M9 is pure byte-identity, so a post-encode byte flip is a
   faithful known-bad — the committed corpus now self-validates (`--meta-gate docs/.../controls`
   exits 0 for M9).

3. **M12 numeric gate runs on FULL-RES, committed M12 PNGs are a visual record.** The felt rect is a
   2880×1800 coordinate, so M12's `--meta-gate` is pointed at the full-res working dir in
   `.dev-stack/` (same pattern as plan 01-03's colour gate); the downscaled committed `m12-good.png`
   / `m12-bad-tinted.png` are the durable visual/audit artifacts. M9 + M7 do self-validate on the
   committed corpus (the plan's Task-2 verify chains those two against the committed dir → exit 0).

4. **Own dev server, not the stale 5173–5175.** All captures ran against THIS worktree's Vite dev
   server on **port 5181** (started + verified serving `/table-lab.html`, RTX 4060 D3D11, ERRORS []).
   The stale servers from other checkouts (5173–5175) were never touched. Server stopped at plan end.
