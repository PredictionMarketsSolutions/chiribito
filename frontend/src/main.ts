import { Client, Room } from "colyseus.js";

import { API_URL, WS_URL, TURN_TIMEOUT_MS, MAX_RECONNECT_ATTEMPTS, MAX_HAND_HISTORY, ACTION_BUFFER_MAX_SIZE } from "./config";
import type { RoomState, PlayerState, HandHistoryWinner, BufferedAction, ConnectionState } from "./types";
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
  addHandHistoryEntry,
  clearHandHistory,
  renderHandHistory
} from "./hand-history";
import { createCardElement, renderCardRow, cardsEqual, preloadCardImages } from "./ui-cards";

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
const refreshRoomsButton = dom.refreshRoomsButton!;
const tableNameInput = dom.tableNameInput!;
const createTableButton = dom.createTableButton!;
const backToAuthButton = dom.backToAuthButton!;
const joinRoomIdInput = dom.joinRoomIdInput!;
const joinByIdButton = dom.joinByIdButton!;
const tournamentResultOverlay = dom.tournamentResultOverlay!;
const tournamentResultTitle = dom.tournamentResultTitle!;
const tournamentResultMessage = dom.tournamentResultMessage!;
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
const yourTurnIndicator = dom.yourTurnIndicator!;;

// Initialize after functions are defined
document.addEventListener("DOMContentLoaded", () => {
  apiUrlEl.textContent = API_URL;
  wsUrlEl.textContent = WS_URL;
  void initPixiLayer();
  setAuthOverlayVisible(true);
  renderHandHistoryUi();
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

// Mobile background handling
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // App went to background - pause heartbeat to save battery
    log("🔇 App backgrounded, heartbeat paused");
    stopClientHeartbeat();
  } else {
    // App came back to foreground - check connection
    log("🔊 App resumed from background");
    if (connectionState === "disconnected" && token) {
      log("Attempting to reconnect...");
      attemptReconnect();
    } else if (connectionState === "connected" && room) {
      log("Resuming heartbeat...");
      startClientHeartbeat();
    }
  }
});

function log(message: string) {
  const ts = new Date().toLocaleTimeString();
  logEl.textContent = `[${ts}] ${message}\n` + logEl.textContent;
}

function setLobbyOverlayVisible(visible: boolean) {
  if (visible) {
    lobbyOverlay.classList.remove("hidden");
  } else {
    lobbyOverlay.classList.add("hidden");
  }
}

function setLobbyMessage(message: string, type: "success" | "error" | "info" = "info") {
  lobbyMessage.textContent = message;
  lobbyMessage.classList.remove("success", "error", "info", "visible");
  if (!message) return;
  lobbyMessage.classList.add("visible", type);
}

function showTournamentResult(
  result: "won" | "lost",
  champion?: { sessionId?: string; name?: string; chips?: number }
) {
  tournamentEnded = true;
  const name = champion?.name ?? "Ganador";
  const chips = champion?.chips ?? 0;
  if (result === "won") {
    tournamentResultTitle.textContent = "¡Has ganado!";
    tournamentResultMessage.textContent = `Eres el campeón de la mesa con ${chips} fichas. La mesa se ha cerrado.`;
  } else {
    tournamentResultTitle.textContent = "Has perdido";
    tournamentResultMessage.textContent = `${name} ha ganado la mesa con ${chips} fichas. La mesa se ha cerrado.`;
  }
  tournamentResultOverlay.classList.remove("hidden");
  setAuthOverlayVisible(false);
  setLobbyOverlayVisible(false);
}

function setTournamentResultVisible(visible: boolean) {
  if (visible) {
    tournamentResultOverlay.classList.remove("hidden");
  } else {
    tournamentResultOverlay.classList.add("hidden");
  }
}

let token: string | null = null;
let refreshToken: string | null = null;
let room: Room | null = null;
let currentSessionId: string | null = null;
let wsClient: Client | null = null;
let lobbyPollId: number | null = null;
/** True cuando la mesa cerró por fin de torneo (único ganador); no reconectar. */
let tournamentEnded = false;
let lastWinningHand = "-";
let lastWinners: string[] = [];
let tokenMonitorId: number | null = null;
let tokenInvalidNotified = false;
let pixiApp: any = null;
let pixiLayer: HTMLDivElement | null = null;
// Connection monitoring
let connectionState: ConnectionState = "disconnected";
let reconnectAttempts = 0;
let heartbeatTimeoutId: number | null = null;
let clientHeartbeatId: number | null = null;
const HEARTBEAT_INTERVAL_MS = 25000;
const HEARTBEAT_TIMEOUT_MS = 10000;

// Connection metrics (RTT tracking)
let lastHeartbeatSendTime = 0;
const rttSamples: number[] = [];
let averageRtt = 0;
let connectionQuality: "excellent" | "good" | "degraded" | "poor" = "excellent";

