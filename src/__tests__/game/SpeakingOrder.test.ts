/**
 * SpeakingOrder.test.ts
 *
 * Asserts the authentic Chiribito speaking order on every new street:
 *   - If `state.lastRaiser` is still in the hand and not folded,
 *     they speak first on the next street.
 *   - Otherwise, the first active player clockwise from the dealer.
 *
 * Distinct from Hold'em, which always opens post-flop on the player
 * left of the dealer regardless of who last raised.
 */

import { GameEngine } from "../../rooms/game/GameEngine";
import { PHASES, TOTAL_COMMUNITY_CARDS } from "../../rooms/game/glossary";

type FakePlayer = {
  sessionId: string;
  chips: number;
  isFolded: boolean;
  currentBet: number;
  hand: string[];
  playerStatus: string;
};

function buildFakeRoom(players: FakePlayer[], dealerIndex = 0) {
  const usersMap = new Map<string, FakePlayer>();
  players.forEach((p) => usersMap.set(p.sessionId, p));
  const community: string[] = [];

  const fakeRoom: any = {
    roomId: "speaking-order-test",
    state: {
      users: usersMap,
      communityCards: {
        push: (c: string) => community.push(c),
        clear: () => { community.length = 0; },
        toArray: () => [...community],
        get length() { return community.length; }
      },
      pot: 0,
      currentBet: 0,
      currentTurn: "",
      dealerIndex,
      roundStarted: true,
      phase: PHASES.PREFLOP,
      lastRaiser: "",
      resetDeck: jest.fn(),
      dealCard: jest.fn(() => "7O")
    },
    playersInHand: players.map((p) => p.sessionId),
    playersAllIn: new Set<string>(),
    playersActedThisRound: new Set<string>(),
    dealerIndex,
    currentPlayerIndex: 0,
    turnTimeout: null,
    clients: [],
    broadcast: jest.fn(),
    scheduleDelayed: jest.fn()
  };
  return fakeRoom;
}

describe("Chiribito speaking order on new streets", () => {
  beforeAll(() => {
    process.env.DISABLE_ENV_VALIDATION = "true";
  });

  function players(): FakePlayer[] {
    return [
      { sessionId: "A", chips: 1000, isFolded: false, currentBet: 0, hand: [], playerStatus: "in_hand" },
      { sessionId: "B", chips: 1000, isFolded: false, currentBet: 0, hand: [], playerStatus: "in_hand" },
      { sessionId: "C", chips: 1000, isFolded: false, currentBet: 0, hand: [], playerStatus: "in_hand" }
    ];
  }

  it("opens the next street with the last raiser when they are still active", () => {
    const room = buildFakeRoom(players(), /*dealerIndex=*/0);
    room.state.lastRaiser = "C";
    room.state.phase = PHASES.PREFLOP;

    const engine = new GameEngine(room);
    engine.proceedToNextPhase();

    // Phase advances to CARD_1 (first community card revealed).
    expect(room.state.phase).toBe(PHASES.CARD_1);
    // C — the last raiser — speaks first.
    expect(room.state.currentTurn).toBe("C");
  });

  it("falls back to first-active-after-dealer when the last raiser folded between streets", () => {
    const ps = players();
    ps[2].isFolded = true; // C folded
    const room = buildFakeRoom(ps, /*dealerIndex=*/0);
    room.state.lastRaiser = "C";
    room.state.phase = PHASES.PREFLOP;

    const engine = new GameEngine(room);
    engine.proceedToNextPhase();

    // With the last raiser folded, action opens to the first active
    // player after the dealer (dealer is A; first active after A is B).
    expect(room.state.currentTurn).toBe("B");
  });

  it("falls back to first-active-after-dealer when there is no last raiser yet", () => {
    const room = buildFakeRoom(players(), /*dealerIndex=*/1);
    room.state.lastRaiser = "";
    room.state.phase = PHASES.PREFLOP;

    const engine = new GameEngine(room);
    engine.proceedToNextPhase();

    // dealer is B, so the first active player after B is C.
    expect(room.state.currentTurn).toBe("C");
  });

  it("preserves the last raiser across multiple streets until someone raises again", () => {
    const room = buildFakeRoom(players(), /*dealerIndex=*/0);
    room.state.lastRaiser = "B";
    room.state.phase = PHASES.PREFLOP;

    const engine = new GameEngine(room);

    engine.proceedToNextPhase();
    expect(room.state.phase).toBe(PHASES.CARD_1);
    expect(room.state.currentTurn).toBe("B");

    engine.proceedToNextPhase();
    expect(room.state.phase).toBe(PHASES.CARD_2);
    expect(room.state.currentTurn).toBe("B");
  });

  it("transitions to showdown after the five community cards are revealed", () => {
    const room = buildFakeRoom(players(), /*dealerIndex=*/0);
    room.state.lastRaiser = "A";
    room.state.phase = PHASES.PREFLOP;

    const engine = new GameEngine(room);
    engine.proceedToNextPhase();
    engine.proceedToNextPhase();
    engine.proceedToNextPhase();
    engine.proceedToNextPhase();
    engine.proceedToNextPhase();

    expect(room.state.communityCards.length).toBe(TOTAL_COMMUNITY_CARDS);
    expect(room.state.phase).toBe(PHASES.CARD_5);
  });
});
