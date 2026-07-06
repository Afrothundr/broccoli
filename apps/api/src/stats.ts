import { router, protectedProcedure } from "./trpc";
import { prisma } from "./db";

// The spend & waste dashboard (PRD §7 Phase 5). One query returns everything
// the home screen needs. The waste rate is the north-star metric (PRD §1):
// value of tossed + silently-expired items over the value of everything
// bought — the check-in's eaten/tossed swipes are what make it honest.
//
// Waste attribution: TOSSED items count at resolvedAt; EXPIRED items that
// the user hasn't resolved yet count as waste at expiresAt (they stop
// counting the moment a check-in swipe says "actually, eaten").

export type WeeklyStat = {
  weekStart: string; // ISO date (Monday) of the week bucket
  spend: number;
  wasted: number;
};

export type StatsOverview = {
  totalSpend: number; // sum of saved receipt totals
  receiptCount: number;
  averageReceipt: number;
  eatenValue: number;
  wastedValue: number; // tossed + still-expired
  activeValue: number; // still in the kitchen (incl. expired, pre-resolution)
  wasteRatePct: number | null; // by value; null until there's any priced data
  wasteCountPct: number | null; // by item count
  counts: { eaten: number; tossed: number; expired: number; active: number };
  weekly: WeeklyStat[]; // oldest → newest, last 8 weeks
};

const WEEKS = 8;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Monday 00:00 UTC of the week containing `at`. Buckets are UTC — fine for a
// trend chart; per-user timezone bucketing can come with real usage.
function weekStart(at: Date): string {
  const day = (at.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  const monday = new Date(at.getTime() - day * 24 * 60 * 60 * 1000);
  return monday.toISOString().slice(0, 10);
}

export const statsRouter = router({
  overview: protectedProcedure.query(async ({ ctx }): Promise<StatsOverview> => {
    const [receipts, items] = await Promise.all([
      prisma.receipt.findMany({
        where: { userId: ctx.user.id, status: "SAVED" },
        select: { total: true, purchasedAt: true, createdAt: true },
      }),
      prisma.item.findMany({
        where: { userId: ctx.user.id, receipt: { status: "SAVED" } },
        select: {
          price: true,
          status: true,
          resolvedAt: true,
          expiresAt: true,
          createdAt: true,
        },
      }),
    ]);

    const totalSpend = receipts.reduce((sum, r) => sum + (r.total ?? 0), 0);

    const value = (statuses: string[]) =>
      items
        .filter((i) => statuses.includes(i.status))
        .reduce((sum, i) => sum + (i.price ?? 0), 0);
    const count = (status: string) => items.filter((i) => i.status === status).length;

    const eatenValue = value(["EATEN"]);
    const wastedValue = value(["TOSSED", "EXPIRED"]);
    const activeValue = value(["ACTIVE", "EXPIRED"]);
    const totalItemValue = items.reduce((sum, i) => sum + (i.price ?? 0), 0);
    const totalItems = items.length;
    const wastedCount = count("TOSSED") + count("EXPIRED");

    // Weekly buckets: spend lands on the receipt's purchase week; waste on
    // the week the item was tossed (or crossed its date, if never resolved).
    const cutoff = weekStart(new Date(Date.now() - (WEEKS - 1) * WEEK_MS));
    const weekly = new Map<string, WeeklyStat>();
    for (let i = 0; i < WEEKS; i++) {
      const key = weekStart(new Date(Date.now() - (WEEKS - 1 - i) * WEEK_MS));
      weekly.set(key, { weekStart: key, spend: 0, wasted: 0 });
    }
    for (const receipt of receipts) {
      const key = weekStart(receipt.purchasedAt ?? receipt.createdAt);
      const bucket = weekly.get(key);
      if (bucket && key >= cutoff) bucket.spend += receipt.total ?? 0;
    }
    for (const item of items) {
      const wastedAt =
        item.status === "TOSSED"
          ? (item.resolvedAt ?? item.createdAt)
          : item.status === "EXPIRED"
            ? (item.expiresAt ?? item.createdAt)
            : null;
      if (!wastedAt) continue;
      const key = weekStart(wastedAt);
      const bucket = weekly.get(key);
      if (bucket && key >= cutoff) bucket.wasted += item.price ?? 0;
    }

    return {
      totalSpend,
      receiptCount: receipts.length,
      averageReceipt: receipts.length ? totalSpend / receipts.length : 0,
      eatenValue,
      wastedValue,
      activeValue,
      wasteRatePct: totalItemValue > 0 ? (wastedValue / totalItemValue) * 100 : null,
      wasteCountPct: totalItems > 0 ? (wastedCount / totalItems) * 100 : null,
      counts: {
        eaten: count("EATEN"),
        tossed: count("TOSSED"),
        expired: count("EXPIRED"),
        active: count("ACTIVE"),
      },
      weekly: [...weekly.values()],
    };
  }),
});
