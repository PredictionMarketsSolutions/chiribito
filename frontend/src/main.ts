import { Client, Room } from "@colyseus/sdk";

import { API_URL, WS_URL, TURN_TIMEOUT_MS, MAX_RECONNECT_ATTEMPTS, MAX_HAND_HISTORY, ACTION_BUFFER_MAX_SIZE } from "./config";
import type { RoomState, PlayerState, ConnectionState } from "./types";
import type {
  GameResultPayload,
  RoundEndedPayload,
  CommunityCardRevealedPayload,
  PlayerDisconnectedPayload,
} from "./types/room-messages";
import { queueAction as queueActionFn, replayBufferedActions as replayBufferedActionsFn } from "./action-buffer";
import { audio } from "./audio";
import { dom } from "./dom-refs";
import {
  request,
  getFormValues,
  getLoginValues,
  mapAuthError,
  setAuthOverlayVisible,
  setAuthMessage
} from "./auth-helpers";
import {
  setLobbyOverlayVisible as setLobbyOverlayVisibleFn,
  setLobbyMessage as setLobbyMessageFn,
  showTournamentResult as showTournamentResultFn,
  setTournamentResultVisible as setTournamentResultVisibleFn,
  showGameEndMessage as showGameEndMessageFn,
  type OverlayRefs
} from "./overlays";
import {
  getWsClient as getWsClientFromConnection,
  startClientHeartbeat as startClientHeartbeatFn,
  stopClientHeartbeat as stopClientHeartbeatFn,
  clearHeartbeatTimeout as clearHeartbeatTimeoutFn,
  recordRtt as recordRttFn,
  getRttInfo,
  updateConnectionIndicator as updateConnectionIndicatorFn,
  attemptReconnect as attemptReconnectFn
} from "./connection";
import {
  addHandHistoryEntry,
  clearHandHistory,
  renderHandHistory
} from "./hand-history";
import { createCardElement, renderCardRow, cardsEqual, preloadCardImages } from "./ui-cards";
import { attemptTokenRefresh } from "./auth/token-refresh";
import { startTokenMonitor as startTokenMonitorFn, stopTokenMonitor as stopTokenMonitorFn } from "./auth/token-monitor";
import { runPostLoginAutoRejoin } from "./auth/login-auto-rejoin";
import { disconnectRoom } from "./auth/room-disconnect";
import { refreshLobbyRooms, type LobbyDeps } from "./lobby";
import {
  schemaArrayToCards,
  getUserEntries,
  isPlayerState,
  startWinnerDisplayPhase as startWinnerDisplayPhaseFn,
  clearWinnerDisplay,
  isInWinnerPhase,
  WINNER_DISPLAY_MS,
  startTurnTimer as startTurnTimerFn,
  stopTurnTimer as stopTurnTimerFn,
  updateTurnTimer as updateTurnTimerFn,
  renderSeats as renderSeatsFn,
  renderPlayers as renderPlayersFn,
  renderState as renderStateFn,
  updateActionButtons as updateActionButtonsFn,
  setActionButtonsEnabled as setActionButtonsEnabledFn,
} from "./game";
import type { WinnerDisplayState, TurnTimerState } from "./game";
import type { GameUiRefs, GameUiContext } from "./game/game-ui-types";
import { getWinnerDisplayFromRoundEnd } from "./game/round-end-winner";
import { refreshWinnersRanking as refreshWinnersRankingFn } from "./app/winners-ranking";
import { createLobbyPollingController } from "./app/lobby-polling";
import { bindGameActionButtons } from "./app/game-action-bindings";
import { bindForgotPasswordUi } from "./app/forgot-password-ui";
import { openLobbyFlow } from "./app/lobby-controller";
import { bindAuthEntryButtons } from "./app/auth-entry-bindings";
import {
  validateJoinRequest,
  handleJoinError,
  type JoinMode,
} from "./app/room-join";
import { handleRoomLeave } from "./app/room-leave-handler";
import {
  handleGameResultMessage,
  handlePlayerDisconnectedMessage,
  handleHeartbeatAckMessage,
} from "./app/room-message-handlers";
import { buildRoundEndedHistoryData } from "./app/round-ended-history";
import { applyWinnerUiState } from "./app/round-ended-winner-ui";
import { applyAllInShowdownOutcome, applyStandardRoundOutcome } from "./app/round-ended-outcome";
import { bindCoreRoomEvents } from "./app/room-event-bindings";
import { applyPostJoinSetup, finalizeJoinAttempt } from "./app/join-room-lifecycle";

// Security modules
import {
  initFrontendSecurity,
  SecureStorage,
  ApiClient,
  validateEmail,
  validatePassword,
  validateUsername,
  stateGuard
} from "./security";

const logEl = dom.log!;
const authOverlay = dom.authOverlay!;
const authMessage = dom.authMessage!;
const lobbyOverlay = dom.lobbyOverlay!;
const lobbyMessage = dom.lobbyMessage!;
const roomsList = dom.roomsList!;

const overlayRefs: OverlayRefs = {
  lobbyOverlay,
  lobbyMessage,
  tournamentResultOverlay: dom.tournamentResultOverlay!,
  tournamentResultTitle: dom.tournamentResultTitle!,
  tournamentResultMessage: dom.tournamentResultMessage!
};
const winnersRankingList = dom.winnersRankingList!;
const refreshRoomsButton = dom.refreshRoomsButton!;
const tableNameInput = dom.tableNameInput!;
const createTableButton = dom.createTableButton!;
const backToAuthButton = dom.backToAuthButton!;
const joinRoomIdInput = dom.joinRoomIdInput!;
const joinByIdButton = dom.joinByIdButton!;
const tournamentBackToLobbyButton = dom.tournamentBackToLobbyButton!;
const tokenStatus = dom.tokenStatus!;
const roomStatus = dom.roomStatus!;
const phaseStatus = dom.phaseStatus!;
const turnStatus = dom.turnStatus!;
const potStatus = dom.potStatus!;
const betStatus = dom.betStatus!;
const communityStatus = dom.communityStatus!;
const handStatus = dom.handStatus!;
const winningHandStatus = dom.winningHandStatus!;
const winnersStatus = dom.winnersStatus!;
const communityCardsEl = dom.communityCardsEl!;
const handCardsEl = dom.handCardsEl!;
const potChip = dom.potChip!;
const phaseChip = dom.phaseChip!;
const turnChip = dom.turnChip!;
const turnTimerChip = dom.turnTimerChip!;
const winningHandChip = dom.winningHandChip!;
const seatsEl = dom.seatsEl!;
const playersList = dom.playersList!;
const handHistoryList = dom.handHistoryList!;
const mobileSeatsList = dom.mobileSeatsList!;
const apiUrlEl = dom.apiUrlEl!;
const wsUrlEl = dom.wsUrlEl!;
const startGameButton = dom.startGameButton!;
const checkButton = dom.checkButton!;
const callButton = dom.callButton!;
const foldButton = dom.foldButton!;
const allInButton = dom.allInButton!;
const betButton = dom.betButton!;
const raiseButton = dom.raiseButton!;
const connectionIndicator = dom.connectionIndicator!;
const rttStatus = dom.rttStatus!;
const qualityStatus = dom.qualityStatus!;
const bufferStatus = dom.bufferStatus!;
const yourTurnIndicator = dom.yourTurnIndicator!;
const cardPopover = dom.cardPopover;
const cardPopoverCards = dom.cardPopoverCards;;

