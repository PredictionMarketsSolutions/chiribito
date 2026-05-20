import type { SuitCode } from "./types";

// Mirror of src/rooms/game/glossary.ts SUIT_CODES (no frontend mirror exists; keep in sync).
export const SUIT_CODES: SuitCode[] = ["O", "C", "E", "B"];
export const SUIT_NAMES_ES: Record<SuitCode, string> = { O: "Oros", C: "Copas", E: "Espadas", B: "Bastos" };

const SUIT_PATHS: Record<SuitCode, string> = {
  O: `<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/>`,
  C: `<path d="M7 5 H17 L15.3 11 A3.4 3.4 0 0 1 8.7 11 Z" stroke="currentColor" stroke-width="1.5"/><path d="M12 13 V18" stroke="currentColor" stroke-width="1.5"/><path d="M8.5 19 H15.5" stroke="currentColor" stroke-width="1.5"/>`,
  E: `<path d="M12 3 L12 14" stroke="currentColor" stroke-width="1.5"/><path d="M8.5 12.5 L15.5 12.5" stroke="currentColor" stroke-width="1.5"/><path d="M12 14 L12 18.5" stroke="currentColor" stroke-width="1.5"/>`,
  B: `<path d="M8 19 L14.5 9" stroke="currentColor" stroke-width="1.6"/><circle cx="16" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/>`,
};

/** Inline gold-line suit glyph (uses currentColor; size in px). */
export function suitGlyph(suit: SuitCode, sizePx = 24): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(sizePx));
  svg.setAttribute("height", String(sizePx));
  svg.setAttribute("fill", "none");
  svg.setAttribute("data-suit", suit);
  svg.innerHTML = SUIT_PATHS[suit];
  return svg;
}
