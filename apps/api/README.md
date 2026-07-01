# broccoli-api

The mobile-facing API, auth, and data layer for Broccoli.

- **Owns** the Prisma/Postgres schema and **all migrations** (PRD §4). It is the
  single writer of record.
- **Serves** the React Native app (`broccoli-mobile`) one clean, versioned
  surface via **tRPC**, plus **better-auth** under `/api/auth/*`.
- **Calls** `broccoli-model` for receipt parsing (Phase 1+).
- **Is called by** `broccoli-scheduler` over tRPC `internal.*` procedures
  (token-gated) so the scheduler never writes the DB directly.

## Stack
Node/TypeScript · Hono · tRPC · Prisma (Postgres) · better-auth · runs with `tsx`

## Run locally
```bash
cp .env.example .env        # then fill in DATABASE_URL + secrets
npm install
npm run db:migrate          # creates the schema in your Postgres
npm run db:seed             # loads the ItemType catalog (FoodKeeper)
npm run dev                 # http://localhost:3000/health
```
`db:seed` is **required** for receipt parsing: `receipt.create` hands the
`ItemType` catalog to `broccoli-model` so it can categorize line items. An
empty catalog makes every item come back `Unknown`. The seed is idempotent —
re-run it any time. (Prisma only auto-seeds on `migrate dev`/`migrate reset`,
not on `migrate deploy`, so it's a separate step.)

## Endpoints
- `GET /health` — liveness
- `GET|POST /api/auth/*` — better-auth
- `ALL /api/uploadthing` — UploadThing receipt uploads: image or PDF, ≤16MB
  (auth-gated; returns `{ url, key }` for `receipt.create`)
- `ALL /trpc/*` — tRPC (`health`, `me`, `internal.ping`)

## Deploy (Railway)
Railway auto-detects Node. Set `DATABASE_URL`, `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL`, `INTERNAL_SERVICE_TOKEN`, and `UPLOADTHING_TOKEN`. Start
command: `npm start`.
Migrations + seed run automatically on release via `railway.json`'s start
command (`prisma migrate deploy && prisma db seed && start`) — `migrate deploy`
never seeds on its own, so the seed is chained explicitly.

## Issues
Tracked with [beads](https://github.com/steveyegge/beads) in `.beads/`. Run
`bd list` to see open work.
