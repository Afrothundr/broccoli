import {
  router,
  publicProcedure,
  protectedProcedure,
  internalProcedure,
} from "./trpc";
import { receiptRouter } from "./receipt";
import { itemRouter } from "./item";
import { prisma } from "./db";

export const appRouter = router({
  // Liveness check for the app and for Railway.
  health: publicProcedure.query(() => ({
    status: "ok" as const,
    service: "broccoli-api",
  })),

  // Returns the current signed-in user.
  me: protectedProcedure.query(({ ctx }) => ctx.user),

  // Capture → extract → review loop: create a receipt, poll it, confirm items.
  receipt: receiptRouter,

  // Inventory & daily check-in: list current items, swipe eaten/tossed, undo.
  item: itemRouter,

  // Internal namespace — called by broccoli-scheduler over tRPC with the
  // service token, so broccoli-api stays the single DB writer (PRD §4).
  internal: router({
    ping: internalProcedure.query(() => ({ ok: true as const })),

    // Scheduler sweep: flip ACTIVE items past their date to EXPIRED. The user
    // still resolves them (eaten/tossed) — expiry is a state, not an outcome,
    // so resolvedAt stays null. Idempotent; returns how many flipped.
    expireItems: internalProcedure.mutation(async () => {
      const { count } = await prisma.item.updateMany({
        where: { status: "ACTIVE", expiresAt: { lt: new Date() } },
        data: { status: "EXPIRED" },
      });
      return { expired: count };
    }),
  }),
});

export type AppRouter = typeof appRouter;
