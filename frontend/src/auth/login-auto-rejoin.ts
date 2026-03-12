/**
 * Post-login auto-rejoin: if user had a room id stored, try to join that room.
 * Testable in isolation.
 */

export type PostLoginAutoRejoinDeps = {
  getLastRoomId: () => string | null;
  joinRoom: (forceReplace: boolean, opts: { mode: "joinById"; roomId: string }) => Promise<void>;
  clearLastRoomId: () => void;
  setAuthMessage: (message: string, type?: "success" | "error" | "info") => void;
  log: (message: string) => void;
};

/**
 * After successful login: if we have a stored room id, attempt to rejoin that room.
 * On rejoin failure, clear stored room id and show lobby message.
 */
export function runPostLoginAutoRejoin(deps: PostLoginAutoRejoinDeps): void {
  const lastRoomId = deps.getLastRoomId();
  if (lastRoomId && lastRoomId.trim()) {
    deps.log(`Found previous room ${lastRoomId}, attempting auto-rejoin...`);
    deps.setAuthMessage("Login correcto. Recuperando tu mesa...", "info");
    deps
      .joinRoom(false, { mode: "joinById", roomId: lastRoomId.trim() })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        deps.log(`Auto-rejoin failed: ${msg}`);
        deps.clearLastRoomId();
        deps.setAuthMessage("Login correcto. Puedes unirte a una mesa desde el lobby.", "success");
      });
  } else {
    deps.setAuthMessage("Login correcto. Puedes unirte a la mesa.", "success");
  }
}