// Action buffering for offline resilience
const actionBuffer: BufferedAction[] = [];
let pixiTableSurface: HTMLDivElement | null = null;
let previousCommunityCards: string[] = [];
let previousHandCards: string[] = [];
let pixiLib: any = null;
let revealedHands: Record<string, string[]> | null = null;
let turnTimerId: number | null = null;
let turnDeadlineMs: number | null = null;
let lastTurnId: string | null = null;
let lastTurnTimeoutMs: number | null = null;
let previousPotValue: number | null = null;
let previousCurrentBetValue: number | null = null;
let previousWinnersKey = "";
let allInAnimationTimeoutId: number | null = null;
let allInCardIndex = 0;
let allInRevealStarted = false;
let allInRevealInProgress = false;
/** True if server sent communityCardRevealed this round (all-in); then roundEnded only shows winners. */
let allInCardsRevealedByServer = false;
let pendingWinners: string[] | null = null;
let pendingWinningHand: string | null = null;
let lastRoomState: RoomState | null = null;
const latestPlayerNames = new Map<string, string>();

function renderHandHistoryUi() {
  renderHandHistory(handHistoryList, (id) => latestPlayerNames.get(id) ?? id);
}

function isPlayerState(value: unknown): value is PlayerState {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.sessionId === "string" &&
    typeof record.name === "string" &&
    typeof record.chips === "number" &&
    typeof record.currentBet === "number" &&
    typeof record.isFolded === "boolean" &&
    typeof record.seatIndex === "number"
  );
}

function triggerAnimation(element: HTMLElement, className: string) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

/** Normalize Colyseus ArraySchema or plain array to string[] (handles toArray(), Array.from, or copy). */
function schemaArrayToCards(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value as string[];
  const raw = value as { toArray?: () => string[]; length?: number; [i: number]: string };
  if (typeof raw.toArray === "function") return raw.toArray();
  if (typeof raw.length === "number" && raw.length >= 0) {
    const out: string[] = [];
    for (let i = 0; i < raw.length; i++) {
      if (typeof raw[i] === "string") out.push(raw[i]);
    }
    return out;
  }
  try {
    return Array.from(value as Iterable<string>);
  } catch {
    return [];
  }
}

function getUserEntries(state: RoomState): PlayerState[] {
  const users = state?.users;
  if (!users) return [];
  if (users instanceof Map) return Array.from(users.values());
  const iterableUsers = users as unknown as { values?: () => Iterable<PlayerState> };
  if (typeof iterableUsers.values === "function") {
    return Array.from(iterableUsers.values()).filter(isPlayerState);
  }
  const forEachUsers = users as unknown as { forEach?: (cb: (value: PlayerState) => void) => void };
  if (typeof forEachUsers.forEach === "function") {
    const results: PlayerState[] = [];
    forEachUsers.forEach((value) => {
      if (isPlayerState(value)) results.push(value);
    });
    return results;
  }
  return Object.values(users).filter(isPlayerState);
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
  return pixiLib.Texture.from(`/cards/${suit}_${rank}.jpg`);
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
  room = null;
  currentSessionId = null;
  lastWinningHand = "-";
  lastWinners = [];
  revealedHands = null;
  previousPotValue = null;
  previousCurrentBetValue = null;
  previousWinnersKey = "";
  allInRevealStarted = false;
  allInRevealInProgress = false;
  allInCardsRevealedByServer = false;
  pendingWinners = null;
  pendingWinningHand = null;
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
  stopTurnTimer();
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
  renderSeats({ users: new Map(), dealerIndex: -1, currentTurn: "" });
  updateActionButtons(null);
}

function stopTurnTimer() {
  if (turnTimerId !== null) {
    window.clearInterval(turnTimerId);
    turnTimerId = null;
  }
  turnDeadlineMs = null;
  lastTurnId = null;
  lastTurnTimeoutMs = null;
  turnTimerChip.textContent = "-";
}

function startTurnTimer(turnId: string, timeoutMs = TURN_TIMEOUT_MS, deadlineMs?: number) {
  lastTurnId = turnId;
  lastTurnTimeoutMs = timeoutMs;
  turnDeadlineMs = typeof deadlineMs === "number" ? deadlineMs : Date.now() + timeoutMs;

  const tick = () => {
    if (!turnDeadlineMs) return;
    const remainingMs = turnDeadlineMs - Date.now();
    const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    turnTimerChip.textContent = `${remainingSeconds}s`;
  };

  if (turnTimerId !== null) {
    window.clearInterval(turnTimerId);
  }
  tick();
  turnTimerId = window.setInterval(tick, 250);
}

