# Rincón del Jugador · Fase 0 "El Rincón cobra vida" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Rincón dashboard feel like a living object of the Chiribito universe — tactile carnet, light-catching lacre, ceremonial reveal, inscribed (count-up) stats, a "ledger" hierarchy, and a subtle seal sound — without rebuilding any validated primitive and without touching mesa/felt/gameplay.

**Architecture:** All motion/interaction logic is isolated into a new pure-ish `frontend/src/app/rincon/interactions.ts` (unit-tested with Vitest). `components.ts` only emits structure + data attributes; `rincon-scene.ts` wires interactions after render; `rincon.css` adds the visual layer. One additive sound profile is added to the shared `audio.ts` (the only edit outside `rincon/*`). Every motion path is gated by `prefers-reduced-motion`, and all displayed values remain the real `/me`/ranking data (count-up is presentational only).

**Tech Stack:** Vanilla TypeScript + CSS (no GSAP in the Rincón), Vite, Vitest + jsdom. Spec: `docs/superpowers/specs/2026-05-21-chiribito-rincon-fase-0-vida-design.md`.

---

## File Structure

| File | Responsibility | Action |
|------|----------------|--------|
| `frontend/src/app/rincon/interactions.ts` | Pure motion logic + DOM-attach helpers (reduced-motion gate, count-up, pointer tilt, reveal order, lacre shine) | **Create** |
| `frontend/src/app/rincon/interactions.test.ts` | Vitest unit tests for the pure functions | **Create** |
| `frontend/src/app/rincon/components.ts` | DOM structure: stat grid 2×2 + Puesto, lacre shine element, carnet stage wrapper, count-up data attrs, export `formatChips` | **Modify** |
| `frontend/src/app/rincon/components.test.ts` | Update structural assertions (keep honesty assertions) | **Modify** |
| `frontend/src/app/rincon/rincon-scene.ts` | Wire interactions after render, ledger grouping, reveal order, `playOpenCue` | **Modify** |
| `frontend/src/app/rincon/rincon-scene.test.ts` | Assert reveal order + `playOpenCue` invocation | **Modify** |
| `frontend/src/app/rincon/rincon.css` | Visual layer: perspective/tilt, breathe, shine, staggered reveal, ledger hierarchy, 2×2 grid, 44px back, desktop widen | **Modify** |
| `frontend/src/types.ts` | Add `"carnetOpen"` to `SoundEffect` union | **Modify** |
| `frontend/src/audio.ts` | Add `carnetOpen` procedural profile | **Modify** |
| `frontend/src/main.ts` | Pass `playOpenCue` into `openRincon` deps | **Modify** |

**Commands** (run from repo root unless noted):
- Frontend tests: `cd frontend && npx vitest run src/app/rincon`
- Type-check: `cd frontend && npx tsc --noEmit`
- Dev (manual verify): `npm run dev:stack` (full stack) then log in and open **Mi Rincón**

---

## Task 1: Pure interaction primitives (`interactions.ts`)

**Files:**
- Create: `frontend/src/app/rincon/interactions.ts`
- Test: `frontend/src/app/rincon/interactions.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// frontend/src/app/rincon/interactions.test.ts
import { describe, it, expect, afterEach, vi } from "vitest";
import { prefersReducedMotion, countUpValueAt, tiltFromPointer, applyRevealOrder } from "./interactions";

afterEach(() => { vi.unstubAllGlobals(); });

describe("prefersReducedMotion", () => {
  it("is false when matchMedia is unavailable (jsdom default)", () => {
    expect(prefersReducedMotion()).toBe(false);
  });
  it("is true when the media query matches", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q,
      addEventListener() {}, removeEventListener() {} }));
    expect(prefersReducedMotion()).toBe(true);
  });
});

describe("countUpValueAt (easeOutCubic, rounded)", () => {
  it("is 0 at t<=0 and the target at t>=1", () => {
    expect(countUpValueAt(142, 0)).toBe(0);
    expect(countUpValueAt(142, 1)).toBe(142);
    expect(countUpValueAt(142, 2)).toBe(142); // clamped
  });
  it("is monotonic and never overshoots the target", () => {
    const a = countUpValueAt(142, 0.3);
    const b = countUpValueAt(142, 0.6);
    expect(a).toBeLessThanOrEqual(b);
    expect(b).toBeLessThanOrEqual(142);
  });
});

describe("tiltFromPointer", () => {
  const rect = { left: 0, top: 0, width: 200, height: 300 };
  it("is flat at the centre", () => {
    expect(tiltFromPointer(100, 150, rect, 7)).toEqual({ rotateX: 0, rotateY: 0 });
  });
  it("clamps to ±maxDeg at the edges", () => {
    expect(tiltFromPointer(200, 150, rect, 7).rotateY).toBeCloseTo(7);
    expect(tiltFromPointer(0, 150, rect, 7).rotateY).toBeCloseTo(-7);
    // top edge leans the card; magnitude is maxDeg
    expect(Math.abs(tiltFromPointer(100, 0, rect, 7).rotateX)).toBeCloseTo(7);
  });
});

describe("applyRevealOrder", () => {
  it("sets --reveal-i incrementally", () => {
    const a = document.createElement("div");
    const b = document.createElement("div");
    applyRevealOrder([a, b]);
    expect(a.style.getPropertyValue("--reveal-i")).toBe("0");
    expect(b.style.getPropertyValue("--reveal-i")).toBe("1");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd frontend && npx vitest run src/app/rincon/interactions.test.ts`
