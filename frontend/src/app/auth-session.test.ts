import { describe, it, expect, vi } from "vitest";
import { clearAuthSession, handleTokenInvalidated, startTokenMonitor } from "./auth-session";

describe("auth-session", () => {
  it("clearAuthSession resets tokens and status (including reconnection token)", () => {
    const tokenStatusEl = document.createElement("span");
    const setToken = vi.fn();
    const setRefreshToken = vi.fn();
    const setShouldAutoReconnect = vi.fn();
    const setTokenInvalidNotified = vi.fn();
    const clearAccessToken = vi.fn();
    const clearRefreshToken = vi.fn();
    const clearReconnectionToken = vi.fn();

    clearAuthSession({
      setToken,
      setRefreshToken,
      setShouldAutoReconnect,
      tokenStatusEl,
      setTokenInvalidNotified,
      clearAccessToken,
      clearRefreshToken,
      clearReconnectionToken,
    });

    expect(setToken).toHaveBeenCalledWith(null);
    expect(setRefreshToken).toHaveBeenCalledWith(null);
    expect(setShouldAutoReconnect).toHaveBeenCalledWith(false);
    expect(setTokenInvalidNotified).toHaveBeenCalledWith(false);
    expect(tokenStatusEl.textContent).toBe("none");
    expect(clearAccessToken).toHaveBeenCalled();
    expect(clearRefreshToken).toHaveBeenCalled();
    expect(clearReconnectionToken).toHaveBeenCalledTimes(1);
  });

  it("handleTokenInvalidated runs once when not notified", () => {
    const clearAuthSessionFn = vi.fn();
    const resetRoomUi = vi.fn();
    const alertUser = vi.fn();
    let notified = false;
    handleTokenInvalidated({
      getTokenInvalidNotified: () => notified,
      setTokenInvalidNotified: (value) => {
        notified = value;
      },
      clearAuthSession: clearAuthSessionFn,
      resetRoomUi,
      alertUser,
    });
    expect(clearAuthSessionFn).toHaveBeenCalled();
    expect(resetRoomUi).toHaveBeenCalledWith("logged out");
    expect(alertUser).toHaveBeenCalled();
  });

  it("startTokenMonitor delegates without throwing", () => {
    expect(() =>
      startTokenMonitor({
        apiUrl: "http://api",
        getRefreshToken: () => null,
        onSuccess: vi.fn(),
        onInvalidated: vi.fn(),
        log: vi.fn(),
      })
    ).not.toThrow();
  });
});
