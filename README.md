# SEIA Site Planner

Full‑stack app to configure Tesla battery site layouts, compute totals, and save **user‑scoped** sessions.

## Structure
- `client/` — Vite + React + Tailwind UI
- `server/` — Express API + MongoDB

## What happens (end‑to‑end)
1. **Landing page → login**
   - The app opens on a login/register screen.
   - After successful sign‑in, the app shows the dashboard.
   - During account creation, the user provides a display name (shown in the header after sign‑in).
2. **Dashboard loads**
   - Client validates the saved auth token by calling `GET /api/auth/me`.
   - Client fetches the device catalog from `GET /api/catalog`.
   - The Summary + Site layout panels are visible but “empty” until the user computes.
3. **User changes battery counts**
   - Each change triggers `POST /api/compute` with `{ counts }`.
   - Server:
     - clamps counts to non‑negative integers
     - derives transformers as `ceil(totalBatteries / 2)` (transformers are not directly editable)
     - computes totals (cost, energy, density)
     - packs rectangles into a 100ft max‑width layout
   - Client renders:
     - `Summary` card (totals + derived counts)
     - `Site layout` SVG (placements on a 100ft boundary)
4. **Save / update / delete sessions**
   - Sessions are stored in MongoDB and scoped to the signed‑in user.
   - Session APIs require `Authorization: Bearer <token>`.

## Architecture (high‑level)
```
┌───────────────┐      HTTPS       ┌────────────────────────┐
│   Browser     │ ───────────────▶ │  Client Static Site     │
│ (React + UI)  │                  │      (Netlify)          │
└───────┬───────┘                  └───────────┬─────────────┘
        │    API (fetch /api/*)                │
        └──────────────────────────────────────▶
                                   ┌────────────────────────┐
                                   │   Server (Express)     │
                                   │  Render Web Service    │
                                   └───────────┬────────────┘
                                               │
                                               │ MongoDB Atlas
                                               ▼
                                      ┌──────────────────┐
                                      │   MongoDB DB     │
                                      └──────────────────┘
```
Notes:
- In local dev, you can either:
  - use Vite’s proxy (`/api` → server), or
  - set `VITE_API_BASE` to call the server directly.
- In static hosting, set `VITE_API_BASE` to your server URL.

## Requirements
- Node.js 20.19+ or 22.12+ (required by Vite 7)
- MongoDB Atlas connection string

## Quick Start (Local)
1. Install deps
   - `npm run install:all`
2. Set env vars
   - `MONGODB_URI` (required)
   - `AUTH_TOKEN_KEY` (recommended; required in production)
   - `MONGODB_DB` (optional, default: `seia_site_planner`)
   - `MONGODB_COLLECTION` (optional, default: `sessions`)
   - `MONGODB_USERS_COLLECTION` (optional, default: `users`)
   - Client (optional):
     - `VITE_API_BASE` (leave unset to use Vite proxy in dev)
     - `VITE_API_PROXY_TARGET` (dev‑only proxy target, default `http://localhost:3001`)
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

## Running separately
- Server: `npm --prefix server run dev`
- Client: `npm --prefix client run dev`

## Deployment (Render backend + Netlify frontend)
### Backend (Render)
1. Create a **Render Web Service** from this repo (or connect the `server/` folder as the service root).
2. Set Render Environment variables:
   - `MONGODB_URI`
   - `AUTH_TOKEN_KEY` (required in production)
   - optional: `MONGODB_DB`, `MONGODB_COLLECTION`, `MONGODB_USERS_COLLECTION`
3. Set commands:
   - **Build:** `npm --prefix server i`
   - **Start:** `npm --prefix server start`

### Frontend (Netlify)
1. Create a **Netlify site** from this repo.
2. Set Netlify build settings:
   - **Base directory:** `client`
   - **Build command:** `npm i && npm run build`
   - **Publish directory:** `client/dist`
3. Set Netlify environment variables:
   - `VITE_API_BASE` = your Render backend origin (example `https://<your-service>.onrender.com`)

## CI/CD (GitHub → Render + Netlify)
Two common setups:
1. **Recommended: GitHub integration (no custom GitHub Actions)**
   - Connect your GitHub repo in Render and enable Auto-Deploy on `main`.
   - Connect your GitHub repo in Netlify and enable deploy previews + production deploys from `main`.
2. **GitHub Actions via deploy hooks (optional)**
   - Create a Render Deploy Hook and a Netlify Build Hook.
   - Store both hook URLs as GitHub repo secrets (for example `RENDER_DEPLOY_HOOK_URL` and `NETLIFY_BUILD_HOOK_URL`).
   - Example workflow:
