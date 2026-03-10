/**
 * Token refresh logic for auth session.
 * Extracted for testability: malformed or failed refresh should trigger session invalidation.
 */

export type RefreshResult =
  | { ok: true; token: string; refreshToken: string }
  | { ok: false; reason: "network" | "not_ok" | "malformed" };

export async function attemptTokenRefresh(
  apiUrl: string,
  refreshToken: string,
  fetchImpl: typeof fetch = fetch
): Promise<RefreshResult> {
  try {
    const response = await fetchImpl(`${apiUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return { ok: false, reason: "not_ok" };
    const data = await response.json();
    const token =
      typeof data?.token === "string" && data.token.length > 0 ? data.token : null;
    const newRefresh =
      typeof data?.refreshToken === "string" && data.refreshToken.length > 0
        ? data.refreshToken
        : null;
    if (token && newRefresh) return { ok: true, token, refreshToken: newRefresh };
    return { ok: false, reason: "malformed" };
  } catch {
    return { ok: false, reason: "network" };
  }
}
