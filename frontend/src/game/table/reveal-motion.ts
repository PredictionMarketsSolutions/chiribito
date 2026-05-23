/**
 * Reveal-motion constants + the pure flip-state helper for community-card
 * reveals. Pure and dependency-free (no pixi/gsap) so the back->face turn curve
 * can be unit tested without instantiating the Pixi TableScene. Mirrors the
 * deal-motion.ts pattern.
 */

// Total back->face turn. Short on purpose: the reveal should feel inevitable,
// almost invisible -- a physical fact, not an "animation". Tuning range 0.30-0.32s.
export const FLIP_DURATION = 0.3; // seconds

// Smooth turn: accelerate into the edge, decelerate flat. Never bounce/elastic.
export const FLIP_EASE = "power2.inOut";

// Perceptual edge-on floor: the card never collapses to exactly 0 width (a 1px
// edge can shimmer / z-fight). It reads edge-on (very thin) but stays visible.
// Tuning range 0.04-0.06.
export const FLIP_MIN_WIDTH_FACTOR = 0.05;

export interface FlipState {
  /** Rendered-width multiplier in [FLIP_MIN_WIDTH_FACTOR, 1]. */
  widthFactor: number;
  /** False on the first half (back shown), true from the midpoint on (face shown). */
  showFront: boolean;
}

/**
 * Pure description of the flip at normalized progress p in [0, 1] (clamped).
 *   [0, 0.5):  back shown, width shrinks 1 -> FLIP_MIN_WIDTH_FACTOR
 *   p >= 0.5:  face shown, width grows FLIP_MIN_WIDTH_FACTOR -> 1
 * Depends only on its input.
 */
export function flipState(progress: number): FlipState {
  const p = progress < 0 ? 0 : progress > 1 ? 1 : progress;
  const floor = FLIP_MIN_WIDTH_FACTOR;
  if (p < 0.5) {
    const k = p / 0.5; // 0 -> 1 across the first half
    return { widthFactor: 1 - (1 - floor) * k, showFront: false };
  }
  const k = (p - 0.5) / 0.5; // 0 -> 1 across the second half
  return { widthFactor: floor + (1 - floor) * k, showFront: true };
}
