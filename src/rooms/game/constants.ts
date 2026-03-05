// Timeouts configurables via environment variables
export const TURN_TIMEOUT = parseInt(process.env.TURN_TIMEOUT_MS || '60000', 10);
export const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '30000', 10);
export const HEARTBEAT_TIMEOUT = parseInt(process.env.HEARTBEAT_TIMEOUT_MS || '90000', 10);
export const ACTION_COOLDOWN = parseInt(process.env.ACTION_COOLDOWN_MS || '200', 10);

/** Delay between revealing each community card in all-in showdown (ms). */
export const ALLIN_REVEAL_DELAY_MS = parseInt(process.env.ALLIN_REVEAL_DELAY_MS || '1000', 10);
