# HANDOFF — Table 3D Lab

**Date:** 2026-06-04 (premium elevation + protection pass)
**Branch:** `spike/table-3d-hero` (off `9344453` on `style/table-breathe`)
**Status:** Isolated 3D table laboratory (React Three Fiber). **NOT integrated. No push, no deploy, no merge.** `main` and the live product are unaffected.

---

## ⭐ PROTECTED REFERENCE — the premium table (read first)

The **premium oval table** is the most valuable result of this lab and is treated as a
**protected reference asset**. It must never be degraded, replaced, or lost while exploring
occupants / seats / human presence.

- **It is the DEFAULT lab view.** Open `http://localhost:5173/table-lab.html` (or 5174 if the
  port is taken) and you get the pure premium table — chips, leather rail, mahogany body, warm
  room — auto-rotating, clean, with no occupants. Always one click away.
- **Return to it at any time** via the immutable tag:
  `git checkout table-3d-premium-reference-2026-06-04` → `cd frontend && npm run dev` → open the lab.
- **Canonical beauty shots:** `.dev-stack/diag/table-3d/elev/REFERENCE-{hero,eye,wide,room}.png`
  (regenerate with `node .dev-stack/lab-shot.mjs` — see the capture note below). Use these to
  compare against ANY future experiment.
- **Rule:** occupant / seat / presence work is an **OPT-IN, isolated, reversible layer**
  (`?seats=on`). It is added beside the table, never on top of it. Never sacrifice the table's
  quality to solve human presence. The table is the star.

---

## How to run the lab

```bash
cd frontend && npm run dev
# open http://localhost:5173/table-lab.html   ← the protected premium table (default)
```

URL params:
- `?cam=wide|hero|close|macro|top|room|rail|gather|eye` — camera presets.
- `?seats=on` — **opt-in** the experimental occupant presence (off by default).
- `?chips=off` — empty table "in repose".
- `?c=literal` — literal 48px favicon C instead of the HD rebuild.
- `?spin=off` — freeze auto-rotation (used for captures).
- debug: `?felt=basic|magenta`, `?env=off`, `?sh=off`, `?cs=off`.

Drag to orbit; it auto-rotates gently in repose.

---

## What the premium table is (elevated this session)

Built on the original 3D spike, every element was raised to "this is a product, not a prototype":

1. **Chips** — clay denominations mapped to Spanish suits, the real green-C favicon as the heart.
   This pass: 2048 face texture + a **bumpMap that tools the C and rim INTO the clay** (a real edge
   of light, not a printed sticker), anti-banding dither, and **real rolled-clay edge spots** so a
   stack reads as interlocking clay chips. (Commit `c29f261`.)
2. **Rail — two parts (the fabricated-object pass):** an inner **padded leather armrest bumper**
   (cordobán cognac, pebbled-grain bump, one restrained saddle-stitch seam, baked valley/crown AO,
   matte broken-in finish — "rest your arms here", not "what expensive leather") framed by an outer
   **turned-wood coaming** (deep mahogany, varnish clearcoat), with a brass reveal where the felt
   meets the leather. (Commits `b04def6`, `85184da`, `f58462f`, `b7e33ae`.)
3. **Body — a piece of furniture:** a molded wood **apron + plinth foot** resting on the floor (a
   stepped reveal under the rail lip), lit by a low warm raking fill so the mass reads — the table
   no longer floats, it is a *mueble*. (Commits `bf559e6`, `e06ae05`.)
4. **Scene atmosphere — a warm room:** a **floor pool of light** under the table + a **warm-dark
   backdrop** skydome, so the table sits in an intimate room (a portada), not a render on black.
   (Commit `929acbf`.)

Philosophy held throughout: social, castizo, human, tactile, premium, modern. No casino / Vegas /
slots / neon / ostentatious gold. The form was **improved, never changed** — the oval/racetrack
direction the operator validated is intact.

---

## Lab structure (committed)

- `frontend/table-lab.html` — isolated entry (NOT in the production `vite build`).
- `frontend/src/lab/main.tsx` — React mount.
- `frontend/src/lab/TableLab.tsx` — the scene: camera presets, lights, environment, the premium
  `Table` (felt + two-part leather/wood rail + body), chips, the warm floor + backdrop, and the
  opt-in `Seats` (occupant presence experiment).
