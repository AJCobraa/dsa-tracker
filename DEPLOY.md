# Deploy DSA Tracker on Render

## Architecture

```
┌─────────────────────────────────────┐
│           Render Web Service         │
│                                     │
│   ┌───────────┐   ┌─────────────┐  │
│   │  Express   │   │  Vite-built │  │
│   │  API       │──▶│  React SPA  │  │
│   │  /api/*    │   │  index.html │  │
│   └─────┬─────┘   └─────────────┘  │
│         │                           │
│   ┌─────▼─────┐                     │
│   │  SQLite    │ ◀── /var/data/     │
│   │  data.db   │     (Persistent    │
│   └───────────┘      Disk)          │
└─────────────────────────────────────┘
```

Express serves BOTH the API and the React frontend from a single port.
SQLite lives on a persistent disk so data survives redeployments.

---

## Step-by-Step Deployment

### 1. Push Code to GitHub

```bash
cd dsa-tracker
git init
git add -A
git commit -m "DSA Tracker - ready for Render"
git remote add origin https://github.com/YOUR_USERNAME/dsa-tracker.git
git branch -M main
git push -u origin main
```

### 2. Create Render Account

Go to [render.com](https://render.com) and sign up (free tier works).

### 3. Deploy (Two Options)

#### Option A: Blueprint (Automatic — Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repo
4. Render reads `render.yaml` and configures everything automatically
5. Click **"Apply"**

#### Option B: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `dsa-tracker` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run render-build` |
| **Start Command** | `npm start` |
| **Plan** | Free |

5. Add **Environment Variable**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DB_PATH` | `/var/data` |

6. Add **Disk** (under "Advanced"):

| Setting | Value |
|---------|-------|
| **Name** | `dsa-data` |
| **Mount Path** | `/var/data` |
| **Size** | 1 GB |

7. Click **"Create Web Service"**

### 4. Wait for Deploy

Render will:
1. Clone your repo
2. Run `npm install`
3. Run `npm run render-build` (builds frontend + pushes DB schema)
4. Start with `npm start`

First deploy takes ~3-5 minutes. Subsequent deploys are faster.

### 5. Access Your App

Once deployed, Render gives you a URL like:
```
https://dsa-tracker-xxxx.onrender.com
```

---

## Important Notes

### Free Tier Behavior
- **Spin down:** Free services sleep after 15 minutes of inactivity
- **Cold start:** First visit after sleep takes ~30 seconds to wake up
- **Persistent disk:** Your data is safe even when the service sleeps
- To avoid spin-down, upgrade to the Starter plan ($7/month)

### Database Persistence
- SQLite runs on a **Render Disk** mounted at `/var/data`
- Data persists across:
  - Redeployments (git push)
  - Service restarts
  - Sleep/wake cycles
- Data does NOT persist if you delete the disk or the service

### Backups
- Use the **Export** button in the app to download a JSON backup
- To restore: use the **Import** button and upload the JSON file
- Consider exporting regularly — the free tier disk has no redundancy

---

## Updating After Deployment

Just push to GitHub — Render auto-deploys on every push to `main`:

```bash
git add -A
git commit -m "your changes"
git push
```

---

## Local Development

```bash
npm install
npm run db:push
npm run dev
```

Opens at http://localhost:5000. The `DB_PATH` env var is NOT set locally, so SQLite uses `./data.db` in the project root.

---

## Troubleshooting

### "Service unavailable" after deploy
Check the Render logs. Most common issues:
- Missing `npm install` in build command
- `better-sqlite3` failing to compile → Render uses Linux, it will recompile natively

### Database is empty after redeploy
Make sure the Disk is configured:
- Mount Path must be `/var/data`
- `DB_PATH` env var must be `/var/data`

### App is slow to load
Free tier services sleep after inactivity. First request wakes it up (~30s).

### "Cannot find module" errors
Run `npm install && npm run render-build` as the build command (not just `npm run build`).
