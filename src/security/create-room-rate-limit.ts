/**
 * Rate limit for creating new rooms (client.create("my_room")).
 * Prevents a user from creating many rooms in a short time.
 * In-memory; resets on server restart.
 */

import logger from "../config/logger";

const COOLDOWN_MS = 60_000; // 1 minute between room creations per user
const lastCreateByUser = new Map<number, number>();

export function allowCreateRoom(userId: number): boolean {
  if (!Number.isFinite(userId)) return true;
  const last = lastCreateByUser.get(userId);
  if (last == null) return true;
  return Date.now() - last >= COOLDOWN_MS;
}

export function recordCreateRoom(userId: number): void {
  if (!Number.isFinite(userId)) return;
  lastCreateByUser.set(userId, Date.now());
  logger.debug("Create room rate limit: recorded", { userId });
}

export function getCreateRoomCooldownMs(): number {
  return COOLDOWN_MS;
}
