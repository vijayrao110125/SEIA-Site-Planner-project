# Client (Vite + React)

Frontend for:
- signing in / creating an account
- configuring device counts
- viewing summary + auto‑generated site layout
- saving/loading sessions scoped to the signed‑in user

## Tech
- React
- Vite
- Tailwind CSS

## Dev
From repo root:
- `npm --prefix client i`
- `npm --prefix client run dev`

The dev server runs on `http://localhost:8000`.

## API wiring
Two supported modes:
1. **Dev proxy (recommended locally)**
   - Leave `VITE_API_BASE` unset.
   - Vite proxies `/api` to `VITE_API_PROXY_TARGET` (default `http://localhost:3001`).
2. **Direct API calls**
   - Set `VITE_API_BASE` to your API origin (example `http://localhost:3001` or a Render URL).
   - Browser calls the API cross‑origin; the server enables CORS.

Vite proxy config lives in `vite.config.js`:
```js
server: {
  proxy: {
    "/api": "http://localhost:3001"
  }
}
```

## Auth behavior
- Landing page is the login/register screen.
- After sign‑in, the dashboard is shown.
- Account creation asks for a display name; after sign‑in the header shows the name (fallback to email).
- The auth token is stored in `localStorage` under `seia:token`.
- Requests to session endpoints include `Authorization: Bearer <token>`.

## Build
- `npm --prefix client run build`

## Main Files
- `src/App.tsx` — login gate + dashboard
- `src/api.ts` — fetch wrappers + auth header injection
- `src/components/` — UI pieces
- `src/components/layout/LayoutView.tsx` — layout SVG renderer
- `src/styles.css` — Tailwind entry

## Deployment (Netlify)
Typical settings:
- Base directory: `client`
- Build command: `npm i && npm run build`
- Publish directory: `client/dist`
- Environment:
  - `VITE_API_BASE` = your backend origin (for example your Render service URL)
