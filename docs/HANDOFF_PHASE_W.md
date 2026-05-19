# Chiribito — Phase W Handoff (Web Integration Layer)

> **Status: SHIPPED — 2026-05-19.** Web layer integrated into the Chiribito
> monorepo, deployed under the Chiribito-isolated Vercel team, cut over to
> `chiribito.com` apex + `www` redirect. Game stack unchanged.

---

## Final state

### Architecture (live)

```
chiribito.com              → web (Vercel chiribito-web, Chiribito-isolated team)
www.chiribito.com          → 308 → chiribito.com
play.chiribito.com         → game (Vercel chiribito-play, untouched)
backend.chiribito.com      → API (Render, untouched)
realtime.chiribito.com     → Colyseus (Render, untouched)
```

### Smoke (final, all green)

| URL | Status |
|---|---|
| `https://chiribito.com/` | 200 — new web (title `Chiribito - El Alma del Póker Español`, 125 KB) |
| `https://www.chiribito.com/` | 308 → `https://chiribito.com/` |
| `https://play.chiribito.com/` | 200 — game intact |
| `https://backend.chiribito.com/health` | `{"status":"ok"}` |
| `https://realtime.chiribito.com/health` | `{"status":"ok"}` |

### Repo

- `web/` lives at top-level of `chiri-app/` (additive integration, no monorepo restructure done)
- `web/` is independent: own `package.json`, own `pnpm-lock.yaml`, own `node_modules/`, no pnpm workspaces yet
- `web/` deploys from local via `cd web && vercel --prod` (Vercel project `chiribito-web` linked, `web/.vercel/` gitignored)

### Vercel state

| Item | Value |
|---|---|
| Team | `chiribito293-7173s-projects` (Chiribito-isolated, **not** PMS) |
| Project | `chiribito-web` (id `prj_zTHZN1wNv7BW5KM3CfDZKBJEQ4fo`) |
| Production deploy | `dpl_GhSbbdxmQFNC7y7H1muBzZFo9QaU` (commit `ed937f3`) |
| Aliased URL | `https://chiribito-web.vercel.app` |
| Custom domains attached | `chiribito.com` (canonical) + `www.chiribito.com` (308 → apex) |
| Env vars | none required (static site, no API calls from landing yet) |

### DNS state (Namecheap, user-controlled)

| Record | Value | Notes |
|---|---|---|
| `chiribito.com` A | `216.198.79.1` | Vercel anycast shared, team-routed (no change made) |
| `www.chiribito.com` CNAME | `2167a62424ee3fd8.vercel-dns-017.com` | Vercel-managed (no change made) |
| `_vercel.chiribito.com` TXT × 3 | `vc-domain-verify=play.chiribito.com,…` + `=chiribito.com,…` + `=www.chiribito.com,…` | Verification anchors for all 3 domains |
| `play.chiribito.com` CNAME | `f7e1c5570d690f03.vercel-dns-017.com` | Game project, **untouched** |
| `backend.chiribito.com` CNAME | Render | **Untouched** |
| `realtime.chiribito.com` CNAME | Render | **Untouched** |

The cutover happened via Vercel team ownership transfer after TXT verification —
no A/CNAME changes were needed. The old (inaccessible) Vercel team lost serving
rights for `chiribito.com` / `www.chiribito.com` once our team verified.

---

## What Phase W actually did (commit chain)

```
ed937f3 chore(web): refresh stale external links to current Chiribito ecosystem    ← W.3
8c5c756 chore(web): gitignore vercel project metadata                              ← W.2.b prep
cb29bfb chore(web): sync next-env.d.ts with production build output                ← W.2.a
f2a8e29 chore(web): explicitly scope turbopack root to web/                        ← W.2.a
718c0fe docs: add monorepo target structure plan (deferred — not executed)         ← W.1
d9940e2 chore(web): rename package to chiribito-web + add README with deuda flags  ← W.1
648f055 feat(web): snapshot WEB-CHIRIBITO@2f3273e into web/ (detached, optimized)  ← W.1
```

| Sub-phase | Outcome |
|---|---|
| W.1 | Snapshot of `polito101/WEB-CHIRIBITO@2f3273e` into `web/`, detached. Asset hygiene applied (87 MB → 6.4 MB). README + monorepo target plan added. |
| W.2.a | `pnpm install` + local build verified. Turbopack root coupling fixed (`web/next.config.mjs`). `next-env.d.ts` synced to production path. |
| W.2.b | Vercel project `chiribito-web` created in Chiribito-isolated team. First deploy live at `chiribito-web.vercel.app` (production target, no custom domain → zero real impact). `.vercel` added to `web/.gitignore`. |
| W.3 | 4 stale external links refreshed: `polito101/Chiri-backend` → `PredictionMarketsSolutions/chiribito` (hero + footer); `chiri-frontend.onrender.com` → `play.chiribito.com` (bonos + torneos). Redeployed via Vercel skill. |
| W.4 | Custom domain attach + verification. `chiribito.com` + `www.chiribito.com` claimed in Chiribito team via 2 added TXT records. Cutover happened automatically via Vercel team-routing (no A/CNAME mutation needed). www configured as 308 → apex. |

---

## Restrictions stabilized (carry-forward)

🔒 Strict separation between Chiribito ↔ PMS ↔ PT remains intact at runtime
infra level (Vercel teams, Render workspaces, env vars, domains).

🔒 `web/` is its own island inside the monorepo — no workspaces, no shared
deps with `frontend/`/`src/`/`api-server/`.

