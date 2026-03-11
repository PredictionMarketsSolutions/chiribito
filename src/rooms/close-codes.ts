/**
 * Close codes for room leave/kick.
 * Colyseus 0.17 reserves 4000–4010; we use 4011+ for app-specific codes.
 */
export const CUSTOM_SESSION_REPLACED = 4011;
export const CUSTOM_REBUY_TIMEOUT = 4012;
/** Mesa cerrada por fin de partida (único ganador); el cliente no debe reconectar. */
export const CUSTOM_GAME_END = 4013;
