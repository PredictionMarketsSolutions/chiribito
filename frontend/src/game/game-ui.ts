/**
 * Game board UI: seats, players list, state labels, action buttons.
 */

import type { RoomState, PlayerState } from "../types";
import type { GameUiRefs, GameUiContext, ActionButtonsEnabled, GameUiTableSyncContext } from "./game-ui-types";
import { getUserEntries, isPlayerState, schemaArrayToCards } from "./room-state";
import { isInWinnerPhase } from "./winner-display";
import { createCardElement, renderCardRow, cardsEqual } from "../ui-cards";
import { flipRevealDomCard } from "../ui-cards-flip";
import { applyHoleCardRest } from "../ui-cards-rest";
import { markPerlaIfApplicable } from "./perla";
import { getCurrentHandName } from "./current-hand";
import { TOTAL_SEATS, computeVisualSeatLayout } from "./visual-layout";
import { renderPhaseIndicator } from "./phase-indicator";
import { phaseLabel } from "./phases";
import { applyHideIfEmpty } from "./meta-pills";
import { speakingContext } from "./speaking-order";
import { isPerfEnabled } from "../security";
import { perfRerenderInc } from "../perf/perf-counters";
import { flyChips } from "./table/chip-fly";
import { chipBurstCount } from "./table/chip-motion";
import { renderPotPile } from "./table/pot-pile";
import { potChipLayout } from "./table/chip-stack";
import { deliverPotToWinner } from "./table/pot-delivery";

function usePixiTableCards(ctx: GameUiContext): boolean {
  return Boolean(ctx.tableScene?.isActive());
}

export function renderSeats(
  state: RoomState,
  refs: GameUiRefs,
  ctx: GameUiContext
): void {
  if (isPerfEnabled()) perfRerenderInc("renderSeats");
  const entries = getUserEntries(state).filter(isPlayerState);
  const { visualSeats, visualSeatNumbers, dealerIndex } = computeVisualSeatLayout(state, ctx.currentSessionId);
  const inWinnerPhase = isInWinnerPhase(ctx.winnerDisplayState);
  const currentTurn = inWinnerPhase ? "" : (state?.currentTurn ?? "");
  const me = ctx.currentSessionId ? entries.find((p) => p.sessionId === ctx.currentSessionId) : undefined;

  const seats = Array.from(refs.seatsEl.querySelectorAll<HTMLDivElement>(".seat"));
  seats.forEach((seat, index) => {
    const nameEl = seat.querySelector<HTMLDivElement>(".seat-name");
    const metaEl = seat.querySelector<HTMLDivElement>(".seat-meta");
    const badgeEl = seat.querySelector<HTMLDivElement>(".seat-badge");
    let handEl = seat.querySelector<HTMLDivElement>(".seat-hand");
    const player = visualSeats[index];
    const logicalSeatIndex = visualSeatNumbers[index];

    if (!nameEl || !metaEl) return;

    if (!player) {
      seat.classList.remove("active", "you", "folded", "dealer", "turn", "winner");
      if (badgeEl) badgeEl.textContent = `Seat ${logicalSeatIndex + 1}`;
      nameEl.textContent = "Libre";
      metaEl.textContent = "";
      if (handEl) handEl.innerHTML = "";
      return;
    }

    const isYou = ctx.currentSessionId && player.sessionId === ctx.currentSessionId;
    const isWinner = ctx.winnerDisplayState.lastWinners.includes(player.sessionId);
    seat.classList.toggle("active", true);
    seat.classList.toggle("you", Boolean(isYou));
    seat.classList.toggle("folded", Boolean(player.isFolded));
    seat.classList.toggle("dealer", player.seatIndex === dealerIndex);
    seat.classList.toggle("turn", player.sessionId === currentTurn);
    seat.classList.toggle("winner", isWinner);
    if (badgeEl) badgeEl.textContent = `Seat ${player.seatIndex + 1}`;
    nameEl.textContent = `${player.name}${isYou ? " (tu)" : ""}`;

    metaEl.innerHTML = "";
    const chipsEl = document.createElement("span");
    chipsEl.classList.add("seat-chip");
    chipsEl.textContent = `Fichas ${player.chips}`;
    const betEl = document.createElement("span");
    betEl.classList.add("seat-bet");
    betEl.textContent = `Apuesta ${player.currentBet}`;
    metaEl.appendChild(chipsEl);
    metaEl.appendChild(betEl);
    if (isWinner && ctx.winnerDisplayState.lastWinningHand !== "-") {
      const wh = document.createElement("div");
      wh.classList.add("seat-winning-hand");
      wh.textContent = ctx.winnerDisplayState.lastWinningHand;
      metaEl.appendChild(wh);
    }
    if (isYou) {
      const hole = schemaArrayToCards(player.hand);
      if (hole.length >= 2) {
        const community = schemaArrayToCards(state?.communityCards);
        const currentHandName = getCurrentHandName(hole, community);
        const chEl = document.createElement("div");
        chEl.classList.add("seat-current-hand");
        chEl.textContent = currentHandName || "Tus cartas";
        metaEl.appendChild(chEl);
      }
    }

    if (!handEl) {
      handEl = document.createElement("div");
      handEl.classList.add("seat-hand");
      seat.insertBefore(handEl, seat.firstChild);
    }
    handEl.innerHTML = "";
    let cards: string[] =
      player.sessionId === ctx.currentSessionId
        ? schemaArrayToCards(me?.hand)
        : (ctx.revealedHands?.[player.sessionId] ?? []);
    if (
      player.sessionId !== ctx.currentSessionId &&
      ctx.winnerDisplayState.lastWinners.includes(player.sessionId) &&
      ctx.winnerDisplayState.lastWinningHand === "Gana por fold"
    ) {
      cards = [];
    }
    handEl.dataset.cards = JSON.stringify(cards);
    if (!usePixiTableCards(ctx)) {
      for (let i = 0; i < Math.min(cards.length, 2); i += 1) {
        const cardEl = createCardElement(cards[i]);
        cardEl.classList.add("mini");
        handEl.appendChild(cardEl);
      }
    }
  });
}

