/**
 * Procedural canvas textures for the 3D table spike — now carrying the REAL
 * Chiribito identity (derived from web/public/logo-chiribito-circular.png and the
 * project's Spanish-suit vectors), not placeholder marks.
 *
 * Identity DNA taken from the official logo: a studded medallion ring, the Spanish
 * suits (oros/copas/espadas/bastos), the CHIRIBITO wordmark, and the castizo palette
 * (burgundy / Chiribito green / brass / charcoal). Rendered with restraint — brass,
 * not gaudy gold; material-forward, anti-casino.
 *
 * Throwaway spike code: not wired into the game, lives only on the lab route.
 */
import * as THREE from "three";

export type SuitCode = "O" | "C" | "E" | "B";
export const CHIP_SUITS: SuitCode[] = ["C", "B", "E", "O"];
export const SUIT_NAMES: Record<SuitCode, string> = { O: "OROS", C: "COPAS", E: "ESPADAS", B: "BASTOS" };

export interface ChipPalette {
  faceLit: string;
  face: string;
  edge: string;
  cream: string;
  ink: string;
  accent: string; // suit-symbol colour on the inlay
}

// Each denomination IS a Spanish suit. Castizo palette pulled from the logo.
export const CHIP_PALETTES: Record<SuitCode, ChipPalette> = {
  C: { faceLit: "#a83a4c", face: "#8a2738", edge: "#561622", cream: "#f3ead0", ink: "#3a0e16", accent: "#9c2230" }, // copas → burgundy
  B: { faceLit: "#1aa67c", face: "#0c6b4f", edge: "#063f2e", cream: "#f3ead0", ink: "#062a1f", accent: "#0e7a4f" }, // bastos → green
  E: { faceLit: "#3f6390", face: "#2c4868", edge: "#172f48", cream: "#eef1f6", ink: "#0f1f31", accent: "#34527a" }, // espadas → navy
  O: { faceLit: "#e6b455", face: "#b9892f", edge: "#7a591c", cream: "#f7f0db", ink: "#5a4216", accent: "#b07d22" }, // oros → gold
};

const BRASS = "#c9a24c";
const BRASS_DARK = "#6e4f17";
const TAU = Math.PI * 2;

// Exact favicon colours, sampled from the real chiribito.com/favicon.ico.
const CHIRI_GREEN_D = "#143019";
const CHIRI_GREEN = "#1e442a";
const CHIRI_GREEN_L = "#2c5e3b";
const CHIRI_GOLD_D = "#7a5a22";
const CHIRI_GOLD = "#b2883d";
const CHIRI_GOLD_L = "#d9b45e";

// The Chiribito "C" arc geometry — shared by the painted colour face AND the relief
// (bump) map so the gold C and its tooled groove register pixel-exactly. Fractions of
// the medallion radius R.
const C_ARC = { rFrac: 0.45, widthFrac: 0.22, start: Math.PI * 0.3, end: Math.PI * 1.7 };

/**
 * The Chiribito "C" medallion — a faithful HIGH-RES rebuild of the official 48px
 * favicon (chiribito.com/favicon.ico): a green coin, a beveled gold ring, a bold gold
 * "C". Uses the favicon's EXACT sampled colours; crisp at any size (the 48px source is
 * too low-res to upscale sharply). Swap for an HD original the instant one exists.
 */
