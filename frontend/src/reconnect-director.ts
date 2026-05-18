/**
 * Move 2 — Reconnect Director.
 *
 * Single canonical entry-point for client-side reconnect. Owns the retry
 * loop, idempotency (a second `requestReconnect` while a loop is running
 * is a no-op) and a monotonic epoch so stale resolves from a previous
 * loop do not mutate state.
 *
 * Three trigger sources call `requestReconnect` today:
 *   - `room.onLeave` (transient close codes) via room-leave-handler
 *   - heartbeat `onTimeout` (set in main.ts startClientHeartbeat opts)
 *   - `visibilitychange` resume with `hadRoomWhenBackgrounded` (global-lifecycle)
 *
 * The director funnels them through a single loop that calls
 * `attemptReconnect` once per iteration. `attemptReconnect` does the
 * actual `client.reconnect(token)` (or joinRoom fallback) and per-attempt
 * timeout. Backoff schedule and degradation live there too.
 */

import {
  attemptReconnect,
  type AttemptReconnectDeps,
  DEFAULT_MAX_RECONNECT_ATTEMPTS,
} from "./connection";

export type ReconnectDirectorDeps = Omit<
  AttemptReconnectDeps,
  "getReconnectAttempts" | "setReconnectAttempts" | "maxAttempts"
> & {
  /** Notified each time the director transitions. Used by the banner
   *  controller to surface progress; tests can assert phase ordering. */
  onAttemptChange?: (state: {
    attempt: number;
    max: number;
    phase: "idle" | "trying" | "degraded";
  }) => void;
  maxAttempts?: number;
};

export type ReconnectDirector = {
  /** Idempotent: if a loop is already running, no-op. */
  requestReconnect: () => Promise<void>;
  /** True when the loop is in flight. */
  isRunning: () => boolean;
};

export function createReconnectDirector(deps: ReconnectDirectorDeps): ReconnectDirector {
  let attempts = 0;
  let running = false;
  let epoch = 0;
  const max = deps.maxAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS;

  const notify = (phase: "idle" | "trying" | "degraded") =>
    deps.onAttemptChange?.({ attempt: attempts, max, phase });

  async function loop(): Promise<void> {
    // Tournament-ended short-circuit BEFORE notifying "trying" so the banner
    // never flashes for a torneo that already ended.
    if (deps.getTournamentEnded()) {
      deps.log("Director: tournament ended, skipping reconnect.");
      return;
    }

    const myEpoch = ++epoch;
    running = true;
    attempts = 0;
    notify("trying");
    try {
      while (true) {
        if (myEpoch !== epoch) {
          deps.log(`Director: epoch ${myEpoch} stale, aborting.`);
          return;
        }
        if (deps.getConnectionState() === "connected") {
          deps.log("Director: already connected, exiting loop.");
          attempts = 0;
          notify("idle");
          return;
        }
        if (deps.getTournamentEnded()) {
          // Tournament ended mid-flight; bail silently. Banner stays in
          // its last state (caller is being torn down anyway).
          return;
        }
        if (attempts >= max) {
          deps.log("Director: max attempts exhausted, degrading to lobby.");
          deps.clearReconnectionToken();
          deps.degradeToLobby("Conexión perdida. Vuelve al lobby.");
          notify("degraded");
          return;
        }
        const before = attempts;
        await attemptReconnect({
          ...deps,
          getReconnectAttempts: () => attempts,
          setReconnectAttempts: (n) => {
            attempts = n;
            notify(attempts >= max ? "degraded" : "trying");
          },
          maxAttempts: max,
        });
        if (deps.getConnectionState() === "connected") {
          attempts = 0;
          notify("idle");
          return;
        }
        if (attempts === before) {
          // attemptReconnect returned without incrementing — its own
          // tournament-ended or standalone-terminal branch fired. Stop.
          return;
        }
      }
    } finally {
      running = false;
    }
  }

  return {
    requestReconnect: async () => {
      if (running) {
        deps.log("Director: requestReconnect ignored (loop already running).");
        return;
      }
      await loop();
    },
    isRunning: () => running,
  };
}
