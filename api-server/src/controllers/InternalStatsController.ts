import type { Request, Response } from "express";
import type Redis from "ioredis";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { auditWrite, AuditEventType } from "../services/auditLog";
import logger from "../config/logger";

type GameEndedPayload = {
  championUserId: number;
  participantUserIds: number[];
};

function isFiniteInt(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
}

function getInternalSecretFromReq(req: Request): string {
  const header = req.header("x-internal-secret");
  return typeof header === "string" ? header : "";
}

export class InternalStatsController {
  constructor(private redisClient: Redis | null) {}

  async gameEnded(req: Request, res: Response): Promise<void> {
    const expectedSecret = process.env.INTERNAL_API_SECRET || "";
    const providedSecret = getInternalSecretFromReq(req);

    if (!expectedSecret || providedSecret !== expectedSecret) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = (req.body || {}) as Partial<GameEndedPayload>;
    const championUserId = body.championUserId;
    const participantUserIds = Array.isArray(body.participantUserIds) ? body.participantUserIds : [];

    if (!isFiniteInt(championUserId) || participantUserIds.length === 0) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }

    const normalizedParticipants = Array.from(
      new Set(participantUserIds.filter(isFiniteInt))
    );

    if (normalizedParticipants.length === 0) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }

    const now = new Date();

    await AppDataSource.transaction(async (manager) => {
      // Increment played for everyone who participated
      await manager
        .createQueryBuilder()
        .update(User)
        .set({
          gamesPlayed: () => `"games_played" + 1`,
          lastPlayedAt: now,
        })
        .whereInIds(normalizedParticipants)
        .execute();

      // Increment wins for champion (if in participants or even if not, still update)
      await manager
        .createQueryBuilder()
        .update(User)
        .set({
          gamesWon: () => `"games_won" + 1`,
          lastPlayedAt: now,
        })
        .where("id = :id", { id: championUserId })
        .execute();
    });

    // Invalidate cached ranking
    if (this.redisClient) {
      try {
        await this.redisClient.del("cache:ranking:top-winners:v1");
      } catch (error) {
        logger.warn("Failed to invalidate ranking cache", { error: String(error) });
      }
    }

    void auditWrite({
      eventType: AuditEventType.TOURNAMENT_REPORTED,
      userId: championUserId,
      payload: { participantCount: normalizedParticipants.length },
      req
    });

    res.json({ ok: true });
  }
}

