# Chiribito — Fase 0 (Foundation Consolidation) Handoff

> **Status: IN PROGRESS — 2026-05-20.** Part of the "Unified Identity / Web-first
> Dashboard" initiative (staged). Big Fase 1 identity sprint is GATED.
> Nothing pushed, nothing deployed by this phase except where noted as pre-existing.

---

## 1. Current state

- **Local `main` HEAD:** `54f68b6` (merge commit — El Rincón integrated).
- **`origin/main`:** `e6db55e` — **local main is 17 commits ahead, all UNPUSHED.**
- **Working tree:** clean except this handoff doc (untracked).
- **Initiative direction (user-locked):** chiribito.com becomes the main ecosystem with
  persistent identity + social profile + living dashboard + unified session. Reuse El
  Rincón's soul. Staged: Fase 0 (stabilize) → Fase 1 (web login/dashboard/SSO, gated).
- **Strategic signal:** the live ranking endpoint shows **all current users are
  `invitado_*` guests** — there is no real persistent identity yet. That gap is exactly
  what the identity/dashboard work fills.

## 2. Merges realizados

- **`feat/rincon-del-jugador` → `main`** via `--no-ff` (merge commit `54f68b6`).
  - 12 commits, +919/-1 LoC, 17 files, clean merge (no conflicts).
  - El Rincón del Jugador: in-game player profile ("Carnet Vivo" + generated "Lacre"
    seal + real stats + historia teaser), opened from the lobby. Plus an api-server
    change expanding `GET /api/users/me` with stats columns.
  - **LOCAL ONLY. Not pushed. Not deployed.** The Rincón UI is dormant — it reaches
    users only via a manual `frontend/` Vercel deploy (gated, not done).
  - Branch `feat/rincon-del-jugador` **kept alive** (per user) until real rollout.
- Tests after merge: **api-server 30/30 · frontend 257/257 · game server 475/475 = 762, all green.**

## 3. Wiring validado (external, read-only — 2026-05-20)

- **play.chiribito.com bundle** (`assets/index-QWYRihEJ.js`) compiled to
  `https://backend.chiribito.com` (API) + `wss://realtime.chiribito.com` (WS).
  **No old `*.onrender.com` / `chiri-backend` hosts** — VITE_* envs are correct in the
  live build.
- **Health:** `backend.chiribito.com/health` 200 OK · `realtime.chiribito.com/health` 200 OK.
- **API ↔ Postgres LIVE:** `/api/ranking/top-winners` returns real data (DB up now).
- **CORS:** `play.chiribito.com` allowed (ACAO + credentials). **`chiribito.com` NOT
  allowed → 500** (not in `ALLOWED_ORIGINS`).
- **Web Wave 0 (honest landing): DONE + PUSHED + DEPLOYED.** 14 atomic commits
  (`e90b716`..`4144d5b`, in `origin/main`): stripped v0.app generator, removed
  Bonos/Reviews/StatsGrid/HomeCards/ChipCounter, defanged Newsletter, wired Hero+Navbar
  CTAs to play, castizo alt text, accents, removed Trustpilot icon, deduped ScrollToTop,
  dropped orphan asset, reordered sections. Live chiribito.com confirmed free of all
  fake-content signals; 3× play.chiribito.com CTAs present.
- **Backend security headers:** strong (helmet CSP, HSTS preload, frame-ancestors, nosniff).

### Pending dashboard confirmations (user-side, not externally observable)
- **A — `JWT_SECRET` identical on `chiribito-api` + `chiribito-colyseus`.** Strong
  indirect evidence it already is (the live game logs in via API and joins Colyseus,
  which only works with a shared secret). Confirm in Render. (+ `INTERNAL_API_SECRET` parity.)
- **C — Render `autoDeploy` / git-wiring** for api + colyseus on `main`. `render.yaml`
  declares `autoDeploy: true`; confirm the actual git connection before any `git push`.

## 4. Riesgos pendientes

| # | Riesgo | Severidad | Acción |
|---|---|---|---|
| R1 | Render free Postgres expires ~2026-06-12 | 🔴 calendario | 0.1 — 1-click upgrade to `starter` ($7/mo), no code |
| R2 | `chiribito.com` not in `ALLOWED_ORIGINS` → 500 | 🟡 (bloqueante de Fase 1) | Add `https://chiribito.com` (+ `www`) to api `ALLOWED_ORIGINS` before web calls API |
| R3 | Login increments `tokenVersion` (invalidates older tokens) | 🟡 | SSO must reuse ONE token; never double-login web+game |
| R4 | Vite inlines API/WS URLs at BUILD | 🟢 | Any client URL change needs a frontend redeploy |
| R5 | El Rincón merged but unpushed + undeployed | 🟢 | Rollout = manual frontend deploy, explicitly gated |
| R6 | Residual landing tone debt (Torneos generic copy, /contacto orphan, Newsletter is honest-but-placeholder, Timeline ends 2005) | 🟢 | Vision spec Waves 1–4 (optional, post-foundation) |
| R7 | `realtime/health` returns `ACAO: *` vs strict API whitelist | 🟢 | Note; Colyseus handshake may have own origin config |

