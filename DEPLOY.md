# Deploy — Staging on Render free tier

Concrete steps to put Chiribito online for private playtesting at **$0/month
for the first 30 days**, then **$0–$7/month** depending on what you keep on
free. Honest about every limitation.

---

## What is already online vs not (verified 2026-05-17)

| URL | Where | Status | What it is |
|---|---|---|---|
| `chiribito.com` / `www.chiribito.com` | Vercel | ✅ Live | Landing page, separate project, untouched by this repo |
| `chiri-frontend.onrender.com` | Render | ✅ Live | Old static build of the heredado frontend |
| `chiri-api.onrender.com` | Render | ❌ 404 | Heredado API gone |
| `chiri-colyseus.onrender.com` | Render | ❌ 404 | Heredado game server gone |
| **`chiribito-*` (this repo's stack)** | — | ⚪ Not deployed yet | What you're about to put online |

Goal of this guide: get `chiribito-frontend.onrender.com` (and optionally
`staging.chiribito.com`) serving the new game, fully wired to the api +
game server + redis + postgres, **without touching `chiribito.com`'s
Vercel landing**. We'll add a "Jugar Beta" link from the landing later.

---

## Cost summary (be ready for this)

| Tier | What you get | Cost |
|---|---|---|
| **Day 1 → day 30** | Everything on free, including PostgreSQL | **$0/mo** |
| **Day 31 onwards (option A)** | Upgrade PostgreSQL to `basic-256mb`, keep rest free | **~$7/mo** |
| **Day 31 onwards (option B)** | Re-create the Postgres free instance every 30 days, lose data | **$0/mo** (with data loss) |
| **If WebSocket cold starts annoy your testers** | Upgrade `chiribito-colyseus` to `starter` (always-on) | **+$7/mo** |
| **If api cold starts annoy your testers** | Upgrade `chiribito-api` to `starter` (always-on) | **+$7/mo** |

For private playtests between a handful of friends, **free is fine** for at
least the first month. Plan the upgrade to `basic-256mb` Postgres before
day 30 if you want to keep user accounts.

---

## Pre-flight (10 min, on your laptop)

You'll paste these in the Render dashboard later. Generate now:

```bash
# Three independent random secrets:
openssl rand -base64 48     # → JWT_SECRET
openssl rand -base64 48     # → INTERNAL_API_SECRET
openssl rand -base64 24     # → MONITOR_PASSWORD
```

Save them somewhere safe (password manager, sticky note). You'll paste each
once and then forget it.

Also:
- **Resend API key** (`re_…`). Sign up at https://resend.com — free tier
  gives 100 emails/day, plenty for staging. Verify the sender domain or
  use Resend's test sender for now. Save as `RESEND_API_KEY`.
- **(Optional) Better Stack source token** — only if you want logs
  aggregated off Render's stdout viewer. Skip for staging.

---

## Step 1 — Apply the Blueprint (5 min)

1. Open https://dashboard.render.com → sign up / log in with GitHub.
2. Top right → **New** → **Blueprint**.
3. Connect the repo `PredictionMarketsSolutions/chiribito` (Render will
   ask for GitHub permission the first time).
4. Render reads `render.yaml` from `main` and proposes:
   - 1 PostgreSQL (`chiribito-postgres`, plan: free)
   - 1 Key Value / Redis (`chiribito-redis`, plan: free)
   - 3 web services (api, colyseus, frontend — all plan: free)
5. Give the Blueprint a name (e.g. `chiribito-staging`) and hit **Apply**.

Render creates the resources. The web services will **fail their first
build** because env vars are still empty. That's expected — we fill them
in step 2.

---

## Step 2 — Paste secrets (10 min, Render dashboard)

Each service has an **Environment** tab. Paste these values exactly.

### `chiribito-api` → Environment

```
JWT_SECRET             <openssl rand -base64 48>
INTERNAL_API_SECRET    <openssl rand -base64 48>
RESEND_API_KEY         re_…
LOGTAIL_SOURCE_TOKEN   <leave empty unless you set up Better Stack>
ALLOWED_ORIGINS        https://chiribito-frontend.onrender.com
FRONTEND_URL           https://chiribito-frontend.onrender.com
```

Save changes. Render will offer to redeploy — say yes.

### `chiribito-colyseus` → Environment

```
JWT_SECRET             <SAME value as chiribito-api>
INTERNAL_API_SECRET    <SAME value as chiribito-api>
MONITOR_USER           admin
MONITOR_PASSWORD       <openssl rand -base64 24>
LOGTAIL_SOURCE_TOKEN   <leave empty>
API_URL                https://chiribito-api.onrender.com
ALLOWED_ORIGINS        https://chiribito-frontend.onrender.com
```

Save. Redeploy.

### `chiribito-frontend` → Environment

```
VITE_API_URL           https://chiribito-api.onrender.com
VITE_WS_URL            wss://chiribito-colyseus.onrender.com
```

Save. Redeploy.

> **`wss://` not `ws://`** on the WebSocket URL. The frontend is served
> over HTTPS so the browser blocks plain-text WebSocket as mixed content.

---

## Step 3 — Acceptance check (5 min)

Wait until all three services are **Live** (green dot). The api takes
~30-60 s on first boot because the migration runs.

Run these from your laptop:

```bash
# API liveness + readiness
curl https://chiribito-api.onrender.com/health
# → {"status":"ok","timestamp":"..."}

curl https://chiribito-api.onrender.com/ready
# → {"ready":true,"checks":{"database":{"ok":true,...},"redis":{"ok":true,...}}}

# Game server liveness + readiness
curl https://chiribito-colyseus.onrender.com/health
curl https://chiribito-colyseus.onrender.com/ready
# Both should return ready:true with redis:{ok:true}.

# Frontend
curl -I https://chiribito-frontend.onrender.com/
# → HTTP/2 200, content-type: text/html
```

If any `/ready` returns `503`:
- Look at the **Logs** tab on Render for that service.
- The 503 body contains the failing component and message.
- Most common: a missed env var, or postgres still booting (wait 30 s).

Open `https://chiribito-frontend.onrender.com/` in a browser. You should
see the Chiribito login screen.

**Smoke test the multiplayer:**
1. Register two accounts (open in two different browsers or one normal + one incognito).
2. From browser A: create a table.
3. From browser B: enter the table ID and join.
4. Both see each other on the seats. Press "Empezar partida". Cards deal.
5. The phase chip in the table header shows `Calle 1/6 · Preflop` with `●○○○○○` dots.

If both browsers stay in sync through a full hand → staging works.

---

## Step 4 (optional) — Custom domain `staging.chiribito.com` from Namecheap

The Vercel landing at `chiribito.com` stays untouched. You add a
**subdomain** that points at this new Render frontend.

### 4a. Add the domain in Render

1. Render dashboard → `chiribito-frontend` service → **Settings** → scroll to
   **Custom Domains** → **Add Custom Domain**.
2. Enter `staging.chiribito.com`.
3. Render shows you two things:
   - A **CNAME target** like `chiribito-frontend-abc123.onrender.com.`
     (the trailing dot matters in some DNS UIs).
   - The verification status (red until DNS propagates).

Keep that browser tab open.

### 4b. Add the CNAME on Namecheap

1. https://ap.www.namecheap.com → **Domain List** → click **Manage** next
   to `chiribito.com`.
2. Top tab **Advanced DNS**.
3. **Add new record**:
   ```
   Type    CNAME Record
   Host    staging
   Value   chiribito-frontend-abc123.onrender.com.
   TTL     Automatic   (or 5 min)
   ```
4. Hit the green check to save.

DNS usually propagates in 5-30 min. Check with:

```bash
nslookup staging.chiribito.com
# → should resolve to a Render IP / Cloudflare edge
```

When propagated, Render auto-issues a Let's Encrypt cert (you'll see it
go green in the Custom Domains section).

