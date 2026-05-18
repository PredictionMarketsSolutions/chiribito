/**
 * Returns true when runtime-diagnostic instrumentation should be enabled.
 *
 * Source: URL has the `perf` search param (presence check — any value).
 *
 * Read once at boot. Does NOT auto-enable in Vite DEV mode (instrumentation
 * is opt-in via URL flag only) to avoid Heisenberg perturbation during
 * normal dev work.
 *
 * See docs/superpowers/specs/2026-05-18-chiribito-runtime-diagnostic-design.md.
 */
export function isPerfEnabled(): boolean {
  if (typeof window === "undefined" || !window.location) return false;
  const params = new URLSearchParams(window.location.search);
  return params.has("perf");
}