## 5. Siguiente fase recomendada

**First — close Fase 0 (small, mostly user-side):**
1. 0.1 — DB upgrade to `starter` (Render dashboard).
2. Confirm A (JWT_SECRET parity) + C (Render autoDeploy) in dashboards.
→ Then Fase 0 = DONE (foundation stable, honest web live, identity merged locally).

**Then — Fase 1 (the real "living connected ecosystem with real identity"), GATED:**
- Web `/login` + `/dashboard` in Next.js/shadcn (the kit already exists in `web/`),
  reusing El Rincón's PURE logic (`frontend/src/app/rincon/identidad.ts`, `types.ts`,
  `data.ts` — framework-free, ~50% portable).
- `.chiribito.com` cookie SSO so chiribito.com ↔ play.chiribito.com share one session.
- **Prereqs:** R1 (DB) done · R2 (CORS add chiribito.com) · A (JWT_SECRET parity) confirmed.
- Requires its own brainstorm → spec → plan before any code.

**Optional parallel/later — Web Waves 1–4 (castizo polish, NOT identity):**
- Quick wins: collapse/rewrite generic Torneos copy; rename Tips "¿Sabías que...?";
  cohere `/contacto` with the global shell.
- Deeper: Timeline 2005→2026 (Wave 3); real Newsletter via Resend (Wave 4, needs R9);
  mobile pacing pass (Wave 4).
- Spec: `docs/superpowers/specs/2026-05-20-chiribito-web-product-vision-and-roadmap.md`
  (Wave 0 section is now historical — already executed).

---

## 6. Fase 1 — Slice 1 brainstorm (decisions LOCKED + resume point) — 2026-05-20

**Initiative decomposed into 4 slices (walking-skeleton-first):**
1. **Slice 1 — Unified-session walking skeleton (NEXT):** chiribito.com login → shared session → minimal dashboard → "Entrar" → play.chiribito.com recognizes you (no 2nd login).
2. Slice 2 — Rich dashboard / El Rincón ported to web (React/shadcn, reusing its pure logic).
3. Slice 3 — Guest→account conversion.
4. Slice 4 — Social / progression polish.

**Slice 1 decisions LOCKED (do not re-litigate):**
- **Game's own login STAYS** (Option A): play.chiribito.com keeps its login for direct visitors; the web→game flow is **additive** on top. Zero disruption to the current flow.
- **Session transport = URL-fragment handoff, designed cookie-ready** (Option 1 + spirit of 3): web logs in via `POST backend.chiribito.com/api/auth/login`; on "Entrar" redirects to `play.chiribito.com/#access=<token>&refresh=<refresh>`; game reads the fragment at boot (before its existing hydration), saves to SecureStorage, strips the hash via `history.replaceState`, then its normal flow lands the user in the lobby authenticated. Cookie SSO (Option 2) is the FUTURE hardening — design the game's session-ingestion as a clean, swappable "session source" so the later migration is localized, not a redesign.
- **tokenVersion golden rule:** ONE login (web) → ONE token → game REUSES it, never re-logins (a re-login bumps tokenVersion and kills the web session).
- **Scope:** login-only (existing accounts); minimal dashboard (greeting + Entrar; optionally 1-2 real stats from the now-merged expanded `/me`). Register, guest→account conversion, full Rincón, social — DEFERRED to later slices.
- **Boundaries:** touches auth/session code only (`web/` login UI, `api-server` CORS/session, `frontend/` boot+auth). Does NOT touch mesa/felt/gameplay/`TableScene`/`style.css`.
- **Backend change for Slice 1 = minimal:** add `https://chiribito.com` (+ consider `www`) to `ALLOWED_ORIGINS` (today it 500s); deploy the expanded `/me` (already merged locally) for the dashboard to show stats.

**Resume protocol — next session:**
- Re-enter the **brainstorming** skill mid-flow at step 5 (present full Slice 1 design) → write spec to `docs/superpowers/specs/<date>-chiribito-slice-1-unified-session-design.md` → self-review → user review → **writing-plans**. The decisions above are settled inputs, not open questions.
- Open prereqs (user-side, parallel): 0.1 DB upgrade · confirm A (JWT_SECRET parity) + C (Render autoDeploy). Slice 1 implementation also needs R2 (CORS += chiribito.com).
- Nothing pushed/deployed; local `main` ahead of origin; El Rincón merged local-only; branch `feat/rincon-del-jugador` kept alive.

---

**Discipline carry-forward:** atomic commits · 6-point format before important changes ·
stop-on-ambiguous · castizo §2.3 gate for any web copy · Vercel team gate
`chiribito293-7173` before any vercel command · no push/deploy without explicit go.
