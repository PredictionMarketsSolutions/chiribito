import { afterEach, describe, expect, it, vi } from "vitest";
import { isDebugEnabled } from "./debug-mode";

describe("isDebugEnabled", () => {
  const originalLocation = window.location;

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("returns true when Vite DEV mode is active", () => {
    vi.stubEnv("DEV", true);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "" },
      writable: true,
      configurable: true,
    });
    expect(isDebugEnabled()).toBe(true);
  });

  it("returns false in production with no debug query param", () => {
    vi.stubEnv("DEV", false);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "" },
      writable: true,
      configurable: true,
    });
    expect(isDebugEnabled()).toBe(false);
  });

  it("returns true in production when URL has ?debug=1", () => {
    vi.stubEnv("DEV", false);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "?debug=1" },
      writable: true,
      configurable: true,
    });
    expect(isDebugEnabled()).toBe(true);
  });

  it("returns true even with ?debug=0 (presence-only contract)", () => {
    vi.stubEnv("DEV", false);
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "?debug=0" },
      writable: true,
      configurable: true,
    });
    expect(isDebugEnabled()).toBe(true);
  });
});
