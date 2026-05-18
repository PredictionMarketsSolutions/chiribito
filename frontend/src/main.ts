import { Client, Room } from "@colyseus/sdk";

import { API_URL, WS_URL, TURN_TIMEOUT_MS, MAX_HAND_HISTORY, ACTION_BUFFER_MAX_SIZE } from "./config";
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
  getUsernameFromInput,
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
  DEFAULT_MAX_RECONNECT_ATTEMPTS,
} from "./connection";
import { createReconnectDirector } from "./reconnect-director";
import { createReconnectBanner } from "./app/reconnect-banner";
import {
  addHandHistoryEntry,
  clearHandHistory,
  renderHandHistory
} from "./hand-history";
import { renderCardRow, preloadCardImages } from "./ui-cards";
import { installFeedback } from "./feedback";
import { attemptTokenRefresh } from "./auth/token-refresh";
import { recoverMesaOrOpenLobby } from "./auth/recover-or-lobby";
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
import { TableScene } from "./game/table/TableScene";
import { getWinnerDisplayFromRoundEnd } from "./game/round-end-winner";
import { refreshWinnersRanking as refreshWinnersRankingFn } from "./app/winners-ranking";
import { createLobbyPollingController } from "./app/lobby-polling";
import { bindGameActionButtons } from "./app/game-action-bindings";
import { bindForgotPasswordUi } from "./app/forgot-password-ui";
import { openLobbyFlow } from "./app/lobby-controller";
import { bindAuthEntryButtons } from "./app/auth-entry-bindings";
import { createRoomSessionController } from "./app/room-session-controller";
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
import { setupCardPopover } from "./app/card-popover";
import { registerFlow, loginFlow, guestFlow } from "./app/auth-flows";
import { clearAuthSession, handleTokenInvalidated as handleTokenInvalidatedFn, startTokenMonitor as startTokenMonitorApp } from "./app/auth-session";
import { resetRoomUi as resetRoomUiFn } from "./app/room-ui-reset";
import { registerGlobalLifecycle } from "./app/global-lifecycle";

// Security modules
import {
  initFrontendSecurity,
  SecureStorage,
  ApiClient,
  validateEmail,
  validatePassword,
  validateUsername,
  stateGuard,
  isDebugEnabled
} from "./security";

if (isDebugEnabled()) {
  document.body.classList.add("debug-mode");
}

// Install audio + motion feedback observers (auto-trigger sounds on UI state changes)
installFeedback();

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
const phaseProgress = dom.phaseProgress; // optional — fallback handled in renderer
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
const reconnectBannerEl = document.getElementById("reconnect-banner") as HTMLElement;
const reconnectBannerTextEl = reconnectBannerEl.querySelector(".reconnect-banner__text") as HTMLElement;
const reconnectBanner = createReconnectBanner({
  bannerEl: reconnectBannerEl,
  textEl: reconnectBannerTextEl,
  maxAttempts: 6,
});
const rttStatus = dom.rttStatus!;
const qualityStatus = dom.qualityStatus!;
const bufferStatus = dom.bufferStatus!;
const yourTurnIndicator = dom.yourTurnIndicator!;
const cardPopover = dom.cardPopover;
const cardPopoverCards = dom.cardPopoverCards;

// Only attempt reconnect on visibility when we were actually in a room before backgrounding.
// Otherwise login-only users would get auto-joined to a table when tab/focus changes.
let hadRoomWhenBackgrounded = false;

function log(message: string) {
  const ts = new Date().toLocaleTimeString();
  logEl.textContent = `[${ts}] ${message}\n` + logEl.textContent;
}