### 4c. Wire the new origin into the backend

Once `staging.chiribito.com` shows green in Render:

| Service | Env var | Old value | New value |
|---|---|---|---|
| `chiribito-api` | `ALLOWED_ORIGINS` | `https://chiribito-frontend.onrender.com` | `https://chiribito-frontend.onrender.com,https://staging.chiribito.com` |
| `chiribito-api` | `FRONTEND_URL` | `https://chiribito-frontend.onrender.com` | `https://staging.chiribito.com` |
| `chiribito-colyseus` | `ALLOWED_ORIGINS` | `https://chiribito-frontend.onrender.com` | `https://chiribito-frontend.onrender.com,https://staging.chiribito.com` |

Keep both origins in `ALLOWED_ORIGINS` for now — the `.onrender.com` one
stays useful for diagnostics if Namecheap DNS ever flakes.

You **don't** need to change `VITE_API_URL` or `VITE_WS_URL` unless you
also expose `api.chiribito.com` / `ws.chiribito.com` (skip until later —
the frontend can call any absolute URL regardless of its own domain).

---

## Step 5 (optional) — Add a "Jugar Beta" button to the landing

The landing at `chiribito.com` lives in a separate Vercel project. We
won't touch it from this repo. The change is a small edit you make there.

### If your landing source is on GitHub

