/**
 * Game board UI: seats, players list, state labels, action buttons.
 */

import type { RoomState, PlayerState } from "../types";
import type { GameUiRefs, GameUiContext, ActionButtonsEnabled } from "./game-ui-types";
import { getUserEntries, isPlayerState, schemaArrayToCards } from "./room-state";
import { isInWinnerPhase } from "./winner-display";
import { createCardElement, renderCardRow, cardsEqual } from "../ui-cards";
import { getCurrentHandName } from "./current-hand";

const TOTAL_SEATS = 6;
const TARGET_FRONT_INDEX = 3;

export function renderSeats(
  state: RoomState,
  refs: GameUiRefs,
  ctx: GameUiContext
): void {
  const entries = getUserEntries(state).filter(isPlayerState);
  const dealerIndex = typeof state?.dealerIndex === "number" ? state.dealerIndex : -1;
  const inWinnerPhase = isInWinnerPhase(ctx.winnerDisplayState);
  const currentTurn = inWinnerPhase ? "" : (state?.currentTurn ?? "");
  const me = ctx.currentSessionId ? entries.find((p) => p.sessionId === ctx.currentSessionId) : undefined;

  const playersBySeat: Array<PlayerState | undefined> = Array(TOTAL_SEATS).fill(undefined);
  entries.forEach((player) => {
    if (Number.isFinite(player.seatIndex) && player.seatIndex >= 0 && player.seatIndex < TOTAL_SEATS) {
      playersBySeat[player.seatIndex] = player;
    }
  });

  let seatShift = 0;
  const myPlayer = entries.find((p) => p.sessionId === ctx.currentSessionId);
  if (myPlayer && Number.isFinite(myPlayer.seatIndex)) {
    seatShift = (TARGET_FRONT_INDEX - myPlayer.seatIndex + TOTAL_SEATS) % TOTAL_SEATS;
  }

  const visualSeats: Array<PlayerState | undefined> = Array(TOTAL_SEATS).fill(undefined);
  const visualSeatNumbers: number[] = Array(TOTAL_SEATS).fill(0);
  for (let logicalIndex = 0; logicalIndex < TOTAL_SEATS; logicalIndex += 1) {
    const visualIndex = (logicalIndex + seatShift) % TOTAL_SEATS;
    visualSeats[visualIndex] = playersBySeat[logicalIndex];
    visualSeatNumbers[visualIndex] = logicalIndex;
  }

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
      const community = schemaArrayToCards(state?.communityCards);
      const currentHandName = getCurrentHandName(hole, community);
      if (currentHandName) {
        const chEl = document.createElement("div");
        chEl.classList.add("seat-current-hand");
        chEl.textContent = currentHandName;
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
    for (let i = 0; i < Math.min(cards.length, 2); i += 1) {
      const cardEl = createCardElement(cards[i]);
      cardEl.classList.add("mini");
      handEl.appendChild(cardEl);
    }
  });
}

export function renderPlayers(state: RoomState, refs: GameUiRefs, ctx: GameUiContext): void {
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
  if (!state) return;
  const entries = getUserEntries(state).filter(isPlayerState);
  ctx.latestPlayerNames.clear();
  entries.forEach((p) => ctx.latestPlayerNames.set(p.sessionId, p.name));

  const inWinnerPhase = isInWinnerPhase(ctx.winnerDisplayState);
  const currentTurnId = inWinnerPhase ? "" : (state.currentTurn ?? "");
  const turnPlayer = entries.find((p) => p.sessionId === currentTurnId);

  refs.phaseStatus.textContent = state.phase ?? "-";
  refs.turnStatus.textContent = turnPlayer?.name ?? (currentTurnId || "-");
  if (ctx.currentSessionId && currentTurnId === ctx.currentSessionId) {
    refs.yourTurnIndicator.classList.remove("hidden");
  } else {
    refs.yourTurnIndicator.classList.add("hidden");
  }

  const potValue = Number(state.pot ?? 0);
  const currentBetValue = Number(state.currentBet ?? 0);
  refs.potStatus.textContent = String(potValue);
  refs.betStatus.textContent = String(currentBetValue);
  refs.potChip.textContent = String(potValue);
  refs.phaseChip.textContent = state.phase ?? "waiting";
  refs.turnChip.textContent = turnPlayer?.name ?? (currentTurnId || "-");
  ctx.previousPotValue = potValue;
  ctx.previousCurrentBetValue = currentBetValue;
  onUpdateTurnTimer(state);

  refs.winningHandStatus.textContent = ctx.winnerDisplayState.lastWinningHand;
  refs.winningHandChip.textContent = ctx.winnerDisplayState.lastWinningHand;
  refs.winnersStatus.textContent = ctx.winnerDisplayState.lastWinners.join(", ") || "-";

  const community = schemaArrayToCards(state.communityCards);
  refs.communityStatus.textContent = community.length ? community.join(" ") : "-";

  const activePlayers = entries.filter((p: PlayerState) => !p.isFolded && p.chips !== undefined);
  const allPlayersAllIn = activePlayers.length > 1 && activePlayers.every((p: PlayerState) => Number(p.chips ?? 0) === 0);
  updateActionButtons(state, refs, ctx, allPlayersAllIn);

  if (!ctx.allInRevealInProgress) {
    if (!cardsEqual(community, ctx.previousCommunityCards)) {
      renderCardRow(refs.communityCardsEl, community, 5);
      ctx.previousCommunityCards.length = 0;
      ctx.previousCommunityCards.push(...community);
    }
  }
  if (ctx.currentSessionId) {
    const me = entries.find((p: PlayerState) => p.sessionId === ctx.currentSessionId);
    const hand = schemaArrayToCards(me?.hand);
    const handName = getCurrentHandName(hand, community);
    if (hand.length > 0) {
      refs.handStatus.textContent = handName ? `${hand.join(" ")} · ${handName}` : hand.join(" ");
    } else {
      refs.handStatus.textContent = "-";
    }
    ctx.previousHandCards.length = 0;
    ctx.previousHandCards.push(...hand);
  } else {
    refs.handStatus.textContent = "-";
    ctx.previousHandCards.length = 0;
  }
  renderCardRow(refs.handCardsEl, [], 2);
  renderSeats(state, refs, ctx);
  renderPlayers(state, refs, ctx);
}

export function updateActionButtons(
  state: RoomState | null,
  refs: GameUiRefs,
  ctx: GameUiContext,
  isAllIn: boolean = false
): void {
  if (isAllIn || !state || !ctx.currentSessionId) {
    setActionButtonsEnabled(refs, { canStart: false, canCheck: false, canCall: false, canFold: false, canAllIn: false, canBet: false, canRaise: false });
    refs.callButton.textContent = "Call";
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
  refs.callButton.textContent = canCall ? `Call ($${callAmount})` : "Call";

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
