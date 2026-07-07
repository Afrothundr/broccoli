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

// Error responses cross the trust boundary: no stack traces on the wire (they
// belong in server logs — see onError in index.ts), and unexpected errors get
// a generic message so Prisma/driver details never reach the client. Expected
// errors (UNAUTHORIZED, BAD_REQUEST, zod issues) keep their message — the app
// relies on those.
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    const { stack: _stack, ...data } = shape.data;
    const message =
      error.code === "INTERNAL_SERVER_ERROR" ? "Internal server error" : shape.message;
    return { ...shape, message, data };
  },
});

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
