import { describe, it, expect, beforeEach } from "vitest";
import { renderPhaseIndicator } from "./phase-indicator";
import { PHASES } from "./phases";

function makeRefs() {
  document.body.innerHTML = `
    <div id="phase-progress"></div>
    <span id="phase-chip"></span>
  `;
  return {
    progressEl: document.getElementById("phase-progress"),
    labelEl: document.getElementById("phase-chip")
  };
}

describe("renderPhaseIndicator()", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("creates exactly 6 dots", () => {
    const refs = makeRefs();
    renderPhaseIndicator(PHASES.PREFLOP, refs);
    const dots = refs.progressEl!.querySelectorAll(".phase-dot");
    expect(dots.length).toBe(6);
  });

  it("fills one dot for PREFLOP (street 1/6)", () => {
    const refs = makeRefs();
    renderPhaseIndicator(PHASES.PREFLOP, refs);
    const filled = refs.progressEl!.querySelectorAll(".phase-dot.is-filled");
    expect(filled.length).toBe(1);
  });

  it("fills three dots for CARD_2 (street 3/6)", () => {
    const refs = makeRefs();
    renderPhaseIndicator(PHASES.CARD_2, refs);
    const filled = refs.progressEl!.querySelectorAll(".phase-dot.is-filled");
    expect(filled.length).toBe(3);
  });

  it("fills all six dots on CARD_5 (street 6/6, showdown next)", () => {
    const refs = makeRefs();
    renderPhaseIndicator(PHASES.CARD_5, refs);
    const filled = refs.progressEl!.querySelectorAll(".phase-dot.is-filled");
    expect(filled.length).toBe(6);
  });

  it("renders 'Calle N/6 · short' as the label for in-hand phases", () => {
    const refs = makeRefs();
    renderPhaseIndicator(PHASES.CARD_3, refs);
    expect(refs.labelEl!.textContent).toContain("Calle 4/6");
    expect(refs.labelEl!.title.length).toBeGreaterThan(0);
  });

  it("clears all dots and shows a neutral label when WAITING", () => {
    const refs = makeRefs();
    renderPhaseIndicator(PHASES.CARD_3, refs); // first put something on
    renderPhaseIndicator(PHASES.WAITING, refs); // then waiting
    const filled = refs.progressEl!.querySelectorAll(".phase-dot.is-filled");
    expect(filled.length).toBe(0);
    expect(refs.labelEl!.textContent).not.toContain("Calle");
  });

  it("is idempotent — calling twice with the same phase yields the same dot count", () => {
    const refs = makeRefs();
    renderPhaseIndicator(PHASES.CARD_2, refs);
    renderPhaseIndicator(PHASES.CARD_2, refs);
    const dots = refs.progressEl!.querySelectorAll(".phase-dot");
    const filled = refs.progressEl!.querySelectorAll(".phase-dot.is-filled");
    expect(dots.length).toBe(6);
    expect(filled.length).toBe(3);
  });

  it("does not crash with null refs", () => {
    expect(() =>
      renderPhaseIndicator(PHASES.PREFLOP, { progressEl: null, labelEl: null })
    ).not.toThrow();
  });

  it("falls back gracefully for unknown phase strings (legacy 'flop' etc.)", () => {
    const refs = makeRefs();
    renderPhaseIndicator("flop", refs);
    const filled = refs.progressEl!.querySelectorAll(".phase-dot.is-filled");
    expect(filled.length).toBe(0);
    expect(refs.labelEl!.textContent).toBe("—");
  });
});
