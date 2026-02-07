# Server (Express + MongoDB)

API for:
- computing totals + layouts from device counts
- user authentication
- storing user‑scoped sessions in MongoDB

## Project structure
- `server/index.ts` — server entrypoint (creates app + starts listening)
- `server/createApp.ts` — Express app factory (mounts routers under `/api`)
- `server/config.ts` — runtime config (`PORT`, token TTL, `AUTH_TOKEN_KEY`, compute constants)
- `server/env.ts` — loads environment from `server/.env` (and process env)
- `server/routes/` — API route handlers (`auth`, `sessions`, `compute`, `catalog`, `health`)
- `server/middleware/` — Express middleware (`requireAuth`)
- `server/services/` — domain logic (`computeAll` for totals + layout)
- `server/auth/` — password hashing + token helpers
- `server/db.ts` — DB façade (currently re-exports Mongo implementation)
- `server/db-mongo.ts` — MongoDB implementation (collections + indexes + CRUD)
- `server/catalog.ts` — device catalog definitions

## Env Vars
You can provide these via a `.env` file or environment settings.
- `MONGODB_URI` (required)
- `MONGODB_DB` (optional, default `seia_site_planner`)
- `MONGODB_COLLECTION` (optional, default `sessions`)
- `MONGODB_USERS_COLLECTION` (optional, default `users`)
- `AUTH_TOKEN_KEY` (recommended; required in production)
- `PORT` (optional, default `3001`)
- `HOST` (optional; defaults to `127.0.0.1` in dev and `0.0.0.0` in production)

## Dev
From repo root:
- `npm --prefix server i`
- `npm --prefix server run dev`

## Deployment (Render)
Typical settings:
- Build command: `npm --prefix server i && npm --prefix server run build`
- Start command: `npm --prefix server start`
- Env vars:
  - `MONGODB_URI`
  - `AUTH_TOKEN_KEY` (required in production)

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
- The token is an HMAC‑signed payload with an expiry (7 days) using `AUTH_TOKEN_KEY` (see `server/config.ts`).

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

## Where things live
- Auth routes: `server/routes/auth.ts`
- Session routes: `server/routes/sessions.ts`
- Compute routes: `server/routes/compute.ts`
- Auth middleware: `server/middleware/requireAuth.ts`
- Token signing/verification: `server/auth/tokens.ts`
- Password hashing: `server/auth/passwords.ts`
- Layout + totals logic: `server/services/compute.ts`

## Data model
- `users` collection:
  - `id` (string), `email`, `emailNormalized` (unique), `passwordHash`, timestamps
- `sessions` collection:
  - `id` (string), `userId` (string), `name`, `nameNormalized` (unique per user), `payload`, timestamps
- `payload` stores the full compute result (`counts`, `totals`, `layout`) so loading a session is instant.

## Notes
- `AUTH_TOKEN_KEY` in production should be a long, random secret string (rotating it invalidates existing tokens).
