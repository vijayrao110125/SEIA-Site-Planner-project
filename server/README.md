# Server (Express + MongoDB)

API for:
- computing totals + layouts from device counts
- user authentication
- storing user‑scoped sessions in MongoDB

## Env Vars
You can provide these via a `.env` file or environment settings.
- `MONGODB_URI` (required)
- `MONGODB_DB` (optional, default `seia_site_planner`)
- `MONGODB_COLLECTION` (optional, default `sessions`)
- `MONGODB_USERS_COLLECTION` (optional, default `users`)
- `AUTH_TOKEN_KEY` (recommended; required in production)
- `PORT` (optional, default `3001`)

## Dev
From repo root:
- `npm --prefix server i`
- `npm --prefix server run dev`

## Authentication
- `POST /api/auth/register` requires `name`, `email`, `password` and returns:
  - `token` (stored client‑side in `localStorage` as `seia:token`)
  - `user` (`{ id, name, email }`)
- `POST /api/auth/login` requires `email`, `password` and returns:
  - `token` (stored client‑side in `localStorage` as `seia:token`)
  - `user` (`{ id, name, email }`)
- Requests that require auth must include:
  - `Authorization: Bearer <token>`
- `GET /api/auth/me` verifies the token and returns the current user.

Implementation notes:
- Passwords are hashed using `crypto.scrypt` with a random salt.
- The token is an HMAC‑signed payload with an expiry (7 days) using `AUTH_TOKEN_KEY`.

## Endpoints
- `GET /api/health` — simple health check
- `GET /api/catalog` — device definitions
- `POST /api/compute` — compute totals + layout from counts
- `POST /api/auth/register` — create account (name + email + password)
- `POST /api/auth/login` — login (email + password)
- `GET /api/auth/me` — get current user (requires auth)
- `GET /api/sessions` — list sessions (requires auth)
- `POST /api/sessions` — create session (requires auth)
- `GET /api/sessions/:id` — get session (requires auth)
- `PUT /api/sessions/:id` — update session (requires auth)
- `DELETE /api/sessions/:id` — delete session (requires auth)

## Data model
- `users` collection:
  - `id` (string), `email`, `emailNormalized` (unique), `passwordHash`, timestamps
- `sessions` collection:
  - `id` (string), `userId` (string), `name`, `nameNormalized` (unique per user), `payload`, timestamps
- `payload` stores the full compute result (`counts`, `totals`, `layout`) so loading a session is instant.

## Notes
- In production, the server serves the built client from `client/dist`.
