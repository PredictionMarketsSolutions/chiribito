import { Client, Room } from "@colyseus/sdk";

import { API_URL, WS_URL, TURN_TIMEOUT_MS, MAX_RECONNECT_ATTEMPTS, MAX_HAND_HISTORY, ACTION_BUFFER_MAX_SIZE } from "./config";
import type { RoomState, PlayerState, HandHistoryWinner, ConnectionState } from "./types";
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
import { disconnectRoom } from "./auth/room-disconnect";
import { refreshLobbyRooms, type LobbyDeps } from "./lobby";
import {
  schemaArrayToCards,
  getUserEntries,
  isPlayerState,
  startWinnerDisplayPhase as startWinnerDisplayPhaseFn,
  clearWinnerDisplay,
  isInWinnerPhase,
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

  seatsEl.addEventListener("mouseenter", (e: MouseEvent) => {
    const hand = (e.target as HTMLElement).closest<HTMLElement>(".seat-hand");
    if (!hand || !cardPopover || !cardPopoverCards) return;
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
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
      const rect = hand.getBoundingClientRect();
      const popRect = cardPopover.getBoundingClientRect();
      const padding = 10;
      let left = rect.left + rect.width / 2 - popRect.width / 2;
      let top = rect.top - popRect.height - padding;
      left = Math.max(padding, Math.min(left, document.documentElement.clientWidth - popRect.width - padding));
      top = Math.max(padding, Math.min(top, document.documentElement.clientHeight - popRect.height - padding));
      cardPopover.style.left = `${left}px`;
      cardPopover.style.top = `${top}px`;
    });
  }, true);

  seatsEl.addEventListener("mouseleave", (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest(".seat-hand")) return;
    hideTimeout = setTimeout(() => {
      if (cardPopover) {
        cardPopover.classList.add("hidden");
        cardPopover.setAttribute("aria-hidden", "true");
      }
      hideTimeout = null;
    }, 200);
  }, true);

  seatsEl.addEventListener("click", (e: MouseEvent) => {
    const hand = (e.target as HTMLElement).closest<HTMLElement>(".seat-hand");
    if (!hand || !cardPopover || !cardPopoverCards) return;
    const raw = hand.getAttribute("data-cards");
    let cards: string[] = [];
    try {
      cards = raw ? JSON.parse(raw) : [];
    } catch {
      /* ignore */
    }
    if (cards.length === 0) return;
    if (cardPopover.classList.contains("hidden")) {
      cardPopoverCards.innerHTML = "";
      cards.forEach((card) => {
        const el = createCardElement(card);
        cardPopoverCards.appendChild(el);
      });
      cardPopover.classList.remove("hidden");
      cardPopover.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => {
        const rect = hand.getBoundingClientRect();
        const popRect = cardPopover.getBoundingClientRect();
        const padding = 10;
        let left = rect.left + rect.width / 2 - popRect.width / 2;
        let top = rect.top - popRect.height - padding;
        left = Math.max(padding, Math.min(left, document.documentElement.clientWidth - popRect.width - padding));
        top = Math.max(padding, Math.min(top, document.documentElement.clientHeight - popRect.height - padding));
        cardPopover.style.left = `${left}px`;
        cardPopover.style.top = `${top}px`;
      });
    } else {
      cardPopover.classList.add("hidden");
      cardPopover.setAttribute("aria-hidden", "true");
    }
  }, true);

  document.addEventListener("click", (e: MouseEvent) => {
    if (!cardPopover || cardPopover.classList.contains("hidden")) return;
    const target = e.target as Element;
    if (target.closest(".seat-hand") || target.closest(".card-popover")) return;
    cardPopover.classList.add("hidden");
    cardPopover.setAttribute("aria-hidden", "true");
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
let lobbyPollId: number | null = null;
/** True cuando la mesa cerró por fin de torneo (único ganador); no reconectar. */
let tournamentEnded = false;
let tokenInvalidNotified = false;
let pixiApp: any = null;
let pixiLayer: HTMLDivElement | null = null;
// Connection monitoring (state owned here; heartbeat/RTT in connection.ts)
let connectionState: ConnectionState = "disconnected";
let reconnectAttempts = 0;
const HEARTBEAT_INTERVAL_MS = 25000;
const HEARTBEAT_TIMEOUT_MS = 10000;
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
    setAuthMessage("Login correcto. Puedes unirte a la mesa.", "success");
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
    onTimeout: () => { if (room) room.leave(); },
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

type JoinMode = "joinOrCreate" | "create" | "joinById";

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
  if (!token) {
    log("No token. Login or register first.");
    setConnectionState("disconnected");
    return;
  }

  const mode: JoinMode = opts?.mode ?? "joinOrCreate";
  if (mode === "joinById") {
    const roomId = (opts?.roomId ?? "").trim();
    if (!roomId) {
      setConnectionState("disconnected");
      log("Room ID vacío.");
      return;
    }
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
        const roomId = (opts?.roomId ?? "").trim();
        joinedRoom = await client.joinById(roomId, {
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
    const message = err?.message || String(err);
    if (message.includes("SESSION_EXISTS")) {
      const shouldReplace = window.confirm("Ya hay una sesion activa en la mesa con este usuario. Quieres reemplazarla?");
      if (shouldReplace) {
        joinInProgress = false;
        await joinRoom(true);
      } else {
        setConnectionState("disconnected");
      }
      return;
    }
    if (message.includes("INVALID_TOKEN")) {
      setConnectionState("disconnected");
      handleTokenInvalidated();
      return;
    }
    if (message === "AUTH_TIMEOUT" || message === "AUTH_UNAVAILABLE") {
      setConnectionState("disconnected");
      log("Sesión expirada o servidor no disponible. Inicia sesión de nuevo.");
      setAuthMessage("Sesión expirada o servidor no disponible. Inicia sesión de nuevo.", "error");
      setAuthOverlayVisible(true);
      return;
    }
    if (message.includes("CREATE_ROOM_RATE_LIMIT")) {
      setConnectionState("disconnected");
      log("Espera un minuto antes de crear otra mesa.");
      setLobbyMessage("Espera un minuto antes de crear otra mesa.", "error");
      return;
    }
    log(`Join error: ${message}`);
    setConnectionState("disconnected");
    return;
  }

  room = joinedRoom;
  currentSessionId = joinedRoom.sessionId;
  gameUiContext.currentSessionId = currentSessionId;
  tournamentEnded = false;
  setAuthOverlayVisible(false);
  setLobbyOverlayVisible(false);
  setTournamentResultVisible(false);
  stopLobbyPolling();
  setConnectionState("connected");
  reconnectAttempts = 0;
  winnerDisplayState.lastWinningHand = "-";
  winnerDisplayState.lastWinners = [];
  winningHandStatus.textContent = winnerDisplayState.lastWinningHand;
  winningHandChip.textContent = winnerDisplayState.lastWinningHand;
  winnersStatus.textContent = "-";
  clearHandHistory();
  renderHandHistoryUi();
  preloadCardImages();
  const roomId = (joinedRoom as { id?: string; roomId?: string }).id
    ?? (joinedRoom as { roomId?: string }).roomId
    ?? "joined";
  roomStatus.textContent = roomId;
  log("Joined room successfully.");
  
  // Start client-side heartbeat to monitor connection
  startClientHeartbeat();

  joinedRoom.onLeave((code: number) => {
    stopClientHeartbeat();
    
    // 4011 = app custom: session replaced by another login
    if (code === 4011) {
      alert("Tu sesion fue reemplazada por otro ingreso.");
      clearAuthToken();
      resetRoomUi("replaced");
      setConnectionState("disconnected");
      return;
    }

    // 4013 = mesa cerrada por fin de partida; no reconectar para evitar unirse a otra mesa
    if (code === 4013) {
      tournamentEnded = true;
      hadRoomWhenBackgrounded = false;
      setConnectionState("disconnected");
      room = null;
      currentSessionId = null;
      gameUiContext.currentSessionId = null;
      if (!overlayRefs.tournamentResultOverlay.classList.contains("hidden")) return;
      showGameEndMessageFn(overlayRefs);
      return;
    }

    if (tournamentEnded) {
      hadRoomWhenBackgrounded = false;
      setConnectionState("disconnected");
      room = null;
      currentSessionId = null;
      gameUiContext.currentSessionId = null;
      if (!overlayRefs.tournamentResultOverlay.classList.contains("hidden")) return;
      showGameEndMessageFn(overlayRefs);
      return;
    }
    
    // Unexpected disconnect - attempt to reconnect
    log(`Disconnected from room (code: ${code}). Attempting to reconnect...`);
    setConnectionState("disconnected");
    attemptReconnect();
  });

  joinedRoom.onMessage("gameResult", (payload: { result?: string; champion?: { sessionId?: string; name?: string; chips?: number } }) => {
    const result = payload?.result === "won" ? "won" : "lost";
    showTournamentResult(result, payload?.champion);
    log(result === "won" ? "¡Has ganado la mesa!" : "Has perdido. La mesa se ha cerrado.");
  });

  joinedRoom.onMessage("joined", (payload) => {
    log(`Joined payload: ${JSON.stringify(payload)}`);
  });

  joinedRoom.onMessage("playerJoined", (payload) => {
    log(`Player joined: ${JSON.stringify(payload)}`);
  });

  joinedRoom.onMessage("playerLeft", (payload) => {
    log(`Player left: ${JSON.stringify(payload)}`);
  });

  joinedRoom.onMessage("playerDisconnected", (payload: any) => {
    console.log("Player disconnected", payload);
    log(`${payload.playerName} se ha desconectado${payload.wasCurrentTurn ? ' (era su turno)' : ''}`);
  });

  joinedRoom.onMessage("heartbeat_ack", () => {
    if (lastHeartbeatSendTime > 0) {
      recordRtt(Date.now() - lastHeartbeatSendTime);
    }
    clearHeartbeatTimeoutFn();
    if (connectionState !== "connected") {
      setConnectionState("connected");
      replayBufferedActions();
    }
  });

  joinedRoom.onMessage("bettingRoundStarted", (payload) => {
    log(`Betting round: ${JSON.stringify(payload)}`);
    revealedHands = null;
    allInCardsRevealedByServer = false;
    // Clear winner display so the new round shows turn/state correctly (avoids stale UI if next hand starts within 5s)
    clearWinnerDisplay(winnerDisplayState);
  });

  joinedRoom.onMessage(
    "communityCardRevealed",
    (payload: { communityCards?: unknown; index?: number; card?: string }) => {
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

  joinedRoom.onMessage("playerAction", (payload) => {
    log(`Player action: ${JSON.stringify(payload)}`);
    if (payload?.action && typeof payload.action === "string") {
      audio.playActionSound(payload.action);
    }
  });

  joinedRoom.onMessage("turnTimer", (payload) => {
    if (!payload || typeof payload !== "object") return;
    const record = payload as Record<string, unknown>;
    const turnId = typeof record.currentTurn === "string" ? record.currentTurn : "";
    const startedAt = typeof record.startedAt === "number" ? record.startedAt : null;
    const timeoutMs = typeof record.timeoutMs === "number" ? record.timeoutMs : TURN_TIMEOUT_MS;
    const serverTime = typeof record.serverTime === "number" ? record.serverTime : null;
    if (!turnId || startedAt === null || serverTime === null) return;

    const clientNow = Date.now();
    const offsetMs = serverTime - clientNow;
    const deadlineMs = startedAt - offsetMs + timeoutMs;
    startTurnTimerFn(turnTimerState, turnId, timeoutMs, turnTimerChip, deadlineMs);
  });

  room.onMessage("roundEnded", (payload) => {
    const winnersPayload = Array.isArray(payload?.winners) ? payload.winners : [];
    const winnersForHistory: HandHistoryWinner[] = winnersPayload
      .filter((winner: any) => winner && typeof winner.playerId === "string")
      .map((winner: any) => ({
        playerId: winner.playerId,
        amount: typeof winner.amount === "number" ? winner.amount : undefined
      }));
    const potValue = Number(potStatus.textContent ?? 0);
    const communityCards = schemaArrayToCards(payload?.communityCards);
    const yourHand = currentSessionId && payload?.playerHands?.[currentSessionId]
      ? payload.playerHands[currentSessionId]
      : undefined;
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

      const showWinners = () => {
        winnerDisplayState.lastWinners = pendingWinners ?? [];
        winnerDisplayState.lastWinningHand = pendingWinningHand ?? "";
        winnersStatus.textContent = winnerDisplayState.lastWinners.join(", ") || "-";
        winningHandStatus.textContent = winnerDisplayState.lastWinningHand;
        winningHandChip.textContent = winnerDisplayState.lastWinningHand;
        if (currentSessionId && winnerDisplayState.lastWinners.includes(currentSessionId)) {
          audio.playEffect("win");
        }
        allInRevealInProgress = false;
        pendingWinners = null;
        pendingWinningHand = null;
        gameUiContext.previousCommunityCards = [...communityCards];
        startWinnerDisplayPhase();
        if (lastRoomState) renderState(lastRoomState);
      };

      if (allInCardsRevealedByServer) {
        gameUiContext.previousCommunityCards = [...communityCards];
        showWinners();
      } else {
        gameUiContext.previousCommunityCards = [...communityCards];
        revealAllInCards(communityCards, showWinners);
      }
    } else {
      gameUiContext.previousCommunityCards = [...communityCards];
      winnerDisplayState.lastWinningHand = payload?.winningHand ?? "";
      winningHandStatus.textContent = winnerDisplayState.lastWinningHand;
      winningHandChip.textContent = winnerDisplayState.lastWinningHand;
      if (Array.isArray(payload?.winners)) {
        winnerDisplayState.lastWinners = payload.winners.map((winner: any) => winner.playerId);
        winnersStatus.textContent = winnerDisplayState.lastWinners.join(", ") || "-";
        previousWinnersKey = winnerDisplayState.lastWinners.join("|");
        if (currentSessionId && winnerDisplayState.lastWinners.includes(currentSessionId)) {
          audio.playEffect("win");
        }
        startWinnerDisplayPhase();
      }
      if (lastRoomState) renderState(lastRoomState);
    }
    
    addHandHistoryEntry(
      {
        timestamp: Date.now(),
        winners: winnersForHistory,
        winningHand: payload?.winningHand ?? "-",
        communityCards,
        pot: potValue,
        yourHand
      },
      MAX_HAND_HISTORY
    );
    renderHandHistoryUi();
    log(`Round ended: ${JSON.stringify(payload)}`);
  });

  room.onMessage("error", (payload) => {
    log(`Server error: ${JSON.stringify(payload)}`);
  });

  room.onStateChange((state) => {
    lastRoomState = state;
    renderState(state);
  });
  } finally {
    joinInProgress = false;
    joinByIdButton.disabled = false;
    if (mode === "create") {
      setTimeout(() => { createTableButton.disabled = false; }, CREATE_TABLE_COOLDOWN_MS);
    } else {
      createTableButton.disabled = false;
    }
  }
}

type LobbyDepsFactory = () => LobbyDeps;

type WinnerRankingEntry = {
  id: number;
  username: string;
  gamesPlayed: number;
  gamesWon: number;
};

async function refreshWinnersRanking() {
  try {
    const res = await fetch(`${API_URL}/api/ranking/top-winners`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as WinnerRankingEntry[] | any;
    const entries: WinnerRankingEntry[] = Array.isArray(data)
      ? data
          .filter(
            (item: any) =>
              item &&
              typeof item.id === "number" &&
              typeof item.username === "string"
          )
          .map((item: any) => ({
            id: item.id,
            username: item.username,
            gamesPlayed: Number(item.gamesPlayed ?? 0),
            gamesWon: Number(item.gamesWon ?? 0),
          }))
      : [];

    winnersRankingList.innerHTML = "";
    if (entries.length === 0) {
      const li = document.createElement("li");
      li.className = "room-item room-item-empty";
      li.textContent = "Todavía no hay datos de ranking.";
      winnersRankingList.appendChild(li);
      return;
    }

    entries.forEach((entry, index) => {
      const li = document.createElement("li");
      li.className = "room-item";

      const left = document.createElement("div");
      left.className = "ranking-left";

      const pos = document.createElement("span");
      pos.className = "ranking-pos";
      pos.textContent = String(index + 1);
      if (index === 0) pos.classList.add("gold");
      else if (index === 1) pos.classList.add("silver");
      else if (index === 2) pos.classList.add("bronze");

      const name = document.createElement("span");
      name.className = "room-name";
      name.textContent = entry.username;

      const meta = document.createElement("span");
      meta.className = "room-meta";
      meta.textContent = `${entry.gamesWon} ganadas · ${entry.gamesPlayed} jugadas`;

      left.appendChild(pos);
      left.appendChild(name);

      li.appendChild(left);
      li.appendChild(meta);
      winnersRankingList.appendChild(li);
    });
  } catch (err: any) {
    winnersRankingList.innerHTML = "";
    const li = document.createElement("li");
    li.className = "room-item room-item-empty";
    li.textContent = "No se pudo cargar el ranking.";
    winnersRankingList.appendChild(li);
    log(`Ranking error: ${err?.message || err}`);
  }
}

function startLobbyPolling() {
  stopLobbyPolling();
  lobbyPollId = window.setInterval(() => {
    refreshLobbyRooms(getLobbyDeps(), false).catch(() => undefined);
  }, 5000);
}

function stopLobbyPolling() {
  if (lobbyPollId !== null) {
    clearInterval(lobbyPollId);
    lobbyPollId = null;
  }
}

async function openLobby() {
  if (!token) {
    setAuthOverlayVisible(true);
    setLobbyOverlayVisible(false);
    log("No token. Login o registro requerido.");
    return;
  }
  setAuthOverlayVisible(false);
  setLobbyOverlayVisible(true);
  joinInProgress = false;
  setLobbyJoinButtonsEnabled(true);
  await refreshLobbyRooms(getLobbyDeps(), true);
  await refreshWinnersRanking();
  startLobbyPolling();
}

(document.querySelector("#register") as HTMLButtonElement).addEventListener("click", () => {
  register().catch((err) => {
    const message = err?.message || String(err);
    const mapped = mapAuthError(message, "register");
    setAuthMessage(mapped, "error");
    log(`Register error: ${message}`);
  });
});

(document.querySelector("#login") as HTMLButtonElement).addEventListener("click", () => {
  login().catch((err) => {
    const message = err?.message || String(err);
    const mapped = mapAuthError(message, "login");
    setAuthMessage(mapped, "error");
    log(`Login error: ${message}`);
  });
});

(document.querySelector("#join") as HTMLButtonElement).addEventListener("click", () => {
  openLobby().catch((err) => log(`Lobby error: ${err?.message || err}`));
});

const authLoginForm = document.querySelector("#auth-login-form") as HTMLElement;
const forgotPasswordBlock = document.querySelector("#forgot-password-block") as HTMLElement;
const forgotPasswordLink = document.querySelector("#forgot-password-link") as HTMLAnchorElement;
const forgotPasswordEmail = document.querySelector("#forgot-password-email") as HTMLInputElement;
const forgotPasswordSubmit = document.querySelector("#forgot-password-submit") as HTMLButtonElement;
const forgotPasswordBack = document.querySelector("#forgot-password-back") as HTMLButtonElement;
const loginEmailInput = document.querySelector("#email") as HTMLInputElement;

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    if (authLoginForm) authLoginForm.classList.add("hidden");
    if (forgotPasswordBlock) forgotPasswordBlock.classList.remove("hidden");
    // Prefill with email the user already typed (if any)
    const existingEmail = (loginEmailInput?.value ?? "").trim();
    if (forgotPasswordEmail && !forgotPasswordEmail.value.trim() && existingEmail) {
      forgotPasswordEmail.value = existingEmail;
    }
    setAuthMessage("", "info");
  });
}
if (forgotPasswordBack) {
  forgotPasswordBack.addEventListener("click", () => {
    if (authLoginForm) authLoginForm.classList.remove("hidden");
    if (forgotPasswordBlock) forgotPasswordBlock.classList.add("hidden");
    setAuthMessage("", "info");
  });
}
if (forgotPasswordSubmit) {
  forgotPasswordSubmit.addEventListener("click", async () => {
    const email = forgotPasswordEmail?.value?.trim() ?? "";
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setAuthMessage(emailValidation.error ?? "Email no válido", "error");
      return;
    }
    setAuthMessage("Enviando enlace...", "info");
    try {
      await request("/api/auth/forgot-password", { email });
      setAuthMessage("Si existe una cuenta con ese correo, te hemos enviado un enlace para restablecer la contraseña. Revisa tu bandeja de entrada.", "success");
    } catch (err) {
      setAuthMessage("No se pudo enviar el enlace. Inténtalo de nuevo más tarde.", "error");
      log(`Forgot password error: ${err}`);
    }
  });
}

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
  stopLobbyPolling();
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

