import { describe, it, expect, vi } from "vitest";
import { bindOrphanMessageHandlers } from "./room-session-controller";

describe("bindOrphanMessageHandlers", () => {
  it("registers a 'reconnected' handler that logs and a 'gameEnded' handler that is silent", () => {
    const handlers = new Map<string, (p: unknown) => void>();
    const room = {
      onMessage: vi.fn((evt: string, cb: (p: unknown) => void) => handlers.set(evt, cb)),
    };
    const log = vi.fn();

    bindOrphanMessageHandlers(room, log);

    expect(handlers.has("reconnected")).toBe(true);
    expect(handlers.has("gameEnded")).toBe(true);

    handlers.get("reconnected")!({});
    expect(log).toHaveBeenCalledWith("Server acknowledged reconnect.");

    // gameEnded handler must not throw and must not log
    const callsBefore = log.mock.calls.length;
    handlers.get("gameEnded")!({});
    expect(log.mock.calls.length).toBe(callsBefore);
  });
});
