import { router, protectedProcedure } from "./trpc";
import { prisma } from "./db";

// Storage advice for the home screen's stat area (beta feedback 2026-09-04):
// the savings hero already explains the 1/3-of-groceries baseline; this adds
// actionable "keep it fresh" advice grounded in what the user actually has —
// items in their kitchen, and categories they recently threw away.
//
// Two layers, mirroring shelf-life-llm.ts's philosophy:
// 1. Backfill (always): the FoodKeeper catalog already carries a
//    storageAdvice string per ItemType, so the top of the user's kitchen maps
//    to real advice with zero model dependency. This is the floor — it works
//    with no AI_KEY, on day one, for every user.
// 2. LLM enrichment (optional): when AI_KEY is set, Gemini rewrites the tips
//    into short, personalized copy that names the user's actual items. Cached
//    in memory (single api instance) keyed by kitchen signature with a TTL —
//    the kitchen changes slowly, so repeat opens cost nothing. Any failure
//    falls back to the backfill tips; advice never blocks or errors.

export type StorageTip = {
  title: string; // short headline — item or category name
  detail: string; // one sentence of advice
  tag: string | null; // "kitchen" or "waste" — why the user is seeing this
};

const TOSSED_LOOKBACK_DAYS = 21;
const MAX_TIPS = 4;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const cache = new Map<string, { tips: StorageTip[]; at: number }>();
const cacheGet = (key: string): StorageTip[] | null => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.tips;
};

const MODEL = "gemini-2.5-flash";

const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      title: {
        type: "STRING",
        description: "Short headline naming the item or topic, max 6 words",
      },
      detail: {
        type: "STRING",
        description: "One practical storage or use-it-up sentence, max 140 chars",
      },
      tag: { type: "STRING", enum: ["kitchen", "waste"] },
    },
    required: ["title", "detail", "tag"],
  },
} as const;

async function requestTips(
  kitchenNames: string[],
  tossedNames: string[]
): Promise<StorageTip[] | null> {
  const key = process.env.AI_KEY;
  if (!key) return null;

  const lines = [
    `In the kitchen right now: ${kitchenNames.slice(0, 25).join(", ") || "nothing tracked"}`,
    tossedNames.length
      ? `Recently thrown away: ${tossedNames.slice(0, 15).join(", ")}`
      : "Nothing thrown away recently.",
  ].join("\n");

  const prompt = `You write short storage tips for a grocery app that cuts food waste. Using the user's actual items below, give 2-${MAX_TIPS} tips: how to store or use up what they have, and — if relevant — how to stop repeating a recent toss. Be specific and practical. Reply in the structured format.\n\n${lines}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(12_000),
    }
  );
  if (!res.ok) throw new Error(`Gemini request failed: ${res.status}`);

  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");

  const parsed = JSON.parse(text) as StorageTip[];
  return parsed
    .filter((t) => t.title && t.detail && (t.tag === "kitchen" || t.tag === "waste"))
    .slice(0, MAX_TIPS);
}

// Deterministic floor: top kitchen item types by count → their FoodKeeper
// advice, plus one "keeps ending up in the trash" tip for the most frequent
// recent toss that isn't already covered.
async function backfillTips(userId: string): Promise<StorageTip[]> {
  const since = new Date(Date.now() - TOSSED_LOOKBACK_DAYS * 86_400_000);
  const [kitchen, tossed] = await Promise.all([
    prisma.item.findMany({
      where: { userId, status: "ACTIVE", receipt: { status: "SAVED" } },
      select: { itemType: { select: { name: true, category: true, storageAdvice: true } } },
    }),
    prisma.item.findMany({
      where: {
        userId,
        status: "TOSSED",
        resolvedAt: { gte: since },
        receipt: { status: "SAVED" },
      },
      select: { itemType: { select: { name: true, category: true, storageAdvice: true } } },
    }),
  ]);

  const countByType = <T extends { name: string; storageAdvice: string }>(rows: T[]) => {
    const counts = new Map<string, { count: number; row: T }>();
    for (const row of rows) {
      if (!row.storageAdvice) continue;
      const entry = counts.get(row.name) ?? { count: 0, row };
      entry.count++;
      counts.set(row.name, entry);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  };

  const kitchenTypes = countByType(
    kitchen.map((i) => i.itemType).filter((t): t is NonNullable<typeof t> => t !== null)
  );
  const tips: StorageTip[] = kitchenTypes.slice(0, MAX_TIPS - 1).map(({ row }) => ({
    title: row.name,
    detail: row.storageAdvice,
    tag: "kitchen",
  }));

  const usedNames = new Set(tips.map((t) => t.title));
  const tossedType = countByType(
    tossed.map((i) => i.itemType).filter((t): t is NonNullable<typeof t> => t !== null)
  ).find(({ row }) => !usedNames.has(row.name));
  if (tossedType) {
    tips.push({
      title: tossedType.row.name,
      detail: tossedType.row.storageAdvice,
      tag: "waste",
    });
  }

  return tips.slice(0, MAX_TIPS);
}

export const adviceRouter = router({
  storage: protectedProcedure.query(async ({ ctx }): Promise<{ tips: StorageTip[] }> => {
    // Signature of what's in the kitchen + recently tossed: the LLM cache key,
    // so a shopping trip or a toss invalidates advice naturally.
    const since = new Date(Date.now() - TOSSED_LOOKBACK_DAYS * 86_400_000);
    const [kitchenNames, tossedNames] = await Promise.all([
      prisma.item.findMany({
        where: { userId: ctx.user.id, status: "ACTIVE", receipt: { status: "SAVED" } },
        select: { name: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.item.findMany({
        where: {
          userId: ctx.user.id,
          status: "TOSSED",
          resolvedAt: { gte: since },
          receipt: { status: "SAVED" },
        },
        select: { name: true },
      }),
    ]);

    const signature = `${kitchenNames.length}:${[...kitchenNames, ...tossedNames]
      .map((i) => i.name.toLowerCase())
      .sort()
      .join("|")}`;
    const cacheKey = `${ctx.user.id}:${signature}`;

    const cached = cacheGet(cacheKey);
    if (cached) return { tips: cached };

    // Kitchen-empty users get nothing — the advice is only credible when it
    // names their actual items.
    if (kitchenNames.length === 0) return { tips: [] };

    const fallback = await backfillTips(ctx.user.id);
    if (fallback.length === 0) return { tips: [] };

    if (process.env.AI_KEY) {
      try {
        const tips = await requestTips(
          kitchenNames.map((i) => i.name),
          tossedNames.map((i) => i.name)
        );
        if (tips && tips.length > 0) {
          cache.set(cacheKey, { tips, at: Date.now() });
          return { tips };
        }
      } catch (err) {
        console.warn("storage-advice LLM enrichment failed, using backfill:", err);
      }
    }

    cache.set(cacheKey, { tips: fallback, at: Date.now() });
    return { tips: fallback };
  }),
});
