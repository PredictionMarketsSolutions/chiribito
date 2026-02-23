import { Client, Room } from "colyseus.js";

const API_URL = import.meta.env.VITE_API_URL || "https://chiri-backend.onrender.com";
const WS_URL = import.meta.env.VITE_WS_URL || "wss://chiri-backend-colyseus.onrender.com";

const logEl = document.querySelector<HTMLPreElement>("#log")!;
const authOverlay = document.querySelector<HTMLDivElement>("#auth-overlay")!;
const authMessage = document.querySelector<HTMLDivElement>("#auth-message")!;
const tokenStatus = document.querySelector<HTMLSpanElement>("#token-status")!;
const roomStatus = document.querySelector<HTMLSpanElement>("#room-status")!;
const phaseStatus = document.querySelector<HTMLSpanElement>("#phase-status")!;
const turnStatus = document.querySelector<HTMLSpanElement>("#turn-status")!;
const potStatus = document.querySelector<HTMLSpanElement>("#pot-status")!;
const betStatus = document.querySelector<HTMLSpanElement>("#bet-status")!;
const communityStatus = document.querySelector<HTMLSpanElement>("#community-status")!;
const handStatus = document.querySelector<HTMLSpanElement>("#hand-status")!;
const winningHandStatus = document.querySelector<HTMLSpanElement>("#winning-hand")!;
const winnersStatus = document.querySelector<HTMLSpanElement>("#winners-status")!;
const communityCardsEl = document.querySelector<HTMLDivElement>("#community-cards")!;
const handCardsEl = document.querySelector<HTMLDivElement>("#hand-cards")!;
const potChip = document.querySelector<HTMLSpanElement>("#pot-chip")!;
const phaseChip = document.querySelector<HTMLSpanElement>("#phase-chip")!;
const turnChip = document.querySelector<HTMLSpanElement>("#turn-chip")!;
const turnTimerChip = document.querySelector<HTMLSpanElement>("#turn-timer")!;
const winningHandChip = document.querySelector<HTMLSpanElement>("#winning-hand-chip")!;
const seatsEl = document.querySelector<HTMLDivElement>("#seats")!;
const playersList = document.querySelector<HTMLUListElement>("#players")!;
const handHistoryList = document.querySelector<HTMLUListElement>("#hand-history")!;
const mobileSeatsList = document.querySelector<HTMLUListElement>("#mobile-seats")!;
const apiUrlEl = document.querySelector<HTMLSpanElement>("#api-url")!;
const wsUrlEl = document.querySelector<HTMLSpanElement>("#ws-url")!;
const startGameButton = document.querySelector<HTMLButtonElement>("#start-game")!;
const checkButton = document.querySelector<HTMLButtonElement>("#check")!;
const callButton = document.querySelector<HTMLButtonElement>("#call")!;
const foldButton = document.querySelector<HTMLButtonElement>("#fold")!;
const betButton = document.querySelector<HTMLButtonElement>("#bet")!;
const raiseButton = document.querySelector<HTMLButtonElement>("#raise")!;

const connectionIndicator = document.querySelector<HTMLDivElement>("#connection-indicator")!;
const rttStatus = document.querySelector<HTMLSpanElement>("#rtt-status")!;
const qualityStatus = document.querySelector<HTMLSpanElement>("#quality-status")!;
const bufferStatus = document.querySelector<HTMLSpanElement>("#buffer-status")!;
const yourTurnIndicator = document.querySelector<HTMLDivElement>("#your-turn-indicator")!;;

