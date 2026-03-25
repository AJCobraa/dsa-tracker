# NeetCode 250 DSA Study Tracker

A personal study tracker for NeetCode 250 DSA questions with pattern recognition, hints, code snippets, and flashcard-based revision.

## Tech Stack

- **Frontend:** React 18 + TailwindCSS 3 + shadcn/ui
- **Backend:** Express 5 + better-sqlite3 (SQLite)
- **ORM:** Drizzle ORM
- **Build:** Vite 7 + TypeScript

## Prerequisites

- **Node.js** >= 18 (recommended: 20+)
- **npm** >= 9

That's it — no external database, no Docker, no Redis. SQLite runs embedded.

## Local Setup

```bash
# 1. Clone / extract the project
cd dsa-tracker

# 2. Install dependencies
npm install

# 3. Push the database schema (creates data.db automatically)
npm run db:push

# 4. Start the dev server
npm run dev
```

The app will be available at **http://localhost:5000**

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run db:push` | Push schema changes to SQLite |
| `npm run check` | TypeScript type checking |

## Production Build

```bash
npm run build
npm start
```

This builds the React frontend into `dist/public/` and bundles the Express server into `dist/index.cjs`. The production server serves both the API and static files on port 5000.

## Project Structure

```
dsa-tracker/
├── client/                    # React frontend
│   ├── index.html
│   └── src/
│       ├── App.tsx            # Main app with routing
│       ├── index.css          # Tailwind + dark theme
│       ├── pages/
│       │   └── dashboard.tsx  # Main dashboard page
│       ├── components/
│       │   ├── question-modal.tsx   # Add/Edit question dialog
│       │   └── flashcard-mode.tsx   # Flashcard review mode
│       ├── hooks/
│       │   └── use-questions.ts     # React Query hooks
│       └── lib/
│           ├── constants.ts         # Patterns, difficulty colors
│           └── queryClient.ts       # API client
├── server/                    # Express backend
│   ├── index.ts               # Server entry point
│   ├── db.ts                  # SQLite + Drizzle setup
│   ├── routes.ts              # REST API routes
│   ├── storage.ts             # Database operations
│   ├── vite.ts                # Vite dev middleware
│   └── static.ts              # Production static serving
├── shared/
│   └── schema.ts              # Drizzle schema (shared types)
├── data.db                    # SQLite database (auto-created)
├── drizzle.config.ts
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questions` | List all questions |
| GET | `/api/questions/:id` | Get a single question |
| POST | `/api/questions` | Create a question |
| PATCH | `/api/questions/:id` | Update a question |
| DELETE | `/api/questions/:id` | Delete a question |
| GET | `/api/export` | Export all data as JSON |
| POST | `/api/import` | Import data (replaces all) |

## Database

The app uses **SQLite** via `better-sqlite3` — a single `data.db` file in the project root. No external database server needed.

- Schema is defined in `shared/schema.ts`
- Run `npm run db:push` to apply schema changes
- To reset, just delete `data.db` and run `npm run db:push` again

## Features

- **Dashboard** — Table view with filters (pattern, difficulty, status, important), search, and sorting
- **Progress tracking** — Overall progress bar + per-pattern breakdown
- **Add/Edit modal** — Tabbed interface: Hints, Pattern Notes, Code Snippet, Flashcard
- **17 pre-built pattern tags** + custom patterns
- **Flashcard review mode** — Flip cards with hint/notes/code on the back
  - Keyboard: Space (flip), ← → (navigate), Esc (exit)
  - Got It / Review Again buttons for spaced repetition tracking
- **Export/Import** — JSON backup and restore
- **Dark mode** by default (developer-friendly)

## Deploy to Render (Free Hosting)

This app is configured for one-click deployment on [Render](https://render.com) with a persistent disk for SQLite.

See **[DEPLOY.md](./DEPLOY.md)** for the full step-by-step guide.

**Quick summary:**
1. Push code to a GitHub repo
2. On Render → New → Blueprint → connect your repo
3. Render reads `render.yaml` and auto-configures everything
4. Your app goes live at `https://dsa-tracker-xxxx.onrender.com`

**What's included:**
- `render.yaml` — Blueprint config (free plan, persistent disk, env vars)
- `render-build` script — builds frontend + pushes DB schema
- `DB_PATH` env var support — SQLite writes to persistent disk on Render, falls back to `./data.db` locally

**Free tier notes:**
- Sleeps after 15 min inactivity (~30s cold start on wake)
- Data persists across redeploys and sleep/wake cycles
- Auto-deploys on every `git push` to `main`

---

## Troubleshooting

**`better-sqlite3` won't install:**
This is a native module. If it fails, ensure you have build tools:
- macOS: `xcode-select --install`
- Ubuntu/Debian: `sudo apt install build-essential python3`
- Windows: `npm install --global windows-build-tools`

**Port 5000 already in use:**
Edit the PORT in `server/index.ts` or set the env var: `PORT=3000 npm run dev`

**Database locked errors:**
The app uses WAL mode for better concurrency. If you see lock errors, make sure only one instance is running.
