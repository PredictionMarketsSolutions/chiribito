/**
 * DOM card-reveal flip — the mobile (DOM path) counterpart of the Pixi L2a flip.
 *
 * Same gesture ("a hand turns a card over"), same shared curve (`flipState` +
 * `flipEaseInOut` from reveal-motion.ts), but MORE SOBER on mobile: a gentler
 * width floor so the card never goes razor edge-on. Transforms only — a single
 * `scaleX` turn pivoting on the card's vertical centre, with one texture swap at
 * the midpoint. No rotation (board stays 0deg), no layout, no bounce, no overshoot.
 *
 * Respects `prefers-reduced-motion` (renders the face instantly). Self-cancels if
 * the node detaches mid-flip (a re-render/reset never leaves a stuck edge-on card)
 * — the DOM analogue of the L2a "no flip on reconnect-resync" cancel-safety.
 */
import { flipState, flipEaseInOut, FLIP_DURATION } from "./game/table/reveal-motion";
import { CARD_BACK_URL, getCardTextureUrl } from "./card-texture-url";

// Mobile sobriety dial (tuning knobs for the perceptual gate):
//   duration: same calm pace as desktop (not snappier — snappy reads "app-y").
//   floor:    higher than desktop's 0.05 so the turn stays gentle, never a
//             razor edge-on "card trick". This is the "more sober than desktop".
export const MOBILE_FLIP_DURATION_MS = FLIP_DURATION * 1000; // 300ms
export const MOBILE_FLIP_MIN_WIDTH_FACTOR = 0.16;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/**
 * Turn `node` (a freshly created FACE card) over from its back. Returns a cancel
 * function that finalizes immediately to the face and clears the inline styles.
 */
export function flipRevealDomCard(node: HTMLElement, faceId: string): () => void {
  const img = node.querySelector("img");
  if (!img || prefersReducedMotion()) {
    return () => {}; // reduced motion / no image: the node is already the face — leave it.
  }

  const faceSrc = getCardTextureUrl(faceId);

  // Start on the back. Kill the .card CSS transition with !important — it carries
  // an ease-spring (cubic-bezier overshoot 1.56) that would otherwise chase every
  // per-frame scaleX and overshoot past the floor into a bounce. The rAF must be
  // the sole driver, so the turn is exactly flipState — no bounce, no spring.
  node.style.setProperty("transition", "none", "important");
  node.style.transformOrigin = "center";
  node.style.transform = "scaleX(1)";
  node.classList.add("card-back");
  img.src = CARD_BACK_URL;

  let swapped = false;
  let rafId = 0;
  let cancelled = false;
  const start = now();

  const showFace = (): void => {
    if (!swapped) {
      node.classList.remove("card-back");
      img.src = faceSrc;
      swapped = true;
    }
  };

  const finalize = (): void => {
    showFace();
    node.style.transform = "";
    node.style.transformOrigin = "";
    node.style.removeProperty("transition");
  };

  const cancel = (): void => {
    if (cancelled) return;
    cancelled = true;
    if (rafId) cancelAnimationFrame(rafId);
    finalize();
  };

  const tick = (): void => {
    if (cancelled) return;
    if (!node.isConnected) {
      cancel(); // re-rendered / reset out from under us — abandon cleanly.
      return;
    }
    const t = Math.min(1, (now() - start) / MOBILE_FLIP_DURATION_MS);
    const { widthFactor, showFront } = flipState(flipEaseInOut(t), MOBILE_FLIP_MIN_WIDTH_FACTOR);
    node.style.transform = `scaleX(${widthFactor})`;
    if (showFront) showFace();
    if (t < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      finalize();
    }
  };

  rafId = requestAnimationFrame(tick);
  return cancel;
}
