import { createCardElement } from "../ui-cards";

export type CardPopoverDeps = {
  seatsEl: HTMLElement | null;
  cardPopover: HTMLElement | null;
  cardPopoverCards: HTMLElement | null;
};

export function setupCardPopover(deps: CardPopoverDeps): void {
  const { seatsEl, cardPopover, cardPopoverCards } = deps;
  if (!seatsEl || !cardPopover || !cardPopoverCards) return;

  let hideTimeout: ReturnType<typeof setTimeout> | null = null;
  let popoverPinned = false;

  function showPopover(hand: HTMLElement) {
    const raw = hand.getAttribute("data-cards");
    let cards: string[] = [];
    try {
      cards = raw ? JSON.parse(raw) : [];
    } catch {
      /* ignore */
    }
    if (cards.length === 0) return;

    cardPopoverCards.innerHTML = "";
    cards.forEach((card) => {
      const el = createCardElement(card);
      cardPopoverCards.appendChild(el);
    });
    cardPopover.classList.remove("hidden");
    cardPopover.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
      const rect = hand.getBoundingClientRect();
      const popRect = cardPopover.getBoundingClientRect();
      const padding = 12;
      let left = rect.left + rect.width / 2 - popRect.width / 2;
      let top = rect.top - popRect.height - padding;
      left = Math.max(padding, Math.min(left, document.documentElement.clientWidth - popRect.width - padding));
      top = Math.max(padding, Math.min(top, document.documentElement.clientHeight - popRect.height - padding));
      cardPopover.style.left = `${left}px`;
      cardPopover.style.top = `${top}px`;
    });
  }

  function hidePopover() {
    cardPopover.classList.add("hidden");
    cardPopover.setAttribute("aria-hidden", "true");
    popoverPinned = false;
  }

  seatsEl.addEventListener("mouseenter", (e: MouseEvent) => {
    const hand = (e.target as HTMLElement).closest<HTMLElement>(".seat-hand");
    if (!hand) return;
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    showPopover(hand);
  }, true);

  seatsEl.addEventListener("mouseleave", (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest(".seat-hand")) return;
    if (popoverPinned) return;
    hideTimeout = setTimeout(() => {
      hidePopover();
      hideTimeout = null;
    }, 200);
  }, true);

  seatsEl.addEventListener("click", (e: MouseEvent) => {
    const hand = (e.target as HTMLElement).closest<HTMLElement>(".seat-hand");
    if (!hand) return;
    e.stopPropagation();
    const raw = hand.getAttribute("data-cards");
    let cards: string[] = [];
    try {
      cards = raw ? JSON.parse(raw) : [];
    } catch {
      /* ignore */
    }
    if (cards.length === 0) return;
    if (cardPopover.classList.contains("hidden")) {
      showPopover(hand);
      popoverPinned = true;
    } else {
      hidePopover();
    }
  }, true);

  cardPopover.addEventListener("click", (e: MouseEvent) => {
    e.stopPropagation();
    if (popoverPinned) hidePopover();
  });

  document.addEventListener("click", () => {
    if (cardPopover.classList.contains("hidden")) return;
    if (popoverPinned) hidePopover();
  });
}
