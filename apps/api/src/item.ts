import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { router, protectedProcedure } from "./trpc";
import { prisma } from "./db";

// The inventory & daily check-in surface (PRD §7 Phase 2, epic broccoli-api-4gx):
//   list      — your current inventory: ACTIVE items on SAVED receipts.
//   resolve   — a check-in swipe: mark one item EATEN or TOSSED.
//   unresolve — undo a swipe: back to ACTIVE.
// The eaten/tossed outcomes are the raw data behind the waste metric (PRD §1).

// Flat output aliases keep the router's inferred types shallow for clients
// importing AppRouter (same TS2589 lesson as receipt.ts).
export type ItemWithReceipt = Prisma.ItemGetPayload<{
  include: { receipt: { select: { storeName: true; purchasedAt: true } } };
}>;

// list also carries the FoodKeeper shelf-life for the item's category — raw
// source data only (seconds, from the seeded catalog). The client derives any
// human-facing estimate from it; real expiration advice (storage location,
// user adjustments, LLM fallback) is Phase 3.
export type InventoryItem = ItemWithReceipt & {
  estimatedLifeSpanSeconds: number | null;
};

export const itemRouter = router({
  // Current inventory, newest purchases first. Receipt store/date ride along
  // so the inventory list and check-in deck can show where items came from.
  list: protectedProcedure.query(async ({ ctx }): Promise<InventoryItem[]> => {
    const items = await prisma.item.findMany({
      where: {
        userId: ctx.user.id,
        status: "ACTIVE",
        receipt: { status: "SAVED" },
      },
      include: { receipt: { select: { storeName: true, purchasedAt: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });

    // `category` holds the snapped ItemType name (no FK yet — Phase 3), so
    // look the lifespans up by name in one query and attach them.
    const names = [...new Set(items.map((i) => i.category).filter((c): c is string => !!c))];
    const types = names.length
      ? await prisma.itemType.findMany({
          where: { name: { in: names } },
          select: { name: true, suggestedLifeSpanSeconds: true },
        })
      : [];
    const lifespanByName = new Map(types.map((t) => [t.name, t.suggestedLifeSpanSeconds]));

    return items.map((item) => ({
      ...item,
      estimatedLifeSpanSeconds: item.category
        ? (lifespanByName.get(item.category) ?? null)
        : null,
    }));
  }),

  // One check-in swipe: eaten or tossed. Scoped to the caller; resolving an
  // already-resolved item just overwrites the outcome (harmless, and simpler
  // than erroring if the app retries).
  resolve: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        outcome: z.enum(["EATEN", "TOSSED"]),
      })
    )
    .mutation(async ({ ctx, input }): Promise<ItemWithReceipt> => {
      const { count } = await prisma.item.updateMany({
        where: { id: input.id, userId: ctx.user.id },
        data: { status: input.outcome, resolvedAt: new Date() },
      });
      if (count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return prisma.item.findFirstOrThrow({
        where: { id: input.id },
        include: { receipt: { select: { storeName: true, purchasedAt: true } } },
      });
    }),

  // Undo a swipe: the item rejoins the inventory.
  unresolve: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }): Promise<ItemWithReceipt> => {
      const { count } = await prisma.item.updateMany({
        where: { id: input.id, userId: ctx.user.id },
        data: { status: "ACTIVE", resolvedAt: null },
      });
      if (count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return prisma.item.findFirstOrThrow({
        where: { id: input.id },
        include: { receipt: { select: { storeName: true, purchasedAt: true } } },
      });
    }),
});
