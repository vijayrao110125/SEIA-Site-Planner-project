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
The client uses Vite’s dev proxy in `vite.config.js`:
```js
server: {
  proxy: {
    "/api": "http://localhost:3001"
  }
}
```
Set `VITE_API_PROXY_TARGET` to point at your server (for example, `http://localhost:3001`).
In production, the server serves the built client and `/api` is same-origin.

## Build
- `npm --prefix client run build`

## Main Files
- `src/App.jsx` — app state and API wiring
- `src/components/` — UI pieces
- `src/components/LayoutView.jsx` — layout SVG renderer
- `src/styles.css` — Tailwind entry
