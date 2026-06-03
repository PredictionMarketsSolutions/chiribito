# HANDOFF — Table Presence ("el tapete respira")

> Milestone: **Premium Table / Table Presence** (perceptual). Phase opened 2026-06-03.
> Checkpoint stamp: **2026-06-03**. Status: **L1 shipped-local + M1 shipped-local, both AWAITING the on-device perceptual gate. NOTHING merged / pushed / deployed.**
> Read this first to resume without losing the perceptual direction.

---

## TL;DR (current position)

We opened the Table Presence pass on top of shipped **P1 (Mobile Card Materiality)**. Two
reversible, additive, CSS-only slices are implemented and committed on a **local-only** branch,
both **runtime-validated** but **not yet gate-approved on a real device**:

- **L1 — "el tapete respira"** (ambient felt breathe). Operator approved the *direction/firma*; 0.12 amplitude committed as the foundation. On-device amplitude fine-tune still optional/open.
- **M1 — "woven baize"** (felt weave/fibre). Runtime gates all PASS; **operator on-device perceptual gate PENDING**.

`main` is untouched at the P1 shipped state. The whole pass is reversible (per-slice `git revert`).

---

## Git state (verified 2026-06-03)

| Item | Value |
|---|---|
| Working branch | `style/table-breathe` — **LOCAL ONLY** (not on origin, no upstream) |
| Branch tip | `e125176` (M1) → `17bbe53` (L1) → `1349275` (P1, = `main`) |
| `main` | `1349275` = `origin/main` (in sync, **untouched**) |
| Working tree | clean (after this handoff commit) |
| Pushed / merged / deployed | **NONE** for Table Presence |

### Commits on the branch
- `17bbe53` `style(table): el tapete respira -- ultra-subtle ambient felt breathe (Table Presence L1)`
- `e125176` `style(table): woven baize -- green-on-green felt fibre (Table Presence M1, awaiting gate)`

Each touches a tiny, additive surface and reverts cleanly in one commit.

---

## Slices

### L1 — Ambient felt breathe ("el tapete respira") — committed `17bbe53`
- **What:** a dedicated `.table-breath` layer behind the felt (`z-index:-1`, centre occluded by the opaque felt) whose **opacity** breathes on a slow 10s cycle, gently deepening the table's resting drop shadow. Weight + atmosphere, **never motion**.
- **Why this mechanic:** the first try animated `box-shadow` directly → desktop ~42fps (repaint). Recalibrated to opacity-only (compositor-cheap) → **~60fps desktop + mobile**. The felt's own `box-shadow` stays constant.
- **Files:** `frontend/index.html` (`<div class="table-breath">` first child of `.table-surface`) + `frontend/src/style.css` (`.table-breath` rule + `@keyframes table-breathe` + `prefers-reduced-motion` guard).
- **Runtime gate (PASS):** felt shadow constant; breath opacity 0→1; ~60fps both; reduced-motion pins it off; vitest 319/319; build clean.
- **Perceptual status:** **DIRECTION APPROVED by operator** ("la firma perceptual es correcta"). Amplitude is deliberately subliminal (`maxDelta ~1.1/255` rest→peak). On-device amplitude fine-tune **optional/open**.
- **Amplitude knob:** `.table-breath { box-shadow: 0 40px 110px rgba(0,0,0, 0.12) }` — the `0.12` alpha is the depth of the breath.

### M1 — Woven baize (felt fibre) — committed `e125176`
- **What:** a faint, **static**, desaturated→**green-tinted** fractal-noise fibre tiled over `.table-surface` and composited at low alpha, so the green reads as woven cloth ("el verde parece paño").
- **Why this mechanic (important for resume):** `soft-light` looked like cloth but **lightened the dark felt** (fibre and lightening were coupled). Root cause: SVG filters run in **linearRGB** by default (green came out brighter) + soft-light is asymmetric on dark. Fix: **mean-neutral green-on-green** tint (same idea as the `::after` micro-variation) + `color-interpolation-filters='sRGB'`. This **preserves the green AND decouples fibre amount from tone**.
- **Files:** `frontend/src/style.css` — `.table-surface` `background-image` now has 2 layers (noise + the unchanged felt gradient) with `background-size`/`background-repeat`. No blend-mode (normal). The felt gradient/centre/wood/gold-rim are unchanged.
- **Runtime gate (PASS, desktop + Pixel 5):** colour meanLum Δ **+0.4** (same green); fibre stddev **0.43→1.15** (present); maxΔ **~5** (subtle); diff = fine random fibre (**no pattern / no tile seams**); build clean; vitest **319/319**.
- **Perceptual status:** **PENDING — operator on-device gate not done.** Conservative amplitude; subliminal at real size, visible as fine fibre at 3x zoom.
- **Amplitude knob (now decoupled from colour):** `.table-surface` weave `rect opacity` (currently **0.30**) + the `feFunc*` slopes. Raise opacity to ~0.38–0.40 for more presence; the tint is felt-centred so the colour stays put.

---

## Perceptual direction (LOCKED — do not lose)

Goal: make the table feel **more alive, deep, premium, tactile, nocturnal/social** — *more physical
atmosphere, NOT more FX*. The phrase for M1 is **"el verde ahora parece paño."**

