import logger from "../config/logger";

export type TournamentStatsPayload = {
  championUserId: number;
  participantUserIds: number[];
};

export async function reportTournamentGameEnded(
  apiUrl: string,
  internalSecret: string,
  payload: TournamentStatsPayload
): Promise<void> {
  if (!apiUrl || !internalSecret) {
    logger.warn("Stats report skipped: missing API_URL or INTERNAL_API_SECRET");
    return;
  }

  try {
    const res = await fetch(`${apiUrl}/api/internal/game-ended`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": internalSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logger.warn("Stats report failed", { status: res.status, body: text });
      return;
    }

    logger.info("Stats report succeeded", {
      championUserId: payload.championUserId,
      participants: payload.participantUserIds.length,
    });
  } catch (error) {
    logger.warn("Stats report error", { error: String(error) });
  }
}

