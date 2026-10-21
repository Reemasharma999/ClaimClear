# Deploying ClaimClear on Render

Cost: ₹0 (GitHub free, Render free web service, Gemini free tier). Every `git push` to `main` redeploys automatically to the **same URL**.

```
Your laptop ──git push──▶ GitHub (main) ──auto-deploy──▶ Render: npm ci && npm run build → npm start
   .env (secret, git-ignored)                            Environment variables (secret, set in dashboard)
```

Secrets **never** go to GitHub. Locally they live in `.env` (git-ignored); on Render they live in the service's Environment settings. The deploy settings themselves are versioned in [render.yaml](render.yaml).

## Why Render (and not Vercel / Netlify / Cloudflare)

| | Render | Netlify (free) | Cloudflare Workers (free) |
|---|---|---|---|
| Auto-deploy every push, same URL | ✅ | ✅, but each production deploy costs 15 of 300 monthly credits (~20 deploys), then sites pause | ✅ |
| Runs this app unmodified | ✅ normal Node server, no function timeout | needs adapter; short free function timeout | needs OpenNext adapter; 10 ms CPU per request |
| Catch | sleeps after 15 min idle → ~1 min cold start (fixed in step 4) | | |

---

## Step 1: Prerequisites (one-time)

- Code on GitHub: https://github.com/Reemasharma999/ClaimClear (done)
- Render account: https://dashboard.render.com/register → **Sign up with GitHub**
- Gemini key: https://aistudio.google.com/apikey · Groq key (strongly recommended fallback): https://console.groq.com/keys

## Step 2: Create the service from the Blueprint

1. Render dashboard → **New → Blueprint**
2. Connect GitHub → grant access to the **ClaimClear** repo
3. Render finds `render.yaml` and shows one service: `claimclear` (free, Node)
4. It asks for the secret values marked `sync: false`:
   - `GOOGLE_GENERATIVE_AI_API_KEY` → your Gemini key
   - `GROQ_API_KEY` → your Groq key
5. Click **Apply / Deploy Blueprint**. The first build takes ~3–5 minutes; watch it under **Logs**.
6. When it says **Live**, your URL is shown at the top: `https://claimclear.onrender.com` (or `claimclear-xxxx.onrender.com` if the name is taken). **This URL never changes between deploys.**

> No Blueprint? **New → Web Service** → pick the repo → Runtime **Node**, Build `npm ci && npm run build`, Start `npm start`, Instance **Free**, Health Check Path `/api/health`, then add the env vars from step 2.4 and `NODE_VERSION=22`.

## Step 3: Verify production

- `https://<your-url>/api/health` → `{"ok":true, "aiConfigured":true, "fallbackConfigured":true}`
- Home page → **Try a sample policy** → run each example → open a clause tag
- Type junk (e.g. `asdf qwer`) → you should get the "tell us more" card, not an error
- `/how-it-works` loads
- Open it on your phone

## Step 4: Keep it awake (no 1-minute cold starts for recruiters)

Free Render services sleep after 15 minutes without traffic. A free monitor that pings the health check every 10 minutes keeps it awake; one always-on service uses ~744 of Render's 750 free hours/month.

1. https://uptimerobot.com → sign up (free) → **Add New Monitor**
2. Type **HTTP(s)**, URL `https://<your-url>/api/health`, interval **10 minutes** (free tier minimum is 5)
3. Save. You also get an email if the app ever goes down: free production monitoring.

The health check makes no AI calls, so pinging it costs no quota.

## Step 5: Every update from now on

```bash
git add -A
git commit -m "describe the change"
git push
```

Render starts a new deploy within seconds of the push (**Events** tab). The old version keeps serving until the new build passes the `/api/health` check, then the same URL switches over: zero downtime, and a broken build never goes live.

## Step 6: Finish the portfolio loop

1. Put the live URL at the top of `README.md` and push.
2. Add ClaimClear to your portfolio's "AI Products" section: live link, GitHub link, one-line problem, eval numbers.
3. Pin the repo on your GitHub profile.

---

## Run locally

```bash
npm install
```

Copy `.env.example` to `.env`, paste your keys, then:

```bash
npm run dev
```

Quality checks before pushing: `npm test` (guardrail unit tests, no API calls), `npm run redteam` and `npm run eval` (real model; uses free quota).

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Push didn't redeploy | Pushed to a branch other than `main`, or auto-deploy off | Render → Settings → Build & Deploy → Auto-Deploy **On Commit**, branch `main` |
| Deploy stuck at "health check failed" | App crashed on start | Logs tab; run `npm run build && npm start` locally to reproduce |
| `aiConfigured: false` in /api/health | Env var missing | Render → Environment → add key → **Save, rebuild and deploy** |
| "The free AI quota is busy" | Gemini free-tier quota hit | Add `GROQ_API_KEY` (automatic fallback) or wait |
| First visit takes ~1 minute | Instance was asleep | Set up the uptime monitor (step 4) |
| Build fails with out-of-memory | Free build resources | Retry the deploy; if persistent, set env `NODE_OPTIONS=--max-old-space-size=460` |
| Page unstyled locally after `npm run build` | Build overwrote the dev server's `.next` | Stop dev, delete `.next`, `npm run dev` again |