export function renderPlayers(state: RoomState, refs: GameUiRefs, ctx: GameUiContext): void {
  if (isPerfEnabled()) perfRerenderInc("renderPlayers");
  refs.playersList.innerHTML = "";
  refs.mobileSeatsList.innerHTML = "";
  if (!state?.users) return;

  const entries = getUserEntries(state).filter(isPlayerState);
  const inWinnerPhase = isInWinnerPhase(ctx.winnerDisplayState);
  const currentTurnId = inWinnerPhase ? "" : (state.currentTurn ?? "");
  entries.sort((a, b) => a.seatIndex - b.seatIndex);

  entries.forEach((player) => {
    const li = document.createElement("li");
    const isYou = ctx.currentSessionId && player.sessionId === ctx.currentSessionId ? " (you)" : "";
    li.textContent = `${player.name}${isYou} | chips: ${player.chips} | bet: ${player.currentBet}${player.isFolded ? " | folded" : ""}`;
    refs.playersList.appendChild(li);

    const mobileItem = document.createElement("li");
    mobileItem.classList.toggle("is-you", Boolean(isYou));
    mobileItem.classList.toggle("is-folded", Boolean(player.isFolded));
    mobileItem.classList.toggle("is-turn", player.sessionId === currentTurnId);
    const nameEl = document.createElement("span");
    nameEl.classList.add("mobile-seat-name");
    nameEl.textContent = `${player.name}${isYou}`;
    const metaEl = document.createElement("span");
    metaEl.classList.add("mobile-seat-meta");
    metaEl.textContent = `Apuesta ${player.currentBet} · Fichas ${player.chips}`;
    mobileItem.appendChild(nameEl);
    mobileItem.appendChild(metaEl);
    if (player.sessionId === currentTurnId) {
      const turnBadge = document.createElement("span");
      turnBadge.classList.add("mobile-seat-badge");
      turnBadge.textContent = "Turno";
      mobileItem.appendChild(turnBadge);
    }
    refs.mobileSeatsList.appendChild(mobileItem);
  });
}

