/**
 * Tests for connection attemptReconnect behavior.
 * We want to be sure it does NOT auto-join when tournament has ended,
 * and that it DOES call joinRoom when allowed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { attemptReconnect, type AttemptReconnectDeps } from "./connection";

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
});

