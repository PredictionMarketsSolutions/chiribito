# Deploy

Concrete steps to get Chiribito online from this repo. Honest about what is
automated and what needs a hand.

---

## What is currently online (verified 2026-05-17)

| URL | Hosting | Status |
|---|---|---|
| `chiribito.com` (Vercel landing) | Vercel | Live, separate project, not in this repo |
| `chiri-frontend.onrender.com` | Render | Old static build of the heredado frontend, still serving |
| `chiri-api.onrender.com` | Render | `404` — dead |
| `chiri-colyseus.onrender.com` | Render | `404` — dead |
| **This repo's stack** | — | **Not deployed anywhere yet** |

The plan is to deploy this repo's stack to its own Render services under a
`chiribito-*` naming convention, point a staging subdomain at the frontend,
and cut `chiribito.com` over to it later when it's stable.

---

## First deploy — Render Blueprint

### 0. Pre-flight (one-time)

You'll need three pieces of paper before you start. Generate them locally:

```bash
# A random 48-byte secret. Used for both JWT_SECRET and INTERNAL_API_SECRET.
openssl rand -base64 48      # → save as JWT_SECRET
openssl rand -base64 48      # → save as INTERNAL_API_SECRET

# Monitor basic-auth password (any strong string; the user can be "admin").
openssl rand -base64 24      # → save as MONITOR_PASSWORD
```

And:
- A Resend API key for transactional email (`re_…`). Sign up at resend.com if you don't have one. Set `RESEND_API_KEY`.
- *(Optional)* A Better Stack source token if you want logs aggregated off-stdout. Set `LOGTAIL_SOURCE_TOKEN` on both services. Skip otherwise.

### 1. Apply the Blueprint

1. `https://dashboard.render.com` → **Blueprints** → **New Blueprint Instance**.
2. Connect the repo `PredictionMarketsSolutions/chiribito` if not already connected.
3. Render reads `render.yaml` from `main` and proposes:
   - 1 PostgreSQL (`chiribito-postgres`)
   - 1 Redis (`chiribito-redis`)
   - 3 web services (`chiribito-api`, `chiribito-colyseus`, `chiribito-frontend`)
4. Hit **Apply**. The database/redis/services are created; the web services will fail their first build because env vars are still empty. Expected. Continue.

### 2. Set secrets (Environment tab on each service)

#### `chiribito-api`
```
JWT_SECRET             <openssl rand -base64 48>
INTERNAL_API_SECRET    <openssl rand -base64 48>
RESEND_API_KEY         re_…
LOGTAIL_SOURCE_TOKEN   <optional>
ALLOWED_ORIGINS        https://chiribito-frontend.onrender.com
FRONTEND_URL           https://chiribito-frontend.onrender.com
```

#### `chiribito-colyseus`
```
JWT_SECRET             <SAME value as chiribito-api>
INTERNAL_API_SECRET    <SAME value as chiribito-api>
MONITOR_USER           admin
MONITOR_PASSWORD       <openssl rand -base64 24>
LOGTAIL_SOURCE_TOKEN   <optional, same source if you want them mixed>
API_URL                https://chiribito-api.onrender.com
ALLOWED_ORIGINS        https://chiribito-frontend.onrender.com
```

#### `chiribito-frontend`
```
VITE_API_URL           https://chiribito-api.onrender.com
VITE_WS_URL            wss://chiribito-colyseus.onrender.com
```

`wss://` (TLS) on the websocket, not `ws://`. The frontend runs on `https://`
so the browser will reject mixed-content WebSocket otherwise.

### 3. Trigger a deploy of each web service

Each service has a **Manual Deploy → Deploy latest commit** button. The
`chiribito-api` migration runs on boot (`npm run start:migrate`) — give it
~30 seconds to finish. Watch the **Logs** tab.