export function renderState(
  state: RoomState,
  refs: GameUiRefs,
  ctx: GameUiContext,
  onUpdateTurnTimer: (state: RoomState) => void
): void {
  if (isPerfEnabled()) perfRerenderInc("renderState");
  if (!state) return;
  const entries = getUserEntries(state).filter(isPlayerState);
  ctx.latestPlayerNames.clear();
  entries.forEach((p) => ctx.latestPlayerNames.set(p.sessionId, p.name));

  const inWinnerPhase = isInWinnerPhase(ctx.winnerDisplayState);
  const currentTurnId = inWinnerPhase ? "" : (state.currentTurn ?? "");
  const turnPlayer = entries.find((p) => p.sessionId === currentTurnId);

  // Phase chip + sidebar status: human-readable label, never raw "card3".
  const phaseInfo = phaseLabel(state.phase);
  refs.phaseStatus.textContent =
    phaseInfo.streetNumber > 0
      ? `${phaseInfo.short} (calle ${phaseInfo.streetNumber}/6)`
      : phaseInfo.short;
  refs.turnStatus.textContent = turnPlayer?.name ?? (currentTurnId || "-");
  if (ctx.currentSessionId && currentTurnId === ctx.currentSessionId) {
    refs.yourTurnIndicator.classList.remove("hidden");
  } else {
    refs.yourTurnIndicator.classList.add("hidden");
  }

  const potValue = Number(state.pot ?? 0);
  const currentBetValue = Number(state.currentBet ?? 0);
  const prevPotForTween = ctx.previousPotValue;
  refs.potStatus.textContent = String(potValue);
  refs.betStatus.textContent = String(currentBetValue);
  const prevPotText = refs.potChip.textContent ?? "";
  const nextPotText = String(potValue);
  refs.potChip.textContent = nextPotText;
  if (prevPotText !== nextPotText) {
    // A1.2 — discreet 200ms scale pulse on pot change (replaces the now-hidden
    // Pixi scale-bump). Toggle off → reflow → on so re-renders re-trigger.
    const badge = refs.potChip.parentElement;
    if (badge) {
      badge.classList.remove("badge-pot--pulse");
      void badge.offsetWidth;
      badge.classList.add("badge-pot--pulse");
      // Table Presence I/F — the physical pot pile in the centre grows to match the pot,
      // and a rich burst of chips slides into it when the pot grows. Decorative and fully
      // guarded: a coord/null failure must never break the render.
      try {
        const surface = badge.closest(".table-surface") as HTMLElement | null;
        const pile = surface?.querySelector(".pot-pile") as HTMLElement | null;
        if (pile) {
          renderPotPile(pile, potValue);
          if (potValue > 0) pile.dataset.amount = String(potValue);
        }
        const delta = potValue - (prevPotForTween ?? 0);
        if (delta > 0 && surface) {
          const sr = surface.getBoundingClientRect();
          // Chips land in the centre pile (top ~60%), arriving from the player's edge.
          const to = { x: sr.width * 0.5 - 13, y: sr.height * 0.6 - 13 };
          const from = { x: sr.width * 0.5 - 13, y: sr.height * 0.84 };
          const count = chipBurstCount(delta, { max: 14, step: 70 });
          const colors = [...new Set(potChipLayout(delta).map((c) => c.color))];
          void flyChips(surface, from, to, { count, staggerMs: 45, colors });
        }
      } catch {
        /* pot pile + chip flight are purely decorative — swallow and carry on */
      }
    }
  }
  // Table Presence M — showdown: once a winner is shown, the pot pile slides to their
  // seat and the centre clears. Runs every render (so it fires when .seat.winner appears),
  // once per hand via a dataset flag, fully guarded — never breaks the end-of-hand flow.
  try {
    const surface = refs.potChip.parentElement?.closest(".table-surface") as HTMLElement | null;
    const pile = surface?.querySelector(".pot-pile") as HTMLElement | null;
    if (surface && pile) {
      if (!isInWinnerPhase(ctx.winnerDisplayState)) {
        delete pile.dataset.delivered;
      } else if (!pile.dataset.delivered && pile.children.length > 0) {
        const winnerSeat = surface.querySelector(".seat.winner") as HTMLElement | null;
        if (winnerSeat) {
          const sr = surface.getBoundingClientRect();
          const wr = winnerSeat.getBoundingClientRect();
          const from = { x: sr.width * 0.5 - 13, y: sr.height * 0.6 - 13 };
          const to = { x: wr.left - sr.left + wr.width / 2 - 13, y: wr.top - sr.top + wr.height / 2 - 13 };
          pile.dataset.delivered = "1";
          void deliverPotToWinner(surface, pile, from, to, Number(pile.dataset.amount ?? 0));
        }
      }
    }
  } catch {
    /* showdown delivery is decorative — never break the render */
  }
  // Phase chip + 6-dot progress indicator (mirrors the server's 6 streets).
  renderPhaseIndicator(state.phase, {
    progressEl: refs.phaseProgress,
    labelEl: refs.phaseChip
  });
  refs.turnChip.textContent = turnPlayer?.name ?? (currentTurnId || "-");
  // Speaking-order context: did the street just change? compare phase to
  // the previous render's snapshot stored on ctx.
  const streetJustChanged =
    ctx.previousPhase !== null && ctx.previousPhase !== state.phase;
  const speaking = speakingContext({
    phase: state.phase,
    currentTurn: currentTurnId,
    lastRaiser: (state as any)?.lastRaiser ?? "",
    streetJustChanged
  });
  if (refs.turnReason) {
    if (speaking.label) {
      refs.turnReason.textContent = speaking.label;
      refs.turnReason.title = speaking.long;
      refs.turnReason.classList.remove("hidden");
    } else {
      refs.turnReason.textContent = "";
      refs.turnReason.classList.add("hidden");
    }
  }
  ctx.previousPhase = state.phase ?? null;
  ctx.previousCurrentBetValue = currentBetValue;
  onUpdateTurnTimer(state);

  refs.winningHandStatus.textContent = ctx.winnerDisplayState.lastWinningHand;
  refs.winningHandChip.textContent = ctx.winnerDisplayState.lastWinningHand;
  refs.winnersStatus.textContent = ctx.winnerDisplayState.lastWinners.join(", ") || "-";

  // A1.3 — hide meta badges whose value is empty or '-'. Phase chip + dots
  // always carry meaningful state, so they are not toggled here.
  applyHideIfEmpty(refs.turnChip.parentElement as HTMLElement | null, refs.turnChip.textContent);
  applyHideIfEmpty(refs.turnTimerChip.parentElement as HTMLElement | null, refs.turnTimerChip.textContent);
  applyHideIfEmpty(refs.winningHandChip.parentElement as HTMLElement | null, refs.winningHandChip.textContent);

  const community = schemaArrayToCards(state.communityCards);
  refs.communityStatus.textContent = community.length ? community.join(" ") : "-";

  const activePlayers = entries.filter((p: PlayerState) => !p.isFolded && p.chips !== undefined);
  const allPlayersAllIn = activePlayers.length > 1 && activePlayers.every((p: PlayerState) => Number(p.chips ?? 0) === 0);
  updateActionButtons(state, refs, ctx, allPlayersAllIn);

  const pixiCards = usePixiTableCards(ctx);
  // Mobile renders cards via the DOM zones: the Pixi canvas is hidden on mobile
  // (CSS) because it can't position hole cards when seats are display:none.
  const narrowViewport = typeof window !== "undefined" && window.innerWidth <= 768;
  if (!ctx.allInRevealInProgress) {
    if (!cardsEqual(community, ctx.previousCommunityCards)) {
      if (!pixiCards || narrowViewport) {
        renderCardRow(refs.communityCardsEl, community, 5, { onReveal: flipRevealDomCard });
      }
      ctx.previousCommunityCards.length = 0;
      ctx.previousCommunityCards.push(...community);
    }
  }
  let handForZone: string[] = [];
  if (ctx.currentSessionId) {
    const me = entries.find((p: PlayerState) => p.sessionId === ctx.currentSessionId);
    const hand = schemaArrayToCards(me?.hand);
    handForZone = hand;
    const handName = getCurrentHandName(hand, community);
    if (hand.length >= 2) {
      refs.handStatus.textContent = `${hand.join(" ")} · ${handName || "Tus cartas"}`;
    } else {
      refs.handStatus.textContent = hand.length > 0 ? hand.join(" ") : "-";
    }
    ctx.previousHandCards.length = 0;
    ctx.previousHandCards.push(...hand);
    // Sidebar — your own bet + remaining chips, so you don't have to
    // hunt for your row in the players list to know what you have.
    if (refs.yourBetStatus) {
      refs.yourBetStatus.textContent = String(Number(me?.currentBet ?? 0));
    }
    if (refs.yourChipsStatus) {
      refs.yourChipsStatus.textContent = String(Number(me?.chips ?? 0));
    }
  } else {
    refs.handStatus.textContent = "-";
    ctx.previousHandCards.length = 0;
    if (refs.yourBetStatus) refs.yourBetStatus.textContent = "0";
    if (refs.yourChipsStatus) refs.yourChipsStatus.textContent = "0";
  }
  if (!pixiCards || narrowViewport) {
    renderCardRow(refs.handCardsEl, handForZone, 2);
    // Mobile DOM hole cards rest at their deterministic "placed by a hand" angle —
    // the desktop Pixi materiality brought to the DOM path. Static + transforms only,
    // applied synchronously so a freshly-rendered card is born already tilted (no
    // `.card` transition fires → a clean rest, never a settle). Board row untouched.
    applyHoleCardRest(refs.handCardsEl);
  }
  markPerlaIfApplicable(refs.handCardsEl, handForZone);
  renderSeats(state, refs, ctx);
  renderPlayers(state, refs, ctx);

  const table = ctx.tableScene;
  if (table?.isActive()) {
    table.updatePotDisplay(potValue, prevPotForTween);
    const syncCtx: GameUiTableSyncContext = {
      currentSessionId: ctx.currentSessionId,
      winnerDisplayState: ctx.winnerDisplayState,
      revealedHands: ctx.revealedHands,
      allInRevealInProgress: ctx.allInRevealInProgress,
      previousCommunityCards: ctx.previousCommunityCards,
    };
    table.syncFromState(state, syncCtx);
  }
  ctx.previousPotValue = potValue;
}

