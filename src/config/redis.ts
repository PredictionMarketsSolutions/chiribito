/**
 * Shared Redis client for the game server.
 *
 * One connection per process, lazily created on first use. Returns null
 * if REDIS_URL is not configured — callers must handle that.
 */

import { createClient, type RedisClientType } from "redis";
import logger from "./logger";
import { REDIS_URL } from "./env";

let client: RedisClientType | null = null;
let connecting: Promise<RedisClientType | null> | null = null;

export function getRedisClient(): Promise<RedisClientType | null> {
  if (!REDIS_URL) return Promise.resolve(null);
  if (client?.isReady) return Promise.resolve(client);
  if (connecting) return connecting;

  connecting = (async () => {
    try {
      const c: RedisClientType = createClient({ url: REDIS_URL });
      c.on("error", (err) => {
        logger.error("Redis client error", { error: err instanceof Error ? err.message : String(err) });
      });
      await c.connect();
      client = c;
      logger.info("Redis client connected");
      return client;
    } catch (err) {
      logger.error("Failed to connect Redis client", {
        error: err instanceof Error ? err.message : String(err)
      });
      client = null;
      return null;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
}

export async function closeRedisClient(): Promise<void> {
  if (client) {
    try {
      await client.quit();
    } catch (err) {
      logger.warn("Error closing Redis client", { error: String(err) });
    } finally {
      client = null;
    }
  }
}