- `frontend/src/lab/textures.ts` — procedural textures: chip face + bump + edge, the Chiribito "C"
  (`drawChiriC`), felt (real logo + real suits), mahogany `woodTexture`, `leatherTexture` +
  `leatherBump` + `drawStitchSeam`, `floorTexture`, `backdropTexture`.
- `frontend/src/lab/silhouettes.ts` + `TableVariant.tsx` — the earlier silhouette exploration
  (oval/capsule/hexagon/plaza). Superseded by the polished oval `Table`; kept for reference.
- `frontend/public/brand/` — REAL official assets (logo, favicon green-C, Spanish-suit aces).

**Dev-only tooling (gitignored under `.dev-stack/`):**
- `.dev-stack/lab-shot.mjs` — Playwright capture. MUST use `--headless=new --use-angle=d3d11
  --enable-gpu` for the real GPU (the script already does). The IDE preview can't capture WebGL.
  Captures land in `.dev-stack/diag/table-3d/elev/`.

---

## Occupant presence — exploration status (OPT-IN, isolated, OPEN)

The operator's brief: human presence **without modeling people** — the suggestion of someone
sitting there (shoulders, suggested back, lean into the table, occupation), so the scene reads as
"there are people playing", not "there are six pretty chairs". The table stays the protagonist;
presence accompanies.

- Implemented as `Seats` / `Occupant`: six abstract, headless back+shoulder masses (a revolved
  profile flattened front-to-back, leaning in, with per-seat variation), hugging the oval, muted so
  they recede. **OPT-IN via `?seats=on`.** (Commits `a0ee933`, `fe2a114`, `ae60c85`.)
- **Honest status: the threshold is NOT clearly crossed yet.** At eye level the masses still read as
  abstract rounded "mounds" more than human presence. Next, if pursued: work the **silhouette**
  (wider/flatter shoulders, asymmetry, a nape taper) toward "people playing" — BEFORE any material,
  colour or posture detail. If it does not cross, question/park the direction. Either way the table
  reference is never touched.

---

## Verification (current)

- `cd frontend && npm run build` → **GREEN** (the lab is dev-only, not in the prod build).
- `cd frontend && npm test` (vitest) → **GREEN, 353/353** (57 files). No regressions.
- Lab renders on the real GPU with **no console errors** (verified via the capture harness).
- 12 pre-existing `tsc` errors in `card-popover.ts` / `token-monitor.ts` / `connection.ts` are
  NOT from the lab (the project compiles with Vite/esbuild, not `tsc`).

---

## Reusable learnings (this environment)

1. The IDE **preview screenshot tool CANNOT capture a live WebGL canvas here** (times out). Capture
   via Playwright (`.dev-stack/lab-shot.mjs`) launched with `--headless=new --use-angle=d3d11
   --enable-gpu` to hit the real RTX 4060 D3D11; the old/software headless path adds artifacts.
2. R3F `<Canvas>` mounts tiny in headless — the script dispatches a `resize` to re-measure.
3. **z-fighting** between the felt plane (y=0) and any coplanar disc rendered as radial "rays" (a
   casino-sunburst). Fix: separate them in Y. Diagnose with a flat unlit magenta plane.
4. PowerShell here-strings for commit messages: **no double quotes inside** (they break the
   `-m` arg). Keep messages quote-free or commit via a file.

---

## Invariants

- The premium table is a **protected reference** (see the top section). Default view = the table.
- Occupant / seat / presence work is **opt-in (`?seats=on`), isolated, reversible**. Never on top of
  the table.
- **No integration** into the game. No push, no deploy, no merge. `main` untouched.
- Game engine / gameplay / Colyseus / card geometry: FROZEN (visual-only exploration).
- Chiribito deploys always require explicit manual confirmation — N/A here (no deploy).

---

## Checkpoints (local, spike branch — no push)

`c29f261` chips · `b04def6` rail wood · `85184da` rail leather · `bf559e6` body · `e06ae05` body
light · `f58462f` leather form · `b7e33ae` leather finish · `929acbf` atmosphere · `a0ee933` /
`fe2a114` / `ae60c85` occupants · `f464616` **protect the premium table (default view, occupants
opt-in)**.

Tags: `table-3d-premium-reference-2026-06-04` (the protected reference) ·
`table-3d-lab-checkpoint-2026-06-04` (the earlier spike checkpoint).
