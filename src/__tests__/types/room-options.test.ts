/**
 * Tests for room option types (RoomOptions, JoinOptionsFromClient, JoinOptionsWithAuth).
 * Verifica que los tipos existen y que objetos de ejemplo son compatibles.
 */

import type {
  RoomOptions,
  JoinOptionsFromClient,
  JoinOptionsWithAuth,
  AuthUser,
} from "../../types/room-options";
import type { ActionClient } from "../../types/IGameRoom";

describe("room-options types", () => {
  it("RoomOptions allows optional tableName", () => {
    const a: RoomOptions = {};
    const b: RoomOptions = { tableName: "Mesa 1" };
    expect(a).toEqual({});
    expect(b.tableName).toBe("Mesa 1");
  });

  it("JoinOptionsFromClient allows token and auth.token", () => {
    const withToken: JoinOptionsFromClient = { token: "jwt-here" };
    const withAuth: JoinOptionsFromClient = { auth: { token: "jwt" } };
    expect(withToken.token).toBe("jwt-here");
    expect(withAuth.auth?.token).toBe("jwt");
  });

  it("JoinOptionsWithAuth extends client options with authUser and replaceSessionId", () => {
    const authUser: AuthUser = { userId: 1, username: "alice" };
    const opts: JoinOptionsWithAuth = {
      token: "jwt",
      authUser,
      replaceSessionId: "old-session-123",
    };
    expect(opts.authUser?.userId).toBe(1);
    expect(opts.replaceSessionId).toBe("old-session-123");
  });
});

describe("ActionClient (type)", () => {
  it("bot stub shape satisfies ActionClient structurally", () => {
    const stub: ActionClient = { sessionId: "bot-1", send: () => {} };
    expect(stub.sessionId).toBe("bot-1");
  });
});
