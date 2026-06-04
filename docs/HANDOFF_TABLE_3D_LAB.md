# HANDOFF — Table 3D Lab (final session handoff, exhaustive)

**Date:** 2026-06-04 (premium elevation + protection + close-out)
**Branch:** `spike/table-3d-hero` (off `9344453` on `style/table-breathe`) — **LOCAL only**
**Tip:** `d17df37` · **Reference tag:** `table-3d-premium-reference-2026-06-04` (→ `d17df37`)
**Status:** Isolated 3D table laboratory (React Three Fiber). **NOT integrated. No push, no deploy,
no merge.** `main` and the live product (`play.chiribito.com` / `chiribito.com`) are unaffected.
This document is written so a future session can resume EXACTLY here with no context loss.

---

## ⭐ PROTECTED REFERENCE — the premium table (READ FIRST)

The **premium oval table** is the most valuable asset produced by this lab and is a **protected
reference**. Never degrade it, replace it, or lose the reference while exploring occupants / seats /
human presence. Four protection layers are in place:

1. **Default lab view** — open the lab and you get the pure premium table (chips, leather rail,
   mahogany body, warm room), auto-rotating, clean, **no occupants**. Always one click away.
2. **Immutable tag** — `git checkout table-3d-premium-reference-2026-06-04` returns to this exact
   version forever, whatever happens afterwards.
3. **Canonical beauty shots** — `.dev-stack/diag/table-3d/elev/REFERENCE-{hero,eye,wide,room}.png`.
   Compare against ANY future experiment. (Regenerate with `lab-shot.mjs` — see capture note.)
4. **This handoff + the project memory** — the directive persists across sessions.

**Rule:** occupant / seat / presence work is an **OPT-IN, isolated, reversible layer** (`?seats=on`),
added beside the table, never on top of it. Never sacrifice table quality to solve human presence.

---

## How to run the lab + LOCAL URL

```bash
cd frontend && npm run dev
```
- **Local URL:** `http://localhost:5173/table-lab.html` — the protected premium table (default).
  (Vite uses **5174** if 5173 is occupied by another dev server — check the `npm run dev` output.)
- Drag to orbit; it auto-rotates gently. The default view is the protected reference.

URL params:
- `?cam=wide|hero|close|macro|top|room|rail|gather|eye` — camera presets.
- `?seats=on` — **opt-in** the experimental occupant presence (OFF by default).
- `?chips=off` — empty table "in repose". `?c=literal` — literal 48px favicon C.
- `?spin=off` — freeze auto-rotation (for captures). Debug: `?felt=basic|magenta`, `?env=off`,
  `?sh=off`, `?cs=off`.

---

## What the premium table is (elevated this session — "product, not prototype")

The oval/racetrack direction the operator validated was **improved, never changed**. Each element
raised to product quality (every change passed the test: *more expensive? heavier? more fabricated?*):

1. **Chips** — clay denominations = Spanish suits, real green-C favicon as the heart. This pass:
   2048 face texture + a **bumpMap that tools the C and rim INTO the clay** (a real edge of light,
   not a printed sticker), anti-banding dither, and **real rolled-clay edge spots** so a stack reads
   as interlocking clay chips.
2. **Rail — two parts (the fabricated-object pass):** an inner **padded leather armrest bumper**
   (cordobán cognac; pebbled-grain bump; one restrained saddle-stitch seam; baked valley/crown AO;
   matte, broken-in — "rest your arms here", not "what expensive leather") framed by an outer
   **turned-wood coaming** (deep mahogany, varnish), with a brass reveal where felt meets leather.
3. **Body — a piece of furniture (un mueble):** a molded wood **apron + plinth foot** on the floor
   (a stepped reveal under the rail lip), lit by a low warm raking fill so the mass reads — the
   table no longer floats.
4. **Scene atmosphere — a warm room:** a **floor pool of light** + a **warm-dark backdrop** skydome
   → the table sits in an intimate room (a portada), not a render on black.

Philosophy held: social, castizo, human, tactile, premium, modern. No casino / Vegas / slots /
neon / ostentatious gold.

---

## VALIDATED vs NOT validated (be precise)

**Validated (operator-approved this session):**
- The 3D real-time (R3F) direction over the old 2D/Pixi table.
- The oval / racetrack silhouette (improve, do not change).
- Premium chips (tooled C + clay edge spots).
- The two-part leather + wood rail (comfort/“fabricated object”).
- The body-as-furniture (mass under the rail; "un mueble").
- The warm-room atmosphere (floor pool + backdrop). Operator: atmosphere crossed "it works"; do
  NOT spiral on grading/vignette micro-tuning.
- The premium table as the protected reference asset.

**NOT validated / open:**
- **Occupant presence** — does NOT yet read as "people playing" (reads as abstract "mounds" at eye
  level). OPEN. (See next section.)
- **Mobile performance** — UNVERIFIED (desktop RTX is smooth + crisp). See the publication section.
- **Online publication** — evaluated below, not executed.
- Deferred optional table micro-details: brass piping at the leather/wood junction; a felt baize-nap
  material pass. (Optional; the table is already validated without them.)