function setupCardPopover() {
  if (!seatsEl || !cardPopover || !cardPopoverCards) return;
  let hideTimeout: ReturnType<typeof setTimeout> | null = null;
  let popoverPinned = false;

  function showPopover(hand: HTMLElement) {
    if (!cardPopover || !cardPopoverCards) return;
    const raw = hand.getAttribute("data-cards");
    let cards: string[] = [];
    try {
      cards = raw ? JSON.parse(raw) : [];
    } catch {
      /* ignore */
    }
    if (cards.length === 0) return;
    cardPopoverCards.innerHTML = "";
    cards.forEach((card) => {
      const el = createCardElement(card);
      cardPopoverCards.appendChild(el);
    });
    cardPopover.classList.remove("hidden");
    cardPopover.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      if (!cardPopover) return;
      const rect = hand.getBoundingClientRect();
      const popRect = cardPopover.getBoundingClientRect();
      const padding = 12;
      let left = rect.left + rect.width / 2 - popRect.width / 2;
      let top = rect.top - popRect.height - padding;
      left = Math.max(padding, Math.min(left, document.documentElement.clientWidth - popRect.width - padding));
      top = Math.max(padding, Math.min(top, document.documentElement.clientHeight - popRect.height - padding));
      cardPopover.style.left = `${left}px`;
      cardPopover.style.top = `${top}px`;
    });
  }

  function hidePopover() {
    if (cardPopover) {
      cardPopover.classList.add("hidden");
      cardPopover.setAttribute("aria-hidden", "true");
    }
    popoverPinned = false;
  }

  seatsEl.addEventListener("mouseenter", (e: MouseEvent) => {
    const hand = (e.target as HTMLElement).closest<HTMLElement>(".seat-hand");
    if (!hand || !cardPopover || !cardPopoverCards) return;
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    showPopover(hand);
  }, true);

  seatsEl.addEventListener("mouseleave", (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest(".seat-hand")) return;
    if (popoverPinned) return;
    hideTimeout = setTimeout(() => {
      hidePopover();
      hideTimeout = null;
    }, 200);
  }, true);

  seatsEl.addEventListener("click", (e: MouseEvent) => {
    const hand = (e.target as HTMLElement).closest<HTMLElement>(".seat-hand");
    if (!hand || !cardPopover || !cardPopoverCards) return;
    e.stopPropagation();
    const raw = hand.getAttribute("data-cards");
    let cards: string[] = [];
    try {
      cards = raw ? JSON.parse(raw) : [];
    } catch {
      /* ignore */
    }
    if (cards.length === 0) return;
    if (cardPopover.classList.contains("hidden")) {
      showPopover(hand);
      popoverPinned = true;
    } else {
      hidePopover();
    }
  }, true);

  cardPopover.addEventListener("click", (e: MouseEvent) => {
    e.stopPropagation();
    if (popoverPinned) hidePopover();
  });

  document.addEventListener("click", () => {
    if (!cardPopover || cardPopover.classList.contains("hidden")) return;
    if (popoverPinned) hidePopover();
  });
}

// Initialize after functions are defined
document.addEventListener("DOMContentLoaded", () => {
  apiUrlEl.textContent = API_URL;
  wsUrlEl.textContent = WS_URL;
  void initPixiLayer();
  setAuthOverlayVisible(true);
  renderHandHistoryUi();
  setupCardPopover();
});

window.addEventListener("error", (event) => {
  const message = event.error?.message || event.message || "Unknown client error";
  setAuthMessage(`Error: ${message}`, "error");
  log(`Client error: ${message}`);
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason as { message?: string } | string | undefined;
  const message = typeof reason === "string" ? reason : reason?.message || "Unhandled rejection";
  setAuthMessage(`Error: ${message}`, "error");
  log(`Unhandled rejection: ${message}`);
});

document.addEventListener("pointerdown", () => { if (!audio.isUnlocked()) audio.init(); }, { once: true });

// Only attempt reconnect on visibility when we were actually in a room before backgrounding.
// Otherwise login-only users would get auto-joined to a table when tab/focus changes.
let hadRoomWhenBackgrounded = false;

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // App went to background - pause heartbeat to save battery
    log("🔇 App backgrounded, heartbeat paused");
    hadRoomWhenBackgrounded = connectionState === "connected" && room !== null;
    stopClientHeartbeat();
  } else {
    // App came back to foreground - check connection
    log("🔊 App resumed from background");
    if (connectionState === "disconnected" && token && hadRoomWhenBackgrounded) {
      log("Attempting to reconnect...");
      hadRoomWhenBackgrounded = false;
      attemptReconnect();
    } else if (connectionState === "connected" && room) {
      log("Resuming heartbeat...");
      startClientHeartbeat();
    } else {
      hadRoomWhenBackgrounded = false;
    }
  }
});

function log(message: string) {
  const ts = new Date().toLocaleTimeString();
  logEl.textContent = `[${ts}] ${message}\n` + logEl.textContent;
}

function setLobbyOverlayVisible(visible: boolean) {
  setLobbyOverlayVisibleFn(overlayRefs, visible);
}

