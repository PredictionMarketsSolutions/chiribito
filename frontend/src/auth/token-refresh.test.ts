/**
 * Tests for token refresh logic.
 * Ensures malformed or failed refresh is classified correctly so the app can invalidate session and reset room.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { attemptTokenRefresh } from "./token-refresh";

const API_URL = "https://api.test";

describe("attemptTokenRefresh", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
  });

  it("returns ok with token and refreshToken when response is valid", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          token: "new-access-token",
          refreshToken: "new-refresh-token",
        }),
    });

    const result = await attemptTokenRefresh(API_URL, "old-refresh", fetchMock);

    expect(result).toEqual({
      ok: true,
      token: "new-access-token",
      refreshToken: "new-refresh-token",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/api/auth/refresh`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: "old-refresh" }),
      })
    );
  });

  it("returns malformed when response is ok but token is missing", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ refreshToken: "rt-only" }),
    });

    const result = await attemptTokenRefresh(API_URL, "rt", fetchMock);

    expect(result).toEqual({ ok: false, reason: "malformed" });
  });

  it("returns malformed when response is ok but token is empty string", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ token: "", refreshToken: "valid-refresh" }),
    });

    const result = await attemptTokenRefresh(API_URL, "rt", fetchMock);

    expect(result).toEqual({ ok: false, reason: "malformed" });
  });

  it("returns malformed when response is ok but refreshToken is missing", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: "access-only" }),
    });

    const result = await attemptTokenRefresh(API_URL, "rt", fetchMock);

    expect(result).toEqual({ ok: false, reason: "malformed" });
  });

  it("returns malformed when response is ok but refreshToken is empty string", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ token: "valid-token", refreshToken: "" }),
    });

    const result = await attemptTokenRefresh(API_URL, "rt", fetchMock);

    expect(result).toEqual({ ok: false, reason: "malformed" });
  });

  it("returns malformed when response is ok but body is empty object", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const result = await attemptTokenRefresh(API_URL, "rt", fetchMock);

    expect(result).toEqual({ ok: false, reason: "malformed" });
  });

  it("returns not_ok when response is not ok (e.g. 401)", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });

    const result = await attemptTokenRefresh(API_URL, "rt", fetchMock);

    expect(result).toEqual({ ok: false, reason: "not_ok" });
  });

  it("returns network when fetch throws", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    const result = await attemptTokenRefresh(API_URL, "rt", fetchMock);

    expect(result).toEqual({ ok: false, reason: "network" });
  });

  it("returns network when response.json() throws", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    const result = await attemptTokenRefresh(API_URL, "rt", fetchMock);

    expect(result).toEqual({ ok: false, reason: "network" });
  });

  it("accepts non-string token/refreshToken as malformed (e.g. numbers)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ token: 12345, refreshToken: "rt" }),
    });

    const result = await attemptTokenRefresh(API_URL, "rt", fetchMock);

    expect(result).toEqual({ ok: false, reason: "malformed" });
  });
});