---

## Lab structure (committed)

- `frontend/table-lab.html` — isolated entry (**NOT in the production `vite build`** — index.html only).
- `frontend/src/lab/main.tsx` — React mount.
- `frontend/src/lab/TableLab.tsx` — the scene: camera presets, lights, environment, premium `Table`
  (felt + two-part leather/wood rail + body), chips, warm floor + backdrop, opt-in `Seats` (occupants).
- `frontend/src/lab/textures.ts` — procedural textures: chip face + bump + edge, the Chiribito "C"
  (`drawChiriC`), felt (real logo + suits), `woodTexture`, `leatherTexture`/`leatherBump`/
  `drawStitchSeam`, `floorTexture`, `backdropTexture`.
- `frontend/src/lab/silhouettes.ts` + `TableVariant.tsx` — earlier silhouette exploration; superseded
  by the polished oval `Table`; kept for reference.
- `frontend/public/brand/` — REAL official assets (logo, favicon green-C, Spanish-suit aces).
- Dev-only (gitignored, `.dev-stack/`): `lab-shot.mjs` (Playwright capture; MUST use
  `--headless=new --use-angle=d3d11 --enable-gpu` for the real GPU). Captures → `diag/table-3d/elev/`.

---

## Occupant presence — status + WHY parked (OPT-IN, isolated, OPEN)

Operator brief: human presence **without modeling people** — the suggestion of someone sitting
(shoulders, suggested back, lean into the table, occupation) → "there are people playing", not "six
pretty chairs". The table stays the protagonist; presence accompanies.

- Implemented `Seats` / `Occupant`: six headless back+shoulder masses (a revolved profile flattened
  front-to-back, leaning in, per-seat variation), hugging the oval, muted to recede. **`?seats=on`.**
- **Why parked:** the threshold is **not clearly crossed** — at eye level the masses still read as
  abstract rounded "mounds", not human presence. The operator chose to protect the validated table
  rather than accumulate detail (material/colour/posture) on an unresolved silhouette.
- **If resumed:** work the **silhouette first** — wider/flatter shoulders, asymmetry, a nape taper —
  toward "people playing"; only THEN material/colour/posture. If it still does not cross, question or
  re-approach the whole presence idea. The table reference is never touched either way.

---

## Verification (current)

- `cd frontend && npm run build` → **GREEN** (lab is dev-only, not in the prod build).
- `cd frontend && npm test` (vitest) → **GREEN, 353/353** (57 files). No regressions.
- Lab renders on the real GPU with **no console errors** (verified via the capture harness).
- 12 pre-existing `tsc` errors (card-popover / token-monitor / connection) are NOT the lab (the
  project compiles with Vite/esbuild, not `tsc`).

---

## ONLINE PUBLICATION — initial evaluation (analysis only — NOT executed)

**Goal:** a public URL to view / share / review the premium-table demo. NOT replacing the game
table, NOT integrating into gameplay. A pure visual demo.

**Can it be shown fully isolated from the game? YES.** The lab is a separate Vite HTML entry with
its own React tree; it imports nothing from the game, is not in the game bundle, and has **no
backend, no game data, no secrets, no network calls** — pure static client-side WebGL. It can be
published as a standalone static page with zero coupling to, and zero risk for, the game.

**What publishing would take (steps — NOT done):**
1. Make the lab a build target: add `table-lab.html` to `vite.config.ts` `build.rollupOptions.input`
   (the prod build currently emits only `index.html`). React/three/@react-three are devDependencies
   (fine at build time; if a separate minimal build is used, promote them to dependencies). Confirm
   `/brand/` assets are emitted.
2. `npm run build` → a `dist/` with `table-lab.html` + hashed JS + `/brand/`. Test via `vite preview`
   on desktop **and a real phone**.
3. (If needed) a mobile perf pass — see Risks.
4. Deploy the static output to a **separate, isolated Vercel project** under the **Chiribito** Vercel
   identity (team `chiribito293-7173`; **NEVER** the PMS workspace — hard-separation rule). Optionally
   enable Vercel **password protection** (it is a WIP design) + `noindex`.
5. Map a subdomain (e.g. `mesa-lab.chiribito.com`) or use the Vercel-generated URL.
6. Chiribito deploys require **explicit manual operator confirmation** every time (policy) — this is
   GATED on the operator, later.

**Risks:**
- The build-config change touches the shared `vite.config.ts` (also used by the game build) — verify
  the game build still emits correctly. Mitigate: add the lab as an ADDITIONAL input; don't alter the
  game's. Low risk but real.
- Bundle size: three.js + drei ≈ 0.6–1 MB+ JS → load time on slow mobile networks. Acceptable for a
  demo; note it.