function setLobbyMessage(message: string, type: "success" | "error" | "info" = "info") {
  setLobbyMessageFn(overlayRefs, message, type);
}

function showTournamentResult(
  result: "won" | "lost",
  champion?: { sessionId?: string; name?: string; chips?: number }
) {
  tournamentEnded = true;
  hadRoomWhenBackgrounded = false;
  showTournamentResultFn(overlayRefs, setAuthOverlayVisible, result, champion);
}

function setTournamentResultVisible(visible: boolean) {
  setTournamentResultVisibleFn(overlayRefs, visible);
}

let token: string | null = null;
let refreshToken: string | null = null;
let room: Room | null = null;
let currentSessionId: string | null = null;
/** Solo reconectar automáticamente a una mesa si el usuario estaba jugando (no en lobby) y no ha terminado el torneo. */
let shouldAutoReconnect = false;
/** True cuando la mesa cerró por fin de torneo (único ganador); no reconectar. */
let tournamentEnded = false;
let tokenInvalidNotified = false;
let pixiApp: any = null;
let pixiLayer: HTMLDivElement | null = null;
// Connection monitoring (state owned here; heartbeat/RTT in connection.ts)
let connectionState: ConnectionState = "disconnected";
let reconnectAttempts = 0;
const HEARTBEAT_INTERVAL_MS = 30000;
const HEARTBEAT_TIMEOUT_MS = 180000;
let lastHeartbeatSendTime = 0;

let pixiTableSurface: HTMLDivElement | null = null;
let pixiLib: any = null;
let previousWinnersKey = "";
let allInAnimationTimeoutId: number | null = null;
let allInCardIndex = 0;
let allInRevealStarted = false;
let allInRevealInProgress = false;
let allInCardsRevealedByServer = false;
let pendingWinners: string[] | null = null;
let pendingWinningHand: string | null = null;
let lastRoomState: RoomState | null = null;

const winnerDisplayState: WinnerDisplayState = {
  lastWinners: [],
  lastWinningHand: "-",
  winnerDisplayUntil: 0,
  winnerDisplayTimeoutId: null,
};

/** Si llega gameResult mientras la pantalla de ganador está 3s, mostramos el resultado de torneo al acabar. */
let deferredTournamentResult: { result: "won" | "lost"; champion?: GameResultPayload["champion"] } | null = null;
/** Timer para mostrar resultado de torneo 3s después cuando gameResult llega sin fase ganador activa (p. ej. mano final). */
let deferredTournamentTimerId: ReturnType<typeof setTimeout> | null = null;

const turnTimerState: TurnTimerState = {
  turnTimerId: null,
  turnDeadlineMs: null,
  lastTurnId: null,
  lastTurnTimeoutMs: null,
};

const gameUiContext: GameUiContext = {
  currentSessionId: null,
  winnerDisplayState,
  revealedHands: null,
  previousCommunityCards: [],
  previousHandCards: [],
  previousPotValue: null,
  previousCurrentBetValue: null,
  allInRevealInProgress: false,
  latestPlayerNames: new Map<string, string>(),
};

let revealedHands: Record<string, string[]> | null = null;
let winnerBannerTimeoutId: number | null = null;

function getGameUiRefs(): GameUiRefs {
  return {
    phaseStatus: phaseStatus,
    turnStatus: turnStatus,
    yourTurnIndicator: yourTurnIndicator,
    potStatus: potStatus,
    betStatus: betStatus,
    potChip: potChip,
    phaseChip: phaseChip,
    turnChip: turnChip,
    turnTimerChip: turnTimerChip,
    winningHandStatus: winningHandStatus,
    winningHandChip: winningHandChip,
    winnersStatus: winnersStatus,
    communityStatus: communityStatus,
    handStatus: handStatus,
    communityCardsEl: communityCardsEl,
    handCardsEl: handCardsEl,
    seatsEl: seatsEl,
    playersList: playersList,
    mobileSeatsList: mobileSeatsList,
    startGameButton: startGameButton,
    checkButton: checkButton,
    callButton: callButton,
    foldButton: foldButton,
    allInButton: allInButton,
    betButton: betButton,
    raiseButton: raiseButton,
  };
}

function startWinnerDisplayPhase() {
  startWinnerDisplayPhaseFn(winnerDisplayState, () => {
    if (lastRoomState) renderState(lastRoomState);
    if (deferredTournamentResult) {
      showTournamentResult(deferredTournamentResult.result, deferredTournamentResult.champion);
      deferredTournamentResult = null;
    }
  });
}

function syncGameUiContext() {
  gameUiContext.currentSessionId = currentSessionId;
  gameUiContext.revealedHands = revealedHands;
  gameUiContext.allInRevealInProgress = allInRevealInProgress;
}

function renderHandHistoryUi() {
  renderHandHistory(handHistoryList, (id) => gameUiContext.latestPlayerNames.get(id) ?? id);
}

function showWinnerBanner(text: string) {
  const banner = document.querySelector<HTMLDivElement>("#winner-banner");
  if (!banner) return;
  banner.textContent = text;
  banner.classList.remove("hidden");
  banner.classList.add("visible");
  if (winnerBannerTimeoutId !== null) {
    window.clearTimeout(winnerBannerTimeoutId);
  }
  winnerBannerTimeoutId = window.setTimeout(() => {
    banner.classList.remove("visible");
    winnerBannerTimeoutId = window.setTimeout(() => {
      banner.classList.add("hidden");
      winnerBannerTimeoutId = null;
    }, 250);
  }, 2600);
}

function triggerAnimation(element: HTMLElement, className: string) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

async function initPixiLayer() {
  pixiTableSurface = document.querySelector<HTMLDivElement>(".table-surface");
  if (!pixiTableSurface) return;

  if (!pixiLib) {
    pixiLib = await import("pixi.js");
  }

  pixiLayer = document.createElement("div");
  pixiLayer.id = "pixi-layer";
  pixiTableSurface.appendChild(pixiLayer);

  pixiApp = new pixiLib.Application({
    width: pixiTableSurface.clientWidth,
    height: pixiTableSurface.clientHeight,
    backgroundAlpha: 0,
    antialias: true
  });

  const canvas = (pixiApp as unknown as { view?: HTMLCanvasElement; canvas?: HTMLCanvasElement }).view
    ?? (pixiApp as unknown as { canvas?: HTMLCanvasElement }).canvas;
  if (canvas) {
    pixiLayer.appendChild(canvas);
  }

  window.addEventListener("resize", () => {
    if (!pixiApp || !pixiTableSurface) return;
    pixiApp.renderer.resize(pixiTableSurface.clientWidth, pixiTableSurface.clientHeight);
  });
}

