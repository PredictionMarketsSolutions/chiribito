import { describe, it, expect } from "vitest";
import { phaseLabel, isInHandPhase, PHASES, TOTAL_BETTING_ROUNDS } from "./phases";

describe("phaseLabel()", () => {
  it("returns the right street number for every phase, 1..6", () => {
    expect(phaseLabel(PHASES.PREFLOP).streetNumber).toBe(1);
    expect(phaseLabel(PHASES.CARD_1).streetNumber).toBe(2);
    expect(phaseLabel(PHASES.CARD_2).streetNumber).toBe(3);
    expect(phaseLabel(PHASES.CARD_3).streetNumber).toBe(4);
    expect(phaseLabel(PHASES.CARD_4).streetNumber).toBe(5);
    expect(phaseLabel(PHASES.CARD_5).streetNumber).toBe(6);
    expect(TOTAL_BETTING_ROUNDS).toBe(6);
  });

  it("maps WAITING to street 0", () => {
    expect(phaseLabel(PHASES.WAITING).streetNumber).toBe(0);
  });

  it("returns a fallback label for unknown / nullish inputs", () => {
    expect(phaseLabel(undefined).streetNumber).toBe(0);
    expect(phaseLabel(null).streetNumber).toBe(0);
    expect(phaseLabel("").streetNumber).toBe(0);
    expect(phaseLabel("flop").streetNumber).toBe(0); // legacy Hold'em string
    expect(phaseLabel("card6").streetNumber).toBe(0); // out of range
  });

  it("produces non-empty short and long labels for every real phase", () => {
    [PHASES.PREFLOP, PHASES.CARD_1, PHASES.CARD_2, PHASES.CARD_3, PHASES.CARD_4, PHASES.CARD_5].forEach((p) => {
      const info = phaseLabel(p);
      expect(info.short.length).toBeGreaterThan(0);
      expect(info.long.length).toBeGreaterThan(0);
    });
  });
});

describe("isInHandPhase()", () => {
  it("is true for preflop and all five card phases", () => {
    [PHASES.PREFLOP, PHASES.CARD_1, PHASES.CARD_2, PHASES.CARD_3, PHASES.CARD_4, PHASES.CARD_5].forEach((p) => {
      expect(isInHandPhase(p)).toBe(true);
    });
  });

  it("is false for waiting and unknown values", () => {
    expect(isInHandPhase(PHASES.WAITING)).toBe(false);
    expect(isInHandPhase(undefined)).toBe(false);
    expect(isInHandPhase("flop")).toBe(false);
    expect(isInHandPhase("")).toBe(false);
  });
});
