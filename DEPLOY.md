# Deploying Invoice Chaser

## Host: Render (free Web Service)

Render was chosen because this app is a real Node server with a SQLite
database file (`data/invoice-chaser.db` via better-sqlite3):

- A persistent Node process: the SQLite file lives on the instance
  filesystem, so reads and writes work normally.
- Free tier, no card required, 750 instance-hours/month (enough for 24/7).
- Deploys straight from this GitHub repo; every push to `main` redeploys.

Vercel / Netlify were ruled out: they run serverless functions with a
read-only filesystem (except ephemeral `/tmp`), so the SQLite database
could not persist writes and each function instance would see a
different database.

## What is already prepared

- `render.yaml` in this repo (Render Blueprint): Node 24, free plan,
  build command `npm install && npm run build && npm run db:seed`,
  start command `npm start`, health check on `/`.
- The build command runs the seed step, so the deployed app ships with
  the fictional demo data (8 clients, 12 invoices) — judges see a
  working dashboard immediately, no setup step needed.
- No environment variables or API keys are required. No login is
  needed to use the app.

## Deploy steps (when ready — not done yet)

1. Create a free Render account at https://render.com (sign in with
   GitHub as `alvinwang884804-art`).
2. Dashboard → **New** → **Blueprint** → connect the
   `alvinwang884804-art/invoice-chaser` repository → **Apply**.
3. Wait for the first build (~2–4 minutes). Render runs the build
   command above, including the demo-data seed.
4. Open the service URL (like `https://invoice-chaser.onrender.com`)
   and check the dashboard shows the demo totals: **$15,855.00
   outstanding, $14,440.00 overdue, $400.00 recovered**.
5. Paste that URL into the Devpost submission form as the working app
   URL.

## Things to know

- **Free tier sleeps after 15 minutes idle.** The first visit after
  sleep takes ~30–60 seconds to wake. Judges just wait once; the app
  then runs normally.
- **A redeploy resets the demo data.** Every push to `main` rebuilds
  the service and re-runs the seed, so the database returns to the
  pristine demo set. Data a judge enters persists while that deploy
  runs.
- **Keep it live through January 29, 2027.** Kiroween judging runs
  until then. Do not delete or suspend the service before that date.
  The free tier has no expiry date.
- **Cost: $0.** Nothing on this setup charges anything.