function updateTurnTimer(state: RoomState) {
  const turnId = state.currentTurn ?? "";
  const roundActive = Boolean(state.roundStarted);

  if (!roundActive || !turnId) {
    stopTurnTimer();
    return;
  }

  if (turnId !== lastTurnId || turnDeadlineMs === null) {
    startTurnTimer(turnId, lastTurnTimeoutMs ?? TURN_TIMEOUT_MS);
  }
}

function clearAuthToken() {
  token = null;
  refreshToken = null;
  tokenStatus.textContent = "none";
  stopTokenMonitor();
  tokenInvalidNotified = false;
  localStorage.removeItem('refreshToken');
}

function stopTokenMonitor() {
  if (tokenMonitorId !== null) {
    window.clearInterval(tokenMonitorId);
    tokenMonitorId = null;
  }
}

function handleTokenInvalidated() {
  if (tokenInvalidNotified) return;
  tokenInvalidNotified = true;
  clearAuthToken();
  resetRoomUi("logged out");
  alert("Se ha iniciado sesion en otro dispositivo. Por favor, vuelve a iniciar sesion.");
}

function startTokenMonitor() {
  stopTokenMonitor();
  if (!token) return;
  
  // Check and refresh token every 50 minutes (10 min before expiry)
  tokenMonitorId = window.setInterval(async () => {
    if (!token || !refreshToken) return;
    try {
      // Try to refresh token
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        token = data.token;
        refreshToken = data.refreshToken;
        tokenStatus.textContent = "refreshed";
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        log("Token refreshed successfully");
      } else {
        // Refresh failed, user needs to login again
        handleTokenInvalidated();
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      // Don't invalidate on network errors, try again next interval
    }
  }, 50 * 60 * 1000); // 50 minutes
}

function renderSeats(state: RoomState) {
  const entries = getUserEntries(state).filter(isPlayerState);
  const dealerIndex = typeof state?.dealerIndex === "number" ? state.dealerIndex : -1;
  const currentTurn = state?.currentTurn ?? "";
  const totalSeats = 6;
  const targetFrontIndex = 3;

  const playersBySeat: Array<PlayerState | undefined> = Array(totalSeats).fill(undefined);
  entries.forEach((player) => {
    if (Number.isFinite(player.seatIndex) && player.seatIndex >= 0 && player.seatIndex < totalSeats) {
      playersBySeat[player.seatIndex] = player;
    }
  });

  let seatShift = 0;
  const myPlayer = entries.find((player) => player.sessionId === currentSessionId);
  if (myPlayer && Number.isFinite(myPlayer.seatIndex)) {
    seatShift = (targetFrontIndex - myPlayer.seatIndex + totalSeats) % totalSeats;
  }

  const visualSeats: Array<PlayerState | undefined> = Array(totalSeats).fill(undefined);
  const visualSeatNumbers: number[] = Array(totalSeats).fill(0);
  for (let logicalIndex = 0; logicalIndex < totalSeats; logicalIndex += 1) {
    const visualIndex = (logicalIndex + seatShift) % totalSeats;
    visualSeats[visualIndex] = playersBySeat[logicalIndex];
    visualSeatNumbers[visualIndex] = logicalIndex;
  }

  const seats = Array.from(seatsEl.querySelectorAll<HTMLDivElement>(".seat"));
  seats.forEach((seat, index) => {
    const nameEl = seat.querySelector<HTMLDivElement>(".seat-name");
    const metaEl = seat.querySelector<HTMLDivElement>(".seat-meta");
    const badgeEl = seat.querySelector<HTMLDivElement>(".seat-badge");
    let handEl = seat.querySelector<HTMLDivElement>(".seat-hand");
    const player = visualSeats[index];
    const logicalSeatIndex = visualSeatNumbers[index];

    if (!nameEl || !metaEl) return;

    if (!player) {
      seat.classList.remove("active", "you", "folded");
      seat.classList.remove("dealer", "turn", "winner");
      if (badgeEl) badgeEl.textContent = `Seat ${logicalSeatIndex + 1}`;
      nameEl.textContent = "Libre";
      metaEl.textContent = "";
      if (handEl) {
        handEl.innerHTML = "";
      }
      return;
    }

    const isYou = currentSessionId && player.sessionId === currentSessionId;
    const isWinner = lastWinners.includes(player.sessionId);
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
    
    // Show winning hand if player is winner
    if (isWinner && lastWinningHand !== "-") {
      const winningHandEl = document.createElement("div");
      winningHandEl.classList.add("seat-winning-hand");
      winningHandEl.textContent = lastWinningHand;
      metaEl.appendChild(winningHandEl);
    }

    if (!handEl) {
      handEl = document.createElement("div");
      handEl.classList.add("seat-hand");
      seat.appendChild(handEl);
    }
    handEl.innerHTML = "";
    const cards = revealedHands?.[player.sessionId] ?? [];
    if (cards.length) {
      for (let i = 0; i < Math.min(cards.length, 2); i += 1) {
        const cardEl = createCardElement(cards[i]);
        cardEl.classList.add("mini");
        handEl.appendChild(cardEl);
      }
    }
  });
}

