import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { router, protectedProcedure } from "./trpc";
import { prisma } from "./db";
import { requestOcr, type OcrData } from "./model";

// What get/confirm hand back to the app. Annotating the resolvers with this
// flat alias keeps the router's inferred output shallow — without it, clients
// importing AppRouter re-derive Prisma's conditional types and hit TS2589.
export type ReceiptWithItems = Prisma.ReceiptGetPayload<{
  include: { items: true };
}>;

// The capture → extract → review loop (PRD §4, epic broccoli-api-2r8):
//   1. create  — app hands us the uploaded image; we persist a PROCESSING
//                Receipt and kick off parsing in the background.
//   2. get     — app polls until status flips to READY (or ERROR).
//   3. confirm — user reviews/edits the parsed items and saves; status SAVED.

// "$12.98" / "$1,234.56" / "1.19 LB" -> 12.98 / 1234.56 / 1.19. Strips currency
// symbols, thousands separators, and trailing letters (units, tax flags) that
// OCR leaves on the price. Returns null when there's no parseable number.
function parsePrice(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const match = raw.replace(/,/g, "").match(/\d+(\.\d+)?/);
  if (!match) return null;
  const value = Number.parseFloat(match[0]);
  return Number.isFinite(value) ? value : null;
}

// Receipt dates arrive as freeform OCR strings ("06/12/2026", "June 12 2026",
// or garbage). Parse best-effort; a bad string just leaves purchasedAt null.
function parseDate(raw: string | undefined | null): Date | null {
  if (!raw) return null;
  const ts = Date.parse(raw);
  return Number.isNaN(ts) ? null : new Date(ts);
}

// Runs in the background after `receipt.create` returns. Calls broccoli-model,
// then writes the parsed items + receipt metadata and flips status to READY.
// Any failure (model down, bad image) lands the Receipt in ERROR so the app can
// surface a retry rather than polling forever.
async function parseReceipt(receiptId: string, userId: string, imageUrl: string) {
  try {
    const data: OcrData = await requestOcr(imageUrl);
    const items = (data.items ?? []).map((item) => ({
      receiptId,
      userId,
      name: item.name,
      price: parsePrice(item.price),
      // The model already snaps `category` to an ItemType name (or "Unknown").
      // The explicit ItemType relation arrives in Phase 3; for now we store the
      // snapped name as a string, treating "Unknown"/blank as no category.
      category: item.category && item.category !== "Unknown" ? item.category : null,
    }));

    // No line-item total comes back from the model, so approximate spend by
    // summing parsed line prices (PRD §4). Null when nothing parsed.
    const priced = items.map((i) => i.price).filter((p): p is number => p !== null);
    const total = priced.length ? priced.reduce((a, b) => a + b, 0) : null;

    // Single transaction so the receipt never shows READY without its items.
    await prisma.$transaction([
      ...(items.length ? [prisma.item.createMany({ data: items })] : []),
      prisma.receipt.update({
        where: { id: receiptId },
        data: {
          status: "READY",
          storeName: data.store ?? null,
          purchasedAt: parseDate(data.date),
          total,
          rawExtraction: data as object,
        },
      }),
    ]);
  } catch (err) {
    console.error(`parseReceipt failed for ${receiptId}:`, err);
    await prisma.receipt
      .update({ where: { id: receiptId }, data: { status: "ERROR" } })
      .catch(() => {}); // receipt may have been deleted; nothing more to do.
  }
}

// One item as submitted by the app on confirm. `id` is optional — present for
// items the parser produced, absent for ones the user added by hand.
const confirmItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  price: z.number().nonnegative().nullish(),
  quantity: z.number().int().positive().default(1),
  unit: z.string().default(""),
  category: z.string().nullish(),
});

export const receiptRouter = router({
  // Persist the uploaded receipt as PROCESSING and start parsing in the
  // background. Returns immediately with the id the app polls on.
  create: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        imageKey: z.string().optional(), // UploadThing key, for later deletion
      })
    )
    .mutation(async ({ ctx, input }) => {
      const receipt = await prisma.receipt.create({
        data: {
          userId: ctx.user.id,
          imageUrl: input.imageUrl,
          imageKey: input.imageKey ?? null,
          status: "PROCESSING",
        },
      });

      // Fire-and-forget: don't block the response on the model. parseReceipt
      // handles its own errors, so this can't reject unhandled.
      void parseReceipt(receipt.id, ctx.user.id, input.imageUrl);

      return { receiptId: receipt.id };
    }),

  // Poll a receipt's status + items. Scoped to the caller so one user can't
  // read another's receipts.
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<ReceiptWithItems> => {
      const receipt = await prisma.receipt.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        include: { items: { orderBy: { createdAt: "asc" } } },
      });
      if (!receipt) throw new TRPCError({ code: "NOT_FOUND" });
      return receipt;
    }),

  // Save the user-corrected item list and mark the receipt SAVED. We replace
  // the whole item set (delete + recreate) so adds, edits, and removals are all
  // handled uniformly — simplest correct approach for an edited list.
  confirm: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        storeName: z.string().nullish(),
        purchasedAt: z.coerce.date().nullish(),
        total: z.number().nonnegative().nullish(),
        items: z.array(confirmItemSchema),
      })
    )
    .mutation(async ({ ctx, input }): Promise<ReceiptWithItems> => {
      const existing = await prisma.receipt.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        select: { id: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      await prisma.$transaction([
        prisma.item.deleteMany({ where: { receiptId: input.id } }),
        ...(input.items.length
          ? [
              prisma.item.createMany({
                data: input.items.map((item) => ({
                  receiptId: input.id,
                  userId: ctx.user.id,
                  name: item.name,
                  price: item.price ?? null,
                  quantity: item.quantity,
                  unit: item.unit,
                  category: item.category ?? null,
                })),
              }),
            ]
          : []),
        prisma.receipt.update({
          where: { id: input.id },
          data: {
            status: "SAVED",
            storeName: input.storeName ?? undefined,
            purchasedAt: input.purchasedAt ?? undefined,
            total: input.total ?? undefined,
          },
        }),
      ]);

      return prisma.receipt.findFirstOrThrow({
        where: { id: input.id },
        include: { items: { orderBy: { createdAt: "asc" } } },
      });
    }),
});
