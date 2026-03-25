/**
 * Shared card image URLs for DOM (img) and Pixi textures.
 */

export const CARD_BACK_URL = "/cards/back_logo.png";

const SUIT_NAME_MAP: Record<string, string> = {
  O: "ORO",
  C: "COPAS",
  E: "ESPADA",
  B: "BASTOS",
};

/** Face card id e.g. "7O" → public URL; undefined/empty → back. */
export function getCardTextureUrl(card: string | undefined | null): string {
  if (!card || card.length < 2) return CARD_BACK_URL;
  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  const suitName = SUIT_NAME_MAP[suit] ?? suit;
  return `/cards/${rank} DE ${suitName}.webp`;
}

export function listAllCardImageUrls(): string[] {
  const suits = ["O", "C", "E", "B"];
  const ranks = ["1", "7", "8", "9", "10", "11", "12"];
  const sources = [CARD_BACK_URL];
  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      const suitName = SUIT_NAME_MAP[suit] ?? suit;
      sources.push(`/cards/${rank} DE ${suitName}.webp`);
    });
  });
  return sources;
}
