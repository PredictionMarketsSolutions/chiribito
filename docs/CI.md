# CI & branch protection

What runs on every push, and how `main` is meant to stay clean.

---

## Workflows (`.github/workflows/`)

### `build.yml` — Build and Lint

Triggers on every push and PR to `main` or `develop`. Single job, Node 20.

| Step | What it does |
|---|---|
| Checkout | Standard `actions/checkout@v4` |
| Guard against committed env files | Fails the workflow if any `.env*` (other than `.env*.example`) is committed. Added in Sprint 1.0 after a real `JWT_SECRET` had been pushed to the original repo. |
| Setup Node 20 + npm cache | `actions/setup-node@v4` with `cache: npm` |
| `npm ci` | Clean install from root lockfile |
| `tsc --noEmit` | Full type check across the workspace |
| `npm run lint` | ESLint (errors fail; warnings allowed) |
| `npm run build:game` | Compile the Colyseus server |
| `npm run build:api` | Compile the Express API server |

### `test-coverage.yml` — Tests and coverage

Triggers same as `build.yml`. Three jobs in parallel.

**`test`** — Backend (game server) Jest tests on Node 18 and Node 20 matrix.
- Type check
- `npm run test:jest -- --coverage`
- Upload `coverage/lcov.info` to Codecov (best-effort, doesn't fail the build)
- On pull requests with Node 20: post or update a comment on the PR with line / statement / function / branch coverage from `coverage-summary.json`

**`test-frontend`** — Vitest tests in `frontend/` with cached `node_modules`.

**`test-api`** — Jest tests in `api-server/` with cached `node_modules`.

### Dependabot

`.github/dependabot.yml` opens grouped weekly PRs against:
- root npm dependencies (minor + patch grouped to reduce noise)
- frontend npm dependencies
- GitHub Actions versions

---

## Branch protection on `main`

Configured in GitHub UI: **Settings → Branches → Branch protection rules**.

Recommended rule for `main`:

- ✅ Require a pull request before merging
- ✅ Require status checks to pass: `Build`, `Backend tests`, `API server tests`, `Frontend tests`
- ✅ Require branches to be up to date before merging
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings (apply to administrators too)
- ❌ Do **not** require signed commits (we can revisit later)
- ❌ Do **not** require linear history yet (allows merge commits during early phases)

Until those rules are configured, direct push to `main` is technically possible. The convention used during the cleanup sprints (1.0 → 1.5) is:

```
feature/idea          one-off experiments
chore/sprint-X.Y-...  one sprint per branch, fast-forward into main
fix/...               targeted bug fixes
refactor/...          refactors that don't change behaviour
```

---

## Local pre-commit checklist

There is no enforced pre-commit hook. The expectation is that, before pushing:

```bash
npm run lint              # 0 errors
npx tsc --noEmit          # 0 errors
npm run test:jest         # all green
cd api-server && npm test
cd ../frontend && npm test
```

If any of those fails on your machine but you believe CI will pass, fix it locally anyway. CI logs are slower to read than your own terminal.
