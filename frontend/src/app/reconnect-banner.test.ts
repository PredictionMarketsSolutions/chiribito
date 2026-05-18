import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createReconnectBanner } from "./reconnect-banner";

function setup() {
  const bannerEl = document.createElement("div");
  bannerEl.classList.add("reconnect-banner--hidden");
  const textEl = document.createElement("span");
  bannerEl.appendChild(textEl);
  document.body.appendChild(bannerEl);
  return { bannerEl, textEl };
}

describe("reconnect-banner", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("does not show immediately on first 'trying' (debounces)", () => {
    const { bannerEl, textEl } = setup();
    const b = createReconnectBanner({ bannerEl, textEl, maxAttempts: 6 });
    b.apply({ attempt: 1, max: 6, phase: "trying" });
    expect(b.isVisible()).toBe(false);
  });

  it("shows after 250ms of 'trying'", () => {
    const { bannerEl, textEl } = setup();
    const b = createReconnectBanner({ bannerEl, textEl, maxAttempts: 6 });
    b.apply({ attempt: 1, max: 6, phase: "trying" });
    vi.advanceTimersByTime(250);
    expect(b.isVisible()).toBe(true);
    expect(textEl.textContent).toBe("Reconectando… intento 1/6");
  });

  it("hides instantly on 'idle'", () => {
    const { bannerEl, textEl } = setup();
    const b = createReconnectBanner({ bannerEl, textEl, maxAttempts: 6 });
    b.apply({ attempt: 1, max: 6, phase: "trying" });
    vi.advanceTimersByTime(250);
    b.apply({ attempt: 0, max: 6, phase: "idle" });
    expect(b.isVisible()).toBe(false);
  });

  it("switches to degraded copy on 'degraded'", () => {
    const { bannerEl, textEl } = setup();
    const b = createReconnectBanner({ bannerEl, textEl, maxAttempts: 6 });
    b.apply({ attempt: 6, max: 6, phase: "degraded" });
    expect(b.isVisible()).toBe(true);
    expect(textEl.textContent).toBe("Conexión perdida — volviendo al lobby");
    expect(bannerEl.classList.contains("reconnect-banner--degraded")).toBe(true);
  });

  it("updates the copy live as attempts advance once visible", () => {
    const { bannerEl, textEl } = setup();
    const b = createReconnectBanner({ bannerEl, textEl, maxAttempts: 6 });
    b.apply({ attempt: 1, max: 6, phase: "trying" });
    vi.advanceTimersByTime(250);
    b.apply({ attempt: 2, max: 6, phase: "trying" });
    expect(textEl.textContent).toBe("Reconectando… intento 2/6");
  });

  it("clears degraded class when the next cycle starts hidden then trying", () => {
    const { bannerEl, textEl } = setup();
    const b = createReconnectBanner({ bannerEl, textEl, maxAttempts: 6 });
    b.apply({ attempt: 6, max: 6, phase: "degraded" });
    expect(bannerEl.classList.contains("reconnect-banner--degraded")).toBe(true);
    b.apply({ attempt: 0, max: 6, phase: "idle" });
    expect(bannerEl.classList.contains("reconnect-banner--degraded")).toBe(false);
  });
});
