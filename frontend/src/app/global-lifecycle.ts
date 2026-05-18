type ConnectionState = "disconnected" | "connecting" | "connected";

export type GlobalLifecycleDeps = {
  apiUrlEl: HTMLElement;
  wsUrlEl: HTMLElement;
  apiUrl: string;
  wsUrl: string;
  initPixiLayer: () => Promise<void>;
  setAuthOverlayVisible: (visible: boolean) => void;
  renderHandHistoryUi: () => void;
  setupCardPopover: () => void;
  setAuthMessage: (message: string, type?: "success" | "error" | "info") => void;
  log: (message: string) => void;
  isAudioUnlocked: () => boolean;
  initAudio: () => void;
  getConnectionState: () => ConnectionState;
  hasRoom: () => boolean;
  hasToken: () => boolean;
  getHadRoomWhenBackgrounded: () => boolean;
  setHadRoomWhenBackgrounded: (value: boolean) => void;
  stopClientHeartbeat: () => void;
  startClientHeartbeat: () => void;
  attemptReconnect: () => void;
};

export function registerGlobalLifecycle(deps: GlobalLifecycleDeps): void {
  document.addEventListener("DOMContentLoaded", () => {
    deps.apiUrlEl.textContent = deps.apiUrl;
    deps.wsUrlEl.textContent = deps.wsUrl;
    void deps.initPixiLayer();
    // Only force-show auth when there is no session to restore. Otherwise the
    // hydration logic (main.ts IIFE) will have already opened the lobby/mesa
    // and we would clobber that by re-showing auth here.
    if (!deps.hasToken()) {
      deps.setAuthOverlayVisible(true);
    }
    deps.renderHandHistoryUi();
    deps.setupCardPopover();
  });

  window.addEventListener("error", (event) => {
    const message = (event as ErrorEvent).error?.message || (event as ErrorEvent).message || "Unknown client error";
    deps.setAuthMessage(`Error: ${message}`, "error");
    deps.log(`Client error: ${message}`);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = (event as PromiseRejectionEvent).reason as { message?: string } | string | undefined;
    const message = typeof reason === "string" ? reason : reason?.message || "Unhandled rejection";
    deps.setAuthMessage(`Error: ${message}`, "error");
    deps.log(`Unhandled rejection: ${message}`);
  });

  document.addEventListener(
    "pointerdown",
    () => {
      if (!deps.isAudioUnlocked()) deps.initAudio();
    },
    { once: true }
  );

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      deps.log("🔇 App backgrounded, heartbeat paused");
      deps.setHadRoomWhenBackgrounded(deps.getConnectionState() === "connected" && deps.hasRoom());
      deps.stopClientHeartbeat();
      return;
    }

    deps.log("🔊 App resumed from background");
    if (deps.getConnectionState() === "disconnected" && deps.hasToken() && deps.getHadRoomWhenBackgrounded()) {
      deps.log("Attempting to reconnect...");
      deps.setHadRoomWhenBackgrounded(false);
      deps.attemptReconnect();
    } else if (deps.getConnectionState() === "connected" && deps.hasRoom()) {
      deps.log("Resuming heartbeat...");
      deps.startClientHeartbeat();
    } else {
      deps.setHadRoomWhenBackgrounded(false);
    }
  });
}
