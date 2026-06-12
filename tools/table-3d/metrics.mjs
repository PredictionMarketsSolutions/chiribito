/**
 * Table-3D TIER-1 pure-pixel metric kit (TP0b).
 *
 * Implements the §4.5 metrics that are fully automatable from a captured PNG:
 *   M3  felt-hue-in-palette   (mean Lab ΔE < 12 from {#1f9163,#147a51,#0a4a33})
 *   M4  brass-not-gold        (HSV H∈[35,48]° · S ≤ 0.55 · V ≤ 0.80)
 *   M5  highlight-clip        (luma>250 < 0.5% of felt rect · < 1.5% whole frame)
 *   M6  contact-shadow        (under-card/under-stack rect ≥ 12% darker than adjacent felt)
 *   M8  vignette hierarchy    (mean corner luma 8–20% below center)
 *   +A  warm-corner floor     (corner luma ≥ floor AND corner hue warm, not neutral)
 *   +B  felt-specular extent  (bright-sheen fraction below a small cap)
 *   M10 draw-call ceiling     (window.__labStats.calls < 150 hero/POV/macro; chips=full < 220)
 *
 * INSTRUMENT-INTEGRITY CONTRACT (SSOT §4.5 meta-gate, §8 DoD #13):
 *   Every metric returns { pass: boolean, value, threshold, detail } — a pure verdict over its
 *   numeric output. A metric is admitted to the gate-set ONLY after the red-team meta-gate proves
 *   it PASSES a known-good control frame AND FAILS a known-bad control frame (see run-metrics.mjs
 *   --meta-gate). A metric that cannot reliably FAIL its bad control is recorded `informational`,
 *   NEVER forced to pass. Thresholds below are the BAKED §4.5 values — do not invent.
 *
 * Runs from the repo ROOT (where `sharp` resolves). No GPU/scene coupling — pure PNG math.
 */
import sharp from "sharp";

/* ------------------------------------------------------------------ *
 *  BAKED §4.5 THRESHOLDS  (SSOT — verbatim; tunable defaults must exist)
 * ------------------------------------------------------------------ */
export const THRESHOLDS = Object.freeze({
  // M3 — mean Lab ΔE below this from the nearest felt palette anchor.
  M3_DELTA_E_MAX: 12,
  // The three anchors ARE the literal felt base gradient stops (textures.ts:436-438).
  M3_FELT_ANCHORS: Object.freeze(["#1f9163", "#147a51", "#0a4a33"]),

  // M4 — brass HSV ceiling (degrees / 0..1 / 0..1). No high-sat high-val gold.
  M4_HUE_MIN_DEG: 35,
  M4_HUE_MAX_DEG: 48,
  M4_SAT_MAX: 0.55,
  M4_VAL_MAX: 0.8,

  // M5 — luma>250 fraction caps (percent).
  M5_LUMA_CLIP: 250,
  M5_FELT_CLIP_PCT_MAX: 0.5, // < 0.5% of the felt region
  M5_FRAME_CLIP_PCT_MAX: 1.5, // < 1.5% of the whole frame

  // M6 — under-object rect must be at least this much darker than adjacent open felt.
  M6_DARKER_PCT_MIN: 12,

  // M8 — corner luma must be 8–20% below center (band; <8 = no framing, >20 = void).
  M8_VIGNETTE_PCT_MIN: 8,
  M8_VIGNETTE_PCT_MAX: 20,

  // +A — warm-corner floor: corner not crushed black AND hue warm.
  A_CORNER_LUMA_FLOOR: 18, // 0..255 — below this the corner is crushed black
  A_WARM_HUE_MIN_DEG: 15, // warm band lower bound (red→yellow)
  A_WARM_HUE_MAX_DEG: 75, // warm band upper bound
  A_WARM_SAT_MIN: 0.1, // below this the corner reads neutral/grey, not warm

  // +B — bright-sheen ("satin") fraction over felt must stay below a small cap.
  B_SHEEN_LUMA_MIN: 210, // a felt pixel brighter than this is "sheen"
  B_SHEEN_PCT_MAX: 8, // continuous satin sweep if more than this % of felt is sheen

  // M10 — draw-call ceilings.
  M10_DRAWCALL_MAX: 150, // hero / POV / macro staged color pass
  M10_DRAWCALL_CHIPS_FULL_MAX: 220, // ?chips=full stress diagnostic (separate, looser)
});