registerGlobalLifecycle({
  apiUrlEl,
  wsUrlEl,
  apiUrl: API_URL,
  wsUrl: WS_URL,
  initPixiLayer,
  setAuthOverlayVisible,
  renderHandHistoryUi,
  setupCardPopover: () => setupCardPopover({ seatsEl, cardPopover, cardPopoverCards }),
  setAuthMessage,
  log,
  isAudioUnlocked: () => audio.isUnlocked(),
  initAudio: () => audio.init(),
  getConnectionState: () => connectionState,
  hasRoom: () => room !== null,
  hasToken: () => Boolean(token),
  getHadRoomWhenBackgrounded: () => hadRoomWhenBackgrounded,
  setHadRoomWhenBackgrounded: (value) => {
    hadRoomWhenBackgrounded = value;
  },
  stopClientHeartbeat,
  startClientHeartbeat,
  attemptReconnect,
});

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
// Move 2 — E2E hook: expose currentSessionId for the WS-drop Playwright step
// to assert the seat actually survived the reconnect. Read-only getter, no
// production behaviour change.
(window as any).__chiri = (window as any).__chiri ?? {};
Object.defineProperty((window as any).__chiri, "currentSessionId", {
  get: () => currentSessionId,
  configurable: true,
});
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
// Move 2: Lazy director init — bound after roomSessionController is built so
// it can call roomSessionController.reconnect(token). attemptReconnect()
// no-ops gracefully until the director is ready (rare race during boot).
let reconnectDirector: ReturnType<typeof createReconnectDirector> | null = null;
// Move 2: tightened to detect silent network drops (mobile network switch,
// laptop sleep+wake, tab-bg with no clean close) within ~15s worst case
// (one interval + one timeout). Leaves >=45s of the 60s server seat window
// for retries. Previously 30000 / 180000 which let ~3min pass before any
// reconnect action could be taken.
const HEARTBEAT_INTERVAL_MS = 5000;
const HEARTBEAT_TIMEOUT_MS = 10000;
let lastHeartbeatSendTime = 0;

let pixiTableSurface: HTMLDivElement | null = null;
let pixiLib: any = null;
let tableSceneRef: TableScene | null = null;
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
  previousPhase: null,
  allInRevealInProgress: false,
  latestPlayerNames: new Map<string, string>(),
  tableScene: null,
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
    yourBetStatus: dom.yourBetStatus,
    yourChipsStatus: dom.yourChipsStatus,
    potChip: potChip,
    phaseChip: phaseChip,
    phaseProgress: phaseProgress,
    turnChip: turnChip,
    turnReason: dom.turnReason,
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

function armTableScene(): void {
  if (!tableSceneRef) return;
  tableSceneRef.setActive(true);
  gameUiContext.tableScene = tableSceneRef;
}

function disarmTableScene(): void {
  tableSceneRef?.setActive(false);
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

  const seatsRoot = dom.seatsEl;
  if (seatsRoot && pixiApp) {
    tableSceneRef = new TableScene({
      app: pixiApp as import("pixi.js").Application,
      surfaceEl: pixiTableSurface,
      seatsEl: seatsRoot,
    });
    pixiTableSurface.classList.add("table-surface--pixi-cards");
    if (room) {
      armTableScene();
    }
  }

  window.addEventListener("resize", () => {
    if (!pixiApp || !pixiTableSurface) return;
    pixiApp.renderer.resize(pixiTableSurface.clientWidth, pixiTableSurface.clientHeight);
  });
}

function revealAllInCards(cards: string[], onComplete?: () => void) {
  if (allInAnimationTimeoutId !== null) {
    window.clearTimeout(allInAnimationTimeoutId);
    allInAnimationTimeoutId = null;
  }
  gameUiContext.tableScene?.cancelAllInReveal();

  allInCardIndex = 0;
  allInRevealStarted = true;
  allInRevealInProgress = true;

  const ts = gameUiContext.tableScene;
  if (ts?.isActive()) {
    ts.revealAllInSequential(cards, () => {
      allInRevealStarted = false;
      allInRevealInProgress = false;
      onComplete?.();
    });
    return;
  }

  const revealNext = () => {
    if (allInCardIndex < cards.length) {
      const cardsToShow = cards.slice(0, allInCardIndex + 1);
      renderCardRow(communityCardsEl, cardsToShow, 5);
      allInCardIndex++;
      allInAnimationTimeoutId = window.setTimeout(revealNext, 2000);
      return;
    }

    allInRevealStarted = false;
    allInRevealInProgress = false;
    allInAnimationTimeoutId = null;
    onComplete?.();
  };

  revealNext();
}

