# Wild Alberta

Wild Alberta is a local hiking and trail discovery app for Alberta adventures. It includes trail search, route maps, activity tracking, preparation checklists, wildlife collection, missions, community feed, and offline-friendly local data fallbacks.

## Project Separation Rules

- This is the Hiking App Canada project.
- It uses its own Supabase project.
- It must not connect to the Inspection App Supabase project.
- It must not use `inspection_reports`, `repair_tasks`, `contractor_bids`, `inspectors`, `homeowners`, `trade_categories`, or inspection-related database logic.
- Local dev should run on port 3001 because Inspection App may use port 3000.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- React Router
- Supabase client with demo-data fallback
- Leaflet and React Leaflet

## Routes

- `/` and `/home` - hiking home page with trail search and featured local picks
- `/explore` - trail discovery and filtering
- `/map` - interactive trail map
- `/trails/:slug` - trail detail, preparation, and navigation helpers
- `/tracking` - activity recording flow
- `/safety` - safety guidance
- `/missions` - hiking missions and points
- `/wildlife` - wildlife discovery collection
- `/feed` - community activity feed
- `/profile` and `/settings` - local profile and preferences

## Local Setup

One-command local setup:

```bash
npm run setup:local
```

This creates `.env` from `.env.example` when needed and installs dependencies if `node_modules` is missing.

Run the local development server:

```bash
npm run dev:local -- --port 3001
```

Open the Local URL printed by Vite, normally [http://localhost:3001](http://localhost:3001). If that port is already busy, Vite will print the alternate port it selected. The browser refreshes as files change.

## Optional Supabase

The app works locally with built-in demo data. To connect a Supabase project, set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Quality Checks

```bash
npm test
npm run lint
npm run build
```

## Data Notes

Demo hiking data lives in `src/lib/demo-data.ts` and is reused by the UI and tests.
