/**
 * Tests for renderSeats bot badge behavior (Task 1 RED — will fail until Task 2 lands the isBot change).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { renderSeats } from "./game-ui";
import type { RoomState, PlayerState } from "../types";
import type { GameUiRefs, GameUiContext } from "./game-ui-types";

/** Build minimal DOM with 6 seats matching index.html structure. */
function buildSeatsDom(): HTMLDivElement {
  const container = document.createElement("div");
  container.id = "seats";
  for (let i = 0; i < 6; i++) {
    const seat = document.createElement("div");
    seat.className = "seat";
    seat.dataset.seat = String(i);

    const badge = document.createElement("div");
    badge.className = "seat-badge";
    badge.textContent = `Seat ${i + 1}`;

    const name = document.createElement("div");
    name.className = "seat-name";
    name.textContent = "Libre";

    const meta = document.createElement("div");
    meta.className = "seat-meta";

    seat.appendChild(badge);
    seat.appendChild(name);
    seat.appendChild(meta);
    container.appendChild(seat);
  }
  return container;
}

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    sessionId: "sess-1",
    name: "Bot 1",
    chips: 1000,
    currentBet: 0,
    isFolded: false,
    seatIndex: 0,
    ...overrides,
  };
}

function makeState(player: PlayerState): RoomState {
  return {
    users: new Map([[player.sessionId, player]]),
    dealerIndex: 0,
    currentTurn: undefined,
    phase: "preflop",
    pot: 0,
    currentBet: 0,
    roundStarted: false,
  };
}

function makeRefs(seatsEl: HTMLDivElement): GameUiRefs {
  const stub = document.createElement("span") as unknown as HTMLSpanElement;
  const stubDiv = document.createElement("div") as unknown as HTMLDivElement;
  const stubBtn = document.createElement("button") as unknown as HTMLButtonElement;
  const stubUl = document.createElement("ul") as unknown as HTMLUListElement;
  return {
    phaseStatus: stub,
    turnStatus: stub,
    yourTurnIndicator: stubDiv,
    potStatus: stub,
    betStatus: stub,
    yourBetStatus: null,
    yourChipsStatus: null,
    potChip: stub,
    phaseChip: stub,
    phaseProgress: null,
    turnChip: stub,
    turnReason: null,
    turnTimerChip: stub,
    winningHandStatus: stub,
    winningHandChip: stub,
    winnersStatus: stub,
    communityStatus: stub,
    handStatus: stub,
    communityCardsEl: stubDiv,
    handCardsEl: stubDiv,
    seatsEl,
    playersList: stubUl,
    mobileSeatsList: stubUl,
    startGameButton: stubBtn,
    checkButton: stubBtn,
    callButton: stubBtn,
    foldButton: stubBtn,
    allInButton: stubBtn,
    betButton: stubBtn,
    raiseButton: stubBtn,
  };
}

function makeCtx(): GameUiContext {
  return {
    currentSessionId: null,
    winnerDisplayState: {
      lastWinners: [],
      lastWinningHand: "-",
      winnerDisplayUntil: 0,
      winnerDisplayTimeoutId: null,
    },
    revealedHands: null,
    previousCommunityCards: [],
    previousHandCards: [],
    previousPotValue: null,
    previousCurrentBetValue: null,
    previousPhase: null,
    allInRevealInProgress: false,
    latestPlayerNames: new Map(),
    tableScene: null,
  };
}

describe("renderSeats — bot badge", () => {
  let seatsEl: HTMLDivElement;

  beforeEach(() => {
    seatsEl = buildSeatsDom();
    document.body.appendChild(seatsEl);
  });

  it("occupied seat with isBot===true sets seat-badge textContent to include 'Máquina'", () => {
    const player = makePlayer({ isBot: true });
    const state = makeState(player);
    const refs = makeRefs(seatsEl);
    const ctx = makeCtx();

    renderSeats(state, refs, ctx);

    // seatIndex=0 maps to visual slot 0 (no shift since currentSessionId is null)
    // Phase 6: badge is now "${glyph} Máquina" (avatar glyph prepended to Máquina)
    const badge = seatsEl.querySelectorAll(".seat-badge")[0];
    expect(badge.textContent).toContain("Máquina");
  });

  it("occupied seat with isBot===true adds class seat-badge--bot", () => {
    const player = makePlayer({ isBot: true });
    const state = makeState(player);
    const refs = makeRefs(seatsEl);
    const ctx = makeCtx();

    renderSeats(state, refs, ctx);

    const badge = seatsEl.querySelectorAll(".seat-badge")[0];
    expect(badge.classList.contains("seat-badge--bot")).toBe(true);
  });

  it("occupied seat with isBot===false sets seat-badge textContent to 'Seat N'", () => {
    const player = makePlayer({ isBot: false, seatIndex: 1, sessionId: "sess-2" });
    const state = makeState(player);
    const refs = makeRefs(seatsEl);
    const ctx = makeCtx();

    renderSeats(state, refs, ctx);

    const badge = seatsEl.querySelectorAll(".seat-badge")[1];
    expect(badge.textContent).toBe("Seat 2");
  });

  it("occupied seat with isBot===false does NOT have seat-badge--bot class", () => {
    const player = makePlayer({ isBot: false, seatIndex: 1, sessionId: "sess-2" });
    const state = makeState(player);
    const refs = makeRefs(seatsEl);
    const ctx = makeCtx();

    renderSeats(state, refs, ctx);

    const badge = seatsEl.querySelectorAll(".seat-badge")[1];
    expect(badge.classList.contains("seat-badge--bot")).toBe(false);
  });

  it("occupied seat with isBot undefined (human, default) does NOT have seat-badge--bot class", () => {
    const player = makePlayer({ seatIndex: 2, sessionId: "sess-3" }); // no isBot field
    const state = makeState(player);
    const refs = makeRefs(seatsEl);
    const ctx = makeCtx();

    renderSeats(state, refs, ctx);

    const badge = seatsEl.querySelectorAll(".seat-badge")[2];
    expect(badge.classList.contains("seat-badge--bot")).toBe(false);
    expect(badge.textContent).toBe("Seat 3");
  });

  it("empty seat keeps 'Seat N' text (no badge regression)", () => {
    // State with no players
    const state: RoomState = {
      users: new Map(),
    };
    const refs = makeRefs(seatsEl);
    const ctx = makeCtx();

    renderSeats(state, refs, ctx);

    const badge = seatsEl.querySelectorAll(".seat-badge")[0];
    expect(badge.textContent).toBe("Seat 1");
    expect(badge.classList.contains("seat-badge--bot")).toBe(false);
  });
});

