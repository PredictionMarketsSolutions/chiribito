/**
 * StatsProbe — dependency-free draw-call + frame-time reader for TP0a-3 (M10 / M11).
 *
 * Contract (zero-visual-change):
 *   - Returns null — renders NOTHING on-canvas. No pixel is added. M9 / zero-visual-change intact.
 *   - Mounts ONLY when `?stats` is present in the URL (gated by the caller, TableLab.tsx).
 *   - Writes `window.__labStats = { calls, medianFrameMs }` each frame so the harness can
 *     read it via `page.evaluate(() => window.__labStats)` without any on-screen overlay.
 *
 * Why NOT drei <Stats>/<PerfMonitor>: those components draw a visible FPS widget inside the
 * canvas, altering pixels and breaking the zero-visual-change invariant (M9 / Pitfall 3).
 *
 * gl.info.autoReset defaults true in Three.js — the call count resets at the start of each
 * frame before drawArrays/drawElements run. We read it INSIDE useFrame (after the frame
 * has rendered) to get the correct per-frame draw-call count.
 */
import { useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";

/** Rolling median over the last N frame-time samples. */
const WINDOW_SIZE = 16;

declare global {
  interface Window {
    __labStats?: { calls: number; medianFrameMs: number };
  }
}

export function StatsProbe() {
  const gl = useThree((s) => s.gl);
  const prevTimeRef = useRef<number | null>(null);
  const samplesRef = useRef<number[]>([]);

  useFrame(() => {
    // Draw calls for this frame (valid to read here — Three.js resets gl.info at frame start).
    const calls = gl.info.render.calls;

    // Frame-time sample: delta since previous frame.
    const now = performance.now();
    const prev = prevTimeRef.current;
    if (prev !== null) {
      const dt = now - prev;
      const samples = samplesRef.current;
      samples.push(dt);
      if (samples.length > WINDOW_SIZE) samples.shift();

      // Median of the rolling window.
      const sorted = [...samples].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const medianFrameMs =
        sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];

      window.__labStats = { calls, medianFrameMs };
    }
    prevTimeRef.current = now;
  });

  // Zero pixels drawn — this is the invariant.
  return null;
}