function resetRoomUi(message?: string) {
  resetRoomUiFn(
    {
      getRoom: () => room,
      disconnectRoom,
      setRoom: (value) => {
        room = value;
      },
      setCurrentSessionId: (sessionId) => {
        currentSessionId = sessionId;
        gameUiContext.currentSessionId = sessionId;
      },
      clearWinnerDisplay,
      winnerDisplayState,
      clearDeferredTournamentTimer: () => {
        deferredTournamentResult = null;
        if (deferredTournamentTimerId !== null) {
          clearTimeout(deferredTournamentTimerId);
          deferredTournamentTimerId = null;
        }
      },
      setRevealedHands: (hands) => {
        revealedHands = hands;
      },
      gameUiContext,
      resetPreviousWinnersKey: () => {
        previousWinnersKey = "";
      },
      resetAllInState: () => {
        allInRevealStarted = false;
        allInRevealInProgress = false;
        allInCardsRevealedByServer = false;
        pendingWinners = null;
        pendingWinningHand = null;
      },
      clearAllInAnimationTimeout: () => {
        if (allInAnimationTimeoutId !== null) {
          window.clearTimeout(allInAnimationTimeoutId);
          allInAnimationTimeoutId = null;
        }
      },
      clearHandHistory,
      renderHandHistoryUi,
      setAuthOverlayVisible,
      setAuthMessage,
      roomStatusEl: roomStatus,
      phaseStatusEl: phaseStatus,
      turnStatusEl: turnStatus,
      stopTurnTimer: stopTurnTimerFn,
      turnTimerState,
      turnTimerChipEl: turnTimerChip,
      potStatusEl: potStatus,
      betStatusEl: betStatus,
      communityStatusEl: communityStatus,
      handStatusEl: handStatus,
      winningHandStatusEl: winningHandStatus,
      winnersStatusEl: winnersStatus,
      potChipEl: potChip,
      phaseChipEl: phaseChip,
      turnChipEl: turnChip,
      winningHandChipEl: winningHandChip,
      renderCardRow,
      communityCardsEl,
      handCardsEl,
      playersListEl: playersList,
      syncGameUiContext,
      renderSeats: () => {
        renderSeatsFn({ users: new Map(), dealerIndex: -1, currentTurn: "" }, getGameUiRefs(), gameUiContext);
      },
      setActionButtonsEnabled: (flags) => {
        setActionButtonsEnabledFn(getGameUiRefs(), flags);
      },
      disarmTableScene,
    },
    message
  );
}

function updateTurnTimer(state: RoomState) {
  const turnId = state.currentTurn ?? "";
  const roundActive = Boolean(state.roundStarted);
  updateTurnTimerFn(turnTimerState, turnId, roundActive, turnTimerChip, TURN_TIMEOUT_MS);
}

function clearAuthToken() {
  clearAuthSession({
    setToken: (value) => {
      token = value;
    },
    setRefreshToken: (value) => {
      refreshToken = value;
    },
    setShouldAutoReconnect: (value) => {
      shouldAutoReconnect = value;
    },
    tokenStatusEl: tokenStatus,
    setTokenInvalidNotified: (value) => {
      tokenInvalidNotified = value;
    },
    clearAccessToken: () => SecureStorage.clearAccessToken(),
    clearRefreshToken: () => SecureStorage.clearRefreshToken(),
    clearReconnectionToken: () => SecureStorage.clearReconnectionToken(),
  });
}

function handleTokenInvalidated() {
  handleTokenInvalidatedFn({
    getTokenInvalidNotified: () => tokenInvalidNotified,
    setTokenInvalidNotified: (value) => {
      tokenInvalidNotified = value;
    },
    clearAuthSession: clearAuthToken,
    resetRoomUi,
    alertUser: (message) => alert(message),
  });
}

function startTokenMonitor() {
  startTokenMonitorApp({
    apiUrl: API_URL,
    getRefreshToken: () => refreshToken,
    onSuccess: (tokenValue, refreshTokenValue) => {
      token = tokenValue;
      refreshToken = refreshTokenValue;
      SecureStorage.saveAccessToken(tokenValue);
      SecureStorage.saveRefreshToken(refreshTokenValue);
      tokenStatus.textContent = "refreshed";
    },
    onInvalidated: () => handleTokenInvalidated(),
    log,
  });
}

function renderState(state: RoomState) {
  syncGameUiContext();
  renderStateFn(state, getGameUiRefs(), gameUiContext, updateTurnTimer);
}

async function register() {
  await registerFlow({
    getFormValues,
    validateEmail,
    validatePassword,
    validateUsername,
    setAuthMessage,
    log,
    request,
    mapAuthError,
    persistTokens: (nextToken, nextRefreshToken) => {
      token = nextToken;
      refreshToken = nextRefreshToken;
      if (refreshToken) SecureStorage.saveRefreshToken(refreshToken);
      if (token) SecureStorage.saveAccessToken(token);
      tokenStatus.textContent = token ? "set" : "none";
    },
    onAuthSuccess: () => {
      tokenInvalidNotified = false;
      startTokenMonitor();
      // Take the user straight to the lobby instead of leaving them stuck on
      // the auth screen with a "puedes unirte a la mesa" toast and no obvious
      // next step. This was the silent fail surfaced by the browser E2E.
      openLobby().catch((err) => log(`Open lobby after register failed: ${err}`));
    },
  });
}

