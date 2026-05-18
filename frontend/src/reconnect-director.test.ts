import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createReconnectDirector, type ReconnectDirectorDeps } from "./reconnect-director";

describe("reconnect-director", () => {
  let connectionState: "disconnected" | "connecting" | "connected";
  let reconnect: ReturnType<typeof vi.fn>;
  let joinRoom: ReturnType<typeof vi.fn>;
  let degradeToLobby: ReturnType<typeof vi.fn>;
  let clearReconnectionToken: ReturnType<typeof vi.fn>;
  let log: ReturnType<typeof vi.fn>;

  const makeDeps = (overrides: Partial<ReconnectDirectorDeps> = {}): ReconnectDirectorDeps => ({
    getToken: () => "auth",
    getConnectionState: () => connectionState,
    getTournamentEnded: () => false,
    joinRoom,
    clearAuthToken: vi.fn(),
    log,
    getReconnectionToken: () => "tok",
    clearReconnectionToken,
    reconnect,
    degradeToLobby,
    maxAttempts: 3,
    ...overrides,
  });

  beforeEach(() => {
    vi.useFakeTimers();
    connectionState = "disconnected";
    reconnect = vi.fn().mockImplementation(async () => { connectionState = "connected"; });
    joinRoom = vi.fn().mockResolvedValue(undefined);
    degradeToLobby = vi.fn();
    clearReconnectionToken = vi.fn();
    log = vi.fn();
  });
  afterEach(() => vi.useRealTimers());

  it("succeeds on first attempt and emits idle phase", async () => {
    const phases: string[] = [];
    const d = createReconnectDirector(makeDeps({ onAttemptChange: ({ phase }) => phases.push(phase) }));
    const p = d.requestReconnect();
    await vi.runAllTimersAsync();
    await p;
    expect(reconnect).toHaveBeenCalledTimes(1);
    expect(phases).toContain("idle");
    expect(degradeToLobby).not.toHaveBeenCalled();
  });

  it("is idempotent — second call while running is a no-op", async () => {
    let resolveFirst!: () => void;
    reconnect = vi.fn().mockImplementation(
      () => new Promise<void>((r) => { resolveFirst = () => { connectionState = "connected"; r(); }; })
    );
    const d = createReconnectDirector(makeDeps());
    const p1 = d.requestReconnect();
    await vi.advanceTimersByTimeAsync(300);
    const p2 = d.requestReconnect();
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("loop already running")
    );
    resolveFirst();
    await vi.runAllTimersAsync();
    await Promise.all([p1, p2]);
    expect(reconnect).toHaveBeenCalledTimes(1);
  });

  it("degrades after maxAttempts and emits degraded phase", async () => {
    reconnect = vi.fn().mockRejectedValue(new Error("nope"));
    joinRoom = vi.fn().mockRejectedValue(new Error("nope"));
    const phases: string[] = [];
    const d = createReconnectDirector(makeDeps({
      onAttemptChange: ({ phase }) => phases.push(phase),
    }));
    const p = d.requestReconnect();
    await vi.runAllTimersAsync();
    await p;
    expect(degradeToLobby).toHaveBeenCalled();
    expect(phases[phases.length - 1]).toBe("degraded");
  });

  it("does nothing when tournament ended", async () => {
    const d = createReconnectDirector(makeDeps({ getTournamentEnded: () => true }));
    await d.requestReconnect();
    expect(reconnect).not.toHaveBeenCalled();
    expect(degradeToLobby).not.toHaveBeenCalled();
  });
});
