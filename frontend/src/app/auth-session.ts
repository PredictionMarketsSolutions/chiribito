import { startTokenMonitor as startTokenMonitorFn, stopTokenMonitor as stopTokenMonitorFn } from "../auth/token-monitor";

export type ClearAuthSessionDeps = {
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  setShouldAutoReconnect: (value: boolean) => void;
  tokenStatusEl: HTMLElement;
  setTokenInvalidNotified: (value: boolean) => void;
  clearAccessToken: () => void;
  clearRefreshToken: () => void;
  /** Drop the persisted Colyseus reconnectionToken — once the auth session
   *  is gone, the token would only be usable to re-enter a seat that no
   *  longer corresponds to the user. */
  clearReconnectionToken: () => void;
};

export function clearAuthSession(deps: ClearAuthSessionDeps): void {
  deps.setToken(null);
  deps.setRefreshToken(null);
  deps.setShouldAutoReconnect(false);
  deps.tokenStatusEl.textContent = "none";
  stopTokenMonitorFn();
  deps.setTokenInvalidNotified(false);
  deps.clearAccessToken();
  deps.clearRefreshToken();
  deps.clearReconnectionToken();
}

export type HandleTokenInvalidatedDeps = {
  getTokenInvalidNotified: () => boolean;
  setTokenInvalidNotified: (value: boolean) => void;
  clearAuthSession: () => void;
  resetRoomUi: (message?: string) => void;
  alertUser: (message: string) => void;
};

export function handleTokenInvalidated(deps: HandleTokenInvalidatedDeps): void {
  if (deps.getTokenInvalidNotified()) return;
  deps.setTokenInvalidNotified(true);
  deps.clearAuthSession();
  deps.resetRoomUi("logged out");
  deps.alertUser("Se ha iniciado sesion en otro dispositivo. Por favor, vuelve a iniciar sesion.");
}

export type StartTokenMonitorDeps = {
  apiUrl: string;
  getRefreshToken: () => string | null;
  onSuccess: (token: string, refreshToken: string) => void;
  onInvalidated: () => void;
  log: (message: string) => void;
};

export function startTokenMonitor(deps: StartTokenMonitorDeps): void {
  startTokenMonitorFn({
    apiUrl: deps.apiUrl,
    getRefreshToken: deps.getRefreshToken,
    onSuccess: deps.onSuccess,
    onInvalidated: deps.onInvalidated,
    log: deps.log,
    intervalMs: 50 * 60 * 1000,
  });
}