async function joinAsGuest() {
  await guestFlow({
    generateCredentials: () => {
      const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
      const username = `invitado_${suffix}`;
      const email = `${username}@chiribito.guest`;
      const password = crypto.randomUUID();
      return { username, email, password };
    },
    setAuthMessage,
    log,
    request,
    mapAuthError,
    persistTokens: (nextToken, nextRefreshToken) => {
      token = nextToken;
      refreshToken = nextRefreshToken;
      if (refreshToken) SecureStorage.saveRefreshToken(refreshToken);
      if (token) SecureStorage.saveAccessToken(token);
      tokenStatus.textContent = token ? "set" : "none";
    },
    onAuthSuccess: () => {
      tokenInvalidNotified = false;
      startTokenMonitor();
      openLobby().catch((err) => log(`Open lobby after guest entry failed: ${err}`));
    },
  });
}

async function login() {
  await loginFlow({
    getLoginValues,
    validateEmail,
    validatePassword,
    setAuthMessage,
    log,
    request,
    mapAuthError,
    persistTokens: (nextToken, nextRefreshToken) => {
      token = nextToken;
      refreshToken = nextRefreshToken;
      if (refreshToken) SecureStorage.saveRefreshToken(refreshToken);
      if (token) SecureStorage.saveAccessToken(token);
      tokenStatus.textContent = token ? "set" : "none";
    },
    onAuthSuccess: () => {
      tokenInvalidNotified = false;
      startTokenMonitor();
      // Single recovery decision — same primitive the reload hydration uses.
      // The previous design called openLobby() here and ran a separate
      // runAutoRejoin afterwards; openLobbyFlow().onEnterLobby() cleared
      // lastRoomId synchronously, so the rejoin always read null. Routing
      // through recoverMesaOrOpenLobby keeps the reconnect → joinById →
      // lobby chain intact and avoids the auth-flash before recovery.
      setAuthOverlayVisible(false);
      recoverMesaOrOpenLobby(buildRecoveryDeps()).catch((err) =>
        log(`Login recovery error: ${err?.message ?? err}`),
      );
    },
  });
}