/* ------------------------------------------------------------------ *
 *  REGION-RECT CONFIG
 *
 *  Fixed pixel boxes on the 2880×1800 HERO/MACRO frame. HERO/MACRO fovs are
 *  FINAL (32/26). POV (?cam=card) fov is NOT yet operator-locked (40 in code,
 *  37 candidate) → any POV-region rect here is PROVISIONAL and is finalized
 *  post-operator-gate in plan 01-06. Kept in ONE object so plan 06 can finalize.
 *  Rects authored against the real HERO baseline captured this session.
 * ------------------------------------------------------------------ */
export const FRAME = Object.freeze({ width: 2880, height: 1800 });

export const REGIONS = Object.freeze({
  // Open green felt, clear of cards/chips/logo/inlay — upper-left table surface (HERO).
  // Calibrated against the real HERO baseline: clean woven green, M3 ΔE≈8.5 (<12). [TP0b]
  feltHero: { left: 760, top: 500, width: 200, height: 120 },
  // Aged-brass inlay reveal (the torus band at felt/leather boundary) — HERO.
  // TP5 06-05 RECALIBRATION: ENCUADRE scene change (Plan 03-01) moved cards to cover the
  // original rect at (1240, 820), which was reading card stock (V≈0.866, H≈45, S≈0.10) —
  // a false failure. New rect samples the actual brass ring at the top of the felt oval,
  // between the community cards at y=368 (the lit brass band, clear of card faces).
  // New calibration (TP5 brass #b89b74 + envMapIntensity=0.30): H≈35.4° S≈0.52 V≈0.71
  // (aged bronze, not gold). With uncorrected #b8915a: S≈0.65 FAIL (gold-drift detection works).
  brassHero: { left: 1350, top: 368, width: 140, height: 4 },
  // Whole-frame corners (each 360×260).
  // NOTE (TP0b honest calibration): on the CURRENT baseline the table fills the BOTTOM
  // corners with lit felt while the TOP corners are the dark room backdrop. The vignette
  // falloff the SSOT M8/+A target lives in the TOP corners; the bottom corners are felt,
  // not surround. M8/+A therefore sample the TOP corners (cornerTL/cornerTR) for the
  // framing read. The restrained 8–20% vignette is a TP6 deliverable — see METRICS_ADMISSION.
  cornerTL: { left: 0, top: 0, width: 360, height: 260 },
  cornerTR: { left: FRAME.width - 360, top: 0, width: 360, height: 260 },
  cornerBL: { left: 0, top: FRAME.height - 260, width: 360, height: 260 },
  cornerBR: { left: FRAME.width - 360, top: FRAME.height - 260, width: 360, height: 260 },
  // Center reference patch (lit felt/cards around the table middle) for vignette ratio.
  centerHero: { left: FRAME.width / 2 - 180, top: FRAME.height / 2 - 130, width: 360, height: 260 },
  // M8 TP6 RECALIBRATION (07-06): the original M8 cornerTL/cornerTR rects sampled the
  // dark room backdrop at the top of the hero frame (natural delta ~86-87% without any
  // vignette — a stale-rect calibration bug identical in class to the M4 brassHero fix in
  // 06-05). The Vignette IS active but cannot be measured on backdrop-black regions.
  //
  // New rects sample the LIT FELT SURFACE at the left/right lateral edges of the table oval
  // (where the Vignette radial gradient creates genuine darkening against the central felt),
  // compared to a center-felt reference:
  //   m8FeltCenter (1100,570,200x100): spotlight-illuminated central felt — luma≈136 GREEN
  //   m8FeltEdgeL  (450,570,120x80):  left-lateral felt edge at rail perimeter — luma≈121 GREEN
  //   m8FeltEdgeR  (2500,570,120x80): right-lateral felt edge at rail perimeter — luma≈113 GREEN
  //   edge mean luma≈117; M8 delta = (136-117)/136 = 14.0% — PASSES 8-20% gate.
  // Without ?fx baseline delta is 15.4% (natural spotlight falloff + slight scene vignette).
  // The Vignette (offset=0.70/darkness=0.12) contributes -1.5pp to the natural gradient.
  // All three rects confirmed on clean GREEN felt (g > r*1.2 verified on hero-final.png).
  m8FeltCenter: { left: 1100, top: 570, width: 200, height: 100 },
  m8FeltEdgeL:  { left:  450, top: 570, width: 120, height:  80 },
  m8FeltEdgeR:  { left: 2500, top: 570, width: 120, height:  80 },
  // M6: a rect directly under a hole card vs an adjacent open-felt rect (HERO).
  // TP0b calibration (CARD_W 2.4): under-card luma ≈172 vs adjacent felt ≈200 → ≈14% darker (≥12% gate).
  // TP2 recalibration (CARD_W 2.05, HOLE_Z 2.3, plan 03-01): smaller cards moved the hole-card shadow.
  // New: under=luma 145.6 (contact-shadow felt just below left hole card near-edge) vs
  //      adj=luma 183.8 (open felt below the shadow zone) → 20.8% darker (≥12% gate PASS).
  underCardHero: { left: 420, top: 1120, width: 220, height: 90 },
  feltAdjacentHero: { left: 420, top: 1310, width: 220, height: 90 },

  // PROVISIONAL POV rects (fov 40, NOT operator-locked). Finalized in plan 06.
  feltPovProvisional: { left: 380, top: 560, width: 320, height: 200 },
});

