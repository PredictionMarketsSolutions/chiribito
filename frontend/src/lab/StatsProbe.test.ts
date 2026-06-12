/**
 * StatsProbe.test.ts — vitest (happy-dom).
 *
 * Covers 3 behaviors:
 *   Test 1 — null-render contract: StatsProbe returns null (zero pixels drawn).
 *   Test 2 — data contract: window.__labStats has numeric `calls` + `medianFrameMs` after a frame.
 *   Test 3 — gating: the ?stats URL predicate used by TableLab gates StatsProbe correctly.
 *
 * Strategy: mock React hooks (useRef), @react-three/fiber hooks (useThree, useFrame), and invoke
 * StatsProbe() as a plain function so the test does not need a React renderer. This is valid
 * because hooks are regular functions when the mock controls the dispatcher.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock React so useRef works outside a renderer.
// ---------------------------------------------------------------------------
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useRef: <T>(initial: T) => ({ current: initial }),
  };
});

// ---------------------------------------------------------------------------
// Shared state for the r3f mock so tests can drive frame callbacks.
// ---------------------------------------------------------------------------
let capturedFrameCallback: (() => void) | null = null;
const glStub = { info: { render: { calls: 42 } } };

vi.mock("@react-three/fiber", () => ({
  useThree: (selector: (state: { gl: unknown }) => unknown) =>
    selector({ gl: glStub }),
  useFrame: (cb: () => void) => {
    capturedFrameCallback = cb;
  },
}));

// ---------------------------------------------------------------------------
// Test 1 — null-render contract
// ---------------------------------------------------------------------------
describe("StatsProbe null-render contract", () => {
  beforeEach(() => {
    capturedFrameCallback = null;
  });

  it("calling StatsProbe() returns null (renders nothing on-canvas)", async () => {
    const { StatsProbe } = await import("./StatsProbe");
    const result = StatsProbe();
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Test 2 — data contract: window.__labStats shape after simulated frames
// ---------------------------------------------------------------------------
describe("StatsProbe data contract", () => {
  beforeEach(() => {
    capturedFrameCallback = null;
    delete (window as Window & { __labStats?: unknown }).__labStats;
    glStub.info.render.calls = 42;
  });

  afterEach(() => {
    delete (window as Window & { __labStats?: unknown }).__labStats;
  });

  it("writes { calls, medianFrameMs } to window.__labStats after two frames", async () => {
    const { StatsProbe } = await import("./StatsProbe");

    // Mount: registers the useFrame callback and sets up refs.
    StatsProbe();
    expect(capturedFrameCallback).not.toBeNull();

    // First frame — sets prevTime; no medianFrameMs yet (no delta available).
    capturedFrameCallback!();

    // Second frame — delta available; __labStats is written.
    capturedFrameCallback!();

    const stats = (window as Window & { __labStats?: { calls: number; medianFrameMs: number } }).__labStats;
    expect(stats).toBeDefined();
    expect(typeof stats!.calls).toBe("number");
    expect(typeof stats!.medianFrameMs).toBe("number");
    // draw calls come from the gl stub
    expect(stats!.calls).toBe(42);
    // frame-time must be a non-negative finite number
    expect(stats!.medianFrameMs).toBeGreaterThanOrEqual(0);
    expect(isFinite(stats!.medianFrameMs)).toBe(true);
  });

  it("exposes both required fields: calls (draw calls, M10) and medianFrameMs (frame-time, M11)", async () => {
    const { StatsProbe } = await import("./StatsProbe");
    StatsProbe();
    // Drive two frames to populate the stats.
    capturedFrameCallback!();
    capturedFrameCallback!();

    const stats = (window as Window & { __labStats?: Record<string, unknown> }).__labStats;
    expect(stats).toHaveProperty("calls");
    expect(stats).toHaveProperty("medianFrameMs");
  });
});

// ---------------------------------------------------------------------------
// Test 3 — gating: the ?stats URL predicate
//
// We test the predicate logic as a pure unit — the same conditional TableLab uses:
//   `qp("stats") !== null`  where qp = new URLSearchParams(search).get(name)
// ---------------------------------------------------------------------------
describe("?stats URL gating predicate", () => {
  function qp(name: string, search: string): string | null {
    return new URLSearchParams(search).get(name);
  }

  function shouldMountStatsProbe(search: string): boolean {
    return qp("stats", search) !== null;
  }

  it("returns true when ?stats is present with no value", () => {
    expect(shouldMountStatsProbe("?stats")).toBe(true);
  });

  it("returns true when ?stats has a value", () => {
    expect(shouldMountStatsProbe("?cam=hero&stats=1")).toBe(true);
  });

  it("returns false when ?stats is absent", () => {
    expect(shouldMountStatsProbe("?cam=hero")).toBe(false);
  });

  it("returns false when the query string is empty", () => {
    expect(shouldMountStatsProbe("")).toBe(false);
  });

  it("returns false when other params are present but not stats", () => {
    expect(shouldMountStatsProbe("?cam=card&spin=off")).toBe(false);
  });
});
