/**
 * phases.ts (frontend)
 *
 * Mirror of `src/rooms/game/glossary.ts` PHASES on the client side.
 * Keep this file in sync if you add or rename phases server-side — there
 * is no automatic codegen yet. The values MUST match the strings the
 * Colyseus server writes into `MesaState.phase`.
 *
 * Source of truth: `src/rooms/game/glossary.ts` on the game server.
 */

export const PHASES = {
  WAITING: "waiting",
  PREFLOP: "preflop",
  CARD_1:  "card1",
  CARD_2:  "card2",
  CARD_3:  "card3",
  CARD_4:  "card4",
  CARD_5:  "card5"
} as const;

export type GamePhase = (typeof PHASES)[keyof typeof PHASES];

export const TOTAL_BETTING_ROUNDS = 6;

export interface PhaseLabel {
  /** Short label for a chip, e.g. "Preflop" / "Calle 2 / 6". */
  short: string;
  /** Long label for tooltips / explainers, e.g. "Primera carta comunitaria". */
  long: string;
  /**
   * Street number 1..6 within a hand (preflop = 1, card1 = 2 ... card5 = 6),
   * or 0 when no hand is in progress.
   */
  streetNumber: number;
}

const LABELS: Record<string, PhaseLabel> = {
  [PHASES.WAITING]: { short: "Esperando",     long: "Esperando jugadores", streetNumber: 0 },
  [PHASES.PREFLOP]: { short: "Preflop",       long: "Sin comunitarias — ronda inicial", streetNumber: 1 },
  [PHASES.CARD_1]:  { short: "1ª comunitaria", long: "Primera carta comunitaria revelada", streetNumber: 2 },
  [PHASES.CARD_2]:  { short: "2ª comunitaria", long: "Segunda carta comunitaria revelada", streetNumber: 3 },
  [PHASES.CARD_3]:  { short: "3ª comunitaria", long: "Tercera carta comunitaria revelada", streetNumber: 4 },
  [PHASES.CARD_4]:  { short: "4ª comunitaria", long: "Cuarta carta comunitaria revelada", streetNumber: 5 },
  [PHASES.CARD_5]:  { short: "5ª comunitaria", long: "Quinta y última carta — showdown próximo", streetNumber: 6 }
};

const FALLBACK: PhaseLabel = { short: "—", long: "Fase desconocida", streetNumber: 0 };

/** Human-readable info for the current `phase` string. Never throws. */
export function phaseLabel(phase: string | undefined | null): PhaseLabel {
  if (!phase) return FALLBACK;
  return LABELS[phase] ?? FALLBACK;
}

/**
 * Returns true when the given phase is a real in-hand betting round
 * (preflop or any of the five card phases). Used to decide whether the
 * progress indicator should be visible.
 */
export function isInHandPhase(phase: string | undefined | null): boolean {
  if (!phase) return false;
  return phase !== PHASES.WAITING && phase in LABELS;
}