export function updateActionButtons(
  state: RoomState | null,
  refs: GameUiRefs,
  ctx: GameUiContext,
  isAllIn: boolean = false
): void {
  if (isPerfEnabled()) perfRerenderInc("updateActionButtons");
  if (isAllIn || !state || !ctx.currentSessionId) {
    setActionButtonsEnabled(refs, { canStart: false, canCheck: false, canCall: false, canFold: false, canAllIn: false, canBet: false, canRaise: false });
    setActionButtonsVisibility(refs, { start: false, check: false, call: false, fold: false, allIn: false, bet: false, raise: false });
    refs.callButton.textContent = "Igualar";
    return;
  }
  const entries = getUserEntries(state).filter(isPlayerState);
  const me = entries.find((p) => p.sessionId === ctx.currentSessionId);
  const isMyTurn = Boolean(me) && state.currentTurn === ctx.currentSessionId;
  const isActive = Boolean(me) && !me?.isFolded && Boolean(state.roundStarted);
  const canAct = isMyTurn && isActive;
  const currentBet = Number(state.currentBet ?? 0);
  const myBet = Number(me?.currentBet ?? 0);
  const myChips = Number(me?.chips ?? 0);

  const canCheck = canAct && currentBet === myBet;
  const canCall = canAct && currentBet > myBet && myChips > 0;
  const callAmount = currentBet - myBet;
  refs.callButton.textContent = canCall ? `Igualar ($${callAmount})` : "Igualar";

  const canFold = canAct;
  const canAllIn = canAct && myChips > 0;
  const canBet = canAct && currentBet === 0 && myChips > 0;
  const canRaise = canAct && currentBet > 0 && myChips > 0;
  const activeCount = entries.filter((p: PlayerState) => Number(p.chips ?? 0) > 0).length;
  const canStart = Boolean(ctx.currentSessionId) && !state.roundStarted && activeCount >= 2;

  setActionButtonsEnabled(refs, {
    canStart,
    canCheck,
    canCall,
    canFold,
    canAllIn,
    canBet,
    canRaise,
  });

  // A1.4 — project the same canX flags onto a visibility axis. Buttons that
  // do not apply this tick are hidden, not just disabled. Same render tick
  // as enabled-state, so transitions are atomic.
  const visibility = computeActionButtonsVisibility(state, ctx.currentSessionId ?? null, {
    activeCount,
    isAllIn,
    me: me ? {
      sessionId: me.sessionId,
      currentBet: Number(me.currentBet ?? 0),
      chips: Number(me.chips ?? 0),
      isFolded: Boolean(me.isFolded),
    } : undefined,
  });
  setActionButtonsVisibility(refs, visibility);
}

