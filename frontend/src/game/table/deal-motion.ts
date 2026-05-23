/**
 * Deal-motion constants + the deterministic resting-rotation helper for hole
 * cards. Pure and dependency-free (no pixi/gsap) so the "placed by hand" angle
 * can be unit tested without instantiating the Pixi TableScene.
 */

// One notch heavier than the previous power2.out: the card decelerates with
// more authority so it reads as having weight, not gliding to a frictionless
// stop. Shared by hole + board deal so the sense of weight is consistent.
export const DEAL_EASE = "power3.out";

// Hole-card resting rotation max: a card placed by a human hand never lands at
// exactly 0deg. Tiny, conservative. Radians.
export const HOLE_REST_ROT_MAX = (1.5 * Math.PI) / 180; // ~0.0262 rad = 1.5deg

// Extra rotation the card carries in flight, shed as it settles into its
// resting angle — a hand turning the card down onto the felt. Set to 0 to make
// the card slide in already at its resting angle (pure positional weight).
export const HOLE_DEAL_PRE_ROT = (1.0 * Math.PI) / 180; // ~0.0175 rad = 1.0deg

// Fixed per-(slot, card) lean factors in [-1, 1], multiplied by
// HOLE_REST_ROT_MAX. Deterministic (no Math.random at call time): the same
// seat/card always rests at the same slight angle, so re-renders and reconnects
// never jitter or jump. The two cards of a pair lean differently so a hand
// never looks mirror-perfect.
const LEAN_FACTORS: readonly (readonly [number, number])[] = [
  [-0.9, 0.5],
  [0.7, -1.0],
  [-0.5, 0.85],
  [1.0, -0.6],
  [-0.75, 0.95],
  [0.6, -0.8],
];

/**
 * Deterministic resting rotation (radians) for a hole card at
 * (visualSlot, cardIndex). Bounded by HOLE_REST_ROT_MAX. Pure: depends only on
 * its inputs.
 */
export function restingRotationFor(visualSlot: number, cardIndex: number): number {
  const seatIndex = ((visualSlot % LEAN_FACTORS.length) + LEAN_FACTORS.length) % LEAN_FACTORS.length;
  const seat = LEAN_FACTORS[seatIndex];
  const factor = seat[cardIndex % 2] ?? 0;
  return factor * HOLE_REST_ROT_MAX;
}