Expected: FAIL — `Failed to resolve import "./interactions"`.

- [ ] **Step 3: Write the minimal implementation**

```ts
// frontend/src/app/rincon/interactions.ts
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
  return { rotateY: clamp(nx) * maxDeg, rotateX: -clamp(ny) * maxDeg };
}

/** Stagger helper: stamp an incremental --reveal-i custom property for CSS animation-delay. */
export function applyRevealOrder(elements: HTMLElement[]): void {
  elements.forEach((el, i) => el.style.setProperty("--reveal-i", String(i)));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx vitest run src/app/rincon/interactions.test.ts`
Expected: PASS (4 describe blocks green).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/rincon/interactions.ts frontend/src/app/rincon/interactions.test.ts
git commit -m "feat(rincon): pure interaction primitives (reduced-motion, count-up, tilt, reveal)"
```

---

## Task 2: DOM-attach helpers (`interactions.ts` continued)

**Files:**
- Modify: `frontend/src/app/rincon/interactions.ts`
- Test: `frontend/src/app/rincon/interactions.test.ts`

- [ ] **Step 1: Write the failing tests** (append to `interactions.test.ts`)

```ts
import { runCountUp, attachCarnetTilt } from "./interactions";

describe("runCountUp", () => {
  it("with reduced motion, sets the final formatted value immediately", () => {
    const el = document.createElement("span");
    runCountUp(el, 18420, (n) => `${(n / 1000).toFixed(1)}K`, { reducedMotion: true });
    expect(el.textContent).toBe("18.4K");
  });
  it("with a non-positive target, shows the formatted target without animating", () => {
    const el = document.createElement("span");
    runCountUp(el, 0, (n) => String(n), { reducedMotion: false });
    expect(el.textContent).toBe("0");
  });
});