// Initialize after functions are defined
document.addEventListener("DOMContentLoaded", () => {
  apiUrlEl.textContent = API_URL;
  wsUrlEl.textContent = WS_URL;
  void initPixiLayer();
  setAuthOverlayVisible(true);
  renderHandHistory();
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

document.addEventListener(
  "pointerdown",
  () => {
    if (!audioUnlocked) {
      initAudio();
    }
  },
  { once: true }
);

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

type SoundEffect = "bet" | "call" | "raise" | "check" | "fold" | "allIn" | "win";

const soundProfiles: Record<SoundEffect, {
  frequency: number;
  durationMs: number;
  type: OscillatorType;
  volume: number;
}> = {
  bet: { frequency: 440, durationMs: 120, type: "sine", volume: 0.08 },
  call: { frequency: 520, durationMs: 120, type: "triangle", volume: 0.08 },
  raise: { frequency: 620, durationMs: 160, type: "triangle", volume: 0.1 },
  check: { frequency: 360, durationMs: 90, type: "sine", volume: 0.06 },
  fold: { frequency: 220, durationMs: 140, type: "sawtooth", volume: 0.08 },
  allIn: { frequency: 740, durationMs: 220, type: "square", volume: 0.1 },
  win: { frequency: 880, durationMs: 260, type: "triangle", volume: 0.12 }
};

function initAudio() {
  if (!audioEnabled) return;
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  audioUnlocked = true;
}

function playEffect(effect: SoundEffect) {
  if (!audioEnabled || !audioContext || audioContext.state !== "running") return;
  const profile = soundProfiles[effect];
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = profile.type;
  osc.frequency.value = profile.frequency;
  gain.gain.value = profile.volume;
  osc.connect(gain);
  gain.connect(audioContext.destination);
  const now = audioContext.currentTime;
  osc.start(now);
  osc.stop(now + profile.durationMs / 1000);
}

function playActionSound(action: string) {
  if (!action) return;
  switch (action) {
    case "bet":
      playEffect("bet");
      break;
    case "call":
      playEffect("call");
      break;
    case "raise":
      playEffect("raise");
      break;
    case "check":
      playEffect("check");
      break;
    case "fold":
      playEffect("fold");
      break;
    case "allIn":
      playEffect("allIn");
      break;
    default:
      break;
  }
}

function setAuthOverlayVisible(visible: boolean) {
  authOverlay.classList.toggle("hidden", !visible);
}

function setAuthMessage(message: string, type: "success" | "error" | "info" = "info") {
  authMessage.textContent = message;
  authMessage.classList.toggle("visible", Boolean(message));
  authMessage.classList.toggle("success", type === "success");
  authMessage.classList.toggle("error", type === "error");
}

function mapAuthError(message: string, context: "login" | "register") {
  const normalized = message.toLowerCase();
  if (normalized.includes("failed to fetch") || normalized.includes("networkerror")) {
    return "No se pudo conectar al servidor. Verifica la conexion.";
  }
  if (normalized.includes("missing required fields")) {
    return "Completa todos los campos requeridos.";
  }
  if (normalized.includes("invalid credentials")) {
    return "Correo o contrasena incorrectos.";
  }
  if (normalized.includes("email and password are required")) {
    return "Correo y contrasena son obligatorios.";
  }
  if (normalized.includes("username, email, and password are required")) {
    return "Usuario, correo y contrasena son obligatorios.";
  }
  if (normalized.includes("password must be at least 6")) {
    return "La contrasena debe tener al menos 6 caracteres.";
  }
  if (normalized.includes("user with this email or username already exists")) {
    return "Ese usuario o correo ya existe.";
  }
  if (normalized.includes("internal server error")) {
    return "Error del servidor. Intenta de nuevo.";
  }
  if (context === "login") {
    return "No pudimos iniciar sesion. Verifica tus datos.";
  }
  return "No pudimos registrar la cuenta. Verifica tus datos.";
}

async function request(path: string, body: unknown) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    let maybeJson: unknown = null;
    if (text) {
      try {
        maybeJson = JSON.parse(text);
      } catch (err) {
        maybeJson = null;
      }
    }

    if (!response.ok) {
      if (maybeJson && typeof maybeJson === "object") {
        const record = maybeJson as Record<string, unknown>;
        const apiError = typeof record.error === "string" ? record.error : undefined;
        const apiMessage = typeof record.message === "string" ? record.message : undefined;
        throw new Error(apiError || apiMessage || response.statusText);
      }
      throw new Error(text || response.statusText);
    }

    if (!text) return {};
    if (maybeJson && typeof maybeJson === "object") return maybeJson;
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Respuesta invalida del servidor.");
    }
    throw error;
  }
}

