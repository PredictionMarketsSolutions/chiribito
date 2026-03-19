export type WinnerRankingEntry = {
  id: number;
  username: string;
  gamesPlayed: number;
  gamesWon: number;
};

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type WinnersRankingDeps = {
  apiUrl: string;
  listEl: HTMLElement;
  fetchFn: FetchLike;
  log: (message: string) => void;
};

export function normalizeWinnerRankingData(data: unknown): WinnerRankingEntry[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(
      (item) =>
        item !== null
        && typeof item === "object"
        && typeof (item as { id?: unknown }).id === "number"
        && typeof (item as { username?: unknown }).username === "string"
    )
    .map((item) => {
      const value = item as {
        id: number;
        username: string;
        gamesPlayed?: number | string;
        gamesWon?: number | string;
      };
      return {
        id: value.id,
        username: value.username,
        gamesPlayed: Number(value.gamesPlayed ?? 0),
        gamesWon: Number(value.gamesWon ?? 0),
      };
    });
}

export function renderWinnersRanking(listEl: HTMLElement, entries: WinnerRankingEntry[]): void {
  listEl.innerHTML = "";
  if (entries.length === 0) {
    const li = document.createElement("li");
    li.className = "room-item room-item-empty";
    li.textContent = "Todavía no hay datos de ranking.";
    listEl.appendChild(li);
    return;
  }

  entries.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = "room-item";

    const left = document.createElement("div");
    left.className = "ranking-left";

    const pos = document.createElement("span");
    pos.className = "ranking-pos";
    pos.textContent = String(index + 1);
    if (index === 0) pos.classList.add("gold");
    else if (index === 1) pos.classList.add("silver");
    else if (index === 2) pos.classList.add("bronze");

    const name = document.createElement("span");
    name.className = "room-name";
    name.textContent = entry.username;

    const meta = document.createElement("span");
    meta.className = "room-meta";
    meta.textContent = `${entry.gamesWon} ganadas · ${entry.gamesPlayed} jugadas`;

    left.appendChild(pos);
    left.appendChild(name);
    li.appendChild(left);
    li.appendChild(meta);
    listEl.appendChild(li);
  });
}

export function renderWinnersRankingError(listEl: HTMLElement): void {
  listEl.innerHTML = "";
  const li = document.createElement("li");
  li.className = "room-item room-item-empty";
  li.textContent = "No se pudo cargar el ranking.";
  listEl.appendChild(li);
}

export async function refreshWinnersRanking(deps: WinnersRankingDeps): Promise<void> {
  try {
    const response = await deps.fetchFn(`${deps.apiUrl}/api/ranking/top-winners`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    const entries = normalizeWinnerRankingData(payload);
    renderWinnersRanking(deps.listEl, entries);
  } catch (error) {
    renderWinnersRankingError(deps.listEl);
    const message = error instanceof Error ? error.message : String(error);
    deps.log(`Ranking error: ${message}`);
  }
}
