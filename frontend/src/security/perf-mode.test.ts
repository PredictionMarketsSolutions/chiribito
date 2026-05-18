import { afterEach, describe, expect, it, vi } from "vitest";
import { isPerfEnabled } from "./perf-mode";

describe("isPerfEnabled", () => {
  const originalLocation = window.location;

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("returns true when URL has ?perf=1", () => {
    vi.stubEnv("DEV", false);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "?perf=1" },
      writable: true,
      configurable: true,
    });
    expect(isPerfEnabled()).toBe(true);
  });

  it("returns true even with ?perf=0 (presence-only contract)", () => {
    vi.stubEnv("DEV", false);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "?perf=0" },
      writable: true,
      configurable: true,
    });
    expect(isPerfEnabled()).toBe(true);
  });

  it("returns true with ?perf (no value)", () => {
    vi.stubEnv("DEV", false);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "?perf" },
      writable: true,
      configurable: true,
    });
    expect(isPerfEnabled()).toBe(true);
  });

  it("returns false in production with no perf query param", () => {
    vi.stubEnv("DEV", false);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "" },
      writable: true,
      configurable: true,
    });
    expect(isPerfEnabled()).toBe(false);
  });

  it("returns false in Vite DEV mode with no perf flag (DEV does NOT auto-enable)", () => {
    vi.stubEnv("DEV", true);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "" },
      writable: true,
      configurable: true,
    });
    expect(isPerfEnabled()).toBe(false);
  });

  it("returns false when window is undefined (SSR guard)", () => {
    vi.stubEnv("DEV", false);
    const stash = (globalThis as { window?: Window }).window;
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    try {
      expect(isPerfEnabled()).toBe(false);
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: stash,
        writable: true,
        configurable: true,
      });
    }
  });
});
