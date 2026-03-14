/**
 * MyRoom.createRateLimit.test.ts
 * Ensures onAuth rejects when create-room rate limit is exceeded (room just created, user created recently).
 */

jest.mock("@colyseus/core", () => ({
  Room: class {},
  Client: class {},
  CloseCode: { CONSENTED: 4000 },
}));

jest.mock("../../security/create-room-rate-limit", () => ({
  allowCreateRoom: jest.fn(),
  recordCreateRoom: jest.fn(),
}));

import { MyRoom } from "../../rooms/MyRoom";
import { allowCreateRoom, recordCreateRoom } from "../../security/create-room-rate-limit";

describe("MyRoom create room rate limit", () => {
  it("onAuth throws CREATE_ROOM_RATE_LIMIT when room just created and allowCreateRoom returns false", async () => {
    (allowCreateRoom as jest.Mock).mockReturnValue(false);

    const fakeRoom: any = {
      roomJustCreated: true,
      roomId: "test-room",
      tournamentParticipantUserIds: new Set<number>(),
      authService: {
        authenticate: jest.fn().mockResolvedValue({ authUser: { userId: 42 } }),
      },
    };

    await expect(
      MyRoom.prototype.onAuth.call(fakeRoom, { sessionId: "c1" } as any, {})
    ).rejects.toThrow("CREATE_ROOM_RATE_LIMIT");
  });

  it("onAuth succeeds when room just created and allowCreateRoom returns true", async () => {
    (allowCreateRoom as jest.Mock).mockReturnValue(true);

    const fakeRoom: any = {
      roomJustCreated: true,
      roomId: "test-room",
      tournamentParticipantUserIds: new Set<number>(),
      authService: {
        authenticate: jest.fn().mockResolvedValue({ authUser: { userId: 42 } }),
      },
    };

    const result = await MyRoom.prototype.onAuth.call(fakeRoom, { sessionId: "c1" } as any, {});

    expect(result).toEqual({ userId: 42 });
    expect(recordCreateRoom).toHaveBeenCalledWith(42);
  });

  it("requestJoin with isNew true sets roomJustCreated so onAuth runs rate limit", async () => {
    (allowCreateRoom as jest.Mock).mockReturnValue(true);

    const fakeRoom: any = {
      roomJustCreated: false,
      roomId: "test-room",
      tournamentParticipantUserIds: new Set<number>(),
      authService: {
        requestJoin: jest.fn().mockResolvedValue(true),
        authenticate: jest.fn().mockResolvedValue({ authUser: { userId: 99 } }),
      },
    };

    await MyRoom.prototype.requestJoin.call(fakeRoom, {}, true);
    expect(fakeRoom.roomJustCreated).toBe(true);

    const result = await MyRoom.prototype.onAuth.call(fakeRoom, { sessionId: "c1" } as any, {});
    expect(result).toEqual({ userId: 99 });
    expect(recordCreateRoom).toHaveBeenCalledWith(99);
  });

  it("onAuth sets options.replaceSessionId when authenticate returns replaceSessionId", async () => {
    (allowCreateRoom as jest.Mock).mockReturnValue(true);

    const options: any = {};
    const fakeRoom: any = {
      roomJustCreated: false,
      roomId: "test-room",
      tournamentParticipantUserIds: new Set<number>(),
      authService: {
        authenticate: jest.fn().mockResolvedValue({
          authUser: { userId: 10 },
          replaceSessionId: "old-session-123",
        }),
      },
    };

    const result = await MyRoom.prototype.onAuth.call(fakeRoom, { sessionId: "c1" } as any, options);

    expect(result).toEqual({ userId: 10 });
    expect(options.replaceSessionId).toBe("old-session-123");
  });

  it("requestJoin delegates to authService.requestJoin", async () => {
    const requestJoinMock = jest.fn().mockResolvedValue(false);
    const fakeRoom: any = {
      roomJustCreated: false,
      authService: { requestJoin: requestJoinMock },
    };

    await MyRoom.prototype.requestJoin.call(fakeRoom, { token: "jwt" }, false);

    expect(requestJoinMock).toHaveBeenCalledWith({ token: "jwt" });
  });
});

