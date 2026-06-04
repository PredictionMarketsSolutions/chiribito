/**
 * Pot pile renderer — paints the physical chip stacks (from `potChipLayout`) into a
 * centred layer on the felt. Repaints to match the current pot. DOM glue; the layout
 * maths is tested in chip-stack.test.ts.
 */
import { potChipLayout, type PotChip } from "./chip-stack";

const CHIP_THICKNESS = 5; // px of visible side wall per chip in a column

function paint(chip: PotChip): HTMLElement {
  const el = document.createElement("div");
  el.className = `pot-chip pot-chip--${chip.color}`;
  el.setAttribute("aria-hidden", "true");
  // x/y are offsets from the pile centre; z lifts the chip up its column.
  el.style.transform = `translate(${chip.x}px, ${chip.y - chip.z * CHIP_THICKNESS}px)`;
  // Paint order: lower rows (larger y) in front; within a column, higher chips in front.
  el.style.zIndex = String(Math.round((chip.y + 400) * 12 + chip.z));
  return el;
}

/** Render (or clear) the pot pile in `container` so it matches `amount`. */
export function renderPotPile(container: HTMLElement, amount: number): void {
  const layout = potChipLayout(amount);
  const sorted = [...layout].sort((a, b) => a.y - b.y || a.z - b.z);
  const frag = document.createDocumentFragment();
  for (const chip of sorted) frag.appendChild(paint(chip));
  container.replaceChildren(frag);
}
