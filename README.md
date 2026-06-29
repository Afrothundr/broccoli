# Broccoli

A mobile app that helps households stop wasting food (and money). Snap a grocery
receipt → tracked inventory → expiration advice → a daily swipe check-in. See
`PRD.md` in the planning workspace for the full product spec.

## Monorepo layout

| Path | Package | What it is |
|------|---------|------------|
| `apps/api` | `broccoli-api` | Node/TS API + auth + data layer (Hono · tRPC · Prisma · better-auth). Owns the schema + migrations. |
| `apps/mobile` | `broccoli-mobile` | React Native + Expo app. |

`broccoli-scheduler` (background jobs) can join later as `apps/scheduler`.

## Type sharing
The mobile app imports the tRPC router **type** directly from the api package:

```ts
import type { AppRouter } from "broccoli-api/router";
```

No publish step, no codegen — the workspace *is* the contract. Note: separate
repos still deploy as **separate Railway services**; the monorepo is about code,
not runtime.

## Setup
```bash
pnpm install            # installs all workspaces (node-linker=hoisted for Expo/Prisma)
pnpm typecheck          # typecheck every app via Turbo
pnpm dev:api            # run the API
pnpm dev:mobile         # run the Expo app
```

## Issues
Tracked with [beads](https://github.com/steveyegge/beads), per app:
`bd -C apps/api ready` · `bd -C apps/mobile ready`.
