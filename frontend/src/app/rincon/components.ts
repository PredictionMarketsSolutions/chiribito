import { suitGlyph } from "./suits";
import type { Identidad, RinconViewModel } from "./types";

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
  seal.appendChild(el("span", "lacre__shine")); // light-catch layer (CSS-driven)
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
  const stage = el("div", "carnet-stage");
  stage.appendChild(holder);
  return stage;
}

function statTile(value: string, label: string, countup?: { target: number; format: "int" | "pct" | "chips" }): HTMLElement {
  const t = el("div", "stat");
  const v = el("div", "stat__v", value);
  if (countup) {
    v.dataset.countup = String(countup.target);
    v.dataset.countupFormat = countup.format;
  }
  t.appendChild(v);
  t.appendChild(el("div", "stat__k", label));
  return t;
}

export function formatChips(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function StatMarks(vm: RinconViewModel): HTMLElement {
  const sec = el("div", "rincon-sec");
  sec.appendChild(el("div", "rincon-sec__t", "La hoja del socio"));
  const grid = el("div", "statg");
  grid.appendChild(statTile(String(vm.gamesPlayed), "Manos", { target: vm.gamesPlayed, format: "int" }));
  grid.appendChild(statTile(String(vm.gamesWon), "Ganadas", { target: vm.gamesWon, format: "int" }));
  grid.appendChild(statTile(vm.winRate == null ? "—" : `${vm.winRate}%`, "Victorias",
    vm.winRate == null ? undefined : { target: vm.winRate, format: "pct" }));
  grid.appendChild(statTile(formatChips(vm.totalChipsWon), "Fichas", { target: vm.totalChipsWon, format: "chips" }));
  sec.appendChild(grid);

  const puesto = el("div", "stat-puesto");
  if (vm.puesto == null) {
    puesto.appendChild(el("span", "stat-puesto__txt", "Sin clasificar aún"));
  } else {
    const v = el("span", "stat-puesto__v", `#${vm.puesto}`);
    v.dataset.countup = String(vm.puesto);
    v.dataset.countupFormat = "rank";
    puesto.appendChild(v);
    puesto.appendChild(el("span", "stat-puesto__txt", "en la casa"));
  }
  sec.appendChild(puesto);
  return sec;
}

export function HistoriaStrip(vm: RinconViewModel): HTMLElement {
  const sec = el("div", "rincon-sec");
  sec.appendChild(el("div", "rincon-sec__t", "Tu historia"));
  if (vm.isEmpty) {
    sec.appendChild(el("p", "hist__real", "Tu historia está por escribirse. Siéntate a una mesa."));
  } else {
    const real = el("p", "hist__real");
    real.innerHTML = `Socio desde <b>${vm.socioDesde}</b> · última mesa <b>${vm.ultimaVez}</b>`;
    sec.appendChild(real);
  }
  const ghosts = el("div", "hist__ghosts");
  ghosts.appendChild(el("div", "ghost real", "★"));
  for (let i = 0; i < 3; i++) ghosts.appendChild(el("div", "ghost", "·"));
  ghosts.appendChild(el("span", "hist__soon", "rachas y manos memorables, pronto…"));
  sec.appendChild(ghosts);
  return sec;
}

export function CompartirRincon(props: { identidad: Identidad; gameUrl: string }): HTMLElement {
  const { identidad, gameUrl } = props;
  const blurb = `Soy «${identidad.mote}», ${identidad.rango} en Chiribito. Échate una mano: ${gameUrl}`;
  const btn = el("button", "share-quiet", "⤴ compartir mi rincón");
  btn.type = "button";
  btn.dataset.blurb = blurb;
  btn.addEventListener("click", async () => {
    try {
      const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
      if (nav.share) await nav.share({ text: blurb });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(blurb);
        btn.textContent = "copiado ✓";
        setTimeout(() => { btn.textContent = "⤴ compartir mi rincón"; }, 1800);
      }
    } catch {
      /* user dismissed share sheet — no-op */
    }
  });
  return btn;
}

export function PresenciaMesa(props: { identidad: Identidad }): HTMLElement {
  const { identidad } = props;
  const sec = el("div", "rincon-sec");
  sec.appendChild(el("div", "rincon-sec__t", "En la mesa apareces así"));
  const mesa = el("div", "mesa");
  const seat = el("div", "mesa__seat");
  seat.appendChild(LacrePersonal({ identidad, sizePx: 44 }));
  mesa.appendChild(seat);
  const info = el("div", "mesa__info");
  info.appendChild(el("div", "mesa__nm", identidad.username));
  info.appendChild(el("div", "mesa__sub", `«${identidad.mote}»`));
  mesa.appendChild(info);
  sec.appendChild(mesa);
  return sec;
}
