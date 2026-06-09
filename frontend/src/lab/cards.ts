/**
 * Chiribito · Mesa Lab — M1: the card as the absolute protagonist.
 *
 * Pure helpers for the 3D Spanish-deck cards: the real Fournier face URLs the game
 * already ships (`/cards/<rank> DE <SUIT>.webp`), card proportions, rounded-card
 * geometry, and the (unit-tested) table layout math.
 *
 * Identity: the card dominates the frame; chips are a demoted accent. Reuse the real
 * official card faces — NEVER redraw them. Isolated to the lab; touches nothing in the game.
 */
import * as THREE from "three";

// Suit-code → folder name. Mirrors the canonical map in `src/card-texture-url.ts`
// (the deck's source of truth is the game server glossary). Kept local so the lab
// imports nothing from the game tree.
const SUIT_NAME_MAP: Record<string, string> = { O: "ORO", C: "COPAS", E: "ESPADA", B: "BASTOS" };

/** Lab card id ("10O" = Sota de Oros) → encoded public URL of the real Fournier face. */
export function labCardFaceUrl(id: string): string {
  const suit = id.slice(-1);
  const rank = id.slice(0, -1);
  const suitName = SUIT_NAME_MAP[suit] ?? suit;
  // spaces in the filename must be percent-encoded for TextureLoader's fetch
  return encodeURI(`/cards/${rank} DE ${suitName}.webp`);
}

// --- card physical proportions (world units; a chip radius = 1, so a chip is 2 wide) ---
// A real baraja española card ≈ 62×95 mm. We size it large and deliberate so a hand of
// cards out-masses the pot — the M1 identity gate (cards' screen area ≥ 2× the chips').
export const CARD_W = 2.4;
export const CARD_H = CARD_W * 1.42; // ≈3.41 — the baraja ratio, a hair tightened for the felt
export const CARD_T = 0.055; // stock thickness — enough to throw a real contact edge
export const CARD_CORNER = 0.17; // rounded corners (Fournier radius)

export interface CardPose {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

/**
 * Evenly-spaced, centred x-positions for `n` cards in a row.
 * Pure (no THREE) → unit-testable. Ascending x, symmetric about 0.
 */
export function rowPositionsX(n: number, pitch: number): number[] {
  if (n <= 0) return [];
  const start = -((n - 1) * pitch) / 2;
  return Array.from({ length: n }, (_, i) => start + i * pitch);
}

// Community row: laid flat on the felt, centred, a touch back of dead-centre toward the board.
const COMMUNITY_PITCH = CARD_W + 0.26;
const FELT_REST_Y = CARD_T / 2 + 0.022; // rest on the baize, just proud of the brass reveal
const COMMUNITY_Z = -0.55;

/**
 * Community cards flat on the felt, centred, oriented to read toward the player camera
 * (top edge toward +Z). A hair of per-card yaw so the row is hand-dealt, not machined.
 */
export function communityLayout(ids: string[]): CardPose[] {
  const xs = rowPositionsX(ids.length, COMMUNITY_PITCH);
  return ids.map((id, i) => ({
    id,
    position: [xs[i], FELT_REST_Y, COMMUNITY_Z],
    // flat on the felt (front face up toward the camera); a hair of per-card yaw for life
    rotation: [-Math.PI / 2, 0, Math.sin(i * 1.7) * 0.025],
  }));
}

// Hole cards: the player's two cards, near their edge of the felt, lifted toward the
// camera and gently fanned so rank + suit read large — the protagonist of the POV shot.
const HOLE_Z = 3.35; // pulled back from 3.95 so the near edge no longer clips the POV/close frame bottom
const HOLE_PITCH = CARD_W * 0.73; // ≈1.75 — balanced held-pair: slight overlap, both ranks legible (operator-picked variant B)
const HOLE_LIFT = 0.42; // raise the far edge toward the player camera (eased from 0.46 to keep the pair fully framed)
const HOLE_FAN = 0.14; // a soft fan between the two (operator-picked variant B)

/** Optional per-render overrides for hole-pair composition (variant exploration; defaults = the baked constants). */
export interface HoleOpts {
  pitch?: number;
  fan?: number;
  z?: number;
  lift?: number;
}

/** The player's hole cards, fanned + lifted toward the player camera for legibility. */
export function holeLayout(ids: string[], opts: HoleOpts = {}): CardPose[] {
  const pitch = opts.pitch ?? HOLE_PITCH;
  const fan = opts.fan ?? HOLE_FAN;
  const z = opts.z ?? HOLE_Z;
  const lift = opts.lift ?? HOLE_LIFT;
  const n = ids.length;
  const xs = rowPositionsX(n, pitch);
  return ids.map((id, i) => {
    const dir = n === 1 ? 0 : i - (n - 1) / 2; // -0.5 / +0.5 for a pair
    return {
      id,
      position: [xs[i], FELT_REST_Y + 0.02, z],
      // lifted toward the player camera (front face up-and-toward +Z), gently fanned
      rotation: [-Math.PI / 2 + lift, 0, dir * fan],
    };
  });
}

// --- geometry helpers (THREE; validated by capture, not unit tests) ---

/** A centred rounded-rectangle Shape — shared by the card body and its face decal. */
export function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/**
 * The card BODY — an extruded rounded rect (cream stock) with a soft beveled edge, so the
 * card reads as a real physical object that catches light on its rim and casts a contact
 * shadow on the felt. Front cap ends at z ≈ t + bevel.
 */
export function cardBodyGeometry(w = CARD_W, h = CARD_H, r = CARD_CORNER, t = CARD_T): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(roundedRectShape(w, h, r), {
    depth: t,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 14,
  });
}

/**
 * The card FACE decal — the same rounded shape (so corners follow the card, never protrude)
 * with UVs remapped to [0,1] over the bounding box, so the real Fournier `.webp` fills the
 * card edge-to-edge. ShapeGeometry's default UVs are raw shape coords; we normalise them.
 */
export function cardFaceGeometry(w = CARD_W, h = CARD_H, r = CARD_CORNER, inset = 0.018): THREE.ShapeGeometry {
  const fw = w - inset * 2;
  const fh = h - inset * 2;
  const fr = Math.max(0.01, r - inset);
  const geo = new THREE.ShapeGeometry(roundedRectShape(fw, fh, fr), 14);
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) + fw / 2) / fw;
    uv[i * 2 + 1] = (pos.getY(i) + fh / 2) / fh;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
}

/** Z offset to float the face decal just proud of the body's front cap (incl. bevel). */
export const CARD_FACE_Z = CARD_T + 0.012 + 0.004;
