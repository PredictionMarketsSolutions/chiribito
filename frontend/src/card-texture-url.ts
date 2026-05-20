/**
 * Shared card image URLs for DOM (img) and Pixi textures.
 *
 * Source of truth for the deck is the game server (src/rooms/game/glossary.ts).
 * The values mirrored here MUST match it:
 *   suits: O / C / E / B
 *   ranks: 5, 6, 7, 10 (Sota), 11 (Caballo), 12 (Rey), 1 (As)
 */

// Clean, unbranded premium back — keeps CHIRIBITO branding off the felt
// (it lives in the lobby/menus/overlays instead). SVG = crisp at any DPR.
export const CARD_BACK_URL = "/cards/back-clean.svg";

const SUIT_NAME_MAP: Record<string, string> = {
  O: "ORO",
  C: "COPAS",
  E: "ESPADA",
  B: "BASTOS",
};

const RANK_CODES: readonly string[] = ["5", "6", "7", "10", "11", "12", "1"];
const SUIT_CODES: readonly string[] = ["O", "C", "E", "B"];

/** Face card id e.g. "7O" → public URL; undefined/empty → back. */
export function getCardTextureUrl(card: string | undefined | null): string {
  if (!card || card.length < 2) return CARD_BACK_URL;
  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  const suitName = SUIT_NAME_MAP[suit] ?? suit;
  return `/cards/${rank} DE ${suitName}.webp`;
}

export function listAllCardImageUrls(): string[] {
  const sources = [CARD_BACK_URL];
  SUIT_CODES.forEach((suit) => {
    RANK_CODES.forEach((rank) => {
      const suitName = SUIT_NAME_MAP[suit] ?? suit;
      sources.push(`/cards/${rank} DE ${suitName}.webp`);
    });
  });
  return sources;
}
