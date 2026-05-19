# Chiribito monorepo — target structure (deferred plan)

> **Status: documented, NOT executed.** This file captures the long-term
> structural intent for the Chiribito monorepo. Phase W.1 (2026-05-19) only
> added the `web/` directory additively; the reorganisation described below
> requires its own dedicated sprint(s), gated on explicit user authorisation,
> and is not in scope of any active work today.

---

## Vision

A single unified Chiribito ecosystem inside one repo, with clear top-level
boundaries per concern, independent deploys, but shared ownership and a
single source-of-truth. **External separation from PMS and PT remains strict
and unchanged** — this document only addresses internal Chiribito layout.

## Target layout (long-term)

```
chiribito/
├── game/         ← Pixi/Vite client (currently: frontend/)
├── web/          ← Next.js landing + product surface (added in W.1)
├── realtime/     ← Colyseus game server (currently: src/ + root)
├── backend/      ← Express + TypeORM API (currently: api-server/)
├── shared/       ← cross-package types/utils (currently: nothing — emerges when needed)
├── infra/        ← render.yaml, vercel configs, deploy docs (currently: scattered)
└── docs/         ← project documentation (already at top level)
```

## Current layout (2026-05-19, post W.1)

```
chiri-app/                        ← repo root
├── src/                          ← Colyseus game server source
├── api-server/                   ← Express + TypeORM API
├── frontend/                     ← Pixi/Vite game client
├── web/                          ← NEW in W.1: Next.js landing (detached snapshot)
├── scripts/                      ← dev-stack, e2e, asset optimisers
├── docs/                         ← handoffs, plans, specs
├── render.yaml                   ← Render Blueprint (api + colyseus + db + redis)
├── package.json                  ← game server (root)
├── tsconfig.json                 ← game server TS config
└── …
```

## Mapping current → target

| Current path | Target path | Effort | Risk to production |
|---|---|---|---|
| `frontend/` | `game/` | Medium (rename + Vercel re-link + Vite/Pixi paths in code if any rely on relative refs) | Medium — live game frontend |
| `src/`, root `package.json`, root `tsconfig.json`, root `jest.config.js` | `realtime/` | High (multi-config refactor + tests + render.yaml `rootDir` updates + npm scripts) | High — live game server |
| `api-server/` | `backend/` | Medium (rename + render.yaml `rootDir` updates) | High — live API |
| `web/` | `web/` | None | None |
| `scripts/` | split: per-package or `infra/scripts/` | Low | Low |
| `render.yaml` | `infra/render.yaml` + adjust paths | Medium | High — affects deploy |
| `docs/` | `docs/` (already top-level) | None | None |
| (nothing) | `shared/` | Created when first shared dep emerges | None |

## Principles

1. **Migration is gradual, never big-bang.** Each rename is its own sprint
   with: design spec, pre-flight checklist (which tooling references the
   path?), atomic commits, full test pass, deploy verification.
2. **Cero gameplay-risk.** Game (`frontend/`) and game server (`src/`) are
   live in production with multiplayer state. Renaming them touches:
   `frontend/.vercel/project.json`, `render.yaml` (`rootDir: src/...`),
   every `npm script`, every relative path assumption in tooling. Not a
   "rename and move on" operation.
3. **Tests must remain green at every commit.** Currently 727/727
   (225 vitest frontend + 475 jest game + 27 jest api). No structural
   change ships with regressions.
4. **Deploys remain independent.** `chiribito-play` (Vercel), `chiribito-api`
   + `chiribito-colyseus` (Render), and future `chiribito-web` (Vercel)
   each stay decoupled. Monorepo layout is purely organisational, never a
   deploy-coupling mechanism.
5. **Hard external separation preserved.** PMS and PT remain on entirely
   separate orgs, Vercel teams, Render workspaces, Supabase instances,
   env vars, and domains. The monorepo is *internal* to Chiribito only.
6. **`web/` is independent (no pnpm workspaces yet).** Until shared deps
   emerge, `web/` keeps its own `node_modules`, lockfile, and `pnpm install`
   flow. Workspaces are a future decision, not a W.1 commitment.

## When this plan executes

**No fixed timeline.** The current `chiri-app/` layout works for production
and W.1 only requires `web/` additive. The full restructure executes only
when the user explicitly requests it, ideally in a window with:

- No active perceptual / gameplay sprint
- Production game stable, no open hotfixes
- Spare bandwidth for migration + verification
- Willingness to absorb 1-2 weeks of risk

Until then, this document is the **plan of record**; the codebase stays
in its current additive layout.

## Out of scope today

- ❌ Renaming `frontend/` → `game/`
- ❌ Moving `src/` → `realtime/`
- ❌ Moving `api-server/` → `backend/`
- ❌ Creating `shared/`
- ❌ Creating `infra/`
- ❌ Configuring pnpm workspaces
- ❌ Modifying `render.yaml` to reflect new paths
- ❌ Re-linking Vercel projects to new rootDirectories
- ❌ Migrating `scripts/` to per-package locations

## What W.1 did do

- ✅ Added `web/` as a top-level subdir alongside existing `frontend/`,
  `src/`, `api-server/`
- ✅ Snapshot of `polito101/WEB-CHIRIBITO@2f3273e` (detached, no upstream sync)
- ✅ Asset hygiene at integration time (`web/` 87 MB → 6.4 MB)
- ✅ Documented this plan as the deferred long-term target

Phases W.2 (Vercel project + staging deploy) and W.3 (visual validation +
deuda cleanup) continue inside the current additive layout. The restructure
is its own future workstream.