function getFormValues() {
  const username = (document.querySelector("#username") as HTMLInputElement).value.trim();
  const email = (document.querySelector("#email") as HTMLInputElement).value.trim();
  const password = (document.querySelector("#password") as HTMLInputElement).value;
  
  if (!username || !email || !password) {
    const missing = [
      !username ? "username" : "",
      !email ? "email" : "",
      !password ? "password" : ""
    ].filter(Boolean).join(", ");
    throw new Error(`Missing required fields: ${missing}`);
  }
  
  return { username, email, password };
}

function getLoginValues() {
  const email = (document.querySelector("#email") as HTMLInputElement).value.trim();
  const password = (document.querySelector("#password") as HTMLInputElement).value;

  if (!email || !password) {
    const missing = [
      !email ? "email" : "",
      !password ? "password" : ""
    ].filter(Boolean).join(", ");
    throw new Error(`Missing required fields: ${missing}`);
  }

  return { email, password };
}

let token: string | null = null;
let refreshToken: string | null = null;
let room: Room | null = null;
let currentSessionId: string | null = null;
let lastWinningHand = "-";
let lastWinners: string[] = [];
let tokenMonitorId: number | null = null;
let tokenInvalidNotified = false;
let pixiApp: any = null;
let pixiLayer: HTMLDivElement | null = null;
let audioContext: AudioContext | null = null;
let audioUnlocked = false;
let audioEnabled = true;

// Connection monitoring
let connectionState: "disconnected" | "connecting" | "connected" = "disconnected";
let reconnectAttempts = 0;
let heartbeatTimeoutId: number | null = null;
let clientHeartbeatId: number | null = null;
const MAX_RECONNECT_ATTEMPTS = 10;
const HEARTBEAT_INTERVAL_MS = 25000; // 25 seconds (matches server 30s)
const HEARTBEAT_TIMEOUT_MS = 10000; // 10 seconds to receive ack

// Connection metrics (RTT tracking)
let lastHeartbeatSendTime = 0;
const rttSamples: number[] = [];
let averageRtt = 0;
let connectionQuality: "excellent" | "good" | "degraded" | "poor" = "excellent";

// Action buffering for offline resilience
interface BufferedAction {
  action: string;
  data: any;
  timestamp: number;
}
const actionBuffer: BufferedAction[] = [];
const ACTION_BUFFER_MAX_SIZE = 50;
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
const handHistory: HandHistoryEntry[] = [];
const MAX_HAND_HISTORY = 20;
let handHistoryCounter = 0;
const latestPlayerNames = new Map<string, string>();


const TURN_TIMEOUT_MS = 30000;

type PlayerState = {
  sessionId: string;
  name: string;
  chips: number;
  currentBet: number;
  isFolded: boolean;
  seatIndex: number;
  hand?: string[];
};

type RoomState = {
  users?: Map<string, PlayerState> | Record<string, PlayerState>;
  dealerIndex?: number;
  currentTurn?: string;
  phase?: string;
  pot?: number;
  currentBet?: number;
  roundStarted?: boolean;
  communityCards?: string[];
};

type HandHistoryWinner = {
  playerId: string;
  amount?: number;
};

type HandHistoryEntry = {
  id: number;
  timestamp: number;
  winners: HandHistoryWinner[];
  winningHand: string;
  communityCards: string[];
  pot: number;
  yourHand?: string[];
};

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

function formatWinnerLabel(winner: HandHistoryWinner) {
  const name = latestPlayerNames.get(winner.playerId) ?? winner.playerId;
  if (typeof winner.amount === "number") {
    return `${name} (+${winner.amount})`;
  }
  return name;
}

