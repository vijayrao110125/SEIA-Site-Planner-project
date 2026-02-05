# Server (Express + MongoDB)

API for computing layouts and storing sessions.

## Env Vars
You can provide these via a `.env` file or environment settings.
- `MONGODB_URI` (required)
- `MONGODB_DB` (optional, default `seia_site_planner`)
- `MONGODB_COLLECTION` (optional, default `sessions`)
- `PORT` (optional, default `3001`)

## Dev
From repo root:
- `npm --prefix server i`
- `npm --prefix server run dev`

## Endpoints
- `GET /api/catalog` — device definitions
- `POST /api/compute` — compute totals + layout from counts
- `GET /api/sessions` — list sessions
- `POST /api/sessions` — create session
- `GET /api/sessions/:id` — get session
- `PUT /api/sessions/:id` — update session
- `DELETE /api/sessions/:id` — delete session

## Notes
- In production, the server serves the built client from `client/dist`.