function getElementCenterInTable(element: HTMLElement) {
  if (!pixiTableSurface) return { x: 0, y: 0 };
  const tableRect = pixiTableSurface.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left - tableRect.left + rect.width / 2,
    y: rect.top - tableRect.top + rect.height / 2
  };
}

function getDeckPosition() {
  if (!pixiTableSurface) return { x: 0, y: 0 };
  return {
    x: pixiTableSurface.clientWidth / 2,
    y: 80
  };
}

function getCardTexture(card: string) {
  if (!pixiLib) return null;
  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  const suitNameMap: Record<string, string> = {
    O: "ORO",
    C: "COPAS",
    E: "ESPADA",
    B: "BASTOS"
  };
  const suitName = suitNameMap[suit] ?? suit;
  return pixiLib.Texture.from(`/cards/${rank} DE ${suitName}.webp`);
}

function createCardSprite(targetEl: HTMLElement) {
  if (!pixiLib) return null;
  const rect = targetEl.getBoundingClientRect();
  const sprite = new pixiLib.Sprite(pixiLib.Texture.from("/cards/back_logo.png"));
  sprite.anchor.set(0.5);
  sprite.width = rect.width;
  sprite.height = rect.height;
  return sprite;
}

function tweenSprite(
  sprite: any,
  from: { x: number; y: number },
  to: { x: number; y: number },
  durationMs: number,
  delayMs: number,
  onComplete?: () => void
) {
  if (!pixiApp) return;
  const startAt = performance.now() + delayMs;
  const endAt = startAt + durationMs;
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

  const update = () => {
    const now = performance.now();
    if (now < startAt) return;
    const t = Math.min((now - startAt) / durationMs, 1);
    const eased = easeOut(t);
    sprite.x = from.x + (to.x - from.x) * eased;
    sprite.y = from.y + (to.y - from.y) * eased;
    if (t >= 1) {
      pixiApp?.ticker.remove(update);
      onComplete?.();
    }
  };

  pixiApp.ticker.add(update);
}

function flipSprite(sprite: any, frontTexture: any, durationMs = 280) {
  if (!pixiApp) return;
  const half = durationMs / 2;
  const startAt = performance.now();
  const update = () => {
    const now = performance.now();
    const elapsed = now - startAt;
    if (elapsed <= half) {
      const t = Math.min(elapsed / half, 1);
      sprite.scale.x = 1 - t;
    } else {
      if (sprite.texture !== frontTexture) {
        sprite.texture = frontTexture;
      }
      const t = Math.min((elapsed - half) / half, 1);
      sprite.scale.x = t;
      if (t >= 1) {
        pixiApp?.ticker.remove(update);
      }
    }
  };
  pixiApp.ticker.add(update);
}

function animateCardDeals(
  containerEl: HTMLElement,
  cards: string[],
  previousCards: string[]
) {
  // Animation disabled - just show cards immediately
  return;
}

function revealAllInCards(cards: string[], onComplete?: () => void) {
  // Clear any existing animation
  if (allInAnimationTimeoutId !== null) {
    window.clearTimeout(allInAnimationTimeoutId);
  }
  allInCardIndex = 0;
  allInRevealStarted = true;
  allInRevealInProgress = true;
  
  // Show cards one by one, every 2 seconds
  const revealNext = () => {
    if (allInCardIndex < cards.length) {
      // Show cards up to current index
      const cardsToShow = cards.slice(0, allInCardIndex + 1);
      renderCardRow(communityCardsEl, cardsToShow, 5);
      allInCardIndex++;
      allInAnimationTimeoutId = window.setTimeout(revealNext, 2000);
      return;
    }

    allInRevealStarted = false;
    allInRevealInProgress = false;
    allInAnimationTimeoutId = null;
    if (onComplete) {
      onComplete();
    }
  };
  
  revealNext();
}

function resetRoomUi(message?: string) {
  disconnectRoom(room);
  room = null;
  currentSessionId = null;
  gameUiContext.currentSessionId = null;
  clearWinnerDisplay(winnerDisplayState);
  deferredTournamentResult = null;
  if (deferredTournamentTimerId !== null) {
    clearTimeout(deferredTournamentTimerId);
    deferredTournamentTimerId = null;
  }
  revealedHands = null;
  gameUiContext.revealedHands = null;
  gameUiContext.previousPotValue = null;
  gameUiContext.previousCurrentBetValue = null;
  previousWinnersKey = "";
  allInRevealStarted = false;
  allInRevealInProgress = false;
  gameUiContext.allInRevealInProgress = false;
  allInCardsRevealedByServer = false;
  pendingWinners = null;
  pendingWinningHand = null;
  gameUiContext.previousCommunityCards.length = 0;
  gameUiContext.previousHandCards.length = 0;
  if (allInAnimationTimeoutId !== null) {
    window.clearTimeout(allInAnimationTimeoutId);
    allInAnimationTimeoutId = null;
  }
  clearHandHistory();
  renderHandHistoryUi();
  setAuthOverlayVisible(true);
  setAuthMessage("", "info");
  roomStatus.textContent = message || "not joined";
  phaseStatus.textContent = "waiting";
  turnStatus.textContent = "-";
  stopTurnTimerFn(turnTimerState, turnTimerChip);
  potStatus.textContent = "0";
  betStatus.textContent = "0";
  communityStatus.textContent = "-";
  handStatus.textContent = "-";
  winningHandStatus.textContent = "-";
  winnersStatus.textContent = "-";
  potChip.textContent = "0";
  phaseChip.textContent = "waiting";
  turnChip.textContent = "-";
  turnTimerChip.textContent = "-";
  winningHandChip.textContent = "-";
  renderCardRow(communityCardsEl, [], 5);
  renderCardRow(handCardsEl, [], 2);
  playersList.innerHTML = "";
  syncGameUiContext();
  renderSeatsFn({ users: new Map(), dealerIndex: -1, currentTurn: "" }, getGameUiRefs(), gameUiContext);
  setActionButtonsEnabledFn(getGameUiRefs(), { canStart: false, canCheck: false, canCall: false, canFold: false, canAllIn: false, canBet: false, canRaise: false });
}

