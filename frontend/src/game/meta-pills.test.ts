import { describe, it, expect, beforeEach } from "vitest";
import { applyHideIfEmpty } from "./meta-pills";

function makeBadge(): HTMLElement {
  const el = document.createElement("span");
  el.classList.add("badge");
  document.body.appendChild(el);
  return el;
}

describe("applyHideIfEmpty()", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("adds .hidden when the value is empty string", () => {
    const el = makeBadge();
    applyHideIfEmpty(el, "");
    expect(el.classList.contains("hidden")).toBe(true);
  });

  it("adds .hidden when the value is a single '-' placeholder", () => {
    const el = makeBadge();
    applyHideIfEmpty(el, "-");
    expect(el.classList.contains("hidden")).toBe(true);
  });

  it("removes .hidden when the value is a real string", () => {
    const el = makeBadge();
    el.classList.add("hidden");
    applyHideIfEmpty(el, "Carlos");
    expect(el.classList.contains("hidden")).toBe(false);
  });

  it("treats null and undefined as empty", () => {
    const el = makeBadge();
    applyHideIfEmpty(el, null);
    expect(el.classList.contains("hidden")).toBe(true);
    applyHideIfEmpty(el, undefined);
    expect(el.classList.contains("hidden")).toBe(true);
  });

  it("trims whitespace before classifying", () => {
    const el = makeBadge();
    applyHideIfEmpty(el, "   ");
    expect(el.classList.contains("hidden")).toBe(true);
  });

  it("no-ops when badgeEl is null (defensive)", () => {
    expect(() => applyHideIfEmpty(null, "anything")).not.toThrow();
  });
});
