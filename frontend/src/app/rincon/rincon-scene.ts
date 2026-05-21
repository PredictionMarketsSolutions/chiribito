import { decodeJWT, SecureStorage } from "../../security";
import { CarnetVivo, StatMarks, HistoriaStrip, CompartirRincon, PresenciaMesa, formatCountup } from "./components";
import { applyRevealOrder, attachCarnetTilt, attachLacreShine, runCountUp } from "./interactions";
import { fetchMyRincon, fetchPuesto, type FetchLike } from "./data";
import { buildRinconViewModel } from "./identidad";
import type { RinconViewModel, CountupFormat } from "./types";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function setRinconOverlayVisible(overlay: HTMLElement, visible: boolean): void {
  overlay.classList.toggle("hidden", !visible);
}

function topbar(onClose: () => void): HTMLElement {
  const top = el("header", "rincon-top");
  const back = el("button", "rincon-top__back", "‹");
  back.type = "button";
  back.setAttribute("aria-label", "Volver al lobby");
  back.addEventListener("click", onClose);
  top.appendChild(back);
  top.appendChild(el("div", "rincon-top__title", "Mi Rincón"));
  top.appendChild(el("div", "rincon-top__spacer"));
  return top;
}

export function renderRincon(
  container: HTMLElement,
  vm: RinconViewModel,
  opts: { gameUrl: string; onClose: () => void; playOpenCue?: () => void },
): void {
  container.innerHTML = "";
  const top = topbar(opts.onClose);
  const carnet = CarnetVivo({ identidad: vm.identidad, ultimaVez: vm.ultimaVez });

  const ledger = el("div", "rincon-ledger");
  const sections = [
    StatMarks(vm),
    HistoriaStrip(vm),
    CompartirRincon({ identidad: vm.identidad, gameUrl: opts.gameUrl }),
    PresenciaMesa({ identidad: vm.identidad }),
  ];
  sections.forEach((s) => ledger.appendChild(s));

  container.appendChild(top);
  container.appendChild(carnet);
  container.appendChild(ledger);

  // Ceremony: stamp reveal order on the top-level hero elements and the ledger's sections.
  applyRevealOrder([top, carnet]);
  applyRevealOrder(sections);

  // Life: pointer tilt on the carnet holder, idle/bloom shine on the lacre.
  const holder = carnet.querySelector<HTMLElement>(".carnet-holder");
  if (holder) attachCarnetTilt(holder);
  const shine = carnet.querySelector<HTMLElement>(".lacre__shine");
  if (shine) attachLacreShine(shine);

  // Inscription: count up every numeric stat to its real value (format-preserving).
  container.querySelectorAll<HTMLElement>("[data-countup]").forEach((node) => {
    const target = Number(node.dataset.countup);
    const fmt = (node.dataset.countupFormat ?? "int") as CountupFormat;
    if (!Number.isNaN(target)) runCountUp(node, target, (n) => formatCountup(n, fmt));
  });

  opts.playOpenCue?.();
}

export function renderRinconLoading(container: HTMLElement): void {
  container.innerHTML = "";
  const wrap = el("div", "rincon-loading");
  wrap.appendChild(el("div", "rincon-loading__seal"));
  wrap.appendChild(el("p", "rincon-loading__txt", "Abriendo tu rincón…"));
  container.appendChild(wrap);
}

export function renderRinconError(container: HTMLElement, onRetry: () => void): void {
  container.innerHTML = "";
  const wrap = el("div", "rincon-error");
  wrap.appendChild(el("p", undefined, "No pudimos cargar tus marcas."));
  const btn = el("button", undefined, "Reintentar");
  btn.type = "button";
  btn.addEventListener("click", onRetry);
  wrap.appendChild(btn);
  container.appendChild(wrap);
}

export interface OpenRinconDeps {
  overlay: HTMLElement;
  content: HTMLElement;
  apiUrl: string;
  fetchFn: FetchLike;
  gameUrl: string;
  log: (msg: string) => void;
  onClose: () => void;
  playOpenCue?: () => void;
}

/** Open the scene, fetch data, render. Identity is client-derived so it never fully fails. */
export async function openRincon(deps: OpenRinconDeps): Promise<void> {
  setRinconOverlayVisible(deps.overlay, true);
  renderRinconLoading(deps.content);

  const token = SecureStorage.getAccessToken();
  const payload = token ? decodeJWT(token) : null;
  const userId = Number(payload?.userId);
  if (!token || !payload || Number.isNaN(userId)) {
    renderRinconError(deps.content, () => void openRincon(deps));
    return;
  }

  const dataDeps = { apiUrl: deps.apiUrl, fetchFn: deps.fetchFn, getToken: () => token, log: deps.log };
  try {
    const [me, puesto] = await Promise.all([fetchMyRincon(dataDeps), fetchPuesto(dataDeps, userId)]);
    const vm = buildRinconViewModel(me, puesto);
    renderRincon(deps.content, vm, { gameUrl: deps.gameUrl, onClose: deps.onClose, playOpenCue: deps.playOpenCue });
  } catch (e) {
    deps.log(`Rincón error: ${e instanceof Error ? e.message : String(e)}`);
    renderRinconError(deps.content, () => void openRincon(deps));
  }
}