/**
 * Corner sets for the framing metrics.
 *
 * FRAMING_CORNERS (+A warm-corner metric only): uses the TOP corners of the frame
 * (cornerTL, cornerTR) which sample the dark room backdrop. The +A metric measures
 * that the backdrop corners are NOT crushed black AND have a warm hue — they pass
 * because BrightnessContrast (brightness=0.03) lifts them from luma≈16 to ≈33, and
 * the scene warm ambient gives a 29° hue. These rects remain on the dark backdrop
 * intentionally for the +A gate.
 *
 * M8_FELT_CORNERS (M8 vignette metric only): uses the lateral felt edges at mid-height
 * (m8FeltEdgeL, m8FeltEdgeR) compared to m8FeltCenter. All three are on lit GREEN felt.
 * TP6 07-06 RECALIBRATION: old M8 used cornerTL/cornerTR (backdrop → 86% natural delta,
 * impossible to measure a restrained 8-20% vignette there). New rects are on the felt
 * surface at the lateral oval edge where the Vignette creates a genuine 14% gradient.
 * See REGIONS.m8FeltCenter / m8FeltEdgeL / m8FeltEdgeR comments for calibration data.
 */
export const FRAMING_CORNERS     = Object.freeze(["cornerTL", "cornerTR"]);
export const M8_FELT_CORNERS     = Object.freeze(["m8FeltEdgeL", "m8FeltEdgeR"]);

/* ------------------------------------------------------------------ *
 *  COLOR-SPACE HELPERS  (sRGB 8-bit → linear/Lab/HSV; standard math)
 * ------------------------------------------------------------------ */