function renderHandHistory() {
  handHistoryList.innerHTML = "";
  if (handHistory.length === 0) {
    const emptyEl = document.createElement("li");
    emptyEl.classList.add("history-empty");
    emptyEl.textContent = "No hands yet.";
    handHistoryList.appendChild(emptyEl);
    return;
  }

  handHistory.forEach((entry) => {
    const itemEl = document.createElement("li");
    itemEl.classList.add("history-item");

    const headerEl = document.createElement("div");
    headerEl.classList.add("history-header");

    const timeEl = document.createElement("span");
    timeEl.classList.add("history-time");
    timeEl.textContent = new Date(entry.timestamp).toLocaleTimeString();

    const winnersEl = document.createElement("span");
    winnersEl.classList.add("history-winners");
    winnersEl.textContent = entry.winners.length
      ? `Winners: ${entry.winners.map(formatWinnerLabel).join(", ")}`
      : "Winners: -";

    const potEl = document.createElement("span");
    potEl.classList.add("history-pot");
    potEl.textContent = `Pot: ${entry.pot}`;

    headerEl.appendChild(timeEl);
    headerEl.appendChild(winnersEl);
    headerEl.appendChild(potEl);

    const bodyEl = document.createElement("div");
    bodyEl.classList.add("history-body");

    const handEl = document.createElement("div");
    handEl.textContent = `Winning hand: ${entry.winningHand || "-"}`;
    bodyEl.appendChild(handEl);

    const communityEl = document.createElement("div");
    communityEl.textContent = entry.communityCards.length
      ? `Community: ${entry.communityCards.join(" ")}`
      : "Community: -";
    bodyEl.appendChild(communityEl);

    if (entry.yourHand && entry.yourHand.length) {
      const yourHandEl = document.createElement("div");
      yourHandEl.textContent = `Your hand: ${entry.yourHand.join(" ")}`;
      bodyEl.appendChild(yourHandEl);
    }

    itemEl.appendChild(headerEl);
    itemEl.appendChild(bodyEl);
    handHistoryList.appendChild(itemEl);
  });
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

function resetRoomUi(message?: string) {
  room = null;
  currentSessionId = null;
  lastWinningHand = "-";
  lastWinners = [];
  revealedHands = null;
  previousPotValue = null;
  previousCurrentBetValue = null;
  previousWinnersKey = "";
  handHistory.length = 0;
  renderHandHistory();
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
        localStorage.setItem('refreshToken', refreshToken);
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

function preloadCardImages() {
  const suits = ["O", "C", "E", "B"];
  const ranks = ["1", "7", "8", "9", "10", "11", "12"];
  const sources = ["/cards/back_logo.png"];

  suits.forEach(suit => {
    ranks.forEach(rank => {
      sources.push(`/cards/${suit}_${rank}.jpg`);
    });
  });

  sources.forEach(src => {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  });
}

function createCardElement(card: string | undefined) {
  const el = document.createElement("div");
  el.classList.add("card");

  const img = document.createElement("img");
  img.alt = card ? `Carta ${card}` : "Carta oculta";
  img.decoding = "async";
  img.loading = "eager";

  if (!card) {
    el.classList.add("card-back");
    img.src = "/cards/back_logo.png";
    img.addEventListener("load", () => el.classList.add("has-image"));
    img.addEventListener("error", () => {
      el.classList.add("back");
      el.innerHTML = "<span class=\"rank\">?</span><span class=\"suit\">?</span>";
    });
    el.appendChild(img);
    return el;
  }

  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  img.src = `/cards/${suit}_${rank}.jpg`;
  img.addEventListener("load", () => el.classList.add("has-image"));
  img.addEventListener("error", () => {
    const suitMap: Record<string, { symbol: string; color: string }> = {
      O: { symbol: "◆", color: "red" },
      C: { symbol: "♥", color: "red" },
      E: { symbol: "♠", color: "black" },
      B: { symbol: "♣", color: "black" }
    };

    const rankMap: Record<string, string> = {
      "1": "1",
      "10": "S",
      "11": "C",
      "12": "R"
    };

    const suitInfo = suitMap[suit] ?? { symbol: suit, color: "black" };
    el.classList.add(suitInfo.color);
    const displayRank = rankMap[rank] ?? rank;
    el.innerHTML = `<span class="rank">${displayRank}</span><span class="suit">${suitInfo.symbol}</span>`;
  });
  el.appendChild(img);
  return el;
}

function renderCardRow(el: HTMLElement, cards: string[], slots: number) {
  el.innerHTML = "";
  for (let i = 0; i < slots; i += 1) {
    const card = cards[i];
    const cardEl = createCardElement(card);
    el.appendChild(cardEl);
  }
}

function cardsEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
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
    seat.classList.toggle("active", true);
    seat.classList.toggle("you", Boolean(isYou));
    seat.classList.toggle("folded", Boolean(player.isFolded));
    seat.classList.toggle("dealer", player.seatIndex === dealerIndex);
    seat.classList.toggle("turn", player.sessionId === currentTurn);
    seat.classList.toggle("winner", lastWinners.includes(player.sessionId));
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
  const community = state.communityCards ? Array.from(state.communityCards) : [];
  communityStatus.textContent = community.length ? community.join(" ") : "-";
  if (!cardsEqual(community, previousCommunityCards)) {
    renderCardRow(communityCardsEl, community, 5);
    animateCardDeals(communityCardsEl, community, previousCommunityCards);
    previousCommunityCards = [...community];
  }
  if (currentSessionId) {
    const me = entries.find((player: any) => player.sessionId === currentSessionId);
    const hand = me?.hand ? Array.from(me.hand) : [];
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
  updateActionButtons(state);
}

function updateActionButtons(state: RoomState | null) {
  if (!state || !currentSessionId) {
    setActionButtonsEnabled(false, false, false, false, false, false);
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
  const canBet = canAct && currentBet === 0 && myChips > 0;
  const canRaise = canAct && currentBet > 0 && myChips > 0;

  const canStart = Boolean(currentSessionId) && !state.roundStarted;

  setActionButtonsEnabled(
    canStart,
    canCheck,
    canCall,
    canFold,
    canBet,
    canRaise
  );
}

function setActionButtonsEnabled(
  canStart: boolean,
  canCheck: boolean,
  canCall: boolean,
  canFold: boolean,
  canBet: boolean,
  canRaise: boolean
) {
  startGameButton.disabled = !canStart;
  checkButton.disabled = !canCheck;
  callButton.disabled = !canCall;
  foldButton.disabled = !canFold;
  betButton.disabled = !canBet;
  raiseButton.disabled = !canRaise;
}

async function register() {
  const { username, email, password } = getFormValues();
  log("Registering...");
  setAuthMessage("Creando cuenta...", "info");
  const data = await request("/api/auth/register", { username, email, password });
  token = data.token;
  refreshToken = data.refreshToken;
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
  tokenStatus.textContent = token ? "set" : "none";
  tokenInvalidNotified = false;
  startTokenMonitor();
  log("Registered and token received.");
  setAuthMessage("Registro correcto. Puedes unirte a la mesa.", "success");
}

async function login() {
  const { email, password } = getLoginValues();
  log("Logging in...");
  setAuthMessage("Verificando credenciales...", "info");
  const data = await request("/api/auth/login", { email, password });
  token = data.token;
  refreshToken = data.refreshToken;
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
  tokenStatus.textContent = token ? "set" : "none";
  tokenInvalidNotified = false;
  startTokenMonitor();
  log("Logged in and token received.");
  setAuthMessage("Login correcto. Puedes unirte a la mesa.", "success");
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
    connectionIndicator.title = `Connecting (attempt ${reconnectAttempts}/10)`;
  } else {
    connectionIndicator.style.backgroundColor = "#ff4444";
    connectionIndicator.title = "Disconnected";
  }
}

/**
 * Rate limiting to prevent action spam attacks
 */
const actionCooldowns = new Map<string, number>();
const ACTION_COOLDOWN_MS = 200; // 200ms between actions of same type

function requireCooldown(action: string): boolean {
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

async function joinRoom(forceReplace = false) {
  if (!token) {
    log("No token. Login or register first.");
    setConnectionState("disconnected");
    return;
  }

  const { username } = getFormValues();
  setConnectionState("connecting");
  log("Connecting to Colyseus...");

  const client = new Client(WS_URL);
  
  let joinedRoom: Room;
  try {
    joinedRoom = await client.joinOrCreate("my_room", {
      auth: { token },
      name: username,
      forceReplace
    });
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
    log(`Join error: ${message}`);
    setConnectionState("disconnected");
    return;
  }

  room = joinedRoom;
  currentSessionId = joinedRoom.sessionId;
  setAuthOverlayVisible(false);
  setConnectionState("connected");
  reconnectAttempts = 0;
  lastWinningHand = "-";
  lastWinners = [];
  winningHandStatus.textContent = lastWinningHand;
  winningHandChip.textContent = lastWinningHand;
  winnersStatus.textContent = "-";
  handHistory.length = 0;
  renderHandHistory();
  preloadCardImages();
  const roomId = (joinedRoom as { id?: string; roomId?: string }).id
    ?? (joinedRoom as { roomId?: string }).roomId
    ?? "joined";
  roomStatus.textContent = roomId;
  log("Joined room successfully.");
  
  // Start client-side heartbeat to monitor connection
  startClientHeartbeat();

  joinedRoom.onLeave((code) => {
    stopClientHeartbeat();
    
    if (code === 4001) {
      alert("Tu sesion fue reemplazada por otro ingreso.");
      clearAuthToken();
      resetRoomUi("replaced");
      setConnectionState("disconnected");
      return;
    }
    
    // Unexpected disconnect - attempt to reconnect
    log(`Disconnected from room (code: ${code}). Attempting to reconnect...`);
    setConnectionState("disconnected");
    attemptReconnect();
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
    showNotification(`${payload.playerName} se ha desconectado${payload.wasCurrentTurn ? ' (era su turno)' : ''}`, 'warning');
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
  });

  joinedRoom.onMessage("playerAction", (payload) => {
    log(`Player action: ${JSON.stringify(payload)}`);
    if (payload?.action && typeof payload.action === "string") {
      playActionSound(payload.action);
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
    const communityCards = Array.isArray(payload?.communityCards)
      ? payload.communityCards
      : [];
    const yourHand = currentSessionId && payload?.playerHands?.[currentSessionId]
      ? payload.playerHands[currentSessionId]
      : undefined;

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
        playEffect("win");
      }
    }
    if (payload?.playerHands && typeof payload.playerHands === "object") {
      revealedHands = payload.playerHands as Record<string, string[]>;
    }
    const historyEntry: HandHistoryEntry = {
      id: ++handHistoryCounter,
      timestamp: Date.now(),
      winners: winnersForHistory,
      winningHand: payload?.winningHand ?? "-",
      communityCards,
      pot: potValue,
      yourHand
    };
    handHistory.unshift(historyEntry);
    if (handHistory.length > MAX_HAND_HISTORY) {
      handHistory.length = MAX_HAND_HISTORY;
    }
    renderHandHistory();
    log(`Round ended: ${JSON.stringify(payload)}`);
  });

  room.onMessage("error", (payload) => {
    log(`Server error: ${JSON.stringify(payload)}`);
  });

  room.onStateChange((state) => {
    renderState(state);
  });
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
  joinRoom().catch((err) => log(`Join error: ${err.message || err}`));
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
