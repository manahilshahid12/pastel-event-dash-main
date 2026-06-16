# Deploying Bloom to Vercel

This app is now a **client-side Vite SPA** (TanStack Router) plus **Vercel serverless
functions** for the Luma integration. There is no Node server, Docker, or Railway config
anymore — Vercel builds the static site and the `/api` functions automatically.

## Project layout

```
index.html              # SPA entry (fonts + #root)
src/main.tsx            # mounts the router
src/routes/             # TanStack Router file-based routes (client only)
api/                    # Vercel serverless functions
  _lib/luma.ts          # shared helper (underscore = NOT a function)
  luma/sync.ts                  POST /api/luma/sync        { eventId }
  luma/attendees/[eventId].ts   GET  /api/luma/attendees/:eventId
  luma/sync-guests/[eventId].ts POST /api/luma/sync-guests/:eventId
vercel.json             # build settings + SPA fallback rewrite
```

## One-time setup on Vercel

1. Push this folder to a Git repo and **Import Project** in Vercel (or run `vercel`).
2. Framework preset is auto-detected as **Vite** (output `dist/`). No overrides needed.
3. Add the environment variables below under **Settings → Environment Variables**
   (Production + Preview). Use the same values from your local `.env` / `.env.local`.

### Environment variables

Client (must use the `VITE_` prefix — baked in at build time):

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key (`VITE_SUPABASE_ANON_KEY` also works) |

Server (read at request time inside the `/api` functions — keep private):

| Variable | Purpose |
| --- | --- |
| `LUMA_API_KEY` | Luma API key for guest sync |
| `SUPABASE_URL` | Supabase URL (falls back to `VITE_SUPABASE_URL`) |
| `SUPABASE_SERVICE_KEY` | Supabase service-role key (`SUPABASE_SERVICE_ROLE_KEY` also works) |

The service-role key bypasses RLS and must **only** live in the server-side variables —
never expose it with a `VITE_` prefix.

## Local development

```bash
npm install
npm run dev          # Vite dev server (frontend only)
```

The `/api` functions don't run under `vite dev`. To exercise them locally, install the
Vercel CLI and run the whole thing the way Vercel does:

```bash
npm i -g vercel
vercel dev           # serves the SPA + /api functions together
```

## Production build (what Vercel runs)

```bash
npm run build        # -> dist/
```