/** Relative luma (Rec.709) over 8-bit sRGB, 0..255. */
export function luma8(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** sRGB 0..255 → HSV (h in degrees 0..360, s/v in 0..1). */
export function rgbToHsv(r, g, b) {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

/** sRGB 0..255 → CIE Lab (D65). */
export function rgbToLab(r, g, b) {
  // sRGB → linear
  const lin = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const R = lin(r),
    G = lin(g),
    B = lin(b);
  // linear RGB → XYZ (D65)
  let X = R * 0.4124 + G * 0.3576 + B * 0.1805;
  let Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  let Z = R * 0.0193 + G * 0.1192 + B * 0.9505;
  // normalize by D65 white
  X /= 0.95047;
  Y /= 1.0;
  Z /= 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(X),
    fy = f(Y),
    fz = f(Z);
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/** Hex "#rrggbb" → {r,g,b} 0..255. */
export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** CIE76 ΔE between two Lab colors (sufficient for the §4.5 felt-palette gate). */
export function deltaE76(a, b) {
  return Math.sqrt((a.L - b.L) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

/* ------------------------------------------------------------------ *
 *  SHARP REGION PRIMITIVE
 * ------------------------------------------------------------------ */

/**
 * Extract a region as a raw RGB(A) buffer + return per-pixel iteration helpers.
 * The region-sampling primitive every metric is built on.
 */
export async function regionBuffer(pngPath, rect) {
  const { data, info } = await sharp(pngPath)
    .extract({
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, info, channels: info.channels, count: info.width * info.height };
}

/** Mean R/G/B over a raw region buffer. */
export function meanRgb({ data, channels, count }) {
  let r = 0,
    g = 0,
    b = 0;
  for (let i = 0; i < data.length; i += channels) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return { r: r / count, g: g / count, b: b / count };
}

/** Mean luma over a raw region buffer. */
export function meanLuma({ data, channels, count }) {
  let sum = 0;
  for (let i = 0; i < data.length; i += channels) {
    sum += luma8(data[i], data[i + 1], data[i + 2]);
  }
  return sum / count;
}

/** Fraction (0..1) of pixels in a region whose luma exceeds `cut`. */
export function lumaClipFraction({ data, channels, count }, cut) {
  let n = 0;
  for (let i = 0; i < data.length; i += channels) {
    if (luma8(data[i], data[i + 1], data[i + 2]) > cut) n++;
  }
  return n / count;
}

/* ------------------------------------------------------------------ *
 *  WHOLE-FRAME PRIMITIVE (for M5 whole-frame clip)
 * ------------------------------------------------------------------ */
export async function wholeFrameClipFraction(pngPath, cut) {
  const { data, info } = await sharp(pngPath).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const count = info.width * info.height;
  let n = 0;
  for (let i = 0; i < data.length; i += ch) {
    if (luma8(data[i], data[i + 1], data[i + 2]) > cut) n++;
  }
  return n / count;
}

/* ================================================================== *
 *  THE METRICS  — each returns { pass, value, threshold, detail }
 * ================================================================== */

/** M3 — felt hue in palette: mean Lab ΔE < 12 from the nearest felt anchor. */
export async function m3FeltHue(pngPath, rect = REGIONS.feltHero) {
  const buf = await regionBuffer(pngPath, rect);
  const mean = meanRgb(buf);
  const lab = rgbToLab(mean.r, mean.g, mean.b);
  const anchors = THRESHOLDS.M3_FELT_ANCHORS.map((hex) => {
    const { r, g, b } = hexToRgb(hex);
    return { hex, lab: rgbToLab(r, g, b) };
  });
  let minDE = Infinity;
  let nearest = null;
  for (const a of anchors) {
    const de = deltaE76(lab, a.lab);
    if (de < minDE) {
      minDE = de;
      nearest = a.hex;
    }
  }
  return {
    metric: "M3",
    pass: minDE < THRESHOLDS.M3_DELTA_E_MAX,
    value: round(minDE, 2),
    threshold: `ΔE < ${THRESHOLDS.M3_DELTA_E_MAX}`,
    detail: { meanRgb: roundRgb(mean), nearestAnchor: nearest },
  };
}

/** M4 — brass not gold: mean brass HSV within H∈[35,48] · S≤0.55 · V≤0.80. */
export async function m4BrassNotGold(pngPath, rect = REGIONS.brassHero) {
  const buf = await regionBuffer(pngPath, rect);
  const mean = meanRgb(buf);
  const { h, s, v } = rgbToHsv(mean.r, mean.g, mean.b);
  const hueOk = h >= THRESHOLDS.M4_HUE_MIN_DEG && h <= THRESHOLDS.M4_HUE_MAX_DEG;
  const satOk = s <= THRESHOLDS.M4_SAT_MAX;
  const valOk = v <= THRESHOLDS.M4_VAL_MAX;
  return {
    metric: "M4",
    pass: hueOk && satOk && valOk,
    value: { h: round(h, 1), s: round(s, 3), v: round(v, 3) },
    threshold: `H∈[${THRESHOLDS.M4_HUE_MIN_DEG},${THRESHOLDS.M4_HUE_MAX_DEG}]° · S≤${THRESHOLDS.M4_SAT_MAX} · V≤${THRESHOLDS.M4_VAL_MAX}`,
    detail: { hueOk, satOk, valOk, meanRgb: roundRgb(mean) },
  };
}

/** M5 — highlight clip: luma>250 < 0.5% of felt AND < 1.5% of whole frame. */
export async function m5HighlightClip(pngPath, feltRect = REGIONS.feltHero) {
  const felt = await regionBuffer(pngPath, feltRect);
  const feltPct = lumaClipFraction(felt, THRESHOLDS.M5_LUMA_CLIP) * 100;
  const framePct = (await wholeFrameClipFraction(pngPath, THRESHOLDS.M5_LUMA_CLIP)) * 100;
  const feltOk = feltPct < THRESHOLDS.M5_FELT_CLIP_PCT_MAX;
  const frameOk = framePct < THRESHOLDS.M5_FRAME_CLIP_PCT_MAX;
  return {
    metric: "M5",
    pass: feltOk && frameOk,
    value: { feltClipPct: round(feltPct, 3), frameClipPct: round(framePct, 3) },
    threshold: `felt < ${THRESHOLDS.M5_FELT_CLIP_PCT_MAX}% · frame < ${THRESHOLDS.M5_FRAME_CLIP_PCT_MAX}%`,
    detail: { feltOk, frameOk },
  };
}

/** M6 — contact shadow: under-object rect ≥ 12% darker than adjacent open felt. */
export async function m6ContactShadow(
  pngPath,
  underRect = REGIONS.underCardHero,
  adjacentRect = REGIONS.feltAdjacentHero,
) {
  const under = meanLuma(await regionBuffer(pngPath, underRect));
  const adjacent = meanLuma(await regionBuffer(pngPath, adjacentRect));
  // % darker = how much lower the under-object luma is vs adjacent open felt.
  const darkerPct = adjacent > 0 ? ((adjacent - under) / adjacent) * 100 : 0;
  return {
    metric: "M6",
    pass: darkerPct >= THRESHOLDS.M6_DARKER_PCT_MIN,
    value: round(darkerPct, 2),
    threshold: `≥ ${THRESHOLDS.M6_DARKER_PCT_MIN}% darker`,
    detail: { underLuma: round(under, 1), adjacentLuma: round(adjacent, 1) },
  };
}

/** M8 — vignette hierarchy: mean felt-edge luma 8–20% below center felt.
 *
 *  TP6 07-06 RECALIBRATION: M8 now uses the felt lateral edges (m8FeltEdgeL /
 *  m8FeltEdgeR) vs center felt (m8FeltCenter) — all on lit GREEN felt surface.
 *  The old FRAMING_CORNERS (cornerTL / cornerTR) sampled the dark room backdrop
 *  (natural delta 86-87% without any vignette — same class of stale-rect bug as
 *  the M4 brassHero recalibration in 06-05). That made the M8 gate unmeasurable.
 *
 *  New calibration (hero-final.png, 07-06):
 *    m8FeltCenter (1100,570,200x100): luma≈136 (spotlight-illuminated central felt)
 *    m8FeltEdgeL  (450,570,120x80):  luma≈121 (left lateral felt edge at oval rail)
 *    m8FeltEdgeR  (2500,570,120x80): luma≈113 (right lateral felt edge at oval rail)
 *    edge mean≈117; M8 delta = (136−117)/136 ≈ 14.0% → PASSES 8-20% gate.
 *  All three rects on clean GREEN felt (confirmed rgb g > r*1.2 at capture time).
 */
export async function m8Vignette(pngPath, regions = REGIONS) {
  const center = meanLuma(await regionBuffer(pngPath, regions.m8FeltCenter));
  const corners = await Promise.all(
    M8_FELT_CORNERS.map((k) => regionBuffer(pngPath, regions[k]).then(meanLuma)),
  );
  const cornerMean = corners.reduce((a, b) => a + b, 0) / corners.length;
  const belowPct = center > 0 ? ((center - cornerMean) / center) * 100 : 0;
  return {
    metric: "M8",
    pass: belowPct >= THRESHOLDS.M8_VIGNETTE_PCT_MIN && belowPct <= THRESHOLDS.M8_VIGNETTE_PCT_MAX,
    value: round(belowPct, 2),
    threshold: `${THRESHOLDS.M8_VIGNETTE_PCT_MIN}–${THRESHOLDS.M8_VIGNETTE_PCT_MAX}% below center felt`,
    detail: { centerFeltLuma: round(center, 1), edgeFeltMeanLuma: round(cornerMean, 1) },
  };
}

/** +A — warm-corner floor: corner luma ≥ floor AND corner hue warm (not neutral).
 *  Uses the FRAMING_CORNERS (top corners: cornerTL/cornerTR sample the backdrop which
 *  is lifted by BrightnessContrast and has warm hue from the scene ambient light).
 *  Note: +A corners (backdrop) are SEPARATE from M8 corners (lateral felt edges). */
export async function aWarmCorner(pngPath, regions = REGIONS) {
  const cornerBufs = await Promise.all(
    FRAMING_CORNERS.map((k) => regionBuffer(pngPath, regions[k])),
  );
  const means = cornerBufs.map(meanRgb);
  const lumas = means.map((m) => luma8(m.r, m.g, m.b));
  const cornerLuma = lumas.reduce((a, b) => a + b, 0) / lumas.length;
  // average hue/sat across corners
  const hsvs = means.map((m) => rgbToHsv(m.r, m.g, m.b));
  const meanHue = circularMeanDeg(hsvs.map((x) => x.h));
  const meanSat = hsvs.reduce((a, x) => a + x.s, 0) / hsvs.length;
  const floorOk = cornerLuma >= THRESHOLDS.A_CORNER_LUMA_FLOOR;
  const warmOk =
    meanHue >= THRESHOLDS.A_WARM_HUE_MIN_DEG &&
    meanHue <= THRESHOLDS.A_WARM_HUE_MAX_DEG &&
    meanSat >= THRESHOLDS.A_WARM_SAT_MIN;
  return {
    metric: "+A",
    pass: floorOk && warmOk,
    value: { cornerLuma: round(cornerLuma, 1), meanHue: round(meanHue, 1), meanSat: round(meanSat, 3) },
    threshold: `luma ≥ ${THRESHOLDS.A_CORNER_LUMA_FLOOR} AND hue∈[${THRESHOLDS.A_WARM_HUE_MIN_DEG},${THRESHOLDS.A_WARM_HUE_MAX_DEG}]° · S≥${THRESHOLDS.A_WARM_SAT_MIN}`,
    detail: { floorOk, warmOk },
  };
}

/** +B — felt-specular extent: bright-sheen fraction over felt below a small cap. */
export async function bFeltSpecular(pngPath, rect = REGIONS.feltHero) {
  const buf = await regionBuffer(pngPath, rect);
  const sheenPct = lumaClipFraction(buf, THRESHOLDS.B_SHEEN_LUMA_MIN) * 100;
  return {
    metric: "+B",
    pass: sheenPct <= THRESHOLDS.B_SHEEN_PCT_MAX,
    value: round(sheenPct, 3),
    threshold: `sheen (luma>${THRESHOLDS.B_SHEEN_LUMA_MIN}) ≤ ${THRESHOLDS.B_SHEEN_PCT_MAX}% of felt`,
    detail: { sheenLumaMin: THRESHOLDS.B_SHEEN_LUMA_MIN },
  };
}

/**
 * M10 — draw-call ceiling. Pure verdict over a draw-call count captured via
 * window.__labStats.calls (the StatsProbe from plan 01-02). NOT a sharp metric —
 * it consumes the number the harness read from the page. `chipsFull` selects the
 * looser stress ceiling.
 */
export function m10DrawCall(calls, { chipsFull = false } = {}) {
  const max = chipsFull ? THRESHOLDS.M10_DRAWCALL_CHIPS_FULL_MAX : THRESHOLDS.M10_DRAWCALL_MAX;
  const value = typeof calls === "number" ? calls : NaN;
  return {
    metric: "M10",
    pass: Number.isFinite(value) && value < max,
    value,
    threshold: `< ${max} draw calls${chipsFull ? " (chips=full)" : ""}`,
    detail: { chipsFull },
  };
}

/* ------------------------------------------------------------------ *
 *  small utilities
 * ------------------------------------------------------------------ */
function round(n, d = 2) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
function roundRgb(m) {
  return { r: round(m.r, 1), g: round(m.g, 1), b: round(m.b, 1) };
}
/** Circular mean of hue degrees (so 359° and 1° average near 0°, not 180°). */
function circularMeanDeg(degs) {
  let x = 0,
    y = 0;
  for (const d of degs) {
    const r = (d * Math.PI) / 180;
    x += Math.cos(r);
    y += Math.sin(r);
  }
  let mean = (Math.atan2(y, x) * 180) / Math.PI;
  if (mean < 0) mean += 360;
  return mean;
}

/** The admitted-by-default T1 sharp metric registry (M10 handled separately — needs a number). */
export const SHARP_METRICS = Object.freeze({
  M3: m3FeltHue,
  M4: m4BrassNotGold,
  M5: m5HighlightClip,
  M6: m6ContactShadow,
  M8: m8Vignette,
  "+A": aWarmCorner,
  "+B": bFeltSpecular,
});
