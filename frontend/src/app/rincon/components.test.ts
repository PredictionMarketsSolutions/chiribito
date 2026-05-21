import { describe, it, expect } from "vitest";
import { LacrePersonal, CarnetVivo } from "./components";
import type { Identidad } from "./types";

const identidad: Identidad = {
  userId: 7, username: "lucia", suit: "O", monograma: "L", waxTone: "oro",
  imperfection: { rotateDeg: -7, radius: "49% 51% 52% 48% / 51% 49% 52% 48%" },
  mote: "La Sota de Oros", rango: "Veteranía de la Casa",
};

describe("LacrePersonal", () => {
  it("renders a seal with tone, monogram and a suit glyph", () => {
    const el = LacrePersonal({ identidad, sizePx: 74 });
    expect(el.classList.contains("lacre")).toBe(true);
    expect(el.getAttribute("data-tone")).toBe("oro");
    expect(el.querySelector(".lacre__mono")?.textContent).toBe("L");
    expect(el.querySelector('[data-suit="O"]')).not.toBeNull();
  });
});

describe("CarnetVivo", () => {
  it("renders name, mote and rango", () => {
    const el = CarnetVivo({ identidad, ultimaVez: "anoche" });
    expect(el.querySelector(".carnet-name")?.textContent).toBe("lucia");
    expect(el.querySelector(".carnet-mote")?.textContent).toContain("La Sota de Oros");
    expect(el.querySelector(".carnet-rango")?.textContent).toBe("Veteranía de la Casa");
    expect(el.querySelector(".carnet-foot")?.textContent).toContain("anoche");
    expect(el.querySelector(".lacre")).not.toBeNull();
  });
  it("wraps the holder in a stage and includes a lacre shine layer", () => {
    const el = CarnetVivo({ identidad, ultimaVez: "anoche" });
    expect(el.classList.contains("carnet-stage")).toBe(true);
    expect(el.querySelector(".carnet-holder")).not.toBeNull();
    expect(el.querySelector(".lacre__shine")).not.toBeNull();
  });
});

import { StatMarks, HistoriaStrip, CompartirRincon, PresenciaMesa } from "./components";
import type { RinconViewModel } from "./types";

const vm: RinconViewModel = {
  identidad,
  gamesPlayed: 142, gamesWon: 38, winRate: 27, totalChipsWon: 18420, puesto: 7,
  socioDesde: "marzo 2026", ultimaVez: "anoche", isEmpty: false,
};

describe("StatMarks", () => {
  it("renders the 2x2 core grid with count-up data attributes", () => {
    const s = StatMarks(vm);
    expect(s.querySelector('[data-countup="142"]')).not.toBeNull();   // Manos
    expect(s.querySelector('[data-countup-format="chips"]')).not.toBeNull(); // Fichas
    expect(s.textContent).toContain("142");
  });
  it("shows '—' for null winRate and an explicit Puesto element", () => {
    expect(StatMarks(vm).querySelector(".stat-puesto")?.textContent).toContain("#7");
    const empty = StatMarks({ ...vm, gamesPlayed: 0, gamesWon: 0, winRate: null, puesto: null });
    expect(empty.textContent).toContain("—");
    expect(empty.querySelector(".stat-puesto")?.textContent?.toLowerCase()).toContain("sin clasificar");
  });
});

describe("HistoriaStrip", () => {
  it("shows real recency + a future teaser, never fake entries", () => {
    const h = HistoriaStrip(vm);
    expect(h.textContent).toContain("marzo 2026");
    expect(h.textContent?.toLowerCase()).toContain("pronto");
  });
  it("shows the day-one invitation when empty", () => {
    expect(HistoriaStrip({ ...vm, isEmpty: true }).textContent).toContain("por escribirse");
  });
});

describe("CompartirRincon", () => {
  it("builds a quiet affordance with a non-personal blurb", () => {
    const c = CompartirRincon({ identidad, gameUrl: "https://play.chiribito.com" });
    expect(c.classList.contains("share-quiet")).toBe(true);
    expect(c.dataset.blurb).toContain("La Sota de Oros");
    expect(c.dataset.blurb).toContain("https://play.chiribito.com");
  });
});

describe("PresenciaMesa", () => {
  it("previews the seat mark with name + mote", () => {
    const m = PresenciaMesa({ identidad });
    expect(m.querySelector(".mesa__nm")?.textContent).toContain("lucia");
    expect(m.querySelector(".lacre")).not.toBeNull();
  });
});
