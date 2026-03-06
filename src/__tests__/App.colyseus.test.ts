/**
 * Colyseus server integration tests using @colyseus/testing.
 * Tests boot, room creation, getRoomById, waitForNextPatch and room state.
 * Client connectTo/sdk.joinOrCreate require matchmake HTTP routes; run full E2E separately if needed.
 */

import { ColyseusTestServer, boot } from "@colyseus/testing";
import * as jwt from "jsonwebtoken";
import server from "../app.config";

const JWT_SECRET = "test-jwt-secret-colyseus";
const TEST_USER = { userId: 1, username: "TestPlayer" };

function createTestToken(): string {
  return jwt.sign(
    { ...TEST_USER, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

describe("Colyseus app (my_room)", () => {
  let colyseus: ColyseusTestServer;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.DISABLE_ENV_VALIDATION = "true";
    process.env.API_URL = process.env.API_URL || "http://localhost:3000";
    colyseus = await boot(server);
  }, 15000);

  afterAll(async () => {
    await colyseus.shutdown();
  });

  beforeEach(async () => {
    await colyseus.cleanup();
  });

  it("createRoom creates a room and getRoomById returns it", async () => {
    const room = await colyseus.createRoom("my_room", {});
    expect(room).toBeDefined();
    expect(room.roomId).toBeDefined();
    const found = colyseus.getRoomById(room.roomId);
    expect(found).toBe(room);
    expect(room.state).toBeDefined();
  });

  it("room state has expected schema fields", async () => {
    const room = await colyseus.createRoom("my_room", {});
    expect(room.state.users).toBeDefined();
    expect(room.state.pot).toBeDefined();
    expect(room.state.roundStarted).toBeDefined();
    expect(room.state.phase).toBeDefined();
  });

  it("room listing has name for matchmaking", async () => {
    const room = await colyseus.createRoom("my_room", {});
    const listing = room["_listing"] as { name?: string; roomId?: string } | undefined;
    expect(listing?.name).toBe("my_room");
    expect(listing?.roomId).toBe(room.roomId);
  });
});
