/** Single source of truth for the reduced-motion gate. Safe when window/matchMedia absent. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Eased (easeOutCubic), rounded value of a count-up at progress t in [0,1]. Never overshoots. */
export function countUpValueAt(target: number, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  const eased = 1 - Math.pow(1 - clamped, 3);
  return Math.round(target * eased);
}

/** Map a pointer position inside a rect to a clamped 3D tilt (degrees). Centre = flat. */
export function tiltFromPointer(
  px: number, py: number,
  rect: { left: number; top: number; width: number; height: number },
  maxDeg = 7,
): { rotateX: number; rotateY: number } {
  const nx = rect.width ? (px - (rect.left + rect.width / 2)) / (rect.width / 2) : 0;
  const ny = rect.height ? (py - (rect.top + rect.height / 2)) / (rect.height / 2) : 0;
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  return { rotateY: clamp(nx) * maxDeg || 0, rotateX: -clamp(ny) * maxDeg || 0 };
}

/** Stagger helper: stamp an incremental --reveal-i custom property for CSS animation-delay. */
export function applyRevealOrder(elements: HTMLElement[]): void {
  elements.forEach((el, i) => el.style.setProperty("--reveal-i", String(i)));
}

/** Animate a numeric count-up into an element, formatting every frame. Honest: ends on format(target). */
export function runCountUp(
  el: HTMLElement,
  target: number,
  format: (n: number) => string,
  opts: { durationMs?: number; reducedMotion?: boolean } = {},
): void {
  const reduced = opts.reducedMotion ?? prefersReducedMotion();
  if (reduced || target <= 0) { el.textContent = format(target); return; }
  const duration = opts.durationMs ?? 700;
  const start = performance.now();
  const step = (now: number) => {
    const t = (now - start) / duration;
    if (t >= 1) { el.textContent = format(target); return; }
    el.textContent = format(countUpValueAt(target, t));
    requestAnimationFrame(step);
  };
  el.textContent = format(0);
  requestAnimationFrame(step);
}

/** Pointer-driven 3D tilt on the carnet holder. Sets --tiltX/--tiltY (deg) consumed by CSS. */
export function attachCarnetTilt(holder: HTMLElement, opts: { reducedMotion?: boolean } = {}): void {
  // Reduced motion: leave the holder flat. No reset needed — a fresh node has no tilt vars set.
  if (opts.reducedMotion ?? prefersReducedMotion()) return;
  const onMove = (e: PointerEvent) => {
    const rect = holder.getBoundingClientRect();
    const { rotateX, rotateY } = tiltFromPointer(e.clientX, e.clientY, rect, 7);
    holder.style.setProperty("--tiltX", `${rotateX.toFixed(2)}deg`);
    holder.style.setProperty("--tiltY", `${rotateY.toFixed(2)}deg`);
  };
  const reset = () => { holder.style.setProperty("--tiltX", "0deg"); holder.style.setProperty("--tiltY", "0deg"); };
  holder.addEventListener("pointermove", onMove);
  holder.addEventListener("pointerleave", reset);
}

/** A slow idle drift + a one-time bloom on the lacre's specular highlight. */
export function attachLacreShine(shine: HTMLElement, opts: { reducedMotion?: boolean } = {}): void {
  if (opts.reducedMotion ?? prefersReducedMotion()) { shine.style.opacity = "0.5"; return; }
  shine.classList.add("lacre__shine--alive"); // CSS owns the drift + bloom keyframes
}