function updateTurnTimer(state: RoomState) {
  const turnId = state.currentTurn ?? "";
  const roundActive = Boolean(state.roundStarted);
  updateTurnTimerFn(turnTimerState, turnId, roundActive, turnTimerChip, TURN_TIMEOUT_MS);
}

function clearAuthToken() {
  token = null;
  refreshToken = null;
  shouldAutoReconnect = false;
  tokenStatus.textContent = "none";
  stopTokenMonitorFn();
  tokenInvalidNotified = false;
  SecureStorage.clearAccessToken();
  SecureStorage.clearRefreshToken();
}

function handleTokenInvalidated() {
  if (tokenInvalidNotified) return;
  tokenInvalidNotified = true;
  clearAuthToken();
  resetRoomUi("logged out");
  alert("Se ha iniciado sesion en otro dispositivo. Por favor, vuelve a iniciar sesion.");
}

function startTokenMonitor() {
  startTokenMonitorFn({
    apiUrl: API_URL,
    getRefreshToken: () => refreshToken,
    onSuccess: (t, r) => {
      token = t;
      refreshToken = r;
      SecureStorage.saveAccessToken(t);
      SecureStorage.saveRefreshToken(r);
      tokenStatus.textContent = "refreshed";
    },
    onInvalidated: handleTokenInvalidated,
    log,
    intervalMs: 50 * 60 * 1000
  });
}

function renderState(state: RoomState) {
  syncGameUiContext();
  renderStateFn(state, getGameUiRefs(), gameUiContext, updateTurnTimer);
}

async function register() {
  const { username, email, password } = getFormValues();
  
  // Validate inputs before submitting
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    setAuthMessage(emailValidation.error!, "error");
    return;
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    setAuthMessage(passwordValidation.error!, "error");
    return;
  }
  
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    setAuthMessage(usernameValidation.error!, "error");
    return;
  }
  
  log("Registering with secure client...");
  setAuthMessage("Creando cuenta...", "info");
  
  try {
    const data = await request("/api/auth/register", { username, email, password });
    token = typeof data.token === "string" ? data.token : null;
    refreshToken = typeof data.refreshToken === "string" ? data.refreshToken : null;
    if (refreshToken) {
      SecureStorage.saveRefreshToken(refreshToken);
    }
    if (token) {
      SecureStorage.saveAccessToken(token);
    }
    tokenStatus.textContent = token ? "set" : "none";
    tokenInvalidNotified = false;
    startTokenMonitor();
    log("Registered and token received.");
    setAuthMessage("Registro correcto. Puedes unirte a la mesa.", "success");
  } catch (error) {
    const message = mapAuthError(error instanceof Error ? error.message : String(error), "register");
    setAuthMessage(message, "error");
    log(`Registration error: ${message}`);
  }
}

async function login() {
  const { email, password } = getLoginValues();
  
  // Validate inputs before submitting
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    setAuthMessage(emailValidation.error!, "error");
    return;
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    setAuthMessage(passwordValidation.error!, "error");
    return;
  }
  
  log("Logging in with secure client...");
  setAuthMessage("Verificando credenciales...", "info");
  
  try {
    const data = await request("/api/auth/login", { email, password });
    token = typeof data.token === "string" ? data.token : null;
    refreshToken = typeof data.refreshToken === "string" ? data.refreshToken : null;
    if (refreshToken) {
      SecureStorage.saveRefreshToken(refreshToken);
    }
    if (token) {
      SecureStorage.saveAccessToken(token);
    }
    tokenStatus.textContent = token ? "set" : "none";
    tokenInvalidNotified = false;
    startTokenMonitor();
    log("Logged in and token received.");
    runPostLoginAutoRejoin({
      getLastRoomId: () => SecureStorage.getLastRoomId(),
      joinRoom: (forceReplace, opts) => joinRoom(forceReplace, opts),
      clearLastRoomId: () => SecureStorage.clearLastRoomId(),
      setAuthMessage,
      log,
    });
  } catch (error) {
    const message = mapAuthError(error instanceof Error ? error.message : String(error), "login");
    setAuthMessage(message, "error");
    log(`Login error: ${message}`);
  }
}

function startClientHeartbeat() {
  if (!room) return;
  startClientHeartbeatFn(room, {
    intervalMs: HEARTBEAT_INTERVAL_MS,
    timeoutMs: HEARTBEAT_TIMEOUT_MS,
    log,
    onTimeout: () => {
      log("[HEARTBEAT] Timeout alcanzado, mostrando popup de inactividad");
      if (dom.idleTimeoutModal) {
        dom.idleTimeoutModal.classList.remove("hidden");
      }
    },
    onSend: (t) => { lastHeartbeatSendTime = t; }
  });
}

function stopClientHeartbeat() {
  stopClientHeartbeatFn();
}

function setConnectionState(state: ConnectionState) {
  connectionState = state;
  const stateEmojis = { disconnected: "⚫", connecting: "🟡", connected: "🟢" };
  log(`[${stateEmojis[state]}] Connection: ${state}`);
  const { averageRtt, connectionQuality } = getRttInfo();
  updateConnectionIndicatorFn({
    connectionState,
    reconnectAttempts,
    maxAttempts: MAX_RECONNECT_ATTEMPTS,
    connectionIndicatorEl: connectionIndicator,
    averageRtt,
    connectionQuality
  });
}

function recordRtt(rttMs: number) {
  recordRttFn(rttMs, { rttStatusEl: rttStatus, qualityStatusEl: qualityStatus, log });
}

function getActionBufferDeps() {
  return {
    send: (action: string, data: unknown) => room?.send(action, data),
    isConnected: () => connectionState === "connected" && room !== null,
    log,
    bufferStatusEl: bufferStatus,
    maxBufferSize: ACTION_BUFFER_MAX_SIZE
  };
}

function queueAction(action: string, data: unknown) {
  queueActionFn(action, data, getActionBufferDeps());
}

function replayBufferedActions() {
  replayBufferedActionsFn({
    send: (action, data) => room?.send(action, data),
    isConnected: () => connectionState === "connected" && room !== null,
    log
  });
}

