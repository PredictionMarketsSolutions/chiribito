import { describe, it, expect } from "vitest";
import { speakingContext } from "./speaking-order";
import { PHASES } from "./phases";

describe("speakingContext()", () => {
  it("returns 'none' when no hand is in progress", () => {
    const ctx = speakingContext({
      phase: PHASES.WAITING,
      currentTurn: "A",
      lastRaiser: "",
      streetJustChanged: true
    });
    expect(ctx.reason).toBe("none");
    expect(ctx.label).toBe("");
  });

  it("returns 'none' when there is no current turn", () => {
    const ctx = speakingContext({
      phase: PHASES.CARD_2,
      currentTurn: "",
      lastRaiser: "A",
      streetJustChanged: true
    });
    expect(ctx.reason).toBe("none");
  });

  it("labels preflop as 'Abre el preflop' when the street just changed", () => {
    const ctx = speakingContext({
      phase: PHASES.PREFLOP,
      currentTurn: "A",
      lastRaiser: "",
      streetJustChanged: true
    });
    expect(ctx.reason).toBe("preflop_opener");
    expect(ctx.label).toContain("preflop");
  });

  it("labels post-preflop as 'Abre por última subida' when the last raiser opens", () => {
    const ctx = speakingContext({
      phase: PHASES.CARD_1,
      currentTurn: "C",
      lastRaiser: "C",
      streetJustChanged: true
    });
    expect(ctx.reason).toBe("last_raiser_opens");
    expect(ctx.label).toContain("subida");
  });

  it("labels as 'Abre por orden' when the last raiser is gone (fallback after dealer)", () => {
    const ctx = speakingContext({
      phase: PHASES.CARD_3,
      currentTurn: "B",
      lastRaiser: "", // raiser folded or never existed
      streetJustChanged: true
    });
    expect(ctx.reason).toBe("fallback_after_dealer");
    expect(ctx.label).toContain("orden");
  });

  it("labels as 'Abre por orden' when last raiser exists but is not the current speaker", () => {
    const ctx = speakingContext({
      phase: PHASES.CARD_2,
      currentTurn: "A",
      lastRaiser: "C",
      streetJustChanged: true
    });
    expect(ctx.reason).toBe("fallback_after_dealer");
  });

  it("labels mid-street action as 'Sigue la ronda'", () => {
    const ctx = speakingContext({
      phase: PHASES.CARD_2,
      currentTurn: "B",
      lastRaiser: "C",
      streetJustChanged: false
    });
    expect(ctx.reason).toBe("mid_street");
    expect(ctx.label).toContain("ronda");
  });

  it("always produces a non-empty long description for non-'none' reasons", () => {
    const cases: Array<Parameters<typeof speakingContext>[0]> = [
      { phase: PHASES.PREFLOP, currentTurn: "A", lastRaiser: "",  streetJustChanged: true },
      { phase: PHASES.CARD_2,  currentTurn: "B", lastRaiser: "B", streetJustChanged: true },
      { phase: PHASES.CARD_3,  currentTurn: "C", lastRaiser: "A", streetJustChanged: true },
      { phase: PHASES.CARD_1,  currentTurn: "A", lastRaiser: "A", streetJustChanged: false }
    ];
    cases.forEach((input) => {
      const ctx = speakingContext(input);
      expect(ctx.reason).not.toBe("none");
      expect(ctx.long.length).toBeGreaterThan(0);
    });
  });
});
