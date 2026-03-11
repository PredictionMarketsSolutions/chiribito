/**
 * create-room-rate-limit.test.ts
 * Tests for create-room rate limiting (allowCreateRoom, recordCreateRoom, cooldown).
 */

import {
  allowCreateRoom,
  recordCreateRoom,
  getCreateRoomCooldownMs,
} from "../../security/create-room-rate-limit";

describe("create-room-rate-limit", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("allows first create for a user", () => {
    expect(allowCreateRoom(1)).toBe(true);
    recordCreateRoom(1);
  });

  it("denies second create within cooldown", () => {
    recordCreateRoom(1);
    expect(allowCreateRoom(1)).toBe(false);
  });

  it("allows create after cooldown has passed", () => {
    recordCreateRoom(1);
    jest.advanceTimersByTime(getCreateRoomCooldownMs() + 1);
    expect(allowCreateRoom(1)).toBe(true);
  });

  it("allows create for different users independently", () => {
    recordCreateRoom(1);
    expect(allowCreateRoom(1)).toBe(false);
    expect(allowCreateRoom(2)).toBe(true);
  });

  it("allows create for non-finite userId", () => {
    expect(allowCreateRoom(NaN)).toBe(true);
    expect(allowCreateRoom(Infinity)).toBe(true);
  });

  it("recordCreateRoom does not affect allow for non-finite userId", () => {
    recordCreateRoom(NaN);
    recordCreateRoom(1);
    expect(allowCreateRoom(1)).toBe(false);
  });
});
