/**
 * Tests for room disconnect helper.
 * Ensures logout/invalidation always leaves the Colyseus room so connection state is consistent.
 */

import { describe, it, expect, vi } from "vitest";
import { disconnectRoom } from "./room-disconnect";

describe("disconnectRoom", () => {
  it("does nothing when room is null", () => {
    expect(() => disconnectRoom(null)).not.toThrow();
  });

  it("calls leave() when room is provided", () => {
    const leave = vi.fn();
    disconnectRoom({ leave });

    expect(leave).toHaveBeenCalledTimes(1);
  });

  it("calls leave() once when room has leave method", () => {
    const room = { leave: vi.fn() };
    disconnectRoom(room);
    disconnectRoom(room);

    expect(room.leave).toHaveBeenCalledTimes(2);
  });
});