Open the file that renders the hero / CTA section, find the
**"JUGAR PARTIDA Próximamente"** button, and replace it with:

```html
<a class="cta-button" href="https://staging.chiribito.com" target="_blank" rel="noopener">
  Jugar Beta privada
</a>
```

(Or whatever your CTA component looks like. Keep the styling, change the
href and the label.)

Commit, push, Vercel auto-deploys. Two minutes.

### If your landing was built on a no-code tool (Lovable, Webflow, Framer…)

Edit the button there:
- **Action / Link**: `https://staging.chiribito.com`
- **Open in**: New tab
- **Label**: `Jugar Beta privada` (or `Beta privada — Entrar`)

Publish. Two clicks.

### If you don't want to touch the landing yet

You can share `https://staging.chiribito.com` directly with your testers.
The landing button is purely cosmetic for the first round.

---

## What to watch on the free tier (honest)

| Symptom | Cause | Fix |
|---|---|---|
| First request of the day takes 30-60 s | Render web service sleeping after 15 min idle | Tell testers "first time of the day is slow, wait for the login screen". Or upgrade `chiribito-api` + `chiribito-colyseus` to `starter` ($7/mo each) for always-on. |
| Mid-game disconnect after everyone has been idle | Game server slept on empty room | Re-join — wakes back up in 30 s. Avoid by upgrading colyseus to `starter`. |
| "Email not arriving" on register | Resend domain not verified | Verify the domain on Resend, or temporarily use Resend's onboarding sender. |
| "Database unavailable" after day 30 | Postgres free expired | Upgrade to `basic-256mb` ($7/mo) inside the 14-day grace period to keep all data. |
| 503 from `/ready` after a couple of weeks | Redis evicted under 25 MB limit, or postgres connection cap | Restart the service from Render (frees memory); long-term upgrade Key Value to `starter` ($10/mo). |
| "Out of monthly hours" | All free Web services together used 750 instance-hours | Increase only the one that's actually doing work to paid (`chiribito-api` is usually the first). |

---

## Common gotchas (free or paid)

- **Mixed content**: frontend over HTTPS cannot talk to `ws://` — must be `wss://`.
- **CORS rejected**: `ALLOWED_ORIGINS` needs the full origin with scheme and no trailing slash.
- **Tournament stats not persisted**: the game server logs `INTERNAL_API_SECRET missing; tournament stats not persisted` when the env var is empty or different between services. Same string on both.
- **Migrations skipped**: api start command must be `npm run start:migrate` (already set), not `npm start`. If you change it, schema doesn't update on deploy.
- **`branch: main` in render.yaml**: only commits to `main` auto-deploy. PRs don't (we explicitly disabled previews to stay under hour quotas).

---

## When you outgrow this

Migration path when staging starts feeling tight:

1. **Postgres** → `basic-256mb` ($7/mo). Day 30 deadline; do this first.
2. **`chiribito-colyseus`** → `starter` ($7/mo). Always-on, no WebSocket cold starts.
3. **`chiribito-api`** → `starter` ($7/mo). Always-on, snappy login.
4. **Custom domain on apex**: cut `chiribito.com` from the Vercel landing to the Render frontend. Update `ALLOWED_ORIGINS` + `FRONTEND_URL` to include the apex.
5. **Backups**: Render Pro provides daily Postgres backups; otherwise `pg_dump` on a cron.
6. **Production project on Render**: clone the staging Blueprint into a second one called `chiribito-prod` with paid plans across the board, keep staging on free as a sandbox.

Until then: stay on free, ship features, gather feedback.

---

## Quick reference

| Thing | URL after first deploy | URL after step 4 |
|---|---|---|
| Frontend (the game) | `https://chiribito-frontend.onrender.com` | `https://staging.chiribito.com` |
| API server | `https://chiribito-api.onrender.com` | unchanged |
| Game server (WebSocket) | `wss://chiribito-colyseus.onrender.com` | unchanged |
| Colyseus monitor (basic-auth) | `https://chiribito-colyseus.onrender.com/colyseus` | unchanged |
| Health/Ready | `…/health`, `…/ready` on api and colyseus | unchanged |

---

## Local smoke before deploying

If you want to know the stack actually boots together before paying for
any Render time:

```bash
docker compose up --build       # from repo root
# → http://localhost:5173
```

If register / log in / create table / join from a second browser works
locally, the Render deploy will work too.

---

## Sources

- Render free tier limits (2026): https://render.com/docs/free
- Render pricing: https://render.com/pricing
- Render Postgres free expiry: https://render.com/docs/databases#free