function renderPlayers(state: RoomState) {
  playersList.innerHTML = "";
  mobileSeatsList.innerHTML = "";
  if (!state || !state.users) return;

  const entries = getUserEntries(state).filter(isPlayerState);
  const currentTurnId = state.currentTurn ?? "";

  entries.sort((a, b) => a.seatIndex - b.seatIndex);

  entries.forEach((player) => {
    const li = document.createElement("li");
    const isYou = currentSessionId && player.sessionId === currentSessionId ? " (you)" : "";
    li.textContent = `${player.name}${isYou} | chips: ${player.chips} | bet: ${player.currentBet}${player.isFolded ? " | folded" : ""}`;
    playersList.appendChild(li);

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
    mobileSeatsList.appendChild(mobileItem);
  });
}

function renderState(state: RoomState) {
  if (!state) return;
  phaseStatus.textContent = state.phase ?? "-";
  const entries = getUserEntries(state).filter(isPlayerState);
  latestPlayerNames.clear();
  entries.forEach((player) => {
    latestPlayerNames.set(player.sessionId, player.name);
  });
  const currentTurnId = state.currentTurn ?? "";
  const turnPlayer = entries.find((player) => player.sessionId === currentTurnId);
  turnStatus.textContent = turnPlayer?.name ?? (state.currentTurn ?? "-");
  
  // Show/hide "ES TU TURNO" indicator
  if (currentSessionId && currentTurnId === currentSessionId) {
    yourTurnIndicator.classList.remove("hidden");
  } else {
    yourTurnIndicator.classList.add("hidden");
  }
  
  const potValue = Number(state.pot ?? 0);
  const currentBetValue = Number(state.currentBet ?? 0);
  potStatus.textContent = String(potValue);
  betStatus.textContent = String(currentBetValue);
  potChip.textContent = String(potValue);
  phaseChip.textContent = state.phase ?? "waiting";
  turnChip.textContent = turnPlayer?.name ?? (state.currentTurn ?? "-");
  previousPotValue = potValue;
  previousCurrentBetValue = currentBetValue;
  updateTurnTimer(state);
  winningHandStatus.textContent = lastWinningHand;
  winningHandChip.textContent = lastWinningHand;
  winnersStatus.textContent = lastWinners.join(", ") || "-";
  const rawCommunity = state.communityCards;
  const community = schemaArrayToCards(rawCommunity);
  communityStatus.textContent = community.length ? community.join(" ") : "-";
  
  // Check if all active players are all-in (0 chips and not folded)
  const activePlayers = entries.filter((p: any) => !p.isFolded && p.chips !== undefined);
  const allPlayersAllIn = activePlayers.length > 1 && activePlayers.every((p: any) => Number(p.chips ?? 0) === 0);
  
  // Disable buttons when all-in (BEFORE rendering)
  updateActionButtons(state, allPlayersAllIn);
  
  if (!allInRevealInProgress) {
    if (!cardsEqual(community, previousCommunityCards)) {
      renderCardRow(communityCardsEl, community, 5);
      animateCardDeals(communityCardsEl, community, previousCommunityCards);
      previousCommunityCards = [...community];
    }
  }
  if (currentSessionId) {
    const me = entries.find((player: any) => player.sessionId === currentSessionId);
    // With StateView (backend), only this client's Player has hand synced; others have no hand.
    const hand = schemaArrayToCards(me?.hand);
    handStatus.textContent = hand.length ? hand.join(" ") : "-";
    if (!cardsEqual(hand, previousHandCards)) {
      renderCardRow(handCardsEl, hand, 2);
      animateCardDeals(handCardsEl, hand, previousHandCards);
      previousHandCards = [...hand];
    }
  } else {
    handStatus.textContent = "-";
    renderCardRow(handCardsEl, [], 2);
    previousHandCards = [];
  }
  renderSeats(state);
  renderPlayers(state);
}

