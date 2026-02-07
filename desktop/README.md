# Desktop (Electron)

This folder contains the Electron wrapper for the SEIA Site Planner.

The **renderer UI** is the existing Vite + React app (`client/`).
The **API** is the existing Express server (`server/`).

## How it works

### Dev
- `npm run desktop:dev` starts:
  - the server dev watcher (`server/dev.mjs`)
  - the Vite dev server (`http://127.0.0.1:8000`)
  - then Electron (after waiting for the UI + API to be reachable)

The launcher script is `desktop/wait-and-launch.mjs`.

### Packaged build
- `npm run desktop:build` builds:
  - `server/dist` (TypeScript → JS)
  - `client/dist` (Vite build)
  - then packages the Electron app via `electron-builder`

In packaged mode, Electron:
- starts an **embedded Express API server** (random local port)
- loads the built UI from `client/dist/index.html`

## API base injection

The UI needs to know which API origin to call.

- In web deployments you set `VITE_API_BASE`.
- In Electron packaged builds, the API runs on a random local port, so Electron exposes it as:
  - `window.__SEIA_API_BASE__`

This is set in:
- `desktop/preload.mjs` (exposes the variable to the renderer)
- `client/src/lib/constants.ts` (prefers `__SEIA_API_BASE__` over `VITE_API_BASE`)

## Scripts (repo root)
- `npm run desktop:dev` — run UI + API + Electron (dev)
- `npm run desktop:build` — build + package desktop app

## Troubleshooting

### Electron window doesn’t open
- Confirm you installed root deps (Electron is a root dependency): `npm i`
- Confirm Vite is actually running on port 8000:
  - `http://127.0.0.1:8000`
- Confirm API health works:
  - `curl -i http://127.0.0.1:3001/api/health`

### “http proxy error: /api/*”
This means the Vite dev server couldn’t reach the API at the proxy target.
- Make sure the server is listening on `127.0.0.1:3001`
- Check `client/vite.config.js` for the proxy target and port

