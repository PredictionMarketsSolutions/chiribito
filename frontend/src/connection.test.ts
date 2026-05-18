/**
 * Tests for connection attemptReconnect behavior.
 * We want to be sure it does NOT auto-join when tournament has ended,
 * and that it DOES call joinRoom when allowed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  attemptReconnect,
  type AttemptReconnectDeps,
  RECONNECT_BACKOFF_MS,
} from "./connection";

describe("connection.attemptReconnect", () => {
  let joinRoom: ReturnType<typeof vi.fn>;
  let clearAuthToken: ReturnType<typeof vi.fn>;
  let log: ReturnType<typeof vi.fn>;
  let reconnectAttempts = 0;

  const baseDeps = (): AttemptReconnectDeps => ({
    getToken: () => "token",
    getConnectionState: () => "disconnected",
    getTournamentEnded: () => false,
    getReconnectAttempts: () => reconnectAttempts,
    setReconnectAttempts: (n: number) => {
      reconnectAttempts = n;
    },
    joinRoom,
    maxAttempts: 3,
    clearAuthToken,
    log,
    getReconnectionToken: () => null,
    clearReconnectionToken: vi.fn(),
    reconnect: vi.fn().mockResolvedValue(undefined),
    degradeToLobby: vi.fn(),
    disposeOrphanRoom: vi.fn(),
  });

  beforeEach(() => {
    vi.useFakeTimers();
    joinRoom = vi.fn().mockResolvedValue(undefined);
    clearAuthToken = vi.fn();
    log = vi.fn();
    reconnectAttempts = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not call joinRoom when tournament has ended", async () => {
    const deps: AttemptReconnectDeps = {
      ...baseDeps(),
      getTournamentEnded: () => true,
    };

    await attemptReconnect(deps);

    expect(joinRoom).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("Mesa cerrada por fin de torneo. No se reconecta.");
  });

  it("calls joinRoom(true) when token present, disconnected and tournament not ended", async () => {
    const deps = baseDeps();

    const promise = attemptReconnect(deps);
    // Avanzar el tiempo suficientemente para que pase el delay exponencial del primer intento
    vi.runAllTimers();
    await promise;

    expect(joinRoom).toHaveBeenCalledTimes(1);
    expect(joinRoom).toHaveBeenCalledWith(true);
  });

  it("degrades to lobby and clears reconnect token when maxAttempts reached", async () => {
    reconnectAttempts = 3; // already at max
    const degradeToLobby = vi.fn();
    const clearReconnectionToken = vi.fn();
    const deps: AttemptReconnectDeps = {
      ...baseDeps(),
      degradeToLobby,
      clearReconnectionToken,
    };

    await attemptReconnect(deps);

    expect(joinRoom).not.toHaveBeenCalled();
    expect(clearAuthToken).not.toHaveBeenCalled();
    expect(clearReconnectionToken).toHaveBeenCalledTimes(1);
    expect(degradeToLobby).toHaveBeenCalledTimes(1);
  });

  it("prefers reconnect(token) over joinRoom when a reconnectionToken is stored", async () => {
    const reconnect = vi.fn().mockResolvedValue(undefined);
    const getReconnectionToken = vi.fn(() => "stored-token");
    const clearReconnectionToken = vi.fn();
    const degradeToLobby = vi.fn();
    const deps: AttemptReconnectDeps = {
      ...baseDeps(),
      getReconnectionToken,
      clearReconnectionToken,
      reconnect,
      degradeToLobby,
    };

    const p = attemptReconnect(deps);
    vi.runAllTimers();
    await p;

    expect(reconnect).toHaveBeenCalledTimes(1);
    expect(reconnect).toHaveBeenCalledWith("stored-token");
    expect(joinRoom).not.toHaveBeenCalled();
    expect(clearReconnectionToken).not.toHaveBeenCalled();
    expect(degradeToLobby).not.toHaveBeenCalled();
  });

  it("waits the calibrated backoff schedule for each attempt", async () => {
    const reconnect = vi.fn().mockResolvedValue(undefined);
    let nowAttempt = 0;
    const deps: AttemptReconnectDeps = {
      ...baseDeps(),
      maxAttempts: 6,
      getReconnectAttempts: () => nowAttempt,
      setReconnectAttempts: (n: number) => { nowAttempt = n; },
      getReconnectionToken: () => "tok",
      reconnect,
    };

    const p = attemptReconnect(deps);
    // attempt 1 expects ~250ms ±20% (max 300ms + a bit of slack)
    await vi.advanceTimersByTimeAsync(RECONNECT_BACKOFF_MS[0] * 1.2 + 50);
    await p;
    expect(reconnect).toHaveBeenCalledTimes(1);
    expect(nowAttempt).toBe(1);
  });

  it("times out client.reconnect after RECONNECT_PER_ATTEMPT_TIMEOUT_MS", async () => {
    const reconnect = vi.fn().mockImplementation(() => new Promise(() => {})); // never resolves
    const deps: AttemptReconnectDeps = {
      ...baseDeps(),
      getReconnectionToken: () => "tok",
      reconnect,
    };

    const p = attemptReconnect(deps);
    await vi.advanceTimersByTimeAsync(400); // past backoff (~250ms ±20%)
    await vi.advanceTimersByTimeAsync(5000 + 50); // past per-attempt timeout
    await p;

    expect(joinRoom).toHaveBeenCalledWith(true); // falls through after timeout
  });

  it("calls disposeOrphanRoom when reconnect resolves AFTER the timeout fires", async () => {
    let resolveLate!: () => void;
    const reconnect = vi.fn().mockImplementation(
      () => new Promise<void>((res) => { resolveLate = res; })
    );
    const disposeOrphanRoom = vi.fn();
    const deps: AttemptReconnectDeps = {
      ...baseDeps(),
      getReconnectionToken: () => "tok",
      reconnect,
      disposeOrphanRoom,
    };

    const p = attemptReconnect(deps);
    await vi.advanceTimersByTimeAsync(400);
    await vi.advanceTimersByTimeAsync(5000 + 50);
    await p;
    // Now the late resolve fires
    resolveLate();
    await vi.runAllTimersAsync();

    expect(disposeOrphanRoom).toHaveBeenCalledTimes(1);
  });
});

