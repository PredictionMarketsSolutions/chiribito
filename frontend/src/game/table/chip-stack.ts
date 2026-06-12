/**
 * Pot pile layout — turns a pot amount into a cluster of physical chip stacks for the
 * centre of the felt. Pure: the renderer (`pot-pile.ts`) paints what this returns.
 *
 * Chips are broken into denominations (greedy, capped per denomination so a huge pot
 * fills the centre instead of exploding), laid into monochrome columns of <= MAX_PER_STACK,
 * each column placed at a cluster cell. x/y are offsets from the pile centre (px); z is the
 * chip's height in its column.
 */

export interface PotChip {
  x: number;
  y: number;
  z: number;
  denom: number;
  color: string;
}

export const MAX_PER_STACK = 9;
export const MAX_STACKS = 9;
const CAP_PER_DENOM = 18;
const STACK_SPACING = 32;

const DENOMS: ReadonlyArray<{ value: number; color: string }> = [
  { value: 1000, color: "gold" },
  { value: 500, color: "night" },
  { value: 100, color: "green" },
  { value: 25, color: "burgundy" },
];

// A compact centred cluster (centre, then the 4 sides, then the 4 corners).
const CLUSTER: ReadonlyArray<{ gx: number; gy: number }> = [
  { gx: 0, gy: 0 },
  { gx: -1, gy: 0 },
  { gx: 1, gy: 0 },
  { gx: 0, gy: -1 },
  { gx: 0, gy: 1 },
  { gx: -1, gy: -1 },
  { gx: 1, gy: -1 },
  { gx: -1, gy: 1 },
  { gx: 1, gy: 1 },
];

export function potChipLayout(amount: number): PotChip[] {
  if (amount <= 0) return [];

  // 1) Greedy denomination breakdown, capped per denomination.
  const counts: { value: number; color: string; n: number }[] = [];
  let rem = Math.floor(amount);
  for (const d of DENOMS) {
    const n = Math.min(Math.floor(rem / d.value), CAP_PER_DENOM);
    rem -= n * d.value;
    if (n > 0) counts.push({ value: d.value, color: d.color, n });
  }

  // 2) Lay each denomination into monochrome columns at cluster cells.
  const chips: PotChip[] = [];
  let stackIdx = 0;
  for (const c of counts) {
    let left = c.n;
    while (left > 0 && stackIdx < MAX_STACKS) {
      const h = Math.min(left, MAX_PER_STACK);
      const cell = CLUSTER[stackIdx];
      const x = cell.gx * STACK_SPACING;
      const y = cell.gy * STACK_SPACING;
      for (let z = 0; z < h; z++) chips.push({ x, y, z, denom: c.value, color: c.color });
      left -= h;
      stackIdx++;
    }
  }
  return chips;
}
