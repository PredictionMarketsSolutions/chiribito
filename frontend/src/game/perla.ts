/**
 * La Perla detection — Sota (10) + 7 of the same suit is the strongest
 * pre-community combination in Chiribito. We surface it visually by adding
 * the `has-perla` class to the container that holds the two hand cards.
 *
 * CSS in style.css listens for `.has-perla` and `.is-perla` and applies the
 * legendary gold-glow + sparkle treatment.
 *
 * Source of truth for the deck is the game server (src/rooms/game/glossary.ts).
 * Mirror: Sota = "10", 7 = "7", suits = O/C/E/B.
 */

const PERLA_RANKS = new Set(["10", "7"]);

export function isPerlaPair(cards: string[] | readonly string[]): boolean {
  if (!cards || cards.length !== 2) return false;
  const [a, b] = cards;
  if (!a || !b || a.length < 2 || b.length < 2) return false;
  if (a.slice(-1) !== b.slice(-1)) return false;
  const rankA = a.slice(0, -1);
  const rankB = b.slice(0, -1);
  return PERLA_RANKS.has(rankA) && PERLA_RANKS.has(rankB) && rankA !== rankB;
}

export function markPerlaIfApplicable(container: HTMLElement | null, cards: string[] | readonly string[]): void {
  if (!container) return;
  if (isPerlaPair(cards)) {
    container.classList.add("has-perla");
  } else {
    container.classList.remove("has-perla");
  }
}
