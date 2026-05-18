/**
 * Returns true when the player-facing debug HUD rows should be visible.
 *
 * Sources (any one is sufficient):
 *  - Vite dev mode (`import.meta.env.DEV === true`)
 *  - URL has the `debug` search param (presence check — any value)
 *
 * Read once at boot. Does not react to URL changes mid-session.
 *
 * See docs/superpowers/specs/2026-05-18-chiribito-slice-A2.0-sidebar-debug-design.md.
 */
export function isDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined" || !window.location) return false;
  const params = new URLSearchParams(window.location.search);
  return params.has("debug");
}
