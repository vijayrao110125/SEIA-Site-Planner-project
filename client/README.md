# Client (Vite + React)

Frontend for configuring device counts, viewing summaries, and seeing the auto‑generated layout.

## Tech
- React
- Vite
- Tailwind CSS

## Dev
From repo root:
- `npm --prefix client i`
- `npm --prefix client run dev`

The dev server runs on `http://localhost:8000` and proxies `/api` via a configurable target.

## Update API Endpoint
For **local dev**, the client calls same-origin `/api/*` and relies on Vite’s dev proxy in `vite.config.js`.

To change where `/api` proxies, create `client/.env`:
```bash
VITE_API_PROXY_TARGET=http://localhost:3001
```

If requests are slow (or you see abort/timeout errors), you can increase the client timeout:
```bash
VITE_API_TIMEOUT_MS=60000
```

For **static site deployment**, set `VITE_API_BASE` to your API service URL
in Render (example: `https://your-api-service.onrender.com`).

For **local dev**, the client uses Vite’s dev proxy in `vite.config.js`:
```js
server: {
  proxy: {
    "/api": "http://localhost:3001"
  }
}
```
In production, the server serves the built client and `/api` is same-origin.

## Build
- `npm --prefix client run build`

## Main Files
- `src/App.jsx` — app state and API wiring
- `src/components/` — UI pieces
- `src/components/LayoutView.jsx` — layout SVG renderer
- `src/styles.css` — Tailwind entry
