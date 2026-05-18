/**
 * SecureStorage tests.
 * Ensures clear* methods remove the same keys that save* use (avoids logout leaving stale tokens).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SecureStorage } from "./secure-storage";

const REFRESH_KEY = "chiri_refresh_token";
const AUTH_KEY = "chiri_auth_token";
const EXPIRY_KEY = "chiri_token_expiry";
const RECONNECT_KEY = "chiri_reconnection_token";

function createStorageMock(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; }
  };
}

describe("SecureStorage", () => {
  let local: Storage;
  let session: Storage;

  beforeEach(() => {
    local = createStorageMock();
    session = createStorageMock();
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("sessionStorage", session);
  });

  describe("refresh token (logout must clear what save wrote)", () => {
    it("clearRefreshToken removes token saved by saveRefreshToken", () => {
      SecureStorage.saveRefreshToken("refresh-123");
      expect(SecureStorage.getRefreshToken()).toBe("refresh-123");
      expect(localStorage.getItem(REFRESH_KEY)).toBe("refresh-123");

      SecureStorage.clearRefreshToken();
      expect(SecureStorage.getRefreshToken()).toBeNull();
      expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
    });

    it("getRefreshToken returns null after clearRefreshToken", () => {
      SecureStorage.saveRefreshToken("rt");
      SecureStorage.clearRefreshToken();
      expect(SecureStorage.getRefreshToken()).toBeNull();
    });
  });

  describe("access token", () => {
    it("clearAccessToken removes token saved by saveAccessToken", () => {
      SecureStorage.saveAccessToken("access-456", 3600);
      expect(SecureStorage.getAccessToken()).toBe("access-456");

      SecureStorage.clearAccessToken();
      expect(SecureStorage.getAccessToken()).toBeNull();
      expect(sessionStorage.getItem(AUTH_KEY)).toBeNull();
    });
  });

  describe("clearAllTokens (logout)", () => {
    it("clears access, refresh, and reconnection token from storage", () => {
      SecureStorage.saveAccessToken("at");
      SecureStorage.saveRefreshToken("rt");
      SecureStorage.saveReconnectionToken("recon-xyz");
      expect(SecureStorage.getAccessToken()).toBe("at");
      expect(SecureStorage.getRefreshToken()).toBe("rt");
      expect(SecureStorage.getReconnectionToken()).toBe("recon-xyz");

      SecureStorage.clearAllTokens();
      expect(SecureStorage.getAccessToken()).toBeNull();
      expect(SecureStorage.getRefreshToken()).toBeNull();
      expect(SecureStorage.getReconnectionToken()).toBeNull();
      expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
      expect(sessionStorage.getItem(AUTH_KEY)).toBeNull();
      expect(sessionStorage.getItem(RECONNECT_KEY)).toBeNull();
    });
  });

  describe("reconnectionToken (Colyseus recovery primitive)", () => {
    it("saveReconnectionToken persists to sessionStorage and getReconnectionToken returns it", () => {
      expect(SecureStorage.getReconnectionToken()).toBeNull();
      SecureStorage.saveReconnectionToken("recon-abc");
      expect(SecureStorage.getReconnectionToken()).toBe("recon-abc");
      expect(sessionStorage.getItem(RECONNECT_KEY)).toBe("recon-abc");
      // Must NOT leak to localStorage — cross-tab leakage would break the
      // Move 5 multi-tab story (second tab must keep getting SESSION_EXISTS).
      expect(localStorage.getItem(RECONNECT_KEY)).toBeNull();
    });

    it("clearReconnectionToken removes the value saved by saveReconnectionToken", () => {
      SecureStorage.saveReconnectionToken("recon-1");
      expect(SecureStorage.getReconnectionToken()).toBe("recon-1");
      SecureStorage.clearReconnectionToken();
      expect(SecureStorage.getReconnectionToken()).toBeNull();
      expect(sessionStorage.getItem(RECONNECT_KEY)).toBeNull();
    });

    it("clearReconnectionToken is idempotent when no token is stored", () => {
      SecureStorage.clearReconnectionToken();
      SecureStorage.clearReconnectionToken();
      expect(SecureStorage.getReconnectionToken()).toBeNull();
    });
  });

  const LAST_ROOM_KEY = "chiri_last_room_id";

  describe("lastRoomId (auto-rejoin after login)", () => {
    it("saveLastRoomId stores and getLastRoomId returns it", () => {
      expect(SecureStorage.getLastRoomId()).toBeNull();
      SecureStorage.saveLastRoomId("abc123");
      expect(SecureStorage.getLastRoomId()).toBe("abc123");
      expect(localStorage.getItem(LAST_ROOM_KEY)).toBe("abc123");
    });

    it("clearLastRoomId removes value saved by saveLastRoomId", () => {
      SecureStorage.saveLastRoomId("room-xyz");
      expect(SecureStorage.getLastRoomId()).toBe("room-xyz");
      SecureStorage.clearLastRoomId();
      expect(SecureStorage.getLastRoomId()).toBeNull();
      expect(localStorage.getItem(LAST_ROOM_KEY)).toBeNull();
    });

    it("getLastRoomId returns null when never set", () => {
      expect(SecureStorage.getLastRoomId()).toBeNull();
    });

    it("clearLastRoomId is idempotent", () => {
      SecureStorage.saveLastRoomId("r1");
      SecureStorage.clearLastRoomId();
      SecureStorage.clearLastRoomId();
      expect(SecureStorage.getLastRoomId()).toBeNull();
    });
  });
});
