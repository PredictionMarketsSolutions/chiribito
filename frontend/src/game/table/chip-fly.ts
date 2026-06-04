/**
 * Chip-fly driver — animates physical chips sliding from an origin to the pot using the
 * pure profiles in `chip-motion.ts`. DOM/rAF glue only; all the physics is tested there.
 *
 * Honours reduced motion (no flying chips — the pot just updates). Always resolves and
 * always cleans up, even if rAF is throttled or unavailable (safety timeout).
 */
import { chipFlightTransform, chipBurstCount, type Point } from "./chip-motion";

export interface FlyChipsOptions {
  /** Bet amount → chip count via chipBurstCount. Ignored if `count` is given. */
  amount?: number;
  /** Explicit number of chips (overrides `amount`). */
  count?: number;
  durationMs?: number;
  staggerMs?: number;
  /** Denomination colour keys cycled across the burst (gold|night|green|burgundy). */
  colors?: string[];
  /** Injectable for tests; defaults to the prefers-reduced-motion media query. */
  reducedMotion?: boolean;
}

function prefersReducedMotion(): boolean {
  try {
    return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

const nowMs = (): number => (typeof performance !== "undefined" ? performance.now() : Date.now());

/**
 * Fly `count` (or chipBurstCount(amount)) chips from `from` to `to`, positioned by CSS
 * transform within `container` (which should be a positioned layer). Resolves when every
 * chip has settled into the pot and been removed.
 */
export function flyChips(container: HTMLElement, from: Point, to: Point, opts: FlyChipsOptions = {}): Promise<void> {
  const count = opts.count ?? chipBurstCount(opts.amount ?? 0);
  const reduced = opts.reducedMotion ?? prefersReducedMotion();
  if (count <= 0 || reduced) return Promise.resolve();

  const duration = opts.durationMs ?? 520;
  const stagger = opts.staggerMs ?? 70;
  const lift = 0.12;

  return new Promise<void>((resolve) => {
    const chips: { el: HTMLElement; delay: number; jitter: number }[] = [];
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className =
        opts.colors && opts.colors.length ? `chip-fly chip-fly--${opts.colors[i % opts.colors.length]}` : "chip-fly";
      el.setAttribute("aria-hidden", "true");
      const jitter = (i - (count - 1) / 2) * 7; // spread a burst so chips don't perfectly overlap
      el.style.transform = `translate(${from.x + jitter}px, ${from.y}px)`;
      container.appendChild(el);
      chips.push({ el, delay: i * stagger, jitter });
    }

    const start = nowMs();
    let raf = 0;
    let settled = false;
    const finish = (): void => {
      if (settled) return;
      settled = true;
      if (raf && typeof cancelAnimationFrame === "function") cancelAnimationFrame(raf);
      for (const { el } of chips) el.remove();
      resolve();
    };

    const tick = (): void => {
      const elapsed = nowMs() - start;
      let allDone = true;
      for (const { el, delay, jitter } of chips) {
        if (!el.isConnected) continue;
        const t = (elapsed - delay) / duration;
        if (t < 0) { allDone = false; continue; }
        if (t >= 1) { el.remove(); continue; }
        allDone = false;
        const s = chipFlightTransform(t, { x: from.x + jitter, y: from.y }, to, { lift });
        el.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.scale})`;
        el.style.opacity = t > 0.85 ? String(1 - (t - 0.85) / 0.15) : "1"; // fade as it merges into the pot
      }
      if (allDone) { finish(); return; }
      if (typeof requestAnimationFrame === "function") raf = requestAnimationFrame(tick);
    };
    if (typeof requestAnimationFrame === "function") raf = requestAnimationFrame(tick);

    // Safety net: guarantee cleanup + resolution even if rAF is throttled or missing.
    setTimeout(finish, duration + count * stagger + 140);
  });
}
