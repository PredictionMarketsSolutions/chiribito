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
});
