import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./trpc";
import { auth } from "./auth";
import { uploadthingHandlers } from "./uploadthing";

const app = new Hono();

// Plain HTTP health check (Railway + uptime probes).
app.get("/health", (c) => c.json({ status: "ok", service: "broccoli-api" }));

// better-auth owns all /api/auth/* routes (sign-up, sign-in, session, etc.).
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// UploadThing — the app uploads receipt files (photo or PDF) here (auth-gated
// in the FileRouter middleware) and gets back a fetchable url + key.
app.all("/api/uploadthing", (c) => uploadthingHandlers(c.req.raw));

// tRPC — the typed surface the mobile app and the scheduler call.
app.all("/trpc/*", (c) =>
  fetchRequestHandler({
    endpoint: "/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  })
);

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`broccoli-api listening on :${info.port}`);
});
