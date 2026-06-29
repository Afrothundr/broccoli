import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { auth } from "./auth";

// Context is derived per request from the better-auth session (for the mobile
// app) and from a shared service token (for internal scheduler -> api calls).
export async function createContext({ req }: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({ headers: req.headers });
  const serviceToken = req.headers.get("x-service-token");
  const isInternal =
    !!process.env.INTERNAL_SERVICE_TOKEN &&
    serviceToken === process.env.INTERNAL_SERVICE_TOKEN;

  return { user: session?.user ?? null, isInternal };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Requires a signed-in app user.
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { user: ctx.user } });
});

// Requires the shared service token — this is the channel broccoli-scheduler
// uses to ask broccoli-api to perform writes (PRD §4). Keeps api the sole writer.
export const internalProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.isInternal) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next();
});
