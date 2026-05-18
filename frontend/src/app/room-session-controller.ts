import type { Room, Client } from "@colyseus/sdk";

import type { ConnectionState, RoomState } from "../types";
import type { WinnerDisplayState } from "../game";
import type { GameUiContext } from "../game/game-ui-types";
import type {
  CommunityCardRevealedPayload,
  GameResultPayload,
  PlayerDisconnectedPayload,
  RoundEndedPayload,
} from "../types/room-messages";

import type { JoinMode } from "./room-join";

import { validateJoinRequest, handleJoinError } from "./room-join";
import { applyPostJoinSetup, finalizeJoinAttempt } from "./join-room-lifecycle";
import { handleRoomLeave } from "./room-leave-handler";
import {
  handleGameResultMessage,
  handleHeartbeatAckMessage,
  handlePlayerDisconnectedMessage,
} from "./room-message-handlers";
import { bindCoreRoomEvents } from "./room-event-bindings";
import { buildRoundEndedHistoryData } from "./round-ended-history";
import { applyWinnerUiState } from "./round-ended-winner-ui";
import { applyAllInShowdownOutcome, applyStandardRoundOutcome } from "./round-ended-outcome";

import { WINNER_DISPLAY_MS } from "../game";
import { getWinnerDisplayFromRoundEnd } from "../game/round-end-winner";
import { TURN_TIMEOUT_MS, MAX_HAND_HISTORY } from "../config";
import type { GameResultPayload as GameResultPayloadType } from "../types/room-messages";

export type JoinRoomSessionControllerDeps = {
  // Join gating
  getToken: () => string | null;
  getJoinInProgress: () => boolean;
  setJoinInProgress: (value: boolean) => void;
  setLobbyJoinButtonsEnabled: (enabled: boolean) => void;
  setJoinByIdEnabled: (enabled: boolean) => void;
  setCreateTableEnabled: (enabled: boolean) => void;
  createTableCooldownMs: number;

  // Connection + logging
  setConnectionState: (state: ConnectionState) => void;
  log: (message: string) => void;

  // Join inputs
  getWsClient: () => Client;
  getFormValues: () => { username: string };

  // Auth UI
  setAuthOverlayVisible: (visible: boolean) => void;
  setLobbyOverlayVisible: (visible: boolean) => void;
  setTournamentResultVisible: (visible: boolean) => void;
  setAuthMessage: (message: string, type?: "success" | "error" | "info") => void;
  setLobbyMessage: (message: string, type?: "success" | "error" | "info") => void;
  handleTokenInvalidated: () => void;

  // Room + session state (external)
  setRoom: (room: Room) => void;
  setCurrentSessionId: (sessionId: string | null) => void;
  setShouldAutoReconnect: (value: boolean) => void;
  setTournamentEnded: (value: boolean) => void;
  getTournamentEnded: () => boolean;
  setHadRoomWhenBackgrounded: (value: boolean) => void;
  setReconnectAttempts: (n: number) => void;
  clearCurrentRoomRefs: () => void;

  // Room lifecycle
  stopClientHeartbeat: () => void;
  startClientHeartbeat: () => void;
  attemptReconnect: () => void;
  clearAuthToken: () => void;
  resetRoomUi: (message?: string) => void;
  stopLobbyPolling: () => void;
  showGameEndMessage: () => void;
  isTournamentResultOverlayHidden: () => boolean;
  clearLastRoomId: () => void;

  // Core rendering + game ops
  winnerDisplayState: WinnerDisplayState;
  gameUiContext: GameUiContext;

  renderState: (state: RoomState) => void;
  isWinnerPhaseActive: () => boolean;
  startWinnerDisplayPhase: () => void;
  showTournamentResult: (
    result: "won" | "lost",
    champion?: GameResultPayloadType["champion"]
  ) => void;

  // DOM refs (used during join + outcomes)
  winningHandStatusEl: HTMLElement;
  winningHandChipEl: HTMLElement;
  winnersStatusEl: HTMLElement;
  roomStatusEl: HTMLElement;
  communityStatusEl: HTMLElement;
  potStatusEl: HTMLElement;
  communityCardsEl: HTMLElement;
  turnTimerChipEl: HTMLElement;

  // Card + history
  schemaArrayToCards: (value: unknown) => string[];
  renderCardRow: (containerEl: HTMLElement, cards: string[], count: number) => void;
  preloadCardImages: () => void;
  clearHandHistory: () => void;
  renderHandHistoryUi: () => void;
  addHandHistoryEntry: (entry: any, max: number) => void;

  // Turn timer (used by bindCoreRoomEvents)
  startTurnTimer: (turnId: string, timeoutMs: number, deadlineMs: number) => void;

  // Persistent + banner
  saveLastRoomId: (roomId: string) => void;
  /** Persist the Colyseus reconnectionToken returned by a successful join so
   *  the recovery path (reload / post-login hydration) can call
   *  client.reconnect(token) instead of joinById. */
  saveReconnectionToken: (token: string) => void;
  showWinnerBanner: (text: string) => void;
  revealAllInCards: (cards: string[], onComplete?: () => void) => void;

  // Heartbeat (heartbeat_ack)
  getLastHeartbeatSendTime: () => number;
  recordRtt: (rttMs: number) => void;
  clearHeartbeatTimeout: () => void;
  getConnectionState: () => ConnectionState;
  replayBufferedActions: () => void;

  // gameResult deferred display
  getDeferredTournamentResult: () =>
    { result: "won" | "lost"; champion?: GameResultPayloadType["champion"] } | null;
  setDeferredTournamentResult: (
    value: { result: "won" | "lost"; champion?: GameResultPayloadType["champion"] } | null
  ) => void;
  getDeferredTournamentTimerId: () => ReturnType<typeof setTimeout> | null;
  setDeferredTournamentTimerId: (id: ReturnType<typeof setTimeout> | null) => void;

  // roundEnded + all-in state (external)
  setRevealedHands: (hands: Record<string, string[]> | null) => void;
  getAllInCardsRevealedByServer: () => boolean;
  setAllInCardsRevealedByServer: (value: boolean) => void;
  setAllInRevealInProgress: (value: boolean) => void;

  getPendingWinners: () => string[] | null;
  setPendingWinners: (value: string[] | null) => void;
  getPendingWinningHand: () => string | null;
  setPendingWinningHand: (value: string | null) => void;

  setPreviousWinnersKey: (key: string) => void;
  getLastRoomState: () => RoomState | null;
  setLastRoomState: (state: RoomState) => void;

  /** After standard round end: collect cards in Pixi, then invoke `done`. */
  runTableRoundEndAnimation?: (done: () => void) => void;
  /** Sync community row when server sends communityCardRevealed (Pixi path). */
  syncTableCommunityCards?: (cards: string[]) => void;
  armTableScene?: () => void;

  // Audio
  playActionSound: (action: string) => void;
  playWinEffect: () => void;
};

