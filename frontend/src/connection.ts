/**
 * Connection: Colyseus client singleton, heartbeat, RTT, connection indicator, reconnect logic.
 */

import { Client, type Room } from "@colyseus/sdk";

let wsClient: Client | null = null;
// In the browser, window.setInterval / setTimeout return number, not NodeJS.Timeout.
let clientHeartbeatId: ReturnType<typeof window.setInterval> | null = null;
let heartbeatTimeoutId: ReturnType<typeof window.setTimeout> | null = null;

const rttSamples: number[] = [];
let averageRtt = 0;
let connectionQuality: "excellent" | "good" | "degraded" | "poor" = "excellent";

export type ConnectionState = "disconnected" | "connecting" | "connected";

export function getWsClient(wsUrl: string): Client {
  if (!wsClient) wsClient = new Client(wsUrl);
  return wsClient;
}

export type HeartbeatOpts = {
  intervalMs: number;
  timeoutMs: number;
  log: (msg: string) => void;
  onTimeout: () => void;
  /** Called with send timestamp so caller can compute RTT on heartbeat_ack */
  onSend?: (sendTime: number) => void;
};

export function startClientHeartbeat(room: Room, opts: HeartbeatOpts): void {
  stopClientHeartbeat();
  const { intervalMs, timeoutMs, log, onTimeout, onSend } = opts;
  clientHeartbeatId = window.setInterval(() => {
    if (!room) return;
    clearHeartbeatTimeout();
    const sendTime = Date.now();
    onSend?.(sendTime);
    room.send("heartbeat", sendTime);
    heartbeatTimeoutId = window.setTimeout(() => {
      log("[HEARTBEAT] No ACK received, server not responding");
      onTimeout();
    }, timeoutMs);
  }, intervalMs);
}

export function stopClientHeartbeat(): void {
  if (clientHeartbeatId !== null) {
    clearInterval(clientHeartbeatId);
    clientHeartbeatId = null;
  }
  clearHeartbeatTimeout();
}

/** Call when heartbeat_ack is received so the timeout does not fire */
export function clearHeartbeatTimeout(): void {
  if (heartbeatTimeoutId !== null) {
    clearTimeout(heartbeatTimeoutId);
    heartbeatTimeoutId = null;
  }
}

export type RecordRttOpts = {
  rttStatusEl: HTMLElement;
  qualityStatusEl: HTMLElement;
  log: (msg: string) => void;
};

export function recordRtt(rttMs: number, opts: RecordRttOpts): void {
  rttSamples.push(rttMs);
  if (rttSamples.length > 20) rttSamples.shift();
  averageRtt = rttSamples.reduce((a, b) => a + b, 0) / rttSamples.length;
  if (averageRtt < 100) connectionQuality = "excellent";
  else if (averageRtt < 300) connectionQuality = "good";
  else if (averageRtt < 1000) connectionQuality = "degraded";
  else connectionQuality = "poor";

  opts.rttStatusEl.textContent = `${averageRtt.toFixed(0)}ms`;
  opts.qualityStatusEl.textContent = connectionQuality.toUpperCase();
  opts.qualityStatusEl.style.color =
    connectionQuality === "excellent" ? "var(--felt-main)" :
    connectionQuality === "good" ? "var(--felt-light)" :
    connectionQuality === "degraded" ? "var(--gold)" : "#ff4444";

  if (connectionQuality !== "excellent" && rttSamples.length % 5 === 0) {
    opts.log(`⚠️ Connection degraded: ${averageRtt.toFixed(0)}ms RTT (${connectionQuality})`);
  }
}

export function getRttInfo(): { averageRtt: number; connectionQuality: string } {
  return { averageRtt, connectionQuality };
}

export type UpdateConnectionIndicatorOpts = {
  connectionState: ConnectionState;
  reconnectAttempts: number;
  maxAttempts: number;
  connectionIndicatorEl: HTMLElement;
  averageRtt: number;
  connectionQuality: string;
};

export function updateConnectionIndicator(opts: UpdateConnectionIndicatorOpts): void {
  const { connectionState, reconnectAttempts, maxAttempts, connectionIndicatorEl, averageRtt, connectionQuality } = opts;
  if (connectionState === "connected") {
    connectionIndicatorEl.style.backgroundColor = "var(--felt-main)";
    connectionIndicatorEl.title = `Connected (${averageRtt.toFixed(0)}ms, ${connectionQuality})`;
  } else if (connectionState === "connecting") {
    connectionIndicatorEl.style.backgroundColor = "var(--gold)";
    connectionIndicatorEl.title = `Connecting (attempt ${reconnectAttempts}/${maxAttempts})`;
  } else {
    connectionIndicatorEl.style.backgroundColor = "#ff4444";
    connectionIndicatorEl.title = "Disconnected";
  }
}

export type AttemptReconnectDeps = {
  getToken: () => string | null;
  getConnectionState: () => ConnectionState;
  getTournamentEnded: () => boolean;
  getReconnectAttempts: () => number;
  setReconnectAttempts: (n: number) => void;
  joinRoom: (forceReplace: boolean) => Promise<void>;
  maxAttempts: number;
  clearAuthToken: () => void;
  log: (msg: string) => void;
  // --- Move 2 ---
  /** Read the stored Colyseus reconnectionToken (Move 1.5). */
  getReconnectionToken: () => string | null;
  /** Drop the stored token after a confirmed-bad-token attempt. */
  clearReconnectionToken: () => void;
  /** Resume the seat via Colyseus reconnect; throws on failure. */
  reconnect: (token: string) => Promise<void>;
  /** Soft-fail path. Reset UI to lobby + keep auth token valid. */
  degradeToLobby: (message: string) => void;
};

export async function attemptReconnect(deps: AttemptReconnectDeps): Promise<void> {
  if (deps.getTournamentEnded()) {
    deps.log("Mesa cerrada por fin de torneo. No se reconecta.");
    return;
  }
  if (deps.getReconnectAttempts() >= deps.maxAttempts) {
    deps.log("Max reconnection attempts reached. Degrading to lobby.");
    deps.clearReconnectionToken();
    deps.degradeToLobby("Conexión perdida. Vuelve al lobby.");
    return;
  }

  deps.setReconnectAttempts(deps.getReconnectAttempts() + 1);
  const attempt = deps.getReconnectAttempts();
  const baseDelayMs = 1000;
  const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
  deps.log(`Reconnect attempt ${attempt}/${deps.maxAttempts} in ${delayMs}ms...`);
  await new Promise((r) => setTimeout(r, delayMs));

  if (!deps.getToken() || deps.getConnectionState() !== "disconnected") return;

  const token = deps.getReconnectionToken();
  if (token) {
    try {
      await deps.reconnect(token);
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      deps.log(`reconnect(token) failed (${msg}); falling back to joinRoom.`);
      deps.clearReconnectionToken();
    }
  }
  await deps.joinRoom(true);
}
