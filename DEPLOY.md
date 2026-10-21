# Deploying ClaimClear: setup to live URL

Total time: about 30 minutes. Cost: ₹0 (GitHub free, Vercel Hobby free, Gemini free tier).

```
Your laptop ──git push──▶ GitHub repo ──auto-deploy──▶ Vercel (hosts Next.js) ──API calls──▶ Google Gemini
   .env.local (secret)                                  Environment Variables (secret)
```

Secrets **never** go to GitHub. Locally they live in `.env.local` (git-ignored). In production they live in Vercel's Environment Variables.

---

## Step 0: Prerequisites (one-time)

| Need | How to check / get it |
|---|---|
| Node.js 20+ | `node -v` |
| Git | `git --version` |
| GitHub account | https://github.com/signup |
| Vercel account | https://vercel.com/signup → **Continue with GitHub** (this links the two) |
| Gemini API key (free) | https://aistudio.google.com/apikey → *Create API key* |
| Groq API key (optional fallback) | https://console.groq.com/keys |

Make sure the `claimclear` folder sits somewhere permanent (e.g. `Documents\projects\claimclear`), not in a temporary folder.

---

## Step 1: Run it locally

Open a terminal in the `claimclear` folder.

```bash
npm install
```

Create your secrets file. In PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Open `.env.local` and paste your key after `GOOGLE_GENERATIVE_AI_API_KEY=` (no quotes, no spaces). Then:

```bash
npm run dev
```

Open http://localhost:3000 and test:
1. **Try a sample policy** → the policy card turns green ("46 clauses indexed").
2. Click each of the 3 examples → **Check my claim** → you see a verdict, a receipt, and clause tags.
3. Click a clause tag → the side sheet opens with the sentence highlighted.
4. Expand **Show the AI's work**.
5. Upload any real policy wording PDF (insurers publish them on their websites).

> Design QA tip: http://localhost:3000/?fixture loads a hand-computed sample result without calling the AI. It only works in development.

## Step 2: Run the evals (gets you real numbers for your resume)

```bash
npm run eval
```

This takes ~4 minutes (it pauses between calls to respect free-tier limits). It writes `evals/results.json` and `evals/REPORT.md`, and the numbers appear on `/how-it-works`. If you hit a rate limit, wait a minute and re-run, or add `GROQ_API_KEY` for the automatic fallback.

## Step 3: Check the production build locally

Stop the dev server first (Ctrl+C), because `build` and `dev` share the `.next` folder.

```bash
npm run build
```

It must end with `✓ Compiled successfully`. Fix any error before deploying, because Vercel runs the same command.

## Step 4: Push to GitHub

1. Go to https://github.com/new
   - Repository name: `claimclear`
   - **Public** (recruiters must be able to read it)
   - Do **not** add a README, .gitignore or license (the project already has them)
   - Click **Create repository**
2. In the `claimclear` folder:

```bash
git init
git add .
git commit -m "ClaimClear: grounded RAG for Indian health insurance claims"
git branch -M main
git remote add origin https://github.com/<your-username>/claimclear.git
git push -u origin main
```

3. **Safety check:** on GitHub, confirm `.env.local` is **not** in the file list (only `.env.example`). If you ever push a key by mistake, delete it in AI Studio immediately and create a new one. Deleting the file from git is not enough.

## Step 5: Deploy on Vercel

1. Go to https://vercel.com/new
2. **Import Git Repository** → pick `claimclear` (click *Adjust GitHub App Permissions* if it isn't listed)
3. Vercel auto-detects **Next.js**. Leave Build Command, Output Directory and Install Command as defaults.
4. Open **Environment Variables** and add:

| Name | Value | Required |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | your Gemini key | ✅ |
| `GROQ_API_KEY` | your Groq key | optional |
| `RATE_LIMIT_PER_HOUR` | `30` | optional |

5. Click **Deploy**. It takes ~2 minutes, and you get a URL like `claimclear-abc123.vercel.app`.
6. Make the URL nicer: **Project → Settings → Domains → Edit** the `.vercel.app` domain to `claimclear-reema.vercel.app` (or any free name).

## Step 6: Verify production

Repeat the Step 1 checks on the live URL, plus:
- `/how-it-works` shows your eval numbers.
- **Vercel → Project → Logs**: no red errors while you use the app.
- Open the site on your phone (most recruiters will click from LinkedIn on mobile).

## Step 7: From now on

- Every `git push` to `main` redeploys automatically.
- Every pull request gets its own preview URL, so you can share work-in-progress safely.
- Changed an environment variable? **Deployments → ⋯ → Redeploy**, because env changes apply only to new deployments.

## Step 8: Finish the portfolio loop

1. Put the live URL at the top of `README.md` (replace `_add your Vercel URL_`) and push.
2. Add ClaimClear to your portfolio's "AI Products" section: live link, GitHub link, one-line problem statement, and the eval numbers.
3. Pin the repo on your GitHub profile.

---

## Alternative: deploy from the terminal (Vercel CLI)

```bash
npm i -g vercel
vercel login
vercel link
vercel env add GOOGLE_GENERATIVE_AI_API_KEY
vercel --prod
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Google Generative AI API key is missing" | Env var not set, or set after deploy | Add it in Vercel → Settings → Environment Variables, then Redeploy |
| "The free AI quota is busy" | Gemini free-tier rate limit | Wait 60s; add `GROQ_API_KEY` for the automatic fallback |
| "Demo limit reached for this hour" | Our per-IP limiter (30/hr) | Raise `RATE_LIMIT_PER_HOUR` |
| "This PDF has no selectable text" | Scanned PDF | Download the text PDF of the policy wording from the insurer's site |
| Page unstyled locally after `npm run build` | Build overwrote the dev server's `.next` | Stop dev, delete `.next`, then run `npm run dev` again |
| Function timeout on Vercel | A slow model call | `maxDuration` is 60s per route; check Logs, and retry |
| Build fails on Vercel but works locally | Missing dependency or a case-sensitive import path | Run `npm run build` locally with a clean `npm ci` |