function updateActionButtons(state: RoomState | null, isAllIn: boolean = false) {
  // If all-in or no state, disable all buttons
  if (isAllIn || !state || !currentSessionId) {
    setActionButtonsEnabled(false, false, false, false, false, false, false);
    callButton.textContent = "Call";
    return;
  }

  const entries = getUserEntries(state).filter(isPlayerState);
  const me = entries.find((player) => player.sessionId === currentSessionId);
  const isMyTurn = Boolean(me) && state.currentTurn === currentSessionId;
  const isActive = Boolean(me) && !me?.isFolded && Boolean(state.roundStarted);
  const canAct = isMyTurn && isActive;
  const currentBet = Number(state.currentBet ?? 0);
  const myBet = Number(me?.currentBet ?? 0);
  const myChips = Number(me?.chips ?? 0);

  const canCheck = canAct && currentBet === myBet;
  const canCall = canAct && currentBet > myBet && myChips > 0;
  const callAmount = currentBet - myBet;
  
  // Update call button text with amount
  if (canCall) {
    callButton.textContent = `Call ($${callAmount})`;
  } else {
    callButton.textContent = "Call";
  }
  
  const canFold = canAct;
  const canAllIn = canAct && myChips > 0;
  const canBet = canAct && currentBet === 0 && myChips > 0;
  const canRaise = canAct && currentBet > 0 && myChips > 0;

  // Count active players (chips > 0)
  const activePlayers = entries.filter((p: any) => Number(p.chips ?? 0) > 0).length;
  const canStart = Boolean(currentSessionId) && !state.roundStarted && activePlayers >= 2;

  setActionButtonsEnabled(
    canStart,
    canCheck,
    canCall,
    canFold,
    canAllIn,
    canBet,
    canRaise
  );
}

