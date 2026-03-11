/**
 * Pure helpers for Colyseus room state (schema → plain data).
 */

import type { RoomState, PlayerState } from "../types";

export function isPlayerState(value: unknown): value is PlayerState {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.sessionId === "string" &&
    typeof record.name === "string" &&
    typeof record.chips === "number" &&
    typeof record.currentBet === "number" &&
    typeof record.isFolded === "boolean" &&
    typeof record.seatIndex === "number"
  );
}

/** Normalize Colyseus ArraySchema or plain array to string[] */
export function schemaArrayToCards(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value as string[];
  const raw = value as { toArray?: () => string[]; length?: number; [i: number]: string };
  if (typeof raw.toArray === "function") return raw.toArray();
  if (typeof raw.length === "number" && raw.length >= 0) {
    const out: string[] = [];
    for (let i = 0; i < raw.length; i++) {
      if (typeof raw[i] === "string") out.push(raw[i]);
    }
    return out;
  }
  try {
    return Array.from(value as Iterable<string>);
  } catch {
    return [];
  }
}

export function getUserEntries(state: RoomState): PlayerState[] {
  const users = state?.users;
  if (!users) return [];
  if (users instanceof Map) return Array.from(users.values()).filter(isPlayerState);
  const iterableUsers = users as unknown as { values?: () => Iterable<PlayerState> };
  if (typeof iterableUsers.values === "function") {
    return Array.from(iterableUsers.values()).filter(isPlayerState);
  }
  const forEachUsers = users as unknown as { forEach?: (cb: (value: PlayerState) => void) => void };
  if (typeof forEachUsers.forEach === "function") {
    const results: PlayerState[] = [];
    forEachUsers.forEach((value) => {
      if (isPlayerState(value)) results.push(value);
    });
    return results;
  }
  return Object.values(users).filter(isPlayerState);
}
