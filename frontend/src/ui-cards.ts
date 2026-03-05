/**
 * Card DOM utilities: create card elements, render rows, compare card arrays.
 */

export function createCardElement(card: string | undefined): HTMLDivElement {
  const el = document.createElement("div");
  el.classList.add("card");

  const img = document.createElement("img");
  img.alt = card ? `Carta ${card}` : "Carta oculta";
  img.decoding = "async";
  img.loading = "eager";

  if (!card) {
    el.classList.add("card-back");
    img.src = "/cards/back_logo.png";
    img.addEventListener("load", () => el.classList.add("has-image"));
    img.addEventListener("error", () => {
      el.classList.add("back");
      el.innerHTML = '<span class="rank">?</span><span class="suit">?</span>';
    });
    el.appendChild(img);
    return el;
  }

  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  img.src = `/cards/${suit}_${rank}.jpg`;
  img.addEventListener("load", () => el.classList.add("has-image"));
  img.addEventListener("error", () => {
    const suitMap: Record<string, { symbol: string; color: string }> = {
      O: { symbol: "◆", color: "red" },
      C: { symbol: "♥", color: "red" },
      E: { symbol: "♠", color: "black" },
      B: { symbol: "♣", color: "black" }
    };
    const rankMap: Record<string, string> = {
      "1": "1",
      "10": "S",
      "11": "C",
      "12": "R"
    };
    const suitInfo = suitMap[suit] ?? { symbol: suit, color: "black" };
    el.classList.add(suitInfo.color);
    const displayRank = rankMap[rank] ?? rank;
    el.innerHTML = `<span class="rank">${displayRank}</span><span class="suit">${suitInfo.symbol}</span>`;
  });
  el.appendChild(img);
  return el;
}

export function renderCardRow(el: HTMLElement, cards: string[], slots: number): void {
  el.innerHTML = "";
  for (let i = 0; i < slots; i += 1) {
    const card = cards[i];
    const cardEl = createCardElement(card);
    el.appendChild(cardEl);
  }
}

export function cardsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function preloadCardImages(): void {
  const suits = ["O", "C", "E", "B"];
  const ranks = ["1", "7", "8", "9", "10", "11", "12"];
  const sources = ["/cards/back_logo.png"];
  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      sources.push(`/cards/${suit}_${rank}.jpg`);
    });
  });
  sources.forEach((src) => {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  });
}
