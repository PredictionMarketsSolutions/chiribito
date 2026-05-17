# Contributing to Chiribito

Small guide. Read once.

## Working agreement

- **Communication with the maintainer** is in Spanish.
- **Everything that lives in the repo** (code, comments, commit messages, PR descriptions, docs) is in English. The two exceptions are the user-facing README, where the second half is Spanish on purpose, and the in-game vocabulary (Chiribito, Perla, Sota, Caballo, Rey, Oros/Copas/Espadas/Bastos…), which stays Spanish across the codebase.
- **Honest changes only.** If a doc, badge, comment or README claim is no longer true, fix it or delete it. No "production-ready" theatre.

## Branch convention

```
chore/sprint-X.Y-short-name      one sprint per branch, merged fast-forward
fix/short-description            targeted bug fixes
refactor/short-description       refactors that do not change behaviour
feature/short-description        new feature work (Phase 2+)
```

`main` is the only long-lived branch right now. `develop` exists as a CI target but is not in active use.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) flavour:

```
type(scope): subject

Optional body. Wrap at ~80 cols. Explain *why*, not *what*.
```

Types we actually use: `feat`, `fix`, `chore`, `refactor`, `security`, `docs`, `test`, `perf`.

Do **not** add `Co-Authored-By: Claude` or similar machine signatures. The same applies to AI-generated marketing text in commit messages — keep them dry.

## Before pushing

Run these locally and make sure they pass:

```bash
npm run lint              # 0 errors
npx tsc --noEmit          # 0 errors
npm run test:jest         # all green
cd api-server && npm test
cd ../frontend && npm test
```

If anything fails, fix it before pushing. CI is slower than your laptop.

## Testing

| Service | Framework | Run |
|---|---|---|
| Game server (`src/`) | Jest | `npm run test:jest` |
| API server (`api-server/`) | Jest | `cd api-server && npm test` |
| Frontend (`frontend/`) | Vitest | `cd frontend && npm test` |

Coverage with `npm run test:jest:coverage`. We do not block PRs on coverage thresholds — broken tests are worse than uncovered code.

When you fix a bug, write the test first if you can. When you add a feature, the test goes with it in the same PR.

## Code style

ESLint + Prettier are configured at the root. `npm run format` rewrites; `npm run format:check` reports. No bikeshedding — if Prettier formats it one way, that's the way.

TypeScript is `strict` on root and `strict` on api-server. `any` is allowed but discouraged — every one of the remaining `any` warnings is on the backlog.

## Pull request flow

1. Branch off `main`: `git checkout -b chore/sprint-1.X-...`
2. Commit semantically.
3. Push the branch. CI runs.
4. Open a PR. Title is the commit subject; body explains *why*.
5. Wait for CI green. Squash-or-merge depending on the sprint's preference (cleanups are squashed; feature work keeps history).
6. Delete the branch (local and remote).

## Reporting a security issue

Do not open a public issue. Email the maintainer privately. The repo is `UNLICENSED` and private.
