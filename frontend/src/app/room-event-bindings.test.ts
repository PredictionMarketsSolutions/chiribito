import { describe, it, expect, vi } from "vitest";
import { bindCoreRoomEvents } from "./room-event-bindings";

type Handlers = Record<string, (payload: any) => void>;

function createRoomMock() {
  const messageHandlers: Handlers = {};
  let stateChangeHandler: ((state: any) => void) | null = null;

  return {
    room: {
      onMessage: (type: string, handler: (payload: any) => void) => {
        messageHandlers[type] = handler;
      },
      onStateChange: (handler: (state: any) => void) => {
        stateChangeHandler = handler;
      },
    },
    messageHandlers,
    triggerStateChange: (state: any) => stateChangeHandler?.(state),
  };
}

describe("room-event-bindings", () => {
  it("logs joined/playerJoined/playerLeft payloads", () => {
    const { room, messageHandlers } = createRoomMock();
    const log = vi.fn();

    bindCoreRoomEvents({
      room: room as any,
      log,
      playActionSound: vi.fn(),
      startTurnTimer: vi.fn(),
      turnTimeoutMs: 30000,
      setLastRoomState: vi.fn(),
      isWinnerPhaseActive: () => false,
      renderState: vi.fn(),
    });

    messageHandlers.joined({ x: 1 });
    messageHandlers.playerJoined({ id: "a" });
    messageHandlers.playerLeft({ id: "b" });

    expect(log).toHaveBeenCalledWith('Joined payload: {"x":1}');
    expect(log).toHaveBeenCalledWith('Player joined: {"id":"a"}');
    expect(log).toHaveBeenCalledWith('Player left: {"id":"b"}');
  });

  it("handles playerAction and plays sound when action exists", () => {
    const { room, messageHandlers } = createRoomMock();
    const playActionSound = vi.fn();

    bindCoreRoomEvents({
      room: room as any,
      log: vi.fn(),
      playActionSound,
      startTurnTimer: vi.fn(),
      turnTimeoutMs: 30000,
      setLastRoomState: vi.fn(),
      isWinnerPhaseActive: () => false,
      renderState: vi.fn(),
    });

    messageHandlers.playerAction({ action: "bet" });
    messageHandlers.playerAction({ action: 5 });
    expect(playActionSound).toHaveBeenCalledWith("bet");
    expect(playActionSound).toHaveBeenCalledTimes(1);
  });

  it("computes turn timer deadline and starts timer", () => {
    const { room, messageHandlers } = createRoomMock();
    const startTurnTimer = vi.fn();

    bindCoreRoomEvents({
      room: room as any,
      log: vi.fn(),
      playActionSound: vi.fn(),
      startTurnTimer,
      turnTimeoutMs: 30000,
      setLastRoomState: vi.fn(),
      isWinnerPhaseActive: () => false,
      renderState: vi.fn(),
      getNowMs: () => 1_000,
    });

    messageHandlers.turnTimer({
      currentTurn: "p1",
      startedAt: 2_000,
      serverTime: 1_500,
      timeoutMs: 10_000,
    });

    // offset = 1500-1000=500 => deadline = 2000-500+10000 = 11500
    expect(startTurnTimer).toHaveBeenCalledWith("p1", 10000, 11500);
  });

  it("stateChange stores state and renders when winner phase inactive", () => {
    const { room, triggerStateChange } = createRoomMock();
    const setLastRoomState = vi.fn();
    const renderState = vi.fn();
    bindCoreRoomEvents({
      room: room as any,
      log: vi.fn(),
      playActionSound: vi.fn(),
      startTurnTimer: vi.fn(),
      turnTimeoutMs: 30000,
      setLastRoomState,
      isWinnerPhaseActive: () => false,
      renderState,
    });

    const state = { pot: 10 };
    triggerStateChange(state);
    expect(setLastRoomState).toHaveBeenCalledWith(state);
    expect(renderState).toHaveBeenCalledWith(state);
  });

  it("stateChange skips render when winner phase active", () => {
    const { room, triggerStateChange } = createRoomMock();
    const renderState = vi.fn();
    bindCoreRoomEvents({
      room: room as any,
      log: vi.fn(),
      playActionSound: vi.fn(),
      startTurnTimer: vi.fn(),
      turnTimeoutMs: 30000,
      setLastRoomState: vi.fn(),
      isWinnerPhaseActive: () => true,
      renderState,
    });
    triggerStateChange({ pot: 10 });
    expect(renderState).not.toHaveBeenCalled();
  });
});
