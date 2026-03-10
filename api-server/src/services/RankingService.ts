import type Redis from "ioredis";
import type { Repository } from "typeorm";
import { User } from "../models/User";
import logger from "../config/logger";

export type RankingEntry = {
  id: number;
  username: string;
  gamesPlayed: number;
  gamesWon: number;
};

const CACHE_KEY = "cache:ranking:top-winners:v1";
const CACHE_TTL_SECONDS = 60;

export async function getTopWinners(
  redisClient: Redis | null,
  userRepository: Repository<User>
): Promise<RankingEntry[]> {
  if (redisClient) {
    try {
      const cached = await redisClient.get(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed as RankingEntry[];
        }
      }
    } catch (error) {
      logger.warn("Failed to read ranking from Redis cache", { error: String(error) });
    }
  }

  const topUsers = await userRepository
    .createQueryBuilder("user")
    .select(["user.id", "user.username", "user.gamesPlayed", "user.gamesWon"])
    .where("user.gamesWon > 0")
    .orderBy("user.gamesWon", "DESC")
    .addOrderBy("user.gamesPlayed", "DESC")
    .limit(10)
    .getMany();

  const payload: RankingEntry[] = topUsers.map((u) => ({
    id: u.id,
    username: u.username,
    gamesPlayed: u.gamesPlayed ?? 0,
    gamesWon: u.gamesWon ?? 0,
  }));

  if (redisClient) {
    try {
      await redisClient.set(CACHE_KEY, JSON.stringify(payload), "EX", CACHE_TTL_SECONDS);
    } catch (error) {
      logger.warn("Failed to write ranking to Redis cache", { error: String(error) });
    }
  }

  return payload;
}