function attemptReconnect() {
  if (!shouldAutoReconnect) {
    log("Auto-reconnect disabled; staying in lobby.");
    return;
  }
  return attemptReconnectFn({
    getToken: () => token,
    getConnectionState: () => connectionState,
    getTournamentEnded: () => tournamentEnded,
    getReconnectAttempts: () => reconnectAttempts,
    setReconnectAttempts: (n) => { reconnectAttempts = n; },
    joinRoom: (forceReplace) => joinRoom(forceReplace),
    maxAttempts: MAX_RECONNECT_ATTEMPTS,
    clearAuthToken,
    log
  });
}

function getWsClient(): Client {
  return getWsClientFromConnection(WS_URL);
}

/** Cooldown after "Crear mesa" to prevent double-clicks and spam. */
const CREATE_TABLE_COOLDOWN_MS = 2000;

let joinInProgress = false;

function setLobbyJoinButtonsEnabled(enabled: boolean): void {
  createTableButton.disabled = !enabled;
  joinByIdButton.disabled = !enabled;
}

const getLobbyDeps: LobbyDepsFactory = () => ({
  getWsClient,
  setLobbyMessage,
  log,
  roomsList,
  onJoinRoom: (roomId: string) => {
    joinRoom(false, { mode: "joinById", roomId }).catch((err) => {
      log(`Join error: ${err?.message || err}`);
    });
  }
});

