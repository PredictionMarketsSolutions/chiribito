# Chiribito web layer

Landing + product surface for the Chiribito ecosystem.

Lives inside the same monorepo as the game (`/`, `frontend/`, `api-server/`),
deploys independently to its own Vercel project.

---

## Provenance

- **Source:** snapshot of `polito101/WEB-CHIRIBITO` at SHA `2f3273e` (default
  branch `main`, 2026-04-07).
- **Mode:** **detached** — no upstream sync planned. Evolves independently
  inside the Chiribito monorepo.
- **Integrated in:** Phase W.1 (2026-05-19).

The original `polito101/WEB-CHIRIBITO` repo was a `v0.dev`-driven scaffold
(135 commits, mostly `v0[bot]`, no README, no license, 0 stars/forks). We
took a clean snapshot, optimized assets, and detached.

---

## Local development

```bash
cd web
pnpm install
pnpm dev          # http://localhost:3000
pnpm build
pnpm start
pnpm lint
```

Independent from the game stack — no shared `node_modules`, no shared lock
file. Run `pnpm install` from `web/` only.

---

## Stack

- Next.js `16.1.6` (App Router)
- React `19.2.4`
- TypeScript `5.7.3`
- Tailwind CSS `4.2.0`
- shadcn/ui (full `@radix-ui/*` set) + `lucide-react`
- `framer-motion`, `next-themes`, `sonner`, `recharts`, `embla-carousel-react`
- `@vercel/analytics`
- Package manager: pnpm (lock at `web/pnpm-lock.yaml`)

---

## Deploy

Target: Vercel project `chiribito-web` under team `chiribito293-7173s-projects`
(same team as `chiribito-play`, separate project). Setup happens in Phase W.2.

The Chiribito ecosystem maintains hard separation from PMS and PT runtime
infrastructure. Never link `web/` to any other Vercel team.

---

## Deuda heredada del snapshot (flagged, not addressed in W.1)

Items inherited from the upstream `v0.dev` scaffold. Decisions deferred to
W.3 after staging visual validation:

1. **`next.config.mjs`: `typescript.ignoreBuildErrors: true`**
   `v0.dev` default. Type errors do not block the build. Production-grade
   should flip this to `false` once the existing codebase typechecks clean.

2. **`next.config.mjs`: `images.unoptimized: true`**
   `v0.dev` default. Disables Next.js Image Optimization on Vercel. Useful
   while assets live as static files in `web/public/`, costly if the landing
   grows to use Image component widely.

3. **No `LICENSE` file**
   Upstream had no license. Replicated as-is. Add one matching ecosystem
   intent (the game repo also has no license today).

4. **No `engines` / `packageManager` declared in `package.json`**
   Vercel infers pnpm from the lockfile. Pin both for reproducibility.

5. **Default branch was `main`** with v0/* sub-branches and a Vercel speed
   insights auto-PR branch upstream. None replicated here — detach is clean.

---

## Asset hygiene applied at snapshot time (Phase W.1)

Following Sprint 1.5 discipline (`scripts/optimize-cards.ts`), assets were
optimized at integration time to avoid bloating the Chiribito repo history:

| Set | Before | After | Saved | Tool |
|---|---|---|---|---|
| `web/public/cartas/` (28 WebPs) | 69.93 MB | 2.89 MB | -95.9% | `scripts/optimize-cards.ts --dir web/public/cartas` |
| `web/public/` root (7 PNGs)      | 15.47 MB | 2.18 MB | -85.9% | inline `sharp` (PNG extension preserved) |
| **`web/` total** | **87 MB** | **6.4 MB** | **-92.6%** | — |

Filenames, extensions, and visual content preserved. Only resize (≤1200px
width) + re-encoding. References in `web/app/`, `web/components/` are
unaffected.
