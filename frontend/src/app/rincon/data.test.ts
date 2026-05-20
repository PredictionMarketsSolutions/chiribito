import { describe, it, expect, vi } from "vitest";
import { fetchMyRincon, fetchPuesto, type RinconDataDeps } from "./data";

function deps(fetchFn: any): RinconDataDeps {
  return { apiUrl: "http://api", fetchFn, getToken: () => "tok.tok.tok", log: vi.fn() };
}

describe("fetchMyRincon", () => {
  it("sends the auth header and coerces the bigint chips string", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 7, username: "lucia", createdAt: "2026-03-01T00:00:00Z", gamesPlayed: 142, gamesWon: 38, totalChipsWon: "18420", lastPlayedAt: null }),
    } as Response);

    const me = await fetchMyRincon(deps(fetchFn));

    expect(fetchFn).toHaveBeenCalledWith("http://api/api/users/me", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer tok.tok.tok" }),
    }));
    expect(me.totalChipsWon).toBe(18420);
    expect(me.id).toBe(7);
  });

  it("throws on non-ok", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 401 } as Response);
    await expect(fetchMyRincon(deps(fetchFn))).rejects.toThrow("HTTP 401");
  });
});

describe("fetchPuesto", () => {
  it("returns 1-based position when the user is in the ranking", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 3 }, { id: 7 }, { id: 9 }],
    } as Response);
    expect(await fetchPuesto(deps(fetchFn), 7)).toBe(2);
  });

  it("returns null when the user is not in the ranking", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 3 }] } as Response);
    expect(await fetchPuesto(deps(fetchFn), 7)).toBeNull();
  });
});