describe("renderSeats — castizo avatar glyph (Phase 6, Task 5)", () => {
  let seatsEl: HTMLDivElement;

  beforeEach(() => {
    seatsEl = buildSeatsDom();
    document.body.appendChild(seatsEl);
  });

  it("bot with avatar 'pato' renders badge containing '🦆' and 'Máquina'", () => {
    // RED: game-ui.ts does not yet call resolveAvatarGlyph, so badge is just "Máquina"
    const player = makePlayer({ isBot: true, avatar: "pato" });
    const state = makeState(player);
    const refs = makeRefs(seatsEl);
    const ctx = makeCtx();

    renderSeats(state, refs, ctx);

    const badge = seatsEl.querySelectorAll(".seat-badge")[0];
    expect(badge.textContent).toContain("🦆");
    expect(badge.textContent).toContain("Máquina");
    // Badge must use seat-badge--bot class (not a winner/gold class from this code)
    expect(badge.classList.contains("seat-badge--bot")).toBe(true);
  });

  it("bot with avatar 'toro' renders badge containing '🐂' and 'Máquina'", () => {
    const player = makePlayer({ isBot: true, avatar: "toro", seatIndex: 1, sessionId: "sess-t" });
    const state = makeState(player);
    const refs = makeRefs(seatsEl);
    const ctx = makeCtx();

    renderSeats(state, refs, ctx);

    const badge = seatsEl.querySelectorAll(".seat-badge")[1];
    expect(badge.textContent).toContain("🐂");
    expect(badge.textContent).toContain("Máquina");
  });

  it("bot with no avatar (undefined) renders Máquina with neutral default glyph — never 'undefined'", () => {
    const player = makePlayer({ isBot: true }); // no avatar field
    const state = makeState(player);
    const refs = makeRefs(seatsEl);
    const ctx = makeCtx();

    renderSeats(state, refs, ctx);

    const badge = seatsEl.querySelectorAll(".seat-badge")[0];
    expect(badge.textContent).toContain("Máquina");
    expect(badge.textContent).not.toContain("undefined");
    // Should contain a glyph (not just "Máquina" alone)
    expect(badge.textContent!.trim()).not.toBe("Máquina");
  });

  it("bot with empty string avatar renders Máquina with neutral default glyph — never 'undefined'", () => {
    const player = makePlayer({ isBot: true, avatar: "" });
    const state = makeState(player);
    const refs = makeRefs(seatsEl);
    const ctx = makeCtx();

    renderSeats(state, refs, ctx);

    const badge = seatsEl.querySelectorAll(".seat-badge")[0];
    expect(badge.textContent).toContain("Máquina");
    expect(badge.textContent).not.toContain("undefined");
  });

  it("non-bot player seat is unchanged: 'Seat N', no glyph, no Máquina", () => {
    const player = makePlayer({ isBot: false, seatIndex: 2, sessionId: "sess-h" });
    const state = makeState(player);
    const refs = makeRefs(seatsEl);
    const ctx = makeCtx();

    renderSeats(state, refs, ctx);

    const badge = seatsEl.querySelectorAll(".seat-badge")[2];
    expect(badge.textContent).toBe("Seat 3");
    expect(badge.textContent).not.toContain("🦆");
    expect(badge.textContent).not.toContain("🐂");
    expect(badge.textContent).not.toContain("Máquina");
    expect(badge.classList.contains("seat-badge--bot")).toBe(false);
  });

  it("avatar glyph does NOT add gold/winner class to badge (inherits seat-badge--bot only)", () => {
    const player = makePlayer({ isBot: true, avatar: "pato" });
    const state = makeState(player);
    const refs = makeRefs(seatsEl);
    const ctx = makeCtx();

    renderSeats(state, refs, ctx);

    const badge = seatsEl.querySelectorAll(".seat-badge")[0];
    // The avatar render must not add gold or winner-specific classes
    expect(badge.classList.contains("seat-badge--winner")).toBe(false);
    expect(badge.classList.contains("gold")).toBe(false);
    expect(badge.classList.contains("seat-badge--turn")).toBe(false);
    // Only the bot class is present from this code path
    expect(badge.classList.contains("seat-badge--bot")).toBe(true);
  });
});