**Hard NOs (operator-locked):** casino / Vegas / crypto-casino · glow · spotlight · neon · gaming UI ·
visible grain · recognizable pattern · "effect" · any chromatic shift of the felt · animation the user
**consciously** notices ("if you notice it, it's too strong") · competing with the cards.

**Always keep:** cards protagonists · centre clean · legibility intact · matte · quiet richness ·
mobile-first · `prefers-reduced-motion` · identity invariants (felt gradient, wood 16px, gold rim,
`max-width 980`, seats 6%/94%, castizo vocab).

**Discipline (P1 parity):** micro-phases · ONE perceptual variable per gate · reversible (1 commit) ·
runtime apples-to-apples capture (Playwright, desktop 1920×1080 + Pixel 5) · **operator on-device gate
before merge/deploy** · STOP-on-ambiguous (do not escalate) · no merge/push/deploy without explicit OK.

---

## Recommended sequence (operator-approved)

1. **Gate M1 on device** → keep 0.30 / raise / lower. Then it's mergeable with the rest.
2. **M2 — felt recessed depth** (felt set *into* the wood: a subtle inner shadow ramp at the rim). Low risk, "premium/profundo".
3. **M4 — wood grain** on the 16px border (today flat colour). Low risk.
4. **Direction B — ghost mark (alma; sensitive, gate hard):**
   - **G0 (decision):** choose a **minimal noble glyph** — NOT the official emblem. The official logo (`frontend/public/brand/logo.png`) is an ornate gold/red casino badge with a "CHIRIBITO.COM" wordmark — i.e. exactly the "central casino mark" to avoid, and that `.COM` was already deliberately removed from card backs (`back_logo.png` → `back-clean.svg`). **Do not re-use it and do not redraw the official branding (locked).** Candidates: monogram "C" / a single Baraja suit pip / a tiny mascot silhouette / a letterless cartouche.
   - **G1:** material **deboss** of the chosen glyph into the felt — monochrome tonal, ultra-low contrast, **peripheral (never centre)**, "almost a ghost". HARD gate (touches the playing surface that was deliberately cleared).
5. Later (separate milestone steps): **L2 grounding** (extend the desktop-only Pixi contact-shadow depth pass; decide the mobile/DOM stance) → physical **chips/stacks** (amount as volume) → **pot** (last; revisit the "pot below-board" rejection — needs an explicit operator call). Chips must read as SOCIAL/TACTILE objects, never money; zero jackpot feel.

---

## Capture harnesses (LOCAL ONLY — `.dev-stack/` is gitignored)

Re-create or reuse on resume (Vite frontend up on `:5173`, no backend needed):
- `.dev-stack/table-breathe-capture.ts` — L1 objective capture (shadow constancy, breath opacity, FPS, reduced-motion). `npx tsx .dev-stack/table-breathe-capture.ts`
- `.dev-stack/table-breathe-video.ts` — L1 loop video (temporal gate).
- `.dev-stack/table-breathe-compare.ts` — L1 before/after + amplified diff composites.
- `.dev-stack/table-weave-capture.ts` — M1 capture (baseline vs weave felt patch + amplified diff + cards-on-felt legibility; meanLum/stddev/maxΔ). `npx tsx .dev-stack/table-weave-capture.ts`
- Outputs under `.dev-stack/diag/table-breathe/` and `.dev-stack/diag/table-weave/` (gitignored).

Pattern notes: frontend-only (inject the real `.table-surface`), esbuild `__name` shim required before in-page `evaluate`, measure objectively (mirrors P1's `cardmat-rest-capture.ts`).

---

## Open risks / items

- **M1 perceptual gate not done** — operator must judge on a real device; amplitude may need a nudge (knob above).
- **L1 amplitude is subliminal** (0.12) — operator may want a small on-device bump.
- **Weave mobile paint** — it's a static tiled SVG (cheap) and validated visually, but the existing auth/lobby grain is `display:none` on mobile (perf caution); a real-device paint check is prudent before ship.
- **Branch is local-only + ungated for ship** — needs the gate, then a merge/push/deploy decision (operator OK required every time; no auto-deploy).
- **R1 — Postgres free tier expires ~2026-06-12** (unrelated to this pass, but a standing deadline). Migration branch `chore/postgres-starter-r1` (`4ca7097`) is ready; operator runs the Render dashboard plan change.

---

## Deploy / merge status

- **Merged:** none. `main` untouched at `1349275` (P1).
- **Pushed:** none (branch is local-only).
- **Deployed:** none. Production `play.chiribito.com` is still the P1 build.
- Deploys require **explicit manual confirmation every time** (no auto-deploy; Vercel team gate `chiribito293-7173`).

---

## Resume protocol (new session)

1. `Hola Chiribito` → adopt the CEO OS; the greeting reads this file + the ceo-os roadmap.
2. `git checkout style/table-breathe` (local), confirm tip `e125176`.
3. Start the gate from where we stopped: **operator gates M1 on device** (keep/raise/lower the weave), then optionally tune L1, then proceed to **M2**.
4. Keep the discipline above. Do NOT merge/push/deploy without explicit OK.
