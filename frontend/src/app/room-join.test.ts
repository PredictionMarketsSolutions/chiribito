import { describe, it, expect, vi } from "vitest";
import { validateJoinRequest, handleJoinError } from "./room-join";

describe("room-join", () => {
  describe("validateJoinRequest", () => {
    it("fails and sets disconnected when token is missing", () => {
      const setConnectionState = vi.fn();
      const log = vi.fn();
      const result = validateJoinRequest({
        hasToken: false,
        mode: "joinOrCreate",
        setConnectionState,
        log,
      });
      expect(result).toEqual({ ok: false });
      expect(setConnectionState).toHaveBeenCalledWith("disconnected");
      expect(log).toHaveBeenCalledWith("No token. Login or register first.");
    });

    it("fails for joinById with empty room id", () => {
      const setConnectionState = vi.fn();
      const log = vi.fn();
      const result = validateJoinRequest({
        hasToken: true,
        mode: "joinById",
        roomId: "   ",
        setConnectionState,
        log,
      });
      expect(result).toEqual({ ok: false });
      expect(setConnectionState).toHaveBeenCalledWith("disconnected");
      expect(log).toHaveBeenCalledWith("Room ID vacío.");
    });

    it("returns trimmed room id for joinById", () => {
      const result = validateJoinRequest({
        hasToken: true,
        mode: "joinById",
        roomId: "  room-7 ",
        setConnectionState: vi.fn(),
        log: vi.fn(),
      });
      expect(result).toEqual({ ok: true, normalizedRoomId: "room-7" });
    });

    it("passes for non joinById modes", () => {
      const result = validateJoinRequest({
        hasToken: true,
        mode: "create",
        setConnectionState: vi.fn(),
        log: vi.fn(),
      });
      expect(result).toEqual({ ok: true });
    });
  });

  describe("handleJoinError", () => {
    function makeDeps(overrides: Partial<Parameters<typeof handleJoinError>[0]> = {}) {
      return {
        error: new Error("generic"),
        confirmSessionReplace: vi.fn(() => false),
        onSessionReplaceConfirmed: vi.fn().mockResolvedValue(undefined),
        onSessionReplaceRejected: vi.fn(),
        onInvalidToken: vi.fn(),
        onAuthUnavailable: vi.fn(),
        onCreateRateLimit: vi.fn(),
        onGeneric: vi.fn(),
        ...overrides,
      };
    }

    it("handles SESSION_EXISTS with confirmation accepted", async () => {
      const deps = makeDeps({
        error: new Error("SESSION_EXISTS"),
        confirmSessionReplace: vi.fn(() => true),
      });
      await handleJoinError(deps);
      expect(deps.confirmSessionReplace).toHaveBeenCalled();
      expect(deps.onSessionReplaceConfirmed).toHaveBeenCalled();
      expect(deps.onSessionReplaceRejected).not.toHaveBeenCalled();
    });

    it("handles SESSION_EXISTS with confirmation rejected", async () => {
      const deps = makeDeps({
        error: new Error("SESSION_EXISTS"),
        confirmSessionReplace: vi.fn(() => false),
      });
      await handleJoinError(deps);
      expect(deps.onSessionReplaceRejected).toHaveBeenCalled();
      expect(deps.onSessionReplaceConfirmed).not.toHaveBeenCalled();
    });

    it("handles INVALID_TOKEN", async () => {
      const deps = makeDeps({ error: new Error("INVALID_TOKEN") });
      await handleJoinError(deps);
      expect(deps.onInvalidToken).toHaveBeenCalled();
    });

    it("handles AUTH_UNAVAILABLE/AUTH_TIMEOUT", async () => {
      const depsUnavailable = makeDeps({ error: new Error("AUTH_UNAVAILABLE") });
      await handleJoinError(depsUnavailable);
      expect(depsUnavailable.onAuthUnavailable).toHaveBeenCalled();

      const depsTimeout = makeDeps({ error: new Error("AUTH_TIMEOUT") });
      await handleJoinError(depsTimeout);
      expect(depsTimeout.onAuthUnavailable).toHaveBeenCalled();
    });

    it("handles create rate limit", async () => {
      const deps = makeDeps({ error: new Error("CREATE_ROOM_RATE_LIMIT: wait") });
      await handleJoinError(deps);
      expect(deps.onCreateRateLimit).toHaveBeenCalled();
    });

    it("falls back to generic handler", async () => {
      const deps = makeDeps({ error: "some-random-error" });
      await handleJoinError(deps);
      expect(deps.onGeneric).toHaveBeenCalledWith("some-random-error");
    });
  });
});