🔒 Game stack (`frontend/`, `src/`, `api-server/`, `render.yaml`,
`play.chiribito.com`, `backend.chiribito.com`, `realtime.chiribito.com`) was
NOT touched during Phase W.

🔒 Apex DNS records (A + CNAMEs) were NOT mutated. Only TXT records added.

🔒 Identity invariants from prior sprints (Compact Density Pass, Runtime Diag,
Move 1/1.5/2, Slice A1/A2.0) untouched.

---

## Deuda explícita (NOT addressed in Phase W)

| # | Item | Where | Severity |
|---|---|---|---|
| 1 | `web/next.config.mjs: typescript.ignoreBuildErrors: true` (v0.dev default) | `web/next.config.mjs` | Medium — type errors don't block build |
| 2 | `web/next.config.mjs: images.unoptimized: true` (v0.dev default) | `web/next.config.mjs` | Low — Next Image Optimization disabled |
| 3 | No `LICENSE` file in `web/` | `web/` | Low — inherited from upstream which also had none |
| 4 | No `engines` / `packageManager` in `web/package.json` | `web/package.json` | Low — Vercel infers from lockfile |
| 5 | Root `.npmrc: omit=peer` heredado a `web/` | repo root | Low — benign today, may bite if shadcn/Radix adds peer dep |
| 6 | No error tracking integration (Sentry, Datadog) | Vercel project | Low — `@vercel/analytics 1.6.1` provides basic |
| 7 | No drain configured | Vercel project | Low — production logs only in Vercel dashboard |
| 8 | Canonical DNS records (rank 2): apex A → `76.76.21.21`, www CNAME → `cname.vercel-dns.com` | Namecheap | Trivial — current rank 1 values work fine (`misconfigured: false`) |
| 9 | Monorepo target structure (`game/`, `web/`, `realtime/`, `backend/`, ...) | repo | Plan documented in `docs/MONOREPO_TARGET.md`, deliberately deferred |
| 10 | R3 Postgres Render free expires ~2026-06-12 | Render | High by calendar — separate concern from Phase W |
| 11 | R9 Resend domain verification for `chiribito.com` | Namecheap + Resend | Medium — affects future password reset emails |
| 12 | Game frontend has 3 commits not deployed to production (Compact Density Pass `f112cbc` + 2 handoffs) | `chiribito-play` Vercel project | Low — visual-only, deliberate hold |

---

## Rollback notes

### Undo Phase W cutover (web back to old landing)

```bash
# Remove domains from chiribito-web project
vercel domains rm chiribito.com --scope=chiribito293-7173s-projects
vercel domains rm www.chiribito.com --scope=chiribito293-7173s-projects
```

Then in Namecheap, remove the 2 TXT records we added (preserve the
`play.chiribito.com` one). The old Vercel team will resume serving
`chiribito.com` / `www.chiribito.com` within minutes once the team-routing
ownership flips back.

Game stack (`play`, `backend`, `realtime`) is unaffected by any of this.

### Undo Phase W code (revert the `web/` integration)

```bash
git revert <merge-commit>
git push origin main
```

Plus optionally delete the Vercel project (`vercel project rm chiribito-web`).

### Local cleanup of stale artifacts

`web/.next/` and `web/node_modules/` are gitignored — `rm -rf` is safe at
any time. `web/.vercel/` (Vercel link metadata) is also gitignored.

---

## Recommended next steps (future session)

Not in scope today, listed for continuity:

1. **Visual/UX iteration on `web/`** — landing copy, sections, micro-interactions, mobile polish
2. **Web ↔ game integration progression** — CTA flows, deep-linking, shared identity layer
3. **R3 Postgres upgrade decision** — ~24 days deadline (~2026-06-12)
4. **Deuda items 1-8 from the table above** — pick by priority
5. **Game frontend redeploy** — push Compact Density Pass (`0acfb1f`) to production game
6. **R9 Resend domain verification** — when password reset emails matter
7. **Eventual monorepo restructure** per `docs/MONOREPO_TARGET.md` — only with explicit go-ahead

NOT recommended:
- ❌ Reopening Phase W scope
- ❌ Touching gameplay code
- ❌ Touching game live (`play`/`backend`/`realtime`)
- ❌ Mixing with PMS / PT in any way
- ❌ Big-bang refactor (gradual only)

---

## Operational constants validated this sprint

- Vercel CLI 53.2.0 + Node 24 + corepack pnpm
- `vercel whoami` must = `chiribito293-7173` before any Vercel command (separation guard)
- Vercel `api` subcommand is the escape hatch for operations the CLI doesn't expose directly (e.g., direct domain attach with redirect config)
- New Vercel projects: first deploy is always `target: production` (Vercel design — sets baseline)
- Domain attach with team ownership transfer: TXT verification at `_vercel.<domain>` is sufficient — no A/CNAME change needed when both teams share Vercel infrastructure
- DNS supports multiple TXT records on the same host; Namecheap UI supports it via "Add new record" (NOT "Edit existing")

---

## References

- Repo: `https://github.com/PredictionMarketsSolutions/chiribito`
- Branch (closed): `phase-w/snapshot-integration` (merged to main in this handoff)
- Upstream snapshot source: `https://github.com/polito101/WEB-CHIRIBITO@2f3273e`
- Vercel project URL: `https://chiribito-web.vercel.app`
- Production deploy: `dpl_GhSbbdxmQFNC7y7H1muBzZFo9QaU`
- Monorepo plan (deferred): `docs/MONOREPO_TARGET.md`
- `web/` README: `web/README.md` (provenance, dev, stack, deuda)

---

**End of Phase W handoff. Web layer SHIPPED. Apex live. Game untouched.**
