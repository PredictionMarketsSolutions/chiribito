/**
 * Centralized post-auth decision: if we have a stored Colyseus
 * reconnectionToken, attempt `client.reconnect(token)` first; otherwise (or
 * on reconnect failure) fall through to a `joinById` against the stored
 * lastRoomId; otherwise open the lobby.
 *
 * Used by both the reload-hydration path (frontend/src/main.ts hydration
 * IIFE) and the post-login path so they share a single source of truth.
 *
 * Order of attempts:
 *
 *   1. reconnectionToken present
 *        → `reconnect(token)`. If it resolves and `isJoined()` becomes true,
 *           we are back in the mesa with the SAME seat the server was holding
 *           via `allowReconnection(client, 60)`. No `onAuth` round-trip, no
 *           SESSION_EXISTS check.
 *        → If it throws (seat expired, room gone, network error), we clear
 *           the stale token and fall through.
 *
 *   2. lastRoomId present
 *        → `joinRoom(false, { mode: "joinById", roomId })`. This may still
 *           fail with SESSION_EXISTS if the previous seat is held but we no
 *           longer have a valid reconnect token; the existing `isJoined()`
 *           guard prevents leaving the user in a dead state.
 *        → If join fails, clear lastRoomId.
 *
 *   3. Open lobby (clean fallback).
 *
 * The previous design had each call site invoke openLobby() first and then
 * a separate auto-rejoin afterwards. Because openLobbyFlow() synchronously
 * calls onEnterLobby() — which clears lastRoomId — the rejoin attempt always
 * read `null`, silently breaking the recover-mesa-on-reload and
 * recover-mesa-on-login flows. Centralising the decision here guarantees the
 * recovery attempts run BEFORE any lobby transition.
 */

export type RecoverOrLobbyDeps = {
  /** Read the persisted Colyseus reconnection token (sessionStorage). */
  getReconnectionToken: () => string | null;
  /** Drop the persisted reconnection token after a failed attempt or when
   *  no recovery is possible. */
  clearReconnectionToken: () => void;
  /** Call `client.reconnect(token)` server-side and wire the returned Room
   *  through the same `applyPostJoinSetup` path a fresh join uses. Must
   *  throw on failure so the helper can fall through. */
  reconnect: (token: string) => Promise<void>;

  getLastRoomId: () => string | null;
  joinRoom: (
    forceReplace: boolean,
    opts: { mode: "joinById"; roomId: string },
  ) => Promise<void>;
  /** True iff a Colyseus room is currently joined. Required because the
   *  current roomSessionController.joinRoom swallows certain failures
   *  (SESSION_EXISTS, generic close codes) inside handleJoinError and resolves
   *  successfully even when no room was actually joined. Without this check we
   *  would leave the user in a dead state (both overlays hidden, no mesa).
   *  Also used as the truth source for the reconnect branch: if `reconnect`
   *  resolved but no room is mounted, treat as failure. */
  isJoined: () => boolean;
  openLobby: () => Promise<void>;
  clearLastRoomId: () => void;
  log: (msg: string) => void;
};

export async function recoverMesaOrOpenLobby(deps: RecoverOrLobbyDeps): Promise<void> {
  const reconnectToken = deps.getReconnectionToken();
  if (reconnectToken) {
    deps.log("Recovery: attempting Colyseus reconnect with stored token");
    try {
      await deps.reconnect(reconnectToken);
      if (deps.isJoined()) return;
      deps.log("Recovery: reconnect resolved without joining. Falling back.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      deps.log(`Recovery: reconnect failed (${msg}). Falling back.`);
    }
    // Either the seat expired or the room went away. Either way the token is
    // useless — never retry it in the joinById path below.
    deps.clearReconnectionToken();
  }

  const stored = deps.getLastRoomId();
  const lastRoomId = stored?.trim();
  if (lastRoomId) {
    deps.log(`Recovery: attempting auto-rejoin to mesa ${lastRoomId}`);
    try {
      await deps.joinRoom(false, { mode: "joinById", roomId: lastRoomId });
      if (deps.isJoined()) return;
      // joinRoom resolved but no room actually joined — server rejected
      // (e.g. SESSION_EXISTS while the previous seat is held by
      // allowReconnection and we had no reconnect token to use). Fall
      // through so the user lands in the lobby rather than a dead state.
      deps.log("Recovery: joinRoom resolved without joining. Falling back to lobby.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      deps.log(`Recovery: auto-rejoin failed (${msg}). Falling back to lobby.`);
    }
    deps.clearLastRoomId();
  }
  await deps.openLobby();
}
