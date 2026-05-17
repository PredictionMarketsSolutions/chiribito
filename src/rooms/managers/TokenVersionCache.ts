/**
 * TokenVersionCache.ts
 * Lightweight Redis-backed cache of per-user JWT `tokenVersion`.
 *
 * Purpose: avoid the HTTP round-trip to the api-server on every Colyseus
 * `onAuth`. The api-server writes the current tokenVersion to Redis on
 * login / refresh / reset; the game server reads it here.
 *
 * Behaviour:
 *   - get(userId): returns the cached tokenVersion, or null on miss /
 *     Redis unavailable. NEVER throws.
 *   - set(userId, version): best-effort write with TTL. NEVER throws.
 *
 * If Redis is not configured (REDIS_URL empty) or the connection is down,
 * every call returns null/resolves silently — callers fall back to the
 * HTTP path. This keeps the system functional but slower without Redis.
 */

import logger from "../../config/logger";
import { getRedisClient } from "../../config/redis";
import { REDIS_PREFIX, AUTH_TOKEN_VERSION_CACHE_TTL_MS } from "../../config/env";

const keyFor = (userId: number): string => `${REDIS_PREFIX}:auth:tokenversion:${userId}`;

export const tokenVersionCache = {
  async get(userId: number): Promise<number | null> {
    try {
      const client = await getRedisClient();
      if (!client) return null;
      const raw = await client.get(keyFor(userId));
      if (raw === null) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    } catch (err) {
      logger.warn("tokenVersionCache.get failed", {
        userId,
        error: err instanceof Error ? err.message : String(err)
      });
      return null;
    }
  },

  async set(userId: number, version: number): Promise<void> {
    try {
      const client = await getRedisClient();
      if (!client) return;
      await client.set(keyFor(userId), String(version), {
        PX: AUTH_TOKEN_VERSION_CACHE_TTL_MS
      });
    } catch (err) {
      logger.warn("tokenVersionCache.set failed", {
        userId,
        version,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  },

  async invalidate(userId: number): Promise<void> {
    try {
      const client = await getRedisClient();
      if (!client) return;
      await client.del(keyFor(userId));
    } catch (err) {
      logger.warn("tokenVersionCache.invalidate failed", {
        userId,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }
};