export function setActionButtonsEnabled(refs: GameUiRefs, e: ActionButtonsEnabled): void {
  refs.startGameButton.disabled = !e.canStart;
  refs.checkButton.disabled = !e.canCheck;
  refs.callButton.disabled = !e.canCall;
  refs.foldButton.disabled = !e.canFold;
  refs.allInButton.disabled = !e.canAllIn;
  refs.betButton.disabled = !e.canBet;
  refs.raiseButton.disabled = !e.canRaise;
}

/* ============================================================
   A1.4 — contextual action panel visibility.

   Same source of truth as setActionButtonsEnabled (the canX
   booleans derived in updateActionButtons). Instead of toggling
   .disabled on buttons that do not apply, we hide them entirely.
   The state machine is unchanged — we just project onto a
   parallel visibility axis.
   ============================================================ */

export interface ActionButtonsVisibility {
  start: boolean;
  check: boolean;
  call: boolean;
  fold: boolean;
  allIn: boolean;
  bet: boolean;
  raise: boolean;
}

interface ComputeVisibilityCtx {
  activeCount: number;
  isAllIn: boolean;
  me?: { sessionId: string; currentBet?: number; chips?: number; isFolded?: boolean } | undefined;
}

const EMPTY_VISIBILITY: ActionButtonsVisibility = {
  start: false, check: false, call: false, fold: false, allIn: false, bet: false, raise: false,
};

