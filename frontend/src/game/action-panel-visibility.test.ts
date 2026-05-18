import { describe, it, expect } from "vitest";
import { computeActionButtonsVisibility } from "./game-ui";

function makeState(overrides: Partial<any> = {}): any {
  return {
    currentTurn: "",
    currentBet: 0,
    roundStarted: false,
    users: new Map(),
    ...overrides,
  };
}

function makeMe(sessionId: string, currentBet = 0, chips = 1000, isFolded = false) {
  return { sessionId, currentBet, chips, isFolded };
}

describe("computeActionButtonsVisibility() — A1.4 visibility matrix", () => {
  it("pre-game (no round started) with enough players: only start visible", () => {
    const state = makeState({ roundStarted: false });
    const v = computeActionButtonsVisibility(state, "me", { activeCount: 2, isAllIn: false });
    expect(v.start).toBe(true);
    expect(v.check).toBe(false);
    expect(v.call).toBe(false);
    expect(v.fold).toBe(false);
    expect(v.allIn).toBe(false);
    expect(v.bet).toBe(false);
    expect(v.raise).toBe(false);
  });

  it("pre-game with only 1 active player: nothing visible (cannot start)", () => {
    const state = makeState({ roundStarted: false });
    const v = computeActionButtonsVisibility(state, "me", { activeCount: 1, isAllIn: false });
    expect(v.start).toBe(false);
  });

  it("in-hand, not my turn: nothing visible", () => {
    const state = makeState({ roundStarted: true, currentTurn: "other" });
    const me = makeMe("me");
    const v = computeActionButtonsVisibility(state, "me", { activeCount: 2, isAllIn: false, me });
    expect(v.start).toBe(false);
    expect(v.check).toBe(false);
    expect(v.call).toBe(false);
    expect(v.fold).toBe(false);
    expect(v.allIn).toBe(false);
    expect(v.bet).toBe(false);
    expect(v.raise).toBe(false);
  });

  it("in-hand, my turn, open street (no bet): check / bet / fold / all-in visible", () => {
    const state = makeState({ roundStarted: true, currentTurn: "me", currentBet: 0 });
    const me = makeMe("me", 0, 1000, false);
    const v = computeActionButtonsVisibility(state, "me", { activeCount: 2, isAllIn: false, me });
    expect(v.check).toBe(true);
    expect(v.bet).toBe(true);
    expect(v.fold).toBe(true);
    expect(v.allIn).toBe(true);
    expect(v.call).toBe(false);
    expect(v.raise).toBe(false);
  });

  it("in-hand, my turn, live raise: call / raise / fold / all-in visible", () => {
    const state = makeState({ roundStarted: true, currentTurn: "me", currentBet: 50 });
    const me = makeMe("me", 0, 1000, false);
    const v = computeActionButtonsVisibility(state, "me", { activeCount: 2, isAllIn: false, me });
    expect(v.call).toBe(true);
    expect(v.raise).toBe(true);
    expect(v.fold).toBe(true);
    expect(v.allIn).toBe(true);
    expect(v.check).toBe(false);
    expect(v.bet).toBe(false);
  });

  it("everyone all-in (showdown lock): nothing visible", () => {
    const state = makeState({ roundStarted: true, currentTurn: "me", currentBet: 0 });
    const v = computeActionButtonsVisibility(state, "me", { activeCount: 2, isAllIn: true });
    expect(v.start).toBe(false);
    expect(v.check).toBe(false);
    expect(v.call).toBe(false);
    expect(v.fold).toBe(false);
    expect(v.allIn).toBe(false);
    expect(v.bet).toBe(false);
    expect(v.raise).toBe(false);
  });

  it("folded me: nothing visible even if it would be my turn", () => {
    const state = makeState({ roundStarted: true, currentTurn: "me", currentBet: 0 });
    const me = makeMe("me", 0, 1000, true /* isFolded */);
    const v = computeActionButtonsVisibility(state, "me", { activeCount: 2, isAllIn: false, me });
    expect(v.check).toBe(false);
    expect(v.fold).toBe(false);
  });
});
