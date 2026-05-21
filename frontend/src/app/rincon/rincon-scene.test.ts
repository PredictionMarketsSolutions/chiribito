import { describe, it, expect, vi } from "vitest";
import { renderRincon, renderRinconLoading, renderRinconError, setRinconOverlayVisible } from "./rincon-scene";
import type { RinconViewModel } from "./types";

const vm: RinconViewModel = {
  identidad: { userId: 7, username: "lucia", suit: "O", monograma: "L", waxTone: "oro",
    imperfection: { rotateDeg: -7, radius: "49% 51% 52% 48% / 51% 49% 52% 48%" }, mote: "La Sota de Oros", rango: "Veteranía de la Casa" },
  gamesPlayed: 142, gamesWon: 38, winRate: 27, totalChipsWon: 18420, puesto: 7,
  socioDesde: "marzo 2026", ultimaVez: "anoche", isEmpty: false,
};

describe("rincon scene", () => {
  it("toggles overlay visibility via the hidden class", () => {
    const ov = document.createElement("div");
    ov.classList.add("hidden");
    setRinconOverlayVisible(ov, true);
    expect(ov.classList.contains("hidden")).toBe(false);
    setRinconOverlayVisible(ov, false);
    expect(ov.classList.contains("hidden")).toBe(true);
  });

  it("renders the full rincon inside a ledger and stamps reveal order", () => {
    const c = document.createElement("div");
    renderRincon(c, vm, { gameUrl: "https://play.chiribito.com", onClose: vi.fn() });
    expect(c.querySelector(".carnet-name")?.textContent).toBe("lucia");
    expect(c.querySelector(".rincon-ledger")).not.toBeNull();
    expect(c.textContent).toContain("La hoja del socio");
    expect((c.querySelector(".carnet-stage") as HTMLElement | null)?.style.getPropertyValue("--reveal-i")).not.toBe("");
  });

  it("plays the open cue once on a successful render path", () => {
    const c = document.createElement("div");
    const cue = vi.fn();
    renderRincon(c, vm, { gameUrl: "https://play.chiribito.com", onClose: vi.fn(), playOpenCue: cue });
    expect(cue).toHaveBeenCalledTimes(1);
  });

  it("renders loading and error with a retry", () => {
    const c = document.createElement("div");
    renderRinconLoading(c);
    expect(c.querySelector(".rincon-loading")).not.toBeNull();
    const onRetry = vi.fn();
    renderRinconError(c, onRetry);
    (c.querySelector(".rincon-error button") as HTMLButtonElement).click();
    expect(onRetry).toHaveBeenCalled();
  });

  it("count-up renders the final formatted value (reduced-motion path)", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q,
      addEventListener() {}, removeEventListener() {} }));
    const c = document.createElement("div");
    renderRincon(c, vm, { gameUrl: "https://play.chiribito.com", onClose: vi.fn() });
    expect(c.querySelector(".stat-puesto__v")?.textContent).toBe("#7");
    vi.unstubAllGlobals();
  });
});
