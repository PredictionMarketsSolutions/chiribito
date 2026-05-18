/**
 * Tests for the centralized post-auth recovery decision.
 *
 * Cases:
 *   - no lastRoomId        → openLobby called, joinRoom never called
 *   - empty/whitespace id  → same as no lastRoomId
 *   - valid id + success   → joinRoom called, openLobby NOT called (mesa shown)
 *   - valid id + reject    → lastRoomId cleared, openLobby called (clean fallback)
 *   - id with whitespace   → trimmed before joinRoom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { recoverMesaOrOpenLobby, type RecoverOrLobbyDeps } from "./recover-or-lobby";

describe("recoverMesaOrOpenLobby", () => {
  let deps: RecoverOrLobbyDeps;

  beforeEach(() => {
    deps = {
      getLastRoomId: vi.fn(),
      joinRoom: vi.fn(),
      isJoined: vi.fn().mockReturnValue(true),
      openLobby: vi.fn().mockResolvedValue(undefined),
      clearLastRoomId: vi.fn(),
      log: vi.fn(),
    };
  });

  it("no lastRoomId: opens lobby without attempting joinRoom", async () => {
    vi.mocked(deps.getLastRoomId).mockReturnValue(null);
    await recoverMesaOrOpenLobby(deps);
    expect(deps.joinRoom).not.toHaveBeenCalled();
    expect(deps.openLobby).toHaveBeenCalledTimes(1);
    expect(deps.clearLastRoomId).not.toHaveBeenCalled();
  });

  it("whitespace-only lastRoomId: opens lobby without attempting joinRoom", async () => {
    vi.mocked(deps.getLastRoomId).mockReturnValue("   ");
    await recoverMesaOrOpenLobby(deps);
    expect(deps.joinRoom).not.toHaveBeenCalled();
    expect(deps.openLobby).toHaveBeenCalledTimes(1);
  });

  it("valid lastRoomId + joinRoom resolves: does NOT open lobby", async () => {
    vi.mocked(deps.getLastRoomId).mockReturnValue("room-abc");
    vi.mocked(deps.joinRoom).mockResolvedValue(undefined);
    await recoverMesaOrOpenLobby(deps);
    expect(deps.joinRoom).toHaveBeenCalledWith(false, {
      mode: "joinById",
      roomId: "room-abc",
    });
    expect(deps.openLobby).not.toHaveBeenCalled();
    expect(deps.clearLastRoomId).not.toHaveBeenCalled();
  });

  it("valid lastRoomId + joinRoom rejects: clears id and falls back to lobby", async () => {
    vi.mocked(deps.getLastRoomId).mockReturnValue("room-stale");
    vi.mocked(deps.joinRoom).mockRejectedValue(new Error("Room not found"));
    await recoverMesaOrOpenLobby(deps);
    expect(deps.joinRoom).toHaveBeenCalledWith(false, {
      mode: "joinById",
      roomId: "room-stale",
    });
    expect(deps.clearLastRoomId).toHaveBeenCalledTimes(1);
    expect(deps.openLobby).toHaveBeenCalledTimes(1);
    expect(deps.log).toHaveBeenCalledWith(expect.stringMatching(/auto-rejoin failed/i));
  });

  it("trims whitespace from lastRoomId before joining", async () => {
    vi.mocked(deps.getLastRoomId).mockReturnValue("  room-trim  ");
    vi.mocked(deps.joinRoom).mockResolvedValue(undefined);
    await recoverMesaOrOpenLobby(deps);
    expect(deps.joinRoom).toHaveBeenCalledWith(false, {
      mode: "joinById",
      roomId: "room-trim",
    });
  });

  it("joinRoom resolves but isJoined returns false: clears id + opens lobby", async () => {
    // Simulates the roomSessionController.joinRoom path where Colyseus auth
    // rejected (e.g. SESSION_EXISTS), handleJoinError caught the error, and
    // the function returned `undefined` instead of rejecting.
    vi.mocked(deps.getLastRoomId).mockReturnValue("room-blocked");
    vi.mocked(deps.joinRoom).mockResolvedValue(undefined);
    vi.mocked(deps.isJoined).mockReturnValue(false);
    await recoverMesaOrOpenLobby(deps);
    expect(deps.joinRoom).toHaveBeenCalled();
    expect(deps.clearLastRoomId).toHaveBeenCalledTimes(1);
    expect(deps.openLobby).toHaveBeenCalledTimes(1);
    expect(deps.log).toHaveBeenCalledWith(
      expect.stringMatching(/resolved without joining/i),
    );
  });
});
