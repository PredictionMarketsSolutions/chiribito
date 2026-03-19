import { describe, it, expect, vi } from "vitest";
import { createLobbyPollingController } from "./lobby-polling";

describe("lobby-polling", () => {
  it("starts polling and calls refresh on interval", () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const setIntervalFn = vi.fn((cb: TimerHandler) => {
      (cb as () => void)();
      return 123 as unknown as number;
    });
    const clearIntervalFn = vi.fn();
    const polling = createLobbyPollingController({
      refresh,
      setIntervalFn: setIntervalFn as unknown as typeof window.setInterval,
      clearIntervalFn: clearIntervalFn as unknown as typeof window.clearInterval,
      intervalMs: 2500,
    });

    polling.start();
    expect(setIntervalFn).toHaveBeenCalledWith(expect.any(Function), 2500);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(polling.isRunning()).toBe(true);
  });

  it("stop clears current interval and marks as stopped", () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const setIntervalFn = vi.fn(() => 99 as unknown as number);
    const clearIntervalFn = vi.fn();
    const polling = createLobbyPollingController({
      refresh,
      setIntervalFn: setIntervalFn as unknown as typeof window.setInterval,
      clearIntervalFn: clearIntervalFn as unknown as typeof window.clearInterval,
    });

    polling.start();
    polling.stop();
    expect(clearIntervalFn).toHaveBeenCalledWith(99);
    expect(polling.isRunning()).toBe(false);
  });

  it("start resets previous interval before creating a new one", () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const setIntervalFn = vi
      .fn()
      .mockReturnValueOnce(10 as unknown as number)
      .mockReturnValueOnce(20 as unknown as number);
    const clearIntervalFn = vi.fn();
    const polling = createLobbyPollingController({
      refresh,
      setIntervalFn: setIntervalFn as unknown as typeof window.setInterval,
      clearIntervalFn: clearIntervalFn as unknown as typeof window.clearInterval,
    });

    polling.start();
    polling.start();
    expect(clearIntervalFn).toHaveBeenCalledWith(10);
    expect(setIntervalFn).toHaveBeenCalledTimes(2);
    expect(polling.isRunning()).toBe(true);
  });
});
