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
