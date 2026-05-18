/**
 * Tests for the centralized post-auth recovery decision.
 *
 * Cases:
 *   reconnect branch (Move 1.5):
 *     - token present + reconnect resolves + isJoined: no joinRoom, no lobby,
 *       token NOT cleared (still valid).
 *     - token present + reconnect rejects: token cleared, falls through to
 *       lastRoomId path; if lastRoomId present, joinRoom is tried.
 *     - token present + reconnect resolves but isJoined false: same as above,
 *       token cleared, falls through.
 *     - token present + reconnect rejects + no lastRoomId: token cleared,
 *       lobby opened.
 *
 *   joinById branch (existing Move 1):
 *     - no token + no lastRoomId  → openLobby called, joinRoom never called.
 *     - no token + empty/whitespace id → same as no lastRoomId.
 *     - no token + valid id + success → joinRoom called, openLobby NOT called.
 *     - no token + valid id + reject  → lastRoomId cleared, lobby opened.
 *     - no token + id with whitespace → trimmed before joinRoom.
 *     - no token + joinRoom resolves but isJoined false → clear + lobby.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { recoverMesaOrOpenLobby, type RecoverOrLobbyDeps } from "./recover-or-lobby";

describe("recoverMesaOrOpenLobby", () => {
  let deps: RecoverOrLobbyDeps;

  beforeEach(() => {
    deps = {
      getReconnectionToken: vi.fn().mockReturnValue(null),
      clearReconnectionToken: vi.fn(),
      reconnect: vi.fn().mockResolvedValue(undefined),
      getLastRoomId: vi.fn().mockReturnValue(null),
      joinRoom: vi.fn(),
      isJoined: vi.fn().mockReturnValue(true),
      openLobby: vi.fn().mockResolvedValue(undefined),
      clearLastRoomId: vi.fn(),
      log: vi.fn(),
    };
  });

  // ----- reconnect branch (Move 1.5) -----

  it("reconnect token + success + isJoined: skips joinRoom and lobby, keeps token", async () => {
    vi.mocked(deps.getReconnectionToken).mockReturnValue("recon-ok");
    vi.mocked(deps.reconnect).mockResolvedValue(undefined);
    vi.mocked(deps.isJoined).mockReturnValue(true);

    await recoverMesaOrOpenLobby(deps);

    expect(deps.reconnect).toHaveBeenCalledWith("recon-ok");
    expect(deps.joinRoom).not.toHaveBeenCalled();
    expect(deps.openLobby).not.toHaveBeenCalled();
    expect(deps.clearReconnectionToken).not.toHaveBeenCalled();
    expect(deps.clearLastRoomId).not.toHaveBeenCalled();
  });

  it("reconnect token + reject + lastRoomId present: clears token, tries joinById", async () => {
    vi.mocked(deps.getReconnectionToken).mockReturnValue("recon-bad");
    vi.mocked(deps.reconnect).mockRejectedValue(new Error("seat expired"));
    vi.mocked(deps.getLastRoomId).mockReturnValue("room-fallback");
    vi.mocked(deps.joinRoom).mockResolvedValue(undefined);
    vi.mocked(deps.isJoined).mockReturnValue(true);

    await recoverMesaOrOpenLobby(deps);

    expect(deps.reconnect).toHaveBeenCalledWith("recon-bad");
    expect(deps.clearReconnectionToken).toHaveBeenCalledTimes(1);
    expect(deps.joinRoom).toHaveBeenCalledWith(false, {
      mode: "joinById",
      roomId: "room-fallback",
    });
    expect(deps.openLobby).not.toHaveBeenCalled();
    expect(deps.log).toHaveBeenCalledWith(
      expect.stringMatching(/reconnect failed/i),
    );
  });

  it("reconnect token + resolves but isJoined false: clears token, falls through", async () => {
    // Mirrors the case where roomSessionController.reconnect swallowed an
    // error inside handleJoinError and returned undefined without mounting.
    vi.mocked(deps.getReconnectionToken).mockReturnValue("recon-zombie");
    vi.mocked(deps.reconnect).mockResolvedValue(undefined);
    // isJoined returns false on first call (reconnect check) and false on
    // the lastRoomId fallback check too — full fall-through to lobby.
    vi.mocked(deps.isJoined).mockReturnValue(false);
    vi.mocked(deps.getLastRoomId).mockReturnValue(null);

    await recoverMesaOrOpenLobby(deps);

    expect(deps.clearReconnectionToken).toHaveBeenCalledTimes(1);
    expect(deps.joinRoom).not.toHaveBeenCalled();
    expect(deps.openLobby).toHaveBeenCalledTimes(1);
    expect(deps.log).toHaveBeenCalledWith(
      expect.stringMatching(/reconnect resolved without joining/i),
    );
  });

  it("reconnect token + reject + no lastRoomId: clears token, opens lobby", async () => {
    vi.mocked(deps.getReconnectionToken).mockReturnValue("recon-stale");
    vi.mocked(deps.reconnect).mockRejectedValue(new Error("room not found"));
    vi.mocked(deps.getLastRoomId).mockReturnValue(null);

    await recoverMesaOrOpenLobby(deps);

    expect(deps.clearReconnectionToken).toHaveBeenCalledTimes(1);
    expect(deps.joinRoom).not.toHaveBeenCalled();
    expect(deps.openLobby).toHaveBeenCalledTimes(1);
  });

  // ----- joinById branch (existing Move 1) -----

  it("no token + no lastRoomId: opens lobby without attempting joinRoom", async () => {
    vi.mocked(deps.getLastRoomId).mockReturnValue(null);
    await recoverMesaOrOpenLobby(deps);
    expect(deps.reconnect).not.toHaveBeenCalled();
    expect(deps.joinRoom).not.toHaveBeenCalled();
    expect(deps.openLobby).toHaveBeenCalledTimes(1);
    expect(deps.clearLastRoomId).not.toHaveBeenCalled();
  });

  it("no token + whitespace-only lastRoomId: opens lobby without attempting joinRoom", async () => {
    vi.mocked(deps.getLastRoomId).mockReturnValue("   ");
    await recoverMesaOrOpenLobby(deps);
    expect(deps.joinRoom).not.toHaveBeenCalled();
    expect(deps.openLobby).toHaveBeenCalledTimes(1);
  });

  it("no token + valid lastRoomId + joinRoom resolves: does NOT open lobby", async () => {
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

  it("no token + valid lastRoomId + joinRoom rejects: clears id and falls back to lobby", async () => {
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

  it("no token + trims whitespace from lastRoomId before joining", async () => {
    vi.mocked(deps.getLastRoomId).mockReturnValue("  room-trim  ");
    vi.mocked(deps.joinRoom).mockResolvedValue(undefined);
    await recoverMesaOrOpenLobby(deps);
    expect(deps.joinRoom).toHaveBeenCalledWith(false, {
      mode: "joinById",
      roomId: "room-trim",
    });
  });

  it("no token + joinRoom resolves but isJoined false: clears id + opens lobby", async () => {
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
