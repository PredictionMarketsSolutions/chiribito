/**
 * Audio + motion feedback orchestrator.
 *
 * Observes existing DOM mutations (class toggles, card appends) and emits
 * the right audio/CSS feedback automatically — so we don't have to wire
 * sound into every controller call site.
 *
 * Initialised once from main.ts via `installFeedback()`.
 */

import { audio } from "./audio";

function unlockAudioOnFirstGesture(): void {
  const unlock = () => {
    if (!audio.isUnlocked()) audio.init();
  };
  const events = ["pointerdown", "keydown", "touchstart"] as const;
  events.forEach((evt) => {
    window.addEventListener(evt, unlock, { capture: true, once: false, passive: true });
  });
}

function wireHoverAndClickFeedback(): void {
  const hoverSelectors = [
    ".auth-btn--primary",
    ".lobby-cta",
    ".game-btn.accent",
    ".lobby-icon-btn",
    ".lobby-ghost-btn",
    ".auth-tab",
  ].join(",");

  document.addEventListener(
    "pointerover",
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const match = target.closest?.(hoverSelectors);
      if (!match) return;
      // Only first hover within 90ms — avoid spamming when pointer drifts inside button
      if ((match as HTMLElement).dataset.feedbackHover === "1") return;
      (match as HTMLElement).dataset.feedbackHover = "1";
      audio.playEffect("hover");
      setTimeout(() => {
        delete (match as HTMLElement).dataset.feedbackHover;
      }, 90);
    },
    { capture: true, passive: true },
  );

  const clickSelectors = [
    ".auth-btn",
    ".lobby-cta",
    ".lobby-icon-btn",
    ".lobby-ghost-btn",
    ".game-btn",
    ".auth-tab",
  ].join(",");

  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const match = target.closest?.(clickSelectors);
      if (!match) return;
      audio.playEffect("click");
    },
    { capture: true, passive: true },
  );
}

function observeClassToggle(el: HTMLElement, predicate: (el: HTMLElement) => boolean, onEnter: () => void): void {
  let prev = predicate(el);
  const obs = new MutationObserver(() => {
    const current = predicate(el);
    if (current && !prev) onEnter();
    prev = current;
  });
  obs.observe(el, { attributes: true, attributeFilter: ["class"] });
}

function wireDomFeedback(): void {
  const yourTurn = document.getElementById("your-turn-indicator");
  if (yourTurn) {
    observeClassToggle(
      yourTurn,
      (el) => !el.classList.contains("hidden"),
      () => audio.playEffect("yourTurn"),
    );
  }

  // Win/lose is fired from the round-ended outcome handler (which knows whether
  // the local player actually won) — not here, where the banner shows for everyone.

  const handCards = document.getElementById("hand-cards");
  if (handCards) {
    observeClassToggle(
      handCards,
      (el) => el.classList.contains("has-perla"),
      () => audio.playEffect("perlaArrive"),
    );

    // Hole cards dealt: fire the deal swoosh the moment the hand fills from empty
    // (resets to silent between hands, so each new deal sounds once).
    let handHadCards = countVisibleCards(handCards) > 0;
    const dealObs = new MutationObserver(() => {
      const hasCards = countVisibleCards(handCards) > 0;
      if (hasCards && !handHadCards) audio.playEffect("deal");
      handHadCards = hasCards;
    });
    dealObs.observe(handCards, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }

  // Community cards: detect when a new card is added (street reveal)
  const community = document.getElementById("community-cards");
  if (community) {
    let previousVisibleCount = countVisibleCards(community);
    const obs = new MutationObserver(() => {
      const current = countVisibleCards(community);
      if (current > previousVisibleCount) {
        audio.playEffect("reveal");
        // The reveal MOTION is owned by the mobile flip driver (flipRevealDomCard,
        // wired through renderCardRow's onReveal). We deliberately do NOT tag cards
        // with a CSS flip class here: a running CSS animation would override the
        // sober scaleX turn (and now that node-reconcile persists nodes, it would
        // actually play). The old flashier `.is-revealing` 3D rotateY CSS was
        // removed in P1 Fase 4.
      }
      previousVisibleCount = current;
    });
    obs.observe(community, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }
}

function countVisibleCards(container: HTMLElement): number {
  return container.querySelectorAll(".card.has-image").length;
}

let installed = false;

export function installFeedback(): void {
  if (installed) return;
  installed = true;
  unlockAudioOnFirstGesture();
  // Defer DOM wiring until DOMContentLoaded (the script runs after html parse but
  // we may be called before some dynamic elements settle).
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      wireHoverAndClickFeedback();
      wireDomFeedback();
    }, { once: true });
  } else {
    wireHoverAndClickFeedback();
    wireDomFeedback();
  }
}
