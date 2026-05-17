/**
 * phase-indicator.ts
 *
 * Renders the 6-street progress chip + a human-readable label for the
 * current `state.phase`. Six dots, one per betting round:
 *   ●○○○○○ → preflop                  (round 1/6)
 *   ●●○○○○ → 1ª comunitaria revelada  (round 2/6)
 *   ●●●●●● → 5ª comunitaria revelada  (round 6/6, showdown next)
 *
 * Pure DOM mutation — no framework. Idempotent: calling render() with the
 * same phase twice in a row produces the same DOM (no flicker).
 */

import { phaseLabel, isInHandPhase, TOTAL_BETTING_ROUNDS } from "./phases";

interface Refs {
  /** Container for the dots (created lazily if needed). */
  progressEl: HTMLElement | null;
  /** Short label chip — e.g. "Calle 3/6 · 2ª comunitaria". */
  labelEl: HTMLElement | null;
}

const DOT_FILLED = "phase-dot is-filled";
const DOT_EMPTY = "phase-dot";

/**
 * Build the six dot elements inside `progressEl` once. Cheap to call
 * repeatedly — only mutates DOM when the dot count is wrong.
 */
function ensureDots(progressEl: HTMLElement): HTMLElement[] {
  const existing = Array.from(progressEl.querySelectorAll<HTMLElement>(".phase-dot"));
  if (existing.length === TOTAL_BETTING_ROUNDS) return existing;
  progressEl.innerHTML = "";
  const dots: HTMLElement[] = [];
  for (let i = 0; i < TOTAL_BETTING_ROUNDS; i++) {
    const dot = document.createElement("span");
    dot.className = DOT_EMPTY;
    dot.setAttribute("aria-hidden", "true");
    progressEl.appendChild(dot);
    dots.push(dot);
  }
  return dots;
}

/**
 * Update the phase indicator chip + dot row to reflect the given phase.
 * Safe to call with any string (unknown phases fall back to "—").
 */
export function renderPhaseIndicator(phase: string | undefined | null, refs: Refs): void {
  const info = phaseLabel(phase);

  if (refs.labelEl) {
    const text =
      info.streetNumber > 0
        ? `Calle ${info.streetNumber}/${TOTAL_BETTING_ROUNDS} · ${info.short}`
        : info.short;
    refs.labelEl.textContent = text;
    refs.labelEl.title = info.long;
  }

  if (refs.progressEl) {
    if (!isInHandPhase(phase)) {
      // Outside an active hand: clear all dots to visually communicate
      // "no street in progress".
      const dots = ensureDots(refs.progressEl);
      dots.forEach((dot) => { dot.className = DOT_EMPTY; });
      refs.progressEl.setAttribute("aria-label", "Sin mano en curso");
      return;
    }
    const dots = ensureDots(refs.progressEl);
    for (let i = 0; i < dots.length; i++) {
      dots[i].className = i < info.streetNumber ? DOT_FILLED : DOT_EMPTY;
    }
    refs.progressEl.setAttribute("aria-label", `Calle ${info.streetNumber} de ${TOTAL_BETTING_ROUNDS}`);
  }
}