function startClientHeartbeat() {
  if (!room) return;
  startClientHeartbeatFn(room, {
    intervalMs: HEARTBEAT_INTERVAL_MS,
    timeoutMs: HEARTBEAT_TIMEOUT_MS,
    log,
    onTimeout: () => {
      // Move 2: heartbeat timeout now means "the WebSocket is silent" — not
      // "the user is idle". The previous behaviour conflated the two by
      // showing an idle modal after 3 minutes of silence. Now the timeout
      // fires within ~15s of a real drop and triggers reconnect immediately,
      // setting state to disconnected BEFORE attemptReconnect so the banner
      // sees a consistent state.
      log("[HEARTBEAT] No ACK received — assuming WebSocket drop, requesting reconnect.");
      setConnectionState("disconnected");
      attemptReconnect();
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
    maxAttempts: DEFAULT_MAX_RECONNECT_ATTEMPTS,
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
  if (!reconnectDirector) {
    log("Reconnect director not yet initialised; skipping retry.");
    return;
  }
  return reconnectDirector.requestReconnect();
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

const roomSessionController = createRoomSessionController({
  getToken: () => token, getJoinInProgress: () => joinInProgress,
  setJoinInProgress: (v) => { joinInProgress = v; }, setLobbyJoinButtonsEnabled,
  setJoinByIdEnabled: (e) => { joinByIdButton.disabled = !e; }, setCreateTableEnabled: (e) => { createTableButton.disabled = !e; },
  createTableCooldownMs: CREATE_TABLE_COOLDOWN_MS, setConnectionState, log,
  getWsClient,
  // roomSessionController only needs the in-form username (used as Colyseus
  // display name). On reload-recovery the form input is empty, so we read it
  // non-throwing here instead of the auth-helpers getFormValues (which throws
  // when register fields are missing — appropriate for registerFlow only).
  getFormValues: () => ({ username: getUsernameFromInput() }),
  setAuthOverlayVisible, setLobbyOverlayVisible, setTournamentResultVisible, setAuthMessage, setLobbyMessage, handleTokenInvalidated,
  setRoom: (v) => { room = v; }, setCurrentSessionId: (id) => { currentSessionId = id; gameUiContext.currentSessionId = id; },
  setShouldAutoReconnect: (v) => { shouldAutoReconnect = v; }, setTournamentEnded: (v) => { tournamentEnded = v; }, getTournamentEnded: () => tournamentEnded,
  setHadRoomWhenBackgrounded: (v) => { hadRoomWhenBackgrounded = v; }, setReconnectAttempts: (n) => { reconnectAttempts = n; },
  clearCurrentRoomRefs: () => { room = null; currentSessionId = null; gameUiContext.currentSessionId = null; },
  stopClientHeartbeat, startClientHeartbeat, attemptReconnect, clearAuthToken, resetRoomUi,
  stopLobbyPolling: () => lobbyPolling.stop(),
  showGameEndMessage: () => showGameEndMessageFn(overlayRefs),
  isTournamentResultOverlayHidden: () => overlayRefs.tournamentResultOverlay.classList.contains("hidden"),
  clearLastRoomId: () => SecureStorage.clearLastRoomId(),
  clearReconnectionToken: () => SecureStorage.clearReconnectionToken(),
  winnerDisplayState, gameUiContext,
  renderState, isWinnerPhaseActive: () => isInWinnerPhase(winnerDisplayState),
  startWinnerDisplayPhase, showTournamentResult,
  winningHandStatusEl: winningHandStatus, winningHandChipEl: winningHandChip, winnersStatusEl: winnersStatus,
  roomStatusEl: roomStatus, communityStatusEl: communityStatus, potStatusEl: potStatus, communityCardsEl: communityCardsEl, turnTimerChipEl: turnTimerChip,
  schemaArrayToCards, renderCardRow, preloadCardImages,
  clearHandHistory, renderHandHistoryUi, addHandHistoryEntry,
  saveLastRoomId: (id) => { SecureStorage.saveLastRoomId(id); },
  saveReconnectionToken: (token) => { SecureStorage.saveReconnectionToken(token); },
  showWinnerBanner, revealAllInCards,
  getLastHeartbeatSendTime: () => lastHeartbeatSendTime,
  recordRtt, clearHeartbeatTimeout: clearHeartbeatTimeoutFn,
  getConnectionState: () => connectionState, replayBufferedActions,
  getDeferredTournamentResult: () => deferredTournamentResult, setDeferredTournamentResult: (v) => { deferredTournamentResult = v; },
  getDeferredTournamentTimerId: () => deferredTournamentTimerId, setDeferredTournamentTimerId: (id) => { deferredTournamentTimerId = id; },
  setRevealedHands: (h) => { revealedHands = h; },
  getAllInCardsRevealedByServer: () => allInCardsRevealedByServer, setAllInCardsRevealedByServer: (v) => { allInCardsRevealedByServer = v; },
  setAllInRevealInProgress: (v) => { allInRevealInProgress = v; },
  getPendingWinners: () => pendingWinners, setPendingWinners: (v) => { pendingWinners = v; },
  getPendingWinningHand: () => pendingWinningHand, setPendingWinningHand: (v) => { pendingWinningHand = v; },
  setPreviousWinnersKey: (k) => { previousWinnersKey = k; },
  getLastRoomState: () => lastRoomState, setLastRoomState: (s) => { lastRoomState = s; },
  startTurnTimer: (turnId, timeoutMs, deadlineMs) => startTurnTimerFn(turnTimerState, turnId, timeoutMs, turnTimerChip, deadlineMs),
  playActionSound: (a) => audio.playActionSound(a),
  playWinEffect: () => audio.playEffect("win"),
  runTableRoundEndAnimation: (done) => {
    const ts = gameUiContext.tableScene;
    if (ts?.isActive()) {
      ts.playRoundEndCollectThen(done);
    } else {
      done();
    }
  },
  syncTableCommunityCards: (cards) => {
    gameUiContext.tableScene?.syncCommunityFromServer(cards);
  },
  armTableScene,
});

// Move 2 — wire the reconnect director now that roomSessionController exists.
// attemptReconnect() above delegates to this director.
reconnectDirector = createReconnectDirector({
  getToken: () => token,
  getConnectionState: () => connectionState,
  getTournamentEnded: () => tournamentEnded,
  joinRoom: (forceReplace) => joinRoom(forceReplace),
  clearAuthToken,
  log,
  getReconnectionToken: () => SecureStorage.getReconnectionToken(),
  clearReconnectionToken: () => SecureStorage.clearReconnectionToken(),
  reconnect: (tok) => roomSessionController.reconnect(tok),
  degradeToLobby: (message: string) => {
    setLobbyMessage(message, "error");
    resetRoomUi(message);
    setLobbyOverlayVisible(true);
    setConnectionState("disconnected");
  },
  onAttemptChange: (state) => {
    // Keep the connection-indicator tooltip in sync with director attempts...
    reconnectAttempts = state.attempt;
    // ...and drive the discreet reconnect banner from the same signal.
    reconnectBanner.apply(state);
  },
});

async function joinRoom(
  forceReplace = false,
  opts?: { mode?: JoinMode; roomId?: string; tableName?: string }
) {
  await roomSessionController.joinRoom(forceReplace, opts);
}

async function reconnectMesa(token: string): Promise<void> {
  await roomSessionController.reconnect(token);
}

/** Single source of truth for the recovery decision deps. Used by:
 *    - hydration IIFE on page load
 *    - post-login onAuthSuccess
 *  Both paths must use the same deps so the reconnect → joinById → lobby
 *  chain behaves identically regardless of entry point. */
function buildRecoveryDeps() {
  return {
    getReconnectionToken: () => SecureStorage.getReconnectionToken(),
    clearReconnectionToken: () => SecureStorage.clearReconnectionToken(),
    reconnect: (token: string) => reconnectMesa(token),
    getLastRoomId: () => SecureStorage.getLastRoomId(),
    joinRoom: (forceReplace: boolean, opts: { mode: "joinById"; roomId: string }) =>
      joinRoom(forceReplace, opts),
    isJoined: () => room !== null,
    openLobby,
    clearLastRoomId: () => SecureStorage.clearLastRoomId(),
    log,
  };
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
      SecureStorage.clearReconnectionToken();
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
  joinAsGuest,
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

// ─────────────────────────────────────────────────────────────────────────────
// Session hydration on startup
// Restore tokens from SecureStorage so a page reload does not bounce the user
// back to the auth screen. Once tokens are restored, recoverMesaOrOpenLobby
// centralises the "do we rejoin a previous mesa, or just open lobby?" decision
// so we never go through openLobby() — which clears lastRoomId via
// onEnterLobby() — before the rejoin attempt can read it.
//   1. If we have an access token → restore + recover (rejoin mesa OR lobby)
//   2. Else if we have a refresh token → try refresh + recover
//   3. Else → leave auth visible (default state from HTML)
// ─────────────────────────────────────────────────────────────────────────────
(() => {
  const savedAccess = SecureStorage.getAccessToken();
  const savedRefresh = SecureStorage.getRefreshToken();

  if (savedAccess) {
    token = savedAccess;
    refreshToken = savedRefresh;
    tokenStatus.textContent = "set";
    tokenInvalidNotified = false;
    startTokenMonitor();
    log("Session restored from sessionStorage");
    // Pre-hide auth so the user does not see an auth-overlay flash while the
    // recovery join attempt is in flight; the helper will then reveal either
    // the mesa (on rejoin success) or the lobby (clean fallback).
    setAuthOverlayVisible(false);
    recoverMesaOrOpenLobby(buildRecoveryDeps()).catch((err) =>
      log(`Hydrate recovery error: ${err?.message ?? err}`),
    );
    return;
  }

  if (savedRefresh) {
    log("Attempting token refresh from stored refresh token...");
    attemptTokenRefresh(API_URL, savedRefresh)
      .then((result) => {
        if (result.ok) {
          token = result.token;
          refreshToken = result.refreshToken;
          SecureStorage.saveAccessToken(result.token);
          SecureStorage.saveRefreshToken(result.refreshToken);
          tokenStatus.textContent = "set";
          tokenInvalidNotified = false;
          startTokenMonitor();
          log("Session restored via refresh");
          setAuthOverlayVisible(false);
          recoverMesaOrOpenLobby(buildRecoveryDeps()).catch((err) =>
            log(`Hydrate-refresh recovery error: ${err?.message ?? err}`),
          );
        } else {
          SecureStorage.clearAllTokens();
          log(`Token refresh on hydrate failed: ${result.reason}. Keeping auth screen.`);
        }
      })
      .catch((err) => {
        SecureStorage.clearAllTokens();
        log(`Token refresh on hydrate error: ${err?.message ?? err}`);
      });
  }
})();