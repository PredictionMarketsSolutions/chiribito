import { suitGlyph } from "./suits";
import type { Identidad } from "./types";

/** Tiny DOM helper. */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function LacrePersonal(props: { identidad: Identidad; sizePx?: number }): HTMLElement {
  const { identidad, sizePx = 74 } = props;
  const seal = el("div", "lacre");
  seal.setAttribute("data-tone", identidad.waxTone);
  seal.style.width = `${sizePx}px`;
  seal.style.height = `${sizePx}px`;
  seal.style.transform = `rotate(${identidad.imperfection.rotateDeg}deg)`;
  seal.style.borderRadius = identidad.imperfection.radius;
  const glyph = suitGlyph(identidad.suit, Math.round(sizePx * 0.34));
  glyph.classList.add("lacre__glyph");
  seal.appendChild(glyph);
  seal.appendChild(el("span", "lacre__mono", identidad.monograma));
  return seal;
}

export function CarnetVivo(props: { identidad: Identidad; ultimaVez: string; socioNumero?: string }): HTMLElement {
  const { identidad, ultimaVez } = props;
  const socioNumero = props.socioNumero ?? String(1000 + (identidad.userId % 9000)); // cosmetic, stable
  const holder = el("div", "carnet-holder tilt");
  const face = el("div", "carnet-face");

  for (const pos of ["tl", "br"] as const) {
    const pip = el("div", `carnet-pip ${pos}`);
    pip.appendChild(suitGlyph(identidad.suit, 12));
    face.appendChild(pip);
  }

  face.appendChild(el("div", "carnet-house", `Casa Chiribito · Socio nº ${socioNumero}`));

  const hero = el("div", "carnet-hero");
  hero.appendChild(LacrePersonal({ identidad }));
  hero.appendChild(el("div", "carnet-name", identidad.username));
  hero.appendChild(el("div", "carnet-mote", `«${identidad.mote}»`));
  hero.appendChild(el("div", "carnet-rango", identidad.rango));
  face.appendChild(hero);

  const foot = el("div", "carnet-foot");
  foot.appendChild(el("span", "carnet-foot__pres", `Última vez en la mesa · ${ultimaVez}`));
  face.appendChild(foot);

  holder.appendChild(face);
  return holder;
}