/** Pure function — easy to unit-test. Visibility = applicability. */
export function computeActionButtonsVisibility(
  state: RoomState | null,
  currentSessionId: string | null,
  ctx: ComputeVisibilityCtx
): ActionButtonsVisibility {
  if (!state || !currentSessionId || ctx.isAllIn) return { ...EMPTY_VISIBILITY };

  if (!state.roundStarted) {
    return { ...EMPTY_VISIBILITY, start: ctx.activeCount >= 2 };
  }
  const isMyTurn = state.currentTurn === currentSessionId;
  if (!isMyTurn) return { ...EMPTY_VISIBILITY };

  const me = ctx.me;
  if (!me || me.isFolded || (me.chips ?? 0) <= 0) return { ...EMPTY_VISIBILITY };

  const currentBet = Number(state.currentBet ?? 0);
  const myBet = Number(me.currentBet ?? 0);
  const openStreet = currentBet === myBet;
  const liveRaise = currentBet > myBet;

  return {
    start: false,
    check: openStreet,
    bet:   openStreet,
    fold:  true,
    allIn: true,
    call:  liveRaise,
    raise: liveRaise,
  };
}

export function setActionButtonsVisibility(refs: GameUiRefs, v: ActionButtonsVisibility): void {
  refs.startGameButton.classList.toggle("hidden", !v.start);
  refs.checkButton.classList.toggle("hidden", !v.check);
  refs.callButton.classList.toggle("hidden", !v.call);
  refs.foldButton.classList.toggle("hidden", !v.fold);
  refs.allInButton.classList.toggle("hidden", !v.allIn);
  refs.betButton.classList.toggle("hidden", !v.bet);
  refs.raiseButton.classList.toggle("hidden", !v.raise);

  // Hide the bet-group (input + bet + raise) whenever neither bet nor raise
  // applies — otherwise the empty input would float beside the start button
  // in pre-game.
  const betGroup = refs.betButton.parentElement; // .bet-group
  if (betGroup) betGroup.classList.toggle("hidden", !(v.bet || v.raise));

  // Hide the action-group (check + call + fold + all-in) when no in-hand
  // action applies — keeps the chrome quiet between hands and during
  // not-my-turn waits.
  const actionGroup = refs.checkButton.parentElement; // .action-group
  if (actionGroup) actionGroup.classList.toggle("hidden", !(v.check || v.call || v.fold || v.allIn));

  // Hide the whole panel chrome when no action applies at all (waiting for
  // other players, post-tournament, all-in lock). The container is fixed
  // bottom-right and would otherwise float as an empty chrome box.
  const anyVisible = v.start || v.check || v.call || v.fold || v.allIn || v.bet || v.raise;
  const container = refs.startGameButton.parentElement; // .game-actions
  if (container) container.classList.toggle("hidden", !anyVisible);
}