- **Mobile performance is the main unknown** (Chiribito is mobile-heavy). The scene is moderately
  heavy: a 2048 shadow-mapped spotlight, **per-frame `ContactShadows`** (not baked), `dpr` up to 2,
  ~150–200 individual chip draw calls, and continuous auto-rotate (constant render loop). Desktop
  (RTX 4060) is smooth + crisp; mobile is **unverified** and may stutter / drain battery. A mobile
  pass would: **instance the chips** (InstancedMesh), **bake `ContactShadows`** (`frames={1}`), cap
  `dpr` ~1.5 and shadow map ~1024 on mobile, and consider dropping the realtime shadow.
- Exposure: a public URL reveals a pre-release design direction. Mitigate with password protection /
  an unlisted URL / `noindex`.
- **No data/secret risk** (static, no backend). ✓

**Independent lab vs protected route — RECOMMENDATION:** Deploy as an **INDEPENDENT, isolated static
demo** (its own Vercel project + subdomain or preview URL), **NOT** as a route inside the production
game/web build. Rationale: it keeps the lab 100% decoupled (a lab bug or its heavy bundle can never
affect `play.chiribito.com` / `chiribito.com`), matches the protect-the-asset + isolation ethos, is
trivial to share and to take down, and needs no change to the live product. A protected route inside
Chiribito would couple the lab's three.js bundle + build to production — not worth it for a demo.

**Bottom line:** safely publishable as an isolated static demo with a small build-config step +
(recommended) a mobile perf pass. Desktop is ready now; **mobile needs validation**; the deploy is
gated on operator go. No part of this requires touching the game.

---

## NEXT-SESSION options / recommendations

- **A) Publish the demo** (if the operator wants the public URL): build-config step + mobile perf
  pass + isolated Vercel deploy. Gated on explicit go. (See the publication section.)
- **B) Occupants** — resume the silhouette (isolated `?seats=on`): wider/flatter shoulders,
  asymmetry, nape taper → try to cross "hay gente jugando"; or decide to park / re-approach. Never
  touches the table.
- **C) Optional table micro-polish** (only if desired — the table is already validated): the deferred
  brass piping at the leather/wood junction; a felt baize-nap pass; a final colour-grade/vignette. All
  small, all isolated, none required.
- **D) Mobile / perf hardening** of the table (chip instancing, baked shadows, dpr caps) — valuable
  regardless and a prerequisite for A (publish) and B-on-mobile.

**Recommendation:** next session, decide between **A (publish)** and **B (occupants)**. The table is
done + protected; everything else is optional polish or the open presence question. If publishing,
do **D** first (mobile hardening) so the demo is good on phones.

---

## Reusable learnings (this environment)

1. The IDE **preview screenshot tool CANNOT capture a live WebGL canvas here** (times out). Capture
   via Playwright (`.dev-stack/lab-shot.mjs`) with `--headless=new --use-angle=d3d11 --enable-gpu`
   to hit the real RTX 4060 D3D11; the old/software-headless path adds artifacts. Then Read the PNG.
2. R3F `<Canvas>` mounts tiny headless — the script dispatches a `resize` to re-measure to viewport.
3. **z-fighting** between the felt plane (y=0) and any coplanar disc renders as radial "rays" (a
   casino sunburst). Fix: separate them in Y. Diagnose with a flat unlit magenta plane.
4. **PowerShell here-strings for commit messages: NO double quotes inside** (they break the `-m`
   arg — happened this session). Keep messages quote-free, or commit via a file.

---

## Invariants

- The premium table is a **protected reference** (top section). Default view = the table.
- Occupant / seat / presence work is **opt-in (`?seats=on`), isolated, reversible** — never on top.
- **No integration** into the game. No push, no deploy, no merge. `main` untouched.
- Game engine / gameplay / Colyseus / card geometry: **FROZEN** (visual-only exploration).
- Vercel: the Chiribito identity ONLY (team `chiribito293-7173`); never the PMS workspace. Every
  deploy requires explicit manual operator confirmation.

---

## Relevant commits (local, spike branch — no push) + tags

| Commit | What |
|--------|------|
| `c29f261` | chips — tooled C, sharper faces, real clay edge spots |
| `b04def6` | rail wood R1 — deep mahogany + varnish |
| `85184da` | rail R2 — two-part leather + wood rail |
| `bf559e6` | body R3a — molded apron + plinth (furniture mass) |
| `e06ae05` | body R3a.2 — warm raking fill (mass reads) |
| `f58462f` | leather form R3b.1 — compressed broken-in roll |
| `b7e33ae` | leather finish R3b.2 — valle oscuro + corona, matte |
| `929acbf` | scene atmosphere — warm room (floor pool + backdrop) |
| `a0ee933` / `fe2a114` / `ae60c85` | occupants — massing → accompany → occupant presence |
| `f464616` | **protect the premium table (default view; occupants opt-in)** |
| `d17df37` | **docs — declare the premium table the protected reference** ← TIP |

**Tags:** `table-3d-premium-reference-2026-06-04` (protected reference, → `d17df37`) ·
`table-3d-lab-checkpoint-2026-06-04` (earlier spike checkpoint).

**To resume:** `git checkout spike/table-3d-hero` (or the tag) → `cd frontend && npm run dev` →
`http://localhost:5173/table-lab.html`.
