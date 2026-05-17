/**
 * Configuración de entorno centralizada.
 * Usar este módulo en MyRoom, constants (timeouts), app.config (JWT) y auth.
 * Validación al arranque solo si DISABLE_ENV_VALIDATION !== "true".
 */

const getEnv = (key: string, defaultValue: string): string =>
  (process.env[key] ?? defaultValue).trim();

const getEnvInt = (key: string, defaultValue: number): number => {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return defaultValue;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : defaultValue;
};

const getEnvBool = (key: string, defaultValue: boolean): boolean => {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return defaultValue;
  return raw.toLowerCase() === "true" || raw === "1";
};

/** API base URL (game server → api server). */
export const API_URL = getEnv("API_URL", "http://localhost:3000");

/** JWT secret para validar tokens. */
export const JWT_SECRET = getEnv("JWT_SECRET", "");

/** Timeout del turno en ms. */
export const TURN_TIMEOUT_MS = getEnvInt("TURN_TIMEOUT_MS", 60_000);

/** Intervalo de heartbeat en ms. */
export const HEARTBEAT_INTERVAL_MS = getEnvInt("HEARTBEAT_INTERVAL_MS", 30_000);

/** Timeout de heartbeat en ms (desconectar si no responde). Por defecto 3 min. */
export const HEARTBEAT_TIMEOUT_MS = getEnvInt("HEARTBEAT_TIMEOUT_MS", 180_000);

/** Cooldown por defecto entre acciones en ms. */
export const ACTION_COOLDOWN_MS = getEnvInt("ACTION_COOLDOWN_MS", 200);

/** Delay entre revelar cada carta comunitaria en all-in showdown (ms). */
export const ALLIN_REVEAL_DELAY_MS = getEnvInt("ALLIN_REVEAL_DELAY_MS", 1_000);

/** Timeout para peticiones de autenticación al API (ms). */
export const AUTH_REQUEST_TIMEOUT_MS = getEnvInt("AUTH_REQUEST_TIMEOUT_MS", 8_000);

/**
 * If true, clients that miss their heartbeat for HEARTBEAT_TIMEOUT_MS are
 * forcibly disconnected from the room. If false, only a warning is logged
 * (the legacy behaviour from the heredado repo).
 *
 * Default: true. Mobile clients on background pause their heartbeat via
 * the frontend, so the timeout (default 3 min) is generous enough.
 */
export const HEARTBEAT_DISCONNECT_ENABLED = getEnvBool("HEARTBEAT_DISCONNECT_ENABLED", true);

/** Redis URL (optional in dev; required in prod for rate limits and session store). */
export const REDIS_URL = getEnv("REDIS_URL", "");

/** Redis key prefix for any chiribito-namespaced keys. */
export const REDIS_PREFIX = getEnv("REDIS_PREFIX", "chiribito");

/**
 * If true (default), the game server consults a Redis-backed cache of
 * `tokenVersion` per user before falling back to the api-server HTTP
 * call in `onAuth`. When Redis is not configured this flag has no effect.
 */
export const AUTH_TOKEN_VERSION_CACHE_ENABLED = getEnvBool("AUTH_TOKEN_VERSION_CACHE_ENABLED", true);

/** TTL for the cached tokenVersion entries (ms). */
export const AUTH_TOKEN_VERSION_CACHE_TTL_MS = getEnvInt("AUTH_TOKEN_VERSION_CACHE_TTL_MS", 60_000);

/** Validar variables críticas (opcional; tests pueden usar DISABLE_ENV_VALIDATION). */
export function validateEnv(): { ok: boolean; missing: string[] } {
  if (process.env.DISABLE_ENV_VALIDATION === "true") {
    return { ok: true, missing: [] };
  }
  const missing: string[] = [];
  if (!JWT_SECRET || JWT_SECRET === "dev-secret-change-in-production") {
    // Solo advertir en prod; en dev es común no tenerlo
    if (process.env.NODE_ENV === "production") missing.push("JWT_SECRET");
  }
  return { ok: missing.length === 0, missing };
}
