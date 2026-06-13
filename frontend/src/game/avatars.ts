/**
 * avatars.ts
 *
 * Pure helper for castizo avatar key → emoji glyph resolution.
 * No DOM access — testable in Vitest without jsdom.
 *
 * Avatar keys are emitted by the game server (Player.avatar, a @type("string") field).
 * Unknown or empty keys safely fall back to the neutral default glyph.
 *
 * Phase 6: provisional emoji glyphs. Final mascot art provided by operator at SC4.
 */

/**
 * Map of avatar keys to their provisional emoji/glyph representations.
 * Mascot keys "pato" and "toro" are canonical; all other keys fall back to "default".
 * Any non-empty string not in this map resolves to AVATAR_GLYPHS.default.
 */
export const AVATAR_GLYPHS: Record<string, string> = {
  pato: "🦆",
  toro: "🐂",
  // neutral default for non-mascot bots (manola, chato, paqui, garrido, etc.)
  default: "♟",
};

/**
 * Resolve an avatar key to a display glyph.
 *
 * @param key - The avatar key from PlayerState.avatar (e.g. "pato", "toro", "manola", "")
 * @returns A non-empty string glyph. Unknown or empty keys return AVATAR_GLYPHS.default.
 *
 * @example
 * resolveAvatarGlyph("pato")    // "🦆"
 * resolveAvatarGlyph("toro")    // "🐂"
 * resolveAvatarGlyph("garrido") // "♟"  (neutral default)
 * resolveAvatarGlyph("")        // "♟"  (empty key → neutral default)
 */
export function resolveAvatarGlyph(key: string): string {
  return AVATAR_GLYPHS[key] ?? AVATAR_GLYPHS["default"];
}
