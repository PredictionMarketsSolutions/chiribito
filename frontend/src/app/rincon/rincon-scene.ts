import { decodeJWT, SecureStorage } from "../../security";
import { CarnetVivo, StatMarks, HistoriaStrip, CompartirRincon, PresenciaMesa } from "./components";
import { fetchMyRincon, fetchPuesto, type FetchLike } from "./data";
import { buildRinconViewModel } from "./identidad";
import type { RinconViewModel } from "./types";

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

export function renderRincon(container: HTMLElement, vm: RinconViewModel, opts: { gameUrl: string; onClose: () => void }): void {
  container.innerHTML = "";
  container.appendChild(topbar(opts.onClose));
  container.appendChild(CarnetVivo({ identidad: vm.identidad, ultimaVez: vm.ultimaVez }));
  container.appendChild(StatMarks(vm));
  container.appendChild(HistoriaStrip(vm));
  container.appendChild(CompartirRincon({ identidad: vm.identidad, gameUrl: opts.gameUrl }));
  container.appendChild(PresenciaMesa({ identidad: vm.identidad }));
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
    renderRincon(deps.content, vm, { gameUrl: deps.gameUrl, onClose: deps.onClose });
  } catch (e) {
    deps.log(`Rincón error: ${e instanceof Error ? e.message : String(e)}`);
    renderRinconError(deps.content, () => void openRincon(deps));
  }
}
