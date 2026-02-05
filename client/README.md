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

The dev server runs on `http://localhost:8000` and proxies `/api` to `http://localhost:3001`.

## Build
- `npm --prefix client run build`

## Main Files
- `src/App.jsx` — app state and API wiring
- `src/components/` — UI pieces
- `src/components/LayoutView.jsx` — layout SVG renderer
- `src/styles.css` — Tailwind entry
