/**
 * Constantes de tiempo del juego.
 * Valores leídos desde config/env (centralizado).
 */

import {
  TURN_TIMEOUT_MS,
  HEARTBEAT_INTERVAL_MS,
  HEARTBEAT_TIMEOUT_MS,
  ACTION_COOLDOWN_MS,
  ALLIN_REVEAL_DELAY_MS as ALLIN_REVEAL_MS_FROM_ENV,
} from "../../config/env";

export const TURN_TIMEOUT = TURN_TIMEOUT_MS;
export const HEARTBEAT_INTERVAL = HEARTBEAT_INTERVAL_MS;
export const HEARTBEAT_TIMEOUT = HEARTBEAT_TIMEOUT_MS;
export const ACTION_COOLDOWN = ACTION_COOLDOWN_MS;

/** Delay between revealing each community card in all-in showdown (ms). */
export const ALLIN_REVEAL_DELAY_MS = ALLIN_REVEAL_MS_FROM_ENV;