(document.querySelector("#start-game") as HTMLButtonElement).addEventListener("click", () => {
  queueAction("startGame", undefined);
});

(document.querySelector("#check") as HTMLButtonElement).addEventListener("click", () => {
  queueAction("check", undefined);
});

(document.querySelector("#call") as HTMLButtonElement).addEventListener("click", () => {
  queueAction("call", undefined);
});

(document.querySelector("#fold") as HTMLButtonElement).addEventListener("click", () => {
  queueAction("fold", undefined);
});

(document.querySelector("#all-in") as HTMLButtonElement).addEventListener("click", () => {
  queueAction("allIn", undefined);
});

function getBetAmount() {
  const amount = parseInt((document.querySelector("#bet-amount") as HTMLInputElement).value, 10);
  return Number.isFinite(amount) ? amount : 0;
}

(document.querySelector("#bet") as HTMLButtonElement).addEventListener("click", () => {
  const amount = getBetAmount();
  if (amount <= 0) {
    log("Invalid bet amount.");
    return;
  }
  queueAction("bet", amount);
});

(document.querySelector("#raise") as HTMLButtonElement).addEventListener("click", () => {
  const amount = getBetAmount();
  if (amount <= 0) {
    log("Invalid raise amount.");
    return;
  }
  queueAction("raise", amount);
});

(document.querySelector("#toggle-panel") as HTMLButtonElement).addEventListener("click", () => {
  const app = document.querySelector("#app");
  app?.classList.toggle("panel-collapsed");
});
