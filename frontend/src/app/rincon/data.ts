import type { MeResponse } from "./types";
import type { WinnerRankingEntry } from "../winners-ranking";

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface RinconDataDeps {
  apiUrl: string;
  fetchFn: FetchLike;
  getToken: () => string | null;
  log: (msg: string) => void;
}

export async function fetchMyRincon(deps: RinconDataDeps): Promise<MeResponse> {
  const token = deps.getToken();
  const res = await deps.fetchFn(`${deps.apiUrl}/api/users/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw: any = await res.json();
  return {
    id: Number(raw.id),
    username: String(raw.username ?? ""),
    email: raw.email,
    createdAt: String(raw.createdAt ?? ""),
    gamesPlayed: Number(raw.gamesPlayed ?? 0),
    gamesWon: Number(raw.gamesWon ?? 0),
    totalChipsWon: Number(raw.totalChipsWon ?? 0),
    lastPlayedAt: raw.lastPlayedAt ?? null,
  };
}

/** Resolve "puesto" by finding the user in the public top-winners list. null = outside the top. */
export async function fetchPuesto(deps: RinconDataDeps, userId: number): Promise<number | null> {
  try {
    const res = await deps.fetchFn(`${deps.apiUrl}/api/ranking/top-winners`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const list = (await res.json()) as WinnerRankingEntry[];
    if (!Array.isArray(list)) return null;
    const idx = list.findIndex((e) => Number(e.id) === Number(userId));
    return idx >= 0 ? idx + 1 : null;
  } catch (e) {
    deps.log(`Puesto error: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}