describe("attachCarnetTilt", () => {
  it("does nothing under reduced motion (no transform var set)", () => {
    const holder = document.createElement("div");
    attachCarnetTilt(holder, { reducedMotion: true });
    holder.dispatchEvent(new Event("pointermove"));
    expect(holder.style.getPropertyValue("--tiltX")).toBe("");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd frontend && npx vitest run src/app/rincon/interactions.test.ts`
Expected: FAIL — `runCountUp`/`attachCarnetTilt` are not exported.

- [ ] **Step 3: Implement** (append to `interactions.ts`)

```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `cd frontend && npx vitest run src/app/rincon/interactions.test.ts`
Expected: PASS (all describe blocks).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/rincon/interactions.ts frontend/src/app/rincon/interactions.test.ts
git commit -m "feat(rincon): count-up + carnet tilt + lacre shine DOM helpers"
```

---

## Task 3: Restructure `components.ts` (2×2 stats + Puesto, carnet stage, lacre shine, count-up attrs)

**Files:**
- Modify: `frontend/src/app/rincon/components.ts`
- Modify: `frontend/src/app/rincon/components.test.ts`

- [ ] **Step 1: Update the failing tests** in `components.test.ts`

Replace the `StatMarks` describe block (lines 41-48) with:

```ts
describe("StatMarks", () => {
  it("renders the 2x2 core grid with count-up data attributes", () => {
    const s = StatMarks(vm);
    expect(s.querySelector('[data-countup="142"]')).not.toBeNull();   // Manos
    expect(s.querySelector('[data-countup-format="chips"]')).not.toBeNull(); // Fichas
    expect(s.textContent).toContain("142");
  });
  it("shows '—' for null winRate and an explicit Puesto element", () => {
    expect(StatMarks(vm).querySelector(".stat-puesto")?.textContent).toContain("#7");
    const empty = StatMarks({ ...vm, gamesPlayed: 0, gamesWon: 0, winRate: null, puesto: null });
    expect(empty.textContent).toContain("—");
    expect(empty.querySelector(".stat-puesto")?.textContent?.toLowerCase()).toContain("sin clasificar");
  });
});
```

Add to the `CarnetVivo` describe block a structural assertion:

```ts
  it("wraps the holder in a stage and includes a lacre shine layer", () => {
    const el = CarnetVivo({ identidad, ultimaVez: "anoche" });
    expect(el.classList.contains("carnet-stage")).toBe(true);
    expect(el.querySelector(".carnet-holder")).not.toBeNull();
    expect(el.querySelector(".lacre__shine")).not.toBeNull();
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `cd frontend && npx vitest run src/app/rincon/components.test.ts`
Expected: FAIL — `.carnet-stage`, `.lacre__shine`, `[data-countup]`, `.stat-puesto` not found.

- [ ] **Step 3: Implement the structural changes in `components.ts`**

3a. Export `formatChips` and add a shine layer to `LacrePersonal`. Replace lines 12-66 region as follows — `LacrePersonal` (add shine child) and `formatChips` (add `export`):

```ts
export function LacrePersonal(props: { identidad: Identidad; sizePx?: number }): HTMLElement {
  const { identidad, sizePx = 74 } = props;
  const seal = el("div", "lacre");
  seal.setAttribute("data-tone", identidad.waxTone);
  seal.style.width = `${sizePx}px`;
  seal.style.height = `${sizePx}px`;
  seal.style.transform = `rotate(${identidad.imperfection.rotateDeg}deg)`;
  seal.style.borderRadius = identidad.imperfection.radius;
  const glyph = suitGlyph(identidad.suit, Math.round(sizePx * 0.34));
  glyph.classList.add("lacre__glyph");
  seal.appendChild(glyph);
  seal.appendChild(el("span", "lacre__mono", identidad.monograma));
  seal.appendChild(el("span", "lacre__shine")); // light-catch layer (CSS-driven)
  return seal;
}
```

```ts
export function formatChips(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}
```

3b. Wrap the carnet in a stage. In `CarnetVivo`, change the holder creation + return (lines 30, 52-53):

```ts
  const holder = el("div", "carnet-holder tilt");
  const stage = el("div", "carnet-stage");
  // ... (face building unchanged) ...
  holder.appendChild(face);
  stage.appendChild(holder);
  return stage;
```

3c. Rewrite `statTile` + `StatMarks` (lines 56-79) for the 2×2 grid + explicit Puesto, with count-up data attributes:

```ts
function statTile(value: string, label: string, countup?: { target: number; format: "int" | "pct" | "chips" }): HTMLElement {
  const t = el("div", "stat");
  const v = el("div", "stat__v", value);
  if (countup) {
    v.dataset.countup = String(countup.target);
    v.dataset.countupFormat = countup.format;
  }
  t.appendChild(v);
  t.appendChild(el("div", "stat__k", label));
  return t;
}

export function StatMarks(vm: RinconViewModel): HTMLElement {
  const sec = el("div", "rincon-sec");
  sec.appendChild(el("div", "rincon-sec__t", "La hoja del socio"));
  const grid = el("div", "statg");
  grid.appendChild(statTile(String(vm.gamesPlayed), "Manos", { target: vm.gamesPlayed, format: "int" }));
  grid.appendChild(statTile(String(vm.gamesWon), "Ganadas", { target: vm.gamesWon, format: "int" }));
  grid.appendChild(statTile(vm.winRate == null ? "—" : `${vm.winRate}%`, "Victorias",
    vm.winRate == null ? undefined : { target: vm.winRate, format: "pct" }));
  grid.appendChild(statTile(formatChips(vm.totalChipsWon), "Fichas", { target: vm.totalChipsWon, format: "chips" }));
  sec.appendChild(grid);

  const puesto = el("div", "stat-puesto");
  if (vm.puesto == null) {
    puesto.appendChild(el("span", "stat-puesto__txt", "Sin clasificar aún"));
  } else {
    const v = el("span", "stat-puesto__v", `#${vm.puesto}`);
    v.dataset.countup = String(vm.puesto);
    v.dataset.countupFormat = "rank";
    puesto.appendChild(v);
    puesto.appendChild(el("span", "stat-puesto__txt", "en la casa"));
  }
  sec.appendChild(puesto);
  return sec;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd frontend && npx vitest run src/app/rincon/components.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/rincon/components.ts frontend/src/app/rincon/components.test.ts
git commit -m "feat(rincon): 2x2 stats + Puesto, carnet stage, lacre shine, count-up attrs"
```

---

## Task 4: Wire interactions + ledger + reveal + audio cue in `rincon-scene.ts`

**Files:**
- Modify: `frontend/src/app/rincon/rincon-scene.ts`
- Modify: `frontend/src/app/rincon/rincon-scene.test.ts`

- [ ] **Step 1: Update the failing tests** in `rincon-scene.test.ts`

Replace the "renders the full rincon" test (lines 22-30) and add a reveal/ledger assertion:

```ts
  it("renders the full rincon inside a ledger and stamps reveal order", () => {
    const c = document.createElement("div");
    renderRincon(c, vm, { gameUrl: "https://play.chiribito.com", onClose: vi.fn() });
    expect(c.querySelector(".carnet-name")?.textContent).toBe("lucia");
    expect(c.querySelector(".rincon-ledger")).not.toBeNull();
    expect(c.textContent).toContain("La hoja del socio");
    expect(c.querySelector(".carnet-stage")?.style.getPropertyValue("--reveal-i")).not.toBe("");
  });
```

Add a `playOpenCue` test in the "rincon scene" describe block:

```ts
  it("plays the open cue once on a successful render path", () => {
    const c = document.createElement("div");
    const cue = vi.fn();
    renderRincon(c, vm, { gameUrl: "https://play.chiribito.com", onClose: vi.fn(), playOpenCue: cue });
    expect(cue).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `cd frontend && npx vitest run src/app/rincon/rincon-scene.test.ts`
Expected: FAIL — `.rincon-ledger` missing, `--reveal-i` empty, `playOpenCue` unsupported.

- [ ] **Step 3: Implement in `rincon-scene.ts`**

3a. Update imports (line 1-5 region) to add interactions + formatChips:

```ts
import { CarnetVivo, StatMarks, HistoriaStrip, CompartirRincon, PresenciaMesa, formatChips } from "./components";
import { applyRevealOrder, attachCarnetTilt, attachLacreShine, runCountUp } from "./interactions";
```

3b. Replace `renderRincon` (lines 30-38) with the ledger + reveal + interactions wiring:

```ts
export function renderRincon(
  container: HTMLElement,
  vm: RinconViewModel,
  opts: { gameUrl: string; onClose: () => void; playOpenCue?: () => void },
): void {
  container.innerHTML = "";
  const top = topbar(opts.onClose);
  const carnet = CarnetVivo({ identidad: vm.identidad, ultimaVez: vm.ultimaVez });

  const ledger = el("div", "rincon-ledger");
  const sections = [
    StatMarks(vm),
    HistoriaStrip(vm),
    CompartirRincon({ identidad: vm.identidad, gameUrl: opts.gameUrl }),
    PresenciaMesa({ identidad: vm.identidad }),
  ];
  sections.forEach((s) => ledger.appendChild(s));

  container.appendChild(top);
  container.appendChild(carnet);
  container.appendChild(ledger);

  // Ceremony: stamp reveal order on the top-level hero elements and the ledger's sections.
  applyRevealOrder([top, carnet]);
  applyRevealOrder(sections);

  // Life: pointer tilt on the carnet holder, idle/bloom shine on the lacre.
  const holder = carnet.querySelector<HTMLElement>(".carnet-holder");
  if (holder) attachCarnetTilt(holder);
  const shine = carnet.querySelector<HTMLElement>(".lacre__shine");
  if (shine) attachLacreShine(shine);

  // Inscription: count up every numeric stat to its real value (format-preserving).
  container.querySelectorAll<HTMLElement>("[data-countup]").forEach((node) => {
    const target = Number(node.dataset.countup);
    const fmt = node.dataset.countupFormat;
    const format =
      fmt === "chips" ? (n: number) => formatChips(n)
      : fmt === "pct" ? (n: number) => `${n}%`
      : fmt === "rank" ? (n: number) => `#${n}`
      : (n: number) => String(n);
    if (!Number.isNaN(target)) runCountUp(node, target, format);
  });

  opts.playOpenCue?.();
}
```

3c. Thread `playOpenCue` through `OpenRinconDeps` (lines 59-67) and `openRincon`'s success render (line 86). Add to the interface:

```ts
export interface OpenRinconDeps {
  overlay: HTMLElement;
  content: HTMLElement;
  apiUrl: string;
  fetchFn: FetchLike;
  gameUrl: string;
  log: (msg: string) => void;
  onClose: () => void;
  playOpenCue?: () => void;
}
```

And in `openRincon`, pass it into the success render (replace line 86):

```ts
    renderRincon(deps.content, vm, { gameUrl: deps.gameUrl, onClose: deps.onClose, playOpenCue: deps.playOpenCue });
```

- [ ] **Step 4: Run to verify pass**

Run: `cd frontend && npx vitest run src/app/rincon`
Expected: PASS (interactions + components + rincon-scene suites all green).

- [ ] **Step 5: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: No NEW errors (12 pre-existing errors in token-monitor/connection/card-popover are untouched and acceptable).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/rincon/rincon-scene.ts frontend/src/app/rincon/rincon-scene.test.ts
git commit -m "feat(rincon): ledger grouping, ceremony reveal, tilt/shine/count-up wiring + open cue"
```

---

## Task 5: The visual layer (`rincon.css`)

**Files:**
- Modify: `frontend/src/app/rincon/rincon.css`

> No unit tests (CSS). Verified manually in Task 7. This task makes Tasks 1-4 visible.

- [ ] **Step 1: Add the carnet stage + tilt + breathe.** Replace the `.carnet-holder` + `.carnet-holder.tilt` rules (rincon.css:38-39) with:

```css
/* stage holds idle motion isolation; holder owns tilt (vars) — separate transforms, no conflict */
.carnet-stage { perspective: 900px; }
.carnet-holder { position: relative; padding: 5px; border-radius: 18px;
  background: linear-gradient(150deg, var(--r-wood-light), var(--r-wood-mid) 38%, var(--r-wood-dark));
  box-shadow: 0 22px 46px rgba(0, 0, 0, .6), inset 0 1px 0 rgba(255, 255, 255, .1), inset 0 -2px 6px rgba(0, 0, 0, .5);
  transform-style: preserve-3d; will-change: transform; }
.carnet-holder.tilt { transform: rotate(-1.4deg) rotateX(var(--tiltX, 0deg)) rotateY(var(--tiltY, 0deg));
  transition: transform 220ms var(--r-ease); animation: r-breathe 6s ease-in-out infinite; }
@keyframes r-breathe {
  0%, 100% { box-shadow: 0 22px 46px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.1), inset 0 -2px 6px rgba(0,0,0,.5); }
  50%      { box-shadow: 0 27px 54px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.12), inset 0 -2px 6px rgba(0,0,0,.5); }
}
```

- [ ] **Step 2: Add the lacre shine layer.** Append after the `.lacre__mono` rules (after rincon.css:60):

```css
.lacre__shine { position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  mix-blend-mode: screen; opacity: .45;
  background: radial-gradient(circle at 35% 28%, rgba(255,255,255,.6), transparent 46%); }
.lacre__shine--alive { animation: r-shine-drift 7s ease-in-out infinite, r-shine-bloom 900ms var(--r-ease) 1; }
@keyframes r-shine-drift { 0%,100% { background-position: 0 0; opacity:.45; } 50% { background-position: 18% 12%; opacity:.6; } }
@keyframes r-shine-bloom { from { opacity: .95; } to { opacity: .45; } }
```

- [ ] **Step 3: Replace the block reveal with a staggered ceremony.** Replace the `rincon-in` animation on `.rincon-scene` (rincon.css:15) — change line 15 from `animation: rincon-in 460ms var(--r-ease) both;` to `animation: rincon-in 320ms var(--r-ease) both;` (faster backdrop), then append:

```css
/* per-element ceremony: hero (top + carnet) and ledger sections rise in sequence */
#rincon-content > *:not(.rincon-ledger),
.rincon-ledger > * {
  animation: r-rise 520ms var(--r-ease) both;
  animation-delay: calc(var(--reveal-i, 0) * 70ms);
}
.rincon-ledger > * { animation-delay: calc(var(--reveal-i, 0) * 60ms + 160ms); }
@keyframes r-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
```

- [ ] **Step 4: Ledger hierarchy (de-SaaS).** Replace the `.rincon-sec` rule (rincon.css:63) with a ledger surface + hairline-divided sections:

```css
.rincon-ledger { display: flex; flex-direction: column; border-radius: 16px;
  background: linear-gradient(180deg, rgba(20, 16, 11, .58), rgba(8, 6, 4, .66));
  border: 1px solid rgba(244, 196, 48, .10); box-shadow: inset 0 0 50px rgba(0,0,0,.35); }
.rincon-sec { padding: 15px 16px; }
.rincon-ledger > .rincon-sec + .rincon-sec,
.rincon-ledger > .share-quiet { border-top: 1px solid rgba(244, 196, 48, .08); }
.rincon-ledger > .share-quiet { padding: 12px 16px; align-self: stretch; text-align: center; }
```

- [ ] **Step 5: Stat grid 2×2 + Puesto.** Replace `.statg` (rincon.css:66) and add Puesto styling:

```css
.statg { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px 10px; }
.stat-puesto { margin-top: 14px; display: flex; align-items: baseline; justify-content: center; gap: 8px;
  padding-top: 12px; border-top: 1px dashed rgba(244, 196, 48, .14); }
.stat-puesto__v { font-family: "Cinzel", serif; font-weight: 800; font-size: 22px; color: var(--r-gold-soft); }
.stat-puesto__txt { font-size: 9px; letter-spacing: .18em; text-transform: uppercase; color: var(--r-ivory-dim); font-weight: 700; }
```

- [ ] **Step 6: 44px back button.** Replace `.rincon-top__back` (rincon.css:33) `width: 34px; height: 34px;` → `width: 44px; height: 44px;` and `.rincon-top__spacer` (line 35) `width: 34px;` → `width: 44px;`.

- [ ] **Step 7: Desktop widen.** In the `@media (min-width: 760px)` block (rincon.css:96), change `#rincon-content` `max-width: 760px;` → `max-width: 840px;` and `grid-template-columns: 320px 1fr;` → `grid-template-columns: 340px 1fr;`. Update the desktop grid-column rules to target `.rincon-ledger` instead of the removed per-section `.rincon-sec` placement (replace lines 99-102):

```css
  .carnet-stage { grid-column: 1; }
  #rincon-content > .rincon-ledger { grid-column: 2; }
```

- [ ] **Step 8: Confirm reduced-motion safety.** The existing `@media (prefers-reduced-motion: reduce)` rule (rincon.css:19) already nukes all animations under `.rincon-scene *`. Verify the new keyframes (`r-breathe`, `r-shine-drift`, `r-shine-bloom`, `r-rise`) are all descendants of `.rincon-scene` (they are) — no extra rule needed. No action beyond visual confirmation.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/app/rincon/rincon.css
git commit -m "style(rincon): perspective tilt, breathe, lacre shine, ceremony reveal, ledger + 2x2 + 44px"
```

---

## Task 6: The "sello" audio cue (Option B — additive)

**Files:**
- Modify: `frontend/src/types.ts:42-57`
- Modify: `frontend/src/audio.ts:28-38`
- Modify: `frontend/src/main.ts` (openRincon deps, ~line 1069)

> Sound *quality* is verified by user audition in Task 7 (the assistant cannot hear). These steps verify wiring + types only.

- [ ] **Step 1: Add the effect name** to the `SoundEffect` union in `frontend/src/types.ts`. Change line 57 from `  | "tick";` to:

```ts
  | "tick"
  | "carnetOpen";
```

- [ ] **Step 2: Add the procedural profile** to `simpleProfiles` in `frontend/src/audio.ts` (after the `tick` entry, line 37). A low, warm, short "wax press" — descending glide, body on, dark cutoff:

```ts
  carnetOpen: { frequency: 196, durationMs: 240, type: "triangle", volume: 0.07, body: true, glideTo: 147, cutoff: 900 },
```

- [ ] **Step 3: Wire the cue** in `frontend/src/main.ts`. In the `miRinconButton` click handler (the `openRincon({...})` call at ~line 1069), add the `playOpenCue` dep:

```ts
    void openRincon({
      overlay: rinconOverlay,
      content: rinconContent,
      apiUrl: API_URL,
      fetchFn: fetch.bind(window),
      gameUrl: "https://play.chiribito.com",
      log,
      playOpenCue: () => audio.playEffect("carnetOpen"),
      onClose: () => {
        setRinconOverlayVisible(rinconOverlay, false);
        setLobbyOverlayVisible(true);
      },
    });
```

- [ ] **Step 4: Type-check** (the new union member must be accepted everywhere)

Run: `cd frontend && npx tsc --noEmit`
Expected: No NEW errors.

- [ ] **Step 5: Run the full rincón suite** (ensure nothing regressed)

Run: `cd frontend && npx vitest run src/app/rincon`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types.ts frontend/src/audio.ts frontend/src/main.ts
git commit -m "feat(audio): subtle carnetOpen wax-seal cue + wire into Mi Rincón"
```

---

## Task 7: Full verification gate (tests + type-check + manual browser + north-star)

**Files:** none (verification only). Do not mark Fase 0 done until every box is checked.

- [ ] **Step 1: Full frontend test suite**

Run: `cd frontend && npx vitest run`
Expected: PASS — Rincón suites green and the broader baseline (~257) unbroken.

- [ ] **Step 2: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: only the 12 known pre-existing errors (token-monitor/connection/card-popover); zero new.

- [ ] **Step 3: Manual browser verification (non-negotiable — "tests verdes ≠ UX funciona").**

Run: `npm run dev:stack` (root). Log in, open **Mi Rincón**. Verify at **390×844 (mobile-first)** and **1920×1080 (desktop)**:
- [ ] Carnet tilts toward the cursor on desktop and eases back on leave; idle breathe is perceptible but calm.
- [ ] Lacre catches light (idle drift + a one-time bloom on open).
- [ ] Opening reveals as a cascade (top → carnet → ledger sections), not a flat fade.
- [ ] Stats count up to the exact real values; `1.2K`/`%`/`#N`/`—` formatting correct; placeholders never animate.
- [ ] Post-carnet content reads as ONE ledger page, not 4 cards; stat grid is balanced (2×2 + Puesto); back button is comfortably tappable.
- [ ] Empty (new socio), loading, and error states all render correctly.
- [ ] A subtle "sello" sound plays on open; lobby music continues uninterrupted.
- [ ] Toggle OS "reduce motion" → all new motion stops; final values shown instantly.

- [ ] **Step 4: North-star re-gate.** Confirm every change reads more *táctil / premium / social / claro / vivo / castizo* and introduces zero SaaS/casino drift, zero fake data, and leaves mesa/felt/gameplay/`style.css` untouched.

- [ ] **Step 5: Capture before/after screenshots** (mobile + desktop) for the handoff, then update `docs/HANDOFF_*` / memory as appropriate and stop for user sign-off before any push (a `main` push may trigger Render autoDeploy).

---

## Self-Review (author checklist — completed)

- **Spec coverage:** 0.1 carnet tilt+breathe → Tasks 2,5; 0.2 lacre shine → Tasks 2,3,5; 0.3 ceremony reveal → Tasks 1,4,5; 0.4 count-up → Tasks 1,2,3,4; 0.5 hierarchy/grid/back/desktop → Tasks 3,5; 0.6 audio → Task 6. All six covered. Reduced-motion gate → Tasks 1,2,5 step 8. Manual verification → Task 7.
- **Placeholder scan:** none — every code step shows complete code; commands have expected output.
- **Type consistency:** `formatChips` exported (Task 3) and imported (Task 4); `playOpenCue` typed in `OpenRinconDeps` (Task 4) and passed from `main.ts` (Task 6); `carnetOpen` added to `SoundEffect` (Task 6) before use; `--reveal-i`/`--tiltX`/`--tiltY`/`.lacre__shine--alive` produced by JS (Tasks 1,2) and consumed by CSS (Task 5).
- **Order safety:** CSS (Task 5) follows the structural rename (Task 3) so selectors match; reveal CSS targets `.carnet-stage`/`.rincon-ledger` created in Tasks 3-4, avoiding the holder-transform conflict (reveal on stage, tilt on holder).