export function createRoomSessionController(deps: JoinRoomSessionControllerDeps) {
  /** Apply ALL post-join wiring that both joinRoom and reconnect share:
   *  state reset (applyPostJoinSetup), table scene arm, client heartbeat,
   *  onLeave handler, and every onMessage subscription. Without this shared
   *  block, a reconnected room would silently miss game events. */
  function mountJoinedRoom(joinedRoom: Room): void {
    applyPostJoinSetup({
      joinedRoom,
      setRoom: deps.setRoom,
      setCurrentSessionId: deps.setCurrentSessionId,
      setShouldAutoReconnect: deps.setShouldAutoReconnect,
      setTournamentEnded: deps.setTournamentEnded,
      setAuthOverlayVisible: deps.setAuthOverlayVisible,
      setLobbyOverlayVisible: deps.setLobbyOverlayVisible,
      setTournamentResultVisible: deps.setTournamentResultVisible,
      stopLobbyPolling: deps.stopLobbyPolling,
      setConnectionState: deps.setConnectionState,
      setReconnectAttempts: deps.setReconnectAttempts,
      winnerDisplayState: deps.winnerDisplayState,
      clearDeferredTournamentTimer: () => {
        deps.setDeferredTournamentResult(null);
        const id = deps.getDeferredTournamentTimerId();
        if (id !== null) {
          clearTimeout(id);
          deps.setDeferredTournamentTimerId(null);
        }
      },
      winningHandStatusEl: deps.winningHandStatusEl,
      winningHandChipEl: deps.winningHandChipEl,
      winnersStatusEl: deps.winnersStatusEl,
      clearHandHistory: deps.clearHandHistory,
      renderHandHistoryUi: deps.renderHandHistoryUi,
      preloadCardImages: deps.preloadCardImages,
      setRoomStatusText: (text) => {
        deps.roomStatusEl.textContent = text;
      },
      saveLastRoomId: deps.saveLastRoomId,
      saveReconnectionToken: deps.saveReconnectionToken,
      log: deps.log,
    });

    deps.armTableScene?.();
    deps.startClientHeartbeat();
    bindRoomMessageHandlers(joinedRoom);
  }

  async function joinRoom(
    forceReplace = false,
    opts?: { mode?: JoinMode; roomId?: string; tableName?: string }
  ): Promise<void> {
    const mode: JoinMode = opts?.mode ?? "joinOrCreate";
    const token = deps.getToken();
    const validation = validateJoinRequest({
      hasToken: Boolean(token),
      mode,
      roomId: opts?.roomId,
      setConnectionState: deps.setConnectionState,
      log: deps.log,
    });
    if (!validation.ok) return;

    if (deps.getJoinInProgress()) {
      deps.log("Ya hay una conexión en curso.");
      return;
    }
    deps.setJoinInProgress(true);
    deps.setLobbyJoinButtonsEnabled(false);

    try {
      const { username } = deps.getFormValues();
      deps.setConnectionState("connecting");
      deps.log("Connecting to Colyseus...");

      const client = deps.getWsClient();
      let joinedRoom: Room;

      try {
        if (mode === "joinById") {
          joinedRoom = await client.joinById(validation.normalizedRoomId!, {
            auth: { token },
            name: username,
            forceReplace,
          } as any);
        } else if (mode === "create") {
          const tableName = (opts?.tableName ?? "").trim();
          joinedRoom = await client.create("mesa", {
            auth: { token },
            name: username,
            tableName,
            forceReplace,
          } as any);
        } else {
          joinedRoom = await client.joinOrCreate("mesa", {
            auth: { token },
            name: username,
            forceReplace,
          } as any);
        }
      } catch (err: any) {
        await handleJoinError({
          error: err,
          confirmSessionReplace: () =>
            window.confirm("Ya hay una sesion activa en la mesa con este usuario. Quieres reemplazarla?"),
          onSessionReplaceConfirmed: async () => {
            deps.setJoinInProgress(false);
            await joinRoom(true);
          },
          onSessionReplaceRejected: () => {
            deps.setConnectionState("disconnected");
          },
          onInvalidToken: () => {
            deps.setConnectionState("disconnected");
            deps.handleTokenInvalidated();
          },
          onAuthUnavailable: () => {
            deps.setConnectionState("disconnected");
            deps.log("Sesión expirada o servidor no disponible. Inicia sesión de nuevo.");
            deps.setAuthMessage("Sesión expirada o servidor no disponible. Inicia sesión de nuevo.", "error");
            deps.setAuthOverlayVisible(true);
          },
          onCreateRateLimit: () => {
            deps.setConnectionState("disconnected");
            deps.log("Espera un minuto antes de crear otra mesa.");
            deps.setLobbyMessage("Espera un minuto antes de crear otra mesa.", "error");
          },
          onGeneric: (message) => {
            deps.log(`Join error: ${message}`);
            deps.setConnectionState("disconnected");
          },
        });
        return;
      }

      mountJoinedRoom(joinedRoom);
      // eslint-disable-next-line no-empty
    } finally {
      finalizeJoinAttempt(mode, {
        setJoinInProgress: (value) => deps.setJoinInProgress(value),
        setJoinByIdEnabled: deps.setJoinByIdEnabled,
        setCreateTableEnabled: deps.setCreateTableEnabled,
        schedule: (callback, delayMs) => setTimeout(callback, delayMs),
        createCooldownMs: deps.createTableCooldownMs,
      });
    }
  }

  /** Resume a previously joined seat via the Colyseus reconnect primitive.
   *  Bypasses onAuth entirely (no SESSION_EXISTS check) by resolving the
   *  server's allowReconnection promise directly.
   *
   *  Throws on failure so the caller (recoverMesaOrOpenLobby) can fall
   *  through to its joinById branch or, ultimately, to the lobby. */
  async function reconnect(token: string): Promise<void> {
    if (deps.getJoinInProgress()) {
      deps.log("Reconnect skipped: another join is already in progress.");
      throw new Error("join in progress");
    }
    deps.setJoinInProgress(true);
    deps.setLobbyJoinButtonsEnabled(false);
    try {
      deps.setConnectionState("connecting");
      deps.log("Reconnecting to Colyseus mesa via reconnectionToken...");
      const client = deps.getWsClient();
      const joinedRoom = await client.reconnect(token);
      mountJoinedRoom(joinedRoom);
    } finally {
      finalizeJoinAttempt("joinById", {
        setJoinInProgress: (value) => deps.setJoinInProgress(value),
        setJoinByIdEnabled: deps.setJoinByIdEnabled,
        setCreateTableEnabled: deps.setCreateTableEnabled,
        schedule: (callback, delayMs) => setTimeout(callback, delayMs),
        createCooldownMs: deps.createTableCooldownMs,
      });
    }
  }

  function bindRoomMessageHandlers(joinedRoom: Room): void {
    joinedRoom.onLeave((code: number) => {
        deps.stopClientHeartbeat();
        handleRoomLeave({
          code,
          isTournamentEnded: deps.getTournamentEnded,
          setTournamentEnded: deps.setTournamentEnded,
          setHadRoomWhenBackgrounded: deps.setHadRoomWhenBackgrounded,
          setShouldAutoReconnect: deps.setShouldAutoReconnect,
          clearLastRoomId: deps.clearLastRoomId,
          clearAuthToken: deps.clearAuthToken,
          resetRoomUi: deps.resetRoomUi,
          setConnectionState: deps.setConnectionState,
          clearCurrentRoomRefs: deps.clearCurrentRoomRefs,
          isTournamentResultOverlayHidden: deps.isTournamentResultOverlayHidden,
          showGameEndMessage: deps.showGameEndMessage,
          log: deps.log,
          attemptReconnect: deps.attemptReconnect,
          alertUser: (message) => alert(message),
        });
      });

      joinedRoom.onMessage("gameResult", (payload: GameResultPayload) => {
        handleGameResultMessage({
          payload,
          isWinnerPhaseActive: deps.isWinnerPhaseActive,
          setDeferredTournamentResult: deps.setDeferredTournamentResult,
          getDeferredTournamentResult: deps.getDeferredTournamentResult,
          clearDeferredTimer: () => {
            const id = deps.getDeferredTournamentTimerId();
            if (id !== null) {
              clearTimeout(id);
              deps.setDeferredTournamentTimerId(null);
            }
          },
          scheduleDeferredTimer: (callback, delayMs) => {
            const id = setTimeout(() => {
              deps.setDeferredTournamentTimerId(null);
              callback();
            }, delayMs);
            deps.setDeferredTournamentTimerId(id);
          },
          winnerDisplayMs: WINNER_DISPLAY_MS,
          showTournamentResult: deps.showTournamentResult,
          renderLastState: () => {
            const last = deps.getLastRoomState();
            if (last) deps.renderState(last);
          },
          log: deps.log,
        });
      });

      joinedRoom.onMessage("playerDisconnected", (payload: PlayerDisconnectedPayload) => {
        handlePlayerDisconnectedMessage(payload, deps.log);
      });

      joinedRoom.onMessage("heartbeat_ack", () => {
        handleHeartbeatAckMessage({
          lastHeartbeatSendTime: deps.getLastHeartbeatSendTime(),
          nowMs: Date.now(),
          recordRtt: deps.recordRtt,
          clearHeartbeatTimeout: deps.clearHeartbeatTimeout,
          isConnected: () => deps.getConnectionState() === "connected",
          setConnected: () => deps.setConnectionState("connected"),
          replayBufferedActions: deps.replayBufferedActions,
        });
      });

      joinedRoom.onMessage("bettingRoundStarted", () => {
        deps.setRevealedHands(null);
        deps.setAllInCardsRevealedByServer(false);
      });

      joinedRoom.onMessage("communityCardRevealed", (payload: CommunityCardRevealedPayload) => {
        let cards = deps.schemaArrayToCards((payload as any)?.communityCards);

        const idx = typeof (payload as any)?.index === "number" ? (payload as any).index : null;
        const card = typeof (payload as any)?.card === "string" ? (payload as any).card : null;

        if ((!cards || cards.length === 0) && card) {
          const next = [...deps.gameUiContext.previousCommunityCards];
          const targetIndex = idx ?? next.length;
          while (next.length < targetIndex) next.push("");
          next[targetIndex] = card;
          cards = next;
        }

        if (cards.length > 0) {
          deps.setAllInRevealInProgress(true);
          deps.setAllInCardsRevealedByServer(true);
          deps.gameUiContext.previousCommunityCards = [...cards];
          if (!deps.gameUiContext.tableScene?.isActive()) {
            deps.renderCardRow(deps.communityCardsEl, cards, 5);
          }
          deps.syncTableCommunityCards?.(cards);
          const shown = cards.filter(Boolean);
          deps.communityStatusEl.textContent = shown.length ? shown.join(" ") : "-";
        }
      });

      bindCoreRoomEvents({
        room: joinedRoom as any,
        log: deps.log,
        playActionSound: deps.playActionSound,
        startTurnTimer: (turnId, timeoutMs, deadlineMs) =>
          deps.startTurnTimer(turnId, timeoutMs, deadlineMs),
        turnTimeoutMs: TURN_TIMEOUT_MS,
        setLastRoomState: deps.setLastRoomState,
        isWinnerPhaseActive: deps.isWinnerPhaseActive,
        renderState: deps.renderState,
      });

      joinedRoom.onMessage("roundEnded", (payload: RoundEndedPayload) => {
        const historyData = buildRoundEndedHistoryData(payload, {
          currentSessionId: deps.gameUiContext.currentSessionId,
          potText: deps.potStatusEl.textContent,
          schemaArrayToCards: deps.schemaArrayToCards,
        });

        const winnersPayload = Array.isArray((payload as any)?.winners) ? (payload as any).winners : [];
        const { winnersForHistory, potValue, communityCards, yourHand } = historyData;

        const isAllInShowdown = Boolean((payload as any)?.isAllInShowdown);
        if (isAllInShowdown) deps.log("Showdown: all-in (auto reveal)");

        if (payload?.playerHands && typeof payload.playerHands === "object") {
          deps.setRevealedHands(payload.playerHands as Record<string, string[]>);
        }

        if (isAllInShowdown && communityCards.length === 5) {
          const winnerIds = winnersPayload
            .filter((w: any) => w && typeof w.playerId === "string")
            .map((w: any) => w.playerId);

          deps.setPendingWinners(winnerIds);
          deps.setPendingWinningHand((payload as any)?.winningHand ?? "");

          applyAllInShowdownOutcome({
            winnerDisplayState: deps.winnerDisplayState,
            currentSessionId: deps.gameUiContext.currentSessionId,
            latestPlayerNames: deps.gameUiContext.latestPlayerNames,
            applyWinnerUi: (winnerIds, winningHand) => {
              applyWinnerUiState(deps.winnerDisplayState, {
                winnerIds,
                winningHand,
                winnersStatusEl: deps.winnersStatusEl,
                winningHandStatusEl: deps.winningHandStatusEl,
                winningHandChipEl: deps.winningHandChipEl,
              });
            },
            playWinEffect: deps.playWinEffect,
            startWinnerDisplayPhase: deps.startWinnerDisplayPhase,
            renderLastState: () => {
              const last = deps.getLastRoomState();
              if (last) deps.renderState(last);
            },
            showWinnerBanner: deps.showWinnerBanner,
            setPreviousCommunityCards: (cards) => {
              deps.gameUiContext.previousCommunityCards = [...cards];
            },
            winnerIds: deps.getPendingWinners() ?? [],
            winningHand: deps.getPendingWinningHand() ?? "",
            communityCards,
            allInCardsRevealedByServer: deps.getAllInCardsRevealedByServer(),
            setAllInRevealInProgress: (value) => {
              deps.setAllInRevealInProgress(value);
              if (!value) {
                deps.setPendingWinners(null);
                deps.setPendingWinningHand(null);
              }
            },
            revealAllInCards: deps.revealAllInCards,
          });
        } else {
          deps.gameUiContext.previousCommunityCards = [...communityCards];
          const winnerDisplay = getWinnerDisplayFromRoundEnd(payload);

          const runStandardOutcome = () => {
            applyStandardRoundOutcome({
              winnerDisplayState: deps.winnerDisplayState,
              currentSessionId: deps.gameUiContext.currentSessionId,
              latestPlayerNames: deps.gameUiContext.latestPlayerNames,
              applyWinnerUi: (winnerIds, winningHand) => {
                applyWinnerUiState(deps.winnerDisplayState, {
                  winnerIds,
                  winningHand,
                  winnersStatusEl: deps.winnersStatusEl,
                  winningHandStatusEl: deps.winningHandStatusEl,
                  winningHandChipEl: deps.winningHandChipEl,
                });
              },
              playWinEffect: deps.playWinEffect,
              startWinnerDisplayPhase: deps.startWinnerDisplayPhase,
              renderLastState: () => {
                const last = deps.getLastRoomState();
                if (last) deps.renderState(last);
              },
              showWinnerBanner: deps.showWinnerBanner,
              setPreviousCommunityCards: () => undefined,
              winnerDisplay,
              fallbackWinningHand: (payload as any)?.winningHand ?? "",
              setPreviousWinnersKey: deps.setPreviousWinnersKey,
            });
          };

          if (deps.runTableRoundEndAnimation) {
            deps.runTableRoundEndAnimation(runStandardOutcome);
          } else {
            runStandardOutcome();
          }
        }

        deps.addHandHistoryEntry(
          {
            timestamp: Date.now(),
            winners: winnersForHistory,
            winningHand: (payload as any)?.winningHand ?? "-",
            winningCards: historyData.winningCards,
            communityCards,
            pot: potValue,
            yourHand,
          },
          MAX_HAND_HISTORY
        );
        deps.renderHandHistoryUi();
        deps.log(`Round ended: ${JSON.stringify(payload)}`);
      });
  }

  return { joinRoom, reconnect };
}

