/**
 * Chip motion — pure physics profiles for a poker chip sliding across the felt.
 *
 * No DOM, no time, no side effects: the rAF driver (`chip-fly.ts`) samples these per
 * frame. Tuned for a PHYSICAL, premium read — felt friction + a small damped settle —
 * never an arcade bounce.
 */

export interface Point {
  x: number;
  y: number;
}

export interface ChipFlightState {
  x: number;
  y: number;
  scale: number;
  rotate: number;
}

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

/** Slide with felt friction: a cubic ease-out — a quick push that decelerates into rest. */
export function slideEase(t: number): number {
  const u = clamp01(t);
  return 1 - Math.pow(1 - u, 3);
}

/**
 * Settle with a small damped overshoot — an ease-out-back gentled (c1 = 1.2 vs the
 * classic 1.70158) so the chip lands, nudges just past, and settles. Subtle, not springy.
 */
export function dampedSettle(t: number): number {
  const u = clamp01(t);
  const c1 = 1.2;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
}

/**
 * A chip sliding `from` → `to`: the position carries inertia and a settle overshoot
 * (it drifts a hair past the pot then beds in), with a subtle mid-flight lift that lands
 * flat. Pure; the driver multiplies these into a CSS transform each frame.
 */
export function chipFlightTransform(
  t: number,
  from: Point,
  to: Point,
  opts: { lift?: number; spin?: number } = {}
): ChipFlightState {
  const u = clamp01(t);
  const p = dampedSettle(u); // slide + inertial overshoot + settle, all in one profile
  const lift = opts.lift ?? 0.06;
  const spin = opts.spin ?? 0;
  const arc = Math.sin(Math.PI * u); // 0 at both ends, 1 at mid-flight
  return {
    x: from.x + (to.x - from.x) * p,
    y: from.y + (to.y - from.y) * p,
    scale: 1 + lift * arc,
    rotate: spin * arc,
  };
}

/**
 * How many chips fly for a wagered amount: one chip, plus one per `step` wagered, capped
 * at `max`. Bigger bets feel heavier without ever spraying — premium, never a jackpot.
 */
export function chipBurstCount(amount: number, opts: { max?: number; step?: number } = {}): number {
  if (amount <= 0) return 0;
  const max = opts.max ?? 5;
  const step = opts.step ?? 150;
  return Math.min(max, 1 + Math.floor(amount / step));
}
