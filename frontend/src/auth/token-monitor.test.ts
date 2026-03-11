/**
 * Tests for token monitor: ensures refresh result "network" triggers onInvalidated and log.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { startTokenMonitor, stopTokenMonitor } from "./token-monitor";

vi.mock("./token-refresh", () => ({
  attemptTokenRefresh: vi.fn(),
}));

import { attemptTokenRefresh } from "./token-refresh";

describe("token-monitor", () => {
  const deps = {
    apiUrl: "https://api.test",
    getRefreshToken: vi.fn(() => "refresh-token"),
    onSuccess: vi.fn(),
    onInvalidated: vi.fn(),
    log: vi.fn(),
    intervalMs: 1000,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(deps.getRefreshToken).mockReturnValue("refresh-token");
    vi.mocked(attemptTokenRefresh).mockResolvedValue({ ok: true, token: "t", refreshToken: "rt" });
  });

  afterEach(() => {
    stopTokenMonitor();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("does not call onInvalidated on network error, only logs and retries next interval", async () => {
    vi.mocked(attemptTokenRefresh).mockResolvedValue({ ok: false, reason: "network" });

    startTokenMonitor(deps);
    vi.advanceTimersByTime(1000);
    await Promise.resolve();

    expect(deps.onInvalidated).not.toHaveBeenCalled();
    expect(deps.log).toHaveBeenCalledWith("Token refresh: network error, will retry on next interval");
  });

  it("calls onInvalidated when refresh returns reason malformed", async () => {
    vi.mocked(attemptTokenRefresh).mockResolvedValue({ ok: false, reason: "malformed" });

    startTokenMonitor(deps);
    vi.advanceTimersByTime(1000);
    await Promise.resolve();

    expect(deps.onInvalidated).toHaveBeenCalledTimes(1);
  });

  it("calls onInvalidated when refresh returns reason not_ok", async () => {
    vi.mocked(attemptTokenRefresh).mockResolvedValue({ ok: false, reason: "not_ok" });

    startTokenMonitor(deps);
    vi.advanceTimersByTime(1000);
    await Promise.resolve();

    expect(deps.onInvalidated).toHaveBeenCalledTimes(1);
  });
});
