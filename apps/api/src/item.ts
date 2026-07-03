import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { router, protectedProcedure } from "./trpc";
import { prisma } from "./db";

// The inventory & daily check-in surface (PRD §7 Phases 2–3):
//   list             — your current inventory: ACTIVE + EXPIRED items on SAVED
//                      receipts (expired food is still in the kitchen until
//                      the user resolves it).
//   resolve          — a check-in swipe: mark one item EATEN or TOSSED.
//   unresolve        — undo a swipe: back to ACTIVE.
//   adjustExpiration — the user corrects an item's date; source becomes USER.
// The eaten/tossed outcomes are the raw data behind the waste metric (PRD §1).

// Flat output aliases keep the router's inferred types shallow for clients
// importing AppRouter (same TS2589 lesson as receipt.ts).
export type ItemWithReceipt = Prisma.ItemGetPayload<{
  include: { receipt: { select: { storeName: true; purchasedAt: true } } };
}>;

// Since Phase 3, items carry expiresAt/expirationSource directly. The legacy
// `estimatedLifeSpanSeconds` join stays for items saved before Phase 3 (they
// have no expiresAt; the app falls back to its client-side estimate). Drop it
// once pre-Phase-3 inventories have churned through.
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
        status: { in: ["ACTIVE", "EXPIRED"] },
        receipt: { status: "SAVED" },
      },
      include: { receipt: { select: { storeName: true, purchasedAt: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });

    // Legacy estimate for pre-Phase-3 items (see InventoryItem note): look the
    // catalog lifespans up by category name and attach them.
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

  // Undo a swipe: the item rejoins the inventory. (If it was past its date,
  // the next scheduler sweep will mark it EXPIRED again — that's correct.)
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

  // The user says where an item actually lives ("I froze that chicken").
  // Import stays silent about location — this is the correction path from
  // item detail. Recomputes expiresAt for the new location's shelf life
  // (an explicit location change supersedes even a USER-set date: the user
  // is asking what the estimate is *there*). If FoodKeeper has no timeframe
  // for that location, the location updates and the date stays put.
  setStorageLocation: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        storageLocation: z.enum(["PANTRY", "FRIDGE", "FREEZER"]),
      })
    )
    .mutation(async ({ ctx, input }): Promise<ItemWithReceipt> => {
      const item = await prisma.item.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        include: {
          itemType: {
            select: { pantrySeconds: true, fridgeSeconds: true, freezerSeconds: true },
          },
          receipt: { select: { purchasedAt: true } },
        },
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });

      const seconds = item.itemType
        ? {
            PANTRY: item.itemType.pantrySeconds,
            FRIDGE: item.itemType.fridgeSeconds,
            FREEZER: item.itemType.freezerSeconds,
          }[input.storageLocation]
        : null;
      const basis = item.receipt.purchasedAt ?? item.createdAt;
      const expiresAt =
        seconds != null ? new Date(basis.getTime() + seconds * 1000) : null;

      await prisma.item.update({
        where: { id: item.id },
        data: {
          storageLocation: input.storageLocation,
          ...(expiresAt
            ? { expiresAt, expirationSource: "FOODKEEPER" as const }
            : {}),
          ...(expiresAt && expiresAt > new Date() && item.status === "EXPIRED"
            ? { status: "ACTIVE" as const }
            : {}),
        },
      });
      return prisma.item.findFirstOrThrow({
        where: { id: item.id },
        include: { receipt: { select: { storeName: true, purchasedAt: true } } },
      });
    }),

  // The user corrects an item's expiration date ("this yogurt is fine until
  // Friday"). USER-sourced dates are authoritative — nothing recomputes over
  // them. A future date also un-expires an EXPIRED item (but never resurrects
  // an eaten/tossed one).
  adjustExpiration: protectedProcedure
    .input(z.object({ id: z.string(), expiresAt: z.coerce.date() }))
    .mutation(async ({ ctx, input }): Promise<ItemWithReceipt> => {
      const { count } = await prisma.item.updateMany({
        where: { id: input.id, userId: ctx.user.id },
        data: { expiresAt: input.expiresAt, expirationSource: "USER" },
      });
      if (count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      if (input.expiresAt > new Date()) {
        await prisma.item.updateMany({
          where: { id: input.id, userId: ctx.user.id, status: "EXPIRED" },
          data: { status: "ACTIVE" },
        });
      }
      return prisma.item.findFirstOrThrow({
        where: { id: input.id },
        include: { receipt: { select: { storeName: true, purchasedAt: true } } },
      });
    }),
});
