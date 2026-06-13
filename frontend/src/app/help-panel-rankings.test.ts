/**
 * help-panel-rankings.test.ts — Vitest (happy-dom) guard test for the rankings section.
 *
 * The load-bearing assertion (Test 1) imports the SAME exported `getHandName`
 * and asserts DOM-order labels === [9,8,7,6,5,4,3,2,1,0].map(getHandName).
 * A hardcoded or reordered label in the render module makes Test 1 fail.
 *
 * No engine/Pixi/schema/networking imports.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderRankings } from "./help-panel-rankings";
import { getHandName } from "../game/current-hand";
import { getCardTextureUrl } from "../card-texture-url";

// ------------------------------------------------------------------ helpers --

function buildContainer(): HTMLElement {
  const container = document.createElement("div");
  container.id = "help-panel-content";
  document.body.appendChild(container);
  return container;
}

// -------------------------------------------------------------------- tests --

describe("renderRankings — anti-drift guard", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = buildContainer();
  });

  afterEach(() => {
    container.remove();
  });

  // -------------------------------------------------------------------------
  // Test 1 — ORDER/LABELS GUARD (load-bearing)
  //
  // Asserts that DOM-order row labels EXACTLY equal [9,8,7,6,5,4,3,2,1,0].map(getHandName)
  // using the SHARED import from current-hand.ts. If the render module ever
  // hardcodes a label that drifts, or reorders/omits a category, this fails.
  // -------------------------------------------------------------------------
  it("Test 1 (load-bearing): DOM-order labels === [9..0].map(getHandName) via shared import", () => {
    renderRankings(container);

    const rows = Array.from(container.querySelectorAll(".help-rankings__row"));
    const domLabels = rows.map((row) => {
      const label = row.querySelector(".help-rankings__label");
      return label ? label.textContent : "";
    });

    const expectedLabels = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(getHandName);

    // This comparison is NOT two hardcoded arrays: domLabels comes from the
    // rendered DOM and expectedLabels comes from the shared getHandName import.
    // If either side drifts the test fails.
    expect(domLabels).toEqual(expectedLabels);
  });

  // -------------------------------------------------------------------------
  // Test 2 — COUNT
  // -------------------------------------------------------------------------
  it("Test 2 (count): renders exactly 10 rows", () => {
    renderRankings(container);

    const rows = container.querySelectorAll(".help-rankings__row");
    expect(rows.length).toBe(10);
  });

  // -------------------------------------------------------------------------
  // Test 3 — IDEMPOTENT RENDER
  // -------------------------------------------------------------------------
  it("Test 3 (idempotent): calling renderRankings twice still yields 10 rows", () => {
    renderRankings(container);
    renderRankings(container);

    const rows = container.querySelectorAll(".help-rankings__row");
    expect(rows.length).toBe(10);
  });

  // -------------------------------------------------------------------------
  // Test 4 — EXAMPLE ASSETS
  // -------------------------------------------------------------------------
  it("Test 4 (example assets): every row has at least one <img> with /cards/*.webp src and non-empty alt", () => {
    renderRankings(container);

    const rows = Array.from(container.querySelectorAll(".help-rankings__row"));
    for (const row of rows) {
      const imgs = Array.from(row.querySelectorAll<HTMLImageElement>("img.help-rankings__card-img"));
      expect(imgs.length).toBeGreaterThan(0);
      for (const img of imgs) {
        // Use getAttribute("src") to get the raw relative path set by renderRankings,
        // not the happy-dom-expanded absolute URL in img.src.
        const rawSrc = img.getAttribute("src") ?? "";
        expect(rawSrc).toMatch(/^\/cards\/.+\.webp$/);
        expect(img.alt.length).toBeGreaterThan(0);
      }
    }
  });

  it("Test 4b (Perla assets): the Perla row contains img src for 10C and 7C", () => {
    renderRankings(container);

    // Perla row is the first row (category 9)
    const firstRow = container.querySelector(".help-rankings__row");
    expect(firstRow).not.toBeNull();

    const imgs = Array.from(firstRow!.querySelectorAll<HTMLImageElement>("img.help-rankings__card-img"));
    // Use getAttribute("src") to get the raw relative path (happy-dom expands img.src to absolute).
    const rawSrcs = imgs.map((img) => img.getAttribute("src") ?? "");

    expect(rawSrcs).toContain(getCardTextureUrl("10C"));
    expect(rawSrcs).toContain(getCardTextureUrl("7C"));
  });

  // -------------------------------------------------------------------------
  // Test 5 — PERLA + COLOR-BEATS-FULL EMPHASIS
  // -------------------------------------------------------------------------
  it("Test 5a (Perla emphasis): first row has --perla modifier class", () => {
    renderRankings(container);

    const firstRow = container.querySelector(".help-rankings__row");
    expect(firstRow).not.toBeNull();
    expect(firstRow!.classList.contains("help-rankings__row--perla")).toBe(true);
  });

  it("Test 5b (Color-beats-Full cue): a 'Color gana al Full' cue text appears in the rankings", () => {
    renderRankings(container);

    const allText = container.textContent ?? "";
    expect(allText).toContain("Color gana al Full");
  });

  it("Test 5c (quirk class on Color/Full rows): Color (6) and Full (5) rows have --quirk modifier class", () => {
    renderRankings(container);

    // Labels from canonical source
    const colorLabel = getHandName(6); // "Color"
    const fullLabel = getHandName(5);  // "Full"

    const rows = Array.from(container.querySelectorAll(".help-rankings__row"));

    const colorRow = rows.find((r) => r.querySelector(".help-rankings__label")?.textContent === colorLabel);
    const fullRow = rows.find((r) => r.querySelector(".help-rankings__label")?.textContent === fullLabel);

    expect(colorRow).toBeDefined();
    expect(fullRow).toBeDefined();
    expect(colorRow!.classList.contains("help-rankings__row--quirk")).toBe(true);
    expect(fullRow!.classList.contains("help-rankings__row--quirk")).toBe(true);
  });
});
