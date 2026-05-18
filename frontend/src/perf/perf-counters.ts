/**
 * Runtime-diagnostic counters for `?perf=1` instrumentation.
 *
 * Callers gate at call site: `if (isPerfEnabled()) perfRerenderInc("renderSeats")`.
 * Counters themselves are unconditional and side-effect-free except for the
 * periodic console.debug emission below.
 *
 * See docs/superpowers/specs/2026-05-18-chiribito-runtime-diagnostic-design.md.
 */

type Counter = number;

const counters: {
  ticker: Counter;
  rerender: Record<string, Counter>;
  stateChange: Counter;
  wsIn: Counter;
  wsOut: Counter;
  wsInBytes: Counter;
} = {
  ticker: 0,
  rerender: Object.create(null),
  stateChange: 0,
  wsIn: 0,
  wsOut: 0,
  wsInBytes: 0,
};

let reporterIntervalId: number | null = null;
let lastSnapshot: typeof counters | null = null;

export function perfTickerInc(): void {
  counters.ticker += 1;
}

export function perfRerenderInc(name: string): void {
  counters.rerender[name] = (counters.rerender[name] ?? 0) + 1;
}

export function perfStateChangeInc(): void {
  counters.stateChange += 1;
}

export function perfWsInInc(byteSize: number): void {
  counters.wsIn += 1;
  counters.wsInBytes += byteSize;
}

export function perfWsOutInc(): void {
  counters.wsOut += 1;
}

export function perfSnapshot(): typeof counters {
  return {
    ticker: counters.ticker,
    rerender: { ...counters.rerender },
    stateChange: counters.stateChange,
    wsIn: counters.wsIn,
    wsOut: counters.wsOut,
    wsInBytes: counters.wsInBytes,
  };
}

/**
 * Start a 1 Hz reporter that emits a `[perf]` console.debug line with
 * deltas since the previous tick. Idempotent (no-op if already running).
 * Call from main.ts only when isPerfEnabled() is true.
 */
export function startPerfReporter(): void {
  if (reporterIntervalId !== null) return;
  lastSnapshot = perfSnapshot();
  reporterIntervalId = window.setInterval(() => {
    const now = perfSnapshot();
    const prev = lastSnapshot ?? now;
    const rerenderDelta: Record<string, number> = {};
    for (const k of Object.keys(now.rerender)) {
      rerenderDelta[k] = now.rerender[k] - (prev.rerender[k] ?? 0);
    }
    // eslint-disable-next-line no-console
    console.debug("[perf]", {
      tickerHz: now.ticker - prev.ticker,
      rerender: rerenderDelta,
      stateChangeHz: now.stateChange - prev.stateChange,
      wsInHz: now.wsIn - prev.wsIn,
      wsOutHz: now.wsOut - prev.wsOut,
      wsInBytesHz: now.wsInBytes - prev.wsInBytes,
    });
    lastSnapshot = now;
  }, 1000);
}
