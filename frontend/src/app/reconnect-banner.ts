/**
 * Move 2 — Slice C: the reconnect banner controller.
 *
 * The user constraint: extremely discreet UX. No modal, no overlay.
 * If reconnect succeeds in <250 ms the banner never appears at all
 * (debounced first-show). If it takes longer, the banner fades in
 * with the attempt counter; once `idle` is emitted by the director
 * the banner hides instantly. Degraded state surfaces a final
 * message before the lobby takes over.
 */

export type BannerPhase = "idle" | "trying" | "degraded";

export type ReconnectBannerDeps = {
  bannerEl: HTMLElement;
  textEl: HTMLElement;
  /** ms in `trying` before the banner first becomes visible. Default 250. */
  showAfterMs?: number;
  /** Total maxAttempts, used in the recovering copy. */
  maxAttempts: number;
};

export type ReconnectBanner = {
  apply: (state: { attempt: number; max: number; phase: BannerPhase }) => void;
  /** For tests. */
  isVisible: () => boolean;
};

export function createReconnectBanner(deps: ReconnectBannerDeps): ReconnectBanner {
  let showTimer: ReturnType<typeof setTimeout> | null = null;
  const showAfter = deps.showAfterMs ?? 250;

  function show(text: string, degraded: boolean): void {
    deps.textEl.textContent = text;
    deps.bannerEl.classList.toggle("reconnect-banner--degraded", degraded);
    deps.bannerEl.classList.remove("reconnect-banner--hidden");
  }
  function hide(): void {
    if (showTimer !== null) { clearTimeout(showTimer); showTimer = null; }
    deps.bannerEl.classList.add("reconnect-banner--hidden");
    deps.bannerEl.classList.remove("reconnect-banner--degraded");
  }

  return {
    apply: ({ attempt, max, phase }) => {
      if (phase === "idle") {
        hide();
        return;
      }
      if (phase === "degraded") {
        if (showTimer !== null) { clearTimeout(showTimer); showTimer = null; }
        show("Conexión perdida — volviendo al lobby", true);
        return;
      }
      // trying
      const copy = `Reconectando… intento ${attempt}/${max}`;
      if (!deps.bannerEl.classList.contains("reconnect-banner--hidden")) {
        // Already visible — just update text live as attempts advance.
        show(copy, false);
        return;
      }
      if (showTimer !== null) return; // already scheduled
      showTimer = setTimeout(() => {
        showTimer = null;
        show(copy, false);
      }, showAfter);
    },
    isVisible: () => !deps.bannerEl.classList.contains("reconnect-banner--hidden"),
  };
}
