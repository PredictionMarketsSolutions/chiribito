/**
 * Static resting tilt for the local player's hole cards on the mobile DOM path.
 *
 * Desktop (Pixi) already lets hole cards settle at a deterministic "placed by a
 * hand" angle via `restingRotationFor` (TableScene). Mobile renders the hole cards
 * as DOM nodes that sat at a sterile, perfectly-flat 0deg — none of that materiality.
 * This brings the SAME resting angle to the DOM hand row: pure physical presence.
 *
 * Why STATIC (no settle animation): materiality > spectacle. A card at rest is a
 * STATE, not an animation — it carries weight without ever moving, so it cannot read
 * app-y / snappy / gamey and needs no reduced-motion guard. Deterministic per card
 * index (reuses `restingRotationFor`), so a keyed re-render / reconnect re-applies the
 * exact same angle and never jitters. Transforms only; the community/board row is
 * never passed here, so the board stays 0deg. Applied synchronously right after
 * `renderCardRow`, so a freshly-created node is born already tilted — no `.card`
 * `transition: transform` fires, so there is no spring overshoot: a clean rest, not
 * a settle.
 */
import { restingRotationFor } from "./game/table/deal-motion";

const RAD_TO_DEG = 180 / Math.PI;

// The local player always sees their own hand in the same on-screen zone, so a
// single fixed visual slot yields a stable, characterful pair of lean angles
// (mirrors how each desktop seat owns one fixed lean).
const LOCAL_HOLE_VISUAL_SLOT = 0;

/**
 * Deterministic resting angle (degrees) for the local hole card at `cardIndex`
 * (0 | 1). Bounded by the conservative HOLE_REST_ROT_MAX (~1.5deg). Pure.
 */
export function holeCardRestDegrees(cardIndex: number): number {
  return restingRotationFor(LOCAL_HOLE_VISUAL_SLOT, cardIndex) * RAD_TO_DEG;
}

/**
 * Apply the static resting tilt to each card in the local hole-card row. Idempotent
 * + deterministic: re-applying on a keyed re-render sets the identical angle, so
 * reconnect/resync never jitters. Pivots on the card centre so the <=1.5deg tilt adds
 * no vertical drift that could hurt legibility.
 */
export function applyHoleCardRest(rowEl: HTMLElement): void {
  for (let i = 0; i < rowEl.children.length; i += 1) {
    const node = rowEl.children[i] as HTMLElement;
    node.style.transformOrigin = "center";
    node.style.transform = `rotate(${holeCardRestDegrees(i).toFixed(3)}deg)`;
  }
}