function setActionButtonsEnabled(
  canStart: boolean,
  canCheck: boolean,
  canCall: boolean,
  canFold: boolean,
  canAllIn: boolean,
  canBet: boolean,
  canRaise: boolean
) {
  startGameButton.disabled = !canStart;
  checkButton.disabled = !canCheck;
  callButton.disabled = !canCall;
  foldButton.disabled = !canFold;
  allInButton.disabled = !canAllIn;
  betButton.disabled = !canBet;
  raiseButton.disabled = !canRaise;
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

/**
 * Start sending heartbeat to server to keep connection alive
 * Also tracks RTT (Round-Trip Time) for connection quality monitoring
 */
function startClientHeartbeat() {
  stopClientHeartbeat();
  
  clientHeartbeatId = window.setInterval(() => {
    if (!room) return;
    
    // Record when heartbeat is sent for RTT calculation
    lastHeartbeatSendTime = Date.now();
    // Send heartbeat with client timestamp for server to measure RTT
    room.send("heartbeat", lastHeartbeatSendTime);
    
    // Wait for ack with timeout
    heartbeatTimeoutId = window.setTimeout(() => {
      log("[HEARTBEAT] No ACK received, server not responding");
      if (room) {
        room.leave();
      }
    }, HEARTBEAT_TIMEOUT_MS);
  }, HEARTBEAT_INTERVAL_MS);
}

/**
 * Stop sending heartbeat
 */
function stopClientHeartbeat() {
  if (clientHeartbeatId !== null) {
    clearInterval(clientHeartbeatId);
    clientHeartbeatId = null;
  }
  if (heartbeatTimeoutId !== null) {
    clearTimeout(heartbeatTimeoutId);
    heartbeatTimeoutId = null;
  }
}

/**
 * Update connection state and log
 */
function setConnectionState(state: "disconnected" | "connecting" | "connected") {
  connectionState = state;
  const stateEmojis = {
    disconnected: "⚫",
    connecting: "🟡",
    connected: "🟢"
  };
  log(`[${stateEmojis[state]}] Connection: ${state}`);
  updateConnectionIndicator();
}

/**
 * Record RTT (Round-Trip Time) and update connection quality metrics
 */
function recordRtt(rttMs: number) {
  rttSamples.push(rttMs);
  if (rttSamples.length > 20) rttSamples.shift(); // Keep last 20 samples
  
  averageRtt = rttSamples.reduce((a, b) => a + b, 0) / rttSamples.length;
  
  // Classify connection quality based on RTT
  if (averageRtt < 100) {
    connectionQuality = "excellent";
  } else if (averageRtt < 300) {
    connectionQuality = "good";
  } else if (averageRtt < 1000) {
    connectionQuality = "degraded";
  } else {
    connectionQuality = "poor";
  }
  
  // Update UI
  rttStatus.textContent = `${averageRtt.toFixed(0)}ms`;
  qualityStatus.textContent = connectionQuality.toUpperCase();
  
  // Color code quality
  qualityStatus.style.color = 
    connectionQuality === "excellent" ? "var(--felt-main)" :
    connectionQuality === "good" ? "var(--felt-light)" :
    connectionQuality === "degraded" ? "var(--gold)" :
    "#ff4444";
  
  if (connectionQuality !== "excellent" && rttSamples.length % 5 === 0) {
    log(`⚠️ Connection degraded: ${averageRtt.toFixed(0)}ms RTT (${connectionQuality})`);
  }
}

/**
 * Queue an action to be sent when connection is available
 * Applies rate limiting to prevent spam
 */
function queueAction(action: string, data: any) {
  // Rate limiting check
  if (!requireCooldown(action)) {
    return;
  }
  
  if (connectionState !== "connected" || !room) {
    const buffered: BufferedAction = { action, data, timestamp: Date.now() };
    if (actionBuffer.length >= ACTION_BUFFER_MAX_SIZE) {
      actionBuffer.shift(); // Drop oldest if buffer full
    }
    actionBuffer.push(buffered);
    log(`⏱️ ${action} buffered (${actionBuffer.length}/${ACTION_BUFFER_MAX_SIZE})`);
    bufferStatus.textContent = `${actionBuffer.length}`;
    bufferStatus.style.color = actionBuffer.length > 10 ? "var(--gold)" : "var(--gray-400)";
    return;
  }
  
  // Send immediately if connected
  room.send(action, data);
  bufferStatus.textContent = "0";
  bufferStatus.style.color = "var(--gray-400)";
}

/**
 * Update visual connection indicator based on current state and quality
 */
function updateConnectionIndicator() {
  if (connectionState === "connected") {
    connectionIndicator.style.backgroundColor = "var(--felt-main)";
    connectionIndicator.title = `Connected (${averageRtt.toFixed(0)}ms, ${connectionQuality})`;
  } else if (connectionState === "connecting") {
    connectionIndicator.style.backgroundColor = "var(--gold)";
    connectionIndicator.title = `Connecting (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`;
  } else {
    connectionIndicator.style.backgroundColor = "#ff4444";
    connectionIndicator.title = "Disconnected";
  }
}

/**
 * Rate limiting to prevent action spam attacks
 * Only applies to rapid-fire betting actions, not game setup actions
 */
const actionCooldowns = new Map<string, number>();
const ACTION_COOLDOWN_MS = 200; // 200ms between actions of same type
const RAPID_FIRE_ACTIONS = new Set(['bet', 'raise', 'call', 'fold', 'check']); // Only these get cooldown

function requireCooldown(action: string): boolean {
  // Game setup actions bypass cooldown (server-side validation is sufficient)
  if (!RAPID_FIRE_ACTIONS.has(action)) {
    return true;
  }
  
  const now = Date.now();
  const lastTime = actionCooldowns.get(action) ?? 0;
  
  if (now - lastTime < ACTION_COOLDOWN_MS) {
    log(`⏱️ ${action} on cooldown (${(ACTION_COOLDOWN_MS - (now - lastTime)).toFixed(0)}ms)`);
    return false;
  }
  
  actionCooldowns.set(action, now);
  return true;
}

/**
 * Replay buffered actions on reconnection
 */
function replayBufferedActions() {
  if (actionBuffer.length === 0 || !room) return;
  
  log(`↻ Replaying ${actionBuffer.length} buffered actions...`);
  const actions = [...actionBuffer];
  actionBuffer.length = 0;
  
  // Send with small delays to avoid overwhelming server
  actions.forEach((action, index) => {
    setTimeout(() => {
      if (room && connectionState === "connected") {
        room.send(action.action, action.data);
        log(`  ✓ Replayed: ${action.action}`);
      }
    }, index * 50); // 50ms between replayed actions
  });
}

/**
 * Show rebuy dialog when player has 0 chips
 */
let rebuyDialog: HTMLDivElement | null = null;
let rebuyTimeoutMs = 0;
let rebuyCountdownInterval: number | null = null;

function showRebuyDialog(cost: number, timeoutSeconds: number) {
  rebuyTimeoutMs = timeoutSeconds * 1000;
  
  // Remove existing dialog if any
  hideRebuyDialog();
  
  // Create dialog
  rebuyDialog = document.createElement("div");
  rebuyDialog.className = "rebuy-dialog-overlay";
  rebuyDialog.innerHTML = `
    <div class="rebuy-dialog">
      <div class="rebuy-icon">🪦</div>
      <h2>¡Te has quedado sin fichas!</h2>
      <p>¿Quieres re-comprar <strong>${cost} fichas</strong>?</p>
      <div class="rebuy-timer">
        <p>Tienen <span id="rebuy-countdown">${timeoutSeconds}</span>s para decidir</p>
      </div>
      <div class="rebuy-buttons">
        <button id="rebuy-accept" class="btn btn-primary">✓ Aceptar Re-compra</button>
        <button id="rebuy-decline" class="btn btn-secondary">✗ Declinar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(rebuyDialog);
  
  // Start countdown
  const countdownEl = document.getElementById("rebuy-countdown")!;
  let remaining = timeoutSeconds;
  
  rebuyCountdownInterval = setInterval(() => {
    remaining--;
    countdownEl.textContent = String(remaining);
    
    if (remaining <= 0) {
      clearInterval(rebuyCountdownInterval!);
      rebuyCountdownInterval = null;
      hideRebuyDialog();
    }
  }, 1000);
  
  // Accept button
  document.getElementById("rebuy-accept")!.addEventListener("click", () => {
    hideRebuyDialog();
    if (room) {
      room.send("rebuy", undefined);
      log("✅ Enviando solicitud de re-compra...");
    }
  });
  
  // Decline button
  document.getElementById("rebuy-decline")!.addEventListener("click", () => {
    hideRebuyDialog();
    log("❌ Re-compra declinada");
  });
  
  log(`💰 Dialog de re-compra mostrado (${timeoutSeconds}s)`);
}

/**
 * Hide rebuy dialog
 */
function hideRebuyDialog() {
  if (rebuyCountdownInterval) {
    clearInterval(rebuyCountdownInterval);
    rebuyCountdownInterval = null;
  }
  
  if (rebuyDialog) {
    rebuyDialog.remove();
    rebuyDialog = null;
  }
}

/**
 * Reconnect with exponential backoff
 */
async function attemptReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    log("❌ Max reconnection attempts reached. Please refresh and login again.");
    clearAuthToken();
    return;
  }

  reconnectAttempts++;
  const baseDelayMs = 1000;
  const delayMs = baseDelayMs * Math.pow(2, reconnectAttempts - 1);
  
  log(`🔄 Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delayMs}ms...`);
  
  await new Promise(resolve => setTimeout(resolve, delayMs));
  
  if (token && connectionState === "disconnected") {
    await joinRoom(true);
  }
}

function getWsClient(): Client {
  if (!wsClient) wsClient = new Client(WS_URL);
  return wsClient;
}

type JoinMode = "joinOrCreate" | "create" | "joinById";

async function joinRoom(
  forceReplace = false,
  opts?: { mode?: JoinMode; roomId?: string; tableName?: string }
) {
  if (!token) {
    log("No token. Login or register first.");
    setConnectionState("disconnected");
    return;
  }

  const { username } = getFormValues();
  setConnectionState("connecting");
  log("Connecting to Colyseus...");

  const client = getWsClient();
  
  let joinedRoom: Room;
  try {
    const mode: JoinMode = opts?.mode ?? "joinOrCreate";
    if (mode === "joinById") {
      const roomId = (opts?.roomId ?? "").trim();
      if (!roomId) {
        setConnectionState("disconnected");
        log("Room ID vacío.");
        return;
      }
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
    log(`Join error: ${message}`);
    setConnectionState("disconnected");
    return;
  }

  room = joinedRoom;
  currentSessionId = joinedRoom.sessionId;
  tournamentEnded = false;
  setAuthOverlayVisible(false);
  setLobbyOverlayVisible(false);
  setTournamentResultVisible(false);
  stopLobbyPolling();
  setConnectionState("connected");
  reconnectAttempts = 0;
  lastWinningHand = "-";
  lastWinners = [];
  winningHandStatus.textContent = lastWinningHand;
  winningHandChip.textContent = lastWinningHand;
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

    if (tournamentEnded) {
      setConnectionState("disconnected");
      room = null;
      if (!tournamentResultOverlay.classList.contains("hidden")) return;
      tournamentResultTitle.textContent = "Fin de la mesa";
      tournamentResultMessage.textContent = "La mesa se ha cerrado. Puedes volver al lobby para unirte a otra.";
      tournamentResultOverlay.classList.remove("hidden");
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
    // Record RTT for connection quality monitoring
    if (lastHeartbeatSendTime > 0) {
      const rttMs = Date.now() - lastHeartbeatSendTime;
      recordRtt(rttMs);
    }
    
    // Reset heartbeat timeout when ACK is received
    if (heartbeatTimeoutId !== null) {
      clearTimeout(heartbeatTimeoutId);
      heartbeatTimeoutId = null;
    }
    if (connectionState !== "connected") {
      setConnectionState("connected");
      // Replay any buffered actions on reconnection
      if (actionBuffer.length > 0) {
        replayBufferedActions();
      }
    }
  });

  joinedRoom.onMessage("bettingRoundStarted", (payload) => {
    log(`Betting round: ${JSON.stringify(payload)}`);
    revealedHands = null;
    allInCardsRevealedByServer = false;
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
        const next = [...previousCommunityCards];
        const targetIndex = idx ?? next.length;
        while (next.length < targetIndex) next.push("");
        next[targetIndex] = card;
        cards = next;
      }

      if (cards.length > 0) {
        allInRevealInProgress = true;
        allInCardsRevealedByServer = true;
        previousCommunityCards = [...cards];
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
    lastTurnId = turnId;
    lastTurnTimeoutMs = timeoutMs;
    startTurnTimer(turnId, timeoutMs, deadlineMs);
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
        lastWinners = pendingWinners ?? [];
        lastWinningHand = pendingWinningHand ?? "";
        winnersStatus.textContent = lastWinners.join(", ") || "-";
        winningHandStatus.textContent = lastWinningHand;
        winningHandChip.textContent = lastWinningHand;
        if (currentSessionId && lastWinners.includes(currentSessionId)) {
          audio.playEffect("win");
        }
        allInRevealInProgress = false;
        pendingWinners = null;
        pendingWinningHand = null;
        previousCommunityCards = [...communityCards];
        if (lastRoomState) renderState(lastRoomState);
      };

      if (allInCardsRevealedByServer) {
        previousCommunityCards = [...communityCards];
        showWinners();
      } else {
        previousCommunityCards = [];
        revealAllInCards(communityCards, showWinners);
      }
    } else {
      previousCommunityCards = [...communityCards];
      if (payload?.winningHand) {
        lastWinningHand = payload.winningHand;
        winningHandStatus.textContent = lastWinningHand;
        winningHandChip.textContent = lastWinningHand;
      }
      if (Array.isArray(payload?.winners)) {
        lastWinners = payload.winners.map((winner: any) => winner.playerId);
        winnersStatus.textContent = lastWinners.join(", ") || "-";
        const winnersKey = lastWinners.join("|");
        previousWinnersKey = winnersKey;
        if (currentSessionId && lastWinners.includes(currentSessionId)) {
          audio.playEffect("win");
        }
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

  // Rebuy system messages
  room.onMessage("bustedOut", (payload: any) => {
    log(`🪦 Te han desplumado! Chips: 0`);
    showRebuyDialog(payload.rebuyCost, payload.timeoutSeconds);
  });

  room.onMessage("seatReserved", (payload: any) => {
    log(`💺 Seat ${payload.seatIndex} reserved. Expires in ${payload.expiresIn}ms`);
  });

  room.onMessage("reservationExpired", (payload: any) => {
    log(`⏰ Seat reservation expired: ${payload.reason}`);
    hideRebuyDialog();
  });

  room.onMessage("rebuySuccess", (payload: any) => {
    log(`✅ Rebuy successful! New chips: ${payload.chips}`);
    hideRebuyDialog();
  });

  room.onMessage("playerBustedOut", (payload: any) => {
    log(`🪦 ${payload.playerName} busted out!`);
  });

  room.onMessage("playerRebuyed", (payload: any) => {
    log(`💰 ${payload.playerName} rebuyed with ${payload.newChips} chips!`);
  });

  room.onStateChange((state) => {
    lastRoomState = state;
    renderState(state);
  });
}

type AvailableRoom = {
  roomId: string;
  clients: number;
  maxClients: number;
  metadata?: Record<string, unknown>;
};

function renderLobbyRooms(rooms: AvailableRoom[]) {
  roomsList.innerHTML = "";
  if (!rooms || rooms.length === 0) {
    const empty = document.createElement("li");
    empty.className = "room-item";
    empty.textContent = "No hay mesas disponibles ahora mismo.";
    roomsList.appendChild(empty);
    return;
  }

  rooms.forEach((r) => {
    const li = document.createElement("li");
    li.className = "room-item";

    const meta = document.createElement("div");
    meta.className = "room-meta";

    const name = document.createElement("strong");
    const tableName = typeof r?.metadata?.name === "string" ? (r.metadata.name as string) : "";
    name.textContent = tableName || `Mesa ${r.roomId.slice(0, 6)}`;

    const sub = document.createElement("small");
    sub.textContent = `${r.clients}/${r.maxClients} jugadores · id ${r.roomId}`;

    meta.appendChild(name);
    meta.appendChild(sub);

    const btn = document.createElement("button");
    btn.className = "accent";
    btn.textContent = "Unirme";
    btn.disabled = r.clients >= r.maxClients;
    btn.addEventListener("click", () => {
      joinRoom(false, { mode: "joinById", roomId: r.roomId }).catch((err) => {
        log(`Join error: ${err?.message || err}`);
      });
    });

    li.appendChild(meta);
    li.appendChild(btn);
    roomsList.appendChild(li);
  });
}

async function refreshLobbyRooms() {
  try {
    setLobbyMessage("Cargando mesas...", "info");
    const client = getWsClient();
    const rooms = (await (client as any).getAvailableRooms("my_room")) as unknown as AvailableRoom[];
    const sorted = [...rooms].sort((a, b) => (b.clients ?? 0) - (a.clients ?? 0));
    renderLobbyRooms(sorted);
    setLobbyMessage("", "info");
  } catch (err: any) {
    setLobbyMessage("No se pudieron cargar las mesas.", "error");
    renderLobbyRooms([]);
    log(`Lobby rooms error: ${err?.message || err}`);
  }
}

function startLobbyPolling() {
  stopLobbyPolling();
  lobbyPollId = window.setInterval(() => {
    refreshLobbyRooms().catch(() => undefined);
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
  await refreshLobbyRooms();
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

refreshRoomsButton.addEventListener("click", () => {
  refreshLobbyRooms().catch(() => undefined);
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
