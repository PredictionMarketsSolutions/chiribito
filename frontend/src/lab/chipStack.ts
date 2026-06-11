/**
 * Chiribito · Mesa Lab — deterministic chip-instance layout.
 *
 * Pure layout helpers (no R3F / three imports) consumed by InstancedChipStack in
 * TableLab.tsx. Mirrors the cards.ts sibling-module convention: pure exported
 * functions + constants, fully unit-testable.
 *
 * Visual-parity contract:
 *   chipStackLayout(count, position) reproduces the EXACT per-chip jitter seeds
 *   from the pre-instancing ChipStack (Math.sin(i*2.3)*0.012, Math.cos(i*1.7)*0.012,
 *   body Y = i*H) so the hand-stacked look is byte-equivalent after instancing.
 *
 * Alignment-break:
 *   CHIP_ROT_SEED = 0.37 (was 0.55). The cream-insert pattern has angular period
 *   2π/10 ≈ 0.628 rad. 0.55/0.628 ≈ 0.876 (near-rational → column alignment).
 *   0.37/0.628 ≈ 0.589 (non-near-rational → spiral irregularity, no alignment).
 *
 * Bottom face:
 *   Absent by construction. Only bodyPos + facePos (TOP face) are in the layout.
 *   The never-seen bottom face is dropped entirely (SSOT §TP3 perf target).
 */

/** Chip thickness — matches the H = 0.1 constant in TableLab.tsx. */
export const CHIP_H = 0.1;

/**
 * Rotation-Y seed per chip in the stack.
 * 0.37 breaks the deterministic 10-group cream-insert phase-alignment:
 *   0.37 / (2*PI/10) ≈ 0.589 — not near a half-integer → cream inserts spiral
 *   irregularly rather than column-aligning.
 * Was 0.55 (0.55 / 0.628 ≈ 0.876 ≈ near-rational → visible column pattern).
 */
export const CHIP_ROT_SEED = 0.37;

/** One entry in the instanced chip-stack layout. */
export interface ChipInstanceData {
  /** Centre of the chip body — same X/Z as the pre-instancing ChipStack jitter. */
  bodyPos: [number, number, number];
  /** Centre of the TOP face — H/2 + 0.002 above bodyPos in Y, same X/Z. */
  facePos: [number, number, number];
  /** Y-axis rotation in radians (i * CHIP_ROT_SEED). */
  rotY: number;
}

/**
 * Deterministic per-instance layout for a chip stack.
 *
 * Reproduces the EXACT pre-instancing ChipStack jitter seeds so the hand-stacked
 * look is byte-equivalent (visual-parity contract for TP3 instancing).
 *
 * Only body + TOP face entries are returned. The bottom face is absent (dropped).
 *
 * @param count  Number of chips in the stack. Returns [] for count <= 0.
 * @param position  Base world position of the stack [x, y, z]. The y component is
 *                  the bottom of the first chip (i=0 body centre).
 */
export function chipStackLayout(
  count: number,
  position: [number, number, number],
): ChipInstanceData[] {
  if (count <= 0) return [];

  const [px, py, pz] = position;
  const result: ChipInstanceData[] = [];

  for (let i = 0; i < count; i++) {
    // Pre-instancing jitter seeds — byte-equivalent to:
    //   ChipStack: jx = Math.sin(i*2.3)*0.012, jz = Math.cos(i*1.7)*0.012
    //   position: [px + jx, py + i*H, pz + jz]
    const jx = Math.sin(i * 2.3) * 0.012;
    const jz = Math.cos(i * 1.7) * 0.012;

    const bx = px + jx;
    const by = py + i * CHIP_H;
    const bz = pz + jz;

    result.push({
      bodyPos: [bx, by, bz],
      // TOP face sits H/2 + 0.002 above the body centre — matches Chip component:
      //   position={[0, H/2 + 0.002, 0]} rotation={[-Math.PI/2, 0, 0]}
      facePos: [bx, by + CHIP_H / 2 + 0.002, bz],
      rotY: i * CHIP_ROT_SEED,
    });
  }

  return result;
}
