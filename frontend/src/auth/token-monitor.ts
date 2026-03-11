/**
 * Periodic token refresh: starts a timer that refreshes the auth token and calls
 * onSuccess or onInvalidated. No token state; caller owns token/refreshToken.
 */

import { attemptTokenRefresh } from "./token-refresh";

let tokenMonitorId: ReturnType<typeof setInterval> | null = null;

export type TokenMonitorDeps = {
  apiUrl: string;
  getRefreshToken: () => string | null;
  onSuccess: (token: string, refreshToken: string) => void;
  onInvalidated: () => void;
  log: (msg: string) => void;
  intervalMs: number;
};

export function startTokenMonitor(deps: TokenMonitorDeps): void {
  stopTokenMonitor();
  const refreshToken = deps.getRefreshToken();
  if (!refreshToken) return;

  tokenMonitorId = window.setInterval(async () => {
    const current = deps.getRefreshToken();
    if (!current) return;
    const result = await attemptTokenRefresh(deps.apiUrl, current);
    if (result.ok) {
      deps.onSuccess(result.token, result.refreshToken);
      deps.log("Token refreshed successfully");
    } else if (result.reason === "malformed" || result.reason === "not_ok") {
      deps.log(
        result.reason === "malformed"
          ? "Token refresh: malformed or empty tokens, clearing session"
          : "Token refresh failed, clearing session"
      );
      deps.onInvalidated();
    } else if (result.reason === "network") {
      deps.log("Token refresh: network error, clearing session");
      deps.onInvalidated();
    }
  }, deps.intervalMs);
}

export function stopTokenMonitor(): void {
  if (tokenMonitorId !== null) {
    clearInterval(tokenMonitorId);
    tokenMonitorId = null;
  }
}
