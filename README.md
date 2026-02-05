# SEIA Site Planner

Full‑stack app to configure Tesla battery site layouts, compute totals, and save sessions.

## Structure
- `client/` — Vite + React + Tailwind UI
- `server/` — Express API + MongoDB

## Requirements
- Node.js 18+ (20 recommended)
- MongoDB Atlas connection string

## Quick Start (Local)
1. Install deps
   - `npm run install:all`
2. Set env vars
   - `MONGODB_URI` (required)
   - `MONGODB_DB` (optional, default: `seia_site_planner`)
   - `MONGODB_COLLECTION` (optional, default: `sessions`)
3. Run dev
   - `npm run dev`
4. Open
   - UI: `http://localhost:8000`
   - API: `http://localhost:3001`

## Scripts
- `npm run dev` — run client + server
- `npm run build` — build client
- `npm run start` — run server in production
- `npm run render-build` — install + build for Render

## Deployment (Render)
This repo includes `render.yaml` for a single service:
1. Create a Render Web Service from this repo.
2. Set `MONGODB_URI` in Render Environment.
3. Deploy. The server serves the built client in production.

## Notes
- Session data is stored in MongoDB.
- The server requires `MONGODB_URI` at runtime.
