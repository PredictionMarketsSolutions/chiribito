/**
 * Centralized post-auth decision: if we have a stored room id, attempt to
 * rejoin that mesa directly; otherwise (or on rejoin failure) open the lobby.
 *
 * Used by both the reload-hydration path (frontend/src/main.ts hydration IIFE)
 * and the post-login path (loginFlow.runAutoRejoin) so they share a single
 * source of truth.
 *
 * The previous design had each call site invoke openLobby() first and then
 * runPostLoginAutoRejoin afterwards. Because openLobbyFlow() synchronously
 * calls onEnterLobby() — which clears lastRoomId — the rejoin attempt always
 * read `null`, silently breaking the recover-mesa-on-reload and the
 * recover-mesa-on-login flows. Centralising the decision here guarantees the
 * rejoin path is tried BEFORE any lobby transition.
 */

export type RecoverOrLobbyDeps = {
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
   *  Move 1.5 (Colyseus reconnectionToken) will replace the joinById path with
   *  a proper reconnect; until then this guard prevents the dead state. */
  isJoined: () => boolean;
  openLobby: () => Promise<void>;
  clearLastRoomId: () => void;
  log: (msg: string) => void;
};

export async function recoverMesaOrOpenLobby(deps: RecoverOrLobbyDeps): Promise<void> {
  const stored = deps.getLastRoomId();
  const lastRoomId = stored?.trim();
  if (lastRoomId) {
    deps.log(`Recovery: attempting auto-rejoin to mesa ${lastRoomId}`);
    try {
      await deps.joinRoom(false, { mode: "joinById", roomId: lastRoomId });
      if (deps.isJoined()) return;
      // joinRoom resolved but no room actually joined — server rejected
      // (e.g. SESSION_EXISTS while the previous seat is held by
      // allowReconnection). Fall through to clearLastRoomId + openLobby so
      // the user lands in the lobby rather than a dead state.
      deps.log("Recovery: joinRoom resolved without joining. Falling back to lobby.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      deps.log(`Recovery: auto-rejoin failed (${msg}). Falling back to lobby.`);
    }
    deps.clearLastRoomId();
  }
  await deps.openLobby();
}
