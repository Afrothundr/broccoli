import {
  router,
  publicProcedure,
  protectedProcedure,
  internalProcedure,
} from "./trpc";
import { receiptRouter } from "./receipt";
import { itemRouter } from "./item";

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
  // service token. Phase 3+ adds the real writes here (e.g. item status
  // transitions). For now just a reachability check.
  internal: router({
    ping: internalProcedure.query(() => ({ ok: true as const })),
  }),
});

export type AppRouter = typeof appRouter;
