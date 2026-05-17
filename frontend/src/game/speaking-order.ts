/**
 * speaking-order.ts
 *
 * Derives the *why* behind whose turn it is, so the UI can show context
 * instead of just a name. Pure function — no DOM, fully unit-testable.
 *
 * Chiribito speaking order (server: GameEngine.pickFirstSpeakerForNewStreet):
 *   1. On preflop:  action opens on dealer+1 (no aggressor yet).
 *   2. On any post-preflop street:
 *        - if state.lastRaiser is still in hand and not folded → they open.
 *        - otherwise the first active player after the dealer opens.
 *   3. Mid-street: the current speaker is the next active player in
 *      seat order (handled server-side; we just report "tu turno" / etc.).
 *
 * This helper does NOT re-run the engine logic. It looks at the current
 * state snapshot and labels the current turn with the most likely reason.
 */

import { PHASES } from "./phases";

export type SpeakingReason =
  | "preflop_opener"
  | "last_raiser_opens"
  | "fallback_after_dealer"
  | "mid_street"
  | "none";

export interface SpeakingContext {
  reason: SpeakingReason;
  /** Short Spanish label for a chip / badge. Empty when reason === "none". */
  label: string;
  /** Long-form description for tooltips. */
  long: string;
}

interface Inputs {
  phase: string | undefined | null;
  currentTurn: string | undefined | null;
  lastRaiser: string | undefined | null;
  /**
   * Snapshot of in-hand player counts on the previous street, used to
   * tell "first speaker of new street" from "mid-street". We approximate
   * by comparing whether the speaker matches the last raiser at preflop.
   * For the live UI, the caller passes `streetJustChanged` directly.
   */
  streetJustChanged: boolean;
}

const NONE: SpeakingContext = { reason: "none", label: "", long: "" };

/** Returns the speaking-order context for the current turn. */
export function speakingContext(inputs: Inputs): SpeakingContext {
  const { phase, currentTurn, lastRaiser, streetJustChanged } = inputs;

  if (!currentTurn || !phase || phase === PHASES.WAITING) {
    return NONE;
  }

  if (!streetJustChanged) {
    return {
      reason: "mid_street",
      label: "Sigue la ronda",
      long: "La acción continúa por orden de mesa dentro de la calle actual."
    };
  }

  if (phase === PHASES.PREFLOP) {
    return {
      reason: "preflop_opener",
      label: "Abre el preflop",
      long: "Habla el primer jugador a la izquierda del repartidor — sin ciegas en Chiribito."
    };
  }

  if (lastRaiser && lastRaiser === currentTurn) {
    return {
      reason: "last_raiser_opens",
      label: "Abre por última subida",
      long: "Quien re-subió la calle anterior habla primero al revelarse la nueva carta — regla del Chiribito."
    };
  }

  return {
    reason: "fallback_after_dealer",
    label: "Abre por orden",
    long: "Nadie ha subido todavía o el último que subió ya no está activo — abre el primer jugador tras el repartidor."
  };
}