async function joinRoom(
  forceReplace = false,
  opts?: { mode?: JoinMode; roomId?: string; tableName?: string }
) {
  const mode: JoinMode = opts?.mode ?? "joinOrCreate";
  const validation = validateJoinRequest({
    hasToken: Boolean(token),
    mode,
    roomId: opts?.roomId,
    setConnectionState,
    log,
  });
  if (!validation.ok) {
    return;
  }

  if (joinInProgress) {
    log("Ya hay una conexión en curso.");
    return;
  }
  joinInProgress = true;
  setLobbyJoinButtonsEnabled(false);

  try {
    const { username } = getFormValues();
    setConnectionState("connecting");
    log("Connecting to Colyseus...");

    const client = getWsClient();

    let joinedRoom: Room;
    try {
      if (mode === "joinById") {
        joinedRoom = await client.joinById(validation.normalizedRoomId!, {
        auth: { token },
        name: username,
        forceReplace
      } as any);
    } else if (mode === "create") {
      const tableName = (opts?.tableName ?? "").trim();
      joinedRoom = await client.create("my_room", {
        auth: { token },
        name: username,
        tableName,
        forceReplace
      } as any);
    } else {
      joinedRoom = await client.joinOrCreate("my_room", {
        auth: { token },
        name: username,
        forceReplace
      } as any);
    }
  } catch (err: any) {
    await handleJoinError({
      error: err,
      confirmSessionReplace: () =>
        window.confirm("Ya hay una sesion activa en la mesa con este usuario. Quieres reemplazarla?"),
      onSessionReplaceConfirmed: async () => {
        joinInProgress = false;
        await joinRoom(true);
      },
      onSessionReplaceRejected: () => {
        setConnectionState("disconnected");
      },
      onInvalidToken: () => {
        setConnectionState("disconnected");
        handleTokenInvalidated();
      },
      onAuthUnavailable: () => {
        setConnectionState("disconnected");
        log("Sesión expirada o servidor no disponible. Inicia sesión de nuevo.");
        setAuthMessage("Sesión expirada o servidor no disponible. Inicia sesión de nuevo.", "error");
        setAuthOverlayVisible(true);
      },
      onCreateRateLimit: () => {
        setConnectionState("disconnected");
        log("Espera un minuto antes de crear otra mesa.");
        setLobbyMessage("Espera un minuto antes de crear otra mesa.", "error");
      },
      onGeneric: (message) => {
        log(`Join error: ${message}`);
        setConnectionState("disconnected");
      },
    });
    return;
  }

  applyPostJoinSetup({
    joinedRoom,
    setRoom: (value) => {
      room = value;
    },
    setCurrentSessionId: (sessionId) => {
      currentSessionId = sessionId;
      gameUiContext.currentSessionId = sessionId;
    },
    setShouldAutoReconnect: (value) => {
      shouldAutoReconnect = value;
    },
    setTournamentEnded: (value) => {
      tournamentEnded = value;
    },
    setAuthOverlayVisible,
    setLobbyOverlayVisible,
    setTournamentResultVisible,
    stopLobbyPolling: () => lobbyPolling.stop(),
    setConnectionState,
    setReconnectAttempts: (value) => {
      reconnectAttempts = value;
    },
    winnerDisplayState,
    clearDeferredTournamentTimer: () => {
      deferredTournamentResult = null;
      if (deferredTournamentTimerId !== null) {
        clearTimeout(deferredTournamentTimerId);
        deferredTournamentTimerId = null;
      }
    },
    winningHandStatusEl: winningHandStatus,
    winningHandChipEl: winningHandChip,
    winnersStatusEl: winnersStatus,
    clearHandHistory,
    renderHandHistoryUi,
    preloadCardImages,
    setRoomStatusText: (text) => {
      roomStatus.textContent = text;
    },
    saveLastRoomId: (roomId) => {
      SecureStorage.saveLastRoomId(roomId);
    },
    log,
  });
  
  // Start client-side heartbeat to monitor connection
  startClientHeartbeat();

  joinedRoom.onLeave((code: number) => {
    stopClientHeartbeat();

    handleRoomLeave({
      code,
      isTournamentEnded: () => tournamentEnded,
      setTournamentEnded: (value) => {
        tournamentEnded = value;
      },
      setHadRoomWhenBackgrounded: (value) => {
        hadRoomWhenBackgrounded = value;
      },
      setShouldAutoReconnect: (value) => {
        shouldAutoReconnect = value;
      },
      clearLastRoomId: () => SecureStorage.clearLastRoomId(),
      clearAuthToken,
      resetRoomUi,
      setConnectionState,
      clearCurrentRoomRefs: () => {
        room = null;
        currentSessionId = null;
        gameUiContext.currentSessionId = null;
      },
      isTournamentResultOverlayHidden: () => overlayRefs.tournamentResultOverlay.classList.contains("hidden"),
      showGameEndMessage: () => showGameEndMessageFn(overlayRefs),
      log,
      attemptReconnect,
      alertUser: (message) => alert(message),
    });
  });

  joinedRoom.onMessage("gameResult", (payload: GameResultPayload) => {
    handleGameResultMessage({
      payload,
      isWinnerPhaseActive: () => isInWinnerPhase(winnerDisplayState),
      setDeferredTournamentResult: (value) => {
        deferredTournamentResult = value;
      },
      getDeferredTournamentResult: () => deferredTournamentResult,
      clearDeferredTimer: () => {
        if (deferredTournamentTimerId !== null) {
          clearTimeout(deferredTournamentTimerId);
          deferredTournamentTimerId = null;
        }
      },
      scheduleDeferredTimer: (callback, delayMs) => {
        deferredTournamentTimerId = setTimeout(() => {
          deferredTournamentTimerId = null;
          callback();
        }, delayMs);
      },
      winnerDisplayMs: WINNER_DISPLAY_MS,
      showTournamentResult,
      renderLastState: () => {
        if (lastRoomState) renderState(lastRoomState);
      },
      log,
    });
  });

  joinedRoom.onMessage("playerDisconnected", (payload: PlayerDisconnectedPayload) => {
    handlePlayerDisconnectedMessage(payload, log);
  });

  joinedRoom.onMessage("heartbeat_ack", () => {
    handleHeartbeatAckMessage({
      lastHeartbeatSendTime,
      nowMs: Date.now(),
      recordRtt,
      clearHeartbeatTimeout: clearHeartbeatTimeoutFn,
      isConnected: () => connectionState === "connected",
      setConnected: () => {
        setConnectionState("connected");
      },
      replayBufferedActions,
    });
  });

  joinedRoom.onMessage("bettingRoundStarted", (payload) => {
    log(`Betting round: ${JSON.stringify(payload)}`);
    revealedHands = null;
    allInCardsRevealedByServer = false;
  });

  joinedRoom.onMessage("communityCardRevealed", (payload: CommunityCardRevealedPayload) => {
      // Compatible with both payload shapes:
      // - { communityCards: string[] }
      // - { index: number, card: string } (older backend builds / dist)
      let cards = schemaArrayToCards(payload?.communityCards);

      const idx = typeof payload?.index === "number" ? payload.index : null;
      const card = typeof payload?.card === "string" ? payload.card : null;

      if ((!cards || cards.length === 0) && card) {
        const next = [...gameUiContext.previousCommunityCards];
        const targetIndex = idx ?? next.length;
        while (next.length < targetIndex) next.push("");
        next[targetIndex] = card;
        cards = next;
      }

      if (cards.length > 0) {
        allInRevealInProgress = true;
        allInCardsRevealedByServer = true;
        gameUiContext.previousCommunityCards = [...cards];
        renderCardRow(communityCardsEl, cards, 5);
        const shown = cards.filter(Boolean);
        communityStatus.textContent = shown.length ? shown.join(" ") : "-";
      }
    }
  );

  bindCoreRoomEvents({
    room: joinedRoom as unknown as {
      onMessage: (type: string, handler: (payload: any) => void) => void;
      onStateChange: (handler: (state: RoomState) => void) => void;
    },
    log,
    playActionSound: (action) => audio.playActionSound(action),
    startTurnTimer: (turnId, timeoutMs, deadlineMs) =>
      startTurnTimerFn(turnTimerState, turnId, timeoutMs, turnTimerChip, deadlineMs),
    turnTimeoutMs: TURN_TIMEOUT_MS,
    setLastRoomState: (state) => {
      lastRoomState = state;
    },
    isWinnerPhaseActive: () => isInWinnerPhase(winnerDisplayState),
    renderState,
  });

  joinedRoom.onMessage("roundEnded", (payload: RoundEndedPayload) => {
    const historyData = buildRoundEndedHistoryData(payload, {
      currentSessionId,
      potText: potStatus.textContent,
      schemaArrayToCards,
    });
    const winnersPayload = Array.isArray(payload?.winners) ? payload.winners : [];
    const { winnersForHistory, potValue, communityCards, yourHand } = historyData;
    const isAllInShowdown = Boolean(payload?.isAllInShowdown);

    if (isAllInShowdown) {
      log("Showdown: all-in (auto reveal)");
    }
    
    if (payload?.playerHands && typeof payload.playerHands === "object") {
      revealedHands = payload.playerHands as Record<string, string[]>;
    }
    
    // If all players went all-in, show cards (if not already revealed by server) then winners
    if (isAllInShowdown && communityCards.length === 5) {
      const winnerIds = winnersPayload
        .filter((w: any) => w && typeof w.playerId === "string")
        .map((w: any) => w.playerId);
      pendingWinners = winnerIds;
      pendingWinningHand = payload?.winningHand ?? "";
      applyAllInShowdownOutcome({
        winnerDisplayState,
        currentSessionId,
        latestPlayerNames: gameUiContext.latestPlayerNames,
        applyWinnerUi: (winnerIds, winningHand) => {
          applyWinnerUiState(winnerDisplayState, {
            winnerIds,
            winningHand,
            winnersStatusEl: winnersStatus,
            winningHandStatusEl: winningHandStatus,
            winningHandChipEl: winningHandChip,
          });
        },
        playWinEffect: () => audio.playEffect("win"),
        startWinnerDisplayPhase,
        renderLastState: () => {
          if (lastRoomState) renderState(lastRoomState);
        },
        showWinnerBanner,
        setPreviousCommunityCards: (cards) => {
          gameUiContext.previousCommunityCards = [...cards];
        },
        winnerIds: pendingWinners ?? [],
        winningHand: pendingWinningHand ?? "",
        communityCards,
        allInCardsRevealedByServer,
        setAllInRevealInProgress: (value) => {
          allInRevealInProgress = value;
          if (!value) {
            pendingWinners = null;
            pendingWinningHand = null;
          }
        },
        revealAllInCards,
      });
    } else {
      gameUiContext.previousCommunityCards = [...communityCards];
      const winnerDisplay = getWinnerDisplayFromRoundEnd(payload);
      applyStandardRoundOutcome({
        winnerDisplayState,
        currentSessionId,
        latestPlayerNames: gameUiContext.latestPlayerNames,
        applyWinnerUi: (winnerIds, winningHand) => {
          applyWinnerUiState(winnerDisplayState, {
            winnerIds,
            winningHand,
            winnersStatusEl: winnersStatus,
            winningHandStatusEl: winningHandStatus,
            winningHandChipEl: winningHandChip,
          });
        },
        playWinEffect: () => audio.playEffect("win"),
        startWinnerDisplayPhase,
        renderLastState: () => {
          if (lastRoomState) renderState(lastRoomState);
        },
        showWinnerBanner,
        setPreviousCommunityCards: () => undefined,
        winnerDisplay,
        fallbackWinningHand: payload?.winningHand ?? "",
        setPreviousWinnersKey: (key) => {
          previousWinnersKey = key;
        },
      });
    }
    
    // Cartas de la mano ganadora (tomamos las hole cards del primer ganador para historial).
    addHandHistoryEntry(
      {
        timestamp: Date.now(),
        winners: winnersForHistory,
        winningHand: payload?.winningHand ?? "-",
        winningCards: historyData.winningCards,
        communityCards,
        pot: potValue,
        yourHand
      },
      MAX_HAND_HISTORY
    );
    renderHandHistoryUi();
    log(`Round ended: ${JSON.stringify(payload)}`);
  });

  } finally {
    finalizeJoinAttempt(mode, {
      setJoinInProgress: (value) => {
        joinInProgress = value;
      },
      setJoinByIdEnabled: (enabled) => {
        joinByIdButton.disabled = !enabled;
      },
      setCreateTableEnabled: (enabled) => {
        createTableButton.disabled = !enabled;
      },
      schedule: (callback, delayMs) => {
        setTimeout(callback, delayMs);
      },
      createCooldownMs: CREATE_TABLE_COOLDOWN_MS,
    });
  }
}

