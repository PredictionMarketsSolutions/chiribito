/**
 * Room disconnect helper so logout/invalidation always leaves the Colyseus room.
 * Extracted for testability.
 */

export type RoomLike = { leave: () => void } | null;

export function disconnectRoom(room: RoomLike): void {
  if (room) room.leave();
}
