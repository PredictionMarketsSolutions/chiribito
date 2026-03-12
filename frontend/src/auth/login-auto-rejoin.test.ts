/**
 * Tests for post-login auto-rejoin: when lastRoomId exists we attempt join;
 * on failure we clear it and show lobby message.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { runPostLoginAutoRejoin, type PostLoginAutoRejoinDeps } from "./login-auto-rejoin";

describe("login-auto-rejoin", () => {
  let deps: PostLoginAutoRejoinDeps;

  beforeEach(() => {
    deps = {
      getLastRoomId: vi.fn(() => null),
      joinRoom: vi.fn().mockResolvedValue(undefined),
      clearLastRoomId: vi.fn(),
      setAuthMessage: vi.fn(),
      log: vi.fn(),
    };
  });

  describe("when no lastRoomId", () => {
    it("shows lobby message and does not call joinRoom", () => {
      vi.mocked(deps.getLastRoomId).mockReturnValue(null);
      runPostLoginAutoRejoin(deps);
      expect(deps.setAuthMessage).toHaveBeenCalledWith("Login correcto. Puedes unirte a la mesa.", "success");
      expect(deps.joinRoom).not.toHaveBeenCalled();
      expect(deps.clearLastRoomId).not.toHaveBeenCalled();
    });

    it("does not call joinRoom when getLastRoomId returns empty string", () => {
      vi.mocked(deps.getLastRoomId).mockReturnValue("");
      runPostLoginAutoRejoin(deps);
      expect(deps.joinRoom).not.toHaveBeenCalled();
      expect(deps.setAuthMessage).toHaveBeenCalledWith("Login correcto. Puedes unirte a la mesa.", "success");
    });

    it("does not call joinRoom when getLastRoomId returns whitespace-only", () => {
      vi.mocked(deps.getLastRoomId).mockReturnValue("   ");
      runPostLoginAutoRejoin(deps);
      expect(deps.joinRoom).not.toHaveBeenCalled();
      expect(deps.setAuthMessage).toHaveBeenCalledWith("Login correcto. Puedes unirte a la mesa.", "success");
    });
  });

  describe("when lastRoomId exists", () => {
    it("sets info message, logs, and calls joinRoom with roomId", () => {
      vi.mocked(deps.getLastRoomId).mockReturnValue("room-abc");
      runPostLoginAutoRejoin(deps);
      expect(deps.log).toHaveBeenCalledWith("Found previous room room-abc, attempting auto-rejoin...");
      expect(deps.setAuthMessage).toHaveBeenCalledWith("Login correcto. Recuperando tu mesa...", "info");
      expect(deps.joinRoom).toHaveBeenCalledWith(false, { mode: "joinById", roomId: "room-abc" });
      expect(deps.clearLastRoomId).not.toHaveBeenCalled();
    });

    it("trims roomId before calling joinRoom", () => {
      vi.mocked(deps.getLastRoomId).mockReturnValue("  room-xyz  ");
      runPostLoginAutoRejoin(deps);
      expect(deps.joinRoom).toHaveBeenCalledWith(false, { mode: "joinById", roomId: "room-xyz" });
    });

    it("on joinRoom reject: clears lastRoomId and shows lobby message", async () => {
      vi.mocked(deps.getLastRoomId).mockReturnValue("room-123");
      vi.mocked(deps.joinRoom).mockRejectedValue(new Error("Room not found"));
      runPostLoginAutoRejoin(deps);
      await vi.waitFor(() => {
        expect(deps.clearLastRoomId).toHaveBeenCalledTimes(1);
      });
      expect(deps.setAuthMessage).toHaveBeenCalledWith(
        "Login correcto. Puedes unirte a una mesa desde el lobby.",
        "success"
      );
      expect(deps.log).toHaveBeenCalledWith(expect.stringContaining("Auto-rejoin failed"));
    });

    it("on joinRoom reject with string error: logs and clears", async () => {
      vi.mocked(deps.getLastRoomId).mockReturnValue("r1");
      vi.mocked(deps.joinRoom).mockRejectedValue("connection failed");
      runPostLoginAutoRejoin(deps);
      await vi.waitFor(() => {
        expect(deps.clearLastRoomId).toHaveBeenCalled();
      });
      expect(deps.log).toHaveBeenCalledWith(expect.stringMatching(/Auto-rejoin failed/));
    });

    it("on joinRoom resolve: does not clear lastRoomId", async () => {
      vi.mocked(deps.getLastRoomId).mockReturnValue("room-ok");
      vi.mocked(deps.joinRoom).mockResolvedValue(undefined);
      runPostLoginAutoRejoin(deps);
      await deps.joinRoom(false, { mode: "joinById", roomId: "room-ok" });
      expect(deps.clearLastRoomId).not.toHaveBeenCalled();
    });
  });
});
