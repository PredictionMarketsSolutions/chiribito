import { describe, it, expect } from "vitest";
import {
  getSuit, getMonograma, getWaxTone, getImperfection,
  getRango, getMote, winRate, formatSocioDesde, formatUltimaVez,
  buildRinconViewModel,
} from "./identidad";
import type { MeResponse } from "./types";

describe("identity generators (deterministic)", () => {
  it("maps userId to a stable suit", () => {
    expect(getSuit(0)).toBe("O");
    expect(getSuit(1)).toBe("C");
    expect(getSuit(2)).toBe("E");
    expect(getSuit(3)).toBe("B");
    expect(getSuit(7)).toBe(getSuit(7));
    expect(getSuit(7)).toBe("B");
  });

  it("derives a monogram, with a fallback", () => {
    expect(getMonograma("lucia")).toBe("L");
    expect(getMonograma("  ana")).toBe("A");
    expect(getMonograma("")).toBe("?");
  });

  it("picks a wax tone stably", () => {
    expect(getWaxTone(0)).toBe("oro");
    expect(getWaxTone(7)).toBe(getWaxTone(7));
  });

  it("produces a deterministic imperfection within bounds", () => {
    const a = getImperfection(7);
    expect(a).toEqual(getImperfection(7));
    expect(a.rotateDeg).toBeGreaterThanOrEqual(-8);
    expect(a.rotateDeg).toBeLessThanOrEqual(6);
    expect(a.radius).toMatch(/%/);
  });

  it("maps games_played to the neutral castizo ladder", () => {
    expect(getRango(0)).toBe("Cara nueva");
    expect(getRango(5)).toBe("De paso");
    expect(getRango(20)).toBe("De la parroquia");
    expect(getRango(80)).toBe("Habitual de la Casa");
    expect(getRango(200)).toBe("Veteranía de la Casa");
    expect(getRango(900)).toBe("Leyenda de la Casa");
  });

  it("derives a stable mote that can reference the suit", () => {
    expect(getMote(7, "O")).toBe(getMote(7, "O"));
    expect(typeof getMote(7, "O")).toBe("string");
    expect(getMote(7, "O").length).toBeGreaterThan(0);
    expect(getMote(0, "C")).toBe("La Sota de Copas"); // exercises the {palo} substitution
  });

  it("computes win rate, null when nothing played", () => {
    expect(winRate(0, 0)).toBeNull();
    expect(winRate(142, 38)).toBe(27);
    expect(winRate(1, 2)).toBe(100); // clamped — never report >100%
  });

  it("formats socio-desde and última-vez honestly", () => {
    expect(formatSocioDesde("2026-03-01T00:00:00Z")).toBe("marzo 2026");
    expect(formatSocioDesde("not-a-date")).toBe("—");
    const now = new Date("2026-05-20T12:00:00Z");
    expect(formatUltimaVez(null, now)).toBe("—");
    expect(formatUltimaVez("2026-05-19T20:00:00Z", now)).toBe("anoche");
    expect(formatUltimaVez("2026-05-17T12:00:00Z", now)).toBe("hace 3 días");
  });

  it("composes a full view model and flags empty", () => {
    const me: MeResponse = {
      id: 7, username: "lucia", createdAt: "2026-03-01T00:00:00Z",
      gamesPlayed: 142, gamesWon: 38, totalChipsWon: 18420, lastPlayedAt: "2026-05-19T20:00:00Z",
    };
    const vm = buildRinconViewModel(me, 7, new Date("2026-05-20T12:00:00Z"));
    expect(vm.identidad.suit).toBe("B");
    expect(vm.winRate).toBe(27);
    expect(vm.puesto).toBe(7);
    expect(vm.socioDesde).toBe("marzo 2026");
    expect(vm.isEmpty).toBe(false);

    const fresh = buildRinconViewModel({ ...me, gamesPlayed: 0, gamesWon: 0, lastPlayedAt: null }, null);
    expect(fresh.isEmpty).toBe(true);
    expect(fresh.winRate).toBeNull();
    expect(fresh.identidad.rango).toBe("Cara nueva");
  });
});
