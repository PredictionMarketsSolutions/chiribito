/**
 * Card DOM utilities: create card elements, render rows, compare card arrays.
 */

import { CARD_BACK_URL, getCardTextureUrl, listAllCardImageUrls } from "./card-texture-url";

export function createCardElement(card: string | undefined): HTMLDivElement {
  const el = document.createElement("div");
  el.classList.add("card");
  el.dataset.card = card ?? ""; // reconcile key: the card id, or "" for a face-down back

  const img = document.createElement("img");
  img.alt = card ? `Carta ${card}` : "Carta oculta";
  img.decoding = "async";
  img.loading = "eager";

  if (!card) {
    el.classList.add("card-back");
    img.src = CARD_BACK_URL;
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
  img.src = getCardTextureUrl(card);
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

/**
 * Render `slots` cards into `el`, reconciling against the existing nodes by key
 * so an unchanged card keeps its exact DOM node (and already-loaded image)
 * instead of being destroyed and recreated. The resulting DOM is identical to a
 * full rebuild — only the *changed* slots churn. Key = the card id, or "" for a
 * face-down back. This node persistence is the foundation later materiality
 * (e.g. a reveal flip) builds on: you cannot animate a node that gets thrown
 * away on every render.
 */
export interface RenderCardRowOptions {
  /**
   * Called once when EXACTLY ONE face-down slot turns into a face in this render
   * — i.e. a single community reveal. Deliberately NOT called for a bulk fill
   * (resync / reconnect renders several faces at once), a fresh build (no
   * pre-existing back node), or a reset (face -> back). `node` is the freshly
   * created face card; `faceId` is its card id. This is the single hook the
   * mobile reveal flip rides on, so it never fires on reconnect resync.
   */
  onReveal?: (node: HTMLElement, faceId: string) => void;
}

export function renderCardRow(
  el: HTMLElement,
  cards: string[],
  slots: number,
  opts?: RenderCardRowOptions
): void {
  const revealed: Array<{ node: HTMLElement; faceId: string }> = [];
  for (let i = 0; i < slots; i += 1) {
    const desired = cards[i];
    const key = desired ?? "";
    const existing = el.children[i] as HTMLElement | undefined;
    if (existing && existing.dataset.card === key) {
      continue; // same card in this slot — keep the node untouched
    }
    const wasFaceDown = existing?.dataset.card === "";
    const next = createCardElement(desired);
    if (existing) {
      el.replaceChild(next, existing);
    } else {
      el.appendChild(next);
    }
    if (opts?.onReveal && wasFaceDown && key !== "") {
      revealed.push({ node: next, faceId: key });
    }
  }
  while (el.children.length > slots) {
    el.removeChild(el.lastElementChild as Element);
  }
  // Single back->face transition === a real one-card reveal. Several at once is a
  // resync/bulk fill; zero means a fresh build or reset — neither should flip.
  if (opts?.onReveal && revealed.length === 1) {
    opts.onReveal(revealed[0].node, revealed[0].faceId);
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
  const sources = listAllCardImageUrls();
  sources.forEach((src) => {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  });
}