function drawChiriC(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  const R = size / 2;
  ctx.save();
  ctx.translate(cx, cy);

  // green coin field (lit top-left) — generous, so the C has room to breathe
  const field = ctx.createRadialGradient(-R * 0.24, -R * 0.28, R * 0.05, 0, 0, R);
  field.addColorStop(0, CHIRI_GREEN_L);
  field.addColorStop(0.62, CHIRI_GREEN);
  field.addColorStop(1, CHIRI_GREEN_D);
  ctx.fillStyle = field;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.88, 0, TAU);
  ctx.fill();

  // a SLIM beveled gold ring (thinner → the C no longer feels boxed in)
  const ring = ctx.createLinearGradient(-R, -R, R, R);
  ring.addColorStop(0, CHIRI_GOLD_L);
  ring.addColorStop(0.45, CHIRI_GOLD);
  ring.addColorStop(1, CHIRI_GOLD_D);
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, TAU);
  ctx.arc(0, 0, R * 0.88, 0, TAU, true);
  ctx.fill("evenodd");
  ctx.lineWidth = R * 0.018;
  ctx.strokeStyle = hexA("#000000", 0.3);
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.885, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = hexA(CHIRI_GOLD_L, 0.7);
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.99, Math.PI * 1.06, Math.PI * 1.82);
  ctx.stroke();

  // the "C" — bold but refined, with breathing room from both the ring and the centre,
  // and soft (round) terminals so it reads elegant, not cut off
  const cR = R * C_ARC.rFrac;
  ctx.lineCap = "round";
  ctx.lineWidth = R * C_ARC.widthFrac;
  const cgrad = ctx.createLinearGradient(-cR, -cR, cR, cR);
  cgrad.addColorStop(0, CHIRI_GOLD_L);
  cgrad.addColorStop(0.5, CHIRI_GOLD);
  cgrad.addColorStop(1, CHIRI_GOLD_D);
  ctx.strokeStyle = cgrad;
  ctx.beginPath();
  // longer travel at both terminals so the C "embraces" the circle and reads finished
  // (gap ~108° on the right) — still clearly a C, never an O.
  ctx.arc(0, 0, cR, C_ARC.start, C_ARC.end, false);
  ctx.stroke();
  // a fine inner highlight catching the upper-left light — gives the gold real round
  // body instead of a flat painted stroke (kills the "sticker" read).
  ctx.lineWidth = R * C_ARC.widthFrac * 0.26;
  ctx.strokeStyle = hexA("#f4dca0", 0.55);
  ctx.beginPath();
  ctx.arc(0, 0, cR + R * C_ARC.widthFrac * 0.22, C_ARC.start + 0.12, C_ARC.end - 0.5, false);
  ctx.stroke();

  ctx.restore();
}

function makeCanvas(w: number, h: number): { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d")! };
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/** Per-pixel hash grain. Preserves alpha (transparent areas stay transparent). */
function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number): void {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const v = (n - 0.5) * amount;
    d[i] = clamp(d[i] + v);
    d[i + 1] = clamp(d[i + 1] + v);
    d[i + 2] = clamp(d[i + 2] + v);
  }
  ctx.putImageData(img, 0, 0);
}

function srgb(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Grayscale data texture (bump / roughness) — LINEAR, never sRGB. */
function gray(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}

function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}

/**
 * Draw a Spanish suit symbol centred at (cx,cy), `size` px wide, in `color`.
 * Shapes are the project's canonical suit vectors (64×64 viewBox), redrawn on canvas.
 */
