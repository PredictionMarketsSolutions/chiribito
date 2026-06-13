/**
 * help-panel-rules.test.ts — Vitest (happy-dom) guard test for the rules section.
 *
 * Asserts: single .help-rules root, idempotency, key engine-verified phrases,
 * exactly 6 street items, and the regla-de-oro emphasis class.
 *
 * No engine/Pixi/schema/networking imports.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderRules } from "./help-panel-rules";

// ------------------------------------------------------------------ helpers --

function buildContainer(): HTMLElement {
  const container = document.createElement("div");
  container.id = "help-panel-content";
  document.body.appendChild(container);
  return container;
}

// -------------------------------------------------------------------- tests --

describe("renderRules — rules section guard", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = buildContainer();
  });

  afterEach(() => {
    container.remove();
  });

  // -------------------------------------------------------------------------
  // Test 1 — SINGLE ROOT
  // -------------------------------------------------------------------------
  it("Test 1 (single root): renderRules mounts exactly one .help-rules section", () => {
    renderRules(container);

    const roots = container.querySelectorAll(".help-rules");
    expect(roots.length).toBe(1);
  });

  // -------------------------------------------------------------------------
  // Test 2 — IDEMPOTENT
  // -------------------------------------------------------------------------
  it("Test 2 (idempotent): calling renderRules twice still yields exactly one .help-rules root", () => {
    renderRules(container);
    renderRules(container);

    const roots = container.querySelectorAll(".help-rules");
    expect(roots.length).toBe(1);
  });

  // -------------------------------------------------------------------------
  // Test 3 — ENGINE-VERIFIED PHRASES
  // -------------------------------------------------------------------------
  it("Test 3a (baraja): contains 'baraja española de 28 cartas'", () => {
    renderRules(container);

    const text = container.textContent ?? "";
    expect(text).toContain("baraja española de 28 cartas");
  });

  it("Test 3b (regla de oro - load-bearing): contains 'las DOS cartas'", () => {
    renderRules(container);

    const text = container.textContent ?? "";
    expect(text).toContain("las DOS cartas");
  });

  it("Test 3c (community cards): contains '5 cartas comunitarias'", () => {
    renderRules(container);

    const text = container.textContent ?? "";
    expect(text).toContain("5 cartas comunitarias");
  });

  it("Test 3d (one by one): contains 'reveladas una a una'", () => {
    renderRules(container);

    const text = container.textContent ?? "";
    expect(text).toContain("reveladas una a una");
  });

  // -------------------------------------------------------------------------
  // Test 4 — EXACTLY 6 STREETS
  // -------------------------------------------------------------------------
  it("Test 4a (6 streets): streets list has exactly 6 li.help-rules__street items", () => {
    renderRules(container);

    const streets = container.querySelectorAll("li.help-rules__street");
    expect(streets.length).toBe(6);
  });

  it("Test 4b (preflop present): text contains 'preflop'", () => {
    renderRules(container);

    const text = container.textContent ?? "";
    expect(text.toLowerCase()).toContain("preflop");
  });

  it("Test 4c (river present): text contains 'river'", () => {
    renderRules(container);

    const text = container.textContent ?? "";
    expect(text.toLowerCase()).toContain("river");
  });

  // -------------------------------------------------------------------------
  // Test 5 — REGLA DE ORO EMPHASIS CLASS
  // -------------------------------------------------------------------------
  it("Test 5 (gold emphasis): the regla-de-oro card has help-rules__card--gold class", () => {
    renderRules(container);

    const goldCard = container.querySelector(".help-rules__card--gold");
    expect(goldCard).not.toBeNull();
  });
});