Acceptance:
- `https://chiribito-api.onrender.com/health` → `{"status":"ok"}`
- `https://chiribito-api.onrender.com/ready` → `{"ready":true, "checks": {…}}` with all `ok: true`
- `https://chiribito-colyseus.onrender.com/health` → `{"status":"ok"}`
- `https://chiribito-colyseus.onrender.com/ready` → `{"ready":true, "checks": {"redis": {"ok": true, …}}}`
- `https://chiribito-frontend.onrender.com/` → the Chiribito client loads. The `Mesa` chip shows `sin mesa`. Log in, create a table, watch a player join.

If a `/ready` returns 503 → check **Environment** for missing values and the **Logs** for the actual error. The check returns the failing component and message.

### 4. (Optional) Custom domain `staging.chiribito.com`

The Vercel landing at `chiribito.com` stays untouched. For a staging subdomain that points at this new stack:

1. On the `chiribito-frontend` service in Render → **Settings → Custom Domains** → add `staging.chiribito.com`. Render gives you a CNAME target like `chiribito-frontend-abc123.onrender.com`.
2. In your DNS provider for `chiribito.com`, add a CNAME record:
   ```
   staging  CNAME  chiribito-frontend-abc123.onrender.com.
   ```
3. Wait for the cert. Render auto-provisions Let's Encrypt.
4. Update three env vars to include the new origin (keep the `.onrender.com` one too — both should work during the transition):
   - `chiribito-api`        → `ALLOWED_ORIGINS = https://chiribito-frontend.onrender.com,https://staging.chiribito.com`
   - `chiribito-api`        → `FRONTEND_URL    = https://staging.chiribito.com`
   - `chiribito-colyseus`   → `ALLOWED_ORIGINS = https://chiribito-frontend.onrender.com,https://staging.chiribito.com`

You don't need to change `VITE_API_URL` / `VITE_WS_URL` unless you also expose
`api.chiribito.com` / `ws.chiribito.com`. The frontend always calls the
absolute URLs you set; the frontend's own domain doesn't matter.

### 5. (Later) Cutover `chiribito.com`

When staging is stable and you want the apex domain to serve the real game
instead of the Vercel landing:

1. Repeat step 4 for `chiribito.com` and `www.chiribito.com` on the
   `chiribito-frontend` service.
2. Update `ALLOWED_ORIGINS` and `FRONTEND_URL` to include those origins.
3. Remove the Vercel project (or set it to maintenance) so DNS doesn't
   accidentally resolve back to it.

---

## Smoke test you can run before deploying

To know the stack actually boots together before paying for Render time,
spin it up locally end-to-end (Postgres + Redis + api + game server +
frontend). See `docker-compose.yml` at the repo root.

```bash
# from repo root
docker compose up --build
```

Then visit `http://localhost:5173`. If the app loads, you can register, log
in and create a table, the staging deploy will work too.

---

## Common gotchas

- **Cold start latency**: Render free/starter sleeps services after 15 min of inactivity. First request after a cold sleep takes ~30 s. For a real playtest, upgrade `chiribito-api` and `chiribito-colyseus` to a paid plan, not the frontend.
- **Mixed content**: the frontend served over `https://` cannot talk to a `ws://` WebSocket — must be `wss://`. Render terminates TLS for you, so the env var value just needs `wss://`.
- **CORS rejected**: `ALLOWED_ORIGINS` must include the full origin with scheme. `chiribito-frontend.onrender.com` will fail; `https://chiribito-frontend.onrender.com` works.
- **Tournament stats not persisted**: the game server logs `INTERNAL_API_SECRET missing; tournament stats not persisted` when the env var is empty. Cross-check both services have the same value.
- **Migrations skipped**: `npm run start:migrate` is the start command, not `npm start`. If you change it, schema doesn't update on deploy.
- **Logs to stdout only**: Render captures stdout, so the absence of `LOGTAIL_SOURCE_TOKEN` is fine for staging. Add it before any real traffic.

---

## What this repo does NOT yet automate

- DNS provisioning. Manual on your registrar.
- Vercel landing cutover. Manual.
- Postgres backups. Render Pro plan provides daily backups; otherwise script a `pg_dump` on a cron.
- Branch-preview environments. Disabled in `render.yaml` (`pullRequestPreviewsEnabled: false`). Re-enable per service if useful.
