/**
 * Maps logical seat indices (server) to visual DOM/Pixi slots (0..5) when the local
 * player is rotated to the front (TARGET_FRONT_INDEX).
 */

import type { RoomState, PlayerState } from "../types";
import { getUserEntries, isPlayerState } from "./room-state";

export const TOTAL_SEATS = 6;
export const TARGET_FRONT_INDEX = 3;

export type VisualSeatLayout = {
  seatShift: number;
  /** Player at each visual slot index (DOM order), or undefined if empty. */
  visualSeats: Array<PlayerState | undefined>;
  /** Logical seat index (0..5) shown at each visual slot. */
  visualSeatNumbers: number[];
  playersBySeat: Array<PlayerState | undefined>;
  dealerIndex: number;
};

export function computeVisualSeatLayout(
  state: RoomState,
  currentSessionId: string | null | undefined
): VisualSeatLayout {
  const entries = getUserEntries(state).filter(isPlayerState);
  const dealerIndex = typeof state?.dealerIndex === "number" ? state.dealerIndex : -1;

  const playersBySeat: Array<PlayerState | undefined> = Array(TOTAL_SEATS).fill(undefined);
  entries.forEach((player) => {
    if (Number.isFinite(player.seatIndex) && player.seatIndex >= 0 && player.seatIndex < TOTAL_SEATS) {
      playersBySeat[player.seatIndex] = player;
    }
  });

  let seatShift = 0;
  const myPlayer = entries.find((p) => p.sessionId === currentSessionId);
  if (myPlayer && Number.isFinite(myPlayer.seatIndex)) {
    seatShift = (TARGET_FRONT_INDEX - myPlayer.seatIndex + TOTAL_SEATS) % TOTAL_SEATS;
  }

  const visualSeats: Array<PlayerState | undefined> = Array(TOTAL_SEATS).fill(undefined);
  const visualSeatNumbers: number[] = Array(TOTAL_SEATS).fill(0);
  for (let logicalIndex = 0; logicalIndex < TOTAL_SEATS; logicalIndex += 1) {
    const visualIndex = (logicalIndex + seatShift) % TOTAL_SEATS;
    visualSeats[visualIndex] = playersBySeat[logicalIndex];
    visualSeatNumbers[visualIndex] = logicalIndex;
  }

  return { seatShift, visualSeats, visualSeatNumbers, playersBySeat, dealerIndex };
}