export function drawSuit(ctx: CanvasRenderingContext2D, suit: SuitCode, cx: number, cy: number, size: number, color: string): void {
  ctx.save();
  ctx.translate(cx, cy);
  const s = size / 64;
  ctx.scale(s, s);
  ctx.translate(-32, -32);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  if (suit === "O") {
    // oros — a coin: filled disc + two concentric rings
    ctx.beginPath();
    ctx.arc(32, 32, 22, 0, TAU);
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = hexA("#000000", 0.18);
    ctx.beginPath();
    ctx.arc(32, 32, 15, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(32, 32, 7.5, 0, TAU);
    ctx.stroke();
  } else if (suit === "C") {
    // copas — goblet
    ctx.fill(new Path2D("M18 14h28v4c0 12-8 20-14 24-6-4-14-12-14-24v-4z"));
    ctx.fill(new Path2D("M28 42h8v8h-8z"));
    ctx.fill(new Path2D("M22 50h20v4h-20z"));
  } else if (suit === "E") {
    // espadas — sword
    ctx.fillRect(30, 6, 4, 40);
    ctx.beginPath();
    ctx.moveTo(32, 6);
    ctx.lineTo(22, 20);
    ctx.lineTo(42, 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(20, 42, 24, 4);
    ctx.fillRect(28, 46, 8, 6);
    ctx.fillRect(24, 52, 16, 3);
  } else {
    // bastos — club / baton
    ctx.fillRect(29, 10, 6, 44);
    ctx.beginPath();
    ctx.arc(32, 12, 6, 0, TAU);
    ctx.fill();
    for (const [tx, rot] of [[22, -30], [42, 30]] as [number, number][]) {
      ctx.save();
      ctx.translate(tx, 22);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 4, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

/** A ring of small brass studs at `rad` — the logo medallion's signature rivet ring. */
function studRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, rad: number, count: number, studR: number): void {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU - Math.PI / 2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    const g = ctx.createRadialGradient(x - studR * 0.3, y - studR * 0.3, 0, x, y, studR);
    g.addColorStop(0, "#f0d68a");
    g.addColorStop(0.6, BRASS);
    g.addColorStop(1, BRASS_DARK);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, studR, 0, TAU);
    ctx.fill();
  }
}

/**
 * Chip face — a Chiribito medallion. Clay dome, a brass stud ring (from the logo),
 * and the Chiribito green-C as the DOMINANT heart, big enough to recognise across a
 * whole stack. The 4 Spanish suits live on the felt + chair-backs, so the chip stays
 * clean and C-dominant.
 */
export function chipFaceTexture(suit: SuitCode, cImg?: HTMLImageElement | null): THREE.CanvasTexture {
  const p = CHIP_PALETTES[suit];
  const S = 2048; // very high-res so the C + rim stay crisp even at macro zoom
  const { c, ctx } = makeCanvas(S, S);
  const r = S / 2;

  // clay dome
  const dome = ctx.createRadialGradient(r, r * 0.8, r * 0.05, r, r, r);
  dome.addColorStop(0, p.faceLit);
  dome.addColorStop(0.55, p.face);
  dome.addColorStop(0.85, p.edge);
  dome.addColorStop(1, p.edge);
  ctx.fillStyle = dome;
  ctx.beginPath();
  ctx.arc(r, r, r, 0, TAU);
  ctx.fill();
  speckle(ctx, S, S, 12);

  // a fine refined brass rim line — NO busy stud ring (that crowded the C). The C
  // now floats in clay with real breathing room.
  ctx.lineWidth = S * 0.0055;
  ctx.strokeStyle = hexA(BRASS, 0.5);
  ctx.beginPath();
  ctx.arc(r, r, r * 0.93, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = S * 0.0028;
  ctx.strokeStyle = hexA(BRASS_DARK, 0.4);
  ctx.beginPath();
  ctx.arc(r, r, r * 0.895, 0, TAU);
  ctx.stroke();

  // the Chiribito C — the absolute hero, with generous clay breathing room around it.
  // ?c=literal uses the literal 48px favicon (soft); otherwise the faithful HD rebuild.
  const cSize = r * 1.26;
  if (cImg) {
    const rad = cSize / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(r, r, rad, 0, TAU);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    (ctx as unknown as { imageSmoothingQuality: string }).imageSmoothingQuality = "high";
    ctx.drawImage(cImg, r - rad, r - rad, rad * 2, rad * 2);
    ctx.restore();
  } else {
    drawChiriC(ctx, r, r, cSize);
  }

  // a final whisper of dither breaks 8-bit gradient banding on the gold C + ring
  speckle(ctx, S, S, 4);

  return srgb(c);
}

/**
 * Relief (bump) map for the chip face — the C and the rim line are TOOLED INTO the clay
 * (recessed grooves) and the field carries faint clay micro-grain. Fed to `bumpMap` so
 * the C catches a real edge of light along its groove instead of reading like a printed
 * sticker. Drawn at the SAME coordinates as chipFaceTexture (shared C_ARC) so they register.
 */
export function chipFaceBump(cImg?: HTMLImageElement | null): THREE.CanvasTexture {
  const S = 2048;
  const { c, ctx } = makeCanvas(S, S);
  const r = S / 2;

  // clay field = mid height, with faint micro-relief so the surface is never glassy
  ctx.fillStyle = "#808080";
  ctx.beginPath();
  ctx.arc(r, r, r, 0, TAU);
  ctx.fill();
  speckle(ctx, S, S, 18);

  // the refined brass rim line, sunk as a shallow groove (matches chipFaceTexture's r*0.93)
  ctx.lineCap = "round";
  ctx.strokeStyle = "#5c5c5c";
  ctx.lineWidth = S * 0.007;
  ctx.beginPath();
  ctx.arc(r, r, r * 0.93, 0, TAU);
  ctx.stroke();

  // the C, tooled into the clay
  const cSize = r * 1.26;
  ctx.save();
  ctx.translate(r, r);
  const RR = cSize / 2; // mirrors drawChiriC's internal R = size/2
  if (cImg) {
    // literal-favicon fallback: just sink the disc a touch so it doesn't read flat
    ctx.fillStyle = "#6c6c6c";
    ctx.beginPath();
    ctx.arc(0, 0, RR * 0.62, 0, TAU);
    ctx.fill();
  } else {
    // recessed groove
    ctx.lineCap = "round";
    ctx.lineWidth = RR * C_ARC.widthFrac;
    ctx.strokeStyle = "#454545";
    ctx.beginPath();
    ctx.arc(0, 0, RR * C_ARC.rFrac, C_ARC.start, C_ARC.end, false);
    ctx.stroke();
    // a thin bright shoulder just inside the groove → a tooled bevel that catches light
    ctx.lineWidth = RR * C_ARC.widthFrac * 0.3;
    ctx.strokeStyle = "#a6a6a6";
    ctx.beginPath();
    ctx.arc(0, 0, RR * C_ARC.rFrac * 0.86, C_ARC.start + 0.08, C_ARC.end - 0.3, false);
    ctx.stroke();
  }
  ctx.restore();

  return gray(c);
}

/**
 * Chip side — rolled clay edge with the classic cream inserts ("spots"), restrained so
 * they read craft, not casino. The lathe maps uv.y ≈ 0.5 to the chip's outer wall, so the
 * spot row is centred vertically and wraps gently onto the rounded bevels — exactly how a
 * real clay chip's edge spots look. Repeats once around the circumference.
 */
export function chipEdgeTexture(suit: SuitCode): THREE.CanvasTexture {
  const p = CHIP_PALETTES[suit];
  const W = 2048;
  const H = 256;
  const { c, ctx } = makeCanvas(W, H);

  // clay shading across the rolled edge (lit top → shadowed bottom)
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, p.faceLit);
  g.addColorStop(0.5, p.face);
  g.addColorStop(1, p.edge);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // faint vertical striations — the rolled clay catches light in fine ribs, never a dead band
  ctx.globalAlpha = 0.08;
  for (let x = 0; x < W; x += 7) {
    ctx.strokeStyle = x % 14 === 0 ? p.faceLit : p.edge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  speckle(ctx, W, H, 10);

  // a single centred row of cream inserts, each sunk with a soft shadow lip
  const groups = 10;
  const gw = W / groups;
  const sw = gw * 0.3;
  const sh = H * 0.42;
  for (let i = 0; i < groups; i++) {
    const cx = i * gw + gw * 0.5;
    ctx.fillStyle = hexA(p.ink, 0.45);
    ctx.fillRect(cx - sw / 2 - 3, H * 0.5 - sh / 2 - 3, sw + 6, sh + 6);
    ctx.fillStyle = p.cream;
    ctx.fillRect(cx - sw / 2, H * 0.5 - sh / 2, sw, sh);
    // a hair of top-lit bevel on each insert
    ctx.fillStyle = hexA("#ffffff", 0.18);
    ctx.fillRect(cx - sw / 2, H * 0.5 - sh / 2, sw, sh * 0.16);
  }

  const t = srgb(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/**
 * Green baize — calm, matte, premium. The Chiribito identity is born INSIDE the
 * cloth: the CHIRIBITO wordmark + a brass medallion ring + the four Spanish suits
 * at the cardinal points, all inlaid tone-on-tone. (Clipped to a circle so a flat
 * plane carries it without the triangle-fan moiré; per-pixel grain, no structured
 * scatter — both were causes of earlier radial "ray" artifacts.)
 */
export function feltTexture(
  logoImg?: HTMLImageElement | null,
  aceImgs?: Partial<Record<SuitCode, HTMLImageElement | null>>,
): THREE.CanvasTexture {
  const S = 1024;
  const { c, ctx } = makeCanvas(S, S);
  const r = S / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(r, r, r, 0, TAU);
  ctx.clip();

  const base = ctx.createRadialGradient(r, r * 0.88, r * 0.05, r, r, r * 1.05);
  base.addColorStop(0, "#1f9163");
  base.addColorStop(0.55, "#147a51");
  base.addColorStop(1, "#0a4a33");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  speckle(ctx, S, S, 9);

  // The REAL official Chiribito logo, inlaid at the centre — the table is built
  // AROUND the real identity (born inside the cloth, framed by a brass ring).
  // Literal asset (logo-chiribito-circular.png), circular-clipped to drop the PNG's
  // square corners; not a recreation.
  ctx.save();
  ctx.translate(r, r);

  if (logoImg) {
    const lr = r * 0.34;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, lr, 0, TAU);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    (ctx as unknown as { imageSmoothingQuality: string }).imageSmoothingQuality = "high";
    ctx.drawImage(logoImg, -lr, -lr, lr * 2, lr * 2);
    ctx.restore();
  }

  // brass ring framing the logo
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = hexA(BRASS, 0.8);
  ctx.lineWidth = S * 0.006;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.41, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = S * 0.003;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.44, 0, TAU);
  ctx.stroke();

  // the four REAL official Spanish suits (ace art) at the cardinal points — ADN on the cloth
  const suitR = r * 0.6;
  const order: SuitCode[] = ["O", "C", "E", "B"];
  ctx.imageSmoothingEnabled = true;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU - Math.PI / 2;
    const ace = aceImgs?.[order[i]];
    if (!ace) continue;
    const px = Math.cos(a) * suitR;
    const py = Math.sin(a) * suitR;
    const h = r * 0.27;
    const w = h * (ace.width / ace.height || 0.65);
    ctx.globalAlpha = 0.9;
    ctx.drawImage(ace, px - w / 2, py - h / 2, w, h);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // vignette
  const vig = ctx.createRadialGradient(r, r, r * 0.42, r, r, r);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, S, S);

  ctx.restore();
  return srgb(c);
}

/** Warm varnished-wood grain for the rail. */
export function woodTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 512;
  const { c, ctx } = makeCanvas(W, H);
  ctx.fillStyle = "#6a4226";
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 150; i++) {
    const y = (i / 150) * H;
    const shade = 18 + Math.sin(i * 1.7) * 14;
    ctx.strokeStyle = `rgba(${128 + shade}, ${82 + shade * 0.6}, ${44 + shade * 0.4}, 0.5)`;
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const yy = y + Math.sin(x * 0.012 + i) * 6 + Math.sin(x * 0.05 + i * 2) * 2;
      x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  speckle(ctx, W, H, 16);
  const t = srgb(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

// --- arced text helpers ---

function arcTextTop(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, text: string, fontPx: number, color: string): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.font = `600 ${fontPx}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const total = Math.PI * 0.92;
  const step = total / (text.length - 1);
  const start = -Math.PI / 2 - total / 2;
  for (let i = 0; i < text.length; i++) {
    const a = start + step * i;
    ctx.save();
    ctx.rotate(a);
    ctx.translate(0, -radius);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function arcTextBottom(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, text: string, fontPx: number, color: string): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.font = `700 ${fontPx}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const total = Math.PI * 0.8;
  const step = total / (text.length - 1);
  const start = Math.PI / 2 + total / 2;
  for (let i = 0; i < text.length; i++) {
    const a = start - step * i;
    ctx.save();
    ctx.rotate(a);
    ctx.translate(0, radius);
    ctx.rotate(Math.PI);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}
