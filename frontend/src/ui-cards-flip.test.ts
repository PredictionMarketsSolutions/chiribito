import { describe, it, expect, afterEach } from "vitest";
import { createCardElement } from "./ui-cards";
import { flipRevealDomCard, MOBILE_FLIP_MIN_WIDTH_FACTOR } from "./ui-cards-flip";

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

function setReducedMotion(reduce: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  })) as unknown as typeof window.matchMedia;
}

describe("flipRevealDomCard", () => {
  it("sober floor stays clearly off edge-on (more sober than the desktop 0.05)", () => {
    expect(MOBILE_FLIP_MIN_WIDTH_FACTOR).toBeGreaterThan(0.05);
  });

  it("does nothing under prefers-reduced-motion (face stays, no back, no inline transform)", () => {
    setReducedMotion(true);
    const node = createCardElement("6C");
    document.body.appendChild(node);
    const cancel = flipRevealDomCard(node, "6C");
    expect(node.classList.contains("card-back")).toBe(false);
    expect(node.querySelector("img")?.getAttribute("src")).toContain("6 DE COPAS");
    expect(node.style.transform).toBe("");
    expect(typeof cancel).toBe("function");
    node.remove();
  });

  it("starts the turn on the back, transforms only, with the CSS transition disabled", () => {
    setReducedMotion(false);
    const node = createCardElement("6C");
    document.body.appendChild(node);
    const cancel = flipRevealDomCard(node, "6C");
    // Synchronous start state (before any animation frame runs):
    expect(node.classList.contains("card-back")).toBe(true);
    expect(node.querySelector("img")?.getAttribute("src")).toBe("/cards/back-clean.svg");
    expect(node.style.transition).toBe("none");
    expect(node.style.transform).toMatch(/scaleX/);
    cancel();
    node.remove();
  });

  it("cancel() finalizes immediately to the face and clears the inline styles", () => {
    setReducedMotion(false);
    const node = createCardElement("6C");
    document.body.appendChild(node);
    const cancel = flipRevealDomCard(node, "6C");
    cancel();
    expect(node.classList.contains("card-back")).toBe(false);
    expect(node.querySelector("img")?.getAttribute("src")).toContain("6 DE COPAS");
    expect(node.style.transform).toBe("");
    expect(node.style.transition).toBe("");
    node.remove();
  });
});