type LobbyDepsFactory = () => LobbyDeps;
const refreshWinnersRanking = () =>
  refreshWinnersRankingFn({
    apiUrl: API_URL,
    listEl: winnersRankingList,
    fetchFn: fetch.bind(window),
    log,
  });

const lobbyPolling = createLobbyPollingController({
  refresh: () => refreshLobbyRooms(getLobbyDeps(), false),
});

async function openLobby() {
  await openLobbyFlow({
    hasToken: () => Boolean(token),
    setAuthOverlayVisible,
    setLobbyOverlayVisible,
    log,
    onEnterLobby: () => {
      // El usuario está explícitamente en el lobby: no queremos reconexiones automáticas a mesas antiguas.
      shouldAutoReconnect = false;
      SecureStorage.clearLastRoomId();
    },
    setJoinInProgress: (value) => {
      joinInProgress = value;
    },
    setLobbyJoinButtonsEnabled,
    refreshLobbyRooms: () => refreshLobbyRooms(getLobbyDeps(), true),
    refreshWinnersRanking,
    startLobbyPolling: () => lobbyPolling.start(),
  });
}

bindAuthEntryButtons({
  refs: {
    registerButton: document.querySelector("#register") as HTMLButtonElement,
    loginButton: document.querySelector("#login") as HTMLButtonElement,
    joinButton: document.querySelector("#join") as HTMLButtonElement,
  },
  register,
  login,
  openLobby,
  mapAuthError,
  setAuthMessage,
  log,
});

const authLoginForm = document.querySelector("#auth-login-form") as HTMLElement;
const forgotPasswordBlock = document.querySelector("#forgot-password-block") as HTMLElement;
const forgotPasswordLink = document.querySelector("#forgot-password-link") as HTMLAnchorElement;
const forgotPasswordEmail = document.querySelector("#forgot-password-email") as HTMLInputElement;
const forgotPasswordSubmit = document.querySelector("#forgot-password-submit") as HTMLButtonElement;
const forgotPasswordBack = document.querySelector("#forgot-password-back") as HTMLButtonElement;
const loginEmailInput = document.querySelector("#email") as HTMLInputElement;

bindForgotPasswordUi({
  refs: {
    authLoginForm,
    forgotPasswordBlock,
    forgotPasswordLink,
    forgotPasswordEmail,
    forgotPasswordSubmit,
    forgotPasswordBack,
    loginEmailInput,
  },
  setAuthMessage,
  request,
  validateEmail,
  log,
});

refreshRoomsButton.addEventListener("click", () => {
  refreshLobbyRooms(getLobbyDeps(), true).catch(() => undefined);
  refreshWinnersRanking().catch(() => undefined);
});

createTableButton.addEventListener("click", () => {
  const name = tableNameInput.value.trim();
  joinRoom(false, { mode: "create", tableName: name }).catch((err) => log(`Join error: ${err?.message || err}`));
});

joinByIdButton.addEventListener("click", () => {
  const id = joinRoomIdInput.value.trim();
  joinRoom(false, { mode: "joinById", roomId: id }).catch((err) => log(`Join error: ${err?.message || err}`));
});

backToAuthButton.addEventListener("click", () => {
  lobbyPolling.stop();
  setLobbyOverlayVisible(false);
  setAuthOverlayVisible(true);
});

tournamentBackToLobbyButton.addEventListener("click", () => {
  tournamentEnded = false;
  setTournamentResultVisible(false);
  openLobby().catch((err) => log(`Lobby error: ${err?.message || err}`));
});

function requireRoom(): Room | null {
  if (!room) {
    log("Not joined. Join a room first.");
    return null;
  }
  return room;
}

bindGameActionButtons(
  {
    startGameButton: document.querySelector("#start-game") as HTMLButtonElement,
    checkButton: document.querySelector("#check") as HTMLButtonElement,
    callButton: document.querySelector("#call") as HTMLButtonElement,
    foldButton: document.querySelector("#fold") as HTMLButtonElement,
    allInButton: document.querySelector("#all-in") as HTMLButtonElement,
    betButton: document.querySelector("#bet") as HTMLButtonElement,
    raiseButton: document.querySelector("#raise") as HTMLButtonElement,
    betAmountInput: document.querySelector("#bet-amount") as HTMLInputElement,
  },
  queueAction,
  log
);

(document.querySelector("#toggle-panel") as HTMLButtonElement).addEventListener("click", () => {
  const app = document.querySelector("#app");
  app?.classList.toggle("panel-collapsed");
});

if (dom.idleTimeoutModal && dom.idleTimeoutContinueButton) {
  dom.idleTimeoutContinueButton.addEventListener("click", () => {
    dom.idleTimeoutModal!.classList.add("hidden");
  });
}
