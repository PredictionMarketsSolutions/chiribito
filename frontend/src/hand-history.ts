/**
 * Hand history store and renderer for completed hands.
 */
import type { HandHistoryEntry, HandHistoryWinner } from "./types";

const entries: HandHistoryEntry[] = [];
let idCounter = 0;

export function addHandHistoryEntry(entry: Omit<HandHistoryEntry, "id">, maxSize: number): void {
  const withId: HandHistoryEntry = { ...entry, id: ++idCounter };
  entries.unshift(withId);
  if (entries.length > maxSize) {
    entries.length = maxSize;
  }
}

export function clearHandHistory(): void {
  entries.length = 0;
}

export function renderHandHistory(
  containerEl: HTMLUListElement,
  nameResolver: (playerId: string) => string
): void {
  containerEl.innerHTML = "";
  if (entries.length === 0) {
    const emptyEl = document.createElement("li");
    emptyEl.classList.add("history-empty");
    emptyEl.textContent = "No hands yet.";
    containerEl.appendChild(emptyEl);
    return;
  }

  function formatWinner(winner: HandHistoryWinner): string {
    const name = nameResolver(winner.playerId);
    if (typeof winner.amount === "number") {
      return `${name} (+${winner.amount})`;
    }
    return name;
  }

  entries.forEach((entry) => {
    const itemEl = document.createElement("li");
    itemEl.classList.add("history-item");

    const headerEl = document.createElement("div");
    headerEl.classList.add("history-header");

    const timeEl = document.createElement("span");
    timeEl.classList.add("history-time");
    timeEl.textContent = new Date(entry.timestamp).toLocaleTimeString();

    const winnersEl = document.createElement("span");
    winnersEl.classList.add("history-winners");
    winnersEl.textContent = entry.winners.length
      ? `Winners: ${entry.winners.map(formatWinner).join(", ")}`
      : "Winners: -";

    const potEl = document.createElement("span");
    potEl.classList.add("history-pot");
    potEl.textContent = `Pot: ${entry.pot}`;

    headerEl.appendChild(timeEl);
    headerEl.appendChild(winnersEl);
    headerEl.appendChild(potEl);

    const bodyEl = document.createElement("div");
    bodyEl.classList.add("history-body");

    const handEl = document.createElement("div");
    handEl.textContent = `Winning hand: ${entry.winningHand || "-"}`;
    bodyEl.appendChild(handEl);

    const communityEl = document.createElement("div");
    communityEl.textContent = entry.communityCards.length
      ? `Community: ${entry.communityCards.join(" ")}`
      : "Community: -";
    bodyEl.appendChild(communityEl);

    if (entry.yourHand && entry.yourHand.length) {
      const yourHandEl = document.createElement("div");
      yourHandEl.textContent = `Your hand: ${entry.yourHand.join(" ")}`;
      bodyEl.appendChild(yourHandEl);
    }

    itemEl.appendChild(headerEl);
    itemEl.appendChild(bodyEl);
    containerEl.appendChild(itemEl);
  });
}
