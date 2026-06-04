# HANDOFF — Table 3D Lab (frozen checkpoint)

**Date:** 2026-06-04
**Branch:** `spike/table-3d-hero` (off `9344453` on `style/table-breathe`)
**Tag:** `table-3d-lab-checkpoint-2026-06-04`
**Status:** FROZEN exploration checkpoint. **NOT integrated. No push, no deploy, no merge.**

This is an isolated, throwaway-friendly **3D table laboratory** (React Three Fiber) exploring a
new visual art direction for the Chiribito table. It lives only on a separate lab route and touches
**nothing** in the game (engine, Colyseus, gameplay, geometry are untouched). `main` and the live
product are unaffected. Everything here is reversible: it is a self-contained branch + tag.

---

## How to run the lab

```bash
cd frontend && npm run dev
# open http://localhost:5173/table-lab.html
```

URL params (exploration / capture toggles):
- `?cam=wide|hero|close|macro|top|room` — camera presets.
- `?table=oval|capsule|hexagon|bays|petal|embrace` — silhouette variant (omit = the polished oval lab table).
- `?chips=off` — empty table "in repose".
- `?c=literal` — use the literal 48px favicon C instead of the HD rebuild.
- `?spin=off` — freeze auto-rotation (used for captures).
- debug: `?felt=basic|magenta`, `?env=off`, `?sh=off`, `?cs=off`.

Drag to orbit; it auto-rotates gently in repose.

---

## Lab structure (committed)

- `frontend/table-lab.html` — isolated entry (NOT in the production `vite build`; index.html only).
- `frontend/src/lab/main.tsx` — React mount.
- `frontend/src/lab/TableLab.tsx` — scene: camera, lights, env, the polished oval table, chips, decals.
- `frontend/src/lab/textures.ts` — procedural canvas textures + the Chiribito "C" (`drawChiriC`) +
  chip face/edge, felt (real logo + real suits composited), wood.
- `frontend/src/lab/silhouettes.ts` — outline generators + seat transforms for every silhouette.
- `frontend/src/lab/TableVariant.tsx` — shaped table (extrude rail + shape felt + base) + placeholder seats.
- `frontend/public/brand/` — REAL official assets used by the lab: `logo-circular.png` (medallion),
  `chiri-c.png` (literal favicon green-C, 48px), `wordmark.png`, `suits/{oros,copas,espada,bastos}.png`
  (the real Baraja ace art).
- `frontend/vite.config.ts` — `esbuild: { jsx: "automatic" }` (no @vitejs/plugin-react; it doesn't
  support Vite 7). React/three/@react-three are **devDependencies**.
- `frontend/felt-debug.html` — tiny 2D dump of the felt texture (debug).

**Dev-only tooling (gitignored under `.dev-stack/`, regenerable):**
- `.dev-stack/lab-shot.mjs` — Playwright capture (MUST use `--headless=new --use-angle=d3d11 --enable-gpu`
  for the real GPU; old/software headless adds artifacts). The IDE preview screenshot can't capture this
  WebGL canvas. Captures land in `.dev-stack/diag/table-3d/`.
- `.dev-stack/ico-to-png.mjs` — pure-Node ICO→PNG decoder (extracted the green-C from `favicon.ico`).
- `.dev-stack/diag/live-icons/` — official icons downloaded from chiribito.com.

---

## Verification (at checkpoint)

- `cd frontend && npm run build` → **GREEN** (game builds clean; lab is dev-only, not in the prod build).
- `cd frontend && npm test` (vitest) → **GREEN, 353/353** (57 files). No regressions.
- Lab TypeScript: **clean** (no errors in `src/lab/`).
- `npx tsc --noEmit` shows **12 PRE-EXISTING** errors in `card-popover.ts` / `token-monitor.ts` /
  `connection.ts` — NOT from the lab; the project compiles with Vite/esbuild, not `tsc` (per CLAUDE.md).
- Game server (jest) + api-server tests: untouched packages (changes are frontend-only) → unaffected.

---

## Artistic-direction decisions taken (the record)

1. **3D is the direction.** Real-time 3D (R3F / three.js) validated as the path vs the old HTML/CSS +
   Pixi 2D table. Confirmed by the operator: the 3D lab is the first version that "no longer feels like
   a prototype". We do NOT go back to the previous table, El Reservado, La Perla, or ornamental lines.
2. **Silhouette:** **oval / racetrack preferred** over the hexagon and the experimental plaza-driven
   forms (bays/petal/embrace). The plaza-driven exploration is preserved + documented but not chosen.
   Guiding principle for further form work: **"the form is born from the plazas"** (design around where
   people sit / the social experience), expressed at a refined, premium amplitude — never floral.
3. **Chips:** a big leap from the start. Clay denominations mapped to suits (copas=burgundy,
   bastos=green, espadas=navy, oros=gold). The **real green-C favicon is the chip heart** — dominant,
   breathing, recognisable across a stack. (HD faithful rebuild from the 48px favicon using its EXACT
   sampled colours; the literal 48px is available via `?c=literal`. If an HD green-C ever exists, drop it
   in `frontend/public/brand/chiri-c.png`.) C form approved up to fine tweaks.
4. **Identity uses REAL official assets, never approximations:** the official medallion logo is inlaid
   in the felt centre; the favicon green-C on the chips; the official Spanish suits (`ace-*.png`).
5. **Seats:** the current chairs are **PLACEHOLDERS** — not evaluated, not approved. Seats are a future
   focused pass (to be done with the same obsession as the chips).
6. **Philosophy held:** social, castizo, human, tactile, premium, modern. No aggressive casino / Vegas /
   slots / neon / ostentatious gold / baroque ornament. Brass is mate, not gaudy gold.

---

## Next session priorities (operator's order)

1. Improve chip quality further + a last layer of "mimo" (more object-feel, refinement) — NOT a redesign.
2. Fix any remaining visual bugs / artifacts on the chips (extreme-zoom pass).
3. Improve materials + physical presence of the table.
4. Build REAL seats (replace placeholders).
5. Raise overall lab quality.

(Form discovery — "the Chiribito table" silhouette from the plazas — continues in parallel.)

---

## Invariants

- **No integration** into the game. No push, no deploy, no merge. `main` untouched.
- Game engine / gameplay / Colyseus / card geometry: FROZEN (visual-only exploration).
- Chiribito deploys always require explicit manual confirmation (separate policy) — N/A here (no deploy).
