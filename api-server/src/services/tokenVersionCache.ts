/**
 * tokenVersionCache.ts (api-server side)
 *
 * Mirror of the game server's TokenVersionCache. The api-server is the
 * authoritative writer; the game server only reads. Whenever a user's
 * `tokenVersion` changes (login, refresh, reset-password, register) or
 * we observe a still-valid token (validate), we publish it here so the
 * game server can skip the HTTP round-trip in Colyseus `onAuth`.
 *
 * Never throws — Redis is best-effort. If it's down, callers continue
 * normally and the game server falls back to HTTP.
 */

import type Redis from "ioredis";
import logger from "../config/logger";

const TTL_MS = parseInt(process.env.AUTH_TOKEN_VERSION_CACHE_TTL_MS || "60000", 10);
const PREFIX = (process.env.REDIS_PREFIX || "chiribito") + ":auth:tokenversion:";

let redisClient: Redis | null = null;

export function setRedisClient(client: Redis | null): void {
  redisClient = client;
}

const keyFor = (userId: number): string => `${PREFIX}${userId}`;

export async function publishTokenVersion(userId: number, version: number): Promise<void> {
  if (!redisClient) return;
  try {
    await redisClient.set(keyFor(userId), String(version), "PX", TTL_MS);
  } catch (err) {
    logger.warn("tokenVersionCache.publish failed", {
      userId,
      version,
      error: err instanceof Error ? err.message : String(err)
    });
  }
}

export async function invalidateTokenVersion(userId: number): Promise<void> {
  if (!redisClient) return;
  try {
    await redisClient.del(keyFor(userId));
  } catch (err) {
    logger.warn("tokenVersionCache.invalidate failed", {
      userId,
      error: err instanceof Error ? err.message : String(err)
    });
  }
}
