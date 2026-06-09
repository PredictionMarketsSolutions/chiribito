/**
 * Pot delivery — the end-of-hand beat: the pot slides from the centre to the winner,
 * then the pile clears. Glue that reuses the tested chip-fly driver + chip-stack layout
 * (colours/count derived from the pot), so the mesa "tells the story" of the hand.
 */
import { flyChips } from "./chip-fly";
import { potChipLayout } from "./chip-stack";
import type { Point } from "./chip-motion";

export interface DeliverOptions {
  reducedMotion?: boolean;
  durationMs?: number;
  staggerMs?: number;
}

/** Fly the pot's chips from `from` (centre) to `to` (winner seat), then clear `pileEl`. */
export async function deliverPotToWinner(
  surface: HTMLElement,
  pileEl: HTMLElement,
  from: Point,
  to: Point,
  amount: number,
  opts: DeliverOptions = {}
): Promise<void> {
  if (amount <= 0) return;
  const layout = potChipLayout(amount);
  const colors = [...new Set(layout.map((c) => c.color))];
  const count = Math.min(16, Math.max(5, layout.length));
  await flyChips(surface, from, to, {
    count,
    colors,
    durationMs: opts.durationMs ?? 640,
    staggerMs: opts.staggerMs ?? 34,
    reducedMotion: opts.reducedMotion,
  });
  pileEl.replaceChildren();
}
